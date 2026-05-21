CREATE TABLE `tag_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_categories_slug_unique` ON `tag_categories` (`slug`);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`slug` text NOT NULL,
	`label` text NOT NULL,
	`metadata` text,
	FOREIGN KEY (`category_id`) REFERENCES `tag_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_category_slug_idx` ON `tags` (`category_id`,`slug`);
--> statement-breakpoint
CREATE TABLE `entity_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`tag_id` text NOT NULL,
	`tenant_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entity_tags_unique_idx` ON `entity_tags` (`entity_type`,`entity_id`,`tag_id`);
