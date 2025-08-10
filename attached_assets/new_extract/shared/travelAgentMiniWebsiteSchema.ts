import { pgTable, text, serial, integer, boolean, timestamp, real, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Travel Agent Subscription Management
export const travelAgentSubscriptions = pgTable("travel_agent_subscriptions", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(), // User ID of travel agent
  subscriptionType: text("subscription_type").default("premium"), // "free", "premium"
  monthlyFee: real("monthly_fee").default(50.00), // $50/month like businesses
  status: text("status").default("active"), // "active", "paused", "cancelled"
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel Agent Mini-Website Settings
export const travelAgentWebsites = pgTable("travel_agent_websites", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  websiteUrl: text("website_url").notNull().unique(), // nearbytravel.com/agent/username
  businessName: text("business_name").notNull(), // "Safari Adventures by John"
  tagline: text("tagline"), // "Luxury African Safari Specialist"
  description: text("description"), // About the agent/agency
  coverPhoto: text("cover_photo"), // Hero image for their page
  logo: text("logo"), // Agent's business logo
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  officeAddress: text("office_address"),
  specialties: text("specialties").array(), // ["luxury", "adventure", "family", "cruise"]
  destinationExpertise: text("destination_expertise").array(), // Countries/regions they specialize in
  certifications: text("certifications").array(), // Travel certifications
  yearsExperience: integer("years_experience"),
  languages: text("languages").array(), // Languages spoken
  socialMediaLinks: text("social_media_links"), // JSON object with social links
  websiteTheme: text("website_theme").default("professional"), // Theme for their mini-site
  isPublished: boolean("is_published").default(false), // Whether site is live
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel Agent Trip Packages/Listings
export const travelAgentTrips = pgTable("travel_agent_trips", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  tripTitle: text("trip_title").notNull(), // "10-Day Kenya Safari Experience"
  tripDescription: text("trip_description").notNull(),
  destination: text("destination").notNull(),
  destinationCity: text("destination_city"),
  destinationState: text("destination_state"),
  destinationCountry: text("destination_country"),
  tripType: text("trip_type").notNull(), // "cruise", "tour", "safari", "adventure", "luxury", "family"
  duration: integer("duration").notNull(), // Days
  maxGroupSize: integer("max_group_size"),
  minGroupSize: integer("min_group_size").default(1),
  pricePerPerson: real("price_per_person").notNull(),
  priceIncludes: text("price_includes").array(), // What's included in price
  priceExcludes: text("price_excludes").array(), // What's not included
  availableDates: text("available_dates").array(), // Available departure dates
  itinerary: text("itinerary"), // Detailed day-by-day itinerary
  photos: text("photos").array(), // Trip photos
  difficulty: text("difficulty"), // "easy", "moderate", "challenging"
  minAge: integer("min_age"),
  maxAge: integer("max_age"),
  physicalRequirements: text("physical_requirements"),
  specialRequirements: text("special_requirements"),
  cancellationPolicy: text("cancellation_policy"),
  depositRequired: real("deposit_required"),
  finalPaymentDue: integer("final_payment_due"), // Days before travel
  isActive: boolean("is_active").default(true), // Whether trip is bookable
  isFeatured: boolean("is_featured").default(false), // Featured on agent's page
  bookingCount: integer("booking_count").default(0), // Times booked
  averageRating: real("average_rating").default(0),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Private Client Chatrooms for Travel Agent Clients
export const travelAgentChatrooms = pgTable("travel_agent_chatrooms", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  tripId: integer("trip_id"), // Related trip if applicable
  chatroomName: text("chatroom_name").notNull(), // "Kenya Safari March 2025 Group"
  description: text("description"),
  chatroomType: text("chatroom_type").notNull(), // "trip_group", "client_support", "vip_clients"
  isPrivate: boolean("is_private").default(true), // Always private for agent chatrooms
  maxMembers: integer("max_members").default(50),
  memberCount: integer("member_count").default(1), // Agent is first member
  chatroomImage: text("chatroom_image"),
  allowClientInvites: boolean("allow_client_invites").default(false), // Can clients invite others
  moderationLevel: text("moderation_level").default("agent_only"), // Who can moderate
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel Agent Chatroom Members
export const travelAgentChatroomMembers = pgTable("travel_agent_chatroom_members", {
  id: serial("id").primaryKey(),
  chatroomId: integer("chatroom_id").notNull(),
  userId: integer("user_id").notNull(), // Platform user (agent or client)
  clientId: integer("client_id"), // If external client (not platform user)
  memberRole: text("member_role").default("member"), // "admin" (agent), "member" (client)
  joinedAt: timestamp("joined_at").defaultNow(),
  lastActive: timestamp("last_active").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Travel Agent Trip Bookings by Clients
export const travelAgentTripBookings = pgTable("travel_agent_trip_bookings", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  tripId: integer("trip_id").notNull(),
  clientUserId: integer("client_user_id"), // If client is platform user
  clientId: integer("client_id"), // External client from travelAgentClients
  bookerName: text("booker_name").notNull(),
  bookerEmail: text("booker_email").notNull(),
  bookerPhone: text("booker_phone"),
  numberOfTravelers: integer("number_of_travelers").default(1),
  selectedDate: text("selected_date").notNull(), // Departure date chosen
  totalPrice: real("total_price").notNull(),
  depositPaid: real("deposit_paid").default(0),
  balanceRemaining: real("balance_remaining").notNull(),
  paymentStatus: text("payment_status").default("pending"), // "pending", "deposit_paid", "fully_paid", "refunded"
  bookingStatus: text("booking_status").default("pending"), // "pending", "confirmed", "cancelled", "completed"
  specialRequests: text("special_requests"),
  emergencyContact: text("emergency_contact"),
  travelInsurance: boolean("travel_insurance").default(false),
  dietaryRestrictions: text("dietary_restrictions"),
  roomingPreferences: text("rooming_preferences"),
  bookingReference: text("booking_reference").notNull().unique(),
  confirmationSent: boolean("confirmation_sent").default(false),
  paymentReminders: integer("payment_reminders").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema validation
export const insertTravelAgentSubscriptionSchema = createInsertSchema(travelAgentSubscriptions);
export const insertTravelAgentWebsiteSchema = createInsertSchema(travelAgentWebsites);
export const insertTravelAgentTripSchema = createInsertSchema(travelAgentTrips);
export const insertTravelAgentChatroomSchema = createInsertSchema(travelAgentChatrooms);
export const insertTravelAgentChatroomMemberSchema = createInsertSchema(travelAgentChatroomMembers);
export const insertTravelAgentTripBookingSchema = createInsertSchema(travelAgentTripBookings);

// TypeScript types
export type TravelAgentSubscription = typeof travelAgentSubscriptions.$inferSelect;
export type InsertTravelAgentSubscription = z.infer<typeof insertTravelAgentSubscriptionSchema>;
export type TravelAgentWebsite = typeof travelAgentWebsites.$inferSelect;
export type InsertTravelAgentWebsite = z.infer<typeof insertTravelAgentWebsiteSchema>;
export type TravelAgentTrip = typeof travelAgentTrips.$inferSelect;
export type InsertTravelAgentTrip = z.infer<typeof insertTravelAgentTripSchema>;
export type TravelAgentChatroom = typeof travelAgentChatrooms.$inferSelect;
export type InsertTravelAgentChatroom = z.infer<typeof insertTravelAgentChatroomSchema>;
export type TravelAgentChatroomMember = typeof travelAgentChatroomMembers.$inferSelect;
export type InsertTravelAgentChatroomMember = z.infer<typeof insertTravelAgentChatroomMemberSchema>;
export type TravelAgentTripBooking = typeof travelAgentTripBookings.$inferSelect;
export type InsertTravelAgentTripBooking = z.infer<typeof insertTravelAgentTripBookingSchema>;