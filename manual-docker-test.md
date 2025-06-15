# Manual Docker Testing Guide

## If PowerShell Script Fails

### Step 1: Check Docker Desktop Status
```powershell
# Test basic Docker functionality
docker --version
docker info
```

If these fail, Docker Desktop isn't properly running or configured.

### Step 2: Manual Build Test
```powershell
# Build the image manually
docker build -f Dockerfile.production -t cdp-test .
```

### Step 3: Manual Container Start
```powershell
# If build succeeds, start manually
docker run -p 5000:5000 --env-file .env cdp-test
```

### Step 4: Alternative with Docker Compose
```powershell
# Use docker-compose directly
docker-compose -f docker-compose.production.yml up --build
```

## Common Windows Docker Issues & Solutions

### Issue 1: "Docker Desktop Linux Engine not found"
**Solution:** 
- Open Docker Desktop settings
- Go to General → Use WSL 2 based engine (check this)
- Go to Resources → WSL Integration → Enable integration
- Restart Docker Desktop

### Issue 2: "Access Denied" or Permission Errors
**Solution:**
```powershell
# Run PowerShell as Administrator
# Or add your user to docker-users group:
net localgroup docker-users "YourUsername" /add
```

### Issue 3: "Port already in use"
**Solution:**
```powershell
# Check what's using port 5000
netstat -ano | findstr :5000
# Kill the process if needed
taskkill /PID <process_id> /F
```

### Issue 4: WSL/Hyper-V Problems
**Solution:**
- Enable Windows features: Hyper-V, Windows Subsystem for Linux
- Restart computer
- Update Docker Desktop to latest version

## Verification Checklist

- [ ] Docker Desktop is running and shows green status
- [ ] WSL 2 integration is enabled (Windows settings)
- [ ] .env file exists in project root
- [ ] Port 5000 is not being used by another service
- [ ] User account has Docker permissions

## Alternative Testing (Without Docker)

If Docker continues to fail, you can test the build directly:

```powershell
# Test the exact build process Docker would use
npm run build

# Check if dist folder is created with server and client files
dir dist
```

This verifies the application builds correctly, which is the main requirement for Docker deployment.