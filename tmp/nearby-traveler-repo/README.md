# Nearby Traveler

Global social networking platform connecting travelers, locals, and businesses through location-based meetups and cross-cultural interactions.

## 🌍 About

Nearby Traveler is a three-sided marketplace that enriches travel experiences by facilitating real-time connections between:
- **Nearby Locals** - Residents sharing their hometown insights
- **Nearby Travelers** - Visitors exploring new destinations  
- **Local Businesses** - Establishments offering deals and experiences

## ✨ Key Features

- **Dual Visibility Model** - Users maintain permanent LOCAL status in hometown while gaining TRAVELER status during active trips
- **Real-time User Counter** - Global stats showing live platform growth
- **AI-Powered Content** - Smart city recommendations and user compatibility scoring
- **Mobile-First Design** - Responsive PWA optimized for mobile devices
- **Live Messaging** - WebSocket-based real-time communication
- **Advanced Search** - Location filters, demographics, interests, and activities

## 🏗️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for fast builds
- Tailwind CSS + shadcn/ui components
- TanStack Query for state management
- Wouter for routing

### Backend  
- Node.js + Express + TypeScript
- PostgreSQL with Drizzle ORM
- WebSocket for real-time features
- Session-based authentication

### AI & Services
- Anthropic Claude API
- Weather API integration
- Email notifications via SendGrid/Brevo
- SMS alerts via Twilio

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Required API keys (see Environment Variables)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your API keys to .env

# Initialize database
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

Required environment variables:
```
DATABASE_URL=your_postgresql_url
OPENAI_API_KEY=your_openai_key
SENDGRID_API_KEY=your_sendgrid_key
BREVO_API_KEY=your_brevo_key
WEATHER_API_KEY=your_weather_key
SESSION_SECRET=your_session_secret
```

## 📱 Key User Features

- **Smart Travel Planning** - AI-assisted itinerary creation
- **Location-Based Discovery** - Find nearby users, events, and businesses
- **Real-Time Messaging** - Chat with locals and fellow travelers
- **Event Management** - Create and join meetups and activities
- **Business Integration** - Local deals and recommendations
- **Profile Completion Tracking** - Guided onboarding process

## 🏢 Business Features

- **Deal Management** - Create time-sensitive promotions
- **Customer Analytics** - Track engagement and bookings
- **Multi-Location Support** - Manage multiple business locations
- **Contact Management** - Comprehensive customer database

## 🌐 Global Stats Feature

Live user counter showing real-time platform growth:
- Active Locals count
- Current Travelers count  
- Business Partners count
- Live Events count

Perfect growth psychology for showcasing platform momentum to investors and users.

## 📊 Current Status

Production-ready platform serving:
- 400+ MBA students and venture capitalists
- Multi-city coverage with LA Metro consolidation
- Real-time features and mobile optimization
- Complete business management tools

## 🔒 Security

- Session-based authentication
- Environment variable protection
- Input validation and sanitization
- Rate limiting on API endpoints

## 📄 License

Proprietary - All rights reserved

## 🤝 Contact

For business inquiries and partnership opportunities, please contact through the platform.

---

*Connecting the world, one local experience at a time.* 🌟