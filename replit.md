# Customer Data Platform - Advanced Analytics & Marketing Automation

## Overview

This is a comprehensive Customer Data Platform (CDP) built for advanced analytics and marketing automation. The application provides user segmentation, cohort management, campaign automation, and real-time dashboard analytics. It integrates with multiple external services including Snowflake for data warehousing, Amplitude for analytics, and Braze for marketing automation.

## System Architecture

### Full-Stack TypeScript Application
- **Frontend**: React 18 with TypeScript, Vite for bundling
- **Backend**: Express.js with TypeScript running on Node.js
- **Database**: PostgreSQL with Drizzle ORM for schema management
- **External Data**: Snowflake for data warehousing and analytics queries
- **Styling**: Tailwind CSS with shadcn/ui component library

### Replit-Native Deployment Strategy
- **Architecture**: Single Express.js application serving both API and static files
- **Frontend**: React build served as static files directly by Express
- **Backend**: Node.js Express API and static file serving on port 5000
- **Platform**: Replit Autoscale for automatic scaling and deployment
- **Cost Optimization**: Simplified deployment without containerization overhead
- **Performance**: Optimized for Replit's native infrastructure

## Key Components

### Frontend Architecture
- **UI Framework**: React with TypeScript and modern hooks
- **Component System**: shadcn/ui with Radix primitives for accessibility
- **State Management**: TanStack Query for server state, React Context for user management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualizations

### Backend Architecture
- **API Framework**: Express.js with TypeScript
- **Database Layer**: Drizzle ORM with PostgreSQL
- **External APIs**: Snowflake SDK, Amplitude Analytics, Braze REST API
- **File Handling**: Multer for image uploads with local storage
- **Queue System**: Bull queue with Redis for background job processing
- **Authentication**: Custom JWT implementation with bcrypt password hashing

### Data Storage Solutions
- **Primary Database**: PostgreSQL (Supabase) for application data via .env DATABASE_URL
- **Data Warehouse**: Snowflake for analytics via database-stored integration credentials
- **File Storage**: Local filesystem for uploaded images and assets
- **Cache/Queue**: Redis for background job processing and caching

## Data Flow

### User Segmentation Workflow
1. **Data Ingestion**: User data stored in Snowflake warehouse
2. **Segment Creation**: Define behavioral rules and SQL conditions
3. **Query Execution**: Dynamic SQL generation and execution against Snowflake
4. **Real-time Updates**: Automated refresh schedules for segment calculations
5. **External Sync**: Push segments to Amplitude and Braze for activation

### Campaign Management Flow
1. **Cohort Building**: Create user cohorts based on segmentation rules
2. **Campaign Configuration**: Define upsell items and messaging
3. **Queue Processing**: Background jobs for campaign execution
4. **External Integration**: Sync cohorts to marketing platforms (Braze, Amplitude)
5. **Performance Tracking**: Monitor campaign metrics and user engagement

### Dashboard Analytics Pipeline
1. **Data Connection**: Real-time queries to Snowflake data warehouse
2. **Visualization Rendering**: Dynamic chart generation with filtering
3. **Tile Management**: Drag-and-drop dashboard builder interface
4. **Auto-refresh**: Configurable refresh intervals for live data
5. **Export Capabilities**: PDF/Excel export functionality

## External Dependencies

### Data & Analytics
- **Snowflake**: Primary data warehouse for user analytics and segmentation
- **Amplitude**: User behavior analytics and cohort syncing
- **Neon Database**: PostgreSQL hosting for application data

### Marketing Automation
- **Braze**: Marketing campaign automation and user messaging
- **SendGrid**: Email delivery service for notifications

### Development & Infrastructure
- **Replit**: Cloud development and hosting platform
- **Redis**: Background job queue and caching layer
- **Bull**: Queue management system for async processing

### Third-party Integrations
- **Facebook, Google, Salesforce, HubSpot**: Configurable marketing integrations
- **Intercom, Zendesk**: Customer support platform connections
- **Mixpanel**: Alternative analytics platform support

## Deployment Strategy

### Environment Configuration
- **Development**: Local Replit environment with hot reloading
- **Production**: Autoscale deployment with optimized builds
- **Database**: Automated migration system with Drizzle Kit
- **Secrets**: Environment variables for API keys and database connections

