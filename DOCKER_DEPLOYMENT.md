# Docker Deployment Guide for Windows

This guide helps you deploy the Customer Data Platform locally on Windows using Docker with Supabase database integration.

## Prerequisites

- **Docker Desktop for Windows** (with WSL2 backend recommended)
- **Node.js 18+** (for building the application)
- **Git** (to clone the repository)

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd customer-data-platform
```

### 2. Environment Configuration

Copy the production environment template:
```bash
copy .env.production .env
```

Edit `.env` file with your actual values:
```env
# Database Configuration - Supabase PostgreSQL
DATABASE_URL=postgresql://postgres.oolcnbxrnuefxfdpvsfn:dsadasSDASdsaDASDASasdsadas3434@aws-0-eu-north-1.pooler.supabase.com:6543/postgres

# Application Configuration
NODE_ENV=production
PORT=5000

# Database Connection Pool Settings
PGHOST=aws-0-eu-north-1.pooler.supabase.com
PGPORT=6543
PGDATABASE=postgres
PGUSER=postgres.oolcnbxrnuefxfdpvsfn
PGPASSWORD=dsadasSDASdsaDASDASasdsadas3434
```

### 3. Build and Deploy

Run the single deployment script:

```bash
docker-deploy.bat
```

This script will:
- Build the client application
- Compile the production server
- Create and start the Docker container

### 4. Access Application

- **Application URL**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Manual Commands

### Build Application
```bash
npm install
npm run build
npx esbuild server/production-server.ts --platform=node --packages=external --bundle --format=esm --outfile=server/production-server.js
```

### Docker Operations
```bash
# Build image
docker build -t cdp-app:latest .

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop application
docker-compose down

# Restart application
docker-compose restart
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Complete Supabase PostgreSQL connection string | Yes |
| `NODE_ENV` | Environment (production) | Yes |
| `PORT` | Application port (default: 5000) | No |
| `PGHOST` | Database host | Yes |
| `PGPORT` | Database port | Yes |
| `PGDATABASE` | Database name | Yes |
| `PGUSER` | Database username | Yes |
| `PGPASSWORD` | Database password | Yes |

### Optional Integrations

Add these to `.env` for full functionality:

```env
# Email Services
SENDGRID_API_KEY=your_sendgrid_api_key

# Slack Integration
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_CHANNEL_ID=your_slack_channel_id

# AWS S3 Storage
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_s3_bucket
```

## Troubleshooting

### Common Issues

1. **Docker not running**
   - Start Docker Desktop
   - Ensure WSL2 is enabled

2. **Build failures**
   - Check Node.js version (18+ required)
   - Clear node_modules: `rmdir /s node_modules && npm install`

3. **Database connection issues**
   - Verify DATABASE_URL format
   - Check Supabase credentials
   - Ensure network connectivity

4. **Port conflicts**
   - Change PORT in .env file
   - Update docker-compose.yml ports mapping

### Health Checks

Check application status:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-06-22T07:38:00.000Z",
  "version": "1.0.0",
  "database": "Supabase (Neon serverless)"
}
```

### Logs and Debugging

View application logs:
```bash
docker-compose logs -f cdp-app
```

View container status:
```bash
docker-compose ps
```

## Security Considerations

- Keep `.env` file secure and never commit to version control
- Use strong database passwords
- Regularly update Docker images
- Monitor application logs for security issues

## Performance Optimization

- The application uses connection pooling for database efficiency
- Static files are served directly by Express
- Docker image uses multi-stage build for smaller size
- Health checks ensure container reliability

## Authentication & Security

The application requires valid user authentication:

**Default Login Credentials:**
- Email: `ahmed.abdqader@4sale.tech`
- Password: `Admin123!`

**Security Features:**
- No automatic login - users must authenticate
- Only database users can access the application
- Password validation and error handling
- Session management with localStorage

**Testing Authentication:**
```bash
# Test the authentication system
node test-auth.js
```

## Support

For issues:
1. Check logs with `docker-compose logs -f`
2. Verify environment configuration
3. Test database connectivity
4. Test authentication with `node test-auth.js`
5. Review firewall and network settings