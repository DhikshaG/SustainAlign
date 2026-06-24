CREATE TABLE `vector_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`chunk_index` integer NOT NULL,
	`text` text NOT NULL,
	`embedding` text NOT NULL,
	`metadata` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `vector_documents_entity_idx` ON `vector_documents` (`entity_type`,`entity_id`);
