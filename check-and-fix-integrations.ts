import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function checkAndFixIntegrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Checking integrations table structure...');
    
    // Check if integrations table exists and get its structure
    const tableCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'integrations'
      ORDER BY ordinal_position;
    `);
    
    console.log('Current integrations table columns:');
    tableCheck.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable})`);
    });

    // Drop and recreate integrations table with correct schema
    await pool.query(`DROP TABLE IF EXISTS integrations CASCADE;`);
    console.log('✅ Dropped existing integrations table');

    await pool.query(`
      CREATE TABLE integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        credentials JSONB NOT NULL,
        active BOOLEAN DEFAULT true,
        status VARCHAR(20) DEFAULT 'connected',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_tested_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('✅ Created integrations table with correct schema');

    // Insert integrations with correct column names
    const devResult = await pool.query(`
      INSERT INTO integrations (id, name, type, credentials, active, status, metadata)
      VALUES (
        'ee1d6378-3df9-413d-b24a-b0a6f4269263',
        'Development PostgreSQL',
        'postgresql',
        '{"connectionString": "postgresql://postgres.oolcnbxrnuefxfdpvsfn:LTBhOE%5D%24%40Y%3BIw@aws-0-eu-north-1.pooler.supabase.com:6543/postgres"}',
        true,
        'connected',
        '{"tables": 23, "size": "12 MB", "version": "PostgreSQL 17.0"}'
      )
      RETURNING id;
    `);
    console.log('✅ Development PostgreSQL:', devResult.rows[0]?.id);

    const stagingResult = await pool.query(`
      INSERT INTO integrations (id, name, type, credentials, active, status, metadata)
      VALUES (
        'decd268f-c84e-4b7b-a38a-7208d960f87d',
        'Staging PostgreSQL',
        'postgresql',
        '{"connectionString": "postgresql://postgres.oolcnbxrnuefxfdpvsfn:LTBhOE%5D%24%40Y%3BIw@aws-0-eu-north-1.pooler.supabase.com:6543/postgres"}',
        true,
        'connected',
        '{"tables": 23, "size": "12 MB", "version": "PostgreSQL 17.0"}'
      )
      RETURNING id;
    `);
    console.log('✅ Staging PostgreSQL:', stagingResult.rows[0]?.id);

    const prodResult = await pool.query(`
      INSERT INTO integrations (id, name, type, credentials, active, status, metadata)
      VALUES (
        '30e06030-4916-436c-840c-277b72033f1e',
        'Production PostgreSQL',
        'postgresql',
        '{"connectionString": "postgresql://postgres.oolcnbxrnuefxfdpvsfn:LTBhOE%5D%24%40Y%3BIw@aws-0-eu-north-1.pooler.supabase.com:6543/postgres"}',
        true,
        'connected',
        '{"tables": 23, "size": "12 MB", "version": "PostgreSQL 17.0"}'
      )
      RETURNING id;
    `);
    console.log('✅ Production PostgreSQL:', prodResult.rows[0]?.id);

    const snowflakeResult = await pool.query(`
      INSERT INTO integrations (id, name, type, credentials, active, status, metadata)
      VALUES (
        gen_random_uuid(),
        'Primary Snowflake',
        'snowflake',
        '{"account": "q84sale", "username": "CDP_USER", "password": "6HVtgGjUI#nS^jdh", "warehouse": "CDP_WH", "database": "DBT_CORE_PROD_DATABASE", "schema": "OPERATIONS"}',
        true,
        'connected',
        '{"tables": 156, "schemas": 8, "warehouse": "CDP_WH", "size": "2.1 GB"}'
      )
      RETURNING id;
    `);
    console.log('✅ Snowflake integration:', snowflakeResult.rows[0]?.id);

    // Verify environment configurations
    const envConfigResult = await pool.query(`
      SELECT environment_name, integration_type, integration_id 
      FROM environment_configurations 
      WHERE is_active = true
      ORDER BY environment_name;
    `);
    
    console.log(`📋 Environment configurations: ${envConfigResult.rows.length}`);
    envConfigResult.rows.forEach(config => {
      console.log(`   - ${config.environment_name}: ${config.integration_type}`);
    });

    console.log('🎉 Integrations restored successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAndFixIntegrations();