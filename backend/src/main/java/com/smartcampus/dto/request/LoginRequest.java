package com.smartcampus.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request payload for the {@code POST /auth/login} endpoint.
 *
 * <p>Validated by Spring's {@code @Valid} annotation on the controller method
 * parameter. If validation fails, {@link com.smartcampus.exception.GlobalExceptionHandler}
 * returns a {@code 400 Bad Request} with per-field error details.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     com.smartcampus.controller.AuthController
 * @see     com.smartcampus.service.AuthService
 */
@Getter
@Setter
@NoArgsConstructor
public class LoginRequest {

    /**
     * The user's registered email address used as the authentication username.
     * Must be a well-formed email address (RFC 5321) and may not be blank.
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    /**
     * The user's plain-text password. Never logged or persisted — compared
     * against the BCrypt hash stored in the database by Spring Security's
     * {@link org.springframework.security.authentication.AuthenticationManager}.
     */
    @NotBlank(message = "Password is required")
    private String password;
}
