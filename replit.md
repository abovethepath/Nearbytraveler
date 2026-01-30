## Overview
Nearby Traveler is a social networking platform that connects travelers, locals, and businesses through location-based meetups and cross-cultural interactions. It aims to enrich travel experiences and local engagement by facilitating real-time connections, offering AI-powered city content, robust photo management, mobile responsiveness, and a global map system for discovery. The platform’s vision is to foster authentic human connections and become the premier destination for genuine local experiences.

## User Preferences
Preferred communication style: Simple, everyday language.
User preference: Complete codebase replacement rather than selective merging when provided with improved versions.
User request: Removed separate "My Events" tab - all user events now appear prominently at top of Community Events section with special styling and management buttons.
User request: Removed "Your premier destination for authentic local experiences" tagline from city page headers for cleaner design.
User request: Removed all moving animations including floating text, scaling buttons, and slide-in effects from home page to eliminate distracting movement, keeping only subtle color transitions.
User request: Completely removed all photo functionality from city pages including galleries, upload widgets, background images, and related functions, replacing image hero sections with clean gradient backgrounds.
User request: Reordered interests list to be more business-friendly, with Family Activities first, Food/Dining second, Cultural/Tourism third, making it more suitable for business users.
User request: Simplified website URL input - removed complex validation and changed placeholders from "https://..." to "www..." format for easier user entry.
User request: Implemented Advanced Search Widget - Search button in bottom navigation now opens comprehensive search modal instead of navigating to discover page, featuring location filters, demographics, interests, activities, and real-time results.
User request: Business users should be redirected away from destination discovery page (/discover) to business dashboard, as destination exploration is for travelers, not businesses focused on local operations.
User request: Implemented LA Metro dual visibility - users, businesses, and events in metro cities (Playa del Rey, Santa Monica, Venice, Culver City) now appear in both their specific city searches AND when searching "Los Angeles".
User request: Business contact information (Business Name, Contact Name, Contact Email, Contact Phone) must be collected during signup and automatically populate the admin widget for complete contact database management.
User request: Mobile bottom navigation for business users should display "Create Deal" and "Create Quick Deal" instead of "Create Trip" and "Create Quick Meetup" to maintain consistent DEALS terminology.
User request: LA Metro consolidation now uses centralized shared/constants.ts file defining METRO_AREAS configuration with 76 LA cities that are all connected through common variable, ensuring all LA Metro deals and content properly appear under "Los Angeles" searches.
User request: NEVER require bio during signup - removed bio requirement from all three signup forms (traveling, local, business) to maintain fast registration process. Users add bio later in profile editing.
User request: Red profile completion reminder bar restored to navbar - displays when users have incomplete profiles (missing bio, profile image, or less than 3 interests) with direct link to complete profile.
User requirement: ALWAYS use local timezone for ALL time displays - events, meetups, travel planning, quick meetups, chat timestamps, everything. Never use UTC or destination timezones, even for international trips. All times must display in user's local timezone for consistency and ease of understanding.
CRITICAL PROFILE DISPLAY REQUIREMENT: User profiles must ALWAYS show "Nearby Local • [Hometown]" - this line NEVER disappears under any circumstances. When user is actively traveling (has active travel plan within date range), an ADDITIONAL line "Nearby Traveler • [Destination]" appears BELOW the hometown line. Both lines show simultaneously during travel. The hometown line is permanent and immutable - this system worked perfectly for 5 months and must never be changed.
APPLE APP STORE COMPLIANCE: Completely removed all private/adult interests functionality from the entire codebase to ensure Apple App Store approval. This includes removal of PRIVATE_INTERESTS array from shared/base-options.ts, all private interest selection UI from profile pages and signup flows, private interest filtering from search and matching, and all related database fields and API endpoints. The platform now only offers family-friendly public interests suitable for App Store guidelines.
EVENT INTERESTS REMOVED FROM PROFILES: Removed all event interest/preference selection from user profiles and bio pages. Event preferences (like "Concerts", "Sports Games") were location-specific and belonged in "Things I Want To Do" city-specific sections, not global profile interests. Community events functionality (Event Organizer Hub, meetups, event creation/attendance) remains fully intact and operational.
CRITICAL UI/UX REQUIREMENT - SOLID WIDGETS: ALL modals, dialogs, popups, and widgets across the ENTIRE platform MUST have SOLID backgrounds (NOT translucent/transparent). Dialog overlays use bg-black/95 (95% opacity) and dialog content uses solid bg-white (light mode) or bg-gray-900 (dark mode). This ensures maximum readability and prevents background content from showing through. Applied site-wide to ALL Dialog, AlertDialog, and modal components in client/src/components/ui/. This is a permanent design standard that MUST be maintained in all existing code and all future code. No translucent widgets allowed anywhere on the platform.
WRAPPED iOS APP API COMPATIBILITY: All API calls must use absolute URLs when running in the wrapped iOS app WebView. A centralized `getApiBaseUrl()` helper in `client/src/lib/queryClient.ts` detects the environment (localhost/replit = relative URLs, other = absolute to nearbytraveler.org) and is integrated into both `apiRequest()` and the default React Query fetcher. This ensures profile editing, Match in City, and all other features work correctly in the wrapped app.
CUSTOM INTERESTS IN MATCHING: Custom interests (user-added interests like "Poker", "Flea Markets") are now fully integrated into compatibility matching in `server/services/matching.ts`. Both search and matching include custom interests, ensuring users with unique custom interests can find and connect with others who share them.
PROFILE HEADER COMPACT LOCATION FORMAT: Profile page now uses compact location formatting for mobile-friendly display. US state names abbreviated (California → CA), country names abbreviated (United States → USA, United Kingdom → UK). Helper functions `formatLocationCompact()`, `abbreviateState()`, `abbreviateCountry()` in `client/src/lib/dateUtils.ts`. Text size reduced on mobile (text-sm) with truncate class to prevent overflow.
ADVANCED SEARCH WIDGET PRIVACY: Search results show username only - no real names or local/traveler type tags displayed. User cards are clickable to view full profiles. Connect button works independently from card click navigation.
AI BIO GENERATOR: Profile page includes "Generate bio for me" button that uses AI (Anthropic Claude with OpenAI fallback) to generate a personalized bio based on user's existing profile data (interests, activities, travel style, hometown, languages, etc.). Requires at least 3 interests/activities to generate. Uses session-based authentication for security. Service at `server/services/aiBioGenerator.ts`, endpoint at POST `/api/users/generate-bio`.
CITY MATCH RENAMED TO CITY PLANS: "City Match" has been renamed to "City Plans" throughout the UI for cleaner branding. The feature at /match-in-city now displays 20 universal travel activities (intents like "Meet New People", "Restaurants & Local Eats", "Hiking & Nature") instead of the previous 40 items.
PER-TRIP TRAVEL GROUP: The `travel_plans` table now has a nullable `travelGroup` field (solo/couple/friends/family) that allows per-trip override of the user's default profile travel group. The Plan Trip form includes a "Trip Vibe" selector pre-filled from the user's profile. Matching logic uses the trip's travelGroup if set, otherwise falls back to the profile's travelGroup. This ensures someone who usually travels solo can correctly match with family travelers when doing a family trip.
SIMPLIFIED 2-STEP TRIP CREATION FLOW: Step 1 (Plan Trip page) collects minimal info: destination, dates, trip vibe (solo/couple/friends/family), and optional trip tags (Business Trip, Digital Nomad, First time here - max 3). Removed accommodation/transportation fields (not used for matching yet). After creating a trip, user is redirected to Step 2 (City Plans page) to pick 3-8 activities for matching. Edit mode still redirects to profile.
HOSTEL CONNECT FEATURE: Optional hostel matching added to trip planning. Users can enter their hostel name and choose visibility: "private" (used only for matching with others at the same hostel) or "public" (shown on profile). Database fields: `hostel_name` and `hostel_visibility` in travel_plans table. Users can update hostel info anytime after trip creation when they know which hostel they're staying at. Matching logic requires: same destination + overlapping dates + matching hostel name. Advanced Search has "Hostel Connect" filter to find travelers at the same hostel. Profile page displays "🏨 Staying at [Hostel]" when visibility is public and trip is active. Search results show "🏨 Same hostel!" badge when hostel filter matches.
AUTOMATIC CITY INFRASTRUCTURE: When a user selects a city for their trip destination OR hometown during signup, the system automatically creates city infrastructure if it doesn't exist: city page, chatroom, and city activities. This ensures all cities with users have complete functionality without manual setup.

