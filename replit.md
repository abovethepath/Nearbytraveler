# Nearby Traveler - Social Travel Networking Platform

## Overview

Nearby Traveler is a comprehensive social travel networking platform that connects travelers with locals and businesses worldwide. The platform facilitates authentic travel experiences through smart matching algorithms, AI-powered recommendations, and real-time communication. Built on the "95/5 Rule" philosophy - recognizing that people spend 95% of their time as locals and only 5% traveling - the platform encourages users to start as locals to build authentic connections before traveling.

Key features include smart user matching, real-time messaging, AI travel companion powered by Claude Sonnet, event creation and discovery, comprehensive trip planning tools, and business integration for local experiences and offers.

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