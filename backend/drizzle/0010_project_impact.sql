ALTER TABLE `csr_projects` ADD `state` text;
--> statement-breakpoint
CREATE TABLE `project_kpis` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`metric_key` text NOT NULL,
	`label` text NOT NULL,
	`value` text NOT NULL,
	`unit` text,
	`recorded_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `csr_projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_kpis_project_idx` ON `project_kpis` (`project_id`);
--> statement-breakpoint
CREATE TABLE `project_beneficiary_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`direct_count` integer DEFAULT 0 NOT NULL,
	`indirect_count` integer DEFAULT 0 NOT NULL,
	`note` text,
	`recorded_at` integer NOT NULL,
	`recorded_by` text,
	FOREIGN KEY (`project_id`) REFERENCES `csr_projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `project_beneficiary_logs_project_idx` ON `project_beneficiary_logs` (`project_id`);
--> statement-breakpoint
CREATE TABLE `project_geo_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`state` text NOT NULL,
	`district` text,
	`lat` real,
	`lng` real,
	`note` text,
	`effective_date` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `csr_projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_geo_updates_project_idx` ON `project_geo_updates` (`project_id`);
--> statement-breakpoint
CREATE TABLE `project_update_files` (
	`id` text PRIMARY KEY NOT NULL,
	`update_id` text NOT NULL,
	`file_id` text NOT NULL,
	FOREIGN KEY (`update_id`) REFERENCES `project_updates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_update_files_update_file_idx` ON `project_update_files` (`update_id`, `file_id`);
