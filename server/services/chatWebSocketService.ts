import { WebSocket } from 'ws';
import { db } from '../db';
import { chatroomMessages, chatroomMembers, users } from '../../shared/schema';
import { eq, and, desc, gt } from 'drizzle-orm';

// WebSocket event types for WhatsApp-style chat
export type ChatEventType =
  | 'message:new'
  | 'message:update'
  | 'message:reaction'
  | 'message:reply'
  | 'typing:start'
  | 'typing:stop'
  | 'receipt:sent'
  | 'receipt:delivered'
  | 'receipt:read'
  | 'presence:join'
  | 'presence:leave'
  | 'sync:history'
  | 'system:error';

export interface ChatEvent {
  type: ChatEventType;
  chatroomId: number;
  payload: any;
  correlationId?: string;
  senderId?: number;
  timestamp: number;
}

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  username?: string;
  isAuthenticated?: boolean;
  isAlive?: boolean;
}

export class ChatWebSocketService {
  private connectedUsers = new Map<number, AuthenticatedWebSocket>();
  private chatroomMembers = new Map<number, Set<number>>(); // chatroomId -> Set of userIds
  private typingUsers = new Map<string, { userId: number; expiresAt: number }>(); // chatroomId:userId -> expiry

  constructor() {
    // Clean up expired typing indicators every 2 seconds
    setInterval(() => this.cleanupExpiredTyping(), 2000);
  }

  // Authenticate WebSocket connection
  async authenticateConnection(ws: AuthenticatedWebSocket, authData: { userId: number; username: string }) {
    const { userId, username } = authData;
    
    // Verify user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) {
      this.sendError(ws, 'Authentication failed: User not found');
      return false;
    }

    ws.userId = userId;
    ws.username = username;
    ws.isAuthenticated = true;
    this.connectedUsers.set(userId, ws);

