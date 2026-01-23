# Nearby Traveler - Native iOS Mobile App Prompt

## IMPORTANT: Use this prompt when creating a new Replit mobile app project

---

## 🚨 ABSOLUTE RULES (READ FIRST)

1. **DO NOT INVENT ENDPOINTS OR FIELDS** - Only use endpoints and response shapes documented here. If an endpoint returns 404, gracefully hide that feature.
2. **If any ambiguity, prefer Appendix response shapes** - The JSON examples at the end are authoritative.
3. **Implement in phases** - Phase 1 smoke test MUST pass before adding Phase 2+ features.
4. **Core build first, expansion later** - See "Expansion Modules" section for lower-priority features.

---

## Project Overview

Create a native iOS mobile app using Expo/React Native for **Nearby Traveler** - a social networking platform connecting travelers, locals, and businesses. The app must connect to an **existing backend API** at `https://nearbytraveler.org` so all users are synced whether they sign up on web or mobile.

## Backend API Base URL
```
https://nearbytraveler.org/api
```

All API endpoints are already built and working. The mobile app is a new front-end connecting to this existing backend.

---

## ✅ PHASE 1 ACCEPTANCE GATE (MUST PASS BEFORE ANY OTHER FEATURES)

### Non-Negotiable Run Conditions
- Must be tested on a **real iOS device** using an Expo Dev Build (or TestFlight) — NOT Expo Go (cookie persistence differs)
- **Fresh install required** for first run (delete app first)
- All API calls must use base URL: `https://nearbytraveler.org/api`
- All fetch calls must include `credentials: 'include'`
- Cookie persistence must be implemented (`connect.sid` must survive app restart)

### Required Evidence (Builder Must Provide)
- iOS screen recording showing Steps 1–7 end-to-end
- Console logs showing:
  - `connect.sid` present after login
  - `/api/auth/user` status code 200
  - WebSocket connected + authenticated
  - Reconnect after background

---

### Step 0 — App Config Sanity (PASS/FAIL)
**PASS if:**
- `app.json` includes iOS permissions (Photos/Camera/Location) before first build
- `expo.scheme: "nearbytraveler"` is set for deep links

---

### Step 1 — Login + Cookie Persistence (PASS/FAIL)
1. Login via `POST /api/auth/login`
2. Immediately call `GET /api/auth/user`

**PASS if:**
- Login succeeds
- `/api/auth/user` returns 200 and renders name + userType
- `connect.sid` exists in cookie storage after login

**FAIL if:**
- `/api/auth/user` returns 401 after login (cookies not persisted)

---

### Step 2 — Kill App → Relaunch → Session Still Valid (PASS/FAIL)
1. Force close app (swipe away)
2. Relaunch app
3. Auto-call `GET /api/auth/user` on startup

**PASS if:** `/api/auth/user` still returns 200 without re-login
**FAIL if:** User is logged out or `/api/auth/user` returns 401

---

### Step 3 — Home / Discovery List Renders Correctly (PASS/FAIL)
Call: `GET /api/search-users?location=<hometownCity>`

**PASS if:**
- List renders without crashes
- Cards gracefully handle nulls:
  - `profileImage: null` → initials avatar
  - `destinationCity: null` → no traveler line
- Compatibility UI renders when present:
  - `sharedInterests` badge
  - `compatibilityScore` display
- If showing degrees: uses `POST /api/connections/degrees/batch`

---

### Step 4 — Messages List Loads + Unread UI Works (PASS/FAIL)
Call: `GET /api/conversations/:userId`

**PASS if:**
- Threads render with:
  - `otherUser.name`
  - `lastMessage.content`
  - `unreadCount` badge
- Timestamps display in **local device time** (not raw UTC Z strings)

---

### Step 5 — DM Thread Renders (Replies/Reactions/Edited/Timezones) (PASS/FAIL)
Call: `GET /api/messages/:userId`

**PASS if:**
- Message bubbles render left/right by `senderId === currentUser.id`
- Null safety:
  - `reactions: null` → no reactions UI
  - `repliedMessage: null` → no reply preview
- Shows "(edited)" when `isEdited === true`
- Timestamps display in local time
- On open, app calls `POST /api/messages/:userId/mark-read` and unread badge decreases

---

### Step 6 — WebSocket Connect + Auth + Background/Reconnect (PASS/FAIL)
Connect to: `wss://nearbytraveler.org/ws`

On open, send:
```json
{ "type": "auth", "userId": <currentUser.id>, "sessionId": "<connect.sid value>" }
```

**PASS if:**
- WS connects and authenticates
- Receiving a message updates UI without refresh
- Background test: put app in background 20–30 seconds → return
  - Reconnects automatically
  - Sending a message works immediately
  - No duplicated messages after reconnect
- Offline queue works (queue while disconnected, flush on reconnect)

**FAIL if:**
- WS never authenticates
- Returning from background breaks real-time until full restart

---

### Step 7 — Create Trip → Chatrooms Refresh + Destination Appears (PASS/FAIL)
1. Create trip via `POST /api/travel-plans`
2. Immediately refetch `GET /api/chatrooms/my-locations`

**PASS if:**
- Destination chatroom appears immediately after trip creation
- Chatrooms highlight membership using `userIsMember`
- App refetches chatrooms after trip changes (create/edit/delete)

---

### 🛑 STOP CONDITION (MANDATORY)

**Do not implement Phase 2+ until Phase 1 passes TWICE:**
1. Fresh install run
2. App restart run (Step 2 must pass)

If any step fails, fix it before proceeding. Do not work around failures.

---

## CRITICAL IMPLEMENTATION CHECKS (Verify These Work)

### 1. Session Auth on Native
- Backend uses cookie-based sessions (`connect.sid`)
- Mobile app MUST persist cookies after login and send them on all subsequent requests
- If `/api/auth/user` returns 401 after successful login, cookies aren't being persisted
- Use `credentials: 'include'` on all fetch calls

### 2. WebSocket Auth
- WebSocket connections must include session cookies in handshake
- If cookies don't work with WS on native, backend also accepts `x-user-id` header as fallback for some endpoints

### 3. Null Safety Everywhere
- Always handle null values gracefully:
  - `profileImage: null` → show initials avatar
  - `destinationCity: null` → hide traveler line
  - `reactions: null` → hide reactions UI
  - `repliedMessage: null` → hide reply preview

### 4. Timezone Display
- Backend timestamps end in `Z` (UTC)
- ALWAYS display in device local timezone
- Never show raw UTC to users

### 5. iOS Permissions (Add to app.json Early)
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "Upload profile photos",
        "NSCameraUsageDescription": "Take profile photos",
        "NSLocationWhenInUseUsageDescription": "Find nearby users and events"
      }
    }
  }
}
```

### 6. Cookie/CORS Requirements (Critical for Auth)
Backend MUST have these headers for mobile to work:
- `Set-Cookie: connect.sid=...; Secure; HttpOnly; SameSite=None` (SameSite=None is critical for mobile)
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Origin: <specific-origin>` (not `*`)

