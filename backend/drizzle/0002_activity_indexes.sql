ALTER TABLE `activity_logs` ADD `reason` text;
--> statement-breakpoint
CREATE INDEX `activity_logs_tenant_created_idx` ON `activity_logs` (`tenant_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `activity_logs_entity_idx` ON `activity_logs` (`entity_type`,`entity_id`);
--> statement-breakpoint
CREATE INDEX `activity_logs_user_created_idx` ON `activity_logs` (`user_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `activity_logs_action_idx` ON `activity_logs` (`action`);
