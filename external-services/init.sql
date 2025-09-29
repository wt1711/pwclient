-- Initialize database schema for Instagram Chat App

-- Create the instagram_user role if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'instagram_user') THEN
        CREATE ROLE instagram_user WITH LOGIN PASSWORD 'instagram_password';
    END IF;
END
$$;

-- Grant necessary permissions to the instagram_user role
GRANT CONNECT ON DATABASE instagram_chat TO instagram_user;
GRANT USAGE ON SCHEMA public TO instagram_user;
GRANT CREATE ON SCHEMA public TO instagram_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO instagram_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO instagram_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO instagram_user;

-- Grant permissions on future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO instagram_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO instagram_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO instagram_user;

-- Users table to store Instagram user information
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    instagram_user_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    profile_pic_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table to store user sessions
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    instagram_user_id VARCHAR(255) NOT NULL,
    session_data JSONB,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contacts table to store user contacts
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    contact_instagram_id VARCHAR(255) NOT NULL,
    contact_username VARCHAR(255) NOT NULL,
    contact_full_name VARCHAR(255),
    contact_profile_pic TEXT,
    last_message_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, contact_instagram_id)
);

-- Messages table to store chat messages
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    contact_instagram_id VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    is_sent BOOLEAN DEFAULT true,
    message_timestamp TIMESTAMP NOT NULL,
    instagram_message_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_contact ON messages(user_id, contact_instagram_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(message_timestamp);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();