**RN Cookie Persistence:**
- Use `@react-native-cookies/cookies` to persist cookies across app restarts
- Create single API wrapper that always includes `credentials: 'include'`

### 7. WebSocket Reliability on iOS
Even if HTTP cookies work, WS handshake often fails on native. Handle these scenarios:
- Cold start
- Background → foreground transition
- Network drop → reconnect

**Always send auth message immediately after connect:**
```json
{ "type": "auth", "userId": 123, "sessionId": "<connect.sid value if available>" }
```
Use exponential backoff for reconnection: 1s, 2s, 4s... max 30s.

### 8. Pagination (Required for Mobile Performance)
Most list endpoints support pagination. Always use:
- `limit` - Number of items (default: 20)
- `offset` - Skip count for pagination
- Sort order is `createdAt DESC` by default

Paginated endpoints:
- `/api/search-users?limit=20&offset=0`
- `/api/messages/:userId?limit=50&offset=0`
- `/api/events?limit=20&offset=0`
- `/api/quick-deals?limit=20&offset=0`
- `/api/chatrooms/:id` (messages paginated)

Implement infinite scroll on all list screens.

### 9. Error Response Standard
All errors follow this shape:
```json
{
  "message": "Human-readable error message",
  "error": "ERROR_CODE",
  "details": { "field": "validation error" }  // Optional, for 422
}
```

Status codes:
- `401` - Unauthenticated (redirect to login)
- `403` - Forbidden (blocked user, insufficient permissions)
- `404` - Not found (hide feature gracefully)
- `422` - Validation errors (show field-level errors)
- `500` - Server error (show generic error toast)

### 10. Upload Format (Multipart Only)
ALL file uploads use `multipart/form-data` with field name `"photo"`:
- Profile photo: `PUT /api/users/:id/profile-photo`
- Cover photo: `POST /api/users/:id/cover-photo`
- Customer photos: `POST /api/businesses/:businessId/customer-photos`
- Event images: include in event creation form

**Max file size:** 5MB
**Supported types:** JPEG, PNG, WebP
**Response:** Returns updated object with new image URL

### 11. Blocked User Enforcement
Blocked users MUST be hidden from ALL surfaces:
- Discovery/search results
- City chatrooms and event chatrooms
- DM conversations
- Quick meetup participant lists
- Connection suggestions
- Referral auto-connects

The backend filters blocked users from responses, but verify this works.

### 12. Deep Links
Support these deep link patterns for sharing:
```
nearbytraveler://user/:userId
nearbytraveler://event/:eventId
nearbytraveler://city/:cityName
nearbytraveler://ref/:referralCode
nearbytraveler://meetup/:meetupId
```

Configure in app.json:
```json
{
  "expo": {
    "scheme": "nearbytraveler"
  }
}
```

---

## APP STORE COMPLIANCE CHECKLIST (Must Ship)

Before submitting to App Store, verify these are implemented:

- [ ] **Block user flow** - In-app blocking from profile menu
- [ ] **Report user flow** - In-app reporting with reason selection
- [ ] **Account deletion** - Either DELETE endpoint or WebView to /settings
- [ ] **Terms of Service link** - Open WebView to /terms
- [ ] **Privacy Policy link** - Open WebView to /privacy
- [ ] **Location sharing opt-in** - Default OFF, foreground-only updates
- [ ] **Age verification** - Collect birthday during signup
- [ ] **Content moderation** - Hide flagged content
- [ ] **Push notification permission** - Ask at appropriate moment, not on launch

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
- Profile completion is computed from `GET /api/auth/user`: `interests.length >= 3` AND `hometownCity` AND `profileImage` AND `bio`
- NOTE: `GET /api/bootstrap/status` is for welcome operations only, NOT profile completion

### Automatic Signup Flow (Backend Handles)

When a user signs up, the backend automatically:
1. **Sends welcome message** from `nearbytrav` (User ID 2) - personalized DM with getting started tips
2. **Creates hometown chatroom** - "Let's Meet Up in [City]" if doesn't exist
3. **Creates city page** - City infrastructure via `/api/cities/ensure`
4. **Generates city activities** - AI-powered "Things to Do" list for new cities
5. **Chatrooms list auto-populated** - `/api/chatrooms/my-locations` includes hometown + ALL upcoming destination cities immediately (`endDate >= today`). Response includes `userIsMember: true/false` for highlighting.
6. **Auto-connects to nearbytrav** - Creates connection with welcome account

The mobile app does NOT need to trigger these - they happen server-side during signup/profile completion.

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
- **Password Reset Flow:**
  - `POST /api/auth/forgot-password` - Send reset link
  - `GET /api/auth/verify-reset-token?token=<token>` - Verify token
  - `POST /api/auth/reset-password` - Set new password

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
- "Things in Common" compatibility badge (from `sharedInterests` + `compatibilityScore`)
- **Connection degree** subtitle under Connect button:
  - "12 mutual connections" (blue) for 2nd degree
  - "3rd degree connection" (purple) for 3rd degree
- API: `GET /api/search-users` (RECOMMENDED - includes compatibilityScore, sharedInterests, connectionStatus)
- Fallback: `GET /api/users` (simpler listing without compatibility data)
- Batch degrees: `POST /api/connections/degrees/batch`

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
- WebSocket: `wss://nearbytraveler.org/ws`

### 6. City Chatrooms
- Public chatrooms for each city
- Users auto-joined to hometown + destination chatrooms
- Real-time group chat
- API: `GET /api/chatrooms/my-locations`, `GET /api/chatrooms/:chatroomId`
- **Send message:** `POST /api/chatrooms/:chatroomId/messages` (body: `{content}`) OR via WebSocket:
  ```json
  { "type": "chatroom_message", "chatroomId": 1, "content": "Hello everyone!" }
  ```

### 7. Travel Plans
- Create trips with destination, dates
- View upcoming and past trips
- See who else is traveling to same destination
- API: `POST /api/travel-plans`, `GET /api/travel-plans/:userId`

### 8. Quick Meetups
- Spontaneous meetup requests ("Coffee now?")
- Time-limited (expire after set hours)
- Location-based with dedicated chatrooms
- **API Endpoints:**
  - `POST /api/quick-meetups` - Create meetup
  - `GET /api/quick-meetups` - List meetups (filter by city, status)
  - `GET /api/quick-meetups/:id` - Get single meetup
  - `PUT /api/quick-meetups/:id` - Update meetup
  - `DELETE /api/quick-meetups/:id` - Delete meetup
  - `POST /api/quick-meetups/:id/join` - Join meetup
  - `GET /api/quick-meetups/:id/participants` - Get participants
  - `POST /api/quick-meetups/:id/restart` - Restart expired meetup
- **Meetup Chatrooms:**
  - `GET /api/quick-meetup-chatrooms/:meetupId` - Get chatroom
  - `GET /api/quick-meetup-chatrooms/:chatroomId/messages` - Get messages
  - `POST /api/quick-meetup-chatrooms/:chatroomId/messages` - Send message
  - `POST /api/quick-meetup-chatrooms/:chatroomId/join` - Join chatroom

