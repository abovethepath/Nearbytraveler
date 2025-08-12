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
  
  // Extract chatroom ID from URL path: /simple-chatroom/198
  const pathSegments = location.split('/');
  const chatroomId = parseInt(pathSegments[2] || '198');
  const { toast } = useToast();
  
  console.log('🚀 SIMPLE CHATROOM: Component loaded with chatroom ID:', chatroomId, 'from URL:', location, 'params:', params);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState("");
  
  // Get current user
  const getCurrentUser = () => {
    try {
      const storedUser = localStorage.getItem('travelconnect_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  };
  
  const currentUser = getCurrentUser();
  const currentUserId = Number(currentUser?.id || 0);

  // Join room function
  async function joinRoom() {
    if (!currentUser?.id) return;
    await fetch(`/api/simple-chatrooms/${chatroomId}/join`, {
      method: "POST",
      headers: { "x-user-id": String(currentUser.id) },
      credentials: "include",
    });
    queryClient.invalidateQueries({ queryKey: [`/api/simple-chatrooms/${chatroomId}/members/count`] });
  }

  // Leave room function
  async function leaveRoom() {
    if (!currentUser?.id) return;
    
    try {
      const response = await fetch(`/api/simple-chatrooms/${chatroomId}/leave`, {
        method: "POST",
        headers: { 
          "x-user-id": String(currentUser.id),
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
        toast({
          title: "Error",
          description: error.message || "Failed to leave chatroom",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to leave chatroom",
        variant: "destructive"
      });
    }
  }

  // Check access permission first
  const { data: accessCheck, isLoading: accessLoading, error: accessError } = useQuery({
    queryKey: [`/api/simple-chatrooms/${chatroomId}/access-check`],
    queryFn: async () => {
      const response = await fetch(`/api/simple-chatrooms/${chatroomId}/access-check`, {
        headers: {
          'x-user-id': String(currentUserId)
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Access check failed');
      }
      return response.json();
    },
    enabled: !!chatroomId && !!currentUserId,
    staleTime: 0,
    cacheTime: 0,
    retry: false
  });

  // Fetch chatroom details only if access is granted
  const { data: chatroom } = useQuery<Chatroom>({
    queryKey: [`/api/simple-chatrooms/${chatroomId}`],
    enabled: !!chatroomId && accessCheck?.hasAccess,
    staleTime: 0, // No caching
    cacheTime: 0  // Clear cache immediately
  });

  // Fetch messages only if access is granted  
  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/simple-chatrooms/${chatroomId}/messages`],
    refetchInterval: accessCheck?.hasAccess ? 2500 : false,
    refetchOnWindowFocus: false,
    enabled: !!chatroomId && accessCheck?.hasAccess,
    staleTime: 0, // No caching
    cacheTime: 0  // Clear cache immediately
  });

  // Fetch member count only if access is granted
  const { data: memberCountResp } = useQuery<{memberCount: number}>({
    queryKey: [`/api/simple-chatrooms/${chatroomId}/members/count`],
    refetchInterval: accessCheck?.hasAccess ? 5000 : false,
    enabled: !!chatroomId && accessCheck?.hasAccess,
    staleTime: 0, // No caching
    cacheTime: 0  // Clear cache immediately
  });
  const memberCount = memberCountResp?.memberCount ?? 0;

  // Fetch member list with avatars only if access is granted
  const { data: members = [] } = useQuery<ChatMember[]>({
    queryKey: [`/api/simple-chatrooms/${chatroomId}/members`],
    refetchInterval: accessCheck?.hasAccess ? 10000 : false,
    enabled: !!chatroomId && accessCheck?.hasAccess,
    staleTime: 0,
    cacheTime: 0
  });

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
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendMessageMutation.mutate(messageText);
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto scroll to top when component first loads to show header and input
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Show loading state while checking access
  if (accessLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <span>Checking access...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Request access mutation
  const requestAccessMutation = useMutation({
    mutationFn: async (message?: string) => {
      const response = await fetch(`/api/simple-chatrooms/${chatroomId}/request-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(currentUserId)
        },
        credentials: 'include',
        body: JSON.stringify({ message: message || '' })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request access');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Access Requested",
        description: "Your request has been submitted and is pending approval",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/simple-chatrooms/${chatroomId}/access-check`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Show access control screen if user doesn't have permission
  if (accessError || (accessCheck && !accessCheck.hasAccess)) {
    const getStatusInfo = () => {
      if (accessCheck?.status === 'pending') {
        return {
          title: '⏳ Access Pending',
          message: 'Your access request is pending organizer approval.',
          color: 'text-yellow-600 dark:text-yellow-400',
          showRequestButton: false
        };
      } else if (accessCheck?.status === 'rejected') {
        return {
          title: '❌ Access Denied',
          message: 'Your access request was denied by the organizer.',
          color: 'text-red-600 dark:text-red-400',
          showRequestButton: false
        };
      } else {
        return {
          title: '🔒 Private Chatroom',
          message: 'This is a private chatroom. Request access from the organizer to join.',
          color: 'text-blue-600 dark:text-blue-400',
          showRequestButton: true
        };
      }
    };

    const statusInfo = getStatusInfo();

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/city-chatrooms')}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <CardTitle className="text-xl">{statusInfo.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <div className={`text-lg font-semibold ${statusInfo.color}`}>
                  {accessCheck?.message || statusInfo.message}
                </div>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => navigate('/city-chatrooms')}
                    variant="outline"
                  >
                    Back to Chatrooms
                  </Button>
                  {statusInfo.showRequestButton && (
                    <Button 
                      onClick={() => requestAccessMutation.mutate()}
                      disabled={requestAccessMutation.isPending}
                    >
                      {requestAccessMutation.isPending ? 'Requesting...' : 'Request Access'}
                    </Button>
                  )}
                </div>
              </div>
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