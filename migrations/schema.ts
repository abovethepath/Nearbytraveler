import { pgTable, foreignKey, serial, integer, text, timestamp, boolean, jsonb, real, unique, varchar, uniqueIndex, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const moodEntries = pgTable("mood_entries", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	emoji: text().notNull(),
	moodType: text("mood_type").notNull(),
	rating: integer().notNull(),
	notes: text(),
	location: text(),
	activityName: text("activity_name"),
	eventId: integer("event_id"),
	travelPlanId: integer("travel_plan_id"),
	entryDate: timestamp("entry_date", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "mood_entries_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "mood_entries_event_id_events_id_fk"
		}),
	foreignKey({
			columns: [table.travelPlanId],
			foreignColumns: [travelPlans.id],
			name: "mood_entries_travel_plan_id_travel_plans_id_fk"
		}),
]);

export const packingLists = pgTable("packing_lists", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	title: text().notNull(),
	destination: text(),
	startDate: timestamp("start_date", { mode: 'string' }),
	endDate: timestamp("end_date", { mode: 'string' }),
	tripType: text("trip_type"),
	weather: text(),
	privacy: text().default('private'),
	sharedWith: text("shared_with").array(),
	isShared: boolean("is_shared").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "packing_lists_user_id_users_id_fk"
		}),
]);

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	fromUserId: integer("from_user_id"),
	type: text().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	data: text(),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const messages = pgTable("messages", {
	id: serial().primaryKey().notNull(),
	senderId: integer("sender_id").notNull(),
	receiverId: integer("receiver_id"),
	chatroomId: integer("chatroom_id"),
	content: text().notNull(),
	messageType: text("message_type").default('text'),
	mediaUrl: text("media_url"),
	locationData: jsonb("location_data"),
	replyToId: integer("reply_to_id"),
	reactions: jsonb(),
	isEdited: boolean("is_edited").default(false),
	editedAt: timestamp("edited_at", { mode: 'string' }),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const packingListItems = pgTable("packing_list_items", {
	id: serial().primaryKey().notNull(),
	packingListId: integer("packing_list_id").notNull(),
	name: text().notNull(),
	category: text().notNull(),
	quantity: integer().default(1),
	isPacked: boolean("is_packed").default(false),
	priority: text().default('normal'),
	notes: text(),
	sortOrder: integer("sort_order").default(0),
	addedBy: integer("added_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.packingListId],
			foreignColumns: [packingLists.id],
			name: "packing_list_items_packing_list_id_packing_lists_id_fk"
		}),
	foreignKey({
			columns: [table.addedBy],
			foreignColumns: [users.id],
			name: "packing_list_items_added_by_users_id_fk"
		}),
]);

export const passportStamps = pgTable("passport_stamps", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	country: text().notNull(),
	city: text().notNull(),
	stampType: text("stamp_type").notNull(),
	category: text().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	iconUrl: text("icon_url"),
	rarity: text().default('common').notNull(),
	pointsValue: integer("points_value").default(10).notNull(),
	latitude: real(),
	longitude: real(),
	eventId: integer("event_id"),
	travelPlanId: integer("travel_plan_id"),
	unlockedAt: timestamp("unlocked_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "passport_stamps_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "passport_stamps_event_id_events_id_fk"
		}),
	foreignKey({
			columns: [table.travelPlanId],
			foreignColumns: [travelPlans.id],
			name: "passport_stamps_travel_plan_id_travel_plans_id_fk"
		}),
]);

export const moodBoards = pgTable("mood_boards", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	title: text().notNull(),
	description: text(),
	destination: text(),
	isPublic: boolean("is_public").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "mood_boards_user_id_users_id_fk"
		}),
]);

export const photoAlbums = pgTable("photo_albums", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	title: text().notNull(),
	description: text(),
	date: text().notNull(),
	location: text(),
	photos: text().array().notNull(),
	coverPhoto: text("cover_photo"),
	isPublic: boolean("is_public").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	startDate: timestamp("start_date", { mode: 'string' }),
	endDate: timestamp("end_date", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "photo_albums_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const proximityNotifications = pgTable("proximity_notifications", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	nearbyUserId: integer("nearby_user_id").notNull(),
	distance: real().notNull(),
	notificationSent: boolean("notification_sent").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	lastSeen: timestamp("last_seen", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "proximity_notifications_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.nearbyUserId],
			foreignColumns: [users.id],
			name: "proximity_notifications_nearby_user_id_users_id_fk"
		}),
]);

export const pricingTiers = pgTable("pricing_tiers", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	monthlyPriceCents: integer("monthly_price_cents").notNull(),
	signupFeeCents: integer("signup_fee_cents").default(0),
	description: text(),
	features: text().array(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("pricing_tiers_name_unique").on(table.name),
]);

export const quickMeetupParticipants = pgTable("quick_meetup_participants", {
	id: serial().primaryKey().notNull(),
	meetupId: integer("meetup_id").notNull(),
	userId: integer("user_id").notNull(),
	status: text().default('joined').notNull(),
	notes: text(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.meetupId],
			foreignColumns: [quickMeetups.id],
			name: "quick_meetup_participants_meetup_id_quick_meetups_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "quick_meetup_participants_user_id_users_id_fk"
		}),
	unique("quick_meetup_participants_meetup_id_user_id_unique").on(table.meetupId, table.userId),
]);

export const citychatrooms = pgTable("citychatrooms", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	city: varchar({ length: 100 }).notNull(),
	state: varchar({ length: 100 }),
	country: varchar({ length: 100 }).notNull(),
	createdById: integer("created_by_id"),
	isActive: boolean("is_active").default(true),
	isPublic: boolean("is_public").default(true),
	maxMembers: integer("max_members").default(500),
	tags: text().array().default([""]),
	rules: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "citychatrooms_created_by_id_fkey"
		}),
]);

export const chatroomMembers = pgTable("chatroom_members", {
	id: serial().primaryKey().notNull(),
	chatroomId: integer("chatroom_id"),
	userId: integer("user_id"),
	role: varchar({ length: 50 }).default('member'),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	lastReadAt: timestamp("last_read_at", { withTimezone: true, mode: 'string' }),
	isMuted: boolean("is_muted").default(false),
	isActive: boolean("is_active").default(true),
}, (table) => [
	uniqueIndex("chatroom_members_unique_membership").using("btree", table.chatroomId.asc().nullsLast().op("int4_ops"), table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "chatroom_members_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.chatroomId],
			foreignColumns: [cityChatrooms.id],
			name: "chatroom_members_chatroom_id_fkey"
		}).onDelete("cascade"),
	unique("chatroom_members_chatroom_id_user_id_key").on(table.chatroomId, table.userId),
	unique("chatroom_members_unique").on(table.chatroomId, table.userId),
]);

