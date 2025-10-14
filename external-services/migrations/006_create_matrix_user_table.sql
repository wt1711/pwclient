-- Migration: Create matrix_user table
-- Created: 2025-01-XX
-- Description: Create new matrix_user table to store Matrix user information and Instagram connection status

CREATE TABLE IF NOT EXISTS matrix_user (
    id VARCHAR(255) PRIMARY KEY,
    home_server VARCHAR(255) NOT NULL,
    matrix_user_id VARCHAR(255) NOT NULL UNIQUE,
    is_instagram_connected BOOLEAN DEFAULT false,
    meta_bot_room_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matrix_user_home_server ON matrix_user(home_server);
CREATE INDEX IF NOT EXISTS idx_matrix_user_matrix_user_id ON matrix_user(matrix_user_id);
CREATE INDEX IF NOT EXISTS idx_matrix_user_instagram_connected ON matrix_user(is_instagram_connected);
CREATE INDEX IF NOT EXISTS idx_matrix_user_meta_bot_room_id ON matrix_user(meta_bot_room_id);

-- Add comments for documentation
COMMENT ON TABLE matrix_user IS 'Stores Matrix user information and Instagram connection status';
COMMENT ON COLUMN matrix_user.id IS 'Unique identifier for the user';
COMMENT ON COLUMN matrix_user.home_server IS 'Matrix homeserver host (e.g., matrix.org)';
COMMENT ON COLUMN matrix_user.matrix_user_id IS 'Full Matrix user ID (e.g., @user:matrix.org)';
COMMENT ON COLUMN matrix_user.is_instagram_connected IS 'Whether the user has connected their Instagram account';
COMMENT ON COLUMN matrix_user.meta_bot_room_id IS 'Room ID for Meta bot interactions';

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_matrix_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_matrix_user_updated_at
    BEFORE UPDATE ON matrix_user
    FOR EACH ROW
    EXECUTE FUNCTION update_matrix_user_updated_at();