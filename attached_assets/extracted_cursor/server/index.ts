import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { setupFrontend, log } from "./vite";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Add global error handlers to prevent silent failures
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Do not exit; keep server alive in dev
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Stack:', reason instanceof Error ? reason.stack : 'No stack available');
  // Do not exit; keep server alive in dev
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

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'nearby-traveler-secret-key-dev',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

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

  // Global error handler will be added after all routes/static/vite are set up

  // Register all routes BEFORE setting up Vite to ensure they take precedence
  console.log("Loading full routes...");
  const { registerRoutes } = await import("./routes");
  const httpServerWithWebSocket = await registerRoutes(app);
  console.log("All routes registered successfully");

  //  // Mount the frontend (dev = Vite middleware, prod = static dist)
  try {
    await setupFrontend(app, httpServerWithWebSocket);
  } catch (err) {
    console.error("Frontend setup failed:", err);
    // keep API alive even if frontend failed
  }

  // Global error handler (last)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = Number(err?.status || err?.statusCode || 500);
    const message = err?.message || "Internal Server Error";
    console.error("Request error:", message, err?.stack || err);
    // do NOT throw here; just respond
    if (!res.headersSent) {
      res.status(status).json({ ok: false, message });
    }
  });

  // ALWAYS serve the app on port 3000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 3000;
  
  // Add server error handling
  httpServerWithWebSocket.listen({
    port,
    host: "0.0.0.0",
  }, async () => {
    try {
      log(`serving on port ${port}`);
      console.log(`🚀 Server successfully started on http://0.0.0.0:${port}`);
      
      // Initialize background services after server is listening
      const { TravelStatusService } = await import("./services/travel-status-service");
      const { userStatusService } = await import("./services/userStatusService");
      
      // Start background services with error handling
      TravelStatusService.updateAllUserTravelStatuses()
        .then(() => console.log("✅ Initial travel status check completed"))
        .catch(err => console.error("❌ Initial travel status check failed:", err));
      
      setInterval(async () => {
        try {
          await TravelStatusService.updateAllUserTravelStatuses();
        } catch (error) {
          console.error("❌ Hourly travel status update failed:", error);
        }
      }, 60 * 60 * 1000);
      
      userStatusService.startPeriodicChecker();
      console.log("✅ All services initialized successfully");
      
    } catch (error) {
      console.error("❌ Failed to initialize server services:", error);
      console.error("Stack:", error instanceof Error ? error.stack : 'No stack available');
      // Don't exit on service failure, let the server continue to run
    }
  }).on('error', (error: any) => {
    console.error('Server binding error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use`);
      process.exit(1);
    } else {
      console.error('Server failed to start:', error.message);
      process.exit(1);
    }
  });
})();