export const chatroomMessages = pgTable("chatroom_messages", {
	id: serial().primaryKey().notNull(),
	chatroomId: integer("chatroom_id"),
	senderId: integer("sender_id"),
	content: text().notNull(),
	messageType: varchar("message_type", { length: 50 }).default('text'),
	replyToId: integer("reply_to_id"),
	isEdited: boolean("is_edited").default(false),
	editedAt: timestamp("edited_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.chatroomId],
			foreignColumns: [citychatrooms.id],
			name: "chatroom_messages_chatroom_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "chatroom_messages_sender_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.replyToId],
			foreignColumns: [table.id],
			name: "chatroom_messages_reply_to_id_fkey"
		}),
]);

export const quickMeetupTemplates = pgTable("quick_meetup_templates", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	templateName: text("template_name").notNull(),
	category: text().notNull(),
	title: text().notNull(),
	description: text(),
	customCategory: text("custom_category"),
	maxParticipants: integer("max_participants").default(4),
	costEstimate: text("cost_estimate").default('Free'),
	defaultDuration: text("default_duration").default('1hour'),
	minParticipants: integer("min_participants").default(2),
	timesUsed: integer("times_used").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "quick_meetup_templates_user_id_users_id_fk"
		}),
]);

export const recommendations = pgTable("recommendations", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	type: text().notNull(),
	title: text().notNull(),
	description: text(),
	location: text().notNull(),
	city: text().notNull(),
	country: text().notNull(),
	category: text(),
	tags: text().array(),
	rating: real(),
	priceRange: text("price_range"),
	coordinates: jsonb(),
	imageUrl: text("image_url"),
	website: text(),
	openingHours: jsonb("opening_hours"),
	contactInfo: jsonb("contact_info"),
	bestTimeToVisit: text("best_time_to_visit"),
	duration: text(),
	accessibility: text().array(),
	localTips: text("local_tips"),
	crowdLevel: text("crowd_level"),
	isVerified: boolean("is_verified").default(false),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "recommendations_user_id_users_id_fk"
		}),
]);

export const references = pgTable("references", {
	id: serial().primaryKey().notNull(),
	fromUserId: integer("from_user_id").notNull(),
	toUserId: integer("to_user_id").notNull(),
	referenceType: text("reference_type").notNull(),
	category: text().notNull(),
	rating: integer().notNull(),
	title: text().notNull(),
	content: text().notNull(),
	isPublic: boolean("is_public").default(true),
	helpfulVotes: integer("helpful_votes").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.fromUserId],
			foreignColumns: [users.id],
			name: "references_from_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.toUserId],
			foreignColumns: [users.id],
			name: "references_to_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("references_from_user_id_to_user_id_category_unique").on(table.fromUserId, table.toUserId, table.category),
]);

export const referenceResponses = pgTable("reference_responses", {
	id: serial().primaryKey().notNull(),
	referenceId: integer("reference_id").notNull(),
	responderId: integer("responder_id").notNull(),
	content: text().notNull(),
	isPublic: boolean("is_public").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const referrals = pgTable("referrals", {
	id: serial().primaryKey().notNull(),
	referrerId: integer("referrer_id").notNull(),
	referredUserId: integer("referred_user_id"),
	referralCode: text("referral_code").notNull(),
	referredEmail: text("referred_email"),
	referredName: text("referred_name"),
	status: text().default('pending').notNull(),
	referralSource: text("referral_source"),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	rewardEarned: boolean("reward_earned").default(false),
	rewardType: text("reward_type"),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("referrals_referral_code_unique").on(table.referralCode),
]);

export const quickMeetups = pgTable("quick_meetups", {
	id: serial().primaryKey().notNull(),
	organizerId: integer("organizer_id").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	category: text().notNull(),
	location: text().notNull(),
	meetingPoint: text("meeting_point").notNull(),
	street: text(),
	city: text().notNull(),
	state: text(),
	country: text().notNull(),
	zipcode: text(),
	availableAt: timestamp("available_at", { mode: 'string' }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	maxParticipants: integer("max_participants").default(10).notNull(),
	minParticipants: integer("min_participants").default(2).notNull(),
	costEstimate: text("cost_estimate"),
	availability: text().notNull(),
	responseTime: text("response_time").default('ASAP').notNull(),
	autoCancel: boolean("auto_cancel").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	participantCount: integer("participant_count").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.organizerId],
			foreignColumns: [users.id],
			name: "quick_meetups_organizer_id_users_id_fk"
		}),
]);

export const recommendationRequests = pgTable("recommendation_requests", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	location: text().notNull(),
	categories: text().array(),
	preferences: jsonb(),
	travelDuration: text("travel_duration"),
	groupSize: integer("group_size").default(1),
	budget: text(),
	status: text().default('pending'),
	aiResponse: jsonb("ai_response"),
	personalizedScore: real("personalized_score"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "recommendation_requests_user_id_users_id_fk"
		}),
]);

export const aiConversations = pgTable("ai_conversations", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	sessionId: text("session_id").notNull(),
	location: text(),
	conversationType: text("conversation_type").notNull(),
	userMessage: text("user_message").notNull(),
	aiResponse: text("ai_response").notNull(),
	recommendationsGenerated: integer("recommendations_generated").array(),
	userFeedback: text("user_feedback"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "ai_conversations_user_id_users_id_fk"
		}),
]);

export const aiRecommendations = pgTable("ai_recommendations", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	location: text().notNull(),
	category: text().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	address: text(),
	latitude: real(),
	longitude: real(),
	openingHours: text("opening_hours"),
	priceRange: text("price_range"),
	rating: real(),
	tags: text().array(),
	aiConfidence: real("ai_confidence").notNull(),
	recommendationReason: text("recommendation_reason").notNull(),
	userPreferencesMatched: text("user_preferences_matched").array(),
	isBookmarked: boolean("is_bookmarked").default(false),
	isVisited: boolean("is_visited").default(false),
	userRating: real("user_rating"),
	userNotes: text("user_notes"),
	generatedAt: timestamp("generated_at", { mode: 'string' }).defaultNow().notNull(),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "ai_recommendations_user_id_users_id_fk"
		}),
]);

export const businessCustomerPhotos = pgTable("business_customer_photos", {
	id: serial().primaryKey().notNull(),
	businessId: integer("business_id").notNull(),
	uploaderId: integer("uploader_id").notNull(),
	photoUrl: text("photo_url").notNull(),
	caption: text(),
	uploaderName: text("uploader_name").notNull(),
	uploaderType: text("uploader_type").notNull(),
	isApproved: boolean("is_approved").default(true),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [users.id],
			name: "business_customer_photos_business_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.uploaderId],
			foreignColumns: [users.id],
			name: "business_customer_photos_uploader_id_users_id_fk"
		}),
]);

