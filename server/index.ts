// Load env vars FIRST (before db and other imports that need them)
import dotenv from "dotenv";
dotenv.config();

// Initialize Sentry error monitoring
import "./instrument";
import * as Sentry from "@sentry/node";

import "express-async-errors";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { RedisStore } from "connect-redis";
import { Redis } from "ioredis";
import connectPg from "connect-pg-simple";
import pg from "pg";
// Vite imports are dynamic - only loaded in development to avoid production crash
// See: setupVite and serveStatic are dynamically imported below

// Simple log function (replaces vite.ts export for production compatibility)
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
import path from "path";
import fs from "fs";
import { db, checkDatabaseHealth, getDatabaseStatus } from "./db";
import {
  users,
  events,
  businessOffers,
  quickMeetups,
  quickDeals,
  travelPlans,
} from "../shared/schema";
import { TravelStatusService } from "./services/travel-status-service";
import {
  sql,
  eq,
  or,
  count,
  and,
  ne,
  desc,
  gte,
  lte,
  lt,
  isNotNull,
  inArray,
  asc,
  ilike,
  like,
  isNull,
  gt,
} from "drizzle-orm";
import cron from "node-cron";
import passwordResetRouter from "./routes/passwordReset";
import { registerRoutes } from "./routes";

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  console.error("Stack:", error.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  console.error(
    "Stack:",
    reason instanceof Error ? reason.stack : "No stack available",
  );
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM signal, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT signal, shutting down gracefully");
  process.exit(0);
});

// Debug environment variables
console.log("Environment check:", {
  BREVO_API_KEY:
    process.env.BREVO_API_KEY || (process.env as any).SENDINBLUE_API_KEY || (process.env as any).SIB_API_KEY
      ? "LOADED"
      : "NOT FOUND",
  BREVO_API_KEY_SOURCE: process.env.BREVO_API_KEY
    ? "BREVO_API_KEY"
    : (process.env as any).SENDINBLUE_API_KEY
      ? "SENDINBLUE_API_KEY"
      : (process.env as any).SIB_API_KEY
        ? "SIB_API_KEY"
        : "MISSING",
  NODE_ENV: process.env.NODE_ENV,
});

const app = express();
app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});
app.get("/api/sentry-test", (_req, res) => res.json({ ok: true }));

// Lightweight keep-alive ping — no DB, no auth, no middleware overhead.
// Frontend calls this every 5 min to prevent Render cold starts.
app.get("/api/ping", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ ok: true, ts: Date.now() });
});

// Trust reverse proxy (Replit/Render/Railway) so secure cookies & IPs work
app.set("trust proxy", 1);

// Performance monitoring middleware - log slow requests
const SLOW_REQUEST_THRESHOLD_MS = 2000;
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (duration > SLOW_REQUEST_THRESHOLD_MS && req.path.startsWith("/api")) {
      console.warn(
        `⚠️ SLOW REQUEST: ${req.method} ${req.path} took ${duration}ms`,
      );
    }
  });
  next();
});

// Request timeout for API routes - prevent hanging requests (e.g. Replit cold start / slow DB)
const API_REQUEST_TIMEOUT_MS = 60000; // 60 seconds
app.use("/api", (req, res, next) => {
  const timer = setTimeout(() => {
    if (res.headersSent) return;
    console.warn(`⚠️ REQUEST TIMEOUT: ${req.method} ${req.path} after ${API_REQUEST_TIMEOUT_MS}ms`);
    res.status(503).json({ message: "Request timed out. Please try again." });
    // Do not call req.destroy() - it can crash the server if the handler is still running
  }, API_REQUEST_TIMEOUT_MS);
  res.on("finish", () => clearTimeout(timer));
  next();
});

// Health check endpoint for monitoring
app.get("/api/health", async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    const dbStatus = getDatabaseStatus();

    const health = {
      status: dbHealth.healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      database: {
        ...dbHealth,
        ...dbStatus.poolStats,
      },
      uptime: process.uptime(),
    };

    res.status(dbHealth.healthy ? 200 : 503).json(health);
  } catch (error: any) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Force HTTPS redirect for production domain
app.use((req, res, next) => {
  if (
    req.header("x-forwarded-proto") !== "https" &&
    req.hostname === "nearbytraveler.org"
  ) {
    return res.redirect(301, `https://${req.hostname}${req.url}`);
  }
  next();
});


// Allow Expo/React Native app: origin can be null, exp://..., or localhost
const allowedOrigins = [
  "https://nearbytraveler.org",
  "https://nearbytraveler.onrender.com",
  "http://localhost:5000",
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        origin.includes("replit.dev") ||
        origin.includes("replit.app") ||
        origin.includes("repl.co") ||
        origin === "https://nearbytraveler.org" ||
        origin === "https://nearbytraveler.onrender.com" ||
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1")
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Client", "x-user-id", "x-user-data", "x-user-type"],
  }),
);

// REMOVED: Duplicate session middleware - using the one below with Redis support

// ===== CRITICAL API ROUTES - MUST BE FIRST TO BYPASS VITE =====
// Register these API routes BEFORE any other middleware to prevent Vite interception
console.log(
  "🚀 REGISTERING CRITICAL API ROUTES FIRST TO BYPASS VITE INTERCEPTION",
);

// REMOVED: This conflicted with the proper filtering endpoint in routes.ts
// The events endpoint is now handled in routes.ts with proper city filtering

