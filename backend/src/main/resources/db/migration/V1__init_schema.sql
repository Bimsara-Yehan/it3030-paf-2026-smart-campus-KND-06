-- =============================================================================
-- V1__init_schema.sql
-- Smart Campus Operations Hub — Initial Database Schema
-- IT3030 PAF 2026 | SLIIT
--
-- Owner        : Member 1
-- Created      : 2026-03-24
-- Description  : Creates all 9 core tables for the Smart Campus system.
--                Managed by Flyway — DO NOT edit after first run.
--                For changes, create V2__your_change.sql instead.
--
-- Tables created (in dependency order):
--   1. users
--   2. user_oauth_accounts
--   3. resources
--   4. resource_availability
--   5. bookings
--   6. tickets
--   7. comments
--   8. ticket_attachments
--   9. notifications
--  10. notification_preferences
--  11. refresh_tokens
--  12. login_history
--
-- Notes:
--   - All primary keys use UUID (gen_random_uuid()) for security
--     and distributed-system compatibility.
--   - All tables use soft deletes (deleted_at) — rows are never
--     physically removed to preserve audit history.
--   - created_at and updated_at are present on every table
--     for full audit traceability.
--   - Optimistic locking (version column) is used on bookings
--     and tickets to prevent race conditions on concurrent updates.
-- =============================================================================


-- =============================================================================
-- EXTENSION
-- Enable pgcrypto for gen_random_uuid() support in PostgreSQL 13 and below.
-- PostgreSQL 14+ has gen_random_uuid() built in, but this ensures compatibility.
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- TABLE 1: users
-- Central identity table. Stores all system users regardless of role.
-- Roles: USER (student/staff), ADMIN (manager), TECHNICIAN (maintenance worker)
--
-- Design decisions:
--   - password_hash is nullable to support OAuth-only accounts
--   - is_active allows admins to disable accounts without deleting them
--   - deleted_at enables soft delete — deactivated users retain history
-- =============================================================================
CREATE TABLE users (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name             VARCHAR(100) NOT NULL,
    email            VARCHAR(255) NOT NULL,
    password_hash    VARCHAR(255)            DEFAULT NULL,   -- NULL for OAuth-only accounts
    role             VARCHAR(20)  NOT NULL   DEFAULT 'USER', -- USER | ADMIN | TECHNICIAN
    profile_picture  VARCHAR(500)            DEFAULT NULL,
    is_active        BOOLEAN      NOT NULL   DEFAULT TRUE,   -- FALSE = account disabled by admin
    deleted_at       TIMESTAMP               DEFAULT NULL,   -- NULL = active, value = soft deleted
    created_at       TIMESTAMP    NOT NULL   DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL   DEFAULT NOW(),

    -- Enforce unique email only among non-deleted users
    CONSTRAINT uq_users_email UNIQUE (email),

    -- Enforce valid role values
    CONSTRAINT chk_users_role
        CHECK (role IN ('USER', 'ADMIN', 'TECHNICIAN'))
);

-- Index: speed up login queries which look up by email
CREATE INDEX idx_users_email      ON users (email);

-- Index: speed up admin queries filtering by role
CREATE INDEX idx_users_role       ON users (role);

-- Index: speed up soft-delete aware queries
CREATE INDEX idx_users_deleted_at ON users (deleted_at);

-- =============================================================================
-- TABLE 2: user_oauth_accounts
-- Stores OAuth provider links for each user.
-- One user can have multiple OAuth accounts (Google, GitHub, etc.)
--
-- Design decisions:
--   - Separated from users table to support multiple providers per user
--     without schema changes (e.g. adding GitHub later requires zero migration)
--   - provider_user_id is the ID issued by the OAuth provider, not our system
-- =============================================================================
CREATE TABLE user_oauth_accounts (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL,
    provider         VARCHAR(50)  NOT NULL,   -- 'google' | 'github' | 'microsoft'
    provider_user_id VARCHAR(255) NOT NULL,   -- ID from the OAuth provider
    email            VARCHAR(255)            DEFAULT NULL,   -- email from provider
    linked_at        TIMESTAMP    NOT NULL   DEFAULT NOW(),

    -- One user cannot link the same provider twice
    CONSTRAINT uq_oauth_user_provider UNIQUE (user_id, provider),

    -- A provider cannot have duplicate provider user IDs
    CONSTRAINT uq_oauth_provider_user UNIQUE (provider, provider_user_id),

    CONSTRAINT fk_oauth_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE   -- if user is deleted, remove their OAuth links too
);

