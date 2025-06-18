import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function createEnvironmentConfigurationsTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Creating environment_configurations table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS environment_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        environment_id VARCHAR(100) NOT NULL,
        environment_name VARCHAR(100) NOT NULL,
        integration_type VARCHAR(50) NOT NULL,
        integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    console.log('✅ environment_configurations table created successfully');
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'environment_configurations'
      )
    `);
    
    console.log('Table exists:', tableCheck.rows[0].exists);
    
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    await pool.end();
  }
}

createEnvironmentConfigurationsTable();