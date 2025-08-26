import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, ArrowLeft, Users, MapPin, Clock, MessageCircle } from 'lucide-react';
import { useAuth } from '@/App';
import { authStorage } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  username: string;
  name: string;
  profileImage?: string;
}

interface QuickMeetup {
  id: number;
  title: string;
  description: string;
  meetingPoint: string;
  city: string;
  state: string;
  location: string;
  organizerId: number;
  expiresAt: string;
  availableAt: string;
  participantCount: number;
  creator?: User;
}

interface ChatMessage {
  id: number;
  chatroomId: number;
  senderId: number;
  content: string;
  createdAt: string;
  sender?: User;
}

interface Participant {
  id: number;
  meetupId: number;
  userId: number;
  status: string;
  joinedAt: string;
  user: User;
}

interface Chatroom {
  id: number;
  meetupId: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

function QuickMeetupChat() {
  const [, params] = useRoute("/quick-meetup-chat/:meetupId");
  const meetupId = params?.meetupId ? parseInt(params.meetupId) : null;
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
  
  // Scroll to top when entering quick meetup chat
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [meetupId]);

  // Fetch meetup details
  const { data: meetup, isLoading: meetupLoading } = useQuery<QuickMeetup>({
    queryKey: ['/api/quick-meetups', meetupId],
    queryFn: async () => {
      const response = await fetch(`/api/quick-meetups/${meetupId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch meetup');
      }
      return response.json();
    },
    enabled: !!meetupId
  });

  // Fetch meetup chatroom
  const { data: chatroom } = useQuery<Chatroom>({
    queryKey: ['/api/quick-meetup-chatrooms', meetupId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/quick-meetup-chatrooms/${meetupId}`);
      return response.json();
    },
    enabled: !!meetupId
  });

