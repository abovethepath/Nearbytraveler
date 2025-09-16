import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, MapPin, Clock, Users, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MeetupChatroomProps {
  meetupId: number;
  meetupTitle: string;
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

interface ChatMessage {
  id: number;
  meetupChatroomId: number;
  userId: number;
  username: string;
  message: string;
  messageType: string;
  sentAt: string;
  user: {
    id: number;
    username: string;
    name: string;
    profileImage: string | null;
  };
}

interface MeetupChatroom {
  id: number;
  meetupId: number;
  chatroomName: string;
  description: string;
  city: string;
  state: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  expiresAt: string;
  participantCount: number;
  createdAt: string;
}

export function MeetupChatroom({ meetupId, meetupTitle, isOpen, onClose, currentUser }: MeetupChatroomProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch meetup chatroom
  const { data: chatroom, isLoading: chatroomLoading } = useQuery<MeetupChatroom>({
    queryKey: ['/api/quick-meets', meetupId, 'chatroom'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/quick-meets/${meetupId}/chatroom`);
      return response.json();
    },
    enabled: isOpen && !!meetupId
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/meetup-chatrooms', chatroom?.id, 'messages'],
    queryFn: async () => {
      if (!chatroom?.id) return [];
      const response = await apiRequest('GET', `/api/meetup-chatrooms/${chatroom.id}/messages`);
      return response.json();
    },
    enabled: !!chatroom?.id,
    refetchInterval: 3000 // Auto-refresh every 3 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      if (!chatroom?.id || !currentUser) return;
      
      const response = await apiRequest('POST', `/api/meetup-chatrooms/${chatroom.id}/messages`, {
        userId: currentUser.id,
        username: currentUser.username,
        message: messageText
      });
      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/meetup-chatrooms', chatroom?.id, 'messages'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getExpiryTime = () => {
    if (!chatroom?.expiresAt) return "";
    const expiryDate = new Date(chatroom.expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffMs <= 0) return "Expired";
    if (diffHours > 0) return `${diffHours}h ${diffMinutes}m left`;
    return `${diffMinutes}m left`;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              <DialogTitle className="text-lg font-semibold">
                {chatroom?.chatroomName || `💬 ${meetupTitle} Chat`}
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {chatroom && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{chatroom.city}, {chatroom.country}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{getExpiryTime()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{chatroom.participantCount} participants</span>
              </div>
            </div>
          )}
          
          <p className="text-sm text-gray-500">
            {chatroom?.description || "Private chat for quick meet participants. This chat expires when the quick meet ends."}
          </p>
        </DialogHeader>

        {chatroomLoading || messagesLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading chat...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm">Be the first to say hello!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.userId === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          msg.userId === currentUser?.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-white dark:bg-gray-800 border'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            @{msg.username}
                          </span>
                          <span className="text-xs opacity-70">
                            {formatTime(msg.sentAt)}
                          </span>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2 mt-4">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
                disabled={sendMessageMutation.isPending}
              />
              <Button
                type="submit"
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {sendMessageMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}