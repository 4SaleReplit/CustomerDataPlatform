-- Drop existing tables if they exist (except users which has the correct structure)
DROP TABLE IF EXISTS platform_users CASCADE;
DROP TABLE IF EXISTS cohorts CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS integrations CASCADE;

-- Update users table to match exact schema
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE public.users (
  user_id INTEGER PRIMARY KEY,
  user_type TEXT,
  phone BIGINT,
  current_credits_in_wallet DOUBLE PRECISION,
  is_block INTEGER,
  user_account_creation_date TIMESTAMP WITHOUT TIME ZONE,
  first_paid_listing_date TIMESTAMP WITHOUT TIME ZONE,
  last_paid_listing_date TIMESTAMP WITHOUT TIME ZONE,
  first_transaction_date TIMESTAMP WITHOUT TIME ZONE,
  last_transaction_date TIMESTAMP WITHOUT TIME ZONE,
  days_since_last_paid_listing INTEGER,
  days_since_last_paid_transaction INTEGER,
  days_since_last_transaction INTEGER,
  active_months_last_6 DOUBLE PRECISION,
  active_weeks_last_12 DOUBLE PRECISION,
  paid_listings_count INTEGER,
  free_listings_count INTEGER,
  total_listings_count INTEGER,
  office_listings_count INTEGER,
  total_credits_spent INTEGER,
  total_premium_credits_spent INTEGER,
  total_free_credits_spent INTEGER,
  extra_addons_count INTEGER,
  extra_addons_total_credits DOUBLE PRECISION,
  extra_addons_premium_credits DOUBLE PRECISION,
  extra_addons_free_credits DOUBLE PRECISION,
  verticals_listed_in TEXT,
  levels_1_listed_in TEXT,
  plans_or_bundles_used TEXT,
  favorite_vertical TEXT,
  favorite_level_1 TEXT,
  number_of_verticals_listed_in INTEGER,
  number_of_level1_categories_listed_in INTEGER,
  is_multivertical_user INTEGER,
  favorite_plan_or_bundle TEXT,
  favorite_extra_addon TEXT,
  top_extra_addons TEXT,
  basic_listings_count INTEGER,
  basic_credits_spent INTEGER,
  pro_listings_count INTEGER,
  pro_credits_spent INTEGER,
  extra_listings_count INTEGER,
  extra_credits_spent INTEGER,
  plus_listings_count INTEGER,
  plus_credits_spent INTEGER,
  super_listings_count INTEGER,
  super_credits_spent INTEGER,
  standard_listings_count INTEGER,
  standard_credits_spent INTEGER,
  premium_listings_count INTEGER,
  premium_credits_spent INTEGER,
  optimum_listings_count INTEGER,
  optimum_credits_spent INTEGER,
  car_offices_listings_count INTEGER,
  car_offices_credits_spent INTEGER,
  property_offices_listings_count INTEGER,
  property_offices_credits_spent INTEGER,
  electronics_shops_listings_count INTEGER,
  electronics_shops_credits_spent INTEGER,
  addon_pinning_listings_count INTEGER,
  addon_pinning_credits_spent INTEGER,
  addon_extended_listings_count INTEGER,
  addon_extended_credits_spent INTEGER,
  addon_promoted_listings_count INTEGER,
  addon_promoted_credits_spent INTEGER,
  addon_pinning_shuffle_listings_count INTEGER,
  addon_pinning_shuffle_credits_spent INTEGER,
  addon_premium_listings_count INTEGER,
  addon_premium_credits_spent INTEGER,
  addon_power_pin_listings_count INTEGER,
  addon_power_pin_credits_spent INTEGER,
  addon_refresh_listings_count INTEGER,
  addon_refresh_credits_spent INTEGER,
  addon_vip_listings_count INTEGER,
  addon_vip_credits_spent INTEGER,
  offer_50_days_used INTEGER,
  offer_baraka_days_used INTEGER,
  offer_total_days_used INTEGER,
  offer_50_percentage DOUBLE PRECISION,
  offer_baraka_percentage DOUBLE PRECISION,
  offer_total_percentage DOUBLE PRECISION
);

