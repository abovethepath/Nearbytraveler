import React, { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "@/App";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  Users, 
  Plus, 
  Send, 
  Search, 
  MapPin, 
  Globe, 
  Loader2,
  ArrowLeft,
  UserPlus 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CityChatroom {
  id: number;
  name: string;
  description: string | null;
  city: string;
  state: string | null;
  country: string;
  createdById: number;
  isActive: boolean;
  isPublic: boolean;
  maxMembers: number;
  tags: string[] | null;
  rules: string | null;
  createdAt: string;
  memberCount?: number;
  userIsMember?: boolean;
  canJoin?: boolean;
}

interface ChatroomMessage {
  id: number;
  chatroomId: number;
  senderId: number;
  content: string;
  messageType: string;
  createdAt: string;
  sender: {
    id: number;
    username: string;
    name: string;
    profileImage: string | null;
  };
}

interface CityChatroomsPageProps {
  cityFilter?: string | undefined;
}

export default function CityChatroomsPage({ cityFilter }: CityChatroomsPageProps = {}) {
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get user from multiple sources for reliability
  const getCurrentUser = () => {
    if (user) return user;
    
    try {
      const storedUser = localStorage.getItem('travelconnect_user') || localStorage.getItem('user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (e) {
      console.error('Error parsing stored user:', e);
    }
    return null;
  };
  
  const currentUser = getCurrentUser();
  
  // State management
  const [selectedChatroom, setSelectedChatroom] = useState<CityChatroom | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchCity, setSearchCity] = useState(cityFilter || "");
  const [showSearchResults, setShowSearchResults] = useState(!!cityFilter);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newChatroomData, setNewChatroomData] = useState({
    name: "",
    description: "",
    city: "",
    country: "",
    isPublic: true
  });

  // Fetch user's location-based chatrooms (hometown + travel destination)
  const { data: myLocationChatrooms, isLoading: myLocationLoading } = useQuery({
    queryKey: ['/api/chatrooms/my-locations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/chatrooms/my-locations');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!currentUser && !showSearchResults,
    staleTime: 0
  });

  // Fetch search results when user searches for other cities
  const { data: searchChatrooms, isLoading: searchLoading } = useQuery({
    queryKey: ['/api/chatrooms', searchCity],
    queryFn: async () => {
      if (!searchCity.trim()) return [];
      const response = await apiRequest('GET', `/api/chatrooms?city=${encodeURIComponent(searchCity)}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: showSearchResults && !!searchCity.trim()
  });

  // Determine which chatrooms to display
  const chatroomsData = showSearchResults ? searchChatrooms : myLocationChatrooms;
  const isLoadingChatrooms = showSearchResults ? searchLoading : myLocationLoading;
  const chatrooms: CityChatroom[] = Array.isArray(chatroomsData) ? chatroomsData : [];

  // Fetch messages for selected chatroom
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/chatrooms', selectedChatroom?.id, 'messages'],
    queryFn: async () => {
      if (!selectedChatroom) return [];
      const response = await apiRequest('GET', `/api/chatrooms/${selectedChatroom.id}/messages`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedChatroom,
    refetchInterval: 5000 // Auto-refresh messages every 5 seconds
  });

  // Fetch chatroom members for selected chatroom
  const { data: chatroomMembers, isLoading: membersLoading } = useQuery({
    queryKey: ['/api/chatrooms', selectedChatroom?.id, 'members'],
    queryFn: async () => {
      if (!selectedChatroom) return [];
      const response = await apiRequest('GET', `/api/chatrooms/${selectedChatroom.id}/members`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedChatroom,
    staleTime: 30000 // Refresh every 30 seconds
  });

  const messages: ChatroomMessage[] = Array.isArray(messagesData) ? messagesData : [];
  const members: any[] = Array.isArray(chatroomMembers) ? chatroomMembers : [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ chatroomId, content }: { chatroomId: number; content: string }) => {
      const response = await apiRequest('POST', `/api/chatrooms/${chatroomId}/messages`, {
        body: JSON.stringify({ content, senderId: currentUser?.id })
      });
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms', selectedChatroom?.id, 'messages'] });
      // Scroll to bottom after sending message
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Join chatroom mutation
  const joinChatroomMutation = useMutation({
    mutationFn: async (chatroomId: number) => {
      const response = await apiRequest('POST', `/api/chatrooms/${chatroomId}/join`, {
        body: JSON.stringify({ userId: currentUser?.id })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully joined the chatroom!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to join chatroom. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Create new chatroom mutation
  const createChatroomMutation = useMutation({
    mutationFn: async (data: typeof newChatroomData) => {
      const response = await apiRequest('POST', '/api/chatrooms', {
        body: JSON.stringify({
          ...data,
          createdById: currentUser?.id
        })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Chatroom created successfully!"
      });
      setIsCreateDialogOpen(false);
      setNewChatroomData({ name: "", description: "", city: "", country: "", isPublic: true });
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create chatroom. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle search
  const handleSearch = () => {
    if (searchCity.trim()) {
      setShowSearchResults(true);
    }
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!selectedChatroom || !newMessage.trim() || !currentUser) return;
    
    sendMessageMutation.mutate({
      chatroomId: selectedChatroom.id,
      content: newMessage.trim()
    });
  };

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Please Log In
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You need to be logged in to access city chatrooms.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {selectedChatroom ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedChatroom(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              ) : null}
              <MessageCircle className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedChatroom ? selectedChatroom.name : "City Chatrooms"}
              </h1>
            </div>
            
            {!selectedChatroom && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Room
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Chatroom</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Room name"
                      value={newChatroomData.name}
                      onChange={(e) => setNewChatroomData(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Description (optional)"
                      value={newChatroomData.description}
                      onChange={(e) => setNewChatroomData(prev => ({ ...prev, description: e.target.value }))}
                    />
                    <Input
                      placeholder="City"
                      value={newChatroomData.city}
                      onChange={(e) => setNewChatroomData(prev => ({ ...prev, city: e.target.value }))}
                    />
                    <Input
                      placeholder="Country"
                      value={newChatroomData.country}
                      onChange={(e) => setNewChatroomData(prev => ({ ...prev, country: e.target.value }))}
                    />
                    <Button 
                      onClick={() => createChatroomMutation.mutate(newChatroomData)}
                      disabled={!newChatroomData.name || !newChatroomData.city || createChatroomMutation.isPending}
                      className="w-full"
                    >
                      {createChatroomMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Chatroom"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Search Bar (only show when not in a chatroom) */}
          {!selectedChatroom && (
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search chatrooms by city..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
              {showSearchResults && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowSearchResults(false);
                    setSearchCity("");
                  }}
                >
                  My Cities
                </Button>
              )}
            </div>
          )}
        </div>

        {selectedChatroom ? (
          /* Chat View with Member Sidebar */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedChatroom.city}, {selectedChatroom.country}
                </span>
                {selectedChatroom.memberCount && (
                  <Badge variant="secondary">
                    <Users className="w-3 h-3 mr-1" />
                    {selectedChatroom.memberCount} members
                  </Badge>
                )}
                {!selectedChatroom.userIsMember && (
                  <Button
                    size="sm"
                    onClick={() => joinChatroomMutation.mutate(selectedChatroom.id)}
                    disabled={joinChatroomMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white ml-auto"
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    Join Chatroom
                  </Button>
                )}
              </div>
              {selectedChatroom.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedChatroom.description}
                </p>
              )}
            </div>

            {/* Main Chat Area - Two Columns */}
            <div className="flex flex-1 overflow-hidden">
              {/* Messages Column */}
              <div className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`flex ${message.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderId === currentUser?.id 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}>
                            {message.senderId !== currentUser?.id && (
                              <p className="text-xs opacity-75 mb-1">
                                {message.sender.name || message.sender.username}
                              </p>
                            )}
                            <p>{message.content}</p>
                            <p className="text-xs opacity-75 mt-1">
                              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      className="flex-1"
                      data-testid="input-message"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      data-testid="button-send-message"
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Members Sidebar */}
              <div className="w-64 border-l border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Members ({members.length})
                  </h3>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2">
                    {membersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    ) : members.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No members loaded
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {members.map((member: any) => (
                          <div key={member.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                              {(member.name || member.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {member.name || member.username || 'Unknown'}
                              </p>
                              {member.role === 'admin' && (
                                <Badge variant="outline" className="text-xs">
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        ) : (
          /* Chatrooms List */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoadingChatrooms ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : chatrooms.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {showSearchResults ? "No chatrooms found" : "No chatrooms in your cities"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {showSearchResults 
                    ? `No chatrooms found for "${searchCity}"`
                    : "Create the first chatroom for your city!"
                  }
                </p>
              </div>
            ) : (
              chatrooms.map((chatroom) => (
                <Card key={chatroom.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{chatroom.name}</span>
                      {chatroom.userIsMember ? (
                        <Badge variant="default">Joined</Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            joinChatroomMutation.mutate(chatroom.id);
                          }}
                          disabled={joinChatroomMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Join
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent onClick={() => setSelectedChatroom(chatroom)}>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{chatroom.city}, {chatroom.country}</span>
                    </div>
                    {chatroom.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {chatroom.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {chatroom.memberCount || 0} members
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {chatroom.isPublic ? (
                          <Globe className="w-4 h-4 text-green-500" />
                        ) : (
                          <MessageCircle className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}