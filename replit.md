# Overview
Nearby Traveler is a social networking platform connecting travelers, locals, and businesses through location-based meetups and cross-cultural interactions. It aims to enhance travel experiences and foster local engagement by providing real-time connections, AI-powered city content, robust photo management, mobile responsiveness, and a global map system. The platform focuses on authentic connections, local experiences, AI recommendations, smart content generation, and dynamic event creation, emphasizing real-time activity and community-driven features.

# User Preferences
Preferred communication style: Simple, everyday language.
User preference: Complete codebase replacement rather than selective merging when provided with improved versions.
Removed all moving animations including floating text, scaling buttons, and slide-in effects from home page to eliminate distracting movement, keeping only subtle color transitions.
Completely removed all photo functionality from city pages including galleries, upload widgets, background images, and related functions, replacing image hero sections with clean gradient backgrounds.
Business users should be redirected away from destination discovery page (/discover) to business dashboard, as destination exploration is for travelers, not businesses focused on local operations.
Implemented LA Metro dual visibility - users, businesses, and events in metro cities (Playa del Rey, Santa Monica, Venice, Culver City) now appear in both their specific city searches AND when searching "Los Angeles".
NEVER require bio during signup - removed bio requirement from all three signup forms (traveling, local, business) to maintain fast registration process. Users add bio later in profile editing.
ALWAYS use local timezone for ALL time displays - events, meetups, travel planning, quick meetups, chat timestamps, everything. Never use UTC or destination timezones, even for international trips. All times must display in user's local timezone for consistency and ease of understanding.
CRITICAL PROFILE DISPLAY REQUIREMENT: User profiles must ALWAYS show "Nearby Local • [Hometown]" - this line NEVER disappears under any circumstances. When user is actively traveling (has active travel plan within date range), an ADDITIONAL line "Nearby Traveler • [Destination]" appears BELOW the hometown line. Both lines show simultaneously during travel. The hometown line is permanent and immutable.
REMOVED PASSPORT STAMPS: All passport stamp gamification removed from the platform (pages, routes, widgets, storage). Aura points are the sole engagement/reward system.
APPLE APP STORE COMPLIANCE: Completely removed all private/adult interests functionality from the entire codebase to ensure Apple App Store approval. This includes removal of PRIVATE_INTERESTS array from shared/base-options.ts, all private interest selection UI from profile pages and signup flows, private interest filtering from search and matching, and all related database fields and API endpoints. The platform now only offers family-friendly public interests suitable for App Store guidelines.
CRITICAL UI/UX REQUIREMENT - SOLID WIDGETS: ALL modals, dialogs, popups, and widgets across the ENTIRE platform MUST have SOLID backgrounds (NOT translucent/transparent). Dialog overlays use bg-black/95 (95% opacity) and dialog content uses solid bg-white (light mode) or bg-gray-900 (dark mode). This ensures maximum readability and prevents background content from showing through. Applied site-wide to ALL Dialog, AlertDialog, and modal components in client/src/components/ui/. This is a permanent design standard that MUST be maintained in all existing code and all future code. No translucent widgets allowed anywhere on the platform.
WRAPPED iOS APP API COMPATIBILITY: All API calls must use absolute URLs when running in the wrapped iOS app WebView. A centralized `getApiBaseUrl()` helper in `client/src/lib/queryClient.ts` detects the environment (localhost/replit = relative URLs, other = absolute to nearbytraveler.org) and is integrated into both `apiRequest()` and the default React Query fetcher. This ensures profile editing, Match in City, and all other features work correctly in the wrapped app.
MUTUAL CONNECTIONS (CONNECTIONS IN COMMON) — PERMANENT FIX: The mutual connections query lives in `server/routes.ts` inside the profile-bundle endpoint (`/api/users/:userId/profile-bundle`) in the `computeConnectionDegree` function, and in the standalone endpoint `/api/connections/degree/:userId/:targetUserId`. Both use a SINGLE SQL JOIN query to find mutual connections (no JS array intersection). The bundle computation includes retry logic (1 retry on failure) and REFUSES to cache results when connectionDegree is null. The frontend (`client/src/pages/profile-complete.tsx`) has a fallback query that calls the standalone endpoint if the bundle's connectionDegree is null. The shared contacts count calculation lives in `client/src/lib/whatYouHaveInCommonStats.ts`. DO NOT add user ID exclusions, filtering, or WHERE clauses to these queries — every user (including nearbytrav, user ID 2) must be counted. Since every user is connected to nearbytrav, any two users should always show at least 1 mutual connection.
FIRST NAME / LAST NAME FEATURE: Users now have separate firstName and lastName DB columns (nullable for backward compat). Signup forms (traveling/local) show two fields: "First name or nickname" + "Last name". Business users keep Business Name + Name of Contact fields. Display throughout the site prioritizes firstName over username (fallback: username). Last name is stored privately and only visible in the admin dashboard. Display helper at `client/src/lib/displayName.ts`. The PUT /api/users/:id endpoint maps firstName→first_name, lastName→last_name. ProfileHeaderUser shows firstName as primary h1 with @username below it (only if firstName exists). Edit profile form includes a firstName field (no lastName field — admin only).
LIGHT MODE CLEAN PROFESSIONAL THEME: In light mode ONLY, the UI uses a clean black-and-white aesthetic. All primary CTA buttons are solid black with white text (no gradients). Secondary/outline buttons use black border and text. Gradient text headings are solid black. Section title icons (only inside h1-h4) are dark gray. The MeetupAlertBanner notification uses black background. Timer badges inside quick meetup cards use dark gray background. Card backgrounds are clean white with gray borders instead of colored/gradient tints. Dark mode is completely unaffected. All overrides are in `client/src/styles/light-mode-clean.css`. Color is preserved for: destructive red buttons, Available Now green indicators, and status badges.

