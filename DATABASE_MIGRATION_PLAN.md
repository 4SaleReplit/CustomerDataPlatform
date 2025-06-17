# Database Migration Plan - Customer Data Platform

## Overview
This document outlines the complete database migration strategy for the Customer Data Platform, including current schema analysis, migration procedures, and production deployment recommendations.

## Current Schema Analysis

### Core Tables (21 tables total)

#### 1. User Management & Authentication
- **users** (3 columns) - Basic user authentication
- **team** (16 columns) - Team member management with roles and permissions
- **roles** (14 columns) - Role-based access control
- **permissions** (10 columns) - Granular permission system
- **role_permissions** (7 columns) - Role-permission mapping

#### 2. Data Analytics & Segmentation
- **segments** (11 columns) - User segmentation rules and conditions
- **cohorts** (18 columns) - User cohort management with Amplitude/Braze sync
- **campaigns** (16 columns) - Marketing campaign automation
- **campaign_jobs** (10 columns) - Campaign execution tracking

#### 3. Dashboard & Visualization
- **dashboard_tile_instances** (15 columns) - Individual dashboard tiles
- **dashboard_tiles** (10 columns) - Dashboard tile templates
- **dashboard_configurations** (10 columns) - Dashboard layout configurations

#### 4. Reporting System
- **presentations** (9 columns) - Report presentations
- **slides** (9 columns) - Individual presentation slides
- **uploaded_images** (8 columns) - Image asset management
- **scheduled_reports** (26 columns) - Automated report scheduling
- **report_executions** (12 columns) - Report execution tracking
- **mailing_lists** (11 columns) - Email distribution lists

#### 5. Integration & Migration
- **integrations** (9 columns) - External service integrations
- **environment_configurations** (8 columns) - Environment-specific settings
- **migration_history** (18 columns) - Migration tracking and logs

## Migration Strategy

### Phase 1: Pre-Migration Assessment
```sql
-- Check current data volumes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    null_frac,
    avg_width
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Identify foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public';
```

### Phase 2: Schema Backup & Validation
```bash
# Create full schema backup
pg_dump --schema-only --no-owner --no-privileges $SOURCE_DATABASE_URL > schema_backup.sql

# Create data backup
pg_dump --data-only --no-owner --no-privileges $SOURCE_DATABASE_URL > data_backup.sql

# Create complete backup
pg_dump --no-owner --no-privileges $SOURCE_DATABASE_URL > complete_backup.sql
```

### Phase 3: Target Database Preparation
```sql
-- Create target database schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Verify extensions
SELECT extname, extversion FROM pg_extension;
```

### Phase 4: Migration Execution Order

#### 4.1 Independent Tables (No foreign keys)
1. **users** - Base user authentication
2. **permissions** - Permission definitions
3. **uploaded_images** - Asset management
4. **integrations** - External service configs

#### 4.2 Dependent Tables (Level 1)
5. **team** - References users
6. **roles** - User role definitions
7. **presentations** - May reference uploaded_images

#### 4.3 Dependent Tables (Level 2)
8. **role_permissions** - References roles and permissions
9. **slides** - References uploaded_images
10. **segments** - References team (created_by)
11. **cohorts** - References team (created_by)
12. **dashboard_tiles** - References team (created_by)

#### 4.4 Dependent Tables (Level 3)
13. **campaigns** - References cohorts and team
14. **dashboard_tile_instances** - References dashboard_tiles
15. **dashboard_configurations** - References team
16. **scheduled_reports** - References presentations and team
17. **mailing_lists** - References team

#### 4.5 Final Tables
18. **campaign_jobs** - References campaigns
19. **report_executions** - References scheduled_reports
20. **environment_configurations** - References integrations
21. **migration_history** - References integrations

### Phase 5: Data Migration Script
```sql
-- Migration with proper sequencing
BEGIN;

-- Disable triggers during migration
SET session_replication_role = replica;

-- Migrate independent tables first
INSERT INTO target.users SELECT * FROM source.users;
INSERT INTO target.permissions SELECT * FROM source.permissions;
INSERT INTO target.uploaded_images SELECT * FROM source.uploaded_images;
INSERT INTO target.integrations SELECT * FROM source.integrations;

-- Migrate level 1 dependent tables
INSERT INTO target.team SELECT * FROM source.team;
INSERT INTO target.roles SELECT * FROM source.roles;
INSERT INTO target.presentations SELECT * FROM source.presentations;

-- Continue with remaining levels...

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Update sequences
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

COMMIT;
```

### Phase 6: Post-Migration Validation
```sql
-- Verify record counts
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'team', COUNT(*) FROM team
UNION ALL
SELECT 'segments', COUNT(*) FROM segments
UNION ALL
SELECT 'cohorts', COUNT(*) FROM cohorts
UNION ALL
SELECT 'campaigns', COUNT(*) FROM campaigns
UNION ALL
SELECT 'integrations', COUNT(*) FROM integrations
UNION ALL
SELECT 'presentations', COUNT(*) FROM presentations
UNION ALL
SELECT 'scheduled_reports', COUNT(*) FROM scheduled_reports;

-- Verify foreign key integrity
SELECT COUNT(*) as orphaned_records
FROM team t
LEFT JOIN users u ON t.created_by = u.id::text::uuid
WHERE t.created_by IS NOT NULL AND u.id IS NULL;
```

