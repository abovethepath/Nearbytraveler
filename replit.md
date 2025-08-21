## Overview
Nearby Traveler is a social networking platform designed to connect travelers, locals, and businesses through location-based meetups and cross-cultural interactions. Its primary goal is to enrich travel experiences and local engagement by facilitating real-time connections. Key features include AI-powered city content, robust photo management, mobile responsiveness, and a global map system for discovering users, events, and businesses. The platform aims to foster authentic human connections and experiences, leveraging AI for intelligent features and a strong community focus.

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
User request: Mobile bottom navigation for business users should display "Create Deal" and "Create Quick Deal" instead of "Create Trip" and "Create Quick Meetup" to maintain consistent DEALS terminology (January 2025).
User request: LA Metro consolidation now uses centralized shared/constants.ts file defining METRO_AREAS configuration with 76 LA cities that are all connected through common variable, ensuring all LA Metro deals and content properly appear under "Los Angeles" searches (January 2025).
User stability note: Server properly configured for Replit (binds to 0.0.0.0, uses process.env.PORT). Vite config contains Replit plugins that may cause crashes but cannot be removed due to file restrictions (January 2025).
User report fix: "Things in common" display was broken on discover people cards - fixed frontend to calculate totals from API's sharedInterests, sharedEvents, and sharedActivities arrays instead of looking for non-existent totalCommonalities field (January 2025).
User request: NEVER require bio during signup - removed bio requirement from all three signup forms (traveling, local, business) to maintain fast registration process. Users add bio later in profile editing (January 2025).
User request: Red profile completion reminder bar restored to navbar - displays when users have incomplete profiles (missing bio, profile image, or less than 3 interests) with direct link to complete profile (January 2025).
User fix: Date of birth now properly carries over from signup forms to user profile - fixed storage.createUser method to ensure DOB field is preserved during user creation (January 2025).
User clarification: VOUCH system implementation - simplified credit system where anyone with at least one vouch can vouch for others unlimited times, no credit limitations, only requirement is having received at least one vouch to be able to vouch for others, @nearbytraveler is the founding seed member (January 2025).

## System Architecture

### Frontend
- **Technology Stack**: React 18 with TypeScript, Vite for fast builds, Tailwind CSS with shadcn/ui for UI components, Wouter for routing, and TanStack Query for state management.
- **PWA**: Designed as a Progressive Web App with mobile-first approach and offline capabilities.

### Backend
- **Technology Stack**: Node.js with Express and TypeScript for a type-safe RESTful API.
- **Authentication**: Session-based authentication integrated with Replit Auth.
- **Real-time**: WebSocket support for real-time communication.
- **Structure**: Modular route organization for various entities (users, events, businesses, messaging).

### Database
- **Primary Database**: PostgreSQL.
- **ORM**: Drizzle ORM for type-safe database operations.
- **Schema**: Comprehensive schema covering users, travel plans, events, connections, messages, businesses, and sessions.

### Authentication & Authorization
- **Integration**: Replit Auth for OAuth.
- **Security**: JWT for API requests and session middleware for protected routes.
- **Roles**: Supports user roles for locals, travelers, and business accounts.

### AI Integration
- **AI Model**: Anthropic Claude Sonnet.
- **Capabilities**: AI-powered travel recommendations, photo analysis, user compatibility scoring, and smart content generation (e.g., city-specific attractions, hashtags).

### Real-time Features
- **Core**: WebSocket server for live messaging, notifications, event updates, and connection status.

### UI/UX Decisions
- **Design Philosophy**: MBA-level design with clear value propositions, consistent branding (orange-blue theme, standardized hero sections), and dynamic CSS.
- **Mobile Optimization**: Comprehensive mobile-first design, responsive layouts, and optimized touch targets.
- **Navigation**: Mobile navigation includes a chat rooms tab.
- **User Experience**: Streamlined signup process, prominent display of user events, detailed user and business profiles, intelligent metropolitan area consolidation for chatrooms, and improved readability through color accessibility.
- **Feature Enhancements**: Custom text entry for interests/activities/events, diversity business ownership categories with privacy controls, repositioned languages widget for visibility, business geolocation mapping, enhanced business contact management, and support for email variants for managing multiple businesses.
- **Specific Fixes**: Corrected business location display for suburbs and ensured automatic welcome messages for business users.
- **Business Profile Editing**: Consolidated and streamlined the business profile editing interface, removing redundancies and improving data persistence.

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