export const blockedUsers = pgTable("blocked_users", {
	id: serial().primaryKey().notNull(),
	blockerId: integer("blocker_id").notNull(),
	blockedId: integer("blocked_id").notNull(),
	reason: text(),
	blockedAt: timestamp("blocked_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("blocked_users_blocker_id_blocked_id_unique").on(table.blockerId, table.blockedId),
]);

export const businessInterestNotifications = pgTable("business_interest_notifications", {
	id: serial().primaryKey().notNull(),
	businessId: integer("business_id").notNull(),
	userId: integer("user_id").notNull(),
	matchType: text("match_type").notNull(),
	matchedInterests: text("matched_interests").array(),
	matchedActivities: text("matched_activities").array(),
	userLocation: text("user_location"),
	isRead: boolean("is_read").default(false),
	isProcessed: boolean("is_processed").default(false),
	priority: text().default('medium'),
	travelStartDate: timestamp("travel_start_date", { mode: 'string' }),
	travelEndDate: timestamp("travel_end_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [users.id],
			name: "business_interest_notifications_business_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "business_interest_notifications_user_id_users_id_fk"
		}),
]);

export const businessLocations = pgTable("business_locations", {
	id: serial().primaryKey().notNull(),
	businessId: integer("business_id").notNull(),
	locationName: text("location_name"),
	streetAddress: text("street_address").notNull(),
	city: text().notNull(),
	state: text(),
	country: text().notNull(),
	zipCode: text("zip_code").notNull(),
	phoneNumber: text("phone_number").notNull(),
	isPrimary: boolean("is_primary").default(false),
	businessHours: text("business_hours"),
	specialInstructions: text("special_instructions"),
	latitude: real(),
	longitude: real(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [users.id],
			name: "business_locations_business_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const businessOfferRedemptions = pgTable("business_offer_redemptions", {
	id: serial().primaryKey().notNull(),
	offerId: integer("offer_id").notNull(),
	userId: integer("user_id").notNull(),
	redemptionCode: text("redemption_code"),
	redeemedAt: timestamp("redeemed_at", { mode: 'string' }).defaultNow(),
	verifiedByBusiness: boolean("verified_by_business").default(false),
	notes: text(),
});

export const achievements = pgTable("achievements", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	achievementType: text("achievement_type").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	iconUrl: text("icon_url"),
	badgeLevel: text("badge_level").notNull(),
	pointsAwarded: integer("points_awarded").default(0).notNull(),
	requirement: integer().notNull(),
	progress: integer().default(0).notNull(),
	isUnlocked: boolean("is_unlocked").default(false).notNull(),
	unlockedAt: timestamp("unlocked_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "achievements_user_id_users_id_fk"
		}),
]);

export const businessOffers = pgTable("business_offers", {
	id: serial().primaryKey().notNull(),
	businessId: integer("business_id").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	category: text().notNull(),
	discountType: text("discount_type").notNull(),
	discountValue: text("discount_value"),
	discountCode: text("discount_code"),
	targetAudience: text("target_audience").array(),
	city: text().notNull(),
	state: text(),
	country: text().notNull(),
	validFrom: timestamp("valid_from", { mode: 'string' }).notNull(),
	validUntil: timestamp("valid_until", { mode: 'string' }).notNull(),
	maxRedemptions: integer("max_redemptions"),
	maxRedemptionsPerUser: integer("max_redemptions_per_user"),
	currentRedemptions: integer("current_redemptions").default(0),
	isActive: boolean("is_active").default(true),
	imageUrl: text("image_url"),
	termsConditions: text("terms_conditions"),
	contactInfo: text("contact_info"),
	websiteUrl: text("website_url"),
	tags: text().array(),
	viewCount: integer("view_count").default(0),
	monthCreated: integer("month_created"),
	yearCreated: integer("year_created"),
	autoRenewMonthly: boolean("auto_renew_monthly").default(false),
	isTemplate: boolean("is_template").default(false),
	pausedDueToPayment: boolean("paused_due_to_payment").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const businessReferrals = pgTable("business_referrals", {
	id: serial().primaryKey().notNull(),
	referrerId: integer("referrer_id").notNull(),
	referredBusinessId: integer("referred_business_id").notNull(),
	businessName: text("business_name").notNull(),
	businessEmail: text("business_email").notNull(),
	status: text().default('business_signed_up').notNull(),
	potentialRewardCents: integer("potential_reward_cents").default(10000),
	rewardPaid: boolean("reward_paid").default(false),
	rewardPaidAt: timestamp("reward_paid_at", { mode: 'string' }),
	paymentMethod: text("payment_method"),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const cityLandmarks = pgTable("city_landmarks", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	city: text().notNull(),
	state: text(),
	country: text().notNull(),
	address: text(),
	category: text().notNull(),
	visitTime: text("visit_time"),
	rating: real().default(0),
	totalRatings: integer("total_ratings").default(0),
	latitude: real(),
	longitude: real(),
	imageUrl: text("image_url"),
	website: text(),
	openingHours: text("opening_hours"),
	entryFee: text("entry_fee"),
	bestTimeToVisit: text("best_time_to_visit"),
	tips: text().array(),
	addedBy: integer("added_by").notNull(),
	isVerified: boolean("is_verified").default(false),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.addedBy],
			foreignColumns: [users.id],
			name: "city_landmarks_added_by_users_id_fk"
		}),
]);

export const chatroomInvitations = pgTable("chatroom_invitations", {
	id: serial().primaryKey().notNull(),
	chatroomId: integer("chatroom_id").notNull(),
	inviterId: integer("inviter_id").notNull(),
	inviteeId: integer("invitee_id").notNull(),
	status: text().default('pending').notNull(),
	message: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	respondedAt: timestamp("responded_at", { mode: 'string' }),
});

export const chatroomAccessRequests = pgTable("chatroom_access_requests", {
	id: serial().primaryKey().notNull(),
	chatroomId: integer("chatroom_id").notNull(),
	userId: integer("user_id").notNull(),
	message: text(),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	respondedAt: timestamp("responded_at", { mode: 'string' }),
	respondedById: integer("responded_by_id"),
	responseMessage: text("response_message"),
});

