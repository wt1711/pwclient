#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

function getNextMigrationNumber() {
  try {
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const match = file.match(/^(\d{3})_/);
        return match ? parseInt(match[1]) : 0;
      })
      .sort((a, b) => b - a);
    
    return files.length > 0 ? files[0] + 1 : 1;
  } catch (error) {
    // If migrations directory doesn't exist, start with 001
    return 1;
  }
}

function formatMigrationNumber(num) {
  return num.toString().padStart(3, '0');
}

function sanitizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function createMigrationTemplate(name, description = '') {
  const timestamp = new Date().toISOString().split('T')[0];
  
  return `-- Migration: ${name}
-- Created: ${timestamp}
${description ? `-- Description: ${description}` : ''}

-- Add your migration SQL here
-- Example:
-- CREATE TABLE IF NOT EXISTS example_table (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Remember to:
-- 1. Use IF NOT EXISTS for CREATE TABLE statements
-- 2. Use IF EXISTS for DROP statements
-- 3. Consider data migration if changing existing tables
-- 4. Test your migration on a copy of production data
`;
}

function createRollbackTemplate(name, description = '') {
  const timestamp = new Date().toISOString().split('T')[0];
  
  return `-- Rollback Migration: ${name}
-- Created: ${timestamp}
${description ? `-- Description: Rollback for ${description}` : ''}

-- Add your rollback SQL here
-- This should undo the changes made in the corresponding migration
-- Example:
-- DROP TABLE IF EXISTS example_table;

-- Remember to:
-- 1. Test rollback on a copy of production data
-- 2. Consider data loss implications
-- 3. Use IF EXISTS for DROP statements
`;
}

async function createMigration(name, description = '', withRollback = false) {
  if (!name) {
    console.error('❌ Migration name is required');
    process.exit(1);
  }

  // Ensure migrations directory exists
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    console.log('📁 Created migrations directory');
  }

  const migrationNumber = getNextMigrationNumber();
  const formattedNumber = formatMigrationNumber(migrationNumber);
  const sanitizedName = sanitizeName(name);
  
  const migrationFilename = `${formattedNumber}_${sanitizedName}.sql`;
  const migrationPath = path.join(MIGRATIONS_DIR, migrationFilename);
  
  // Create migration file
  const migrationContent = createMigrationTemplate(name, description);
  fs.writeFileSync(migrationPath, migrationContent);
  
  console.log(`✅ Created migration: ${migrationFilename}`);
  
  // Create rollback file if requested
  if (withRollback) {
    const rollbackFilename = `${formattedNumber}_${sanitizedName}.rollback.sql`;
    const rollbackPath = path.join(MIGRATIONS_DIR, rollbackFilename);
    const rollbackContent = createRollbackTemplate(name, description);
    
    fs.writeFileSync(rollbackPath, rollbackContent);
    console.log(`✅ Created rollback: ${rollbackFilename}`);
  }
  
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Edit ${migrationFilename} to add your SQL changes`);
  if (withRollback) {
    console.log(`   2. Edit ${rollbackFilename} to add rollback SQL`);
  }
  console.log(`   3. Run: npm run migrate:up`);
  console.log(`   4. Test your changes`);
}

// CLI Interface
function showUsage() {
  console.log(`
Usage: node create-migration.js <name> [options]

Arguments:
  name              Migration name (required)

Options:
  --description, -d  Migration description
  --rollback, -r     Create rollback file
  --help, -h         Show this help

Examples:
  node create-migration.js "add user table"
  node create-migration.js "add user table" --description "Create users table with basic fields"
  node create-migration.js "add user table" --rollback
  node create-migration.js "add user table" -d "Create users table" -r
  `);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    return;
  }
  
  const name = args[0];
  let description = '';
  let withRollback = false;
  
  // Parse options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--description' || arg === '-d') {
      description = args[i + 1] || '';
      i++; // Skip next argument
    } else if (arg === '--rollback' || arg === '-r') {
      withRollback = true;
    }
  }
  
  try {
    await createMigration(name, description, withRollback);
  } catch (error) {
    console.error('❌ Failed to create migration:', error.message);
    process.exit(1);
  }
}

// Check if this module is being run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { createMigration };