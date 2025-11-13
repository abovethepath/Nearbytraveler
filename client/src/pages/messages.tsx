import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authStorage } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatInput } from '@/components/ui/chat-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, Users, ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { SimpleAvatar } from '@/components/simple-avatar';
import websocketService from '@/services/websocketService';
import { useLocation } from 'wouter';
// REMOVED: openFloatingChat import - IM functionality removed
import { UniversalBackButton } from '@/components/UniversalBackButton';

export default function Messages() {
  const user = authStorage.getUser();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [connectionSearch, setConnectionSearch] = useState('');
  const [instantMessages, setInstantMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [userId: number]: boolean }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  
  // Get target user ID from URL path (e.g., /messages/123)
  const [location] = useLocation();
  const urlParts = location.split('/');
  const targetUserId = urlParts[2]; // /messages/:userId

  // Fetch connections
  const { data: connections = [], isLoading: connectionsLoading } = useQuery({
    queryKey: [`/api/connections/${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch messages with automatic polling for instant updates
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: [`/api/messages/${user?.id}`],
    enabled: !!user?.id,
    staleTime: 5000, // Cache for 5 seconds to reduce excessive requests
    gcTime: 10000, // Keep in cache for 10 seconds
    refetchOnWindowFocus: true, // Still refetch when user returns to tab
    refetchInterval: 10000, // Poll every 10 seconds instead of 2 (much more reasonable)
  });

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

  // Keep natural scroll position - don't auto-scroll when messages update

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
          username: connectedUser?.username || `User ${connectedUser.id}`,
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
          username: targetUser?.username || `User ${targetUserId}`,
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
            username: otherUser?.username || `User ${otherUserId}`,
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
    mutationFn: async (messageData: { receiverId: number; content: string; isInstantMessage?: boolean }) => {
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
    onError: (error) => {
      console.error('Failed to send message:', error);
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
    });
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
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
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
    <div className="h-[calc(100vh-60px)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-row">
      {/* Left Sidebar - Conversations (Always visible on desktop, hidden when chat open on mobile) */}
      <div className={`${selectedConversation ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 bg-gray-100 dark:bg-gray-800 flex-col border-r-0 lg:border-r-2 border-gray-300 dark:border-gray-500`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
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

        {/* Instructional text */}
        {conversations.length > 0 && (
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
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 ${
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
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        {selectedConversation && selectedUser ? (
          <>
            {/* Compact Header - Just show name on top */}
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
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

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-2 bg-[#efeae2] dark:bg-[#0b141a]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 800 800'%3E%3Cg fill='none' stroke='%23cccccc' stroke-width='2' opacity='0.08'%3E%3Ccircle cx='100' cy='100' r='50'/%3E%3Cpath d='M200 200 L250 250 M250 200 L200 250'/%3E%3Crect x='350' y='50' width='80' height='80' rx='10'/%3E%3Cpath d='M500 150 Q550 100 600 150 T700 150'/%3E%3Ccircle cx='150' cy='300' r='30'/%3E%3Cpath d='M300 350 L320 380 L340 340 L360 380 L380 340'/%3E%3Crect x='450' y='300' width='60' height='100' rx='30'/%3E%3Cpath d='M600 350 L650 300 L700 350 Z'/%3E%3Ccircle cx='100' cy='500' r='40'/%3E%3Cpath d='M250 500 C250 450 350 450 350 500 S250 550 250 500'/%3E%3Crect x='450' y='480' width='70' height='70' rx='15'/%3E%3Cpath d='M600 500 L650 520 L670 470 L620 450 Z'/%3E%3Ccircle cx='150' cy='700' r='35'/%3E%3Cpath d='M300 680 Q350 650 400 680'/%3E%3Crect x='500' y='650' width='90' height='60' rx='8'/%3E%3Cpath d='M150 150 L180 180 M180 150 L150 180'/%3E%3C/g%3E%3C/svg%3E")`,
              minHeight: 0
            }}>
              <div className="max-w-4xl mx-auto space-y-2">
                {conversationMessages.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  conversationMessages.map((msg: any) => {
                    const isOwnMessage = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          isOwnMessage 
                            ? 'bg-green-600 dark:bg-green-600' 
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}>
                          <p className={`text-sm whitespace-pre-wrap break-words ${
                            isOwnMessage 
                              ? 'text-white' 
                              : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {msg.content}
                          </p>
                          <p className={`text-xs opacity-70 mt-1 ${
                            isOwnMessage 
                              ? 'text-white' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input - Compact */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
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
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
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
    </div>
  );
}