import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Send, Users, ArrowLeft, Loader2 } from "lucide-react";

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

export default function WorkingChatroom() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
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
  
  // Get chatroom ID from URL
  const pathSegments = window.location.pathname.split('/');
  const chatroomId = parseInt(pathSegments[2] || '198');
  
  // Get current user
  const getCurrentUser = () => {
    try {
      const storedUser = localStorage.getItem('travelconnect_user') || localStorage.getItem('user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      return null;
    } catch (e) {
      console.error('Error parsing user:', e);
      return null;
    }
  };
  
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;
  
  // Check if user is a member
  const userIsMember = members.some(member => member.user_id === currentUserId);
  
  // Make authenticated API request
  const apiRequest = async (url: string, options: any = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': String(currentUserId || ''),
      ...options.headers
    };
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status}: ${errorText}`);
    }
    
    return response.json();
  };
  
  // Load initial data
  const loadData = async () => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      console.log('🔄 Loading chatroom data for ID:', chatroomId);
      
      // Get chatroom details and members
      const [chatroomData, membersData] = await Promise.all([
        apiRequest(`/api/chatrooms/${chatroomId}`),
        apiRequest(`/api/chatrooms/${chatroomId}/members`)
      ]);
      
      
      setChatroom(Array.isArray(chatroomData) ? chatroomData[0] : chatroomData);
      setMembers(Array.isArray(membersData) ? membersData : []);
      
      // If user is a member, load messages
      const isMember = Array.isArray(membersData) && membersData.some(m => m.user_id === currentUserId);
      if (isMember) {
        try {
          const messagesData = await apiRequest(`/api/chatrooms/${chatroomId}/messages`);
          setMessages(Array.isArray(messagesData) ? messagesData : []);
        } catch (error) {
        }
      }
      
    } catch (error) {
      console.error('❌ Error loading chatroom data:', error);
      toast({
        title: "Error",
        description: "Failed to load chatroom data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Join chatroom
  const joinChatroom = async () => {
    if (!currentUserId || isJoining || userIsMember) return;
    
    setIsJoining(true);
    try {
      console.log('🚪 Joining chatroom:', chatroomId);
      await apiRequest(`/api/chatrooms/${chatroomId}/join`, { method: 'POST' });
      
      toast({
        title: "Success",
        description: "Joined chatroom successfully!",
        className: "bg-green-50 text-green-900 border-green-200"
      });
      
      // Reload data
      await loadData();
    } catch (error) {
      console.error('❌ Error joining chatroom:', error);
      toast({
        title: "Error", 
        description: "Failed to join chatroom",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };
  
  // Leave chatroom
  const leaveChatroom = async () => {
    if (!currentUserId || isLeaving || !userIsMember) return;
    
    setIsLeaving(true);
    try {
      console.log('🚪 Leaving chatroom:', chatroomId);
      await apiRequest(`/api/chatrooms/${chatroomId}/leave`, { method: 'POST' });
      
      toast({
        title: "Success",
        description: "Left chatroom successfully",
        className: "bg-orange-50 text-orange-900 border-orange-200"
      });
      
      // Go back to chatroom list
      setTimeout(() => navigate('/city-chatrooms'), 1000);
    } catch (error) {
      console.error('❌ Error leaving chatroom:', error);
      toast({
        title: "Error",
        description: "Failed to leave chatroom",
        variant: "destructive"
      });
    } finally {
      setIsLeaving(false);
    }
  };
  
  // Send message
  const sendMessage = async () => {
    if (!messageText.trim() || !currentUserId || !userIsMember || isSending) return;
    
    setIsSending(true);
    try {
      await apiRequest(`/api/chatrooms/${chatroomId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: messageText.trim() })
      });
      
      setMessageText("");
      
      // Reload messages
      const messagesData = await apiRequest(`/api/chatrooms/${chatroomId}/messages`);
      setMessages(Array.isArray(messagesData) ? messagesData : []);
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };
  
  // Load data on mount
  useEffect(() => {
    loadData();
  }, [chatroomId, currentUserId]);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Auto-refresh messages if member
  useEffect(() => {
    if (!userIsMember || !currentUserId) return;
    
    const interval = setInterval(async () => {
      try {
        const messagesData = await apiRequest(`/api/chatrooms/${chatroomId}/messages`);
        setMessages(Array.isArray(messagesData) ? messagesData : []);
      } catch (error) {
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [userIsMember, chatroomId, currentUserId]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading chatroom...</span>
        </div>
      </div>
    );
  }
  
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p>Please log in to access the chatroom</p>
            <Button className="mt-4" onClick={() => navigate('/')}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/city-chatrooms')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {chatroom?.name || 'Chatroom'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMembers([...members])} // Force refresh
              className="flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>{members.length}</span>
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
                <span>{isLeaving ? 'Leaving...' : 'Leave'}</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={joinChatroom}
                disabled={isJoining}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                {isJoining && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isJoining ? 'Joining...' : 'Join Chatroom'}</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Membership Status */}
        <div className="mb-4">
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
            userIsMember 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
          }`}>
            {userIsMember ? '✅ You are a member of this chatroom' : '⚠️ You are not a member - join to chat'}
          </div>
        </div>
        
        {/* Members List */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Members ({members.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={member.profile_image} />
                    <AvatarFallback>{member.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {member.username}
                      {member.user_id === currentUserId && ' (You)'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {member.role || 'member'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {members.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No members found
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Messages Area */}
        {userIsMember ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex space-x-3 ${
                      message.senderId === currentUserId ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === currentUserId
                        ? 'bg-blue-600 text-white ml-auto'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      <p className="text-xs opacity-75 mb-1">
                        {message.senderId === currentUserId ? 'You' : message.senderUsername}
                      </p>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-50 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              <div className="flex space-x-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={isSending}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!messageText.trim() || isSending}
                  className="flex items-center space-x-2"
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
            <CardContent className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Join the chatroom to see messages and participate in conversations
              </p>
              <Button
                onClick={joinChatroom}
                disabled={isJoining}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                {isJoining && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isJoining ? 'Joining...' : 'Join Chatroom'}</span>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}