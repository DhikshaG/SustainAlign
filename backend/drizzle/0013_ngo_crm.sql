ALTER TABLE `csr_projects` ADD `ngo_partnership_status` text;
--> statement-breakpoint
ALTER TABLE `csr_projects` ADD `ngo_responded_at` integer;
--> statement-breakpoint
ALTER TABLE `csr_projects` ADD `ngo_response_note` text;
--> statement-breakpoint
ALTER TABLE `project_milestones` ADD `review_status` text DEFAULT 'none' NOT NULL;
--> statement-breakpoint
CREATE TABLE `message_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`corporate_tenant_id` text NOT NULL,
	`ngo_tenant_id` text NOT NULL,
	`project_id` text,
	`subject` text NOT NULL,
	`last_message_at` integer NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`corporate_tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ngo_tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `csr_projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `message_threads_corporate_idx` ON `message_threads` (`corporate_tenant_id`);
--> statement-breakpoint
CREATE INDEX `message_threads_ngo_idx` ON `message_threads` (`ngo_tenant_id`);
--> statement-breakpoint
CREATE INDEX `message_threads_project_idx` ON `message_threads` (`project_id`);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`sender_user_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `message_threads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `messages_thread_idx` ON `messages` (`thread_id`);
--> statement-breakpoint
CREATE TABLE `project_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`assignee_side` text NOT NULL,
	`assignee_user_id` text,
	`status` text DEFAULT 'open' NOT NULL,
	`due_date` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `csr_projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignee_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `project_tasks_project_idx` ON `project_tasks` (`project_id`);