## System Architecture

### Frontend
- **Technology Stack**: React 18 with TypeScript, Vite, Tailwind CSS with shadcn/ui, Wouter, and TanStack Query.
- **PWA**: Progressive Web App with mobile-first design and offline capabilities.
- **UI/UX Decisions**: MBA-level design with clear value propositions, consistent branding (orange-blue theme, standardized hero sections), dynamic CSS, and comprehensive mobile optimization. Navigation includes a chat rooms tab. Streamlined signup and prominent display of user events. Intelligent metropolitan area consolidation for chatrooms. Improved readability through color accessibility. Custom text entry for interests/activities/events, diversity business ownership categories with privacy controls, repositioned languages widget, business geolocation mapping, enhanced business contact management, and support for email variants for managing multiple businesses.

### Backend
- **Technology Stack**: Node.js with Express and TypeScript for a type-safe RESTful API.
- **Authentication**: Session-based authentication integrated with Replit Auth, utilizing JWT for API requests and session middleware. Supports user roles for locals, travelers, and business accounts.
- **Real-time**: WebSocket support for live messaging, notifications, event updates, and connection status.
- **Structure**: Modular route organization.
- **Feature Specifications**: Automatic city infrastructure creation (city pages, chatrooms, activities) during user signup for both hometown and destination cities. Secure URL import feature for events using web scraping with security measures (HTTPS-only, domain whitelist, timeouts, size limits). Chatroom backfill API for assigning chatrooms to legacy users.

