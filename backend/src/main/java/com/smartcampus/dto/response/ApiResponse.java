package com.smartcampus.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Generic API response wrapper used by all successful controller endpoints.
 *
 * <p>Provides a consistent envelope so every API response shares the same
 * top-level shape regardless of the data type returned:
 * <pre>{@code
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data":    { ... }
 * }
 * }</pre>
 *
 * <p>Error responses follow a different shape handled by
 * {@link com.smartcampus.exception.GlobalExceptionHandler} — they are not
 * wrapped in this class so the {@code status}, {@code error}, and
 * {@code timestamp} fields can be included at the top level.
 *
 * <p>Usage examples:
 * <pre>{@code
 * // Success with data
 * return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
 *
 * // Success without data (e.g. logout)
 * return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
 * }</pre>
 *
 * @param <T> the type of the {@code data} payload; use {@link Void} or {@link Object}
 *            for responses that carry no data
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     com.smartcampus.controller.AuthController
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    /**
     * {@code true} for all responses produced by this class — error responses
     * are handled separately by the exception handler and never use this wrapper.
     */
    private boolean success;

    /** Human-readable message describing the outcome (e.g. "Login successful"). */
    private String message;

    /**
     * The response payload. {@code null} for operations that return no data
     * (e.g. logout, which only confirms the operation succeeded).
     */
    private T data;

    // =========================================================================
    // Static factory methods
    // =========================================================================

    /**
     * Creates a successful response with a data payload.
     *
     * @param <T>     the type of the data payload
     * @param message a human-readable success message
     * @param data    the response payload to wrap
     * @return an {@link ApiResponse} with {@code success = true}
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    /**
     * Creates a successful response with no data payload (e.g. for logout or delete).
     *
     * @param message a human-readable success message
     * @return an {@link ApiResponse} with {@code success = true} and {@code data = null}
     */
    public static ApiResponse<Void> success(String message) {
        return ApiResponse.<Void>builder()
                .success(true)
                .message(message)
                .data(null)
                .build();
    }

    /**
     * Creates a failure response with no data payload.
     *
     * <p>In most cases, exceptions should be thrown and handled by
     * {@link com.smartcampus.exception.GlobalExceptionHandler}. This factory
     * method is provided for edge cases where a non-exceptional error response
     * is appropriate (e.g. partial batch operations).
     *
     * @param message a human-readable error message describing what went wrong
     * @return an {@link ApiResponse} with {@code success = false} and {@code data = null}
     */
    public static ApiResponse<Void> error(String message) {
        return ApiResponse.<Void>builder()
                .success(false)
                .message(message)
                .data(null)
                .build();
    }
}
