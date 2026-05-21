CREATE TABLE `workflow_definitions` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`steps` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workflow_definitions_slug_unique` ON `workflow_definitions` (`slug`);
--> statement-breakpoint
CREATE TABLE `workflow_instances` (
	`id` text PRIMARY KEY NOT NULL,
	`definition_id` text NOT NULL,
	`tenant_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`current_step_index` integer DEFAULT 0 NOT NULL,
	`submitted_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`definition_id`) REFERENCES `workflow_definitions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`submitted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workflow_events` (
	`id` text PRIMARY KEY NOT NULL,
	`instance_id` text NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`step_index` integer,
	`actor_user_id` text,
	`comment` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`instance_id`) REFERENCES `workflow_instances`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
