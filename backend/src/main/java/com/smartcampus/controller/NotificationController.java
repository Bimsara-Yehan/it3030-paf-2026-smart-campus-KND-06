package com.smartcampus.controller;

import com.smartcampus.dto.response.ApiResponse;
import com.smartcampus.dto.response.NotificationResponse;
import com.smartcampus.entity.NotificationPreference;
import com.smartcampus.entity.User;
import com.smartcampus.enums.NotificationType;
import com.smartcampus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller exposing all notification-related endpoints for the Smart Campus API.
 *
 * <p>Base path: {@code /notifications} (relative to the global context path {@code /api/v1}).
 * All endpoints require a valid Bearer token — this path is not listed in
 * {@link com.smartcampus.config.SecurityConfig}'s public paths.
 *
 * <p>All operations are automatically scoped to the currently authenticated user —
 * users can only read and manage their own notifications. The {@link User} principal
 * is injected via {@code @AuthenticationPrincipal} and its UUID is passed to the
 * service for ownership validation.
 *
 * <p>Endpoint summary:
 * <ul>
 *   <li>{@code GET    /notifications}                — fetch all notifications</li>
 *   <li>{@code GET    /notifications/unread-count}   — bell-badge unread count</li>
 *   <li>{@code PATCH  /notifications/{id}/read}      — mark one notification as read</li>
 *   <li>{@code PATCH  /notifications/read-all}       — mark all notifications as read</li>
 *   <li>{@code DELETE /notifications/{id}}           — permanently delete a notification</li>
 *   <li>{@code GET    /notifications/preferences}    — fetch preference settings</li>
 *   <li>{@code PUT    /notifications/preferences/{type}} — update a preference</li>
 * </ul>
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     NotificationService
 */
@Slf4j
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // =========================================================================
    // GET /notifications
    // =========================================================================

    /**
     * Returns all notifications for the currently authenticated user,
     * ordered most-recent-first.
     *
     * @param currentUser the authenticated user injected by Spring Security
     * @return {@code 200 OK} with the list of {@link NotificationResponse} DTOs
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications(
            @AuthenticationPrincipal User currentUser) {

        log.debug("GET /notifications — user: {}", currentUser.getId());
        List<NotificationResponse> notifications =
                notificationService.getNotificationsForUser(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved.", notifications));
    }

    // =========================================================================
    // GET /notifications/unread-count
    // =========================================================================

    /**
     * Returns the count of unread notifications for the current user.
     *
     * <p>Designed to be polled frequently by the frontend to update the bell-icon
     * badge. The underlying query is index-backed and very fast.
     *
     * @param currentUser the authenticated user injected by Spring Security
     * @return {@code 200 OK} with a single {@code long} count value
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @AuthenticationPrincipal User currentUser) {

        log.debug("GET /notifications/unread-count — user: {}", currentUser.getId());
        long count = notificationService.getUnreadCount(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved.", count));
    }

    // =========================================================================
    // PATCH /notifications/{id}/read
    // =========================================================================

    /**
     * Marks a single notification as read.
     *
     * <p>The service enforces that the notification belongs to the current user —
     * attempting to mark another user's notification as read returns {@code 403}.
     *
     * @param id          the UUID of the notification to mark as read
     * @param currentUser the authenticated user injected by Spring Security
     * @return {@code 200 OK} on success
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser) {

        log.debug("PATCH /notifications/{}/read — user: {}", id, currentUser.getId());
        notificationService.markAsRead(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read."));
    }

    // =========================================================================
    // PATCH /notifications/read-all
    // =========================================================================

    /**
     * Marks all unread notifications for the current user as read.
     *
     * <p>Corresponds to the "Mark all as read" button in the notification dropdown.
     *
     * @param currentUser the authenticated user injected by Spring Security
     * @return {@code 200 OK} on success
     */
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal User currentUser) {

        log.debug("PATCH /notifications/read-all — user: {}", currentUser.getId());
        notificationService.markAllAsRead(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read."));
    }

    // =========================================================================
    // DELETE /notifications/{id}
    // =========================================================================

    /**
     * Permanently deletes a notification.
     *
     * <p>Notifications are hard-deleted — there is no soft-delete on this table.
     * The service enforces ownership before deletion.
     *
     * @param id          the UUID of the notification to delete
     * @param currentUser the authenticated user injected by Spring Security
     * @return {@code 200 OK} on success
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser) {

        log.debug("DELETE /notifications/{} — user: {}", id, currentUser.getId());
        notificationService.deleteNotification(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Notification deleted."));
    }

    // =========================================================================
    // GET /notifications/preferences
    // =========================================================================

    /**
     * Returns all explicitly configured notification preferences for the current user.
     *
     * <p>Types not present in the response list are implicitly enabled — the frontend
     * should render them as toggled on by default.
     *
     * @param currentUser the authenticated user injected by Spring Security
     * @return {@code 200 OK} with a list of {@link NotificationPreference} entities
     */
    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<List<NotificationPreference>>> getPreferences(
            @AuthenticationPrincipal User currentUser) {

        log.debug("GET /notifications/preferences — user: {}", currentUser.getId());
        List<NotificationPreference> preferences =
                notificationService.getPreferences(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Preferences retrieved.", preferences));
    }

    // =========================================================================
    // PUT /notifications/preferences/{type}
    // =========================================================================

    /**
     * Creates or updates the current user's preference for a specific notification type.
     *
     * <p>Expects a JSON body with a single {@code "enabled"} boolean field:
     * <pre>{@code { "enabled": false }}</pre>
     *
     * <p>If no preference row exists for the given type it is created; if one
     * already exists it is updated in place.
     *
     * @param type        the notification type to configure (path variable, matched to enum)
     * @param body        a JSON object with key {@code "enabled"} (boolean)
     * @param currentUser the authenticated user injected by Spring Security
     * @return {@code 200 OK} on success
     */
    @PutMapping("/preferences/{type}")
    public ResponseEntity<ApiResponse<Void>> updatePreference(
            @PathVariable NotificationType type,
            @RequestBody Map<String, Boolean> body,
            @AuthenticationPrincipal User currentUser) {

        boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
        log.debug("PUT /notifications/preferences/{} = {} — user: {}", type, enabled, currentUser.getId());
        notificationService.updatePreference(currentUser.getId(), type, enabled);
        return ResponseEntity.ok(ApiResponse.success("Preference updated."));
    }
}
