## Overview
Nearby Traveler is a social networking platform designed to connect travelers, locals, and businesses through location-based meetups and cross-cultural interactions. Its core purpose is to enrich travel experiences and foster local engagement by providing real-time connections, AI-powered city content, robust photo management, mobile responsiveness, and a global map system for discovery. The platform aims to be the leading destination for authentic human connections and genuine local experiences, offering AI-powered travel recommendations, smart content generation, and dynamic event creation.

## User Preferences
Preferred communication style: Simple, everyday language.
User preference: Complete codebase replacement rather than selective merging when provided with improved versions.
Removed all moving animations including floating text, scaling buttons, and slide-in effects from home page to eliminate distracting movement, keeping only subtle color transitions.
Completely removed all photo functionality from city pages including galleries, upload widgets, background images, and related functions, replacing image hero sections with clean gradient backgrounds.
Business users should be redirected away from destination discovery page (/discover) to business dashboard, as destination exploration is for travelers, not businesses focused on local operations.
Implemented LA Metro dual visibility - users, businesses, and events in metro cities (Playa del Rey, Santa Monica, Venice, Culver City) now appear in both their specific city searches AND when searching "Los Angeles".
NEVER require bio during signup - removed bio requirement from all three signup forms (traveling, local, business) to maintain fast registration process. Users add bio later in profile editing.
ALWAYS use local timezone for ALL time displays - events, meetups, travel planning, quick meetups, chat timestamps, everything. Never use UTC or destination timezones, even for international trips. All times must display in user's local timezone for consistency and ease of understanding.
CRITICAL PROFILE DISPLAY REQUIREMENT: User profiles must ALWAYS show "Nearby Local • [Hometown]" - this line NEVER disappears under any circumstances. When user is actively traveling (has active travel plan within date range), an ADDITIONAL line "Nearby Traveler • [Destination]" appears BELOW the hometown line. Both lines show simultaneously during travel. The hometown line is permanent and immutable - this system worked perfectly for 5 months and must never be changed.
REMOVED PASSPORT STAMPS: All passport stamp gamification removed from the platform (pages, routes, widgets, storage). Aura points are the sole engagement/reward system. The passport_stamps database table still exists but is unused.
APPLE APP STORE COMPLIANCE: Completely removed all private/adult interests functionality from the entire codebase to ensure Apple App Store approval. This includes removal of PRIVATE_INTERESTS array from shared/base-options.ts, all private interest selection UI from profile pages and signup flows, private interest filtering from search and matching, and all related database fields and API endpoints. The platform now only offers family-friendly public interests suitable for App Store guidelines.
CRITICAL UI/UX REQUIREMENT - SOLID WIDGETS: ALL modals, dialogs, popups, and widgets across the ENTIRE platform MUST have SOLID backgrounds (NOT translucent/transparent). Dialog overlays use bg-black/95 (95% opacity) and dialog content uses solid bg-white (light mode) or bg-gray-900 (dark mode). This ensures maximum readability and prevents background content from showing through. Applied site-wide to ALL Dialog, AlertDialog, and modal components in client/src/components/ui/. This is a permanent design standard that MUST be maintained in all existing code and all future code. No translucent widgets allowed anywhere on the platform.
WRAPPED iOS APP API COMPATIBILITY: All API calls must use absolute URLs when running in the wrapped iOS app WebView. A centralized `getApiBaseUrl()` helper in `client/src/lib/queryClient.ts` detects the environment (localhost/replit = relative URLs, other = absolute to nearbytraveler.org) and is integrated into both `apiRequest()` and the default React Query fetcher. This ensures profile editing, Match in City, and all other features work correctly in the wrapped app.
ADVANCED SEARCH WIDGET PRIVACY: Search results show username only - no real names or local/traveler type tags displayed. User cards are clickable to view full profiles. Connect button works independently from card click navigation.
AUTOMATIC HOSTEL MATCH DETECTION: When viewing another user's profile, if both users have overlapping trips at the same hostel in the same destination, a prominent orange banner appears: "🏨 You're both staying at [Hostel]!" - no search required, works automatically.
AVAILABLE NOW GROUP CHAT: When accepting meet requests from Available Now, instead of creating individual DMs with each accepted person, the system creates a single group chat (Couchsurfing-style) tied to the Available Now session. First acceptance creates the group, subsequent acceptances add people automatically. Both the host and accepted requesters can access the group chat from the Available Now widget. Uses meetupChatrooms table with availableNowId field. API endpoints: /api/available-now/group-chat, /api/available-now/my-group-chats, /api/available-now/group-chat/:chatroomId/messages.
VIDEO INTRO ON PROFILE: Users can upload a 15-30 second video intro on their profile page (below bio section). Videos stored in object storage under video-intros/{userId}/. API endpoints: POST /api/users/:id/video-intro/upload-url (get signed upload URL), PUT /api/users/:id/video-intro (confirm upload), GET /api/users/:id/video-intro (get signed read URL), DELETE /api/users/:id/video-intro. Component: client/src/components/VideoIntro.tsx. Own profile shows "Add a video intro" link; others see "Watch Video Intro" button that opens fullscreen modal player. Upload, confirm, and delete endpoints require auth (own profile only). Not shown for business profiles.
AMBASSADOR PROGRAM PAGES: Two separate ambassador pages exist: (1) /ambassador-program — public landing page for non-logged-in visitors with LandingHeader/Footer, (2) /ambassador-info — internal app page for logged-in users with dark UI, no landing page layout. The "Learn about the Ambassador Program" link in profile Travel Stats points to /ambassador-info. The /dashboard/ambassador route shows the ambassador dashboard.
ACTIVITY PAGE & HISTORY LOG: Activity is a top-level nav item at /activity (removed from Explore page). The ActivityFeed component (`client/src/components/ActivityFeed.tsx`) merges notifications (from `notifications` table) with activity log entries (from `activity_log` table). Activity log entries are written by `server/services/activityLogService.ts` via `writeActivityLog()` when users: send/accept connection requests, accept/decline meet requests, RSVP to events, or join communities. Feed shows newest first, capped at 50 items. Filter tabs: All / Events / Connections / Messages. Meet request cards open a profile modal with Accept/Decline. All items are clickable and navigate to the relevant profile, event, or community page. Empty state shows "No activity yet" with Explore button.
EVENTS CALENDAR: Monthly calendar view at /calendar showing city-based events with color-coded dots (green=one-time, orange=weekly recurring, blue=monthly recurring). Component: `client/src/components/NearbyTravelerCalendar.tsx`, Page: `client/src/pages/calendar.tsx`. Features: city picker on first load, month navigation, day click to expand events, event creation dialog with recurring toggle (none/weekly/monthly), day-of-week picker for weekly, day-of-month picker for monthly. Uses existing events table columns (isRecurring, recurrenceType, recurrencePattern). Recurring instances generated client-side. API extended with `calendarView=true` parameter for 120-day lookahead (vs default 42 days). Calendar link added to events page next to "Past Events" button.
VIRAL FEATURES (Explore Page at /explore): Added comprehensive viral growth features including: (1) Live Location Shares - "I'm at [place] for the next hour" expiring location posts like Instagram Stories for IRL meetups, (2) Micro-Experiences - Quick 15-90 min structured activities with join/leave, capacity limits, energy levels, and city-based discovery, (3) Activity Templates & Skill Swaps - Pre-built activity structures like "Coffee Walk", "Taco Crawl", "Gym Buddy Session" plus skill swap templates like "Photography tips for Korean language practice", (4) Post-Meetup Shareable Cards - Auto-generated "We met on Nearby Traveler" content with country flags and profile pics for Instagram/TikTok sharing, (5) Community Tags - Self-selected identity communities (Solo Female Traveler, LGBTQ+ Traveler, Digital Nomad, Foodie, Fitness, Budget/Luxury, Photography, Nightlife, Culture, Adventure, Language Exchange, Sober Social, Family, Eco Traveler) for discovery and matching. Database tables: live_location_shares, live_share_reactions, micro_experiences, micro_experience_participants, activity_templates, meetup_share_cards, community_tags, user_community_tags. Navigate via "Explore" in navbar (icon: ⚡).