### 9. Events
- Community events and meetups
- RSVP functionality (Going/Interested)
- Event chat rooms for attendees
- Event organizer features
- **Event Endpoints:**
  - `GET /api/events` - List events (filter by city, date)
  - `GET /api/events/:id` - Get event details
  - `POST /api/events` - Create event
  - `POST /api/events/:id/join` - RSVP (body: `{userId, status: "going"|"interested"}`)
  - `POST /api/events/:id/leave` - Cancel RSVP
  - `GET /api/events/:id/participants` - Get attendees
  - `GET /api/events/organizer/:organizerId` - Events by organizer
  - `GET /api/events/nearby?lat=<lat>&lng=<lng>` - Nearby events
- **Event Chatrooms:**
  - `GET /api/event-chatrooms/:eventId` - Get event chatroom
  - `GET /api/event-chatrooms/:chatroomId/members` - Chatroom members
  - `GET /api/event-chatrooms/:chatroomId/messages` - Get messages
  - `POST /api/event-chatrooms/:chatroomId/messages` - Send message
  - `POST /api/event-chatrooms/:chatroomId/join` - Join chatroom

### 9b. Secret Experiences (Hidden Gems)
- Local insider tips and hidden spots in each city
- Like/save functionality for users
- **API:**
  - `GET /api/secret-experiences/:city` - Get city's hidden gems
  - `POST /api/secret-experiences/:experienceId/like` - Like/save experience

### 10. References & Vouches
- Written references from connections (like LinkedIn recommendations)
- Vouch system for trust building
- Display on profiles
- **Experience types:** `positive`, `negative`, `neutral`
- API: `GET /api/users/:userId/references`, `POST /api/user-references`
- Edit/Delete: `PATCH /api/user-references/:referenceId`, `DELETE /api/user-references/:referenceId`
- Check existing: `GET /api/user-references/check/:reviewerId/:revieweeId`

### 11. Business Features (for Business accounts only)
- Business dashboard
- Create deals and offers
- Flash deals (time-limited)
- Business profile with location/hours
- **Quick Deals (Flash Deals):**
  - `GET /api/quick-deals` - Browse deals (filter by city)
  - `POST /api/quick-deals` - Create deal
  - `PUT /api/quick-deals/:id` - Update deal
  - `DELETE /api/quick-deals/:id` - Delete deal
  - `GET /api/quick-deals/history/:businessId` - Deal history
  - `POST /api/quick-deals/:id/claim` - Claim deal
- **Business Deals (Long-term):**
  - `GET /api/business-deals` - Browse business deals
  - `GET /api/business-deals/business/:businessId` - Deals by business
  - `POST /api/business-deals` - Create deal
  - `PUT /api/business-deals/:id` - Update deal
  - `DELETE /api/business-deals/:id` - Delete deal
  - `POST /api/business-deals/claim` - Claim deal
  - `GET /api/business-deals/analytics` - Deal analytics
- **Business Directory:**
  - `GET /api/businesses` - List businesses
  - `GET /api/businesses/map` - Businesses with map coordinates
  - `GET /api/businesses/:businessId/customer-photos` - Customer photos
  - `POST /api/businesses/:businessId/customer-photos` - Upload customer photo

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

### City Activities ("Things to Do")
User-created and AI-enhanced activity suggestions for each city.
- `GET /api/city-activities/:cityName` - Get activities for city
- `POST /api/city-activities` - Add new activity
- `DELETE /api/city-activities/:activityId` - Remove activity
- `POST /api/city-activities/:cityName/enhance` - AI-enhance activities
- `GET /api/users/search-by-activity-name?activity=<name>` - Find users interested in activity

---

## ITINERARIES (Trip Planning)

Detailed day-by-day planning for travel plans:
- `GET /api/itineraries/travel-plan/:travelPlanId` - Get itinerary for trip
- `GET /api/itineraries/:id` - Get single itinerary
- `POST /api/itineraries` - Create itinerary
- `POST /api/itineraries/:id/items` - Add item to itinerary
- `PUT /api/itinerary-items/:id` - Update itinerary item
- `DELETE /api/itinerary-items/:id` - Delete itinerary item
- `GET /api/travel-plans-with-itineraries/:userId` - Get trips with full itineraries

---

## EXTERNAL EVENTS (Third-Party Integrations)

Import events from external platforms:
- `GET /api/external-events/ticketmaster?city=<city>` - Ticketmaster events
- `GET /api/external-events/stubhub?city=<city>` - StubHub events
- `GET /api/external-events/meetup?city=<city>` - Meetup events
- `GET /api/external-events/eventbrite?city=<city>` - Eventbrite events
- `GET /api/external-events/allevents?city=<city>` - AllEvents aggregator
- `GET /api/external-events/curated/:city` - Curated local events
- `POST /api/events/import-url` - Import event from URL (body: `{url}`)
  - Supported: meetup.com, couchsurfing.com (scrapes event details)

---

## REFERRAL SYSTEM

Users can share referral codes/QR to invite friends:
- `GET /api/referral/:code` - Validate referral code and get referrer info
- Referral code passed during signup: `POST /api/register` with `{...userData, referralCode: "ABC123"}`
- New users get auto-connected to their referrer
- QR codes generated client-side using referral code

---

## NOTIFICATION SETTINGS

User preferences for notifications:
- `PUT /api/users/notification-settings` - Update notification preferences
  ```json
  {
    "emailNotifications": true,
    "pushNotifications": true,
    "connectionRequests": true,
    "newMessages": true,
    "eventReminders": true,
    "weeklyDigest": true
  }
  ```

---

## MESSAGE REACTIONS

WhatsApp-style emoji reactions on messages:
- `POST /api/messages/:messageId/reaction` - Add/update reaction (body: `{emoji: "👍"}`)
- Reactions stored as array on message: `reactions: [{userId, emoji, createdAt}]`
- Display reaction bar below message bubble if reactions exist

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
- API: `POST /api/support/report` (endpoint exists)

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
**See "FINAL TAB STRUCTURE" at end of document for authoritative tab layout.**

Summary:
- Regular users: Home | Events | Chatrooms | Messages | Profile
- Business users: Dashboard | Deals | Messages | Search | Profile
- Search is a modal/overlay launched from Home (not a bottom tab for regular users)
- Create actions use FAB (Floating Action Button), not tabs

---

## WEB APP TO MOBILE NAVIGATION MAPPING

### Current Web App Structure

**Bottom Navigation (Mobile Web):**
| Tab | Regular Users | Business Users |
|-----|--------------|----------------|
| 1 | Home (Discovery) | Dashboard |
| 2 | Search (opens modal) | Search (opens modal) |
| 3 | Messages | Messages |
| 4 | Profile | Business Profile |
| + | Action Menu | Action Menu |

**Action Menu (Plus Button):**
- Regular Users: Create Event, Create Trip, Create Quick Meetup
- Business Users: Create Deal, Create Quick Deal

### Complete Web Page List → Mobile Screen Mapping

