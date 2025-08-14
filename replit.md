## Overview
Nearby Traveler is a social networking platform that connects travelers, locals, and businesses through location-based meetups and cross-cultural interactions. Its core purpose is to enhance travel experiences and local engagement by fostering real-time connections. Key capabilities include AI-powered city content, robust photo management, mobile responsiveness, and a global map system for discovering users, events, and businesses. The platform aims to foster authentic human connections and experiences, leveraging AI for intelligent features and a strong focus on community.

## User Preferences
Preferred communication style: Simple, everyday language.
User preference: Complete codebase replacement rather than selective merging when provided with improved versions.
User request: Removed separate "My Events" tab - all user events now appear prominently at top of Community Events section with special styling and management buttons.
User request: Removed "Your premier destination for authentic local experiences" tagline from city page headers for cleaner design.
User request: Removed all moving animations including floating text, scaling buttons, and slide-in effects from home page to eliminate distracting movement, keeping only subtle color transitions.
User request: Completely removed all photo functionality from city pages including galleries, upload widgets, background images, and related functions, replacing image hero sections with clean gradient backgrounds.

## System Architecture

### Frontend Architecture
- **React 18 + TypeScript**: Modern React with type safety.
- **Vite Build System**: Fast development and optimized production builds.
- **Tailwind CSS + shadcn/ui**: Utility-first CSS framework with a pre-built component library.
- **Wouter**: Lightweight client-side routing.
- **TanStack Query**: Server state management and caching.
- **Progressive Web App (PWA)**: Mobile-first design with offline capabilities.

### Backend Architecture
- **Node.js + Express**: RESTful API server with middleware.
- **TypeScript**: Full type safety.
- **Session-based Authentication**: Secure user sessions with Replit Auth integration.
- **Real-time Communication**: WebSocket support for instant messaging and live updates.
- **Modular Route Structure**: Organized API endpoints for users, events, travel plans, businesses, and messaging.

### Database Design
- **PostgreSQL**: Primary relational database.
- **Drizzle ORM**: Type-safe database operations with schema validation.
- **Comprehensive Schema**: Users, travel plans, events, connections, messages, businesses, business offers, and session storage.

### Authentication & Authorization
- **Replit Auth Integration**: OAuth-based authentication system.
- **JWT Token Management**: Secure token handling for API requests.
- **Session Middleware**: Protected route enforcement.
- **User Role System**: Support for locals, travelers, and business accounts.

### AI Integration
- **Anthropic Claude Sonnet**: AI model for intelligent features.
- **Travel Recommendations**: AI-powered destination and activity suggestions.
- **Photo Analysis**: Automatic image categorization and tagging.
- **Match Compatibility**: AI-driven user compatibility scoring.
- **Smart Content Generation**: Automated hashtag and description generation, including city-specific tourist attractions.

### Real-time Features
- **WebSocket Server**: Live messaging and notifications.
- **Event Updates**: Real-time event participation and chat rooms.
- **Connection Management**: Live status updates for user connections.
- **Instant Notifications**: Push notifications for messages and events.

### UI/UX Decisions
- **Landing Page**: MBA-level design with punchy value proposition, founder's story, no-signup-required CTA, lu.ma-style design, and triple sticky visibility. Features authentic data and vibrant orange-blue color themes with dynamic CSS animations. All landing pages are standardized with consistent hero section structure, photo sizes, text positioning, orange border styling, and colorful text treatment.
- **Mobile Optimization**: Comprehensive mobile-first optimizations including responsive design, touch targets (48px minimum), mobile-first layouts, and touch manipulation CSS properties.
- **Navigation**: Mobile navigation includes a chat rooms tab in the bottom navigation.
- **User Profiles**: Displays user's quick meetups and correct travel status vs. hometown.
- **Event Display**: Shows recurring event information, new events appear first, and user events are prominently displayed in Community Events.
- **City Content**: Integration of authentic city photos and AI-generated tourist attractions.
- **User Cards**: Enhanced with larger photos, Load More/Load Less functionality, and improved compatibility display.
- **Metropolitan Area Consolidation**: Intelligent system preventing suburb chatroom creation while organizing major metropolitan areas. Only major metros get system-created chatrooms (e.g., "Welcome Newcomers [Metro]", "Let's Meet Up [Metro]"). Suburbs automatically consolidate to their parent metro area (e.g., Culver City → Los Angeles Metro). This system applies globally to all major cities.
- **Widget Repositioning**: SecretExperiencesWidget is positioned higher in the city page sidebar layout, after CityStatsWidget and before travel tips/chatroom sections.
- **Simplified Sign-up Process**: Streamlined onboarding by moving profile completion to after authentication. Only essential fields are collected during signup (DOB, 3 top choices, location/destination/return date). Removed gender, sexual preference, bio, interests (beyond top 3), activities, events, languages, veteran/active duty status from initial signup.
- **Travel Plan Defaults**: Editing pre-populates with user's signup preferences; "More Options" checkboxes converted to pill-style buttons.
- **City Match Tab**: Enhanced with a distinctive orange color theme, gradient backgrounds, subtle ring borders, and direct routing to match-in-city page.
- **Color Accessibility**: Improved readability in "Things I Want to Do" section by changing event pills and activity badges to purple, and improving color contrast in City Match instructional cards with an emerald color scheme.
- **Username Constraints**: Implemented 6-14 character limit for usernames with frontend and database validation.
- **Private Chat Approval System**: Implemented a public/private chatroom system where private chats require organizer approval, displaying with lock icons and distinctive styling.
- **SMS Event Notifications**: Complete system for event RSVPs using Twilio, including phone number collection, RSVP confirmations, event reminders, cancellations, and updates.
- **Business Location Fix**: Fixed critical issue where Santa Monica businesses were incorrectly defaulting to "Los Angeles" - now properly displays actual business city from the `city` field, with fallback to "Los Angeles Metro" only when necessary. This ensures businesses in Santa Monica, Venice, Beverly Hills, etc. show their actual city names.

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL database hosting.
- **Replit**: Development and deployment environment with integrated authentication.

### AI & Machine Learning
- **Anthropic Claude API**: AI-powered recommendations, photo analysis, and content generation.

### Communication Services
- **SendGrid**: Email delivery service for notifications and marketing.
- **WebSocket (ws)**: Real-time bidirectional communication.
- **Twilio**: SMS notification system for event RSVPs.

### Payment Processing
- **Stripe**: Payment processing for premium features and business subscriptions.

### UI/UX Libraries
- **Radix UI**: Accessible, unstyled UI primitives.
- **Lucide React**: Icon library for consistent visual elements.
- **class-variance-authority**: Type-safe CSS class management.
- **cmdk**: Command palette interface for quick actions.

### Event & Data Integrations
- **StubHub**: For premium event listings.
- **Ticketmaster**: Available for event listings.
- **Meetup**: Local event feeds.