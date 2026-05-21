CREATE TABLE `corporate_csr_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`fy_label` text NOT NULL,
	`net_profit_inr` integer DEFAULT 0 NOT NULL,
	`turnover_inr` integer DEFAULT 0 NOT NULL,
	`net_worth_inr` integer DEFAULT 0 NOT NULL,
	`admin_cap_pct` real DEFAULT 5 NOT NULL,
	`local_area_target_pct` real DEFAULT 70 NOT NULL,
	`carry_forward_inr` integer DEFAULT 0 NOT NULL,
	`obligation_threshold_inr` integer DEFAULT 50000000 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `corporate_csr_profile_tenant_fy_idx` ON `corporate_csr_profile` (`tenant_id`, `fy_label`);
--> statement-breakpoint
CREATE TABLE `compliance_alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`level` text NOT NULL,
	`rule_key` text NOT NULL,
	`message` text NOT NULL,
	`due_date` text,
	`entity_type` text,
	`entity_id` text,
	`acknowledged_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `compliance_alerts_tenant_idx` ON `compliance_alerts` (`tenant_id`);
