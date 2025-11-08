## Overview
Nearby Traveler is a social networking platform designed to connect travelers, locals, and businesses through location-based meetups and cross-cultural interactions. Its core purpose is to enrich travel experiences and local engagement by facilitating real-time connections, offering AI-powered city content, robust photo management, mobile responsiveness, and a global map system for discovery. The platform aims to foster authentic human connections, leveraging AI for intelligent features and maintaining a strong community focus.

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
User stability note: Server properly configured for Replit (binds to 0.0.0.0, uses process.env.PORT). Vite config contains Replit plugins that may cause crashes but cannot be removed due to file restrictions.
User report fix: "Things in common" display was broken on discover people cards - fixed frontend to calculate totals from API's sharedInterests, sharedEvents, and sharedActivities arrays instead of looking for non-existent totalCommonalities field.
User request: NEVER require bio during signup - removed bio requirement from all three signup forms (traveling, local, business) to maintain fast registration process. Users add bio later in profile editing.
User request: Red profile completion reminder bar restored to navbar - displays when users have incomplete profiles (missing bio, profile image, or less than 3 interests) with direct link to complete profile.
User fix: Date of birth now properly carries over from signup forms to user profile - fixed storage.createUser method to ensure DOB field is preserved during user creation.
User requirement: ALWAYS use local timezone for ALL time displays - events, meetups, travel planning, quick meetups, chat timestamps, everything. Never use UTC or destination timezones, even for international trips. All times must display in user's local timezone for consistency and ease of understanding.
CRITICAL USER TYPE CONSISTENCY: Fixed all user type naming confusion. Only 2 user types exist: NEARBY LOCAL (userType: 'local') and NEARBY TRAVELER (userType: 'traveler'). Users are NEARBY TRAVELERS only when actively traveling with trip dates that are current. Fixed signup form mapping, destination field naming (destinationCity/State/Country), and temporal travel logic where users become travelers only during active trip periods.
NAVIGATION RELIABILITY FIX: Fixed navbar visibility issue for direct URL navigation - navbar now always shows for authenticated users regardless of authentication state timing. Authentication system properly checks all evidence sources (context, localStorage, authStorage) to ensure navbar appears immediately. Issue resolved through deployment restart.
USER TYPE STANDARDIZATION: Standardized user type system with clean code structure while maintaining brand consistency. Backend code uses simple values ('local', 'traveler') but UI displays branded names ("Nearby Local", "Nearby Traveler") for consistent branding throughout the interface.
CRITICAL PROFILE DISPLAY REQUIREMENT: User profiles must ALWAYS show "Nearby Local • [Hometown]" - this line NEVER disappears under any circumstances. When user is actively traveling (has active travel plan within date range), an ADDITIONAL line "Nearby Traveler • [Destination]" appears BELOW the hometown line. Both lines show simultaneously during travel. The hometown line is permanent and immutable - this system worked perfectly for 5 months and must never be changed.
AI ACTIVITIES ENHANCEMENT RESTORED: Successfully restored the missing AI-powered city activities enhancement feature. Added POST /api/city-activities/:cityName/enhance endpoint that calls enhanceExistingCityWithMoreActivities() function from auto-city-setup.js. The "🤖 Get More AI Activities" button (with data-testid="button-enhance-ai-activities") now properly triggers OpenAI API to generate city-specific activities. Activity pills have data-testid="activity-pill" for testing. The system loads universal activities first, then fetches city-specific activities, and allows AI enhancement to add more activities when needed.
APPLE APP STORE COMPLIANCE: Completely removed all private/adult interests functionality from the entire codebase to ensure Apple App Store approval. This includes removal of PRIVATE_INTERESTS array from shared/base-options.ts, all private interest selection UI from profile pages and signup flows, private interest filtering from search and matching, and all related database fields and API endpoints. The platform now only offers family-friendly public interests suitable for App Store guidelines.
EVENT INTERESTS REMOVED FROM PROFILES: Removed all event interest/preference selection from user profiles and bio pages. Event preferences (like "Concerts", "Sports Games") were location-specific and belonged in "Things I Want To Do" city-specific sections, not global profile interests. Community events functionality (Event Organizer Hub, meetups, event creation/attendance) remains fully intact and operational.
SITE-WIDE TAXONOMY CONSOLIDATION: Implemented centralized 115-item taxonomy in shared/base-options.ts as single source of truth for entire platform. New structure: TOP CHOICES (30 items) for primary interests like "Restaurants & Food Scene", "Meeting New People", "LGBTQIA+"; INTERESTS (67 items) for deeper personalization like "Sober Lifestyle", "420-Friendly", "Wellness & Mindfulness"; ACTIVITIES (18 items) for concrete actions like "Restaurant Hopping", "Beach Hangouts", "Photography Walks". This eliminates redundancy across signup forms, profile editing, trip planning, and search. Custom text entry preserved through customInterests/customActivities fields allowing users to add personalized options beyond the standard lists.
AUTOMATIC CITY INFRASTRUCTURE CREATION: Implemented automatic city infrastructure creation during user signup for organic growth tracking. When users sign up, the system automatically creates complete city infrastructure (city pages, chatrooms, activities) for BOTH hometown cities AND destination cities (for travelers). This enables tracking of user origins and destinations for organic growth strategy. The ensureCityExists() function creates: (1) City page entry in city_pages table for SEO and discovery, (2) Default city chatrooms (Welcome Newcomers, Let's Meet Up), (3) AI-generated city activities. Fixed traveler signup to properly set destinationCity/State/Country fields separately from travelDestination for city discovery matching.
CRITICAL UI/UX REQUIREMENT - SOLID WIDGETS: ALL modals, dialogs, popups, and widgets across the ENTIRE platform MUST have SOLID backgrounds (NOT translucent/transparent). Dialog overlays use bg-black/95 (95% opacity) and dialog content uses solid bg-white (light mode) or bg-gray-900 (dark mode). This ensures maximum readability and prevents background content from showing through. Applied site-wide to ALL Dialog, AlertDialog, and modal components in client/src/components/ui/. This is a permanent design standard that MUST be maintained in all existing code and all future code. No translucent widgets allowed anywhere on the platform.
EVENT IMPORT FROM URL: Implemented secure URL import feature allowing users to auto-populate event creation forms by pasting Couchsurfing or Meetup event URLs. Backend endpoint POST /api/events/import-url uses axios and cheerio for web scraping with comprehensive security measures: (1) HTTPS-only enforcement, (2) Domain whitelist (couchsurfing.com, meetup.com only), (3) Request timeouts (10s), (4) Size limits (5MB max), (5) Defensive parsing with null checks and fallbacks. Frontend displays "Quick Import from URL" card on event creation page with auto-fill functionality for title, organizer, location, date, time, and cover image. Feature includes production-ready error handling with specific user-friendly messages for timeouts, 404s, access denied, and parsing failures. This eliminates manual data entry and reduces event creation time from minutes to seconds.
MOBILE PROFILE LOCATION CARDS FIX: Fixed mobile profile page to display "Nearby Local" and "Nearby Traveler" location cards with consistent sizing and proper vertical stacking. Both cards now use identical font sizing (text-sm font-medium) and are wrapped in flex-col container with gap-1 spacing for uniform appearance across all mobile devices. This ensures travelers' dual identity (hometown + destination) displays cleanly on small screens.
MOBILE BIO EDITING UX IMPROVEMENT: Fixed profile editing Save button positioning on mobile devices. Save/Cancel buttons are now sticky at bottom of screen (sticky bottom-0) with solid background, ensuring they remain accessible without scrolling to bottom of long forms. On desktop (md breakpoint), buttons revert to normal flow positioning. This significantly improves mobile editing experience for long profile forms with many fields.
CHATROOM BACKFILL API: Created POST /api/admin/backfill-chatrooms endpoint to manually assign chatrooms to existing users who were created before automatic chatroom assignment feature. Endpoint accepts optional userId parameter (processes single user) or processes all users if omitted. Returns detailed status including totalProcessed, successCount, errorCount, and first 10 errors. Essential for retroactively assigning proper chatrooms (hometown, destination, global) to legacy user accounts.
COUNTRIES VISITED COUNT FIX: Fixed default countries visited count for new travelers to include BOTH hometown country AND destination country (count: 2) instead of only hometown country (count: 1). Updated storage.createUser method to properly seed countriesVisited array with both locations when user signs up as currently traveling, providing more accurate travel profile representation from day one.
TRAVELING DISPLAY NULL GUARD: Added null check safeguard to user cards to prevent "Traveling to null" display when destination data is missing. Cards now only show "Traveling to [destination]" badge when valid destination data exists, with proper fallback to legacy travelDestination field for backward compatibility.

## System Architecture

### Frontend
- **Technology Stack**: React 18 with TypeScript, Vite, Tailwind CSS with shadcn/ui, Wouter, and TanStack Query.
- **PWA**: Progressive Web App with mobile-first design and offline capabilities.

### Backend
- **Technology Stack**: Node.js with Express and TypeScript for a type-safe RESTful API.
- **Authentication**: Session-based authentication integrated with Replit Auth.
- **Real-time**: WebSocket support.
- **Structure**: Modular route organization.

### Database
- **Primary Database**: PostgreSQL.
- **ORM**: Drizzle ORM.
- **Schema**: Comprehensive schema for users, travel plans, events, connections, messages, businesses, and sessions.

### Authentication & Authorization
- **Integration**: Replit Auth for OAuth.
- **Security**: JWT for API requests and session middleware.
- **Roles**: Supports user roles for locals, travelers, and business accounts.

### AI Integration
- **AI Model**: Anthropic Claude Sonnet.
- **Capabilities**: AI-powered travel recommendations, photo analysis, user compatibility scoring, and smart content generation.

### Real-time Features
- **Core**: WebSocket server for live messaging, notifications, event updates, and connection status.

### UI/UX Decisions
- **Design Philosophy**: MBA-level design with clear value propositions, consistent branding (orange-blue theme, standardized hero sections), and dynamic CSS.
- **Mobile Optimization**: Comprehensive mobile-first design, responsive layouts, and optimized touch targets.
- **Navigation**: Mobile navigation includes a chat rooms tab.
- **User Experience**: Streamlined signup, prominent display of user events, detailed user and business profiles, intelligent metropolitan area consolidation for chatrooms, improved readability through color accessibility.
- **Feature Enhancements**: Custom text entry for interests/activities/events, diversity business ownership categories with privacy controls, repositioned languages widget, business geolocation mapping, enhanced business contact management, and support for email variants for managing multiple businesses.

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