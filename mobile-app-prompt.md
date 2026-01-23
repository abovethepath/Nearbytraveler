# Nearby Traveler - Native iOS Mobile App Prompt

## IMPORTANT: Use this prompt when creating a new Replit mobile app project

---

## Project Overview

Create a native iOS mobile app using Expo/React Native for **Nearby Traveler** - a social networking platform connecting travelers, locals, and businesses. The app must connect to an **existing backend API** at `https://nearbytraveler.org` so all users are synced whether they sign up on web or mobile.

## Backend API Base URL
```
https://nearbytraveler.org/api
```

All API endpoints are already built and working. The mobile app is a new front-end connecting to this existing backend.

---

## THREE USER TYPES

### 1. Nearby Local
- Lives in a city and wants to meet travelers visiting their area
- Can host meetups, show people around, make connections
- Profile shows: "Nearby Local • [Hometown]"

### 2. Nearby Traveler  
- Traveling to destinations and wants to meet locals/other travelers
- Creates travel plans with dates
- When actively traveling, profile shows BOTH:
  - "Nearby Local • [Hometown]" (always visible)
  - "Nearby Traveler • [Destination]" (during trip dates)

### 3. Business Account
- Local businesses wanting to connect with travelers
- Can create deals and quick flash deals
- Has business dashboard instead of discovery features

---

## CORE FEATURES TO BUILD

### 1. Authentication
- **Login/Signup** with email and password
- API: `POST /api/auth/login`, `POST /api/register`
- Session-based auth with cookies
- Three signup flows: Local, Traveler, Business

### 2. User Profiles
- Profile photo, bio, interests, languages spoken
- Hometown city (always displayed)
- Travel destination (when on active trip)
- Connection count, references, vouches
- QR code for LinkedIn-style networking
- API: `GET /api/users/:id`, `PUT /api/users/:id`

### 3. Home Page / Discovery
- Grid of user cards showing nearby users
- Filter by: location, interests, user type
- Each card shows: avatar, name, location, bio snippet
- "Things in Common" compatibility badge
- **Connection degree** subtitle under Connect button:
  - "12 mutual connections" (blue) for 2nd degree
  - "3rd degree connection" (purple) for 3rd degree
- API: `GET /api/users`, `POST /api/connections/degrees/batch`

### 4. Connections System (LinkedIn-style)
- Send connection requests
- Accept/reject incoming requests
- View all connections
- Mutual connections display
- 1st/2nd/3rd degree connection badges
- API: `POST /api/connections`, `GET /api/connections/:userId`, `PUT /api/connections/:id`

