import { Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";

// Validation schemas for request bodies
const promoteRequestSchema = z.object({
  targetUserId: z.number().int().positive()
});

const demoteRequestSchema = z.object({
  targetUserId: z.number().int().positive()
});

const removeRequestSchema = z.object({
  targetUserId: z.number().int().positive()
});

const transferRequestSchema = z.object({
  newOwnerId: z.number().int().positive()
});

// GET /api/chatrooms/:id/members - List chatroom members with their roles
export const getChatroomMembers = async (req: Request, res: Response) => {
  try {
    const chatroomId = parseInt(req.params.id);
    if (isNaN(chatroomId) || chatroomId <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid chatroom ID" 
      });
    }

    // Get user ID from x-user-id header
    const userIdHeader = req.headers['x-user-id'] as string;
    const userId = userIdHeader ? parseInt(userIdHeader) : null;
    
    if (!userId || isNaN(userId)) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    // Verify user is a member of the chatroom
    const userRole = await storage.getMemberRole(chatroomId, userId);
    if (!userRole) {
      return res.status(403).json({ 
        success: false, 
        message: "You are not a member of this chatroom" 
      });
    }

    // Get all chatroom members
    const members = await storage.getChatroomMembers(chatroomId);
    
    res.json({
      success: true,
      data: members
    });

  } catch (error: any) {
    console.error('Error getting chatroom members:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get chatroom members" 
    });
  }
};

// POST /api/chatrooms/:id/admin/promote - Promote member to admin
export const promoteMember = async (req: Request, res: Response) => {
  try {
    const chatroomId = parseInt(req.params.id);
    if (isNaN(chatroomId) || chatroomId <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid chatroom ID" 
      });
    }

    // Validate request body
    const validation = promoteRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid request body",
        errors: validation.error.errors
      });
    }

    const { targetUserId } = validation.data;

    // Get user ID from x-user-id header
    const userIdHeader = req.headers['x-user-id'] as string;
    const actorId = userIdHeader ? parseInt(userIdHeader) : null;
    
    if (!actorId || isNaN(actorId)) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    // Call storage method to promote member
    const result = await storage.promoteChatroomMember(chatroomId, targetUserId, actorId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(403).json(result);
    }

  } catch (error: any) {
    console.error('Error promoting chatroom member:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to promote member" 
    });
  }
};

// POST /api/chatrooms/:id/admin/demote - Demote admin to member
export const demoteAdmin = async (req: Request, res: Response) => {
  try {
    const chatroomId = parseInt(req.params.id);
    if (isNaN(chatroomId) || chatroomId <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid chatroom ID" 
      });
    }

    // Validate request body
    const validation = demoteRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid request body",
        errors: validation.error.errors
      });
    }

    const { targetUserId } = validation.data;

    // Get user ID from x-user-id header
    const userIdHeader = req.headers['x-user-id'] as string;
    const actorId = userIdHeader ? parseInt(userIdHeader) : null;
    
    if (!actorId || isNaN(actorId)) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    // Call storage method to demote admin
    const result = await storage.demoteChatroomAdmin(chatroomId, targetUserId, actorId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(403).json(result);
    }

  } catch (error: any) {
    console.error('Error demoting chatroom admin:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to demote admin" 
    });
  }
};

// POST /api/chatrooms/:id/admin/remove - Remove member from chatroom
export const removeMember = async (req: Request, res: Response) => {
  try {
    const chatroomId = parseInt(req.params.id);
    if (isNaN(chatroomId) || chatroomId <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid chatroom ID" 
      });
    }

    // Validate request body
    const validation = removeRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid request body",
        errors: validation.error.errors
      });
    }

    const { targetUserId } = validation.data;

    // Get user ID from x-user-id header
    const userIdHeader = req.headers['x-user-id'] as string;
    const actorId = userIdHeader ? parseInt(userIdHeader) : null;
    
    if (!actorId || isNaN(actorId)) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    // Call storage method to remove member
    const result = await storage.removeChatroomMember(chatroomId, targetUserId, actorId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(403).json(result);
    }

  } catch (error: any) {
    console.error('Error removing chatroom member:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to remove member" 
    });
  }
};

// POST /api/chatrooms/:id/admin/transfer - Transfer chatroom ownership
export const transferOwnership = async (req: Request, res: Response) => {
  try {
    const chatroomId = parseInt(req.params.id);
    if (isNaN(chatroomId) || chatroomId <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid chatroom ID" 
      });
    }

    // Validate request body
    const validation = transferRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid request body",
        errors: validation.error.errors
      });
    }

    const { newOwnerId } = validation.data;

    // Get user ID from x-user-id header
    const userIdHeader = req.headers['x-user-id'] as string;
    const actorId = userIdHeader ? parseInt(userIdHeader) : null;
    
    if (!actorId || isNaN(actorId)) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    // Call storage method to transfer ownership
    const result = await storage.transferChatroomOwnership(chatroomId, newOwnerId, actorId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(403).json(result);
    }

  } catch (error: any) {
    console.error('Error transferring chatroom ownership:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to transfer ownership" 
    });
  }
};