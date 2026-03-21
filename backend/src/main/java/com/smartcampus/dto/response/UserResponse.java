package com.smartcampus.dto.response;

import com.smartcampus.entity.User;
import com.smartcampus.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Read-only DTO representing a user profile in API responses.
 *
 * <p>Exposes only the fields safe for client consumption — the {@code passwordHash}
 * and audit columns ({@code deletedAt}, {@code updatedAt}) are deliberately excluded.
 *
 * <p>Use the static {@link #from(User)} factory to convert a {@link User} entity
 * to this DTO rather than constructing it field-by-field at every call site.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     AuthResponse
 * @see     com.smartcampus.entity.User
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    /** Surrogate primary key of the user account. */
    private UUID id;

    /** Unique email address — also serves as the authentication username. */
    private String email;

    /**
     * Display name of the user. Mapped from {@link User#getName()} — the entity
     * field is named {@code name} to match the database column, but the API
     * surface uses the more descriptive {@code fullName}.
     */
    private String fullName;

    /** Access-control role assigned to the user (USER, ADMIN, or TECHNICIAN). */
    private UserRole role;

    /**
     * URL of the user's profile picture, sourced from Cloudinary or an OAuth provider.
     * {@code null} if the user has not set a profile picture.
     */
    private String profilePicture;

    /**
     * Whether the account is enabled. {@code false} means an administrator has
     * deactivated the account — the user can no longer authenticate.
     */
    private Boolean isActive;

    /** UTC timestamp of account creation. Never changes after the row is inserted. */
    private LocalDateTime createdAt;

    // =========================================================================
    // Factory
    // =========================================================================

    /**
     * Converts a {@link User} JPA entity to a {@link UserResponse} DTO.
     *
     * <p>Centralising the mapping here prevents duplication across service methods
     * and ensures new fields only need to be added in one place.
     *
     * @param user the entity to convert; must not be {@code null}
     * @return a populated {@link UserResponse} DTO
     */
    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getName())          // entity field is "name", DTO field is "fullName"
                .role(user.getRole())
                .profilePicture(user.getProfilePicture())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
