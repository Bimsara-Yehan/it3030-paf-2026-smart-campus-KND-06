package com.smartcampus.exception;

/**
 * Thrown when the client submits a request that is syntactically valid but
 * semantically incorrect — i.e. the data violates business rules rather than
 * bean validation constraints.
 *
 * <p>Examples:
 * <ul>
 *   <li>A booking's {@code endTime} is before its {@code startTime}.</li>
 *   <li>An admin attempts to approve a booking that is already cancelled.</li>
 *   <li>A user tries to cancel a booking that has already been rejected.</li>
 *   <li>A ticket status transition is not allowed by the workflow rules.</li>
 * </ul>
 *
 * <p>Note: simple field-level validation failures (blank fields, invalid email
 * format, etc.) are handled automatically by {@code @Valid} and reported via
 * {@link GlobalExceptionHandler#handleValidationErrors}. This exception is
 * reserved for higher-level business rule violations.
 *
 * <p>Handled by {@link GlobalExceptionHandler#handleBadRequest} which returns
 * an HTTP {@code 400 Bad Request} response.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     GlobalExceptionHandler
 */
public class BadRequestException extends RuntimeException {

    /**
     * Constructs a new exception with the given detail message.
     *
     * @param message a human-readable description of the business rule violation
     */
    public BadRequestException(String message) {
        super(message);
    }

    /**
     * Constructs a new exception with the given detail message and root cause.
     *
     * @param message a human-readable description of the business rule violation
     * @param cause   the underlying exception that triggered this one (may be {@code null})
     */
    public BadRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}
