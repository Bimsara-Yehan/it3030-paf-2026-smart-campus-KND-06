-- V4: Add device tracking columns to refresh_tokens
-- Allows the active-sessions page to show which device/IP each token belongs to.
-- Both columns are nullable so existing rows are not broken.

ALTER TABLE refresh_tokens
    ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500),
    ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
