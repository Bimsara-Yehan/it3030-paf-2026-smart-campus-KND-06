-- =============================================================================
-- V2__seed_data.sql - Smart Campus Operations Hub
-- IT3030 PAF 2026 | SLIIT
--
-- Development seed data for local testing.
-- Runs automatically on startup via Flyway.
-- ON CONFLICT DO NOTHING ensures safe restarts.
--
-- Test credentials (all passwords = "Test123"):
--   admin@smartcampus.com     -> ADMIN
--   tech@smartcampus.com      -> TECHNICIAN
--   alice@smartcampus.com     -> USER
--   bob@smartcampus.com       -> USER
--
-- BCrypt hash below = Test123 (cost factor 10)
-- =============================================================================


-- ── Users ─────────────────────────────────────────────────────────────────────

INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'Admin User',
        'admin@smartcampus.com',
        '$2a$10$zR0YViEQSlK7c1jUutapAOJHblqCYOh41x/3o6bevx.t9uy6bZC62',
        'ADMIN',
        TRUE,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'Tech Support',
        'tech@smartcampus.com',
        '$2a$10$zR0YViEQSlK7c1jUutapAOJHblqCYOh41x/3o6bevx.t9uy6bZC62',
        'TECHNICIAN',
        TRUE,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000003',
        'Alice Johnson',
        'alice@smartcampus.com',
        '$2a$10$zR0YViEQSlK7c1jUutapAOJHblqCYOh41x/3o6bevx.t9uy6bZC62',
        'USER',
        TRUE,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000004',
        'Bob Smith',
        'bob@smartcampus.com',
        '$2a$10$zR0YViEQSlK7c1jUutapAOJHblqCYOh41x/3o6bevx.t9uy6bZC62',
        'USER',
        TRUE,
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO NOTHING;


-- ── Notifications ─────────────────────────────────────────────────────────────
-- Uses only the 7 valid types from chk_notifications_type constraint:
-- BOOKING_APPROVED, BOOKING_REJECTED, BOOKING_CANCELLED,
-- TICKET_ASSIGNED, TICKET_STATUS_CHANGED, NEW_COMMENT, SYSTEM_ANNOUNCEMENT

INSERT INTO notifications (id, user_id, type, message, related_entity_type, related_entity_id, read_at, created_at)
VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000003',
        'SYSTEM_ANNOUNCEMENT',
        'Welcome to Smart Campus Hub! Your account is ready.',
        NULL,
        NULL,
        NULL,
        NOW()
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000003',
        'BOOKING_APPROVED',
        'Your booking for Room A101 on Monday 9AM has been approved.',
        'BOOKING',
        NULL,
        NULL,
        NOW()
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000003',
        'TICKET_ASSIGNED',
        'Your IT support ticket has been assigned to a technician.',
        'TICKET',
        NULL,
        NULL,
        NOW()
    ),
    (
        '10000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000004',
        'BOOKING_REJECTED',
        'Your booking for Lab B202 has been rejected. Please choose another time slot.',
        'BOOKING',
        NULL,
        NULL,
        NOW()
    ),
    (
        '10000000-0000-0000-0000-000000000005',
        '00000000-0000-0000-0000-000000000002',
        'TICKET_ASSIGNED',
        'A new IT support ticket has been assigned to you. Please review and update the status.',
        'TICKET',
        NULL,
        NULL,
        NOW()
    ),
    (
        '10000000-0000-0000-0000-000000000006',
        '00000000-0000-0000-0000-000000000001',
        'SYSTEM_ANNOUNCEMENT',
        'System maintenance scheduled for Sunday 2AM - 4AM. All services will be briefly unavailable.',
        NULL,
        NULL,
        NULL,
        NOW()
    )
ON CONFLICT (id) DO NOTHING;
