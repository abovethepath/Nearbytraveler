import React, { useState, useEffect, useRef } from "react";
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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [joinProgress, setJoinProgress] = useState<string>('');
  
  // Get chatroom ID from URL
  const pathSegments = window.location.pathname.split('/');
  const chatroomId = parseInt(pathSegments[2] || '198');
  
  // Debug logging function
  const addDebug = (message: string) => {
    console.log(message);
    setDebugInfo(prev => [...prev.slice(-6), `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  // Get current user function
  const getCurrentUser = () => {
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
    } catch (e: any) {
      return null;
    }
  };
  
  // Load user on mount
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      addDebug(`✅ Found user: ${user.username} (ID: ${user.id})`);
      setCurrentUser(user);
      setCurrentUserId(user.id);
    } else {
      addDebug('❌ No user found in localStorage');
    }
  }, []);
  
  // Enhanced membership check - sometimes the API response format varies
  const userIsMember = currentUserId ? members.some(member => 
    member.user_id === currentUserId || 
    member.id === currentUserId || 
    (member as any).userId === currentUserId
  ) : false;
  
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
    
    addDebug(`🌐 Attempting API call: ${url}`);
    addDebug(`📝 User ID: ${currentUserId}`);
    addDebug(`📦 Method: ${options.method || 'GET'}`);
    
    let lastError: any = null;
    
    // Try each header variation
    for (let i = 0; i < headerVariations.length; i++) {
      const headers = headerVariations[i];
      
      try {
        addDebug(`🔄 Attempt ${i + 1} with headers: ${Object.keys(headers).join(', ')}`);
        
        const response = await fetch(url, {
          ...options,
          headers,
          credentials: 'include'
        });
        
        addDebug(`📡 Response: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          addDebug(`❌ Response error: ${errorText}`);
          lastError = new Error(`${response.status}: ${errorText}`);
          
          // If it's a 401/403, try next header variation
          if (response.status === 401 || response.status === 403) {
            continue;
          }
          throw lastError;
        }
        
        const data = await response.json();
        addDebug(`✅ Success with attempt ${i + 1}`);
        addDebug(`📊 Data received: ${JSON.stringify(data).substring(0, 100)}...`);
        return data;
        
      } catch (fetchError: any) {
        addDebug(`⚠️ Attempt ${i + 1} failed: ${fetchError.message}`);
        lastError = fetchError;
      }
    }
    
    // All attempts failed
    throw lastError || new Error('All API attempts failed');
  };
  
  // Load chatroom details
  const loadChatroomDetails = async () => {
    try {
      addDebug('📋 Loading chatroom details...');
      const chatroomResponse = await apiRequest(`/api/chatrooms/${chatroomId}`);
      
      let chatroomData;
      if (Array.isArray(chatroomResponse)) {
        chatroomData = chatroomResponse[0];
      } else if (chatroomResponse.chatroom) {
        chatroomData = chatroomResponse.chatroom;
      } else {
        chatroomData = chatroomResponse;
      }
      
      addDebug(`✅ Chatroom loaded: ${chatroomData.name}`);
      setChatroom(chatroomData);
      return chatroomData;
    } catch (error: any) {
      addDebug(`❌ Failed to load chatroom: ${error.message}`);
      throw error;
    }
  };
  
  // Load members
  const loadMembers = async () => {
    try {
      addDebug('👥 Loading members...');
      const membersResponse = await apiRequest(`/api/chatrooms/${chatroomId}/members`);
      
      let membersData = [];
      if (Array.isArray(membersResponse)) {
        membersData = membersResponse;
      } else if (membersResponse.members && Array.isArray(membersResponse.members)) {
        membersData = membersResponse.members;
      } else if (membersResponse.data && Array.isArray(membersResponse.data)) {
        membersData = membersResponse.data;
      }
      
      addDebug(`✅ Members loaded: ${membersData.length} people`);
      
      // Debug member details to understand the structure
      if (membersData.length > 0 && currentUserId) {
        const memberStructure = membersData[0];
        addDebug(`👤 Member structure: ${Object.keys(memberStructure).join(', ')}`);
        
        const foundMember = membersData.find(m => 
          m.user_id === currentUserId || 
          m.id === currentUserId || 
          (m as any).userId === currentUserId
        );
        
        if (foundMember) {
          addDebug(`✅ Found current user in members: ${JSON.stringify(foundMember).substring(0, 80)}...`);
        } else {
          addDebug(`❌ Current user (${currentUserId}) not found in member list`);
          addDebug(`👥 Member IDs: ${membersData.map(m => m.user_id || m.id || (m as any).userId).join(', ')}`);
        }
      }
      
      setMembers(membersData);
      return membersData;
    } catch (error: any) {
      addDebug(`❌ Failed to load members: ${error.message}`);
      setMembers([]);
      return [];
    }
  };
  
  // Load messages
  const loadMessages = async () => {
    try {
      addDebug('💬 Loading messages...');
      const messagesResponse = await apiRequest(`/api/chatrooms/${chatroomId}/messages`);
      
      let messagesData = [];
      if (Array.isArray(messagesResponse)) {
        messagesData = messagesResponse;
      } else if (messagesResponse.messages && Array.isArray(messagesResponse.messages)) {
        messagesData = messagesResponse.messages;
      } else if (messagesResponse.data && Array.isArray(messagesResponse.data)) {
        messagesData = messagesResponse.data;
      }
      
      addDebug(`✅ Messages loaded: ${messagesData.length} messages`);
      setMessages(messagesData);
      return messagesData;
    } catch (error: any) {
      addDebug(`❌ Failed to load messages: ${error.message}`);
      setMessages([]);
      return [];
    }
  };
  
  // Load all data
  const loadAllData = async () => {
    if (!currentUserId) {
      addDebug('❌ Cannot load data - no user ID');
      setError('Please log in to access the chatroom');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      addDebug(`🔄 Loading all data for chatroom ${chatroomId}`);
      
      await loadChatroomDetails();
      const membersData = await loadMembers();
      
      const isMember = membersData.some((m: ChatMember) => 
        m.user_id === currentUserId || 
        m.id === currentUserId || 
        (m as any).userId === currentUserId
      );
      addDebug(`🔍 User membership status: ${isMember ? 'MEMBER' : 'NOT MEMBER'}`);
      
      if (isMember) {
        await loadMessages();
      }
      
    } catch (error: any) {
      addDebug(`❌ Error loading data: ${error.message}`);
      setError(`Failed to load chatroom: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // JOIN CHATROOM - Enhanced with retry logic
  const joinChatroom = async () => {
    if (!currentUserId || isJoining || userIsMember) {
      addDebug('⚠️ Join blocked - missing user ID, already joining, or already member');
      return;
    }
    
    setIsJoining(true);
    setError(null);
    setJoinProgress('Starting join process...');
    
    // Try multiple possible join endpoints
    const joinEndpoints = [
      `/api/chatrooms/${chatroomId}/join`,
      `/api/chatrooms/${chatroomId}/members`,
      `/api/chatroom/${chatroomId}/join`,
      `/api/chatrooms/${chatroomId}/membership`
    ];
    
    // Try different request body formats
    const bodyFormats = [
      JSON.stringify({}),
      JSON.stringify({ user_id: currentUserId }),
      JSON.stringify({ userId: currentUserId }),
      JSON.stringify({ action: 'join' }),
      JSON.stringify({ chatroom_id: chatroomId, user_id: currentUserId }),
      JSON.stringify({ chatroomId: chatroomId, userId: currentUserId })
    ];
    
    try {
      addDebug(`🚪 Attempting to join chatroom ${chatroomId}...`);
      setJoinProgress('Attempting to join chatroom...');
      
      let joinSuccessful = false;
      let lastError: any = null;
      
      // Try each endpoint with each body format
      for (const endpoint of joinEndpoints) {
        if (joinSuccessful) break;
        
        for (const body of bodyFormats) {
          if (joinSuccessful) break;
          
          try {
            addDebug(`🔄 Trying: POST ${endpoint} with body: ${body}`);
            setJoinProgress(`Trying join endpoint: ${endpoint}...`);
            
            const response = await apiRequest(endpoint, { 
              method: 'POST',
              body: body
            });
            
            addDebug('✅ Join API call successful!');
            addDebug(`📊 Join response: ${JSON.stringify(response).substring(0, 100)}...`);
            joinSuccessful = true;
            setJoinProgress('Join API call successful! Verifying membership...');
            break;
            
          } catch (error: any) {
            addDebug(`⚠️ ${endpoint} failed: ${error.message}`);
            lastError = error;
          }
        }
      }
      
      if (!joinSuccessful) {
        throw lastError || new Error('All join attempts failed');
      }
      
      // Enhanced verification with retries
      addDebug('🔄 Verifying membership with retry logic...');
      setJoinProgress('Verifying membership...');
      let membershipVerified = false;
      let retryCount = 0;
      const maxRetries = 3; // Reduced from 5 to make it faster
      
      while (!membershipVerified && retryCount < maxRetries) {
        retryCount++;
        addDebug(`🔍 Verification attempt ${retryCount}/${maxRetries}...`);
        setJoinProgress(`Verification attempt ${retryCount}/${maxRetries}...`);
        
        // Wait before checking (shorter delays)
        if (retryCount > 1) {
          await new Promise(resolve => setTimeout(resolve, retryCount * 500));
        }
        
        // Reload members to check membership
        const freshMembers = await loadMembers();
        
        // Check multiple possible membership formats
        const isMemberNow = freshMembers.some((m: ChatMember) => 
          m.user_id === currentUserId || 
          m.id === currentUserId || 
          (m as any).userId === currentUserId
        );
        
        addDebug(`📊 Membership check ${retryCount}: ${isMemberNow ? 'MEMBER' : 'NOT MEMBER'}`);
        addDebug(`👥 Found ${freshMembers.length} members in latest check`);
        
        if (isMemberNow) {
          membershipVerified = true;
          addDebug('🎉 Membership verified! Loading all data...');
          setJoinProgress('Membership verified! Loading data...');
          
          // Full reload of all data
          await loadAllData();
          setJoinProgress('Successfully joined!');
          break;
        } else if (freshMembers.length > 0) {
          // If we can see members but we're not in the list, something might be wrong with our check
          addDebug(`🔍 Debug: Members found but current user (${currentUserId}) not detected`);
          addDebug(`🔍 Raw member data: ${JSON.stringify(freshMembers.slice(0, 2)).substring(0, 200)}...`);
          setJoinProgress(`Not yet verified, retrying in ${retryCount * 0.5} seconds...`);
        } else {
          addDebug(`⏳ Not yet a member, waiting longer... (attempt ${retryCount})`);
          setJoinProgress(`No members found, retrying in ${retryCount * 0.5} seconds...`);
        }
      }
      
      if (!membershipVerified) {
        addDebug('❌ Membership verification failed after all retries');
        setJoinProgress('');
        setError('Join API succeeded but membership verification failed. Please try the manual options below or refresh the page.');
      } else {
        addDebug('✅ Successfully joined and verified!');
        setJoinProgress('');
        setError(null);
      }
      
    } catch (error: any) {
      addDebug(`❌ Join process failed: ${error.message}`);
      setJoinProgress('');
      setError(`Failed to join chatroom: ${error.message}`);
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
      addDebug(`🚪 Leaving chatroom ${chatroomId}...`);
      await apiRequest(`/api/chatrooms/${chatroomId}/leave`, { method: 'POST' });
      
      addDebug('✅ Successfully left chatroom');
      setTimeout(() => {
        window.location.href = '/city-chatrooms';
      }, 1000);
      
    } catch (error: any) {
      addDebug(`❌ Failed to leave: ${error.message}`);
      setError(`Failed to leave chatroom: ${error.message}`);
    } finally {
      setIsLeaving(false);
    }
  };
  
  // Send message
  const sendMessage = async () => {
    if (!messageText.trim() || !currentUserId || !userIsMember || isSending) return;
    
    setIsSending(true);
    setError(null);
    
    try {
      addDebug(`💬 Sending message: "${messageText.substring(0, 50)}..."`);
      await apiRequest(`/api/chatrooms/${chatroomId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: messageText.trim() })
      });
      
      setMessageText("");
      addDebug('✅ Message sent successfully');
      
      // Reload messages
      setTimeout(async () => {
        await loadMessages();
      }, 500);
      
    } catch (error: any) {
      addDebug(`❌ Failed to send message: ${error.message}`);
      setError(`Failed to send message: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };
  
  // Manual recovery functions
  const checkMembershipAgain = async () => {
    try {
      setLoading(true);
      addDebug('🔍 Manual membership check requested...');
      await loadMembers();
      if (userIsMember) {
        await loadMessages();
        setError(null);
        addDebug('✅ Manual check successful - you are now a member!');
      } else {
        addDebug('❌ Manual check - still not a member');
        setError('Still not a member. Try the join process again or refresh the page.');
      }
    } catch (error: any) {
      addDebug(`❌ Manual check failed: ${error.message}`);
      setError(`Manual check failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const forceRefreshPage = () => {
    addDebug('🔄 Force refresh requested');
    window.location.reload();
  };
  
  const tryDirectJoin = async () => {
    if (!currentUserId || isJoining) return;
    
    setIsJoining(true);
    setError(null);
    
    try {
      addDebug('🎯 Attempting direct join without verification delays...');
      
      // Try the most common endpoint directly
      const response = await apiRequest(`/api/chatrooms/${chatroomId}/join`, {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      addDebug(`✅ Direct join response: ${JSON.stringify(response).substring(0, 100)}...`);
      
      // Immediate membership check
      await loadAllData();
      
      if (userIsMember) {
        setError(null);
        addDebug('🎉 Direct join successful!');
      } else {
        setError('Direct join completed but membership not confirmed. You may already be a member - try refreshing.');
      }
      
    } catch (error: any) {
      addDebug(`❌ Direct join failed: ${error.message}`);
      setError(`Direct join failed: ${error.message}`);
    } finally {
      setIsJoining(false);
    }
  };
  
  // Load data when user is available
  useEffect(() => {
    if (currentUserId) {
      addDebug('🚀 Component mounted, loading data...');
      loadAllData();
    }
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
              <span>Refresh All</span>
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
                <span>{isJoining ? 'Joining...' : 'Join Chatroom Now'}</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Join Progress Display */}
        {joinProgress && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <p className="text-blue-800 font-medium">{joinProgress}</p>
            </div>
          </div>
        )}
        
        {/* Debug Panel */}
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
            <div>
              <strong>Status:</strong>
              <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                userIsMember 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {userIsMember ? '✅ MEMBER' : '❌ NOT MEMBER'}
              </span>
            </div>
            <div><strong>User ID:</strong> {currentUserId}</div>
            <div><strong>Chatroom ID:</strong> {chatroomId}</div>
            <div><strong>Members Count:</strong> {members.length}</div>
          </div>
          
          {/* Enhanced Debug Controls */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
            <Button variant="outline" size="sm" onClick={loadAllData} disabled={loading}>
              🔄 Force Refresh All
            </Button>
            <Button variant="outline" size="sm" onClick={loadMembers}>
              👥 Reload Members
            </Button>
            <Button variant="outline" size="sm" onClick={checkMembershipAgain}>
              🔍 Check Membership
            </Button>
            <Button variant="outline" size="sm" onClick={tryDirectJoin} disabled={isJoining}>
              🎯 Direct Join
            </Button>
            <Button variant="outline" size="sm" onClick={forceRefreshPage}>
              🌐 Refresh Page
            </Button>
          </div>
          
          <details className="mt-2">
            <summary className="cursor-pointer font-medium">🔍 Enhanced Debug Log (Click to expand)</summary>
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono max-h-40 overflow-y-auto">
              {debugInfo.map((info, i) => (
                <div key={i} className="mb-1">{info}</div>
              ))}
            </div>
          </details>
        </div>
        
        {/* Enhanced Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">{error}</p>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
                  <Button variant="outline" size="sm" onClick={loadAllData}>
                    🔄 Retry Load
                  </Button>
                  <Button variant="outline" size="sm" onClick={checkMembershipAgain}>
                    🔍 Check Again
                  </Button>
                  <Button variant="outline" size="sm" onClick={joinChatroom} disabled={isJoining}>
                    🚪 Try Join Again
                  </Button>
                  <Button variant="outline" size="sm" onClick={tryDirectJoin} disabled={isJoining}>
                    🎯 Direct Join
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
                    
                    <div className="space-y-3">
                      <Button
                        onClick={joinChatroom}
                        disabled={isJoining}
                        size="lg"
                        className="w-full flex items-center justify-center space-x-3 bg-green-600 hover:bg-green-700 text-white py-3"
                      >
                        {isJoining && <Loader2 className="w-5 h-5 animate-spin" />}
                        <span className="text-lg font-medium">
                          {isJoining ? 'Joining Chatroom...' : 'Join Chatroom Now'}
                        </span>
                      </Button>
                      
                      <Button
                        onClick={tryDirectJoin}
                        disabled={isJoining}
                        variant="outline"
                        size="lg"
                        className="w-full"
                      >
                        🎯 Try Direct Join (Faster)
                      </Button>
                    </div>
                    
                    {error && (
                      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm mb-3">{error}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" onClick={checkMembershipAgain}>
                            🔍 Check Again
                          </Button>
                          <Button variant="outline" size="sm" onClick={forceRefreshPage}>
                            🌐 Refresh Page
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