import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authStorage } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChatInput } from '@/components/ui/chat-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, Users, ArrowLeft, Heart, Reply, Copy, Edit2, Trash2, Check, X, ThumbsUp } from 'lucide-react';
import { apiRequest, getApiBaseUrl } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { SimpleAvatar } from '@/components/simple-avatar';
import websocketService from '@/services/websocketService';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
// REMOVED: openFloatingChat import - IM functionality removed
import { UniversalBackButton } from '@/components/UniversalBackButton';
import { isNativeIOSApp } from '@/lib/nativeApp';

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

export default function Messages() {
  const user = authStorage.getUser();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(getInitialTargetUserId);
  const [newMessage, setNewMessage] = useState('');
  const [connectionSearch, setConnectionSearch] = useState('');
  const [instantMessages, setInstantMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [userId: number]: boolean }>({});
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
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

  // Fetch connections - OPTIMIZED: Show cached data instantly
  const { data: connections = [], isLoading: connectionsLoading } = useQuery({
    queryKey: [`/api/connections/${user?.id}`],
    enabled: !!user?.id,
    staleTime: 60000, // Cache connections for 1 minute (they don't change often)
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  // Fetch messages with automatic polling for instant updates
  // OPTIMIZED: Show cached messages instantly, refetch in background
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: [`/api/messages/${user?.id}`],
    enabled: !!user?.id,
    staleTime: 30000, // Show cached data instantly for 30 seconds before refetching
    gcTime: 300000, // Keep in cache for 5 minutes for instant re-entry
    refetchOnMount: true, // Refetch in background when mounting (but show cache first)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchInterval: 10000, // Poll every 10 seconds for new messages
  });

  // CRITICAL: Handle mobile app resume - reconnect WebSocket and refetch messages
  useEffect(() => {
    if (!user?.id) return;

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
  }, [user?.id, refetchMessages]);

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
    if (!user?.id) return;

    // Connect to WebSocket
    websocketService.connect(user.id, user.username);

    // Set up instant message handlers
    const handleInstantMessage = (data: any) => {
      console.log('📥 Received instant message:', data);
      setInstantMessages(prev => [...prev, {
        id: Date.now(),
        senderId: data.message.senderId,
        receiverId: user.id,
        content: data.message.content,
        createdAt: data.message.timestamp,
        messageType: 'instant'
      }]);
      
      // Keep natural scroll position
    };

    const handleTypingIndicator = (data: any) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.userId]: data.isTyping
      }));
    };

    // Register event handlers
    websocketService.on('instant_message_received', handleInstantMessage);
    websocketService.on('typing_indicator', handleTypingIndicator);

    return () => {
      websocketService.off('instant_message_received', handleInstantMessage);
      websocketService.off('typing_indicator', handleTypingIndicator);
    };
  }, [user?.id]);

  // Scroll to BOTTOM to show newest messages and text box
  useEffect(() => {
    if (selectedConversation && messagesContainerRef.current) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [selectedConversation]);

  // Fetch all users for name lookup
  const { data: allUsers = [] } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 30000
  });

  // Build conversations list
  const conversations = React.useMemo(() => {
    const conversationMap = new Map();
    
    // Add connections
    (connections as any[]).forEach((connection: any) => {
      const connectedUser = connection.connectedUser;
      if (connectedUser) {
        conversationMap.set(connectedUser.id, {
          userId: connectedUser.id,
          username: connectedUser?.username || connectedUser?.name || `User ${connectedUser.id}`,
          profileImage: connectedUser?.profileImage,
          location: connectedUser?.hometownCity || connectedUser?.location || 'Unknown',
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
          location: targetUser?.hometownCity || targetUser?.location || 'Unknown',
          lastMessage: 'Start a conversation...',
          lastMessageTime: new Date().toISOString(),
        });
      }
    }

    // Update with latest messages and count unread
    (messages as any[]).forEach((message: any) => {
      const otherUserId = message.senderId === user?.id ? message.receiverId : message.senderId;
      if (otherUserId !== user?.id) {
        const existing = conversationMap.get(otherUserId);
        // Count unread messages (messages received by current user that aren't read)
        const unreadCount = (messages as any[]).filter((m: any) => 
          m.senderId === otherUserId && 
          m.receiverId === user?.id && 
          !m.isRead
        ).length;
        
        if (existing) {
          conversationMap.set(otherUserId, {
            ...existing,
            lastMessage: message.content,
            lastMessageTime: message.createdAt,
            unreadCount: unreadCount,
          });
        } else {
          const otherUser = (allUsers as any[]).find((u: any) => u.id === otherUserId);
          conversationMap.set(otherUserId, {
            userId: otherUserId,
            username: otherUser?.username || otherUser?.name || `User ${otherUserId}`,
            profileImage: otherUser?.profileImage,
            location: otherUser?.hometownCity || otherUser?.location || 'Unknown',
            lastMessage: message.content,
            lastMessageTime: message.createdAt,
            unreadCount: unreadCount,
          });
        }
      }
    });

    return Array.from(conversationMap.values()).sort((a: any, b: any) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  }, [connections, messages, allUsers, targetUserId, user?.id]);

  // Auto-select target conversation from URL and scroll it into view
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
    } else if (!targetUserId) {
      // Clear selection when navigating back to /messages without a userId
      setSelectedConversation(null);
    }
  }, [targetUserId, conversations]); // Removed selectedConversation from deps to prevent loops

  // Get messages for selected conversation (simplified to avoid duplication)
  const conversationMessages = selectedConversation 
    ? (messages as any[]).filter((message: any) => 
        (message.senderId === user?.id && message.receiverId === selectedConversation) ||
        (message.receiverId === user?.id && message.senderId === selectedConversation)
      ).sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    : [];

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (senderId: number) => {
      return apiRequest('POST', `/api/messages/${user?.id}/mark-read`, { senderId });
    },
    onSuccess: () => {
      // Invalidate and refetch BOTH the unread count AND the messages list
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${user?.id}/unread-count`] });
      queryClient.refetchQueries({ queryKey: [`/api/messages/${user?.id}/unread-count`] });
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${user?.id}`] });
      queryClient.refetchQueries({ queryKey: [`/api/messages/${user?.id}`] });
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { receiverId: number; content: string; isInstantMessage?: boolean; replyToId?: number }) => {
      const response = await apiRequest('POST', '/api/messages', {
        senderId: user?.id,
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
        queryClient.invalidateQueries({ queryKey: [`/api/messages/${user?.id}`] });
        queryClient.refetchQueries({ queryKey: [`/api/messages/${user?.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/connections/${user?.id}`] });
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
    
    // Clear reply state after sending
    setReplyingTo(null);
  };

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && user?.id) {
      console.log('📬 MARKING MESSAGES AS READ for conversation:', selectedConversation);
      // Always mark as read when opening a conversation (even if already read)
      markAsReadMutation.mutate(selectedConversation);
    }
  }, [selectedConversation, user?.id]);

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
        userId: user?.id
      });
      
      toast({ title: "Message edited successfully" });
      setEditingMessageId(null);
      setEditText("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${user?.id}`] });
    } catch (error: any) {
      toast({ title: "Failed to edit message", variant: "destructive" });
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '' 
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete message');
      
      toast({ title: "Message deleted successfully" });
      setSelectedMessage(null);
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${user?.id}`] });
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
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${user?.id}`] });
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

  // Enhanced authentication check with emergency recovery
  if (!user) {
    console.log('🚨 Messages - No user found, attempting recovery...');
    
    // Force refresh user data
    React.useEffect(() => {
      authStorage.forceRefreshUser().then(refreshedUser => {
        if (refreshedUser) {
          window.location.reload();
        }
      });
    }, []);
    
    return (
      <div className={`flex items-center justify-center bg-white dark:bg-gray-900 ${isNativeIOSApp() ? 'native-ios-fullpage' : 'min-h-screen'}`}>
        <div className="text-gray-900 dark:text-white">Recovering authentication...</div>
      </div>
    );
  }

  console.log('✅ Messages - User authenticated:', user.username, 'ID:', user.id);

  // Show loading only if no target user and still loading
  if ((connectionsLoading || messagesLoading) && !targetUserId) {
    return (
      <div className="h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-row overflow-hidden w-full max-w-full ${isNativeIOSApp() ? 'native-ios-fullpage' : 'h-screen'}`}>
      {/* Left Sidebar - Conversations (Always visible on desktop, hidden when chat open on mobile) */}
      <div className={`${selectedConversation ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 h-full bg-gray-100 dark:bg-gray-800 flex-col border-r-0 lg:border-r-2 border-gray-300 dark:border-gray-500`}>
        <div className={`border-b border-gray-200 dark:border-gray-700 ${isNativeIOSApp() ? 'px-3 py-2' : 'p-4'}`}>
          <div className={`flex items-center gap-3 ${isNativeIOSApp() ? 'mb-2' : 'mb-3'}`}>
            <UniversalBackButton 
              destination="/discover"
              label=""
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-transparent border-none shadow-none hover:bg-gray-200 dark:hover:bg-gray-700/50 p-2"
            />
            <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
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

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-600 dark:text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations
              .filter((conv: any) => 
                !connectionSearch || 
                conv.username.toLowerCase().includes(connectionSearch.toLowerCase())
              )
              .map((conv: any) => (
                <div
                  key={conv.userId}
                  data-conversation-id={conv.userId}
                  className={`${isNativeIOSApp() ? 'px-3 py-2' : 'p-4'} border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 ${
                    selectedConversation === conv.userId 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-l-4 border-l-blue-400 shadow-lg text-white' 
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700 hover:border-l-4 hover:border-l-gray-400 dark:hover:border-l-gray-500'
                  } ${
                    targetUserId && conv.userId === parseInt(targetUserId)
                      ? 'ring-2 ring-orange-400 ring-opacity-75'
                      : ''
                  }`}
                  onClick={() => {
                    console.log('🔥 CONVERSATION CLICKED:', conv.username, 'ID:', conv.userId);
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
                      <Avatar className="w-12 h-12">
                        <AvatarImage 
                          src={conv.profileImage} 
                          alt={`${conv.username} avatar`}
                        />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {conv.username?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold truncate ${
                          selectedConversation === conv.userId 
                            ? 'text-white' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          @{conv.username}
                        </h3>
                        {conv.unreadCount > 0 && (
                          <div className="bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </div>
                        )}
                      </div>

                      <div className={`text-xs ${
                        selectedConversation === conv.userId 
                          ? 'text-gray-200' 
                          : 'text-gray-600 dark:text-gray-500'
                      }`}>
                        {conv.location}
                      </div>
                    </div>
                    {selectedConversation === conv.userId && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Main Chat Area - WhatsApp Desktop Style */}
      <div className="flex-1 flex flex-col min-h-full bg-white dark:bg-gray-900">
        {/* Loading state when conversation is selected but user data not loaded yet */}
        {selectedConversation && !selectedUser && (connectionsLoading || messagesLoading || conversations.length === 0) ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-600 dark:text-gray-400">
              <div className="animate-pulse">Loading conversation...</div>
            </div>
          </div>
        ) : selectedConversation && selectedUser ? (
          <>
            <div ref={headerRef} className={`${isNativeIOSApp() ? 'px-3 py-1' : 'px-4 py-2'} border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0`}>
              <div className="flex items-center gap-3">
                {/* Back button for mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/messages')}
                  className="lg:hidden text-gray-600 dark:text-gray-400"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                
                <div className="cursor-pointer" onClick={() => navigate(`/profile/${selectedUser.userId}`)}>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedUser.profileImage} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {selectedUser.username?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900 dark:text-white truncate">@{selectedUser.username}</h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{selectedUser.location}</p>
                </div>
              </div>
            </div>

            {/* Messages area with scroll */}
            <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-2 bg-[#efeae2] dark:bg-[#0b141a]" style={{
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
                        const isOwnMessage = msg.senderId === user?.id;
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
                                <div className={`px-4 py-2 rounded-2xl ${isOwnMessage ? 'bg-green-600' : 'bg-gray-700'}`}>
                                  <Textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full mb-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white resize-none"
                                    rows={3}
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleEditMessage(msg.id)} className="bg-green-600 hover:bg-green-700 text-white">
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
                                    ? 'bg-green-600 dark:bg-green-600' 
                                    : 'bg-gray-200 dark:bg-gray-700'
                                }`} style={{ overflow: 'visible' }}>
                                  {/* Reply Context */}
                                  {msg.replyToId && msg.repliedMessage && (
                                    <div className={`mb-2 pl-2 border-l-2 ${
                                      isOwnMessage 
                                        ? 'border-white/50' 
                                        : 'border-gray-400 dark:border-gray-500'
                                    }`}>
                                      <p className={`text-xs opacity-70 ${
                                        isOwnMessage 
                                          ? 'text-white' 
                                          : 'text-gray-600 dark:text-gray-400'
                                      }`}>
                                        {msg.repliedMessage.senderId === user?.id ? 'You' : `@${selectedUser?.username}`}
                                      </p>
                                      <p className={`text-xs opacity-80 truncate ${
                                        isOwnMessage 
                                          ? 'text-white' 
                                          : 'text-gray-700 dark:text-gray-300'
                                      }`}>
                                        {msg.repliedMessage.content}
                                      </p>
                                    </div>
                                  )}
                                  
                                  <p className={`text-sm whitespace-pre-wrap break-words ${
                                    isOwnMessage 
                                      ? 'text-white' 
                                      : 'text-gray-900 dark:text-gray-100'
                                  }`}>
                                    {msg.content}
                                  </p>
                                  <div className="flex items-center justify-end gap-1 mt-1">
                                    <p className={`text-xs opacity-70 ${
                                      isOwnMessage 
                                        ? 'text-white' 
                                        : 'text-gray-600 dark:text-gray-400'
                                    }`}>
                                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    {msg.isEdited && <span className="text-xs opacity-60 italic text-gray-400">Edited</span>}
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

            {/* Message Input - Fixed at bottom in flex layout */}
            <div ref={inputContainerRef} className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
                {/* Reply Bar */}
                {replyingTo && (
                  <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded max-w-4xl mx-auto">
                    <Reply className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Replying to @{replyingTo.senderId === user?.id ? 'You' : selectedUser?.username}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {replyingTo.content}
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
                    className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-600 dark:text-gray-500">
              <MessageCircle className="w-20 h-20 mx-auto mb-6 opacity-30" />
              <h3 className="text-2xl font-medium mb-2 text-gray-800 dark:text-gray-300">Welcome to Messages</h3>
              <p className="text-gray-600 dark:text-gray-400">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Contacts List (Hidden on mobile and tablet) */}
      <div className="hidden xl:flex w-72 h-full bg-gray-50 dark:bg-gray-900 flex-col border-l-2 border-gray-300 dark:border-gray-500">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Contacts
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
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={contact.profileImage} />
                      <AvatarFallback className="bg-green-600 text-white text-sm">
                        {contact.username?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                      }`}>
                        @{contact.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {contact.hometownCity || contact.location || 'Location unknown'}
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
            className="fixed inset-0 bg-black/60 z-[99998]"
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
              {selectedMessage.senderId === user?.id && (
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
    </div>
  );
}