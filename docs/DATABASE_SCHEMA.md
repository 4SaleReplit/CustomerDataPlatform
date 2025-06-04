
# PostgreSQL Database Schema Documentation

## Table of Contents
1. [Database Overview](#database-overview)
2. [Core User Management Tables](#core-user-management-tables)
3. [Platform Admin Tables](#platform-admin-tables)
4. [Customer Analytics Tables](#customer-analytics-tables)
5. [Campaign & Marketing Tables](#campaign--marketing-tables)
6. [Cohort Analysis Tables](#cohort-analysis-tables)
7. [Segmentation Tables](#segmentation-tables)
8. [Dashboard & Visualization Tables](#dashboard--visualization-tables)
9. [Integration & System Tables](#integration--system-tables)
10. [Indexes & Performance](#indexes--performance)
11. [Views & Functions](#views--functions)
12. [Sample Implementation Queries](#sample-implementation-queries)
13. [Database Setup Scripts](#database-setup-scripts)

## Database Overview

This PostgreSQL schema supports a comprehensive customer data platform (CDP) with the following capabilities:
- Multi-tenant platform user management (admin, analysts, marketers)
- End customer lifecycle tracking and analytics
- Real-time dashboard with customizable tiles
- Advanced cohort analysis and retention tracking
- Dynamic user segmentation
- Campaign management and automation
- Promotion management
- External data source integrations
- Comprehensive audit logging

### Database Requirements
- PostgreSQL 14+ (recommended 15+)
- Required Extensions: `uuid-ossp`, `pg_stat_statements`, `pg_trgm`, `hstore`
- Estimated Storage: 50GB+ for production with 1M+ customers
- Connection pooling required for high-traffic scenarios

## Core User Management Tables

### 1. platform_users
**Purpose**: Platform users (admins, analysts, marketers) who use the CDP interface
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "hstore";

CREATE TABLE platform_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'marketing_manager', 'data_analyst', 'viewer')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_invitation')),
    
    -- Authentication & Security
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Invitation System
    invited_by UUID REFERENCES platform_users(id),
    invitation_token VARCHAR(255),
    invitation_expires TIMESTAMP WITH TIME ZONE,
    invitation_accepted_at TIMESTAMP WITH TIME ZONE,
    
    -- Preferences
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    dashboard_config JSONB DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{
        "email_campaigns": true,
        "email_alerts": true,
        "browser_notifications": true
    }',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES platform_users(id),
    updated_by UUID REFERENCES platform_users(id)
);

-- Indexes
CREATE INDEX idx_platform_users_email ON platform_users(email);
CREATE INDEX idx_platform_users_role ON platform_users(role);
CREATE INDEX idx_platform_users_status ON platform_users(status);
CREATE INDEX idx_platform_users_last_login ON platform_users(last_login);
CREATE INDEX idx_platform_users_invitation_token ON platform_users(invitation_token);
```

### 2. platform_user_sessions
**Purpose**: Track platform user login sessions
```sql
CREATE TABLE platform_user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    
    -- Session Details
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    
    -- Location (from IP)
    country VARCHAR(50),
    city VARCHAR(100),
    
    -- Session Management
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    -- Security
    is_suspicious BOOLEAN DEFAULT false,
    logout_reason VARCHAR(50) -- 'user_logout', 'session_expired', 'admin_revoked', 'security_logout'
);

CREATE INDEX idx_platform_sessions_user_id ON platform_user_sessions(user_id);
CREATE INDEX idx_platform_sessions_token ON platform_user_sessions(session_token);
CREATE INDEX idx_platform_sessions_expires ON platform_user_sessions(expires_at);
CREATE INDEX idx_platform_sessions_active ON platform_user_sessions(is_active, expires_at);
```

### 3. role_permissions
**Purpose**: Define granular permissions for platform roles
```sql
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    resource VARCHAR(50), -- 'users', 'campaigns', 'cohorts', 'dashboard', etc.
    action VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete', 'execute'
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(role, permission, resource, action)
);

-- Insert default permissions
INSERT INTO role_permissions (role, permission, resource, action) VALUES
-- Super Admin - Full access
('super_admin', 'platform_management', '*', '*'),

-- Admin - Most access except platform management
('admin', 'user_management', 'platform_users', 'create'),
('admin', 'user_management', 'platform_users', 'read'),
('admin', 'user_management', 'platform_users', 'update'),
('admin', 'user_management', 'platform_users', 'delete'),
('admin', 'customer_data', '*', '*'),
('admin', 'campaign_management', '*', '*'),
('admin', 'dashboard_management', '*', '*'),

-- Marketing Manager - Campaign and customer focused
('marketing_manager', 'customer_data', 'customers', 'read'),
('marketing_manager', 'campaign_management', '*', '*'),
('marketing_manager', 'segmentation', '*', '*'),
('marketing_manager', 'promotions', '*', '*'),
('marketing_manager', 'dashboard_management', 'marketing_tiles', '*'),

-- Data Analyst - Analytics focused
('data_analyst', 'customer_data', '*', 'read'),
('data_analyst', 'analytics', '*', '*'),
('data_analyst', 'cohort_analysis', '*', '*'),
('data_analyst', 'dashboard_management', 'analytics_tiles', '*'),
('data_analyst', 'data_connections', '*', 'read'),

-- Viewer - Read only
('viewer', 'customer_data', '*', 'read'),
('viewer', 'analytics', '*', 'read'),
('viewer', 'dashboard_management', '*', 'read');

CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_role_permissions_resource ON role_permissions(resource, action);
```

## Customer Analytics Tables

### 4. customers
**Purpose**: End customers/users being analyzed (not platform users)
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(100) UNIQUE NOT NULL, -- External identifier from client system
    email VARCHAR(255),
    phone VARCHAR(20),
    name VARCHAR(255),
    
    -- Demographics
    date_of_birth DATE,
    gender VARCHAR(20),
    age_group VARCHAR(20), -- '18-24', '25-34', etc.
    
    -- Location
    country VARCHAR(50),
    state VARCHAR(50),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    timezone VARCHAR(50),
    
    -- Customer Classification
    customer_type VARCHAR(50) DEFAULT 'regular' CHECK (customer_type IN ('premium', 'regular', 'enterprise', 'trial')),
    customer_status VARCHAR(50) DEFAULT 'active' CHECK (customer_status IN ('active', 'inactive', 'churned', 'suspended')),
    lifecycle_stage VARCHAR(50) DEFAULT 'new' CHECK (lifecycle_stage IN ('new', 'activated', 'engaged', 'at_risk', 'churned', 'reactivated')),
    
    -- Key Dates
    first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    activated_at TIMESTAMP WITH TIME ZONE,
    churned_at TIMESTAMP WITH TIME ZONE,
    
    -- Acquisition
    acquisition_channel VARCHAR(100),
    acquisition_campaign VARCHAR(100),
    acquisition_source VARCHAR(100),
    referrer_url TEXT,
    utm_parameters JSONB,
    
    -- Computed Metrics (updated by triggers/jobs)
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    average_order_value DECIMAL(10,2) DEFAULT 0.00,
    lifetime_value DECIMAL(12,2) DEFAULT 0.00,
    days_since_last_order INTEGER,
    total_sessions INTEGER DEFAULT 0,
    total_page_views INTEGER DEFAULT 0,
    
    -- Behavioral Scores (0-100)
    engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
    churn_risk_score INTEGER DEFAULT 0 CHECK (churn_risk_score >= 0 AND churn_risk_score <= 100),
    
    -- Custom Attributes
    custom_attributes JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    
    -- Data Source
    data_source VARCHAR(50) DEFAULT 'api', -- 'api', 'csv_import', 'database_sync'
    external_ids JSONB DEFAULT '{}', -- Store IDs from multiple systems
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    imported_at TIMESTAMP WITH TIME ZONE,
    last_calculated_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_customers_customer_id ON customers(customer_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_type_status ON customers(customer_type, customer_status);
CREATE INDEX idx_customers_lifecycle ON customers(lifecycle_stage);
CREATE INDEX idx_customers_first_seen ON customers(first_seen_at);
CREATE INDEX idx_customers_last_seen ON customers(last_seen_at);
CREATE INDEX idx_customers_revenue ON customers(total_revenue);
CREATE INDEX idx_customers_ltv ON customers(lifetime_value);
CREATE INDEX idx_customers_engagement ON customers(engagement_score);
CREATE INDEX idx_customers_churn_risk ON customers(churn_risk_score);
CREATE INDEX idx_customers_acquisition ON customers(acquisition_channel, acquisition_source);

-- Full-text search index
CREATE INDEX idx_customers_search ON customers USING gin(to_tsvector('english', 
    COALESCE(name, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE(customer_id, '')
));
```

### 5. customer_events
**Purpose**: Track all customer interactions and events
```sql
CREATE TABLE customer_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Event Classification
    event_type VARCHAR(100) NOT NULL, -- 'page_view', 'purchase', 'login', 'signup', 'add_to_cart', etc.
    event_category VARCHAR(50), -- 'engagement', 'transaction', 'lifecycle'
    event_name VARCHAR(200) NOT NULL,
    
    -- Event Details
    event_properties JSONB DEFAULT '{}',
    event_value DECIMAL(10,2), -- Monetary value if applicable
    
    -- Session Context
    session_id VARCHAR(255),
    page_url TEXT,
    page_title VARCHAR(500),
    referrer_url TEXT,
    
    -- Technical Context
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    screen_resolution VARCHAR(20),
    
    -- Location
    country VARCHAR(50),
    city VARCHAR(100),
    
    -- Attribution
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    
    -- Timing
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Derived fields for analytics
    hour_of_day INTEGER GENERATED ALWAYS AS (EXTRACT(hour FROM occurred_at)) STORED,
    day_of_week INTEGER GENERATED ALWAYS AS (EXTRACT(dow FROM occurred_at)) STORED,
    week_of_year INTEGER GENERATED ALWAYS AS (EXTRACT(week FROM occurred_at)) STORED,
    month_of_year INTEGER GENERATED ALWAYS AS (EXTRACT(month FROM occurred_at)) STORED,
    
    -- Data lineage
    data_source VARCHAR(50) DEFAULT 'api',
    source_system VARCHAR(100),
    batch_id UUID -- For bulk imports
);

-- Partitioning by month for performance (implement as needed)
CREATE INDEX idx_customer_events_customer_id ON customer_events(customer_id);
CREATE INDEX idx_customer_events_type ON customer_events(event_type);
CREATE INDEX idx_customer_events_occurred_at ON customer_events(occurred_at);
CREATE INDEX idx_customer_events_session ON customer_events(session_id);
CREATE INDEX idx_customer_events_customer_occurred ON customer_events(customer_id, occurred_at);
CREATE INDEX idx_customer_events_type_occurred ON customer_events(event_type, occurred_at);
```

### 6. customer_orders
**Purpose**: Track customer purchase transactions
```sql
CREATE TABLE customer_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    
    -- Order Details
    order_status VARCHAR(50) NOT NULL CHECK (order_status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded')),
    order_total DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Amounts Breakdown
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    shipping_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Dates
    ordered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Location
    shipping_country VARCHAR(50),
    shipping_state VARCHAR(50),
    shipping_city VARCHAR(100),
    billing_country VARCHAR(50),
    billing_state VARCHAR(50),
    billing_city VARCHAR(100),
    
    -- Attribution
    acquisition_channel VARCHAR(100),
    campaign_id UUID, -- Reference to campaigns table
    promotion_code VARCHAR(50),
    
    -- Payment
    payment_method VARCHAR(50),
    payment_status VARCHAR(50),
    
    -- Order Classification
    is_first_order BOOLEAN DEFAULT false,
    is_subscription BOOLEAN DEFAULT false,
    subscription_id VARCHAR(100),
    
    -- Metadata
    order_source VARCHAR(50), -- 'website', 'mobile_app', 'phone', 'store'
    notes TEXT,
    custom_fields JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_orders_customer_id ON customer_orders(customer_id);
CREATE INDEX idx_customer_orders_order_id ON customer_orders(order_id);
CREATE INDEX idx_customer_orders_status ON customer_orders(order_status);
CREATE INDEX idx_customer_orders_ordered_at ON customer_orders(ordered_at);
CREATE INDEX idx_customer_orders_total ON customer_orders(order_total);
CREATE INDEX idx_customer_orders_first_order ON customer_orders(is_first_order);
CREATE INDEX idx_customer_orders_customer_ordered ON customer_orders(customer_id, ordered_at);
```

### 7. customer_order_items
**Purpose**: Individual items within customer orders
```sql
CREATE TABLE customer_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
    
    -- Product Details
    product_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(500) NOT NULL,
    product_category VARCHAR(100),
    product_subcategory VARCHAR(100),
    product_sku VARCHAR(100),
    product_brand VARCHAR(100),
    
    -- Pricing
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Product Attributes
    product_attributes JSONB DEFAULT '{}', -- size, color, variant, etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order_id ON customer_order_items(order_id);
CREATE INDEX idx_order_items_product_id ON customer_order_items(product_id);
CREATE INDEX idx_order_items_category ON customer_order_items(product_category);
```

## Campaign & Marketing Tables

### 8. campaigns
**Purpose**: Marketing campaign management and tracking
```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Campaign Type & Channel
    campaign_type VARCHAR(50) NOT NULL CHECK (campaign_type IN ('email', 'sms', 'push_notification', 'in_app', 'web_push', 'direct_mail')),
    channel VARCHAR(50) NOT NULL,
    
    -- Status & Scheduling
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- Content Management
    subject_line VARCHAR(500), -- For email campaigns
    content_template_id UUID,
    content_variables JSONB DEFAULT '{}',
    message_content JSONB NOT NULL,
    /*
    Example message_content structure:
    {
        "subject": "Welcome {{customer_name}}!",
        "html_body": "<html>...</html>",
        "text_body": "Plain text version",
        "sender_name": "Your Company",
        "sender_email": "hello@company.com",
        "attachments": [],
        "personalization": {
            "customer_name": "{{customer.name}}",
            "discount_code": "{{promotion.code}}"
        }
    }
    */
    
    -- Targeting Configuration
    target_audience_type VARCHAR(50) DEFAULT 'segment' CHECK (target_audience_type IN ('all_customers', 'segment', 'custom_filter', 'uploaded_list')),
    target_segments UUID[] DEFAULT '{}', -- Array of segment IDs
    target_filters JSONB, -- Custom targeting criteria
    exclusion_segments UUID[] DEFAULT '{}',
    
    -- Send Configuration
    send_immediately BOOLEAN DEFAULT false,
    scheduled_send_time TIMESTAMP WITH TIME ZONE,
    timezone_send BOOLEAN DEFAULT false, -- Send in recipient's timezone
    frequency_cap JSONB, -- Frequency capping rules
    
    -- A/B Testing
    is_ab_test BOOLEAN DEFAULT false,
    ab_test_config JSONB,
    /*
    Example ab_test_config:
    {
        "variants": [
            {"name": "A", "percentage": 50, "subject": "Subject A"},
            {"name": "B", "percentage": 50, "subject": "Subject B"}
        ],
        "test_duration_hours": 4,
        "winning_metric": "open_rate",
        "auto_select_winner": true
    }
    */
    
    -- Budget & Limits
    budget DECIMAL(10,2),
    cost_per_send DECIMAL(6,4),
    max_sends INTEGER,
    daily_send_limit INTEGER,
    
    -- Performance Tracking (updated by triggers)
    total_targeted INTEGER DEFAULT 0,
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_bounced INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    total_unsubscribed INTEGER DEFAULT 0,
    total_converted INTEGER DEFAULT 0,
    total_revenue_attributed DECIMAL(12,2) DEFAULT 0.00,
    
    -- Calculated Metrics
    delivery_rate DECIMAL(5,4) DEFAULT 0,
    open_rate DECIMAL(5,4) DEFAULT 0,
    click_rate DECIMAL(5,4) DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    roi DECIMAL(8,4) DEFAULT 0,
    
    -- Integration Details
    external_campaign_id VARCHAR(255), -- ID in email service provider
    service_provider VARCHAR(100), -- 'sendgrid', 'mailchimp', etc.
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES platform_users(id),
    updated_by UUID REFERENCES platform_users(id),
    
    -- Approval Workflow
    approval_status VARCHAR(50) DEFAULT 'draft' CHECK (approval_status IN ('draft', 'pending_approval', 'approved', 'rejected')),
    approved_by UUID REFERENCES platform_users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(campaign_type);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX idx_campaigns_approval ON campaigns(approval_status);
```

### 9. campaign_sends
**Purpose**: Track individual campaign message deliveries
```sql
CREATE TABLE campaign_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    
    -- Send Details
    send_status VARCHAR(50) DEFAULT 'queued' CHECK (send_status IN ('queued', 'sent', 'delivered', 'bounced', 'failed', 'rejected')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Engagement Tracking
    opened_at TIMESTAMP WITH TIME ZONE,
    first_click_at TIMESTAMP WITH TIME ZONE,
    last_click_at TIMESTAMP WITH TIME ZONE,
    total_clicks INTEGER DEFAULT 0,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    complained_at TIMESTAMP WITH TIME ZONE, -- spam complaint
    
    -- Conversion Tracking
    converted_at TIMESTAMP WITH TIME ZONE,
    conversion_value DECIMAL(10,2),
    conversion_event VARCHAR(100),
    
    -- A/B Testing
    variant VARCHAR(50), -- A, B, C, etc.
    
    -- Message Details
    subject_line VARCHAR(500),
    personalized_content JSONB, -- Store personalized variables used
    message_size_bytes INTEGER,
    
    -- Delivery Details
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    delivery_attempt INTEGER DEFAULT 1,
    bounce_reason VARCHAR(500),
    failure_reason TEXT,
    
    -- External Service Tracking
    external_message_id VARCHAR(255),
    service_provider VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(campaign_id, customer_id, variant)
);

-- Performance indexes
CREATE INDEX idx_campaign_sends_campaign_id ON campaign_sends(campaign_id);
CREATE INDEX idx_campaign_sends_customer_id ON campaign_sends(customer_id);
CREATE INDEX idx_campaign_sends_status ON campaign_sends(send_status);
CREATE INDEX idx_campaign_sends_sent_at ON campaign_sends(sent_at);
CREATE INDEX idx_campaign_sends_engagement ON campaign_sends(opened_at, first_click_at);
CREATE INDEX idx_campaign_sends_conversion ON campaign_sends(converted_at, conversion_value);
```

### 10. promotions
**Purpose**: Promotional offers and discount codes
```sql
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Promotion Code
    promotion_code VARCHAR(100) UNIQUE,
    code_type VARCHAR(50) DEFAULT 'single' CHECK (code_type IN ('single', 'bulk', 'auto_generated')),
    
    -- Discount Configuration
    discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y', 'tiered')),
    discount_value DECIMAL(10,2), -- Percentage (as decimal: 0.15 = 15%) or fixed amount
    max_discount_amount DECIMAL(10,2), -- Cap for percentage discounts
    min_order_value DECIMAL(10,2), -- Minimum order to qualify
    
    -- Buy X Get Y Configuration (for BXGY offers)
    buy_quantity INTEGER,
    get_quantity INTEGER,
    get_discount_percentage DECIMAL(5,4),
    
    -- Tiered Discount Configuration
    tier_config JSONB,
    /*
    Example tier_config:
    {
        "tiers": [
            {"min_amount": 50, "discount": 0.10},
            {"min_amount": 100, "discount": 0.15},
            {"min_amount": 200, "discount": 0.20}
        ]
    }
    */
    
    -- Usage Limits
    usage_limit_total INTEGER, -- Total uses across all customers
    usage_limit_per_customer INTEGER DEFAULT 1,
    current_usage_count INTEGER DEFAULT 0,
    
    -- Date Constraints
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Product/Category Restrictions
    applicable_products TEXT[] DEFAULT '{}', -- Product IDs
    applicable_categories TEXT[] DEFAULT '{}', -- Category names
    excluded_products TEXT[] DEFAULT '{}',
    excluded_categories TEXT[] DEFAULT '{}',
    
    -- Customer Targeting
    eligible_customer_segments UUID[] DEFAULT '{}',
    eligible_customer_types VARCHAR(50)[] DEFAULT '{}',
    min_customer_tier VARCHAR(50),
    first_time_customers_only BOOLEAN DEFAULT false,
    
    -- Status & Visibility
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true, -- Can customers see this promotion?
    requires_code BOOLEAN DEFAULT true, -- Or automatically applied?
    
    -- Campaign Association
    campaign_id UUID REFERENCES campaigns(id),
    
    -- Performance Tracking
    total_redemptions INTEGER DEFAULT 0,
    total_discount_given DECIMAL(12,2) DEFAULT 0.00,
    total_revenue_attributed DECIMAL(12,2) DEFAULT 0.00,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES platform_users(id),
    updated_by UUID REFERENCES platform_users(id)
);

CREATE INDEX idx_promotions_code ON promotions(promotion_code);
CREATE INDEX idx_promotions_dates ON promotions(valid_from, valid_until);
CREATE INDEX idx_promotions_active ON promotions(is_active, valid_from, valid_until);
CREATE INDEX idx_promotions_campaign ON promotions(campaign_id);
```

### 11. promotion_redemptions
**Purpose**: Track promotion code usage and redemptions
```sql
CREATE TABLE promotion_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES promotions(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    order_id UUID REFERENCES customer_orders(id),
    
    -- Redemption Details
    redemption_code VARCHAR(100) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    original_order_value DECIMAL(10,2) NOT NULL,
    final_order_value DECIMAL(10,2) NOT NULL,
    
    -- Context
    redemption_channel VARCHAR(50), -- 'website', 'mobile_app', 'store'
    
    -- Timing
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Validation
    was_valid BOOLEAN DEFAULT true,
    validation_errors TEXT[],
    
    UNIQUE(promotion_id, customer_id, order_id)
);

CREATE INDEX idx_promotion_redemptions_promotion_id ON promotion_redemptions(promotion_id);
CREATE INDEX idx_promotion_redemptions_customer_id ON promotion_redemptions(customer_id);
CREATE INDEX idx_promotion_redemptions_redeemed_at ON promotion_redemptions(redeemed_at);
```

## Cohort Analysis Tables

### 12. cohorts
**Purpose**: Define and manage customer cohorts for analysis
```sql
CREATE TABLE cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Cohort Definition
    cohort_type VARCHAR(50) DEFAULT 'time_based' CHECK (cohort_type IN ('time_based', 'behavior_based', 'attribute_based', 'custom')),
    time_period VARCHAR(50) DEFAULT 'monthly' CHECK (time_period IN ('daily', 'weekly', 'monthly', 'quarterly')),
    
    -- Time-based Cohort Configuration
    date_field VARCHAR(100) DEFAULT 'first_seen_at', -- 'first_seen_at', 'first_order_date', 'activated_at'
    start_date DATE,
    end_date DATE,
    
    -- Cohort Inclusion Criteria
    inclusion_criteria JSONB NOT NULL,
    /*
    Example inclusion_criteria:
    {
        "customer_type": ["premium", "regular"],
        "acquisition_channel": ["organic", "paid_search"],
        "min_order_value": 50.00,
        "has_made_purchase": true,
        "country": ["US", "CA", "UK"],
        "custom_attributes": {
            "subscription_plan": ["pro", "enterprise"]
        }
    }
    */
    
    -- Analysis Configuration
    retention_periods INTEGER DEFAULT 12, -- How many periods to track
    success_event VARCHAR(100) DEFAULT 'any_activity', -- What counts as "retained"
    success_criteria JSONB,
    /*
    Example success_criteria:
    {
        "event_type": "purchase",
        "min_events": 1,
        "min_value": 25.00,
        "time_window_days": 30
    }
    */
    
    -- Computed Statistics (updated by scheduled jobs)
    total_customers INTEGER DEFAULT 0,
    cohort_periods_data JSONB, -- Store pre-computed cohort table
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    auto_refresh BOOLEAN DEFAULT true,
    refresh_frequency VARCHAR(50) DEFAULT 'daily' CHECK (refresh_frequency IN ('hourly', 'daily', 'weekly')),
    last_refreshed_at TIMESTAMP WITH TIME ZONE,
    last_calculation_duration INTERVAL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES platform_users(id),
    updated_by UUID REFERENCES platform_users(id)
);

CREATE INDEX idx_cohorts_type ON cohorts(cohort_type);
CREATE INDEX idx_cohorts_active ON cohorts(is_active);
CREATE INDEX idx_cohorts_created_by ON cohorts(created_by);
CREATE INDEX idx_cohorts_last_refreshed ON cohorts(last_refreshed_at);
```

### 13. cohort_memberships
**Purpose**: Track which customers belong to which cohorts
```sql
CREATE TABLE cohort_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Cohort Assignment
    cohort_period VARCHAR(50) NOT NULL, -- '2024-01', 'Week 1', etc.
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    joined_cohort_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Customer Context at Join
    customer_attributes_snapshot JSONB, -- Customer attributes when they joined
    
    UNIQUE(cohort_id, customer_id)
);

CREATE INDEX idx_cohort_memberships_cohort_id ON cohort_memberships(cohort_id);
CREATE INDEX idx_cohort_memberships_customer_id ON cohort_memberships(customer_id);
CREATE INDEX idx_cohort_memberships_period ON cohort_memberships(cohort_period);
```

### 14. cohort_retention_data
**Purpose**: Store pre-calculated cohort retention metrics
```sql
CREATE TABLE cohort_retention_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    
    -- Period Information
    cohort_period VARCHAR(50) NOT NULL, -- The cohort period (e.g., '2024-01')
    analysis_period INTEGER NOT NULL, -- 0 = initial period, 1 = period 1, etc.
    analysis_date DATE NOT NULL,
    
    -- Size Metrics
    cohort_size INTEGER NOT NULL, -- Total customers in this cohort
    active_customers INTEGER NOT NULL, -- Customers active in this analysis period
    
    -- Retention Metrics
    retention_rate DECIMAL(8,6) NOT NULL, -- Percentage retained (0.234567 = 23.4567%)
    cumulative_retention_rate DECIMAL(8,6) NOT NULL,
    
    -- Revenue Metrics
    period_revenue DECIMAL(12,2) DEFAULT 0.00,
    cumulative_revenue DECIMAL(12,2) DEFAULT 0.00,
    average_revenue_per_user DECIMAL(10,2) DEFAULT 0.00,
    
    -- Activity Metrics
    total_orders INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_events INTEGER DEFAULT 0,
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    calculation_version INTEGER DEFAULT 1, -- For tracking calculation logic changes
    
    UNIQUE(cohort_id, cohort_period, analysis_period)
);

CREATE INDEX idx_cohort_retention_cohort_period ON cohort_retention_data(cohort_id, cohort_period);
CREATE INDEX idx_cohort_retention_analysis_period ON cohort_retention_data(cohort_id, analysis_period);
```

## Segmentation Tables

### 15. segments
**Purpose**: Dynamic customer segments for targeting and analysis
```sql
CREATE TABLE segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Segment Type
    segment_type VARCHAR(50) DEFAULT 'dynamic' CHECK (segment_type IN ('dynamic', 'static', 'calculated')),
    
    -- Segment Definition
    criteria JSONB NOT NULL,
    /*
    Example criteria structure:
    {
        "conditions": [
            {
                "field": "total_revenue",
                "operator": ">=",
                "value": 500.00,
                "type": "number"
            },
            {
                "field": "last_seen_at",
                "operator": ">=",
                "value": "2024-01-01",
                "type": "date"
            },
            {
                "field": "customer_type",
                "operator": "in",
                "value": ["premium", "enterprise"],
                "type": "string_array"
            }
        ],
        "logic": "AND", // "AND" or "OR"
        "nested_conditions": [
            {
                "conditions": [...],
                "logic": "OR"
            }
        ]
    }
    */
    
    -- SQL Query (for complex segments)
    sql_query TEXT, -- Custom SQL for advanced segments
    query_parameters JSONB, -- Parameters for the SQL query
    
    -- Computed Statistics (updated by jobs)
    customer_count INTEGER DEFAULT 0,
    last_customer_count INTEGER DEFAULT 0,
    customer_count_change INTEGER DEFAULT 0,
    
    -- Segment Performance
    average_ltv DECIMAL(10,2) DEFAULT 0.00,
    average_order_value DECIMAL(10,2) DEFAULT 0.00,
    average_engagement_score DECIMAL(5,2) DEFAULT 0.00,
    churn_rate DECIMAL(5,4) DEFAULT 0.0000,
    
    -- Refresh Configuration
    auto_refresh BOOLEAN DEFAULT true,
    refresh_frequency VARCHAR(50) DEFAULT 'daily' CHECK (refresh_frequency IN ('real_time', 'hourly', 'daily', 'weekly')),
    last_refreshed_at TIMESTAMP WITH TIME ZONE,
    next_refresh_at TIMESTAMP WITH TIME ZONE,
    refresh_duration INTERVAL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Usage Tracking
    times_used_in_campaigns INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES platform_users(id),
    updated_by UUID REFERENCES platform_users(id)
);

CREATE INDEX idx_segments_type ON segments(segment_type);
CREATE INDEX idx_segments_active ON segments(is_active);
CREATE INDEX idx_segments_refresh ON segments(next_refresh_at, auto_refresh);
CREATE INDEX idx_segments_created_by ON segments(created_by);
```

### 16. segment_memberships
**Purpose**: Track current segment membership (materialized for performance)
```sql
CREATE TABLE segment_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Membership Details
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    first_qualified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    qualification_score DECIMAL(8,4), -- How strongly they match (for fuzzy segments)
    
    -- Tracking
    is_active BOOLEAN DEFAULT true,
    removed_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(segment_id, customer_id)
);

CREATE INDEX idx_segment_memberships_segment_id ON segment_memberships(segment_id);
CREATE INDEX idx_segment_memberships_customer_id ON segment_memberships(customer_id);
CREATE INDEX idx_segment_memberships_active ON segment_memberships(is_active);
```

## Dashboard & Visualization Tables

### 17. dashboard_configurations
**Purpose**: Store custom dashboard layouts for platform users
```sql
CREATE TABLE dashboard_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES platform_users(id), -- NULL for global/template dashboards
    
    -- Dashboard Details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    is_template BOOLEAN DEFAULT false, -- Template dashboards for new users
    
    -- Layout Configuration
    layout_config JSONB NOT NULL,
    /*
    Example layout_config:
    {
        "grid_columns": 12,
        "grid_rows": "auto",
        "tiles": [
            {
                "id": "tile_1",
                "type": "metric_card",
                "x": 0, "y": 0, "width": 3, "height": 2,
                "config": {...}
            }
        ]
    }
    */
    
    -- Access Control
    is_public BOOLEAN DEFAULT false,
    shared_with_roles VARCHAR(50)[] DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0
);

CREATE INDEX idx_dashboard_configs_user_id ON dashboard_configurations(user_id);
CREATE INDEX idx_dashboard_configs_template ON dashboard_configurations(is_template);
```

### 18. dashboard_tiles
**Purpose**: Individual dashboard tiles/widgets configuration
```sql
CREATE TABLE dashboard_tiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID REFERENCES dashboard_configurations(id) ON DELETE CASCADE,
    
    -- Tile Configuration
    title VARCHAR(255) NOT NULL,
    tile_type VARCHAR(100) NOT NULL CHECK (tile_type IN (
        'metric_card', 'line_chart', 'bar_chart', 'pie_chart', 'area_chart',
        'funnel_chart', 'table', 'list', 'map', 'gauge', 'progress',
        'cohort_table', 'retention_curve', 'customer_timeline'
    )),
    
    -- Layout
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    
    -- Data Configuration
    data_source_type VARCHAR(50) NOT NULL CHECK (data_source_type IN ('internal', 'custom_query', 'external_api')),
    data_config JSONB NOT NULL,
    /*
    Example data_config for different types:
    
    For metric_card:
    {
        "metric": "total_customers",
        "filters": {"date_range": "30d", "customer_type": "premium"},
        "comparison": {"period": "previous_period", "show_change": true},
        "format": "number"
    }
    
    For line_chart:
    {
        "query": "SELECT date, COUNT(*) as customers FROM customers GROUP BY date",
        "x_axis": "date",
        "y_axis": "customers",
        "date_range": "30d",
        "granularity": "daily"
    }
    
    For custom_query:
    {
        "sql": "SELECT ...",
        "parameters": {...},
        "cache_duration": 300
    }
    */
    
    -- Display Configuration
    display_config JSONB DEFAULT '{}',
    /*
    Example display_config:
    {
        "colors": ["#3b82f6", "#ef4444"],
        "show_legend": true,
        "show_labels": true,
        "number_format": "currency",
        "date_format": "MMM DD",
        "title_position": "top",
        "background_color": "white"
    }
    */
    
    -- Refresh Configuration
    auto_refresh BOOLEAN DEFAULT true,
    refresh_interval_seconds INTEGER DEFAULT 300,
    last_refreshed_at TIMESTAMP WITH TIME ZONE,
    last_refresh_duration INTERVAL,
    
    -- Cache Configuration
    cache_enabled BOOLEAN DEFAULT true,
    cache_duration_seconds INTEGER DEFAULT 300,
    cached_data JSONB, -- Store cached results
    cached_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    has_error BOOLEAN DEFAULT false,
    last_error TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dashboard_tiles_dashboard_id ON dashboard_tiles(dashboard_id);
CREATE INDEX idx_dashboard_tiles_type ON dashboard_tiles(tile_type);
CREATE INDEX idx_dashboard_tiles_refresh ON dashboard_tiles(auto_refresh, refresh_interval_seconds);
```

### 19. kpi_definitions
**Purpose**: Define and manage key performance indicators
```sql
CREATE TABLE kpi_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- KPI Configuration
    category VARCHAR(100) NOT NULL, -- 'revenue', 'engagement', 'retention', 'acquisition'
    calculation_method VARCHAR(50) NOT NULL CHECK (calculation_method IN ('sum', 'count', 'average', 'percentage', 'ratio', 'custom_sql')),
    
    -- Calculation Details
    base_table VARCHAR(100),
    calculation_field VARCHAR(100),
    calculation_sql TEXT, -- For complex calculations
    filters JSONB DEFAULT '{}',
    
    -- Time-based Configuration
    time_dimension VARCHAR(100) DEFAULT 'created_at',
    supports_time_comparison BOOLEAN DEFAULT true,
    default_time_range VARCHAR(50) DEFAULT '30d',
    
    -- Formatting
    format_type VARCHAR(50) DEFAULT 'number' CHECK (format_type IN ('number', 'currency', 'percentage', 'duration')),
    decimal_places INTEGER DEFAULT 0,
    prefix VARCHAR(10),
    suffix VARCHAR(10),
    
    -- Targets & Benchmarks
    target_value DECIMAL(15,4),
    target_direction VARCHAR(10) CHECK (target_direction IN ('up', 'down', 'neutral')),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES platform_users(id)
);

CREATE INDEX idx_kpi_definitions_category ON kpi_definitions(category);
CREATE INDEX idx_kpi_definitions_active ON kpi_definitions(is_active);
```

## Integration & System Tables

### 20. data_connections
**Purpose**: External database and API connection configurations
```sql
CREATE TABLE data_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Connection Type
    connection_type VARCHAR(100) NOT NULL CHECK (connection_type IN (
        'postgresql', 'mysql', 'snowflake', 'redshift', 'bigquery', 
        'clickhouse', 'mongodb', 'api_rest', 'api_graphql', 'webhook'
    )),
    
    -- Connection Details (encrypted)
    connection_config JSONB NOT NULL,
    /*
    Example connection_config (encrypted sensitive fields):
    {
        "host": "db.example.com",
        "port": 5432,
        "database": "analytics",
        "username": "user",
        "password": "ENCRYPTED",
        "ssl_mode": "require",
        "connection_timeout": 30,
        "query_timeout": 300
    }
    */
    
    -- Authentication
    auth_type VARCHAR(50) DEFAULT 'password' CHECK (auth_type IN ('password', 'api_key', 'oauth', 'service_account')),
    auth_config JSONB, -- Encrypted auth details
    
    -- Sync Configuration
    sync_enabled BOOLEAN DEFAULT false,
    sync_frequency VARCHAR(50) CHECK (sync_frequency IN ('real_time', 'hourly', 'daily', 'weekly')),
    sync_tables TEXT[] DEFAULT '{}', -- Tables/collections to sync
    last_sync_at TIMESTAMP WITH TIME ZONE,
    next_sync_at TIMESTAMP WITH TIME ZONE,
    
    -- Status Monitoring
    status VARCHAR(50) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'testing')),
    last_test_at TIMESTAMP WITH TIME ZONE,
    last_test_success BOOLEAN,
    last_error TEXT,
    
    -- Performance Metrics
    average_response_time INTEGER, -- milliseconds
    total_queries_executed INTEGER DEFAULT 0,
    total_rows_synced BIGINT DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES platform_users(id),
    updated_by UUID REFERENCES platform_users(id)
);

CREATE INDEX idx_data_connections_type ON data_connections(connection_type);
CREATE INDEX idx_data_connections_status ON data_connections(status);
CREATE INDEX idx_data_connections_sync ON data_connections(sync_enabled, next_sync_at);
```

### 21. activity_logs
**Purpose**: Comprehensive audit trail and system activity logging
```sql
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Actor Information
    user_id UUID REFERENCES platform_users(id),
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    
    -- Activity Details
    activity_type VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', 'export', 'import'
    resource_type VARCHAR(100) NOT NULL, -- 'customer', 'campaign', 'segment', 'dashboard', 'connection'
    resource_id VARCHAR(255),
    resource_name VARCHAR(255),
    action_description TEXT NOT NULL,
    
    -- Change Details (for data modifications)
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- Request Context
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    request_id VARCHAR(255), -- For tracing requests across services
    
    -- API/System Context
    api_endpoint VARCHAR(255),
    http_method VARCHAR(10),
    response_status INTEGER,
    processing_time_ms INTEGER,
    
    -- Metadata
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    tags TEXT[] DEFAULT '{}',
    additional_context JSONB DEFAULT '{}',
    
    -- Timing
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Derived fields for analytics
    hour_of_day INTEGER GENERATED ALWAYS AS (EXTRACT(hour FROM occurred_at)) STORED,
    day_of_week INTEGER GENERATED ALWAYS AS (EXTRACT(dow FROM occurred_at)) STORED
);

-- Partitioning by month recommended for large volumes
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
CREATE INDEX idx_activity_logs_occurred_at ON activity_logs(occurred_at);
CREATE INDEX idx_activity_logs_severity ON activity_logs(severity);
CREATE INDEX idx_activity_logs_session ON activity_logs(session_id);
```

### 22. system_settings
**Purpose**: Application configuration and feature flags
```sql
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(200) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    
    -- Setting Classification
    category VARCHAR(100) NOT NULL, -- 'security', 'email', 'integrations', 'features', 'limits'
    setting_type VARCHAR(50) DEFAULT 'config' CHECK (setting_type IN ('config', 'feature_flag', 'limit', 'secret')),
    data_type VARCHAR(50) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json', 'array')),
    
    -- Security
    is_encrypted BOOLEAN DEFAULT false,
    is_sensitive BOOLEAN DEFAULT false,
    
    -- Validation
    validation_rules JSONB,
    /*
    Example validation_rules:
    {
        "min_value": 0,
        "max_value": 100,
        "allowed_values": ["option1", "option2"],
        "regex_pattern": "^[a-zA-Z0-9]+$"
    }
    */
    
    -- Environment
    environment VARCHAR(50) DEFAULT 'production',
    
    -- Documentation
    description TEXT,
    documentation_url TEXT,
    
    -- Change Management
    requires_restart BOOLEAN DEFAULT false,
    last_changed_by UUID REFERENCES platform_users(id),
    change_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, category, description) VALUES
('platform.max_dashboard_tiles', '50', 'limits', 'Maximum number of tiles per dashboard'),
('platform.max_segments_per_user', '100', 'limits', 'Maximum segments a user can create'),
('platform.session_timeout_hours', '24', 'security', 'Platform user session timeout'),
('email.default_sender_name', '"CDP Platform"', 'email', 'Default sender name for system emails'),
('features.advanced_analytics', 'true', 'features', 'Enable advanced analytics features'),
('features.external_integrations', 'true', 'features', 'Enable external data connections'),
('campaign.max_recipients', '100000', 'limits', 'Maximum recipients per campaign'),
('cohort.max_retention_periods', '24', 'limits', 'Maximum retention periods to calculate');

CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_system_settings_type ON system_settings(setting_type);
```

### 23. scheduled_jobs
**Purpose**: Track and manage scheduled background jobs
```sql
CREATE TABLE scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(255) NOT NULL UNIQUE,
    job_type VARCHAR(100) NOT NULL, -- 'metric_calculation', 'cohort_refresh', 'segment_update', 'data_sync'
    
    -- Schedule Configuration
    cron_expression VARCHAR(100), -- Standard cron format
    frequency VARCHAR(50), -- 'hourly', 'daily', 'weekly', 'monthly'
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Job Configuration
    job_config JSONB DEFAULT '{}',
    timeout_seconds INTEGER DEFAULT 3600,
    max_retries INTEGER DEFAULT 3,
    
    -- Status
    is_enabled BOOLEAN DEFAULT true,
    
    -- Execution Tracking
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_run_status VARCHAR(50), -- 'success', 'failed', 'timeout', 'cancelled'
    last_run_duration INTERVAL,
    last_error_message TEXT,
    
    next_run_at TIMESTAMP WITH TIME ZONE,
    
    -- Performance Stats
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,
    average_duration INTERVAL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES platform_users(id)
);

-- Insert default scheduled jobs
INSERT INTO scheduled_jobs (job_name, job_type, cron_expression, job_config) VALUES
('daily_customer_metrics', 'metric_calculation', '0 2 * * *', '{"metrics": ["total_customers", "daily_revenue", "retention_rates"]}'),
('hourly_segment_refresh', 'segment_update', '0 * * * *', '{"refresh_dynamic_segments": true}'),
('weekly_cohort_analysis', 'cohort_refresh', '0 3 * * 1', '{"recalculate_all": false, "periods_to_update": 3}'),
('daily_engagement_scores', 'metric_calculation', '0 4 * * *', '{"calculate_engagement": true, "calculate_churn_risk": true}');

CREATE INDEX idx_scheduled_jobs_next_run ON scheduled_jobs(next_run_at, is_enabled);
CREATE INDEX idx_scheduled_jobs_type ON scheduled_jobs(job_type);
```

## Indexes & Performance

### Composite Indexes for Common Query Patterns
```sql
-- Customer analytics queries
CREATE INDEX idx_customers_type_status_seen ON customers(customer_type, customer_status, last_seen_at);
CREATE INDEX idx_customers_revenue_ltv ON customers(total_revenue, lifetime_value) WHERE customer_status = 'active';
CREATE INDEX idx_customers_engagement_churn ON customers(engagement_score, churn_risk_score);

-- Event analytics
CREATE INDEX idx_customer_events_customer_occurred_type ON customer_events(customer_id, occurred_at, event_type);
CREATE INDEX idx_customer_events_type_occurred_value ON customer_events(event_type, occurred_at, event_value) WHERE event_value IS NOT NULL;

-- Campaign performance
CREATE INDEX idx_campaign_sends_campaign_status_sent ON campaign_sends(campaign_id, send_status, sent_at);
CREATE INDEX idx_campaign_sends_engagement_tracking ON campaign_sends(campaign_id, opened_at, first_click_at) WHERE opened_at IS NOT NULL;

-- Order analytics
CREATE INDEX idx_customer_orders_customer_ordered_total ON customer_orders(customer_id, ordered_at, order_total);
CREATE INDEX idx_customer_orders_status_ordered ON customer_orders(order_status, ordered_at) WHERE order_status = 'delivered';

-- Segmentation performance
CREATE INDEX idx_segment_memberships_segment_active ON segment_memberships(segment_id, is_active, added_at);

-- Cohort analysis
CREATE INDEX idx_cohort_retention_cohort_analysis ON cohort_retention_data(cohort_id, analysis_period, retention_rate);

-- Activity logging
CREATE INDEX idx_activity_logs_user_resource_occurred ON activity_logs(user_id, resource_type, occurred_at);
```

### Partial Indexes for Better Performance
```sql
-- Active customers only
CREATE INDEX idx_customers_active_premium ON customers(total_revenue, lifetime_value) 
WHERE customer_status = 'active' AND customer_type = 'premium';

-- Recent high-value orders
CREATE INDEX idx_orders_recent_high_value ON customer_orders(customer_id, ordered_at, order_total) 
WHERE ordered_at > CURRENT_DATE - INTERVAL '30 days' AND order_total > 100;

-- Engaged customers for targeting
CREATE INDEX idx_customers_engaged ON customers(id, last_seen_at) 
WHERE engagement_score > 70 AND customer_status = 'active';

-- Active campaigns for monitoring
CREATE INDEX idx_campaigns_active_performance ON campaigns(id, start_date, total_sent, open_rate) 
WHERE status = 'active';
```

## Views & Functions

### Analytical Views for Common Queries
```sql
-- Customer summary view
CREATE VIEW customer_summary AS
SELECT 
    c.id,
    c.customer_id,
    c.email,
    c.name,
    c.customer_type,
    c.customer_status,
    c.lifecycle_stage,
    c.total_orders,
    c.total_revenue,
    c.lifetime_value,
    c.engagement_score,
    c.churn_risk_score,
    c.first_seen_at,
    c.last_seen_at,
    EXTRACT(days FROM CURRENT_DATE - c.last_seen_at::date) as days_since_last_seen,
    -- Recent activity indicators
    EXISTS(
        SELECT 1 FROM customer_events ce 
        WHERE ce.customer_id = c.id 
        AND ce.occurred_at > CURRENT_DATE - INTERVAL '7 days'
    ) as active_last_7_days,
    EXISTS(
        SELECT 1 FROM customer_orders co 
        WHERE co.customer_id = c.id 
        AND co.ordered_at > CURRENT_DATE - INTERVAL '30 days'
    ) as purchased_last_30_days
FROM customers c;

-- Campaign performance summary
CREATE VIEW campaign_performance_summary AS
SELECT 
    c.id,
    c.name,
    c.campaign_type,
    c.status,
    c.start_date,
    c.end_date,
    c.total_sent,
    c.total_delivered,
    c.total_opened,
    c.total_clicked,
    c.total_converted,
    -- Calculated rates
    CASE WHEN c.total_sent > 0 THEN (c.total_delivered::decimal / c.total_sent) * 100 ELSE 0 END as delivery_rate,
    CASE WHEN c.total_delivered > 0 THEN (c.total_opened::decimal / c.total_delivered) * 100 ELSE 0 END as open_rate,
    CASE WHEN c.total_delivered > 0 THEN (c.total_clicked::decimal / c.total_delivered) * 100 ELSE 0 END as click_rate,
    CASE WHEN c.total_sent > 0 THEN (c.total_converted::decimal / c.total_sent) * 100 ELSE 0 END as conversion_rate,
    -- ROI calculation
    CASE WHEN c.budget > 0 THEN (c.total_revenue_attributed - c.budget) / c.budget * 100 ELSE NULL END as roi_percentage
FROM campaigns c;

-- Daily metrics rollup
CREATE VIEW daily_metrics_summary AS
SELECT 
    date_trunc('day', occurred_at)::date as metric_date,
    COUNT(DISTINCT customer_id) as daily_active_customers,
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE event_type = 'purchase') as purchases,
    SUM(event_value) FILTER (WHERE event_type = 'purchase') as daily_revenue,
    COUNT(DISTINCT customer_id) FILTER (WHERE event_type = 'signup') as new_signups
FROM customer_events 
WHERE occurred_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY date_trunc('day', occurred_at)::date
ORDER BY metric_date DESC;
```

### Useful Functions
```sql
-- Function to calculate customer engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(customer_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    days_since_last_seen INTEGER;
    recent_events INTEGER;
    recent_orders INTEGER;
BEGIN
    -- Get basic metrics
    SELECT 
        EXTRACT(days FROM CURRENT_DATE - last_seen_at::date),
        total_orders
    INTO days_since_last_seen, recent_orders
    FROM customers 
    WHERE id = customer_uuid;
    
    -- Count recent events (last 30 days)
    SELECT COUNT(*) INTO recent_events
    FROM customer_events 
    WHERE customer_id = customer_uuid 
    AND occurred_at > CURRENT_DATE - INTERVAL '30 days';
    
    -- Calculate score (0-100)
    -- Recency (40 points max)
    IF days_since_last_seen <= 1 THEN score := score + 40;
    ELSIF days_since_last_seen <= 7 THEN score := score + 30;
    ELSIF days_since_last_seen <= 30 THEN score := score + 20;
    ELSIF days_since_last_seen <= 90 THEN score := score + 10;
    END IF;
    
    -- Frequency (30 points max)
    IF recent_events >= 50 THEN score := score + 30;
    ELSIF recent_events >= 20 THEN score := score + 20;
    ELSIF recent_events >= 5 THEN score := score + 10;
    ELSIF recent_events >= 1 THEN score := score + 5;
    END IF;
    
    -- Purchase activity (30 points max)
    IF recent_orders >= 5 THEN score := score + 30;
    ELSIF recent_orders >= 2 THEN score := score + 20;
    ELSIF recent_orders >= 1 THEN score := score + 10;
    END IF;
    
    RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to refresh segment memberships
CREATE OR REPLACE FUNCTION refresh_segment_memberships(segment_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    segment_record segments%ROWTYPE;
    sql_query TEXT;
    affected_rows INTEGER;
BEGIN
    -- Get segment configuration
    SELECT * INTO segment_record FROM segments WHERE id = segment_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Segment not found: %', segment_uuid;
    END IF;
    
    -- Clear existing memberships
    DELETE FROM segment_memberships WHERE segment_id = segment_uuid;
    
    -- Build dynamic SQL based on criteria
    -- This is a simplified version - real implementation would be more complex
    sql_query := 'INSERT INTO segment_memberships (segment_id, customer_id) 
                  SELECT $1, id FROM customers WHERE ';
    
    -- Add criteria conditions (simplified example)
    IF segment_record.criteria ? 'customer_type' THEN
        sql_query := sql_query || 'customer_type = ANY($2) AND ';
    END IF;
    
    -- Remove trailing AND
    sql_query := rtrim(sql_query, ' AND ');
    
    -- Execute the query (this is a simplified example)
    -- Real implementation would parse JSON criteria and build proper SQL
    
    -- Update segment statistics
    SELECT COUNT(*) INTO affected_rows 
    FROM segment_memberships 
    WHERE segment_id = segment_uuid;
    
    UPDATE segments 
    SET customer_count = affected_rows,
        last_refreshed_at = CURRENT_TIMESTAMP
    WHERE id = segment_uuid;
    
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;
```

## Sample Implementation Queries

### Dashboard KPI Queries

```sql
-- Total Customers with comparison
WITH current_total AS (
    SELECT COUNT(*) as count FROM customers WHERE customer_status = 'active'
),
previous_total AS (
    SELECT COUNT(*) as count FROM customers 
    WHERE customer_status = 'active' 
    AND created_at < CURRENT_DATE - INTERVAL '30 days'
)
SELECT 
    ct.count as current_total,
    pt.count as previous_total,
    ct.count - pt.count as change,
    CASE WHEN pt.count > 0 THEN ((ct.count - pt.count)::decimal / pt.count) * 100 ELSE 0 END as percentage_change
FROM current_total ct, previous_total pt;

-- Monthly Revenue Trend
SELECT 
    DATE_TRUNC('month', ordered_at) as month,
    SUM(order_total) as revenue,
    COUNT(*) as orders,
    AVG(order_total) as avg_order_value,
    COUNT(DISTINCT customer_id) as unique_customers
FROM customer_orders 
WHERE order_status = 'delivered'
AND ordered_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', ordered_at)
ORDER BY month;

-- Customer Lifecycle Distribution
SELECT 
    lifecycle_stage,
    COUNT(*) as customer_count,
    ROUND((COUNT(*)::decimal / SUM(COUNT(*)) OVER ()) * 100, 2) as percentage,
    AVG(total_revenue) as avg_revenue,
    AVG(engagement_score) as avg_engagement
FROM customers 
WHERE customer_status = 'active'
GROUP BY lifecycle_stage
ORDER BY customer_count DESC;

-- Top Performing Campaigns (Last 30 Days)
SELECT 
    c.name,
    c.campaign_type,
    c.total_sent,
    c.total_opened,
    c.total_clicked,
    c.total_converted,
    c.total_revenue_attributed,
    ROUND((c.total_opened::decimal / NULLIF(c.total_sent, 0)) * 100, 2) as open_rate,
    ROUND((c.total_clicked::decimal / NULLIF(c.total_sent, 0)) * 100, 2) as click_rate,
    ROUND((c.total_converted::decimal / NULLIF(c.total_sent, 0)) * 100, 2) as conversion_rate
FROM campaigns c
WHERE c.start_date >= CURRENT_DATE - INTERVAL '30 days'
AND c.status IN ('active', 'completed')
ORDER BY c.total_revenue_attributed DESC
LIMIT 10;
```

### Cohort Analysis Queries

```sql
-- Monthly Retention Cohort Table
WITH cohort_data AS (
    SELECT 
        c.id as customer_id,
        DATE_TRUNC('month', c.first_seen_at) as cohort_month,
        DATE_TRUNC('month', ce.occurred_at) as event_month,
        EXTRACT(epoch FROM DATE_TRUNC('month', ce.occurred_at) - DATE_TRUNC('month', c.first_seen_at)) / (30*24*3600) as period_number
    FROM customers c
    LEFT JOIN customer_events ce ON c.id = ce.customer_id
    WHERE c.first_seen_at >= '2024-01-01'
    AND ce.occurred_at IS NOT NULL
),
cohort_sizes AS (
    SELECT 
        cohort_month,
        COUNT(DISTINCT customer_id) as cohort_size
    FROM cohort_data
    GROUP BY cohort_month
),
retention_data AS (
    SELECT 
        cohort_month,
        period_number,
        COUNT(DISTINCT customer_id) as retained_customers
    FROM cohort_data
    WHERE period_number >= 0
    GROUP BY cohort_month, period_number
)
SELECT 
    cs.cohort_month,
    cs.cohort_size,
    rd.period_number,
    rd.retained_customers,
    ROUND((rd.retained_customers::decimal / cs.cohort_size) * 100, 2) as retention_rate
FROM cohort_sizes cs
JOIN retention_data rd ON cs.cohort_month = rd.cohort_month
ORDER BY cs.cohort_month, rd.period_number;

-- Revenue Cohort Analysis
WITH revenue_cohorts AS (
    SELECT 
        c.id as customer_id,
        DATE_TRUNC('month', c.first_seen_at) as cohort_month,
        DATE_TRUNC('month', co.ordered_at) as order_month,
        EXTRACT(epoch FROM DATE_TRUNC('month', co.ordered_at) - DATE_TRUNC('month', c.first_seen_at)) / (30*24*3600) as period_number,
        co.order_total
    FROM customers c
    LEFT JOIN customer_orders co ON c.id = co.customer_id
    WHERE c.first_seen_at >= '2024-01-01'
    AND co.order_status = 'delivered'
)
SELECT 
    cohort_month,
    period_number,
    COUNT(DISTINCT customer_id) as active_customers,
    SUM(order_total) as total_revenue,
    AVG(order_total) as avg_revenue_per_customer,
    SUM(SUM(order_total)) OVER (PARTITION BY cohort_month ORDER BY period_number) as cumulative_revenue
FROM revenue_cohorts
WHERE period_number >= 0
GROUP BY cohort_month, period_number
ORDER BY cohort_month, period_number;
```

### Segmentation Queries

```sql
-- High-Value Customers Segment
SELECT 
    c.id,
    c.customer_id,
    c.name,
    c.email,
    c.total_revenue,
    c.lifetime_value,
    c.total_orders,
    c.last_seen_at,
    c.engagement_score
FROM customers c
WHERE c.customer_status = 'active'
AND c.total_revenue >= 1000
AND c.last_seen_at >= CURRENT_DATE - INTERVAL '30 days'
AND c.engagement_score >= 70
ORDER BY c.total_revenue DESC;

-- At-Risk Customers (High Value but Declining Engagement)
SELECT 
    c.id,
    c.customer_id,
    c.name,
    c.email,
    c.total_revenue,
    c.last_seen_at,
    c.engagement_score,
    c.churn_risk_score,
    EXTRACT(days FROM CURRENT_DATE - c.last_seen_at::date) as days_since_last_seen
FROM customers c
WHERE c.customer_status = 'active'
AND c.total_revenue >= 500  -- High value
AND (
    c.churn_risk_score >= 70 OR 
    c.last_seen_at < CURRENT_DATE - INTERVAL '14 days' OR
    c.engagement_score < 30
)
ORDER BY c.churn_risk_score DESC, c.total_revenue DESC;

-- New Customers Needing Onboarding
SELECT 
    c.id,
    c.customer_id,
    c.name,
    c.email,
    c.first_seen_at,
    c.total_orders,
    c.lifecycle_stage,
    COUNT(ce.id) as total_events
FROM customers c
LEFT JOIN customer_events ce ON c.id = ce.customer_id
WHERE c.first_seen_at >= CURRENT_DATE - INTERVAL '7 days'
AND c.lifecycle_stage = 'new'
GROUP BY c.id, c.customer_id, c.name, c.email, c.first_seen_at, c.total_orders, c.lifecycle_stage
HAVING COUNT(ce.id) < 5  -- Low engagement
ORDER BY c.first_seen_at DESC;
```

## Database Setup Scripts

### Initial Database Setup
```sql
-- Create database (run as superuser)
CREATE DATABASE cdp_platform 
WITH ENCODING 'UTF8' 
LC_COLLATE = 'en_US.UTF-8' 
LC_CTYPE = 'en_US.UTF-8';

-- Connect to the database and create extensions
\c cdp_platform;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "hstore";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create roles
CREATE ROLE cdp_admin WITH LOGIN PASSWORD 'secure_admin_password';
CREATE ROLE cdp_app WITH LOGIN PASSWORD 'secure_app_password';
CREATE ROLE cdp_readonly WITH LOGIN PASSWORD 'secure_readonly_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE cdp_platform TO cdp_admin;
GRANT CONNECT ON DATABASE cdp_platform TO cdp_app;
GRANT CONNECT ON DATABASE cdp_platform TO cdp_readonly;

-- Schema-level permissions (run after creating tables)
GRANT USAGE ON SCHEMA public TO cdp_app, cdp_readonly;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cdp_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cdp_readonly;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO cdp_app;

-- Set default permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cdp_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO cdp_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO cdp_app;
```

### Triggers for Automated Updates
```sql
-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_platform_users_updated_at BEFORE UPDATE ON platform_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Customer metrics update trigger
CREATE OR REPLACE FUNCTION update_customer_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update customer totals when orders change
    IF TG_TABLE_NAME = 'customer_orders' THEN
        UPDATE customers SET 
            total_orders = (
                SELECT COUNT(*) FROM customer_orders 
                WHERE customer_id = NEW.customer_id AND order_status = 'delivered'
            ),
            total_revenue = (
                SELECT COALESCE(SUM(order_total), 0) FROM customer_orders 
                WHERE customer_id = NEW.customer_id AND order_status = 'delivered'
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.customer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_metrics_on_order AFTER INSERT OR UPDATE OR DELETE ON customer_orders
    FOR EACH ROW EXECUTE FUNCTION update_customer_metrics();
```

### Performance Monitoring Queries
```sql
-- Monitor query performance
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%customers%' 
ORDER BY total_time DESC 
LIMIT 10;

-- Monitor table sizes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals
FROM pg_stats 
WHERE tablename IN ('customers', 'customer_events', 'campaigns')
ORDER BY tablename, attname;

-- Monitor index usage
SELECT 
    t.tablename,
    indexname,
    c.reltuples AS num_rows,
    pg_size_pretty(pg_relation_size(quote_ident(t.tablename)::text)) AS table_size,
    pg_size_pretty(pg_relation_size(quote_ident(indexrelname)::text)) AS index_size,
    CASE WHEN indisunique THEN 'Y' ELSE 'N' END AS unique,
    idx_scan as number_of_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_tables t
LEFT OUTER JOIN pg_class c ON c.relname = t.tablename
LEFT OUTER JOIN (
    SELECT c.relname AS ctablename, ipg.relname AS indexname, x.indnatts AS number_of_columns,
           idx_scan, idx_tup_read, idx_tup_fetch, indexrelname, indisunique 
    FROM pg_index x
    JOIN pg_class c ON c.oid = x.indrelid
    JOIN pg_class ipg ON ipg.oid = x.indexrelid
    JOIN pg_stat_user_indexes psui ON x.indexrelid = psui.indexrelid
) AS foo ON t.tablename = foo.ctablename
WHERE t.schemaname = 'public'
ORDER BY 1, 2;
```

This comprehensive database schema provides a robust foundation for your customer data platform, supporting all the features visible in your frontend while maintaining performance, scalability, and data integrity. The schema includes proper indexing strategies, sample queries for implementation, and monitoring tools for ongoing optimization.
