# Database Migration Guide

This guide explains how to use the database migration system for the external services.

## Overview

The migration system provides a structured way to manage database schema changes over time. It tracks which migrations have been applied and allows you to apply new changes or rollback previous ones.

## Migration Files

Migration files are stored in the `migrations/` directory and follow this naming convention:
```
001_create_migrations_table.sql
002_create_initial_schema.sql
003_create_payments_table.sql
```

Each migration file should:
- Have a unique sequential number (001, 002, 003, etc.)
- Use descriptive names with underscores
- Contain SQL statements to modify the database schema
- Use `IF NOT EXISTS` and `IF EXISTS` clauses for safety

## Available Commands

### Run Migrations

```bash
# Run all pending migrations
npm run migrate:up

# Check migration status
npm run migrate:status
```

### Rollback Migrations

```bash
# Rollback the last migration
npm run migrate:down

# Rollback multiple migrations (e.g., last 3)
npm run migrate:down 3

# Alias for rolling back 1 migration
npm run migrate:rollback
```

### Create New Migrations

```bash
# Create a new migration
npm run migrate:create "add user preferences table"

# Create with description
npm run migrate:create "add user preferences table" --description "Add table for storing user preferences"

# Create with rollback file
npm run migrate:create "add user preferences table" --rollback

# Create with both description and rollback
npm run migrate:create "add user preferences table" -d "Add preferences table" -r
```

## Migration Best Practices

### 1. Always Use Safe SQL

```sql
-- Good: Safe operations
CREATE TABLE IF NOT EXISTS new_table (...);
ALTER TABLE existing_table ADD COLUMN IF NOT EXISTS new_column VARCHAR(255);
DROP TABLE IF EXISTS old_table;

-- Avoid: Unsafe operations without checks
CREATE TABLE new_table (...);  -- Will fail if table exists
DROP TABLE old_table;          -- Will fail if table doesn't exist
```

### 2. Handle Data Migration

When changing existing data, consider the impact:

```sql
-- Example: Adding a NOT NULL column with default value
ALTER TABLE users ADD COLUMN email VARCHAR(255);
UPDATE users SET email = 'unknown@example.com' WHERE email IS NULL;
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
```

### 3. Create Indexes for Performance

```sql
-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
```

### 4. Use Transactions

The migration runner automatically wraps each migration in a transaction, but you can also use explicit transactions for complex operations:

```sql
BEGIN;
-- Multiple related operations
ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active';
UPDATE users SET status = 'inactive' WHERE last_login < NOW() - INTERVAL '1 year';
COMMIT;
```

## Rollback Files

For complex migrations, create rollback files to safely undo changes:

```bash
# Create migration with rollback
npm run migrate:create "add complex feature" --rollback
```

This creates two files:
- `006_add_complex_feature.sql` - The migration
- `006_add_complex_feature.rollback.sql` - The rollback

## Migration Workflow

### 1. Development Workflow

```bash
# 1. Create a new migration
npm run migrate:create "add new feature"

# 2. Edit the migration file
# Add your SQL changes to migrations/XXX_add_new_feature.sql

# 3. Test the migration
npm run migrate:up

# 4. Verify the changes
npm run migrate:status

# 5. Test rollback (optional)
npm run migrate:down
npm run migrate:up
```

### 2. Production Deployment

```bash
# 1. Check current status
npm run migrate:status

# 2. Backup database (recommended)
pg_dump instagram_chat > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Run migrations
npm run migrate:up

# 4. Verify deployment
npm run migrate:status
```

## Troubleshooting

### Migration Failed

If a migration fails:

1. Check the error message in the console
2. Fix the SQL in the migration file
3. If the migration was partially applied, you may need to manually clean up
4. Run the migration again

### Rollback Issues

If rollback fails:

1. Check if a `.rollback.sql` file exists
2. Manually create the rollback SQL if needed
3. Consider manual database cleanup

### Connection Issues

If you get connection errors:

1. Ensure Docker containers are running: `docker-compose ps`
2. Check environment variables in `.env.local`
3. Test database connection: `docker exec -it instagram-chat-postgres psql -U instagram_user -d instagram_chat`

## Environment Setup

Ensure your `.env.local` file contains:

```env
# PostgreSQL Configuration
DATABASE_URL=postgresql://instagram_user:instagram_password@localhost:5432/instagram_chat
DB_HOST=localhost
DB_PORT=5432
DB_NAME=instagram_chat
DB_USER=instagram_user
DB_PASSWORD=instagram_password
```

## Migration History

The system tracks migrations in the `schema_migrations` table:

```sql
-- View migration history
SELECT * FROM schema_migrations ORDER BY executed_at;

-- Check if a specific migration was applied
SELECT * FROM schema_migrations WHERE version = '003_create_payments_table';
```

## Examples

### Example 1: Adding a New Table

```sql
-- Migration: 007_create_user_preferences.sql
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, preference_key)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
```

### Example 2: Adding a Column

```sql
-- Migration: 008_add_user_timezone.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
CREATE INDEX IF NOT EXISTS idx_users_timezone ON users(timezone);
```

### Example 3: Data Migration

```sql
-- Migration: 009_migrate_old_data.sql
-- Migrate data from old_table to new_table
INSERT INTO new_table (name, email, created_at)
SELECT old_name, old_email, old_timestamp 
FROM old_table 
WHERE migrated = false;

-- Mark as migrated
UPDATE old_table SET migrated = true WHERE migrated = false;
```

## Getting Help

If you encounter issues:

1. Check this guide for common solutions
2. Review the migration files in `migrations/` directory
3. Check the database logs: `docker-compose logs postgres`
4. Verify your environment configuration