export const cityActivities = pgTable("city_activities", {
	id: serial().primaryKey().notNull(),
	cityName: text("city_name").notNull(),
	state: text(),
	country: text().default('United States').notNull(),
	activityName: text("activity_name").notNull(),
	description: text().notNull(),
	category: text().default('general'),
	createdByUserId: integer("created_by_user_id").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("city_activities_city_name_activity_name_unique").on(table.cityName, table.activityName),
]);

export const businessSubscriptions = pgTable("business_subscriptions", {
	id: serial().primaryKey().notNull(),
	businessId: integer("business_id").notNull(),
	subscriptionType: text("subscription_type").default('free'),
	daysUsedThisMonth: integer("days_used_this_month").default(0),
	monthlyDayLimit: integer("monthly_day_limit").default(5),
	currentMonth: integer("current_month").default(8),
	currentYear: integer("current_year").default(2025),
	lastActiveDate: timestamp("last_active_date", { mode: 'string' }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [users.id],
			name: "business_subscriptions_business_id_users_id_fk"
		}).onDelete("cascade"),
	unique("business_subscriptions_business_id_unique").on(table.businessId),
]);

export const cityPages = pgTable("city_pages", {
	id: serial().primaryKey().notNull(),
	city: text().notNull(),
	state: text(),
	country: text().notNull(),
	createdById: integer("created_by_id").notNull(),
	title: text(),
	description: text(),
	coverImage: text("cover_image"),
	aboutSection: text("about_section"),
	attractionsSection: text("attractions_section"),
	restaurantsSection: text("restaurants_section"),
	nightlifeSection: text("nightlife_section"),
	localTipsSection: text("local_tips_section"),
	hiddenGemsSection: text("hidden_gems_section"),
	transportationSection: text("transportation_section"),
	weatherSection: text("weather_section"),
	tags: text().array(),
	isPublished: boolean("is_published").default(true),
	featuredImages: text("featured_images").array(),
	contactInfo: jsonb("contact_info"),
	socialLinks: jsonb("social_links"),
	isDeletionProtected: boolean("is_deletion_protected").default(false),
	adminApprovalRequired: boolean("admin_approval_required").default(false),
	contributorCount: integer("contributor_count").default(0),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("city_pages_city_state_country_unique").on(table.city, table.state, table.country),
]);

export const emergencyContacts = pgTable("emergency_contacts", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	name: text().notNull(),
	phone: text().notNull(),
	relationship: text().notNull(),
	isPrimary: boolean("is_primary").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "emergency_contacts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const cityChatrooms = pgTable("city_chatrooms", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	city: text().notNull(),
	state: text(),
	country: text().notNull(),
	createdById: integer("created_by_id").notNull(),
	isActive: boolean("is_active").default(true),
	isPublic: boolean("is_public").default(true),
	maxMembers: integer("max_members").default(500),
	tags: text().array(),
	rules: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const connections = pgTable("connections", {
	id: serial().primaryKey().notNull(),
	requesterId: integer("requester_id").notNull(),
	receiverId: integer("receiver_id").notNull(),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const customLocationActivities = pgTable("custom_location_activities", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	title: text().notNull(),
	description: text(),
	category: text().notNull(),
	city: text().notNull(),
	state: text(),
	country: text().notNull(),
	verified: boolean().default(false),
	upvotes: integer().default(0),
	downvotes: integer().default(0),
	tags: text().array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const eventParticipants = pgTable("event_participants", {
	id: serial().primaryKey().notNull(),
	eventId: integer("event_id").notNull(),
	userId: integer("user_id").notNull(),
	status: text().default('joined').notNull(),
	role: text().default('participant'),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow(),
	notes: text(),
});

export const events = pgTable("events", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	venueName: text("venue_name"),
	street: text().notNull(),
	city: text().notNull(),
	state: text().notNull(),
	zipcode: text().notNull(),
	location: text().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }),
	category: text().notNull(),
	imageUrl: text("image_url"),
	organizerId: integer("organizer_id").notNull(),
	maxParticipants: integer("max_participants"),
	isActive: boolean("is_active").default(true),
	isPublic: boolean("is_public").default(true),
	tags: text().array(),
	requirements: text(),
	postToInstagram: boolean("post_to_instagram").default(false),
	latitude: numeric({ precision: 10, scale:  8 }),
	longitude: numeric({ precision: 11, scale:  8 }),
	eventType: text("event_type").default('planned'),
	meetingPoint: text("meeting_point"),
	isSpontaneous: boolean("is_spontaneous").default(false),
	costEstimate: text("cost_estimate"),
	responseTime: text("response_time").default('ASAP'),
	urgency: text().default('normal'),
	minParticipants: integer("min_participants").default(1),
	autoCancel: boolean("auto_cancel").default(false),
	isRecurring: boolean("is_recurring").default(false),
	recurrenceType: text("recurrence_type"),
	recurrencePattern: jsonb("recurrence_pattern"),
	recurrenceEnd: timestamp("recurrence_end", { mode: 'string' }),
	parentEventId: integer("parent_event_id"),
	instanceDate: timestamp("instance_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	isAiGenerated: boolean("is_ai_generated").default(false),
});

export const cityPhotos = pgTable("city_photos", {
	id: serial().primaryKey().notNull(),
	city: varchar().notNull(),
	state: varchar(),
	country: varchar().notNull(),
	imageUrl: text("image_url").notNull(),
	photographerName: varchar("photographer_name").notNull(),
	photographerUsername: varchar("photographer_username").notNull(),
	photographerId: integer("photographer_id"),
	isActive: boolean("is_active").default(true),
	votes: integer().default(0),
	version: integer().default(0).notNull(),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	moderatedBy: integer("moderated_by"),
}, (table) => [
	foreignKey({
			columns: [table.photographerId],
			foreignColumns: [users.id],
			name: "city_photos_photographer_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.moderatedBy],
			foreignColumns: [users.id],
			name: "city_photos_moderated_by_users_id_fk"
		}),
]);

export const meetupChatrooms = pgTable("meetup_chatrooms", {
	id: serial().primaryKey().notNull(),
	meetupId: integer("meetup_id"),
	chatroomName: text("chatroom_name").notNull(),
	description: text(),
	city: text().notNull(),
	state: text(),
	country: text().notNull(),
	latitude: real(),
	longitude: real(),
	isActive: boolean("is_active").default(true).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	participantCount: integer("participant_count").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	eventId: integer("event_id"),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "meetup_chatrooms_event_id_events_id_fk"
		}),
	foreignKey({
			columns: [table.meetupId],
			foreignColumns: [quickMeetups.id],
			name: "meetup_chatrooms_meetup_id_quick_meetups_id_fk"
		}),
]);

