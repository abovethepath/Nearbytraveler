import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Users, MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// Using Avatar component instead since SimpleAvatar path is incorrect

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

interface Meetup {
  id: number;
  title: string;
  description: string;
  meetingPoint: string;
  city: string;
  state: string;
  country: string;
  date: string;
  endDate: string;
  participantCount: number;
  organizer: User;
}

interface Participant {
  id: number;
  meetupId: number;
  userId: number;
  status: string;
  joinedAt: string;
  user: User;
}

export default function MeetupChat() {
  const [, params] = useRoute("/meetup-chat/:meetupId");
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

  // Fetch meetup details
  const { data: meetup, isLoading: meetupLoading } = useQuery<Meetup>({
    queryKey: ['/api/quick-meets', meetupId],
    enabled: !!meetupId
  });

  // Fetch meetup chatroom
  const { data: chatroom } = useQuery({
    queryKey: ['/api/meetup-chatrooms', meetupId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/meetup-chatrooms/${meetupId}`);
      return response.json();
    },
    enabled: !!meetupId
  });

  // Fetch chat messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/meetup-chatrooms', chatroom?.id, 'messages'],
    queryFn: async () => {
      if (!chatroom?.id) return [];
      const response = await fetch(`/api/meetup-chatrooms/${chatroom.id}/messages`, {
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

  // Fetch participants
  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: ['/api/quick-meets', meetupId, 'participants'],
    queryFn: async () => {
      if (!meetupId) return [];
      const response = await apiRequest('GET', `/api/quick-meets/${meetupId}/participants`);
      const data = await response.json();
      console.log('🔍 Participants data received:', data);
      return data;
    },
    enabled: !!meetupId
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!chatroom?.id || !currentUser) throw new Error("Missing requirements");
      
      return await apiRequest('POST', `/api/meetup-chatrooms/${chatroom.id}/messages`, {
        content,
        userId: currentUser.id,
        username: currentUser.username
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ 
        queryKey: ['/api/meetup-chatrooms', chatroom?.id, 'messages'] 
      });
    },
    onError: (error: any) => {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive (disabled to prevent unwanted scrolling)
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!meetupId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Invalid meetup ID</p>
      </div>
    );
  }

  if (meetupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading meetup...</p>
      </div>
    );
  }

  if (!meetup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Meetup not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.history.back()}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {meetup?.title || 'Loading...'}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {meetup?.meetingPoint || 'Loading...'}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {meetup?.participantCount || 0} participants
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {meetup?.date ? new Date(meetup.date).toLocaleDateString() : 'Loading...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Chat</CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messagesLoading ? (
                    <div className="text-center text-gray-500">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500">
                      <p>No messages yet. Be the first to say hello! 👋</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex gap-3 ${msg.senderId === currentUser?.id ? 'flex-row-reverse' : ''}`}
                      >
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={msg.user?.profileImage || ''} />
                          <AvatarFallback>
                            {msg.user?.username?.substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex flex-col ${msg.senderId === currentUser?.id ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {msg.user?.username || 'Unknown User'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                            msg.senderId === currentUser?.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
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
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sendMessageMutation.isPending}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Participants */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participants ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div 
                      key={participant.id} 
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => window.location.href = `/profile/${participant.user?.id}`}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={participant.user?.profileImage || ''} />
                        <AvatarFallback>
                          {participant.user?.username?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {participant.user?.username || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {participant.userId === meetup?.organizer?.id ? 'Organizer' : 'Participant'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}