import type { Express } from "express";
import { storage } from "./storage";
import { z } from "zod";

const travelAgentSignupSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  confirmEmail: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  name: z.string().min(2),
  businessName: z.string().min(2),
  tagline: z.string().optional(),
  description: z.string().min(50),
  yearsExperience: z.number().min(0),
  contactPhone: z.string().min(10),
  officeAddress: z.string().optional(),
  country: z.string().min(1),
  city: z.string().min(1),
  state: z.string().optional(),
  specialties: z.array(z.string()).min(1),
  destinationExpertise: z.array(z.string()).min(1),
  certifications: z.array(z.string()).optional(),
  languagesSpoken: z.array(z.string()).min(1),
  agreeToTerms: z.boolean().refine(val => val === true),
  subscribeNewsletter: z.boolean().optional(),
}).refine((data) => data.email === data.confirmEmail, {
  message: "Emails don't match",
  path: ["confirmEmail"],
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function registerTravelAgentRoutes(app: Express) {
  // Travel Agent Signup
  app.post("/api/signup/travel-agent", async (req, res) => {
    try {
      const validatedData = travelAgentSignupSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create travel agent user
      const userData = {
        username: validatedData.username,
        email: validatedData.email,
        password: validatedData.password,
        name: validatedData.name,
        userType: "travel_agent" as const,
        bio: validatedData.description,
        hometownCity: validatedData.city,
        hometownState: validatedData.state || "",
        hometownCountry: validatedData.country,
        businessName: validatedData.businessName,
        phoneNumber: validatedData.contactPhone,
        streetAddress: validatedData.officeAddress || "",
        languagesSpoken: validatedData.languagesSpoken,
        // Store travel agent specific data as JSON in appropriate fields
        services: JSON.stringify({
          specialties: validatedData.specialties,
          destinationExpertise: validatedData.destinationExpertise,
          certifications: validatedData.certifications || [],
          yearsExperience: validatedData.yearsExperience,
          tagline: validatedData.tagline || "",
          subscribeNewsletter: validatedData.subscribeNewsletter || false
        })
      };

      const newUser = await storage.createUser(userData);

      // Don't send password back
      const { password, ...userResponse } = newUser;
      
      res.json(userResponse);
    } catch (error: any) {
      console.error("Travel agent signup error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get travel agent profile by username (public)
  app.get("/api/travel-agent-profile/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.userType !== "travel_agent") {
        return res.status(404).json({ message: "Travel agent not found" });
      }

      // Parse services data
      let agentData = {};
      if (user.services) {
        try {
          agentData = JSON.parse(user.services);
        } catch (e) {
          console.error("Error parsing travel agent services data:", e);
        }
      }

      const profile = {
        id: user.id,
        username: user.username,
        name: user.name,
        businessName: user.businessName,
        description: user.bio,
        profileImage: user.profileImage,
        coverPhoto: user.coverPhoto,
        contactEmail: user.email,
        contactPhone: user.phoneNumber,
        location: `${user.hometownCity}, ${user.hometownState ? user.hometownState + ', ' : ''}${user.hometownCountry}`,
        languages: user.languagesSpoken || [],
        isPublished: true, // For now, all agents are published
        ...agentData
      };

      res.json(profile);
    } catch (error) {
      console.error("Error fetching travel agent profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get travel agent trips (public)
  app.get("/api/travel-agent-trips-public/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.userType !== "travel_agent") {
        return res.status(404).json({ message: "Travel agent not found" });
      }

      // For now, return empty array - trips functionality can be added later
      // This would connect to a travel agent trips table when implemented
      res.json([]);
    } catch (error) {
      console.error("Error fetching travel agent trips:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}