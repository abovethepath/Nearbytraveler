import { pgTable, text, serial, integer, boolean, timestamp, real, varchar, jsonb, unique, bigint, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 14 }).notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  userType: text("user_type").notNull(), // 'traveler', 'local', 'business', 'travel_agent'
  bio: text("bio"),
  location: text("location"),
  hometownCity: text("hometown_city"),
  hometownState: text("hometown_state"),
  hometownCountry: text("hometown_country"),
  // METRO AREA CONSOLIDATION FIELDS
  metroArea: text("metro_area"), // The metro area they belong to (e.g., "Los Angeles Metro")
  isMetroUser: boolean("is_metro_user").default(false), // Whether they confirmed metro area recognition
  profileImage: text("profile_image"),
  interests: text("interests").array(),
  customInterests: text("custom_interests"), // User's custom interests as comma-separated string
  dateOfBirth: timestamp("date_of_birth"),
  age: integer("age"), // Computed from dateOfBirth
  ageVisible: boolean("age_visible").default(true),
  gender: text("gender"), // 'male', 'female', 'non-binary', 'prefer-not-to-say'
  sexualPreference: text("sexual_preference").array(), // Array of preferences: 'straight', 'gay', 'lesbian', 'bisexual', 'pansexual', 'asexual', 'prefer-not-to-say'
  sexualPreferenceVisible: boolean("sexual_preference_visible").default(false),
  isCurrentlyTraveling: boolean("is_currently_traveling").default(false),
  travelDestination: text("travel_destination"),
  travelStartDate: timestamp("travel_start_date"),
  travelEndDate: timestamp("travel_end_date"),
  travelInterests: text("travel_interests").array(),
  preferredActivities: text("preferred_activities").array(),
  hometown: text("hometown"), // Where they are originally from/consider home
  localExpertise: text("local_expertise").array(), // What they know about their hometown
  localActivities: text("local_activities").array(), // Activities they recommend in their hometown
  localEvents: text("local_events").array(), // Events they know about in their hometown
  plannedEvents: text("planned_events").array(), // Events they plan to attend
  
  // UNIFIED FIELDS - New approach: Single fields for all contexts
  activities: text("activities").array(), // All user activities (replaces localActivities + defaultTravelActivities)
  customActivities: text("custom_activities"), // User's custom activities as comma-separated string
  events: text("events").array(), // All user events (replaces localEvents + defaultTravelEvents)
  customEvents: text("custom_events"), // User's custom events as comma-separated string
  
  // Default travel preferences that persist across all trips
  defaultTravelInterests: text("default_travel_interests").array(), // User's preferred interests for all trips
  defaultTravelActivities: text("default_travel_activities").array(), // User's preferred activities for all trips
  defaultTravelEvents: text("default_travel_events").array(), // User's preferred events for all trips
  countriesVisited: text("countries_visited").array(), // Countries they have visited
  languagesSpoken: text("languages_spoken").array(), // Languages they speak
  travelStyle: text("travel_style").array(), // Travel styles: solo, budget, luxury, adventure, etc.
  travelingWithChildren: boolean("traveling_with_children").default(false), // Whether user is traveling with children
  childrenAges: text("children_ages"), // Ages of children when traveling (e.g., "5, 8, 12")
  coverPhoto: text("cover_photo"), // Cover photo for profile
  secretActivities: text("secret_activities"), // Secret things they would do if closest friends came to town
  
  // Social Media Links
  facebookUrl: text("facebook_url"),
  facebookId: text("facebook_id"),
  facebookAccessToken: text("facebook_access_token"),
  
  // Geolocation for proximity notifications
  currentLatitude: real("current_latitude"),
  currentLongitude: real("current_longitude"),
  lastLocationUpdate: timestamp("last_location_update"),
  locationSharingEnabled: boolean("location_sharing_enabled").default(false),
  instagramUrl: text("instagram_url"),
  instagramHandle: text("instagram_handle"), // @username for Instagram posting
  twitterUrl: text("twitter_url"),
  linkedinUrl: text("linkedin_url"),
  tiktokUrl: text("tiktok_url"),
  youtubeUrl: text("youtube_url"),
  websiteUrl: text("website_url"),
  
  // Business Address Information (required for admin verification)
  streetAddress: text("street_address"),
  zipCode: text("zip_code"),
  phoneNumber: text("phone_number"),
  ownerEmail: text("owner_email"), // Direct email for account owner (separate from business email)
  ownerPhone: text("owner_phone"), // Direct contact for account owner (separate from business phone)
  
  // Business Description Fields
  services: text("services"),
  specialOffers: text("special_offers"),
  targetCustomers: text("target_customers"),
  certifications: text("certifications"),
  
  // Military/Veteran Status
  isVeteran: boolean("is_veteran").default(false),
  isActiveDuty: boolean("is_active_duty").default(false),
  
  // Diversity Business Ownership Categories
  isMinorityOwned: boolean("is_minority_owned").default(false),
  isFemaleOwned: boolean("is_female_owned").default(false),
  isLGBTQIAOwned: boolean("is_lgbtqia_owned").default(false),
  
  // Privacy settings for diversity categories
  showMinorityOwned: boolean("show_minority_owned").default(true),
  showFemaleOwned: boolean("show_female_owned").default(true),
  showLGBTQIAOwned: boolean("show_lgbtqia_owned").default(true),
  
  // Business subscription fields (for Stripe)
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status"), // 'active', 'canceled', 'past_due', 'incomplete', 'trialing'
  subscriptionPlan: text("subscription_plan").default("business_monthly"), // Plan type
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  trialEndDate: timestamp("trial_end_date"), // 7-day free trial for new businesses
  
  // Custom pricing fields
  customMonthlyPriceCents: integer("custom_monthly_price_cents"), // Custom price for this business (overrides default)
  signupFeePaidCents: integer("signup_fee_paid_cents"), // One-time signup fee paid
  signupFeePaidDate: timestamp("signup_fee_paid_date"), // When signup fee was paid
  pricingTier: text("pricing_tier").default("standard"), // 'standard', 'premium', 'enterprise', 'custom'
  
  // Deal limits for businesses to prevent spam
  monthlyDealLimit: integer("monthly_deal_limit").default(10), // Default limit of 10 total deals per month (Quick Deals + Regular Deals combined)
  currentMonthDeals: integer("current_month_deals").default(0), // Track current month's deals
  dealLimitResetDate: timestamp("deal_limit_reset_date"), // When to reset the counter
  
  ownerName: text("owner_name"), // Name of business owner for admin contact
  contactName: text("contact_name"), // Name of primary contact person (may be different from owner)
  
  isActive: boolean("is_active").default(true),
  isAdmin: boolean("is_admin").default(false),
  
  // Password reset fields
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  
  // AI Generation fields
  isAIGenerated: boolean("is_ai_generated").default(false),
  aura: integer("aura").default(0), // Travel karma points from blog posts
  
  // Enhanced Status & Presence System
  onlineStatus: text("online_status").default("offline"), // 'online', 'away', 'busy', 'invisible', 'offline'
  customStatus: text("custom_status"), // Custom status message like "Available" or "In a meeting"
  locationBasedStatus: text("location_based_status"), // "In Paris", "At the airport", etc.
  statusEmoji: text("status_emoji"), // Emoji for status (🏠, ✈️, 🌴, etc.)
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  doNotDisturb: boolean("do_not_disturb").default(false),
  doNotDisturbUntil: timestamp("do_not_disturb_until"), // DND end time
  notificationSettings: jsonb("notification_settings"), // Push, desktop, sound preferences
  
  // Travel Intent fields (TangoTrips-inspired)
  travelWhy: text("travel_why"), // Why they travel: adventure, connection, culture, relaxation
  travelHow: text("travel_how"), // How they travel: planner, spontaneous, social, independent
  travelBudget: text("travel_budget"), // Budget range: budget, moderate, premium
  travelGroup: text("travel_group"), // Group type: solo, couple, friends, family
  
  businessName: text("business_name"),
  businessType: text("business_type"),
  businessDescription: text("business_description"),
  street: text("street"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  zipcode: text("zipcode"),
  phone: text("phone"),
  website: text("website"),
  specialty: text("specialty"),
  rating: real("rating"),
  priceRange: text("price_range"),
  tags: text("tags").array(),
  
  // Additional fields for compatibility
  currentCity: text("current_city"), // Current location city
  
  // Avatar customization
  avatarColor: text("avatar_color").default("#3B82F6"), // User's chosen avatar color (default blue)
  avatarGradient: text("avatar_gradient"), // Optional gradient preference for future use
  
  // QR Code & Referral System
  referralCode: varchar("referral_code", { length: 12 }).unique(), // Unique 6-8 char code for QR sharing
  referredBy: integer("referred_by"), // User ID of who referred this user
  referralCount: integer("referral_count").default(0), // How many users they've referred
  qrCodeGeneratedAt: timestamp("qr_code_generated_at"), // When QR code was last generated
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const businessLocations = pgTable("business_locations", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  locationName: text("location_name"), // e.g., "Downtown Location", "Airport Branch"
  streetAddress: text("street_address").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
  zipCode: text("zip_code").notNull(),
  phoneNumber: text("phone_number").notNull(),
  isPrimary: boolean("is_primary").default(false), // One primary location per business
  businessHours: text("business_hours"), // JSON string with hours for each day
  specialInstructions: text("special_instructions"), // Parking, entrance info, etc.
  latitude: real("latitude"),
  longitude: real("longitude"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'rejected'
  connectionNote: text("connection_note"), // Optional note about how they met (e.g., "met at xyz event", "met in Spain")
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id"),
  chatroomId: integer("chatroom_id"), // For group chats
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // 'text', 'image', 'location', 'system', 'photo'
  mediaUrl: text("media_url"), // For photos, files, etc.
  locationData: jsonb("location_data"), // For location sharing
  replyToId: integer("reply_to_id"), // For threaded replies
  reactions: jsonb("reactions"), // For message reactions
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// City Chatrooms
export const citychatrooms = pgTable("city_chatrooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
  createdById: integer("created_by_id").notNull(),
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(true),
  maxMembers: integer("max_members").default(500),
  tags: text("tags").array(),
  rules: text("rules"),
  createdAt: timestamp("created_at").defaultNow(),
});

// City Pages for collaborative city guides
export const cityPages = pgTable("city_pages", {
  id: serial("id").primaryKey(),
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
  createdById: integer("created_by_id").notNull(),
  title: text("title"),
  description: text("description"),
  coverImage: text("cover_image"),
  aboutSection: text("about_section"),
  attractionsSection: text("attractions_section"),
  restaurantsSection: text("restaurants_section"),
  nightlifeSection: text("nightlife_section"),
  localTipsSection: text("local_tips_section"),
  hiddenGemsSection: text("hidden_gems_section"),
  transportationSection: text("transportation_section"),
  weatherSection: text("weather_section"),
  tags: text("tags").array(),
  isPublished: boolean("is_published").default(true),
  featuredImages: text("featured_images").array(),
  contactInfo: jsonb("contact_info"),
  socialLinks: jsonb("social_links"),
  isDeletionProtected: boolean("is_deletion_protected").default(false),
  adminApprovalRequired: boolean("admin_approval_required").default(false),
  contributorCount: integer("contributor_count").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    cityPageUnique: unique().on(table.city, table.state, table.country),
  };
});

// Secret Local Experiences for each city
export const secretLocalExperiences = pgTable("secret_local_experiences", {
  id: serial("id").primaryKey(),
  cityPageId: integer("city_page_id"), // Made optional for user secret activities
  contributorId: integer("contributor_id").notNull(),
  experience: text("experience").notNull(),
  description: text("description"),
  category: text("category"), // 'food', 'activity', 'nightlife', 'culture', 'nature', 'hidden_spot'
  likes: integer("likes").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Secret Local Experience Likes Table (for tracking individual likes)
export const secretLocalExperienceLikes = pgTable("secret_local_experience_likes", {
  id: serial("id").primaryKey(),
  experienceId: integer("experience_id").notNull().references(() => secretLocalExperiences.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique().on(table.experienceId, table.userId)
]);

// Group chat and enhanced messaging support
export const chatroomMessages = pgTable("chatroom_messages", {
  id: serial("id").primaryKey(),
  chatroomId: integer("chatroom_id").notNull().references(() => citychatrooms.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // 'text', 'image', 'system'
  replyToId: integer("reply_to_id"), // Will be set up with self-reference later
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chatroom Members
export const chatroomMembers = pgTable("chatroom_members", {
  id: serial("id").primaryKey(),
  chatroomId: integer("chatroom_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").default("member"), // 'admin', 'moderator', 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
  lastReadAt: timestamp("last_read_at"),
  isMuted: boolean("is_muted").default(false),
  isActive: boolean("is_active").default(true),
}, (table) => [
  unique().on(table.chatroomId, table.userId)
]);

export const chatroomAccessRequests = pgTable("chatroom_access_requests", {
  id: serial("id").primaryKey(),
  chatroomId: integer("chatroom_id").notNull(),
  userId: integer("user_id").notNull(),
  message: text("message"),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  respondedById: integer("responded_by_id"),
  responseMessage: text("response_message"), // Optional message from organizer when accepting/declining
}, (table) => [
  unique().on(table.chatroomId, table.userId) // One request per user per chatroom
]);

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  venueName: text("venue_name"), // Name of the venue (e.g., "Jameson Pub")
  street: text("street").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull().default("United States"),
  zipcode: text("zipcode").notNull(),
  location: text("location").notNull(), // Combined display address
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date"), // Optional end time for events
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  organizerId: integer("organizer_id").notNull(),
  maxParticipants: integer("max_participants"), // null = unlimited
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(true), // Public or invite-only
  tags: text("tags").array(), // Event tags for filtering
  requirements: text("requirements"), // Any requirements to join
  postToInstagram: boolean("post_to_instagram").default(false), // Whether to post to Instagram
  latitude: decimal("latitude", { precision: 10, scale: 8 }), // GPS coordinates for map display
  longitude: decimal("longitude", { precision: 11, scale: 8 }), // GPS coordinates for map display
  
  // Couchsurfing-style spontaneous meetup fields
  eventType: text("event_type").default("planned"), // 'planned', 'spontaneous', 'hangout'
  meetingPoint: text("meeting_point"), // Specific meeting location
  isSpontaneous: boolean("is_spontaneous").default(false), // Quick last-minute meetups
  costEstimate: text("cost_estimate"), // "Free", "$10-15", "$$", etc.
  responseTime: text("response_time").default("ASAP"), // How quickly host responds
  urgency: text("urgency").default("normal"), // 'urgent', 'normal', 'flexible'
  minParticipants: integer("min_participants").default(1), // Minimum to proceed
  autoCancel: boolean("auto_cancel").default(false), // Cancel if min not met
  
  // Recurring event fields
  isRecurring: boolean("is_recurring").default(false), // Whether this event repeats
  recurrenceType: text("recurrence_type"), // 'daily', 'weekly', 'biweekly', 'monthly', 'custom'
  recurrencePattern: jsonb("recurrence_pattern"), // Detailed recurrence settings (e.g., which days of week)
  recurrenceEnd: timestamp("recurrence_end"), // When recurrence stops
  parentEventId: integer("parent_event_id"), // Links to original event for recurring instances
  instanceDate: timestamp("instance_date"), // Original date of this recurring instance
  
  createdAt: timestamp("created_at").defaultNow(),
});

// New table for event participants/attendees
export const eventParticipants = pgTable("event_participants", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("joined"), // 'invited', 'joined', 'declined', 'pending'
  role: text("role").default("participant"), // 'organizer', 'participant', 'co-organizer'
  joinedAt: timestamp("joined_at").defaultNow(),
  notes: text("notes"), // Participant notes or message when joining
});

export const travelPlans = pgTable("travel_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  destination: text("destination").notNull(),
  destinationCity: text("destination_city"),
  destinationState: text("destination_state"),
  destinationCountry: text("destination_country"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  interests: text("interests").array(),
  activities: text("activities").array(),
  events: text("events").array(),
  travelStyle: text("travel_style").array(), // Solo, couple, friends, business, etc.
  accommodation: text("accommodation"), // Hotel, Airbnb, hostel, etc.
  transportation: text("transportation"), // Flight, train, car, etc.
  notes: text("notes"), // Additional notes about the trip
  autoTags: text("auto_tags").array(), // Auto-generated tags from notes
  status: text("status").default("planned"), // Status determined by dates
  createdAt: timestamp("created_at").defaultNow(),
});

// Trip Itineraries - Detailed daily schedules for travel plans
export const tripItineraries = pgTable("trip_itineraries", {
  id: serial("id").primaryKey(),
  travelPlanId: integer("travel_plan_id").notNull(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(), // "Milan Adventure", "Rome Food Tour", etc.
  description: text("description"),
  isPublic: boolean("is_public").default(false), // Can others view/copy this itinerary
  isTemplate: boolean("is_template").default(false), // Mark as reusable template
  tags: text("tags").array(), // "foodie", "budget", "luxury", "solo", etc.
  totalCost: real("total_cost").default(0), // Total cost of the itinerary
  currency: text("currency").default("USD"), // Currency for costs
  savedToPastTrips: boolean("saved_to_past_trips").default(false), // Auto-save completed itineraries
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily Itinerary Items - Specific activities for each day
export const itineraryItems = pgTable("itinerary_items", {
  id: serial("id").primaryKey(),
  itineraryId: integer("itinerary_id").notNull(),
  date: timestamp("date").notNull(), // Specific date for this activity
  startTime: text("start_time"), // "12:00", "13:30", etc.
  endTime: text("end_time"), // Optional end time
  title: text("title").notNull(), // "Walking Tour", "Lunch at Pizza Joint"
  description: text("description"), // Additional details
  location: text("location"), // "Piazza del Duomo", "Tony's Pizza Palace"
  address: text("address"), // Full address if available
  category: text("category"), // "food", "sightseeing", "shopping", "transport", etc.
  cost: real("cost"), // Estimated cost
  currency: text("currency").default("USD"),
  duration: integer("duration"), // Duration in minutes
  notes: text("notes"), // Personal notes
  url: text("url"), // Website or booking link
  phoneNumber: text("phone_number"), // Contact number
  orderIndex: integer("order_index").notNull(), // Order within the day
  isCompleted: boolean("is_completed").default(false), // Mark as done during trip
  createdAt: timestamp("created_at").defaultNow(),
});

// Shared Itineraries - Allow sharing itineraries with other users
export const sharedItineraries = pgTable("shared_itineraries", {
  id: serial("id").primaryKey(),
  itineraryId: integer("itinerary_id").notNull(),
  sharedByUserId: integer("shared_by_user_id").notNull(),
  sharedWithUserId: integer("shared_with_user_id"),
  shareType: text("share_type").notNull(), // "public", "private", "link"
  shareToken: text("share_token"), // Unique token for link sharing
  canEdit: boolean("can_edit").default(false),
  canCopy: boolean("can_copy").default(true),
  expiresAt: timestamp("expires_at"), // Optional expiration
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPhotos = pgTable("user_photos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  imageUrl: text("image_url").notNull(),
  imageData: text("image_data"), // Base64 encoded image data
  caption: text("caption"),
  isPrivate: boolean("is_private").default(false),
  isProfilePhoto: boolean("is_profile_photo").default(false),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});



export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Who receives the notification
  fromUserId: integer("from_user_id"), // Who triggered the notification (optional)
  type: text("type").notNull(), // "connection_request", "connection_accepted", "event_invite", etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: text("data"), // JSON data for additional context
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User blocking system
export const blockedUsers = pgTable("blocked_users", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull(), // User who is doing the blocking
  blockedId: integer("blocked_id").notNull(), // User who is being blocked
  reason: text("reason"), // Optional reason for blocking
  blockedAt: timestamp("blocked_at").defaultNow(),
}, (table) => [
  unique().on(table.blockerId, table.blockedId), // Prevent duplicate blocks
]);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isActive: true,
}).extend({
  username: z.string().min(6, "Username must be 6-13 characters").max(13, "Username must be 6-13 characters"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  bio: z.string().min(30, "Bio must be at least 30 characters long").optional(),
});

export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  isActive: true,
});

export const insertTravelPlanSchema = createInsertSchema(travelPlans).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export const insertBlockedUserSchema = createInsertSchema(blockedUsers).omit({
  id: true,
  blockedAt: true,
});

export const insertUserPhotoSchema = createInsertSchema(userPhotos).omit({
  id: true,
  uploadedAt: true,
});



export const insertEventParticipantSchema = createInsertSchema(eventParticipants).omit({
  id: true,
  joinedAt: true,
  status: true,
  role: true,
});

export type User = typeof users.$inferSelect;

// City photos table for user-uploaded cover images
export const cityPhotos = pgTable("city_photos", {
  id: serial("id").primaryKey(),
  city: varchar("city").notNull(),
  state: varchar("state"),
  country: varchar("country").notNull(),
  imageUrl: text("image_url").notNull(),
  photographerName: varchar("photographer_name").notNull(),
  photographerUsername: varchar("photographer_username").notNull(),
  photographerId: integer("photographer_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  votes: integer("votes").default(0),
  version: integer("version").notNull().default(0),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  moderatedBy: integer("moderated_by").references(() => users.id),
});

export type CityPhoto = typeof cityPhotos.$inferSelect;
export type InsertCityPhoto = typeof cityPhotos.$inferInsert;



// Business Subscriptions - Manage business plan limits
export const businessSubscriptions = pgTable("business_subscriptions", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscriptionType: text("subscription_type").default("free"), // 'free', 'premium'
  daysUsedThisMonth: integer("days_used_this_month").default(0),
  monthlyDayLimit: integer("monthly_day_limit").default(5),
  currentMonth: integer("current_month").default(new Date().getMonth() + 1),
  currentYear: integer("current_year").default(new Date().getFullYear()),
  lastActiveDate: timestamp("last_active_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique().on(table.businessId), // One subscription per business
]);

export type BusinessSubscription = typeof businessSubscriptions.$inferSelect;
export type InsertBusinessSubscription = typeof businessSubscriptions.$inferInsert;

// Secret experience likes table (experienceId now references user IDs since experiences come from user profiles)
export const secretExperienceLikes = pgTable("secret_experience_likes", {
  id: serial("id").primaryKey(),
  experienceId: integer("experience_id").notNull(), // This is actually the contributor's user ID
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique().on(table.experienceId, table.userId), // One like per user per experience
]);

export type SecretExperienceLike = typeof secretExperienceLikes.$inferSelect;
export type InsertSecretExperienceLike = typeof secretExperienceLikes.$inferInsert;

// Hosting offers table (Couchsurfing-style hosting)
export const hostingOffers = pgTable("hosting_offers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  offerType: text("offer_type").notNull(), // 'couch', 'private_room', 'shared_room', 'coffee_meetup', 'city_tour', 'local_advice'
  title: text("title").notNull(),
  description: text("description").notNull(),
  maxGuests: integer("max_guests").notNull().default(1),
  availableFrom: timestamp("available_from").notNull(),
  availableTo: timestamp("available_to").notNull(),
  isActive: boolean("is_active").default(true),
  requirements: text("requirements"),
  amenities: text("amenities").array(),
  responseRate: integer("response_rate").default(95), // Percentage
  responseTime: text("response_time").default("within a day"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel Memories table
export const photoAlbums = pgTable("photo_albums", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date"), // Start date for trips/albums
  endDate: timestamp("end_date"), // End date for trips/albums  
  location: text("location"),
  photos: text("photos").array().notNull(), // Array of photo URLs
  coverPhoto: text("cover_photo"), // Main photo for the album
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Emergency contacts table (safety feature)
export const emergencyContacts = pgTable("emergency_contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  relationship: text("relationship").notNull(),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User verifications table (trust system)
export const verifications = pgTable("verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  verificationType: text("verification_type").notNull(), // 'email', 'phone', 'government_id', 'address', 'social_media'
  verificationStatus: text("verification_status").default("pending"), // 'pending', 'verified', 'rejected'
  verifiedAt: timestamp("verified_at"),
  verifiedBy: text("verified_by"),
  verificationData: text("verification_data"), // Encrypted/hashed verification details
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique().on(table.userId, table.verificationType), // One verification per type per user
]);

// References table (community feedback system)
export const references = pgTable("references", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toUserId: integer("to_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referenceType: text("reference_type").notNull(), // 'positive', 'negative', 'neutral'
  category: text("category").notNull(), // 'hosting', 'surfing', 'meetup', 'travel_buddy', 'local_guide'
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title").notNull(),
  content: text("content").notNull(),
  isPublic: boolean("is_public").default(true),
  helpfulVotes: integer("helpful_votes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique().on(table.fromUserId, table.toUserId, table.category), // One reference per category per user pair
]);

// Reference votes table (helpful voting system)
export const referenceVotes = pgTable("reference_votes", {
  id: serial("id").primaryKey(),
  referenceId: integer("reference_id").notNull().references(() => references.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isHelpful: boolean("is_helpful").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique().on(table.referenceId, table.userId), // One vote per user per reference
]);

// VOUCH system - Invite-only credibility network
export const vouches = pgTable("vouches", {
  id: serial("id").primaryKey(),
  voucherUserId: integer("voucher_user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Who gave the vouch
  vouchedUserId: integer("vouched_user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Who received the vouch  
  vouchMessage: text("vouch_message"), // Optional personal message
  vouchCategory: text("vouch_category").notNull().default("general"), // 'general', 'trustworthy', 'great_host', 'travel_buddy', 'local_expert'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique().on(table.voucherUserId, table.vouchedUserId, table.vouchCategory), // One vouch per category per user pair
]);

// Track vouch credits (how many people each user can vouch for)
export const vouchCredits = pgTable("vouch_credits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalCredits: integer("total_credits").notNull().default(0), // Total vouch credits earned
  usedCredits: integer("used_credits").notNull().default(0), // Credits already used
  availableCredits: integer("available_credits").notNull().default(0), // Remaining credits to give
  seedMember: boolean("seed_member").notNull().default(false), // Original founding member (nearbytraveler)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique().on(table.userId), // One credit record per user
]);

// Local hangouts table (spontaneous meetups)
export const hangouts = pgTable("hangouts", {
  id: serial("id").primaryKey(),
  hostId: integer("host_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'coffee', 'drinks', 'food', 'sightseeing', 'nightlife', 'outdoor', 'cultural', 'sports'
  location: text("location").notNull(),
  meetingPoint: text("meeting_point").notNull(),
  datetime: timestamp("datetime").notNull(),
  maxParticipants: integer("max_participants").notNull().default(4),
  currentParticipants: integer("current_participants").default(1), // Host counts as first participant
  isPublic: boolean("is_public").default(true),
  requirements: text("requirements"),
  costEstimate: text("cost_estimate"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Hangout participants table
export const hangoutParticipants = pgTable("hangout_participants", {
  id: serial("id").primaryKey(),
  hangoutId: integer("hangout_id").notNull().references(() => hangouts.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("joined"), // 'joined', 'left', 'pending'
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  unique().on(table.hangoutId, table.userId), // One participation record per user per hangout
]);

export type InsertUser = z.infer<typeof insertUserSchema>;

// Travel Memories schema
export const insertPhotoAlbumSchema = createInsertSchema(photoAlbums).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PhotoAlbum = typeof photoAlbums.$inferSelect;
export type InsertPhotoAlbum = z.infer<typeof insertPhotoAlbumSchema>;

// Type alias for users with travel plan data (same as User since fields already exist)
export type UserWithTravelPlan = User;
export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventParticipant = typeof eventParticipants.$inferSelect;
export type InsertEventParticipant = z.infer<typeof insertEventParticipantSchema>;

// EventParticipant with joined user data (as returned by getEventParticipants)
export type EventParticipantWithUser = EventParticipant & {
  user: {
    id: number;
    username: string;
    name: string;
    profileImage: string | null;
    userType: string;
  };
  isEventCreator?: boolean;
};
export type TravelPlan = typeof travelPlans.$inferSelect;
export type InsertTravelPlan = z.infer<typeof insertTravelPlanSchema>;
export type UserPhoto = typeof userPhotos.$inferSelect;
export type InsertUserPhoto = z.infer<typeof insertUserPhotoSchema>;
export type TravelMemory = typeof travelMemories.$inferSelect;
export type InsertTravelMemory = z.infer<typeof insertTravelMemorySchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Vouch system types
export const insertVouchSchema = createInsertSchema(vouches).omit({
  id: true,
  createdAt: true,
});

export const insertVouchCreditsSchema = createInsertSchema(vouchCredits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Vouch = typeof vouches.$inferSelect;
export type InsertVouch = z.infer<typeof insertVouchSchema>;
export type VouchCredits = typeof vouchCredits.$inferSelect;
export type InsertVouchCredits = z.infer<typeof insertVouchCreditsSchema>;

// Extended types for vouch data with user information
export type VouchWithUsers = Vouch & {
  voucher: {
    id: number;
    username: string;
    name: string;
    profileImage: string | null;
  };
  vouched: {
    id: number;
    username: string;
    name: string;
    profileImage: string | null;
  };
};

// Quick Meetups - Separate from regular events to avoid cluttering
export const quickMeetups = pgTable("quick_meetups", {
  id: serial("id").primaryKey(),
  organizerId: integer("organizer_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  meetingPoint: text("meeting_point").notNull(),
  street: text("street"), // Street address
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
  zipcode: text("zipcode"),
  availableAt: timestamp("available_at").notNull(), // When they're available
  expiresAt: timestamp("expires_at").notNull(), // Auto-expire after 24 hours
  maxParticipants: integer("max_participants").notNull().default(10),
  minParticipants: integer("min_participants").notNull().default(2),
  costEstimate: text("cost_estimate"),
  availability: text("availability").notNull(), // "1hour", "3hours", "today", "tomorrow", "week"
  responseTime: text("response_time").notNull().default("ASAP"),
  autoCancel: boolean("auto_cancel").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  participantCount: integer("participant_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quickMeetupParticipants = pgTable("quick_meetup_participants", {
  id: serial("id").primaryKey(),
  meetupId: integer("meetup_id").notNull().references(() => quickMeetups.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("joined"), // 'joined', 'maybe', 'declined'
  notes: text("notes"), // User's note when joining
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  unique().on(table.meetupId, table.userId),
]);

// Automatic chatrooms for quick meetup participants (expires with meetup)
export const meetupChatrooms = pgTable("meetup_chatrooms", {
  id: serial("id").primaryKey(),
  meetupId: integer("meetup_id").references(() => quickMeetups.id),
  eventId: integer("event_id").references(() => events.id),
  chatroomName: text("chatroom_name").notNull(),
  description: text("description"),
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
  latitude: real("latitude"), // For map integration
  longitude: real("longitude"), // For map integration
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at").notNull(), // Same as meetup expiry
  participantCount: integer("participant_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const meetupChatroomMessages = pgTable("meetup_chatroom_messages", {
  id: serial("id").primaryKey(),
  meetupChatroomId: integer("meetup_chatroom_id").notNull().references(() => meetupChatrooms.id),
  userId: integer("user_id").notNull().references(() => users.id),
  username: text("username").notNull(),
  message: text("message").notNull(),
  messageType: text("message_type").default("text"), // 'text', 'location', 'meetup_update'
  sentAt: timestamp("sent_at").defaultNow(),
});

export const moodEntries = pgTable("mood_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  emoji: text("emoji").notNull(),
  moodType: text("mood_type").notNull(), // 'daily', 'activity', 'location', 'event'
  rating: integer("rating").notNull(), // 1-5 scale
  notes: text("notes"),
  location: text("location"),
  activityName: text("activity_name"),
  eventId: integer("event_id").references(() => events.id),
  travelPlanId: integer("travel_plan_id").references(() => travelPlans.id),
  entryDate: timestamp("entry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries);

export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;

// Quick Deals - Business equivalent of quick meetups for promotions/offers
export const quickDeals = pgTable("quick_deals", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => users.id), // Business user ID
  title: text("title").notNull(),
  description: text("description").notNull(),
  dealType: text("deal_type").notNull(), // 'discount', 'bogo', 'happy_hour', 'special_offer', 'flash_sale'
  category: text("category").notNull(), // 'food', 'drinks', 'shopping', 'services', 'entertainment'
  location: text("location").notNull(), // Business address
  street: text("street"), // Street address
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
  zipcode: text("zipcode"),
  discountAmount: text("discount_amount"), // "20%", "$5 off", "Buy 1 Get 1"
  originalPrice: text("original_price"),
  salePrice: text("sale_price"),
  validFrom: timestamp("valid_from").notNull(), // When deal starts
  validUntil: timestamp("valid_until").notNull(), // When deal expires
  maxRedemptions: integer("max_redemptions").default(100), // Limit how many can use it
  currentRedemptions: integer("current_redemptions").default(0),
  requiresReservation: boolean("requires_reservation").default(false),
  dealCode: text("deal_code"), // Promo code if needed
  terms: text("terms"), // Terms and conditions
  availability: text("availability").notNull(), // "now", "today", "weekend", "week"
  isActive: boolean("is_active").notNull().default(true),
  autoExpire: boolean("auto_expire").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Track users who claimed/redeemed quick deals
export const quickDealRedemptions = pgTable("quick_deal_redemptions", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull().references(() => quickDeals.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("claimed"), // 'claimed', 'redeemed', 'expired'
  claimedAt: timestamp("claimed_at").defaultNow(),
  redeemedAt: timestamp("redeemed_at"),
  notes: text("notes"), // User notes or special requests
}, (table) => [
  unique().on(table.dealId, table.userId), // One redemption per user per deal
]);

// City Activities - City-specific activities that users can be interested in
export const cityActivities = pgTable("city_activities", {
  id: serial("id").primaryKey(),
  cityName: text("city_name").notNull(),
  state: text("state"),
  country: text("country").notNull().default("United States"),
  activityName: text("activity_name").notNull(),
  description: text("description").notNull(),
  category: text("category").default("general"), // 'outdoor', 'cultural', 'food', 'nightlife', 'adventure', 'relaxation'
  createdByUserId: integer("created_by_user_id").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique().on(table.cityName, table.activityName), // One activity per name per city
]);

// User City Interests - Which activities users are interested in for specific cities
export const userCityInterests = pgTable("user_city_interests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cityName: text("city_name").notNull(),
  activityId: integer("activity_id").notNull().references(() => cityActivities.id, { onDelete: "cascade" }),
  activityName: text("activity_name").notNull(), // Denormalized for quick access
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique().on(table.userId, table.activityId), // One interest per user per activity
]);

// User Event Interests - Which events users are interested in for specific cities
export const userEventInterests = pgTable("user_event_interests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cityName: text("city_name").notNull(),
  eventId: integer("event_id").references(() => events.id, { onDelete: "cascade" }), // Internal events
  externalEventId: text("external_event_id"), // External events (ticketmaster-xyz, meetup-abc, etc.)
  eventTitle: text("event_title").notNull(), // Denormalized for quick access
  eventSource: text("event_source").notNull().default("internal"), // 'internal', 'ticketmaster', 'meetup', 'stubhub', 'local-la', 'allevents'
  eventData: jsonb("event_data"), // Store full event data for external events
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique().on(table.userId, table.eventId, table.externalEventId), // One interest per user per event (internal or external)
]);

export const insertCityActivitySchema = createInsertSchema(cityActivities).omit({ id: true });
export const insertUserCityInterestSchema = createInsertSchema(userCityInterests).omit({ id: true });
export const insertUserEventInterestSchema = createInsertSchema(userEventInterests).omit({ id: true });

export type CityActivity = typeof cityActivities.$inferSelect;
export type InsertCityActivity = z.infer<typeof insertCityActivitySchema>;
export type UserCityInterest = typeof userCityInterests.$inferSelect;
export type InsertUserCityInterest = z.infer<typeof insertUserCityInterestSchema>;
export type UserEventInterest = typeof userEventInterests.$inferSelect;
export type InsertUserEventInterest = z.infer<typeof insertUserEventInterestSchema>;

// Passport Stamps - Gamified collection system
export const passportStamps = pgTable("passport_stamps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  country: text("country").notNull(),
  city: text("city").notNull(),
  stampType: text("stamp_type").notNull(), // 'arrival', 'event', 'milestone', 'hidden'
  category: text("category").notNull(), // 'destination', 'activity', 'culture', 'nature', 'nightlife', 'food'
  title: text("title").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url"),
  rarity: text("rarity").notNull().default('common'), // 'common', 'rare', 'epic', 'legendary'
  pointsValue: integer("points_value").notNull().default(10),
  latitude: real("latitude"),
  longitude: real("longitude"),
  eventId: integer("event_id").references(() => events.id),
  travelPlanId: integer("travel_plan_id").references(() => travelPlans.id),
  unlockedAt: timestamp("unlocked_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Achievement system for passport collections
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementType: text("achievement_type").notNull(), // 'country_collector', 'activity_master', 'social_butterfly', etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url"),
  badgeLevel: text("badge_level").notNull(), // 'bronze', 'silver', 'gold', 'platinum'
  pointsAwarded: integer("points_awarded").notNull().default(0),
  requirement: integer("requirement").notNull(), // Number needed to unlock
  progress: integer("progress").notNull().default(0),
  isUnlocked: boolean("is_unlocked").notNull().default(false),
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User stats and leaderboard
export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  totalStamps: integer("total_stamps").notNull().default(0),
  totalPoints: integer("total_points").notNull().default(0),
  countriesVisited: integer("countries_visited").notNull().default(0),
  citiesVisited: integer("cities_visited").notNull().default(0),
  eventsAttended: integer("events_attended").notNull().default(0),
  connectionsRemade: integer("connections_made").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  level: integer("level").notNull().default(1),
  experiencePoints: integer("experience_points").notNull().default(0),
  lastActivityDate: timestamp("last_activity_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel Memories Table
export const travelMemories = pgTable("travel_memories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  destination: text("destination").notNull(),
  photos: text("photos").array().notNull(), // Array of photo URLs
  description: text("description").notNull(),
  date: timestamp("date").notNull(), // Date of the travel memory
  tags: text("tags").array(), // Tags like 'adventure', 'food', 'culture'
  city: text("city").notNull(),
  country: text("country").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel Memory Likes Table
export const travelMemoryLikes = pgTable("travel_memory_likes", {
  id: serial("id").primaryKey(),
  memoryId: integer("memory_id").notNull().references(() => travelMemories.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});



// Travel Memory Comments Table
export const travelMemoryComments = pgTable("travel_memory_comments", {
  id: serial("id").primaryKey(),
  memoryId: integer("memory_id").notNull().references(() => travelMemories.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPassportStampSchema = createInsertSchema(passportStamps).omit({
  id: true,
  unlockedAt: true,
  createdAt: true,
});
export const insertAchievementSchema = createInsertSchema(achievements);
export const insertUserStatsSchema = createInsertSchema(userStats);

export const insertTravelMemorySchema = createInsertSchema(travelMemories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likes: true,
  comments: true,
});
export const insertTravelMemoryLikeSchema = createInsertSchema(travelMemoryLikes).omit({
  id: true,
  createdAt: true,
});
export const insertTravelMemoryCommentSchema = createInsertSchema(travelMemoryComments).omit({
  id: true,
  createdAt: true,
});

// External event interests and attendance tracking
export const externalEventInterests = pgTable("external_event_interests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventId: text("event_id").notNull(), // External event ID
  eventTitle: text("event_title").notNull(),
  eventDate: text("event_date").notNull(),
  eventVenue: text("event_venue"),
  eventUrl: text("event_url"),
  eventSource: text("event_source").notNull(), // 'ticketmaster', 'local-la', etc.
  interestType: text("interest_type").notNull(), // 'interested', 'going', 'attended'
  addedToItinerary: boolean("added_to_itinerary").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique().on(table.userId, table.eventId, table.eventSource), // One interest per user per event
]);

export type ExternalEventInterest = typeof externalEventInterests.$inferSelect;
export type InsertExternalEventInterest = typeof externalEventInterests.$inferInsert;

export const insertExternalEventInterestSchema = createInsertSchema(externalEventInterests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});



// Travel Blog Posts Table
export const travelBlogPosts = pgTable("travel_blog_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  location: text("location"), // City, State, Country
  city: text("city"),
  state: text("state"),
  country: text("country"),
  imageUrl: text("image_url"),
  tags: text("tags").array(),
  likes: integer("likes").default(1),
  views: integer("views").default(0),
  aura: integer("aura").default(0), // Points earned from this post
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel Blog Likes Table
export const travelBlogLikes = pgTable("travel_blog_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => travelBlogPosts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueLike: unique().on(table.postId, table.userId),
}));

// Travel Blog Comments Table
export const travelBlogComments = pgTable("travel_blog_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => travelBlogPosts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  parentCommentId: integer("parent_comment_id"),
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  aura: integer("aura").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Travel Blog Comment Likes Table
export const travelBlogCommentLikes = pgTable("travel_blog_comment_likes", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").notNull().references(() => travelBlogComments.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueLike: unique().on(table.commentId, table.userId),
}));

// User References/Reviews Table - Simplified
export const userReferences = pgTable("user_references", {
  id: serial("id").primaryKey(),
  reviewerId: integer("reviewer_id").notNull(), // User giving the reference
  revieweeId: integer("reviewee_id").notNull(), // User receiving the reference
  experience: text("experience").default("positive"), // 'positive', 'neutral', 'negative'
  content: text("content"), // Reference text about the person
  createdAt: timestamp("created_at").defaultNow(),
});

// Referral System Table
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull(), // User who made the referral
  referredUserId: integer("referred_user_id"), // User who was referred (null if not signed up yet)
  referralCode: text("referral_code").notNull().unique(), // Unique referral code
  referredEmail: text("referred_email"), // Email of referred person
  referredName: text("referred_name"), // Name of referred person
  status: text("status").notNull().default("pending"), // 'pending', 'signed_up', 'completed_profile', 'first_connection', 'first_event'
  referralSource: text("referral_source"), // How they were referred ('email', 'social', 'in_person', 'event')
  completedAt: timestamp("completed_at"), // When referral was completed
  rewardEarned: boolean("reward_earned").default(false),
  rewardType: text("reward_type"), // Type of reward earned
  notes: text("notes"), // Additional notes about the referral
  createdAt: timestamp("created_at").defaultNow(),
});



// Quick Meetup Templates Table for reusable meetup configurations
export const quickMeetupTemplates = pgTable("quick_meetup_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  templateName: text("template_name").notNull(), // User-defined name like "Coffee Chat", "Quick Bite"
  category: text("category").notNull(), // social, food, drinks, sightseeing, shopping, outdoor, custom
  title: text("title").notNull(), // "Coffee at Starbucks", "Quick bite..."
  description: text("description"),
  customCategory: text("custom_category"), // If category is 'custom'
  maxParticipants: integer("max_participants").default(4),
  costEstimate: text("cost_estimate").default("Free"),
  defaultDuration: text("default_duration").default("1hour"), // 1hour, 2hours, 3hours, 4hours, allday
  minParticipants: integer("min_participants").default(2),
  timesUsed: integer("times_used").default(0), // Track usage frequency
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
});

// User Reputation Summary Table
export const userReputation = pgTable("user_reputation", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  totalReferences: integer("total_references").default(0),
  positiveReferences: integer("positive_references").default(0), // "would meet again" count
  negativeReferences: integer("negative_references").default(0), // "would not meet again" count
  verifiedMeetings: integer("verified_meetings").default(0),
  meetAgainRate: real("meet_again_rate").default(0), // Percentage of "would meet again"
  referralsMade: integer("referrals_made").default(0),
  successfulReferrals: integer("successful_referrals").default(0),
  reputationLevel: text("reputation_level").default("newcomer"), // 'newcomer', 'trusted', 'expert', 'ambassador'
  badges: text("badges").array(), // Achievement badges like 'super_host', 'great_guide', 'connector'
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Custom Location Activities - User-contributed specific activities/interests/events
export const customLocationActivities = pgTable("custom_location_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // User who added this custom activity
  title: text("title").notNull(), // e.g., "Picasso Museum", "Hollywood Sign Walk"
  description: text("description"), // Optional description
  category: text("category").notNull(), // 'activity', 'interest', 'event'
  city: text("city").notNull(),
  state: text("state"), // Optional for international locations
  country: text("country").notNull(),
  verified: boolean("verified").default(false), // Admin verification
  upvotes: integer("upvotes").default(0), // Community validation
  downvotes: integer("downvotes").default(0),
  tags: text("tags").array(), // Searchable tags
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Custom Activity Selections - Track which users selected which custom activities
export const userCustomActivities = pgTable("user_custom_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  customActivityId: integer("custom_activity_id").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => ({
  userActivityUnique: unique().on(table.userId, table.customActivityId),
}));

// Reference Response Table (for replies to references)
export const referenceResponses = pgTable("reference_responses", {
  id: serial("id").primaryKey(),
  referenceId: integer("reference_id").notNull(),
  responderId: integer("responder_id").notNull(), // User responding to the reference
  content: text("content").notNull(),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Business Offers - Businesses can promote deals and services
export const businessOffers = pgTable("business_offers", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(), // User ID of business account
  title: text("title").notNull(), // "20% off dinner", "Free tour for locals"
  description: text("description").notNull(), // Detailed offer description
  category: text("category").notNull(), // 'restaurant', 'hotel', 'activity', 'retail', 'service', 'entertainment'
  discountType: text("discount_type").notNull(), // 'percentage', 'fixed_amount', 'buy_one_get_one', 'free_service', 'free_item_with_purchase', 'combo_deal', 'other'
  discountValue: text("discount_value"), // "20", "$50", "BOGO", "free"
  discountCode: text("discount_code"), // Optional promo code
  targetAudience: text("target_audience").array(), // ['locals', 'travelers', 'both']
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  maxRedemptions: integer("max_redemptions"), // Optional total limit
  maxRedemptionsPerUser: integer("max_redemptions_per_user"), // Optional per-user limit
  currentRedemptions: integer("current_redemptions").default(0),
  isActive: boolean("is_active").default(true),
  imageUrl: text("image_url"), // Optional offer image
  termsConditions: text("terms_conditions"), // Fine print
  contactInfo: text("contact_info"), // Phone/email for redemption
  websiteUrl: text("website_url"), // Business website
  tags: text("tags").array(), // Searchable tags like 'vegan', 'outdoor', 'family-friendly'
  viewCount: integer("view_count").default(0),
  monthCreated: integer("month_created"), // Month when deal was created (1-12)
  yearCreated: integer("year_created"), // Year when deal was created
  autoRenewMonthly: boolean("auto_renew_monthly").default(false), // Auto-renew deal every month
  isTemplate: boolean("is_template").default(false), // Template for auto-renewal
  pausedDueToPayment: boolean("paused_due_to_payment").default(false), // Hidden when subscription lapses
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business Offer Redemptions - Track when offers are used
export const businessOfferRedemptions = pgTable("business_offer_redemptions", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id").notNull(),
  userId: integer("user_id").notNull(), // User who redeemed
  redemptionCode: text("redemption_code"), // Unique code for this redemption
  redeemedAt: timestamp("redeemed_at").defaultNow(),
  verifiedByBusiness: boolean("verified_by_business").default(false),
  notes: text("notes"), // Optional notes from business or user
});

// Create insert schemas
export const insertUserReferenceSchema = createInsertSchema(userReferences).omit({
  id: true,
  createdAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
});

export const insertUserReputationSchema = createInsertSchema(userReputation).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export const insertReferenceResponseSchema = createInsertSchema(referenceResponses).omit({
  id: true,
  createdAt: true,
});

export const insertCustomLocationActivitySchema = createInsertSchema(customLocationActivities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserCustomActivitySchema = createInsertSchema(userCustomActivities).omit({
  id: true,
  addedAt: true,
});

export const insertBusinessOfferSchema = createInsertSchema(businessOffers).omit({
  id: true,
  currentRedemptions: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBusinessOfferRedemptionSchema = createInsertSchema(businessOfferRedemptions).omit({
  id: true,
  redeemedAt: true,
});

export const insertBusinessLocationSchema = createInsertSchema(businessLocations).omit({
  id: true,
  createdAt: true,
});

export type BusinessLocation = typeof businessLocations.$inferSelect;
export type InsertBusinessLocation = z.infer<typeof insertBusinessLocationSchema>;

export type PassportStamp = typeof passportStamps.$inferSelect;
export type InsertPassportStamp = z.infer<typeof insertPassportStampSchema>;

export type CustomLocationActivity = typeof customLocationActivities.$inferSelect;
export type InsertCustomLocationActivity = z.infer<typeof insertCustomLocationActivitySchema>;

export type BusinessOffer = typeof businessOffers.$inferSelect;
export type InsertBusinessOffer = z.infer<typeof insertBusinessOfferSchema>;

// Extended BusinessOffer with business information for API responses
export type BusinessOfferWithBusiness = BusinessOffer & {
  businessName?: string;
  fallbackName?: string;
  businessLocation?: string;
  businessImage?: string;
  businessPhone?: string;
  businessAddress?: string;
  businessWebsite?: string;
};

export type BusinessOfferRedemption = typeof businessOfferRedemptions.$inferSelect;
export type InsertBusinessOfferRedemption = z.infer<typeof insertBusinessOfferRedemptionSchema>;
export type BusinessReferral = typeof businessReferrals.$inferSelect;
export type InsertBusinessReferral = z.infer<typeof insertBusinessReferralSchema>;
export type UserCustomActivity = typeof userCustomActivities.$inferSelect;
export type InsertUserCustomActivity = z.infer<typeof insertUserCustomActivitySchema>;

export type TravelMemoryLike = typeof travelMemoryLikes.$inferSelect;
export type InsertTravelMemoryLike = z.infer<typeof insertTravelMemoryLikeSchema>;
export type TravelMemoryComment = typeof travelMemoryComments.$inferSelect;
export type InsertTravelMemoryComment = z.infer<typeof insertTravelMemoryCommentSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;

// New reference system types
export type UserReference = typeof userReferences.$inferSelect;
export type InsertUserReference = z.infer<typeof insertUserReferenceSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type UserReputation = typeof userReputation.$inferSelect;
export type InsertUserReputation = z.infer<typeof insertUserReputationSchema>;
export type ReferenceResponse = typeof referenceResponses.$inferSelect;
export type InsertReferenceResponse = z.infer<typeof insertReferenceResponseSchema>;



// Smart Location-based Recommendations
export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Who created this recommendation (null for system-generated)
  type: text("type").notNull(), // 'place', 'activity', 'restaurant', 'event', 'accommodation', 'hidden_gem'
  title: text("title").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  category: text("category"), // 'cultural', 'adventure', 'food', 'nightlife', 'nature', 'shopping', 'historical'
  tags: text("tags").array(),
  rating: real("rating"), // 1-5 stars
  priceRange: text("price_range"), // '$', '$$', '$$$', '$$$$'
  coordinates: jsonb("coordinates"), // {lat: number, lng: number}
  imageUrl: text("image_url"),
  website: text("website"),
  openingHours: jsonb("opening_hours"), // {monday: '9am-6pm', etc}
  contactInfo: jsonb("contact_info"), // {phone, email, address}
  bestTimeToVisit: text("best_time_to_visit"),
  duration: text("duration"), // '1-2 hours', 'half day', 'full day'
  accessibility: text("accessibility").array(),
  localTips: text("local_tips"),
  crowdLevel: text("crowd_level"), // 'low', 'medium', 'high'
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userRecommendationInteractions = pgTable("user_recommendation_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  recommendationId: integer("recommendation_id").notNull().references(() => recommendations.id),
  interactionType: text("interaction_type").notNull(), // 'view', 'save', 'like', 'visited', 'not_interested', 'shared'
  rating: integer("rating"), // User's personal rating 1-5
  notes: text("notes"), // User's personal notes
  visitDate: timestamp("visit_date"),
  wouldRecommend: boolean("would_recommend"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recommendationRequests = pgTable("recommendation_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  location: text("location").notNull(),
  categories: text("categories").array(), // What types of recommendations they want
  preferences: jsonb("preferences"), // {budget: '$', duration: 'half_day', group_size: 2, interests: []}
  travelDuration: text("travel_duration"), // How long they'll be there
  groupSize: integer("group_size").default(1),
  budget: text("budget"), // '$', '$$', '$$$', '$$$$'
  status: text("status").default("pending"), // 'pending', 'processing', 'completed'
  aiResponse: jsonb("ai_response"), // Store AI-generated recommendations
  personalizedScore: real("personalized_score"), // 0-1 how well this matches user
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  preferredCategories: text("preferred_categories").array(),
  budgetRange: text("budget_range"), // '$', '$$', '$$$', '$$$$'
  crowdPreference: text("crowd_preference"), // 'avoid_crowds', 'neutral', 'enjoy_crowds'
  timePreferences: text("time_preferences").array(), // 'morning', 'afternoon', 'evening', 'night'
  accessibilityNeeds: text("accessibility_needs").array(),
  dietaryRestrictions: text("dietary_restrictions").array(),
  languagePreferences: text("language_preferences").array(),
  notificationSettings: jsonb("notification_settings"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create insert schemas for recommendations
export const insertRecommendationSchema = createInsertSchema(recommendations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserRecommendationInteractionSchema = createInsertSchema(userRecommendationInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertRecommendationRequestSchema = createInsertSchema(recommendationRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  updatedAt: true,
});

// Types for recommendations
export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type UserRecommendationInteraction = typeof userRecommendationInteractions.$inferSelect;
export type InsertUserRecommendationInteraction = z.infer<typeof insertUserRecommendationInteractionSchema>;
export type RecommendationRequest = typeof recommendationRequests.$inferSelect;
export type InsertRecommendationRequest = z.infer<typeof insertRecommendationRequestSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

// Instagram Posts - Track posts made to Instagram from events
export const instagramPosts = pgTable("instagram_posts", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  userId: integer("user_id").notNull().references(() => users.id), // Event creator
  userPostId: text("user_post_id"), // Instagram post ID on user's account
  nearbytravelerPostId: text("nearbytraveler_post_id"), // Instagram post ID on @nearbytraveler account
  postContent: text("post_content").notNull(), // Generated caption content
  hashtagsUsed: text("hashtags_used").array(), // Hashtags included in post
  imageUrl: text("image_url"), // Event image that was posted
  userPostStatus: text("user_post_status").default("pending"), // 'pending', 'posted', 'failed'
  nearbytravelerPostStatus: text("nearbytraveler_post_status").default("pending"), // 'pending', 'posted', 'failed', 'deleted'
  userPostError: text("user_post_error"), // Error message if user post failed
  nearbytravelerPostError: text("nearbytraveler_post_error"), // Error message if @nearbytraveler post failed
  deletedByAdmin: boolean("deleted_by_admin").default(false), // Admin deleted @nearbytraveler post
  deletedAt: timestamp("deleted_at"), // When admin deleted the post
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInstagramPostSchema = createInsertSchema(instagramPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InstagramPost = typeof instagramPosts.$inferSelect;
export type InsertInstagramPost = z.infer<typeof insertInstagramPostSchema>;

// Trip Itinerary insert schemas and types
export const insertTripItinerarySchema = createInsertSchema(tripItineraries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertItineraryItemSchema = createInsertSchema(itineraryItems).omit({
  id: true,
  createdAt: true,
});

export const insertSharedItinerarySchema = createInsertSchema(sharedItineraries).omit({
  id: true,
  createdAt: true,
});

export type TripItinerary = typeof tripItineraries.$inferSelect;
export type InsertTripItinerary = z.infer<typeof insertTripItinerarySchema>;
export type ItineraryItem = typeof itineraryItems.$inferSelect;
export type InsertItineraryItem = z.infer<typeof insertItineraryItemSchema>;
export type SharedItinerary = typeof sharedItineraries.$inferSelect;
export type InsertSharedItinerary = z.infer<typeof insertSharedItinerarySchema>;

// Add missing TripPlan export (alias for TravelPlan)
export type TripPlan = TravelPlan;



// Travel Mood Boards
export const moodBoards = pgTable("mood_boards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  destination: text("destination"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const moodBoardItems = pgTable("mood_board_items", {
  id: serial("id").primaryKey(),
  moodBoardId: integer("mood_board_id").notNull().references(() => moodBoards.id),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  type: text("type").notNull(), // 'image', 'text', 'location', 'activity'
  color: text("color").default("#3B82F6"),
  tags: text("tags").array(),
  position: jsonb("position"), // {x: number, y: number}
  createdAt: timestamp("created_at").defaultNow(),
});

// Packing Lists
export const packingLists = pgTable("packing_lists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  destination: text("destination"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  tripType: text("trip_type"), // 'beach', 'city', 'mountain', 'business', etc.
  weather: text("weather"), // 'hot', 'cold', 'temperate', 'rainy'
  privacy: text("privacy").default("private"), // 'private', 'friends', 'public'
  sharedWith: text("shared_with").array(), // Array of user IDs who can view this list
  isShared: boolean("is_shared").default(false), // Legacy field for backward compatibility
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const packingListItems = pgTable("packing_list_items", {
  id: serial("id").primaryKey(),
  packingListId: integer("packing_list_id").notNull().references(() => packingLists.id),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'clothing', 'electronics', 'toiletries', 'documents', etc.
  quantity: integer("quantity").default(1),
  isPacked: boolean("is_packed").default(false),
  priority: text("priority").default("normal"), // 'essential', 'important', 'normal', 'optional'
  notes: text("notes"),
  sortOrder: integer("sort_order").default(0),
  addedBy: integer("added_by").references(() => users.id), // Who added this item
  createdAt: timestamp("created_at").defaultNow(),
});

// Travel Challenges and Leaderboard
export const travelChallenges = pgTable("travel_challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 'food', 'culture', 'adventure', 'social', 'photo'
  points: integer("points").notNull().default(10),
  difficulty: text("difficulty").default("easy"), // 'easy', 'medium', 'hard'
  location: text("location"), // Specific to a location or global
  isActive: boolean("is_active").default(true),
  requiresVerification: boolean("requires_verification").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userChallenges = pgTable("user_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  challengeId: integer("challenge_id").notNull().references(() => travelChallenges.id),
  status: text("status").default("active"), // 'active', 'completed', 'verified', 'failed'
  completedAt: timestamp("completed_at"),
  verificationPhoto: text("verification_photo"),
  verificationNotes: text("verification_notes"),
  pointsEarned: integer("points_earned").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userLeaderboard = pgTable("user_leaderboard", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  totalPoints: integer("total_points").default(0),
  challengesCompleted: integer("challenges_completed").default(0),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  rank: integer("rank"),
  badges: text("badges").array(), // Array of badge names earned
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Travel Companion - Hidden Gems Recommendations
export const aiRecommendations = pgTable("ai_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  location: text("location").notNull(), // City or region for recommendations
  category: text("category").notNull(), // 'restaurants', 'attractions', 'nightlife', 'nature', 'culture', 'shopping'
  title: text("title").notNull(),
  description: text("description").notNull(),
  address: text("address"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  openingHours: text("opening_hours"),
  priceRange: text("price_range"), // '$', '$$', '$$$', '$$$$'
  rating: real("rating"), // AI-estimated rating 1-5
  tags: text("tags").array(),
  aiConfidence: real("ai_confidence").notNull(), // AI confidence score 0-1
  recommendationReason: text("recommendation_reason").notNull(), // Why AI recommended this
  userPreferencesMatched: text("user_preferences_matched").array(), // Which user preferences this matches
  isBookmarked: boolean("is_bookmarked").default(false),
  isVisited: boolean("is_visited").default(false),
  userRating: real("user_rating"),
  userNotes: text("user_notes"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// AI Conversations for Travel Companion
export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sessionId: text("session_id").notNull(),
  location: text("location"), // Current location context
  conversationType: text("conversation_type").notNull(), // 'recommendations', 'planning', 'discovery', 'general'
  userMessage: text("user_message").notNull(),
  aiResponse: text("ai_response").notNull(),
  recommendationsGenerated: integer("recommendations_generated").array(), // IDs of recommendations created from this conversation
  userFeedback: text("user_feedback"), // 'helpful', 'not_helpful', 'partially_helpful'
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for AI features
export const insertAiRecommendationSchema = createInsertSchema(aiRecommendations).omit({
  id: true,
  generatedAt: true,
  lastUpdated: true,
});

export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  createdAt: true,
});

// User-contributed local interests and activities (community knowledge base)
export const userContributedInterests = pgTable("user_contributed_interests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'restaurant', 'activity', 'landmark', 'event', 'shopping', 'nightlife', 'outdoor'
  location: text("location").notNull(), // City/area where this interest is located
  address: text("address"),
  priceRange: text("price_range"), // '$', '$$', '$$$', '$$$$'
  tags: text("tags").array(),
  personalNote: text("personal_note"), // User's personal experience/tip
  isPublic: boolean("is_public").default(true),
  likes: integer("likes").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserContributedInterestSchema = createInsertSchema(userContributedInterests).omit({
  id: true,
  likes: true,
  createdAt: true,
  updatedAt: true,
});

// Pricing tiers for flexible business pricing
export const pricingTiers = pgTable("pricing_tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // 'standard', 'premium', 'enterprise', 'startup'
  monthlyPriceCents: integer("monthly_price_cents").notNull(),
  signupFeeCents: integer("signup_fee_cents").default(0), // One-time signup fee
  description: text("description"),
  features: text("features").array(), // Array of feature descriptions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new features
export const insertMoodBoardSchema = createInsertSchema(moodBoards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMoodBoardItemSchema = createInsertSchema(moodBoardItems).omit({
  id: true,
  createdAt: true,
});

export const insertPackingListSchema = createInsertSchema(packingLists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPackingListItemSchema = createInsertSchema(packingListItems).omit({
  id: true,
  createdAt: true,
});

export const insertTravelChallengeSchema = createInsertSchema(travelChallenges).omit({
  id: true,
  createdAt: true,
});

export const insertUserChallengeSchema = createInsertSchema(userChallenges).omit({
  id: true,
  createdAt: true,
});

export const insertUserLeaderboardSchema = createInsertSchema(userLeaderboard).omit({
  id: true,
  rank: true,
  createdAt: true,
  updatedAt: true,
});

// New feature types
export type MoodBoard = typeof moodBoards.$inferSelect;
export type InsertMoodBoard = z.infer<typeof insertMoodBoardSchema>;
export type MoodBoardItem = typeof moodBoardItems.$inferSelect;
export type InsertMoodBoardItem = z.infer<typeof insertMoodBoardItemSchema>;

export type PackingList = typeof packingLists.$inferSelect;
export type InsertPackingList = z.infer<typeof insertPackingListSchema>;
export type PackingListItem = typeof packingListItems.$inferSelect;
export type InsertPackingListItem = z.infer<typeof insertPackingListItemSchema>;

export type TravelChallenge = typeof travelChallenges.$inferSelect;
export type InsertTravelChallenge = z.infer<typeof insertTravelChallengeSchema>;
export type UserChallenge = typeof userChallenges.$inferSelect;
export type InsertUserChallenge = z.infer<typeof insertUserChallengeSchema>;
export type UserLeaderboard = typeof userLeaderboard.$inferSelect;
export type InsertUserLeaderboard = z.infer<typeof insertUserLeaderboardSchema>;

// AI feature types
export type AiRecommendation = typeof aiRecommendations.$inferSelect;
export type InsertAiRecommendation = z.infer<typeof insertAiRecommendationSchema>;
export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;




export type UserContributedInterest = typeof userContributedInterests.$inferSelect;
export type InsertUserContributedInterest = z.infer<typeof insertUserContributedInterestSchema>;

// Quick meetup template types
export const insertQuickMeetupTemplateSchema = createInsertSchema(quickMeetupTemplates).omit({
  id: true,
  timesUsed: true,
  createdAt: true,
  lastUsedAt: true,
});
export type QuickMeetupTemplate = typeof quickMeetupTemplates.$inferSelect;
export type InsertQuickMeetupTemplate = z.infer<typeof insertQuickMeetupTemplateSchema>;

// Business Referral Tracking for $100 rewards
export const businessReferrals = pgTable("business_referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull(), // User who made the referral
  referredBusinessId: integer("referred_business_id").notNull(), // Business that was referred
  businessName: text("business_name").notNull(),
  businessEmail: text("business_email").notNull(),
  status: text("status").notNull().default("business_signed_up"), // 'business_signed_up', 'payment_completed', 'reward_paid'
  potentialReward: integer("potential_reward_cents").default(10000), // $100 in cents
  rewardPaid: boolean("reward_paid").default(false),
  rewardPaidAt: timestamp("reward_paid_at"),
  paymentMethod: text("payment_method"), // 'stripe', 'paypal', 'manual'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBusinessReferralSchema = createInsertSchema(businessReferrals).omit({
  id: true,
  createdAt: true,
});

// Restaurant schema
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  cuisine: text("cuisine").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  priceRange: text("price_range"), // $, $$, $$$, $$$$
  phone: text("phone"),
  website: text("website"),
  imageUrl: text("image_url"),
  openingHours: text("opening_hours"), // JSON string with day: hours format
  features: text("features").array(), // ["outdoor_seating", "wifi", "vegan_options"]
  averageRating: real("average_rating").default(0),
  totalReviews: integer("total_reviews").default(0),
  isActive: boolean("is_active").default(true),
  addedBy: integer("added_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Restaurant reviews schema
export const restaurantReviews = pgTable("restaurant_reviews", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"),
  content: text("content"),
  images: text("images").array(), // Array of image URLs
  visitDate: timestamp("visit_date"),
  priceRating: integer("price_rating"), // 1-5 for value for money
  serviceRating: integer("service_rating"), // 1-5 for service quality
  foodRating: integer("food_rating"), // 1-5 for food quality
  ambianceRating: integer("ambiance_rating"), // 1-5 for atmosphere
  recommendedDishes: text("recommended_dishes").array(),
  tags: text("tags").array(), // ["great_service", "romantic", "family_friendly"]
  isVerifiedVisit: boolean("is_verified_visit").default(false),
  helpfulVotes: integer("helpful_votes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Restaurant categories for filtering
export const restaurantCategories = pgTable("restaurant_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"), // Icon name or emoji
  createdAt: timestamp("created_at").defaultNow(),
});

// Restaurant types
export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = typeof restaurants.$inferInsert;
export type RestaurantReview = typeof restaurantReviews.$inferSelect;
export type InsertRestaurantReview = typeof restaurantReviews.$inferInsert;
export type RestaurantCategory = typeof restaurantCategories.$inferSelect;
export type InsertRestaurantCategory = typeof restaurantCategories.$inferInsert;



// City Landmarks - User-contributed landmark database
export const cityLandmarks = pgTable("city_landmarks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
  address: text("address"),
  category: text("category").notNull(), // 'landmark', 'monument', 'museum', 'observatory', 'skyscraper', 'bridge', 'park', 'religious', 'historical'
  visitTime: text("visit_time"), // '1-2 hours', '2-3 hours', 'half day', 'full day'
  rating: real("rating").default(0),
  totalRatings: integer("total_ratings").default(0),
  latitude: real("latitude"),
  longitude: real("longitude"),
  imageUrl: text("image_url"),
  website: text("website"),
  openingHours: text("opening_hours"),
  entryFee: text("entry_fee"), // 'free', '$5-10', '$10-20', '$20+', 'varies'
  bestTimeToVisit: text("best_time_to_visit"), // 'morning', 'afternoon', 'evening', 'sunset', 'night'
  tips: text("tips").array(), // Array of local tips from users
  addedBy: integer("added_by").notNull().references(() => users.id),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User landmark ratings and reviews
export const landmarkRatings = pgTable("landmark_ratings", {
  id: serial("id").primaryKey(),
  landmarkId: integer("landmark_id").notNull().references(() => cityLandmarks.id),
  userId: integer("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5 stars
  review: text("review"),
  visitDate: timestamp("visit_date"),
  wouldRecommend: boolean("would_recommend").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Landmark insert schemas
export const insertCityLandmarkSchema = createInsertSchema(cityLandmarks).omit({
  id: true,
  rating: true,
  totalRatings: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLandmarkRatingSchema = createInsertSchema(landmarkRatings).omit({
  id: true,
  createdAt: true,
});

// Landmark types
export type CityLandmark = typeof cityLandmarks.$inferSelect;
export type InsertCityLandmark = z.infer<typeof insertCityLandmarkSchema>;
export type LandmarkRating = typeof landmarkRatings.$inferSelect;
export type InsertLandmarkRating = z.infer<typeof insertLandmarkRatingSchema>;

// Chatroom insert schemas
export const insertCityChatroomSchema = createInsertSchema(citychatrooms).omit({
  id: true,
  createdAt: true,
});

export const insertChatroomMessageSchema = createInsertSchema(chatroomMessages).omit({
  id: true,
  createdAt: true,
  editedAt: true,
});

export const insertChatroomMemberSchema = createInsertSchema(chatroomMembers).omit({
  id: true,
  joinedAt: true,
  lastReadAt: true,
});

export const insertChatroomAccessRequestSchema = createInsertSchema(chatroomAccessRequests).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

// City Pages insert schemas
export const insertCityPageSchema = createInsertSchema(cityPages).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertSecretLocalExperienceSchema = createInsertSchema(secretLocalExperiences).omit({
  id: true,
  likes: true,
  createdAt: true,
});

// Chatroom Invitations
export const chatroomInvitations = pgTable("chatroom_invitations", {
  id: serial("id").primaryKey(),
  chatroomId: integer("chatroom_id").notNull(),
  inviterId: integer("inviter_id").notNull(),
  inviteeId: integer("invitee_id").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'declined'
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

// Proximity notifications table
export const proximityNotifications = pgTable("proximity_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  nearbyUserId: integer("nearby_user_id").notNull().references(() => users.id),
  distance: real("distance").notNull(), // Distance in meters
  notificationSent: boolean("notification_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  lastSeen: timestamp("last_seen").defaultNow(),
});

export const insertChatroomInvitationSchema = createInsertSchema(chatroomInvitations).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

// Chatroom types
export type CityChatroom = typeof citychatrooms.$inferSelect;
export type InsertCityChatroom = z.infer<typeof insertCityChatroomSchema>;
export type ChatroomMessage = typeof chatroomMessages.$inferSelect;
export type InsertChatroomMessage = z.infer<typeof insertChatroomMessageSchema>;
export type ChatroomMember = typeof chatroomMembers.$inferSelect;
export type InsertChatroomMember = z.infer<typeof insertChatroomMemberSchema>;
export type ChatroomInvitation = typeof chatroomInvitations.$inferSelect;
export type InsertChatroomInvitation = z.infer<typeof insertChatroomInvitationSchema>;
export type ChatroomAccessRequest = typeof chatroomAccessRequests.$inferSelect;
export type InsertChatroomAccessRequest = z.infer<typeof insertChatroomAccessRequestSchema>;

export const insertProximityNotificationSchema = createInsertSchema(proximityNotifications).omit({
  id: true,
  createdAt: true,
});

export type ProximityNotification = typeof proximityNotifications.$inferSelect;
export type InsertProximityNotification = z.infer<typeof insertProximityNotificationSchema>;

// Business Interest Notifications - when users match business offerings
export const businessInterestNotifications = pgTable("business_interest_notifications", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => users.id),
  userId: integer("user_id").notNull().references(() => users.id),
  matchType: text("match_type").notNull(), // 'traveler_interest', 'local_interest', 'travel_plan'
  matchedInterests: text("matched_interests").array(), // Array of interests that matched
  matchedActivities: text("matched_activities").array(), // Array of activities that matched
  userLocation: text("user_location"), // Where the user is/will be
  isRead: boolean("is_read").default(false),
  isProcessed: boolean("is_processed").default(false), // Whether business has acted on it
  priority: text("priority").default("medium"), // 'high', 'medium', 'low'
  travelStartDate: timestamp("travel_start_date"), // If it's a travel plan match
  travelEndDate: timestamp("travel_end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBusinessInterestNotificationSchema = createInsertSchema(businessInterestNotifications).omit({
  id: true,
  createdAt: true,
});

// User Notification Settings - Store all notification preferences
export const userNotificationSettings = pgTable("user_notification_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  
  // Email Notifications
  emailNotifications: boolean("email_notifications").default(true),
  eventReminders: boolean("event_reminders").default(true),
  connectionAlerts: boolean("connection_alerts").default(true),
  messageNotifications: boolean("message_notifications").default(true),
  weeklyDigest: boolean("weekly_digest").default(true),
  marketingEmails: boolean("marketing_emails").default(false),
  
  // Mobile & Push Notifications
  pushNotifications: boolean("push_notifications").default(true),
  mobileAlerts: boolean("mobile_alerts").default(true),
  
  // Privacy & Safety Settings
  profileVisibility: text("profile_visibility").default("public"), // 'public', 'connections', 'private'
  locationSharing: boolean("location_sharing").default(true),
  photoPermissions: text("photo_permissions").default("friends"), // 'everyone', 'friends', 'none'
  messageRequests: boolean("message_requests").default(true),
  eventInvitations: boolean("event_invitations").default(true),
  connectionRequests: boolean("connection_requests").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserNotificationSettingsSchema = createInsertSchema(userNotificationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserNotificationSettings = typeof userNotificationSettings.$inferSelect;
export type InsertUserNotificationSettings = typeof userNotificationSettings.$inferInsert;

// Customer Uploaded Photos for Business Profiles
export const businessCustomerPhotos = pgTable("business_customer_photos", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => users.id),
  uploaderId: integer("uploader_id").notNull().references(() => users.id),
  photoUrl: text("photo_url").notNull(),
  caption: text("caption"),
  uploaderName: text("uploader_name").notNull(),
  uploaderType: text("uploader_type").notNull(), // 'traveler', 'local'
  isApproved: boolean("is_approved").default(true),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertBusinessCustomerPhotoSchema = createInsertSchema(businessCustomerPhotos).omit({
  id: true,
  uploadedAt: true,
});

export type BusinessInterestNotification = typeof businessInterestNotifications.$inferSelect;
export type InsertBusinessInterestNotification = z.infer<typeof insertBusinessInterestNotificationSchema>;
export type BusinessCustomerPhoto = typeof businessCustomerPhotos.$inferSelect;
export type InsertBusinessCustomerPhoto = z.infer<typeof insertBusinessCustomerPhotoSchema>;

// User Travel Preferences Schema (for routes compatibility)
export const insertUserTravelPreferencesSchema = z.object({
  userId: z.number(),
  defaultTravelInterests: z.array(z.string()).optional(),
  defaultTravelActivities: z.array(z.string()).optional(),
  defaultTravelEvents: z.array(z.string()).optional(),
});

export type InsertUserTravelPreferences = z.infer<typeof insertUserTravelPreferencesSchema>;

// Travel Blog types
export const insertTravelBlogPostSchema = createInsertSchema(travelBlogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTravelBlogLikeSchema = createInsertSchema(travelBlogLikes).omit({
  id: true,
  createdAt: true,
});

export const insertTravelBlogCommentSchema = createInsertSchema(travelBlogComments).omit({
  id: true,
  createdAt: true,
  aura: true,
  likes: true,
});

export const insertTravelBlogCommentLikeSchema = createInsertSchema(travelBlogCommentLikes).omit({
  id: true,
  createdAt: true,
});

export type TravelBlogPost = typeof travelBlogPosts.$inferSelect;
export type InsertTravelBlogPost = z.infer<typeof insertTravelBlogPostSchema>;
export type TravelBlogLike = typeof travelBlogLikes.$inferSelect;
export type InsertTravelBlogLike = z.infer<typeof insertTravelBlogLikeSchema>;
export type TravelBlogComment = typeof travelBlogComments.$inferSelect;
export type InsertTravelBlogComment = z.infer<typeof insertTravelBlogCommentSchema>;
export type TravelBlogCommentLike = typeof travelBlogCommentLikes.$inferSelect;
export type InsertTravelBlogCommentLike = z.infer<typeof insertTravelBlogCommentLikeSchema>;

// City Pages types
export type CityPage = typeof cityPages.$inferSelect;
export type InsertCityPage = z.infer<typeof insertCityPageSchema>;
export type SecretLocalExperience = typeof secretLocalExperiences.$inferSelect;
export type InsertSecretLocalExperience = z.infer<typeof insertSecretLocalExperienceSchema>;
export type SecretLocalExperienceLike = typeof secretLocalExperienceLikes.$inferSelect;

// Removed duplicate - Instagram types already defined above

// Quick Meetups insert schemas
export const insertQuickMeetupSchema = createInsertSchema(quickMeetups).omit({
  id: true,
  participantCount: true,
  createdAt: true,
});

export const insertQuickMeetupParticipantSchema = createInsertSchema(quickMeetupParticipants).omit({
  id: true,
  joinedAt: true,
});

export const insertMeetupChatroomSchema = createInsertSchema(meetupChatrooms).omit({
  id: true,
  participantCount: true,
  createdAt: true,
});

export const insertMeetupChatroomMessageSchema = createInsertSchema(meetupChatroomMessages).omit({
  id: true,
  sentAt: true,
});

// Quick Meetups types  
export type QuickMeetup = typeof quickMeetups.$inferSelect;
export type InsertQuickMeetup = z.infer<typeof insertQuickMeetupSchema>;
export type QuickMeetupParticipant = typeof quickMeetupParticipants.$inferSelect;
export type InsertQuickMeetupParticipant = z.infer<typeof insertQuickMeetupParticipantSchema>;
export type MeetupChatroom = typeof meetupChatrooms.$inferSelect;
export type InsertMeetupChatroom = z.infer<typeof insertMeetupChatroomSchema>;
export type MeetupChatroomMessage = typeof meetupChatroomMessages.$inferSelect;
export type InsertMeetupChatroomMessage = z.infer<typeof insertMeetupChatroomMessageSchema>;

// Quick Deals insert schemas
export const insertQuickDealSchema = createInsertSchema(quickDeals).omit({
  id: true,
  currentRedemptions: true,
  createdAt: true,
});

export const insertQuickDealRedemptionSchema = createInsertSchema(quickDealRedemptions).omit({
  id: true,
  claimedAt: true,
});

// Quick Deals types  
export type QuickDeal = typeof quickDeals.$inferSelect;
export type InsertQuickDeal = z.infer<typeof insertQuickDealSchema>;
export type QuickDealRedemption = typeof quickDealRedemptions.$inferSelect;
export type InsertQuickDealRedemption = z.infer<typeof insertQuickDealRedemptionSchema>;


