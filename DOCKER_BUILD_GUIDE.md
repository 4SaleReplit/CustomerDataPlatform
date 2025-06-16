# Docker Build Guide - Production Deployment

## Quick Fix for Vite Import Error

The error `Cannot find package 'vite'` occurs because the production build tries to import Vite at runtime. Here's how to fix it:

### 1. Build Commands
```bash
# Build frontend first
npm run build

# Build backend with TypeScript compiler
npx tsc

# Copy the production Vite module
cp server/vite-production.js dist/

# Build Docker image
docker build -t cdp-app .
```

### 2. Alternative: Use Docker Compose
```bash
docker-compose up --build
```

## Production Build Process

### Frontend Build
- Vite builds React app to `client/dist/`
- Assets are optimized and bundled
- Built files copied to `dist/public/` in Docker

### Backend Build
- TypeScript compiled to `dist/`
- Production-safe module (`vite-production.js`) handles static serving
- No Vite runtime dependencies required

## Environment Variables Required

```env
NODE_ENV=production
DATABASE_URL=your_database_url
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_USERNAME=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_DATABASE=your_database
SNOWFLAKE_SCHEMA=your_schema
SNOWFLAKE_WAREHOUSE=your_warehouse
```

## Dockerfile Explanation

1. **Builder Stage**: Installs all dependencies, builds frontend and backend
2. **Production Stage**: Only production dependencies, optimized runtime
3. **Static Files**: Frontend served directly by Express (no nginx required)
4. **Health Check**: Available at `/health` endpoint

## Troubleshooting

### "Cannot find package 'vite'" Error
- Ensure `NODE_ENV=production` is set
- Verify `server/vite-production.js` exists in build
- Check that frontend is built to correct location

### Missing Frontend Files
- Run `npm run build` before Docker build
- Verify `client/dist/` contains built files
- Check Docker COPY commands include frontend

### Port Issues
- Application runs on port 5000
- Health check available at `http://localhost:5000/health`
- Map Docker port: `-p 5000:5000`

## Production Optimizations

- Multi-stage Docker build reduces image size
- Production dependencies only in final image
- Static file serving optimized for performance
- Health checks for container orchestration
- Non-root user for security