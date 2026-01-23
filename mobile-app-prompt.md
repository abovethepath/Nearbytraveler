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

## ONBOARDING WIZARD (Post-Signup)

After signup, users MUST complete a step-by-step onboarding wizard:

### Step 1: Select Interests
- Choose from family-friendly interest categories
- Minimum 3 interests required

### Step 2: Set Hometown
- City, State/Province, Country
- This becomes their "Nearby Local" location

### Step 3: Travel Plans (for Travelers)
- Destination city
- Start and end dates
- Skip option for locals

### Step 4: Demographics & Preferences
- Gender (optional, private by default)
- Age/birthday
- Languages spoken
- Who they want to meet (filter preferences)

### Step 5: Profile Photo & Bio
- Upload profile photo
- Write short bio

### Profile Completion Gating
- Users with incomplete profiles are hidden from discovery
- Red reminder bar prompts profile completion
- Minimum requirements: 3 interests, hometown, profile photo
- API: `GET /api/bootstrap/status` - Check profile completion status

---

## DEMOGRAPHICS & MATCHING PREFERENCES

### Demographic Fields (User Profile)
| Field | Public/Private | Filterable |
|-------|---------------|------------|
| Gender | Private (optional to share) | Yes |
| Age | Private (optional to share) | Yes |
| Languages | Public | Yes |
| Hometown | Public | Yes |
| Interests | Public | Yes |

### Search/Discovery Filters
- Location (city or "Near Me")
- User type (Local/Traveler/Business)
- Gender preference
- Age range (min/max)
- Interests
- Languages spoken

API: `GET /api/search-users?gender=female&minAge=25&maxAge=40&location=Paris`

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
- Filter by: location, interests, user type, demographics
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

## CITY HOME SCREEN

Each city has a dedicated home screen showing:

### City Home Components
1. **Header**: City name + country flag
2. **Active Travelers**: Users currently visiting this city
3. **Top Locals**: Most connected/referenced locals
4. **Featured Events**: This week's events in the city
5. **Quick Meetups**: Active spontaneous meetups
6. **City Chatroom**: Direct link to city chatroom
7. **Weekly Highlights**: AI-generated "what's happening"

### Navigation
- From discovery, tap city name to view City Home
- Bottom sheet or full screen
- Map/List toggle for events and users

API: `GET /api/cities/:city/overview`, `GET /api/city/:city/users`

---

## SUPER CALENDAR VIEW

Unified calendar merging all user activities:

### Calendar Shows:
- My trip dates (start/end highlighted)
- Events I RSVP'd to
- Quick meetups I joined
- Chatroom events/reminders

### Features:
- Month/week/day views
- Tap event to view details
- Add to Apple Calendar integration
- All times in user's LOCAL timezone

### Add to Calendar
- Use Expo Calendar API
- Export .ics files
- Deep link back to app from calendar events

---

## THIRD-PARTY EVENT INTEGRATION

### Event Types
1. **Community Events** - Created by users in-app
2. **Imported Events** - From Meetup, Eventbrite, Ticketmaster, StubHub

### Imported Event Display
- Source label: "via Meetup" / "via Eventbrite"
- External link button (opens in Safari)
- Save/favorite (local to app)
- RSVP behavior: redirects to external site for ticketed events

### App Store Compliance
- Clear labeling that event is external
- No fake "buy ticket" buttons
- Links clearly open external browser

API: `GET /api/events?source=meetup`, `GET /api/scrape-meetup`, `GET /api/scrape-eventbrite`

---

## TRUST & SAFETY (App Store Required)

### Block User
- Block from profile or conversation
- Blocked users hidden everywhere:
  - Discovery
  - Search results
  - Chatrooms
  - Messages
- API: `POST /api/users/block`, `GET /api/users/blocked`, `DELETE /api/users/block/:blockedUserId`

### Report User
- Report reasons: spam, harassment, fake profile, inappropriate content
- Submit from profile or message
- API: `POST /api/support/report` (create endpoint if needed)

### Report Content
- Report event, chatroom message, or reference
- Flagged content reviewed by admin

### Settings / Legal
- Link to Terms of Service: `/terms`
- Link to Privacy Policy: `/privacy`
- Link to Cookie Policy: `/cookies`
- Account deletion request button
- In-app support contact

---

## BUSINESS WORKFLOW (Business Accounts)

### Deal Lifecycle
1. **Draft** - Creating deal, not visible
2. **Live** - Active and visible to users
3. **Expired** - Past end date, archived
4. **Analytics** - View count, saves, redemptions

### Business Dashboard
- Active deals list
- Create new deal button
- Quick flash deal (expires in hours)
- Analytics summary
- Edit business profile

### Business Verification (Placeholder)
- Badge for verified businesses (manual admin approval)
- Verification request form in settings

### Gating
- Basic features: free
- Premium features: future subscription (not implemented yet)

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

## MOBILE TECHNICAL REQUIREMENTS

### Cookie-Based Session Auth in React Native

The backend uses `connect.sid` session cookies. For React Native:

```javascript
// Use fetch with credentials
fetch('https://nearbytraveler.org/api/auth/user', {
  method: 'GET',
  credentials: 'include', // Important!
  headers: {
    'Content-Type': 'application/json',
  }
});
```

**Required Setup:**
1. Use `@react-native-cookies/cookies` for cookie persistence
2. Or implement token-based auth adapter (backend supports `x-user-id` header fallback)
3. Ensure CORS allows mobile origin

