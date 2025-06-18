CREATE TABLE "airflow_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"airflow_base_url" text NOT NULL,
	"airflow_username" varchar(255),
	"airflow_password" text,
	"auth_type" varchar(50) DEFAULT 'basic',
	"api_key" text,
	"default_dag_prefix" varchar(100) DEFAULT 'report_scheduler',
	"is_active" boolean DEFAULT true,
	"connection_status" varchar(50) DEFAULT 'disconnected',
	"last_connection_test" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"job_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"user_adv_id" integer NOT NULL,
	"recommendation" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"cohort_id" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
	"schedule" text DEFAULT 'now' NOT NULL,
	"scheduled_date" timestamp with time zone,
	"upsell_items" jsonb NOT NULL,
	"messages_sent" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "cohorts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"conditions" jsonb NOT NULL,
	"user_count" integer DEFAULT 0,
	"status" text DEFAULT 'draft' NOT NULL,
	"sync_status" text DEFAULT 'not_synced' NOT NULL,
	"calculation_query" text,
	"last_calculated_at" timestamp with time zone,
	"calculation_error" text,
	"auto_refresh" boolean DEFAULT true,
	"refresh_frequency_hours" integer DEFAULT 24,
	"next_refresh_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone,
	"amplitude_cohort_id" varchar(255),
	"braze_last_synced_at" timestamp with time zone,
	"braze_segment_id" varchar(255),
	"braze_sync_status" text DEFAULT 'not_synced' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "cohorts_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "dashboard_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"layout_config" jsonb NOT NULL,
	"is_default_for_team_role" text,
	"is_template" boolean DEFAULT false,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dashboard_tile_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tile_id" varchar(255) NOT NULL,
	"dashboard_id" uuid,
	"type" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"x" integer DEFAULT 0 NOT NULL,
	"y" integer DEFAULT 0 NOT NULL,
	"width" integer DEFAULT 4 NOT NULL,
	"height" integer DEFAULT 3 NOT NULL,
	"icon" varchar(50),
	"data_source" jsonb NOT NULL,
	"refresh_config" jsonb NOT NULL,
	"last_refresh_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dashboard_tiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tile_type" text NOT NULL,
	"default_title" varchar(255) NOT NULL,
	"default_data_source_config" jsonb NOT NULL,
	"default_visualization_config" jsonb DEFAULT '{}',
	"description" text,
	"is_publicly_available" boolean DEFAULT true,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"template_type" varchar(50) NOT NULL,
	"subject" text NOT NULL,
	"body_html" text NOT NULL,
	"body_text" text,
	"available_placeholders" jsonb DEFAULT '[]',
	"is_system_template" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "environment_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"environment_id" varchar(100) NOT NULL,
	"environment_name" varchar(100) NOT NULL,
	"integration_type" varchar(50) NOT NULL,
	"integration_id" uuid,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'disconnected' NOT NULL,
	"credentials" jsonb DEFAULT '{}' NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"last_used_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mailing_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"emails" jsonb DEFAULT '[]' NOT NULL,
	"tags" jsonb DEFAULT '[]',
	"is_active" boolean DEFAULT true,
	"subscriber_count" integer DEFAULT 0,
	"last_used" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "migration_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"source_integration_id" uuid,
	"target_integration_id" uuid,
	"source_integration_name" varchar(255),
	"target_integration_name" varchar(255),
	"migration_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'running' NOT NULL,
	"progress" integer DEFAULT 0,
	"total_items" integer DEFAULT 0,
	"completed_items" integer DEFAULT 0,
	"start_time" timestamp with time zone DEFAULT now(),
	"end_time" timestamp with time zone,
	"duration" integer,
	"logs" jsonb DEFAULT '[]',
	"metadata" jsonb DEFAULT '{}',
	"error_message" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"resource" varchar(50) NOT NULL,
	"action" varchar(50) NOT NULL,
	"is_system_permission" boolean DEFAULT false,
	"requires_elevation" boolean DEFAULT false,
	"dependencies" jsonb DEFAULT '[]',
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "presentations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"slide_ids" uuid[],
	"preview_image_id" uuid,
	"preview_image_url" text,
	"last_refreshed" timestamp with time zone,
	"created_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "report_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheduled_report_id" uuid NOT NULL,
	"execution_status" varchar(50) NOT NULL,
	"started_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"execution_duration" integer,
	"recipient_count" integer DEFAULT 0,
	"successful_deliveries" integer DEFAULT 0,
	"failed_deliveries" integer DEFAULT 0,
	"error_message" text,
	"airflow_run_id" varchar(255),
	"airflow_task_instance_id" varchar(255),
	"execution_metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"granted" boolean DEFAULT true,
	"conditions" jsonb DEFAULT '{}',
	"expires_at" timestamp with time zone,
	"granted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(7) DEFAULT '#3B82F6',
	"is_system_role" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"permissions" jsonb DEFAULT '{}' NOT NULL,
	"hierarchy_level" integer DEFAULT 0,
	"can_manage_roles" boolean DEFAULT false,
	"max_team_members" integer,
	"allowed_features" jsonb DEFAULT '[]',
	"restrictions" jsonb DEFAULT '{}',
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "scheduled_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"presentation_id" uuid NOT NULL,
	"cron_expression" varchar(100) NOT NULL,
	"timezone" varchar(50) DEFAULT 'UTC',
	"email_subject" text NOT NULL,
	"email_body" text NOT NULL,
	"recipient_list" jsonb DEFAULT '[]' NOT NULL,
	"cc_list" jsonb DEFAULT '[]',
	"bcc_list" jsonb DEFAULT '[]',
	"is_active" boolean DEFAULT true,
	"last_executed" timestamp with time zone,
	"last_execution_at" timestamp with time zone,
	"next_execution" timestamp with time zone,
	"execution_count" integer DEFAULT 0,
	"success_count" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"last_error" text,
	"airflow_dag_id" varchar(255),
	"airflow_task_id" varchar(255),
	"airflow_configuration" jsonb DEFAULT '{}',
	"pdf_delivery_url" text,
	"placeholder_config" jsonb DEFAULT '{}',
	"format_settings" jsonb DEFAULT '{}',
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"segment_type" text NOT NULL,
	"conditions" jsonb,
	"color" varchar(7) DEFAULT '#3B82F6',
	"is_active" boolean DEFAULT true,
	"auto_assign" boolean DEFAULT false,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "segments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "slides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"elements" jsonb DEFAULT '[]' NOT NULL,
	"background_image" uuid,
	"background_color" varchar(7) DEFAULT '#ffffff',
	"order" integer DEFAULT 0 NOT NULL,
	"created_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"role" text DEFAULT 'analyst' NOT NULL,
	"permissions" jsonb DEFAULT '{}',
	"temporary_password" varchar(255),
	"must_change_password" boolean DEFAULT true,
	"last_login_at" timestamp with time zone,
	"failed_login_attempts" integer DEFAULT 0,
	"locked_until" timestamp with time zone,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "team_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "uploaded_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size" integer NOT NULL,
	"url" text NOT NULL,
	"uploaded_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "airflow_configurations" ADD CONSTRAINT "airflow_configurations_created_by_team_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_jobs" ADD CONSTRAINT "campaign_jobs_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_team_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_created_by_team_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_configurations" ADD CONSTRAINT "dashboard_configurations_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_configurations" ADD CONSTRAINT "dashboard_configurations_created_by_team_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_tile_instances" ADD CONSTRAINT "dashboard_tile_instances_dashboard_id_dashboard_configurations_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboard_configurations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_tile_instances" ADD CONSTRAINT "dashboard_tile_instances_created_by_team_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_tiles" ADD CONSTRAINT "dashboard_tiles_created_by_team_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_created_by_team_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environment_configurations" ADD CONSTRAINT "environment_configurations_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mailing_lists" ADD CONSTRAINT "mailing_lists_created_by_team_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "migration_history" ADD CONSTRAINT "migration_history_source_integration_id_integrations_id_fk" FOREIGN KEY ("source_integration_id") REFERENCES "public"."integrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "migration_history" ADD CONSTRAINT "migration_history_target_integration_id_integrations_id_fk" FOREIGN KEY ("target_integration_id") REFERENCES "public"."integrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "migration_history" ADD CONSTRAINT "migration_history_created_by_team_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentations" ADD CONSTRAINT "presentations_preview_image_id_uploaded_images_id_fk" FOREIGN KEY ("preview_image_id") REFERENCES "public"."uploaded_images"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_executions" ADD CONSTRAINT "report_executions_scheduled_report_id_scheduled_reports_id_fk" FOREIGN KEY ("scheduled_report_id") REFERENCES "public"."scheduled_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_granted_by_team_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_created_by_team_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_presentation_id_presentations_id_fk" FOREIGN KEY ("presentation_id") REFERENCES "public"."presentations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_created_by_team_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segments" ADD CONSTRAINT "segments_created_by_team_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slides" ADD CONSTRAINT "slides_background_image_uploaded_images_id_fk" FOREIGN KEY ("background_image") REFERENCES "public"."uploaded_images"("id") ON DELETE no action ON UPDATE no action;