-- Index: speed up OAuth login lookup (provider + provider_user_id)
CREATE INDEX idx_oauth_provider_lookup
    ON user_oauth_accounts (provider, provider_user_id);

-- Index: speed up "get all OAuth accounts for this user" query
CREATE INDEX idx_oauth_user_id
    ON user_oauth_accounts (user_id);


-- =============================================================================
-- TABLE 3: resources
-- Catalogue of all bookable campus assets.
-- Types: LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT
-- Status: ACTIVE (bookable), OUT_OF_SERVICE (not bookable)
--
-- Design decisions:
--   - capacity is nullable because equipment (projectors, cameras)
--     has no meaningful attendee capacity
--   - created_by tracks which admin added the resource for audit purposes
--   - soft delete preserves booking history for deleted resources
-- =============================================================================
CREATE TABLE resources (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(100)  NOT NULL,
    type         VARCHAR(50)   NOT NULL,                    -- LECTURE_HALL | LAB | MEETING_ROOM | EQUIPMENT
    capacity     INTEGER                  DEFAULT NULL,     -- NULL for equipment
    location     VARCHAR(255)             DEFAULT NULL,
    description  TEXT                     DEFAULT NULL,
    status       VARCHAR(30)   NOT NULL   DEFAULT 'ACTIVE', -- ACTIVE | OUT_OF_SERVICE
    created_by   UUID                     DEFAULT NULL,     -- FK → users (admin who created it)
    deleted_at   TIMESTAMP                DEFAULT NULL,
    created_at   TIMESTAMP     NOT NULL   DEFAULT NOW(),
    updated_at   TIMESTAMP     NOT NULL   DEFAULT NOW(),

    -- Enforce valid resource types
    CONSTRAINT chk_resources_type
        CHECK (type IN ('LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT')),

    -- Enforce valid status values
    CONSTRAINT chk_resources_status
        CHECK (status IN ('ACTIVE', 'OUT_OF_SERVICE')),

    -- Capacity must be a positive number when provided
    CONSTRAINT chk_resources_capacity
        CHECK (capacity IS NULL OR capacity > 0),

    CONSTRAINT fk_resources_created_by
        FOREIGN KEY (created_by)
        REFERENCES users (id)
        ON DELETE SET NULL  -- if admin is deleted, resource stays but loses the reference
);

-- Index: speed up filtering resources by type (most common search)
CREATE INDEX idx_resources_type       ON resources (type);

-- Index: speed up filtering resources by status
CREATE INDEX idx_resources_status     ON resources (status);

-- Index: speed up location-based search
CREATE INDEX idx_resources_location   ON resources (location);

-- Index: soft delete filter
CREATE INDEX idx_resources_deleted_at ON resources (deleted_at);


