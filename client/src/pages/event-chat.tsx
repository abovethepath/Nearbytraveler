import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/ui/chat-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Users, MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  name: string;
  profileImage: string | null;
}

interface ChatMessage {
  id: number;
  senderId: number;
  content: string;
  messageType: string;
  createdAt: string;
  user: User;
}

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  date: string;
  endDate: string;
  organizerId: number;
  organizer?: User;
}

interface Participant {
  id: number;
  eventId: number;
  userId: number;
  status: string;
  joinedAt: string;
  user: User;
}

export default function EventChat() {
  const [, params] = useRoute("/event-chat/:eventId");
  const eventId = params?.eventId ? parseInt(params.eventId) : null;
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);
  
  // Scroll to top when entering event chat
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [eventId]);

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: ['/api/events', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch event');
      }
      return response.json();
    },
    enabled: !!eventId
  });

  // Fetch event chatroom
  const { data: chatroom } = useQuery({
    queryKey: ['/api/event-chatrooms', eventId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/event-chatrooms/${eventId}`);
      return response.json();
    },
    enabled: !!eventId
  });

  // Fetch chat messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/event-chatrooms', chatroom?.id, 'messages'],
    queryFn: async () => {
      if (!chatroom?.id) return [];
      const response = await fetch(`/api/event-chatrooms/${chatroom.id}/messages`, {
        headers: {
          'X-User-ID': currentUser?.id?.toString() || ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!chatroom?.id && !!currentUser,
    refetchInterval: 3000
  });

  // Fetch event participants
  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: ['/api/events', eventId, 'participants'],
    queryFn: async () => {
      if (!eventId) return [];
      const response = await fetch(`/api/events/${eventId}/participants`);
      if (!response.ok) throw new Error('Failed to fetch participants');
      return response.json();
    },
    enabled: !!eventId && !!currentUser
  });

  const hasUserSentMessage = useRef(false);
  
  // No auto-scroll when page loads - users can manually scroll to see older messages

  // Auto-join chatroom when component loads
  const joinChatroomMutation = useMutation({
    mutationFn: async () => {
      if (!chatroom?.id || !currentUser?.id) return;
      
      const response = await fetch(`/api/event-chatrooms/${chatroom.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': currentUser.id.toString()
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to join chatroom: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      console.log('Successfully joined event chatroom');
    },
    onError: (error) => {
      console.error('Failed to join event chatroom:', error);
    }
  });

  // Auto-join when chatroom is available
  useEffect(() => {
    if (chatroom?.id && currentUser?.id) {
      joinChatroomMutation.mutate();
    }
  }, [chatroom?.id, currentUser?.id]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!chatroom?.id) throw new Error('No chatroom available');
      
      const response = await fetch(`/api/event-chatrooms/${chatroom.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': currentUser?.id?.toString() || ''
        },
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      hasUserSentMessage.current = true; // Mark that user has sent a message to prevent auto-scroll
      queryClient.invalidateQueries({ 
        queryKey: ['/api/event-chatrooms', chatroom?.id, 'messages'] 
      });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = () => {
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/events';
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400">Please log in to access the event chat.</p>
        </div>
      </div>
    );
  }

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">The event you're looking for doesn't exist.</p>
          <Button onClick={goBack} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={goBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {event.title} - Chat
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Event discussion for participants
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Event Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {/* Location Display */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {event.location || `${event.city}${event.state ? `, ${event.state}` : ''}`}
                    </span>
                  </div>
                  
                  {/* Date Display */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {event.date ? (
                        new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      ) : (
                        'Date TBD'
                      )}
                    </span>
                  </div>
                  
                  {/* Participant Count */}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {participants.filter(p => p.user).length} {participants.filter(p => p.user).length === 1 ? 'participant' : 'participants'}
                    </span>
                  </div>
                  

                </div>

                {event.description && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Participants List */}
                <div>
                  <h4 className="font-medium text-sm mb-3">Participants</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {participants.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No participants yet
                      </p>
                    ) : (
                      participants.map((participant) => {
                        // Add null safety for participant.user
                        if (!participant || !participant.user || !participant.user.username) {
                          return null;
                        }
                        
                        return (
                          <div key={participant.id} className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={participant.user.profileImage || ''} />
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-800">
                                {participant.user.username?.[0]?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {participant.user.username}
                            </span>
                            {participant.userId === event?.organizer?.id && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-1 py-0.5 rounded">
                                Organizer
                              </span>
                            )}
                          </div>
                        );
                      }).filter(Boolean)
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Event Chat</CardTitle>
              </CardHeader>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.senderId === currentUser?.id ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={msg.user.profileImage || ''} />
                        <AvatarFallback className="bg-blue-100 text-blue-800">
                          {msg.user.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`flex-1 max-w-xs ${
                        msg.senderId === currentUser?.id ? 'text-right' : ''
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {msg.user.username}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        <div className={`inline-block px-3 py-2 rounded-lg text-sm ${
                          msg.senderId === currentUser?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <ChatInput
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={sendMessageMutation.isPending}
                    data-testid="input-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className="px-3"
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}