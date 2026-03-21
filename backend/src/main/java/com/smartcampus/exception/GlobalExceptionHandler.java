package com.smartcampus.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Centralised exception handling for the entire Smart Campus REST API.
 *
 * <p>Annotated with {@link RestControllerAdvice}, this class intercepts exceptions
 * thrown by any {@code @RestController} and converts them into consistent, structured
 * JSON error responses. This ensures clients always receive the same error shape
 * regardless of which endpoint or layer threw the exception.
 *
 * <p>Error response format:
 * <pre>{@code
 * {
 *   "status":    404,
 *   "error":     "Not Found",
 *   "message":   "Resource with id 'abc-123' was not found",
 *   "timestamp": "2026-03-24T10:00:00",
 *   "path":      "/api/v1/resources/abc-123"
 * }
 * }</pre>
 *
 * <p>Validation errors ({@link MethodArgumentNotValidException}) additionally include
 * a {@code "fieldErrors"} map with per-field messages:
 * <pre>{@code
 * {
 *   "status":      400,
 *   "error":       "Bad Request",
 *   "message":     "Validation failed. See 'fieldErrors' for details.",
 *   "timestamp":   "2026-03-24T10:00:00",
 *   "path":        "/api/v1/bookings",
 *   "fieldErrors": {
 *     "startTime": "must not be null",
 *     "purpose":   "must not be blank"
 *   }
 * }
 * }</pre>
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     ResourceNotFoundException
 * @see     BadRequestException
 * @see     UnauthorizedException
 * @see     ForbiddenException
 * @see     ConflictException
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── Key constants for the error response body ─────────────────────────────
    private static final String KEY_STATUS      = "status";
    private static final String KEY_ERROR       = "error";
    private static final String KEY_MESSAGE     = "message";
    private static final String KEY_TIMESTAMP   = "timestamp";
    private static final String KEY_PATH        = "path";
    private static final String KEY_FIELD_ERRORS = "fieldErrors";

    // =========================================================================
    // Application-specific exceptions
    // =========================================================================

    /**
     * Handles {@link ResourceNotFoundException} — thrown when a requested entity
     * does not exist in the database (e.g. booking ID not found, user not found).
     *
     * @param ex      the exception carrying the error message
     * @param request the current HTTP request (used to extract the request path)
     * @return 404 Not Found with a structured error body
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {

        log.warn("ResourceNotFoundException on [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    /**
     * Handles {@link BadRequestException} — thrown when the client sends data that
     * is semantically invalid (e.g. booking end time before start time, invalid state
     * transition).
     *
     * @param ex      the exception carrying the error message
     * @param request the current HTTP request
     * @return 400 Bad Request with a structured error body
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(
            BadRequestException ex, HttpServletRequest request) {

        log.warn("BadRequestException on [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    /**
     * Handles {@link UnauthorizedException} — thrown when authentication is required
     * but the request lacks valid credentials (e.g. expired token used outside the
     * filter chain, or a service-layer auth check).
     *
     * @param ex      the exception carrying the error message
     * @param request the current HTTP request
     * @return 401 Unauthorized with a structured error body
     */
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorized(
            UnauthorizedException ex, HttpServletRequest request) {

        log.warn("UnauthorizedException on [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
    }

    /**
     * Handles {@link ForbiddenException} — thrown when an authenticated user attempts
     * an action they do not have permission to perform (e.g. a USER trying to approve
     * a booking, or editing another user's ticket).
     *
     * @param ex      the exception carrying the error message
     * @param request the current HTTP request
     * @return 403 Forbidden with a structured error body
     */
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(
            ForbiddenException ex, HttpServletRequest request) {

        log.warn("ForbiddenException on [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage(), request);
    }

    /**
     * Handles {@link ConflictException} — thrown when an operation would violate a
     * uniqueness constraint (e.g. duplicate email on registration, overlapping booking
     * for the same resource and time slot).
     *
     * @param ex      the exception carrying the error message
     * @param request the current HTTP request
     * @return 409 Conflict with a structured error body
     */
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(
            ConflictException ex, HttpServletRequest request) {

        log.warn("ConflictException on [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    // =========================================================================
    // Spring framework exceptions
    // =========================================================================

    /**
     * Handles {@link MethodArgumentNotValidException} — thrown by Spring when a
     * request body fails {@code @Valid} / {@code @Validated} bean validation
     * (e.g. a required field is blank, an email is malformed, a number is out of range).
     *
     * <p>Extracts all field-level violations and returns them in a {@code "fieldErrors"}
     * map so the frontend can highlight the specific form fields that failed.
     *
     * @param ex      the validation exception containing all constraint violations
     * @param request the current HTTP request
     * @return 400 Bad Request with a structured error body including per-field errors
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        // Collect all field-level violations into a map: fieldName → errorMessage
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            // If a field has multiple violations, keep the last one (or use putIfAbsent to keep the first)
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        log.warn("Validation failed on [{}]: {} field error(s) — {}",
                request.getRequestURI(), fieldErrors.size(), fieldErrors);

        // Build the standard error body and append the fieldErrors map
        Map<String, Object> body = buildErrorBody(
                HttpStatus.BAD_REQUEST,
                "Validation failed. See 'fieldErrors' for details.",
                request
        );
        body.put(KEY_FIELD_ERRORS, fieldErrors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // =========================================================================
    // Generic fallback
    // =========================================================================

    /**
     * Catches any unhandled {@link Exception} that is not matched by a more
     * specific handler above. Acts as a safety net to prevent raw Java stack
     * traces from leaking to the client.
     *
     * <p>The full stack trace is logged at ERROR level for debugging, but the
     * client only receives a generic "Internal Server Error" message to avoid
     * exposing internal implementation details.
     *
     * @param ex      the unexpected exception
     * @param request the current HTTP request
     * @return 500 Internal Server Error with a generic error body
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(
            Exception ex, HttpServletRequest request) {

        // Log the full stack trace so developers can diagnose the root cause
        log.error("Unhandled exception on [{}]: {}", request.getRequestURI(), ex.getMessage(), ex);

        return buildErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please try again later.",
                request
        );
    }

    // =========================================================================
    // Shared response builders
    // =========================================================================

    /**
     * Builds a {@link ResponseEntity} with the standard error response body.
     *
     * @param status  the HTTP status code to return
     * @param message the human-readable error message for the client
     * @param request the current HTTP request (provides the path for the body)
     * @return a {@link ResponseEntity} with the error body and the given status
     */
    private ResponseEntity<Map<String, Object>> buildErrorResponse(
            HttpStatus status, String message, HttpServletRequest request) {

        return ResponseEntity
                .status(status)
                .body(buildErrorBody(status, message, request));
    }

    /**
     * Constructs the standard error response body as a mutable {@link Map}.
     *
     * <p>Returning a mutable map allows callers (e.g. the validation handler)
     * to add extra keys (like {@code "fieldErrors"}) before sending the response.
     *
     * @param status  the HTTP status (provides both the numeric code and reason phrase)
     * @param message the human-readable error description
     * @param request the current HTTP request (used to extract the URI path)
     * @return a mutable {@link Map} containing the standard error fields
     */
    private Map<String, Object> buildErrorBody(
            HttpStatus status, String message, HttpServletRequest request) {

        Map<String, Object> body = new HashMap<>();
        body.put(KEY_STATUS,    status.value());            // numeric code e.g. 404
        body.put(KEY_ERROR,     status.getReasonPhrase()); // text e.g. "Not Found"
        body.put(KEY_MESSAGE,   message);                   // developer/user message
        body.put(KEY_TIMESTAMP, LocalDateTime.now());       // ISO-8601 timestamp
        body.put(KEY_PATH,      request.getRequestURI());   // full request path
        return body;
    }
}
