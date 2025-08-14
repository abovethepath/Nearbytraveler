import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authStorage } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, Users, ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { SimpleAvatar } from '@/components/simple-avatar';
import websocketService from '@/services/websocketService';
import { useLocation } from 'wouter';
import { openFloatingChat } from '@/components/instant-messaging/FloatingChatManager';
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
  
  // Get target user ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const targetUserId = urlParams.get('userId') || urlParams.get('recipient');

  // Fetch connections
  const { data: connections = [], isLoading: connectionsLoading } = useQuery({
    queryKey: [`/api/connections/${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: [`/api/messages/${user?.id}`],
    enabled: !!user?.id,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
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
          username: connectedUser.username,
          profileImage: connectedUser.profileImage,
          location: connectedUser.hometownCity || connectedUser.location,
          lastMessage: '', // Don't show message preview in connections list
          lastMessageTime: connection.createdAt,
        });
      }
    });

    // Add target user if from URL
    if (targetUserId && !conversationMap.has(parseInt(targetUserId))) {
      const targetUser = (allUsers as any[]).find((u: any) => u.id === parseInt(targetUserId));
      if (targetUser) {
        conversationMap.set(parseInt(targetUserId), {
          userId: parseInt(targetUserId),
          username: targetUser.username,
          profileImage: targetUser.profileImage,
          location: targetUser.hometownCity || targetUser.location,
          lastMessage: 'Start a conversation...',
          lastMessageTime: new Date().toISOString(),
        });
      }
    }

    // Update with latest messages
    (messages as any[]).forEach((message: any) => {
      const otherUserId = message.senderId === user?.id ? message.receiverId : message.senderId;
      if (otherUserId !== user?.id) {
        const existing = conversationMap.get(otherUserId);
        if (existing) {
          conversationMap.set(otherUserId, {
            ...existing,
            lastMessage: message.content,
            lastMessageTime: message.createdAt,
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
          });
        }
      }
    });

    return Array.from(conversationMap.values()).sort((a: any, b: any) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  }, [connections, messages, allUsers, targetUserId, user?.id]);

  // Auto-select target conversation
  useEffect(() => {
    if (targetUserId && conversations.length > 0 && !selectedConversation) {
      const targetConv = conversations.find((conv: any) => conv.userId === parseInt(targetUserId));
      if (targetConv) {
        setSelectedConversation(parseInt(targetUserId));
      }
    }
  }, [targetUserId, conversations, selectedConversation]);

  // Get messages for selected conversation (including instant messages)
  const conversationMessages = selectedConversation 
    ? [
        ...(messages as any[]).filter((message: any) => 
          (message.senderId === user?.id && message.receiverId === selectedConversation) ||
          (message.receiverId === user?.id && message.senderId === selectedConversation)
        ),
        ...instantMessages.filter((message: any) =>
          (message.senderId === user?.id && message.receiverId === selectedConversation) ||
          (message.receiverId === user?.id && message.senderId === selectedConversation)
        )
      ].sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    : [];

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
    
    // Use WebSocket instant messaging if connected
    if (websocketService.isConnected()) {
      console.log('📤 Sending instant message via WebSocket');
      websocketService.sendInstantMessage(selectedConversation, newMessage.trim());
      
      // Add to local instant messages for immediate display
      setInstantMessages(prev => [...prev, {
        id: Date.now(),
        senderId: user?.id,
        receiverId: selectedConversation,
        content: newMessage.trim(),
        createdAt: new Date().toISOString(),
        messageType: 'instant'
      }]);
      
      setNewMessage('');
    } else {
      // Fallback to regular API call
      console.log('📤 Sending message via API (WebSocket offline)');
      sendMessageMutation.mutate({
        receiverId: selectedConversation,
        content: newMessage.trim(),
      });
    }
  };

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
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">Recovering authentication...</div>
      </div>
    );
  }

  console.log('✅ Messages - User authenticated:', user.username, 'ID:', user.id);

  // Show loading only if no target user and still loading
  if ((connectionsLoading || messagesLoading) && !targetUserId) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col md:flex-row">
      {/* Left Sidebar - Conversations */}
      <div className="w-full md:w-80 bg-gray-800 flex flex-col border-r-0 md:border-r-2 border-b md:border-b-0 border-gray-500">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <UniversalBackButton 
              destination="/discover"
              label=""
              className="text-gray-400 hover:text-white bg-transparent border-none shadow-none hover:bg-gray-700/50 p-2"
            />
            <h1 className="text-lg md:text-xl font-bold text-white">Messages</h1>
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={connectionSearch}
            onChange={(e) => setConnectionSearch(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
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
                  className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 ${
                    selectedConversation === conv.userId ? 'bg-gray-700' : ''
                  }`}
                  onClick={() => {
                    console.log('🔥 CONVERSATION CLICKED:', conv.username, 'ID:', conv.userId);
                    setSelectedConversation(conv.userId);
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
                      <h3 className="font-semibold text-white truncate">
                        {conv.username}
                      </h3>

                      <div className="text-xs text-gray-500">
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConversation(null)}
                  className="text-gray-400 hover:text-white md:hidden"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div 
                  className="cursor-pointer"
                  onClick={() => navigate(`/profile/${selectedUser.id}`)}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedUser.profileImage} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {selectedUser.username?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {selectedUser.username}
                  </h3>
                  {typingUsers[selectedConversation] && (
                    <p className="text-xs text-blue-400">typing...</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Online • {selectedUser.location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
              {conversationMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No messages yet</p>
                  <p className="text-sm mt-1">Send the first message!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversationMessages.map((message: any) => {
                    const isOwnMessage = message.senderId === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isOwnMessage && (
                          <div 
                            className="cursor-pointer mr-3 flex-shrink-0"
                            onClick={() => window.location.href = `/profile/${selectedUser.id}`}
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={selectedUser.profileImage} />
                              <AvatarFallback className="bg-blue-600 text-white text-xs">
                                {selectedUser.username?.charAt(0)?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-white'
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700 bg-gray-800">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && newMessage.trim() && handleSendMessage()}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center text-gray-500">
              <MessageCircle className="w-20 h-20 mx-auto mb-6 opacity-30" />
              <h3 className="text-2xl font-medium mb-2 text-gray-300">Welcome to Messages</h3>
              <p className="text-gray-400">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Connections */}
      <div className="hidden lg:flex w-80 bg-gray-800 flex-col border-l-2 border-gray-500">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            Connections
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {(connections as any[]).length === 0 ? (
            <div className="text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No connections yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(connections as any[]).map((connection: any) => (
                <div
                  key={connection.id}
                  className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="cursor-pointer"
                      onClick={() => navigate(`/profile/${connection.connectedUser.id}`)}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={connection.connectedUser.profileImage} />
                        <AvatarFallback className="bg-green-600 text-white">
                          {connection.connectedUser.username?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">
                        {connection.connectedUser.username}
                      </h4>
                      <p className="text-sm text-gray-400 truncate">
                        📍 {connection.connectedUser.hometownCity || connection.connectedUser.location} • 
                        {connection.connectedUser.userType === 'traveler' ? ' ✈️ Traveling' : 
                         connection.connectedUser.userType === 'business' ? ' 🏢 Business' : ' 🏠 Local'}
                      </p>

                    </div>
                  </div>
                  
                  {/* Dual Button System - Exact Match to Screenshots */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setSelectedConversation(connection.connectedUser.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                      Open Chat
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        // Open floating chat box
                        openFloatingChat(connection.connectedUser);
                      }}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium"
                    >
                      Instantly Message
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}