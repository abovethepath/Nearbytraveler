import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Send, Users, ArrowLeft } from "lucide-react";

interface ChatMessage {
  id: number;
  senderId: number;
  senderUsername: string;
  content: string;
  created_at: string; // Fixed: API returns created_at, not timestamp
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

export default function SimpleChatroomFixed() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get chatroom ID from URL
  const pathSegments = window.location.pathname.split('/');
  const chatroomId = parseInt(pathSegments[2] || '201');
  
  // Get current user
  const getCurrentUser = () => {
    try {
      const storedUser = localStorage.getItem('travelconnect_user') || localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  };
  
  const currentUser = getCurrentUser();
  const currentUserId = Number(currentUser?.id || 0);
  
  // State
  const [chatroom, setChatroom] = useState<Chatroom | null>(null);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is a member
  const userIsMember = members.some(member => member.user_id === currentUserId);

  // Fetch chatroom data
  const fetchChatroomData = async () => {
    try {
      const [chatroomRes, membersRes] = await Promise.all([
        fetch(`/api/chatrooms/${chatroomId}`),
        fetch(`/api/chatrooms/${chatroomId}/members`)
      ]);
      
      if (chatroomRes.ok) {
        const chatroomData = await chatroomRes.json();
        setChatroom(chatroomData);
      }
      
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(Array.isArray(membersData) ? membersData : []);
      }
    } catch (error) {
      console.error('Error fetching chatroom data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages if user is a member
  const fetchMessages = async () => {
    if (!userIsMember) return;
    
    try {
      const res = await fetch(`/api/chatrooms/${chatroomId}/messages`);
      if (res.ok) {
        const messagesData = await res.json();
        setMessages(Array.isArray(messagesData) ? messagesData : []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Join chatroom
  const joinChatroom = async () => {
    if (!currentUserId || isJoining || userIsMember) return;
    
    setIsJoining(true);
    try {
      const res = await fetch(`/api/chatrooms/${chatroomId}/join`, {
        method: "POST",
        headers: { 
          "x-user-id": String(currentUserId),
          "Content-Type": "application/json"
        },
        credentials: "include",
      });
      
      if (res.ok) {
        toast({
          title: "Success",
          description: "You joined the chatroom!",
        });
        // Refresh data
        await fetchChatroomData();
        await fetchMessages();
      } else {
        throw new Error("Failed to join");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join chatroom",
        variant: "destructive",
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
      const res = await fetch(`/api/chatrooms/${chatroomId}/leave`, {
        method: "POST",
        headers: { 
          "x-user-id": String(currentUserId),
          "Content-Type": "application/json"
        },
        credentials: "include",
      });
      
      if (res.ok) {
        toast({
          title: "Success", 
          description: "You left the chatroom",
        });
        navigate('/city-chatrooms');
      } else {
        throw new Error("Failed to leave");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to leave chatroom",
        variant: "destructive",
      });
    } finally {
      setIsLeaving(false);
    }
  };

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !userIsMember) return;
    
    try {
      const res = await fetch(`/api/chatrooms/${chatroomId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(currentUserId),
        },
        credentials: "include",
        body: JSON.stringify({ content: messageText }),
      });
      
      if (res.ok) {
        setMessageText("");
        await fetchMessages(); // Refresh messages
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Initial load
  useEffect(() => {
    if (currentUserId && chatroomId) {
      fetchChatroomData();
    }
  }, [currentUserId, chatroomId]);

  // Load messages when membership changes
  useEffect(() => {
    if (userIsMember) {
      fetchMessages();
    }
  }, [userIsMember]);

  // Poll for new messages if joined
  useEffect(() => {
    if (!userIsMember) return;
    
    const interval = setInterval(fetchMessages, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, [userIsMember]);

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-gray-600 dark:text-gray-400">Please log in to join chatrooms</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading chatroom...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => navigate('/city-chatrooms')}
                  variant="outline" 
                  size="sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <CardTitle className="text-xl">
                    {chatroom?.name || "Chatroom"}
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {chatroom?.city && `${chatroom.city}, ${chatroom.state}`} · {members.length} members
                  </p>
                  {userIsMember ? (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✓ You are a member
                    </p>
                  ) : (
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      You are not a member
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {!userIsMember ? (
                  <Button 
                    onClick={joinChatroom}
                    disabled={isJoining}
                    variant="default"
                  >
                    {isJoining ? "Joining..." : "Join Chatroom"}
                  </Button>
                ) : (
                  <Button 
                    onClick={leaveChatroom}
                    disabled={isLeaving}
                    variant="outline"
                  >
                    {isLeaving ? "Leaving..." : "Leave Chatroom"}
                  </Button>
                )}
              </div>
            </div>
            
            {/* Members List - Always Show */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Chatroom Members ({members.length})
                </span>
              </div>
              
              {members.length === 0 ? (
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  No members yet. Be the first to join!
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Show all members in a grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {members.map((member) => (
                      <div 
                        key={member.user_id} 
                        className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Avatar className="w-8 h-8 border-2 border-white dark:border-gray-600">
                          {member.profile_image ? (
                            <AvatarImage src={member.profile_image} alt={member.username} />
                          ) : (
                            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                              {member.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {member.username}
                            </span>
                            {member.role === 'admin' && (
                              <span className="text-xs bg-blue-500 text-white rounded px-1.5 py-0.5">
                                Admin
                              </span>
                            )}
                            {member.user_id === currentUserId && (
                              <span className="text-xs bg-green-500 text-white rounded px-1.5 py-0.5">
                                You
                              </span>
                            )}
                          </div>
                          {member.name && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {member.name}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Member stats */}
                  <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded p-2">
                    {members.length} total member{members.length !== 1 ? 's' : ''} • 
                    {members.filter(m => m.role === 'admin').length} admin{members.filter(m => m.role === 'admin').length !== 1 ? 's' : ''} • 
                    {members.filter(m => m.role !== 'admin').length} regular member{members.filter(m => m.role !== 'admin').length !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Messages */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="h-96 overflow-y-auto mb-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              {!userIsMember ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Join this chatroom to see messages and participate
                    </p>
                    <Button onClick={joinChatroom} disabled={isJoining}>
                      {isJoining ? "Joining..." : "Join Chatroom"}
                    </Button>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No messages yet. Be the first to say something!
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        {message.senderProfileImage ? (
                          <AvatarImage src={message.senderProfileImage} alt={message.senderUsername} />
                        ) : (
                          <AvatarFallback className="text-xs bg-blue-500 text-white">
                            {message.senderUsername.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium text-sm">{message.senderUsername}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-900 dark:text-gray-100">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            {userIsMember && (
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button type="submit" disabled={!messageText.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}