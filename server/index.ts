import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { RedisStore } from "connect-redis";
import { Redis } from "ioredis";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import dotenv from "dotenv";
import { db } from "./db";
import { users, events, businessOffers, quickMeetups, quickDeals } from "../shared/schema";
import { sql, eq, or, count, and, ne, desc, gte, lte, lt, isNotNull, inArray, asc, ilike, like, isNull, gt } from "drizzle-orm";

// Load environment variables
dotenv.config();

// Add global error handlers to prevent silent failures
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Stack:', reason instanceof Error ? reason.stack : 'No stack available');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT signal, shutting down gracefully');
  process.exit(0);
});

// Debug environment variables
console.log('Environment check:', {
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'LOADED' : 'NOT FOUND',
  NODE_ENV: process.env.NODE_ENV
});

const app = express();

// Trust reverse proxy (Replit/Render/Railway) so secure cookies & IPs work
app.set("trust proxy", 1);

// CORS: simplified for development and production
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Origin:", req.headers.origin);
  }
  next();
});

app.use(cors({
  origin: true, // Allow all origins for now to fix blank page issue
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

// ===== CRITICAL API ROUTES - MUST BE FIRST TO BYPASS VITE =====
// Register these API routes BEFORE any other middleware to prevent Vite interception
console.log('🚀 REGISTERING CRITICAL API ROUTES FIRST TO BYPASS VITE INTERCEPTION');

app.get('/api/events', async (req, res) => {
  try {
    console.log('📅 DIRECT API: Fetching events');
    const now = new Date();
    const sixWeeksFromNow = new Date(now.getTime() + (42 * 24 * 60 * 60 * 1000));
    
    const eventsQuery = await db.select().from(events)
      .where(and(
        gte(events.date, now),
        lte(events.date, sixWeeksFromNow)
      ))
      .orderBy(asc(events.date));
    
    res.json(eventsQuery);
  } catch (error: any) {
    console.error('🔥 Error in events API:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

app.get('/api/business-deals', async (req, res) => {
  try {
    console.log('💰 DIRECT API: Fetching business deals');
    
    // Import metro consolidation helpers
    const { isLAMetroCity, getMetroArea } = await import('../shared/constants.ts');
    
    // First get the business offers
    const offers = await db.select()
      .from(businessOffers)
      .where(eq(businessOffers.isActive, true))
      .orderBy(desc(businessOffers.createdAt));
    
    // Then add business info to each offer
    const offersWithBusinessInfo = await Promise.all(offers.map(async (offer) => {
      const businessUser = await db.select()
        .from(users)
        .where(eq(users.id, offer.businessId))
        .limit(1);
      
      const business = businessUser[0] || {};
      
      // LA METRO CONSOLIDATION: Check if this deal is in LA Metro area
      const offerCity = offer.city || '';
      const isInLAMetro = isLAMetroCity(offerCity);
      const metroArea = getMetroArea(offerCity);
      
      return {
        ...offer,
        businessName: business.businessName || 'Business',
        businessDescription: business.bio || '',
        businessType: business.userType || 'business',
        businessLocation: business.location || offer.city,
        businessEmail: business.email || '',
        businessPhone: business.phoneNumber || '',
        businessAddress: business.streetAddress || '',
        businessImage: business.profileImage || '',
        // Add metro tags for frontend filtering
        isLAMetro: isInLAMetro,
        metroArea: metroArea
      };
    }));
    
    console.log('💰 DIRECT API: Found', offersWithBusinessInfo.length, 'active business offers');
    console.log('🌍 LA METRO DEALS:', offersWithBusinessInfo.filter(d => d.isLAMetro).length, 'deals in LA metro area');
    res.json(offersWithBusinessInfo);
  } catch (error: any) {
    console.error('🔥 Error in business deals API:', error);
    res.status(500).json({ error: 'Failed to get business deals' });
  }
});

app.get('/api/quick-meetups', async (req, res) => {
  try {
    console.log('⚡ DIRECT API: Fetching quick meetups');
    const now = new Date();
    
    const meetupsQuery = await db.select().from(quickMeetups)
      .where(and(
        gt(quickMeetups.expiresAt, now),
        eq(quickMeetups.isActive, true)
      ))
      .orderBy(desc(quickMeetups.createdAt));
    
    res.json(meetupsQuery);
  } catch (error: any) {
    console.error('🔥 Error in quick meetups API:', error);
    res.status(500).json({ error: 'Failed to get quick meetups' });
  }
});

app.get('/api/businesses', async (req, res) => {
  try {
    console.log('🏢 DIRECT API: Fetching businesses');
    const businessesQuery = await db.select({
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
    }).from(users)
      .where(eq(users.userType, 'business'));
    
    console.log('🏢 DIRECT API: Found', businessesQuery.length, 'businesses');
    res.json(businessesQuery);
  } catch (error: any) {
    console.error('🔥 Error in businesses API:', error);
    res.status(500).json({ error: 'Failed to get businesses' });
  }
});

// Add more critical endpoints that are being intercepted
app.get('/api/users', async (req, res) => {
  try {
    console.log('👥 DIRECT API: Fetching ALL users (not just travelers)');
    const usersQuery = await db.select({
      id: users.id,
      username: users.username,
      name: users.name,
      userType: users.userType,
      location: users.location,
      hometownCity: users.hometownCity,
      hometownState: users.hometownState,
      hometownCountry: users.hometownCountry,
      bio: users.bio,
      profileImage: users.profileImage,
      isCurrentlyTraveling: users.isCurrentlyTraveling,
      travelDestination: users.travelDestination,
      interests: users.interests,
      activities: users.activities,
      age: users.age,
      gender: users.gender,
    }).from(users);
    
    console.log('👥 DIRECT API: Found', usersQuery.length, 'total users');
    res.json(usersQuery);
  } catch (error: any) {
    console.error('🔥 Error in users API:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    console.log('👤 DIRECT API: Fetching user by ID:', userId);
    
    const userQuery = await db.select().from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (userQuery.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json(userQuery[0]);
  } catch (error: any) {
    console.error('🔥 Error in user by ID API:', error);
    return res.status(500).json({ error: 'Failed to get user' });
  }
});

app.get('/api/quick-deals', async (req, res) => {
  try {
    console.log('🎯 DIRECT API: Fetching quick deals');
    
    // Import metro consolidation helpers
    const { isLAMetroCity, getMetroArea } = await import('../shared/constants.ts');
    
    // Get all active quick deals that haven't expired
    const now = new Date();
    const activeDeals = await db.select({
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
      createdAt: quickDeals.createdAt
    }).from(quickDeals)
      .where(and(
        eq(quickDeals.isActive, true),
        gt(quickDeals.validUntil, now)
      ))
      .orderBy(desc(quickDeals.createdAt));
    
    // Add LA Metro tags to deals
    const dealsWithMetroInfo = activeDeals.map(deal => {
      const dealLocation = deal.location || '';
      // Parse city from location string (e.g., "Playa del Rey, California" -> "Playa del Rey")
      const cityName = dealLocation.split(',')[0]?.trim() || dealLocation;
      const isInLAMetro = isLAMetroCity(cityName);
      const metroArea = getMetroArea(cityName);
      
      return {
        ...deal,
        city: cityName,
        state: 'California',
        country: 'United States',
        // Add metro tags for frontend filtering
        isLAMetro: isInLAMetro,
        metroArea: metroArea
      };
    });
    
    console.log('🎯 DIRECT API: Found', dealsWithMetroInfo.length, 'active quick deals');
    console.log('🌍 LA METRO QUICK DEALS:', dealsWithMetroInfo.filter(d => d.isLAMetro).length, 'deals in LA metro area');
    res.json(dealsWithMetroInfo);
  } catch (error: any) {
    console.error('🔥 Error in quick deals API:', error);
    res.status(500).json({ error: 'Failed to get quick deals' });
  }
});

app.get('/api/city-stats', async (req, res) => {
  try {
    console.log('🏙️ DIRECT API: Fetching city stats for destinations');
    
    // Get counts by city from users table  
    const cityStats = await db.select({
      city: users.hometownCity,
      state: users.hometownState,
      country: users.hometownCountry,
      userType: users.userType,
    }).from(users)
      .where(isNotNull(users.hometownCity));

    // Group by city and calculate stats
    const statsMap = new Map();
    
    cityStats.forEach(user => {
      if (!user.city) return;
      
      const key = `${user.city}, ${user.state || ''}, ${user.country || ''}`.replace(', ,', ',');
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          city: user.city,
          state: user.state,
          country: user.country,
          localCount: 0,
          travelerCount: 0,
          businessCount: 0,
          eventCount: 0,
        });
      }
      
      const stats = statsMap.get(key);
      if (user.userType === 'local') stats.localCount++;
      else if (user.userType === 'traveler') stats.travelerCount++;
      else if (user.userType === 'business') stats.businessCount++;
    });

    // Create Los Angeles Metro consolidation
    const laMetroStats = {
      city: 'Los Angeles Metro',
      state: 'California',
      country: 'United States',
      localCount: 0,
      travelerCount: 0,
      businessCount: 0,
      eventCount: 0,
    };

    const laCities = ['Los Angeles', 'Santa Monica', 'Venice', 'Culver City', 'Playa del Rey', 'Hollywood', 'Beverly Hills'];
    
    // Consolidate LA metro area stats
    for (const [key, stats] of statsMap.entries()) {
      if (stats.state === 'California' && laCities.some(city => stats.city?.includes(city))) {
        laMetroStats.localCount += stats.localCount;
        laMetroStats.travelerCount += stats.travelerCount;
        laMetroStats.businessCount += stats.businessCount;
        statsMap.delete(key); // Remove individual city, will be part of metro
      }
    }

    // Add LA Metro if it has any activity
    const result = [];
    if (laMetroStats.localCount + laMetroStats.travelerCount + laMetroStats.businessCount > 0) {
      result.push(laMetroStats);
    }

    // Add other cities with activity
    for (const stats of statsMap.values()) {
      if (stats.localCount + stats.travelerCount + stats.businessCount > 0) {
        result.push(stats);
      }
    }

    console.log('🏙️ DIRECT API: Found', result.length, 'cities with activity');
    res.json(result);
  } catch (error: any) {
    console.error('🔥 Error in city stats API:', error);
    res.status(500).json({ error: 'Failed to get city stats' });
  }
});

app.get('/api/search-users', async (req, res) => {
  try {
    console.log('🔍 DIRECT API: Search users');
    const location = Array.isArray(req.query.location) ? req.query.location[0] : req.query.location as string;
    const search = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search as string;
    const currentUserId = req.query.currentUserId || req.headers['x-user-id'];
    
    console.log('🔍 SEARCH PARAMS:', { search, location, currentUserId });
    
    let results: any[] = [];
    const whereConditions = [];
    
    // Exclude current user if provided
    const userIdString = Array.isArray(currentUserId) ? currentUserId[0] : currentUserId as string;
    if (userIdString && typeof userIdString === 'string' && !isNaN(parseInt(userIdString))) {
      whereConditions.push(ne(users.id, parseInt(userIdString)));
    }
    
    // Search by text (name, username, bio, interests, activities)  
    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchTerm = search.trim().toLowerCase();
      whereConditions.push(
        or(
          ilike(users.name, `%${searchTerm}%`),
          ilike(users.username, `%${searchTerm}%`),
          ilike(users.bio, `%${searchTerm}%`),
          // For array fields, we use SQL to check if any element contains the search term
          sql`EXISTS (SELECT 1 FROM unnest(${users.interests}) AS interest WHERE lower(interest) LIKE '%' || lower(${searchTerm}) || '%')`,
          sql`EXISTS (SELECT 1 FROM unnest(${users.activities}) AS activity WHERE lower(activity) LIKE '%' || lower(${searchTerm}) || '%')`
        )
      );
      console.log('🔍 SEARCH: Added text search condition for:', searchTerm);
    }
    
    // Search by location with LA Metro consolidation
    if (location && typeof location === 'string' && location.trim() !== '') {
      const locationTerm = location.trim();
      
      // Import metro consolidation helpers
      const { isLAMetroCity, getMetroCities } = await import('../shared/constants.ts');
      
      // Extract just the city name from formatted locations like "Los Angeles, California, United States"
      const cityName = locationTerm.split(',')[0].trim();
      
      // Check if searching for Los Angeles or any LA Metro city
      const isSearchingLA = cityName.toLowerCase().includes('los angeles') || 
                           cityName.toLowerCase().includes('la ') ||
                           cityName.toLowerCase() === 'la';
      
      if (isSearchingLA) {
        // Get all LA Metro cities for the search
        const metroCities = getMetroCities('Los Angeles');
        const cityConditions = metroCities.map(city => 
          or(
            ilike(users.location, `%${city}%`),
            ilike(users.hometownCity, `%${city}%`)
          )
        );
        
        // Also include direct "Los Angeles" matches
        cityConditions.push(
          or(
            ilike(users.location, `%Los Angeles%`),
            ilike(users.hometownCity, `%Los Angeles%`)
          )
        );
        
        whereConditions.push(or(...cityConditions));
        console.log('🔍 SEARCH: Added LA Metro consolidated search for:', metroCities.length, 'cities');
      } else {
        // Regular location search
        whereConditions.push(
          or(
            ilike(users.location, `%${locationTerm}%`),
            ilike(users.hometownCity, `%${locationTerm}%`),
            ilike(users.hometownState, `%${locationTerm}%`),
            ilike(users.hometownCountry, `%${locationTerm}%`)
          )
        );
        console.log('🔍 SEARCH: Added location search condition for:', locationTerm);
      }
    }
    
    // Execute query
    if (whereConditions.length > 0) {
      results = await db.select().from(users).where(and(...whereConditions));
    } else {
      // If no search criteria provided, return empty results instead of all users
      results = [];
      console.log('🔍 SEARCH: No search criteria provided, returning empty results');
    }
    
    console.log('🔍 DIRECT API: Found', results.length, 'users matching search');
    res.json(results);
  } catch (error: any) {
    console.error('🔥 Error in search users API:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

console.log('✅ CRITICAL API ROUTES REGISTERED BEFORE OTHER MIDDLEWARE');

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false, // easier with Vite assets
  contentSecurityPolicy: false      // turn on later with a tuned CSP
}));

// HSTS for production with custom domain
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  next();
});

// Global rate limits
app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 800,              // tune as needed
  standardHeaders: true,
  legacyHeaders: false
}));

// Configure session middleware with Redis for production
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;
app.use(session({
  store: redis ? new RedisStore({ client: redis }) : undefined, // Use Redis if available, fallback to memory store for dev
  secret: process.env.SESSION_SECRET || 'nearby-traveler-secret-key-dev',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to false for mobile compatibility
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000
  },
  name: "nt.sid"
}));

