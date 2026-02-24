import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getProfileImageUrl } from "@/components/simple-avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, Heart, Reply, Copy, MoreVertical, Users, Volume2, VolumeX, Edit2, Trash2, Check, X, ThumbsUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getApiBaseUrl } from "@/lib/queryClient";

interface Message {
  id: number;
  senderId: number;
  content: string;
  messageType: string;
  replyToId?: number;
  reactions?: { [emoji: string]: number[] };
  createdAt: string;
  isEdited?: boolean;
  editedAt?: string;
  sender?: {
    id: number;
    username: string;
    name: string;
    profileImage?: string;
  };
  replyTo?: Message;
}

interface ChatMember {
  id: number;
  username: string;
  name: string;
  profileImage?: string;
  userType: string;
  hometownCity: string;
  isAdmin: boolean;
  joinedAt: string;
  isMuted?: boolean;
}

interface WhatsAppChatProps {
  chatId: number;
  chatType: 'chatroom' | 'event' | 'meetup' | 'dm';
  title: string;
  subtitle?: string;
  currentUserId?: number;
  onBack?: () => void;
  eventId?: number; // For event chats, this is the actual event ID (chatId is the chatroom ID)
}

export default function WhatsAppChat({ chatId, chatType, title, subtitle, currentUserId, onBack, eventId }: WhatsAppChatProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [muteDialogOpen, setMuteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ChatMember | null>(null);
  const [muteReason, setMuteReason] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [hasConnectedBefore, setHasConnectedBefore] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [swipingMessageId, setSwipingMessageId] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  
  // WhatsApp-style long press detection (500ms)
  const handleTouchStart = (e: React.TouchEvent, message: Message) => {
    console.log('Touch start on message:', message.id, 'senderId:', message.senderId, 'currentUserId:', currentUserId, 'isOwn:', message.senderId == currentUserId);
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    setSwipingMessageId(message.id);
    setSwipeOffset(0);
    
    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      console.log('Long press detected! Opening action menu for message:', message.id);
      // Vibrate if supported (haptic feedback)
      if (navigator.vibrate) navigator.vibrate(50);
      setSelectedMessage(message);
      touchStartRef.current = null;
    }, 500);
  };
  
  const handleTouchMove = (e: React.TouchEvent, message: Message, isOwn: boolean) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // Cancel long press if moved too much
    if (Math.abs(deltaX) > 10 || deltaY > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
    
    // Swipe right to reply (only for other's messages, or left for own messages)
    const swipeDirection = isOwn ? -1 : 1;
    const swipeAmount = deltaX * swipeDirection;
    
    if (swipeAmount > 0 && deltaY < 30) {
      // Limit swipe to 80px max
      setSwipeOffset(Math.min(swipeAmount, 80));
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent, message: Message) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Check if swipe was enough to trigger reply (> 60px)
    if (swipeOffset > 60) {
      setReplyingTo(message);
      if (navigator.vibrate) navigator.vibrate(30);
    }
    
    // Reset swipe state
    setSwipeOffset(0);
    setSwipingMessageId(null);
    touchStartRef.current = null;
  };
  
  // HTTP fallback for fetching messages when WebSocket sync fails
  const fetchMessagesViaHttp = async () => {
    if (messagesLoaded) return; // Already loaded
    
    console.log('📡 WhatsApp Chat: Fetching messages via HTTP fallback for chatId:', chatId, 'chatType:', chatType);
    try {
      let user: any = {};
      try { user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || '{}'); } catch { user = {}; }
      const uid = (currentUserId || user.id || '').toString();
      const headers: Record<string, string> = { 'x-user-id': uid };
      if (user?.id) headers['x-user-data'] = JSON.stringify({ id: user.id, username: user.username, email: user.email, name: user.name });
      const response = await fetch(`${getApiBaseUrl()}/api/chatrooms/${chatId}/messages?chatType=${chatType}&format=whatsapp`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.messages && Array.isArray(data.messages)) {
          console.log('📬 WhatsApp Chat: HTTP fallback loaded', data.messages.length, 'messages');
          setMessages(data.messages.reverse());
          setMessagesLoaded(true);
          scrollToBottom();
        }
      } else {
        console.warn('⚠️ WhatsApp Chat: HTTP fallback failed with status:', response.status);
      }
    } catch (error) {
      console.error('❌ WhatsApp Chat: HTTP fallback error:', error);
    }
  };

  // Fetch chatroom members (for city chatrooms, meetup chatrooms, and event chatrooms)
  const membersEndpoint = chatType === 'event' 
    ? `/api/event-chatrooms/${chatId}/members`
    : `/api/chatrooms/${chatId}/members`;
  
  const { data: members = [], error: membersError } = useQuery<ChatMember[]>({
    queryKey: [membersEndpoint],
    enabled: (chatType === 'chatroom' || chatType === 'meetup' || chatType === 'event') && Boolean(chatId)
  });
  
  // Check if current user is admin (use == for type coercion since currentUserId may be string)
  const currentMember = members.find(m => m.id == currentUserId);
  const isCurrentUserAdmin = currentMember?.isAdmin || false;
  
  // Mute user mutation
  const muteMutation = useMutation({
    mutationFn: async ({ targetUserId, reason }: { targetUserId: number, reason?: string }) => {
      const response = await fetch(`${getApiBaseUrl()}/api/chatrooms/${chatId}/mute`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId, reason }),
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUserId?.toString() || '' }
      });
      if (!response.ok) throw new Error('Failed to mute user');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "User muted successfully" });
      setMuteDialogOpen(false);
      setMuteReason("");
      queryClient.invalidateQueries({ queryKey: [membersEndpoint] });
    },
    onError: () => {
      toast({ title: "Failed to mute user", variant: "destructive" });
    }
  });
  
  // Unmute user mutation
  const unmuteMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      const response = await fetch(`${getApiBaseUrl()}/api/chatrooms/${chatId}/unmute`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUserId?.toString() || '' }
      });
      if (!response.ok) throw new Error('Failed to unmute user');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "User unmuted successfully" });
      queryClient.invalidateQueries({ queryKey: [membersEndpoint] });
    },
    onError: () => {
      toast({ title: "Failed to unmute user", variant: "destructive" });
    }
  });

  // Show error toast if members fetch fails
  useEffect(() => {
    if (membersError) {
      toast({
        title: "Unable to load members",
        description: "You may not have access to view this chatroom's members.",
        variant: "destructive"
      });
    }
  }, [membersError, toast]);

  // Filter members based on search
  const filteredMembers = members.filter(member => {
    if (!memberSearch) return true;
    const searchLower = memberSearch.toLowerCase();
    return (
      member.name?.toLowerCase().includes(searchLower) ||
      member.username?.toLowerCase().includes(searchLower) ||
      member.hometownCity?.toLowerCase().includes(searchLower)
    );
  });

  // Display username instead of real name for privacy
  const getFirstName = (fullName: string | null | undefined, username?: string): string => {
    // ALWAYS prioritize username over real name for privacy
    if (username && username.trim() !== '') {
      const trimmed = username.trim();
      // Capitalize first letter of username
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    }
    
    // Fallback to name only if username is missing
    if (!fullName || fullName.trim() === '') {
      return 'User';
    }
    
    const trimmedName = fullName.trim();
    
    // If it's a single word, use it
    if (!trimmedName.includes(' ')) {
      if (trimmedName === trimmedName.toUpperCase() || trimmedName === trimmedName.toLowerCase()) {
        return trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1).toLowerCase();
      }
      return trimmedName;
    }
    
    // If it has spaces, extract first name
    const parts = trimmedName.split(' ');
    return parts[0] || 'User';
  };

  // Initialize WebSocket connection with auto-reconnect
  useEffect(() => {
    if (!currentUserId || !chatId) return;
    
    // Reset messages state when chatId changes
    setMessages([]);
    setMessagesLoaded(false);
    
    // Immediately fetch messages via HTTP for fast initial display
    // WebSocket will update with real-time messages once connected
    const loadMessagesImmediately = async () => {
      try {
        let user: any = {};
        try { user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || '{}'); } catch { user = {}; }
        const uid = (currentUserId || user.id || '').toString();
        const headers: Record<string, string> = { 'x-user-id': uid };
        if (user?.id) headers['x-user-data'] = JSON.stringify({ id: user.id, username: user.username, email: user.email, name: user.name });
        const response = await fetch(`${getApiBaseUrl()}/api/chatrooms/${chatId}/messages?chatType=${chatType}&format=whatsapp`, {
          headers
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.messages && Array.isArray(data.messages)) {
            console.log('🚀 WhatsApp Chat: Immediate HTTP load:', data.messages.length, 'messages');
            setMessages(data.messages.reverse());
            setMessagesLoaded(true);
            scrollToBottom();
          }
        }
      } catch (error) {
        console.warn('⚠️ WhatsApp Chat: Immediate HTTP load failed, will use WebSocket:', error);
      }
    };
    loadMessagesImmediately();

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isCleaningUp = false;

    const connect = () => {
      if (isCleaningUp) return;
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🟢 WhatsApp Chat: WebSocket connected');
        let user: any = {};
        try { user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || '{}'); } catch { user = {}; }
        
        // Authenticate
        console.log('🔐 WhatsApp Chat: Authenticating with userId:', currentUserId, 'chatId:', chatId, 'chatType:', chatType);
        ws?.send(JSON.stringify({
          type: 'auth',
          userId: currentUserId,
          username: user.username
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('📨 WhatsApp Chat: Received WebSocket message:', data.type, 'for chatId:', chatId);

        switch (data.type) {
          case 'auth:success':
            console.log('✅ WhatsApp Chat: Authenticated, requesting message history for chatId:', chatId, 'chatType:', chatType);
            setIsWsConnected(true);
            setHasConnectedBefore(true);
            // Now request message history
            const historyRequest = {
              type: 'sync:history',
              chatType,
              chatroomId: chatId,
              payload: {}
            };
            console.log('📤 WhatsApp Chat: Sending sync:history request:', JSON.stringify(historyRequest));
            ws?.send(JSON.stringify(historyRequest));
            
            // Set a timeout to fetch via HTTP if sync:response doesn't arrive within 1 second
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            syncTimeoutRef.current = setTimeout(() => {
              console.log('⏱️ WhatsApp Chat: Sync timeout - falling back to HTTP');
              fetchMessagesViaHttp();
            }, 1000);
            break;

          case 'sync:response':
            console.log('📬 WhatsApp Chat: Received', data.payload?.messages?.length || 0, 'messages for chatId:', chatId);
            // Clear the HTTP fallback timeout since WebSocket sync succeeded
            if (syncTimeoutRef.current) {
              clearTimeout(syncTimeoutRef.current);
              syncTimeoutRef.current = null;
            }
            if (data.payload?.messages) {
              setMessages(data.payload.messages.reverse());
              setMessagesLoaded(true);
            } else {
              console.warn('⚠️ WhatsApp Chat: No messages array in sync:response payload');
            }
            scrollToBottom();
            break;

          case 'message:new':
            console.log('💬 WhatsApp Chat: New message received, chatType:', data.chatType, 'chatroomId:', data.chatroomId, 'expected chatType:', chatType, 'expected chatId:', chatId);
            if (data.chatType === chatType) {
              if (chatType === 'dm') {
                const msgSenderId = data.payload?.senderId || data.senderId;
                const msgReceiverId = data.payload?.receiverId;
                const isParticipant = 
                  (msgSenderId === currentUserId && msgReceiverId === chatId) ||
                  (msgSenderId === chatId && msgReceiverId === currentUserId);
                if (isParticipant) {
                  setMessages(prev => {
                    if (prev.some(m => m.id === data.payload.id)) return prev;
                    return [...prev, data.payload];
                  });
                  scrollToBottom();
                }
              } else if (data.chatroomId === chatId) {
                setMessages(prev => {
                  if (prev.some(m => m.id === data.payload.id)) return prev;
                  return [...prev, data.payload];
                });
                scrollToBottom();
              }
            }
            break;

          case 'message:edit':
            console.log('✏️ WhatsApp Chat: Message edited');
            setMessages(prev => prev.map(msg => 
              msg.id === data.payload.id
                ? { ...msg, ...data.payload, isEdited: true }
                : msg
            ));
            break;

          case 'message:delete':
            console.log('🗑️ WhatsApp Chat: Message deleted');
            setMessages(prev => prev.filter(msg => msg.id !== data.payload.messageId));
            break;

          case 'message:reaction':
            setMessages(prev => prev.map(msg => 
              msg.id === data.payload.messageId
                ? { ...msg, reactions: data.payload.reactions }
                : msg
            ));
            break;

          case 'typing:start':
            if (data.payload.userId !== currentUserId) {
              setTypingUsers(prev => new Set([...prev, data.payload.username]));
            }
            break;

          case 'typing:stop':
            if (data.payload.userId !== currentUserId) {
              setTypingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(data.payload.username);
                return newSet;
              });
            }
            break;

          case 'system:error':
            console.error('❌ WhatsApp Chat: Error:', data.payload.message);
            toast({
              title: "Error",
              description: data.payload.message,
              variant: "destructive"
            });
            break;
        }
      };

      ws.onclose = () => {
        console.log('🔴 WebSocket disconnected');
        setIsWsConnected(false);
        
        // Auto-reconnect after 2 seconds if not cleaning up
        if (!isCleaningUp) {
          console.log('🔄 Attempting WebSocket reconnection in 2 seconds...');
          reconnectTimeout = setTimeout(connect, 2000);
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
    };

    connect();

    return () => {
      isCleaningUp = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      if (ws) ws.close();
    };
  }, [currentUserId, chatId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 150);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const sendMessage = async () => {
    console.log('📤 sendMessage called:', { 
      messageText: messageText.trim(), 
      hasWs: !!wsRef.current, 
      wsReady: wsRef.current?.readyState === WebSocket.OPEN,
      currentUserId, 
      chatType,
      chatId
    });
    
    if (!messageText.trim() || !currentUserId) {
      console.log('❌ sendMessage blocked - missing text or userId');
      return;
    }

    const content = messageText.trim();
    const replyToId = replyingTo?.id;
    
    // Clear input immediately for responsive feel
    setMessageText("");
    setReplyingTo(null);

    // Try WebSocket first if available
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('✅ Sending message via WebSocket...');
      wsRef.current.send(JSON.stringify({
        type: 'message:new',
        chatType,
        chatroomId: chatId,
        payload: {
          content,
          messageType: 'text',
          replyToId
        }
      }));
      
      wsRef.current.send(JSON.stringify({
        type: 'typing:stop',
        chatType,
        chatroomId: chatId
      }));
    } else {
      // HTTP fallback when WebSocket not ready
      console.log('📡 Sending message via HTTP fallback...');
      try {
        let user: any = {};
        try { user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || '{}'); } catch { user = {}; }
        let endpoint = '';
        let body: any = { content, messageType: 'text', replyToId };
        
        if (chatType === 'dm') {
          // For DMs, use the direct messages endpoint (senderId required by API)
          endpoint = `${getApiBaseUrl()}/api/messages`;
          body = { senderId: currentUserId || user.id, receiverId: chatId, content, messageType: 'text', replyToId };
        } else {
          // For chatrooms/events/meetups
          endpoint = `${getApiBaseUrl()}/api/chatrooms/${chatId}/messages`;
        }
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': (currentUserId || user.id || '').toString()
          },
          body: JSON.stringify(body)
        });
        
        if (response.ok) {
          const resp = await response.json();
          const newMessage = resp.message || resp;
          console.log('✅ Message sent via HTTP:', newMessage);
          // Add optimistic update - message will be added to list (API returns { message, messageId } or { id, ... })
          if (newMessage && (newMessage.id ?? resp.messageId)) {
            const formattedMessage: Message = {
              id: newMessage.id ?? resp.messageId,
              senderId: currentUserId,
              content: newMessage.content,
              messageType: newMessage.messageType || 'text',
              replyToId: newMessage.replyToId,
              createdAt: newMessage.createdAt || new Date().toISOString(),
              sender: {
                id: currentUserId,
                username: user.username || 'You',
                name: user.name || 'You',
                profileImage: user.profileImage
              }
            };
            setMessages(prev => [...prev, formattedMessage]);
            scrollToBottom();
          }
        } else {
          console.error('❌ HTTP message send failed:', response.status);
          toast({ title: "Failed to send message", variant: "destructive" });
          // Restore the message text so user can try again
          setMessageText(content);
        }
      } catch (error) {
        console.error('❌ HTTP message send error:', error);
        toast({ title: "Failed to send message", variant: "destructive" });
        setMessageText(content);
      }
    }
    
    // Auto-focus input after sending so user can immediately type next message
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleTyping = (text: string) => {
    setMessageText(text);

    if (!wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: 'typing:start',
      chatType,
      chatroomId: chatId
    }));

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      wsRef.current?.send(JSON.stringify({
        type: 'typing:stop',
        chatType,
        chatroomId: chatId
      }));
    }, 3000);
  };

  const handleReaction = (messageId: number, emoji: string) => {
    console.log('👍 handleReaction called:', { messageId, emoji, hasWs: !!wsRef.current, currentUserId });
    if (!wsRef.current || !currentUserId) {
      console.log('👍 handleReaction early exit - missing ws or userId');
      return;
    }

    // Optimistic update - immediately update local state
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      
      const reactions = { ...(msg.reactions || {}) };
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }
      
      // Toggle reaction
      const userIndex = reactions[emoji].indexOf(currentUserId);
      if (userIndex > -1) {
        reactions[emoji] = reactions[emoji].filter((id: number) => id !== currentUserId);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...reactions[emoji], currentUserId];
      }
      
      return { ...msg, reactions };
    }));

    // Send to server (will broadcast to other users)
    wsRef.current.send(JSON.stringify({
      type: 'message:reaction',
      chatType,
      chatroomId: chatId,
      payload: { messageId, emoji }
    }));
    setSelectedMessage(null);
  };

  const handleEditMessage = async (messageId: number) => {
    if (!editText.trim()) return;
    
    try {
      // Use different endpoint for DMs vs chatrooms
      const endpoint = chatType === 'dm' 
        ? `/api/messages/${messageId}` 
        : `/api/chatroom-messages/${messageId}`;
      
      await apiRequest('PATCH', endpoint, {
        content: editText.trim(),
        userId: currentUserId
      });
      
      // Update local state immediately for instant feedback
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, content: editText.trim(), isEdited: true } : m
      ));
      
      toast({ title: "Message edited successfully" });
      setEditingMessageId(null);
      setEditText("");
    } catch (error: any) {
      toast({ title: "Failed to edit message", variant: "destructive" });
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    // Close the menu first
    setSelectedMessage(null);
    
    try {
      // Use different endpoint for DMs vs chatrooms
      const endpoint = chatType === 'dm' 
        ? `/api/messages/${messageId}` 
        : `/api/chatroom-messages/${messageId}`;
      
      const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUserId?.toString() || '' 
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete message');
      
      // Remove from local state immediately for instant feedback
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast({ title: "Message deleted" });
    } catch (error: any) {
      toast({ title: "Failed to delete message", variant: "destructive" });
    }
  };

  const startEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditText(message.content);
    setSelectedMessage(null);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const formatTimestamp = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="flex bg-gray-900 text-white overflow-hidden h-[calc(100dvh-5.5rem)] md:h-[calc(100dvh-5.5rem)]">
      {/* Desktop Members Sidebar - Always visible on lg+ screens, positioned on LEFT */}
      {(chatType === 'chatroom' || chatType === 'meetup' || chatType === 'event') && (
        <div className="hidden lg:flex lg:flex-col lg:w-[320px] bg-gray-800 border-r border-gray-700">
          <div className="px-4 py-3 border-b border-gray-700">
            <h2 className="font-semibold text-sm text-white mb-2">Members ({members.length})</h2>
            <input
              type="text"
              placeholder="Search members..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
            {filteredMembers.length === 0 ? (
              <p className="text-center text-gray-400 py-4 text-sm">No members found</p>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div
                    onClick={() => {
                      localStorage.setItem('returnToChat', JSON.stringify({
                        chatId,
                        chatType,
                        title,
                        subtitle,
                        eventId,
                        timestamp: Date.now()
                      }));
                      navigate(`/profile/${member.id}`);
                    }}
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={getProfileImageUrl(member) || undefined} />
                      <AvatarFallback className="bg-green-600 text-white text-sm">
                        {getFirstName(member.name, member.username)[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate text-white">
                        {getFirstName(member.name, member.username)}
                        {member.isAdmin && <span className="ml-2 text-xs text-green-400">Admin</span>}
                        {member.isMuted && <span className="ml-2 text-xs text-red-400">Muted</span>}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{member.hometownCity || 'Unknown'}</p>
                    </div>
                  </div>
                  {isCurrentUserAdmin && member.id !== currentUserId && (
                    <div onClick={(e) => e.stopPropagation()}>
                      {member.isMuted ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-gray-600"
                          onClick={() => unmuteMutation.mutate(member.id)}
                          disabled={unmuteMutation.isPending}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-gray-600"
                          onClick={() => {
                            setSelectedMember(member);
                            setMuteDialogOpen(true);
                          }}
                        >
                          <VolumeX className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
      {/* Header - compact padding on desktop; smaller title with truncation; no header avatars on desktop (sidebar shows members) */}
      <div className={`flex items-center gap-2 px-2 bg-gray-800 border-b border-gray-700 min-w-0 ${isNativeIOSApp() ? 'py-1.5 md:py-2' : 'py-1 lg:py-1.5'}`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onBack ? onBack() : window.history.back()}
          className="text-white hover:bg-gray-700 h-8 w-8 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        
        {/* WhatsApp-style member avatars for chatrooms, meetups, and events */}
        {(chatType === 'chatroom' || chatType === 'meetup' || chatType === 'event') && members.length > 0 && (
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((member, index) => (
              <div
                key={member.id}
                onClick={() => {
                  // Store chat return info before navigating
                  localStorage.setItem('returnToChat', JSON.stringify({
                    chatId,
                    chatType,
                    title,
                    subtitle,
                    eventId,
                    timestamp: Date.now() // For event chats, store the eventId so we can navigate back properly
                  }));
                  navigate(`/profile/${member.id}`);
                }}
                className="cursor-pointer hover:scale-110 transition-transform duration-200"
                data-testid={`avatar-member-${member.id}`}
              >
                <Avatar className="w-8 h-8 border-2 border-gray-800">
                  <AvatarImage src={getProfileImageUrl(member) || undefined} />
                  <AvatarFallback className="bg-green-600 text-white text-[10px]">
                    {getFirstName(member.name, member.username)[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
            ))}
            {members.length > 4 && (
              <div 
                onClick={() => setShowMembers(true)}
                className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
                data-testid="button-more-members"
              >
                <span className="text-[10px] text-gray-300">+{members.length - 4}</span>
              </div>
            )}
          </div>
        )}
        
        <div className="flex-1 min-w-0 overflow-hidden max-w-[140px] xs:max-w-[180px] sm:max-w-[220px] md:max-w-[260px]">
          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            <h1
              className="font-semibold flex-1 min-w-0 truncate text-sm"
              title={title || 'Chat'}
            >
              {title || 'Chat'}
            </h1>
            {/* Show green once messages are loaded (chat is usable), not just WebSocket */}
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              messagesLoaded || isWsConnected 
                ? 'bg-green-500' 
                : 'bg-yellow-500 animate-pulse'
            }`} 
                  title={messagesLoaded || isWsConnected ? 'Ready' : 'Loading...'} />
          </div>
          {subtitle && (
            <p className="text-gray-400 truncate leading-tight text-xs min-w-0">
              {subtitle}
            </p>
          )}
        </div>
        {(chatType === 'chatroom' || chatType === 'meetup' || chatType === 'event') && (
          <Sheet open={showMembers} onOpenChange={setShowMembers}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-gray-700 h-8 w-8" data-testid="button-members">
                <Users className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-gray-900 border-l border-gray-700 text-white w-80">
              <SheetHeader>
                <SheetTitle className="text-white">Members ({members.length})</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Search members..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                  data-testid="input-member-search"
                />
              </div>
              <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-180px)]">
                {filteredMembers.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">No members found</p>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors"
                      data-testid={`member-item-${member.id}`}
                    >
                      <div 
                        onClick={() => {
                          setShowMembers(false);
                          setMemberSearch("");
                          // Store chat return info before navigating
                          localStorage.setItem('returnToChat', JSON.stringify({
                            chatId,
                            chatType,
                            title,
                            subtitle,
                            eventId,
                            timestamp: Date.now() // For event chats, store the eventId so we can navigate back properly
                          }));
                          navigate(`/profile/${member.id}`);
                        }}
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={getProfileImageUrl(member) || undefined} />
                          <AvatarFallback className="bg-green-600 text-white">
                            {getFirstName(member.name, member.username)[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {getFirstName(member.name, member.username)}
                            {member.isAdmin && <span className="ml-2 text-xs text-green-400">Admin</span>}
                            {member.isMuted && <span className="ml-2 text-xs text-red-400">Muted</span>}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{member.hometownCity || 'Unknown'}</p>
                        </div>
                      </div>
                      {isCurrentUserAdmin && member.id !== currentUserId && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {member.isMuted ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-green-400 hover:text-green-300 hover:bg-gray-700"
                              onClick={() => unmuteMutation.mutate(member.id)}
                              disabled={unmuteMutation.isPending}
                              data-testid={`button-unmute-${member.id}`}
                            >
                              <Volume2 className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-red-400 hover:text-red-300 hover:bg-gray-700"
                              onClick={() => {
                                setSelectedMember(member);
                                setMuteDialogOpen(true);
                              }}
                              data-testid={`button-mute-${member.id}`}
                            >
                              <VolumeX className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
        )}
        <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700 h-8 w-8">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages - Flex wrapper ensures proper spacing */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Scrollable messages area */}
        <div className="flex-1 overflow-y-auto px-3 py-2 bg-[#e5ddd5] dark:bg-[#0b141a]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 800 800'%3E%3Cg fill='none' stroke='%23999999' stroke-width='2' opacity='0.18'%3E%3Ccircle cx='100' cy='100' r='50'/%3E%3Cpath d='M200 200 L250 250 M250 200 L200 250'/%3E%3Crect x='350' y='50' width='80' height='80' rx='10'/%3E%3Cpath d='M500 150 Q550 100 600 150 T700 150'/%3E%3Ccircle cx='150' cy='300' r='30'/%3E%3Cpath d='M300 350 L320 380 L340 340 L360 380 L380 340'/%3E%3Crect x='450' y='300' width='60' height='100' rx='30'/%3E%3Cpath d='M600 350 L650 300 L700 350 Z'/%3E%3Ccircle cx='100' cy='500' r='40'/%3E%3Cpath d='M250 500 C250 450 350 450 350 500 S250 550 250 500'/%3E%3Crect x='450' y='480' width='70' height='70' rx='15'/%3E%3Cpath d='M600 500 L650 520 L670 470 L620 450 Z'/%3E%3Ccircle cx='150' cy='700' r='35'/%3E%3Cpath d='M300 680 Q350 650 400 680'/%3E%3Crect x='500' y='650' width='90' height='60' rx='8'/%3E%3Cpath d='M150 150 L180 180 M180 150 L150 180'/%3E%3C/g%3E%3C/svg%3E")`
        }}>
          <div className="flex flex-col min-h-full">
            <div className="flex-grow" />
            <div className="space-y-2">
            {messages.map((message, index) => {
              // Use == for type-coerced comparison since currentUserId from localStorage may be string
              const isOwnMessage = message.senderId == currentUserId;
              const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
              
              return (
                <div key={message.id} className={`flex gap-1.5 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  {!isOwnMessage && (
                    <Avatar 
                      className={`w-7 h-7 ${showAvatar ? 'visible' : 'invisible'} cursor-pointer hover:ring-2 hover:ring-green-400 transition-all`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (message.sender?.id) {
                          navigate(`/profile/${message.sender.id}`);
                        }
                      }}
                    >
                      <AvatarImage src={getProfileImageUrl(message.sender) || undefined} />
                      <AvatarFallback className="text-xs">{message.sender?.name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                  )}

                  <div 
                    className={`chat-message-container relative max-w-[75%] ${isOwnMessage ? 'mr-2' : 'ml-2'}`}
                    style={{ 
                      WebkitTapHighlightColor: 'rgba(255, 165, 0, 0.2)',
                      WebkitUserSelect: 'none',
                      userSelect: 'none',
                      touchAction: 'pan-y',
                      transform: swipingMessageId === message.id ? `translateX(${isOwnMessage ? -swipeOffset : swipeOffset}px)` : 'none',
                      transition: swipingMessageId === message.id ? 'none' : 'transform 0.2s ease-out',
                      cursor: 'pointer'
                    }}
                    onTouchStart={(e) => handleTouchStart(e, message)}
                    onTouchMove={(e) => handleTouchMove(e, message, isOwnMessage)}
                    onTouchEnd={(e) => handleTouchEnd(e, message)}
                    onDoubleClick={() => {
                      console.log('Double-click on message (desktop):', message.id);
                      setSelectedMessage(message);
                    }}
                    data-testid={`message-${message.id}`}
                  >
                    {/* Swipe reply indicator */}
                    {swipingMessageId === message.id && swipeOffset > 20 && (
                      <div 
                        className={`absolute top-1/2 -translate-y-1/2 ${isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'}`}
                        style={{ opacity: Math.min(swipeOffset / 60, 1) }}
                      >
                        <div className={`w-8 h-8 rounded-full bg-green-600 flex items-center justify-center ${swipeOffset > 60 ? 'scale-110' : ''}`}>
                          <Reply className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    {message.replyToId && message.replyTo && (
                      <div className={`mb-1 px-3 py-2 rounded-t-lg border-l-4 ${isOwnMessage ? 'bg-green-900/80 border-green-300' : 'bg-gray-600/80 border-green-500'}`}>
                        <p className={`text-xs font-bold mb-0.5 ${isOwnMessage ? 'text-green-200' : 'text-green-400'}`}>
                          ↩ Replying to {getFirstName(message.replyTo.sender?.name, message.replyTo.sender?.username)}
                        </p>
                        <p className={`text-xs ${isOwnMessage ? 'text-green-100/90' : 'text-gray-200'} truncate italic`}>
                          "{message.replyTo.content}"
                        </p>
                      </div>
                    )}

                    {editingMessageId === message.id ? (
                      <div 
                        className={`px-3 py-2 rounded-2xl chat-message-bubble ${message.replyToId ? 'rounded-tl-none' : ''}`}
                        style={{ backgroundColor: isOwnMessage ? '#10b981' : '#374151', border: 'none' }}
                      >
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full mb-2 bg-gray-800 border-gray-600 text-white resize-none"
                          rows={3}
                          data-testid="textarea-edit-message"
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleEditMessage(message.id)} 
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEditMessage(message.id);
                            }}
                            className="bg-green-600 hover:bg-green-700" 
                            style={{ touchAction: 'manipulation' }}
                            data-testid="button-save-edit"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={cancelEdit}
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              cancelEdit();
                            }}
                            style={{ touchAction: 'manipulation' }}
                            data-testid="button-cancel-edit"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`px-3 py-1.5 rounded-2xl chat-message-bubble ${message.replyToId ? 'rounded-tl-none' : ''}`}
                        style={{ 
                          backgroundColor: isOwnMessage ? '#10b981' : '#374151', 
                          color: '#ffffff',
                          border: 'none'
                        }}
                      >
                        {!isOwnMessage && showAvatar && (
                          <p 
                            className="text-xs font-semibold mb-0.5 cursor-pointer hover:underline" 
                            style={{ color: '#4ade80' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (message.sender?.id) {
                                navigate(`/profile/${message.sender.id}`);
                              }
                            }}
                          >
                            {getFirstName(message.sender?.name, message.sender?.username)}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="text-[10px] opacity-70">{formatTimestamp(message.createdAt)}</span>
                          {message.isEdited && <span className="text-[10px] opacity-60 italic" data-testid="text-edited-indicator">Edited</span>}
                        </div>
                      </div>
                    )}

                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                      <div className="flex gap-1 mt-1 ml-2">
                        {Object.entries(message.reactions).map(([emoji, users]) => (
                          <div key={emoji} className="flex items-center gap-1 px-2 py-0.5 bg-gray-800 rounded-full text-xs">
                            <span>{emoji}</span>
                            <span className="text-gray-400">{users.length}</span>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Fixed footer area - outside scrollable div */}
        {typingUsers.size > 0 && (
          <div className="px-3 py-1 text-xs text-gray-400 bg-gray-800">
            {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        {replyingTo && (
          <div className="px-3 py-1.5 bg-gray-800 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-green-400 font-semibold">Replying to {getFirstName(replyingTo.sender?.name, replyingTo.sender?.username)}</p>
                <p className="text-xs text-gray-300 truncate">{replyingTo.content}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="text-gray-400 h-6 w-6 p-0">✕</Button>
            </div>
          </div>
        )}

        {/* Input box - fixed at bottom, padding above bottom nav */}
        <div className="px-3 py-1.5 pb-20 bg-gray-800 border-t border-gray-700">
          {/* Connection status - only show briefly if not connected AND no messages loaded */}
          {!messagesLoaded && !isWsConnected && (
            <div className="text-center text-yellow-400 text-xs mb-2 animate-pulse">
              Loading...
            </div>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              ref={inputRef}
              value={messageText}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Message"
              className="flex-1 min-h-[36px] max-h-[100px] bg-gray-700 border-gray-600 text-white resize-none rounded-full px-3 py-2 text-sm"
              rows={1}
              disabled={!messagesLoaded && !isWsConnected}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!messageText.trim() || !currentUserId || (!messagesLoaded && !isWsConnected)} 
              size="icon" 
              className={`rounded-full h-9 w-9 shrink-0 ${
                !currentUserId || (!messagesLoaded && !isWsConnected)
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              title={!currentUserId ? 'Not logged in' : 'Send message'}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      </div>
      
      {/* Mute Dialog */}
      <Dialog open={muteDialogOpen} onOpenChange={setMuteDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Mute Member</DialogTitle>
            <DialogDescription>
              Mute {selectedMember?.username} from sending messages in this chatroom.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="mute-reason">Reason (optional)</Label>
              <Input
                id="mute-reason"
                placeholder="Enter reason for muting..."
                value={muteReason}
                onChange={(e) => setMuteReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMuteDialogOpen(false);
                setMuteReason("");
                setSelectedMember(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedMember) {
                  const params: { targetUserId: number, reason?: string } = { 
                    targetUserId: selectedMember.id
                  };
                  if (muteReason.trim()) {
                    params.reason = muteReason.trim();
                  }
                  muteMutation.mutate(params);
                }
              }}
              disabled={muteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {muteMutation.isPending ? 'Muting...' : 'Mute User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Action Menu - Portal rendered at body level for proper iOS fixed positioning */}
      {selectedMessage && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/95 z-[99998]"
            onClick={() => setSelectedMessage(null)}
            style={{ touchAction: 'auto' }}
          />
          {/* Bottom Sheet Menu - positioned above bottom nav */}
          <div 
            className="fixed left-2 right-2 bg-gray-800 rounded-2xl shadow-2xl z-[99999] border border-gray-700"
            style={{ touchAction: 'auto', bottom: '90px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Action buttons */}
            <div className="px-2 py-3 space-y-1">
              {/* Thumbs up reaction - available for ALL messages */}
              {(() => {
                const hasLiked = currentUserId ? selectedMessage.reactions?.['👍']?.includes(currentUserId) : false;
                return (
                  <button 
                    type="button" 
                    onTouchEnd={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      handleReaction(selectedMessage.id, '👍');
                    }}
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      handleReaction(selectedMessage.id, '👍');
                    }}
                    className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-700 active:bg-gray-600 rounded-xl text-white"
                    style={{ touchAction: 'manipulation', cursor: 'pointer', WebkitTapHighlightColor: 'rgba(59, 130, 246, 0.3)' }}
                    data-testid="button-react-thumbsup"
                  >
                    <ThumbsUp className={`w-5 h-5 pointer-events-none ${hasLiked ? 'text-orange-400 fill-orange-400' : 'text-blue-400'}`} />
                    <span className="text-sm pointer-events-none">{hasLiked ? 'Unlike' : 'Like'}</span>
                  </button>
                );
              })()}
              
              {selectedMessage.senderId == currentUserId ? (
                /* YOUR OWN MESSAGE: Edit and Delete */
                <>
                  <button 
                    type="button" 
                    onTouchEnd={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Edit TOUCH for message:', selectedMessage.id);
                      startEdit(selectedMessage); 
                      setSelectedMessage(null);
                    }}
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Edit CLICK for message:', selectedMessage.id);
                      startEdit(selectedMessage); 
                      setSelectedMessage(null);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-700 active:bg-gray-600 rounded-xl text-white"
                    style={{ touchAction: 'manipulation', cursor: 'pointer', WebkitTapHighlightColor: 'rgba(59, 130, 246, 0.3)' }}
                    data-testid="button-edit-message"
                  >
                    <Edit2 className="w-5 h-5 text-blue-400 pointer-events-none" />
                    <span className="text-sm pointer-events-none">Edit</span>
                  </button>
                  <button 
                    type="button" 
                    onTouchEnd={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Delete TOUCH for message:', selectedMessage.id);
                      handleDeleteMessage(selectedMessage.id); 
                    }}
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Delete CLICK for message:', selectedMessage.id);
                      handleDeleteMessage(selectedMessage.id); 
                    }}
                    className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-700 active:bg-gray-600 rounded-xl text-white"
                    style={{ touchAction: 'manipulation', cursor: 'pointer', WebkitTapHighlightColor: 'rgba(239, 68, 68, 0.3)' }}
                    data-testid="button-delete-message"
                  >
                    <Trash2 className="w-5 h-5 text-red-400 pointer-events-none" />
                    <span className="text-sm pointer-events-none">Delete</span>
                  </button>
                </>
              ) : (
                /* OTHER PERSON'S MESSAGE: Reply */
                <button 
                  type="button" 
                  onTouchEnd={(e) => { 
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Reply TOUCH for message:', selectedMessage.id);
                    setReplyingTo(selectedMessage); 
                    setSelectedMessage(null); 
                  }}
                  onClick={(e) => { 
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Reply CLICK for message:', selectedMessage.id);
                    setReplyingTo(selectedMessage); 
                    setSelectedMessage(null); 
                  }}
                  className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-700 active:bg-gray-600 rounded-xl text-white"
                  style={{ touchAction: 'manipulation', cursor: 'pointer', WebkitTapHighlightColor: 'rgba(34, 197, 94, 0.3)' }}
                  data-testid="button-reply-message"
                >
                  <Reply className="w-5 h-5 text-green-400 pointer-events-none" />
                  <span className="text-sm pointer-events-none">Reply</span>
                </button>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
