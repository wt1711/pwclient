-- Migration: Create schema_migrations table for tracking applied migrations
-- This is the foundational migration that enables the migration system

CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(255) UNIQUE NOT NULL,
    filename VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);

-- Add comments for documentation
COMMENT ON TABLE schema_migrations IS 'Tracks which database migrations have been applied';
COMMENT ON COLUMN schema_migrations.version IS 'Migration version (typically the filename without extension)';
COMMENT ON COLUMN schema_migrations.filename IS 'Original migration filename';
COMMENT ON COLUMN schema_migrations.executed_at IS 'When the migration was executed';