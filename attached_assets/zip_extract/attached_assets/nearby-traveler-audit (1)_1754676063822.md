# Nearby Traveler – Deployment Risk Audit

## Project Facts
- Entries scanned: 354 code files
- Dependencies: 89 prod, 22 dev
- Detected Express: True, Socket.io: False, ws: True
- Helmet: False, Rate limiting: True, CORS: False, Multer: False, Stripe: True

## HIGH Risks
### Missing .env.example
No `.env.example` found. Detected 17 env vars in code. Provide sample values to avoid boot failures on deploy.
Vars:
ALLEVENTS_API_KEY
ANTHROPIC_API_KEY
BUSINESS_MONTHLY_PRICE_CENTS
DATABASE_URL
EVENTBRITE_API_KEY
EVENTBRITE_API_TOKEN
MEETUP_API_TOKEN
NODE_ENV
NODE_TLS_REJECT_UNAUTHORIZED
OPENAI_API_KEY
PERPLEXITY_API_KEY
PREDICTHQ_API_TOKEN
REPL_ID
SENDGRID_API_KEY
SESSION_SECRET
TICKETMASTER_API_KEY
WEATHER_API_KEY

### Client-side secret leakage risk
Client code references server-only env vars (must be prefixed `VITE_` for Vite or moved to server). Examples:
- NODE_ENV in client/src/lib/queryClient.ts
- NODE_ENV in client/src/pages/home.tsx

### Missing baseline security middleware
Server detected without helmet(), CORS. Add these to reduce common attack surface.

### No Drizzle migrations detected
Drizzle config present but no migrations found. Ensure migrations are generated and applied in CI/CD.


## MEDIUM Risks
### Network requests without timeout/retry
Found ~217 raw `fetch(` calls. Wrap with timeout + retry/backoff to avoid hangs.

### dangerouslySetInnerHTML usage
Found 2 uses. Ensure inputs are sanitized to prevent XSS.

### WebSocket lifecycle
Verify heartbeat/ping intervals, backpressure handling, and cleanup on disconnect to prevent memory leaks.

### Stripe secrets & webhook
Ensure server-only usage of secret key, webhook signature verification, idempotency keys on writes, and test mode separation.


## LOW Risks
### Express routes (sample)
Check try/catch or centralized error handler on all routes. Sample:
- POST /api/signup/travel-agent (server/routes-travel-agent.ts)
- GET /api/travel-agent-profile/:username (server/routes-travel-agent.ts)
- GET /api/travel-agent-trips-public/:username (server/routes-travel-agent.ts)
- GET /api/health (server/index.ts)
- GET env (server/index.ts)
- GET /api/weather (server/routes.ts)
- GET /api/city-stats (server/routes.ts)
- GET /api/city-stats/:city (server/routes.ts)
- GET /api/secret-experiences/:city/ (server/routes.ts)
- POST /api/secret-experiences/:experienceId/like (server/routes.ts)
- GET /api/stats/platform (server/routes.ts)
- GET /api/users-by-location/:city/:userType (server/routes.ts)
- GET /api/city/:city/users (server/routes.ts)
- GET /api/users/search-by-location (server/routes.ts)
- POST /api/admin/init-data (server/routes.ts)
- POST /api/admin/consolidate-nyc (server/routes.ts)
- POST /api/admin/consolidate-la (server/routes.ts)
- POST /api/login (server/routes.ts)
- POST /api/auth/check-email (server/routes.ts)
- POST /api/quick-login/:userId (server/routes.ts)
- POST /api/user/add-interest (server/routes.ts)
- GET /api/check-username/:username (server/routes.ts)
- POST /api/auth/check-username (server/routes.ts)
- POST /api/register (server/routes.ts)
- POST /api/auth/register (server/routes.ts)
- GET /api/users/:id (server/routes.ts)
- PUT /api/users/:id (server/routes.ts)
- PUT /api/users/:id/profile-photo (server/routes.ts)
- DELETE /api/users/profile-photo (server/routes.ts)
- POST /api/users/:id/cover-photo (server/routes.ts)
- PUT /api/users/:id/cover-photo (server/routes.ts)
- GET /api/users (server/routes.ts)
- GET /api/travel-plans/:userId (server/routes.ts)
- GET /api/travel-plans-with-itineraries/:userId (server/routes.ts)
- GET /api/travel-plans/:id/itineraries (server/routes.ts)
- POST /api/travel-plans (server/routes.ts)
- GET /api/travel-plans/single/:id (server/routes.ts)
- PUT /api/travel-plans/:id (server/routes.ts)
- GET /api/conversations/:userId (server/routes.ts)
- GET /api/connections/status/:userId/:targetUserId (server/routes.ts)
… (truncated)


## Suggested .env.example
```
ALLEVENTS_API_KEY=
ANTHROPIC_API_KEY=
BUSINESS_MONTHLY_PRICE_CENTS=
DATABASE_URL=
EVENTBRITE_API_KEY=
EVENTBRITE_API_TOKEN=
MEETUP_API_TOKEN=
NODE_ENV=
NODE_TLS_REJECT_UNAUTHORIZED=
OPENAI_API_KEY=
PERPLEXITY_API_KEY=
PREDICTHQ_API_TOKEN=
REPL_ID=
SENDGRID_API_KEY=
SESSION_SECRET=
TICKETMASTER_API_KEY=
WEATHER_API_KEY=
```