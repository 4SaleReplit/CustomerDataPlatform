# Quick Start: Connect Your PostgreSQL Database

## Step 1: Set Your Database URL
```bash
# Replace with your actual database credentials
export DATABASE_URL="postgresql://username:password@hostname:5432/database_name"

# Examples:
# Local: export DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/cdp_platform"
# Cloud: export DATABASE_URL="postgresql://user:pass@your-host.com:5432/yourdb"
# AWS RDS: export DATABASE_URL="postgresql://user:pass@db.region.rds.amazonaws.com:5432/cdp"
```

## Step 2: Test Connection
```bash
node test-db-connection.js
```

## Step 3: Run Migration
```bash
node migrate-database.js
```

## Step 4: Start Application
```bash
npm run dev
```

## That's it! Your database is now integrated.

### Quick Commands:
- Test connection: `node test-db-connection.js`
- Migrate schema: `node migrate-database.js`  
- Push schema changes: `npm run db:push`

### Environment Variables for Different Setups:

**Local PostgreSQL:**
```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5432/cdp_platform"
```

**Docker Compose (if running PostgreSQL in Docker):**
```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5432/cdp_platform"
```

**Cloud Providers:**
```bash
# AWS RDS
export DATABASE_URL="postgresql://username:password@your-db.region.rds.amazonaws.com:5432/cdp_platform"

# Google Cloud SQL
export DATABASE_URL="postgresql://username:password@your-ip:5432/cdp_platform"

# Azure Database
export DATABASE_URL="postgresql://username@server:password@server.postgres.database.azure.com:5432/cdp_platform?sslmode=require"

# Heroku Postgres
export DATABASE_URL="postgresql://user:pass@host:5432/database?sslmode=require"

# DigitalOcean Managed Database
export DATABASE_URL="postgresql://user:pass@host:25060/database?sslmode=require"
```

### Troubleshooting:
- **Connection failed**: Check username, password, and hostname
- **Database not found**: Create the database first or check the database name
- **Permission denied**: Ensure your user has CREATE and INSERT permissions
- **SSL errors**: Add `?sslmode=require` or `?sslmode=disable` to your URL

Your Customer Data Platform will automatically connect to your database and work with all existing functionality including Snowflake integration, dashboard tiles, cohorts, and campaigns.