package com.smartcampus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Request body for {@code PATCH /users/profile}.
 *
 * <p>Only {@code fullName} is user-editable. Email is immutable and role
 * changes are admin-only operations on a separate endpoint.
 */
@Getter
@NoArgsConstructor
public class UpdateProfileRequest {

    @NotBlank(message = "Full name is required.")
    @Size(max = 100, message = "Full name must not exceed 100 characters.")
    private String fullName;
}
