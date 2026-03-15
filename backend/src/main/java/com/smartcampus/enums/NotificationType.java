package com.smartcampus.enums;

/**
 * Represents every notification type supported by the Smart Campus system.
 *
 * <p>These values map directly to the PostgreSQL {@code CHECK} constraint on the
 * {@code notifications.type} and {@code notification_preferences.type} columns
 * defined in {@code V1__init_schema.sql}. <strong>No values may be added here
 * without a corresponding Flyway migration that extends both CHECK constraints.</strong>
 *
 * <p>Type groupings:
 * <ul>
 *   <li><b>Booking events</b> — triggered when a booking changes state:
 *       {@link #BOOKING_APPROVED}, {@link #BOOKING_REJECTED}, {@link #BOOKING_CANCELLED}.</li>
 *   <li><b>Ticket events</b> — triggered by maintenance ticket lifecycle changes:
 *       {@link #TICKET_STATUS_CHANGED}, {@link #TICKET_ASSIGNED}, {@link #NEW_COMMENT}.</li>
 *   <li><b>System</b> — administrative broadcasts to all or targeted users:
 *       {@link #SYSTEM_ANNOUNCEMENT}.</li>
 * </ul>
 *
 * <p>Notification preferences are stored per user per type in the
 * {@code notification_preferences} table. When no preference row exists for a
 * given (user, type) pair, the system defaults to <em>enabled</em>.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     com.smartcampus.entity.Notification
 * @see     com.smartcampus.entity.NotificationPreference
 * @see     com.smartcampus.service.NotificationService
 */
public enum NotificationType {

    // ── Booking events ────────────────────────────────────────────────────────

    /**
     * Sent to the user who made a booking when an admin approves it.
     * The frontend should navigate to the booking detail page on click.
     */
    BOOKING_APPROVED,

    /**
     * Sent to the user who made a booking when an admin rejects it,
     * optionally including a rejection reason in the message body.
     */
    BOOKING_REJECTED,

    /**
     * Sent to the admin(s) and the booking owner when a booking is cancelled
     * by any party before the scheduled time.
     */
    BOOKING_CANCELLED,

    // ── Ticket events ─────────────────────────────────────────────────────────

    /**
     * Sent to the ticket owner and assigned technician when a ticket's
     * status changes (e.g. OPEN → IN_PROGRESS → RESOLVED).
     */
    TICKET_STATUS_CHANGED,

    /**
     * Sent to a technician when an admin assigns a maintenance ticket to them.
     * The frontend should navigate to the ticket detail page on click.
     */
    TICKET_ASSIGNED,

    /**
     * Sent to all participants on a ticket (owner + assigned technician)
     * when a new comment is added to the ticket thread.
     */
    NEW_COMMENT,

    // ── System ────────────────────────────────────────────────────────────────

    /**
     * Administrative broadcast notification sent to one or more users
     * for campus-wide announcements (e.g. scheduled maintenance, closures).
     */
    SYSTEM_ANNOUNCEMENT;
}
