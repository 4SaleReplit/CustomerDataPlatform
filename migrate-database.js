#!/usr/bin/env node

// Database Migration Script
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

// Configure Neon for serverless
const neonConfig = require('@neondatabase/serverless').neonConfig;
neonConfig.webSocketConstructor = ws;

const migrationSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (basic auth)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);

-- Team members table (main user management)
CREATE TABLE IF NOT EXISTS team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role TEXT NOT NULL DEFAULT 'analyst',
    permissions JSONB DEFAULT '{}',
    temporary_password VARCHAR(255),
    must_change_password BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES team(id) ON DELETE SET NULL
);

-- Roles management
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_system_role BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB NOT NULL DEFAULT '{}',
    hierarchy_level INTEGER DEFAULT 0,
    can_manage_roles BOOLEAN DEFAULT false,
    max_team_members INTEGER,
    allowed_features JSONB DEFAULT '[]',
    restrictions JSONB DEFAULT '{}',
    created_by UUID REFERENCES team(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    is_system_permission BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role-Permission mappings
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES team(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Dashboard tiles
CREATE TABLE IF NOT EXISTS dashboard_tile_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tile_id TEXT NOT NULL,
    dashboard_id UUID,
    type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    icon TEXT,
    data_source JSONB,
    refresh_config JSONB DEFAULT '{}',
    created_by UUID REFERENCES team(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohorts
CREATE TABLE IF NOT EXISTS cohorts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    query TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    user_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    last_calculated_at TIMESTAMPTZ,
    calculation_status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    created_by UUID REFERENCES team(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Segments
CREATE TABLE IF NOT EXISTS segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rules JSONB NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_dynamic BOOLEAN DEFAULT true,
    user_count INTEGER DEFAULT 0,
    last_sync_at TIMESTAMPTZ,
    sync_status VARCHAR(50) DEFAULT 'pending',
    created_by UUID REFERENCES team(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'upsell',
    status VARCHAR(50) DEFAULT 'draft',
    cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
    target_audience JSONB,
    upsell_items JSONB DEFAULT '[]',
    scheduled_at TIMESTAMPTZ,
    launched_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metrics JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_by UUID REFERENCES team(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign jobs
CREATE TABLE IF NOT EXISTS campaign_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integrations
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}',
    credentials JSONB,
    status VARCHAR(50) DEFAULT 'inactive',
    last_sync_at TIMESTAMPTZ,
    last_error TEXT,
    sync_frequency VARCHAR(50) DEFAULT 'manual',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES team(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uploaded images
CREATE TABLE IF NOT EXISTS uploaded_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    uploaded_by UUID REFERENCES team(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Presentations
CREATE TABLE IF NOT EXISTS presentations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    theme VARCHAR(100) DEFAULT 'default',
    settings JSONB DEFAULT '{}',
    slide_order TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES team(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Slides
CREATE TABLE IF NOT EXISTS slides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    layout VARCHAR(100) DEFAULT 'default',
    background_color VARCHAR(7) DEFAULT '#FFFFFF',
    background_image TEXT,
    slide_order INTEGER DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES team(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_email ON team(email);
CREATE INDEX IF NOT EXISTS idx_cohorts_status ON cohorts(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_segments_sync_status ON segments(sync_status);
CREATE INDEX IF NOT EXISTS idx_dashboard_tiles_dashboard ON dashboard_tile_instances(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_slides_presentation ON slides(presentation_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
`;

const defaultDataSQL = `
-- Insert default roles (only if they don't exist)
INSERT INTO roles (id, name, display_name, description, is_system_role, permissions, hierarchy_level, can_manage_roles) 
SELECT '550e8400-e29b-41d4-a716-446655440001', 'administrator', 'Administrator', 'Full system access', true, '{"all": true}', 100, true
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'administrator');

INSERT INTO roles (id, name, display_name, description, is_system_role, permissions, hierarchy_level, can_manage_roles) 
SELECT '550e8400-e29b-41d4-a716-446655440002', 'manager', 'Manager', 'Team and campaign management', true, '{"teams": true, "campaigns": true, "segments": true}', 50, true
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'manager');

INSERT INTO roles (id, name, display_name, description, is_system_role, permissions, hierarchy_level, can_manage_roles) 
SELECT '550e8400-e29b-41d4-a716-446655440003', 'analyst', 'Analyst', 'Data analysis and reporting', true, '{"reports": true, "dashboards": true}', 25, false
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'analyst');

INSERT INTO roles (id, name, display_name, description, is_system_role, permissions, hierarchy_level, can_manage_roles) 
SELECT '550e8400-e29b-41d4-a716-446655440004', 'viewer', 'Viewer', 'Read-only access', true, '{"view": true}', 10, false
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'viewer');

-- Insert default permissions (only if they don't exist)
INSERT INTO permissions (id, name, display_name, description, category, resource, action, is_system_permission) 
SELECT '660e8400-e29b-41d4-a716-446655440001', 'view_dashboards', 'View Dashboards', 'Access to dashboard pages', 'dashboard', 'dashboard', 'read', true
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'view_dashboards');

INSERT INTO permissions (id, name, display_name, description, category, resource, action, is_system_permission) 
SELECT '660e8400-e29b-41d4-a716-446655440002', 'edit_dashboards', 'Edit Dashboards', 'Modify dashboard layouts', 'dashboard', 'dashboard', 'write', true
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'edit_dashboards');

INSERT INTO permissions (id, name, display_name, description, category, resource, action, is_system_permission) 
SELECT '660e8400-e29b-41d4-a716-446655440003', 'manage_teams', 'Manage Teams', 'Add/remove team members', 'team', 'team', 'manage', true
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'manage_teams');

INSERT INTO permissions (id, name, display_name, description, category, resource, action, is_system_permission) 
SELECT '660e8400-e29b-41d4-a716-446655440004', 'manage_campaigns', 'Manage Campaigns', 'Create and edit campaigns', 'campaign', 'campaign', 'manage', true
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'manage_campaigns');

INSERT INTO permissions (id, name, display_name, description, category, resource, action, is_system_permission) 
SELECT '660e8400-e29b-41d4-a716-446655440005', 'view_reports', 'View Reports', 'Access to reporting features', 'report', 'report', 'read', true
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'view_reports');
`;

async function runMigration() {
  console.log('Starting database migration...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });

  try {
    console.log('🔗 Connecting to database...');
    
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection established');
    
    // Run migration
    console.log('📋 Creating tables and indexes...');
    await pool.query(migrationSQL);
    console.log('✅ Schema migration completed');
    
    // Insert default data
    console.log('📊 Inserting default roles and permissions...');
    await pool.query(defaultDataSQL);
    console.log('✅ Default data inserted');
    
    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log(`\n📋 Migration complete! Created ${result.rows.length} tables:`);
    result.rows.forEach(row => {
      console.log(`  • ${row.table_name}`);
    });
    
    console.log('\n🎉 Your database is ready for the Customer Data Platform!');
    
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration();