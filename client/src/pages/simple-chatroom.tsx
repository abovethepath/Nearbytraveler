import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, ArrowLeft, Users } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ChatMessage {
  id: number;
  chatroom_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  username: string;
  name: string;
}

interface Chatroom {
  id: number;
  name: string;
  description: string;
  city: string;
  state: string;
  country: string;
}

interface ChatMember {
  id: number;
  user_id: number;
  username: string;
  name: string;
  role: string;
  profile_image?: string;
}

export default function SimpleChatroomPage() {
  const params = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState("");

  // Extract chatroom ID from URL path: /simple-chatroom/198
  const pathSegments = location.split('/');
  const chatroomId = parseInt(pathSegments[2] || '198');
  
  console.log('🚀 SIMPLE CHATROOM: Component loaded with chatroom ID:', chatroomId, 'from URL:', location, 'params:', params, 'pathSegments:', pathSegments);
  
  // Get current user with better error handling
  const getCurrentUser = () => {
    try {
      const storedUser = localStorage.getItem('travelconnect_user') || localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        console.log('🔑 CHATROOM: Found user in localStorage:', user?.username || 'unknown');
        return user;
      } else {
        console.log('⚠️ CHATROOM: No user found in localStorage');
        return null;
      }
    } catch (e) {
      console.error('❌ CHATROOM: Error parsing user from localStorage:', e);
      return null;
    }
  };
  
  const currentUser = getCurrentUser();
  const currentUserId = Number(currentUser?.id || 0);
  
  console.log('🔑 CHATROOM: Current user data:', { currentUser: currentUser?.username || 'null', currentUserId });
  
  // Scroll to top when entering chatroom
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [chatroomId]); // Re-run when chatroom ID changes

  // SIMPLIFIED: All chatrooms are now public - no access check needed
  const accessCheck = { hasAccess: true, isPublic: true };
  const accessLoading = false;
  const accessError = null;

  // Get chatroom details
  const { data: chatroom } = useQuery<Chatroom>({
    queryKey: [`/api/simple-chatrooms/${chatroomId}`],
    enabled: !!(currentUserId && chatroomId && !isNaN(chatroomId)),
  });

  // Get messages
  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/simple-chatrooms/${chatroomId}/messages`],
    enabled: !!(currentUserId && chatroomId && !isNaN(chatroomId)),
    refetchInterval: 5000, // Refresh messages every 5 seconds (reduced from 1 second)
  });

  // Get member count
  const { data: memberCountResp } = useQuery<{memberCount: number}>({
    queryKey: [`/api/simple-chatrooms/${chatroomId}/members/count`],
    enabled: !!(currentUserId && chatroomId && !isNaN(chatroomId)),
    refetchInterval: 15000, // Refresh count every 15 seconds (reduced frequency)
  });

  // Get members list
  const { data: members = [] } = useQuery<ChatMember[]>({
    queryKey: [`/api/simple-chatrooms/${chatroomId}/members`],
    enabled: !!(currentUserId && chatroomId && !isNaN(chatroomId)),
    refetchInterval: 30000, // Refresh members every 30 seconds (reduced frequency)
  });

  // Early error handling for invalid chatroom ID - MOVED AFTER HOOKS
  if (isNaN(chatroomId) || chatroomId <= 0) {
    console.error('❌ CHATROOM: Invalid chatroom ID:', chatroomId);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-red-600 font-semibold mb-4">Invalid Chatroom ID</div>
              <Button onClick={() => navigate('/city-chatrooms')}>Back to Chatrooms</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Early error handling for missing user - MOVED AFTER HOOKS  
  if (!currentUser || !currentUserId) {
    console.error('❌ CHATROOM: No authenticated user found');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-red-600 font-semibold mb-4">Authentication Required</div>
              <div className="text-gray-600 mb-4">Please log in to access chatrooms</div>
              <Button onClick={() => navigate('/auth')}>Log In</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Join room function
  async function joinRoom() {
    if (!currentUserId) {
      console.log('❌ JOIN: No current user ID available');
      return;
    }
    
    console.log('🔗 JOIN: Attempting to join chatroom', chatroomId, 'with user ID', currentUserId);
    
    try {
      const response = await fetch(`/api/simple-chatrooms/${chatroomId}/join`, {
        method: "POST",
        headers: { "x-user-id": String(currentUserId) },
        credentials: "include",
      });
      
      if (response.ok) {
        toast({
          title: "Joined chatroom",
          description: "You have successfully joined the chatroom",
        });
        queryClient.invalidateQueries({ queryKey: [`/api/simple-chatrooms/${chatroomId}/members/count`] });
        queryClient.invalidateQueries({ queryKey: [`/api/simple-chatrooms/${chatroomId}/members`] });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to join chatroom",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ JOIN ERROR:', error);
      toast({
        title: "Error",
        description: "Failed to join chatroom",
        variant: "destructive"
      });
    }
  }

  // Leave room function
  async function leaveRoom() {
    if (!currentUserId) {
      console.log('❌ LEAVE: No current user ID available');
      return;
    }
    
    console.log('🚪 LEAVE: Attempting to leave chatroom', chatroomId, 'with user ID', currentUserId);
    
    try {
      const response = await fetch(`/api/simple-chatrooms/${chatroomId}/leave`, {
        method: "POST",
        headers: { 
          "x-user-id": String(currentUserId),
          "Content-Type": "application/json"
        },
        credentials: "include",
      });
      
      if (response.ok) {
        toast({
          title: "Left chatroom",
          description: "You have successfully left the chatroom",
        });
        queryClient.invalidateQueries({ queryKey: [`/api/simple-chatrooms/${chatroomId}/members/count`] });
        queryClient.invalidateQueries({ queryKey: [`/api/simple-chatrooms/${chatroomId}/members`] });
        // Navigate back to chatrooms list after successfully leaving
        setTimeout(() => navigate('/city-chatrooms'), 1000);
      } else {
        const error = await response.json();
        console.error('❌ LEAVE ERROR:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to leave chatroom",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ LEAVE ERROR:', error);
      toast({
        title: "Error", 
        description: "Failed to leave chatroom",
        variant: "destructive"
      });
    }
  }

  const memberCount = memberCountResp?.memberCount ?? 0;

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!currentUser?.id) throw new Error("User not found");

      const res = await fetch(`/api/simple-chatrooms/${chatroomId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(currentUser.id), // CRITICAL: Send user ID in header
        },
        credentials: "include",
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Failed to send message");
      }
      return res.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: [`/api/simple-chatrooms/${chatroomId}/messages`] });
    },
    onError: (error: any) => {
      // Handle specific membership error
      if (error.message?.includes("must be a member")) {
        toast({
          title: "Membership Required",
          description: "You need to join this chatroom before sending messages. Joining now...",
          variant: "destructive",
        });
        // Automatically attempt to join the chatroom
        setTimeout(() => joinRoom(), 1000);
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to send message",
          variant: "destructive",
        });
      }
    },
  });

  // Request access mutation
  const requestAccessMutation = useMutation({
    mutationFn: async (message?: string) => {
      const response = await fetch(`/api/simple-chatrooms/${chatroomId}/request-access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(currentUserId)
        },
        credentials: "include",
        body: JSON.stringify({ message: message || "" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to request access");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/simple-chatrooms/${chatroomId}/access-check`] });
      toast({
        title: "Access requested",
        description: "Your request has been sent to the organizer",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to request access",
        variant: "destructive",
      });
    },
  });

  // Keep scroll position at top when entering chatroom
  useEffect(() => {
    // Only scroll to top on initial load, not on new messages
    if (messages && messages.length > 0) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  }, [chatroomId]); // Only trigger on chatroom change, not message updates

  // Auto-join all rooms since they're all public
  useEffect(() => {
    if (currentUserId && chatroomId) {
      joinRoom();
    }
  }, [currentUserId, chatroomId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendMessageMutation.mutate(messageText);
  };

  // Simplified access state - all chatrooms are public
  console.log('✅ CHATROOM: All chatrooms are public - access granted automatically');

  // No need for access loading since all chatrooms are public



  // REMOVED: Access control code - all chatrooms are now public

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/city-chatrooms')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle className="text-xl">
                  {chatroom?.name || `Chatroom ${chatroomId}`}
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {chatroom?.city && `${chatroom.city}, ${chatroom.state}`} · {memberCount} online
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <Button onClick={joinRoom} variant="secondary" size="sm">Join</Button>
                <Button onClick={leaveRoom} variant="outline" size="sm">Leave</Button>
              </div>
            </div>
            
            {/* Member List */}
            {members.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">{members.length} Member{members.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {members.map((member) => (
                    <div key={member.user_id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-full px-3 py-1">
                      <Avatar className="w-6 h-6">
                        {member.profile_image ? (
                          <AvatarImage src={member.profile_image} alt={member.username} />
                        ) : (
                          <AvatarFallback className="text-xs">
                            {member.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-sm">{member.username}</span>
                      {member.role === 'admin' && (
                        <span className="text-xs bg-blue-500 text-white rounded px-1">Admin</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Messages Container */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="h-96 overflow-y-auto space-y-3 mb-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <span>Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === currentUserId
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      <div className="text-xs opacity-75 mb-1">
                        {message.username || 'Unknown'}
                      </div>
                      <div>{message.content}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                disabled={sendMessageMutation.isPending}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={!messageText.trim() || sendMessageMutation.isPending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}