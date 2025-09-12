import type { Express, Request, Response } from "express";
import { storage } from "./storage";

export function setupWaitlistRoutes(app: Express) {
  // POST /api/waitlist - Join waitlist
  app.post("/api/waitlist", async (req: Request, res: Response) => {
    console.log("🚨 WAITLIST POST REQUEST RECEIVED!");
    console.log("Request body:", req.body);
    console.log("Request headers:", req.headers);
    
    try {
      const { name, email, phone } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" });
      }

      const lead = await storage.createWaitlistLead({ name, email, phone });
      console.log("✅ WAITLIST LEAD CREATED SUCCESSFULLY:", lead);
      
      return res.status(201).json({ 
        message: "Successfully joined waitlist"
      });

    } catch (error: any) {
      console.error('Error creating waitlist lead:', error);
      
      if (error.code === '23505') {
        return res.status(409).json({ 
          message: "This email is already registered" 
        });
      }
      
      return res.status(500).json({ 
        message: "Failed to join waitlist" 
      });
    }
  });
  
  // GET /api/waitlist - Get all waitlist leads (admin)
  app.get("/api/waitlist", async (req: Request, res: Response) => {
    try {
      const leads = await storage.getWaitlistLeads();
      return res.json(leads);
    } catch (error) {
      console.error('Error fetching waitlist leads:', error);
      return res.status(500).json({ message: "Failed to fetch waitlist" });
    }
  });
}