#### Core Pages (Must Have)
| Web Route | Web Page | Mobile Screen | Priority |
|-----------|----------|---------------|----------|
| `/` | Home / Discovery | Home Tab | P0 |
| `/signin` | Sign In | Login Screen | P0 |
| `/join` | Join / Signup | Signup Flow | P0 |
| `/signup-local` | Local Signup | Signup - Local | P0 |
| `/signup-traveling` | Traveler Signup | Signup - Traveler | P0 |
| `/signup-business` | Business Signup | Signup - Business | P0 |
| `/profile/:id` | User Profile | Profile Screen | P0 |
| `/messages` | Messages List | Messages Tab | P0 |
| `/dm/:userId` | DM Conversation | Chat Screen | P0 |
| `/settings` | Settings | Settings Screen | P0 |

#### Social Features
| Web Route | Web Page | Mobile Screen | Priority |
|-----------|----------|---------------|----------|
| `/connect` | Connections | Connections List | P1 |
| `/requests` | Connection Requests | Requests Screen | P1 |
| `/chatrooms` | City Chatrooms List | Chatrooms Tab | P1 |
| `/chatroom/:id` | Chatroom View | Chatroom Screen | P1 |

#### Travel Features
| Web Route | Web Page | Mobile Screen | Priority |
|-----------|----------|---------------|----------|
| `/plan-trip` | Create Travel Plan | Create Trip Screen | P1 |
| `/travel-plans` | My Travel Plans | Travel Plans List | P1 |
| `/passport` | Travel Passport | Passport Screen | P2 |
| `/itinerary/:id` | Trip Itinerary | Itinerary Screen | P2 |

#### Events & Meetups
| Web Route | Web Page | Mobile Screen | Priority |
|-----------|----------|---------------|----------|
| `/events` | Events List | Events Tab | P1 |
| `/event/:id` | Event Details | Event Detail Screen | P1 |
| `/create-event` | Create Event | Create Event Screen | P1 |
| `/quick-meetups` | Quick Meetups | Meetups Screen | P1 |
| `/meetups` | Meetup Events | Meetups List | P2 |
| `/event-chat/:id` | Event Chat | Event Chat Screen | P2 |

#### City Pages
| Web Route | Web Page | Mobile Screen | Priority |
|-----------|----------|---------------|----------|
| `/city/:city` | City Page | City Home Screen | P1 |
| `/city/:city/users` | City Users | City Users List | P2 |

#### Business Features
| Web Route | Web Page | Mobile Screen | Priority |
|-----------|----------|---------------|----------|
| `/business-dashboard` | Business Dashboard | Dashboard Tab | P0 (business) |
| `/business-offers` | Create Offers | Create Deal Screen | P1 (business) |
| `/deals` | Deals List | Deals Screen | P1 |

#### Search & Discovery
| Web Route | Web Page | Mobile Screen | Priority |
|-----------|----------|---------------|----------|
| `/discover` | Discover Page | Part of Home Tab | P1 |
| `/users` | Users Directory | Search Results | P2 |
| (modal) | Advanced Search | Search Modal | P1 |

#### Profile Features
| Web Route | Web Page | Mobile Screen | Priority |
|-----------|----------|---------------|----------|
| `/profile/:id` | Full Profile | Profile Screen | P0 |
| `/upload-photos` | Photo Upload | Photo Gallery | P2 |
| `/qr-code` | QR Code | QR Display Screen | P2 |

#### Legal & Info
| Web Route | Web Page | Mobile Screen | Priority |
|-----------|----------|---------------|----------|
| `/terms` | Terms of Service | Terms (WebView) | P0 |
| `/privacy` | Privacy Policy | Privacy (WebView) | P0 |
| `/cookies` | Cookie Policy | Cookies (WebView) | P3 |
| `/about` | About | About Screen | P3 |
| `/community-guidelines` | Community Guidelines | Guidelines (WebView) | P2 |

#### Auth & Account
| Web Route | Web Page | Mobile Screen | Priority |
|-----------|----------|---------------|----------|
| `/forgot-password` | Forgot Password | Forgot Password | P1 |
| `/reset-password` | Reset Password | Reset Password | P1 |
| `/welcome` | Welcome Screen | Onboarding Complete | P1 |

### Mobile-Only Features (Not on Web)
| Feature | Description | Priority |
|---------|-------------|----------|
| Push Notifications | Native push alerts | P1 |
| Camera Integration | Photo capture | P1 |
| QR Scanner | Scan connection QR codes | P2 |
| Apple Calendar | Add events to calendar | P2 |
| Share Sheet | Native sharing | P2 |
| Biometric Login | Face ID / Touch ID | P3 |

### Pages to SKIP for Mobile
| Web Page | Reason |
|----------|--------|
| `/admin-dashboard` | Admin-only, web sufficient |
| `/admin-settings` | Admin-only |
| `/admin-referrals` | Admin-only |
| `/sms-test` | Dev testing only |
| `/pitch-preview` | Internal presentation |
| Landing pages (`/events-landing`, `/locals-landing`, etc.) | Marketing, not app features |

### Recommended Mobile Tab Structure

**For Regular Users (5 tabs):**
```
[ Home ] [ Events ] [ Chatrooms ] [ Messages ] [ Profile ]
            |
      (+ FAB for: Create Event, Plan Trip, Quick Meetup)
```

**For Business Users (5 tabs):**
```
[ Dashboard ] [ Deals ] [ Messages ] [ Search ] [ Profile ]
                 |
      (+ FAB for: Create Deal, Flash Deal)
```

### Navigation Patterns

1. **Bottom Tabs** - Primary navigation (5 main sections)
2. **Floating Action Button (FAB)** - Create actions
3. **Stack Navigation** - Push screens within each tab
4. **Modal Sheets** - Quick actions, search, filters
5. **Drawer** - Settings, account, help (optional)

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
const ws = new WebSocket('wss://nearbytraveler.org/ws');

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

API: `POST /api/push/register`, `POST /api/push/send` (endpoints exist)

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
- `GET /api/bootstrap/status` - Bootstrap/welcome operations ONLY (NOT profile completion)
- **Password Reset:**
  - `POST /api/auth/check-email` - Check if email exists
  - `POST /api/auth/forgot-password` - Send reset email (body: `{email}`)
  - `GET /api/auth/verify-reset-token?token=<token>` - Verify reset token
  - `POST /api/auth/reset-password` - Reset password (body: `{token, newPassword}`)

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
- `POST /api/events/:id/join` - RSVP to event (body: `{userId, status: "going"|"interested"}`)
- `POST /api/events/:id/leave` - Cancel RSVP
- `GET /api/events/:id/participants` - Get event attendees

### Chatrooms
- `GET /api/chatrooms/my-locations` - Get user's chatrooms
- `GET /api/chatrooms/:chatroomId` - Get chatroom messages
- `POST /api/chatrooms/:chatroomId/messages` - Send chatroom message (body: `{content}`)

