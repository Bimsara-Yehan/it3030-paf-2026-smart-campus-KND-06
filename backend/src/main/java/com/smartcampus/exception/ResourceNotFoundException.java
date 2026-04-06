package com.smartcampus.exception;

/**
 * Thrown when a requested resource does not exist in the database.
 *
 * <p>Examples:
 * <ul>
 *   <li>A booking ID supplied in the URL does not match any row in the {@code bookings} table.</li>
 *   <li>A user attempts to fetch a ticket that has been soft-deleted.</li>
 *   <li>A resource ID referenced in a booking request does not exist.</li>
 * </ul>
 *
 * <p>Handled by {@link GlobalExceptionHandler#handleResourceNotFound} which returns
 * an HTTP {@code 404 Not Found} response.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     GlobalExceptionHandler
 */
public class ResourceNotFoundException extends RuntimeException {

    /**
     * Constructs a new exception with the given detail message.
     *
     * @param message a human-readable description of which resource was not found
     *                (e.g. {@code "Booking with id '3fa85f64' was not found"})
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }

    /**
     * Constructs a new exception with the given detail message and root cause.
     *
     * @param message a human-readable description of which resource was not found
     * @param cause   the underlying exception that triggered this one (may be {@code null})
     */
    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
