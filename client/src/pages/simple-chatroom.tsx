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
import { SimpleAvatar } from "@/components/simple-avatar";

interface ChatMessage {
  id: number;
  chatroom_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  username: string;
  name: string;
  profile_image?: string;
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
  username: string;
  name: string;
  role: string;
  profileImage?: string;
}

export default function SimpleChatroomPage() {
  const params = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState("");
  
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Extract chatroom ID from URL
  const pathSegments = location.split('/');
  const chatroomId = parseInt(pathSegments[2] || '198');
  
  // Get current user
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
    queryKey: [`/api/chatrooms/${chatroomId}`],
    enabled: !!(currentUserId && chatroomId && !isNaN(chatroomId)),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Get members list
  const { data: members = [], refetch: refetchMembers } = useQuery<ChatMember[]>({
    queryKey: [`/api/chatrooms/${chatroomId}/members`],
    enabled: !!(currentUserId && chatroomId && !isNaN(chatroomId)),
    refetchInterval: 10000,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  // Check membership
  const userIsMember = Array.isArray(members) ? members.some((member: ChatMember) => member.id === currentUserId) : false;

  // Get messages
  const { data: messages = [], isLoading: messagesLoading, isFetching: messagesFetching, refetch: refetchMessages, error: messagesError } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chatrooms/${chatroomId}/messages`],
    enabled: !!(currentUserId && chatroomId && !isNaN(chatroomId)),
    refetchInterval: 8000,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Join room function
  async function joinRoom() {
    if (!currentUserId || isJoining || userIsMember) {
      return;
    }
    
    setIsJoining(true);
    
    try {
      const response = await fetch(`/api/chatrooms/${chatroomId}/join`, {
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
        refetchMembers();
      } else {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
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
    if (!currentUserId || isLeaving || !userIsMember) {
      return;
    }
    
    setIsLeaving(true);
    
    try {
      const response = await fetch(`/api/chatrooms/${chatroomId}/leave`, {
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
          description: "You have left the chatroom",
          className: "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
        });
        refetchMembers();
      } else {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
    } catch (error: any) {
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

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!currentUser?.id) throw new Error("User not found");
      if (!userIsMember) throw new Error("You must join the chatroom first");

      const response = await fetch(`/api/chatrooms/${chatroomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(currentUserId)
        },
        body: JSON.stringify({ content }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ 
        queryKey: [`/api/chatrooms/${chatroomId}/messages`],
        exact: true 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
        className: "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
      });
    },
  });

  // Auto-scroll when sending message
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
              <Button onClick={() => navigate('/city-chatrooms')} aria-label="Back to chatrooms">
                <ArrowLeft className="w-4 h-4" />
              </Button>
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
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/city-chatrooms')}
                className="flex-shrink-0 hover:bg-white/20 dark:hover:bg-gray-600/20"
                title="Back to chatrooms"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {chatroom?.name?.charAt(0).toUpperCase() || "C"}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight truncate">
                    {chatroom?.name || "Loading chatroom..."}
                  </CardTitle>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {members.length} member{members.length !== 1 ? 's' : ''} • {chatroom?.city || 'Unknown location'}
                  </div>
                </div>
              </div>
            </div>

            {!userIsMember && (
              <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
                  You are not a member of this chatroom. Join to participate in conversations!
                </p>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <Button 
                onClick={joinRoom} 
                disabled={isJoining || userIsMember}
                className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white border-0"
              >
                {isJoining ? "Joining..." : userIsMember ? "✓ Joined" : "Join Chatroom"}
              </Button>
              {userIsMember && (
                <Button 
                  onClick={leaveRoom} 
                  variant="outline" 
                  disabled={isLeaving}
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  {isLeaving ? "Leaving..." : "Leave"}
                </Button>
              )}
            </div>

            {/* Member List */}
            {Array.isArray(members) && members.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-gray-900 dark:text-white" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Members ({members.length})</span>
                  {userIsMember && (
                    <span className="text-xs bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 rounded px-2 py-1">
                      You're a member
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {members.slice(0, 8).map((member) => (
                    <button
                      key={member.id}
                      onClick={() => {
                        console.log('Navigating to profile:', member.id, 'for user:', member.username);
                        navigate(`/profile/${member.id}`);
                      }}
                      className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-full px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <SimpleAvatar 
                        user={{
                          id: member.id,
                          username: member.username,
                          profileImage: member.profileImage || null
                        }}
                        size="sm"
                        clickable={false}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{member.username}</span>
                      {member.role === 'admin' && (
                        <span className="text-xs bg-blue-500 text-white rounded px-1.5 py-0.5">Admin</span>
                      )}
                      {member.id === currentUserId && (
                        <span className="text-xs bg-green-500 text-white rounded px-1.5 py-0.5">You</span>
                      )}
                    </button>
                  ))}
                  {members.length > 8 && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      +{members.length - 8} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Messages */}
        <Card className="mb-6 bg-white dark:bg-gray-800">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                <MessageCircle className="w-5 h-5" />
                Messages
              </CardTitle>
              {(messagesLoading || messagesFetching) && (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 bg-white dark:bg-gray-900">
            <div className="h-96 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No messages yet. Be the first to say hello!
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <SimpleAvatar 
                      user={{
                        id: message.sender_id,
                        username: message.username,
                        profileImage: message.profile_image || null
                      }}
                      size="sm"
                      clickable={true}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{message.username}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-900 dark:text-gray-900 break-words">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Message Input */}
        {userIsMember ? (
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  maxLength={1000}
                />
                <Button
                  type="submit"
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white border-0"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Join this chatroom to send messages
              </p>
              <Button 
                onClick={joinRoom} 
                disabled={isJoining}
                className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white border-0"
              >
                {isJoining ? "Joining..." : "Join Chatroom"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}