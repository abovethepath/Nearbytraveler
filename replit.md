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
User request: Fixed business user access to discover page - businesses should not see destination discovery pages and are redirected to their business dashboard instead, as they have a different workflow focused on local operations.

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