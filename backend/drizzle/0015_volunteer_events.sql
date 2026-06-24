CREATE TABLE `volunteer_events` (
	`id` text PRIMARY KEY NOT NULL,
	`corporate_tenant_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`location` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`slots` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`hours_credit` real DEFAULT 4 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`corporate_tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `volunteer_events_tenant_starts_idx` ON `volunteer_events` (`corporate_tenant_id`,`starts_at`);
--> statement-breakpoint
CREATE TABLE `volunteer_signups` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'registered' NOT NULL,
	`registered_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `volunteer_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `volunteer_signups_event_user_idx` ON `volunteer_signups` (`event_id`,`user_id`);
--> statement-breakpoint
CREATE INDEX `volunteer_signups_user_idx` ON `volunteer_signups` (`user_id`);
--> statement-breakpoint
CREATE TABLE `volunteer_attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`signup_id` text NOT NULL,
	`check_in_at` integer NOT NULL,
	`check_out_at` integer,
	`method` text DEFAULT 'qr' NOT NULL,
	`recorded_by` text,
	FOREIGN KEY (`signup_id`) REFERENCES `volunteer_signups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `volunteer_attendance_signup_idx` ON `volunteer_attendance` (`signup_id`);
--> statement-breakpoint
CREATE TABLE `volunteer_qr_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	FOREIGN KEY (`event_id`) REFERENCES `volunteer_events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `volunteer_qr_tokens_token_idx` ON `volunteer_qr_tokens` (`token`);
--> statement-breakpoint
CREATE INDEX `volunteer_qr_tokens_event_idx` ON `volunteer_qr_tokens` (`event_id`);
--> statement-breakpoint
CREATE TABLE `volunteer_certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`signup_id` text NOT NULL,
	`file_id` text NOT NULL,
	`issued_at` integer NOT NULL,
	`hours_credited` real NOT NULL,
	FOREIGN KEY (`signup_id`) REFERENCES `volunteer_signups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `volunteer_certificates_signup_idx` ON `volunteer_certificates` (`signup_id`);
