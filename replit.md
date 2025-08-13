## Overview
Nearby Traveler is a social networking platform designed to connect travelers, locals, and businesses through location-based meetups and cross-cultural interactions. Its core purpose is to enhance travel experiences and local engagement by fostering real-time connections. Key capabilities include AI-powered city content generation, robust photo management, mobile responsiveness, and a global map system for discovering users, events, and businesses. The platform aims to foster human connections and authentic experiences.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18 + TypeScript**: Modern React with full type safety.
- **Vite Build System**: Fast development and optimized production builds.
- **Tailwind CSS + shadcn/ui**: Utility-first CSS framework with a pre-built component library.
- **Wouter**: Lightweight client-side routing.
- **TanStack Query**: Server state management and caching.
- **Progressive Web App (PWA)**: Mobile-first design with offline capabilities.

### Backend Architecture
- **Node.js + Express**: RESTful API server with middleware support.
- **TypeScript**: Full type safety across the entire stack.
- **Session-based Authentication**: Secure user sessions with Replit Auth integration.
- **Real-time Communication**: WebSocket support for instant messaging and live updates.
- **Modular Route Structure**: Organized API endpoints for users, events, travel plans, businesses, and messaging.

### Database Design
- **PostgreSQL**: Primary relational database.
- **Drizzle ORM**: Type-safe database operations with schema validation.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Comprehensive Schema**: Users, travel plans, events, connections, messages, businesses, and business offers.
- **Session Storage**: Dedicated table for authentication session management.

### Authentication & Authorization
- **Replit Auth Integration**: OAuth-based authentication system.
- **JWT Token Management**: Secure token handling for API requests.
- **Session Middleware**: Protected route enforcement.
- **User Role System**: Support for locals, travelers, and business accounts.

### AI Integration
- **Anthropic Claude Sonnet**: AI model integration for intelligent features.
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
- **Landing Page**: Single static hero image.
- **Mobile Navigation**: Includes a chat rooms tab in the bottom navigation.
- **User Profiles**: Displays user's own quick meetups and shows correct travel status vs. hometown.
- **Event Display**: Recurring event information is shown, and new events appear first in listings.
- **City Content**: Integration of authentic city photos and AI-generated tourist attractions.
- **User Cards**: Enhanced with larger photos, Load More/Load Less functionality, and improved compatibility display.
- **Event Management**: Removed separate "My Events" tab per user request - all user events now appear prominently at top of Community Events section with special styling and management buttons.
- **Metro Area Consolidation ENABLED with Smart Logic (Aug 2025)**: Implemented intelligent metropolitan area consolidation system that prevents suburb chatroom creation while maintaining proper city-based organization. Culver City → Los Angeles Metro, Nashville stays Nashville Metro. Only major metropolitan areas get system-created chatrooms while suburbs automatically consolidate to their parent metro area.
- **Chatroom Database Cleanup & Metro Consolidation (Aug 2025)**: Database cleaned and implemented proper metropolitan area consolidation. System now creates only 2 essential chatrooms per major metro area: "Welcome Newcomers [Metro]" and "Let's Meet Up [Metro]". Successfully consolidated Los Angeles Metro (includes Culver City, Playa del Rey suburbs), Nashville Metro, and New York City. nearbytraveler serves as admin for all system-created chatrooms.
- **Activity Search Removal (Aug 2025)**: Removed redundant activity search page since users can search activities using the advanced search widget with keyword filters. This simplifies the user experience by consolidating search functionality.
- **Private Chat Approval System (Aug 2025)**: Implemented complete public/private chatroom system where private chats require organizer approval. Users can request access with optional messages, organizers can approve/deny requests. Private chatrooms display with Lock icons and distinctive styling. Database includes chatroom_access_requests table and unique constraints on chatroom_members.
- **MBA-Level Landing Page (Jan 2025)**: Complete overhaul with punchy value prop, founder's authentic 731-traveler story, no-signup-required CTA, modern lu.ma-style design, and triple sticky visibility. Strict policy: no fake numbers, testimonials, or member counts - only authentic data allowed. Added dynamic CSS animations and orange-blue color theme for founder section based on user feedback (Aug 2025).
- **Complete Mobile Optimization Package (Aug 2025)**: Replaced entire codebase with Cursor IDE version containing comprehensive mobile-first optimizations including perfect responsive design, touch targets (48px minimum), mobile-first layouts, touch manipulation CSS properties, and production-ready deployment configurations. User preference: Complete codebase replacement rather than selective merging when provided with improved versions.
- **Simplified Sign-up Process (Aug 2025)**: Major overhaul to streamline onboarding by moving profile completion to after authentication. **Local Travelers**: Keep only date of birth, 3 top choices minimum (max removed), and hometown location. **Traveling Users**: Keep only date of birth, 3 top choices minimum, travel destination, and return date. **Removed from both**: Gender, sexual preference, bio, interests beyond top choices, activities, events, languages, veteran/active duty status. All removed fields moved to in-app profile completion. Enhanced welcome page guides new members to complete profile and discover City Match features. **Travel Plan Creation Fix**: Fixed issue where travel plans weren't created for simplified signup by adding automatic travel start date (current date) and proper backend handling of return-date-only data.
- **Travel Plan Defaults & UI Fixes (Aug 2025)**: Fixed travel plan editing to pre-populate with user's signup preferences (interests, activities, events) so users don't have to re-select same choices. Converted "More Options" checkboxes to proper pill-style buttons matching signup forms. Fixed React hooks errors in chatroom component that caused blank screens.
- **Metro Consolidation Restored for All Major Cities (Aug 2025)**: Restored complete metro consolidation system for all major metropolitan areas worldwide. Culver City → Los Angeles Metro, Playa del Rey → Los Angeles Metro, Greenhills TN → Nashville Metro. Added Nashville Metro area with all surrounding cities. All major cities now properly consolidate suburbs and surrounding areas into their main metropolitan area for unified city pages and user discovery.
- **City Match Tab Enhancement (Aug 2025)**: Enhanced City Match tab with distinctive orange color theme including gradient backgrounds, subtle ring borders, enhanced typography, and direct routing to match-in-city page for better visual prominence.
- **Color Accessibility Improvements (Aug 2025)**: Fixed green-on-green readability issues in "Things I Want to Do" section by changing event pills to purple and improving color contrast in City Match instructional cards with emerald color scheme and proper borders. Updated global CSS to change activity badges from green to purple for better readability on dark backgrounds.

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL database hosting.
- **Replit**: Development and deployment environment with integrated authentication.

### AI & Machine Learning
- **Anthropic Claude API**: AI-powered recommendations, photo analysis, and content generation.

### Communication Services
- **SendGrid**: Email delivery service for notifications and marketing.
- **WebSocket (ws)**: Real-time bidirectional communication.

### Payment Processing
- **Stripe**: Payment processing for premium features and business subscriptions.

### UI/UX Libraries
- **Radix UI**: Accessible, unstyled UI primitives.
- **Lucide React**: Icon library for consistent visual elements.
- **class-variance-authority**: Type-safe CSS class management.
- **cmdk**: Command palette interface for quick actions.

### Event & Data Integrations
- **StubHub**: For premium event listings.
- **Ticketmaster**: Available for event listings (requires API key).
- **Meetup**: Local event feeds.

### Development Tools
- **ESBuild**: Fast JavaScript bundling.
- **PostCSS + Autoprefixer**: CSS processing and browser compatibility.
- **React Hook Form**: Form state management and validation.
- **Zod**: Runtime type validation for forms and API data.