// REMOVED: This conflicted with the proper filtering endpoint in routes.ts
// The business-deals endpoint is now handled in routes.ts with proper city filtering

// Password reset token verification now handled by server/routes/passwordReset.ts

// Notification preferences moved after session middleware — see below line 660+

app.get("/api/quick-meetups", async (req, res) => {
  try {
    const now = new Date();

    const meetupsQuery = await db
      .select({
        id: quickMeetups.id,
        organizerId: quickMeetups.organizerId,
        title: quickMeetups.title,
        description: quickMeetups.description,
        category: quickMeetups.category,
        location: quickMeetups.location,
        meetingPoint: quickMeetups.meetingPoint,
        street: quickMeetups.street,
        city: quickMeetups.city,
        state: quickMeetups.state,
        country: quickMeetups.country,
        zipcode: quickMeetups.zipcode,
        availableAt: quickMeetups.availableAt,
        expiresAt: quickMeetups.expiresAt,
        maxParticipants: quickMeetups.maxParticipants,
        minParticipants: quickMeetups.minParticipants,
        costEstimate: quickMeetups.costEstimate,
        availability: quickMeetups.availability,
        responseTime: quickMeetups.responseTime,
        autoCancel: quickMeetups.autoCancel,
        isActive: quickMeetups.isActive,
        participantCount: quickMeetups.participantCount,
        createdAt: quickMeetups.createdAt,
        // Include organizer data from users table
        organizerUsername: users.username,
        organizerName: users.name,
        organizerProfileImage: users.profileImage,
      })
      .from(quickMeetups)
      .leftJoin(users, eq(quickMeetups.organizerId, users.id))
      .where(
        and(gt(quickMeetups.expiresAt, now), eq(quickMeetups.isActive, true)),
      )
      .orderBy(desc(quickMeetups.createdAt));

    res.json(meetupsQuery);
  } catch (error: any) {
    console.error("🔥 Error in quick meetups API:", error);
    res.status(500).json({ error: "Failed to get quick meetups" });
  }
});

app.get("/api/businesses", async (req, res) => {
  try {
    const businessesQuery = await db
      .select({
        id: users.id,
        username: users.username,
        businessName: users.businessName,
        name: users.name,
        businessDescription: users.businessDescription,
        businessType: users.businessType,
        location: users.location,
        profileImage: users.profileImage,
        phoneNumber: users.phoneNumber,
        websiteUrl: users.websiteUrl,
        email: users.email,
        streetAddress: users.streetAddress,
        hometownCity: users.hometownCity,
        hometownState: users.hometownState,
        hometownCountry: users.hometownCountry,
      })
      .from(users)
      .where(eq(users.userType, "business"));

    res.json(businessesQuery);
  } catch (error: any) {
    console.error("🔥 Error in businesses API:", error);
    res.status(500).json({ error: "Failed to get businesses" });
  }
});

// REMOVED DUPLICATE /api/users ENDPOINT - using the filtered one in routes.ts instead

app.get("/api/quick-deals", async (req, res) => {
  try {

    // Import metro consolidation helpers
    const { isLAMetroCity, getMetroArea } = await import(
      "../shared/constants.js"
    );

    // Get all active quick deals that haven't expired
    const now = new Date();
    const activeDeals = await db
      .select({
        id: quickDeals.id,
        businessId: quickDeals.businessId,
        title: quickDeals.title,
        description: quickDeals.description,
        dealType: quickDeals.dealType,
        category: quickDeals.category,
        location: quickDeals.location,
        discountAmount: quickDeals.discountAmount,
        originalPrice: quickDeals.originalPrice,
        salePrice: quickDeals.salePrice,
        validFrom: quickDeals.validFrom,
        validUntil: quickDeals.validUntil,
        maxRedemptions: quickDeals.maxRedemptions,
        currentRedemptions: quickDeals.currentRedemptions,
        isActive: quickDeals.isActive,
        createdAt: quickDeals.createdAt,
      })
      .from(quickDeals)
      .where(and(eq(quickDeals.isActive, true), gt(quickDeals.validUntil, now)))
      .orderBy(desc(quickDeals.createdAt));

    // Add LA Metro tags to deals
    const dealsWithMetroInfo = activeDeals.map((deal) => {
      const dealLocation = deal.location || "";
      // Parse city from location string (e.g., "Playa del Rey, California" -> "Playa del Rey")
      const cityName = dealLocation.split(",")[0]?.trim() || dealLocation;
      const isInLAMetro = isLAMetroCity(cityName);
      const metroArea = getMetroArea(cityName);

      return {
        ...deal,
        city: cityName,
        state: "California",
        country: "United States",
        // Add metro tags for frontend filtering
        isLAMetro: isInLAMetro,
        metroArea: metroArea,
      };
    });

    res.json(dealsWithMetroInfo);
  } catch (error: any) {
    console.error("🔥 Error in quick deals API:", error);
    res.status(500).json({ error: "Failed to get quick deals" });
  }
});

