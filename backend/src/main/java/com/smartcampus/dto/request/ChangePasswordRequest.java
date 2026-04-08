package com.smartcampus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Request body for {@code POST /auth/change-password}.
 *
 * <p>Requires the current password to prevent CSRF-style account takeovers
 * where an attacker with physical access to an unlocked browser changes the password.
 */
@Getter
@NoArgsConstructor
public class ChangePasswordRequest {

    @NotBlank(message = "Current password is required.")
    private String currentPassword;

    @NotBlank(message = "New password is required.")
    @Size(min = 6, message = "New password must be at least 6 characters.")
    private String newPassword;
}
