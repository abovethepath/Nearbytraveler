-- Link community tags to a backing chatroom (optional).
-- Idempotent (safe to run multiple times).
ALTER TABLE "community_tags" ADD COLUMN IF NOT EXISTS "chatroom_id" integer;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "community_tags"
		ADD CONSTRAINT "community_tags_chatroom_id_city_chatrooms_id_fk"
		FOREIGN KEY ("chatroom_id") REFERENCES "public"."city_chatrooms"("id")
		ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_community_tags_chatroom_id" ON "community_tags" ("chatroom_id");
