
# Application Documentation

## Table of Contents
1. [Application Overview](#application-overview)
2. [Page Structure & User Flows](#page-structure--user-flows)
3. [Data Models & API Requirements](#data-models--api-requirements)
4. [Authentication & Authorization](#authentication--authorization)
5. [Integration Requirements](#integration-requirements)

## Application Overview

This is a comprehensive customer lifecycle management and analytics platform built with React, featuring dashboard analytics, user management, cohort analysis, campaign management, and data integrations.

### Technology Stack
- Frontend: React, TypeScript, Tailwind CSS, Shadcn UI
- Charts: Recharts
- Routing: React Router DOM
- State Management: React Query (TanStack Query)

## Page Structure & User Flows

### 1. Dashboard Page (`/`)
**Purpose**: Main analytics overview and customizable dashboard

**User Flow**:
1. User lands on dashboard
2. Views KPI metrics at top (6 metric cards)
3. Can toggle edit mode to customize dashboard tiles
4. Can apply time filters (chart type, time range, granularity)
5. Can refresh individual tiles or all tiles
6. Can add, edit, duplicate, or remove dashboard tiles

**Data Points Required**:
- KPI Metrics:
  - Daily Active Users (count, percentage change)
  - New Users (count, percentage change)
  - Revenue Today (currency amount, percentage change)
  - Average Session Duration (time format, percentage change)
  - Conversion Rate (percentage, percentage change)
  - Active Listings (count, percentage change)

- Dashboard Tiles:
  - User Activity Trends (time series data)
  - User Journey Funnel (step-wise conversion data)
  - Top Performers (user rankings with CLTV)
  - Total Revenue (aggregated financial data)
  - Churn Risk Users (user segmentation data)

**API Endpoints Needed**:
```
GET /api/dashboard/kpis?timeRange=30d&granularity=daily
GET /api/dashboard/tiles/{tileId}/data?filters={}
POST /api/dashboard/tiles - Create new tile
PUT /api/dashboard/tiles/{tileId} - Update tile configuration
DELETE /api/dashboard/tiles/{tileId} - Remove tile
POST /api/dashboard/refresh - Refresh all tile data
```

### 2. Users Page (`/users`)
**Purpose**: User exploration and management interface

**User Flow**:
1. User accesses user explorer
2. Can search by email, name, or user ID
3. Can filter by user type (premium/regular)
4. Can filter by role (lister/buyer)
5. Can filter by status (active/inactive)
6. Views paginated user list with detailed information
7. Can click to view individual user profiles
8. Can export user data

**Data Points Required**:
- User Records:
  - user_id (unique identifier)
  - email (contact information)
  - name (display name)
  - user_type (premium/regular)
  - user_roles (array: lister, buyer)
  - account_status (active/inactive)
  - created_date (registration date)
  - last_login (last activity)
  - total_listings (count of listings)
  - total_purchases (count of purchases)
  - cltv (customer lifetime value)

**API Endpoints Needed**:
```
GET /api/users?search=&type=&role=&status=&page=&limit=
GET /api/users/{userId} - Individual user details
POST /api/users/export - Export user data
GET /api/users/stats - User statistics for filters
```

### 3. User Profile Page (`/users/:userId`)
**Purpose**: Detailed individual user view and management

**User Flow**:
1. User navigates from users list or direct link
2. Views comprehensive user profile
3. Sees user activity timeline
4. Views user's listings and purchases
5. Can see lifecycle stage and behavioral data
6. Can access user-specific actions

**Data Points Required**:
- Extended User Profile:
  - All basic user data from Users page
  - Profile picture/avatar
  - Phone number, address
  - Lifecycle stage (new, active, at_risk, churned)
  - Account creation source
  - Verification status
  - Payment methods
  - Communication preferences

- User Activity:
  - Login history
  - Page views and session data
  - Transaction history
  - Listing creation/management history
  - Communication history

**API Endpoints Needed**:
```
GET /api/users/{userId}/profile
GET /api/users/{userId}/activity?timeRange=
GET /api/users/{userId}/transactions
GET /api/users/{userId}/listings
PUT /api/users/{userId}/profile
```

### 4. Cohorts Page (`/cohorts`)
**Purpose**: User cohort analysis and management

**User Flow**:
1. User views existing cohorts
2. Can create new cohorts using cohort builder
3. Can view cohort performance metrics
4. Can edit or delete existing cohorts
5. Can export cohort data

**Data Points Required**:
- Cohort Definitions:
  - cohort_id
  - name, description
  - creation_date
  - cohort_criteria (rules for inclusion)
  - user_count
  - retention_rates
  - revenue_metrics

**API Endpoints Needed**:
```
GET /api/cohorts
POST /api/cohorts - Create new cohort
GET /api/cohorts/{cohortId}
PUT /api/cohorts/{cohortId}
DELETE /api/cohorts/{cohortId}
GET /api/cohorts/{cohortId}/users
```

### 5. Cohort Builder Page (`/cohorts/new`)
**Purpose**: Create new user cohorts with custom criteria

**User Flow**:
1. User selects cohort type and criteria
2. Defines time periods and filters
3. Previews cohort size and characteristics
4. Saves cohort configuration
5. Redirects to cohort detail page

**Data Points Required**:
- Cohort Building Criteria:
  - User attributes (registration date, user type, etc.)
  - Behavioral criteria (activity levels, purchase history)
  - Geographic criteria
  - Time-based criteria

### 6. Cohort Detail Page (`/cohorts/:cohortId`)
**Purpose**: Detailed cohort analysis and performance tracking

**User Flow**:
1. User views cohort summary and metrics
2. Analyzes retention curves and trends
3. Views cohort user list
4. Can modify cohort criteria
5. Can export cohort analysis

**Data Points Required**:
- Cohort Analytics:
  - Retention rates by time period
  - Revenue trends within cohort
  - User behavior patterns
  - Comparison with other cohorts

### 7. Segments Page (`/segments`)
**Purpose**: User segmentation for marketing and analysis

**User Flow**:
1. User views existing segments
2. Can create new segments
3. Views segment performance
4. Manages segment-based campaigns

**Data Points Required**:
- Segment Definitions:
  - segment_id, name, description
  - segment_criteria
  - user_count
  - segment_performance_metrics

**API Endpoints Needed**:
```
GET /api/segments
POST /api/segments
GET /api/segments/{segmentId}
PUT /api/segments/{segmentId}
DELETE /api/segments/{segmentId}
```

### 8. Campaigns Page (`/campaigns`)
**Purpose**: Marketing campaign management and analytics

**User Flow**:
1. User views campaign list
2. Can create new campaigns
3. Views campaign performance
4. Can pause, resume, or stop campaigns
5. Analyzes campaign ROI and effectiveness

**Data Points Required**:
- Campaign Data:
  - campaign_id, name, description
  - campaign_type (email, push, in-app)
  - target_segments
  - start_date, end_date
  - status (active, paused, completed)
  - performance_metrics (open_rate, click_rate, conversion_rate)
  - budget and spend data

**API Endpoints Needed**:
```
GET /api/campaigns
POST /api/campaigns
GET /api/campaigns/{campaignId}
PUT /api/campaigns/{campaignId}
DELETE /api/campaigns/{campaignId}
GET /api/campaigns/{campaignId}/analytics
```

### 9. Campaign Builder Page (`/campaigns/new`)
**Purpose**: Create and configure new marketing campaigns

**User Flow**:
1. User selects campaign type and template
2. Defines target audience/segments
3. Creates campaign content
4. Sets scheduling and budget
5. Reviews and launches campaign

### 10. Promotions Page (`/promotions`)
**Purpose**: Promotional offer management

**User Flow**:
1. User views active and scheduled promotions
2. Can create new promotional offers
3. Tracks promotion performance
4. Manages promotion lifecycle

**Data Points Required**:
- Promotion Data:
  - promotion_id, name, description
  - promotion_type (discount, cashback, etc.)
  - discount_amount, discount_type
  - start_date, end_date
  - usage_limits, user_eligibility
  - performance_metrics

### 11. Calendar Page (`/calendar`)
**Purpose**: Campaign and event scheduling visualization

**User Flow**:
1. User views calendar with campaigns and events
2. Can navigate between months
3. Can create new campaigns from calendar
4. Views campaign overlaps and scheduling conflicts

**Data Points Required**:
- Calendar Events:
  - event_id, name, type
  - start_date, end_date
  - event_status
  - associated_campaign_id

### 12. Activity Log Page (`/activity-log`)
**Purpose**: System activity and audit trail

**User Flow**:
1. User views chronological activity log
2. Can filter by activity type, user, date range
3. Views detailed activity information
4. Can export activity logs

**Data Points Required**:
- Activity Log Entries:
  - activity_id, timestamp
  - user_id, user_name
  - activity_type, description
  - affected_resources
  - ip_address, user_agent

### 13. Integrations Page (`/integrations`)
**Purpose**: Data source and external service management

**User Flow**:
1. User views existing data connections
2. Can add new database connections
3. Tests connection status
4. Manages connection configurations
5. Views connection health and statistics

**Data Points Required**:
- Integration Connections:
  - connection_id, name, type
  - connection_status (connected, error, testing)
  - last_tested, last_sync
  - configuration_details
  - error_logs

**API Endpoints Needed**:
```
GET /api/integrations/connections
POST /api/integrations/connections
PUT /api/integrations/connections/{connectionId}
DELETE /api/integrations/connections/{connectionId}
POST /api/integrations/connections/{connectionId}/test
```

### 14. Admin Page (`/admin`)
**Purpose**: System administration and configuration

**User Flow**:
1. Admin views system settings
2. Manages user permissions
3. Configures system-wide settings
4. Views system health and performance

## Data Models & API Requirements

### Core Data Models

#### User Model
```typescript
interface User {
  id: string;
  user_id: string;
  email: string;
  name: string;
  user_type: 'premium' | 'regular';
  user_roles: ('lister' | 'buyer')[];
  account_status: 'active' | 'inactive' | 'suspended';
  created_date: string;
  last_login: string;
  total_listings: number;
  total_purchases: number;
  cltv: number;
  lifecycle_stage: string;
  profile_data: UserProfile;
}
```

#### Dashboard Tile Model
```typescript
interface DashboardTile {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'funnel';
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dataSource: {
    table: string;
    query: string;
    aggregation?: string;
    groupBy?: string;
  };
  refreshConfig: {
    autoRefresh: boolean;
    refreshOnLoad: boolean;
    lastRefreshed: Date;
  };
}
```

#### Campaign Model
```typescript
interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'push' | 'in_app' | 'promotion';
  status: 'active' | 'scheduled' | 'paused' | 'completed';
  start_date: string;
  end_date: string;
  target_segments: string[];
  performance_metrics: CampaignMetrics;
  content: CampaignContent;
}
```

## Authentication & Authorization

### Required Auth Endpoints
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET /api/auth/user
PUT /api/auth/user/profile
```

### Permission Levels
- Admin: Full system access
- Manager: User and campaign management
- Analyst: Read-only analytics access
- User: Basic dashboard access

## Integration Requirements

### Database Connections
- Support for Snowflake, PostgreSQL, ClickHouse
- Connection testing and health monitoring
- Secure credential storage
- Query execution and result caching

### External APIs
- Email service providers (for campaigns)
- Push notification services
- Analytics and tracking services
- Payment processors (for transaction data)

### Real-time Features
- Live dashboard updates
- Real-time campaign performance
- Activity log streaming
- Connection status monitoring

## Performance Considerations

### Caching Strategy
- Dashboard KPI data: 5-minute cache
- User list data: 1-minute cache
- Campaign analytics: Real-time
- Static configuration: 1-hour cache

### Data Pagination
- User lists: 50 items per page
- Activity logs: 100 items per page
- Campaign history: 25 items per page

### Background Jobs
- Daily KPI calculations
- Cohort membership updates
- Campaign performance aggregation
- Data sync from integrations

This documentation provides a comprehensive overview of all user flows, data requirements, and API specifications needed to build a robust backend for the application.
