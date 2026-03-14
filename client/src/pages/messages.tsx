import React, { useState, useEffect, useRef, useContext } from 'react';
import { createPortal } from 'react-dom';
import { abbreviateCity } from '@/lib/displayName';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChatInput } from '@/components/ui/chat-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, Users, ArrowLeft, Heart, Reply, Copy, Edit2, Trash2, Check, X, ThumbsUp, Clock, Zap } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import WhatsAppChat from '@/components/WhatsAppChat';
import TypingIndicator from '@/components/instant-messaging/TypingIndicator';
import { apiRequest, getApiBaseUrl } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { SimpleAvatar, getProfileImageUrl } from '@/components/simple-avatar';
import websocketService from '@/services/websocketService';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { UniversalBackButton } from '@/components/UniversalBackButton';
import { isNativeIOSApp } from '@/lib/nativeApp';
import { AuthContext } from '@/App';
import { FullPageSkeleton } from '@/components/FullPageSkeleton';

/** Returns the active travel destination city for a user, or null if not traveling.
 *  Uses date-based detection so it works even when isCurrentlyTraveling flag isn't synced.
 *  Prefers destinationCity over the less-reliable travelDestination text field. */
function getActiveTravelDest(user: any): string | null {
  if (!user) return null;
  const dest = user.destinationCity || user.travelDestination?.split(',')[0]?.trim() || null;
  if (!dest) return null;
  const now = new Date();
  if (user.travelEndDate && new Date(user.travelEndDate) < now) return null;
  if (user.travelStartDate && new Date(user.travelStartDate) > now) return null;
  return dest;
}

function getReplyPreviewText(msg: any): string {
  if (!msg) return '';
  const raw =
    (typeof msg.content === 'string' ? msg.content : null) ??
    (typeof msg.message === 'string' ? msg.message : null) ??
    (typeof msg.text === 'string' ? msg.text : null) ??
    '';
  const trimmed = String(raw || '').trim();
  if (trimmed) return trimmed;
  // If the message is media-only, show a stable label instead of a date/placeholder.
  if (msg.mediaUrl || msg.messageType === 'image' || msg.messageType === 'photo') return 'Photo';
  return '';
}

function getInitialTargetUserId(): number | null {
  try {
    const loc = window.location;
    const parts = loc.pathname.split('/');
    const pathId = parts[2];
    if (pathId && !isNaN(parseInt(pathId))) return parseInt(pathId);
    const params = new URLSearchParams(loc.search);
    const qId = params.get('userId') || params.get('user');
    if (qId && !isNaN(parseInt(qId))) return parseInt(qId);
  } catch {}
  return null;
}

function getInitialMeetupChatId(): number | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const mcId = params.get('meetupChat');
    if (mcId && !isNaN(parseInt(mcId))) return parseInt(mcId);
  } catch {}
  return null;
}

function getStoredUser() {
  return null;
}