    console.log(`🟢 User ${username} (${userId}) connected to chat WebSocket`);
    return true;
  }

  // Handle incoming chat events
  async handleEvent(ws: AuthenticatedWebSocket, event: ChatEvent) {
    if (!ws.isAuthenticated || !ws.userId) {
      this.sendError(ws, 'Unauthorized: Please authenticate first');
      return;
    }

    try {
      switch (event.type) {
        case 'message:new':
          await this.handleNewMessage(ws, event);
          break;
        case 'message:reaction':
          await this.handleReaction(ws, event);
          break;
        case 'message:reply':
          await this.handleReply(ws, event);
          break;
        case 'typing:start':
          await this.handleTypingStart(ws, event);
          break;
        case 'typing:stop':
          await this.handleTypingStop(ws, event);
          break;
        case 'receipt:read':
          await this.handleReadReceipt(ws, event);
          break;
        case 'sync:history':
          await this.handleHistorySync(ws, event);
          break;
        default:
          this.sendError(ws, `Unknown event type: ${event.type}`);
      }
    } catch (error: any) {
      console.error(`Error handling event ${event.type}:`, error);
      this.sendError(ws, `Failed to process ${event.type}: ${error.message}`);
    }
  }

  // Handle new message
  private async handleNewMessage(ws: AuthenticatedWebSocket, event: ChatEvent) {
    const { chatroomId, payload } = event;
    const { content, messageType = 'text', replyToId, mediaUrl, voiceDuration, location } = payload;

    // Verify user is a member of the chatroom
    const isMember = await this.verifyChatroomMembership(ws.userId!, chatroomId);
    if (!isMember) {
      this.sendError(ws, 'You are not a member of this chatroom');
      return;
    }

    // Insert message into database
    const [newMessage] = await db.insert(chatroomMessages).values({
      chatroomId,
      senderId: ws.userId!,
      content,
      messageType,
      replyToId: replyToId || null,
      mediaUrl: mediaUrl || null,
      voiceDuration: voiceDuration || null,
      location: location || null,
      reactions: {},
      deliveredAt: new Date(), // Mark as delivered immediately
    }).returning();

    // Fetch sender details
    const sender = await db.query.users.findFirst({
      where: eq(users.id, ws.userId!),
      columns: {
        id: true,
        username: true,
        name: true,
        profileImage: true,
      }
    });

    // Broadcast to all chatroom members
    const broadcastEvent: ChatEvent = {
      type: 'message:new',
      chatroomId,
      payload: {
        ...newMessage,
        sender,
      },
      correlationId: event.correlationId,
      senderId: ws.userId,
      timestamp: Date.now(),
    };

    await this.broadcastToChatroom(chatroomId, broadcastEvent, ws.userId);
  }

  // Handle message reaction
  private async handleReaction(ws: AuthenticatedWebSocket, event: ChatEvent) {
    const { chatroomId, payload } = event;
    const { messageId, emoji } = payload;

    // Get current message
    const message = await db.query.chatroomMessages.findFirst({
      where: eq(chatroomMessages.id, messageId)
    });

    if (!message) {
      this.sendError(ws, 'Message not found');
      return;
    }

    // Update reactions
    const reactions = (message.reactions as any) || {};
    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    // Toggle reaction
    const userIndex = reactions[emoji].indexOf(ws.userId);
    if (userIndex > -1) {
      reactions[emoji].splice(userIndex, 1);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji].push(ws.userId);
    }

    // Update database
    await db.update(chatroomMessages)
      .set({ reactions })
      .where(eq(chatroomMessages.id, messageId));

    // Broadcast reaction update
    const broadcastEvent: ChatEvent = {
      type: 'message:reaction',
      chatroomId,
      payload: { messageId, reactions },
      correlationId: event.correlationId,
      senderId: ws.userId,
      timestamp: Date.now(),
    };

    await this.broadcastToChatroom(chatroomId, broadcastEvent);
  }

  // Handle reply to message
  private async handleReply(ws: AuthenticatedWebSocket, event: ChatEvent) {
    // Reply is just a regular message with replyToId set
    await this.handleNewMessage(ws, { ...event, type: 'message:new' });
  }

  // Handle typing start
  private async handleTypingStart(ws: AuthenticatedWebSocket, event: ChatEvent) {
    const { chatroomId } = event;
    const typingKey = `${chatroomId}:${ws.userId}`;
    
    this.typingUsers.set(typingKey, {
      userId: ws.userId!,
      expiresAt: Date.now() + 5000, // 5 second expiry
    });

    // Broadcast typing indicator
    const broadcastEvent: ChatEvent = {
      type: 'typing:start',
      chatroomId,
      payload: { userId: ws.userId, username: ws.username },
      timestamp: Date.now(),
    };

    await this.broadcastToChatroom(chatroomId, broadcastEvent, ws.userId);
  }

  // Handle typing stop
  private async handleTypingStop(ws: AuthenticatedWebSocket, event: ChatEvent) {
    const { chatroomId } = event;
    const typingKey = `${chatroomId}:${ws.userId}`;
    
    this.typingUsers.delete(typingKey);

    // Broadcast typing stop
    const broadcastEvent: ChatEvent = {
      type: 'typing:stop',
      chatroomId,
      payload: { userId: ws.userId },
      timestamp: Date.now(),
    };

    await this.broadcastToChatroom(chatroomId, broadcastEvent, ws.userId);
  }

  // Handle read receipt
  private async handleReadReceipt(ws: AuthenticatedWebSocket, event: ChatEvent) {
    const { chatroomId, payload } = event;
    const { messageId } = payload;

    // Update last read timestamp for this user in this chatroom
    await db.update(chatroomMembers)
      .set({ lastReadAt: new Date() })
      .where(and(
        eq(chatroomMembers.chatroomId, chatroomId),
        eq(chatroomMembers.userId, ws.userId!)
      ));

    // Broadcast read receipt
    const broadcastEvent: ChatEvent = {
      type: 'receipt:read',
      chatroomId,
      payload: { messageId, userId: ws.userId },
      timestamp: Date.now(),
    };

    await this.broadcastToChatroom(chatroomId, broadcastEvent, ws.userId);
  }

  // Handle history sync (for reconnection)
  private async handleHistorySync(ws: AuthenticatedWebSocket, event: ChatEvent) {
    const { chatroomId, payload } = event;
    const { lastMessageTimestamp } = payload;

    // Fetch messages since last timestamp
    const messages = await db.query.chatroomMessages.findMany({
      where: and(
        eq(chatroomMessages.chatroomId, chatroomId),
        lastMessageTimestamp ? gt(chatroomMessages.createdAt, new Date(lastMessageTimestamp)) : undefined
      ),
      orderBy: desc(chatroomMessages.createdAt),
      limit: 50,
    });

    // Send sync response
    ws.send(JSON.stringify({
      type: 'sync:response',
      chatroomId,
      payload: { messages },
      timestamp: Date.now(),
    }));
  }

  // Broadcast event to all members of a chatroom
  private async broadcastToChatroom(chatroomId: number, event: ChatEvent, excludeUserId?: number) {
    // Get all members of the chatroom
    const members = await db.query.chatroomMembers.findMany({
      where: and(
        eq(chatroomMembers.chatroomId, chatroomId),
        eq(chatroomMembers.isActive, true)
      ),
    });

    const eventStr = JSON.stringify(event);

    members.forEach(member => {
      if (member.userId === excludeUserId) return;
      
      const userWs = this.connectedUsers.get(member.userId);
      if (userWs && userWs.readyState === WebSocket.OPEN) {
        userWs.send(eventStr);
      }
    });
  }

  // Verify chatroom membership
  private async verifyChatroomMembership(userId: number, chatroomId: number): Promise<boolean> {
    const member = await db.query.chatroomMembers.findFirst({
      where: and(
        eq(chatroomMembers.chatroomId, chatroomId),
        eq(chatroomMembers.userId, userId),
        eq(chatroomMembers.isActive, true)
      ),
    });

    return !!member;
  }

  // Clean up expired typing indicators
  private cleanupExpiredTyping() {
    const now = Date.now();
    for (const [key, typing] of this.typingUsers.entries()) {
      if (typing.expiresAt < now) {
        this.typingUsers.delete(key);
      }
    }
  }

  // Send error to client
  private sendError(ws: WebSocket, message: string) {
    ws.send(JSON.stringify({
      type: 'system:error',
      payload: { message },
      timestamp: Date.now(),
    }));
  }

  // Handle user disconnect
  handleDisconnect(userId: number) {
    this.connectedUsers.delete(userId);
    console.log(`🔴 User ${userId} disconnected from chat WebSocket`);
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }
}

// Export singleton instance
export const chatWebSocketService = new ChatWebSocketService();
