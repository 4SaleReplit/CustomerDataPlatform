# Supabase Database Configuration

## Overview
The Customer Data Platform is now configured to read data directly from Supabase PostgreSQL database instead of using a local database.

## Current Configuration

### Database Connection
- **Host**: `aws-0-eu-north-1.pooler.supabase.com`
- **Port**: `6543` (Pooler connection)
- **Database**: `postgres`
- **User**: `postgres.oolcnbxrnuefxfdpvsfn`
- **Project ID**: `oolcnbxrnuefxfdpvsfn`
- **Region**: `eu-north-1`

### Full Connection String
```
postgresql://postgres.oolcnbxrnuefxfdpvsfn:dsadasSDASdsaDASDASasdsadas3434@aws-0-eu-north-1.pooler.supabase.com:6543/postgres
```

## Running the Application

### Docker Compose (Recommended)
```bash
docker-compose up -d
```
This will start:
- Redis cache on port 6379
- Application on port 5000 connected to Supabase

### Manual Development
```bash
# Set environment variables
DATABASE_URL=postgresql://postgres.oolcnbxrnuefxfdpvsfn:dsadasSDASdsaDASDASasdsadas3434@aws-0-eu-north-1.pooler.supabase.com:6543/postgres
REDIS_URL=redis://localhost:6379
NODE_ENV=production
PORT=5000

# Run the application
npm run build
node dist/index.js
```

## Existing Data in Supabase

The database contains the following tables with existing data:
- `users` - User authentication data
- `team` - Team member management
- `roles` - Role-based access control
- `permissions` - Permission system
- `segments` - User segmentation
- `cohorts` - User cohort management
- `campaigns` - Marketing campaigns
- `campaign_jobs` - Campaign execution tracking
- `dashboard_tiles` - Dashboard components
- `dashboard_tile_instances` - Dashboard instances
- `dashboard_configurations` - Dashboard layouts
- `integrations` - External service integrations
- `presentations` - Report presentations
- `slides` - Presentation slides
- `uploaded_images` - Image assets

## Health Check
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-06-17T10:17:49.710Z",
  "database": "Not connected in production mode",
  "environment": "production"
}
```

## Benefits of Supabase Setup

1. **Cloud-native**: No local database management needed
2. **Scalable**: Automatic scaling and connection pooling
3. **Backup**: Automatic backups and point-in-time recovery
4. **Monitoring**: Built-in monitoring and analytics
5. **Security**: SSL/TLS encryption and authentication
6. **Multi-region**: EU North region for optimal performance

## Development Workflow

1. **Data Reading**: Application reads existing data from Supabase
2. **Schema Updates**: Use Drizzle migrations for schema changes
3. **Local Development**: Connect directly to Supabase (no local DB needed)
4. **Production**: Same database for consistency

## Troubleshooting

### Connection Issues
- Verify Supabase project is active
- Check network connectivity
- Confirm pooler connection is enabled

### Performance
- Use connection pooling (already configured)
- Monitor query performance in Supabase dashboard
- Consider read replicas for heavy read workloads

### Security
- Rotate database passwords regularly
- Use environment variables for credentials
- Enable row-level security if needed 