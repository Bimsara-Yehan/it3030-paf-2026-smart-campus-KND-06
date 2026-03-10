package com.smartcampus.exception;

/**
 * Thrown when an operation cannot be completed because it would create a
 * conflict with the current state of the resource.
 *
 * <p>Examples:
 * <ul>
 *   <li>A user attempts to register with an email that already exists in the system.</li>
 *   <li>Two booking requests overlap for the same resource and time slot.</li>
 *   <li>An admin attempts to create a resource with a name that already exists.</li>
 * </ul>
 *
 * <p>Handled by {@link GlobalExceptionHandler#handleConflict} which returns
 * an HTTP {@code 409 Conflict} response.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     GlobalExceptionHandler
 */
public class ConflictException extends RuntimeException {

    /**
     * Constructs a new exception with the given detail message.
     *
     * @param message a human-readable description of the conflict
     *                (e.g. {@code "Email 'user@sliit.lk' is already registered"})
     */
    public ConflictException(String message) {
        super(message);
    }

    /**
     * Constructs a new exception with the given detail message and root cause.
     *
     * @param message a human-readable description of the conflict
     * @param cause   the underlying exception that triggered this one (may be {@code null})
     */
    public ConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}
