ALTER TABLE `ngo_profiles` ADD COLUMN `pan` text;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `csr1_number` text;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `website` text;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `phone` text;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `email` text;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `description` text;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `states_served` text;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `districts_served` text;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `settlement_type` text;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `years_active` integer;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `beneficiaries_count` integer;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `annual_funding_inr` integer;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `team_size` integer;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `projects_count` integer;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `budget_range` text;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `org_size` text;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `primary_sector` text;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `region` text;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `financial_transparency_score` integer;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `risk_score` integer;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `rating` real;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `review_count` integer;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `ai_recommended` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `logo_file_id` text;
--> statement-breakpoint
ALTER TABLE `ngo_profiles` ADD COLUMN `updated_at` integer;
--> statement-breakpoint
CREATE TABLE `ngo_team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ngo_team_members_tenant_idx` ON `ngo_team_members` (`tenant_id`);
--> statement-breakpoint
CREATE TABLE `ngo_past_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`budget_label` text,
	`outcome` text,
	`completed_at` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ngo_past_projects_tenant_idx` ON `ngo_past_projects` (`tenant_id`);
--> statement-breakpoint
CREATE TABLE `ngo_impact_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`metric_key` text NOT NULL,
	`label` text NOT NULL,
	`value` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ngo_impact_metrics_tenant_key_idx` ON `ngo_impact_metrics` (`tenant_id`,`metric_key`);
--> statement-breakpoint
CREATE TABLE `ngo_impact_stories` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text,
	`published_at` text,
	`cover_file_id` text,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ngo_impact_stories_tenant_idx` ON `ngo_impact_stories` (`tenant_id`);
--> statement-breakpoint
CREATE TABLE `ngo_certifications` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`issued_at` text,
	`expires_at` text,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ngo_certifications_tenant_idx` ON `ngo_certifications` (`tenant_id`);
