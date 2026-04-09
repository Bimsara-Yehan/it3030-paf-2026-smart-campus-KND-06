package com.smartcampus.controller;

import com.smartcampus.dto.request.ChangePasswordRequest;
import com.smartcampus.dto.request.ForgotPasswordRequest;
import com.smartcampus.dto.request.LoginRequest;
import com.smartcampus.dto.request.RegisterRequest;
import com.smartcampus.dto.request.ResetPasswordRequest;
import com.smartcampus.entity.User;
import com.smartcampus.dto.response.ApiResponse;
import com.smartcampus.dto.response.AuthResponse;
import com.smartcampus.dto.response.LoginHistoryResponse;
import com.smartcampus.dto.response.UserResponse;
import com.smartcampus.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * REST controller exposing all authentication endpoints for the Smart Campus API.
 *
 * <p>Base path: {@code /auth} (relative to the global context path {@code /api/v1}).
 * All endpoints except {@code GET /auth/me} are configured as public (no JWT required)
 * in {@link com.smartcampus.config.SecurityConfig}.
 *
 * <p>Endpoint summary:
 * <ul>
 *   <li>{@code POST /auth/register} — create a new user account</li>
 *   <li>{@code POST /auth/login}    — authenticate with email + password</li>
 *   <li>{@code POST /auth/refresh}  — exchange a refresh token for a new access token</li>
 *   <li>{@code POST /auth/logout}   — revoke the refresh token and end the session</li>
 *   <li>{@code GET  /auth/me}       — retrieve the current authenticated user's profile</li>
 * </ul>
 *
 * <p>All request bodies are validated with {@code @Valid}. Constraint violations are
 * handled globally by {@link com.smartcampus.exception.GlobalExceptionHandler}, which
 * returns a {@code 400 Bad Request} with per-field error details.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     AuthService
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // =========================================================================
    // POST /auth/register
    // =========================================================================

    /**
     * Registers a new user account.
     *
     * <p>The caller does not need to be authenticated. On success, the response
     * includes both JWT tokens so the user is immediately logged in after
     * registering — no separate login call is required.
     *
     * @param request the validated registration payload (fullName, email, password)
     * @return {@code 201 Created} with an {@link AuthResponse} wrapped in {@link ApiResponse}
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {

        log.info("POST /auth/register — email: {}", request.getEmail());
        AuthResponse authResponse = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful.", authResponse));
    }

    // =========================================================================
    // POST /auth/login
    // =========================================================================

    /**
     * Authenticates a user with their email and password.
     *
     * <p>Delegates to Spring Security's {@link org.springframework.security.authentication.AuthenticationManager}
     * for credential verification. If authentication fails, Spring Security throws
     * an {@link org.springframework.security.authentication.BadCredentialsException}
     * which propagates to {@link com.smartcampus.exception.GlobalExceptionHandler}
     * and is returned as a {@code 401 Unauthorized}.
     *
     * @param request the validated login credentials (email, password)
     * @return {@code 200 OK} with an {@link AuthResponse} containing fresh JWT tokens
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        log.info("POST /auth/login — email: {}", request.getEmail());
        AuthResponse authResponse = authService.login(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Login successful.", authResponse));
    }

    // =========================================================================
    // POST /auth/refresh
    // =========================================================================

    /**
     * Exchanges a valid refresh token for a new access token and rotated refresh token.
     *
     * <p>Expects a JSON body with a single {@code "refreshToken"} string field.
     * Using a request body (rather than a header) for the refresh token is a deliberate
     * design choice — the refresh token is a sensitive credential and should not be
     * stored in the same place as the access token on the client.
     *
     * <p>Token rotation is enforced: the provided refresh token is revoked and a
     * brand-new one is returned. If the same token is presented a second time it will
     * be rejected with {@code 401}.
     *
     * @param body a JSON object with the key {@code "refreshToken"} containing the token string
     * @return {@code 200 OK} with a new {@link AuthResponse} containing fresh tokens
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @RequestBody Map<String, String> body) {

        log.debug("POST /auth/refresh");
        String refreshToken = body.get("refreshToken");
        AuthResponse authResponse = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully.", authResponse));
    }

    // =========================================================================
    // POST /auth/logout
    // =========================================================================

    /**
     * Logs out the current user by revoking all of their refresh tokens.
     *
     * <p>After this call, all active sessions across all devices are invalidated.
     * The short-lived access token will expire naturally within 15 minutes —
     * clients should discard it immediately and stop sending it in requests.
     *
     * @param body a JSON object with the key {@code "refreshToken"} containing the token to revoke
     * @return {@code 200 OK} with a success confirmation message
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        log.debug("POST /auth/logout");
        String refreshToken = body.get("refreshToken");
        authService.logout(refreshToken);

        // Invalidate the HTTP session so stale OAuth2AuthenticationTokens cannot
        // contaminate the SecurityContext for the next user who logs in on the
        // same browser (especially during user→admin account switching).
        jakarta.servlet.http.HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        return ResponseEntity.ok(ApiResponse.success("Logged out successfully."));
    }

    // =========================================================================
    // GET /auth/oauth2/google
    // =========================================================================

    /**
     * Entry point for the Google OAuth2 login flow.
     *
     * <p>The React frontend's "Sign in with Google" button links to this endpoint.
     * This method simply redirects the browser to Spring Security's built-in OAuth2
     * authorization endpoint ({@code /oauth2/authorization/google}), which then:
     * <ol>
     *   <li>Generates the Google authorization URL with {@code client_id}, {@code redirect_uri},
     *       {@code scope}, and a CSRF {@code state} parameter.</li>
     *   <li>Stores the {@code state} in the HTTP session for validation on the callback.</li>
     *   <li>Redirects the browser to Google's consent screen.</li>
     * </ol>
     *
     * <p>After the user approves on Google, Spring Security handles the callback at
     * {@code /login/oauth2/code/google}, validates the state, exchanges the code for
     * tokens, and invokes {@link com.smartcampus.security.OAuth2SuccessHandler}.
     *
     * @param request  the incoming HTTP request (used to read the context path)
     * @param response the HTTP response (used to issue the redirect)
     * @throws IOException if the redirect fails at the servlet level
     */
    @GetMapping("/oauth2/google")
    public void initiateGoogleLogin(HttpServletRequest request,
                                    HttpServletResponse response) throws IOException {

        // Build the redirect URL relative to the application context path so this
        // works regardless of whether the context path is /api/v1 or something else.
        String redirectUrl = request.getContextPath() + "/oauth2/authorization/google";
        log.info("GET /auth/oauth2/google — initiating OAuth2 flow, redirecting to: {}", redirectUrl);
        response.sendRedirect(redirectUrl);
    }

    // =========================================================================
    // GET /auth/me
    // =========================================================================

    /**
     * Returns the profile of the currently authenticated user.
     *
     * <p>Requires a valid Bearer access token in the {@code Authorization} header.
     * The user's identity is resolved from the JWT claims already validated by
     * {@link com.smartcampus.security.JwtFilter} before this method is called.
     *
     * @return {@code 200 OK} with the authenticated user's {@link UserResponse}
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me() {
        log.debug("GET /auth/me");
        UserResponse user = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("User profile retrieved.", user));
    }

    // =========================================================================
    // POST /auth/forgot-password
    // =========================================================================

    /**
     * Initiates the password-reset flow.
     *
     * <p>Always returns {@code 200 OK} regardless of whether the email is registered
     * to prevent user enumeration. The reset email is sent asynchronously.
     *
     * @param request JSON body with {@code email}
     * @return {@code 200 OK} with a generic success message
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        log.info("POST /auth/forgot-password — email: {}", request.getEmail());
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(
                "If that email is registered you will receive a reset link shortly."));
    }

    // =========================================================================
    // POST /auth/reset-password
    // =========================================================================

    /**
     * Completes the password-reset flow by verifying the token and setting a new password.
     *
     * @param request JSON body with {@code token} and {@code newPassword}
     * @return {@code 200 OK} on success; {@code 401} if the token is invalid/expired/used
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        log.info("POST /auth/reset-password");
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully. Please log in."));
    }

    // =========================================================================
    // POST /auth/change-password
    // =========================================================================

    /**
     * Changes the password of the currently authenticated user.
     *
     * <p>Requires a valid Bearer token. The current password must be provided to
     * confirm intent — OAuth-only accounts (no local password) are rejected.
     *
     * @param currentUser the authenticated user injected by Spring Security
     * @param request     JSON body with {@code currentPassword} and {@code newPassword}
     * @return {@code 200 OK} with a success message and no data payload
     */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody ChangePasswordRequest request) {

        log.info("POST /auth/change-password — user: {}", currentUser.getId());
        authService.changePassword(
                currentUser.getId(),
                request.getCurrentPassword(),
                request.getNewPassword()
        );
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully."));
    }

    // =========================================================================
    // GET /auth/login-history
    // =========================================================================

    /**
     * Returns the 10 most recent login attempts for the currently authenticated user.
     *
     * <p>Requires a valid Bearer access token. Entries include both successful and
     * failed attempts, along with the IP address, browser, device, and timestamp
     * of each attempt — allowing users to identify suspicious activity.
     *
     * @return {@code 200 OK} with a list of up to 10 {@link LoginHistoryResponse} DTOs
     */
    @GetMapping("/login-history")
    public ResponseEntity<ApiResponse<List<LoginHistoryResponse>>> loginHistory() {
        log.debug("GET /auth/login-history");
        List<LoginHistoryResponse> history = authService.getLoginHistory();
        return ResponseEntity.ok(ApiResponse.success("Login history retrieved.", history));
    }
}