# System Architecture

## Frontend
- **Technology Stack**: React 18 with TypeScript, Vite, Tailwind CSS with shadcn/ui, Wouter, and TanStack Query.
- **PWA**: Progressive Web App with mobile-first design and offline capabilities.
- **UI/UX Decisions**: MBA-level design principles, consistent orange-blue branding, standardized hero sections, dynamic CSS, comprehensive mobile optimization, streamlined signup, prominent display of user events, intelligent metropolitan area consolidation for chatrooms, custom text entry for interests/activities/events, diversity business ownership categories with privacy controls, repositioned languages widget, business geolocation mapping, and enhanced business contact management. Features include video intros, ambassador program pages, an activity feed, an events calendar, a city pulse strip, and auto-hiding hero sections. Viral growth features include live location shares, micro-experiences, activity templates & skill swaps, post-meetup shareable cards, and community tags.

## Backend
- **Technology Stack**: Node.js with Express and TypeScript for a type-safe RESTful API.
- **Authentication**: Session-based authentication integrated with Replit Auth, utilizing JWT for API requests and session middleware, supporting user roles (locals, travelers, business).
- **Real-time**: WebSocket support for live messaging, notifications, event updates, and connection status.
- **Structure**: Modular route organization.
- **Feature Specifications**: Automatic city infrastructure creation during user signup. Secure URL import for events using web scraping. Chatroom backfill API. Meetup chatrooms integrate into the main messages page.

## Database
- **Primary Database**: PostgreSQL with Drizzle ORM.
- **Schema**: Comprehensive schema for users, travel plans, events, connections, messages, businesses, and sessions, including tables for live location shares, micro-experiences, activity templates, meetup share cards, and community tags.
- **Performance Optimizations**: 14 optimized indexes, Redis-based session storage, profile bundle endpoint, event cache, two-level API cache (in-memory L1 + Redis L2), Neon serverless PostgreSQL with 100 connection pool, `/api/health` endpoint, slow request logging, WebSocket scaling with Redis pub/sub.

## AI Integration
- **AI Model**: Anthropic Claude Sonnet for recommendations, photo analysis, compatibility scoring, smart content generation, AI bio generation, AI Quick Create for events/meetups.
- **AI Help Chatbot**: OpenAI GPT-4o-mini for answering platform feature questions.

# External Dependencies

## Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting.
- **Replit**: Development and deployment environment.

## AI & Machine Learning
- **Anthropic Claude API**: AI services.
- **OpenAI**: AI services.

## Communication Services
- **SendGrid**: Email delivery.
- **WebSocket (ws)**: Real-time communication.
- **Twilio**: SMS notifications.

## Payment Processing
- **Stripe**: Payments and subscriptions.

## UI/UX Libraries
- **Radix UI**: Accessible UI primitives.
- **Lucide React**: Icon library.
- **class-variance-authority**: CSS class management.
- **cmdk**: Command palette interface.

## Event & Data Integrations
- **StubHub**: Premium event listings.
- **Ticketmaster**: Event listings.
- **Meetup**: Local event feeds.
- **Luma**: Event calendar sync via API.
- **Partiful**: Event calendar sync via ICS feed URL.