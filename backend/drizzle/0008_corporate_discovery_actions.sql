CREATE TABLE `corporate_ngo_saves` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`ngo_tenant_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ngo_tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `corporate_ngo_saves_user_ngo_idx` ON `corporate_ngo_saves` (`user_id`,`ngo_tenant_id`);
--> statement-breakpoint
CREATE TABLE `corporate_ngo_inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`corporate_tenant_id` text NOT NULL,
	`ngo_tenant_id` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`corporate_tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ngo_tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `corporate_ngo_inquiries_ngo_idx` ON `corporate_ngo_inquiries` (`ngo_tenant_id`);
--> statement-breakpoint
CREATE INDEX `corporate_ngo_inquiries_user_idx` ON `corporate_ngo_inquiries` (`user_id`);