## Production Migration Checklist

### Pre-Migration
- [ ] Schedule maintenance window
- [ ] Notify all users of downtime
- [ ] Create full database backup
- [ ] Test migration on staging environment
- [ ] Verify all integrations are documented
- [ ] Prepare rollback procedures

### During Migration
- [ ] Put application in maintenance mode
- [ ] Stop all background jobs and cron tasks
- [ ] Execute schema migration
- [ ] Execute data migration with validation
- [ ] Update database connection strings
- [ ] Restart application services
- [ ] Verify all endpoints respond correctly

### Post-Migration
- [ ] Run automated test suite
- [ ] Verify dashboard tiles load data
- [ ] Test segment creation and refresh
- [ ] Verify campaign functionality
- [ ] Test report generation
- [ ] Check integration connections
- [ ] Monitor error logs for 24 hours
- [ ] Document any configuration changes

## Rollback Strategy

### Immediate Rollback (< 30 minutes)
```bash
# Switch back to original database
export DATABASE_URL=$ORIGINAL_DATABASE_URL
# Restart application services
```

### Data Rollback (> 30 minutes)
```sql
-- Restore from backup
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
psql $DATABASE_URL < complete_backup.sql
```

## Environment-Specific Considerations

### Development → Staging
- Full schema and data migration
- Test all integration connections
- Verify Snowflake query execution
- Test Amplitude event tracking

### Staging → Production
- Preserve production integrations and API keys
- Migrate user data and permissions
- Update scheduled report configurations
- Verify email delivery settings

### Production → Production (Zero Downtime)
- Use logical replication for large datasets
- Implement blue-green deployment
- Gradual traffic switching
- Real-time data synchronization

## Monitoring & Alerts

### Key Metrics to Monitor
- Database connection pool usage
- Query execution times
- Failed authentication attempts
- Integration API call success rates
- Background job completion rates
- Report generation success rates

### Alert Thresholds
- Database CPU > 80% for 5 minutes
- Connection pool > 90% utilization
- Failed logins > 10 per minute
- Integration timeouts > 5% error rate
- Scheduled report failures > 2 consecutive

## Security Considerations

### Data Protection
- Encrypt credentials in integrations table
- Hash passwords in team table
- Secure API keys during migration
- Audit trail for all data access

### Access Control
- Verify role permissions after migration
- Test team member access levels
- Validate integration connections
- Confirm scheduled report recipients

## Performance Optimization

### Indexing Strategy
```sql
-- Critical indexes for performance
CREATE INDEX CONCURRENTLY idx_team_email ON team(email);
CREATE INDEX CONCURRENTLY idx_cohorts_status ON cohorts(status);
CREATE INDEX CONCURRENTLY idx_segments_active ON segments(is_active);
CREATE INDEX CONCURRENTLY idx_campaigns_status ON campaigns(status);
CREATE INDEX CONCURRENTLY idx_tiles_dashboard ON dashboard_tile_instances(dashboard_id);
CREATE INDEX CONCURRENTLY idx_executions_report ON report_executions(scheduled_report_id);
```

### Query Optimization
- Implement connection pooling
- Add query result caching
- Optimize Snowflake queries
- Batch process campaign jobs

## Migration Timeline

### Small Database (< 1GB)
- **Preparation**: 2 hours
- **Migration**: 30 minutes
- **Validation**: 1 hour
- **Total Downtime**: 30 minutes

### Medium Database (1-10GB)
- **Preparation**: 4 hours
- **Migration**: 2 hours
- **Validation**: 2 hours
- **Total Downtime**: 2 hours

### Large Database (> 10GB)
- **Preparation**: 8 hours
- **Migration**: 4-8 hours
- **Validation**: 4 hours
- **Total Downtime**: 4-8 hours

## Success Criteria

### Technical Validation
- ✅ All 21 tables migrated successfully
- ✅ Foreign key constraints maintained
- ✅ Data integrity preserved
- ✅ Application starts without errors
- ✅ All API endpoints respond correctly

### Functional Validation
- ✅ User authentication works
- ✅ Dashboard tiles load data
- ✅ Segments can be created and refreshed
- ✅ Cohorts sync to Amplitude/Braze
- ✅ Campaigns execute successfully
- ✅ Reports generate and send emails
- ✅ Integrations connect properly

### Performance Validation
- ✅ Page load times < 3 seconds
- ✅ Query execution < 5 seconds
- ✅ Background jobs complete within SLA
- ✅ No memory leaks or connection issues

## Contact Information

### Migration Team
- **Database Administrator**: [Contact]
- **Backend Developer**: [Contact]
- **DevOps Engineer**: [Contact]
- **QA Lead**: [Contact]

### Emergency Contacts
- **Primary On-Call**: [Contact]
- **Secondary On-Call**: [Contact]
- **Infrastructure Team**: [Contact]

---

**Document Version**: 1.0  
**Last Updated**: June 17, 2025  
**Next Review**: Before next migration