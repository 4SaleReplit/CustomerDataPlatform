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
  lastRefreshAt: timestamp("last_refresh_at", { withTimezone: true }), // Track last refresh time
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
  type: varchar("type", { length: 50 }).notNull(), // braze, amplitude, facebook, google, etc
  credentials: jsonb("credentials").notNull(),
  active: boolean("active").default(true),
  status: varchar("status", { length: 20 }).default("connected"), // connected, disconnected, testing, error
  metadata: jsonb("metadata").default('{}'), // account info, data available, etc
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  lastTestedAt: timestamp("last_tested_at", { withTimezone: true }),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true })
});

// Monitored endpoints table for endpoint monitoring like Pingdom
export const monitoredEndpoints = pgTable("monitored_endpoints", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  method: varchar("method", { length: 10 }).notNull().default('GET'),
  expectedStatus: integer("expected_status").notNull().default(200),
  checkInterval: integer("check_interval").notNull().default(300), // seconds
  timeout: integer("timeout").notNull().default(30), // seconds
  alertEmail: boolean("alert_email").default(true),
  alertSlack: boolean("alert_slack").default(false),
  isActive: boolean("is_active").default(true),
  lastStatus: integer("last_status"),
  lastResponseTime: integer("last_response_time"), // milliseconds
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
  lastFailureAt: timestamp("last_failure_at", { withTimezone: true }),
  consecutiveFailures: integer("consecutive_failures").default(0),
  uptimePercentage: decimal("uptime_percentage", { precision: 5, scale: 2 }),
  createdBy: uuid("created_by").references(() => team.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Endpoint monitoring history for tracking checks over time
export const endpointMonitoringHistory = pgTable("endpoint_monitoring_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  endpointId: uuid("endpoint_id").references(() => monitoredEndpoints.id, { onDelete: 'cascade' }).notNull(),
  status: integer("status").notNull(),
  responseTime: integer("response_time"), // milliseconds
  errorMessage: text("error_message"),
  checkedAt: timestamp("checked_at", { withTimezone: true }).defaultNow()
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
  pdfUrl: text("pdf_url"), // S3 public URL for generated PDF
  pdfS3Key: text("pdf_s3_key"), // S3 object key for PDF file
  lastRefreshed: timestamp("last_refreshed", { withTimezone: true }),
  templateId: uuid("template_id").references(() => templates.id), // Relationship to source template
  scheduledReportId: uuid("scheduled_report_id").references(() => scheduledReports.id), // If generated from scheduled report
  instanceType: varchar("instance_type", { length: 20 }).default('manual'), // manual, scheduled, template_execution
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Templates - stored reports that can be used as base for scheduled reports
export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content"), // JSON content with slides and configuration
  category: varchar("category", { length: 100 }).default('presentation'),
  tags: varchar("tags", { length: 255 }).array(),
  slideIds: uuid("slide_ids").array(),
  previewImageUrl: text("preview_image_url"), // Thumbnail for template selection
  editableS3Key: text("editable_s3_key"), // S3 key for editable report format
  pdfS3Key: text("pdf_s3_key"), // S3 key for PDF preview
  editableUrl: text("editable_url"), // S3 public URL for editable format
  pdfUrl: text("pdf_url"), // S3 public URL for PDF preview
  s3Key: text("s3_key"), // S3 key for template storage in /templates folder
  s3Url: text("s3_url"), // S3 public URL for template access
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }), // Last time synced to S3
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Scheduled Reports - instances of templates with scheduling configuration
export const scheduledReports = pgTable("scheduled_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").references(() => templates.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  cronExpression: varchar("cron_expression", { length: 100 }).notNull(),
  timezone: varchar("timezone", { length: 50 }).default('UTC'),
  status: varchar("status", { length: 20 }).default('active'), // active, paused
  // Removed email fields - scheduled reports are now pure data refresh jobs
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  nextRunAt: timestamp("next_run_at", { withTimezone: true }),
  lastGeneratedPdfUrl: text("last_generated_pdf_url"), // Latest generated report PDF
  lastGeneratedS3Key: text("last_generated_s3_key"), // S3 key for latest report
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

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;



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

export const updatePresentationSchema = createInsertSchema(presentations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();



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
export type UpdatePresentation = z.infer<typeof updatePresentationSchema>;
export type Presentation = typeof presentations.$inferSelect;

// Scheduler type exports
export type InsertScheduledReport = z.infer<typeof insertScheduledReportSchema>;
export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertSentEmail = z.infer<typeof insertSentEmailSchema>;
export type SentEmail = typeof sentEmails.$inferSelect;
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

// Sent Emails Log - track all sent emails
export const sentEmails = pgTable("sent_emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").references(() => emailTemplates.id, { onDelete: 'set null' }),
  presentationId: uuid("presentation_id").references(() => presentations.id, { onDelete: 'set null' }),
  scheduledReportId: uuid("scheduled_report_id").references(() => scheduledReports.id, { onDelete: 'set null' }),
  subject: text("subject").notNull(),
  recipients: jsonb("recipients").notNull(), // Array of email addresses
  ccRecipients: jsonb("cc_recipients").default('[]'),
  bccRecipients: jsonb("bcc_recipients").default('[]'),
  emailType: varchar("email_type", { length: 50 }).notNull(), // 'one_time', 'scheduled'
  status: varchar("status", { length: 20 }).default('sent'), // 'sent', 'failed', 'pending'
  pdfDownloadUrl: text("pdf_download_url"), // S3 URL for PDF download
  emailHtml: text("email_html"), // Complete HTML content sent
  emailText: text("email_text"), // Plain text version
  messageId: text("message_id"), // Email service message ID
  errorMessage: text("error_message"), // Error details if failed
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  sentBy: uuid("sent_by").references(() => team.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  // Additional fields that exist in the database
  reportName: varchar("report_name", { length: 255 }),
  emailSubject: varchar("email_subject", { length: 500 }),
  emailTemplateId: uuid("email_template_id"),
  emailTemplateName: varchar("email_template_name", { length: 255 }),
  deliveryStatus: varchar("delivery_status", { length: 50 }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  emailContent: text("email_content"),
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

export const updateScheduledReportSchema = createInsertSchema(scheduledReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  templateId: true,
}).partial();

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSentEmailSchema = createInsertSchema(sentEmails).omit({
  id: true,
  createdAt: true,
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

// Endpoint monitoring schemas
export const insertMonitoredEndpointSchema = createInsertSchema(monitoredEndpoints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateMonitoredEndpointSchema = createInsertSchema(monitoredEndpoints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertEndpointMonitoringHistorySchema = createInsertSchema(endpointMonitoringHistory).omit({
  id: true,
  checkedAt: true,
});

// Endpoint monitoring types
export type InsertMonitoredEndpoint = z.infer<typeof insertMonitoredEndpointSchema>;
export type UpdateMonitoredEndpoint = z.infer<typeof updateMonitoredEndpointSchema>;
export type MonitoredEndpoint = typeof monitoredEndpoints.$inferSelect;
export type InsertEndpointMonitoringHistory = z.infer<typeof insertEndpointMonitoringHistorySchema>;
export type EndpointMonitoringHistory = typeof endpointMonitoringHistory.$inferSelect;
