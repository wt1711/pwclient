-- Migration: Remove old Instagram-related tables
-- Created: 2025-01-XX
-- Description: Remove old Instagram sessions table and related functions/triggers

-- Drop trigger first
DROP TRIGGER IF EXISTS update_instagram_sessions_updated_at ON instagram_sessions;

-- Drop function
DROP FUNCTION IF EXISTS update_instagram_sessions_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_instagram_sessions_user_id;
DROP INDEX IF EXISTS idx_instagram_sessions_expires_at;
DROP INDEX IF EXISTS idx_instagram_sessions_active;

-- Drop table
DROP TABLE IF EXISTS instagram_sessions;