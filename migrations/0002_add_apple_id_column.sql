-- Add Sign in with Apple column to users table.
-- Schema defines: appleId (apple_id). Required for Apple Sign In registration.
-- Run this if you see: column "apple_id" does not exist / registration failed

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "apple_id" text UNIQUE;
