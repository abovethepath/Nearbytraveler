-- Add "New to Town" columns to users table (used by signup and profile).
-- Schema defines: isNewToTown (is_new_to_town), newToTownUntil (new_to_town_until).
-- Run this migration if you see: column "new to town" / is_new_to_town / new_to_town_until does not exist

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_new_to_town" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "new_to_town_until" timestamp;
