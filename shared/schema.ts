import { pgTable, text, serial, integer, boolean, timestamp, uuid, varchar, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Original users table structure
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Team table from PostgreSQL schema
export const team = pgTable("team", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  role: text("role").notNull().default('analyst'),
  status: text("status").notNull().default('active'),
  permissions: jsonb("permissions").default('{}'),
  temporaryPassword: varchar("temporary_password", { length: 255 }),
  mustChangePassword: boolean("must_change_password").default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by")
});

// Roles and permissions management
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default('#3B82F6'),
  isSystemRole: boolean("is_system_role").default(false),
  isActive: boolean("is_active").default(true),
  permissions: jsonb("permissions").notNull().default('{}'),
  hierarchyLevel: integer("hierarchy_level").default(0),
  canManageRoles: boolean("can_manage_roles").default(false),
  maxTeamMembers: integer("max_team_members"),
  allowedFeatures: jsonb("allowed_features").default('[]'),
  restrictions: jsonb("restrictions").default('{}'),
  createdBy: uuid("created_by").references(() => team.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  resource: varchar("resource", { length: 50 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  isSystemPermission: boolean("is_system_permission").default(false),
  requiresElevation: boolean("requires_elevation").default(false),
  dependencies: jsonb("dependencies").default('[]'),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleId: uuid("role_id").references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  permissionId: uuid("permission_id").references(() => permissions.id, { onDelete: 'cascade' }).notNull(),
  granted: boolean("granted").default(true),
  conditions: jsonb("conditions").default('{}'),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  grantedBy: uuid("granted_by").references(() => team.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// Dashboard configurations
export const dashboardConfigurations = pgTable("dashboard_configurations", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").references(() => team.id, { onDelete: 'set null' }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  layoutConfig: jsonb("layout_config").notNull(),
  isDefaultForTeamRole: text("is_default_for_team_role"),
  isTemplate: boolean("is_template").default(false),
  createdBy: uuid("created_by").references(() => team.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Dashboard tiles
export const dashboardTiles = pgTable("dashboard_tiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tileType: text("tile_type").notNull(),
  defaultTitle: varchar("default_title", { length: 255 }).notNull(),
  defaultDataSourceConfig: jsonb("default_data_source_config").notNull(),
  defaultVisualizationConfig: jsonb("default_visualization_config").default('{}'),
  description: text("description"),
  isPubliclyAvailable: boolean("is_publicly_available").default(true),
  createdBy: uuid("created_by").references(() => team.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Cohorts
export const cohorts = pgTable("cohorts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).unique().notNull(),
  description: text("description"),
  conditions: jsonb("conditions").notNull(),
  userCount: integer("user_count").default(0),
  status: text("status").notNull().default('draft'),
  syncStatus: text("sync_status").notNull().default('not_synced'),
  calculationQuery: text("calculation_query"),
  lastCalculatedAt: timestamp("last_calculated_at", { withTimezone: true }),
  calculationError: text("calculation_error"),
  autoRefresh: boolean("auto_refresh").default(true),
  refreshFrequencyHours: integer("refresh_frequency_hours").default(24),
  nextRefreshAt: timestamp("next_refresh_at", { withTimezone: true }),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  amplitudeCohortId: varchar("amplitude_cohort_id", { length: 255 }),
  brazeLastSyncedAt: timestamp("braze_last_synced_at", { withTimezone: true }),
  brazeSegmentId: varchar("braze_segment_id", { length: 255 }),
  brazeSyncStatus: text("braze_sync_status").notNull().default('not_synced'),
  createdBy: uuid("created_by").references(() => team.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Segments
export const segments = pgTable("segments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).unique().notNull(),
  description: text("description"),
  segmentType: text("segment_type").notNull(),
  conditions: jsonb("conditions"),
  color: varchar("color", { length: 7 }).default('#3B82F6'),
  isActive: boolean("is_active").default(true),
  autoAssign: boolean("auto_assign").default(false),
  createdBy: uuid("created_by").references(() => team.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Dashboard tile instances for persistence
export const dashboardTileInstances = pgTable("dashboard_tile_instances", {
  id: uuid("id").primaryKey().defaultRandom(),
  tileId: varchar("tile_id", { length: 255 }).notNull(), // Frontend-generated ID
  dashboardId: uuid("dashboard_id").references(() => dashboardConfigurations.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // 'chart', 'metric', 'table', etc.
  title: varchar("title", { length: 255 }).notNull(),
  x: integer("x").notNull().default(0),
  y: integer("y").notNull().default(0),
  width: integer("width").notNull().default(4),
  height: integer("height").notNull().default(3),
  icon: varchar("icon", { length: 50 }),
  dataSource: jsonb("data_source").notNull(), // Contains table, query, aggregation, etc.
  refreshConfig: jsonb("refresh_config").notNull(), // Contains autoRefresh, refreshOnLoad, etc.
  createdBy: uuid("created_by").references(() => team.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Campaigns
export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  cohortId: uuid("cohort_id").references(() => cohorts.id),
  status: text("status").notNull().default("draft"), // draft, active, paused, completed
  schedule: text("schedule").notNull().default("now"), // now, later
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }),
  upsellItems: jsonb("upsell_items").notNull(), // Array of upsell items
  messagesSent: integer("messages_sent").default(0),
  views: integer("views").default(0),
  conversions: integer("conversions").default(0),
  createdBy: uuid("created_by").references(() => team.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true })
});

// Campaign jobs tracking Redis queue jobs
export const campaignJobs = pgTable("campaign_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => campaigns.id),
  jobId: varchar("job_id", { length: 255 }).notNull(), // Redis Bull job ID
  userId: varchar("user_id", { length: 255 }).notNull(),
  userAdvId: integer("user_adv_id").notNull(),
  recommendation: jsonb("recommendation").notNull(), // The upselling recommendation
  status: text("status").notNull().default("pending"), // pending, sent, failed
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true })
});

// Integrations table for platform connections
export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // braze, amplitude, facebook, google, etc
  description: text("description").notNull(),
  status: text("status").notNull().default("disconnected"), // connected, disconnected, testing, error
  credentials: jsonb("credentials").notNull().default('{}'),
  metadata: jsonb("metadata").default('{}'), // account info, data available, etc
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTeamSchema = createInsertSchema(team).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCohortSchema = createInsertSchema(cohorts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export const updateCohortSchema = createInsertSchema(cohorts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertSegmentSchema = createInsertSchema(segments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDashboardTileSchema = createInsertSchema(dashboardTiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDashboardTileInstanceSchema = createInsertSchema(dashboardTileInstances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  startedAt: true,
  completedAt: true,
});

export const insertCampaignJobSchema = createInsertSchema(campaignJobs).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof team.$inferSelect;
export type InsertCohort = z.infer<typeof insertCohortSchema>;
export type UpdateCohort = z.infer<typeof updateCohortSchema>;
export type Cohort = typeof cohorts.$inferSelect;
export type InsertSegment = z.infer<typeof insertSegmentSchema>;
export type Segment = typeof segments.$inferSelect;
export type InsertDashboardTile = z.infer<typeof insertDashboardTileSchema>;
export type DashboardTileType = typeof dashboardTiles.$inferSelect;
export type InsertDashboardTileInstance = z.infer<typeof insertDashboardTileInstanceSchema>;
export type DashboardTileInstance = typeof dashboardTileInstances.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaignJob = z.infer<typeof insertCampaignJobSchema>;
export type CampaignJob = typeof campaignJobs.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;

// Role and permission schemas
export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
});

// Role and permission types
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type UpdateRole = z.infer<typeof updateRoleSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;
