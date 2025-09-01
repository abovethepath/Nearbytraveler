import type { Express } from "express";

export function setupSimpleAuth(app: Express) {
  console.log("🔐 Setting up simple authentication redirect...");
  
  // Simple login route that redirects to Replit OAuth
  app.get("/api/login", (req, res) => {
    console.log("🔐 Login route hit, redirecting to Replit OAuth...");
    const redirectUrl = `https://replit.com/oauth/authorize?client_id=${process.env.REPL_ID}&response_type=code&scope=openid+email+profile&redirect_uri=https://${req.hostname}/api/callback`;
    console.log("🔐 Redirecting to:", redirectUrl);
    res.redirect(redirectUrl);
  });

  // Simple callback route 
  app.get("/api/callback", (req, res) => {
    console.log("🔐 OAuth callback hit with code:", req.query.code);
    // For now, just redirect to home - we'll implement full OAuth later
    res.redirect("/");
  });

  // Simple logout route
  app.get("/api/logout", (req, res) => {
    console.log("🔐 Logout route hit");
    res.redirect("/");
  });

  console.log("🔐 Simple authentication routes set up successfully");
}