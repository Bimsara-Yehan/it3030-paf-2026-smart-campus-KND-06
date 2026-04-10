-- =============================================================================
-- V3__update_ticket_schema.sql
-- Smart Campus Operations Hub
--
-- Description: 
--  1. Adds the missing 'title' column to the 'tickets' table.
--  2. Updates 'category' and 'priority' check constraints to include 
--     values required for Module C implementation.
-- =============================================================================

-- 1. Add title column with a temporary default, then remove the default
ALTER TABLE tickets ADD COLUMN title VARCHAR(100) NOT NULL DEFAULT 'Untitled Incident';
ALTER TABLE tickets ALTER COLUMN title DROP DEFAULT;

-- 2. Update category check constraint to support the new enumeration
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS chk_tickets_category;
ALTER TABLE tickets ADD CONSTRAINT chk_tickets_category 
    CHECK (category IN ('IT_SUPPORT', 'MAINTENANCE', 'CLEANING', 'SECURITY', 'OTHER', 'ELECTRICAL', 'PLUMBING', 'IT', 'EQUIPMENT', 'SAFETY'));

-- 3. Update priority check constraint to include 'CRITICAL'
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS chk_tickets_priority;
ALTER TABLE tickets ADD CONSTRAINT chk_tickets_priority 
    CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));
