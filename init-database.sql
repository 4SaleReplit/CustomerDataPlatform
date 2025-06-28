-- Customer Data Platform Database Schema for Supabase
-- This script initializes the database schema for production use

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'analyst', 'viewer', 'manager');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE cohort_status AS ENUM ('draft', 'active', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_email ON team(email);
CREATE INDEX IF NOT EXISTS idx_cohorts_status ON cohorts(status);
CREATE INDEX IF NOT EXISTS idx_cohorts_created_by ON cohorts(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_cohort_id ON campaigns(cohort_id);
CREATE INDEX IF NOT EXISTS idx_integrations_platform ON integrations(platform);
CREATE INDEX IF NOT EXISTS idx_integrations_is_active ON integrations(is_active);
CREATE INDEX IF NOT EXISTS idx_dashboard_tiles_tile_type ON dashboard_tiles(tile_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_tile_instances_dashboard_id ON dashboard_tile_instances(dashboard_id);

-- Grant necessary permissions for the application user
-- Note: Adjust these based on your Supabase user permissions
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Insert default roles
INSERT INTO roles (id, name, display_name, description, permissions, is_system_role, hierarchy_level)
VALUES 
    (uuid_generate_v4(), 'admin', 'Administrator', 'Full system access', '{"*": ["*"]}', true, 100),
    (uuid_generate_v4(), 'manager', 'Manager', 'Team and campaign management', '{"campaigns": ["*"], "cohorts": ["*"], "team": ["read", "update"]}', true, 80),
    (uuid_generate_v4(), 'analyst', 'Analyst', 'Data analysis and reporting', '{"dashboards": ["*"], "cohorts": ["*"], "reports": ["*"]}', true, 60),
    (uuid_generate_v4(), 'viewer', 'Viewer', 'Read-only access', '{"dashboards": ["read"], "reports": ["read"]}', true, 40)
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (id, name, display_name, description, category, resource, action, is_system_permission)
VALUES 
    (uuid_generate_v4(), 'dashboard.read', 'View Dashboards', 'View dashboard configurations and data', 'dashboard', 'dashboard', 'read', true),
    (uuid_generate_v4(), 'dashboard.write', 'Manage Dashboards', 'Create and modify dashboards', 'dashboard', 'dashboard', 'write', true),
    (uuid_generate_v4(), 'cohort.read', 'View Cohorts', 'View cohort definitions and data', 'cohort', 'cohort', 'read', true),
    (uuid_generate_v4(), 'cohort.write', 'Manage Cohorts', 'Create and modify cohorts', 'cohort', 'cohort', 'write', true),
    (uuid_generate_v4(), 'campaign.read', 'View Campaigns', 'View campaign configurations and results', 'campaign', 'campaign', 'read', true),
    (uuid_generate_v4(), 'campaign.write', 'Manage Campaigns', 'Create and manage campaigns', 'campaign', 'campaign', 'write', true),
    (uuid_generate_v4(), 'team.read', 'View Team', 'View team member information', 'team', 'team', 'read', true),
    (uuid_generate_v4(), 'team.write', 'Manage Team', 'Add and manage team members', 'team', 'team', 'write', true),
    (uuid_generate_v4(), 'integration.read', 'View Integrations', 'View integration configurations', 'integration', 'integration', 'read', true),
    (uuid_generate_v4(), 'integration.write', 'Manage Integrations', 'Configure and manage integrations', 'integration', 'integration', 'write', true)
ON CONFLICT (name) DO NOTHING;

-- Create triggers for updated_at columns
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('CREATE TRIGGER update_%I_updated_at 
                       BEFORE UPDATE ON %I 
                       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    EXCEPTION
        WHEN duplicate_object THEN
            -- Trigger already exists, continue
            CONTINUE;
    END LOOP;
END;
$$;

-- Insert environment configuration for production
INSERT INTO environment_configurations (id, name, display_name, description, database_url, is_active, is_default)
VALUES (
    uuid_generate_v4(),
    'production',
    'Production Environment',
    'Main production environment using Supabase PostgreSQL',
    'postgresql://postgres.oolcnbxrnuefxfdpvsfn:dsadasSDASdsaDASDASasdsadas3434@aws-0-eu-north-1.pooler.supabase.com:6543/postgres',
    true,
    true
) ON CONFLICT (name) DO UPDATE SET
    database_url = EXCLUDED.database_url,
    is_active = EXCLUDED.is_active,
    is_default = EXCLUDED.is_default;

-- Optimize database settings for performance
-- Note: These may need to be adjusted based on your Supabase plan
-- ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
-- ALTER SYSTEM SET track_activity_query_size = 2048;
-- ALTER SYSTEM SET pg_stat_statements.track = 'all';

COMMENT ON DATABASE postgres IS 'Customer Data Platform Database - Supabase Production'; 