-- V6: Seed technicians with specializations for category-based ticket assignment.
-- Each technician specializes in one TicketCategory.
-- This allows admins to assign tickets only to qualified technicians.

-- Update the existing "Tech Support" technician to IT_SUPPORT specialty
UPDATE users 
SET specialty = 'IT_SUPPORT'
WHERE id = '00000000-0000-0000-0000-000000000002' AND role = 'TECHNICIAN';

-- Add new technicians for other categories
INSERT INTO users (id, name, email, password_hash, role, specialty, is_active, created_at, updated_at)
VALUES
    -- Maintenance specialist
    (
        '00000000-0000-0000-0000-000000000005',
        'Maintenance Team',
        'maintenance@smartcampus.com',
        '$2a$10$zR0YViEQSlK7c1jUutapAOJHblqCYOh41x/3o6bevx.t9uy6bZC62',
        'TECHNICIAN',
        'MAINTENANCE',
        TRUE,
        NOW(),
        NOW()
    ),
    -- Cleaning specialist
    (
        '00000000-0000-0000-0000-000000000006',
        'Cleaning Team',
        'cleaning@smartcampus.com',
        '$2a$10$zR0YViEQSlK7c1jUutapAOJHblqCYOh41x/3o6bevx.t9uy6bZC62',
        'TECHNICIAN',
        'CLEANING',
        TRUE,
        NOW(),
        NOW()
    ),
    -- Security specialist
    (
        '00000000-0000-0000-0000-000000000007',
        'Security Team',
        'security@smartcampus.com',
        '$2a$10$zR0YViEQSlK7c1jUutapAOJHblqCYOh41x/3o6bevx.t9uy6bZC62',
        'TECHNICIAN',
        'SECURITY',
        TRUE,
        NOW(),
        NOW()
    ),
    -- General technician (OTHER category)
    (
        '00000000-0000-0000-0000-000000000008',
        'General Services',
        'general@smartcampus.com',
        '$2a$10$zR0YViEQSlK7c1jUutapAOJHblqCYOh41x/3o6bevx.t9uy6bZC62',
        'TECHNICIAN',
        'OTHER',
        TRUE,
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO NOTHING;
