# Windows Build Guide - Customer Data Platform

This guide provides step-by-step instructions for building and running the Customer Data Platform using Docker on Windows machines.

## Prerequisites

### Required Software
- **Docker Desktop for Windows** (latest version)
- **Git** (for cloning the repository)
- **Node.js 20** (for local development and building)
- **PowerShell** (Windows 10/11 built-in)

### System Requirements
- Windows 10/11 (64-bit)
- WSL2 enabled
- At least 8GB RAM (16GB recommended)
- 10GB free disk space

## Step 1: Install Docker Desktop

1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Run the installer and follow the setup wizard
3. Enable WSL2 integration during installation
4. Restart your computer when prompted
5. Verify installation:
   ```powershell
   docker --version
   docker-compose --version
   ```

## Step 2: Clone the Repository

```powershell
# Clone the repository
git clone <repository-url>
cd CustomerDataPlatform

# Or if you have the source code already, navigate to the directory
cd D:\Projects\CustomerDataPlatform
```

## Step 3: Environment Configuration

1. **Create/Update `.env` file** with your database configuration:
   ```env
   # Database Configuration
   DATABASE_URL=postgresql://username:password@host:port/database
   
   # Application Configuration
   NODE_ENV=production
   PORT=5000
   HOST=0.0.0.0
   SESSION_SECRET=your-super-secret-session-key-change-this-in-production
   ```

2. **Update database URL** with your PostgreSQL connection string (Supabase, AWS RDS, etc.)

## Step 4: Build the Application

### Option A: Build Locally First (Recommended)

```powershell
# Install dependencies
npm install

# Build the application
npm run build

# Verify build succeeded
ls dist/
```

### Option B: Build Everything in Docker

If you prefer to build everything inside Docker (slower but more isolated):

```powershell
# Use the production Dockerfile
docker-compose -f docker-compose.yml up --build -d
```

## Step 5: Run with Docker

### Using the Fixed Configuration (Recommended)

```powershell
# Start the application
docker-compose -f docker-compose.fixed.yml up --build -d

# Check status
docker-compose -f docker-compose.fixed.yml ps

# View logs
docker-compose -f docker-compose.fixed.yml logs cdp-app
```

### Available Services

- **CDP Application**: http://localhost:5000
- **Redis Cache**: localhost:6379
- **Health Check**: http://localhost:5000/health

## Step 6: Verify Installation

1. **Check Health Endpoint**:
   ```powershell
   curl http://localhost:5000/health
   ```

2. **Test Main Application**:
   ```powershell
   # Open in browser
   start http://localhost:5000
   ```

3. **Check Container Status**:
   ```powershell
   docker-compose -f docker-compose.fixed.yml ps
   ```

## Troubleshooting

### Common Issues

#### 1. Docker Build Fails
```powershell
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose -f docker-compose.fixed.yml build --no-cache
```

#### 2. Port Already in Use
```powershell
# Check what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

#### 3. Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Ensure your database server is accessible from Docker
- Check firewall settings

#### 4. Memory Issues
- Increase Docker Desktop memory allocation (Settings > Resources > Memory)
- Close unnecessary applications

### Useful Commands

```powershell
# Stop all services
docker-compose -f docker-compose.fixed.yml down

# Start services
docker-compose -f docker-compose.fixed.yml up -d

# Restart specific service
docker-compose -f docker-compose.fixed.yml restart cdp-app

# View real-time logs
docker-compose -f docker-compose.fixed.yml logs -f cdp-app

# Access container shell
docker-compose -f docker-compose.fixed.yml exec cdp-app sh

# Remove all containers and volumes
docker-compose -f docker-compose.fixed.yml down -v
```

## Development Mode

For development with hot reloading:

```powershell
# Install dependencies locally
npm install

# Run in development mode
npm run dev
```

## File Structure

```
CustomerDataPlatform/
├── docker-compose.fixed.yml    # Production Docker setup
├── Dockerfile.fixed           # Production Dockerfile
├── .env                       # Environment variables
├── package.json              # Dependencies
├── dist/                     # Built application
├── client/                   # Frontend source
├── server/                   # Backend source
└── shared/                   # Shared utilities
```

## Performance Optimization

### For Better Performance:
1. **Allocate more resources** to Docker Desktop
2. **Use SSD storage** for better I/O performance
3. **Enable file sharing** only for necessary directories
4. **Disable Windows Defender** real-time scanning for project folder (if safe to do so)

## Security Considerations

1. **Change default secrets** in `.env` file
2. **Use strong database passwords**
3. **Keep Docker Desktop updated**
4. **Don't expose unnecessary ports**
5. **Use HTTPS in production**

## Next Steps

- For production deployment, see `KUBERNETES_PRODUCTION_GUIDE.md`
- For development setup, see `README.md`
- For database migrations, see `DATABASE_MIGRATION_PLAN.md`

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Docker Desktop logs
3. Verify system requirements
4. Check firewall and antivirus settings 