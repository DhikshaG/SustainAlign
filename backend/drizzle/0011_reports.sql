CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`corporate_tenant_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`file_id` text,
	`metadata_json` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`corporate_tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `reports_corporate_idx` ON `reports` (`corporate_tenant_id`);