// CRITICAL: users-by-location endpoint registered here (not in routes.ts) to avoid route registration timing issues
app.get("/api/users-by-location/:city/:userType", async (req, res) => {
  try {
    const { city, userType } = req.params;
    const searchCity = decodeURIComponent(city);

    const { getMetroCities, getMetroAreaName } = await import(
      "../shared/metro-areas"
    );

    // Inline getExpandedCityList logic
    let expandedCities: string[];
    const metroCities = getMetroCities(searchCity);
    if (metroCities.length > 0) {
      expandedCities = [...new Set([searchCity, ...metroCities])];
    } else {
      const metroName = getMetroAreaName(searchCity);
      if (metroName !== searchCity) {
        const allMetroCities = getMetroCities(metroName);
        expandedCities = [
          ...new Set([searchCity, metroName, ...allMetroCities]),
        ];
      } else {
        expandedCities = [searchCity];
      }
    }

    // 1) Locals by hometown (and current location as best-effort legacy signal)
    const localCityConditions = expandedCities.map((c) =>
      or(ilike(users.hometownCity, `%${c}%`), ilike(users.location, `%${c}%`)),
    );
    const localConditions: any[] = [or(...localCityConditions), eq(users.isActive, true)];
    if (userType && userType !== "all") localConditions.push(eq(users.userType, userType));
    const localResults = await db.select().from(users).where(and(...localConditions));

    // 2) Travelers with an upcoming/current travel plan to this city (destination signal)
    const travelCityConditions = expandedCities.map((c) =>
      or(ilike(travelPlans.destinationCity, `%${c}%`), ilike(travelPlans.destination, `%${c}%`)),
    );
    const now = new Date();
    const travelPlanRows = await db
      .select({ userId: travelPlans.userId })
      .from(travelPlans)
      .where(
        and(
          or(...travelCityConditions),
          // Only consider plans that haven't ended (or have no end date set)
          or(isNull(travelPlans.endDate), gte(travelPlans.endDate, now)),
          // Exclude explicit past plans when status is set
          or(isNull(travelPlans.status), ne(travelPlans.status, "past")),
        ),
      );
    const travelerUserIds = [...new Set(travelPlanRows.map((r) => r.userId).filter(Boolean))] as number[];

    const travelerResults =
      travelerUserIds.length > 0
        ? await db
            .select()
            .from(users)
            .where(
              and(
                inArray(users.id, travelerUserIds),
                eq(users.isActive, true),
                ...(userType && userType !== "all" ? [eq(users.userType, userType)] : []),
              ),
            )
        : [];

    const localIds = new Set(localResults.map((u: any) => u.id));
    const travelerIds = new Set(travelerResults.map((u: any) => u.id));

    // Merge results, locals first, then travelers not already included.
    const merged: any[] = [];
    for (const u of localResults as any[]) {
      const { password, ...rest } = u;
      const cityMatchType = travelerIds.has(u.id) ? "both" : "hometown";
      merged.push({ ...rest, cityMatchType });
    }
    for (const u of travelerResults as any[]) {
      if (localIds.has(u.id)) continue;
      const { password, ...rest } = u;
      merged.push({ ...rest, cityMatchType: "travel" });
    }

    res.json(merged);
  } catch (error: any) {
    console.error("Error in users-by-location endpoint:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch users by location",
        error: error.message,
      });
  }
});

console.log("✅ CRITICAL API ROUTES REGISTERED BEFORE OTHER MIDDLEWARE");

// Security headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
    frameguard: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    hsts: false,
  }),
);

// HSTS for production with custom domain
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }
  next();
});

// Global rate limits - increased for real-time app with WebSocket, chat, and frequent polling
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3000, // generous limit for real-time chat apps
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later" },
    // Trust proxy for proper IP detection
    validate: { xForwardedForHeader: false },
    skip: (req) => {
      // Skip rate limiting for important user actions
      if (req.method === "PUT" && req.path.includes("/users/")) return true;
      // Skip rate limiting for connection requests - social actions shouldn't be blocked
      if (req.method === "POST" && req.path === "/api/connections") return true;
      return false;
    },
  }),
);

// Configure session middleware with Redis for production
// CRITICAL: Sessions persist indefinitely with rolling renewal - users stay logged in forever unless they logout
let redis: Redis | null = null;

// Debug Redis URL configuration
console.log("🔴 Redis URL check:", {
  hasRedisUrl: !!process.env.REDIS_URL,
  urlPrefix: process.env.REDIS_URL?.substring(0, 10) + "...",
  nodeEnv: process.env.NODE_ENV,
});

if (process.env.REDIS_URL) {
  try {
    // Upstash Redis requires TLS - ioredis handles rediss:// URLs automatically
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      enableReadyCheck: true,
      connectTimeout: 10000,
    });

    console.log("🔴 Redis: Connecting to Redis for session storage...");
    redis.on("connect", () =>
      console.log(
        "✅ Redis: Connected successfully - sessions will persist across restarts",
      ),
    );
    redis.on("ready", () => console.log("✅ Redis: Ready to accept commands"));
    redis.on("error", (err) =>
      console.error("❌ Redis connection error:", err.message),
    );
    redis.on("close", () => console.log("🔴 Redis: Connection closed"));
  } catch (err: any) {
    console.error("❌ Redis: Failed to initialize:", err.message);
    redis = null;
  }
} else {
  console.log(
    "⚠️ Redis: No REDIS_URL configured - will use PostgreSQL session store",
  );
}

// Detect if we're in production - check multiple indicators
// This MUST match the logout routes detection to ensure cookie secure flags match
const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.REPL_SLUG !== undefined ||
  process.env.REPLIT_DEV_DOMAIN !== undefined;

// Debug session config
console.log("🍪 Session config:", {
  isProduction,
  nodeEnv: process.env.NODE_ENV,
  replSlug: process.env.REPL_SLUG ? "set" : "unset",
  hasRedis: !!redis,
  cookieSecure: isProduction,
});