// CRITICAL FIX: Increase payload limits to prevent 431 "Request Header Fields Too Large" errors
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb', parameterLimit: 100000 }));

// Serve static files from public directory FIRST (for logo)
app.use(express.static(path.join(process.cwd(), 'public')));

// Serve attached assets with aggressive no-cache headers
app.use('/assets', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
}, express.static(path.join(process.cwd(), 'attached_assets')));

app.use('/attached_assets', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
}, express.static(path.join(process.cwd(), 'attached_assets')));

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
    res.json({ message: "Server is running", timestamp: new Date().toISOString() });
  });
  
  // Add quick login fix (temporarily disabled during deployment debugging)
  console.log("Quick login fix temporarily disabled for deployment stability");
  
  console.log("Minimal routes registered successfully");

  // CRITICAL: Import and register all main API routes BEFORE Vite setup
  try {
    console.log("Loading main API routes from routes.ts...");
    const { registerRoutes } = await import('./routes.js');
    const registeredServer = await registerRoutes(app, httpServerWithWebSocket);
    console.log("✅ Main API routes registered successfully");
    
    // Add explicit API route verification
    app.get('/api/debug-routes', (req, res) => {
      res.json({ 
        message: "API routes are working properly",
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url 
      });
    });

    // ===== CRITICAL VITE WORKAROUND ROUTES =====
    // These routes MUST be defined here before any other middleware to bypass Vite interception
    console.log('🚀 REGISTERING CRITICAL API ROUTES TO BYPASS VITE INTERCEPTION');
    
    app.get('/api/search-users', async (req, res) => {
      try {
        const {
          search,
          gender,
          sexualPreference,
          minAge,
          maxAge,
          interests,
          activities,
          events,
          location,
          userType,
          travelerTypes,
          militaryStatus
        } = req.query;

        if (process.env.NODE_ENV === 'development') console.log('🔍 DIRECT SEARCH: Performing search with filters:', {
          search, gender, sexualPreference, minAge, maxAge, interests, activities, events, location, userType, travelerTypes, militaryStatus
        });

        // For now, return empty results to test the endpoint
        res.json([]);
      } catch (error: any) {
        console.error('Error in direct search:', error);
        res.status(500).json({ error: 'Failed to perform search' });
      }
    });

    // Note: Critical API routes already registered at the top of the middleware chain
    
  } catch (error) {
    console.error("❌ CRITICAL: Failed to register main API routes:", error);
    console.log("The server will continue with basic functionality only");
    // Don't exit to keep basic server running
  }

  // Setup vite after ALL routes are registered
  // Force production-style static serving for Replit deployment to prevent WebSocket issues
  const isReplitDeployment = process.env.REPL_ID && process.env.REPLIT_DEPLOYMENT;
  const isProduction = process.env.NODE_ENV === "production";
  
  if (isReplitDeployment || isProduction) {
    console.log("📦 Setting up static file serving for Replit deployment...");
    serveStatic(app);
  } else {
    console.log("🔧 Setting up Vite development server...");
    try {
      await setupVite(app, server);
    } catch (viteError) {
      console.error("⚠️ Vite setup failed, falling back to static serving:", viteError);
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
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      stack: err.stack
    });
    
    res.status(status).json({ message, path: req.path });
    // DO NOT throw here - this prevents process crashes
  });

  // Use PORT from environment or default to 5000
  const port = Number(process.env.PORT) || 5000;
  
  // Add server error handling
  httpServerWithWebSocket.on('error', (error: any) => {
    console.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use - trying to kill existing process`);
      
      // Try to kill process using the port and retry
      const { exec } = require('child_process');
      exec(`lsof -ti:${port} | xargs kill -9 || true`, () => {
        setTimeout(() => {
          console.log('Retrying server start...');
          httpServerWithWebSocket.listen({
            port,
            host: "0.0.0.0",
            reusePort: true,
          });
        }, 2000);
      });
      return;
    } else {
      console.error('Server failed to start:', error.message);
      process.exit(1);
    }
  });

  httpServerWithWebSocket.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    try {
      log(`serving on port ${port}`);
      console.log(`🚀 Server successfully started on http://0.0.0.0:${port}`);
      
      // Initialize background services after server is listening (temporarily disabled to fix startup)
      console.log("⚠️  Background services temporarily disabled during startup debugging");
      
      // TODO: Re-enable these services after fixing database connection issues:
      // - TravelStatusService.updateAllUserTravelStatuses()
      // - userStatusService.startPeriodicChecker()
      // - Event scheduler
      
      console.log("✅ Server started successfully (background services disabled)");
      
    } catch (error) {
      console.error("❌ Failed to initialize server services:", error);
      console.error("Stack:", error instanceof Error ? error.stack : 'No stack available');
      // Don't exit on service failure, let the server continue to run
    }
  });
})();
