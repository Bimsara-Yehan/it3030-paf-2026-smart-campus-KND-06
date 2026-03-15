package com.smartcampus.controller;

import com.smartcampus.dto.response.ApiResponse;
import com.smartcampus.dto.response.UserResponse;
import com.smartcampus.enums.UserRole;
import com.smartcampus.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller exposing user management and profile endpoints for the Smart Campus API.
 *
 * <p>Base path: {@code /users} (relative to the global context path {@code /api/v1}).
 * All endpoints require authentication. Admin-only endpoints are additionally
 * guarded by {@link PreAuthorize @PreAuthorize("hasRole('ADMIN')")} — non-admin
 * callers receive a {@code 403 Forbidden} response.
 *
 * <p>Method-level security is enabled globally via
 * {@code @EnableMethodSecurity} in {@link com.smartcampus.config.SecurityConfig}.
 *
 * <p>Endpoint summary:
 * <ul>
 *   <li>{@code GET    /users}             — list all users                (ADMIN only)</li>
 *   <li>{@code GET    /users/{id}}        — get one user by UUID          (ADMIN only)</li>
 *   <li>{@code PATCH  /users/{id}/role}   — change a user's role          (ADMIN only)</li>
 *   <li>{@code PATCH  /users/{id}/status} — activate/deactivate a user    (ADMIN only)</li>
 *   <li>{@code GET    /users/me}          — get own profile               (any authenticated)</li>
 * </ul>
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     UserService
 */
@Slf4j
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // =========================================================================
    // GET /users
    // =========================================================================

    /**
     * Returns a list of all active (non-deleted) user accounts.
     *
     * <p>Admin-only — used by the campus operations management screen to browse
     * and manage all registered users.
     *
     * @return {@code 200 OK} with a list of {@link UserResponse} DTOs
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        log.debug("GET /users");
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success("Users retrieved.", users));
    }

    // =========================================================================
    // GET /users/me
    // =========================================================================

    /**
     * Returns the profile of the currently authenticated user.
     *
     * <p>Available to any authenticated user regardless of role. This endpoint
     * must be declared <em>before</em> {@code GET /users/{id}} in the class to
     * prevent Spring MVC from interpreting the literal path {@code "me"} as a
     * UUID path variable.
     *
     * @return {@code 200 OK} with the authenticated user's {@link UserResponse}
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        log.debug("GET /users/me");
        UserResponse user = userService.getCurrentUserProfile();
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved.", user));
    }

    // =========================================================================
    // GET /users/{id}
    // =========================================================================

    /**
     * Returns the profile of any user by their UUID.
     *
     * <p>Admin-only. Throws {@code 404 Not Found} if the user does not exist
     * or has been soft-deleted.
     *
     * @param id the UUID of the user to retrieve
     * @return {@code 200 OK} with the {@link UserResponse} DTO for the requested user
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable UUID id) {
        log.debug("GET /users/{}", id);
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success("User retrieved.", user));
    }

    // =========================================================================
    // PATCH /users/{id}/role
    // =========================================================================

    /**
     * Changes the role of a user account.
     *
     * <p>Admin-only. Expects a JSON body with a single {@code "role"} string field
     * matching a valid {@link UserRole} enum name:
     * <pre>{@code { "role": "TECHNICIAN" }}</pre>
     *
     * <p>The role change takes effect on the user's next login — their existing
     * access token continues to carry the old role until it expires (≤ 15 min).
     *
     * @param id   the UUID of the user whose role should be changed
     * @param body a JSON object with key {@code "role"} containing the new role name
     * @return {@code 200 OK} with the updated {@link UserResponse}
     */
    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> updateRole(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {

        UserRole newRole = UserRole.valueOf(body.get("role").toUpperCase());
        log.info("PATCH /users/{}/role — newRole: {}", id, newRole);
        UserResponse updated = userService.updateUserRole(id, newRole);
        return ResponseEntity.ok(ApiResponse.success("User role updated.", updated));
    }

    // =========================================================================
    // PATCH /users/{id}/status
    // =========================================================================

    /**
     * Activates or deactivates a user account.
     *
     * <p>Admin-only. Expects a JSON body with a single {@code "active"} boolean field:
     * <pre>{@code { "active": false }}</pre>
     *
     * <p>Deactivating ({@code active: false}) prevents future logins but does not
     * delete the user's data. Use this instead of deletion to suspend accounts.
     *
     * @param id   the UUID of the user to activate or deactivate
     * @param body a JSON object with key {@code "active"} (boolean)
     * @return {@code 200 OK} with the updated {@link UserResponse}
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, Boolean> body) {

        boolean active = Boolean.TRUE.equals(body.get("active"));
        log.info("PATCH /users/{}/status — active: {}", id, active);
        UserResponse updated = userService.updateUserStatus(id, active);
        return ResponseEntity.ok(ApiResponse.success("User status updated.", updated));
    }
}
