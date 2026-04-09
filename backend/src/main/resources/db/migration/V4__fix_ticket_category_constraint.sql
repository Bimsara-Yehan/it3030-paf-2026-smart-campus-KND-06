-- V4: Synchronize ticket category constraint with Java enum TicketCategory.
-- The previous V3 migration used placeholder categories (ELECTRICAL, PLUMBING) 
-- instead of the actual categories used in the code (IT_SUPPORT, MAINTENANCE, etc.).

-- Step 1: Drop the stale constraint
ALTER TABLE tickets DROP CONSTRAINT chk_tickets_category;

-- Step 2: Add the correct constraint matching TicketCategory.java
ALTER TABLE tickets ADD CONSTRAINT chk_tickets_category 
    CHECK (category IN ('IT_SUPPORT', 'MAINTENANCE', 'CLEANING', 'SECURITY', 'OTHER'));

-- Note: No data migration is needed yet as no tickets have been successfully created 
-- with the old 'ELECTRICAL' style categories since the app didn't even start properly.