### Cities
- `GET /api/cities/:city/overview` - City home data with stats and coordinates (CANONICAL endpoint for city pages)
- `GET /api/city/:city/users` - Users in city (NOTE: This endpoint intentionally uses `/api/city` singular - do not rename)
- `GET /api/city-stats` - All cities with stats
- `GET /api/city-stats/:city` - Stats for specific city
- `GET /api/events?city=Los%20Angeles` - City events (metro expansion is server-side)

### Geolocation & Maps
- `GET /api/businesses/map` - Businesses with lat/lng for map pins
- `PATCH /api/users/:id/location` - Update user's current location
- `GET /api/users/nearby` - Find users near coordinates (if locationSharingEnabled)

### Connections (LinkedIn-style)
- `GET /api/mutual-connections/:userId1/:userId2` - Shared connections between two users
- `GET /api/connections/degree/:userId/:targetUserId` - Connection degree (1st, 2nd, 3rd)
- `POST /api/connections/degrees/batch` - Batch degrees for discovery grid

### Trust & Safety
- `POST /api/users/block` - Block user (body: `{blockedUserId}`)
- `GET /api/users/blocked` - Get blocked users list
- `DELETE /api/users/block/:blockedUserId` - Unblock user
- `POST /api/support/report` - Report user/content (body: `{userId, targetId, reason, details}`)
- `POST /api/support/private-reference` - Submit private concern to support *(OPTIONAL: if not implemented, email support@nearbytraveler.org)*

### References (Reviews/Recommendations)
- `GET /api/users/:userId/references` - Get user's references
- `POST /api/user-references` - Write a reference (body: `{reviewerId, revieweeId, content, experience}`)
- `PATCH /api/user-references/:referenceId` - Edit reference *(OPTIONAL: v2 feature)*
- `DELETE /api/user-references/:referenceId` - Delete reference *(OPTIONAL: v2 feature)*
- `GET /api/user-references/check/:reviewerId/:revieweeId` - Check if reference exists *(OPTIONAL: can filter client-side from references list)*

### Photo Management
- `PUT /api/users/:id/profile-photo` - Upload profile photo (multipart/form-data, field: "photo")
- `POST /api/users/:id/cover-photo` - Upload cover photo (multipart/form-data, field: "photo")
- `DELETE /api/users/profile-photo` - Clear profile photo *(OPTIONAL: if not implemented, set profileImage to null via PUT /api/users/:id)*

### Account Management
- `DELETE /api/users/:id` - Delete account *(OPTIONAL: if not implemented, open WebView to /settings or email support@nearbytraveler.org)*
- `PUT /api/users/:id` - Update profile/privacy settings

### Deals (Browse as Regular User)
- `GET /api/quick-deals?city=<city>` - Browse deals in a city

### Payments & Subscriptions (Stripe)
Backend uses Stripe for business subscriptions. The mobile app should use WebView for checkout (Apple-friendly, avoids 30% IAP cut).

**Endpoints:**
- `GET /api/business/subscription-status` - Check subscription status
  ```json
  {
    "hasSubscription": true,
    "status": "active",
    "isActive": true,
    "trialActive": false,
    "trialEnd": "2024-02-15T00:00:00Z",
    "nextBillingDate": "2024-03-15T00:00:00Z",
    "needsPayment": false,
    "needsSubscription": false,
    "trialExpired": false,
    "freeMode": false
  }
  ```
- `POST /api/business/create-subscription` - Initiate subscription (returns Stripe checkout URL)
  ```json
  { "clientSecret": "cs_xxx", "url": "https://checkout.stripe.com/..." }
  ```
- `POST /api/business/cancel-subscription` - Cancel subscription

**Mobile Implementation:**
1. Check `GET /api/business/subscription-status` on business dashboard load
2. For "Subscribe" button: call `POST /api/business/create-subscription`, then open returned URL in WebView or Safari
3. After payment completes, user returns to app → refetch subscription status
4. Show subscription badge/status on business dashboard

**Donations Page:**
- Open WebView to `https://nearbytraveler.org/donate` for one-time donations

### Nearby Users
- `GET /api/users/nearby?lat=<lat>&lng=<lng>&radiusKm=10` - Find nearby users (location sharing enabled only)

---

## WEBSOCKET CONNECTION

For real-time messaging, connect to:
```
wss://nearbytraveler.org/ws
```
**NOTE:** The `/ws` path is required - do not use root path.

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
14. Events listing and RSVP (join/leave)
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

---

## APPENDIX: REAL API RESPONSE SHAPES (Use These Exactly)

**CRITICAL: All screens must be implemented strictly based on the API response shapes in this Appendix. Do not invent fields or endpoints.**

### METRO CONSOLIDATION (SERVER-SIDE — NO APP LOGIC)

All metro area logic is handled by the backend. The mobile app does NOT need to:
- maintain city lists
- check if a city is in a metro area
- transform or normalize city names

Mobile should simply pass raw city names entered/selected by the user:
```
GET /api/users?location=Venice
GET /api/events?city=Santa Monica
GET /api/chatrooms?city=Culver City
```

Backend automatically expands Los Angeles metro (76 cities), is case-insensitive, and supports future metro areas without app updates.

---

### Auth: GET /api/auth/user (current user)

Use this response shape as the single source of truth for:
- user identity, userType, online status, profile fields
- whether to show "Nearby Traveler • Destination" line (isCurrentlyTraveling + destination fields)

```json
{
  "id": 2,
  "username": "nearbytrav",
  "email": "user@example.com",
  "name": "John Smith",
  "userType": "local",
  "bio": "Love exploring local coffee shops and hiking trails",
  "hometownCity": "Los Angeles",
  "hometownState": "California",
  "hometownCountry": "United States",
  "destinationCity": null,
  "destinationState": null,
  "destinationCountry": null,
  "profileImage": "https://storage.googleapis.com/...",
  "interests": ["Food & Dining", "Outdoor Adventures", "Photography"],
  "languagesSpoken": ["English", "Spanish"],
  "gender": "male",
  "age": 32,
  "ageVisible": true,
  "isCurrentlyTraveling": false,
  "travelDestination": null,
  "isActive": true,
  "isAdmin": false,
  "onlineStatus": "online"
}
```

**Rules:**
- Always show: `Nearby Local • {hometownCity}`
- Only show traveler line during active travel: `Nearby Traveler • {destinationCity}` when `isCurrentlyTraveling === true`

---

### Profile Completion Gating (IMPORTANT)

`GET /api/bootstrap/status` does NOT represent profile completion. It only indicates bootstrap/welcome operations.

**Actual mobile gating logic must be computed from user object:**
- `interests.length >= 3`
- `hometownCity` exists
- `profileImage` exists
- `bio` exists

If missing, show onboarding completion prompts and hide user from discovery until complete.

---

### Inbox list: GET /api/conversations/:userId

Use this exact shape for Messages tab list (unread badges, preview text, online status).

```json
[
  {
    "id": 123,
    "otherUserId": 45,
    "otherUser": {
      "id": 45,
      "username": "traveler_jane",
      "name": "Jane Doe",
      "profileImage": "https://...",
      "onlineStatus": "online"
    },
    "lastMessage": {
      "id": 789,
      "content": "Hey! Are you free for coffee tomorrow?",
      "senderId": 45,
      "createdAt": "2024-01-15T14:30:00Z",
      "isRead": false
    },
    "unreadCount": 3
  }
]
```

