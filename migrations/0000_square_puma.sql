CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"achievement_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon_url" text,
	"badge_level" text NOT NULL,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"requirement" integer NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"is_unlocked" boolean DEFAULT false NOT NULL,
	"unlocked_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_id" text NOT NULL,
	"location" text NOT NULL,
	"user_message" text NOT NULL,
	"ai_response" text NOT NULL,
	"recommendations_generated" integer DEFAULT 0,
	"conversation_context" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"location" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"address" text,
	"latitude" real,
	"longitude" real,
	"opening_hours" text,
	"price_range" text,
	"rating" real,
	"tags" text[],
	"ai_confidence" real NOT NULL,
	"recommendation_reason" text NOT NULL,
	"user_preferences_matched" text[],
	"is_bookmarked" boolean DEFAULT false,
	"is_visited" boolean DEFAULT false,
	"user_rating" real,
	"user_notes" text,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"connected_user_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" text DEFAULT 'joined' NOT NULL,
	"role" text DEFAULT 'participant',
	"joined_at" timestamp DEFAULT now(),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"street" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zipcode" text NOT NULL,
	"location" text NOT NULL,
	"date" timestamp NOT NULL,
	"end_date" timestamp,
	"category" text NOT NULL,
	"image_url" text,
	"organizer_id" integer NOT NULL,
	"max_participants" integer,
	"is_active" boolean DEFAULT true,
	"is_public" boolean DEFAULT true,
	"tags" text[],
	"requirements" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mood_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"emoji" text NOT NULL,
	"mood_type" text NOT NULL,
	"rating" integer NOT NULL,
	"notes" text,
	"location" text,
	"activity_name" text,
	"event_id" integer,
	"travel_plan_id" integer,
	"entry_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"from_user_id" integer,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" text,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "passport_stamps" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"country" text NOT NULL,
	"city" text NOT NULL,
	"stamp_type" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon_url" text,
	"rarity" text DEFAULT 'common' NOT NULL,
	"points_value" integer DEFAULT 10 NOT NULL,
	"latitude" real,
	"longitude" real,
	"event_id" integer,
	"travel_plan_id" integer,
	"unlocked_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reference_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_id" integer NOT NULL,
	"responder_id" integer NOT NULL,
	"content" text NOT NULL,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_id" integer NOT NULL,
	"referred_user_id" integer,
	"referral_code" text NOT NULL,
	"referred_email" text,
	"referred_name" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"referral_source" text,
	"completed_at" timestamp,
	"reward_earned" boolean DEFAULT false,
	"reward_type" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "referrals_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "restaurant_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "restaurant_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "restaurant_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"content" text,
	"images" text[],
	"visit_date" timestamp,
	"price_rating" integer,
	"service_rating" integer,
	"food_rating" integer,
	"ambiance_rating" integer,
	"recommended_dishes" text[],
	"tags" text[],
	"is_verified_visit" boolean DEFAULT false,
	"helpful_votes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"cuisine" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"country" text NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"price_range" text,
	"phone" text,
	"website" text,
	"image_url" text,
	"opening_hours" text,
	"features" text[],
	"average_rating" real DEFAULT 0,
	"total_reviews" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"added_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "travel_memories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"destination" text NOT NULL,
	"photos" text[] NOT NULL,
	"description" text NOT NULL,
	"date" timestamp NOT NULL,
	"tags" text[],
	"city" text NOT NULL,
	"country" text NOT NULL,
	"latitude" real,
	"longitude" real,
	"likes" integer DEFAULT 0 NOT NULL,
	"comments" integer DEFAULT 0 NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "travel_memory_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"memory_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "travel_memory_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"memory_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "travel_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"destination" text NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"interests" text[],
	"activities" text[],
	"events" text[],
	"travel_style" text[],
	"status" text DEFAULT 'planned' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"image_data" text,
	"caption" text,
	"is_private" boolean DEFAULT false,
	"is_profile_photo" boolean DEFAULT false,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_references" (
	"id" serial PRIMARY KEY NOT NULL,
	"reviewer_id" integer NOT NULL,
	"reviewee_id" integer NOT NULL,
	"event_id" integer,
	"connection_id" integer,
	"would_meet_again" boolean NOT NULL,
	"reference_type" text NOT NULL,
	"content" text,
	"meeting_context" text,
	"is_public" boolean DEFAULT true,
	"is_verified" boolean DEFAULT false,
	"met_in_person" boolean DEFAULT false,
	"meeting_date" timestamp,
	"quick_tags" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_reputation" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"total_references" integer DEFAULT 0,
	"positive_references" integer DEFAULT 0,
	"negative_references" integer DEFAULT 0,
	"verified_meetings" integer DEFAULT 0,
	"meet_again_rate" real DEFAULT 0,
	"referrals_made" integer DEFAULT 0,
	"successful_referrals" integer DEFAULT 0,
	"reputation_level" text DEFAULT 'newcomer',
	"badges" text[],
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_reputation_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"total_stamps" integer DEFAULT 0 NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"countries_visited" integer DEFAULT 0 NOT NULL,
	"cities_visited" integer DEFAULT 0 NOT NULL,
	"events_attended" integer DEFAULT 0 NOT NULL,
	"connections_made" integer DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"experience_points" integer DEFAULT 0 NOT NULL,
	"last_activity_date" timestamp,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_travel_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"budget_preference" text NOT NULL,
	"travel_style" text[],
	"preferred_categories" text[],
	"disliked_categories" text[],
	"dietary_restrictions" text[],
	"mobility_needs" text[],
	"group_type" text,
	"time_preferences" text[],
	"language_preferences" text[],
	"avoid_crowds" boolean DEFAULT false,
	"local_interaction" boolean DEFAULT true,
	"sustainable_tourism" boolean DEFAULT false,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_travel_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"user_type" text NOT NULL,
	"bio" text,
	"location" text,
	"hometown_city" text,
	"hometown_state" text,
	"hometown_country" text,
	"profile_image" text,
	"interests" text[],
	"date_of_birth" timestamp,
	"age_visible" boolean DEFAULT true,
	"gender" text,
	"travel_destination" text,
	"travel_start_date" timestamp,
	"travel_end_date" timestamp,
	"travel_interests" text[],
	"preferred_activities" text[],
	"hometown" text,
	"local_expertise" text[],
	"local_activities" text[],
	"local_events" text[],
	"planned_events" text[],
	"countries_visited" text[],
	"languages_spoken" text[],
	"travel_style" text[],
	"cover_photo" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_travel_plan_id_travel_plans_id_fk" FOREIGN KEY ("travel_plan_id") REFERENCES "public"."travel_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passport_stamps" ADD CONSTRAINT "passport_stamps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passport_stamps" ADD CONSTRAINT "passport_stamps_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passport_stamps" ADD CONSTRAINT "passport_stamps_travel_plan_id_travel_plans_id_fk" FOREIGN KEY ("travel_plan_id") REFERENCES "public"."travel_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_reviews" ADD CONSTRAINT "restaurant_reviews_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_reviews" ADD CONSTRAINT "restaurant_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_memories" ADD CONSTRAINT "travel_memories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_memory_comments" ADD CONSTRAINT "travel_memory_comments_memory_id_travel_memories_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."travel_memories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_memory_comments" ADD CONSTRAINT "travel_memory_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_memory_likes" ADD CONSTRAINT "travel_memory_likes_memory_id_travel_memories_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."travel_memories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_memory_likes" ADD CONSTRAINT "travel_memory_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_travel_preferences" ADD CONSTRAINT "user_travel_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;