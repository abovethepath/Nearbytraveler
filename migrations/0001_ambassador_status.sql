-- Ambassador program: status, activity window, and admin override
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ambassador_status" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ambassador_enrolled_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ambassador_last_earned_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ambassador_period_start_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ambassador_points_in_period" integer DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ambassador_status_set_by_admin" boolean DEFAULT false;
