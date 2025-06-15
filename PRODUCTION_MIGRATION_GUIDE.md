# Production Database Migration Guide

## Overview

Your Customer Data Platform now includes a comprehensive database migration system that safely migrates all data, including integrations, to a new production database while ensuring zero data loss.

## Migration Tools Available

### 1. Web Interface (Recommended)
- Navigate to **Integrations** page
- Click **"Migrate Database"** button in the top-right
- Follow the guided interface

### 2. Command Line Tool
```bash
# Interactive migration
node database-migration-tool.js

# Or with parameters
node migrate-production-database.js --target "postgresql://user:pass@host:5432/prod_db" --backup
```

## Migration Process

### What Gets Migrated
- ✅ **Integrations** (Braze, Snowflake, etc.) with API keys
- ✅ **User accounts** and team members
- ✅ **Dashboard tiles** and configurations
- ✅ **Cohorts** and segments
- ✅ **Campaigns** and automation
- ✅ **Roles** and permissions
- ✅ **Uploaded images** and assets
- ✅ **Slides** and presentations
- ✅ **All relationships** and foreign keys

### Step-by-Step Process

1. **Pre-Migration**
   - Creates backup of current database (if enabled)
   - Validates connection to target database
   - Shows migration preview

2. **Schema Creation**
   - Creates tables in target database
   - Sets up indexes and constraints
   - Configures foreign key relationships

3. **Data Transfer**
   - Migrates data in correct dependency order
   - Preserves all relationships
   - Maintains data integrity

4. **Post-Migration**
   - Resets database sequences
   - Validates record counts
   - Tests database connections

## Using the Web Interface

### From Integrations Page
1. Go to **Integrations** page
2. Click **"Migrate Database"** (orange button)
3. Enter your production database URL:
   ```
   postgresql://user:password@host:5432/database_name
   ```
4. Choose backup option (recommended)
5. Review migration details
6. Click **"Start Migration"**

### Migration Status
- Real-time progress updates
- Error handling and recovery
- Success confirmation with record counts
- Validation results

## Database URL Formats

### Standard PostgreSQL
```
postgresql://username:password@hostname:5432/database_name
```

### AWS RDS
```
postgresql://user:pass@your-db.abc123.us-east-1.rds.amazonaws.com:5432/dbname
```

### Neon Database
```
postgresql://user:pass@ep-xyz.us-east-1.aws.neon.tech/dbname?sslmode=require
```

## Post-Migration Steps

### 1. Update Environment Variables
After successful migration, update your production environment:
```bash
# Update DATABASE_URL to point to new database
DATABASE_URL="postgresql://user:pass@new-host:5432/database"
```

### 2. Verify Integrations
- Check that all integrations are still connected
- Test API connections (Braze, Snowflake, etc.)
- Verify dashboard data loads correctly

### 3. Test Critical Functions
- Login with existing accounts
- Create new dashboard tiles
- Run Snowflake queries
- Check slide presentations

## Migration Safety Features

### Backup Creation
- Automatic backup before migration
- Stored as SQL dump file
- Includes all data and schema

### Validation Checks
- Source and target record count comparison
- Foreign key integrity verification
- Connection testing before and after

### Error Recovery
- Detailed error logging
- Partial migration recovery
- Rollback capability with backup

## Troubleshooting

### Common Issues

**Connection Failed**
- Verify database URL format
- Check network connectivity
- Ensure database accepts connections

**Permission Denied**
- Verify user has CREATE/INSERT privileges
- Check if database exists
- Confirm authentication credentials

**Schema Conflicts**
- Target database must be empty or compatible
- Run `npm run db:push` to create schema first
- Check for naming conflicts

### Support Commands

```bash
# Test database connection
node test-db-connection.js

# Manual schema creation
npm run db:push

# Check migration logs
tail -f migration.log
```

## Production Deployment Workflow

### Complete Migration Process
1. **Prepare Production Database**
   - Create new PostgreSQL instance
   - Configure access credentials
   - Test connectivity

2. **Run Migration**
   - Use web interface for guided process
   - Monitor progress and validate results
   - Verify all integrations transferred

3. **Update Application**
   - Change DATABASE_URL in production
   - Restart application services
   - Test all functionality

4. **Go Live**
   - Switch DNS/load balancer to production
   - Monitor application performance
   - Verify all integrations working

## Integration Preservation

### API Keys Maintained
- **Braze**: API key and instance URL preserved
- **Snowflake**: Account, user, and warehouse settings intact
- **Amplitude**: Tracking configuration maintained

### Configuration Preserved
- Integration status (connected/disconnected)
- Custom field mappings
- Webhook configurations
- Rate limiting settings

## Data Validation

### Automatic Checks
- Record count verification per table
- Foreign key constraint validation
- Integration configuration integrity
- User authentication preservation

### Manual Verification
After migration, verify:
- Login works with existing accounts
- Integrations show correct status
- Dashboard tiles display data
- Snowflake queries execute properly

Your production database migration system ensures seamless transition to production while maintaining all your valuable integration configurations and data relationships.