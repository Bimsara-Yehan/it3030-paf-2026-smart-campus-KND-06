-- =============================================================================
-- V7__password_reset_tokens.sql
-- Smart Campus Operations Hub
-- IT3030 PAF 2026 | SLIIT
--
-- Description : Adds the password_reset_tokens table used by the
--               POST /auth/forgot-password → POST /auth/reset-password flow.
--               Tokens expire after 15 minutes and are single-use.
--               Uses IF NOT EXISTS guards because this table was previously
--               created on the shared DB under migration V3 on another branch.
-- =============================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP   NOT NULL,
    used_at    TIMESTAMP,                          -- NULL until the token is consumed
    created_at TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_password_reset_token UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_prt_token   ON password_reset_tokens (token);
CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens (user_id);