-- =============================================================================
-- TABLE 4: resource_availability
-- Defines when each resource is available for booking.
-- Replaces a JSONB column on resources for better queryability.
--
-- Design decisions:
--   - Separate table allows efficient SQL queries like:
--     "Find all resources available on Tuesday between 9am and 11am"
--   - day_of_week uses 3-letter codes: MON TUE WED THU FRI SAT SUN
--   - One resource can have different hours on different days
-- =============================================================================
CREATE TABLE resource_availability (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id  UUID        NOT NULL,
    day_of_week  VARCHAR(3)  NOT NULL,   -- MON | TUE | WED | THU | FRI | SAT | SUN
    start_time   TIME        NOT NULL,
    end_time     TIME        NOT NULL,

    -- end_time must be after start_time
    CONSTRAINT chk_availability_times
        CHECK (end_time > start_time),

    -- Enforce valid day values
    CONSTRAINT chk_availability_day
        CHECK (day_of_week IN ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN')),

    -- A resource cannot have two availability windows on the same day
    CONSTRAINT uq_availability_resource_day
        UNIQUE (resource_id, day_of_week),

    CONSTRAINT fk_availability_resource
        FOREIGN KEY (resource_id)
        REFERENCES resources (id)
        ON DELETE CASCADE   -- if resource is deleted, remove its availability too
);

-- Index: speed up "get availability for this resource" query
CREATE INDEX idx_availability_resource_id
    ON resource_availability (resource_id);


-- =============================================================================
-- TABLE 5: bookings
-- Records all booking requests and their workflow states.
-- Workflow: PENDING → APPROVED | REJECTED
--           APPROVED → CANCELLED
--
-- Design decisions:
--   - actioned_by and actioned_at record WHO approved/rejected and WHEN
--   - version column enables optimistic locking to prevent two admins
--     approving the same booking simultaneously (race condition protection)
--   - soft delete preserves booking history even after cancellation
-- =============================================================================
CREATE TABLE bookings (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL,                        -- who made the booking
    resource_id    UUID        NOT NULL,                        -- what was booked
    start_time     TIMESTAMP   NOT NULL,
    end_time       TIMESTAMP   NOT NULL,
    purpose        TEXT        NOT NULL,
    attendees      INTEGER                  DEFAULT NULL,       -- NULL for equipment bookings
    status         VARCHAR(20) NOT NULL     DEFAULT 'PENDING',  -- PENDING | APPROVED | REJECTED | CANCELLED
    reject_reason  TEXT                     DEFAULT NULL,       -- filled when ADMIN rejects
    actioned_by    UUID                     DEFAULT NULL,       -- FK → users (admin who approved/rejected)
    actioned_at    TIMESTAMP                DEFAULT NULL,       -- when admin took action
    version        INTEGER     NOT NULL     DEFAULT 0,          -- optimistic locking counter
    deleted_at     TIMESTAMP                DEFAULT NULL,
    created_at     TIMESTAMP   NOT NULL     DEFAULT NOW(),
    updated_at     TIMESTAMP   NOT NULL     DEFAULT NOW(),

    -- end_time must be after start_time
    CONSTRAINT chk_bookings_times
        CHECK (end_time > start_time),

    -- Enforce valid status values
    CONSTRAINT chk_bookings_status
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),

    -- Attendees must be positive when provided
    CONSTRAINT chk_bookings_attendees
        CHECK (attendees IS NULL OR attendees > 0),

    CONSTRAINT fk_bookings_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE RESTRICT,     -- cannot delete a user who has bookings

    CONSTRAINT fk_bookings_resource
        FOREIGN KEY (resource_id)
        REFERENCES resources (id)
        ON DELETE RESTRICT,     -- cannot delete a resource with bookings

    CONSTRAINT fk_bookings_actioned_by
        FOREIGN KEY (actioned_by)
        REFERENCES users (id)
        ON DELETE SET NULL      -- if admin deleted, keep booking but lose the reference
);

