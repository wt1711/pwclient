-- Migration: Add unique constraint on (home_server, matrix_user_id)
-- Created: 2025-01-XX
-- Description: Add unique constraint to ensure one record per Matrix user per homeserver

-- Remove the existing unique constraint on matrix_user_id only
ALTER TABLE matrix_user DROP CONSTRAINT IF EXISTS matrix_user_matrix_user_id_key;

-- Drop the existing index on matrix_user_id since we'll create a composite unique constraint
DROP INDEX IF EXISTS idx_matrix_user_matrix_user_id;

-- Add unique constraint on the combination of home_server and matrix_user_id
ALTER TABLE matrix_user ADD CONSTRAINT unique_matrix_user_per_homeserver 
    UNIQUE (home_server, matrix_user_id);

-- Create a new index on matrix_user_id for performance (non-unique)
CREATE INDEX IF NOT EXISTS idx_matrix_user_matrix_user_id ON matrix_user(matrix_user_id);

-- Update comment to reflect the new constraint
COMMENT ON CONSTRAINT unique_matrix_user_per_homeserver ON matrix_user IS 'Ensures one record per Matrix user per homeserver';