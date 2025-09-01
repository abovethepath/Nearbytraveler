import type { Express } from "express";
import session from "express-session";

export function setupSimpleAuth(app: Express) {
  // Set up session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'development-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  console.log("🔐 Setting up simple authentication redirect...");
  
  // Simple login route that redirects to Replit OAuth
  app.get("/api/login", (req, res) => {
    console.log("🔐 Login route hit, redirecting to Replit OAuth...");
    const redirectUrl = `https://replit.com/oauth/authorize?client_id=${process.env.REPL_ID}&response_type=code&scope=openid+email+profile&redirect_uri=https://${req.hostname}/api/callback`;
    console.log("🔐 Redirecting to:", redirectUrl);
    res.redirect(redirectUrl);
  });

  // Development OAuth callback - simulates successful login  
  app.get("/api/callback", (req, res) => {
    console.log("🔐 OAuth callback hit with code:", req.query.code);
    
    const { code } = req.query;
    if (!code) {
      console.log("❌ No authorization code received");
      return res.redirect("/?error=no_code");
    }

    console.log("🔧 Development mode: Creating session for nearbytraveler account");
    
    // Create user session directly for development
    const userInfo = {
      id: "2", // Use existing nearbytraveler user ID from database
      username: "nearbytraveler", 
      email: "nearbytraveler@thenearbytraveler.com",
      profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=nearbytraveler"
    };

    // Store user session
    (req as any).session.user = userInfo;

    console.log("✅ Development session created for:", userInfo.username);
    res.redirect("/");
  });

  // Simple logout route
  app.get("/api/logout", (req, res) => {
    console.log("🔐 Logout route hit");
    (req as any).session.destroy((err: any) => {
      if (err) {
        console.error("Session destroy error:", err);
      }
      res.redirect("/");
    });
  });

  // Check authentication status
  app.get("/api/auth/user", (req, res) => {
    const user = (req as any).session.user;
    if (user) {
      console.log("✅ Auth check: User is logged in:", user.username);
      res.json(user);
    } else {
      console.log("❌ Auth check: No user session found");
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  console.log("🔐 Simple authentication routes set up successfully");
}