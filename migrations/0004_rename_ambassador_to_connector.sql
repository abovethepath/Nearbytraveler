-- Rename Ambassador program to Connector program
ALTER TABLE "users" RENAME COLUMN "ambassador_points" TO "connector_points";
ALTER TABLE "users" RENAME COLUMN "ambassador_status" TO "connector_status";
ALTER TABLE "users" RENAME COLUMN "ambassador_enrolled_at" TO "connector_enrolled_at";
ALTER TABLE "users" RENAME COLUMN "ambassador_last_earned_at" TO "connector_last_earned_at";
ALTER TABLE "users" RENAME COLUMN "ambassador_period_start_at" TO "connector_period_start_at";
ALTER TABLE "users" RENAME COLUMN "ambassador_points_in_period" TO "connector_points_in_period";
ALTER TABLE "users" RENAME COLUMN "ambassador_status_set_by_admin" TO "connector_status_set_by_admin";
ALTER TABLE "users" RENAME COLUMN "ambassador_bio" TO "connector_bio";
ALTER TABLE "users" RENAME COLUMN "ambassador_referral_count_override" TO "connector_referral_count_override";
ALTER TABLE "ambassador_referral_chains" RENAME TO "connector_referral_chains";
