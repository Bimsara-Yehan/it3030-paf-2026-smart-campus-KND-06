package com.smartcampus.service;

import com.smartcampus.dto.response.NotificationResponse;
import com.smartcampus.entity.Notification;
import com.smartcampus.entity.NotificationPreference;
import com.smartcampus.entity.User;
import com.smartcampus.enums.NotificationType;
import com.smartcampus.exception.ForbiddenException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.repository.NotificationPreferenceRepository;
import com.smartcampus.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Shared service for all notification operations in the Smart Campus system.
 *
 * <p>This service acts as the <strong>single entry point</strong> for creating
 * notifications. Other modules (Booking, Ticket) call
 * {@link #sendNotification(User, String, NotificationType)} or its overloaded
 * variant to deliver notifications — they never write to the
 * {@code notifications} table directly.
 *
 * <p>Before persisting any notification, this service checks the recipient's
 * preferences via {@link #isNotificationEnabled}. If the user has opted out of
 * the given type, the notification is silently dropped.
 *
 * <p>All methods that mutate state are annotated with {@link Transactional}.
 * Read-only methods use {@link Transactional#readOnly()} for potential
 * database-level read optimisations (connection pool, read replicas).
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     com.smartcampus.controller.NotificationController
 * @see     NotificationRepository
 * @see     NotificationPreferenceRepository
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository           notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;

    // =========================================================================
    // Public API for other modules — sendNotification
    // =========================================================================

    /**
     * Creates and persists a notification for a user if the user has not
     * opted out of the given type.
     *
     * <p>This is the primary method called by other modules. It checks preferences
     * before saving — no notification is created if the user has disabled this type.
     *
     * @param user    the recipient of the notification
     * @param message the notification body text shown to the user
     * @param type    the notification type, used for filtering and display
     */
    @Transactional
    public void sendNotification(User user, String message, NotificationType type) {
        sendNotification(user, message, type, null, null);
    }

    /**
     * Creates and persists a notification with a deep-link reference to a
     * related entity (booking or ticket).
     *
     * <p>The {@code relatedEntityType} and {@code relatedEntityId} values allow
     * the frontend to build a navigation URL so the user lands on the relevant
     * resource when clicking the notification.
     *
     * @param user                the recipient of the notification
     * @param message             the notification body text shown to the user
     * @param type                the notification type, used for filtering and display
     * @param relatedEntityType   {@code "BOOKING"} or {@code "TICKET"}, or {@code null}
     * @param relatedEntityId     UUID of the related booking or ticket, or {@code null}
     */
    @Transactional
    public void sendNotification(User user, String message, NotificationType type,
                                 String relatedEntityType, UUID relatedEntityId) {

        // Check the user's preferences before creating the notification.
        // If the user has opted out, silently drop — no error, no log at warn level.
        if (!isNotificationEnabled(user.getId(), type)) {
            log.debug("Notification of type {} suppressed for user {} (preference disabled)",
                    type, user.getId());
            return;
        }

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .message(message)
                .relatedEntityType(relatedEntityType)
                .relatedEntityId(relatedEntityId)
                .build();

        notificationRepository.save(notification);
        log.debug("Notification [{}] created for user {}", type, user.getId());
    }

    // =========================================================================
    // Notification retrieval
    // =========================================================================

    /**
     * Returns all notifications for the given user, ordered most-recent-first.
     *
     * @param userId the UUID of the user
     * @return a list of {@link NotificationResponse} DTOs, empty if none exist
     */
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsForUser(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Returns the number of unread notifications for the given user.
     *
     * <p>Used to populate the bell-icon badge count in the navigation bar.
     * The underlying query hits the composite index {@code idx_notifications_read_at}
     * for an efficient count without a table scan.
     *
     * @param userId the UUID of the user
     * @return the count of notifications where {@code read_at IS NULL}
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadAtIsNull(userId);
    }

    // =========================================================================
    // Notification mutation
    // =========================================================================

    /**
     * Marks a single notification as read by setting its {@code readAt} timestamp.
     *
     * <p>The {@code userId} parameter enforces ownership — a user can only mark
     * their own notifications as read. If the notification belongs to a different
     * user a {@link ForbiddenException} is thrown.
     *
     * @param notificationId the UUID of the notification to mark as read
     * @param userId         the UUID of the currently authenticated user (ownership check)
     * @throws ResourceNotFoundException if no notification with the given ID exists
     * @throws ForbiddenException        if the notification does not belong to the user
     */
    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        Notification notification = findNotificationOwnedBy(notificationId, userId);

        if (!notification.isRead()) {
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
            log.debug("Notification {} marked as read for user {}", notificationId, userId);
        }
    }

    /**
     * Marks all unread notifications for the given user as read in a single operation.
     *
     * <p>Sets {@code read_at} to the current timestamp on every notification where
     * {@code read_at IS NULL}. Ideal for "Mark all as read" button in the UI.
     *
     * @param userId the UUID of the user whose notifications to mark as read
     */
    @Transactional
    public void markAllAsRead(UUID userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadAtIsNull(userId);
        if (unread.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        unread.forEach(n -> n.setReadAt(now));
        notificationRepository.saveAll(unread);

        log.debug("Marked {} notifications as read for user {}", unread.size(), userId);
    }

    /**
     * Permanently deletes a notification.
     *
     * <p>Notifications are hard-deleted (no soft-delete on this table). The
     * {@code userId} parameter enforces ownership before deletion.
     *
     * @param notificationId the UUID of the notification to delete
     * @param userId         the UUID of the currently authenticated user (ownership check)
     * @throws ResourceNotFoundException if no notification with the given ID exists
     * @throws ForbiddenException        if the notification does not belong to the user
     */
    @Transactional
    public void deleteNotification(UUID notificationId, UUID userId) {
        Notification notification = findNotificationOwnedBy(notificationId, userId);
        notificationRepository.delete(notification);
        log.debug("Notification {} deleted by user {}", notificationId, userId);
    }

    // =========================================================================
    // Preferences
    // =========================================================================

    /**
     * Returns all explicitly configured notification preferences for the given user.
     *
     * <p>Types not present in the returned list are implicitly enabled
     * (absence of a row = preference is enabled by default). The frontend
     * should render missing types as toggled on.
     *
     * @param userId the UUID of the user
     * @return a list of {@link NotificationPreference} entities; may be empty
     *         if the user has not changed any defaults
     */
    @Transactional(readOnly = true)
    public List<NotificationPreference> getPreferences(UUID userId) {
        return preferenceRepository.findByUserId(userId);
    }

    /**
     * Creates or updates a user's preference for a specific notification type.
     *
     * <p>If a preference row already exists for the (user, type) pair it is
     * updated in place. If no row exists a new one is created. This upsert
     * pattern avoids unique-constraint violations on concurrent requests.
     *
     * @param userId  the UUID of the user updating their preference
     * @param type    the notification type to configure
     * @param enabled {@code true} to receive this notification type; {@code false} to opt out
     */
    @Transactional
    public void updatePreference(UUID userId, NotificationType type, boolean enabled) {
        NotificationPreference preference = preferenceRepository
                .findByUserIdAndNotificationType(userId, type)
                .orElse(null);

        if (preference == null) {
            // No existing preference — build a new entity.
            // We only have the userId here, so construct a proxy User reference.
            User userRef = new User();
            userRef.setId(userId);

            preference = NotificationPreference.builder()
                    .user(userRef)
                    .notificationType(type)
                    .enabled(enabled)
                    .build();
        } else {
            preference.setEnabled(enabled);
        }

        preferenceRepository.save(preference);
        log.debug("Preference [{} = {}] updated for user {}", type, enabled, userId);
    }

    /**
     * Checks whether the user has enabled a specific notification type.
     *
     * <p>Implements the <em>absence means enabled</em> rule: if no preference row
     * exists for the given (user, type) pair, this method returns {@code true}.
     * Only explicit opt-outs ({@code enabled = false}) suppress delivery.
     *
     * <p>This method is called inside {@link #sendNotification} before every
     * notification insert. It should remain fast — it hits the {@code UNIQUE}
     * index on {@code (user_id, type)} for an O(1) lookup.
     *
     * @param userId the UUID of the user to check
     * @param type   the notification type to check
     * @return {@code true} if the user wants this notification (or has no explicit preference);
     *         {@code false} only if the user has explicitly disabled this type
     */
    @Transactional(readOnly = true)
    public boolean isNotificationEnabled(UUID userId, NotificationType type) {
        return preferenceRepository
                .findByUserIdAndNotificationType(userId, type)
                .map(NotificationPreference::isEnabled)
                .orElse(true);   // default: enabled when no preference row exists
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    /**
     * Loads a notification by ID and verifies it belongs to the given user.
     *
     * @param notificationId the UUID of the notification
     * @param userId         the UUID of the expected owner
     * @return the {@link Notification} entity
     * @throws ResourceNotFoundException if the notification does not exist
     * @throws ForbiddenException        if the notification belongs to a different user
     */
    private Notification findNotificationOwnedBy(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found: " + notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to access this notification.");
        }

        return notification;
    }
}