---

### DM thread: GET /api/messages/:userId

Use this exact shape for message rendering (bubbles, replies, reactions, edited label, read receipts).

```json
[
  {
    "id": 789,
    "senderId": 45,
    "receiverId": 2,
    "content": "Hey! Are you free for coffee tomorrow?",
    "messageType": "text",
    "isRead": true,
    "isEdited": false,
    "reactions": null,
    "replyToId": null,
    "repliedMessage": null,
    "createdAt": "2024-01-15T14:30:00Z",
    "updatedAt": "2024-01-15T14:30:00Z",
    "sender": {
      "id": 45,
      "username": "traveler_jane",
      "name": "Jane Doe",
      "profileImage": "https://...",
      "onlineStatus": "online"
    },
    "receiver": {
      "id": 2,
      "username": "nearbytrav",
      "name": "John Smith",
      "profileImage": "https://...",
      "onlineStatus": "online"
    }
  }
]
```

**Chat UI rules:**
- Bubble side is determined by `senderId === currentUser.id`
- Show "(edited)" if `isEdited === true`
- Show reaction bar if `reactions` is non-null and non-empty
- If `replyToId` exists, show `repliedMessage.content` preview above bubble
- Show read receipts based on `isRead` for messages sent by current user
- Parse timestamps from UTC (Z) but display in device local time

**Related endpoints:**
- `POST /api/messages/:userId/mark-read` (call when opening thread + when app becomes active in thread)
- `GET /api/messages/:userId/unread-count` (tab badge)

---

### Chatroom messages: GET /api/chatrooms/:chatroomId

Use this exact shape for chatroom screen (header + message list + membership state).

```json
{
  "chatroom": {
    "id": 1,
    "name": "Los Angeles Chat",
    "city": "Los Angeles",
    "state": "California",
    "country": "United States",
    "memberCount": 47,
    "isActive": true
  },
  "messages": [
    {
      "id": 101,
      "content": "Anyone know good brunch spots in Venice?",
      "userId": 23,
      "user": { "id": 23, "username": "beach_lover", "name": "Sarah", "profileImage": "https://..." },
      "createdAt": "2024-01-15T09:30:00Z"
    }
  ],
  "userIsMember": true
}
```

**Chatroom behavior (confirmed):**
- `GET /api/chatrooms/my-locations` includes ALL upcoming trips (`endDate >= today`)
- Destination chatrooms appear immediately after trip creation
- Highlight chatrooms where `userIsMember: true`
- After creating/editing/deleting a trip: immediately refetch `/api/chatrooms/my-locations`

---

### Discovery grid: GET /api/search-users (RECOMMENDED) or GET /api/users

**IMPORTANT: Use `GET /api/search-users` for Home discovery** - it includes `compatibilityScore` and `sharedInterests` for "things in common" badges.

Use `GET /api/users` only for simpler listings without compatibility data.

The list can contain locals, travelers, and businesses in one feed.

```json
[
  {
    "id": 45,
    "username": "traveler_jane",
    "name": "Jane Doe",
    "userType": "traveler",
    "bio": "Digital nomad exploring the world one city at a time",
    "hometownCity": "Austin",
    "hometownState": "Texas",
    "hometownCountry": "United States",
    "destinationCity": "Los Angeles",
    "destinationState": "California",
    "destinationCountry": "United States",
    "profileImage": "https://storage.googleapis.com/...",
    "interests": ["Photography", "Food & Dining", "Arts & Music"],
    "isCurrentlyTraveling": true,
    "travelDestination": "Los Angeles",
    "gender": "female",
    "age": 28,
    "ageVisible": true,
    "languagesSpoken": ["English", "French"],
    "onlineStatus": "online",
    "isActive": true
  },
  {
    "id": 89,
    "username": "cafe_downtown",
    "name": "Downtown Cafe",
    "userType": "business",
    "bio": "Best coffee and pastries in DTLA since 2015",
    "hometownCity": "Los Angeles",
    "hometownState": "California",
    "hometownCountry": "United States",
    "profileImage": "https://...",
    "interests": ["Food & Dining"],
    "streetAddress": "123 Main St",
    "phoneNumber": "+1-555-123-4567",
    "websiteUrl": "www.downtowncafe.com",
    "isActive": true
  }
]
```

**Discovery query parameters:**
- `location` (supports metro consolidation server-side)
- `userType` = `local` | `traveler` | `business`
- `gender` = `male` | `female` | `non-binary`
- `minAge`, `maxAge`
- `interests` (comma-separated)
- `search` (name/username/bio)

**UI rules:**
- For business cards, show: name + bio + address/website button (if present). Hide traveler-specific fields.
- For non-business, show:
  - "Nearby Local • hometownCity" always
  - traveler line only if `isCurrentlyTraveling === true`
- If `ageVisible === false`, hide age everywhere.

---

### Search users: GET /api/search-users

Use these fields exactly for Discovery/Search cards:
`compatibilityScore`, `sharedInterests`, and `connectionStatus` drive UI badges/CTAs

**connectionStatus values and UI mapping:**
| Value | Button Text | Action |
|-------|-------------|--------|
| `"none"` | "Connect" | Send connection request |
| `"outgoing_pending"` | "Requested" | Show pending state |
| `"incoming_pending"` | "Accept" | Accept connection |
| `"connected"` | "Message" | Open DM |
| `"blocked"` | (hide card) | Card hidden from results |

```json
[
  {
    "id": 45,
    "username": "traveler_jane",
    "name": "Jane Doe",
    "userType": "traveler",
    "bio": "Digital nomad exploring the world",
    "hometownCity": "Austin",
    "hometownState": "Texas",
    "hometownCountry": "United States",
    "profileImage": "https://...",
    "interests": ["Photography", "Food & Dining", "Arts & Music"],
    "isCurrentlyTraveling": true,
    "travelDestination": "Los Angeles",
    "gender": "female",
    "age": 28,
    "languagesSpoken": ["English", "French"],
    "compatibilityScore": 0.75,
    "sharedInterests": ["Food & Dining", "Photography"],
    "connectionStatus": "none"
  }
]
```

---

### Events list: GET /api/events

Use this exact shape for Events tab + Event detail screen.

**Key logic:**
- `eventType === "community"` → show RSVP buttons in-app
- `eventType === "imported"` → show "via {source}" and open `externalUrl` in Safari; no fake in-app purchase

