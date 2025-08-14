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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

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
  
  console.log("Minimal routes registered successfully");

  // Setup vite after routes are registered
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
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
      console.error(`Port ${port} is already in use`);
      process.exit(1);
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
