package com.smartcampus.dto.response;

import com.smartcampus.entity.Notification;
import com.smartcampus.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Read-only DTO representing a notification in API responses.
 *
 * <p>Exposes all fields required by the frontend notification panel, including
 * the deep-link context ({@link #relatedEntityType} + {@link #relatedEntityId})
 * needed to navigate the user to the relevant resource when they click a notification.
 *
 * <p>Use the static {@link #from(Notification)} factory to convert entity instances
 * rather than constructing this DTO field-by-field at each call site.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     Notification
 * @see     com.smartcampus.service.NotificationService
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    /** Surrogate primary key of the notification record. */
    private UUID id;

    /**
     * UUID of the user who received this notification.
     * Included so the frontend can assert ownership before acting on it.
     */
    private UUID userId;

    /**
     * Classification of the notification — determines the icon, colour, and
     * which preference toggle controls delivery.
     */
    private NotificationType type;

    /** The human-readable notification body displayed to the user. */
    private String message;

    /**
     * Whether the user has read this notification.
     * Derived from {@link Notification#isRead()} — {@code true} when
     * {@code readAt} is non-null.
     */
    private boolean isRead;

    /**
     * Category of the entity this notification links to ({@code "BOOKING"} or
     * {@code "TICKET"}), used by the frontend to construct a deep-link URL.
     * {@code null} for system announcements with no specific resource context.
     */
    private String relatedEntityType;

    /**
     * UUID of the specific booking or ticket this notification refers to.
     * {@code null} when {@link #relatedEntityType} is also {@code null}.
     */
    private UUID relatedEntityId;

    /** UTC timestamp when the notification was created (immutable). */
    private LocalDateTime createdAt;

    // =========================================================================
    // Factory
    // =========================================================================

    /**
     * Converts a {@link Notification} JPA entity to a {@link NotificationResponse} DTO.
     *
     * <p>The {@code userId} is extracted from the {@code user} association — ensure
     * the association has been loaded (eagerly or within the same transaction) before
     * calling this method, or access will trigger a {@code LazyInitializationException}.
     * In practice the service layer always calls this within a {@code @Transactional}
     * context, so lazy loading resolves correctly.
     *
     * @param notification the entity to convert; must not be {@code null}
     * @return a fully populated {@link NotificationResponse}
     */
    public static NotificationResponse from(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .userId(notification.getUser().getId())
                .type(notification.getType())
                .message(notification.getMessage())
                .isRead(notification.isRead())
                .relatedEntityType(notification.getRelatedEntityType())
                .relatedEntityId(notification.getRelatedEntityId())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
