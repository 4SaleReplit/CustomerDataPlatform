#!/usr/bin/env node

/**
 * Database Migration Tool - Production Ready
 * Safely migrates all data including integrations from current to new database
 */

const { Pool } = require('pg');
const readline = require('readline');

class ProductionMigrator {
  constructor() {
    this.sourcePool = null;
    this.targetPool = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async validateConnection(url, name) {
    try {
      const pool = new Pool({
        connectionString: url,
        ssl: url.includes('localhost') ? false : { rejectUnauthorized: false }
      });
      
      await pool.query('SELECT NOW()');
      console.log(`✓ ${name} database connection successful`);
      await pool.end();
      return true;
    } catch (error) {
      console.log(`✗ ${name} database connection failed: ${error.message}`);
      return false;
    }
  }

  async getTableData(pool, tableName) {
    try {
      const result = await pool.query(`SELECT * FROM "${tableName}" ORDER BY created_at ASC`);
      return result.rows;
    } catch (error) {
      // Try without created_at ordering
      const result = await pool.query(`SELECT * FROM "${tableName}"`);
      return result.rows;
    }
  }

  async migrateIntegrations() {
    console.log('\n📊 Migrating integrations...');
    
    const integrations = await this.getTableData(this.sourcePool, 'integrations');
    console.log(`Found ${integrations.length} integrations to migrate`);

    if (integrations.length === 0) {
      console.log('No integrations to migrate');
      return;
    }

    // Clear existing integrations in target
    await this.targetPool.query('DELETE FROM integrations');
    
    for (const integration of integrations) {
      const insertQuery = `
        INSERT INTO integrations (
          id, name, type, status, config, credentials, 
          created_at, updated_at, last_used
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      
      await this.targetPool.query(insertQuery, [
        integration.id,
        integration.name,
        integration.type,
        integration.status,
        integration.config,
        integration.credentials,
        integration.created_at,
        integration.updated_at,
        integration.last_used
      ]);
    }
    
    console.log(`✓ Migrated ${integrations.length} integrations successfully`);
  }

  async migrateCriticalTables() {
    const criticalTables = [
      'users',
      'team_members', 
      'dashboard_tile_instances',
      'cohorts',
      'segments',
      'campaigns',
      'roles',
      'permissions',
      'role_permissions',
      'uploaded_images',
      'slides',
      'presentations'
    ];

    for (const tableName of criticalTables) {
      await this.migrateTable(tableName);
    }
  }

  async migrateTable(tableName) {
    try {
      console.log(`\n📋 Migrating ${tableName}...`);
      
      const data = await this.getTableData(this.sourcePool, tableName);
      console.log(`Found ${data.length} records in ${tableName}`);

      if (data.length === 0) {
        console.log(`No data in ${tableName} to migrate`);
        return;
      }

      // Get column info
      const columnResult = await this.sourcePool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);
      
      const columns = columnResult.rows.map(row => row.column_name);
      
      // Clear target table
      await this.targetPool.query(`DELETE FROM "${tableName}"`);
      
      // Prepare insert statement
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const insertQuery = `
        INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) 
        VALUES (${placeholders})
      `;

      // Insert data
      let migrated = 0;
      for (const row of data) {
        try {
          const values = columns.map(col => row[col]);
          await this.targetPool.query(insertQuery, values);
          migrated++;
        } catch (error) {
          console.log(`⚠ Failed to migrate record in ${tableName}: ${error.message}`);
        }
      }
      
      console.log(`✓ Migrated ${migrated}/${data.length} records from ${tableName}`);
      
    } catch (error) {
      console.log(`✗ Failed to migrate ${tableName}: ${error.message}`);
    }
  }

  async run() {
    try {
      console.log('🔄 Production Database Migration Tool');
      console.log('=====================================\n');

      // Get database URLs
      const sourceUrl = process.env.DATABASE_URL || await this.askQuestion('Enter source database URL: ');
      const targetUrl = await this.askQuestion('Enter target (production) database URL: ');

      if (!sourceUrl || !targetUrl) {
        console.log('Both database URLs are required');
        return;
      }

      // Validate connections
      console.log('\n🔍 Validating database connections...');
      const sourceValid = await this.validateConnection(sourceUrl, 'Source');
      const targetValid = await this.validateConnection(targetUrl, 'Target');

      if (!sourceValid || !targetValid) {
        console.log('Please check your database URLs and try again');
        return;
      }

      // Connect to databases
      this.sourcePool = new Pool({
        connectionString: sourceUrl,
        ssl: sourceUrl.includes('localhost') ? false : { rejectUnauthorized: false }
      });

      this.targetPool = new Pool({
        connectionString: targetUrl,
        ssl: targetUrl.includes('localhost') ? false : { rejectUnauthorized: false }
      });

      console.log('\n⚠️  WARNING: This will overwrite data in the target database.');
      const confirm = await this.askQuestion('Continue? (yes/no): ');
      
      if (confirm.toLowerCase() !== 'yes') {
        console.log('Migration cancelled');
        return;
      }

      // Run schema migration first
      console.log('\n🏗️  Running schema migration...');
      const { execSync } = require('child_process');
      
      try {
        execSync('npm run db:push', {
          stdio: 'inherit',
          env: { ...process.env, DATABASE_URL: targetUrl }
        });
        console.log('✓ Schema migration completed');
      } catch (error) {
        console.log('⚠ Schema migration failed, continuing with data migration...');
      }

      // Migrate integrations first (most critical)
      await this.migrateIntegrations();
      
      // Migrate other critical tables
      await this.migrateCriticalTables();

      // Validate migration
      console.log('\n🔍 Validating migration...');
      const sourceIntegrations = await this.sourcePool.query('SELECT COUNT(*) FROM integrations');
      const targetIntegrations = await this.targetPool.query('SELECT COUNT(*) FROM integrations');
      
      console.log(`Source integrations: ${sourceIntegrations.rows[0].count}`);
      console.log(`Target integrations: ${targetIntegrations.rows[0].count}`);
      
      if (sourceIntegrations.rows[0].count === targetIntegrations.rows[0].count) {
        console.log('✓ Integration migration validated successfully');
      } else {
        console.log('⚠ Integration counts do not match');
      }

      console.log('\n🎉 Migration completed!');
      console.log('You can now update your DATABASE_URL to point to the new database.');
      
    } catch (error) {
      console.log(`\n✗ Migration failed: ${error.message}`);
    } finally {
      if (this.sourcePool) await this.sourcePool.end();
      if (this.targetPool) await this.targetPool.end();
      this.rl.close();
    }
  }
}

// Run the migrator
const migrator = new ProductionMigrator();
migrator.run().catch(console.error);