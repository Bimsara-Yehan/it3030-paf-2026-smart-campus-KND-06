package com.smartcampus.service;

import com.smartcampus.dto.response.UserResponse;
import com.smartcampus.entity.User;
import com.smartcampus.enums.UserRole;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service handling user management operations for the Smart Campus system.
 *
 * <p>Provides two categories of operations:
 * <ul>
 *   <li><b>Admin operations</b> — list all users, view any user profile, change
 *       roles, and activate/deactivate accounts. These are protected by
 *       {@code @PreAuthorize("hasRole('ADMIN')")} on the controller layer.</li>
 *   <li><b>Self-service</b> — {@link #getCurrentUserProfile()} allows any
 *       authenticated user to retrieve their own profile.</li>
 * </ul>
 *
 * <p>All soft-deleted users ({@code deletedAt IS NOT NULL}) are excluded from
 * results. Hard deletes are never performed to preserve referential integrity.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     com.smartcampus.controller.UserController
 * @see     UserRepository
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    // =========================================================================
    // Admin — read operations
    // =========================================================================

    /**
     * Returns all active (non-deleted) user accounts.
     *
     * <p>Intended for the admin user-management screen. Soft-deleted users are
     * excluded by the underlying query ({@code WHERE deleted_at IS NULL}).
     * Callers on the controller layer must be annotated with
     * {@code @PreAuthorize("hasRole('ADMIN')")} to restrict access.
     *
     * @return a list of {@link UserResponse} DTOs for all active users;
     *         empty list if no users exist
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        log.debug("Admin: fetching all active users");
        return userRepository.findAllByDeletedAtIsNull(
                        org.springframework.data.domain.Pageable.unpaged())
                .getContent()
                .stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Returns the profile of a specific user by their UUID.
     *
     * <p>Admin-only — use {@link #getCurrentUserProfile()} for the authenticated
     * user's own profile. Throws {@link ResourceNotFoundException} if the user does
     * not exist or has been soft-deleted.
     *
     * @param userId the UUID of the user to retrieve
     * @return the {@link UserResponse} DTO for the requested user
     * @throws ResourceNotFoundException if no active user with the given ID exists
     */
    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID userId) {
        log.debug("Admin: fetching user by id: {}", userId);
        User user = findActiveUserById(userId);
        return UserResponse.from(user);
    }

    // =========================================================================
    // Admin — write operations
    // =========================================================================

    /**
     * Changes the role assigned to a user account.
     *
     * <p>Allows admins to promote a regular user to {@code ADMIN} or
     * {@code TECHNICIAN}, or demote them back to {@code USER}. The change
     * takes effect on the user's next login (their existing JWT still carries
     * the old role claim until it expires in 15 minutes).
     *
     * @param userId  the UUID of the user whose role should be changed
     * @param newRole the new role to assign
     * @return the updated {@link UserResponse}
     * @throws ResourceNotFoundException if no active user with the given ID exists
     */
    @Transactional
    public UserResponse updateUserRole(UUID userId, UserRole newRole) {
        User user = findActiveUserById(userId);

        log.info("Admin: changing role of user {} from {} to {}", userId, user.getRole(), newRole);
        user.setRole(newRole);
        user = userRepository.save(user);

        return UserResponse.from(user);
    }

    /**
     * Activates or deactivates a user account.
     *
     * <p>Setting {@code active = false} prevents the user from authenticating
     * (Spring Security's {@code isEnabled()} returns {@code false}) without
     * deleting their data. The user's existing access tokens will continue to
     * function until they expire in 15 minutes; their refresh tokens remain
     * valid but new logins will be rejected immediately.
     *
     * <p>This is the correct way to suspend an account — use soft-delete
     * ({@code deletedAt}) only for complete account removal.
     *
     * @param userId the UUID of the user to activate or deactivate
     * @param active {@code true} to re-enable the account; {@code false} to deactivate it
     * @return the updated {@link UserResponse}
     * @throws ResourceNotFoundException if no active user with the given ID exists
     */
    @Transactional
    public UserResponse updateUserStatus(UUID userId, boolean active) {
        User user = findActiveUserById(userId);

        log.info("Admin: setting isActive={} for user {}", active, userId);
        user.setIsActive(active);
        user = userRepository.save(user);

        return UserResponse.from(user);
    }

    // =========================================================================
    // Self-service
    // =========================================================================

    /**
     * Returns the profile of the currently authenticated user.
     *
     * <p>Resolves the user's email from the {@link SecurityContextHolder}
     * (set by {@link com.smartcampus.security.JwtFilter}) and loads the
     * full user record from the database.
     *
     * <p>Available to any authenticated user regardless of role.
     *
     * @return the authenticated user's {@link UserResponse} profile
     * @throws UnauthorizedException     if there is no authenticated principal
     * @throws ResourceNotFoundException if the user account no longer exists
     */
    @Transactional(readOnly = true)
    public UserResponse getCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new UnauthorizedException("No authenticated user found in the security context.");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmailAndDeletedAtIsNull(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User account not found for email: " + email));

        return UserResponse.from(user);
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    /**
     * Loads an active (non-deleted) user by UUID or throws if not found.
     *
     * @param userId the UUID to look up
     * @return the {@link User} entity
     * @throws ResourceNotFoundException if no active user with the given ID exists
     */
    private User findActiveUserById(UUID userId) {
        return userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with id: " + userId));
    }
}