```json
[
  {
    "id": 1,
    "title": "Beach Bonfire Meetup",
    "description": "Join us for a casual bonfire at Venice Beach",
    "date": "2024-01-20T18:00:00Z",
    "endDate": "2024-01-20T22:00:00Z",
    "city": "Venice",
    "state": "California",
    "country": "United States",
    "location": "Venice Beach Fire Pits",
    "organizerId": 12,
    "organizer": { "id": 12, "username": "event_host", "name": "Lisa Martinez", "profileImage": "https://..." },
    "eventType": "community",
    "source": null,
    "externalUrl": null,
    "imageUrl": "https://...",
    "maxAttendees": 30,
    "currentAttendees": 18,
    "isPublic": true,
    "userRsvpStatus": "going",
    "rsvpCount": 18
  },
  {
    "id": 2,
    "title": "Taylor Swift Concert",
    "description": "The Eras Tour at SoFi Stadium",
    "date": "2024-02-15T19:30:00Z",
    "city": "Los Angeles",
    "state": "California",
    "country": "United States",
    "location": "SoFi Stadium",
    "eventType": "imported",
    "source": "ticketmaster",
    "externalUrl": "https://ticketmaster.com/...",
    "imageUrl": "https://...",
    "maxAttendees": null,
    "currentAttendees": null,
    "isPublic": true,
    "userRsvpStatus": null,
    "rsvpCount": 0
  }
]
```

---

### Event detail: GET /api/events/:id

Use this shape for Event Details screen (deep link from events list, city home, calendar).

```json
{
  "id": 1,
  "title": "Beach Bonfire Meetup",
  "description": "Join us for a casual bonfire at Venice Beach. Bring snacks to share! We'll have music and great conversations.",
  "date": "2024-01-20T18:00:00Z",
  "endDate": "2024-01-20T22:00:00Z",
  "city": "Venice",
  "state": "California",
  "country": "United States",
  "location": "Venice Beach Fire Pits",
  "organizerId": 12,
  "organizer": "event_host",
  "eventType": "community",
  "source": null,
  "externalUrl": null,
  "imageUrl": "https://storage.googleapis.com/...",
  "maxAttendees": 30,
  "currentAttendees": 18,
  "isPublic": true,
  "participantCount": 18,
  "createdAt": "2024-01-10T14:00:00Z"
}
```

**Organizer field note:**
- For community events: `organizer` is the username
- For imported events: `organizer` may be `"Outside of the Website"` (external source)

**Event RSVP endpoints:**
- `GET /api/events/:id/participants` (attendees list)
- `POST /api/events/:id/join` body: `{ "userId": 2, "status": "going" | "interested" }`
- `POST /api/events/:id/leave` (cancel RSVP)

**UI rules:**
- If `eventType === "community"`: show Going/Interested actions using join/leave endpoints.
- If `eventType === "imported"`: show source label + open externalUrl in Safari. Do not show fake RSVP/join.

---

### Travel plans list: GET /api/travel-plans/:userId

Use this response shape for Profile → Trips and for trip management screens.

```json
[
  {
    "id": 123,
    "userId": 2,
    "destination": "Paris, France",
    "destinationCity": "Paris",
    "destinationState": null,
    "destinationCountry": "France",
    "startDate": "2024-03-15T00:00:00Z",
    "endDate": "2024-03-22T00:00:00Z",
    "interests": ["Food & Dining", "Arts & Music", "Photography"],
    "activities": ["Museum Tours", "Wine Tasting", "Walking Tours"],
    "events": null,
    "travelStyle": ["Couple", "Luxury"],
    "accommodation": "Hotel",
    "transportation": "Flight",
    "notes": "Anniversary trip! Want to see the Eiffel Tower at sunset",
    "autoTags": ["romantic", "europe", "culture"],
    "status": "planned",
    "createdAt": "2024-01-10T15:30:00Z"
  }
]
```

**Rules:**
- `status` is computed from dates (not manually set)
- `planned` (future), `active` (ongoing), `completed` (past)
- Parse UTC timestamps but display in device local time.

**Critical product rule (confirmed):**
Creating a trip (any future date) results in immediate destination chatroom availability via `GET /api/chatrooms/my-locations` (backend includes all upcoming trips where `endDate >= today`).

---

### TIMEZONE RULE (important because backend sends Z)

Backend timestamps are ISO strings often ending with Z (UTC). The app must:
- parse ISO timestamps reliably
- display in device local timezone
- never show raw UTC formatting to users

---

### NULL-HANDLING (required for all screens)

`profileImage`, `destinationCity`, `reactions`, and `repliedMessage` may be null. UI must gracefully render fallbacks:
- Null `profileImage` → initials avatar
- Null `destinationCity` → hidden destination line
- Null `reactions` → no reactions UI
- Null `repliedMessage` → no reply preview

---

### City Stats: GET /api/city-stats/:city

Use this for City Home screens to show community activity stats (locals, travelers, businesses, events).

```json
{
  "city": "Los Angeles",
  "state": "California",
  "country": "United States",
  "localCount": 147,
  "travelerCount": 23,
  "businessCount": 45,
  "eventCount": 12
}
```

**Stat definitions (for accurate display):**
- `localCount`: Users whose `hometownCity` == city
- `travelerCount`: Users with upcoming/active trip where `destinationCity` == city AND `endDate >= today`
- `businessCount`: Business accounts with `hometownCity` == city
- `eventCount`: Events with `city` == city (within next 6 weeks)

**IMPORTANT:** All counts are **unique users** (deduped by userId), not number of trips.

**All cities list:** `GET /api/city-stats` returns array of all cities with their stats.

**Naming equivalence:** City overview `stats.locals/travelers` are equivalent to city-stats `localCount/travelerCount` fields.

---

### Deals for Regular Users (Locals/Travelers)