### WebSocket Auth & Reconnection

```javascript
// WebSocket connection with auth
const ws = new WebSocket('wss://nearbytraveler.org');

// On connect, send auth message
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    userId: currentUser.id,
    sessionId: sessionCookie
  }));
};

// Reconnection with exponential backoff
const reconnect = (attempt = 1) => {
  const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
  setTimeout(() => connectWebSocket(), delay);
};

// Offline message queue
const messageQueue = [];
// Queue messages when offline, send when reconnected
```

**Message Types:**
- `chat_message` - Direct messages
- `chatroom_message` - City chatroom messages
- `typing` - Typing indicators
- `read_receipt` - Message read status
- `connection_request` - New connection notification

### Media Upload Flow

**Profile Photo Upload:**
```javascript
// Use expo-image-picker
import * as ImagePicker from 'expo-image-picker';

// Pick image
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8, // Compress to 80%
});

// Upload multipart form
const formData = new FormData();
formData.append('photo', {
  uri: result.uri,
  type: 'image/jpeg',
  name: 'profile.jpg'
});

fetch('https://nearbytraveler.org/api/users/:id/profile-photo', {
  method: 'PUT',
  body: formData,
  credentials: 'include'
});
```

**Permissions Required:**
- Camera roll access
- Camera access (for taking photos)

API Endpoints:
- `PUT /api/users/:id/profile-photo` - Upload profile photo
- `POST /api/users/:id/cover-photo` - Upload cover photo
- Photos stored in Replit Object Storage

### Push Notifications

**Device Token Registration:**
```javascript
// Use expo-notifications
import * as Notifications from 'expo-notifications';

// Get push token
const token = await Notifications.getExpoPushTokenAsync();

// Register with backend
fetch('https://nearbytraveler.org/api/push/register', {
  method: 'POST',
  body: JSON.stringify({
    token: token.data,
    platform: 'ios'
  }),
  credentials: 'include'
});
```

**Push Notification Triggers:**
| Event | Notification |
|-------|-------------|
| New message | "John sent you a message" |
| Connection request | "Sarah wants to connect" |
| Connection accepted | "John accepted your request" |
| Event RSVP | "5 people are going to Beach Meetup" |
| Quick meetup nearby | "Coffee meetup starting in 30 min near you" |
| Flash deal | "50% off at Local Cafe - expires in 2 hours" |

API: `POST /api/push/register` (create if needed), `POST /api/push/send`

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
- `GET /api/bootstrap/status` - Check profile completion

### Users
- `GET /api/users` - List users (with filters)
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile
- `GET /api/search-users` - Search users with filters
- `PUT /api/users/:id/profile-photo` - Upload profile photo

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
- `POST /api/messages/:userId/mark-read` - Mark messages as read

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

### Cities
- `GET /api/cities/:city/overview` - City home data
- `GET /api/city/:city/users` - Users in city

### Trust & Safety
- `POST /api/users/block` - Block user
- `GET /api/users/blocked` - Get blocked users
- `DELETE /api/users/block/:blockedUserId` - Unblock user

---

## WEBSOCKET CONNECTION

For real-time messaging, connect to:
```
wss://nearbytraveler.org
```

**Auth on Connect:**
```json
{
  "type": "auth",
  "userId": 123,
  "sessionId": "connect.sid_value"
}
```

**Message Format:**
```json
{
  "type": "chat_message",
  "senderId": 123,
  "receiverId": 456,
  "content": "Hello!",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Reconnection Rules:**
- Exponential backoff: 1s, 2s, 4s, 8s... max 30s
- Queue messages while offline
- Resync on reconnect

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
2. Onboarding wizard (interests → hometown → travel → profile photo)
3. Home page with user discovery
4. Profile viewing
5. Basic messaging

### Phase 2 - Social (Week 3-4)
6. Connection requests and management
7. Connection degrees display
8. City chatrooms
9. Profile editing
10. Block/report user

### Phase 3 - Travel & Events (Week 5-6)
11. Travel plan creation
12. City Home screen
13. Quick meetups
14. Events listing and RSVP
15. Super Calendar view

### Phase 4 - Polish (Week 7-8)
16. References and vouches
17. Advanced search with demographics
18. Push notifications
19. QR code scanning
20. Third-party event integration
21. Settings with Terms/Privacy links

---

## SCREENS CHECKLIST

### Core Screens
- [ ] Login
- [ ] Signup (3 flows)
- [ ] Onboarding Wizard (5 steps)
- [ ] Home / Discovery
- [ ] Profile View
- [ ] Profile Edit
- [ ] Messages List
- [ ] Conversation View
- [ ] Chatrooms List
- [ ] Chatroom View
- [ ] Search

### Travel & Events
- [ ] Travel Plans List
- [ ] Create Travel Plan
- [ ] Events List
- [ ] Event Details
- [ ] Create Event
- [ ] Quick Meetups
- [ ] Super Calendar

### City
- [ ] City Home
- [ ] City Users
- [ ] City Events

### Social
- [ ] Connections List
- [ ] Connection Requests
- [ ] References List
- [ ] Write Reference
- [ ] QR Code Display
- [ ] QR Scanner

### Business
- [ ] Business Dashboard
- [ ] Create Deal
- [ ] Create Flash Deal
- [ ] Deal Analytics

### Settings
- [ ] Settings Main
- [ ] Account Settings
- [ ] Privacy Settings
- [ ] Blocked Users
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Delete Account

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
- Discovery locked until profile is complete
