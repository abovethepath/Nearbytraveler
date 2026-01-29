## Overview
Nearby Traveler is a social networking platform designed to connect travelers, locals, and businesses through location-based meetups and cross-cultural interactions. It aims to enrich travel experiences and local engagement by facilitating real-time connections, offering AI-powered city content, robust photo management, mobile responsiveness, and a global map system for discovery. The platform’s vision is to foster authentic human connections and become the premier destination for genuine local experiences.

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
- **Feature Specifications**: Automatic city infrastructure creation (city pages, chatrooms, activities) during user signup for both hometown and destination cities. Secure URL import feature for events using web scraping (axios, cheerio) with security measures (HTTPS-only, domain whitelist, timeouts, size limits). Chatroom backfill API for assigning chatrooms to legacy users.

### Database
- **Primary Database**: PostgreSQL.
- **ORM**: Drizzle ORM.
- **Schema**: Comprehensive schema for users, travel plans, events, connections, messages, businesses, and sessions.
- **Performance Indexes**: 14 optimized indexes for users, connections, events, travel_plans, and user_photos tables.
- **Session Storage**: Redis-based session storage for persistent sessions across server restarts.

### Performance Optimizations
- **Profile Bundle Endpoint**: Single `/api/users/:userId/profile-bundle` endpoint consolidates 18 separate API calls into 1 batched request for 5-10x faster profile page loading.
- **Event Cache**: 5-minute cache for external event API calls (reduced from 30 seconds) for significant API cost savings.
- **Database Indexes**: 14 optimized indexes on frequently queried columns including user location fields, connection status, event dates, and travel plan dates.
- **Redis API Caching**: Centralized caching system (`server/cache.ts`) using Redis with in-memory fallback. Caches city stats, platform stats, and other frequently accessed data for 5 minutes.
- **Database Connection Pooling**: Neon serverless PostgreSQL with 100 connection pool, automatic health monitoring, and retry logic for transient failures.
- **Health Monitoring**: `/api/health` endpoint provides real-time database health, connection pool status, and latency metrics for monitoring.
- **Slow Request Logging**: Automatic logging of API requests taking >2 seconds for performance debugging.
- **WebSocket Multi-Instance Scaling**: Redis pub/sub (`server/services/redisPubSub.ts`) enables real-time chat messaging across multiple server instances for autoscale deployments.

### Scaling to 10,000+ Users
For production scaling on Replit:
1. **Use Autoscale Deployment**: Automatically scales up to handle traffic spikes, scales down to save costs when idle.
2. **Configure Max Instances**: Set maximum number of instances (4-8 recommended for 10K users).
3. **Instance Size**: Use at least 2 vCPU / 8GB RAM per instance for reliable performance.
4. **Redis Required**: REDIS_URL secret must be configured for session persistence and cross-instance WebSocket messaging.
5. **Monitor /api/health**: Check database latency and connection pool status regularly.
6. **Rate Limiting**: 3000 requests per 15 minutes per IP to prevent abuse while allowing real-time chat activity.

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
- **Twilio**: SMS notifications for event RSVPs.

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