## System Architecture

### Frontend
- **Technology Stack**: React 18 with TypeScript, Vite, Tailwind CSS with shadcn/ui, Wouter, and TanStack Query.
- **PWA**: Progressive Web App with mobile-first design and offline capabilities.
- **UI/UX Decisions**: MBA-level design principles, consistent orange-blue branding, standardized hero sections, dynamic CSS, comprehensive mobile optimization, and a chat rooms tab in navigation. Features streamlined signup, prominent display of user events, intelligent metropolitan area consolidation for chatrooms, custom text entry for interests/activities/events, diversity business ownership categories with privacy controls, repositioned languages widget, business geolocation mapping, and enhanced business contact management.

### Backend
- **Technology Stack**: Node.js with Express and TypeScript for a type-safe RESTful API.
- **Authentication**: Session-based authentication integrated with Replit Auth, utilizing JWT for API requests and session middleware, supporting user roles (locals, travelers, business).
- **Real-time**: WebSocket support for live messaging, notifications, event updates, and connection status.
- **Structure**: Modular route organization.
- **Feature Specifications**: Automatic city infrastructure creation during user signup for both hometown and destination cities. Secure URL import feature for events using web scraping with security measures. Chatroom backfill API for assigning chatrooms to legacy users.

### Database
- **Primary Database**: PostgreSQL.
- **ORM**: Drizzle ORM.
- **Schema**: Comprehensive schema for users, travel plans, events, connections, messages, businesses, and sessions.
- **Performance Optimizations**: 14 optimized indexes for key tables. Redis-based session storage. Profile bundle endpoint consolidates 18 API calls into 1. Event cache with 5-minute duration. Two-level API cache (in-memory L1 + Redis L2). Neon serverless PostgreSQL with 100 connection pool. `/api/health` endpoint for monitoring. Slow request logging for API calls exceeding 2 seconds. WebSocket scaling with Redis pub/sub for multi-instance chat.

### AI Integration
- **AI Model**: Anthropic Claude Sonnet.
- **Capabilities**: AI-powered travel recommendations, photo analysis, user compatibility scoring, smart content generation, AI-powered city activities enhancement, AI bio generation, AI Quick Create for events, and AI Quick Create for meetups with voice input.
- **AI Quick Meetup**: Voice/text input for creating quick meetups, parsing natural language into structured meetup data.
- **AI Help Chatbot**: Floating help assistant answering platform feature questions, using OpenAI GPT-4o-mini with comprehensive platform knowledge.

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting.
- **Replit**: Development and deployment environment.

### AI & Machine Learning
- **Anthropic Claude API**: AI services.
- **OpenAI**: AI services (for AI Bio Generator and Help Chatbot).

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
- **Luma**: Event calendar sync via API.
- **Partiful**: Event calendar sync via ICS feed URL.