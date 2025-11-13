import { WebSocket } from 'ws';
import { db } from '../db';
import { chatroomMessages, chatroomMembers, users, messages, meetupChatroomMessages, meetupChatrooms, eventParticipants } from '../../shared/schema';
import { eq, and, desc, gt, or } from 'drizzle-orm';

// WebSocket event types for WhatsApp-style chat
export type ChatEventType =
  | 'message:new'
  | 'message:update'
  | 'message:edit'
  | 'message:delete'
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
  | 'sync:response'
  | 'system:error';

export interface ChatEvent {
  type: ChatEventType;
  chatType?: 'chatroom' | 'event' | 'meetup' | 'dm';
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
        case 'message:edit':
          await this.handleEditMessage(ws, event);
          break;
        case 'message:delete':
          await this.handleDeleteMessage(ws, event);
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
    const { chatType, chatroomId, payload } = event;
    const { content, messageType = 'text', replyToId, mediaUrl, voiceDuration, location } = payload;

    console.log('🔵 handleNewMessage called:', { chatType, chatroomId, userId: ws.userId });

    // Handle DM messages separately (different table structure)
    if (chatType === 'dm') {
      console.log('📱 Processing DM message');

      // For DMs, chatroomId is actually the receiver's user ID
      const receiverId = chatroomId;

      // SECURITY: Validate receiver exists
      const receiver = await db.query.users.findFirst({
        where: eq(users.id, receiverId),
      });
      
      if (!receiver) {
        console.log('🚫 SECURITY: Invalid receiver ID');
        this.sendError(ws, 'Invalid recipient');
        return;
      }

      // Insert into messages table (DMs)
      const [newMessage] = await db.insert(messages).values({
        senderId: ws.userId!,
        receiverId: receiverId,
        content,
        messageType,
        replyToId: replyToId || null,
        mediaUrl: mediaUrl || null,
        reactions: {},
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

      // Fetch reply-to message if exists (for DMs) - SECURITY: Verify it's from the same conversation
      let replyTo = null;
      if (newMessage.replyToId) {
        const replyMessage = await db.query.messages.findFirst({
          where: eq(messages.id, newMessage.replyToId),
        });
        
        // SECURITY: Verify the reply message is part of this DM conversation (between same participants)
        if (replyMessage) {
          const isValidReply = 
            (replyMessage.senderId === ws.userId && replyMessage.receiverId === receiverId) ||
            (replyMessage.senderId === receiverId && replyMessage.receiverId === ws.userId);
          
          if (!isValidReply) {
            console.log('🚫 SECURITY: Attempted to reply to message from different conversation');
            this.sendError(ws, 'Invalid reply: message not in this conversation');
            return;
          }
          
          const replySender = await db.query.users.findFirst({
            where: eq(users.id, replyMessage.senderId),
            columns: {
              id: true,
              username: true,
              name: true,
              profileImage: true,
            }
          });
          
          // SECURITY: Ensure sender lookup succeeded
          if (!replySender) {
            console.log('🚫 SECURITY: Reply sender not found');
            this.sendError(ws, 'Reply message sender not found');
            return;
          }
          
          replyTo = {
            ...replyMessage,
            sender: replySender,
          };
        }
      }

      // Send to both sender and receiver
      const dmEvent: ChatEvent = {
        type: 'message:new',
        chatType: 'dm',
        chatroomId: receiverId,
        payload: {
          ...newMessage,
          sender,
          replyTo,
        },
        correlationId: event.correlationId,
        senderId: ws.userId,
        timestamp: Date.now(),
      };

      // Send to receiver
      const receiverWs = this.connectedUsers.get(receiverId);
      if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
        receiverWs.send(JSON.stringify(dmEvent));
      }

      // Echo back to sender
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(dmEvent));
      }

