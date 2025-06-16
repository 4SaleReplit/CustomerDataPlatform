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

// Uploaded images for presentations
export const uploadedImages = pgTable("uploaded_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  url: text("url").notNull(),
  uploadedBy: varchar("uploaded_by", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Individual slides with elements and styling
export const slides = pgTable("slides", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  elements: jsonb("elements").notNull().default('[]'), // Array of slide elements with positioning and styling
  backgroundImage: uuid("background_image").references(() => uploadedImages.id),
  backgroundColor: varchar("background_color", { length: 7 }).default('#ffffff'),
  order: integer("order").notNull().default(0),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Presentations containing multiple slides
export const presentations = pgTable("presentations", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  slideIds: uuid("slide_ids").array(),
  previewImageId: uuid("preview_image_id").references(() => uploadedImages.id),
  previewImageUrl: text("preview_image_url"), // Direct URL for preview thumbnail
  lastRefreshed: timestamp("last_refreshed", { withTimezone: true }),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
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

export const insertUploadedImageSchema = createInsertSchema(uploadedImages).omit({
  id: true,
  createdAt: true,
});

export const insertSlideSchema = createInsertSchema(slides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSlideSchema = createInsertSchema(slides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertPresentationSchema = createInsertSchema(presentations).omit({
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
export type InsertUploadedImage = z.infer<typeof insertUploadedImageSchema>;
export type UploadedImage = typeof uploadedImages.$inferSelect;
export type InsertSlide = z.infer<typeof insertSlideSchema>;
export type UpdateSlide = z.infer<typeof updateSlideSchema>;
export type Slide = typeof slides.$inferSelect;
export type InsertPresentation = z.infer<typeof insertPresentationSchema>;
export type Presentation = typeof presentations.$inferSelect;

// Scheduler type exports
export type InsertScheduledReport = z.infer<typeof insertScheduledReportSchema>;
export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertMailingList = z.infer<typeof insertMailingListSchema>;
export type MailingList = typeof mailingLists.$inferSelect;
export type InsertReportExecution = z.infer<typeof insertReportExecutionSchema>;
export type ReportExecution = typeof reportExecutions.$inferSelect;
export type InsertAirflowConfiguration = z.infer<typeof insertAirflowConfigurationSchema>;
export type AirflowConfiguration = typeof airflowConfigurations.$inferSelect;

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

// Environment configurations table
export const environmentConfigurations = pgTable("environment_configurations", {
  id: uuid("id").primaryKey().defaultRandom(),
  environmentId: varchar("environment_id", { length: 100 }).notNull(),
  environmentName: varchar("environment_name", { length: 100 }).notNull(),
  integrationType: varchar("integration_type", { length: 50 }).notNull(),
  integrationId: uuid("integration_id").references(() => integrations.id, { onDelete: 'cascade' }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Scheduled Reports System
export const scheduledReports = pgTable("scheduled_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  presentationId: uuid("presentation_id").references(() => presentations.id, { onDelete: 'cascade' }).notNull(),
  cronExpression: varchar("cron_expression", { length: 100 }).notNull(), // "0 9 * * 1" for weekly Monday 9AM
  timezone: varchar("timezone", { length: 50 }).default('UTC'),
  emailSubject: text("email_subject").notNull(),
  emailBody: text("email_body").notNull(), // Template with {placeholders}
  recipientList: jsonb("recipient_list").notNull().default('[]'), // Array of email addresses
  ccList: jsonb("cc_list").default('[]'),
  bccList: jsonb("bcc_list").default('[]'),
  isActive: boolean("is_active").default(true),
  lastExecuted: timestamp("last_executed", { withTimezone: true }),
  nextExecution: timestamp("next_execution", { withTimezone: true }),
  executionCount: integer("execution_count").default(0),
  errorCount: integer("error_count").default(0),
  lastError: text("last_error"),
  airflowDagId: varchar("airflow_dag_id", { length: 255 }),
  airflowTaskId: varchar("airflow_task_id", { length: 255 }),
  airflowConfiguration: jsonb("airflow_configuration").default('{}'), // Complete Airflow DAG configuration
  pdfDeliveryUrl: text("pdf_delivery_url"), // Public URL for PDF delivery
  placeholderConfig: jsonb("placeholder_config").default('{}'), // Available placeholders and their sources
  formatSettings: jsonb("format_settings").default('{}'), // PDF/Excel export settings
  createdBy: uuid("created_by").references(() => team.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Email Templates for Reports
export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  templateType: varchar("template_type", { length: 50 }).notNull(), // 'report_delivery', 'alert', 'summary'
  subject: text("subject").notNull(),
  bodyHtml: text("body_html").notNull(),
  bodyText: text("body_text"),
  availablePlaceholders: jsonb("available_placeholders").default('[]'),
  isSystemTemplate: boolean("is_system_template").default(false),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => team.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Mailing Lists Management
export const mailingLists = pgTable("mailing_lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  emails: jsonb("emails").notNull().default('[]'), // Array of email objects with name/email
  tags: jsonb("tags").default('[]'), // Array of tags for categorization
  isActive: boolean("is_active").default(true),
  subscriberCount: integer("subscriber_count").default(0),
  lastUsed: timestamp("last_used", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => team.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Report Execution History
export const reportExecutions = pgTable("report_executions", {
  id: uuid("id").primaryKey().defaultRandom(),
  scheduledReportId: uuid("scheduled_report_id").references(() => scheduledReports.id, { onDelete: 'cascade' }).notNull(),
  executionStatus: varchar("execution_status", { length: 50 }).notNull(), // 'pending', 'running', 'completed', 'failed', 'cancelled'
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  executionDuration: integer("execution_duration"), // Duration in seconds
  recipientCount: integer("recipient_count").default(0),
  successfulDeliveries: integer("successful_deliveries").default(0),
  failedDeliveries: integer("failed_deliveries").default(0),
  errorMessage: text("error_message"),
  airflowRunId: varchar("airflow_run_id", { length: 255 }),
  airflowTaskInstanceId: varchar("airflow_task_instance_id", { length: 255 }),
  executionMetadata: jsonb("execution_metadata").default('{}'), // Additional execution details
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// Airflow Configuration
export const airflowConfigurations = pgTable("airflow_configurations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  airflowBaseUrl: text("airflow_base_url").notNull(),
  airflowUsername: varchar("airflow_username", { length: 255 }),
  airflowPassword: text("airflow_password"), // Encrypted
  authType: varchar("auth_type", { length: 50 }).default('basic'), // 'basic', 'oauth', 'api_key'
  apiKey: text("api_key"), // For API key authentication
  defaultDagPrefix: varchar("default_dag_prefix", { length: 100 }).default('report_scheduler'),
  isActive: boolean("is_active").default(true),
  connectionStatus: varchar("connection_status", { length: 50 }).default('disconnected'),
  lastConnectionTest: timestamp("last_connection_test", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => team.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Environment configuration schemas
export const insertEnvironmentConfigurationSchema = createInsertSchema(environmentConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Scheduler insert schemas
export const insertScheduledReportSchema = createInsertSchema(scheduledReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMailingListSchema = createInsertSchema(mailingLists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReportExecutionSchema = createInsertSchema(reportExecutions).omit({
  id: true,
  createdAt: true,
});

export const insertAirflowConfigurationSchema = createInsertSchema(airflowConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateEnvironmentConfigurationSchema = createInsertSchema(environmentConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

// Role and permission types
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type UpdateRole = z.infer<typeof updateRoleSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertEnvironmentConfiguration = z.infer<typeof insertEnvironmentConfigurationSchema>;
export type UpdateEnvironmentConfiguration = z.infer<typeof updateEnvironmentConfigurationSchema>;
export type EnvironmentConfiguration = typeof environmentConfigurations.$inferSelect;

// Migration History table
export const migrationHistory = pgTable("migration_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  sourceIntegrationId: uuid("source_integration_id").references(() => integrations.id, { onDelete: 'set null' }),
  targetIntegrationId: uuid("target_integration_id").references(() => integrations.id, { onDelete: 'set null' }),
  sourceIntegrationName: varchar("source_integration_name", { length: 255 }),
  targetIntegrationName: varchar("target_integration_name", { length: 255 }),
  migrationType: varchar("migration_type", { length: 50 }).notNull(), // 'database', 'redis', 's3'
  status: varchar("status", { length: 20 }).notNull().default('running'), // 'running', 'completed', 'error', 'cancelled'
  progress: integer("progress").default(0), // 0-100
  totalItems: integer("total_items").default(0),
  completedItems: integer("completed_items").default(0),
  startTime: timestamp("start_time", { withTimezone: true }).defaultNow(),
  endTime: timestamp("end_time", { withTimezone: true }),
  duration: integer("duration"), // duration in seconds
  logs: jsonb("logs").default('[]'), // Array of log messages
  metadata: jsonb("metadata").default('{}'), // Migration-specific metadata
  errorMessage: text("error_message"),
  createdBy: uuid("created_by").references(() => team.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Migration History schemas
export const insertMigrationHistorySchema = createInsertSchema(migrationHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateMigrationHistorySchema = createInsertSchema(migrationHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type InsertMigrationHistory = z.infer<typeof insertMigrationHistorySchema>;
export type UpdateMigrationHistory = z.infer<typeof updateMigrationHistorySchema>;
export type MigrationHistory = typeof migrationHistory.$inferSelect;