// Trust proxy for secure cookies behind Render's reverse proxy / load balancer
// Also trust proxy on Replit since it uses HTTPS
if (isProduction) {
  app.set("trust proxy", 1);
  console.log("🔒 Trust proxy enabled for production/Replit");
}

// connect-redis expects a node-redis style client where SET supports an options object
// like { EX: seconds }. ioredis expects "EX", seconds positional args.
// Without this adapter, the options object can be passed through as "[object Object]"
// and Redis returns "ERR syntax error" during session saves.
const redisSessionClient = redis
  ? ({
      get: (key: string) => redis.get(key),
      set: (key: string, value: string, opts?: any) => {
        if (opts && typeof opts === "object") {
          if (typeof opts.EX === "number") return (redis as any).set(key, value, "EX", opts.EX);
          if (typeof opts.PX === "number") return (redis as any).set(key, value, "PX", opts.PX);
        }
        return (redis as any).set(key, value);
      },
      del: (key: string) => (redis as any).del(key),
      expire: (key: string, seconds: number) => (redis as any).expire(key, seconds),
    } as any)
  : null;

// Session store: Redis (if available) → PostgreSQL (persistent across deploys) → Memory (dev only)
const sessionStore = (() => {
  if (redis) {
    console.log("🗄️ Session store: Redis");
    return new RedisStore({ client: redisSessionClient, ttl: 365 * 24 * 60 * 60 });
  }
  const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (dbUrl) {
    console.log("🗄️ Session store: PostgreSQL (persistent across deploys)");
    const PgStore = connectPg(session);
    // IMPORTANT: Use standard pg.Pool (NOT @neondatabase/serverless Pool).
    // connect-pg-simple requires the native pg module's Pool interface.
    // The Neon serverless Pool from db.ts is WebSocket-based and incompatible.
    const sessionPool = new pg.Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
    sessionPool.on("error", (err: any) => console.error("🔴 Session pool error:", err.message));
    // Verify connectivity at startup so silent failures are caught immediately
    sessionPool.query("SELECT 1").then(() => {
      console.log("✅ Session store PostgreSQL connection verified");
    }).catch((err: any) => {
      console.error("🔴 Session store PostgreSQL connection FAILED:", err.message);
    });
    const store = new PgStore({
      pool: sessionPool,
      tableName: "session",
      createTableIfMissing: true,
      ttl: 30 * 24 * 60 * 60, // 30 days in seconds
      pruneSessionInterval: 60 * 15, // prune expired sessions every 15 minutes
    });
    return store;
  }
  console.log("⚠️ Session store: Memory (sessions lost on restart)");
  return undefined;
})();

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "nearby-traveler-secret-key-dev",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "lax" as const,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    },
    name: "nt.sid",
  }),
);

// Security hardening: never accept header-based identity without a real session user.
// This prevents stale client storage (incl. incognito) from implicitly authenticating API calls.
app.use((req, _res, next) => {
  try {
    const hasSessionUser = !!(req as any)?.session?.user?.id;
    if (!hasSessionUser) {
      delete (req.headers as any)["x-user-id"];
      delete (req.headers as any)["x-user-data"];
      delete (req.headers as any)["x-user-type"];
    }
  } catch {
    // ignore
  }
  next();
});

// Stripe webhook needs raw body for signature verification — capture BEFORE json parser
app.use((req: any, res: any, next: any) => {
  if (req.path === '/api/stripe/support/webhook') {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => { data += chunk; });
    req.on('end', () => { req.rawBody = data; next(); });
  } else {
    next();
  }
});

// JSON body limit — images are resized client-side to ~300KB; video uses multer with its own 50MB limit
app.use(express.json({ limit: "10mb" }));
app.use(
  express.urlencoded({ extended: true, limit: "10mb", parameterLimit: 100000 }),
);

// Capture client-side crashes so we can debug "Something went wrong" production screens.
// This is intentionally lightweight and safe: it must never throw.
app.post("/api/client-error", (req, res) => {
  try {
    const payload = req.body ?? {};
    console.error("🧯 CLIENT ERROR REPORT:", {
      message: payload?.message,
      name: payload?.name,
      stack: payload?.stack,
      componentStack: payload?.componentStack,
      url: payload?.url,
      userAgent: payload?.userAgent,
      time: payload?.time,
    });
    try {
      Sentry.captureMessage("ClientErrorBoundary", {
        level: "error",
        extra: payload,
      });
    } catch {
      // ignore sentry errors
    }
  } catch (e) {
    console.error("🧯 CLIENT ERROR REPORT FAILED:", e);
  }
  // Always respond successfully so the ErrorBoundary doesn't cascade.
  res.status(204).end();
});

