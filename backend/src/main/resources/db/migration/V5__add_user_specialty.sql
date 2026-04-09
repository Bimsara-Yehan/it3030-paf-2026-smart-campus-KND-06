-- V5: Add technician specialization field to support category-based assignment.
-- Each TECHNICIAN can specialize in one ticket category (IT_SUPPORT, MAINTENANCE, CLEANING, SECURITY, OTHER).
-- Non-technician users (USER, ADMIN) will have NULL specialty.

-- Step 1: Add specialty column to users table
ALTER TABLE users ADD COLUMN specialty VARCHAR(20) NULL;

-- Step 2: Add constraint to ensure specialty matches valid TicketCategory enum values
ALTER TABLE users ADD CONSTRAINT chk_users_specialty 
    CHECK (specialty IS NULL OR specialty IN ('IT_SUPPORT', 'MAINTENANCE', 'CLEANING', 'SECURITY', 'OTHER'));

-- Step 3: Add index for faster filtering by specialty (common in technician assignment queries)
CREATE INDEX idx_users_role_specialty ON users(role, specialty) WHERE deleted_at IS NULL;
