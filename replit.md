## Overview
Nearby Traveler is a social networking platform designed to connect travelers, locals, and businesses through location-based meetups and cross-cultural interactions. Its core purpose is to enhance travel experiences and local engagement by fostering real-time connections. Key capabilities include AI-powered city content generation, robust photo management, mobile responsiveness, and a global map system for discovering users, events, and businesses.

## Recent Critical Fixes (August 2025)
- **CITY PHOTO INTEGRATION COMPLETE** (August 11): CRITICAL SUCCESS - Pulled authentic city photos from assets folder and integrated into both city pages and city match pages. Added 20+ city-specific images covering major destinations (Los Angeles, New York, Chicago, London, Paris, Rome, etc.). Created photo galleries with hover effects, error handling, and community travel photos. Enhanced visual experience across platform with authentic imagery.
- **ANTHROPIC AI INTEGRATION RESTORED** (August 11): CRITICAL SUCCESS - Successfully switched from OpenAI back to Anthropic Claude (user's paid service) for unlimited city-specific content generation. Fixed JSON parsing issues and markdown formatting. AI now generates authentic tourist attractions like Hollywood Sign Hike, Central Park tours, and Bean/Navy Pier activities.
- **EXTERNAL EVENT APIS ACTIVATED** (August 11): CRITICAL SUCCESS - StubHub integration working automatically, returning premium events (The Weeknd, Taylor Swift, Hamilton). Ticketmaster available (needs API key), Meetup and local event feeds operational. Multiple event sources provide comprehensive city coverage.
- **TOURIST ATTRACTION GENERATION** (August 11): CRITICAL SUCCESS - AI now generates both generic social activities (MEET LOCALS HERE, BUSINESS NETWORKING) and city-specific tourist attractions. Los Angeles: 10 attractions including Hollywood Sign Hike, Universal Studios, Getty Center. New York: 28 new attractions. Chicago: 26 new attractions including iconic landmarks tourists visit.
- **VOUCHING SYSTEM ACTIVATED** (August 11): CRITICAL SUCCESS - Enabled vouching system for platform creator. nearbytraveler now has initial founder vouch and 5 vouch credits to start vouching for other users. Seed member status activated.
- **AUTHENTIC LA CONTENT RESTORED** (August 11): CRITICAL SUCCESS - Added 10 authentic Los Angeles activities from production backup (Hollywood Bowl, Venice Beach, Santa Monica Pier, Hollywood Sign Hike, Griffith Observatory, etc.) and 5 real LA events. Total now: 25 activities (vs 15) and 5 events (vs 0).
- **MAP LOCATION SHARING FIXED** (August 11): CRITICAL SUCCESS - Fixed map display issue where user wasn't appearing on home page city map. Enabled location sharing for user and set proper coordinates (Playa del Rey: 33.9425, -118.4081). Map API now correctly returns user data and displays user location on interactive map.
- **LOCATION DISPLAY LOGIC FIXED** (August 11): CRITICAL SUCCESS - Fixed people discovery widget to correctly show current travel status vs hometown. Now displays active travel destination (e.g., "Traveling in New Orleans") when user has active travel plans, and uses hometownCity field for "From" display instead of incorrectly showing location field twice.
- **SCROLLING HERO GALLERY FIXED** (August 11): Fixed ScrollingHeroGallery component with verified image paths from public folder, added rotation timing (5 seconds for testing), and enhanced debugging. Component now properly displays authentic production photos on landing page.
- **TRIP PLANNING FUNCTIONALITY FIXED** (August 11): CRITICAL SUCCESS - Fixed major bug in trip planning where API requests had incorrect parameter order. Changed apiRequest calls from (url, method, data) to (method, url, data) format. Trip creation from profile CTA button now works correctly with user's selected interests and activities.
- **PROFILE LAYOUT ALIGNMENT** (August 11): Fixed alignment between bio widget and "Ready to Meet" section by adding consistent margin-top (mt-6) to both About section and QuickMeetupWidget. Also resolved React infinite update error in ThingsIWantToDoSection component.
- **SIGNUP REDIRECT TO PROFILE** (August 11): Updated all signup flows to redirect users to their profile page instead of home page after successful registration. Modified signup-local-traveler.tsx, signup-traveling.tsx, signup-business.tsx, and business-registration.tsx to redirect to '/profile' for better user onboarding experience.
- **PROFILE HEADER 2-LINE LAYOUT** (August 11): Fixed profile header to display properly on 2 lines for desktop - Line 1: Username and location status, Line 2: Stats (countries and references) with proper spacing and responsive design.
- **USER CARD IMPROVEMENTS** (August 11): Enhanced PeopleDiscoveryWidget with larger photos (36x36), removed "Loading..." text (now shows "New User"), reduced padding, added Load More/Load Less functionality for 6-person default display (3x2 grid), and improved compatibility display.
- **COMPLETE MOBILE APP RESTORATION COMPLETED** (August 10): CRITICAL SUCCESS - Successfully restored complete mobile app from production tar.gz backup. Completely replaced all files (client, server, shared) with working 8/8 version from attached_assets/new_extract. Fixed all asset imports using authentic production photos, resolved database schema issues, removed all fake users, and restored clean state with only authentic Los Angeles events from production backup. Logo properly restored and mobile app fully functional with proper authentication flow.
- **DATABASE SCHEMA RESTORATION** (August 10): Successfully restored clean database schema using Drizzle ORM push after complete schema rebuild. Database now properly stores data in correct places with working authentication system.
- **CTA BUTTON TEXT UPDATES** (August 10): Updated all call-to-action buttons across landing page and navbar per user requirements: navbar "Join Nearby Traveler", locals section "Join as a Nearby Local", travelers section "Join as a Nearby Traveler", final CTA single button "Join Nearby Traveler".

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18 + TypeScript**: Modern React with full type safety
- **Vite Build System**: Fast development and optimized production builds
- **Tailwind CSS + shadcn/ui**: Utility-first CSS framework with pre-built component library
- **Wouter**: Lightweight client-side routing
- **TanStack Query**: Server state management and caching
- **Progressive Web App (PWA)**: Mobile-first design with offline capabilities

### Backend Architecture
- **Node.js + Express**: RESTful API server with middleware support
- **TypeScript**: Full type safety across the entire stack
- **Session-based Authentication**: Secure user sessions with Replit Auth integration
- **Real-time Communication**: WebSocket support for instant messaging and live updates
- **Modular Route Structure**: Organized API endpoints for users, events, travel plans, businesses, and messaging

### Database Design
- **PostgreSQL**: Primary relational database
- **Drizzle ORM**: Type-safe database operations with schema validation
- **Neon Database**: Serverless PostgreSQL hosting
- **Comprehensive Schema**: Users, travel plans, events, connections, messages, businesses, and business offers
- **Session Storage**: Dedicated table for authentication session management

### Authentication & Authorization
- **Replit Auth Integration**: OAuth-based authentication system
- **JWT Token Management**: Secure token handling for API requests
- **Session Middleware**: Protected route enforcement
- **User Role System**: Support for locals, travelers, and business accounts

### AI Integration
- **Anthropic Claude Sonnet**: Latest AI model integration for intelligent features
- **Travel Recommendations**: AI-powered destination and activity suggestions
- **Photo Analysis**: Automatic image categorization and tagging
- **Match Compatibility**: AI-driven user compatibility scoring
- **Smart Content Generation**: Automated hashtag and description generation

### Real-time Features
- **WebSocket Server**: Live messaging and notifications
- **Event Updates**: Real-time event participation and chat rooms
- **Connection Management**: Live status updates for user connections
- **Instant Notifications**: Push notifications for messages and events

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL database hosting
- **Replit**: Development and deployment environment with integrated authentication

### AI & Machine Learning
- **Anthropic Claude API**: AI-powered recommendations, photo analysis, and content generation
- **Claude Sonnet 4**: Latest model for enhanced natural language processing

### Communication Services
- **SendGrid**: Email delivery service for notifications and marketing
- **WebSocket (ws)**: Real-time bidirectional communication

### Payment Processing
- **Stripe**: Payment processing for premium features and business subscriptions
- **Stripe React Components**: Frontend payment form integration

### UI/UX Libraries
- **Radix UI**: Accessible, unstyled UI primitives
- **Lucide React**: Icon library for consistent visual elements
- **class-variance-authority**: Type-safe CSS class management
- **cmdk**: Command palette interface for quick actions

### Development Tools
- **ESBuild**: Fast JavaScript bundling for production
- **PostCSS + Autoprefixer**: CSS processing and browser compatibility
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation for forms and API data

### Monitoring & Analytics
- **Replit Error Tracking**: Development error monitoring and debugging
- **Performance Monitoring**: Built-in Vite development tools and runtime error overlays