// Notification preferences — after session middleware so req.session.user is available
app.get("/api/notifications/preferences", async (req: any, res: any) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) return res.status(401).json({ error: "Not authenticated" });
    const [row] = await db.select({ prefs: users.notificationPreferences }).from(users).where(eq(users.id, sessionUser.id)).limit(1);
    const defaults = { messages: true, meet_requests: true, connections: true, events: true, vouches: true };
    try {
      const parsed = row?.prefs ? JSON.parse(row.prefs) : {};
      return res.json({ ...defaults, ...parsed });
    } catch {
      return res.json(defaults);
    }
  } catch (e: any) {
    console.error("[notification-prefs] get error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/notifications/preferences", async (req: any, res: any) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) return res.status(401).json({ error: "Not authenticated" });
    const { messages, meet_requests, connections, events, vouches } = req.body;
    const prefs = { messages: !!messages, meet_requests: !!meet_requests, connections: !!connections, events: !!events, vouches: !!vouches };
    await db.update(users).set({ notificationPreferences: JSON.stringify(prefs) }).where(eq(users.id, sessionUser.id));
    return res.json({ ok: true, prefs });
  } catch (e: any) {
    console.error("[notification-prefs] put error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/notifications/onesignal-player", async (req: any, res: any) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) return res.status(401).json({ error: "Not authenticated" });
    const { playerId } = req.body;
    if (!playerId || typeof playerId !== 'string') return res.status(400).json({ error: "playerId required" });
    await db.update(users).set({ onesignalPlayerId: playerId }).where(eq(users.id, sessionUser.id));
    return res.json({ ok: true });
  } catch (e: any) {
    console.error("[onesignal] register player error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// Password reset routes (Brevo email)
app.use("/api/auth", passwordResetRouter);

// Serve static files from public directories FIRST (for logo)
app.use(express.static(path.join(process.cwd(), "public")));
app.use(express.static(path.join(process.cwd(), "client", "public")));

// Serve attached assets with aggressive no-cache headers
// NOTE: Using /user-assets instead of /assets to avoid conflict with Vite's /assets path
app.use(
  "/user-assets",
  (req, res, next) => {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  },
  express.static(path.join(process.cwd(), "attached_assets")),
);

app.use(
  "/attached_assets",
  (req, res, next) => {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  },
  express.static(path.join(process.cwd(), "attached_assets")),
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log("Starting server initialization...");

  // Create basic HTTP server first
  const { createServer } = await import("http");
  const server = createServer(app);

  // Add basic test route
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  console.log("Basic routes added, starting lazy route registration...");

  // Register minimal routes for startup (bypassing complex storage dependencies)
  console.log("Loading minimal routes for startup...");
  const httpServerWithWebSocket = server;

  // Add essential health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Add basic auth test route
  app.get("/api/test", (req, res) => {
    res.json({
      message: "Server is running",
      timestamp: new Date().toISOString(),
    });
  });

  // EMERGENCY: Email test endpoint to debug email delivery
  app.post("/api/debug-email", async (req, res) => {
    try {
      console.log("🔍 EMAIL DEBUG: Testing email delivery...");
      const { emailService } = await import("./services/emailService.js");

      // Test with a simple reset email
      const testResult = await emailService.sendForgotPasswordEmail(
        "test@example.com",
        {
          name: "Test User",
          resetUrl: "https://example.com/reset?token=test123",
          expiryHours: 1,
        },
      );

      console.log("📧 Email test result:", testResult);

      res.json({
        success: testResult,
        message: testResult
          ? "Test email sent successfully"
          : "Email failed to send",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("🔥 Email test error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack,
      });
    }
  });

  // Add quick login fix (temporarily disabled during deployment debugging)
  console.log("Quick login fix temporarily disabled for deployment stability");

  console.log("Minimal routes registered successfully");

  // Safe schema migrations - ensure production DB has all needed columns/tables
  try {
    await db.execute(
      sql`ALTER TABLE meetup_chatrooms ADD COLUMN IF NOT EXISTS available_now_id INTEGER REFERENCES available_now(id)`,
    );
    await db.execute(
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_role TEXT`,
    );
    // Connector program: status, activity window, admin override
    await db.execute(sql`ALTER TABLE available_now_requests ADD COLUMN IF NOT EXISTS chatroom_id INTEGER`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS connector_status TEXT`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS connector_enrolled_at TIMESTAMP`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS connector_last_earned_at TIMESTAMP`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS connector_period_start_at TIMESTAMP`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS connector_points_in_period INTEGER DEFAULT 0`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS connector_status_set_by_admin BOOLEAN DEFAULT false`);
    // Notification preferences column
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences TEXT DEFAULT '{"messages":true,"meet_requests":true,"connections":true,"events":true,"vouches":true}'`);
    // Stealth mode: hidden_from_users table for "hide from this person" feature
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS hidden_from_users (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        hidden_from_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        UNIQUE(user_id, hidden_from_id)
      )
    `);
    // Backfill firstName from name for existing users who never set it
    await db.execute(sql`UPDATE users SET first_name = split_part(name, ' ', 1) WHERE first_name IS NULL AND name IS NOT NULL AND name != ''`);
    // Connector referral chain table for 5% override bonus
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS connector_referral_chains (
        id SERIAL PRIMARY KEY,
        referrer_id INTEGER NOT NULL REFERENCES users(id),
        referred_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(referrer_id, referred_id)
      )
    `);
    // Event co-connector table (up to 3 co-connectors per event, points split evenly)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS event_cohost_splits (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL,
        organizer_id INTEGER NOT NULL,
        cohost_id INTEGER NOT NULL,
        organizer_split INTEGER NOT NULL DEFAULT 0,
        cohost_split INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'confirmed',
        points_awarded BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        confirmed_at TIMESTAMP
      )
    `);
    // Drop the old unique constraint if it exists (allows multiple co-hosts per event)
    await db.execute(sql`
      ALTER TABLE event_cohost_splits DROP CONSTRAINT IF EXISTS event_cohost_splits_event_id_key
    `).catch(() => {});
    console.log("✅ Schema migration check complete");
  } catch (migrationError) {
    console.log(
      "⚠️ Schema migration skipped:",
      (migrationError as any)?.message,
    );
  }

  // CRITICAL: Register all main API routes BEFORE Vite setup
  try {
    console.log("Registering main API routes from routes.ts...");
    const registeredServer = await registerRoutes(app, httpServerWithWebSocket);
    console.log("✅ Main API routes registered successfully");

    // Add explicit API route verification
    app.get("/api/debug-routes", (req, res) => {
      res.json({
        message: "API routes are working properly",
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
      });
    });

    // ===== CRITICAL VITE WORKAROUND ROUTES =====
    // These routes MUST be defined here before any other middleware to bypass Vite interception
    console.log(
      "🚀 REGISTERING CRITICAL API ROUTES TO BYPASS VITE INTERCEPTION",
    );

    // REMOVED: Stub search endpoint - using the proper implementation in routes.ts

    // Note: Critical API routes already registered at the top of the middleware chain
  } catch (error) {
    console.error("❌ CRITICAL: Failed to register main API routes:", error);
    console.log("The server will continue with basic functionality only");
    // Don't exit to keep basic server running
  }

  // ─── Server-side OG meta injection for event pages ───────────────────────
  // WhatsApp / iMessage / Twitter crawlers don't execute JS, so meta tags must
  // be rendered server-side. We intercept /events/:id before any wildcard
  // handler and serve index.html with event-specific OG tags injected.
  function escapeHtml(str: string): string {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  app.get("/events/:id", async (req: Request, res: Response, next: NextFunction) => {
    // Only intercept HTML navigation requests (browsers & crawlers)
    const accept = String(req.headers.accept || "");
    if (!accept.includes("text/html")) return next();

    const eventId = parseInt(req.params.id || "0", 10);
    if (!eventId || isNaN(eventId)) return next();

    try {
      // Fetch event and organizer from DB
      const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
      if (!event) return next();

      const [organizer] = await db.select().from(users).where(eq(users.id, event.organizerId)).limit(1);
      const hostName = (organizer as any)?.firstName || (organizer as any)?.username || "The host";

      // Format date/time
      const eventDateObj = new Date(event.date);
      const dateStr = eventDateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const timeStr = eventDateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

      const ogTitle = `${event.title} | Nearby Traveler`;
      const ogDesc = `Join ${hostName} for ${event.title} in ${event.city} on ${dateStr} at ${timeStr}`;
      const ogImage = (event.imageUrl && event.imageUrl.trim())
        ? event.imageUrl
        : "https://nearbytraveler.org/og-image.png";
      const ogUrl = `https://nearbytraveler.org/events/${eventId}`;

      // Determine index.html path (prod vs dev)
      const isReplitDep = process.env.REPL_ID && process.env.REPLIT_DEPLOYMENT;
      const isProd = process.env.NODE_ENV === "production";
      const htmlPath = (isReplitDep || isProd)
        ? path.resolve(process.cwd(), "dist", "public", "index.html")
        : path.resolve(process.cwd(), "client", "index.html");

      let template = await fs.promises.readFile(htmlPath, "utf-8");

      // Replace static OG/Twitter meta tags with event-specific values
      template = template
        .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(ogTitle)}</title>`)
        .replace(/<meta property="og:title"[^>]*\/?>/, `<meta property="og:title" content="${escapeHtml(ogTitle)}" />`)
        .replace(/<meta property="og:description"[^>]*\/?>/, `<meta property="og:description" content="${escapeHtml(ogDesc)}" />`)
        .replace(/<meta property="og:image"[^>]*\/?>/, `<meta property="og:image" content="${escapeHtml(ogImage)}" />`)
        .replace(/<meta name="twitter:title"[^>]*\/?>/, `<meta name="twitter:title" content="${escapeHtml(ogTitle)}" />`)
        .replace(/<meta name="twitter:description"[^>]*\/?>/, `<meta name="twitter:description" content="${escapeHtml(ogDesc)}" />`)
        .replace(/<meta name="twitter:image"[^>]*\/?>/, `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`);

      // Inject og:url + og:type + twitter:card (summary_large_image) before </head>
      const extraMeta = [
        `  <meta property="og:url" content="${escapeHtml(ogUrl)}" />`,
        `  <meta property="og:type" content="website" />`,
        `  <meta name="twitter:card" content="summary_large_image" />`,
      ].join("\n");
      template = template.replace("</head>", `${extraMeta}\n  </head>`);

      res.status(200).set("Content-Type", "text/html").end(template);
    } catch (e) {
      console.error("OG meta injection error for event", eventId, e);
      return next();
    }
  });
  // ─────────────────────────────────────────────────────────────────────────

  // Setup vite after ALL routes are registered
  // CRITICAL FIX v3: Custom deployment setup that preserves API routes
  const isReplitDeployment =
    process.env.REPL_ID && process.env.REPLIT_DEPLOYMENT;
  const isProduction = process.env.NODE_ENV === "production";

  if (isReplitDeployment || isProduction) {
    console.log(
      "🚀 DEPLOYMENT FIX v3: Custom deployment setup preserving API routes...",
    );

    // Custom static serving that ONLY serves index.html for non-API routes
    const distPath = path.resolve(process.cwd(), "dist", "public");
    console.log("📦 Static path:", distPath);

    // Serve static assets but NOT index.html (which would override API routes)
    app.use(express.static(distPath, { index: false }));

    // Only serve index.html for frontend routes, preserving all API routes
    app.use("*", (req, res, next) => {
      // Preserve ALL API routes - never serve index.html for them
      if (req.originalUrl.startsWith("/api/")) {
        console.log("🔄 API route preserved:", req.originalUrl);
        return next(); // Let API routes handle themselves
      }

      // Server-side protection for authenticated SPA routes:
      // If there is no valid session user, redirect HTML navigations to "/"
      // (prevents protected pages from rendering before auth is confirmed).
      try {
        const accept = String(req.headers.accept || "");
        const isHtmlNav = req.method === "GET" && accept.includes("text/html");
        if (isHtmlNav) {
          const rawPath = (req.path || "/").split("?")[0];
          const normalized = (rawPath.replace(/\/+$/, "") || "/") as string;

          const PUBLIC_MARKETING_ROUTES = new Set([
            "/landing",
            "/landing-new",
            "/landing-simple",
            "/landing-minimal",
            "/landing-streamlined",
            "/landing-1",
            "/landing-2",
            "/events-landing",
            "/business-landing",
            "/locals-landing",
            "/travelers-landing",
            "/couchsurfing",
            "/cs",
            "/b",
            "/privacy",
            "/terms",
            "/cookies",
            "/about",
            "/connector",
            "/connector-program",
            "/getting-started",
            "/welcome",
            "/welcome-business",
            "/finishing-setup",
            "/quick-login",
            "/preview-landing",
            "/preview-first-landing",
            "/travel-quiz",
            "/TravelIntentQuiz",
            "/business-card",
            "/qr-code",
            "/launching-soon",
            "/join",
          ]);

          const isPublic =
            normalized === "/" ||
            normalized === "/auth" ||
            normalized === "/signin" ||
            normalized === "/signup" ||
            normalized.startsWith("/signup/") ||
            normalized === "/forgot-password" ||
            normalized === "/reset-password" ||
            normalized.startsWith("/landing") ||
            PUBLIC_MARKETING_ROUTES.has(normalized) ||
            normalized.startsWith("/invite/") ||
            normalized.startsWith("/join-trip/") ||
            (normalized.startsWith("/events/") && !!normalized.split("/")[2]);

          const hasSessionUser = !!(req as any)?.session?.user?.id;
          if (!hasSessionUser && !isPublic) {
            return res.redirect(302, "/");
          }
        }
      } catch {
        // ignore and fall through to SPA
      }

      // Serve index.html only for frontend routes
      console.log("📄 Serving frontend for:", req.originalUrl);
      res.sendFile(path.resolve(distPath, "index.html"), (err) => {
        if (err) {
          console.error("❌ Failed to serve index.html:", err);
          res.status(404).send("Frontend not found");
        }
      });
    });

    console.log(
      "✅ DEPLOYMENT FIX v3: Custom setup complete - API routes preserved",
    );
  } else {
    console.log("🔧 Development: Setting up Vite development server...");

    // CRITICAL: Catch-all for unhandled API routes before Vite intercepts them
    // This prevents Vite's wildcard handler from serving index.html for API requests
    app.use("/api", (req, res) => {
      console.log("⚠️ Unhandled API route:", req.method, req.originalUrl);
      res.status(404).json({
        message: "API endpoint not found",
        path: req.originalUrl,
        method: req.method,
      });
    });
    try {
      // Dynamic import of Vite - only loaded in development
      const { setupVite, serveStatic } = await import("./vite");
      await setupVite(app, server);
      console.log("✅ Vite development setup successful");
    } catch (viteError) {
      console.error(
        "⚠️ Vite setup failed, falling back to static serving:",
        viteError,
      );
      const { serveStatic } = await import("./vite");
      serveStatic(app);
    }
  }

  // Add error handler AFTER all routes and Vite setup (critical placement)
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = status === 500 ? "Internal Server Error" : err.message;

    // Enhanced mobile error logging
    console.error("🔴 REQUEST ERROR:", {
      status,
      message,
      path: req.path,
      method: req.method,
      userAgent: req.headers["user-agent"],
      origin: req.headers.origin,
      stack: err.stack,
    });

    res.status(status).json({ message, path: req.path });
    // DO NOT throw here - this prevents process crashes
  });

  const port = parseInt(process.env.PORT || "3000", 10);

  // Add server error handling
  httpServerWithWebSocket.on("error", (error: any) => {
    console.error("Server error:", error);
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use. Will retry or wait for port to free up.`,
      );
    } else {
      console.error("Server error (non-fatal):", error.message);
    }
  });

  httpServerWithWebSocket.listen(
    {
      port,
      host: "0.0.0.0",
    },
    async () => {
      try {
        log(`serving on port ${port}`);
        console.log(`🚀 Server successfully started on http://0.0.0.0:${port}`);

        // Travel status: only run hourly. Skip on startup so new users and first requests aren't slowed by a big batch (up to 100 users with travel data).
        const TRAVEL_STATUS_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour
        setInterval(async () => {
          console.log("🔄 Running scheduled travel status check...");
          try {
            await TravelStatusService.updateAllUserTravelStatuses();
            console.log("✅ Scheduled travel status check completed");
          } catch (error) {
            console.error("⚠️ Scheduled travel status check failed:", error);
          }

          // Saved traveler arrivals — piggyback on hourly cadence
          try {
            const { checkSavedTravelerArrivals } = await import("./services/savedTravelerArrivalService");
            await checkSavedTravelerArrivals();
          } catch (error) {
            console.error("⚠️ Saved traveler arrival check failed:", error);
          }
        }, TRAVEL_STATUS_CHECK_INTERVAL);

        // Connector status: run on the 1st of every month at midnight (server local time).
        // Skips users with connectorStatusSetByAdmin = true.
        cron.schedule("0 0 1 * *", async () => {
          console.log("🔄 [cron] Running monthly connector status check...");
          try {
            const { recomputeAllConnectorStatuses } = await import("./services/connectorStatus");
            const result = await recomputeAllConnectorStatuses();
            console.log(
              `✅ [cron] Connector status check complete: ${result.checked} connectors checked, ${result.statusChanges} status change(s) made.`
            );
          } catch (error) {
            console.error("⚠️ [cron] Connector status check failed:", error);
          }
        });

        // Daily beta-tester user seeding: 5-10 fake users per day at 00:00 UTC.
        // Mirrors the real signup flow (storage.createUser + chatroom helpers).
        // Seeded users are identifiable by email pattern testuser+*@nearbytraveler.org
        // and bio prefix "[Beta Tester]".
        cron.schedule("0 0 * * *", async () => {
          console.log("🌱 [cron] Running daily beta-tester user seeding...");
          try {
            const { seedDailyUsers } = await import("../scripts/seed-daily-users");
            await seedDailyUsers();
          } catch (error) {
            console.error("⚠️ [cron] Daily user seeding failed:", error);
          }
        }, { timezone: "UTC" });

        // Event reminders: run every 30 minutes. Sends 24h and 1h-before emails, each only once per user per event.
        const EVENT_REMINDER_INTERVAL = 30 * 60 * 1000;
        setInterval(async () => {
          try {
            const { eventReminderService } = await import("./services/eventReminderService");
            await eventReminderService.sendUpcomingEventReminders();
          } catch (error) {
            console.error("⚠️ Event reminder check failed:", error);
          }
        }, EVENT_REMINDER_INTERVAL);

        // Expired chat cleanup: run every 6 hours. Hard-deletes QUICK MEETUP chatrooms only
        // (those with a meetupId and no eventId) that expired more than 24 hours ago.
        // Event chatrooms (those with an eventId) are NEVER deleted — their message history
        // must persist permanently so users can always view past event conversations.
        const runExpiredChatCleanup = async () => {
          try {
            const { db } = await import("./db");
            const { meetupChatrooms, meetupChatroomMessages, chatroomMembers, quickMeetups, quickMeetupParticipants } = await import("../shared/schema");
            const { lt, inArray, isNull, and, sql } = await import("drizzle-orm");
            const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

            // Only delete quick-meetup chatrooms — EXCLUDE any row with an eventId
            const expiredChatrooms = await db
              .select({ id: meetupChatrooms.id })
              .from(meetupChatrooms)
              .where(and(
                lt(meetupChatrooms.expiresAt, cutoff),
                isNull(meetupChatrooms.eventId)   // never touch event chatrooms
              ));
            if (expiredChatrooms.length > 0) {
              const ids = expiredChatrooms.map((r: { id: number }) => r.id);
              // Cascade: messages → members → chatrooms
              await db.delete(meetupChatroomMessages).where(inArray(meetupChatroomMessages.meetupChatroomId, ids)).catch(() => {});
              await db.delete(chatroomMembers).where(inArray(chatroomMembers.chatroomId, ids)).catch(() => {});
              await db.delete(meetupChatrooms).where(inArray(meetupChatrooms.id, ids));
              console.log(`🧹 Deleted ${ids.length} expired quick-meetup chatroom(s) and their messages`);
            }

            // Mark expired Available Now sessions as inactive
            try {
              await db.execute(sql`UPDATE available_now SET is_available = false WHERE is_available = true AND expires_at < NOW()`);
            } catch { /* ignore */ }

            // Deactivate chatrooms for ended Available Now sessions
            try {
              await db.execute(sql`
                UPDATE meetup_chatrooms SET is_active = false
                WHERE is_active = true
                  AND available_now_id IS NOT NULL
                  AND available_now_id IN (
                    SELECT id FROM available_now WHERE is_available = false OR expires_at < NOW()
                  )
              `);
            } catch { /* ignore */ }

            // Find expired quick meetup IDs
            const expiredMeetups = await db
              .select({ id: quickMeetups.id })
              .from(quickMeetups)
              .where(lt(quickMeetups.expiresAt, cutoff));
            if (expiredMeetups.length > 0) {
              const ids = expiredMeetups.map((r: { id: number }) => r.id);
              await db.delete(quickMeetupParticipants).where(inArray(quickMeetupParticipants.meetupId, ids));
              await db.delete(quickMeetups).where(inArray(quickMeetups.id, ids));
              console.log(`🧹 Deleted ${ids.length} expired quick meetup(s) and their participants`);
            }
          } catch (error) {
            console.error("⚠️ Expired chat cleanup failed:", error);
          }
        };
        // Run once shortly after startup to clean any backlog, then every 6 hours
        setTimeout(runExpiredChatCleanup, 5 * 60 * 1000);
        setInterval(runExpiredChatCleanup, 6 * 60 * 60 * 1000);

        console.log("✅ Server started (travel status hourly, connector status monthly on 1st at midnight, event reminders every 30 min, expired chat cleanup every 6h)");
      } catch (error) {
        console.error("❌ Failed to initialize server services:", error);
        console.error(
          "Stack:",
          error instanceof Error ? error.stack : "No stack available",
        );
        // Don't exit on service failure, let the server continue to run
      }
    },
  );
})();
