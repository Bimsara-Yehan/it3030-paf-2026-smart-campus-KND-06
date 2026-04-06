package com.smartcampus.dto.response;

import com.smartcampus.entity.NotificationPreference;
import com.smartcampus.enums.NotificationType;
import lombok.Builder;
import lombok.Getter;

/**
 * Immutable DTO representing a single user notification preference.
 *
 * <p>This class exists specifically to decouple the HTTP response from the
 * {@link NotificationPreference} JPA entity. Returning the entity directly causes
 * Jackson to attempt serialization of the lazily-loaded {@code User} Hibernate proxy
 * ({@code ByteBuddyInterceptor}), which fails with a type-definition error.
 *
 * <p>Only the two fields the frontend needs are exposed — {@code notificationType}
 * and {@code enabled}. The owning {@code User} relationship is intentionally omitted.
 *
 * <p>Usage (from service):
 * <pre>{@code
 *   List<NotificationPreferenceResponse> dtos = preferences.stream()
 *       .map(NotificationPreferenceResponse::from)
 *       .collect(Collectors.toList());
 * }</pre>
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     NotificationPreference
 */
@Getter
@Builder
public class NotificationPreferenceResponse {

    /**
     * The notification type this preference applies to.
     * Matches the enum values in {@link NotificationType}.
     */
    private final NotificationType notificationType;

    /**
     * Whether the user has this notification type enabled.
     * {@code true} = will receive; {@code false} = opted out.
     */
    private final boolean enabled;

    /**
     * Factory method — creates a response DTO from a JPA entity.
     *
     * <p>Reads only the primitive/enum fields; never touches the lazy
     * {@code User} association, so this is safe to call outside a transaction.
     *
     * @param entity the {@link NotificationPreference} entity to map
     * @return a new {@code NotificationPreferenceResponse}
     */
    public static NotificationPreferenceResponse from(NotificationPreference entity) {
        return NotificationPreferenceResponse.builder()
                .notificationType(entity.getNotificationType())
                .enabled(entity.isEnabled())
                .build();
    }
}
