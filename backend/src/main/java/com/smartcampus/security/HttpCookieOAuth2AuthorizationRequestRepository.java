package com.smartcampus.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.SerializationUtils;

import java.util.Base64;
import java.util.Optional;

/**
 * Stores the OAuth2 authorization request in a short-lived HTTP cookie instead
 * of the HTTP session.
 *
 * <p>The default Spring Security implementation uses the HTTP session
 * ({@link org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizationRequestRepository}).
 * This works in a purely server-rendered app, but breaks in a React SPA + REST API
 * setup because the session created when the user is redirected to Google is not
 * reliably available when Google redirects back — leading to the
 * {@code authorization_request_not_found} error.
 *
 * <p>By storing the authorization request in a browser cookie:
 * <ul>
 *   <li>The browser automatically includes the cookie in the Google callback request.</li>
 *   <li>No server-side session is needed for the OAuth2 dance.</li>
 *   <li>The cookie is {@code HttpOnly}, {@code Path=/}, and expires in 3 minutes —
 *       just long enough for the user to complete the Google consent screen.</li>
 * </ul>
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     org.springframework.security.oauth2.client.web.AuthorizationRequestRepository
 */
@Component
public class HttpCookieOAuth2AuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    /** Name of the cookie that holds the serialized authorization request. */
    static final String COOKIE_NAME = "oauth2_auth_request";

    /** Cookie lifetime in seconds — 3 minutes is plenty for the OAuth2 dance. */
    private static final int COOKIE_MAX_AGE_SECONDS = 180;

    // =========================================================================
    // AuthorizationRequestRepository
    // =========================================================================

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return findCookie(request, COOKIE_NAME)
                .map(cookie -> deserialize(cookie.getValue()))
                .orElse(null);
    }

    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest,
                                         HttpServletRequest request,
                                         HttpServletResponse response) {
        if (authorizationRequest == null) {
            deleteCookie(request, response, COOKIE_NAME);
            return;
        }

        Cookie cookie = new Cookie(COOKIE_NAME, serialize(authorizationRequest));
        cookie.setPath("/");
        cookie.setHttpOnly(true);                    // Not accessible from JavaScript
        cookie.setMaxAge(COOKIE_MAX_AGE_SECONDS);
        response.addCookie(cookie);
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,
                                                                  HttpServletResponse response) {
        // Load the request first, then delete the cookie so it is consumed exactly once.
        OAuth2AuthorizationRequest authRequest = loadAuthorizationRequest(request);
        deleteCookie(request, response, COOKIE_NAME);
        return authRequest;
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    /** Returns the named cookie from the request, or {@link Optional#empty()} if absent. */
    private Optional<Cookie> findCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return Optional.empty();
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) {
                return Optional.of(cookie);
            }
        }
        return Optional.empty();
    }

    /** Removes a cookie by setting its max-age to 0. */
    private void deleteCookie(HttpServletRequest request,
                               HttpServletResponse response,
                               String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return;
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) {
                cookie.setValue("");
                cookie.setPath("/");
                cookie.setMaxAge(0);
                response.addCookie(cookie);
            }
        }
    }

    /**
     * Serializes an {@link OAuth2AuthorizationRequest} to a Base64url string
     * using Java's built-in serialization.
     * {@code OAuth2AuthorizationRequest} implements {@link java.io.Serializable}.
     */
    private String serialize(OAuth2AuthorizationRequest authorizationRequest) {
        return Base64.getUrlEncoder()
                     .encodeToString(SerializationUtils.serialize(authorizationRequest));
    }

    /** Deserializes a Base64url string back to an {@link OAuth2AuthorizationRequest}. */
    private OAuth2AuthorizationRequest deserialize(String value) {
        return (OAuth2AuthorizationRequest) SerializationUtils.deserialize(
                Base64.getUrlDecoder().decode(value));
    }
}
