CREATE TABLE `search_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`keywords` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE VIRTUAL TABLE `search_documents_fts` USING fts5(
	`doc_id` UNINDEXED,
	`tenant_id` UNINDEXED,
	`entity_type` UNINDEXED,
	`entity_id` UNINDEXED,
	`title`,
	`body`,
	`keywords`
);
