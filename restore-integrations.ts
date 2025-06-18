import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function restoreIntegrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Restoring critical integrations...');
    
    // Create Development PostgreSQL integration
    const devResult = await pool.query(`
      INSERT INTO integrations (id, name, type, credentials, is_active, status, metadata)
      VALUES (
        'ee1d6378-3df9-413d-b24a-b0a6f4269263',
        'Development PostgreSQL',
        'postgresql',
        '{"connectionString": "postgresql://postgres.oolcnbxrnuefxfdpvsfn:LTBhOE%5D%24%40Y%3BIw@aws-0-eu-north-1.pooler.supabase.com:6543/postgres"}',
        true,
        'connected',
        '{"tables": 23, "size": "12 MB", "version": "PostgreSQL 17.0"}'
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        credentials = EXCLUDED.credentials,
        is_active = EXCLUDED.is_active,
        status = EXCLUDED.status,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING id;
    `);
    console.log('✅ Development PostgreSQL integration restored:', devResult.rows[0]?.id);

    // Create Staging PostgreSQL integration  
    const stagingResult = await pool.query(`
      INSERT INTO integrations (id, name, type, credentials, is_active, status, metadata)
      VALUES (
        'decd268f-c84e-4b7b-a38a-7208d960f87d',
        'Staging PostgreSQL',
        'postgresql',
        '{"connectionString": "postgresql://postgres.oolcnbxrnuefxfdpvsfn:LTBhOE%5D%24%40Y%3BIw@aws-0-eu-north-1.pooler.supabase.com:6543/postgres"}',
        true,
        'connected',
        '{"tables": 23, "size": "12 MB", "version": "PostgreSQL 17.0"}'
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        credentials = EXCLUDED.credentials,
        is_active = EXCLUDED.is_active,
        status = EXCLUDED.status,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING id;
    `);
    console.log('✅ Staging PostgreSQL integration restored:', stagingResult.rows[0]?.id);

    // Create Production PostgreSQL integration
    const prodResult = await pool.query(`
      INSERT INTO integrations (id, name, type, credentials, is_active, status, metadata)
      VALUES (
        '30e06030-4916-436c-840c-277b72033f1e',
        'Production PostgreSQL',
        'postgresql',
        '{"connectionString": "postgresql://postgres.oolcnbxrnuefxfdpvsfn:LTBhOE%5D%24%40Y%3BIw@aws-0-eu-north-1.pooler.supabase.com:6543/postgres"}',
        true,
        'connected',
        '{"tables": 23, "size": "12 MB", "version": "PostgreSQL 17.0"}'
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        credentials = EXCLUDED.credentials,
        is_active = EXCLUDED.is_active,
        status = EXCLUDED.status,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING id;
    `);
    console.log('✅ Production PostgreSQL integration restored:', prodResult.rows[0]?.id);

    // Create Snowflake integration for data analytics
    const snowflakeResult = await pool.query(`
      INSERT INTO integrations (id, name, type, credentials, is_active, status, metadata)
      VALUES (
        gen_random_uuid(),
        'Primary Snowflake',
        'snowflake',
        '{"account": "q84sale", "username": "CDP_USER", "password": "6HVtgGjUI#nS^jdh", "warehouse": "CDP_WH", "database": "DBT_CORE_PROD_DATABASE", "schema": "OPERATIONS"}',
        true,
        'connected',
        '{"tables": 156, "schemas": 8, "warehouse": "CDP_WH", "size": "2.1 GB"}'
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING id;
    `);
    console.log('✅ Snowflake integration restored:', snowflakeResult.rows[0]?.id || 'already exists');

    // Verify environment configurations still exist
    const envConfigResult = await pool.query(`
      SELECT * FROM environment_configurations 
      WHERE is_active = true
      ORDER BY environment_name;
    `);
    
    console.log(`📋 Environment configurations found: ${envConfigResult.rows.length}`);
    envConfigResult.rows.forEach(config => {
      console.log(`   - ${config.environment_name}: ${config.integration_type} (${config.integration_id})`);
    });

    console.log('🎉 All integrations restored successfully!');
    
  } catch (error) {
    console.error('❌ Error restoring integrations:', error);
  } finally {
    await pool.end();
  }
}

restoreIntegrations();