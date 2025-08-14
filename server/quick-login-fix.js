// Temporary quick login fix to bypass TypeScript compilation issues
import { db } from './db.js';
import { users } from '../shared/schema.js';
import { eq, or, sql } from 'drizzle-orm';

export function setupQuickLoginFix(app) {
  // Override the broken login route with a working one
  app.post("/api/login-fix", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log("🔧 QUICK LOGIN FIX: Login attempt for:", email);

      // Find user by email or username
      let user;
      try {
        const result = await db.select().from(users).where(
          or(
            eq(sql`LOWER(${users.email})`, email.toLowerCase()),
            eq(sql`LOWER(${users.username})`, email.toLowerCase())
          )
        ).limit(1);
        user = result[0];
      } catch (dbError) {
        console.error("🔧 QUICK LOGIN FIX: Database error:", dbError);
        return res.status(500).json({ message: "Database connection error" });
      }

      if (!user) {
        console.log("🔧 QUICK LOGIN FIX: User not found for:", email);
        return res.status(401).json({ message: "Invalid email/username or password" });
      }

      // Simple password check
      if (user.password !== password) {
        console.log("🔧 QUICK LOGIN FIX: Wrong password for:", email);
        return res.status(401).json({ message: "Invalid email/username or password" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      console.log("🔧 QUICK LOGIN FIX: Login successful for:", userWithoutPassword.username);
      
      return res.json({
        user: userWithoutPassword,
        token: 'auth_token_' + user.id
      });
    } catch (error) {
      console.error("🔧 QUICK LOGIN FIX: Error:", error);
      return res.status(500).json({ message: "Login failed. Server error." });
    }
  });
}