-- Create platform users table for admin access
CREATE TABLE IF NOT EXISTS platform_users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'read_only',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Cohorts Table
CREATE TABLE public.cohorts (
  cohort_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  definition JSONB, -- AND/OR condition builder structure
  source TEXT, -- Manual, Amplitude, API imported
  total_users_estimated INT DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Segments Table (optional reusable filters library)
CREATE TABLE public.segments (
  segment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  segment_type TEXT,  -- Static, Dynamic, System
  logic JSONB,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Promotions Table
CREATE TABLE public.promotions (
  promo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES public.cohorts(cohort_id),
  promo_code TEXT UNIQUE,
  promo_type TEXT,  -- CreditBoost, Discount, BonusBundle, Custom
  promo_metadata JSONB,
  start_date TIMESTAMP NOT NULL,
  expiry_date TIMESTAMP NOT NULL,
  usage_limit INT DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Promo Redemptions Table
CREATE TABLE public.promo_redemptions (
  redemption_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id UUID REFERENCES public.promotions(promo_id),
  user_id int4 REFERENCES public.users(user_id),
  redeemed_at TIMESTAMP DEFAULT NOW(),
  redemption_status TEXT DEFAULT 'success',
  notes TEXT
);

-- Cohort Members Table (Optional materialized cohort membership)
CREATE TABLE public.cohort_members (
  cohort_id UUID REFERENCES public.cohorts(cohort_id),
  user_id int4 REFERENCES public.users(user_id),
  computed_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (cohort_id, user_id)
);

-- Integration Logs Table
CREATE TABLE public.integration_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name TEXT,
  external_id TEXT,
  run_type TEXT,  -- Import, Export, Refresh
  run_status TEXT,  -- success, failed, partial
  processed_records INT DEFAULT 0,
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  error_message TEXT
);

-- Activation Jobs Table
CREATE TABLE public.activation_jobs (
  job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES public.cohorts(cohort_id),
  promo_id UUID REFERENCES public.promotions(promo_id),
  target_channel TEXT, -- Redis, Braze, Email, SMS etc
  status TEXT, -- queued, running, success, failed
  triggered_by UUID,
  triggered_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP
);

-- Insert default admin user
INSERT INTO platform_users (username, email, password, role) 
VALUES ('admin', 'admin@example.com', 'password', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample marketplace users with realistic data
INSERT INTO users (
  user_id, user_type, phone, current_credits_in_wallet, is_block,
  user_account_creation_date, total_credits_spent, total_listings_count,
  days_since_last_transaction, paid_listings_count, free_listings_count,
  favorite_vertical, is_multivertical_user, verticals_listed_in,
  basic_listings_count, pro_listings_count, premium_listings_count,
  addon_pinning_credits_spent, addon_promoted_credits_spent
) VALUES
(1001, 'premium', 1234567890, 150.50, 0, NOW() - INTERVAL '6 months', 2500, 25, 3, 20, 5, 'Electronics', 1, 'Electronics,Cars', 5, 10, 5, 200, 150),
(1002, 'basic', 1234567891, 75.25, 0, NOW() - INTERVAL '3 months', 1200, 15, 7, 12, 3, 'Cars', 0, 'Cars', 10, 2, 0, 50, 0),
(1003, 'pro', 1234567892, 300.00, 0, NOW() - INTERVAL '1 year', 5000, 45, 1, 40, 5, 'Property', 1, 'Property,Services', 15, 20, 5, 300, 200),
(1004, 'basic', 1234567893, 25.75, 1, NOW() - INTERVAL '8 months', 800, 8, 45, 6, 2, 'Electronics', 0, 'Electronics', 8, 0, 0, 0, 0),
(1005, 'premium', 1234567894, 200.00, 0, NOW() - INTERVAL '2 months', 3500, 35, 2, 30, 5, 'Services', 1, 'Services,Property', 10, 15, 5, 250, 180)
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample cohorts
INSERT INTO cohorts (name, description, definition, source, total_users_estimated) VALUES
('High Value Users', 'Users who spent more than $2000', '{"conditions":[{"field":"total_credits_spent","operator":"gt","value":"2000"}]}', 'Manual', 3),
('Electronics Enthusiasts', 'Users primarily listing in Electronics', '{"conditions":[{"field":"favorite_vertical","operator":"eq","value":"Electronics"}]}', 'Manual', 2),
('Inactive Users', 'Users inactive for more than 30 days', '{"conditions":[{"field":"days_since_last_transaction","operator":"gt","value":"30"}]}', 'Manual', 1)
ON CONFLICT DO NOTHING;

-- Insert sample promotions
INSERT INTO promotions (cohort_id, promo_code, promo_type, promo_metadata, start_date, expiry_date, usage_limit) VALUES
((SELECT cohort_id FROM cohorts WHERE name = 'High Value Users' LIMIT 1), 'VIP50', 'CreditBoost', '{"credits": 500, "bonus_percentage": 50}', NOW(), NOW() + INTERVAL '30 days', 100),
((SELECT cohort_id FROM cohorts WHERE name = 'Electronics Enthusiasts' LIMIT 1), 'TECH25', 'Discount', '{"discount_percentage": 25, "category": "Electronics"}', NOW(), NOW() + INTERVAL '15 days', 50)
ON CONFLICT DO NOTHING;