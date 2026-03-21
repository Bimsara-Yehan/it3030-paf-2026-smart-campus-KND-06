package com.smartcampus.service;

import com.smartcampus.entity.Notification;
import com.smartcampus.entity.NotificationPreference;
import com.smartcampus.entity.User;
import com.smartcampus.enums.NotificationType;
import com.smartcampus.enums.UserRole;
import com.smartcampus.repository.NotificationPreferenceRepository;
import com.smartcampus.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link NotificationService}.
 *
 * <p>Tests verify the core notification delivery and state-mutation logic using
 * Mockito mocks for all repository collaborators.  No Spring context or database
 * is involved — each test runs in milliseconds.
 *
 * <p>Test coverage:
 * <ul>
 *   <li>{@link NotificationService#sendNotification(User, String, NotificationType)} —
 *       notification is persisted only when the user's preference is enabled; it is
 *       silently dropped when the preference is disabled.</li>
 *   <li>{@link NotificationService#getUnreadCount(UUID)} — delegates to the
 *       repository count query and returns the result unchanged.</li>
 *   <li>{@link NotificationService#markAsRead(UUID, UUID)} — sets {@code readAt}
 *       and persists the entity when the notification is unread.</li>
 * </ul>
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 */
@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService unit tests")
class NotificationServiceTest {

    // ── Mocked dependencies ───────────────────────────────────────────────────

    @Mock private NotificationRepository           notificationRepository;
    @Mock private NotificationPreferenceRepository preferenceRepository;

    // ── Subject under test ────────────────────────────────────────────────────

    @InjectMocks
    private NotificationService notificationService;

    // ── Test fixtures ─────────────────────────────────────────────────────────

    private UUID   userId;
    private User   user;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();

        user = User.builder()
                .id(userId)
                .name("Test Student")
                .email("student@sliit.lk")
                .role(UserRole.USER)
                .isActive(Boolean.TRUE)
                .build();
    }

    // =========================================================================
    // sendNotification()
    // =========================================================================

    @Test
    @DisplayName("sendNotification — should persist notification when the user's preference is enabled")
    void shouldSaveNotificationWhenPreferenceIsEnabled() {
        // ── Arrange ─────────────────────────────────────────────────────────
        NotificationType type = NotificationType.BOOKING_APPROVED;

        // Preference row exists and is enabled → notification must be delivered.
        NotificationPreference enabledPref = NotificationPreference.builder()
                .notificationType(type)
                .enabled(true)
                .user(user)
                .build();
        when(preferenceRepository.findByUserIdAndNotificationType(userId, type))
                .thenReturn(Optional.of(enabledPref));
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // ── Act ─────────────────────────────────────────────────────────────
        notificationService.sendNotification(user, "Your booking has been approved!", type);

        // ── Assert ──────────────────────────────────────────────────────────
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    @DisplayName("sendNotification — should silently suppress notification when the user's preference is disabled")
    void shouldNotSaveNotificationWhenPreferenceIsDisabled() {
        // ── Arrange ─────────────────────────────────────────────────────────
        NotificationType type = NotificationType.BOOKING_APPROVED;

        // Preference row exists and is explicitly disabled → notification must be dropped.
        NotificationPreference disabledPref = NotificationPreference.builder()
                .notificationType(type)
                .enabled(false)
                .user(user)
                .build();
        when(preferenceRepository.findByUserIdAndNotificationType(userId, type))
                .thenReturn(Optional.of(disabledPref));

        // ── Act ─────────────────────────────────────────────────────────────
        notificationService.sendNotification(user, "This should be suppressed.", type);

        // ── Assert ──────────────────────────────────────────────────────────
        // The service must return early — the repository must never be called.
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("sendNotification — should deliver notification when no preference row exists (absence = enabled by default)")
    void shouldSaveNotificationWhenNoPreferenceRowExists() {
        // ── Arrange ─────────────────────────────────────────────────────────
        // No preference record → isNotificationEnabled() returns true (default).
        NotificationType type = NotificationType.SYSTEM_ANNOUNCEMENT;

        when(preferenceRepository.findByUserIdAndNotificationType(userId, type))
                .thenReturn(Optional.empty());
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // ── Act ─────────────────────────────────────────────────────────────
        notificationService.sendNotification(user, "Campus-wide maintenance tonight.", type);

        // ── Assert ──────────────────────────────────────────────────────────
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    // =========================================================================
    // getUnreadCount()
    // =========================================================================

    @Test
    @DisplayName("getUnreadCount — should return the exact count from the repository")
    void shouldReturnCorrectUnreadCount() {
        // ── Arrange ─────────────────────────────────────────────────────────
        when(notificationRepository.countByUserIdAndReadAtIsNull(userId)).thenReturn(3L);

        // ── Act ─────────────────────────────────────────────────────────────
        long count = notificationService.getUnreadCount(userId);

        // ── Assert ──────────────────────────────────────────────────────────
        assertEquals(3L, count, "Unread count must equal the value returned by the repository");
        verify(notificationRepository).countByUserIdAndReadAtIsNull(userId);
    }

    @Test
    @DisplayName("getUnreadCount — should return zero when all notifications have been read")
    void shouldReturnZeroWhenAllNotificationsAreRead() {
        // ── Arrange ─────────────────────────────────────────────────────────
        when(notificationRepository.countByUserIdAndReadAtIsNull(userId)).thenReturn(0L);

        // ── Act ─────────────────────────────────────────────────────────────
        long count = notificationService.getUnreadCount(userId);

        // ── Assert ──────────────────────────────────────────────────────────
        assertEquals(0L, count);
    }

    // =========================================================================
    // markAsRead()
    // =========================================================================

    @Test
    @DisplayName("markAsRead — should set readAt timestamp and persist the notification")
    void shouldMarkNotificationAsReadAndPersist() {
        // ── Arrange ─────────────────────────────────────────────────────────
        UUID notificationId = UUID.randomUUID();

        // Build an unread notification owned by the test user.
        // readAt is null by default (Builder does not set it), so isRead() = false.
        Notification unreadNotification = Notification.builder()
                .id(notificationId)
                .user(user)                         // ownership check in findNotificationOwnedBy
                .type(NotificationType.BOOKING_APPROVED)
                .message("Your booking was approved.")
                .build();

        when(notificationRepository.findById(notificationId))
                .thenReturn(Optional.of(unreadNotification));
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // ── Act ─────────────────────────────────────────────────────────────
        notificationService.markAsRead(notificationId, userId);

        // ── Assert ──────────────────────────────────────────────────────────
        // The readAt timestamp must have been stamped onto the entity.
        assertNotNull(unreadNotification.getReadAt(),
                "readAt must be set after markAsRead() is called");

        // The mutated entity must be flushed back to the repository.
        verify(notificationRepository, atLeastOnce()).save(unreadNotification);
    }

    @Test
    @DisplayName("markAsRead — should not call save again when the notification is already read")
    void shouldNotResaveAlreadyReadNotification() {
        // ── Arrange ─────────────────────────────────────────────────────────
        UUID notificationId = UUID.randomUUID();

        // Pre-set readAt to simulate an already-read notification.
        Notification alreadyRead = Notification.builder()
                .id(notificationId)
                .user(user)
                .type(NotificationType.TICKET_ASSIGNED)
                .message("A ticket was assigned to you.")
                .readAt(java.time.LocalDateTime.now().minusHours(1))  // already read
                .build();

        when(notificationRepository.findById(notificationId))
                .thenReturn(Optional.of(alreadyRead));

        // ── Act ─────────────────────────────────────────────────────────────
        notificationService.markAsRead(notificationId, userId);

        // ── Assert ──────────────────────────────────────────────────────────
        // save() must not be called for a notification that is already read —
        // doing so would generate a pointless UPDATE query.
        verify(notificationRepository, never()).save(any());
    }
}
