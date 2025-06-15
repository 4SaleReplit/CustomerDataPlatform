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

### Simplified Container Deployment Strategy
- **Architecture**: Single Docker container with Node.js serving everything
- **Frontend**: React build served as static files by Express
- **Backend**: Node.js Express API and static file serving on port 5000
- **Platform**: ARM64 optimized for AWS Graviton processors
- **Cost Optimization**: 70-75% reduction in infrastructure costs vs separate containers

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
- **Primary Database**: PostgreSQL for application data (users, cohorts, campaigns, etc.)
- **Data Warehouse**: Snowflake for analytics and user segmentation data
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