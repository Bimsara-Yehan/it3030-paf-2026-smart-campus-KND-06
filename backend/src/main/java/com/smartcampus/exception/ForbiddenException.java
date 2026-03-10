package com.smartcampus.exception;

/**
 * Thrown when an authenticated user attempts to perform an action that their
 * role does not permit, or that they do not own.
 *
 * <p>The distinction from {@link UnauthorizedException} (401) is important:
 * <ul>
 *   <li>{@code 401 Unauthorized} — the request has no valid identity at all.</li>
 *   <li>{@code 403 Forbidden}    — the identity is known, but lacks permission.</li>
 * </ul>
 *
 * <p>Examples:
 * <ul>
 *   <li>A {@code USER} attempts to call an endpoint restricted to {@code ADMIN}.</li>
 *   <li>A user tries to cancel another user's booking (ownership violation).</li>
 *   <li>A {@code TECHNICIAN} tries to approve a booking (wrong role for action).</li>
 *   <li>A user attempts to delete a comment that belongs to someone else.</li>
 * </ul>
 *
 * <p>Note: coarse-grained role checks are handled by {@code @PreAuthorize} and
 * Spring Security's URL rules. This exception is for fine-grained ownership
 * and cross-resource permission checks inside service methods.
 *
 * <p>Handled by {@link GlobalExceptionHandler#handleForbidden} which returns
 * an HTTP {@code 403 Forbidden} response.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     GlobalExceptionHandler
 */
public class ForbiddenException extends RuntimeException {

    /**
     * Constructs a new exception with the given detail message.
     *
     * @param message a human-readable description of the permission violation
     */
    public ForbiddenException(String message) {
        super(message);
    }

    /**
     * Constructs a new exception with the given detail message and root cause.
     *
     * @param message a human-readable description of the permission violation
     * @param cause   the underlying exception that triggered this one (may be {@code null})
     */
    public ForbiddenException(String message, Throwable cause) {
        super(message, cause);
    }
}
