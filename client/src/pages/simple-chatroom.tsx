import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send, ArrowLeft, Users, MessageCircle, Loader2 } from "lucide-react";
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
  
  // Simple membership tracking - NO AUTO-JOIN
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Extract chatroom ID from URL path: /simple-chatroom/198
  const pathSegments = location.split('/');
  const chatroomId = parseInt(pathSegments[2] || '198');
  
  // Get current user with error handling
  const getCurrentUser = () => {
    try {
      const storedUser = localStorage.getItem('travelconnect_user') || localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return user;
      } else {
        return null;
      }
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
      return null;
    }
  };
  
  const currentUser = getCurrentUser();
  const currentUserId = Number(currentUser?.id || 0);

  // Get chatroom details
  const { data: chatroom, isLoading: chatroomLoading } = useQuery<Chatroom>({
    queryKey: [`/api/simple-chatrooms/${chatroomId}`],
    enabled: !!(currentUserId && chatroomId && !isNaN(chatroomId)),
    staleTime: 10 * 60 * 1000, // 10 minutes - chatroom details rarely change
    refetchOnWindowFocus: false,
  });

  // Get members list - check if current user is a member
  const { data: members = [], refetch: refetchMembers } = useQuery<ChatMember[]>({
    queryKey: [`/api/simple-chatrooms/${chatroomId}/members`],
    enabled: !!(currentUserId && chatroomId && !isNaN(chatroomId)),
    refetchInterval: 60000, // 60 seconds - longer interval to reduce load
    staleTime: 120000, // 2 minutes - members don't change frequently
    refetchOnWindowFocus: false,
  });

  // Check membership when members data changes - SIMPLE CHECK ONLY
  const userIsMember = Array.isArray(members) ? members.some((member: ChatMember) => member.user_id === currentUserId) : false;

  // Get member count
  const { data: memberCountResp, refetch: refetchMemberCount } = useQuery<{memberCount: number}>({
    queryKey: [`/api/simple-chatrooms/${chatroomId}/members/count`],
    enabled: !!(currentUserId && chatroomId && !isNaN(chatroomId)),
    refetchInterval: 30000, // 30 seconds
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  // Get messages - only fetch if user is joined
  const { data: messages = [], isLoading: messagesLoading, isFetching: messagesFetching, refetch: refetchMessages } = useQuery<ChatMessage[]>({
    queryKey: [`/api/simple-chatrooms/${chatroomId}/messages`],
    enabled: !!(currentUserId && chatroomId && !isNaN(chatroomId) && userIsMember),
    refetchInterval: userIsMember ? 8000 : false, // Poll every 8 seconds if joined
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // NO AUTO-JOIN - Users must manually click Join button

  // Join room function - MANUAL ONLY
  async function joinRoom() {
    if (!currentUserId || isJoining || userIsMember) {
      return;
    }
    
    setIsJoining(true);
    
    try {
      const response = await fetch(`/api/simple-chatrooms/${chatroomId}/join`, {
        method: "POST",
        headers: { 
          "x-user-id": String(currentUserId),
          "Content-Type": "application/json"
        },
        credentials: "include",
      });
      
      if (response.ok) {
        toast({
          title: "Joined chatroom",
          description: "You have successfully joined the chatroom",
          className: "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
        });
        // Refresh data efficiently - force immediate refetch
        queryClient.invalidateQueries({ queryKey: [`/api/simple-chatrooms/${chatroomId}/members/count`] });
        queryClient.invalidateQueries({ queryKey: [`/api/simple-chatrooms/${chatroomId}/members`] });
        
        // Force immediate refresh to update UI
        setTimeout(() => {
          refetchMembers();
          refetchMemberCount();
        }, 100);
      } else {
        throw new Error("Failed to join chatroom");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join chatroom",
        variant: "destructive",
        className: "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
      });
    } finally {
      setIsJoining(false);
    }
  }

  // Leave room function
  async function leaveRoom() {
    if (!currentUserId || isLeaving || !userIsMember) return;
    
    setIsLeaving(true);
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
          className: "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
        });
        queryClient.invalidateQueries({ queryKey: [`/api/simple-chatrooms/${chatroomId}/members/count`] });
        queryClient.invalidateQueries({ queryKey: [`/api/simple-chatrooms/${chatroomId}/members`] });
        queryClient.removeQueries({ queryKey: [`/api/simple-chatrooms/${chatroomId}/messages`] });
        setTimeout(() => navigate('/city-chatrooms'), 1000);
      } else {
        throw new Error("Failed to leave chatroom");
      }
    } catch (error: any) {
      console.error("Leave room error:", error);
      toast({
        title: "Error", 
        description: error.message || "Failed to leave chatroom",
        variant: "destructive",
        className: "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
      });
    } finally {
      setIsLeaving(false);
    }
  }

  const memberCount = memberCountResp?.memberCount ?? 0;

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!currentUser?.id) throw new Error("User not found");
      if (!userIsMember) throw new Error("You must join the chatroom first");

      const res = await fetch(`/api/simple-chatrooms/${chatroomId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(currentUser.id),
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
      queryClient.invalidateQueries({ 
        queryKey: [`/api/simple-chatrooms/${chatroomId}/messages`],
        exact: true 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
        className: "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
      });
    },
  });

  // Auto-scroll to bottom only when user sends a message, not on every message update
  useEffect(() => {
    if (messagesEndRef.current && sendMessageMutation.isSuccess) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sendMessageMutation.isSuccess]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !userIsMember) return;
    sendMessageMutation.mutate(messageText);
  };

  // Error handling for invalid chatroom ID
  if (isNaN(chatroomId) || chatroomId <= 0) {
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
  
  // Error handling for missing user
  if (!currentUser || !currentUserId) {
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
                  {chatroom?.name || "Loading chatroom..."}
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {chatroom?.city && `${chatroom.city}, ${chatroom.state}`} · {memberCount} online
                </p>
                {!userIsMember && (
                  <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                    You are not a member of this chatroom
                  </p>
                )}
              </div>
              <div className="ml-auto flex gap-2">
                <Button 
                  onClick={joinRoom} 
                  variant="secondary" 
                  size="sm"
                  disabled={isJoining || userIsMember}
                >
                  {isJoining ? "Joining..." : userIsMember ? "Joined" : "Join"}
                </Button>
                <Button 
                  onClick={leaveRoom} 
                  variant="outline" 
                  size="sm"
                  disabled={isLeaving || !userIsMember}
                >
                  {isLeaving ? "Leaving..." : "Leave"}
                </Button>
              </div>
            </div>
            
            {/* Member List in Header - Show All Members with Avatars */}
            {Array.isArray(members) && members.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Online Members ({members.length})</span>
                  {userIsMember && (
                    <span className="text-xs bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 rounded px-2 py-1">
                      You're a member
                    </span>
                  )}
                </div>
                
                {/* Show first 8 members in header */}
                <div className="flex flex-wrap gap-2">
                  {members.slice(0, 8).map((member) => (
                    <div key={member.user_id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-full px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <Avatar className="w-6 h-6">
                        {member.profile_image ? (
                          <AvatarImage src={member.profile_image} alt={member.username} />
                        ) : (
                          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                            {member.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-sm font-medium">{member.username}</span>
                      {member.role === 'admin' && (
                        <span className="text-xs bg-blue-500 text-white rounded px-1.5 py-0.5">Admin</span>
                      )}
                      {member.user_id === currentUserId && (
                        <span className="text-xs bg-green-500 text-white rounded px-1.5 py-0.5">You</span>
                      )}
                    </div>
                  ))}
                  {members.length > 8 && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      +{members.length - 8} more (see below)
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Debug info - temporary */}
            <div className="mt-2 text-xs text-gray-500">
              Debug: {members?.length || 0} members, userIsMember: {userIsMember ? 'YES' : 'NO'}, currentUserId: {currentUserId}
            </div>
          </CardHeader>
        </Card>

        {/* Messages Container */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="h-96 overflow-y-auto space-y-3 mb-4">
              {!userIsMember ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <p className="mb-2">Join this chatroom to see messages and participate</p>
                    <Button onClick={joinRoom} disabled={isJoining}>
                      {isJoining ? "Joining..." : "Join Chatroom"}
                    </Button>
                  </div>
                </div>
              ) : messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading messages...</span>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No messages yet. Start the conversation!</p>
                    {messagesFetching && !messagesLoading && (
                      <p className="text-xs text-gray-400 mt-2">Checking for new messages...</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === currentUserId
                          ? 'bg-blue-500 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                      }`}>
                        <div className={`text-xs mb-1 font-medium ${
                          message.sender_id === currentUserId 
                            ? 'text-blue-100' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {message.username || 'Unknown'}
                        </div>
                        <div className={`font-medium ${
                          message.sender_id === currentUserId 
                            ? 'text-white' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {message.content}
                        </div>
                        <div className={`text-xs mt-1 ${
                          message.sender_id === currentUserId 
                            ? 'text-blue-100' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {new Date(message.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Subtle indicator when fetching new messages */}
                  {messagesFetching && !messagesLoading && (
                    <div className="flex justify-center">
                      <div className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full">
                        Checking for new messages...
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={
                  userIsMember ? "Type your message..." : "Join the chatroom to send messages"
                }
                disabled={sendMessageMutation.isPending || !userIsMember}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={!messageText.trim() || sendMessageMutation.isPending || !userIsMember}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* All Members List - Complete List at Bottom */}
        {Array.isArray(members) && members.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                All Chatroom Members ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {members.map((member) => (
                  <div 
                    key={member.user_id} 
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors"
                  >
                    <Avatar className="w-10 h-10 border-2 border-white dark:border-gray-600 shadow-sm">
                      {member.profile_image ? (
                        <AvatarImage src={member.profile_image} alt={member.username} />
                      ) : (
                        <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                          {member.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {member.username}
                        </span>
                        {member.role === 'admin' && (
                          <span className="text-xs bg-blue-500 text-white rounded px-2 py-1">
                            Admin
                          </span>
                        )}
                        {member.user_id === currentUserId && (
                          <span className="text-xs bg-green-500 text-white rounded px-2 py-1">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {member.name || 'No display name'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Member Statistics */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    <strong className="text-gray-900 dark:text-white">{members.length}</strong> total members
                  </span>
                  <span>
                    <strong className="text-gray-900 dark:text-white">
                      {members.filter(m => m.role === 'admin').length}
                    </strong> admin{members.filter(m => m.role === 'admin').length !== 1 ? 's' : ''}
                  </span>
                  <span>
                    <strong className="text-gray-900 dark:text-white">
                      {members.filter(m => m.role !== 'admin').length}
                    </strong> regular member{members.filter(m => m.role !== 'admin').length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}