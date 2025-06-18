import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function restoreDatabaseSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Restoring database schema...');
    
    // Create integrations table first (most critical)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        credentials JSONB NOT NULL,
        is_active BOOLEAN DEFAULT true,
        status VARCHAR(20) DEFAULT 'connected',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_tested_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('✅ integrations table created');

    // Create team table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        must_change_password BOOLEAN DEFAULT false,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID,
        department VARCHAR(100),
        phone VARCHAR(50),
        position VARCHAR(100),
        permissions TEXT[],
        avatar_url TEXT
      );
    `);
    console.log('✅ team table created');

    // Create roles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        permissions TEXT[],
        is_active BOOLEAN DEFAULT true,
        can_manage_users BOOLEAN DEFAULT false,
        can_manage_integrations BOOLEAN DEFAULT false,
        can_manage_reports BOOLEAN DEFAULT false,
        can_view_analytics BOOLEAN DEFAULT true,
        can_export_data BOOLEAN DEFAULT false,
        can_manage_campaigns BOOLEAN DEFAULT false,
        can_manage_segments BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID
      );
    `);
    console.log('✅ roles table created');

    // Create dashboard_tile_instances table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dashboard_tile_instances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tile_id VARCHAR(255) NOT NULL,
        dashboard_id UUID,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        icon VARCHAR(50),
        data_source JSONB,
        refresh_config JSONB,
        last_refresh_at TIMESTAMP WITH TIME ZONE,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ dashboard_tile_instances table created');

    // Create permissions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        category VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID,
        resource VARCHAR(100),
        action VARCHAR(100),
        conditions JSONB DEFAULT '{}'
      );
    `);
    console.log('✅ permissions table created');

    // Create cohorts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cohorts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        sql_query TEXT NOT NULL,
        user_count INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'draft',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_refreshed_at TIMESTAMP WITH TIME ZONE,
        created_by UUID,
        tags TEXT[],
        metadata JSONB DEFAULT '{}',
        refresh_schedule VARCHAR(50),
        auto_refresh BOOLEAN DEFAULT false,
        external_sync_enabled BOOLEAN DEFAULT false,
        amplitude_cohort_id VARCHAR(255),
        braze_segment_id VARCHAR(255),
        estimated_size INTEGER,
        last_sync_at TIMESTAMP WITH TIME ZONE,
        sync_status VARCHAR(20) DEFAULT 'pending'
      );
    `);
    console.log('✅ cohorts table created');

    // Create segments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS segments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        sql_query TEXT NOT NULL,
        user_count INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'draft',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_refreshed_at TIMESTAMP WITH TIME ZONE,
        created_by UUID
      );
    `);
    console.log('✅ segments table created');

    console.log('🎉 Database schema restored successfully!');
    
  } catch (error) {
    console.error('❌ Error restoring database schema:', error);
  } finally {
    await pool.end();
  }
}

restoreDatabaseSchema();