export default function Messages() {
  const authContext = useContext(AuthContext);
  const contextUser = authContext?.user;
  const [resolvedUser, setResolvedUser] = useState<any>(contextUser || getStoredUser() || {});

  useEffect(() => {
    if (contextUser?.id) {
      setResolvedUser(contextUser);
      return;
    }
    const stored = getStoredUser();
    if (stored?.id) {
      setResolvedUser(stored);
      return;
    }
  }, [contextUser?.id]);

  const user = resolvedUser;
  const userId = Number(user?.id) || null;
  const hasUser = !!userId;

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log("📨 Messages: resolved user id", { rawId: user?.id, userId, rawType: typeof user?.id });
  }, [userId]);
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(getInitialTargetUserId);
  const [selectedMeetupChat, setSelectedMeetupChat] = useState<number | null>(getInitialMeetupChatId);
  const [newMessage, setNewMessage] = useState('');
  const prefillAppliedRef = useRef(false);
  const [connectionSearch, setConnectionSearch] = useState('');
  const [countdownTick, setCountdownTick] = useState(0);
  const [instantMessages, setInstantMessages] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [dismissTarget, setDismissTarget] = useState<{ type: 'meetup' | 'dm'; id: number; name: string } | null>(null);
  const [dismissedDMs, setDismissedDMs] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('nt_dismissed_dms') || '[]'); } catch { return []; }
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  
  // Long-press detection for iOS (500ms like WhatsApp)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  
  const handleMessageTouchStart = (e: React.TouchEvent, msg: any) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    
    longPressTimerRef.current = setTimeout(() => {
      console.log('Long press detected on message:', msg.id);
      if (navigator.vibrate) navigator.vibrate(50);
      setSelectedMessage(msg);
    }, 500);
  };
  
  const handleMessageTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);
    if (dx > 10 || dy > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };
  
  const handleMessageTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartRef.current = null;
  };
  
  // Get target user ID from URL - supports both path (/messages/123) and query (?userId=123)
  const [location] = useLocation();
  const urlParts = location.split('/');
  const pathUserId = urlParts[2]; // /messages/:userId
  
  // Also check for query parameters (?userId=123 or ?user=123)
  const urlParams = new URLSearchParams(window.location.search);
  const queryUserId = urlParams.get('userId') || urlParams.get('user');
  
  // Use path format first, fall back to query parameter
  const targetUserId = pathUserId || queryUserId;

  // Prefill draft message from URL (?prefill=...)
  useEffect(() => {
    if (prefillAppliedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get('prefill');
    if (!prefill) return;
    if (prefill.trim().length > 0) {
      setNewMessage(prefill);
      prefillAppliedRef.current = true;
    }
    // Remove prefill from URL so refresh doesn't re-apply
    params.delete('prefill');
    const qs = params.toString();
    const nextUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash || ''}`;
    window.history.replaceState({}, '', nextUrl);
  }, [selectedConversation, targetUserId]);

  const { data: connections = [], isLoading: connectionsLoading } = useQuery({
    queryKey: ['/api/connections', userId],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/connections/${user.id}`, {
        credentials: 'include',
        headers: { 'x-user-id': String(userId) },
      });
      if (!res.ok) throw new Error('Failed to fetch connections');
      return res.json();
    },
    enabled: !!userId,
    staleTime: 60000,
    gcTime: 300000,
    placeholderData: (previousData: any) => previousData,
  });

  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/messages', userId],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/messages/${userId}`, {
        credentials: 'include',
        headers: { 'x-user-id': String(userId) },
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!userId,
    staleTime: 0,
    gcTime: 300000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
    placeholderData: (previousData: any) => previousData,
  });

  const { data: meetupChatrooms = [], isLoading: meetupChatsLoading } = useQuery({
    queryKey: ['/api/meetup-chatrooms/mine'],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/meetup-chatrooms/mine`, {
        credentials: 'include',
        headers: { 'x-user-id': String(userId) },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId,
    staleTime: 30000,
    refetchInterval: 30000,
  });

  const { data: meetupChatMessages = [], refetch: refetchMeetupMessages } = useQuery({
    queryKey: ['/api/meetup-chat-messages', selectedMeetupChat],
    queryFn: async () => {
      if (!selectedMeetupChat) return [];
      const res = await fetch(`${getApiBaseUrl()}/api/available-now/group-chat/${selectedMeetupChat}/messages`, {
        credentials: 'include',
        headers: { 'x-user-id': String(userId) },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId && !!selectedMeetupChat,
    staleTime: 5000,
    refetchInterval: 5000,
  });

  const sendMeetupMessageMutation = useMutation({
    mutationFn: async ({ chatroomId, message }: { chatroomId: number; message: string }) => {
      const res = await fetch(`${getApiBaseUrl()}/api/available-now/group-chat/${chatroomId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-user-id': String(userId) },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: () => {
      setNewMessage('');
      refetchMeetupMessages();
    },
    onError: () => {
      toast({ title: "Message failed to send", variant: "destructive" });
    },
  });

  const dismissMeetupChatMutation = useMutation({
    mutationFn: async (chatroomId: number) => {
      const res = await fetch(`${getApiBaseUrl()}/api/meetup-chatrooms/${chatroomId}/dismiss`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-user-id': String(userId) },
      });
      if (!res.ok) throw new Error('Failed to dismiss');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetup-chatrooms/mine'] });
      setDismissTarget(null);
      toast({ title: "Chat removed from your inbox" });
    },
    onError: () => {
      toast({ title: "Failed to remove chat", variant: "destructive" });
    },
  });

  const confirmDismiss = () => {
    if (!dismissTarget) return;
    if (dismissTarget.type === 'meetup') {
      dismissMeetupChatMutation.mutate(dismissTarget.id);
    } else {
      const updated = [...dismissedDMs, dismissTarget.id];
      setDismissedDMs(updated);
      try { localStorage.setItem('nt_dismissed_dms', JSON.stringify(updated)); } catch {}
      if (selectedConversation === dismissTarget.id) setSelectedConversation(null);
      setDismissTarget(null);
      toast({ title: "Conversation removed from your inbox" });
    }
  };

  useEffect(() => {
    if (!selectedMeetupChat || (meetupChatrooms as any[]).length === 0) return;
    const activeChatroom = (meetupChatrooms as any[]).find((c: any) => c.id === selectedMeetupChat);
    if (!activeChatroom?.expiresAt || activeChatroom.isExpired) return;
    const interval = setInterval(() => setCountdownTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, [selectedMeetupChat, meetupChatrooms]);

  useEffect(() => {
    const mcParam = getInitialMeetupChatId();
    if (mcParam) {
      setSelectedMeetupChat(mcParam);
      setSelectedConversation(null);
    }
  }, []);

  // When the user opens the Messages page, mark ALL received messages as read on the server
  // so badges clear to 0 across navbar/bottom-nav/notification bell.
  useEffect(() => {
    if (!userId) return;
    apiRequest("POST", `/api/messages/${userId}/mark-all-read`)
      .then(() => {
        // Only invalidate unread-count badge — do NOT invalidate the full messages list
        // (invalidating it triggers a refetch that shows the spinner every time Messages opens)
        queryClient.invalidateQueries({ queryKey: ["/api/messages", userId, "unread-count"] });
      })
      .catch(() => {
        // Non-fatal: badges will still clear once individual threads are marked read
      });
  }, [userId]);

  // CRITICAL: Handle mobile app resume - reconnect WebSocket and refetch messages
  useEffect(() => {
    if (!userId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 App resumed - reconnecting WebSocket and refreshing messages');
        websocketService.ensureConnected().catch(console.error);
        refetchMessages();
      }
    };

    const handleFocus = () => {
      console.log('📱 Window focus - ensuring WebSocket connected');
      websocketService.ensureConnected().catch(console.error);
      refetchMessages();
    };

    // Listen for visibility changes (mobile background/foreground)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Listen for window focus (desktop tab switch, mobile app switch)
    window.addEventListener('focus', handleFocus);

    // Initial connection check when component mounts
    websocketService.ensureConnected().catch(console.error);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [userId, refetchMessages]);

  // Debug: Log messages data
  React.useEffect(() => {
    const messagesArray = messages as any[];
    console.log('Messages data updated:', messagesArray?.length || 0, 'messages');
    if (messagesArray && messagesArray.length > 0) {
      console.log('📧 All messages:', messagesArray);
      console.log('📧 Message senders/receivers:', messagesArray.map((m: any) => ({ senderId: m.senderId, receiverId: m.receiverId, content: m.content?.substring(0, 50) })));
    }
  }, [messages]);

  // Initialize WebSocket connection and instant messaging
  useEffect(() => {
    if (!userId) return;

    // Connect to WebSocket
    websocketService.connect(userId, user.username);

    // Set up instant message handlers
    const handleInstantMessage = (data: any) => {
      console.log('📥 Received instant message:', data);
      const msg = data.message || data.payload?.message;
      if (msg) {
        setInstantMessages(prev => [...prev, {
          id: msg.id || Date.now(),
          senderId: msg.senderId,
          receiverId: user.id,
          content: msg.content,
          createdAt: msg.createdAt || msg.timestamp || new Date().toISOString(),
          messageType: msg.messageType || 'text',
          mediaUrl: msg.mediaUrl || null,
        }]);
      }
      // Refetch messages so the DM list shows updated unread count immediately
      setTimeout(() => refetchMessages(), 300);
    };

    // Register event handlers
    websocketService.on('instant_message_received', handleInstantMessage);

    return () => {
      websocketService.off('instant_message_received', handleInstantMessage);
    };
  }, [userId, refetchMessages]);

  // Scroll to BOTTOM to show newest messages and text box
  useEffect(() => {
    if ((selectedConversation || selectedMeetupChat) && messagesContainerRef.current) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [selectedConversation, selectedMeetupChat, meetupChatMessages]);

  // Add/remove is-chat-page class on body when a DM or meetup chat is open on mobile ONLY.
  // On desktop both navbars stay visible — only mobile needs fullscreen chat treatment.
  useEffect(() => {
    const isChatOpen = !!(selectedConversation || selectedMeetupChat);
    if (isChatOpen && window.innerWidth < 768) {
      document.body.classList.add('is-chat-page');
    } else {
      document.body.classList.remove('is-chat-page');
    }
    return () => {
      document.body.classList.remove('is-chat-page');
    };
  }, [selectedConversation, selectedMeetupChat]);

  // Fetch all users for name lookup
  const { data: allUsers = [] } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 60000
  });

  // Build conversations list
  const conversations = React.useMemo(() => {
    const conversationMap = new Map();
    
    // Add connections — skip ghost users (no real username or name set)
    (connections as any[]).forEach((connection: any) => {
      const connectedUser = connection.connectedUser;
      if (connectedUser) {
        const connectedUserId = Number(connectedUser.id);
        if (!connectedUserId) return;
        // Skip ghost/deleted users that have no real username or name
        if (!connectedUser.username && !connectedUser.name) return;
        conversationMap.set(connectedUserId, {
          userId: connectedUserId,
          username: connectedUser?.username || connectedUser?.name || `User ${connectedUserId}`,
          profileImage: connectedUser?.profileImage,
          location: connectedUser?.currentCity || connectedUser?.destinationCity || connectedUser?.city || connectedUser?.hometownCity || connectedUser?.location || '',
          hometownCity: connectedUser?.hometownCity || '',
          travelDestination: getActiveTravelDest(connectedUser),
          lastMessage: '', // Don't show message preview in connections list
          lastMessageTime: connection.createdAt,
          unreadCount: 0, // Initialize unread count
        });
      }
    });

    // Add target user if from URL
    if (targetUserId && !conversationMap.has(parseInt(targetUserId))) {
      const targetUser = (allUsers as any[]).find((u: any) => u.id === parseInt(targetUserId));
      if (targetUser) {
        conversationMap.set(parseInt(targetUserId), {
          userId: parseInt(targetUserId),
          username: targetUser?.username || targetUser?.name || `User ${targetUserId}`,
          profileImage: targetUser?.profileImage,
          location: targetUser?.currentCity || targetUser?.destinationCity || targetUser?.city || targetUser?.hometownCity || targetUser?.location || '',
          hometownCity: targetUser?.hometownCity || '',
          travelDestination: getActiveTravelDest(targetUser),
          lastMessage: 'Start a conversation...',
          lastMessageTime: new Date().toISOString(),
        });
      }
    }

    // Update with latest messages and count unread
    (messages as any[]).forEach((message: any) => {
      const senderId = Number(message.senderId);
      const receiverId = Number(message.receiverId);
      const otherUserId = senderId === userId ? receiverId : senderId;
      if (otherUserId !== userId) {
        const existing = conversationMap.get(otherUserId);
        // Count unread messages (messages received by current user that aren't read)
        const unreadCount = (messages as any[]).filter((m: any) => 
          Number(m.senderId) === otherUserId && 
          Number(m.receiverId) === userId && 
          !m.isRead
        ).length;
        
        const isOpener = message.messageType === 'conversation_opened';
        if (existing) {
          // For opener markers: mark the flag but don't clobber a real lastMessage
          if (isOpener) {
            conversationMap.set(otherUserId, { ...existing, conversationOpened: true, unreadCount });
          } else {
            const isNewer = !existing.lastMessageTime || new Date(message.createdAt).getTime() > new Date(existing.lastMessageTime).getTime();
            conversationMap.set(otherUserId, {
              ...existing,
              lastMessage: isNewer ? (message.content || (message.mediaUrl ? '📷 Photo' : '')) : existing.lastMessage,
              lastMessageTime: isNewer ? message.createdAt : existing.lastMessageTime,
              unreadCount,
            });
          }
        } else {
          // Use embedded user from message (e.g. from meet-request DMs) so thread appears in inbox even if not in allUsers
          const fromMessageRaw = senderId === userId ? message.receiverUser : message.senderUser;
          // Only trust fromMessage if it has a valid id — a join that returned null gives an object of all-nulls
          const fromMessage = (fromMessageRaw?.id && (fromMessageRaw?.username || fromMessageRaw?.name)) ? fromMessageRaw : null;
          const otherUser = fromMessage || (allUsers as any[]).find((u: any) => u.id === otherUserId);
          const hasRealIdentity = !!(otherUser?.username || otherUser?.name);
          const hasMessageContent = !!(message.content || message.mediaUrl) || isOpener;
          if (!hasRealIdentity && !hasMessageContent) return;
          conversationMap.set(otherUserId, {
            userId: otherUserId,
            username: otherUser?.username || otherUser?.name || otherUser?.firstName || `DM ${otherUserId}`,
            firstName: otherUser?.firstName || null,
            profileImage: otherUser?.profileImage,
            location: otherUser?.currentCity || otherUser?.destinationCity || otherUser?.city || otherUser?.hometownCity || otherUser?.location || '',
            hometownCity: otherUser?.hometownCity || '',
            travelDestination: getActiveTravelDest(otherUser),
            lastMessage: isOpener ? null : (message.content || (message.mediaUrl ? '📷 Photo' : '')),
            lastMessageTime: message.createdAt,
            unreadCount,
            conversationOpened: isOpener,
          });
        }
      }
    });

    return Array.from(conversationMap.values())
      .filter((conv: any) => {
        // Always show if there are real messages or if the conversation was explicitly opened
        const hasMessages = conv.lastMessage !== '' && conv.lastMessage != null;
        if (hasMessages) return true;
        if (conv.conversationOpened) return true;
        if (targetUserId && conv.userId === parseInt(targetUserId)) return true;
        // For connections with NO messages and not opened, skip ghost/placeholder users
        return conv.username !== `User ${conv.userId}` && conv.username !== `DM ${conv.userId}`;
      })
      .sort((a: any, b: any) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
  }, [connections, messages, allUsers, targetUserId, userId]);

  // Auto-select target conversation from URL and scroll it into view
  // Also auto-select the first unread conversation when landing without a specific target
  useEffect(() => {
    if (targetUserId && conversations.length > 0) {
      const targetUserIdNum = parseInt(targetUserId);
      const targetConv = conversations.find((conv: any) => conv.userId === targetUserIdNum);
      if (targetConv && selectedConversation !== targetUserIdNum) {
        setSelectedConversation(targetUserIdNum);
        console.log(`🎯 Auto-selected conversation for user ${targetUserId}:`, targetConv.username);
        
        // Scroll target conversation into view after a brief delay
        setTimeout(() => {
          const conversationElement = document.querySelector(`[data-conversation-id="${targetUserId}"]`);
          if (conversationElement) {
            conversationElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            console.log(`📍 Scrolled to conversation for user ${targetUserId}`);
          }
        }, 500);
      }
    } else if (!targetUserId && !getInitialMeetupChatId() && !selectedConversation && conversations.length > 0) {
      // Auto-select the first conversation that has unread messages so the badge click is useful
      const firstUnread = conversations.find((conv: any) => conv.unreadCount > 0);
      if (firstUnread) {
        setSelectedConversation(firstUnread.userId);
        console.log(`📬 Auto-selected first unread conversation:`, firstUnread.username);
      }
    }
  }, [targetUserId, conversations]);

  // Get messages for selected conversation (simplified to avoid duplication)
  const conversationMessages = selectedConversation 
    ? (messages as any[]).filter((message: any) => 
        message.messageType !== 'conversation_opened' && (
          (Number(message.senderId) === userId && Number(message.receiverId) === selectedConversation) ||
          (Number(message.receiverId) === userId && Number(message.senderId) === selectedConversation)
        )
      ).sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    : [];

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (senderId: number) => {
      return apiRequest('POST', `/api/messages/${userId}/mark-read`, { senderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', userId, 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', userId] });
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { receiverId: number; content: string; isInstantMessage?: boolean; replyToId?: number }) => {
      const response = await apiRequest('POST', '/api/messages', {
        senderId: userId,
        ...messageData,
        isInstantMessage: true
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: (newMessage) => {
      console.log('Message sent successfully:', newMessage);
      setNewMessage('');
      refetchMessages();
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/messages', userId] });
        queryClient.invalidateQueries({ queryKey: ['/api/connections', userId] });
      }, 100);
    },
    onError: (error: any) => {
      console.error('Failed to send message:', error);
      toast({
        title: "Message failed to send",
        description: error?.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    // Mark any unread messages from target user as read (since user is responding)
    markAsReadMutation.mutate(selectedConversation);
    
    // Always use regular API call to avoid message duplication issues
    console.log('📤 Sending message via API');
    sendMessageMutation.mutate({
      receiverId: selectedConversation,
      content: newMessage.trim(),
      replyToId: replyingTo?.id || undefined,
    });
    
    // Stop typing indicator on send
    if (websocketService.isConnected()) {
      websocketService.sendTypingIndicator(selectedConversation, false);
    }
    // Clear reply state after sending
    setReplyingTo(null);
  };

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && userId) {
      console.log('📬 MARKING MESSAGES AS READ for conversation:', selectedConversation);
      // Always mark as read when opening a conversation (even if already read)
      markAsReadMutation.mutate(selectedConversation);
    }
  }, [selectedConversation, userId]);

  // Handle typing indicators
  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (selectedConversation && websocketService.isConnected()) {
      websocketService.sendTypingIndicator(selectedConversation, value.length > 0);
    }
  };

  // Handle message editing
  const handleEditMessage = async (messageId: number) => {
    if (!editText.trim()) return;
    
    try {
      await apiRequest('PATCH', `/api/messages/${messageId}`, {
        content: editText.trim(),
        userId
      });
      
      toast({ title: "Message edited successfully" });
      setEditingMessageId(null);
      setEditText("");
      queryClient.invalidateQueries({ queryKey: ['/api/messages', userId] });
    } catch (error: any) {
      toast({ title: "Failed to edit message", variant: "destructive" });
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': String(userId || '') 
        },
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to delete message');
      
      toast({ title: "Message deleted successfully" });
      setSelectedMessage(null);
      queryClient.invalidateQueries({ queryKey: ['/api/messages', userId] });
    } catch (error: any) {
      toast({ title: "Failed to delete message", variant: "destructive" });
    }
  };

  // Handle reaction/like - with debounce to prevent double-firing on iOS
  const [isReacting, setIsReacting] = useState(false);
  const handleReaction = async (messageId: number, emoji: string) => {
    if (isReacting) return; // Prevent double-tap
    setIsReacting(true);
    
    try {
      console.log('👍 Sending reaction:', messageId, emoji);
      await apiRequest('POST', `/api/messages/${messageId}/reaction`, { emoji });
      
      toast({ title: "Liked!" });
      setSelectedMessage(null);
      queryClient.invalidateQueries({ queryKey: ['/api/messages', userId] });
    } catch (error: any) {
      console.error('❌ Reaction failed:', error);
      toast({ title: "Failed to react to message", variant: "destructive" });
    } finally {
      setTimeout(() => setIsReacting(false), 500); // Debounce reset
    }
  };

  // Start editing a message
  const startEdit = (message: any) => {
    setEditingMessageId(message.id);
    setEditText(message.content);
    setSelectedMessage(null);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  // Debug: Log conversations
  React.useEffect(() => {
    console.log('📋 Conversations built:', conversations.length);
    conversations.forEach((conv: any) => {
      console.log(`📋 Conv: ${conv.username} (ID: ${conv.userId}) - ${conv.lastMessage?.substring(0, 30)}`);
    });
  }, [conversations]);

  const selectedUser = selectedConversation 
    ? conversations.find((conv: any) => conv.userId === selectedConversation)
    : null;

  // Debug: Log selected conversation state
  React.useEffect(() => {
    console.log('🎯 Selected conversation changed:', selectedConversation);
    console.log('🎯 Selected user:', selectedUser?.username || 'None');
  }, [selectedConversation, selectedUser]);

  if (authContext?.authLoading) {
    return <FullPageSkeleton variant="chat" />;
  }

  if (!hasUser) {
    return (
      <div className={`flex items-center justify-center bg-white dark:bg-gray-900 ${isNativeIOSApp() ? 'native-ios-fullpage' : 'min-h-screen'}`}>
        <div className="text-gray-900 dark:text-white">Please log in to view messages</div>
      </div>
    );
  }

  // Removed full-page skeleton block — page renders immediately, conversations list shows inline loader

  return (
    <div
      data-chat-page={selectedConversation || selectedMeetupChat ? "true" : undefined}
      className={`bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-row overflow-hidden w-full max-w-full ${isNativeIOSApp() ? 'native-ios-messages' : 'h-[calc(100dvh-144px)] md:h-[calc(100dvh-117px)] lg:h-[calc(100dvh-117px)]'} min-h-0`}
    >
      {/* Left Sidebar - Conversations. Mobile: full screen when no selection; hidden when chat open. Desktop (lg+): always visible. Single column on mobile. */}
      <div className={`${(selectedConversation || selectedMeetupChat) ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 h-full bg-[#f0f2f5] dark:bg-gray-800 flex-col border-r-0 lg:border-r-2 border-gray-300 dark:border-gray-500 min-w-0 flex-shrink-0`}>
        <div className={`border-b border-gray-200 dark:border-gray-700 ${isNativeIOSApp() ? 'px-3 py-2' : 'p-4'}`} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'inherit' }}>
          <div className={`flex items-center gap-3 ${isNativeIOSApp() ? 'mb-2' : 'mb-3'}`}>
            <UniversalBackButton 
              destination="/discover"
              label=""
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-transparent border-none shadow-none hover:bg-gray-200 dark:hover:bg-gray-700/50 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-target"
            />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h1>
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={connectionSearch}
            onChange={(e) => setConnectionSearch(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {conversations.length > 0 && !isNativeIOSApp() && (
          <div className="p-3 bg-gray-200/50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              Click on a name to open messages
            </p>
          </div>
        )}

        <div className="flex-1 min-h-0" style={{ overflowY: 'scroll', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', paddingBottom: '96px' }}>
          {(connectionsLoading || messagesLoading) && conversations.length === 0 && (meetupChatrooms as any[]).length === 0 ? (
            <div className="p-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-500" />
            </div>
          ) : conversations.length === 0 && (meetupChatrooms as any[]).length === 0 ? (
            <div className="p-4 text-center text-gray-600 dark:text-gray-500">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            <>
              {(meetupChatrooms as any[]).filter((mc: any) => mc.chatType !== 'group_dm').length > 0 && (
                <>
                  <div className="px-3 py-2 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800">
                    <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Meetup Chats
                    </p>
                  </div>
                  {(meetupChatrooms as any[])
                    .filter((mc: any) => {
                      if (mc.chatType === 'group_dm') return false;
                      if (mc.expiresAt && new Date(mc.expiresAt) <= new Date()) return false;
                      return !connectionSearch ||
                        (mc.chatroomName || '').toLowerCase().includes(connectionSearch.toLowerCase());
                    })
                    .map((mc: any) => {
                      const isSelected = selectedMeetupChat === mc.id;
                      return (
                        <div
                          key={`mc-${mc.id}`}
                          className={`group ${isNativeIOSApp() ? 'px-3 py-2' : 'p-4'} border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 border-l-4 border-l-orange-300 shadow-lg text-white'
                              : mc.unreadCount > 0
                                ? 'bg-white/70 dark:bg-gray-800/40 border-l-4 border-l-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                : 'hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-l-4 hover:border-l-orange-400'
                          }`}
                          onClick={() => {
                            // Optimistically clear unread badge in cache, then confirm via server
                            queryClient.setQueryData(['/api/meetup-chatrooms/mine'], (old: any[]) =>
                              Array.isArray(old) ? old.map(r => r.id === mc.id ? { ...r, unreadCount: 0 } : r) : old
                            );
                            apiRequest('POST', `/api/meetup-chatrooms/${mc.id}/mark-read`).catch(() => {});
                            if (window.innerWidth < 1024) {
                              navigate(`/meetup-chatroom-chat/${mc.id}?title=${encodeURIComponent(mc.chatroomName || 'Meetup Chat')}&subtitle=${encodeURIComponent(mc.city || 'Group chat')}`);
                            } else {
                              setSelectedMeetupChat(mc.id);
                              setSelectedConversation(null);
                              navigate(`/messages?meetupChat=${mc.id}`);
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-white/20' : 'bg-orange-100 dark:bg-orange-900/40'
                            }`}>
                              <Users className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-orange-600 dark:text-orange-400'}`} />
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center gap-2 min-w-0">
                                <h3 className={`text-sm truncate ${
                                  isSelected ? 'text-white font-semibold' : mc.unreadCount > 0 ? 'text-gray-900 dark:text-white font-extrabold' : 'text-gray-900 dark:text-white font-semibold'
                                }`}>
                                  {mc.chatroomName || 'Meetup Chat'}
                                </h3>
                                {mc.unreadCount > 0 && !isSelected && (
                                  <span
                                    className="w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400 shrink-0"
                                    aria-label="Unread messages"
                                    title="Unread messages"
                                  />
                                )}
                                <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-bold text-white shadow-sm ${
                                  isSelected
                                    ? 'bg-white/20'
                                    : mc.chatType === 'available_now'
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 ring-1 ring-emerald-400/30'
                                      : mc.chatType === 'quick_meetup'
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 ring-1 ring-blue-400/30'
                                        : 'bg-gradient-to-r from-purple-500 to-pink-600 ring-1 ring-purple-400/30'
                                }`}>
                                  {mc.chatType === 'available_now' ? 'Available Now' : mc.chatType === 'quick_meetup' ? 'Available Now' : 'Meetup'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {mc.lastMessage && (
                                  <p className={`text-xs truncate ${
                                    isSelected ? 'text-orange-100' : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                    {mc.lastMessageType === 'system' ? mc.lastMessage : `${mc.lastMessageUsername}: ${mc.lastMessage}`}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDismissTarget({ type: 'meetup', id: mc.id, name: mc.chatroomName || 'Meetup Chat' });
                              }}
                              className={`shrink-0 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 transition-opacity ${
                                isSelected ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                              title="Remove from inbox"
                              aria-label="Remove chatroom"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  {conversations.length > 0 && (
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" /> Direct Messages
                      </p>
                    </div>
                  )}
                </>
              )}
              {(meetupChatrooms as any[]).filter((mc: any) => mc.chatType === 'group_dm').length > 0 && (
                <>
                  <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Group Chats
                    </p>
                  </div>
                  {(meetupChatrooms as any[])
                    .filter((mc: any) => {
                      if (mc.chatType !== 'group_dm') return false;
                      if (mc.expiresAt && new Date(mc.expiresAt) <= new Date()) return false;
                      return !connectionSearch ||
                        (mc.chatroomName || '').toLowerCase().includes(connectionSearch.toLowerCase());
                    })
                    .map((mc: any) => {
                      const isSelected = selectedMeetupChat === mc.id;
                      return (
                        <div
                          key={`gc-${mc.id}`}
                          className={`group ${isNativeIOSApp() ? 'px-3 py-2' : 'p-4'} border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-l-4 border-l-blue-300 shadow-lg text-white'
                              : mc.unreadCount > 0
                                ? 'bg-white/70 dark:bg-gray-800/40 border-l-4 border-l-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-l-4 hover:border-l-blue-400'
                          }`}
                          onClick={() => {
                            queryClient.setQueryData(['/api/meetup-chatrooms/mine'], (old: any[]) =>
                              Array.isArray(old) ? old.map(r => r.id === mc.id ? { ...r, unreadCount: 0 } : r) : old
                            );
                            apiRequest('POST', `/api/meetup-chatrooms/${mc.id}/mark-read`).catch(() => {});
                            if (window.innerWidth < 1024) {
                              navigate(`/meetup-chatroom-chat/${mc.id}?title=${encodeURIComponent(mc.chatroomName || 'Group Chat')}&subtitle=${encodeURIComponent(mc.city || 'Group chat')}`);
                            } else {
                              setSelectedMeetupChat(mc.id);
                              setSelectedConversation(null);
                              navigate(`/messages?meetupChat=${mc.id}`);
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/40'
                            }`}>
                              <Users className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center gap-2 min-w-0">
                                <h3 className={`text-sm truncate ${
                                  isSelected ? 'text-white font-semibold' : mc.unreadCount > 0 ? 'text-gray-900 dark:text-white font-extrabold' : 'text-gray-900 dark:text-white font-semibold'
                                }`}>
                                  {mc.chatroomName || 'Group Chat'}
                                </h3>
                                {mc.unreadCount > 0 && !isSelected && (
                                  <span className="shrink-0 min-w-[20px] h-5 flex items-center justify-center bg-blue-500 text-white rounded-full px-1.5 text-[10px] font-bold">
                                    {mc.unreadCount > 99 ? '99+' : mc.unreadCount}
                                  </span>
                                )}
                              </div>
                              {mc.lastMessage && (
                                <p className={`text-xs truncate mt-0.5 ${isSelected ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                                  {mc.lastMessageUsername ? `${mc.lastMessageUsername}: ` : ''}{mc.lastMessage}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDismissTarget({ type: 'meetup', id: mc.id, name: mc.chatroomName || 'Group Chat' });
                              }}
                              className={`shrink-0 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 transition-opacity ${
                                isSelected ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                              title="Remove from inbox"
                              aria-label="Remove chatroom"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </>
              )}
              {conversations
                .filter((conv: any) => 
                  !dismissedDMs.includes(conv.userId) &&
                  (!connectionSearch || 
                  conv.username.toLowerCase().includes(connectionSearch.toLowerCase()))
                )
                .map((conv: any) => (
                  <div
                    key={conv.userId}
                    data-conversation-id={conv.userId}
                    className={`group ${isNativeIOSApp() ? 'px-3 py-2' : 'p-4'} border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 ${
                      selectedConversation === conv.userId 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-l-4 border-l-blue-400 shadow-lg text-white' 
                        : conv.unreadCount > 0
                          ? 'bg-white/70 dark:bg-gray-800/40 border-l-4 border-l-orange-400 hover:bg-white/90 dark:hover:bg-gray-800/55'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-700 hover:border-l-4 hover:border-l-gray-400 dark:hover:border-l-gray-500'
                    } ${
                      targetUserId && conv.userId === parseInt(targetUserId)
                        ? 'ring-2 ring-orange-400 ring-opacity-75'
                        : ''
                    }`}
                    onClick={() => {
                      setSelectedMeetupChat(null);
                      setSelectedConversation(conv.userId);
                      navigate(`/messages/${conv.userId}`);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/profile/${conv.userId}`;
                        }}
                      >
                        <Avatar className={`${isNativeIOSApp() ? 'w-12 h-12' : 'w-10 h-10'}`}>
                          <AvatarImage 
                            src={getProfileImageUrl(conv) || undefined} 
                            alt={`${conv.username} avatar`}
                          />
                          <AvatarFallback className="bg-blue-600 text-white">
                            {conv.username?.charAt(0)?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className={`text-sm truncate ${
                            selectedConversation === conv.userId 
                              ? 'text-white font-semibold' 
                              : conv.unreadCount > 0
                                ? 'text-gray-900 dark:text-white font-extrabold'
                                : 'text-gray-900 dark:text-white font-semibold'
                          }`}>
                            @{conv.username}
                          </h3>
                          {conv.unreadCount > 0 && (
                            <span
                              className="w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400 shrink-0"
                              aria-label="Unread messages"
                              title="Unread messages"
                            />
                          )}
                          {conv.unreadCount > 0 && (
                            <div className="bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                            </div>
                          )}
                        </div>

                        <div className={`text-xs ${
                          selectedConversation === conv.userId 
                            ? 'text-gray-200' 
                            : conv.unreadCount > 0
                              ? 'text-gray-700 dark:text-gray-300 font-medium'
                              : 'text-gray-600 dark:text-gray-500'
                        }`}>
                          {(conv as any).hometownCity
                            ? (conv as any).travelDestination
                              ? `${abbreviateCity((conv as any).hometownCity)} → ${abbreviateCity((conv as any).travelDestination)}`
                              : abbreviateCity((conv as any).hometownCity)
                            : abbreviateCity(conv.location) || ''}
                        </div>
                      </div>
                      {selectedConversation === conv.userId && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDismissTarget({ type: 'dm', id: conv.userId, name: conv.username });
                        }}
                        className={`shrink-0 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 transition-opacity ${
                          selectedConversation === conv.userId
                            ? 'text-white/70 hover:text-white hover:bg-white/20'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        title="Remove from inbox"
                        aria-label="Remove conversation"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area - Mobile: full screen only when conversation selected. Desktop (lg+): always visible. Single column on mobile. */}
      <div className={`flex-1 flex flex-col h-full min-h-0 bg-white dark:bg-gray-900 min-w-0 ${!selectedConversation && !selectedMeetupChat ? 'hidden lg:flex' : 'flex'} w-full lg:w-auto`}>

        {/* MEETUP CHATROOM VIEW */}
          {selectedMeetupChat ? (() => {
            const activeMeetup = (meetupChatrooms as any[]).find((c: any) => c.id === selectedMeetupChat);
            return (
              <WhatsAppChat
                chatId={selectedMeetupChat}
                chatType="meetup"
                meetupId={activeMeetup?.meetupId || undefined}
                title={activeMeetup?.chatroomName || 'Meetup Chat'}
                subtitle={activeMeetup?.city || 'Group chat'}
                currentUserId={userId!}
                onBack={() => {
                  setSelectedMeetupChat(null);
                  navigate('/messages');
                }}
              />
            );
          })() :
        /* Loading state when conversation is selected but user data not loaded yet */
        selectedConversation && !selectedUser && (connectionsLoading || messagesLoading || conversations.length === 0) ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-600 dark:text-gray-400">
              <div className="animate-pulse">Loading conversation...</div>
            </div>
          </div>
        ) : selectedConversation && selectedUser ? (
          <>
            <div ref={headerRef} className={`${isNativeIOSApp() ? 'px-3 py-1.5' : 'px-4 py-2'} border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0 min-w-0`}>
              <div className="flex items-center gap-2 min-w-0">
                {/* Back button for mobile - navigate to list (mobile web) or history back (iOS app) */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => isNativeIOSApp() ? window.history.back() : navigate('/messages')}
                  className="lg:hidden text-gray-600 dark:text-gray-400 min-h-[44px] min-w-[44px] h-11 w-11 shrink-0 touch-target"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                
                <div className="cursor-pointer shrink-0" onClick={() => navigate(`/profile/${selectedUser.userId}`)}>
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={selectedUser.profileImage} />
                    <AvatarFallback className="bg-blue-600 text-white text-sm">
                      {selectedUser.username?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0 overflow-hidden max-w-[140px] xs:max-w-[180px] sm:max-w-[220px] md:max-w-[260px]">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={`@${selectedUser.username}`}>@{selectedUser.username}</h2>
                  {selectedUser.location && <p className="text-xs text-gray-600 dark:text-gray-400 truncate min-w-0">{selectedUser.location}</p>}
                </div>
              </div>
            </div>

            {/* Messages area with scroll */}
            <div
              ref={messagesContainerRef}
              className="flex-1 min-h-0 overflow-y-auto px-4 py-2 bg-[#D1D5DB] dark:bg-[#0b141a]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 800 800'%3E%3Cg fill='none' stroke='%23cccccc' stroke-width='2' opacity='0.08'%3E%3Ccircle cx='100' cy='100' r='50'/%3E%3Cpath d='M200 200 L250 250 M250 200 L200 250'/%3E%3Crect x='350' y='50' width='80' height='80' rx='10'/%3E%3Cpath d='M500 150 Q550 100 600 150 T700 150'/%3E%3Ccircle cx='150' cy='300' r='30'/%3E%3Cpath d='M300 350 L320 380 L340 340 L360 380 L380 340'/%3E%3Crect x='450' y='300' width='60' height='100' rx='30'/%3E%3Cpath d='M600 350 L650 300 L700 350 Z'/%3E%3Ccircle cx='100' cy='500' r='40'/%3E%3Cpath d='M250 500 C250 450 350 450 350 500 S250 550 250 500'/%3E%3Crect x='450' y='480' width='70' height='70' rx='15'/%3E%3Cpath d='M600 500 L650 520 L670 470 L620 450 Z'/%3E%3Ccircle cx='150' cy='700' r='35'/%3E%3Cpath d='M300 680 Q350 650 400 680'/%3E%3Crect x='500' y='650' width='90' height='60' rx='8'/%3E%3Cpath d='M150 150 L180 180 M180 150 L150 180'/%3E%3C/g%3E%3C/svg%3E")`
              }}>
                <div className="flex flex-col min-h-full">
                  <div className="flex-grow" />
                  <div className="space-y-2 max-w-4xl mx-auto w-full">
                    {conversationMessages.length === 0 ? (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      conversationMessages.map((msg: any) => {
                        const isOwnMessage = Number(msg.senderId) === userId;
                        const hasReactions = msg.reactions && msg.reactions.length > 0;
                        return (
                          <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${hasReactions ? 'mb-6 pb-1' : ''}`}>
                            <div 
                              className="relative max-w-[70%] overflow-visible" 
                              style={{ 
                                WebkitTapHighlightColor: 'rgba(255, 165, 0, 0.2)',
                                WebkitUserSelect: 'none',
                                userSelect: 'none',
                                touchAction: 'pan-y',
                                cursor: 'pointer',
                                overflow: 'visible'
                              }}
                              onTouchStart={(e) => handleMessageTouchStart(e, msg)}
                              onTouchMove={handleMessageTouchMove}
                              onTouchEnd={handleMessageTouchEnd}
                              onDoubleClick={() => setSelectedMessage(msg)}
                            >
                              {editingMessageId === msg.id ? (
                                <div
                                  className={`px-4 py-2 rounded-2xl ${
                                    isOwnMessage ? 'bg-[#DCF8C6] text-gray-900 dark:bg-[#005C4B] dark:text-white' : 'bg-gray-700'
                                  }`}
                                >
                                  <Textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full mb-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white resize-none"
                                    rows={3}
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleEditMessage(msg.id)} className="bg-blue-600 hover:bg-blue-700 text-white">
                                      <Check className="w-4 h-4 mr-1" />
                                      Save
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={cancelEdit} className="border-gray-300 dark:border-gray-600">
                                      <X className="w-4 h-4 mr-1" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className={`relative px-4 py-2 rounded-2xl cursor-pointer overflow-visible ${
                                  isOwnMessage 
                                    ? 'bg-[#DCF8C6] dark:bg-[#005C4B]' 
                                    : 'bg-gray-200 dark:bg-gray-700'
                                }`} style={{ overflow: 'visible' }}>
                                  {/* Reply Context */}
                                  {msg.replyToId && msg.repliedMessage && (
                                    <div className={`mb-2 pl-2 border-l-2 ${
                                      isOwnMessage 
                                        ? 'border-black/20 dark:border-white/35' 
                                        : 'border-gray-400 dark:border-gray-500'
                                    }`}>
                                      <p className={`text-xs opacity-70 ${
                                        isOwnMessage 
                                          ? 'text-black/70 dark:text-white/80' 
                                          : 'text-gray-600 dark:text-gray-400'
                                      }`}>
                                        {Number(msg.repliedMessage.senderId) === userId ? 'You' : `@${selectedUser?.username}`}
                                      </p>
                                      <p className={`text-xs opacity-80 truncate ${
                                        isOwnMessage 
                                          ? 'text-black/80 dark:text-white/90' 
                                          : 'text-gray-700 dark:text-gray-300'
                                      }`}>
                                        {msg.repliedMessage.content}
                                      </p>
                                    </div>
                                  )}
                                  
                                  <p className={`text-sm whitespace-pre-wrap break-words ${
                                    isOwnMessage 
                                      ? 'text-gray-900 dark:text-white' 
                                      : 'text-gray-900 dark:text-gray-100'
                                  }`}>
                                    {msg.content}
                                  </p>
                                  <div className="flex items-center justify-end gap-1 mt-1">
                                    <p className={`text-xs opacity-70 ${
                                      isOwnMessage 
                                        ? 'text-black/60 dark:text-white/70' 
                                        : 'text-gray-600 dark:text-gray-400'
                                    }`}>
                                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    {msg.isEdited && (
                                      <span className={`text-xs opacity-60 italic ${isOwnMessage ? 'text-black/50 dark:text-white/60' : 'text-gray-400'}`}>
                                        Edited
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Reactions display */}
                                  {msg.reactions && msg.reactions.length > 0 && (
                                    <div className={`absolute -bottom-3 ${isOwnMessage ? 'right-2' : 'left-2'} bg-white dark:bg-gray-800 rounded-full px-2 py-0.5 shadow-md border border-gray-200 dark:border-gray-600`}>
                                      <span className="text-sm">
                                        {msg.reactions.map((r: any) => r.emoji).join('')}
                                        {msg.reactions.length > 1 && <span className="text-xs ml-1 text-gray-500">{msg.reactions.length}</span>}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Interaction Menu - removed, using portal instead */}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>

            {/* Message Input - Fixed at bottom, pb for mobile bottom nav (safe area) */}
            <div
              ref={inputContainerRef}
              className="chat-input-area px-4 py-2 pb-[max(5rem,calc(env(safe-area-inset-bottom)+4rem))] md:pb-4 md:mb-4 lg:pb-6 lg:mb-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0"
            >
                {/* Reply Bar */}
                {replyingTo && (
                  <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded max-w-4xl mx-auto">
                    <Reply className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Replying to @{Number(replyingTo.senderId) === userId ? 'You' : selectedUser?.username}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {getReplyPreviewText(replyingTo)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => setReplyingTo(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                {selectedConversation && (
                  <TypingIndicator
                    conversationUserId={selectedConversation}
                    displayName={selectedUser?.firstName || selectedUser?.username}
                  />
                )}

                <div className="flex items-center gap-2 max-w-4xl mx-auto">
                  <Input
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    data-testid="input-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    size="icon"
                    className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 min-h-[44px] min-w-[44px] touch-target"
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center text-gray-600 dark:text-gray-500 w-full max-w-sm flex flex-col items-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30 flex-shrink-0" />
              <h3 className="text-base font-medium mb-1.5 text-gray-800 dark:text-gray-300">Welcome to Messages</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Contacts List (Hidden on mobile/tablet, show only on xl+ desktop) */}
      <div className="hidden xl:flex w-72 h-full flex-shrink-0 bg-[#f0f2f5] dark:bg-gray-900 flex-col border-l-2 border-gray-300 dark:border-gray-500 min-w-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-[#f0f2f5] dark:bg-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4" />
            Connections
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {(connections as any[]).length} connection{(connections as any[]).length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {(connections as any[]).length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No connections yet</p>
              <p className="text-xs mt-1">Connect with others to chat</p>
            </div>
          ) : (
            (connections as any[]).map((connection: any) => {
              const contact = connection.connectedUser;
              if (!contact) return null;
              
              const isActive = selectedConversation === contact.id;
              
              return (
                <div
                  key={contact.id}
                  className={`p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-l-blue-500' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => navigate(`/messages/${contact.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="cursor-pointer shrink-0 hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${contact.id}`);
                      }}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={getProfileImageUrl(contact) || undefined} />
                        <AvatarFallback className="bg-green-600 text-white text-sm">
                          {contact.username?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div
                      className="flex-1 min-w-0 overflow-hidden cursor-pointer hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${contact.id}`);
                      }}
                    >
                      <p className={`text-sm font-semibold truncate ${
                        isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                      }`}>
                        @{contact.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {(() => {
                          const dest = getActiveTravelDest(contact);
                          const home = abbreviateCity(contact.hometownCity || contact.location || '');
                          return dest
                            ? `${home} → ${abbreviateCity(dest)}`
                            : home || 'Location unknown';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Message Action Menu - Portal rendered at body level for iOS */}
      {selectedMessage && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-transparent z-[99998]"
            onClick={() => setSelectedMessage(null)}
            style={{ touchAction: 'auto' }}
          />
          {/* Bottom Sheet Menu - centered on mobile, right side on desktop */}
          <div 
            className="fixed left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-4 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-[99999] border border-gray-200 dark:border-gray-700"
            style={{ touchAction: 'auto', bottom: 'max(120px, 20vh)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2 py-3 space-y-1">
              {/* Like reaction */}
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
                className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-xl text-gray-900 dark:text-white"
                style={{ touchAction: 'manipulation', cursor: 'pointer' }}
              >
                <ThumbsUp className="w-5 h-5 text-blue-500 pointer-events-none" />
                <span className="text-sm pointer-events-none">Like</span>
              </button>
              
              {/* Copy */}
              <button 
                type="button" 
                onTouchEnd={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  navigator.clipboard.writeText(selectedMessage.content); 
                  toast({ title: "Copied" }); 
                  setSelectedMessage(null);
                }}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  navigator.clipboard.writeText(selectedMessage.content); 
                  toast({ title: "Copied" }); 
                  setSelectedMessage(null);
                }}
                className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-xl text-gray-900 dark:text-white"
                style={{ touchAction: 'manipulation', cursor: 'pointer' }}
              >
                <Copy className="w-5 h-5 text-gray-500 pointer-events-none" />
                <span className="text-sm pointer-events-none">Copy</span>
              </button>
              
              {/* Reply */}
              <button 
                type="button" 
                onTouchEnd={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  setReplyingTo(selectedMessage); 
                  setSelectedMessage(null);
                }}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  setReplyingTo(selectedMessage); 
                  setSelectedMessage(null);
                }}
                className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-xl text-gray-900 dark:text-white"
                style={{ touchAction: 'manipulation', cursor: 'pointer' }}
              >
                <Reply className="w-5 h-5 text-green-500 pointer-events-none" />
                <span className="text-sm pointer-events-none">Reply</span>
              </button>
              
              {/* Edit/Delete for own messages */}
              {Number(selectedMessage.senderId) === userId && (
                <>
                  <button 
                    type="button" 
                    onTouchEnd={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      startEdit(selectedMessage); 
                      setSelectedMessage(null);
                    }}
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      startEdit(selectedMessage); 
                      setSelectedMessage(null);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-xl text-gray-900 dark:text-white"
                    style={{ touchAction: 'manipulation', cursor: 'pointer' }}
                  >
                    <Edit2 className="w-5 h-5 text-blue-500 pointer-events-none" />
                    <span className="text-sm pointer-events-none">Edit</span>
                  </button>
                  <button 
                    type="button" 
                    onTouchEnd={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteMessage(selectedMessage.id);
                    }}
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteMessage(selectedMessage.id);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-xl text-red-600 dark:text-red-400"
                    style={{ touchAction: 'manipulation', cursor: 'pointer' }}
                  >
                    <Trash2 className="w-5 h-5 pointer-events-none" />
                    <span className="text-sm pointer-events-none">Delete</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
      <AlertDialog open={!!dismissTarget} onOpenChange={(open) => !open && setDismissTarget(null)}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black dark:text-white">Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this chat? This only removes it from your view — other members are unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDismiss}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}