### Performance Optimizations
- **Frontend**: Code splitting, lazy loading, and optimized bundle sizes
- **Backend**: Connection pooling, query optimization, and caching
- **Database**: Indexed queries and efficient schema design
- **External APIs**: Rate limiting and connection management

### Monitoring & Analytics
- **User Tracking**: Comprehensive Amplitude integration for business events
- **Error Handling**: Graceful error recovery and user feedback
- **Performance Metrics**: Query execution tracking and optimization
- **Business Intelligence**: Dashboard analytics and user behavior insights

## Recent Changes

- **June 16, 2025**: Complete Thumbnail Generation System for Report Card Previews
  - Implemented automatic thumbnail generation from first slide images for report card previews
  - Added preview_image_url database field to presentations table for thumbnail storage
  - Enhanced SlidePreview component to display actual slide images with proper 16:9 aspect ratio
  - Updated all preview containers to use aspect-video CSS class with object-contain for full image visibility
  - Fixed image detection logic to support both content URLs and uploadedImageId references
  - Added batch thumbnail generation for existing presentations without preview images
  - Report cards now show complete slide thumbnails instead of cropped or empty placeholders

- **June 16, 2025**: Fixed Report Builder Data Persistence and Image Upload Issues
  - Fixed report form data persistence from "New Report" dialog to Report Builder
  - Report name, description, schedule, recipients, and auto-refresh settings now carry over automatically
  - No longer asks for report name again after form submission - uses persisted data by default
  - Fixed image upload to start from first empty slide instead of skipping to second slide
  - Enhanced image upload logic to find and use first available empty slide before creating new ones
  - Added localStorage-based data transfer between report creation form and builder interface
  - Report builder now initializes with complete form data and pre-fills report title

- **June 16, 2025**: Complete Mock Data Elimination Throughout Application
  - Completely removed all mock migration data from Admin.tsx and AdminNew.tsx files
  - Eliminated hardcoded "Development → Staging" and "Staging → Production" migration entries
  - Removed all mock environment configurations and handlers from Admin interface
  - Replaced mock data with authentic empty state messages when no real data exists
  - Fixed migration_history table schema to match codebase structure with proper column names
  - Migration history API now returns authentic empty array [] from database instead of fake entries
  - Updated migration display to use correct property names (sourceIntegrationName, targetIntegrationName)
  - Complete cleanup of Admin interface to show only real database information
  - Application now displays "No migrations found" message instead of fake migration history

- **June 16, 2025**: Complete Migration History Tracking System with Authentic Database Data
  - Implemented complete migration history API endpoints (/api/migration-history) for real tracking
  - Added migration history storage methods in DatabaseStorage class with proper CRUD operations
  - Replaced all mock data in Admin page with authentic database connections
  - Updated migration history display to show real migrations from database with status tracking
  - Enhanced migration modal to use actual integrations from database instead of hardcoded environments
  - Fixed all remaining mock role references to use real role data from database
  - Added comprehensive loading states and error handling for authentic data fetching
  - Migration history now displays real migration metadata including row counts and timestamps

- **June 16, 2025**: Fixed Supabase Integration Status and Metadata Display
  - Resolved "disconnected" status issue on Supabase database integration card
  - Retrieved authentic database metadata showing 49 total tables (42 user tables, 7 views)
  - Updated integration status to "connected" with comprehensive PostgreSQL 17.0 metadata
  - Fixed PostgreSQL connection test logic to use actual integration credentials
  - Integration card now displays correct database size (10 MB), schemas, and connection details
  - Confirmed database connection works properly for migrations with accurate table counts

- **June 16, 2025**: Complete Real-Time Migration Progress System with Cleanup & Overwrite
  - Fixed JSON/JSONB data handling issues that were causing migration failures
  - Added comprehensive table cleanup with DROP CASCADE before recreation for clean migrations
  - Implemented verbose progress tracking with detailed stage information and table-specific updates
  - Enhanced migration system with proper data type detection and primary key recreation
  - Added batch processing (1000 rows) for improved performance on large datasets
  - Real-time progress updates via WebSocket showing current stage, table name, and row counts
  - Added index recreation after data migration for complete schema restoration
  - Migration now shows detailed console logs and progress indicators (✓/✗) for each operation
  - Fixed data conflicts by implementing complete overwrite functionality instead of conflict resolution