### 5. Real-time Messaging (WhatsApp-style)
- Direct messages between connected users
- WhatsApp green bubbles (#10b981)
- WhatsApp doodle background pattern
- Read receipts, typing indicators
- WebSocket for real-time updates
- API: `GET /api/messages/:userId`, `POST /api/messages`
- WebSocket: `wss://nearbytraveler.org`

### 6. City Chatrooms
- Public chatrooms for each city
- Users auto-joined to hometown + destination chatrooms
- Real-time group chat
- API: `GET /api/chatrooms/my-locations`, `GET /api/chatrooms/:chatroomId`

### 7. Travel Plans
- Create trips with destination, dates
- View upcoming and past trips
- See who else is traveling to same destination
- API: `POST /api/travel-plans`, `GET /api/travel-plans/:userId`

### 8. Quick Meetups
- Spontaneous meetup requests ("Coffee now?")
- Time-limited (expire after set hours)
- Location-based
- API: `POST /api/quick-meetups`, `GET /api/quick-meetups`

### 9. Events
- Community events and meetups
- RSVP functionality
- Event chat rooms
- Event organizer features
- API: `GET /api/events`, `POST /api/events`, `POST /api/events/:id/rsvp`

### 10. References & Vouches
- Written references from connections (like LinkedIn recommendations)
- Vouch system for trust building
- Display on profiles
- API: `GET /api/users/:userId/references`, `POST /api/user-references`

### 11. Business Features (for Business accounts only)
- Business dashboard
- Create deals and offers
- Flash deals (time-limited)
- Business profile with location/hours
- API: `GET /api/quick-deals`, `POST /api/quick-deals`

### 12. Advanced Search
- Search by location, demographics, interests
- Filter by user type
- Real-time search results
- API: `GET /api/search-users`

---

## UI/UX REQUIREMENTS

### Branding
- **Primary Colors**: Orange and Blue gradient theme
- **Messaging**: WhatsApp green (#10b981) for chat bubbles
- **Dark Mode**: Full dark mode support required

### Design Standards
- **Solid backgrounds only** - NO translucent/transparent modals or dialogs
- Dialog overlays: bg-black/95 (95% opacity)
- Content backgrounds: solid white (light) or gray-900 (dark)
- Mobile-first design
- Bottom tab navigation

### Navigation Tabs (Bottom)
For Locals/Travelers:
1. Home (discovery)
2. Messages
3. Chatrooms
4. Search
5. Profile

For Business:
1. Dashboard
2. Messages
3. Create Deal
4. Search
5. Profile

---

## API AUTHENTICATION

All authenticated requests need session cookie or these headers:
```
Cookie: connect.sid=<session_id>
```

Or for some endpoints:
```
x-user-id: <user_id>
```

---

## KEY API ENDPOINTS

### Auth
- `POST /api/auth/login` - Login with email/password
- `POST /api/register` - Create new account
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users` - List users (with filters)
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile
- `GET /api/search-users` - Search users

### Connections
- `POST /api/connections` - Send connection request
- `GET /api/connections/:userId` - Get user's connections
- `PUT /api/connections/:id` - Accept/reject request
- `GET /api/connections/degree/:userId/:targetUserId` - Get connection degree
- `POST /api/connections/degrees/batch` - Batch get degrees for multiple users

### Messages
- `GET /api/messages/:userId` - Get conversation with user
- `POST /api/messages` - Send message
- `GET /api/conversations/:userId` - Get all conversations

### Travel Plans
- `POST /api/travel-plans` - Create travel plan
- `GET /api/travel-plans/:userId` - Get user's travel plans
- `DELETE /api/travel-plans/:id` - Delete plan

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `POST /api/events/:id/rsvp` - RSVP to event

### Chatrooms
- `GET /api/chatrooms/my-locations` - Get user's chatrooms
- `GET /api/chatrooms/:chatroomId` - Get chatroom messages

---

## WEBSOCKET CONNECTION

For real-time messaging, connect to:
```
wss://nearbytraveler.org
```

Message format:
```json
{
  "type": "chat_message",
  "senderId": 123,
  "receiverId": 456,
  "content": "Hello!",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## INTERESTS LIST (Family-Friendly, App Store Compliant)

Use these interest categories:
- Family Activities (first - most important)
- Food & Dining
- Cultural Tourism
- Outdoor Adventures
- Sports & Fitness
- Arts & Music
- Nightlife & Entertainment
- Shopping
- Photography
- Learning & Education

---

## METRO AREA HANDLING

Los Angeles metro area includes 76 cities that should all appear in "Los Angeles" searches:
- Playa del Rey, Santa Monica, Venice, Culver City, Beverly Hills, etc.
- When user selects "Los Angeles", show users from all LA metro cities

---

## PRIORITY BUILD ORDER

### Phase 1 - Core (Week 1-2)
1. Login/Signup screens
2. Home page with user discovery
3. Profile viewing
4. Basic messaging

### Phase 2 - Social (Week 3-4)
5. Connection requests and management
6. Connection degrees display
7. City chatrooms
8. Profile editing

### Phase 3 - Travel (Week 5-6)
9. Travel plan creation
10. Quick meetups
11. Events listing and RSVP

### Phase 4 - Polish (Week 7-8)
12. References and vouches
13. Advanced search
14. Push notifications
15. QR code scanning

---

## TESTING

Use these test accounts:
- Check with the web app admin for test credentials
- Ensure data syncs between web and mobile

---

## NOTES

- All times display in user's local timezone (never UTC)
- Profile always shows hometown, adds destination line when traveling
- No adult/private content - App Store compliant
- Solid widget backgrounds only (no transparency)