      return;
    }

    // Handle chatroom messages (original logic)
    console.log('💬 Processing chatroom message, chatType:', chatType);
    
    // Verify user is a member of the chatroom (check appropriate table based on chatType)
    const isMember = await this.verifyChatroomMembership(ws.userId!, chatroomId, chatType);
    console.log('🔐 Membership check result:', { isMember, userId: ws.userId, chatroomId, chatType });
    
    if (!isMember) {
      console.log('❌ User is NOT a member - sending error');
      this.sendError(ws, 'You are not a member of this chatroom');
      return;
    }
    
    console.log('✅ User IS a member - inserting message');

    try {
      let newMessage: any;
      
      // Use different tables based on chatType
      if (chatType === 'meetup' || chatType === 'event') {
        // For meetup/event chatrooms, use simplified meetup_chatroom_messages table
        console.log('📝 Inserting into meetup_chatroom_messages table for', chatType);
        
        // Fetch sender details first for meetup messages
        const sender = await db.query.users.findFirst({
          where: eq(users.id, ws.userId!),
          columns: {
            username: true,
          }
        });
        
        [newMessage] = await db.insert(meetupChatroomMessages).values({
          meetupChatroomId: chatroomId,
          userId: ws.userId!,
          username: sender?.username || 'Unknown',
          message: content,
          messageType: messageType || 'text',
          replyToId: replyToId ?? null,
        }).returning();
        
        console.log('✅ Meetup/Event message inserted successfully:', newMessage.id);
      } else {
        // For city chatrooms, use standard chatroom_messages table
        console.log('📝 Inserting into chatroom_messages table');
        [newMessage] = await db.insert(chatroomMessages).values({
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
        
        console.log('✅ City chatroom message inserted successfully:', newMessage.id);
      }
      
      console.log('✅ Message inserted successfully:', newMessage.id);

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

      console.log('✅ Sender fetched:', sender?.username);

      // Fetch reply-to message if exists - SECURITY: Verify it's from the same chatroom
      let replyTo = null;
      if (newMessage.replyToId) {
        const replyMessage = await db.query.chatroomMessages.findFirst({
          where: eq(chatroomMessages.id, newMessage.replyToId),
        });
        
        // SECURITY: Verify the reply message is from the same chatroom
        if (replyMessage) {
          if (replyMessage.chatroomId !== chatroomId) {
            console.log('🚫 SECURITY: Attempted to reply to message from different chatroom');
            this.sendError(ws, 'Invalid reply: message not in this chatroom');
            return;
          }
          
          const replySender = await db.query.users.findFirst({
            where: eq(users.id, replyMessage.senderId),
            columns: {
              id: true,
              username: true,
              name: true,
              profileImage: true,
            }
          });
          
          // SECURITY: Ensure sender lookup succeeded
          if (!replySender) {
            console.log('🚫 SECURITY: Reply sender not found');
            this.sendError(ws, 'Reply message sender not found');
            return;
          }
          
          replyTo = {
            ...replyMessage,
            sender: replySender,
          };
        }
      }

      // Broadcast to all chatroom members
      // For meetup/event messages, map field names to match frontend expectations
      const messagePayload = (chatType === 'meetup' || chatType === 'event') ? {
        id: newMessage.id,
        content: newMessage.message,
        createdAt: newMessage.sentAt,
        senderId: newMessage.userId,
        messageType: newMessage.messageType,
        sender,
        replyTo,
      } : {
        ...newMessage,
        sender,
        replyTo,
      };

      const broadcastEvent: ChatEvent = {
        type: 'message:new',
        chatType,
        chatroomId,
        payload: messagePayload,
        correlationId: event.correlationId,
        senderId: ws.userId,
        timestamp: Date.now(),
      };

      console.log('📡 Broadcasting message to chatroom:', chatroomId);
      
      // Send to sender first so they see their own message with reply context
      ws.send(JSON.stringify(broadcastEvent));
      
      // Then broadcast to all other members (excluding sender to avoid duplicate)
      await this.broadcastToChatroom(chatroomId, broadcastEvent, ws.userId);
      console.log('✅ Message broadcast complete');
      
    } catch (insertError: any) {
      console.error('❌ ERROR during message insert/broadcast:', insertError.message, insertError.stack);
      throw insertError;
    }
  }

  // Handle edit message
  private async handleEditMessage(ws: AuthenticatedWebSocket, event: ChatEvent) {
    const { chatType, chatroomId, payload } = event;
    const { messageId, content } = payload;

    console.log('✏️ handleEditMessage called:', { chatType, chatroomId, messageId, userId: ws.userId });

    // Handle DM message edits
    if (chatType === 'dm') {
      const message = await db.query.messages.findFirst({
        where: eq(messages.id, messageId)
      });

      if (!message) {
        this.sendError(ws, 'Message not found');
        return;
      }

      // Verify user owns the message
      if (message.senderId !== ws.userId) {
        this.sendError(ws, 'You can only edit your own messages');
        return;
      }

      // Update the message
      const [updated] = await db.update(messages)
        .set({ 
          content: content.trim(),
          isEdited: true,
          editedAt: new Date()
        })
        .where(eq(messages.id, messageId))
        .returning();

      // Send edit event to both users
      const receiverId = chatroomId; // For DMs, chatroomId is the other user's ID
      const editEvent: ChatEvent = {
        type: 'message:edit',
        chatType: 'dm',
        chatroomId: receiverId,
        payload: updated,
        correlationId: event.correlationId,
        senderId: ws.userId,
        timestamp: Date.now(),
      };

      // Send to receiver
      const receiverWs = this.connectedUsers.get(receiverId);
      if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
        receiverWs.send(JSON.stringify(editEvent));
      }

      // Echo back to sender
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(editEvent));
      }

      console.log('✅ DM message edited and broadcast');
      return;
    }

    // Handle chatroom message edits (chatroom, event, meetup)
    if (chatType === 'meetup') {
      const message = await db.query.meetupChatroomMessages.findFirst({
        where: eq(meetupChatroomMessages.id, messageId)
      });

      if (!message) {
        this.sendError(ws, 'Message not found');
        return;
      }

      // SECURITY: Verify message belongs to the target chatroom to prevent cross-room spoofing
      if (message.meetupChatroomId !== chatroomId) {
        this.sendError(ws, 'Message does not belong to this chatroom');
        return;
      }

      // Verify user owns the message
      if (message.userId !== ws.userId) {
        this.sendError(ws, 'You can only edit your own messages');
        return;
      }

      // Update the message (meetup messages use 'message' field)
      const [updated] = await db.update(meetupChatroomMessages)
        .set({ 
          message: content.trim(),
          isEdited: true,
          editedAt: new Date()
        })
        .where(eq(meetupChatroomMessages.id, messageId))
        .returning();

      const editEvent: ChatEvent = {
        type: 'message:edit',
        chatType,
        chatroomId,
        payload: updated,
        correlationId: event.correlationId,
        senderId: ws.userId,
        timestamp: Date.now(),
      };

      await this.broadcastToChatroom(chatroomId, editEvent);
      console.log('✅ Meetup chatroom message edited and broadcast');
      return;
    }

    // Handle regular chatroom/event message edits
    const message = await db.query.chatroomMessages.findFirst({
      where: eq(chatroomMessages.id, messageId)
    });

    if (!message) {
      this.sendError(ws, 'Message not found');
      return;
    }

    // SECURITY: Verify message belongs to the target chatroom to prevent cross-room spoofing
    if (message.chatroomId !== chatroomId) {
      this.sendError(ws, 'Message does not belong to this chatroom');
      return;
    }

    // Verify user owns the message
    if (message.senderId !== ws.userId) {
      this.sendError(ws, 'You can only edit your own messages');
      return;
    }

    // Update the message (chatroom messages use 'content' field)
    const [updated] = await db.update(chatroomMessages)
      .set({ 
        content: content.trim(),
        isEdited: true,
        editedAt: new Date()
      })
      .where(eq(chatroomMessages.id, messageId))
      .returning();

    const editEvent: ChatEvent = {
      type: 'message:edit',
      chatType,
      chatroomId,
      payload: updated,
      correlationId: event.correlationId,
      senderId: ws.userId,
      timestamp: Date.now(),
    };

    // Broadcast to all chatroom members
    await this.broadcastToChatroom(chatroomId, editEvent);
    console.log('✅ Chatroom message edited and broadcast');
  }

  // Handle delete message
  private async handleDeleteMessage(ws: AuthenticatedWebSocket, event: ChatEvent) {
    const { chatType, chatroomId, payload } = event;
    const { messageId } = payload;

    console.log('🗑️ handleDeleteMessage called:', { chatType, chatroomId, messageId, userId: ws.userId });

    // Handle DM message deletes
    if (chatType === 'dm') {
      const message = await db.query.messages.findFirst({
        where: eq(messages.id, messageId)
      });

      if (!message) {
        this.sendError(ws, 'Message not found');
        return;
      }

      // Verify user owns the message
      if (message.senderId !== ws.userId) {
        this.sendError(ws, 'You can only delete your own messages');
        return;
      }

      // Delete the message
      await db.delete(messages)
        .where(eq(messages.id, messageId));

      // Send delete event to both users
      const receiverId = chatroomId; // For DMs, chatroomId is the other user's ID
      const deleteEvent: ChatEvent = {
        type: 'message:delete',
        chatType: 'dm',
        chatroomId: receiverId,
        payload: { messageId },
        correlationId: event.correlationId,
        senderId: ws.userId,
        timestamp: Date.now(),
      };

      // Send to receiver
      const receiverWs = this.connectedUsers.get(receiverId);
      if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
        receiverWs.send(JSON.stringify(deleteEvent));
      }

      // Echo back to sender
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(deleteEvent));
      }

      console.log('✅ DM message deleted and broadcast');
      return;
    }

    // Handle chatroom message deletes (chatroom, event, meetup)
    if (chatType === 'meetup') {
      const message = await db.query.meetupChatroomMessages.findFirst({
        where: eq(meetupChatroomMessages.id, messageId)
      });

      if (!message) {
        this.sendError(ws, 'Message not found');
        return;
      }

      // SECURITY: Verify message belongs to the target chatroom to prevent cross-room spoofing
      if (message.meetupChatroomId !== chatroomId) {
        this.sendError(ws, 'Message does not belong to this chatroom');
        return;
      }

      // Verify user owns the message
      if (message.userId !== ws.userId) {
        this.sendError(ws, 'You can only delete your own messages');
        return;
      }

      // Delete the message
      await db.delete(meetupChatroomMessages)
        .where(eq(meetupChatroomMessages.id, messageId));

      const deleteEvent: ChatEvent = {
        type: 'message:delete',
        chatType,
        chatroomId,
        payload: { messageId },
        correlationId: event.correlationId,
        senderId: ws.userId,
        timestamp: Date.now(),
      };

      await this.broadcastToChatroom(chatroomId, deleteEvent);
      console.log('✅ Meetup chatroom message deleted and broadcast');
      return;
    }

    // Handle regular chatroom/event message deletes
    const message = await db.query.chatroomMessages.findFirst({
      where: eq(chatroomMessages.id, messageId)
    });

    if (!message) {
      this.sendError(ws, 'Message not found');
      return;
    }

    // SECURITY: Verify message belongs to the target chatroom to prevent cross-room spoofing
    if (message.chatroomId !== chatroomId) {
      this.sendError(ws, 'Message does not belong to this chatroom');
      return;
    }

    // Verify user owns the message
    if (message.senderId !== ws.userId) {
      this.sendError(ws, 'You can only delete your own messages');
      return;
    }

    // Delete the message
    await db.delete(chatroomMessages)
      .where(eq(chatroomMessages.id, messageId));

    const deleteEvent: ChatEvent = {
      type: 'message:delete',
      chatType,
      chatroomId,
      payload: { messageId },
      correlationId: event.correlationId,
      senderId: ws.userId,
      timestamp: Date.now(),
    };

    // Broadcast to all chatroom members
    await this.broadcastToChatroom(chatroomId, deleteEvent);
    console.log('✅ Chatroom message deleted and broadcast');
  }

  // Handle message reaction
  private async handleReaction(ws: AuthenticatedWebSocket, event: ChatEvent) {
    const { chatType, chatroomId, payload } = event;
    const { messageId, emoji } = payload;

    // Handle DM reactions separately
    if (chatType === 'dm') {
      // Get message from messages table (DMs)
      const message = await db.query.messages.findFirst({
        where: eq(messages.id, messageId)
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
      await db.update(messages)
        .set({ reactions })
        .where(eq(messages.id, messageId));

      // Send reaction update to both users
      const receiverId = chatroomId; // For DMs, chatroomId is the other user's ID
      const reactionEvent: ChatEvent = {
        type: 'message:reaction',
        chatType: 'dm',
        chatroomId: receiverId,
        payload: { messageId, reactions },
        correlationId: event.correlationId,
        senderId: ws.userId,
        timestamp: Date.now(),
      };

      // Send to receiver
      const receiverWs = this.connectedUsers.get(receiverId);
      if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
        receiverWs.send(JSON.stringify(reactionEvent));
      }

      // Echo back to sender
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(reactionEvent));
      }

      return;
    }

    // Handle chatroom reactions (original logic)
    // Get current message from chatroomMessages table
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
      chatType,
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
    const { chatType, chatroomId, payload } = event;
    const { lastMessageTimestamp } = payload;

    let messagesData: any[] = [];

    // Handle DM history separately
    if (chatType === 'dm') {
      // For DMs, chatroomId is the other user's ID
      const otherUserId = chatroomId;

      // Fetch DM messages between the two users
      const dmMessages = await db.select().from(messages).where(
        or(
          and(
            eq(messages.senderId, ws.userId!),
            eq(messages.receiverId, otherUserId)
          ),
          and(
            eq(messages.senderId, otherUserId),
            eq(messages.receiverId, ws.userId!)
          )
        )
      ).orderBy(desc(messages.createdAt)).limit(50);

      // Fetch sender details and replyTo data for each message
      messagesData = await Promise.all(dmMessages.map(async (msg) => {
        const sender = await db.query.users.findFirst({
          where: eq(users.id, msg.senderId),
          columns: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
          }
        });
        
        // Fetch reply-to message if exists
        let replyTo = null;
        if (msg.replyToId) {
          const replyMessage = await db.query.messages.findFirst({
            where: eq(messages.id, msg.replyToId),
          });
          
          if (replyMessage) {
            const replySender = await db.query.users.findFirst({
              where: eq(users.id, replyMessage.senderId),
              columns: {
                id: true,
                username: true,
                name: true,
                profileImage: true,
              }
            });
            
            replyTo = {
              ...replyMessage,
              sender: replySender,
            };
          }
        }
        
        return { ...msg, sender, replyTo };
      }));
    } else if (chatType === 'meetup') {
      // Handle meetup chatroom history
      const meetupMessages = await db.query.meetupChatroomMessages.findMany({
        where: and(
          eq(meetupChatroomMessages.meetupChatroomId, chatroomId),
          lastMessageTimestamp ? gt(meetupChatroomMessages.sentAt, new Date(lastMessageTimestamp)) : undefined
        ),
        orderBy: desc(meetupChatroomMessages.sentAt),
        limit: 50,
      });
      
      // Fetch sender details and reply context for each message
      messagesData = await Promise.all(meetupMessages.map(async (msg) => {
        const sender = await db.query.users.findFirst({
          where: eq(users.id, msg.userId),
          columns: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
          }
        });
        
        // Fetch reply-to message if exists
        let replyTo = null;
        if (msg.replyToId) {
          const replyMessage = await db.query.meetupChatroomMessages.findFirst({
            where: eq(meetupChatroomMessages.id, msg.replyToId),
          });
          
          if (replyMessage) {
            const replySender = await db.query.users.findFirst({
              where: eq(users.id, replyMessage.userId),
              columns: {
                id: true,
                username: true,
                name: true,
                profileImage: true,
              }
            });
            
            replyTo = {
              id: replyMessage.id,
              content: replyMessage.message,
              createdAt: replyMessage.sentAt,
              senderId: replyMessage.userId,
              messageType: replyMessage.messageType ?? 'text',
              sender: replySender,
            };
          }
        }
        
        return {
          id: msg.id,
          content: msg.message,
          createdAt: msg.sentAt,
          senderId: msg.userId,
          messageType: msg.messageType ?? 'text',
          replyToId: msg.replyToId,
          sender,
          replyTo,
        };
      }));
    } else if (chatType === 'event') {
      // Handle event chatroom history (uses same table as meetup chatrooms)
      const eventMessages = await db.query.meetupChatroomMessages.findMany({
        where: and(
          eq(meetupChatroomMessages.meetupChatroomId, chatroomId),
          lastMessageTimestamp ? gt(meetupChatroomMessages.sentAt, new Date(lastMessageTimestamp)) : undefined
        ),
        orderBy: desc(meetupChatroomMessages.sentAt),
        limit: 50,
      });
      
      // Fetch sender details and reply context for each message
      messagesData = await Promise.all(eventMessages.map(async (msg) => {
        const sender = await db.query.users.findFirst({
          where: eq(users.id, msg.userId),
          columns: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
          }
        });
        
        // Fetch reply-to message if exists
        let replyTo = null;
        if (msg.replyToId) {
          const replyMessage = await db.query.meetupChatroomMessages.findFirst({
            where: eq(meetupChatroomMessages.id, msg.replyToId),
          });
          
          if (replyMessage) {
            const replySender = await db.query.users.findFirst({
              where: eq(users.id, replyMessage.userId),
              columns: {
                id: true,
                username: true,
                name: true,
                profileImage: true,
              }
            });
            
            replyTo = {
              id: replyMessage.id,
              content: replyMessage.message,
              createdAt: replyMessage.sentAt,
              senderId: replyMessage.userId,
              messageType: replyMessage.messageType ?? 'text',
              sender: replySender,
            };
          }
        }
        
        return {
          id: msg.id,
          content: msg.message,
          createdAt: msg.sentAt,
          senderId: msg.userId,
          messageType: msg.messageType ?? 'text',
          replyToId: msg.replyToId,
          sender,
          replyTo,
        };
      }));
    } else {
      // Handle chatroom history with reply metadata
      const chatMessages = await db.query.chatroomMessages.findMany({
        where: and(
          eq(chatroomMessages.chatroomId, chatroomId),
          lastMessageTimestamp ? gt(chatroomMessages.createdAt, new Date(lastMessageTimestamp)) : undefined
        ),
        orderBy: desc(chatroomMessages.createdAt),
        limit: 50,
        with: {
          sender: {
            columns: {
              id: true,
              username: true,
              name: true,
              profileImage: true,
            }
          }
        }
      });
      
      // Fetch replyTo data for each message
      messagesData = await Promise.all(chatMessages.map(async (msg) => {
        let replyTo = null;
        if (msg.replyToId) {
          const replyMessage = await db.query.chatroomMessages.findFirst({
            where: eq(chatroomMessages.id, msg.replyToId),
          });
          
          if (replyMessage) {
            const replySender = await db.query.users.findFirst({
              where: eq(users.id, replyMessage.senderId),
              columns: {
                id: true,
                username: true,
                name: true,
                profileImage: true,
              }
            });
            
            replyTo = {
              ...replyMessage,
              sender: replySender,
            };
          }
        }
        
        return { ...msg, replyTo };
      }));
    }

    // Send sync response
    const responseEvent: ChatEvent = {
      type: 'sync:response',
      chatType,
      chatroomId,
      payload: { messages: messagesData },
      timestamp: Date.now(),
    };
    
    ws.send(JSON.stringify(responseEvent));
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

  // Verify chatroom membership - checks appropriate table based on chatType
  private async verifyChatroomMembership(userId: number, chatroomId: number, chatType?: string): Promise<boolean> {
    // For event chatrooms, check eventParticipants table
    if (chatType === 'event') {
      console.log(`🔍 EVENT CHAT: Checking eventParticipants for userId=${userId}, chatroomId=${chatroomId}`);
      
      // First get the eventId from the chatroom
      const chatroom = await db.query.meetupChatrooms.findFirst({
        where: eq(meetupChatrooms.id, chatroomId)
      });
      
      if (!chatroom?.eventId) {
        console.log(`❌ EVENT CHAT: No eventId found for chatroom ${chatroomId}`);
        return false;
      }
      
      // Check if user is a participant (going or interested)
      const participant = await db.query.eventParticipants.findFirst({
        where: and(
          eq(eventParticipants.eventId, chatroom.eventId),
          eq(eventParticipants.userId, userId),
          or(
            eq(eventParticipants.status, 'going'),
            eq(eventParticipants.status, 'interested')
          )
        )
      });
      
      console.log(`🔍 EVENT CHAT: Participant check result:`, !!participant);
      return !!participant;
    }
    
    // For regular city/meetup chatrooms, check chatroomMembers table
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
