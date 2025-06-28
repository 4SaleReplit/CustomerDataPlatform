# Customer Data Platform - Docker Deployment with Supabase

This guide provides comprehensive instructions for deploying the Customer Data Platform using Docker with Supabase PostgreSQL as the database backend.

## 📋 Prerequisites

### Required Software
- **Docker**: Version 20.10 or later
- **Docker Compose**: Version 2.0 or later  
- **Node.js**: Version 18 or later (for local development)
- **npm**: Version 8 or later

### Required Services
- **Supabase Project**: Active Supabase project with PostgreSQL database
- **Database Access**: Connection string for your Supabase database

## 🚀 Quick Start

### 1. Environment Setup

Ensure your `.env` file is configured with the Supabase database URL:

```bash
# Supabase PostgreSQL Database - Primary Connection
DATABASE_URL=postgresql://postgres.oolcnbxrnuefxfdpvsfn:dsadasSDASdsaDASDASasdsadas3434@aws-0-eu-north-1.pooler.supabase.com:6543/postgres

# Production environment
NODE_ENV=production

# Server configuration  
PORT=5000
HOST=0.0.0.0

# Session configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
```

### 2. Deploy with PowerShell (Windows)

```powershell
# Run the deployment script
.\deploy-supabase.ps1

# Or with options
.\deploy-supabase.ps1 -SkipTests -Force
```

### 3. Deploy with Bash (Linux/Mac)

```bash
# Make script executable
chmod +x deploy-supabase.sh

# Run deployment
./deploy-supabase.sh
```

## 🏗️ Architecture Overview

### Docker Services

1. **cdp-app**: Main Customer Data Platform application
   - **Port**: 5000
   - **Database**: Supabase PostgreSQL  
   - **Features**: Full CDP functionality, API endpoints, web interface

2. **redis**: Redis cache and job queue
   - **Port**: 6379
   - **Purpose**: Caching, session storage, background jobs

3. **nginx** (Optional): Reverse proxy for production
   - **Ports**: 80, 443
   - **Profile**: Production only

### Database Integration

- **Primary Database**: Supabase PostgreSQL
- **Connection**: Direct connection via DATABASE_URL
- **Schema**: Automatically applied via Drizzle ORM migrations
- **Features**: All CDP data (users, cohorts, campaigns, integrations)

## 📊 Supported Features

### Core Functionality
✅ **User Management**: Team members, roles, permissions  
✅ **Cohort Management**: User segmentation and targeting  
✅ **Campaign Management**: Marketing campaign creation and execution  
✅ **Dashboard Builder**: Custom analytics dashboards  
✅ **Integrations**: External platform connections  
✅ **Report Generation**: Automated reporting and scheduling  
✅ **Email Templates**: Template management and sending  

### API Endpoints
✅ **Authentication**: `/api/auth/*`  
✅ **Team Management**: `/api/team`  
✅ **Cohorts**: `/api/cohorts`  
✅ **Campaigns**: `/api/campaigns`  
✅ **Dashboards**: `/api/dashboard/*`  
✅ **Integrations**: `/api/integrations`  
✅ **Reports**: `/api/reports`  
✅ **Health Check**: `/health`, `/api/health`  

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase PostgreSQL connection string | Required |
| `NODE_ENV` | Application environment | `production` |
| `PORT` | Application port | `5000` |
| `HOST` | Application host | `0.0.0.0` |
| `SESSION_SECRET` | Session encryption key | Change in production |

### Docker Compose Configuration

```yaml
# docker-compose.yml structure
services:
  cdp-app:
    build: Dockerfile.production
    ports: ["5000:5000"]
    environment:
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
  
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes:
      - redis_data:/data
```

## 🧪 Testing

### Automated Testing

The deployment script includes comprehensive endpoint testing:

