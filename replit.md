## Overview
Nearby Traveler is a social networking platform designed to connect travelers, locals, and businesses through location-based meetups and cross-cultural interactions. Its core purpose is to enhance travel experiences and local engagement by fostering real-time connections. Key capabilities include AI-powered city content generation, robust photo management, mobile responsiveness, and a global map system for discovering users, events, and businesses.

## Recent Critical Fixes (August 2025)
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