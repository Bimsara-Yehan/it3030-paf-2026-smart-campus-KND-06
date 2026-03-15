package com.smartcampus.repository;

import com.smartcampus.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for the {@link Notification} entity.
 *
 * <p>All query methods are scoped to a specific {@code userId} — users can only
 * ever see and act on their own notifications. The service layer enforces ownership
 * checks before delegating to this repository.
 *
 * <p>The database indices {@code idx_notifications_user_id},
 * {@code idx_notifications_read_at}, and {@code idx_notifications_type}
 * (defined in {@code V1__init_schema.sql}) ensure these queries remain efficient
 * even as the notifications table grows.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     Notification
 * @see     com.smartcampus.service.NotificationService
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    // =========================================================================
    // Read queries
    // =========================================================================

    /**
     * Returns all notifications for a user, ordered by creation date descending
     * (most recent first), for rendering the notification dropdown.
     *
     * @param userId the UUID of the user whose notifications to retrieve
     * @return a list of all notifications for the user; empty list if none exist
     */
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);

    /**
     * Returns all <em>unread</em> notifications for a user (i.e. where {@code read_at IS NULL}).
     *
     * <p>Used when the user opens the notification panel and wants to see only
     * what they haven't read yet. The {@code idx_notifications_read_at} composite
     * index {@code (user_id, read_at)} makes this a fast filtered scan.
     *
     * @param userId the UUID of the user whose unread notifications to retrieve
     * @return a list of unread notifications; empty list if all have been read
     */
    List<Notification> findByUserIdAndReadAtIsNull(UUID userId);

    /**
     * Returns all notifications for a user without any ordering constraint.
     *
     * <p>Provided for use cases that apply their own ordering or need all records
     * for bulk operations. Prefer {@link #findByUserIdOrderByCreatedAtDesc} for
     * the standard notification-list display.
     *
     * @param userId the UUID of the user
     * @return all notifications for the user; empty list if none exist
     */
    List<Notification> findByUserId(UUID userId);

    // =========================================================================
    // Count queries
    // =========================================================================

    /**
     * Counts the number of unread notifications for a user.
     *
     * <p>Called on every page load to populate the bell-icon badge in the top
     * navigation bar. The composite index {@code idx_notifications_read_at}
     * on {@code (user_id, read_at)} makes this an efficient index-only scan.
     *
     * @param userId the UUID of the user
     * @return the number of notifications where {@code read_at IS NULL}
     */
    long countByUserIdAndReadAtIsNull(UUID userId);
}