export const hostingOffers = pgTable("hosting_offers", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	offerType: text("offer_type").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	maxGuests: integer("max_guests").default(1).notNull(),
	availableFrom: timestamp("available_from", { mode: 'string' }).notNull(),
	availableTo: timestamp("available_to", { mode: 'string' }).notNull(),
	isActive: boolean("is_active").default(true),
	requirements: text(),
	amenities: text().array(),
	responseRate: integer("response_rate").default(95),
	responseTime: text("response_time").default('within a day'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "hosting_offers_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const instagramPosts = pgTable("instagram_posts", {
	id: serial().primaryKey().notNull(),
	eventId: integer("event_id").notNull(),
	userId: integer("user_id").notNull(),
	userPostId: text("user_post_id"),
	nearbytravelerPostId: text("nearbytraveler_post_id"),
	postContent: text("post_content").notNull(),
	hashtagsUsed: text("hashtags_used").array(),
	imageUrl: text("image_url"),
	userPostStatus: text("user_post_status").default('pending'),
	nearbytravelerPostStatus: text("nearbytraveler_post_status").default('pending'),
	userPostError: text("user_post_error"),
	nearbytravelerPostError: text("nearbytraveler_post_error"),
	deletedByAdmin: boolean("deleted_by_admin").default(false),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "instagram_posts_event_id_events_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "instagram_posts_user_id_users_id_fk"
		}),
]);

export const landmarkRatings = pgTable("landmark_ratings", {
	id: serial().primaryKey().notNull(),
	landmarkId: integer("landmark_id").notNull(),
	userId: integer("user_id").notNull(),
	rating: integer().notNull(),
	review: text(),
	visitDate: timestamp("visit_date", { mode: 'string' }),
	wouldRecommend: boolean("would_recommend").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.landmarkId],
			foreignColumns: [cityLandmarks.id],
			name: "landmark_ratings_landmark_id_city_landmarks_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "landmark_ratings_user_id_users_id_fk"
		}),
]);

export const itineraryItems = pgTable("itinerary_items", {
	id: serial().primaryKey().notNull(),
	itineraryId: integer("itinerary_id").notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	startTime: text("start_time"),
	endTime: text("end_time"),
	title: text().notNull(),
	description: text(),
	location: text(),
	address: text(),
	category: text(),
	cost: real(),
	currency: text().default('USD'),
	duration: integer(),
	notes: text(),
	url: text(),
	phoneNumber: text("phone_number"),
	orderIndex: integer("order_index").notNull(),
	isCompleted: boolean("is_completed").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const meetupChatroomMessages = pgTable("meetup_chatroom_messages", {
	id: serial().primaryKey().notNull(),
	meetupChatroomId: integer("meetup_chatroom_id").notNull(),
	userId: integer("user_id").notNull(),
	username: text().notNull(),
	message: text().notNull(),
	messageType: text("message_type").default('text'),
	sentAt: timestamp("sent_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.meetupChatroomId],
			foreignColumns: [meetupChatrooms.id],
			name: "meetup_chatroom_messages_meetup_chatroom_id_meetup_chatrooms_id"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "meetup_chatroom_messages_user_id_users_id_fk"
		}),
]);

export const externalEventInterests = pgTable("external_event_interests", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	eventId: text("event_id").notNull(),
	eventTitle: text("event_title").notNull(),
	eventDate: text("event_date").notNull(),
	eventVenue: text("event_venue"),
	eventUrl: text("event_url"),
	eventSource: text("event_source").notNull(),
	interestType: text("interest_type").notNull(),
	addedToItinerary: boolean("added_to_itinerary").default(false),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "external_event_interests_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("external_event_interests_user_id_event_id_event_source_unique").on(table.userId, table.eventId, table.eventSource),
]);

export const hangouts = pgTable("hangouts", {
	id: serial().primaryKey().notNull(),
	hostId: integer("host_id").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	category: text().notNull(),
	location: text().notNull(),
	meetingPoint: text("meeting_point").notNull(),
	datetime: timestamp({ mode: 'string' }).notNull(),
	maxParticipants: integer("max_participants").default(4).notNull(),
	currentParticipants: integer("current_participants").default(1),
	isPublic: boolean("is_public").default(true),
	requirements: text(),
	costEstimate: text("cost_estimate"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.hostId],
			foreignColumns: [users.id],
			name: "hangouts_host_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const restaurantCategories = pgTable("restaurant_categories", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	icon: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("restaurant_categories_name_unique").on(table.name),
]);

export const secretExperienceLikes = pgTable("secret_experience_likes", {
	id: serial().primaryKey().notNull(),
	experienceId: integer("experience_id").notNull(),
	userId: integer("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "secret_experience_likes_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("secret_experience_likes_experience_id_user_id_unique").on(table.experienceId, table.userId),
]);

export const secretLocalExperiences = pgTable("secret_local_experiences", {
	id: serial().primaryKey().notNull(),
	cityPageId: integer("city_page_id"),
	contributorId: integer("contributor_id").notNull(),
	experience: text().notNull(),
	description: text(),
	category: text(),
	likes: integer().default(1),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const travelBlogComments = pgTable("travel_blog_comments", {
	id: serial().primaryKey().notNull(),
	postId: integer("post_id").notNull(),
	userId: integer("user_id").notNull(),
	parentCommentId: integer("parent_comment_id"),
	content: text().notNull(),
	likes: integer().default(0),
	aura: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [travelBlogPosts.id],
			name: "travel_blog_comments_post_id_travel_blog_posts_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "travel_blog_comments_user_id_users_id_fk"
		}),
]);

export const sharedItineraries = pgTable("shared_itineraries", {
	id: serial().primaryKey().notNull(),
	itineraryId: integer("itinerary_id").notNull(),
	sharedByUserId: integer("shared_by_user_id").notNull(),
	sharedWithUserId: integer("shared_with_user_id"),
	shareType: text("share_type").notNull(),
	shareToken: text("share_token"),
	canEdit: boolean("can_edit").default(false),
	canCopy: boolean("can_copy").default(true),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const travelBlogLikes = pgTable("travel_blog_likes", {
	id: serial().primaryKey().notNull(),
	postId: integer("post_id").notNull(),
	userId: integer("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [travelBlogPosts.id],
			name: "travel_blog_likes_post_id_travel_blog_posts_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "travel_blog_likes_user_id_users_id_fk"
		}),
	unique("travel_blog_likes_post_id_user_id_unique").on(table.postId, table.userId),
]);

export const secretLocalExperienceLikes = pgTable("secret_local_experience_likes", {
	id: serial().primaryKey().notNull(),
	experienceId: integer("experience_id").notNull(),
	userId: integer("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.experienceId],
			foreignColumns: [secretLocalExperiences.id],
			name: "secret_local_experience_likes_experience_id_secret_local_experi"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "secret_local_experience_likes_user_id_users_id_fk"
		}),
	unique("secret_local_experience_likes_experience_id_user_id_unique").on(table.experienceId, table.userId),
]);

export const travelBlogCommentLikes = pgTable("travel_blog_comment_likes", {
	id: serial().primaryKey().notNull(),
	commentId: integer("comment_id").notNull(),
	userId: integer("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.commentId],
			foreignColumns: [travelBlogComments.id],
			name: "travel_blog_comment_likes_comment_id_travel_blog_comments_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "travel_blog_comment_likes_user_id_users_id_fk"
		}),
	unique("travel_blog_comment_likes_comment_id_user_id_unique").on(table.commentId, table.userId),
]);

