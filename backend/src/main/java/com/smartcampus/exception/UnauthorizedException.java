package com.smartcampus.exception;

/**
 * Thrown when an operation requires authentication but the request does not
 * provide valid credentials, or the provided credentials are no longer valid.
 *
 * <p>Examples:
 * <ul>
 *   <li>A service method is called without an authenticated principal in the
 *       {@code SecurityContext} (defence-in-depth check beyond the filter).</li>
 *   <li>A refresh token has been revoked (user logged out) and the client
 *       attempts to use it to obtain a new access token.</li>
 *   <li>An OAuth2 callback arrives with a state parameter that does not match
 *       the session (CSRF protection).</li>
 * </ul>
 *
 * <p>Note: most unauthenticated requests are rejected by Spring Security's filter
 * chain before reaching service code. This exception is for the rare cases where
 * a service layer must perform an additional authentication check.
 *
 * <p>Handled by {@link GlobalExceptionHandler#handleUnauthorized} which returns
 * an HTTP {@code 401 Unauthorized} response.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     GlobalExceptionHandler
 */
public class UnauthorizedException extends RuntimeException {

    /**
     * Constructs a new exception with the given detail message.
     *
     * @param message a human-readable description of why authentication failed
     */
    public UnauthorizedException(String message) {
        super(message);
    }

    /**
     * Constructs a new exception with the given detail message and root cause.
     *
     * @param message a human-readable description of why authentication failed
     * @param cause   the underlying exception that triggered this one (may be {@code null})
     */
    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}
