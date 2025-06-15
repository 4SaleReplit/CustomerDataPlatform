#!/usr/bin/env node

/**
 * Production Database Migration Tool
 * 
 * Safely migrates all data from current database to new production database
 * Handles integrations, users, dashboard tiles, cohorts, campaigns, and more
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Color output for better readability
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

class DatabaseMigrator {
  constructor() {
    this.sourcePool = null;
    this.targetPool = null;
    this.migrationStats = {
      tables: 0,
      records: 0,
      errors: 0,
      startTime: new Date()
    };
  }

  async connectDatabases(sourceUrl, targetUrl) {
    logStep('CONNECTION', 'Connecting to databases...');
    
    try {
      // Connect to source database
      this.sourcePool = new Pool({
        connectionString: sourceUrl,
        ssl: sourceUrl.includes('localhost') ? false : { rejectUnauthorized: false }
      });
      
      await this.sourcePool.query('SELECT NOW()');
      logSuccess('Connected to source database');

      // Connect to target database
      this.targetPool = new Pool({
        connectionString: targetUrl,
        ssl: targetUrl.includes('localhost') ? false : { rejectUnauthorized: false }
      });
      
      await this.targetPool.query('SELECT NOW()');
      logSuccess('Connected to target database');
      
    } catch (error) {
      logError(`Database connection failed: ${error.message}`);
      throw error;
    }
  }

  async createSchema() {
    logStep('SCHEMA', 'Creating database schema in target database...');
    
    try {
      // Read the schema file
      const schemaPath = path.join(__dirname, 'schema.sql');
      let schemaSQL;
      
      if (fs.existsSync(schemaPath)) {
        schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      } else {
        // Generate schema from Drizzle if schema.sql doesn't exist
        const { execSync } = require('child_process');
        logStep('SCHEMA', 'Generating schema from Drizzle...');
        execSync('npm run db:generate', { stdio: 'inherit' });
        
        // Use drizzle-kit to push schema
        execSync('npm run db:push', { 
          stdio: 'inherit',
          env: { ...process.env, DATABASE_URL: this.targetPool.options.connectionString }
        });
        
        logSuccess('Schema created using Drizzle migrations');
        return;
      }

      // Execute schema creation
      await this.targetPool.query(schemaSQL);
      logSuccess('Database schema created successfully');
      
    } catch (error) {
      logError(`Schema creation failed: ${error.message}`);
      throw error;
    }
  }

  async getTableList() {
    logStep('DISCOVERY', 'Discovering tables to migrate...');
    
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const result = await this.sourcePool.query(query);
    const tables = result.rows.map(row => row.table_name);
    
    logSuccess(`Found ${tables.length} tables to migrate: ${tables.join(', ')}`);
    return tables;
  }

  async getTableRowCount(tableName) {
    const result = await this.sourcePool.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
    return parseInt(result.rows[0].count);
  }

  async migrateTable(tableName) {
    try {
      const rowCount = await this.getTableRowCount(tableName);
      
      if (rowCount === 0) {
        logWarning(`Table ${tableName} is empty, skipping...`);
        return 0;
      }

      logStep('MIGRATE', `Migrating table ${tableName} (${rowCount} records)...`);

      // Get all data from source table
      const sourceData = await this.sourcePool.query(`SELECT * FROM "${tableName}"`);
      
      if (sourceData.rows.length === 0) {
        logWarning(`No data found in ${tableName}`);
        return 0;
      }

      // Clear target table first
      await this.targetPool.query(`TRUNCATE TABLE "${tableName}" CASCADE`);

      // Get column names
      const columns = sourceData.fields.map(field => `"${field.name}"`);
      const placeholders = sourceData.rows[0] ? 
        sourceData.rows[0].map((_, index) => `$${index + 1}`).join(', ') : '';

      if (!placeholders) {
        logWarning(`No data to migrate for ${tableName}`);
        return 0;
      }

      const insertQuery = `
        INSERT INTO "${tableName}" (${columns.join(', ')}) 
        VALUES (${placeholders})
      `;

      // Batch insert data
      let insertedCount = 0;
      const batchSize = 100;
      
      for (let i = 0; i < sourceData.rows.length; i += batchSize) {
        const batch = sourceData.rows.slice(i, i + batchSize);
        
        for (const row of batch) {
          try {
            await this.targetPool.query(insertQuery, Object.values(row));
            insertedCount++;
          } catch (error) {
            logError(`Failed to insert row in ${tableName}: ${error.message}`);
            this.migrationStats.errors++;
          }
        }
        
        // Progress indicator
        const progress = Math.min(i + batchSize, sourceData.rows.length);
        process.stdout.write(`\r  Progress: ${progress}/${sourceData.rows.length} records migrated`);
      }
      
      console.log(); // New line after progress
      logSuccess(`Migrated ${insertedCount} records to ${tableName}`);
      return insertedCount;
      
    } catch (error) {
      logError(`Failed to migrate table ${tableName}: ${error.message}`);
      this.migrationStats.errors++;
      return 0;
    }
  }

  async resetSequences() {
    logStep('SEQUENCES', 'Resetting database sequences...');
    
    try {
      const sequenceQuery = `
        SELECT schemaname, sequencename, last_value 
        FROM pg_sequences 
        WHERE schemaname = 'public';
      `;
      
      const sequences = await this.targetPool.query(sequenceQuery);
      
      for (const seq of sequences.rows) {
        // Get the maximum ID from the related table
        const tableName = seq.sequencename.replace(/_id_seq$/, '');
        
        try {
          const maxResult = await this.targetPool.query(
            `SELECT COALESCE(MAX(id), 0) + 1 as next_val FROM "${tableName}"`
          );
          
          const nextVal = maxResult.rows[0].next_val;
          
          await this.targetPool.query(
            `SELECT setval('${seq.sequencename}', $1, false)`,
            [nextVal]
          );
          
          logSuccess(`Reset sequence ${seq.sequencename} to ${nextVal}`);
        } catch (error) {
          logWarning(`Could not reset sequence ${seq.sequencename}: ${error.message}`);
        }
      }
      
    } catch (error) {
      logWarning(`Sequence reset failed: ${error.message}`);
    }
  }

  async validateMigration() {
    logStep('VALIDATION', 'Validating migration...');
    
    try {
      const tables = await this.getTableList();
      const validationResults = [];
      
      for (const table of tables) {
        const sourceCount = await this.getTableRowCount(table);
        
        const targetResult = await this.targetPool.query(`SELECT COUNT(*) as count FROM "${table}"`);
        const targetCount = parseInt(targetResult.rows[0].count);
        
        validationResults.push({
          table,
          source: sourceCount,
          target: targetCount,
          match: sourceCount === targetCount
        });
      }
      
      log('\n📊 Migration Validation Results:', 'bold');
      console.table(validationResults);
      
      const allMatch = validationResults.every(result => result.match);
      
      if (allMatch) {
        logSuccess('All tables migrated successfully!');
      } else {
        logError('Some tables have mismatched record counts');
      }
      
      return allMatch;
      
    } catch (error) {
      logError(`Validation failed: ${error.message}`);
      return false;
    }
  }

  async testConnections() {
    logStep('TESTING', 'Testing database connections...');
    
    try {
      // Test integrations table specifically
      const integrations = await this.targetPool.query('SELECT COUNT(*) FROM integrations');
      logSuccess(`Found ${integrations.rows[0].count} integrations in target database`);
      
      // Test a sample query
      const testQuery = await this.targetPool.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' LIMIT 5');
      logSuccess(`Database responds correctly: ${testQuery.rows.length} tables accessible`);
      
      return true;
    } catch (error) {
      logError(`Connection test failed: ${error.message}`);
      return false;
    }
  }

  async createBackup(url, backupPath) {
    logStep('BACKUP', 'Creating database backup...');
    
    try {
      const { execSync } = require('child_process');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.sql`;
      const fullPath = path.join(backupPath || '.', filename);
      
      // Create pg_dump command
      const urlObj = new URL(url);
      const dumpCommand = `pg_dump "${url}" > "${fullPath}"`;
      
      execSync(dumpCommand, { stdio: 'inherit' });
      logSuccess(`Backup created: ${fullPath}`);
      return fullPath;
      
    } catch (error) {
      logWarning(`Backup creation failed: ${error.message}`);
      return null;
    }
  }

  async migrate(sourceUrl, targetUrl, options = {}) {
    const startTime = Date.now();
    
    try {
      log('\n🚀 Starting Production Database Migration', 'bold');
      log('='.repeat(50), 'blue');
      
      // Create backup if requested
      if (options.backup) {
        await this.createBackup(sourceUrl, options.backupPath);
      }
      
      // Connect to databases
      await this.connectDatabases(sourceUrl, targetUrl);
      
      // Create schema in target database
      await this.createSchema();
      
      // Get list of tables to migrate
      const tables = await this.getTableList();
      this.migrationStats.tables = tables.length;
      
      // Migrate each table
      for (const table of tables) {
        const recordCount = await this.migrateTable(table);
        this.migrationStats.records += recordCount;
      }
      
      // Reset sequences to prevent ID conflicts
      await this.resetSequences();
      
      // Validate migration
      const isValid = await this.validateMigration();
      
      // Test connections
      await this.testConnections();
      
      // Final statistics
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      log('\n📈 Migration Summary:', 'bold');
      log('='.repeat(30), 'blue');
      log(`Tables migrated: ${this.migrationStats.tables}`);
      log(`Records migrated: ${this.migrationStats.records}`);
      log(`Errors encountered: ${this.migrationStats.errors}`);
      log(`Duration: ${duration} seconds`);
      log(`Validation: ${isValid ? 'PASSED' : 'FAILED'}`, isValid ? 'green' : 'red');
      
      if (isValid && this.migrationStats.errors === 0) {
        logSuccess('\n🎉 Database migration completed successfully!');
        logSuccess('Your production database is ready to use.');
      } else {
        logWarning('\n⚠️ Migration completed with issues. Please review the logs.');
      }
      
      return isValid;
      
    } catch (error) {
      logError(`Migration failed: ${error.message}`);
      throw error;
    } finally {
      // Close connections
      if (this.sourcePool) await this.sourcePool.end();
      if (this.targetPool) await this.targetPool.end();
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Production Database Migration Tool

Usage:
  node migrate-production-database.js [options]

Options:
  --source <url>     Source database URL (default: DATABASE_URL env var)
  --target <url>     Target database URL (required)
  --backup          Create backup before migration
  --backup-path     Path for backup files (default: current directory)
  --help, -h        Show this help message

Examples:
  # Migrate using environment variables
  DATABASE_URL=source_url TARGET_DATABASE_URL=target_url node migrate-production-database.js

  # Migrate with explicit URLs
  node migrate-production-database.js --source "postgresql://user:pass@host:5432/source_db" --target "postgresql://user:pass@host:5432/target_db"

  # Migrate with backup
  node migrate-production-database.js --target "postgresql://..." --backup --backup-path ./backups
`);
    return;
  }

  // Parse command line arguments
  const sourceUrl = args.includes('--source') 
    ? args[args.indexOf('--source') + 1] 
    : process.env.DATABASE_URL;
    
  const targetUrl = args.includes('--target') 
    ? args[args.indexOf('--target') + 1] 
    : process.env.TARGET_DATABASE_URL;

  const shouldBackup = args.includes('--backup');
  const backupPath = args.includes('--backup-path') 
    ? args[args.indexOf('--backup-path') + 1] 
    : null;

  if (!sourceUrl) {
    logError('Source database URL is required. Set DATABASE_URL environment variable or use --source flag.');
    process.exit(1);
  }

  if (!targetUrl) {
    logError('Target database URL is required. Set TARGET_DATABASE_URL environment variable or use --target flag.');
    process.exit(1);
  }

  try {
    const migrator = new DatabaseMigrator();
    const success = await migrator.migrate(sourceUrl, targetUrl, {
      backup: shouldBackup,
      backupPath
    });
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    logError(`Migration failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    logError(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { DatabaseMigrator };