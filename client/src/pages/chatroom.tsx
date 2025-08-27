import React, { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Users, Send, ArrowLeft, Loader2 } from "lucide-react";

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

interface ChatroomDetails {
  id: number;
  name: string;
  description: string;
  city: string;
  state: string;
  country: string;
  memberCount: number;
  userIsMember: boolean;
}

export default function ChatroomPage() {
  const params = useParams();
  const chatroomId = parseInt(params.id || '0');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState("");
  
  // Redirect invalid chatroom IDs to a valid LA Metro chatroom
  useEffect(() => {
    if (chatroomId === 200 || chatroomId === 201 || chatroomId === 202 || chatroomId > 213) {
      // These IDs don't exist, redirect to valid LA Metro chatroom immediately
      console.log(`🔀 REDIRECT: Invalid chatroom ID ${chatroomId}, redirecting to 198`);
      window.location.replace('/chatroom/198'); // Let's Meet Up Los Angeles Metro
      return;
    }
  }, [chatroomId]);
  
  // Don't render anything if we're redirecting
  if (chatroomId === 200 || chatroomId === 201 || chatroomId === 202 || chatroomId > 213) {
    return <div>Redirecting to valid chatroom...</div>;
  }
  
  // Get current user with fallback
  const getCurrentUser = () => {
    try {
      const storedUser = localStorage.getItem('travelconnect_user') || localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
      return null;
    }
  };
  
  const currentUser = getCurrentUser();
  
  // Debug user authentication
  useEffect(() => {
    console.log('🔥 CHATROOM DEBUG: Current user:', currentUser?.username || 'not found', 'ID:', currentUser?.id || 'undefined');
  }, [currentUser]);
  
  // Scroll to top when entering chatroom
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [chatroomId]);

  // Fetch chatroom details
  const { data: chatroomArray } = useQuery<ChatroomDetails[]>({
    queryKey: [`/api/chatrooms/${chatroomId}`],
    enabled: !!chatroomId
  });
  
  // Extract the first chatroom from array (API returns array)
  const chatroom = chatroomArray?.[0];

  // Fetch messages with authentication header
  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chatrooms/${chatroomId}/messages`],
    refetchInterval: 2000, // Refresh every 2 seconds
    enabled: !!chatroomId && !!currentUser?.id,
    queryFn: async () => {
      if (!currentUser?.id) throw new Error("User not authenticated");
      
      const response = await fetch(`/api/chatrooms/${chatroomId}/messages`, {
        headers: {
          'x-user-id': currentUser.id.toString()
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🔥 CHATROOM DEBUG: Messages loaded:', data?.length || 0, 'messages');
      return data;
    },
    onError: (error) => {
      console.error('🔥 CHATROOM ERROR: Failed to load messages:', error);
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!currentUser) throw new Error("User not found");
      
      const response = await fetch(`/api/chatrooms/${chatroomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString()
        },
        body: JSON.stringify({
          content: content.trim()
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatroomId}/messages`] });
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

  if (!chatroomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invalid Chatroom</h2>
            <p className="text-gray-600 dark:text-gray-400">Chatroom not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.history.back()}
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <CardTitle className="text-xl">
                    {chatroom?.name || `Chatroom ${chatroomId}`}
                  </CardTitle>
                  {chatroom && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {chatroom.city}, {chatroom.state}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="secondary">
                <Users className="w-3 h-3 mr-1" />
                {chatroom?.memberCount || 0} members
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Messages Container */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="h-96 overflow-y-auto space-y-3 mb-4" data-testid="messages-container">
              
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <MessageCircle className="w-8 h-8 mr-2" />
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${message.id}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === currentUser?.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      <div className="flex items-center gap-2 text-xs opacity-75 mb-1">
                        {message.profile_image && (
                          <img 
                            src={message.profile_image} 
                            alt={message.username} 
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        )}
                        <span>{message.username || 'Unknown'}</span>
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
                data-testid="input-message"
              />
              <Button 
                type="submit" 
                disabled={!messageText.trim() || sendMessageMutation.isPending}
                data-testid="button-send"
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
      </div>
    </div>
  );
}