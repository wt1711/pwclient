#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'instagram_chat',
  user: process.env.DB_USER || 'instagram_user',
  password: process.env.DB_PASSWORD || 'instagram_password',
});

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');
const MIGRATIONS_TABLE = 'schema_migrations';

class MigrationRunner {
  constructor() {
    this.pool = pool;
  }

  async ensureMigrationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        id SERIAL PRIMARY KEY,
        version VARCHAR(255) UNIQUE NOT NULL,
        filename VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    try {
      await this.pool.query(query);
      console.log('✅ Migrations table ensured');
    } catch (error) {
      console.error('❌ Error creating migrations table:', error);
      throw error;
    }
  }

  async getExecutedMigrations() {
    try {
      const result = await this.pool.query(
        `SELECT version FROM ${MIGRATIONS_TABLE} ORDER BY version`
      );
      return result.rows.map(row => row.version);
    } catch (error) {
      console.error('❌ Error fetching executed migrations:', error);
      throw error;
    }
  }

  async getMigrationFiles() {
    try {
      const files = fs.readdirSync(MIGRATIONS_DIR)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      return files.map(file => ({
        version: path.basename(file, '.sql'),
        filename: file,
        path: path.join(MIGRATIONS_DIR, file)
      }));
    } catch (error) {
      console.error('❌ Error reading migration files:', error);
      throw error;
    }
  }

  async executeMigration(migration) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Read and execute the migration file
      const sql = fs.readFileSync(migration.path, 'utf8');
      console.log(`🔄 Executing migration: ${migration.filename}`);
      
      await client.query(sql);
      
      // Record the migration as executed
      await client.query(
        `INSERT INTO ${MIGRATIONS_TABLE} (version, filename) VALUES ($1, $2)`,
        [migration.version, migration.filename]
      );
      
      await client.query('COMMIT');
      console.log(`✅ Migration completed: ${migration.filename}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Migration failed: ${migration.filename}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async rollbackMigration(migration) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if there's a rollback file
      const rollbackPath = migration.path.replace('.sql', '.rollback.sql');
      if (fs.existsSync(rollbackPath)) {
        const sql = fs.readFileSync(rollbackPath, 'utf8');
        console.log(`🔄 Rolling back migration: ${migration.filename}`);
        await client.query(sql);
      } else {
        console.log(`⚠️  No rollback file found for: ${migration.filename}`);
      }
      
      // Remove the migration record
      await client.query(
        `DELETE FROM ${MIGRATIONS_TABLE} WHERE version = $1`,
        [migration.version]
      );
      
      await client.query('COMMIT');
      console.log(`✅ Rollback completed: ${migration.filename}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Rollback failed: ${migration.filename}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async migrateUp() {
    console.log('🚀 Starting database migration...');
    
    await this.ensureMigrationsTable();
    
    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = await this.getMigrationFiles();
    
    const pendingMigrations = migrationFiles.filter(
      migration => !executedMigrations.includes(migration.version)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations found. Database is up to date.');
      return;
    }
    
    console.log(`📋 Found ${pendingMigrations.length} pending migration(s):`);
    pendingMigrations.forEach(migration => {
      console.log(`   - ${migration.filename}`);
    });
    
    for (const migration of pendingMigrations) {
      await this.executeMigration(migration);
    }
    
    console.log('🎉 All migrations completed successfully!');
  }

  async migrateDown(steps = 1) {
    console.log(`🔄 Rolling back ${steps} migration(s)...`);
    
    await this.ensureMigrationsTable();
    
    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = await this.getMigrationFiles();
    
    // Get the last N executed migrations
    const migrationsToRollback = executedMigrations
      .slice(-steps)
      .reverse()
      .map(version => migrationFiles.find(m => m.version === version))
      .filter(Boolean);
    
    if (migrationsToRollback.length === 0) {
      console.log('✅ No migrations to rollback.');
      return;
    }
    
    console.log(`📋 Rolling back ${migrationsToRollback.length} migration(s):`);
    migrationsToRollback.forEach(migration => {
      console.log(`   - ${migration.filename}`);
    });
    
    for (const migration of migrationsToRollback) {
      await this.rollbackMigration(migration);
    }
    
    console.log('🎉 Rollback completed successfully!');
  }

  async status() {
    console.log('📊 Migration Status:');
    
    await this.ensureMigrationsTable();
    
    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = await this.getMigrationFiles();
    
    console.log('\n📋 Available migrations:');
    migrationFiles.forEach(migration => {
      const status = executedMigrations.includes(migration.version) ? '✅' : '⏳';
      console.log(`   ${status} ${migration.filename}`);
    });
    
    const pendingCount = migrationFiles.length - executedMigrations.length;
    console.log(`\n📈 Summary: ${executedMigrations.length} executed, ${pendingCount} pending`);
  }

  async close() {
    await this.pool.end();
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  const runner = new MigrationRunner();
  
  try {
    switch (command) {
      case 'up':
        await runner.migrateUp();
        break;
      case 'down':
        const steps = parseInt(process.argv[3]) || 1;
        await runner.migrateDown(steps);
        break;
      case 'status':
        await runner.status();
        break;
      default:
        console.log(`
Usage: node migrate.js <command>

Commands:
  up              Run all pending migrations
  down [steps]    Rollback migrations (default: 1 step)
  status          Show migration status

Examples:
  node migrate.js up
  node migrate.js down
  node migrate.js down 2
  node migrate.js status
        `);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

// Check if this module is being run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { MigrationRunner };