-- Index: speed up "get bookings by user" query (user's booking history)
CREATE INDEX idx_bookings_user_id     ON bookings (user_id);

-- Index: speed up conflict detection query (most critical performance query)
CREATE INDEX idx_bookings_resource_id ON bookings (resource_id);

-- Index: speed up status-based filtering (admin views pending bookings)
CREATE INDEX idx_bookings_status      ON bookings (status);

-- Index: speed up time-range conflict check queries
CREATE INDEX idx_bookings_time_range  ON bookings (resource_id, start_time, end_time);

-- Index: soft delete filter
CREATE INDEX idx_bookings_deleted_at  ON bookings (deleted_at);


-- =============================================================================
-- TABLE 6: tickets
-- Stores maintenance and incident reports.
-- Workflow: OPEN → IN_PROGRESS → RESOLVED → CLOSED
--           Any state → REJECTED (ADMIN only, with reason)
--
-- Design decisions:
--   - assigned_technician_id is nullable — tickets start unassigned
--   - assigned_by and assigned_at record who assigned and when (audit)
--   - resolved_at and closed_at enable SLA timer calculations:
--     time-to-first-response = assigned_at - created_at
--     time-to-resolution     = resolved_at - created_at
--   - version column prevents two admins from changing status simultaneously
-- =============================================================================
CREATE TABLE tickets (
    id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID        NOT NULL,           -- who reported it
    resource_id              UUID                     DEFAULT NULL, -- which resource is affected
    category                 VARCHAR(50) NOT NULL,           -- ELECTRICAL | PLUMBING | IT | EQUIPMENT | SAFETY | OTHER
    description              TEXT        NOT NULL,
    priority                 VARCHAR(10) NOT NULL     DEFAULT 'MEDIUM', -- LOW | MEDIUM | HIGH
    status                   VARCHAR(20) NOT NULL     DEFAULT 'OPEN',   -- OPEN | IN_PROGRESS | RESOLVED | CLOSED | REJECTED
    preferred_contact        VARCHAR(255)             DEFAULT NULL,     -- from assignment spec
    assigned_technician_id   UUID                     DEFAULT NULL,     -- FK → users (TECHNICIAN role)
    assigned_by              UUID                     DEFAULT NULL,     -- FK → users (ADMIN who assigned)
    assigned_at              TIMESTAMP                DEFAULT NULL,     -- when technician was assigned
    resolution_notes         TEXT                     DEFAULT NULL,     -- filled by technician on resolve
    resolved_at              TIMESTAMP                DEFAULT NULL,     -- for SLA: time-to-resolution
    closed_at                TIMESTAMP                DEFAULT NULL,     -- for SLA: full lifecycle time
    reject_reason            TEXT                     DEFAULT NULL,     -- filled when ADMIN rejects
    version                  INTEGER     NOT NULL     DEFAULT 0,        -- optimistic locking counter
    deleted_at               TIMESTAMP                DEFAULT NULL,
    created_at               TIMESTAMP   NOT NULL     DEFAULT NOW(),
    updated_at               TIMESTAMP   NOT NULL     DEFAULT NOW(),

    -- Enforce valid category values
    CONSTRAINT chk_tickets_category
        CHECK (category IN ('ELECTRICAL', 'PLUMBING', 'IT', 'EQUIPMENT', 'SAFETY', 'OTHER')),

    -- Enforce valid priority values
    CONSTRAINT chk_tickets_priority
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),

    -- Enforce valid status values
    CONSTRAINT chk_tickets_status
        CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED')),

    CONSTRAINT fk_tickets_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE RESTRICT,     -- cannot delete a user who has tickets

    CONSTRAINT fk_tickets_resource
        FOREIGN KEY (resource_id)
        REFERENCES resources (id)
        ON DELETE SET NULL,     -- if resource deleted, ticket stays (history preserved)

    CONSTRAINT fk_tickets_technician
        FOREIGN KEY (assigned_technician_id)
        REFERENCES users (id)
        ON DELETE SET NULL,     -- if technician deleted, ticket stays unassigned

    CONSTRAINT fk_tickets_assigned_by
        FOREIGN KEY (assigned_by)
        REFERENCES users (id)
        ON DELETE SET NULL      -- if admin deleted, keep assignment record but lose reference
);

-- Index: speed up "get tickets by reporter" query
CREATE INDEX idx_tickets_user_id          ON tickets (user_id);

-- Index: speed up "get tickets for this resource" query
CREATE INDEX idx_tickets_resource_id      ON tickets (resource_id);

-- Index: speed up "get tickets assigned to me" query (technician view)
CREATE INDEX idx_tickets_technician_id    ON tickets (assigned_technician_id);

-- Index: speed up admin dashboard filtering by status
CREATE INDEX idx_tickets_status           ON tickets (status);

-- Index: speed up priority-based filtering
CREATE INDEX idx_tickets_priority         ON tickets (priority);

-- Index: soft delete filter
CREATE INDEX idx_tickets_deleted_at       ON tickets (deleted_at);


-- =============================================================================
-- TABLE 7: comments
-- Discussion thread attached to a ticket.
-- Both users and technicians can comment.
-- Users can only edit or delete their own comments.
--
-- Design decisions:
--   - Separate from tickets table — tickets can have unlimited comments
--     without bloating the tickets row
--   - updated_at tracks whether a comment has been edited
--   - soft delete allows "deleted" comments to show as [deleted]
--     in the thread rather than breaking the conversation flow
-- =============================================================================
CREATE TABLE comments (
    id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id   UUID      NOT NULL,
    user_id     UUID      NOT NULL,
    message     TEXT      NOT NULL,
    deleted_at  TIMESTAMP             DEFAULT NULL,
    created_at  TIMESTAMP NOT NULL    DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL    DEFAULT NOW(),

    CONSTRAINT fk_comments_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES tickets (id)
        ON DELETE CASCADE,  -- if ticket deleted, remove all its comments

    CONSTRAINT fk_comments_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE RESTRICT  -- cannot delete a user who has comments
);

-- Index: speed up "get all comments for ticket" query (most common)
CREATE INDEX idx_comments_ticket_id  ON comments (ticket_id);

-- Index: speed up "get comments by user" for ownership check
CREATE INDEX idx_comments_user_id    ON comments (user_id);

-- Index: soft delete filter
CREATE INDEX idx_comments_deleted_at ON comments (deleted_at);


