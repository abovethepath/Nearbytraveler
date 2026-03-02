-- Travel Crew: companions, members, invites, and messages
-- Idempotent (safe to run if some tables already exist).

CREATE TABLE IF NOT EXISTS "companions" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_user_id" integer NOT NULL,
	"label" text NOT NULL,
	"age_bracket" text,
	"notes_private" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "companions"
		ADD CONSTRAINT "companions_owner_user_id_users_id_fk"
		FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id")
		ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_companions_owner_user" ON "companions" ("owner_user_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "travel_crew_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"travel_plan_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text DEFAULT 'member',
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "travel_crew_members"
		ADD CONSTRAINT "travel_crew_members_travel_plan_id_travel_plans_id_fk"
		FOREIGN KEY ("travel_plan_id") REFERENCES "public"."travel_plans"("id")
		ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "travel_crew_members"
		ADD CONSTRAINT "travel_crew_members_user_id_users_id_fk"
		FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
		ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_crew_members_plan_user" ON "travel_crew_members" ("travel_plan_id", "user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_crew_members_travel_plan" ON "travel_crew_members" ("travel_plan_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "travel_crew_companions" (
	"id" serial PRIMARY KEY NOT NULL,
	"travel_plan_id" integer NOT NULL,
	"companion_id" integer NOT NULL,
	"added_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "travel_crew_companions"
		ADD CONSTRAINT "travel_crew_companions_travel_plan_id_travel_plans_id_fk"
		FOREIGN KEY ("travel_plan_id") REFERENCES "public"."travel_plans"("id")
		ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "travel_crew_companions"
		ADD CONSTRAINT "travel_crew_companions_companion_id_companions_id_fk"
		FOREIGN KEY ("companion_id") REFERENCES "public"."companions"("id")
		ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_crew_companions_plan_companion" ON "travel_crew_companions" ("travel_plan_id", "companion_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "travel_crew_invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"travel_plan_id" integer NOT NULL,
	"invited_by_user_id" integer NOT NULL,
	"invite_token" text NOT NULL,
	"invited_contact" text,
	"status" text DEFAULT 'pending',
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "travel_crew_invites"
		ADD CONSTRAINT "travel_crew_invites_travel_plan_id_travel_plans_id_fk"
		FOREIGN KEY ("travel_plan_id") REFERENCES "public"."travel_plans"("id")
		ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "travel_crew_invites"
		ADD CONSTRAINT "travel_crew_invites_invited_by_user_id_users_id_fk"
		FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id")
		ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_crew_invites_token" ON "travel_crew_invites" ("invite_token");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_crew_invites_travel_plan" ON "travel_crew_invites" ("travel_plan_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "travel_crew_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"travel_plan_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "travel_crew_messages"
		ADD CONSTRAINT "travel_crew_messages_travel_plan_id_travel_plans_id_fk"
		FOREIGN KEY ("travel_plan_id") REFERENCES "public"."travel_plans"("id")
		ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "travel_crew_messages"
		ADD CONSTRAINT "travel_crew_messages_sender_id_users_id_fk"
		FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id")
		ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_crew_messages_travel_plan" ON "travel_crew_messages" ("travel_plan_id");

