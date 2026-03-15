package com.smartcampus.repository;

import com.smartcampus.entity.NotificationPreference;
import com.smartcampus.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for the {@link NotificationPreference} entity.
 *
 * <p>The preference table follows an <em>absence means enabled</em> pattern —
 * callers must not assume a missing row means disabled. Always route lookups
 * through {@link com.smartcampus.service.NotificationService#isNotificationEnabled},
 * which applies the correct defaulting logic.
 *
 * <p>The {@code UNIQUE} constraint on {@code (user_id, type)} ensures at most
 * one row per (user, type) pair, so {@link #findByUserIdAndNotificationType}
 * returns at most one result wrapped in an {@link Optional}.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     NotificationPreference
 * @see     com.smartcampus.service.NotificationService
 */
@Repository
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, UUID> {

    /**
     * Finds the preference setting for a specific user and notification type.
     *
     * <p>Returns {@link Optional#empty()} when no row exists for the given pair,
     * meaning the user has not explicitly changed the default. The caller
     * ({@link com.smartcampus.service.NotificationService#isNotificationEnabled})
     * interprets absence as <em>enabled</em>.
     *
     * @param userId             the UUID of the user
     * @param notificationType   the notification type to look up
     * @return an {@link Optional} containing the preference if the user has set one,
     *         or empty if no override exists
     */
    Optional<NotificationPreference> findByUserIdAndNotificationType(
            UUID userId, NotificationType notificationType);

    /**
     * Returns all preference rows that the user has explicitly configured.
     *
     * <p>Used by the preferences endpoint ({@code GET /notifications/preferences})
     * to return the user's current settings. Types not present in the returned
     * list are implicitly enabled (the frontend should show them as toggled on).
     *
     * @param userId the UUID of the user
     * @return all preference rows for the user; empty list if the user has not
     *         changed any defaults
     */
    List<NotificationPreference> findByUserId(UUID userId);
}
