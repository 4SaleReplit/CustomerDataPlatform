# PostgreSQL Database Integration & Migration Guide

## Overview
This guide shows you how to connect the Customer Data Platform to your own PostgreSQL database and migrate the complete schema.

## Step 1: Database Connection Setup

### Update Environment Variables
Edit your `.env` file or set environment variables:

```bash
# Your PostgreSQL Database Connection
DATABASE_URL="postgresql://username:password@hostname:5432/database_name"

# Example formats:
# Local: postgresql://postgres:password@localhost:5432/cdp_platform
# Cloud: postgresql://user:pass@your-db-host.com:5432/your_db_name
# SSL: postgresql://user:pass@host:5432/db?sslmode=require
```

### For Docker Deployment
Update your `docker-compose.yml` or environment:
```yaml
environment:
  - DATABASE_URL=postgresql://your_user:your_password@your_host:5432/your_database
```

## Step 2: Schema Migration Commands

### Using Drizzle (Recommended)
```bash
# Push schema to your database
npm run db:push

# Generate migration files (optional)
npm run db:generate

# Apply migrations
npm run db:migrate
```

### Manual SQL Migration
If you prefer SQL scripts, here's the complete schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (basic auth)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);

-- Team members table (main user management)
CREATE TABLE team (
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
CREATE TABLE roles (
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
CREATE TABLE permissions (
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
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES team(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Dashboard tiles
CREATE TABLE dashboard_tile_instances (
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
CREATE TABLE cohorts (
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
CREATE TABLE segments (
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
CREATE TABLE campaigns (
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
CREATE TABLE campaign_jobs (
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
CREATE TABLE integrations (
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
CREATE TABLE uploaded_images (
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
CREATE TABLE presentations (
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
CREATE TABLE slides (
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
CREATE INDEX idx_team_email ON team(email);
CREATE INDEX idx_cohorts_status ON cohorts(status);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_segments_sync_status ON segments(sync_status);
CREATE INDEX idx_dashboard_tiles_dashboard ON dashboard_tile_instances(dashboard_id);
CREATE INDEX idx_slides_presentation ON slides(presentation_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- Insert default roles
INSERT INTO roles (id, name, display_name, description, is_system_role, permissions, hierarchy_level, can_manage_roles) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'administrator', 'Administrator', 'Full system access', true, '{"all": true}', 100, true),
('550e8400-e29b-41d4-a716-446655440002', 'manager', 'Manager', 'Team and campaign management', true, '{"teams": true, "campaigns": true, "segments": true}', 50, true),
('550e8400-e29b-41d4-a716-446655440003', 'analyst', 'Analyst', 'Data analysis and reporting', true, '{"reports": true, "dashboards": true}', 25, false),
('550e8400-e29b-41d4-a716-446655440004', 'viewer', 'Viewer', 'Read-only access', true, '{"view": true}', 10, false);

-- Insert default permissions
INSERT INTO permissions (id, name, display_name, description, category, resource, action, is_system_permission) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'view_dashboards', 'View Dashboards', 'Access to dashboard pages', 'dashboard', 'dashboard', 'read', true),
('660e8400-e29b-41d4-a716-446655440002', 'edit_dashboards', 'Edit Dashboards', 'Modify dashboard layouts', 'dashboard', 'dashboard', 'write', true),
('660e8400-e29b-41d4-a716-446655440003', 'manage_teams', 'Manage Teams', 'Add/remove team members', 'team', 'team', 'manage', true),
('660e8400-e29b-41d4-a716-446655440004', 'manage_campaigns', 'Manage Campaigns', 'Create and edit campaigns', 'campaign', 'campaign', 'manage', true),
('660e8400-e29b-41d4-a716-446655440005', 'view_reports', 'View Reports', 'Access to reporting features', 'report', 'report', 'read', true);
```

## Step 3: Test Database Connection

### Verify Connection
```bash
# Test database connectivity
npm run test:db

# Or manually test
node -e "
const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(res => {
  console.log('Database connected:', res.rows[0]);
  process.exit(0);
}).catch(err => {
  console.error('Database connection failed:', err);
  process.exit(1);
});
"
```

## Step 4: Run Migrations

### Option A: Automatic (Drizzle)
```bash
# Push schema directly to database
npm run db:push
```

### Option B: Manual Migration
```bash
# Copy the SQL above to a file
psql $DATABASE_URL -f migration.sql
```

## Step 5: Verify Setup

### Check Tables Created
```sql
-- Connect to your database and run:
\dt

-- Should show all tables:
-- campaigns, cohorts, dashboard_tile_instances, integrations,
-- permissions, presentations, role_permissions, roles,
-- segments, slides, team, uploaded_images, users
```

### Insert Test Data (Optional)
```sql
-- Create a test admin user
INSERT INTO team (email, password_hash, first_name, last_name, role, must_change_password)
VALUES ('admin@yourcompany.com', '$2b$10$example_hash', 'Admin', 'User', 'administrator', false);
```

## Database Configuration Files

### Update Drizzle Config
Your `drizzle.config.ts` should use your DATABASE_URL:
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Security Considerations

### Connection Security
- Use SSL connections for production: `?sslmode=require`
- Store credentials in environment variables
- Use connection pooling for performance
- Regular backup schedule

### Database Permissions
```sql
-- Create application user (recommended)
CREATE USER cdp_app WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE your_database TO cdp_app;
GRANT USAGE ON SCHEMA public TO cdp_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cdp_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cdp_app;
```

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check firewall settings
   - Verify host and port
   - Test network connectivity

2. **Permission Denied**
   - Verify user credentials
   - Check database permissions
   - Ensure database exists

3. **SSL Certificate Issues**
   - Add `?sslmode=require` or `?sslmode=disable` for testing
   - Verify SSL certificate chain

### Debug Commands
```bash
# Test connection
npx drizzle-kit introspect:pg

# Check schema
npm run db:check

# Generate migration
npm run db:generate
```

## Production Checklist

- [ ] Database connection tested
- [ ] All tables created successfully
- [ ] Indexes created for performance
- [ ] Default roles and permissions inserted
- [ ] Application connects without errors
- [ ] Backup strategy configured
- [ ] Monitoring setup
- [ ] SSL enabled for production

Your database is now ready for the Customer Data Platform!