```bash
# Endpoints tested automatically
/health                    # Application health
/api/health               # API health  
/api/team                 # Team management
/api/cohorts              # Cohort management
/api/campaigns            # Campaign management
/api/integrations         # Platform integrations
/api/dashboard/configurations # Dashboard configs
```

### Manual Testing

```bash
# Test application health
curl http://localhost:5000/health

# Test API health
curl http://localhost:5000/api/health

# Test authenticated endpoints (requires login)
curl -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}' \
     http://localhost:5000/api/auth/login
```

## 📁 File Structure

```
├── docker-compose.yml          # Docker Compose configuration
├── Dockerfile.production       # Multi-stage production Dockerfile  
├── deploy-supabase.ps1         # PowerShell deployment script
├── deploy-supabase.sh          # Bash deployment script
├── init-database.sql           # Database initialization script
├── .env                        # Environment configuration
├── uploads/                    # File uploads directory
├── logs/                       # Application logs
└── dist/                       # Built application files
```

## 🔍 Monitoring & Debugging

### View Application Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f cdp-app
docker-compose logs -f redis
```

### Check Service Status
```bash
# Check running services
docker-compose ps

# Check service health
docker-compose exec cdp-app wget -q --spider http://localhost:5000/health
```

### Database Connection Test
```bash
# Test database connectivity
docker-compose exec cdp-app node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(res => {
  console.log('Database time:', res.rows[0].now);
  pool.end();
}).catch(err => console.error('Error:', err));
"
```

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check environment variables
docker-compose exec cdp-app env | grep DATABASE_URL

# Test connection from container
docker-compose exec cdp-app node -e "
require('pg').Pool({connectionString:process.env.DATABASE_URL})
.query('SELECT 1').then(()=>console.log('OK')).catch(console.error)
"
```

#### Application Won't Start
```bash
# Check build logs
docker-compose logs cdp-app

# Rebuild without cache
docker-compose build --no-cache cdp-app

# Check port conflicts
netstat -an | grep 5000
```

#### Health Check Failing
```bash
# Check if application is binding to correct interface
docker-compose exec cdp-app netstat -tlnp | grep 5000

# Test health endpoint from inside container
docker-compose exec cdp-app wget -q -O- http://localhost:5000/health
```

### Reset Deployment
```bash
# Complete reset
docker-compose down -v --remove-orphans
docker system prune -f
docker volume prune -f

# Rebuild from scratch
./deploy-supabase.ps1 -Force
```

## 🔒 Security Considerations

### Production Checklist
- [ ] Change default `SESSION_SECRET`
- [ ] Use environment-specific database credentials
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable application logging
- [ ] Configure monitoring alerts

### Database Security
- [ ] Use connection pooling (enabled by default)
- [ ] Enable SSL connections (Supabase default)
- [ ] Rotate database passwords regularly
- [ ] Monitor database access logs
- [ ] Implement backup strategies

## 📈 Performance Optimization

### Container Optimization
- Multi-stage Docker build reduces image size
- Non-root user for security
- Health checks for container orchestration
- Resource limits in production

### Database Optimization
- Connection pooling (max 10 connections)
- Optimized queries with indexes
- Automatic connection retry
- Query timeout configurations

## 🚀 Production Deployment

### Scaling Options
```bash
# Scale application instances
docker-compose up -d --scale cdp-app=3

# Use with load balancer
docker-compose --profile production up -d
```

### Environment-Specific Configurations
```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production  
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## 📞 Support

### Getting Help
- Check application logs: `docker-compose logs -f cdp-app`
- Verify database connectivity
- Review environment configuration
- Test individual API endpoints

### Common Commands
```bash
# Start services
docker-compose up -d

# Stop services  
docker-compose down

# View logs
docker-compose logs -f

# Rebuild
docker-compose build --no-cache

# Shell access
docker-compose exec cdp-app sh
```

---

🎉 **Your Customer Data Platform is now running with Supabase PostgreSQL!**

Access your application at: http://localhost:5000 