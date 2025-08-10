import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Travel Agent Client Management
export const travelAgentClients = pgTable("travel_agent_clients", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(), // Travel agent user ID
  clientUserId: integer("client_user_id"), // If client is a platform user
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientPhone: text("client_phone"),
  travelPreferences: text("travel_preferences").array(),
  budgetRange: text("budget_range"), // "budget", "mid-range", "luxury"
  preferredDestinations: text("preferred_destinations").array(),
  travelStyle: text("travel_style").array(),
  specialRequests: text("special_requests"),
  emergencyContact: text("emergency_contact"),
  status: text("status").default("active"), // "active", "inactive", "archived"
  createdAt: timestamp("created_at").defaultNow(),
  lastContactDate: timestamp("last_contact_date"),
});

// Agent Itineraries - Custom trip plans created by agents
export const agentItineraries = pgTable("agent_itineraries", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  clientId: integer("client_id"), // Reference to travelAgentClients
  itineraryName: text("itinerary_name").notNull(),
  destination: text("destination").notNull(),
  destinationCity: text("destination_city"),
  destinationState: text("destination_state"),
  destinationCountry: text("destination_country"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalBudget: real("total_budget"),
  estimatedCost: real("estimated_cost"),
  commission: real("commission"), // Agent's commission
  itineraryDetails: text("itinerary_details"), // JSON string with daily plans
  accommodations: text("accommodations").array(),
  transportation: text("transportation").array(),
  activities: text("activities").array(),
  restaurants: text("restaurants").array(),
  specialNotes: text("special_notes"),
  status: text("status").default("draft"), // "draft", "proposed", "confirmed", "booked", "completed"
  isTemplate: boolean("is_template").default(false), // Can be reused
  templateName: text("template_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent Bookings - Track actual bookings made
export const agentBookings = pgTable("agent_bookings", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  clientId: integer("client_id"),
  itineraryId: integer("itinerary_id"),
  bookingType: text("booking_type").notNull(), // "flight", "hotel", "car", "cruise", "tour", "package"
  providerName: text("provider_name"), // Airline, hotel chain, etc.
  bookingReference: text("booking_reference"),
  bookingDetails: text("booking_details"), // JSON with booking specifics
  totalCost: real("total_cost").notNull(),
  clientPaid: real("client_paid"),
  agentCommission: real("agent_commission"),
  bookingFee: real("booking_fee"),
  bookingDate: timestamp("booking_date").defaultNow(),
  travelDate: timestamp("travel_date"),
  status: text("status").default("confirmed"), // "pending", "confirmed", "cancelled", "completed"
  paymentStatus: text("payment_status").default("pending"), // "pending", "paid", "refunded"
  cancellationPolicy: text("cancellation_policy"),
  confirmationNumber: text("confirmation_number"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent Reviews - Client reviews of travel agents
export const agentReviews = pgTable("agent_reviews", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  clientId: integer("client_id"),
  clientName: text("client_name"),
  rating: integer("rating").notNull(), // 1-5 stars
  reviewTitle: text("review_title"),
  reviewText: text("review_text"),
  tripDestination: text("trip_destination"),
  tripDate: timestamp("trip_date"),
  wouldRecommend: boolean("would_recommend").default(true),
  serviceCategories: text("service_categories").array(), // "planning", "communication", "value", "expertise"
  isVerified: boolean("is_verified").default(false),
  agentResponse: text("agent_response"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent Specialization Areas
export const agentSpecializations = pgTable("agent_specializations", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  specialization: text("specialization").notNull(), // "luxury", "adventure", "family", "business", "cruise", "destination_wedding"
  experience: text("experience"), // Description of experience in this area
  certifications: text("certifications").array(),
  destinationExpertise: text("destination_expertise").array(), // Specific destinations they know well
  averageBookingValue: real("average_booking_value"),
  totalBookings: integer("total_bookings").default(0),
  successRate: real("success_rate").default(100), // Percentage of successful bookings
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent Commission Tracking
export const agentCommissions = pgTable("agent_commissions", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  bookingId: integer("booking_id"),
  commissionType: text("commission_type").notNull(), // "booking", "consultation", "planning_fee"
  amount: real("amount").notNull(),
  currency: text("currency").default("USD"),
  paymentStatus: text("payment_status").default("pending"), // "pending", "paid", "processing"
  paymentDate: timestamp("payment_date"),
  clientName: text("client_name"),
  bookingReference: text("booking_reference"),
  notes: text("notes"),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const insertTravelAgentClientSchema = createInsertSchema(travelAgentClients).omit({
  id: true,
  createdAt: true,
});

export const insertAgentItinerarySchema = createInsertSchema(agentItineraries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentBookingSchema = createInsertSchema(agentBookings).omit({
  id: true,
  createdAt: true,
});

export const insertAgentReviewSchema = createInsertSchema(agentReviews).omit({
  id: true,
  createdAt: true,
});

export const insertAgentSpecializationSchema = createInsertSchema(agentSpecializations).omit({
  id: true,
  createdAt: true,
});

export const insertAgentCommissionSchema = createInsertSchema(agentCommissions).omit({
  id: true,
  createdAt: true,
});

// Export types
export type TravelAgentClient = typeof travelAgentClients.$inferSelect;
export type InsertTravelAgentClient = typeof insertTravelAgentClientSchema._type;

export type AgentItinerary = typeof agentItineraries.$inferSelect;
export type InsertAgentItinerary = typeof insertAgentItinerarySchema._type;

export type AgentBooking = typeof agentBookings.$inferSelect;
export type InsertAgentBooking = typeof insertAgentBookingSchema._type;

export type AgentReview = typeof agentReviews.$inferSelect;
export type InsertAgentReview = typeof insertAgentReviewSchema._type;

export type AgentSpecialization = typeof agentSpecializations.$inferSelect;
export type InsertAgentSpecialization = typeof insertAgentSpecializationSchema._type;

export type AgentCommission = typeof agentCommissions.$inferSelect;
export type InsertAgentCommission = typeof insertAgentCommissionSchema._type;