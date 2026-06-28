CREATE TABLE "activity_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text,
	"user_id" text,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"metadata" text,
	"previous_value" text,
	"reason" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"level" text NOT NULL,
	"rule_key" text NOT NULL,
	"message" text NOT NULL,
	"due_date" text,
	"entity_type" text,
	"entity_id" text,
	"acknowledged_at" timestamp,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporate_csr_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"fy_label" text NOT NULL,
	"net_profit_inr" integer DEFAULT 0 NOT NULL,
	"turnover_inr" integer DEFAULT 0 NOT NULL,
	"net_worth_inr" integer DEFAULT 0 NOT NULL,
	"admin_cap_pct" double precision DEFAULT 5 NOT NULL,
	"local_area_target_pct" double precision DEFAULT 70 NOT NULL,
	"carry_forward_inr" integer DEFAULT 0 NOT NULL,
	"obligation_threshold_inr" integer DEFAULT 50000000 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporate_ngo_inquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"corporate_tenant_id" text NOT NULL,
	"ngo_tenant_id" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporate_ngo_saves" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ngo_tenant_id" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "csr_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"corporate_tenant_id" text NOT NULL,
	"ngo_tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"schedule_vii" text NOT NULL,
	"theme" text,
	"location" text,
	"state" text,
	"status" text DEFAULT 'pending_approval' NOT NULL,
	"budget_inr" integer NOT NULL,
	"spent_inr" integer DEFAULT 0 NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"ngo_partnership_status" text,
	"ngo_responded_at" timestamp,
	"ngo_response_note" text,
	"created_by" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"tenant_id" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"file_id" text NOT NULL,
	"version" integer NOT NULL,
	"storage_key" text NOT NULL,
	"checksum" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"change_note" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"category" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"storage_key" text NOT NULL,
	"original_name" text NOT NULL,
	"mime" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"checksum" text,
	"audit_path" text,
	"fiscal_year" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by" text,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_threads" (
	"id" text PRIMARY KEY NOT NULL,
	"corporate_tenant_id" text NOT NULL,
	"ngo_tenant_id" text NOT NULL,
	"project_id" text,
	"subject" text NOT NULL,
	"last_message_at" timestamp NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"sender_user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mfa_challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ngo_certifications" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"issued_at" text,
	"expires_at" text,
	"status" text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ngo_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"doc_type" text NOT NULL,
	"file_path" text NOT NULL,
	"original_name" text NOT NULL,
	"mime" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ngo_impact_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"metric_key" text NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ngo_impact_stories" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"published_at" text,
	"cover_file_id" text
);
--> statement-breakpoint
CREATE TABLE "ngo_past_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"budget_label" text,
	"outcome" text,
	"completed_at" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ngo_profiles" (
	"tenant_id" text PRIMARY KEY NOT NULL,
	"registration_number" text NOT NULL,
	"sectors" text NOT NULL,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"contact_person" text,
	"pan" text,
	"csr1_number" text,
	"website" text,
	"phone" text,
	"email" text,
	"description" text,
	"states_served" text,
	"districts_served" text,
	"settlement_type" text,
	"years_active" integer,
	"beneficiaries_count" integer,
	"annual_funding_inr" integer,
	"team_size" integer,
	"projects_count" integer,
	"budget_range" text,
	"org_size" text,
	"primary_sector" text,
	"region" text,
	"financial_transparency_score" integer,
	"risk_score" integer,
	"rating" double precision,
	"review_count" integer,
	"ai_recommended" boolean DEFAULT false NOT NULL,
	"logo_file_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ngo_team_members" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"link" text,
	"read_at" timestamp,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_beneficiary_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"direct_count" integer DEFAULT 0 NOT NULL,
	"indirect_count" integer DEFAULT 0 NOT NULL,
	"note" text,
	"recorded_at" timestamp NOT NULL,
	"recorded_by" text
);
--> statement-breakpoint
CREATE TABLE "project_geo_updates" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"state" text NOT NULL,
	"district" text,
	"lat" double precision,
	"lng" double precision,
	"note" text,
	"effective_date" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_kpis" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"metric_key" text NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"unit" text,
	"recorded_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_milestones" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"due_date" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"review_status" text DEFAULT 'none' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"assignee_side" text NOT NULL,
	"assignee_user_id" text,
	"status" text DEFAULT 'open' NOT NULL,
	"due_date" text,
	"created_by" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_update_files" (
	"id" text PRIMARY KEY NOT NULL,
	"update_id" text NOT NULL,
	"file_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_updates" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"jti" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"replaced_by_jti" text,
	"user_agent" text,
	"ip_address" text,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "refresh_tokens_jti_unique" UNIQUE("jti")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"corporate_tenant_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"period_start" text NOT NULL,
	"period_end" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"file_id" text,
	"metadata_json" text,
	"created_by" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"keywords" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "tag_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text,
	"tenant_type" text NOT NULL,
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vector_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"text" text NOT NULL,
	"embedding" text NOT NULL,
	"metadata" text,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volunteer_attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"signup_id" text NOT NULL,
	"check_in_at" timestamp NOT NULL,
	"check_out_at" timestamp,
	"method" text DEFAULT 'qr' NOT NULL,
	"recorded_by" text
);
--> statement-breakpoint
CREATE TABLE "volunteer_certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"signup_id" text NOT NULL,
	"file_id" text NOT NULL,
	"issued_at" timestamp NOT NULL,
	"hours_credited" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volunteer_events" (
	"id" text PRIMARY KEY NOT NULL,
	"corporate_tenant_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"slots" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"hours_credit" double precision DEFAULT 4 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volunteer_qr_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "volunteer_signups" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'registered' NOT NULL,
	"registered_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_definitions" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"steps" text NOT NULL,
	CONSTRAINT "workflow_definitions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "workflow_events" (
	"id" text PRIMARY KEY NOT NULL,
	"instance_id" text NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"step_index" integer,
	"actor_user_id" text,
	"comment" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_instances" (
	"id" text PRIMARY KEY NOT NULL,
	"definition_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"current_step_index" integer DEFAULT 0 NOT NULL,
	"submitted_by" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_alerts" ADD CONSTRAINT "compliance_alerts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_csr_profile" ADD CONSTRAINT "corporate_csr_profile_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_ngo_inquiries" ADD CONSTRAINT "corporate_ngo_inquiries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_ngo_inquiries" ADD CONSTRAINT "corporate_ngo_inquiries_corporate_tenant_id_tenants_id_fk" FOREIGN KEY ("corporate_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_ngo_inquiries" ADD CONSTRAINT "corporate_ngo_inquiries_ngo_tenant_id_tenants_id_fk" FOREIGN KEY ("ngo_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_ngo_saves" ADD CONSTRAINT "corporate_ngo_saves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_ngo_saves" ADD CONSTRAINT "corporate_ngo_saves_ngo_tenant_id_tenants_id_fk" FOREIGN KEY ("ngo_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csr_projects" ADD CONSTRAINT "csr_projects_corporate_tenant_id_tenants_id_fk" FOREIGN KEY ("corporate_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csr_projects" ADD CONSTRAINT "csr_projects_ngo_tenant_id_tenants_id_fk" FOREIGN KEY ("ngo_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csr_projects" ADD CONSTRAINT "csr_projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_tags" ADD CONSTRAINT "entity_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_tags" ADD CONSTRAINT "entity_tags_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_versions" ADD CONSTRAINT "file_versions_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_versions" ADD CONSTRAINT "file_versions_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_corporate_tenant_id_tenants_id_fk" FOREIGN KEY ("corporate_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_ngo_tenant_id_tenants_id_fk" FOREIGN KEY ("ngo_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_project_id_csr_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."csr_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_message_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."message_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mfa_challenges" ADD CONSTRAINT "mfa_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ngo_certifications" ADD CONSTRAINT "ngo_certifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ngo_documents" ADD CONSTRAINT "ngo_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ngo_impact_metrics" ADD CONSTRAINT "ngo_impact_metrics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ngo_impact_stories" ADD CONSTRAINT "ngo_impact_stories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ngo_past_projects" ADD CONSTRAINT "ngo_past_projects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ngo_profiles" ADD CONSTRAINT "ngo_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ngo_team_members" ADD CONSTRAINT "ngo_team_members_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_beneficiary_logs" ADD CONSTRAINT "project_beneficiary_logs_project_id_csr_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."csr_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_beneficiary_logs" ADD CONSTRAINT "project_beneficiary_logs_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_geo_updates" ADD CONSTRAINT "project_geo_updates_project_id_csr_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."csr_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_kpis" ADD CONSTRAINT "project_kpis_project_id_csr_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."csr_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_project_id_csr_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."csr_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_csr_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."csr_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assignee_user_id_users_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_update_files" ADD CONSTRAINT "project_update_files_update_id_project_updates_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."project_updates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_update_files" ADD CONSTRAINT "project_update_files_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_project_id_csr_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."csr_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_corporate_tenant_id_tenants_id_fk" FOREIGN KEY ("corporate_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_category_id_tag_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."tag_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_attendance" ADD CONSTRAINT "volunteer_attendance_signup_id_volunteer_signups_id_fk" FOREIGN KEY ("signup_id") REFERENCES "public"."volunteer_signups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_attendance" ADD CONSTRAINT "volunteer_attendance_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_certificates" ADD CONSTRAINT "volunteer_certificates_signup_id_volunteer_signups_id_fk" FOREIGN KEY ("signup_id") REFERENCES "public"."volunteer_signups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_certificates" ADD CONSTRAINT "volunteer_certificates_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_events" ADD CONSTRAINT "volunteer_events_corporate_tenant_id_tenants_id_fk" FOREIGN KEY ("corporate_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_events" ADD CONSTRAINT "volunteer_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_qr_tokens" ADD CONSTRAINT "volunteer_qr_tokens_event_id_volunteer_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."volunteer_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_signups" ADD CONSTRAINT "volunteer_signups_event_id_volunteer_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."volunteer_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_signups" ADD CONSTRAINT "volunteer_signups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_events" ADD CONSTRAINT "workflow_events_instance_id_workflow_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."workflow_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_events" ADD CONSTRAINT "workflow_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_definition_id_workflow_definitions_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."workflow_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "compliance_alerts_tenant_idx" ON "compliance_alerts" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "corporate_csr_profile_tenant_fy_idx" ON "corporate_csr_profile" USING btree ("tenant_id","fy_label");--> statement-breakpoint
CREATE UNIQUE INDEX "corporate_ngo_saves_user_ngo_idx" ON "corporate_ngo_saves" USING btree ("user_id","ngo_tenant_id");--> statement-breakpoint
CREATE INDEX "csr_projects_corporate_idx" ON "csr_projects" USING btree ("corporate_tenant_id");--> statement-breakpoint
CREATE INDEX "csr_projects_ngo_idx" ON "csr_projects" USING btree ("ngo_tenant_id");--> statement-breakpoint
CREATE INDEX "csr_projects_status_idx" ON "csr_projects" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "entity_tags_unique_idx" ON "entity_tags" USING btree ("entity_type","entity_id","tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_user_tenant_idx" ON "memberships" USING btree ("user_id","tenant_id");--> statement-breakpoint
CREATE INDEX "message_threads_corporate_idx" ON "message_threads" USING btree ("corporate_tenant_id");--> statement-breakpoint
CREATE INDEX "message_threads_ngo_idx" ON "message_threads" USING btree ("ngo_tenant_id");--> statement-breakpoint
CREATE INDEX "message_threads_project_idx" ON "message_threads" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "messages_thread_idx" ON "messages" USING btree ("thread_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ngo_impact_metrics_tenant_key_idx" ON "ngo_impact_metrics" USING btree ("tenant_id","metric_key");--> statement-breakpoint
CREATE INDEX "project_beneficiary_logs_project_idx" ON "project_beneficiary_logs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_geo_updates_project_idx" ON "project_geo_updates" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_kpis_project_idx" ON "project_kpis" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_tasks_project_idx" ON "project_tasks" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_update_files_update_file_idx" ON "project_update_files" USING btree ("update_id","file_id");--> statement-breakpoint
CREATE INDEX "reports_corporate_idx" ON "reports" USING btree ("corporate_tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_category_slug_idx" ON "tags" USING btree ("category_id","slug");--> statement-breakpoint
CREATE INDEX "vector_documents_entity_idx" ON "vector_documents" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "volunteer_attendance_signup_idx" ON "volunteer_attendance" USING btree ("signup_id");--> statement-breakpoint
CREATE UNIQUE INDEX "volunteer_certificates_signup_idx" ON "volunteer_certificates" USING btree ("signup_id");--> statement-breakpoint
CREATE INDEX "volunteer_events_tenant_starts_idx" ON "volunteer_events" USING btree ("corporate_tenant_id","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "volunteer_qr_tokens_token_idx" ON "volunteer_qr_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "volunteer_qr_tokens_event_idx" ON "volunteer_qr_tokens" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "volunteer_signups_event_user_idx" ON "volunteer_signups" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "volunteer_signups_user_idx" ON "volunteer_signups" USING btree ("user_id");