export const travelMemories = pgTable("travel_memories", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	destination: text().notNull(),
	photos: text().array().notNull(),
	description: text().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	tags: text().array(),
	city: text().notNull(),
	country: text().notNull(),
	latitude: real(),
	longitude: real(),
	likes: integer().default(0).notNull(),
	comments: integer().default(0).notNull(),
	isPublic: boolean("is_public").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "travel_memories_user_id_users_id_fk"
		}),
]);

export const userCityInterests = pgTable("user_city_interests", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	cityName: text("city_name").notNull(),
	activityId: integer("activity_id").notNull(),
	activityName: text("activity_name").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_city_interests_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.activityId],
			foreignColumns: [cityActivities.id],
			name: "user_city_interests_activity_id_city_activities_id_fk"
		}).onDelete("cascade"),
	unique("user_city_interests_user_id_activity_id_unique").on(table.userId, table.activityId),
]);

export const travelMemoryComments = pgTable("travel_memory_comments", {
	id: serial().primaryKey().notNull(),
	memoryId: integer("memory_id").notNull(),
	userId: integer("user_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.memoryId],
			foreignColumns: [travelMemories.id],
			name: "travel_memory_comments_memory_id_travel_memories_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "travel_memory_comments_user_id_users_id_fk"
		}),
]);

export const travelMemoryLikes = pgTable("travel_memory_likes", {
	id: serial().primaryKey().notNull(),
	memoryId: integer("memory_id").notNull(),
	userId: integer("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.memoryId],
			foreignColumns: [travelMemories.id],
			name: "travel_memory_likes_memory_id_travel_memories_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "travel_memory_likes_user_id_users_id_fk"
		}),
]);

export const travelBlogPosts = pgTable("travel_blog_posts", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	title: text().notNull(),
	content: text().notNull(),
	location: text(),
	city: text(),
	state: text(),
	country: text(),
	imageUrl: text("image_url"),
	tags: text().array(),
	likes: integer().default(1),
	views: integer().default(0),
	aura: integer().default(0),
	isPublic: boolean("is_public").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "travel_blog_posts_user_id_users_id_fk"
		}),
]);

export const tripItineraries = pgTable("trip_itineraries", {
	id: serial().primaryKey().notNull(),
	travelPlanId: integer("travel_plan_id").notNull(),
	userId: integer("user_id").notNull(),
	title: text().notNull(),
	description: text(),
	isPublic: boolean("is_public").default(false),
	isTemplate: boolean("is_template").default(false),
	tags: text().array(),
	totalCost: real("total_cost").default(0),
	currency: text().default('USD'),
	savedToPastTrips: boolean("saved_to_past_trips").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const travelChallenges = pgTable("travel_challenges", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	type: text().notNull(),
	points: integer().default(10).notNull(),
	difficulty: text().default('easy'),
	location: text(),
	isActive: boolean("is_active").default(true),
	requiresVerification: boolean("requires_verification").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const travelPlans = pgTable("travel_plans", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	destination: text().notNull(),
	destinationCity: text("destination_city"),
	destinationState: text("destination_state"),
	destinationCountry: text("destination_country"),
	startDate: timestamp("start_date", { mode: 'string' }),
	endDate: timestamp("end_date", { mode: 'string' }),
	interests: text().array(),
	activities: text().array(),
	events: text().array(),
	travelStyle: text("travel_style").array(),
	accommodation: text(),
	transportation: text(),
	notes: text(),
	autoTags: text("auto_tags").array(),
	status: text().default('planned'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const userChallenges = pgTable("user_challenges", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	challengeId: integer("challenge_id").notNull(),
	status: text().default('active'),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	verificationPhoto: text("verification_photo"),
	verificationNotes: text("verification_notes"),
	pointsEarned: integer("points_earned").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_challenges_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.challengeId],
			foreignColumns: [travelChallenges.id],
			name: "user_challenges_challenge_id_travel_challenges_id_fk"
		}),
]);

export const userCustomActivities = pgTable("user_custom_activities", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	customActivityId: integer("custom_activity_id").notNull(),
	addedAt: timestamp("added_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("user_custom_activities_user_id_custom_activity_id_unique").on(table.userId, table.customActivityId),
]);

export const userLeaderboard = pgTable("user_leaderboard", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	totalPoints: integer("total_points").default(0),
	challengesCompleted: integer("challenges_completed").default(0),
	currentStreak: integer("current_streak").default(0),
	longestStreak: integer("longest_streak").default(0),
	rank: integer(),
	badges: text().array(),
	lastActivityAt: timestamp("last_activity_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_leaderboard_user_id_users_id_fk"
		}),
]);

export const userNotificationSettings = pgTable("user_notification_settings", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	emailNotifications: boolean("email_notifications").default(true),
	eventReminders: boolean("event_reminders").default(true),
	connectionAlerts: boolean("connection_alerts").default(true),
	messageNotifications: boolean("message_notifications").default(true),
	weeklyDigest: boolean("weekly_digest").default(true),
	marketingEmails: boolean("marketing_emails").default(false),
	pushNotifications: boolean("push_notifications").default(true),
	mobileAlerts: boolean("mobile_alerts").default(true),
	profileVisibility: text("profile_visibility").default('public'),
	locationSharing: boolean("location_sharing").default(true),
	photoPermissions: text("photo_permissions").default('friends'),
	messageRequests: boolean("message_requests").default(true),
	eventInvitations: boolean("event_invitations").default(true),
	connectionRequests: boolean("connection_requests").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_notification_settings_user_id_users_id_fk"
		}),
]);

export const userPreferences = pgTable("user_preferences", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	preferredCategories: text("preferred_categories").array(),
	budgetRange: text("budget_range"),
	crowdPreference: text("crowd_preference"),
	timePreferences: text("time_preferences").array(),
	accessibilityNeeds: text("accessibility_needs").array(),
	dietaryRestrictions: text("dietary_restrictions").array(),
	languagePreferences: text("language_preferences").array(),
	notificationSettings: jsonb("notification_settings"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_preferences_user_id_users_id_fk"
		}),
]);

