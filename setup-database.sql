-- Create the CDP users table (marketplace end-users)
CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY,
  user_type TEXT,
  phone BIGINT,
  current_credits_in_wallet DOUBLE PRECISION,
  is_block INTEGER,
  user_account_creation_date TIMESTAMP,
  first_paid_listing_date TIMESTAMP,
  last_paid_listing_date TIMESTAMP,
  first_transaction_date TIMESTAMP,
  last_transaction_date TIMESTAMP,
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

-- Create platform users table (admin/staff users)
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

-- Create cohorts table
CREATE TABLE IF NOT EXISTS cohorts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  conditions TEXT NOT NULL,
  user_count INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_synced TIMESTAMP,
  created_by INTEGER REFERENCES platform_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  cohort_id INTEGER REFERENCES cohorts(id),
  value DOUBLE PRECISION NOT NULL,
  max_redemptions INTEGER,
  current_redemptions INTEGER DEFAULT 0,
  starts_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by INTEGER REFERENCES platform_users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'healthy',
  last_sync TIMESTAMP,
  error_message TEXT,
  metadata TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default admin user
INSERT INTO platform_users (username, email, password, role) 
VALUES ('admin', 'admin@example.com', 'password', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample integrations
INSERT INTO integrations (name, type, status, last_sync) VALUES
('Amplitude Analytics', 'amplitude', 'healthy', NOW() - INTERVAL '2 hours'),
('Braze Marketing', 'braze', 'warning', NOW() - INTERVAL '6 hours'),
('Airflow ETL', 'airflow', 'error', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Insert sample CDP users (marketplace users)
INSERT INTO users (
  user_id, user_type, phone, current_credits_in_wallet, is_block,
  user_account_creation_date, total_credits_spent, total_listings_count,
  days_since_last_transaction, paid_listings_count, free_listings_count,
  favorite_vertical, is_multivertical_user
) VALUES
(1001, 'premium', 1234567890, 150.50, 0, NOW() - INTERVAL '6 months', 2500, 25, 3, 20, 5, 'Electronics', 1),
(1002, 'basic', 1234567891, 75.25, 0, NOW() - INTERVAL '3 months', 1200, 15, 7, 12, 3, 'Cars', 0),
(1003, 'pro', 1234567892, 300.00, 0, NOW() - INTERVAL '1 year', 5000, 45, 1, 40, 5, 'Property', 1),
(1004, 'basic', 1234567893, 25.75, 1, NOW() - INTERVAL '8 months', 800, 8, 45, 6, 2, 'Electronics', 0),
(1005, 'premium', 1234567894, 200.00, 0, NOW() - INTERVAL '2 months', 3500, 35, 2, 30, 5, 'Services', 1)
ON CONFLICT (user_id) DO NOTHING;