### Database
- **Primary Database**: PostgreSQL.
- **ORM**: Drizzle ORM.
- **Schema**: Comprehensive schema for users, travel plans, events, connections, messages, businesses, and sessions.
- **Performance Indexes**: 14 optimized indexes for users, connections, events, travel_plans, and user_photos tables.
- **Session Storage**: Redis-based session storage for persistent sessions across server restarts.

### Performance Optimizations
- **Profile Bundle Endpoint**: Single `/api/users/:userId/profile-bundle` endpoint consolidates 18 separate API calls into 1 batched request for 5-10x faster profile page loading.
- **Event Cache**: 5-minute cache for external event API calls.
- **Redis API Caching**: Centralized caching system using Redis with in-memory fallback for frequently accessed data.
- **Database Connection Pooling**: Neon serverless PostgreSQL with 100 connection pool, automatic health monitoring, and retry logic.
- **Health Monitoring**: `/api/health` endpoint provides real-time database health, connection pool status, and latency metrics.
- **Slow Request Logging**: Automatic logging of API requests taking >2 seconds.
- **WebSocket Multi-Instance Scaling**: Redis pub/sub enables real-time chat messaging across multiple server instances.

### AI Integration
- **AI Model**: Anthropic Claude Sonnet.
- **Capabilities**: AI-powered travel recommendations, photo analysis, user compatibility scoring, smart content generation, and AI-powered city activities enhancement.

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting.
- **Replit**: Development and deployment environment.

### AI & Machine Learning
- **Anthropic Claude API**: AI services.

### Communication Services
- **SendGrid**: Email delivery.
- **WebSocket (ws)**: Real-time communication.
- **Twilio**: SMS notifications.

### Payment Processing
- **Stripe**: For payments and subscriptions.

### UI/UX Libraries
- **Radix UI**: Accessible UI primitives.
- **Lucide React**: Icon library.
- **class-variance-authority**: CSS class management.
- **cmdk**: Command palette interface.

### Event & Data Integrations
- **StubHub**: Premium event listings.
- **Ticketmaster**: Event listings.
- **Meetup**: Local event feeds.