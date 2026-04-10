package com.smartcampus.service;

import com.smartcampus.dto.request.ForgotPasswordRequest;
import com.smartcampus.dto.request.LoginRequest;
import com.smartcampus.dto.request.RegisterRequest;
import com.smartcampus.dto.request.ResetPasswordRequest;
import com.smartcampus.entity.PasswordResetToken;
import com.smartcampus.repository.PasswordResetTokenRepository;
import com.smartcampus.dto.response.AuthResponse;
import com.smartcampus.dto.response.LoginHistoryResponse;
import com.smartcampus.dto.response.SessionResponse;
import com.smartcampus.dto.response.UserResponse;
import com.smartcampus.entity.RefreshToken;
import com.smartcampus.entity.User;
import com.smartcampus.enums.LoginStatus;
import com.smartcampus.enums.UserRole;
import com.smartcampus.exception.ConflictException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.repository.RefreshTokenRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Core authentication service for the Smart Campus Operations Hub.
 *
 * <p>Implements the complete authentication lifecycle:
 * <ul>
 *   <li><b>Registration</b>  — creates a new user account, hashes the password,
 *       issues an initial JWT pair.</li>
 *   <li><b>Login</b>         — delegates credential verification to Spring Security's
 *       {@link AuthenticationManager}, then issues a JWT pair.</li>
 *   <li><b>Token refresh</b> — validates the incoming refresh token, revokes it
 *       (token rotation), and issues a new JWT pair.</li>
 *   <li><b>Logout</b>        — revokes all refresh tokens for the authenticated user,
 *       immediately invalidating all active sessions across all devices.</li>
 *   <li><b>Current user</b>  — resolves the authenticated principal from the
 *       {@link SecurityContextHolder} and returns the user profile.</li>
 * </ul>
 *
 * <p>All write operations are wrapped in {@link Transactional} to ensure database
 * consistency — token storage and user creation are committed atomically.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     JwtService
 * @see     RefreshTokenRepository
 * @see     com.smartcampus.controller.AuthController
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository                userRepository;
    private final RefreshTokenRepository        refreshTokenRepository;
    private final PasswordResetTokenRepository  passwordResetTokenRepository;
    private final PasswordEncoder               passwordEncoder;
    private final JwtService                    jwtService;
    private final AuthenticationManager         authenticationManager;
    private final LoginHistoryService           loginHistoryService;
    private final EmailService                  emailService;

    /**
     * Refresh token lifetime in milliseconds, injected from
     * {@code app.jwt.refresh-token-expiration-ms}. Used to compute the
     * {@code expiresAt} timestamp stored in the {@code refresh_tokens} table.
     */
    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    // =========================================================================
    // Register
    // =========================================================================

    /**
     * Registers a new user account and returns an authentication response.
     *
     * <p>Steps:
     * <ol>
     *   <li>Check that the email is not already registered — if it is, throw
     *       {@link ConflictException} with a clear message.</li>
     *   <li>Hash the plain-text password with BCrypt.</li>
     *   <li>Persist the new {@link User} entity with the default {@link UserRole#USER} role.</li>
     *   <li>Generate an access token and refresh token pair.</li>
     *   <li>Persist the refresh token in the {@code refresh_tokens} table.</li>
     *   <li>Return an {@link AuthResponse} with both tokens and the user profile.</li>
     * </ol>
     *
     * @param request the validated registration payload
     * @return a fully populated {@link AuthResponse} ready to be returned to the client
     * @throws ConflictException if the email address is already in use
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering new user with email: {}", request.getEmail());

        // Step 1: Check for duplicate email before attempting insertion.
        // This provides a cleaner error message than catching DataIntegrityViolationException.
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException(
                    "An account with email '" + request.getEmail() + "' already exists."
            );
        }

        // Step 2 & 3: Build and persist the user entity
        User user = User.builder()
                .name(request.getFullName())                         // DTO "fullName" → entity "name"
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.USER)                                 // all self-registered accounts start as USER
                .isActive(Boolean.TRUE)
                .build();
        user = userRepository.save(user);

        log.debug("User saved with id: {}", user.getId());

        // Steps 4–6: generate tokens and build the response
        return buildAuthResponse(user, null, null);
    }

    // =========================================================================
    // Login
    // =========================================================================

    /**
     * Authenticates a user with their email and password credentials.
     *
     * <p>Spring Security's {@link AuthenticationManager} handles the heavy lifting:
     * it loads the user via {@link com.smartcampus.security.UserDetailsServiceImpl},
     * verifies the password with BCrypt, and checks account status (enabled/locked).
     * If authentication fails it throws an {@link org.springframework.security.core.AuthenticationException}
     * which propagates to the {@link com.smartcampus.exception.GlobalExceptionHandler}.
     *
     * <p>Existing refresh tokens for the user are revoked on each login to enforce
     * a single active session per login event. This prevents token accumulation if
     * a user logs in repeatedly without logging out.
     *
     * @param request the validated login credentials
     * @return a fully populated {@link AuthResponse} with fresh tokens
     * @throws org.springframework.security.authentication.BadCredentialsException if the credentials are wrong
     * @throws org.springframework.security.authentication.DisabledException if the account is inactive
     */
    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        log.info("Login attempt for email: {}", request.getEmail());

        String ipAddress = resolveClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        try {
            // Delegate to Spring Security — throws AuthenticationException on failure
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (Exception ex) {
            // Record the failed attempt in its own REQUIRES_NEW transaction so it is
            // committed even though the outer @Transactional will roll back on the rethrown exception.
            loginHistoryService.record(null, request.getEmail(), ipAddress, userAgent, LoginStatus.FAILED);
            throw ex;
        }

        // Authentication succeeded — load the full entity (UserDetails from the manager
        // is sufficient for security, but we need the UUID and other fields for the response)
        User user = userRepository.findByEmailAndDeletedAtIsNull(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getEmail()));

        // Revoke all existing refresh tokens for this user before issuing new ones.
        // This ensures each login starts with a clean slate.
        refreshTokenRepository.deleteAllByUser(user);

        // Record the successful login attempt
        loginHistoryService.record(user, request.getEmail(), ipAddress, userAgent, LoginStatus.SUCCESS);

        log.debug("Login successful for user id: {}", user.getId());
        return buildAuthResponse(user, userAgent, ipAddress);
    }

    // =========================================================================
    // Refresh token
    // =========================================================================

    /**
     * Issues a new JWT access token (and rotated refresh token) in exchange for
     * a valid, non-revoked, non-expired refresh token.
     *
     * <p>Token rotation strategy: the incoming refresh token is revoked immediately
     * and a brand-new one is issued. This limits the damage if a refresh token is
     * leaked — the attacker's token becomes invalid as soon as the legitimate
     * client uses it.
     *
     * @param rawRefreshToken the JWT refresh token string sent by the client
     * @return a new {@link AuthResponse} containing a fresh access token and rotated refresh token
     * @throws UnauthorizedException if the token is not found, has been revoked, or has expired
     */
    @Transactional
    public AuthResponse refreshToken(String rawRefreshToken) {
        log.debug("Token refresh requested");

        // Look up the token record in the database
        RefreshToken storedToken = refreshTokenRepository.findByToken(rawRefreshToken)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token."));

        // Guard: reject revoked or expired tokens
        if (!storedToken.isValid()) {
            log.warn("Rejected invalid refresh token for user id: {}", storedToken.getUser().getId());
            throw new UnauthorizedException("Refresh token has expired or been revoked. Please log in again.");
        }

        User user = storedToken.getUser();

        // Revoke the consumed token (token rotation — prevents replay attacks)
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        // Issue a completely new token pair, carrying device info forward from the old token
        log.debug("Rotating refresh token for user id: {}", user.getId());
        return buildAuthResponse(user, storedToken.getUserAgent(), storedToken.getIpAddress());
    }

    // =========================================================================
    // Logout
    // =========================================================================

    /**
     * Logs out the currently authenticated user by revoking all of their
     * refresh tokens, immediately invalidating all active sessions on all devices.
     *
     * <p>The access token itself cannot be revoked (it is stateless), but it will
     * expire within 15 minutes. Clients are expected to discard the access token
     * on logout and stop including it in requests.
     *
     * @param rawRefreshToken the refresh token to revoke; used to identify the user
     *                        if the security context principal is not available
     * @throws UnauthorizedException if the provided refresh token is not recognised
     */
    @Transactional
    public void logout(String rawRefreshToken) {
        log.debug("Logout requested");

        RefreshToken storedToken = refreshTokenRepository.findByToken(rawRefreshToken)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token."));

        // Delete all tokens for the user — logs out all devices simultaneously
        refreshTokenRepository.deleteAllByUser(storedToken.getUser());

        log.info("User id {} logged out; all refresh tokens revoked.", storedToken.getUser().getId());
    }

    // =========================================================================
    // Get current user
    // =========================================================================

    /**
     * Returns the profile of the currently authenticated user.
     *
     * <p>Reads the email from the {@link SecurityContextHolder} (populated by
     * {@link com.smartcampus.security.JwtFilter} for every authenticated request)
     * and loads the full {@link User} entity from the database.
     *
     * @return a {@link UserResponse} DTO for the authenticated user
     * @throws UnauthorizedException if there is no authenticated principal in the security context
     * @throws ResourceNotFoundException if the user account no longer exists
     */
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new UnauthorizedException("No authenticated user found in the security context.");
        }

        // Resolve the email address from the authentication principal.
        //
        // Two possible authentication types arrive here:
        //
        //  1. UsernamePasswordAuthenticationToken (normal JWT path)
        //     JwtFilter sets this after validating the Bearer token.
        //     getName() returns the email because that is what JwtService
        //     stores as the JWT subject claim.
        //
        //  2. OAuth2AuthenticationToken (OAuth2 session still active)
        //     With SessionCreationPolicy.IF_REQUIRED, Spring Security keeps
        //     the OAuth2 session alive for a short period after the Google
        //     callback.  getName() on OAuth2AuthenticationToken delegates to
        //     OAuth2User.getName(), which returns the nameAttributeKey — for
        //     Google that is "sub" (the numeric account ID, e.g. 116158…),
        //     NOT the email.  Looking up a user by that numeric ID always
        //     fails, producing the "User account not found for email: <sub>"
        //     error seen in logs.  Fix: read the "email" attribute directly.
        String email;
        if (authentication instanceof OAuth2AuthenticationToken oauth2Token) {
            email = (String) oauth2Token.getPrincipal().getAttributes().get("email");
        } else {
            email = authentication.getName();
        }

        if (email == null || email.isBlank()) {
            throw new UnauthorizedException("Could not resolve email from the current authentication principal.");
        }

        User user = userRepository.findByEmailAndDeletedAtIsNull(email)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found for email: " + email));

        return UserResponse.from(user);
    }

    // =========================================================================
    // Forgot / reset password
    // =========================================================================

    /**
     * Initiates the password-reset flow for the given email address.
     *
     * <p>Security note: this method always returns successfully regardless of
     * whether the email is registered. This prevents user enumeration — an
     * attacker cannot tell which addresses have accounts.
     *
     * <p>If the email belongs to an active, non-OAuth account:
     * <ol>
     *   <li>Any existing reset tokens for the user are deleted (one active token at a time).</li>
     *   <li>A new single-use token (UUID) is created with a 15-minute expiry.</li>
     *   <li>An email containing the reset link is sent asynchronously.</li>
     * </ol>
     *
     * @param request contains the user's email address
     */
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmailAndDeletedAtIsNull(request.getEmail())
                .filter(user -> user.getPasswordHash() != null) // skip OAuth-only accounts
                .ifPresent(user -> {
                    // Revoke any pending tokens before issuing a new one
                    passwordResetTokenRepository.deleteAllByUserId(user.getId());

                    String tokenValue = java.util.UUID.randomUUID().toString();

                    PasswordResetToken resetToken = PasswordResetToken.builder()
                            .user(user)
                            .token(tokenValue)
                            .expiresAt(java.time.LocalDateTime.now().plusMinutes(15))
                            .build();

                    passwordResetTokenRepository.save(resetToken);
                    emailService.sendPasswordResetEmail(user.getEmail(), tokenValue);
                    log.info("Password reset email dispatched for user {}", user.getId());
                });
    }

    /**
     * Completes the password-reset flow by verifying the token and updating the password.
     *
     * @param request contains the reset token and the desired new password
     * @throws com.smartcampus.exception.UnauthorizedException if the token is invalid,
     *         expired, or already used
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByToken(request.getToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired reset link."));

        if (resetToken.isExpired()) {
            throw new UnauthorizedException("This reset link has expired. Please request a new one.");
        }
        if (resetToken.isUsed()) {
            throw new UnauthorizedException("This reset link has already been used.");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Mark the token as consumed so it cannot be replayed
        resetToken.setUsedAt(java.time.LocalDateTime.now());
        passwordResetTokenRepository.save(resetToken);

        // Revoke all refresh tokens — forces re-login on all devices
        refreshTokenRepository.deleteAllByUser(user);

        log.info("Password reset completed for user {}", user.getId());
    }

    // =========================================================================
    // Change password
    // =========================================================================

    /**
     * Changes the password of the currently authenticated user.
     *
     * <p>Verifies that {@code currentPassword} matches the stored hash before
     * applying the change. OAuth-only accounts (where {@code passwordHash} is
     * {@code null}) are rejected because they have no local password to verify against.
     *
     * @param userId          the UUID of the authenticated user
     * @param currentPassword the user's existing password (plaintext, verified against stored hash)
     * @param newPassword     the desired new password (plaintext, will be BCrypt-hashed)
     * @throws UnauthorizedException     if {@code currentPassword} does not match the stored hash,
     *                                   or if the account is an OAuth-only account with no local password
     * @throws ResourceNotFoundException if the user account no longer exists
     */
    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (user.getPasswordHash() == null) {
            throw new UnauthorizedException("OAuth accounts cannot change their password here.");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new UnauthorizedException("Current password is incorrect.");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password changed successfully for user {}", userId);
    }

    // =========================================================================
    // Login history
    // =========================================================================

    /**
     * Returns the 10 most recent login history entries for the currently
     * authenticated user.
     *
     * @return a list of up to 10 {@link LoginHistoryResponse} DTOs, newest first
     * @throws UnauthorizedException if there is no authenticated principal
     * @throws ResourceNotFoundException if the user account no longer exists
     */
    @Transactional(readOnly = true)
    public List<LoginHistoryResponse> getLoginHistory() {
        UserResponse currentUser = getCurrentUser();
        return loginHistoryService.getLoginHistory(currentUser.getId());
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    /**
     * Resolves the real client IP address from the request, checking the
     * {@code X-Forwarded-For} header first (set by reverse proxies / load balancers)
     * and falling back to {@link HttpServletRequest#getRemoteAddr()}.
     *
     * @param request the incoming HTTP request
     * @return the client IP address string, or {@code "unknown"} if not resolvable
     */
    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // X-Forwarded-For may contain a comma-separated chain — the first entry is the client.
            return forwarded.split(",")[0].trim();
        }
        String remoteAddr = request.getRemoteAddr();
        return (remoteAddr != null && !remoteAddr.isBlank()) ? remoteAddr : "unknown";
    }

    // =========================================================================
    // Active session management
    // =========================================================================

    /**
     * Returns all active (non-revoked, non-expired) sessions for the given user.
     */
    @Transactional(readOnly = true)
    public List<SessionResponse> getActiveSessions(UUID userId) {
        return refreshTokenRepository
                .findByUser_IdAndRevokedFalseAndExpiresAtAfter(userId, LocalDateTime.now())
                .stream()
                .map(SessionResponse::from)
                .toList();
    }

    /**
     * Revokes a single session by its token ID.
     * Only the owning user can revoke their own sessions.
     */
    @Transactional
    public void revokeSession(UUID tokenId, UUID userId) {
        RefreshToken token = refreshTokenRepository.findByIdAndUser_Id(tokenId, userId)
                .orElseThrow(() -> new UnauthorizedException("Session not found."));
        token.setRevoked(true);
        refreshTokenRepository.save(token);
        log.debug("Session {} revoked by user {}", tokenId, userId);
    }

    /**
     * Generates a JWT access token and a JWT refresh token for the given user,
     * persists the refresh token in the database, and assembles the full
     * {@link AuthResponse}.
     *
     * <p>This helper is shared by {@link #register}, {@link #login}, and
     * {@link #refreshToken} to avoid duplicating token-generation logic.
     *
     * @param user the authenticated user for whom tokens are being issued
     * @return a complete {@link AuthResponse} ready to be returned to the client
     */
    private AuthResponse buildAuthResponse(User user, String userAgent, String ipAddress) {
        // Generate both tokens via JwtService
        String accessToken  = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        // Compute absolute expiry for the refresh token DB record
        LocalDateTime expiresAt = LocalDateTime.now()
                .plusNanos(refreshTokenExpirationMs * 1_000_000L);

        // Persist the refresh token so it can be validated and revoked later
        RefreshToken tokenEntity = RefreshToken.builder()
                .token(refreshToken)
                .user(user)
                .expiresAt(expiresAt)
                .revoked(false)
                .userAgent(userAgent)
                .ipAddress(ipAddress)
                .build();
        refreshTokenRepository.save(tokenEntity);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(UserResponse.from(user))
                .build();
    }
}
