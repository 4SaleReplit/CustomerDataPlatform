import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, bigint, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// CDP Users table (marketplace end-users)
export const cdpUsers = pgTable("users", {
  user_id: integer("user_id").primaryKey(),
  user_type: text("user_type"),
  phone: bigint("phone", { mode: "number" }),
  current_credits_in_wallet: doublePrecision("current_credits_in_wallet"),
  is_block: integer("is_block"),
  user_account_creation_date: timestamp("user_account_creation_date"),
  first_paid_listing_date: timestamp("first_paid_listing_date"),
  last_paid_listing_date: timestamp("last_paid_listing_date"),
  first_transaction_date: timestamp("first_transaction_date"),
  last_transaction_date: timestamp("last_transaction_date"),
  days_since_last_paid_listing: integer("days_since_last_paid_listing"),
  days_since_last_paid_transaction: integer("days_since_last_paid_transaction"),
  days_since_last_transaction: integer("days_since_last_transaction"),
  active_months_last_6: doublePrecision("active_months_last_6"),
  active_weeks_last_12: doublePrecision("active_weeks_last_12"),
  paid_listings_count: integer("paid_listings_count"),
  free_listings_count: integer("free_listings_count"),
  total_listings_count: integer("total_listings_count"),
  office_listings_count: integer("office_listings_count"),
  total_credits_spent: integer("total_credits_spent"),
  total_premium_credits_spent: integer("total_premium_credits_spent"),
  total_free_credits_spent: integer("total_free_credits_spent"),
  extra_addons_count: integer("extra_addons_count"),
  extra_addons_total_credits: doublePrecision("extra_addons_total_credits"),
  extra_addons_premium_credits: doublePrecision("extra_addons_premium_credits"),
  extra_addons_free_credits: doublePrecision("extra_addons_free_credits"),
  verticals_listed_in: text("verticals_listed_in"),
  levels_1_listed_in: text("levels_1_listed_in"),
  plans_or_bundles_used: text("plans_or_bundles_used"),
  favorite_vertical: text("favorite_vertical"),
  favorite_level_1: text("favorite_level_1"),
  number_of_verticals_listed_in: integer("number_of_verticals_listed_in"),
  number_of_level1_categories_listed_in: integer("number_of_level1_categories_listed_in"),
  is_multivertical_user: integer("is_multivertical_user"),
  favorite_plan_or_bundle: text("favorite_plan_or_bundle"),
  favorite_extra_addon: text("favorite_extra_addon"),
  top_extra_addons: text("top_extra_addons"),
  basic_listings_count: integer("basic_listings_count"),
  basic_credits_spent: integer("basic_credits_spent"),
  pro_listings_count: integer("pro_listings_count"),
  pro_credits_spent: integer("pro_credits_spent"),
  extra_listings_count: integer("extra_listings_count"),
  extra_credits_spent: integer("extra_credits_spent"),
  plus_listings_count: integer("plus_listings_count"),
  plus_credits_spent: integer("plus_credits_spent"),
  super_listings_count: integer("super_listings_count"),
  super_credits_spent: integer("super_credits_spent"),
  standard_listings_count: integer("standard_listings_count"),
  standard_credits_spent: integer("standard_credits_spent"),
  premium_listings_count: integer("premium_listings_count"),
  premium_credits_spent: integer("premium_credits_spent"),
  optimum_listings_count: integer("optimum_listings_count"),
  optimum_credits_spent: integer("optimum_credits_spent"),
  car_offices_listings_count: integer("car_offices_listings_count"),
  car_offices_credits_spent: integer("car_offices_credits_spent"),
  property_offices_listings_count: integer("property_offices_listings_count"),
  property_offices_credits_spent: integer("property_offices_credits_spent"),
  electronics_shops_listings_count: integer("electronics_shops_listings_count"),
  electronics_shops_credits_spent: integer("electronics_shops_credits_spent"),
  addon_pinning_listings_count: integer("addon_pinning_listings_count"),
  addon_pinning_credits_spent: integer("addon_pinning_credits_spent"),
  addon_extended_listings_count: integer("addon_extended_listings_count"),
  addon_extended_credits_spent: integer("addon_extended_credits_spent"),
  addon_promoted_listings_count: integer("addon_promoted_listings_count"),
  addon_promoted_credits_spent: integer("addon_promoted_credits_spent"),
  addon_pinning_shuffle_listings_count: integer("addon_pinning_shuffle_listings_count"),
  addon_pinning_shuffle_credits_spent: integer("addon_pinning_shuffle_credits_spent"),
  addon_premium_listings_count: integer("addon_premium_listings_count"),
  addon_premium_credits_spent: integer("addon_premium_credits_spent"),
  addon_power_pin_listings_count: integer("addon_power_pin_listings_count"),
  addon_power_pin_credits_spent: integer("addon_power_pin_credits_spent"),
  addon_refresh_listings_count: integer("addon_refresh_listings_count"),
  addon_refresh_credits_spent: integer("addon_refresh_credits_spent"),
  addon_vip_listings_count: integer("addon_vip_listings_count"),
  addon_vip_credits_spent: integer("addon_vip_credits_spent"),
  offer_50_days_used: integer("offer_50_days_used"),
  offer_baraka_days_used: integer("offer_baraka_days_used"),
  offer_total_days_used: integer("offer_total_days_used"),
  offer_50_percentage: doublePrecision("offer_50_percentage"),
  offer_baraka_percentage: doublePrecision("offer_baraka_percentage"),
  offer_total_percentage: doublePrecision("offer_total_percentage"),
});

// Platform users (admin/staff users)
export const users = pgTable("platform_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("read_only"), // super_admin, admin, growth_manager, data_engineer, read_only
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").defaultNow(),
  last_login: timestamp("last_login"),
});

// Cohorts
export const cohorts = pgTable("cohorts", {
  cohort_id: uuid("cohort_id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  definition: jsonb("definition"),
  source: text("source"),
  total_users_estimated: integer("total_users_estimated").default(0),
  created_by: uuid("created_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Promotions
export const promotions = pgTable("promotions", {
  promo_id: uuid("promo_id").primaryKey().defaultRandom(),
  cohort_id: uuid("cohort_id").references(() => cohorts.cohort_id),
  promo_code: text("promo_code").unique(),
  promo_type: text("promo_type"),
  promo_metadata: jsonb("promo_metadata"),
  start_date: timestamp("start_date").notNull(),
  expiry_date: timestamp("expiry_date").notNull(),
  usage_limit: integer("usage_limit").default(1),
  created_by: uuid("created_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Integration status tracking
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // amplitude, braze, airflow
  status: text("status").notNull().default("healthy"), // healthy, warning, error
  last_sync: timestamp("last_sync"),
  error_message: text("error_message"),
  metadata: text("metadata"), // JSON string
  updated_at: timestamp("updated_at").defaultNow(),
});

// Schema types
export type CdpUser = typeof cdpUsers.$inferSelect;
export type InsertCdpUser = typeof cdpUsers.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Cohort = typeof cohorts.$inferSelect;
export type InsertCohort = typeof cohorts.$inferInsert;

export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = typeof promotions.$inferInsert;

export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = typeof integrations.$inferInsert;

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  last_login: true,
});

export const insertCohortSchema = createInsertSchema(cohorts).omit({
  cohort_id: true,
  total_users_estimated: true,
  created_at: true,
  updated_at: true,
});

export const insertPromotionSchema = createInsertSchema(promotions).omit({
  id: true,
  current_redemptions: true,
  created_at: true,
});
