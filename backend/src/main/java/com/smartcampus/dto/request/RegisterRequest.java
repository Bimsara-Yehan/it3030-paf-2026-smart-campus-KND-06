package com.smartcampus.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request payload for the {@code POST /auth/register} endpoint.
 *
 * <p>All fields are validated before the service layer is invoked. Constraint
 * violations produce a {@code 400 Bad Request} response with a {@code "fieldErrors"}
 * map handled by {@link com.smartcampus.exception.GlobalExceptionHandler}.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     com.smartcampus.controller.AuthController
 * @see     com.smartcampus.service.AuthService
 */
@Getter
@Setter
@NoArgsConstructor
public class RegisterRequest {

    /**
     * The user's display name shown throughout the application.
     * Must be between 2 and 100 characters inclusive to match the
     * {@code users.name} column constraint ({@code VARCHAR(100)}).
     */
    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    /**
     * The email address used as the authentication username.
     * Must be unique across all users — checked by {@link com.smartcampus.service.AuthService}
     * before insertion to avoid a {@code DataIntegrityViolationException}.
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    /**
     * The desired plain-text password. BCrypt-hashed before storage.
     * Minimum 8 characters to satisfy baseline security requirements.
     */
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    private String password;
}