  // Fetch chat messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/quick-meetup-chatrooms', chatroom?.id, 'messages'],
    queryFn: async () => {
      if (!chatroom?.id) return [];
      const response = await fetch(`/api/quick-meetup-chatrooms/${chatroom.id}/messages`, {
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

  // Fetch meetup participants
  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: ['/api/quick-meetups', meetupId, 'participants'],
    queryFn: async () => {
      if (!meetupId) return [];
      const response = await fetch(`/api/quick-meetups/${meetupId}/participants`);
      if (!response.ok) throw new Error('Failed to fetch participants');
      return response.json();
    },
    enabled: !!meetupId && !!currentUser
  });

  const hasUserSentMessage = useRef(false);

  // Auto-join chatroom when component loads
  const joinChatroomMutation = useMutation({
    mutationFn: async () => {
      if (!chatroom?.id || !currentUser?.id) return;
      
      const response = await fetch(`/api/quick-meetup-chatrooms/${chatroom.id}/join`, {
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
      console.log('Successfully joined quick meetup chatroom');
    },
    onError: (error) => {
      console.error('Failed to join quick meetup chatroom:', error);
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
      
      const response = await fetch(`/api/quick-meetup-chatrooms/${chatroom.id}/messages`, {
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
      setMessage('');
      hasUserSentMessage.current = true;
      queryClient.invalidateQueries({ 
        queryKey: ['/api/quick-meetup-chatrooms', chatroom?.id, 'messages'] 
      });
      
      // Scroll to bottom when user sends a message
      // Keep natural scroll position - don't auto-scroll to bottom
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message.trim());
  };

  const formatTimeRemaining = (expiresAt: string) => {
    // Debug what we're getting
    console.log('🕐 EXPIRATION STRING:', expiresAt);
    
    const now = new Date();
    console.log('🕐 NOW:', now.toISOString());
    
    // Parse the expiration time
    const expiration = new Date(expiresAt);
    console.log('🕐 PARSED EXPIRATION:', expiration.toISOString());
    
    // Calculate difference in milliseconds
    const timeDiffMs = expiration.getTime() - now.getTime();
    console.log('🕐 TIME DIFF MS:', timeDiffMs);
    
    if (timeDiffMs <= 0) {
      return "Expired";
    }
    
    // Convert to minutes
    const totalMinutes = Math.floor(timeDiffMs / (1000 * 60));
    console.log('🕐 TOTAL MINUTES:', totalMinutes);
    
    // For debugging, let's force show just minutes if under 60
    if (totalMinutes < 60) {
      return `${totalMinutes}m left`;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (minutes === 0) {
      return `${hours}h left`;
    } else {
      return `${hours}h ${minutes}m left`;
    }
  };

  if (!meetupId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-6">
          <div className="text-center py-8">
            <p className="text-red-600">Invalid meetup ID</p>
          </div>
        </div>
      </div>
    );
  }

  if (meetupLoading || messagesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!meetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-6">
          <div className="text-center py-8">
            <p className="text-red-600">Meetup not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <div className="mb-4">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {/* Meetup Info Header */}
          <Card className="border-orange-200 dark:border-orange-700">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-orange-800 dark:text-orange-200 text-xl">
                    {meetup.title}
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{meetup.meetingPoint}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Available: {new Date(meetup.availableAt).toLocaleString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{participants.length} participants</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                  {formatTimeRemaining(meetup.expiresAt)}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Chat Area */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-blue-50 dark:from-orange-900/20 dark:to-blue-900/20">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-orange-600" />
              <span className="text-gray-800 dark:text-gray-200">Discussion</span>
              <Badge variant="secondary" className="ml-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                {participants.length} participants
              </Badge>
            </CardTitle>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Coordinate logistics, share tips, and connect with other participants
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area - Couchsurfing Style */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-1">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <div className="text-gray-500 space-y-2">
                      <p className="font-medium">No comments yet. Start the conversation!</p>
                      <div className="text-sm text-gray-400 max-w-md mx-auto">
                        <p>Share logistics, ask questions, or coordinate meetup details.</p>
                        <p>Tips: Mention specific meeting spots, what to bring, or availability changes.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                      <div className="flex gap-3">
                        {/* Profile Picture */}
                        <div className="flex-shrink-0">
                          {msg.sender?.profileImage ? (
                            <img 
                              src={msg.sender.profileImage} 
                              alt={msg.sender.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                              {msg.sender?.username?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        
                        {/* Message Content */}
                        <div className="flex-1 min-w-0">
                          {/* Name and Time */}
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                              {msg.sender?.username || msg.sender?.name || 'Unknown User'}
                              {msg.senderId === meetup?.organizerId && (
                                <span className="ml-2 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded-full font-normal">
                                  Organizer
                                </span>
                              )}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(msg.sentAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })} • {new Date(msg.sentAt).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </span>
                          </div>
                          
                          {/* Message Text */}
                          <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            {(msg.message || msg.content || '').split('\n').map((line, index) => (
                              <p key={index} className={index > 0 ? 'mt-2' : ''}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input - Community Style */}
            <div className="border-t bg-gray-50 dark:bg-gray-800/50 p-4">
              <div className="mb-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Share logistics, ask questions, or coordinate details with other participants
                </p>
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a comment... (e.g., 'I can help with directions', 'What should we bring?', 'Running 10 min late')"
                  className="flex-1 min-h-[60px] p-3 border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  disabled={sendMessageMutation.isPending}
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <Button 
                  type="submit" 
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600 self-end px-4 py-2 h-auto"
                >
                  {sendMessageMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => setMessage("I'm interested! What time should we meet exactly?")}
                  className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                >
                  Ask about timing
                </button>
                <button
                  onClick={() => setMessage("Happy to help coordinate! I know the area well.")}
                  className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                >
                  Offer to help
                </button>
                <button
                  onClick={() => setMessage("What should we bring? Any specific recommendations?")}
                  className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                >
                  Ask about supplies
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default QuickMeetupChat;