-- Migration: Create Instagram sessions table
-- Created: 2024-01-XX
-- Description: Store Instagram client sessions for persistence across server restarts

CREATE TABLE instagram_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    session_data TEXT NOT NULL, -- Encrypted JSON containing serialized Instagram client state
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Index for faster lookups
CREATE INDEX idx_instagram_sessions_user_id ON instagram_sessions(user_id);
CREATE INDEX idx_instagram_sessions_expires_at ON instagram_sessions(expires_at);
CREATE INDEX idx_instagram_sessions_active ON instagram_sessions(is_active);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_instagram_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_instagram_sessions_updated_at
    BEFORE UPDATE ON instagram_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_instagram_sessions_updated_at();