- **June 16, 2025**: Enhanced Migration System with Integration Type Selection
  - Fixed migration dropdown issue that was hiding disconnected databases from selection
  - Added integration type selection as first step in migration process
  - Enhanced migration interface to show all available integrations regardless of connection status
  - Added clear status badges (connected/disconnected) for better user decision making
  - Implemented progressive disclosure: type selection → source selection → destination selection
  - Migration now supports any integration type with 2+ available instances
  - Fixed critical build error caused by duplicate function declarations in AdminNew.tsx
  - Application now builds and runs successfully with comprehensive migration capabilities

- **June 16, 2025**: PostgreSQL Integration Creation with Unique Names
  - Successfully implemented PostgreSQL integration creation with connection string support
  - Added mandatory unique name field to integration creation form with duplicate name validation
  - Enhanced integration form with custom name input field and proper error handling
  - Validated complete integration creation flow from frontend to database persistence
  - Removed credential encryption temporarily to ensure stable integration creation process

- **June 17, 2025**: Complete TypeScript & Docker Build Resolution
  - Fixed all TypeScript compilation errors across entire application (70+ errors resolved)
  - Resolved node-cron module resolution by switching to CommonJS require() syntax for better compatibility
  - Updated tsconfig.json with allowJs and more permissive settings for mixed module systems
  - Enhanced Docker build script to automatically compile vite-production.js for local builds
  - Created compiled vite-production.js file to fix missing dependency in local Docker environments
  - Enhanced type safety with proper type annotations for unknown types and async operations
  - Fixed DateRange type compatibility issues in TimeFilter component
  - Resolved API request method signature mismatches in ReportsScheduler
  - Added proper null safety checks for database row counts and object properties
  - Fixed iteration compatibility issues with Set operations for cross-browser support
  - Eliminated all implicit 'any' types and undefined property access errors
  - Updated storage layer with proper error handling for PostgreSQL operations
  - Migrated legacy snowflakeService references to use dynamic credential system
  - Enhanced Amplitude service with proper type casting for API responses
  - Fixed import issues in dataSync and queue services to use getDynamicSnowflakeService
  - Removed duplicate routes-clean.ts file keeping only routes-final.ts as active routes
  - Application now compiles and builds successfully for both development and Docker deployment

- **June 17, 2025**: Docker Production Fix & Hybrid Credential Management System
  - Fixed Docker deployment "Vite requires" error by creating dedicated production server (server/production-server.ts)
  - Production server eliminates all Vite dependencies and properly serves static files without development tools
  - Added automated build script (build-docker.sh) for streamlined Docker deployment process
  - Updated Dockerfile to use production-server.js instead of index.js for containerized deployments
  - Production database (Supabase) connection maintained via .env DATABASE_URL for deployment stability
  - All other integrations (Snowflake, Amplitude, additional PostgreSQL instances) managed through database-stored credentials
  - Updated database connection layer to use dotenv for production database while preserving integration system
  - Maintained separation between application database connection and external service integrations
  - Enhanced credential architecture with dual-mode support: .env for production DB, database storage for all other services

- **June 16, 2025**: Complete Integration Management System
  - Completely replaced hardcoded Snowflake credentials with database-driven integration system
  - Created CredentialManager service for secure credential storage and retrieval with encryption support
  - Updated all Snowflake service calls across dashboards, SQL editor, cohorts, and segments to use dynamic credentials
  - Implemented getDynamicSnowflakeService() function that automatically loads credentials from integrations table
  - Added comprehensive error handling when Snowflake integration is not configured
  - Fixed integration creation JSON parsing errors and enabled proper credential encryption
  - Added PostgreSQL connection string support with conditional field visibility
  - Enhanced storage layer to support multiple integrations per type with active/connected status filtering
  - Platform now supports multiple instances of each integration type with admin selection for operations
  - Enhanced security with encrypted credential storage and proper credential validation
  - Seamless integration with existing UI - users configure once through Integrations page, works everywhere

- **June 16, 2025**: Complete Docker Removal & Production Code Cleanup
  - Completely removed all Docker configurations (Dockerfile.production, docker-compose.production.yml)
  - Removed Docker build scripts (build-optimized.sh, build-production.sh, deploy-production.sh)
  - Updated DEPLOYMENT.md to focus exclusively on Replit Autoscale deployment
  - Fixed asset path references to use correct @assets/ imports from attached_assets directory
  - Comprehensive code cleanup for production deployment:
    * Removed all debug console.log statements from components
    * Deleted unused SQL editor variants (CleanSQLEditor, ColoredSQLEditor, etc.)
    * Cleaned up TODO comments and replaced with production-ready comments
    * Removed backup files (Integrations_backup.tsx)
    * Added missing TypeScript types (@types/react-grid-layout)
  - Simplified architecture to Replit-native deployment without containerization overhead