export const userPhotos = pgTable("user_photos", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	imageUrl: text("image_url").notNull(),
	imageData: text("image_data"),
	caption: text(),
	isPrivate: boolean("is_private").default(false),
	isProfilePhoto: boolean("is_profile_photo").default(false),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow(),
});

export const userRecommendationInteractions = pgTable("user_recommendation_interactions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	recommendationId: integer("recommendation_id").notNull(),
	interactionType: text("interaction_type").notNull(),
	rating: integer(),
	notes: text(),
	visitDate: timestamp("visit_date", { mode: 'string' }),
	wouldRecommend: boolean("would_recommend"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.recommendationId],
			foreignColumns: [recommendations.id],
			name: "user_recommendation_interactions_recommendation_id_recommendati"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_recommendation_interactions_user_id_users_id_fk"
		}),
]);

export const userEventInterests = pgTable("user_event_interests", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	cityName: text("city_name").notNull(),
	eventId: integer("event_id"),
	eventTitle: text("event_title").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	externalEventId: text("external_event_id"),
	eventSource: text("event_source").default('internal').notNull(),
	eventData: jsonb("event_data"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_event_interests_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "user_event_interests_event_id_events_id_fk"
		}).onDelete("cascade"),
	unique("user_event_interests_user_id_event_id_external_event_id_unique").on(table.userId, table.eventId, table.externalEventId),
]);

export const userReferences = pgTable("user_references", {
	id: serial().primaryKey().notNull(),
	reviewerId: integer("reviewer_id").notNull(),
	revieweeId: integer("reviewee_id").notNull(),
	experience: text().default('positive'),
	content: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const userContributedInterests = pgTable("user_contributed_interests", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	category: text().notNull(),
	location: text().notNull(),
	address: text(),
	priceRange: text("price_range"),
	tags: text().array(),
	personalNote: text("personal_note"),
	isPublic: boolean("is_public").default(true),
	likes: integer().default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_contributed_interests_user_id_users_id_fk"
		}),
]);

export const userReputation = pgTable("user_reputation", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	totalReferences: integer("total_references").default(0),
	positiveReferences: integer("positive_references").default(0),
	negativeReferences: integer("negative_references").default(0),
	verifiedMeetings: integer("verified_meetings").default(0),
	meetAgainRate: real("meet_again_rate").default(0),
	referralsMade: integer("referrals_made").default(0),
	successfulReferrals: integer("successful_referrals").default(0),
	reputationLevel: text("reputation_level").default('newcomer'),
	badges: text().array(),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("user_reputation_user_id_unique").on(table.userId),
]);

export const restaurantReviews = pgTable("restaurant_reviews", {
	id: serial().primaryKey().notNull(),
	restaurantId: integer("restaurant_id").notNull(),
	userId: integer("user_id").notNull(),
	rating: integer().notNull(),
	title: text(),
	content: text(),
	images: text().array(),
	visitDate: timestamp("visit_date", { mode: 'string' }),
	priceRating: integer("price_rating"),
	serviceRating: integer("service_rating"),
	foodRating: integer("food_rating"),
	ambianceRating: integer("ambiance_rating"),
	recommendedDishes: text("recommended_dishes").array(),
	tags: text().array(),
	isVerifiedVisit: boolean("is_verified_visit").default(false),
	helpfulVotes: integer("helpful_votes").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurants.id],
			name: "restaurant_reviews_restaurant_id_restaurants_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "restaurant_reviews_user_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	name: text().notNull(),
	userType: text("user_type").notNull(),
	bio: text(),
	location: text(),
	hometownCity: text("hometown_city"),
	hometownState: text("hometown_state"),
	hometownCountry: text("hometown_country"),
	profileImage: text("profile_image"),
	interests: text().array(),
	dateOfBirth: timestamp("date_of_birth", { mode: 'string' }),
	age: integer(),
	ageVisible: boolean("age_visible").default(true),
	gender: text(),
	sexualPreference: text("sexual_preference").array(),
	sexualPreferenceVisible: boolean("sexual_preference_visible").default(false),
	isCurrentlyTraveling: boolean("is_currently_traveling").default(false),
	travelDestination: text("travel_destination"),
	travelStartDate: timestamp("travel_start_date", { mode: 'string' }),
	travelEndDate: timestamp("travel_end_date", { mode: 'string' }),
	travelInterests: text("travel_interests").array(),
	preferredActivities: text("preferred_activities").array(),
	hometown: text(),
	localExpertise: text("local_expertise").array(),
	localActivities: text("local_activities").array(),
	localEvents: text("local_events").array(),
	plannedEvents: text("planned_events").array(),
	activities: text().array(),
	events: text().array(),
	defaultTravelInterests: text("default_travel_interests").array(),
	defaultTravelActivities: text("default_travel_activities").array(),
	defaultTravelEvents: text("default_travel_events").array(),
	countriesVisited: text("countries_visited").array(),
	languagesSpoken: text("languages_spoken").array(),
	travelStyle: text("travel_style").array(),
	travelingWithChildren: boolean("traveling_with_children").default(false),
	coverPhoto: text("cover_photo"),
	secretActivities: text("secret_activities"),
	facebookUrl: text("facebook_url"),
	facebookId: text("facebook_id"),
	facebookAccessToken: text("facebook_access_token"),
	currentLatitude: real("current_latitude"),
	currentLongitude: real("current_longitude"),
	lastLocationUpdate: timestamp("last_location_update", { mode: 'string' }),
	locationSharingEnabled: boolean("location_sharing_enabled").default(false),
	instagramUrl: text("instagram_url"),
	instagramHandle: text("instagram_handle"),
	twitterUrl: text("twitter_url"),
	linkedinUrl: text("linkedin_url"),
	tiktokUrl: text("tiktok_url"),
	youtubeUrl: text("youtube_url"),
	websiteUrl: text("website_url"),
	streetAddress: text("street_address"),
	zipCode: text("zip_code"),
	phoneNumber: text("phone_number"),
	services: text(),
	specialOffers: text("special_offers"),
	targetCustomers: text("target_customers"),
	certifications: text(),
	isVeteran: boolean("is_veteran").default(false),
	isActiveDuty: boolean("is_active_duty").default(false),
	stripeCustomerId: text("stripe_customer_id"),
	stripeSubscriptionId: text("stripe_subscription_id"),
	subscriptionStatus: text("subscription_status"),
	subscriptionPlan: text("subscription_plan").default('business_monthly'),
	subscriptionStartDate: timestamp("subscription_start_date", { mode: 'string' }),
	subscriptionEndDate: timestamp("subscription_end_date", { mode: 'string' }),
	trialEndDate: timestamp("trial_end_date", { mode: 'string' }),
	customMonthlyPriceCents: integer("custom_monthly_price_cents"),
	signupFeePaidCents: integer("signup_fee_paid_cents"),
	signupFeePaidDate: timestamp("signup_fee_paid_date", { mode: 'string' }),
	pricingTier: text("pricing_tier").default('standard'),
	monthlyDealLimit: integer("monthly_deal_limit").default(5),
	currentMonthDeals: integer("current_month_deals").default(0),
	dealLimitResetDate: timestamp("deal_limit_reset_date", { mode: 'string' }),
	isActive: boolean("is_active").default(true),
	isAdmin: boolean("is_admin").default(false),
	passwordResetToken: text("password_reset_token"),
	passwordResetExpires: timestamp("password_reset_expires", { mode: 'string' }),
	isAiGenerated: boolean("is_ai_generated").default(false),
	aura: integer().default(0),
	onlineStatus: text("online_status").default('offline'),
	customStatus: text("custom_status"),
	locationBasedStatus: text("location_based_status"),
	statusEmoji: text("status_emoji"),
	lastSeenAt: timestamp("last_seen_at", { mode: 'string' }).defaultNow(),
	doNotDisturb: boolean("do_not_disturb").default(false),
	doNotDisturbUntil: timestamp("do_not_disturb_until", { mode: 'string' }),
	notificationSettings: jsonb("notification_settings"),
	travelWhy: text("travel_why"),
	travelHow: text("travel_how"),
	travelBudget: text("travel_budget"),
	travelGroup: text("travel_group"),
	businessName: text("business_name"),
	businessType: text("business_type"),
	businessDescription: text("business_description"),
	street: text(),
	city: text(),
	state: text(),
	country: text(),
	zipcode: text(),
	phone: text(),
	website: text(),
	specialty: text(),
	rating: real(),
	priceRange: text("price_range"),
	tags: text().array(),
	currentCity: text("current_city"),
	avatarColor: text("avatar_color").default('#3B82F6'),
	avatarGradient: text("avatar_gradient"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
]);