**Where deals appear (regular users don't have a Deals tab):**
- **City Home screen** - Shows local business deals in that city
- **Events tab** - Flash deals may appear as time-limited cards
- **Business profile pages** - Active deals from that business

**Browsing deals:** `GET /api/quick-deals?city=Los%20Angeles`

```json
[
  {
    "id": 1,
    "businessId": 89,
    "businessName": "Downtown Cafe",
    "title": "50% Off Lattes",
    "description": "Half price lattes all day Friday",
    "originalPrice": 6.00,
    "salePrice": 3.00,
    "dealCode": "FRIDAY50",
    "validFrom": "2024-01-19T00:00:00Z",
    "validUntil": "2024-01-19T23:59:59Z",
    "maxRedemptions": 50,
    "currentRedemptions": 12,
    "city": "Los Angeles",
    "isFlashDeal": true,
    "expiresIn": "4 hours"
  }
]
```

**IMPORTANT:** `expiresIn` is a **display-only string** (server-computed for UI convenience). For countdown timers, compute from `validUntil` timestamp.

---

### City Page Details: GET /api/cities/:city/overview

Use this for City Home screen with full city info.

```json
{
  "cityPage": {
    "id": 1,
    "cityName": "Los Angeles",
    "state": "California",
    "country": "United States",
    "description": "Discover Los Angeles and connect with locals and travelers"
  },
  "coordinates": { "lat": 34.0522, "lng": -118.2437 },
  "stats": {
    "totalUsers": 215,
    "totalEvents": 12,
    "totalBusinesses": 45,
    "locals": 147,
    "travelers": 23
  },
  "city": "Los Angeles",
  "state": "California",
  "country": "United States"
}
```

---

### Geolocation & Maps: GET /api/businesses/map

Use this for map view of businesses with pins.

```json
[
  {
    "id": 89,
    "username": "cafe_downtown",
    "name": "Downtown Cafe",
    "profileImage": "https://...",
    "latitude": 34.0407,
    "longitude": -118.2468,
    "streetAddress": "123 Main St",
    "hometownCity": "Los Angeles",
    "businessType": "restaurant"
  }
]
```

**Query parameters:**
- `city`, `state`, `country` - Filter by location
- `radiusKm`, `centerLat`, `centerLng` - Radius-based search

---

### Location Sharing: PATCH /api/users/:id/location

Users can share their real-time location for "nearby" features.

**Request body:**
```json
{
  "latitude": 34.0522,
  "longitude": -118.2437,
  "locationSharingEnabled": true
}
```

**User fields for location:**
- `currentLatitude` / `currentLongitude` - Current position
- `lastLocationUpdate` - When location was last updated
- `locationSharingEnabled` - Whether user opted in to share location

**SECURITY NOTE:** Client always uses `currentUser.id` from `/api/auth/user`. Server enforces self-only updates - users cannot update other users' locations.

**CRITICAL: Geolocation Safety Rules (Apple Review Compliance)**
1. **Opt-in by default**: Location sharing is OFF by default, user must explicitly enable
2. **Foreground only**: Only update location while app is in foreground (no background tracking in MVP)
3. **Update frequency**: On screen focus + every 60-120 seconds while viewing "Nearby" screens
4. **Privacy display**: Show approximate distance (e.g., "2 miles away"), never display exact coordinates publicly
5. **Stale data TTL**: Treat location as stale after 15 minutes, hide "nearby" indicator for stale users

### Nearby Users: GET /api/users/nearby

Find users near a location (requires location sharing enabled).

**Query parameters:**
- `lat` - Latitude center point
- `lng` - Longitude center point  
- `radiusKm` - Search radius in kilometers (default: 10)

```json
[
  {
    "id": 45,
    "username": "traveler_jane",
    "name": "Jane Doe",
    "profileImage": "https://...",
    "approximateDistance": "2.3 km",
    "lastLocationUpdate": "2024-01-15T14:30:00Z"
  }
]
```

**IMPORTANT:** 
- `approximateDistance` is a **display-only string** - do not parse to compute actual distance
- This endpoint only returns users where `locationSharingEnabled: true` and location is non-stale (< 15 minutes old)

---

### Connection Degrees: GET /api/connections/degree/:userId/:targetUserId

LinkedIn-style connection degrees for network visualization.

```json
{
  "degree": 2,
  "mutualCount": 5,
  "mutuals": [
    {
      "id": 45,
      "username": "traveler_jane",
      "name": "Jane Doe",
      "profileImage": "https://..."
    }
  ]
}
```

**Degree values:**
- `1` = Direct connection (1st degree)
- `2` = Friend of friend (2nd degree) - show "X mutual connections"
- `3` = 3rd degree connection
- `0` = No connection path found

**Which endpoint to use where (avoid redundant calls):**
- **Discovery grid** → Use `POST /api/connections/degrees/batch` (fast batch lookup for multiple users)
- **Profile screen** → Use `GET /api/connections/degree/:userId/:targetUserId` for badge + mutualCount
- **"See all mutuals" screen** → Use `GET /api/mutual-connections/:userId1/:userId2` for full list

---

### Mutual Connections: GET /api/mutual-connections/:userId1/:userId2

Get list of shared connections between two users (for "See all mutuals" screen).

```json
[
  {
    "id": 45,
    "username": "traveler_jane",
    "name": "Jane Doe",
    "profileImage": "https://...",
    "hometownCity": "Austin",
    "hometownCountry": "United States"
  }
]
```

---

### Batch Connection Degrees: POST /api/connections/degrees/batch

Efficient batch lookup for discovery screens (get degrees for multiple users at once).

**Request body:**
```json
{
  "userId": 2,
  "targetUserIds": [45, 67, 89, 123]
}
```

**Response:**
```json
{
  "45": { "degree": 2, "mutualCount": 3 },
  "67": { "degree": 1, "mutualCount": 0 },
  "89": { "degree": 3, "mutualCount": 0 },
  "123": { "degree": 0, "mutualCount": 0 }
}
```

---

### FINAL TAB STRUCTURE (use this exactly - this is the ONLY authoritative tab spec)

**Regular users:**
```
[ Home ] [ Events ] [ Chatrooms ] [ Messages ] [ Profile ]
```
- FAB: Create Event / Plan Trip / Quick Meetup
- Search is a modal/overlay launched from Home header (filter icon), NOT a bottom tab

**Business users:**
```
[ Dashboard ] [ Deals ] [ Messages ] [ Search ] [ Profile ]
```
- FAB: Create Deal / Flash Deal
- "Create Deal" and "Flash Deal" are FAB actions, NOT tabs

---

### React Native Auth Notes

**Cookie auth:**
RN fetch does not reliably persist cookies by default. Use `@react-native-cookies/cookies` and a single API wrapper that always includes `credentials: 'include'`.

**WebSocket auth:**
Do not assume cookies are automatically sent in the WS handshake. Always send the `{type:'auth', userId, sessionId}` message immediately after connect.

---

## EXPANSION MODULES (Build After Core Is Stable)

These features are lower priority. Build them ONLY after Phase 1 smoke test passes and core features work:

### Expansion 1: Itineraries (Trip Planning)
Day-by-day planning for travel plans.
- `GET /api/itineraries/travel-plan/:travelPlanId`
- `POST /api/itineraries`
- `POST /api/itineraries/:id/items`
- `PUT /api/itinerary-items/:id`
- `DELETE /api/itinerary-items/:id`

### Expansion 2: Secret Experiences (Hidden Gems)
Local insider tips for each city.
- `GET /api/secret-experiences/:city`
- `POST /api/secret-experiences/:experienceId/like`

### Expansion 3: External Event Imports
Third-party event integrations.
- `GET /api/external-events/ticketmaster?city=<city>`
- `GET /api/external-events/stubhub?city=<city>`
- `GET /api/external-events/meetup?city=<city>`
- `POST /api/events/import-url` (body: `{url}`)

### Expansion 4: Customer Photos
User-submitted photos for businesses.
- `GET /api/businesses/:businessId/customer-photos`
- `POST /api/businesses/:businessId/customer-photos`
- `DELETE /api/businesses/:businessId/customer-photos/:photoId`

### Expansion 5: City Activities Enhancement
AI-powered "Things to Do" suggestions.
- `GET /api/city-activities/:cityName`
- `POST /api/city-activities/:cityName/enhance`
- `GET /api/users/search-by-activity-name?activity=<name>`

### Expansion 6: Advanced Calendar Integration
Export events to Apple Calendar.
- Use Expo Calendar API
- Export .ics files
- Deep link back to app from calendar events

### Expansion 7: QR Code Sharing
Share profile/referral via QR.
- Generate QR codes client-side using referral code
- Scan QR to open deep link

---

## END OF PROMPT

This prompt is comprehensive and ready for building. If you encounter any endpoint not documented here, do NOT invent it - gracefully hide that feature and flag it for review.
