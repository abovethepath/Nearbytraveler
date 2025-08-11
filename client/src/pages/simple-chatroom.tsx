import React, { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, ArrowLeft } from "lucide-react";

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

export default function SimpleChatroomPage() {
  const params = useParams();
  const chatroomId = parseInt(params.id || '1');
  const { toast } = useToast();
  
  console.log('🚀 SIMPLE CHATROOM: Component loaded with chatroom ID:', chatroomId);
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
    await fetch(`/api/simple-chatrooms/${chatroomId}/join`, {
      method: "DELETE",
      headers: { "x-user-id": String(currentUser.id) },
      credentials: "include",
    });
    queryClient.invalidateQueries({ queryKey: [`/api/simple-chatrooms/${chatroomId}/members/count`] });
  }

  // Fetch chatroom details
  const { data: chatroom } = useQuery<Chatroom>({
    queryKey: [`/api/simple-chatrooms/${chatroomId}`],
    enabled: !!chatroomId,
    staleTime: 0, // No caching
    cacheTime: 0  // Clear cache immediately
  });

  // Fetch messages  
  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/simple-chatrooms/${chatroomId}/messages`],
    refetchInterval: 2500,
    refetchOnWindowFocus: false,
    enabled: !!chatroomId,
    staleTime: 0, // No caching
    cacheTime: 0  // Clear cache immediately
  });

  // Fetch member count
  const { data: memberCountResp } = useQuery<{memberCount: number}>({
    queryKey: [`/api/simple-chatrooms/${chatroomId}/members/count`],
    refetchInterval: 5000,
    enabled: !!chatroomId,
    staleTime: 0, // No caching
    cacheTime: 0  // Clear cache immediately
  });
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
                onClick={() => window.history.back()}
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