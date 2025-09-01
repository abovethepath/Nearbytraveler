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

  // OAuth callback route that handles the authorization code
  app.get("/api/callback", async (req, res) => {
    console.log("🔐 OAuth callback hit with code:", req.query.code);
    
    const { code } = req.query;
    if (!code) {
      console.log("❌ No authorization code received");
      return res.redirect("/?error=no_code");
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch("https://replit.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code as string,
          client_id: process.env.REPL_ID!,
          redirect_uri: `https://${req.hostname}/api/callback`,
        }),
      });

      if (!tokenResponse.ok) {
        console.log("❌ Token exchange failed:", tokenResponse.status);
        return res.redirect("/?error=token_exchange_failed");
      }

      const tokens = await tokenResponse.json();
      console.log("✅ Tokens received successfully");

      // Get user info with access token
      const userResponse = await fetch("https://replit.com/oauth/userinfo", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userResponse.ok) {
        console.log("❌ User info fetch failed:", userResponse.status);
        return res.redirect("/?error=user_info_failed");
      }

      const userInfo = await userResponse.json();
      console.log("✅ User info received:", userInfo.username);

      // Store user session (simplified for now)
      (req as any).session.user = {
        id: userInfo.sub,
        username: userInfo.username,
        email: userInfo.email,
        profileImageUrl: userInfo.profile_image_url,
      };

      console.log("✅ User session created for:", userInfo.username);
      res.redirect("/");
    } catch (error) {
      console.error("❌ OAuth callback error:", error);
      res.redirect("/?error=oauth_failed");
    }
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