package com.smartcampus.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Handles a failed Google OAuth2 authentication attempt.
 *
 * <p>Invoked by Spring Security's OAuth2 login mechanism when authentication
 * fails for any of the following reasons:
 * <ul>
 *   <li>The user denied access on the Google consent screen.</li>
 *   <li>Google returned an error response (e.g. invalid client credentials).</li>
 *   <li>The OAuth2 state parameter did not match (CSRF-protection check failed).</li>
 *   <li>A network error occurred while communicating with Google's token endpoint.</li>
 * </ul>
 *
 * <p>All failure cases redirect to the React login page with an {@code error}
 * query parameter so the frontend can display a user-friendly error message.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     OAuth2SuccessHandler
 * @see     com.smartcampus.config.SecurityConfig
 */
@Slf4j
@Component
public class OAuth2FailureHandler implements AuthenticationFailureHandler {

    /** Frontend login page URL with an error indicator for the OAuth2 failure case. */
    private static final String LOGIN_ERROR_URL =
            "http://localhost:5173/login?error=oauth_failed";

    // =========================================================================
    // AuthenticationFailureHandler
    // =========================================================================

    /**
     * Called by Spring Security when an OAuth2 login attempt fails.
     *
     * <p>The failure reason is logged at WARN level for observability (useful for
     * diagnosing misconfigured Google credentials or consent-screen rejections),
     * and the user is redirected to the frontend login page with the
     * {@code error=oauth_failed} parameter so the UI can render a helpful message.
     *
     * @param request   the originating HTTP request
     * @param response  the HTTP response (used for the redirect)
     * @param exception the Spring Security exception describing the failure reason
     * @throws IOException if the redirect fails at the servlet level
     */
    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {

        log.warn("OAuth2 authentication failed: {}", exception.getMessage());
        response.sendRedirect(LOGIN_ERROR_URL);
    }
}