export const hangoutParticipants = pgTable("hangout_participants", {
	id: serial().primaryKey().notNull(),
	hangoutId: integer("hangout_id").notNull(),
	userId: integer("user_id").notNull(),
	status: text().default('joined'),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.hangoutId],
			foreignColumns: [hangouts.id],
			name: "hangout_participants_hangout_id_hangouts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "hangout_participants_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("hangout_participants_hangout_id_user_id_unique").on(table.hangoutId, table.userId),
]);

export const moodBoardItems = pgTable("mood_board_items", {
	id: serial().primaryKey().notNull(),
	moodBoardId: integer("mood_board_id").notNull(),
	title: text().notNull(),
	description: text(),
	imageUrl: text("image_url"),
	type: text().notNull(),
	color: text().default('#3B82F6'),
	tags: text().array(),
	position: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.moodBoardId],
			foreignColumns: [moodBoards.id],
			name: "mood_board_items_mood_board_id_mood_boards_id_fk"
		}),
]);

export const referenceVotes = pgTable("reference_votes", {
	id: serial().primaryKey().notNull(),
	referenceId: integer("reference_id").notNull(),
	userId: integer("user_id").notNull(),
	isHelpful: boolean("is_helpful").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.referenceId],
			foreignColumns: [references.id],
			name: "reference_votes_reference_id_references_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reference_votes_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("reference_votes_reference_id_user_id_unique").on(table.referenceId, table.userId),
]);

export const restaurants = pgTable("restaurants", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	cuisine: text().notNull(),
	address: text().notNull(),
	city: text().notNull(),
	country: text().notNull(),
	latitude: real().notNull(),
	longitude: real().notNull(),
	priceRange: text("price_range"),
	phone: text(),
	website: text(),
	imageUrl: text("image_url"),
	openingHours: text("opening_hours"),
	features: text().array(),
	averageRating: real("average_rating").default(0),
	totalReviews: integer("total_reviews").default(0),
	isActive: boolean("is_active").default(true),
	addedBy: integer("added_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.addedBy],
			foreignColumns: [users.id],
			name: "restaurants_added_by_users_id_fk"
		}),
]);

export const userStats = pgTable("user_stats", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	totalStamps: integer("total_stamps").default(0).notNull(),
	totalPoints: integer("total_points").default(0).notNull(),
	countriesVisited: integer("countries_visited").default(0).notNull(),
	citiesVisited: integer("cities_visited").default(0).notNull(),
	eventsAttended: integer("events_attended").default(0).notNull(),
	connectionsMade: integer("connections_made").default(0).notNull(),
	currentStreak: integer("current_streak").default(0).notNull(),
	longestStreak: integer("longest_streak").default(0).notNull(),
	level: integer().default(1).notNull(),
	experiencePoints: integer("experience_points").default(0).notNull(),
	lastActivityDate: timestamp("last_activity_date", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_stats_user_id_users_id_fk"
		}),
]);

export const verifications = pgTable("verifications", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	verificationType: text("verification_type").notNull(),
	verificationStatus: text("verification_status").default('pending'),
	verifiedAt: timestamp("verified_at", { mode: 'string' }),
	verifiedBy: text("verified_by"),
	verificationData: text("verification_data"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "verifications_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("verifications_user_id_verification_type_unique").on(table.userId, table.verificationType),
]);

export const vouchCredits = pgTable("vouch_credits", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	totalCredits: integer("total_credits").default(0).notNull(),
	usedCredits: integer("used_credits").default(0).notNull(),
	availableCredits: integer("available_credits").default(0).notNull(),
	seedMember: boolean("seed_member").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "vouch_credits_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("vouch_credits_user_id_unique").on(table.userId),
]);

export const vouches = pgTable("vouches", {
	id: serial().primaryKey().notNull(),
	voucherUserId: integer("voucher_user_id").notNull(),
	vouchedUserId: integer("vouched_user_id").notNull(),
	vouchMessage: text("vouch_message"),
	vouchCategory: text("vouch_category").default('general').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.voucherUserId],
			foreignColumns: [users.id],
			name: "vouches_voucher_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.vouchedUserId],
			foreignColumns: [users.id],
			name: "vouches_vouched_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("vouches_voucher_user_id_vouched_user_id_vouch_category_unique").on(table.voucherUserId, table.vouchedUserId, table.vouchCategory),
]);