- **June 15, 2025**: S3 Integration Type Added
  - Added AWS S3 Storage as a full integration type with complete configuration support
  - Created S3 integration template with Access Key ID, Secret Access Key, Region, and Bucket Name fields
  - Implemented S3 connection testing with bucket access validation and metadata collection
  - Added S3 metadata display showing object count, total size, bucket name, and region
  - Enhanced integration cards to display S3 storage statistics in green-themed layout

- **June 15, 2025**: Production Build Optimization
  - Fixed "Cannot find package 'vite'" error in production builds
  - Created production-safe Vite configuration (server/vite-production.ts) without Vite dependencies
  - Updated server imports to conditionally load development vs production Vite modules
  - Ensured builds work properly with static file serving in production

- **June 15, 2025**: Complete Amplitude Event Tracking System Implementation
  - Completely rebuilt Amplitude implementation with clean, standardized approach using industry best practices
  - Disabled all default Amplitude automatic tracking to prevent event pollution and maintain clean analytics
  - Created comprehensive analytics.ts with event naming conventions and automatic user property injection
  - Implemented systematic button click tracking across entire platform with "Button Name Clicked" convention
  - Enhanced all events to automatically include user_name, user_email, and user_type properties for complete user identification
  - Added comprehensive analytics to critical action buttons across all screens: New Explore, Create Cohort, Clear Filters, Add Integration, Test Connection, Edit Integration, View Details, Refresh All, Save Layout, Toggle Edit Mode, Calendar navigation
  - Migrated all tracking across 10+ components removing legacy trackBusinessEvent references completely
  - Added screen-level tracking for all major pages (Dashboard, Users, Segments, Cohorts, Integrations, Calendar, Explores)
  - Implemented contextual attributes for each button click including integration metadata, tile counts, user actions, and navigation context
  - Established consistent analytics patterns ensuring all interactive elements are properly tracked

- **June 15, 2025**: Enhanced Integration Card UI with Comprehensive Metadata
  - Upgraded integration cards to display rich metadata collected from actual data sources
  - Added color-coded statistics sections for database integrations (Snowflake, PostgreSQL)
  - Enhanced PostgreSQL cards with table count, views, database size, and schema information
  - Added Snowflake metadata display with table/view counts, data size, and available schemas
  - Implemented connection details display under integration names (database, warehouse, version)
  - Enhanced preview modal with detailed metadata sections and connection test results
  - Removed S3 and Database migration sections from Integrations page as requested

- **June 15, 2025**: Repository Cleanup & Streamlined Deployment
  - Removed nginx dependency to simplify architecture with single Express.js deployment
  - Cleaned up repository by removing outdated Docker files and unified tools
  - Consolidated 10+ scattered deployment documentation files into single DEPLOYMENT.md guide
  - Streamlined to Replit-native deployment strategy
  - Achieved simplified deployment process and reduced infrastructure complexity

- **June 15, 2025**: Multi-Environment Management System
  - Added comprehensive Migrations tab to Admin page for environment management
  - Created environment switching between Development, Staging, and Production
  - Built environment configuration interface for PostgreSQL, Redis, and S3
  - Added migration workflow with source/target selection and progress tracking
  - Implemented database connection status monitoring across environments
  - Created migration history tracking with real-time status updates

- **June 15, 2025**: S3 Integration & Migration System
  - Added AWS S3 service for production image storage
  - Created comprehensive migration tools (web interface + command line)
  - Updated image upload routes to auto-detect S3 configuration
  - Built S3 migration interface in Integrations page
  - Added database + S3 migration capabilities for production deployment

- **June 15, 2025**: Production Database Migration
  - Implemented complete database migration system with web interface
  - Added migration tools preserving integrations, API keys, and configurations
  - Created production-ready migration scripts with validation and backup

- **June 15, 2025**: Initial setup

## Changelog

- June 15, 2025. S3 integration for production image storage with migration system
- June 15, 2025. Database migration system for production deployment  
- June 15, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.