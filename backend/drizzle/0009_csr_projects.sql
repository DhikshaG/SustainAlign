CREATE TABLE `csr_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`corporate_tenant_id` text NOT NULL,
	`ngo_tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`schedule_vii` text NOT NULL,
	`theme` text,
	`location` text,
	`status` text DEFAULT 'pending_approval' NOT NULL,
	`budget_inr` integer NOT NULL,
	`spent_inr` integer DEFAULT 0 NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`corporate_tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ngo_tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `csr_projects_corporate_idx` ON `csr_projects` (`corporate_tenant_id`);
--> statement-breakpoint
CREATE INDEX `csr_projects_ngo_idx` ON `csr_projects` (`ngo_tenant_id`);
--> statement-breakpoint
CREATE INDEX `csr_projects_status_idx` ON `csr_projects` (`status`);
--> statement-breakpoint
CREATE TABLE `project_milestones` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`due_date` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `csr_projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_milestones_project_idx` ON `project_milestones` (`project_id`);
--> statement-breakpoint
CREATE TABLE `project_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`author_user_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `csr_projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `project_updates_project_idx` ON `project_updates` (`project_id`);