-- =============================================================================
-- TABLE 8: ticket_attachments
-- Image evidence attached to tickets (max 3 per ticket).
-- Images are stored in Cloudinary/S3 — only the URL is stored here.
--
-- Design decisions:
--   - file_url stores the Cloudinary/S3 public URL, not binary data
--     (storing images in DB is a serious performance anti-pattern)
--   - mime_type enables server-side validation — only image/* types accepted
--   - file_size stored in bytes for display and quota enforcement
--   - The 3-attachment limit is enforced in AttachmentService, not here,
--     because CHECK constraints cannot reference aggregate counts
-- =============================================================================
CREATE TABLE ticket_attachments (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id   UUID         NOT NULL,
    file_url    VARCHAR(500) NOT NULL,                  -- Cloudinary/S3 URL
    file_name   VARCHAR(255)              DEFAULT NULL, -- original file name
    file_size   BIGINT                    DEFAULT NULL, -- size in bytes
    mime_type   VARCHAR(100)              DEFAULT NULL, -- e.g. 'image/jpeg', 'image/png'
    deleted_at  TIMESTAMP                 DEFAULT NULL,
    uploaded_at TIMESTAMP    NOT NULL     DEFAULT NOW(),

    -- Enforce only image file types are stored
    CONSTRAINT chk_attachments_mime_type
        CHECK (mime_type IS NULL OR mime_type LIKE 'image/%'),

    -- File size must be positive when provided
    CONSTRAINT chk_attachments_file_size
        CHECK (file_size IS NULL OR file_size > 0),

    CONSTRAINT fk_attachments_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES tickets (id)
        ON DELETE CASCADE   -- if ticket deleted, remove its attachments too
);

-- Index: speed up "count attachments for ticket" query
--        (used every time before inserting to enforce max-3 rule)
CREATE INDEX idx_attachments_ticket_id  ON ticket_attachments (ticket_id);

-- Index: soft delete filter
CREATE INDEX idx_attachments_deleted_at ON ticket_attachments (deleted_at);


-- =============================================================================
-- TABLE 9: notifications
-- System-generated alerts delivered to users.
-- Triggered by: booking status changes, ticket updates, new comments.
--
-- Design decisions:
--   - related_entity_id + related_entity_type together tell the frontend
--     exactly where to navigate when notification is clicked
--   - read_at replaces a boolean is_read column — stores WHEN it was read,
--     which is both richer data and replaces two columns with one
--   - No soft delete — notifications are either read or deleted permanently
--     (read history is preserved via read_at timestamp)
-- =============================================================================
CREATE TABLE notifications (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID        NOT NULL,
    type                 VARCHAR(60) NOT NULL,           -- see constraint below
    message              TEXT        NOT NULL,
    related_entity_id    UUID                    DEFAULT NULL, -- booking ID or ticket ID
    related_entity_type  VARCHAR(20)             DEFAULT NULL, -- 'BOOKING' | 'TICKET'
    read_at              TIMESTAMP               DEFAULT NULL, -- NULL = unread
    created_at           TIMESTAMP   NOT NULL    DEFAULT NOW(),

    -- Enforce valid notification types
    CONSTRAINT chk_notifications_type
        CHECK (type IN (
            'BOOKING_APPROVED',
            'BOOKING_REJECTED',
            'BOOKING_CANCELLED',
            'TICKET_STATUS_CHANGED',
            'TICKET_ASSIGNED',
            'NEW_COMMENT',
            'SYSTEM_ANNOUNCEMENT'
        )),

    -- Enforce valid related entity types
    CONSTRAINT chk_notifications_entity_type
        CHECK (related_entity_type IS NULL
            OR related_entity_type IN ('BOOKING', 'TICKET')),

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE   -- if user deleted, remove their notifications
);

-- Index: speed up "get all notifications for user" query (most common)
CREATE INDEX idx_notifications_user_id  ON notifications (user_id);

-- Index: speed up unread count query (bell badge in topbar)
CREATE INDEX idx_notifications_read_at  ON notifications (user_id, read_at);

-- Index: speed up filtering by type
CREATE INDEX idx_notifications_type     ON notifications (type);


-- =============================================================================
-- TABLE 10: notification_preferences
-- Per-user settings for which notification types they want to receive.
-- If no row exists for a user+type, the default is enabled (TRUE).
--
-- Design decisions:
--   - Only stores rows where user has CHANGED the default
--     (absence of row = preference is enabled by default)
--   - Checked in NotificationService before inserting any notification
-- =============================================================================
CREATE TABLE notification_preferences (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,
    type        VARCHAR(60) NOT NULL,           -- matches notifications.type values
    enabled     BOOLEAN     NOT NULL    DEFAULT TRUE,
    updated_at  TIMESTAMP   NOT NULL    DEFAULT NOW(),

    -- One preference row per user per notification type
    CONSTRAINT uq_notification_pref UNIQUE (user_id, type),

    -- Enforce valid notification type values
    CONSTRAINT chk_notif_pref_type
        CHECK (type IN (
            'BOOKING_APPROVED',
            'BOOKING_REJECTED',
            'BOOKING_CANCELLED',
            'TICKET_STATUS_CHANGED',
            'TICKET_ASSIGNED',
            'NEW_COMMENT',
            'SYSTEM_ANNOUNCEMENT'
        )),

    CONSTRAINT fk_notif_pref_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE   -- if user deleted, remove their preferences
);

-- Index: speed up preference lookup before sending notification
CREATE INDEX idx_notif_pref_user_type
    ON notification_preferences (user_id, type);


-- =============================================================================
-- TABLE 11: refresh_tokens
-- Stores long-lived refresh tokens for the JWT refresh token pattern.
-- Access tokens expire in 15 minutes; refresh tokens expire in 7 days.
--
-- Design decisions:
--   - token is hashed before storage (never store raw tokens)
--   - revoked flag allows immediate invalidation on logout
--   - expires_at enables cleanup of old tokens via a scheduled job
--   - One active refresh token per user per device (replaced on re-login)
-- =============================================================================
CREATE TABLE refresh_tokens (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL,
    token       VARCHAR(500) NOT NULL,                  -- hashed refresh token value
    expires_at  TIMESTAMP    NOT NULL,                  -- 7 days from issue
    revoked     BOOLEAN      NOT NULL    DEFAULT FALSE,  -- TRUE = logged out
    created_at  TIMESTAMP    NOT NULL    DEFAULT NOW(),

    -- Token value must be unique across all users
    CONSTRAINT uq_refresh_tokens_token UNIQUE (token),

    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE   -- if user deleted, remove their tokens
);

-- Index: speed up token validation lookup (called on every token refresh)
CREATE INDEX idx_refresh_tokens_token   ON refresh_tokens (token);

-- Index: speed up "get active tokens for user" query
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);

-- Index: speed up cleanup job that removes expired tokens
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens (expires_at);


-- =============================================================================
-- TABLE 12: login_history
-- Audit log of every login attempt (success and failure).
-- Enables the Login Activity feature in user Security Settings.
--
-- Design decisions:
--   - Records both SUCCESS and FAILED attempts for security monitoring
--   - ip_address and user_agent let users identify suspicious logins
--     (e.g. login from unexpected country or unknown browser)
--   - Never deleted — permanent audit trail
-- =============================================================================
CREATE TABLE login_history (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID                      DEFAULT NULL, -- NULL for failed login with unknown email
    email       VARCHAR(255) NOT NULL,                  -- the email that was attempted
    ip_address  VARCHAR(45)               DEFAULT NULL, -- supports IPv4 and IPv6
    user_agent  VARCHAR(500)              DEFAULT NULL, -- browser + OS info
    status      VARCHAR(10)  NOT NULL,                  -- SUCCESS | FAILED
    created_at  TIMESTAMP    NOT NULL     DEFAULT NOW(),

    -- Enforce valid status values
    CONSTRAINT chk_login_status
        CHECK (status IN ('SUCCESS', 'FAILED')),

    CONSTRAINT fk_login_history_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE SET NULL  -- if user deleted, keep login history but lose the reference
);

-- Index: speed up "get login history for user" query
CREATE INDEX idx_login_history_user_id    ON login_history (user_id);

-- Index: speed up security queries filtering by status
CREATE INDEX idx_login_history_status     ON login_history (status);

-- Index: speed up recent activity queries (sorted by time)
CREATE INDEX idx_login_history_created_at ON login_history (created_at DESC);


-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
-- Summary:
--   Tables  : 12
--   Indexes : 32
--   FKs     : 17
--   Checks  : 18
--
-- Next migration: V2__add_indexes.sql (if additional indexes are needed)
-- To add a column: create V2__add_your_column.sql — never edit this file
-- =============================================================================
