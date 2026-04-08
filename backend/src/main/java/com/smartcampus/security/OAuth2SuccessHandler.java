package com.smartcampus.security;

import com.smartcampus.entity.RefreshToken;
import com.smartcampus.entity.User;
import com.smartcampus.enums.UserRole;
import com.smartcampus.repository.RefreshTokenRepository;
import com.smartcampus.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Handles a successful Google OAuth2 authentication event.
 *
 * <p>Invoked by Spring Security's OAuth2 login mechanism after Google has verified
 * the user and returned a valid {@link Authentication} principal. This handler
 * bridges the OAuth2 world with the application's JWT-based auth model:
 *
 * <ol>
 *   <li>Extracts the user's email, display name, and profile picture from the
 *       Google OAuth2 user-info attributes.</li>
 *   <li>Performs an <em>upsert</em> on the {@code users} table:
 *       <ul>
 *         <li>Existing user → update {@code name} and {@code profile_picture}.</li>
 *         <li>New user → create a record with {@code role = USER},
 *             {@code password_hash = null} (OAuth-only account), {@code is_active = true}.</li>
 *       </ul>
 *   </li>
 *   <li>Generates a JWT access token (15 min) and a refresh token (7 days) for the user.</li>
 *   <li>Persists the refresh token to the {@code refresh_tokens} table.</li>
 *   <li>Redirects the browser to the React frontend callback URL with both tokens
 *       as query parameters, so the frontend can store them and complete the login flow.</li>
 * </ol>
 *
 * <p>Error handling: any exception during the post-authentication steps redirects the
 * user to the login page with an {@code error=oauth_failed} query parameter rather
 * than letting the error surface as a 500 response.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     OAuth2FailureHandler
 * @see     com.smartcampus.config.SecurityConfig
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    // ── Frontend redirect targets ─────────────────────────────────────────────

    /** The React callback page that will parse the token params and store them. */
    private static final String CALLBACK_URL =
            "http://localhost:5173/oauth/callback";

    /** Fallback destination on unexpected errors during the post-OAuth2 flow. */
    private static final String LOGIN_ERROR_URL =
            "http://localhost:5173/login?error=oauth_failed";

    // ── Dependencies ──────────────────────────────────────────────────────────

    private final UserRepository         userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService             jwtService;

    /** Refresh token lifetime, injected from {@code app.jwt.refresh-token-expiration-ms}. */
    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    // =========================================================================
    // AuthenticationSuccessHandler
    // =========================================================================

    /**
     * Entry point called by Spring Security after a successful OAuth2 authentication.
     *
     * <p>The method is intentionally wrapped in a try/catch so that any unexpected
     * failure during JWT generation or DB persistence falls back to the login error
     * page rather than leaving the user on a blank error screen.
     *
     * @param request        the originating HTTP request
     * @param response       the HTTP response (used for the redirect)
     * @param authentication the authenticated principal supplied by Spring Security
     * @throws IOException if the redirect fails at the servlet level
     */
    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        try {
            // ── 1. Extract Google user attributes ─────────────────────────────
            // Use getAttributes().get() with an explicit String cast rather than
            // the generic getAttribute() helper.  The generic helper delegates to
            // getName() on some Spring Security OAuth2User implementations when
            // the requested key is the configured nameAttributeKey — for Google
            // that key defaults to "sub" (the numeric account ID), which would
            // cause email to silently receive the numeric ID instead of the
            // actual email address.  Direct map access bypasses that logic.
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

            String email   = (String) oAuth2User.getAttributes().get("email");
            String name    = (String) oAuth2User.getAttributes().get("name");
            String picture = (String) oAuth2User.getAttributes().get("picture");

            if (email == null || email.isBlank()) {
                log.error("OAuth2 login succeeded but Google did not return an email address");
                response.sendRedirect(LOGIN_ERROR_URL);
                return;
            }

            log.info("OAuth2 login — Google returned email: {}", email);

            // ── 2. Upsert the user in the database ────────────────────────────
            User user = upsertUser(email, name, picture);

            // ── 3. Issue JWT tokens ───────────────────────────────────────────
            String accessToken        = jwtService.generateAccessToken(user);
            String refreshTokenValue  = jwtService.generateRefreshToken(user);

            // ── 4. Persist the refresh token ──────────────────────────────────
            saveRefreshToken(user, refreshTokenValue);

            // ── 5. Invalidate the OAuth2 HTTP session ─────────────────────────
            // Spring Security stores an OAuth2AuthenticationToken in the session
            // after the OAuth2 dance completes. If we leave it there, every
            // subsequent API request from the browser will carry the session
            // cookie, Spring will restore the OAuth2AuthenticationToken into the
            // SecurityContext, the JwtFilter will skip JWT processing (auth already
            // set), and @AuthenticationPrincipal User will be null (the principal
            // is OAuth2User, not our User entity) — causing NPEs in controllers.
            // Destroying the session here ensures all future requests are
            // authenticated exclusively via the JWT we just issued.
            jakarta.servlet.http.HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }

            // ── 6. Redirect browser to the React callback page ────────────────
            // JWT tokens use base64url encoding (RFC 4648 §5) — characters are
            // limited to [A-Za-z0-9\-_\.], so they are URL-safe without additional encoding.
            String redirectUrl = CALLBACK_URL
                    + "?token=" + accessToken
                    + "&refreshToken=" + refreshTokenValue;

            log.info("OAuth2 login successful — redirecting user {} to frontend callback", email);
            response.sendRedirect(redirectUrl);

        } catch (Exception ex) {
            log.error("Unexpected error during OAuth2 success handling — redirecting to error page", ex);
            response.sendRedirect(LOGIN_ERROR_URL);
        }
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    /**
     * Finds an existing user by email or creates a new one.
     *
     * <p>For existing users, only {@code name} and {@code profilePicture} are
     * updated — the user's role and active status are never changed by an OAuth2
     * login. This prevents a malicious Google account change from escalating privileges.
     *
     * <p>For new users, the account is created with:
     * <ul>
     *   <li>{@code role = USER} — all OAuth2 registrations start with the base role.</li>
     *   <li>{@code passwordHash = null} — OAuth-only accounts have no local password.</li>
     *   <li>{@code isActive = true} — the account is immediately usable.</li>
     * </ul>
     *
     * @param email   the user's Google email address (non-null)
     * @param name    the user's display name from Google (may be null)
     * @param picture the URL of the user's Google profile picture (may be null)
     * @return the saved {@link User} entity
     */
    private User upsertUser(String email, String name, String picture) {
        return userRepository.findByEmail(email)
                .map(existing -> {
                    // Update mutable profile fields only — never change role or status.
                    if (name != null) existing.setName(name);
                    existing.setProfilePicture(picture);
                    log.debug("Updated existing OAuth2 user: {}", email);
                    return userRepository.save(existing);
                })
                .orElseGet(() -> {
                    // Derive a sensible fallback name if Google doesn't provide one.
                    String displayName = (name != null && !name.isBlank())
                            ? name
                            : email.split("@")[0];

                    User newUser = User.builder()
                            .name(displayName)
                            .email(email)
                            .passwordHash(null)          // OAuth-only — no local password
                            .role(UserRole.USER)          // all OAuth registrations start as USER
                            .isActive(Boolean.TRUE)
                            .profilePicture(picture)
                            .build();

                    log.info("Creating new OAuth2 user: {}", email);
                    return userRepository.save(newUser);
                });
    }

    /**
     * Persists a new refresh token record in the {@code refresh_tokens} table.
     *
     * <p>The expiration time is computed from {@link #refreshTokenExpirationMs} and
     * stored as a {@link LocalDateTime} to match the Flyway-generated schema.
     *
     * @param user       the owner of the refresh token
     * @param tokenValue the raw JWT refresh token string
     */
    private void saveRefreshToken(User user, String tokenValue) {
        LocalDateTime expiresAt = LocalDateTime.now()
                .plusSeconds(refreshTokenExpirationMs / 1000);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(tokenValue)
                .expiresAt(expiresAt)
                .build();

        refreshTokenRepository.save(refreshToken);
        log.debug("Refresh token saved for user: {}", user.getEmail());
    }
}
