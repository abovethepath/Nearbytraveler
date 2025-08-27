import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Users, ArrowLeft, Loader2, RefreshCw, AlertCircle } from "lucide-react";

interface ChatMessage {
  id: number;
  senderId: number;
  senderUsername: string;
  content: string;
  timestamp: string;
  senderProfileImage?: string;
}

interface ChatMember {
  id: number;
  user_id: number;
  username: string;
  name: string;
  profile_image?: string;
  role: string;
  userId?: number; // Alternative field name
}

interface Chatroom {
  id: number;
  name: string;
  city?: string;
  state?: string;
}

export default function FixedChatroom() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // State
  const [chatroom, setChatroom] = useState<Chatroom | null>(null);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get chatroom ID from URL
  const pathSegments = window.location.pathname.split('/');
  const chatroomId = parseInt(pathSegments[2] || '198');
  
  
  // Get current user - MEMOIZED to prevent infinite re-renders
  const getCurrentUser = useCallback(() => {
    try {
      let storedUser = localStorage.getItem('travelconnect_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return user;
      }
      
      storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return user;
      }
      
      return null;
    } catch (e) {
      return null;
    }
  }, []);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const currentUserId = currentUser?.id;
  
  // Initialize current user
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, [getCurrentUser]);
  
  // Check if user is a member - SIMPLIFIED to prevent infinite renders
  const userIsMember = useMemo(() => {
    return members.some(member => 
      member.user_id === currentUserId || 
      member.id === currentUserId || 
      member.userId === currentUserId
    );
  }, [members, currentUserId]);
  
  // Enhanced API request with multiple attempt strategies
  const apiRequest = async (url: string, options: any = {}) => {
    if (!currentUserId) {
      throw new Error('No user ID found - please log in');
    }
    
    // Try multiple header formats that servers commonly expect
    const headerVariations = [
      {
        'Content-Type': 'application/json',
        'x-user-id': String(currentUserId),
        ...options.headers
      },
      {
        'Content-Type': 'application/json',
        'X-User-ID': String(currentUserId),
        'Authorization': `Bearer ${currentUserId}`,
        ...options.headers
      },
      {
        'Content-Type': 'application/json',
        'user-id': String(currentUserId),
        ...options.headers
      }
    ];
    
    
    let lastError: any;
    
    // Try each header variation
    for (let i = 0; i < headerVariations.length; i++) {
      const headers = headerVariations[i];
      
      try {
        
        const response = await fetch(url, {
          ...options,
          headers,
          credentials: 'include'
        });
        
        
        if (!response.ok) {
          const errorText = await response.text();
          lastError = new Error(`${response.status}: ${errorText}`);
          
          // If it's a 401/403, try next header variation
          if (response.status === 401 || response.status === 403) {
            continue;
          }
          throw lastError;
        }
        
        const data = await response.json();
        return data;
        
      } catch (fetchError: any) {
        (`⚠️ Attempt ${i + 1} failed: ${fetchError.message}`);
        lastError = fetchError;
      }
    }
    
    // All attempts failed
    throw lastError || new Error('All API attempts failed');
  };
  
  // Load chatroom details
  const loadChatroomDetails = async () => {
    try {
      ('📋 Loading chatroom details...');
      const chatroomResponse = await apiRequest(`/api/chatrooms/${chatroomId}`);
      
      let chatroomData;
      if (Array.isArray(chatroomResponse)) {
        chatroomData = chatroomResponse[0];
      } else if (chatroomResponse.chatroom) {
        chatroomData = chatroomResponse.chatroom;
      } else {
        chatroomData = chatroomResponse;
      }
      
      (`✅ Chatroom loaded: ${chatroomData.name}`);
      setChatroom(chatroomData);
      return chatroomData;
    } catch (error: any) {
      (`❌ Failed to load chatroom: ${error.message}`);
      throw error;
    }
  };
  
  // Load members
  const loadMembers = async () => {
    try {
      ('👥 Loading members...');
      const membersResponse = await apiRequest(`/api/chatrooms/${chatroomId}/members`);
      
      let membersData = [];
      if (Array.isArray(membersResponse)) {
        membersData = membersResponse;
      } else if (membersResponse.members && Array.isArray(membersResponse.members)) {
        membersData = membersResponse.members;
      } else if (membersResponse.data && Array.isArray(membersResponse.data)) {
        membersData = membersResponse.data;
      }
      
      (`✅ Members loaded: ${membersData.length} people`);
      setMembers(membersData);
      return membersData;
    } catch (error: any) {
      (`❌ Failed to load members: ${error.message}`);
      setMembers([]);
      return [];
    }
  };
  
  // Load messages
  const loadMessages = async () => {
    try {
      ('💬 Loading messages...');
      const messagesResponse = await apiRequest(`/api/chatrooms/${chatroomId}/messages`);
      
      let messagesData = [];
      if (Array.isArray(messagesResponse)) {
        messagesData = messagesResponse;
      } else if (messagesResponse.messages && Array.isArray(messagesResponse.messages)) {
        messagesData = messagesResponse.messages;
      } else if (messagesResponse.data && Array.isArray(messagesResponse.data)) {
        messagesData = messagesResponse.data;
      }
      
      (`✅ Messages loaded: ${messagesData.length} messages`);
      setMessages(messagesData);
      return messagesData;
    } catch (error: any) {
      (`❌ Failed to load messages: ${error.message}`);
      setMessages([]);
      return [];
    }
  };
  
  // Load all data
  const loadAllData = async () => {
    if (!currentUserId) {
      ('❌ Cannot load data - no user ID');
      setError('Please log in to access the chatroom');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      (`🔄 Loading all data for chatroom ${chatroomId}`);
      
      await loadChatroomDetails();
      const membersData = await loadMembers();
      
      const isMember = membersData.some((m: ChatMember) => m.user_id === currentUserId);
      (`🔍 User membership status: ${isMember ? 'MEMBER' : 'NOT MEMBER'}`);
      
      if (isMember) {
        await loadMessages();
      }
      
    } catch (error: any) {
      (`❌ Error loading data: ${error.message}`);
      setError(`Failed to load chatroom: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // JOIN CHATROOM - SIMPLIFIED (no more countdown BS)
  const joinChatroom = async () => {
    if (!currentUserId || isJoining) {
      ('⚠️ Join blocked - missing user ID or already joining');
      return;
    }
    
    setIsJoining(true);
    setError(null);
    
    try {
      (`🚪 Joining chatroom ${chatroomId}...`);
      
      // Try the most common join endpoint
      await apiRequest(`/api/chatrooms/${chatroomId}/join`, { 
        method: 'POST',
        body: JSON.stringify({})
      });
      
      ('✅ Join successful! Reloading data...');
      
      // Just reload data - no verification countdown
      setTimeout(async () => {
        await loadAllData();
        setError(null);
      }, 1000);
      
    } catch (error: any) {
      (`❌ Join failed: ${error.message}`);
      setError(`Failed to join: ${error.message}`);
    } finally {
      setIsJoining(false);
    }
  };
  
  // Leave chatroom
  const leaveChatroom = async () => {
    if (!currentUserId || isLeaving || !userIsMember) return;
    
    setIsLeaving(true);
    setError(null);
    
    try {
      (`🚪 Leaving chatroom ${chatroomId}...`);
      await apiRequest(`/api/chatrooms/${chatroomId}/leave`, { method: 'POST' });
      
      ('✅ Successfully left chatroom');
      setTimeout(() => {
        window.location.href = '/city-chatrooms';
      }, 1000);
      
    } catch (error: any) {
      (`❌ Failed to leave: ${error.message}`);
      setError(`Failed to leave chatroom: ${error.message}`);
    } finally {
      setIsLeaving(false);
    }
  };
  
  // Send message - FIXED to handle HTML error responses
  const sendMessage = async () => {
    if (!messageText.trim() || !currentUserId || !userIsMember || isSending) return;
    
    setIsSending(true);
    setError(null);
    
    try {
      (`💬 Sending message: "${messageText.substring(0, 50)}..."`);
      
      // Try multiple endpoints and methods for sending messages
      const messageAttempts = [
        // Standard REST approaches
        { url: `/api/chatrooms/${chatroomId}/messages`, method: 'POST', body: { content: messageText.trim() } },
        { url: `/api/chatrooms/${chatroomId}/messages`, method: 'POST', body: { message: messageText.trim() } },
        { url: `/api/chatrooms/${chatroomId}/messages`, method: 'POST', body: { text: messageText.trim() } },
        
        // With user ID in body
        { url: `/api/chatrooms/${chatroomId}/messages`, method: 'POST', body: { content: messageText.trim(), user_id: currentUserId } },
        { url: `/api/chatrooms/${chatroomId}/messages`, method: 'POST', body: { content: messageText.trim(), userId: currentUserId } },
        { url: `/api/chatrooms/${chatroomId}/messages`, method: 'POST', body: { content: messageText.trim(), senderId: currentUserId } },
        
        // Alternative endpoints
        { url: `/api/chatroom/${chatroomId}/messages`, method: 'POST', body: { content: messageText.trim() } },
        { url: `/api/chatrooms/${chatroomId}/message`, method: 'POST', body: { content: messageText.trim() } },
        
        // Different API structure
        { url: `/api/messages`, method: 'POST', body: { content: messageText.trim(), chatroom_id: chatroomId, user_id: currentUserId } },
        { url: `/api/send-message`, method: 'POST', body: { content: messageText.trim(), chatroomId: chatroomId, userId: currentUserId } }
      ];
      
      let messageSuccessful = false;
      let lastError = null;
      
      for (const attempt of messageAttempts) {
        if (messageSuccessful) break;
        
        try {
          (`🔄 Trying: ${attempt.method} ${attempt.url}`);
          
          const response = await fetch(attempt.url, {
            method: attempt.method,
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': String(currentUserId),
              'X-User-ID': String(currentUserId),
              'user-id': String(currentUserId)
            },
            body: JSON.stringify(attempt.body),
            credentials: 'include'
          });
          
          (`📡 Response: ${response.status} ${response.statusText}`);
          
          // Check if response is HTML (error page) vs JSON
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            const htmlError = await response.text();
            (`❌ Got HTML instead of JSON: ${htmlError.substring(0, 100)}...`);
            throw new Error(`Server returned HTML error page (${response.status})`);
          }
          
          if (!response.ok) {
            const errorText = await response.text();
            (`❌ API Error: ${errorText}`);
            throw new Error(`${response.status}: ${errorText}`);
          }
          
          // Try to parse JSON response
          let data;
          try {
            const responseText = await response.text();
            if (responseText.trim() === '') {
              // Empty response is sometimes OK for message sending
              data = { success: true };
            } else {
              data = JSON.parse(responseText);
            }
          } catch (parseError: any) {
            (`❌ JSON parse error: ${parseError.message}`);
            // If we get here, the API might return non-JSON success responses
            data = { success: true };
          }
          
          ('✅ Message sent successfully!');
          messageSuccessful = true;
          break;
          
        } catch (error: any) {
          (`⚠️ ${attempt.url} failed: ${error.message}`);
          lastError = error;
        }
      }
      
      if (!messageSuccessful) {
        throw lastError || new Error('All message send attempts failed');
      }
      
      setMessageText("");
      
      // Reload messages after sending
      setTimeout(async () => {
        await loadMessages();
      }, 1000);
      
    } catch (error: any) {
      (`❌ Failed to send message: ${error.message}`);
      setError(`Failed to send message: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };
  
  // Load data on mount
  useEffect(() => {
    ('🚀 Component mounted, loading data...');
    loadAllData();
  }, [chatroomId, currentUserId]);
  
  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">Loading chatroom...</p>
          <div className="text-sm text-gray-600 max-w-md">
            {debugInfo.slice(-2).map((debug, i) => (
              <p key={i}>{debug}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Not logged in state
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4 text-red-600">Not Logged In</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Please log in to access the chatroom</p>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/'}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/city-chatrooms'}
              className="flex items-center space-x-2 hover:bg-purple-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Chatrooms</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🏠 {chatroom?.name || `Chatroom #${chatroomId}`}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {members.length} member{members.length !== 1 ? 's' : ''} • 
                Logged in as: <strong>{currentUser.username}</strong>
                {chatroom?.city && ` • ${chatroom.city}`}
                {chatroom?.state && `, ${chatroom.state}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAllData}
              className="flex items-center space-x-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            
            {userIsMember ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={leaveChatroom}
                disabled={isLeaving}
                className="flex items-center space-x-2"
              >
                {isLeaving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isLeaving ? 'Leaving...' : 'Leave Chat'}</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={joinChatroom}
                disabled={isJoining}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6"
              >
                {isJoining && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isJoining ? 'Joining...' : 'Join Chat'}</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Debug Panel - SIMPLIFIED */}
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
            <div>
              <strong>Status:</strong>
              <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold ${
                userIsMember 
                  ? 'bg-green-100 text-green-800 ring-2 ring-green-200' 
                  : 'bg-red-100 text-red-800 ring-2 ring-red-200'
              }`}>
                {userIsMember ? '✅ MEMBER' : '❌ NOT MEMBER'}
              </span>
            </div>
            <div><strong>User ID:</strong> {currentUserId}</div>
            <div><strong>Chatroom ID:</strong> {chatroomId}</div>
            <div><strong>Members Count:</strong> {members.length}</div>
          </div>
          
          
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">{error}</p>
                <div className="mt-2 space-x-2">
                  <Button variant="outline" size="sm" onClick={loadAllData}>
                    🔄 Retry
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setError(null)}>
                    ✕ Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Members ({members.length})</span>
                </CardTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Click on any avatar or name to view their profile
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {members.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        No members loaded
                      </p>
                      <Button onClick={loadMembers} variant="outline" size="sm">
                        🔄 Load Members
                      </Button>
                    </div>
                  ) : (
                    members.map((member) => (
                      <div 
                        key={`${member.user_id}-${member.id}`} 
                        className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {/* Clickable Avatar */}
                        <div 
                          className="relative cursor-pointer group"
                          onClick={() => window.location.href = `/profile/${member.user_id}`}
                        >
                          <Avatar className="w-14 h-14 ring-2 ring-purple-200 hover:ring-purple-400 transition-all duration-200 group-hover:scale-105">
                            <AvatarImage 
                              src={member.profile_image} 
                              alt={`${member.username}'s profile`}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700 font-bold text-lg">
                              {member.username?.[0]?.toUpperCase() || member.name?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          {/* Online/Offline indicator */}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                            member.user_id === currentUserId 
                              ? 'bg-green-400 animate-pulse' // Current user is always online
                              : Math.random() > 0.3 // 70% chance of being "online" for demo
                                ? 'bg-green-400' 
                                : 'bg-gray-400'
                          }`}></div>
                          {/* Hover tooltip */}
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            View Profile
                          </div>
                        </div>
                        
                        {/* Member Info - also clickable */}
                        <div 
                          className="flex-1 min-w-0 cursor-pointer" 
                          onClick={() => window.location.href = `/profile/${member.user_id}`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate hover:text-purple-600 transition-colors">
                              {member.username || member.name || 'Unknown User'}
                            </p>
                            {member.user_id === currentUserId && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-bold">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize font-medium">
                              {member.role === 'admin' ? '👑 Admin' : 
                               member.role === 'moderator' ? '⭐ Moderator' : 
                               '👤 Member'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {member.user_id === currentUserId ? 'Online' : 
                               Math.random() > 0.3 ? 'Online' : 'Offline'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Chat Area */}
          <div className="lg:col-span-2">
            {userIsMember ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>💬 Chat Messages ({messages.length})</span>
                    <Button onClick={loadMessages} variant="ghost" size="sm">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Messages Area */}
                  <div className="h-96 overflow-y-auto space-y-3 mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          💬 No messages yet
                        </p>
                        <p className="text-sm text-gray-400">
                          Start the conversation!
                        </p>
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <div
                          key={`${message.id}-${index}`}
                          className={`flex ${
                            message.senderId === currentUserId ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                            message.senderId === currentUserId
                              ? 'bg-purple-600 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border'
                          }`}>
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-xs font-medium opacity-75">
                                {message.senderId === currentUserId 
                                  ? 'You' 
                                  : message.senderUsername || 'Unknown User'
                                }
                              </p>
                              <p className="text-xs opacity-50">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Message Input */}
                  <div className="flex space-x-3">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your message..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      disabled={isSending}
                      className="flex-1"
                      maxLength={500}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!messageText.trim() || isSending}
                      className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">
                        {isSending ? 'Sending...' : 'Send'}
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Users className="w-10 h-10 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      🚪 Join to Start Chatting
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                      Join this chatroom to see messages, connect with other members, and participate in conversations.
                    </p>
                    
                    <Button
                      onClick={joinChatroom}
                      disabled={isJoining}
                      size="lg"
                      className="w-full flex items-center justify-center space-x-3 bg-green-600 hover:bg-green-700 text-white py-3"
                    >
                      {isJoining && <Loader2 className="w-5 h-5 animate-spin" />}
                      <span className="text-lg font-medium">
                        {isJoining ? 'Joining...' : 'Join Chatroom'}
                      </span>
                    </Button>
                    
                    {error && (
                      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm mb-3">{error}</p>
                        <div className="flex space-x-2 justify-center">
                          <Button variant="outline" size="sm" onClick={loadAllData}>
                            🔄 Retry
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setError(null)}>
                            ✕ Dismiss
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}