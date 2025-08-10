## Overview
Nearby Traveler is a social networking platform designed to connect travelers, locals, and businesses through location-based meetups and cross-cultural interactions. Its core purpose is to enhance travel experiences and local engagement by fostering real-time connections. Key capabilities include AI-powered city content generation, robust photo management, mobile responsiveness, and a global map system for discovering users, events, and businesses.

## Recent Critical Fixes (August 2025)
- **MOBILE INTERNAL SERVER ERROR RESOLVED** (August 8): CRITICAL FIX - Fixed mobile internal server errors caused by missing `/api/users/current` endpoint. Added proper authentication validation that handles missing or invalid user sessions gracefully without throwing "NaN" errors. Mobile preview now loads perfectly with all features working including People Discovery, interactive map, and real-time messaging.
- **PRODUCTION SECURITY HARDENING COMPLETED** (August 8): CRITICAL SECURITY - Implemented comprehensive production-level security based on ChatGPT 5.0 audit. Added helmet security headers, CORS protection, Redis-based rate limiting (100 requests/15min), Redis session store, photo upload validation (2MB limit, PNG/JPEG only), proper error handling middleware, and .env.example with Redis configuration. Fixed client-side NODE_ENV leak by replacing with import.meta.env.DEV. Project now ready for secure beta deployment.
- **SECRET ACTIVITIES SIGNUP-TO-PROFILE DATA FLOW FIXED** (August 6): CRITICAL FIX - Resolved disconnection between signup and profile display of secret activities. During registration, secret activities were only saved to `secret_local_experiences` table but not to user's `secretActivities` field that profiles read from. Fixed registration code to consistently save to both locations for new signups, and migrated existing users' signup secret activities to their profile fields. Users no longer need to re-enter secret activities they provided during signup.
- **COMPREHENSIVE SHARED MATCHES SYSTEM IMPLEMENTED** (August 6): CRITICAL BREAKTHROUGH - Completely overhauled shared matches calculation to be 100% authentic for investor presentations. System now calculates ALL shared matches including interests + activities + events (not just interests). User 16 vs User 1 now correctly shows "5 shared matches" based on real data like "Fine Dining", "Escape Rooms", "Craft Beer & Breweries". Created new API endpoint `/api/users/:currentUserId/shared-matches/:otherUserId` for detailed match analysis. Updated both People Discovery display and user priority sorting algorithms to use comprehensive match counting.
- **FAKE SHARED INTERESTS ELIMINATED** (August 6): CRITICAL FIX - Completely removed hardcoded fake shared interests from People Discovery that was showing "3 shared interests" for all users including self. Replaced with real shared interests calculation that parses actual user interest arrays and finds genuine commonalities. Now properly shows meaningful connection data like "2 shared interests" only when users actually have shared interests, or displays real location info instead of fake proximity.
- **CITY MATCH SYNCHRONIZATION FIXED** (August 6): Fixed critical cache invalidation bug where profile page "Things I Want to Do" section wasn't updating when activities/events were added on city match pages. Added proper queryClient.invalidateQueries calls to match-in-city.tsx for both activities and events. Created missing `/api/users/:id/all-events` endpoint that was causing HTML responses.
- **FAKE DISTANCES COMPLETELY REMOVED**: Eliminated all fake distance calculations ("3 mi", "5 mi", etc.) from People Discovery. Now shows meaningful connection data like "2 shared interests" or actual city/state instead of misleading proximity numbers when geolocation isn't implemented.
- **FAKE EVENT USERS DELETED**: Removed 3 fake database users (ticketmaster_events, local_la_feeds, allevents_api) that were incorrectly appearing as people in discovery section instead of events.
- **SHARED MATCHES PRIORITIZED**: User sorting now prioritizes TOTAL shared matches count (interests + activities + events) FIRST, then location relevance. Users with more common data appear at top regardless of geographical proximity.
- **CONNECTION-BASED DISCOVERY**: People Discovery section now emphasizes authentic connection strength (comprehensive shared matches) over fake geographical data, with green heart icons highlighting common interests.
- **SECRET ACTIVITIES BUG RESOLVED**: Fixed major display issue where only 1 secret activity showed for Los Angeles instead of all 12. Root cause: `getSecretLocalExperiencesByCity` method was querying user profiles instead of the `secret_local_experiences` table. Now properly queries database table with correct joins and returns all secret experiences sorted by popularity and date.
- **TYPESCRIPT ERRORS FIXED**: Resolved TypeScript compilation errors on home.tsx line 285 (missing return in useEffect) and line 1867 (implicit any type for 'interest' parameter).
- **ROUTING REGRESSION FIXED**: Corrected "See All" buttons in PeopleDiscoveryWidget that were incorrectly redirecting to city pages instead of users list. Now properly routes to `/users?type=all&location=nearby`.
- **NAMING STANDARDIZATION**: Updated all references from "Secret Local Activities" to "Secret Activities" for consistent branding across SecretExperiencesWidget component.
- **CONNECT BUTTON FIX**: Fixed Connect button logic so nearbytraveler (user.id = 1) always shows "Connected" in green instead of "Connect" button.
- **BROKEN EVENT SELECTION REMOVED**: Completely removed all broken event Interest/Going buttons from Events page. These were not functioning properly and user requested removal instead of fixing. Cleaned up unused event interest mutation code and helper functions.
- **EDIT BUTTON FIXED**: Fixed critical edit functionality in "Things I Want to Do" profile section. Users can now properly delete expired events and activities from their interest lists. Added missing event deletion buttons and API calls to removeEventMutation that were preventing users from removing half the items in the widget.

