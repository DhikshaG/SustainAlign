ALTER TABLE `files` ADD `checksum` text;
--> statement-breakpoint
ALTER TABLE `files` ADD `audit_path` text;
--> statement-breakpoint
ALTER TABLE `files` ADD `fiscal_year` text;
--> statement-breakpoint
ALTER TABLE `files` ADD `version` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
CREATE INDEX `files_audit_path_idx` ON `files` (`audit_path`);
--> statement-breakpoint
CREATE INDEX `files_fiscal_year_idx` ON `files` (`fiscal_year`);
--> statement-breakpoint
CREATE TABLE `file_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`file_id` text NOT NULL,
	`version` integer NOT NULL,
	`storage_key` text NOT NULL,
	`checksum` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`change_note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `file_versions_file_id_idx` ON `file_versions` (`file_id`);
--> statement-breakpoint
CREATE TRIGGER `activity_logs_no_update` BEFORE UPDATE ON `activity_logs`
BEGIN
  SELECT RAISE(ABORT, 'activity_logs are immutable');
END;
--> statement-breakpoint
CREATE TRIGGER `activity_logs_no_delete` BEFORE DELETE ON `activity_logs`
BEGIN
  SELECT RAISE(ABORT, 'activity_logs are immutable');
END;
--> statement-breakpoint
CREATE TRIGGER `workflow_events_no_update` BEFORE UPDATE ON `workflow_events`
BEGIN
  SELECT RAISE(ABORT, 'workflow_events are immutable');
END;
--> statement-breakpoint
CREATE TRIGGER `workflow_events_no_delete` BEFORE DELETE ON `workflow_events`
BEGIN
  SELECT RAISE(ABORT, 'workflow_events are immutable');
END;
