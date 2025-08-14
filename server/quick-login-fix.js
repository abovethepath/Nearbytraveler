// Temporary quick login fix to bypass TypeScript compilation issues
import { db } from './db.js';
import { users } from '../shared/schema.js';
import { eq, or, sql } from 'drizzle-orm';

export function setupQuickLoginFix(app) {
  // Working registration endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = req.body;
      console.log("🔧 QUICK REGISTER FIX: Registration attempt for:", userData.email);

      // Check if user already exists
      const existingUserResult = await db.select().from(users).where(
        or(
          eq(sql`LOWER(${users.email})`, userData.email.toLowerCase()),
          eq(sql`LOWER(${users.username})`, userData.username.toLowerCase())
        )
      ).limit(1);

      if (existingUserResult.length > 0) {
        return res.status(409).json({ message: "User already exists with this email or username" });
      }

      // Create new user
      const [newUser] = await db.insert(users).values({
        name: userData.name,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
        userType: userData.userType || 'local',
        hometown: userData.hometown || `${userData.city}, ${userData.state}`,
        bio: userData.bio || '',
        interests: userData.interests || [],
        activities: userData.activities || [],
        events: userData.events || [],
        isCurrentlyTraveling: userData.userType === 'traveling',
        travelDestination: userData.userType === 'traveling' ? userData.travelDestination : null,
        travelStartDate: userData.userType === 'traveling' ? new Date() : null,
        travelEndDate: userData.userType === 'traveling' && userData.travelEndDate ? new Date(userData.travelEndDate) : null
      }).returning();

      console.log("🔧 QUICK REGISTER FIX: User created successfully:", newUser.username);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;

      return res.json({
        user: userWithoutPassword,
        token: 'auth_token_' + newUser.id
      });
    } catch (error) {
      console.error("🔧 QUICK REGISTER FIX: Error:", error);
      return res.status(500).json({ message: "Registration failed. Server error." });
    }
  });

  // Working username check endpoint
  app.get("/api/check-username/:username", async (req, res) => {
    try {
      const username = req.params.username;
      console.log("🔧 QUICK USERNAME CHECK: Checking:", username);

      const existingUser = await db.select().from(users).where(
        eq(sql`LOWER(${users.username})`, username.toLowerCase())
      ).limit(1);

      return res.json({ 
        available: existingUser.length === 0,
        username: username
      });
    } catch (error) {
      console.error("🔧 QUICK USERNAME CHECK: Error:", error);
      return res.status(500).json({ message: "Username check failed" });
    }
  });

  // Working login endpoint (override the broken one)
  app.post("/api/login", async (req, res) => {
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

  // Override the broken login route with a working one (backup)
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