## User Preferences
- Keep technical explanations minimal for non-technical user
- Focus on fixing functionality over code optimization
- Prioritize app functionality over warnings/minor issues
- Interface Design: Simple blue pill buttons that turn green when selected
- CRITICAL DESIGN PREFERENCE: No bright colored action boxes or flashy UI elements
- City Organization: Show activities listed by city with toggle buttons
- Edit Functionality: User wants ability to edit/delete individual activity toggles
- Design Motto: "SIMPLE AND PERFECT... EASY TO SEE, EASY TO DIGEST"
- Development Approach: Use sequential thinking for all site building - break down problems step by step and implement solutions methodically
- CRITICAL: NEVER ADD COST FIELDS ANYWHERE
- Personal Communication: Use first name "Aaron" in all messages for personality and personal touch
- Profile-first Welcome Flow: Users should go to profile page first from welcome screen to upload their avatar photo.
- DISTANCE DISPLAY: NEVER show fake distances unless actual geolocation is implemented. Instead show connection strength (shared interests count) or actual city/state information.
- CONNECTION PRIORITY: Always prioritize shared interests over geographical proximity for user discovery and matching.

## System Architecture
The platform is built with a modern web stack emphasizing responsiveness and scalability.

- **Frontend**: Developed with React.js and TypeScript, utilizing Tailwind CSS and shadcn/ui. UI/UX emphasizes a streamlined, compact layout with proper spacing, visual hierarchy, customizable gradient profile headers, and immediate visual feedback. Mobile-responsive design with appropriate breakpoints and touch-friendly interfaces.
- **Backend**: Powered by an Express.js server, supporting robust API handling and real-time communication via WebSockets.
- **Database**: PostgreSQL with Drizzle ORM for data persistence, managing complex schemas for user profiles, travel plans, events, quick meetups, and business offers.
- **Routing**: Wouter is used for efficient client-side routing.
- **Automated RSS Event Collection**: Comprehensive multi-city RSS monitoring system with smart publication-based scheduling and validated working feeds.
- **Technical Implementations**:
    - **Location-Based Matching**: Advanced algorithms, including a global metropolitan area consolidation system and AI-powered city content generation, enable discovery of users, events, and businesses within broader geographical regions.
    - **Travel Status & Itinerary Management**: Dynamic tracking of user travel status, detailed travel plan creation, and automatic saving of itineraries to past trips.
    - **Real-Time Communication**: Instant messaging and group chat functionalities via WebSockets.
    - **User and Business Profiles**: Comprehensive profiles with tailored interfaces and functionalities.
    - **Photo Management System**: Robust system for profile, cover, and "Travel Memories" uploads with CRUD operations, caching, and pagination.
    - **Compatibility Scoring**: A weighted, asymmetric algorithm for calculating user compatibility based on shared interests, activities, events, and travel data.
    - **Quick Meetups**: Creation and management of time-sensitive, location-specific meetups.
    - **Event Management**: Comprehensive system for creating, updating, and participating in events with detailed information and chatrooms, including robust timezone handling and multi-source event discovery.
    - **Business Features**: Dashboards for managing deals, tracking subscriptions, and receiving real-time customer match notifications.
    - **Reference System**: Functionality for users to write and receive references.
    - **Activity Discovery**: City-specific activity lists with authentic landmark names.
    - **Map System**: Interactive map displaying users, events, and businesses with Leaflet pin markers and metropolitan area consolidation.
    - **Onboarding**: New user onboarding includes auto-connection, welcome messages, and aura point awards for various actions.
    - **Travel Intent Quiz**: Integrated quiz collecting travel preferences for better user matching, accessible during trip planning.
    - **Vouch System**: Simplified vouching system showing numerical counts, integrated into travel stats, with warning messages for users. Vouch credits system has been removed; users can vouch for unlimited people once they receive at least one vouch themselves, as long as they are connected. Updated messaging encourages making friends and connections to get vouched into the credibility network.

## External Dependencies
- **PostgreSQL**: Primary database.
- **Drizzle ORM**: For database interaction.
- **Stripe**: For subscription management and payment processing.
- **WebSockets**: For real-time communication.
- **Anthropic Claude-4**: For AI-powered city content generation.
- **Leaflet**: Mapping library.
- **AllEvents.in API**: For comprehensive city event discovery.
- **Ticketmaster API**: For major concerts, sports events, and theater productions.
- **Multi-City RSS Feeds**: Including Timeout Magazine, LAist, Gothamist, Village Voice, and specific local LA feeds for curated local events.