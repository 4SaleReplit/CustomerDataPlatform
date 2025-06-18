import { Pool } from 'pg';

async function createMigrationHistoryTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Creating migration_history table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migration_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(255) NOT NULL,
        source_integration_id UUID NOT NULL,
        target_integration_id UUID NOT NULL,
        source_integration_name VARCHAR(255) NOT NULL,
        target_integration_name VARCHAR(255) NOT NULL,
        migration_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        total_tables INTEGER DEFAULT 0,
        migrated_tables INTEGER DEFAULT 0,
        total_rows BIGINT DEFAULT 0,
        migrated_rows BIGINT DEFAULT 0,
        error_message TEXT,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    console.log('✅ migration_history table created successfully');
    
    // Create index for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_migration_history_session_id 
      ON migration_history(session_id);
    `);
    
    console.log('✅ Index created for migration_history table');
    
  } catch (error) {
    console.error('❌ Error creating migration_history table:', error);
  } finally {
    await pool.end();
  }
}

createMigrationHistoryTable();