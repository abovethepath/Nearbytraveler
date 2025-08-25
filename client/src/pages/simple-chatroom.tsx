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
  const [isJoined, setIsJoined] = useState(false);
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get messages - only fetch if user is joined
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery<ChatMessage[]>({
    queryKey: [`/api/simple-chatrooms/${chatroomId}/messages`],
    enabled: !!(currentUserId && chatroomId && !isNaN(chatroomId) && isJoined),
    refetchInterval: isJoined ? 3000 : false, // Only poll if joined
    staleTime: 1000, // 1 second
  });

  // Get member count
  const { data: memberCountResp, refetch: refetchMemberCount } = useQuery<{memberCount: number}>({
    queryKey: [`/api/simple-chatrooms/${chatroomId}/members/count`],
    enabled: !!(currentUserId && chatroomId && !isNaN(chatroomId)),
    refetchInterval: 15000,
    staleTime: 10000, // 10 seconds
  });

  // Get members list - check if current user is a member
  const { data: members = [], refetch: refetchMembers } = useQuery<ChatMember[]>({
    queryKey: [`/api/simple-chatrooms/${chatroomId}/members`],
    enabled: !!(currentUserId && chatroomId && !isNaN(chatroomId)),
    refetchInterval: 30000,
    staleTime: 20000, // 20 seconds
    onSuccess: (data) => {
      // Check if current user is in the members list
      const userIsMember = data.some(member => member.user_id === currentUserId);
      setIsJoined(userIsMember);
    }
  });

  // Join room function
  async function joinRoom() {
    if (!currentUserId || isJoining || isJoined) return;
    
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
        setIsJoined(true);
        toast({
          title: "Joined chatroom",
          description: "You have successfully joined the chatroom",
        });
        // Refetch data
        refetchMemberCount();
        refetchMembers();
        refetchMessages();
      } else {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to join chatroom");
      }
    } catch (error: any) {
      console.error("Join room error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to join chatroom",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  }

  // Leave room function
  async function leaveRoom() {
    if (!currentUserId || isLeaving || !isJoined) return;
    
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
        setIsJoined(false);
        toast({
          title: "Left chatroom",
          description: "You have successfully left the chatroom",
        });
        // Refetch data
        refetchMemberCount();
        refetchMembers();
        // Clear messages since user left
        queryClient.setQueryData([`/api/simple-chatrooms/${chatroomId}/messages`], []);
        setTimeout(() => navigate('/city-chatrooms'), 1000);
      } else {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to leave chatroom");
      }
    } catch (error: any) {
      console.error("Leave room error:", error);
      toast({
        title: "Error", 
        description: error.message || "Failed to leave chatroom",
        variant: "destructive"
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
      if (!isJoined) throw new Error("You must join the chatroom first");

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
      refetchMessages();
    },
    onError: (error: any) => {
      if (error.message?.includes("must be a member") || error.message?.includes("join the chatroom")) {
        toast({
          title: "Membership Required",
          description: "You need to join this chatroom before sending messages.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to send message",
          variant: "destructive",
        });
      }
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Auto-join room when component loads if user is not already joined
  useEffect(() => {
    if (currentUserId && chatroomId && !isJoined && !isJoining && members.length > 0) {
      // Check if user should be in this room but isn't
      const userIsMember = members.some(member => member.user_id === currentUserId);
      if (!userIsMember) {
        // Auto-join for public rooms
        joinRoom();
      }
    }
  }, [currentUserId, chatroomId, members, isJoined, isJoining]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !isJoined) return;
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
                  {chatroom?.name || `Chatroom ${chatroomId}`}
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {chatroom?.city && `${chatroom.city}, ${chatroom.state}`} · {memberCount} online
                </p>
                {!isJoined && (
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
                  disabled={isJoining || isJoined}
                >
                  {isJoining ? "Joining..." : isJoined ? "Joined" : "Join"}
                </Button>
                <Button 
                  onClick={leaveRoom} 
                  variant="outline" 
                  size="sm"
                  disabled={isLeaving || !isJoined}
                >
                  {isLeaving ? "Leaving..." : "Leave"}
                </Button>
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
              {!isJoined ? (
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
                placeholder={isJoined ? "Type your message..." : "Join the chatroom to send messages"}
                disabled={sendMessageMutation.isPending || !isJoined}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={!messageText.trim() || sendMessageMutation.isPending || !isJoined}
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