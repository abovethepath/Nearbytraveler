import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/App";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { MessageCircle, Users, Plus, MapPin, Globe, Lock, Settings, Send, Search, UserPlus, Edit3, Loader2, Eye, Crown, ArrowLeft, Brain, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

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
  createdAt: Date;
  memberCount?: number;
  userIsMember?: boolean;
  canJoin?: boolean;
  creator?: {
    id: number;
    username: string;
    name: string;
    profileImage: string | null;
  };
}

interface ChatroomMessage {
  id: number;
  chatroomId: number;
  senderId: number;
  content: string;
  messageType: string;
  replyToId: number | null;
  isEdited: boolean;
  editedAt: Date | null;
  createdAt: Date;
  sender: {
    id: number;
    username: string;
    name: string;
    profileImage: string | null;
  };
}

interface ChatroomMember {
  id: number;
  chatroomId: number;
  userId: number;
  role: string;
  joinedAt: Date;
  lastReadAt: Date | null;
  isMuted: boolean;
  isActive: boolean;
  user: {
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
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              City Chatrooms
            </h1>
          </div>
          
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Welcome to City Chatrooms!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Connect with locals and travelers in your city. Chat about events, recommendations, and make new friends.
            </p>
            
            {user ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Hello {user.name || user.username}! City chatrooms are coming soon.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                    Coming Soon Features:
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                    <li>• Join chatrooms for your current city</li>
                    <li>• Create topic-based discussions</li>
                    <li>• Meet locals and fellow travelers</li>
                    <li>• Share recommendations and tips</li>
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                Please log in to access city chatrooms.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CityChatroomsPaused({ cityFilter }: CityChatroomsPageProps = {}) {
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Force cache invalidation on component mount
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/chatrooms'] });
    queryClient.removeQueries({ queryKey: ['/api/chatrooms'] });
  }, [queryClient]);

  // State for search functionality - initialize with cityFilter if provided
  const [searchCity, setSearchCity] = useState(cityFilter || "");
  const [showSearchResults, setShowSearchResults] = useState(!!cityFilter);

  // Get user's relevant cities for initial chatroom loading
  const getUserCities = () => {
    if (!currentUser) return [];
    const cities = [];

    // Add hometown city
    if (currentUser.hometownCity) {
      cities.push(currentUser.hometownCity);
    }

    // Add travel destination if currently traveling
    if (currentUser.isCurrentlyTraveling && currentUser.travelDestination) {
      cities.push(currentUser.travelDestination);
    }

    return cities;
  };
  const [selectedChatroom, setSelectedChatroom] = useState<CityChatroom | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editChatroomData, setEditChatroomData] = useState({
    name: "",
    description: "",
    city: "",
    state: "",
    country: "",
    isPublic: true,
    maxMembers: 500,
    tags: "",
    rules: ""
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'users'>('chat');
  const [newChatroomData, setNewChatroomData] = useState({
    name: "",
    description: "",
    city: "",
    state: "",
    country: "",
    isPublic: true,
    maxMembers: 500,
    tags: "",
    rules: ""
  });

  // Get user from localStorage as fallback if AuthContext user is null
  const getCurrentUser = () => {
    if (user) return user;
    const storedUser = localStorage.getItem('travelconnect_user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error('Error parsing stored user data:', e);
        return null;
      }
    }
    return null;
  };

  const currentUser = getCurrentUser();

  console.log('Chatrooms page - user from AuthContext:', user);
  console.log('Chatrooms page - currentUser resolved:', currentUser);
  console.log('Chatrooms page - authentication check will pass:', !!currentUser);

  // Fetch user's hometown and travel destination chatrooms first
  const { data: myLocationChatrooms, isLoading: myLocationLoading } = useQuery({
    queryKey: ['/api/chatrooms/my-locations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/chatrooms/my-locations');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!currentUser && !showSearchResults,
    staleTime: 0 // Always fetch fresh data
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

  // Determine which chatrooms to display based on current mode
  const chatroomsData = showSearchResults ? searchChatrooms : myLocationChatrooms;
  const isLoadingChatrooms = showSearchResults ? searchLoading : myLocationLoading;

  // Ensure chatrooms is always an array
  const chatrooms: CityChatroom[] = Array.isArray(chatroomsData) ? chatroomsData : [];

  // Fetch messages for selected chatroom
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/chatrooms', selectedChatroom?.id, 'messages'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/chatrooms/${selectedChatroom?.id}/messages`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedChatroom
  });

  // Ensure messages is always an array
  const messages: ChatroomMessage[] = Array.isArray(messagesData) ? messagesData : [];

  // Fetch members for selected chatroom
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['/api/chatrooms', selectedChatroom?.id, 'members'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/chatrooms/${selectedChatroom?.id}/members`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedChatroom
  });

  // Ensure members is always an array
  const members: ChatroomMember[] = Array.isArray(membersData) ? membersData : [];

  // Check if current user is admin of selected chatroom
  const currentUserMembership = members.find(member => member.userId === currentUser?.id);
  const isCurrentUserAdmin = currentUserMembership?.role === 'admin';

  // Check for auto-open chatroom members flag when returning from profile
  useEffect(() => {
    const openChatroomMembers = localStorage.getItem('open_chatroom_members');
    console.log('Checking for auto-open flag:', openChatroomMembers);
    if (openChatroomMembers && chatrooms && chatrooms.length > 0) {
      const chatroomId = parseInt(openChatroomMembers);
      console.log('Auto-opening chatroom members for ID:', chatroomId);
      localStorage.removeItem('open_chatroom_members');

      // Find and select the chatroom, then trigger the View Users modal
      const targetChatroom = chatrooms.find(c => c.id === chatroomId);
      console.log('Found target chatroom:', targetChatroom);
      if (targetChatroom) {
        setSelectedChatroom(targetChatroom);
        console.log('Selected chatroom, triggering modal in 500ms');
        // Automatically open the View Users modal by triggering its dialog
        setTimeout(() => {
          const viewUsersButton = document.querySelector('[data-chatroom-users-trigger]') as HTMLElement;
          console.log('View Users button found:', !!viewUsersButton);
          if (viewUsersButton) {
            viewUsersButton.click();
            console.log('Clicked View Users button');
          }
        }, 500);
      }
    }
  }, [chatrooms]);

  // Create chatroom mutation
  const createChatroomMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/chatrooms', data),
    onSuccess: (newChatroom) => {
      toast({ title: "Success", description: "City chatroom created successfully! You are now the admin." });
      setIsCreateDialogOpen(false);
      setNewChatroomData({
        name: "",
        description: "",
        city: "",
        state: "",
        country: "",
        isPublic: true,
        maxMembers: 500,
        tags: "",
        rules: ""
      });

      // Immediately update cache with new chatroom where creator is admin and member
      const currentChatrooms = queryClient.getQueryData(['/api/chatrooms']) as any[] || [];
      const newChatroomWithMembership = {
        ...newChatroom,
        userIsMember: true,
        memberCount: 1, // Creator is first member
        canJoin: true
      };
      queryClient.setQueryData(['/api/chatrooms'], [...currentChatrooms, newChatroomWithMembership]);

      // Auto-select the new chatroom
      setSelectedChatroom(newChatroomWithMembership);

      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create chatroom",
        variant: "destructive"
      });
    }
  });

  // Join chatroom mutation
  const joinChatroomMutation = useMutation({
    mutationFn: (chatroomId: number) => apiRequest('POST', `/api/chatrooms/${chatroomId}/join`),
    onSuccess: async (_, chatroomId) => {
      console.log('Successfully joined chatroom', chatroomId);
      toast({ title: "Success", description: "Joined chatroom successfully!" });

      // Force immediate cache invalidation and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms', 'my-locations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms', chatroomId, 'members'] });

      // Update member count immediately in the chatrooms list
      const currentChatrooms = queryClient.getQueryData(['/api/chatrooms']) as any[];
      if (currentChatrooms) {
        const updatedChatrooms = currentChatrooms.map(room => 
          room.id === chatroomId 
            ? { ...room, memberCount: (room.memberCount || 0) + 1, userIsMember: true }
            : room
        );
        queryClient.setQueryData(['/api/chatrooms'], updatedChatrooms);
      }

      // Automatically select the chatroom after joining
      const joinedChatroom = chatrooms.find(c => c.id === chatroomId);
      if (joinedChatroom) {
        setSelectedChatroom({ ...joinedChatroom, userIsMember: true, memberCount: (joinedChatroom.memberCount || 0) + 1 });
      }
    },
    onError: (error: any) => {
      console.error('Error joining chatroom:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to join chatroom",
        variant: "destructive"
      });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { chatroomId: number; content: string }) => 
      apiRequest('POST', `/api/chatrooms/${data.chatroomId}/messages`, { content: data.content }),
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms', selectedChatroom?.id, 'messages'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    }
  });

  // Edit chatroom mutation
  const editChatroomMutation = useMutation({
    mutationFn: async (data: typeof editChatroomData) => {
      const response = await apiRequest('PUT', `/api/chatrooms/${selectedChatroom?.id}`, {
        ...data,
        tags: data.tags ? (typeof data.tags === 'string' ? data.tags.split(',').map(tag => tag.trim()) : Array.isArray(data.tags) ? data.tags : []) : [],
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms', selectedChatroom?.id] });
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Chatroom updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update chatroom",
        variant: "destructive",
      });
    },
  });

  // Function to open edit dialog with current chatroom data
  const openEditDialog = () => {
    if (selectedChatroom) {
      setEditChatroomData({
        name: selectedChatroom.name,
        description: selectedChatroom.description || "",
        city: selectedChatroom.city,
        state: selectedChatroom.state || "",
        country: selectedChatroom.country,
        isPublic: selectedChatroom.isPublic,
        maxMembers: selectedChatroom.maxMembers,
        tags: selectedChatroom.tags ? selectedChatroom.tags.join(', ') : "",
        rules: selectedChatroom.rules || ""
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleCreateChatroom = () => {
    if (!newChatroomData.name || !newChatroomData.city || !newChatroomData.country) {
      toast({
        title: "Error",
        description: "Please fill in required fields (name, city, country)",
        variant: "destructive"
      });
      return;
    }

    const tagsArray = newChatroomData.tags ? 
      (typeof newChatroomData.tags === 'string' ? newChatroomData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : Array.isArray(newChatroomData.tags) ? newChatroomData.tags : []) : [];

    createChatroomMutation.mutate({
      ...newChatroomData,
      tags: tagsArray,
      createdById: user?.id
    });
  };

  const handleJoinChatroom = (chatroomId: number) => {
    joinChatroomMutation.mutate(chatroomId);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChatroom) return;

    sendMessageMutation.mutate({
      chatroomId: selectedChatroom.id,
      content: newMessage.trim()
    });
  };

  const isUserMember = (chatroomId: number) => {
    return members.some((member: ChatroomMember) => 
      member.userId === currentUser?.id && member.isActive
    );
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to access city chatrooms</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
            City Chatrooms
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Chat with Nearby Locals and Nearby Travelers in your city</p>
        </div>

        <div className="flex gap-3">
          {selectedChatroom && (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    data-chatroom-users-trigger
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View Users
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[85vh] p-0 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 p-6 text-white">
                    <DialogTitle className="text-2xl font-bold">{selectedChatroom.name}</DialogTitle>
                    <DialogDescription className="text-blue-100 mt-2">
                      Connect with community members • Click any avatar to view their profile
                    </DialogDescription>
                  </div>
                  <ChatroomUsersView chatroomId={selectedChatroom.id} />
                </DialogContent>
              </Dialog>

              {isCurrentUserAdmin && (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="border-orange-600 text-orange-600 hover:bg-orange-50"
                      onClick={openEditDialog}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Chatroom
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Chatroom</DialogTitle>
                      <DialogDescription>
                        Update chatroom settings (Admin only)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Chatroom Name *</label>
                        <Input
                          value={editChatroomData.name}
                          onChange={(e) => setEditChatroomData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., NYC Food Lovers"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={editChatroomData.description}
                          onChange={(e) => setEditChatroomData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="What's this chatroom about?"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">City *</label>
                          <Input
                            value={editChatroomData.city}
                            onChange={(e) => setEditChatroomData(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="New York"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">State</label>
                          <Input
                            value={editChatroomData.state}
                            onChange={(e) => setEditChatroomData(prev => ({ ...prev, state: e.target.value }))}
                            placeholder="NY"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Country *</label>
                        <Input
                          value={editChatroomData.country}
                          onChange={(e) => setEditChatroomData(prev => ({ ...prev, country: e.target.value }))}
                          placeholder="United States"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Tags (comma-separated)</label>
                        <Input
                          value={editChatroomData.tags}
                          onChange={(e) => setEditChatroomData(prev => ({ ...prev, tags: e.target.value }))}
                          placeholder="food, nightlife, recommendations"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Rules</label>
                        <Textarea
                          value={editChatroomData.rules}
                          onChange={(e) => setEditChatroomData(prev => ({ ...prev, rules: e.target.value }))}
                          placeholder="Chatroom guidelines and rules"
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="edit-public"
                          checked={editChatroomData.isPublic}
                          onCheckedChange={(checked) => setEditChatroomData(prev => ({ ...prev, isPublic: checked }))}
                        />
                        <Label htmlFor="edit-public">Public chatroom</Label>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Max Members</label>
                        <Input
                          type="number"
                          value={editChatroomData.maxMembers}
                          onChange={(e) => setEditChatroomData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 500 }))}
                          min="1"
                          max="1000"
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={() => editChatroomMutation.mutate(editChatroomData)}
                          disabled={!editChatroomData.name || !editChatroomData.city || !editChatroomData.country}
                          className="bg-gradient-to-r from-blue-600 to-orange-500 text-white flex-1"
                        >
                          Update Chatroom
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </>
          )}

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-orange-500 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Chatroom
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create City Chatroom</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Chatroom Name *</label>
                <Input
                  value={newChatroomData.name}
                  onChange={(e) => setNewChatroomData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., NYC Food Lovers"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newChatroomData.description}
                  onChange={(e) => setNewChatroomData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What's this chatroom about?"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">City *</label>
                  <Input
                    value={newChatroomData.city}
                    onChange={(e) => setNewChatroomData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">State</label>
                  <Input
                    value={newChatroomData.state}
                    onChange={(e) => setNewChatroomData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="NY"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Country *</label>
                <Input
                  value={newChatroomData.country}
                  onChange={(e) => setNewChatroomData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="United States"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  value={newChatroomData.tags}
                  onChange={(e) => setNewChatroomData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="food, travel, events"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Rules</label>
                <Textarea
                  value={newChatroomData.rules}
                  onChange={(e) => setNewChatroomData(prev => ({ ...prev, rules: e.target.value }))}
                  placeholder="Community guidelines..."
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Chatroom Privacy</label>
                  <p className="text-xs text-gray-500">
                    {newChatroomData.isPublic ? "Anyone can find and join this chatroom" : "Only invited members can join"}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Private</span>
                  <Switch
                    checked={newChatroomData.isPublic}
                    onCheckedChange={(checked) => setNewChatroomData(prev => ({ ...prev, isPublic: checked }))}
                  />
                  <span className="text-sm">Public</span>
                </div>
              </div>
              <Button 
                onClick={handleCreateChatroom}
                disabled={createChatroomMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-orange-500 text-white"
              >
                {createChatroomMutation.isPending ? "Creating..." : "Create Chatroom"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Header with location info and search */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Chat with Nearby Locals and Nearby Travelers in your city
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {showSearchResults 
                  ? `Search results for "${searchCity}"`
                  : "Your hometown and travel destination chatrooms"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 flex-1">
            <Input
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="Search other cities (e.g., Los Angeles, Paris, Tokyo)..."
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && searchCity.trim()) {
                  setShowSearchResults(true);
                }
              }}
            />
            <Button
              onClick={() => {
                if (searchCity.trim()) {
                  setShowSearchResults(true);
                } else {
                  setShowSearchResults(false);
                }
              }}
              className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          {showSearchResults && (
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {showSearchResults 
            ? "Explore chatrooms in other cities around the world"
            : "Choose a chatroom from the list to start chatting OR create your own above"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chatrooms List */}
        <div className="lg:col-span-1">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <MessageCircle className="h-5 w-5" />
                Chatrooms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {isLoadingChatrooms ? (
                  <div className="text-center py-8 text-gray-600 dark:text-gray-300">Loading chatrooms...</div>
                ) : chatrooms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No chatrooms found. Create the first one!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatrooms.map((chatroom: CityChatroom) => (
                      <div
                        key={chatroom.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedChatroom?.id === chatroom.id 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600'
                        }`}
                        onClick={() => setSelectedChatroom(chatroom)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white">{chatroom.name}</h4>
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <MapPin className="h-3 w-3" />
                              {chatroom.city}, {chatroom.country}
                            </div>
                            {chatroom.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                {chatroom.description}
                              </p>
                            )}
                            {chatroom.tags && chatroom.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {chatroom.tags.slice(0, 2).map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {chatroom.tags.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{chatroom.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            {chatroom.isPublic ? (
                              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <Globe className="h-3 w-3" />
                                <span className="text-xs">Public</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                <Lock className="h-3 w-3" />
                                <span className="text-xs">
                                  {chatroom.userIsMember ? "Member" : "Private"}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 ml-2">
                              <Users className="h-3 w-3" />
                              {chatroom.memberCount || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          {selectedChatroom ? (
            <Card className="h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">{selectedChatroom.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <MapPin className="h-4 w-4" />
                      {selectedChatroom.city}, {selectedChatroom.country}
                      <Badge variant={selectedChatroom.isPublic ? "default" : "secondary"}>
                        {selectedChatroom.isPublic ? "Public" : "Private"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user && selectedChatroom.createdById === user.id && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Edit Chatroom</DialogTitle>
                          </DialogHeader>
                          <EditChatroomDialog 
                            chatroom={selectedChatroom} 
                            onSuccess={() => {
                              queryClient.invalidateQueries({ queryKey: ['/api/chatrooms'] });
                              queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${selectedChatroom.id}`] });
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                    )}
                    {!selectedChatroom.isPublic && isUserMember(selectedChatroom.id) && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Users className="h-4 w-4 mr-2" />
                            Invite Users
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Invite Users to {selectedChatroom.name}</DialogTitle>
                          </DialogHeader>
                          <InviteUsersDialog chatroomId={selectedChatroom.id} />
                        </DialogContent>
                      </Dialog>
                    )}
                    {!isUserMember(selectedChatroom.id) && (
                      selectedChatroom.isPublic ? (
                        <Button 
                          onClick={() => handleJoinChatroom(selectedChatroom.id)}
                          disabled={joinChatroomMutation.isPending}
                          size="sm"
                          className="bg-gradient-to-r from-blue-600 to-orange-500 text-white"
                        >
                          {joinChatroomMutation.isPending ? "Joining..." : "Join"}
                        </Button>
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="border-orange-500 text-orange-600 hover:bg-orange-50"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Ask to Join
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Request Access to {selectedChatroom.name}</DialogTitle>
                              <DialogDescription>
                                Send a message to the chatroom creator requesting access to this private chatroom.
                              </DialogDescription>
                            </DialogHeader>
                            <AskToJoinDialog chatroomId={selectedChatroom.id} />
                          </DialogContent>
                        </Dialog>
                      )
                    )}
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-0 flex h-96">
                {/* Messages */}
                <div className="flex-1 flex flex-col">
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="text-center py-8">Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.reverse().map((message: ChatroomMessage) => (
                          <div key={message.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-orange-500 flex items-center justify-center text-white text-sm font-medium">
                              {message.sender?.profileImage ? (
                                <img 
                                  src={message.sender.profileImage} 
                                  alt={message.sender.username}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                message.sender?.username?.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{message.sender?.username}</span>
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                                </span>
                                {message.isEdited && (
                                  <Badge variant="outline" className="text-xs">edited</Badge>
                                )}
                              </div>
                              <p className="text-sm mt-1">{message.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    </ScrollArea>

                  {/* Message Input or Join Button */}
                  {isUserMember(selectedChatroom.id) ? (
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button 
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sendMessageMutation.isPending}
                          size="sm"
                          className="bg-gradient-to-r from-blue-600 to-orange-500 text-white"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-t bg-gray-50">
                      <div className="text-center">
                        {selectedChatroom.isPublic ? (
                          <Button 
                            onClick={() => handleJoinChatroom(selectedChatroom.id)}
                            className="bg-gradient-to-r from-blue-600 to-orange-500 text-white"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Join Chatroom
                          </Button>
                        ) : (
                          <div className="text-gray-600">
                            <Lock className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                            <p className="text-sm">This is a private chatroom</p>
                            <p className="text-xs text-gray-500 mt-1">
                              You need an invitation to join
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dynamic Members Sidebar */}
                <div className="w-72 border-l border-gray-200 dark:border-gray-700 bg-gradient-to-b from-blue-50/50 to-orange-50/50 dark:from-gray-800 dark:to-gray-900">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Members</h3>
                      </div>
                      <span className="text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white px-2 py-1 rounded-full font-medium">
                        {members?.length || 0}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Ordered by latest joined • Click to view profile
                    </p>
                  </div>

                  <ScrollArea className="h-80">
                    <div className="p-3 space-y-2">
                      {membersLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                      ) : members && members.length > 0 ? (
                        // Sort members by joinedAt date (most recent first)
                        [...members]
                          .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
                          .map((member: ChatroomMember, index) => (
                          <div 
                            key={member.id}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/50 cursor-pointer transition-all duration-200 group transform hover:scale-[1.02]"
                            onClick={() => {
                              console.log('Member clicked:', member.user.username);
                              window.location.href = `/profile/${member.user.id}`;
                            }}
                          >
                            <div className="relative">
                              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-600 shadow-md group-hover:ring-blue-400 dark:group-hover:ring-blue-500 transition-all duration-200">
                                {member.user.profileImage ? (
                                  <img 
                                    src={member.user.profileImage} 
                                    alt={member.user.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-orange-500 flex items-center justify-center text-white font-bold">
                                    {member.user.username?.slice(0, 2).toUpperCase() || 'U'}
                                  </div>
                                )}
                              </div>

                              {/* Admin crown */}
                              {member.role === 'admin' && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
                                  <Crown className="h-2.5 w-2.5 text-white" />
                                </div>
                              )}

                              {/* Online status */}
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-700 ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>

                              {/* New member indicator for recently joined (within 24h) */}
                              {new Date().getTime() - new Date(member.joinedAt).getTime() < 24 * 60 * 60 * 1000 && (
                                <div className="absolute -top-1 -left-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center">
                                  <span className="text-[8px] text-white font-bold">!</span>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {member.user.username}
                                </p>
                                {index === 0 && (
                                  <span className="text-[10px] bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 px-1.5 py-0.5 rounded-full font-medium">
                                    Latest
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                  {member.role}
                                </p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                  {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-blue-100 to-orange-100 dark:from-blue-900 dark:to-orange-900 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No members yet</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Be the first to join!</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Legend */}
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Online</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Crown className="h-3 w-3 text-yellow-500" />
                        <span>Admin</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                        <span>New (24h)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 px-1 py-0.5 rounded-full">Latest</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Select a chatroom</h3>
                <p>Choose a chatroom from the list to start chatting OR create your own above</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Chatroom Users View Component
function ChatroomUsersView({ chatroomId }: { chatroomId: number }) {
  const [, setLocation] = useLocation();
  const [members, setMembers] = useState<ChatroomMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Direct fetch without React Query caching issues
  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      console.log('Direct fetch for chatroom:', chatroomId);
      const response = await apiRequest('GET', `/api/chatrooms/${chatroomId}/members`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch members');
      }
      const data = await response.json();
      console.log('Direct fetch - Member data received:', data);
      console.log('Direct fetch - Member count:', data?.length);
      console.log('Direct fetch - Members usernames:', data?.map(m => m.user?.username));

      if (Array.isArray(data)) {
        setMembers(data);
        setError(null);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err as Error);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('ChatroomUsersView mounted, direct fetching');
    fetchMembers();
  }, [chatroomId]);

  const handleUserClick = (userId: number) => {
    // Store the current chatroom context for easy return
    const context = {
      chatroomId,
      returnUrl: '/city-chatrooms'
    };
    console.log('Storing chatroom context:', context);
    localStorage.setItem('chatroom_return_context', JSON.stringify(context));
    console.log('Navigating to profile:', userId);
    setLocation(`/profile/${userId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading members...</span>
      </div>
    );
  }

  console.log('ChatroomUsersView render - members:', members?.length, members?.map(m => m.user?.username));
  console.log('Raw members data:', members);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Loading members...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500 dark:text-red-400">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Error loading members: {error.message}</p>
        <button 
          onClick={fetchMembers}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  console.log('About to render members list - count:', members?.length);
  console.log('Members array for rendering:', members);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-xl">
      <ScrollArea className="max-h-[70vh]">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                Community Members
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {members?.length || 0} member{(members?.length || 0) !== 1 ? 's' : ''} • Click avatar to view profile
              </p>
            </div>
            <div className="text-2xl">👥</div>
          </div>

          {(!members || members.length === 0) ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-100 to-orange-100 dark:from-blue-900 dark:to-orange-900 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">No members found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Be the first to join this community!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
              {members.map((member: ChatroomMember) => {
                console.log('Rendering modern member card for:', member.user?.username);
                return (
                  <div 
                    key={member.id} 
                    className="group flex flex-col items-center cursor-pointer transform transition-all duration-300 hover:scale-105"
                    onClick={() => handleUserClick(member.user.id)}
                  >
                    <div className="relative mb-3">
                      <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-white dark:ring-gray-700 shadow-lg group-hover:ring-blue-400 dark:group-hover:ring-blue-500 transition-all duration-300">
                        {member.user.profileImage ? (
                          <img 
                            src={member.user.profileImage} 
                            alt={member.user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                            {member.user.username?.slice(0, 2).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>

                      {/* Admin crown */}
                      {member.role === 'admin' && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                          <Crown className="h-3 w-3 text-white" />
                        </div>
                      )}

                      {/* Online status */}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-700 ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>

                    <div className="text-center min-w-0 w-full">
                      <p className="font-semibold text-sm truncate text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={member.user.username}>
                        {member.user.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-1">
                        {member.role}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center gap-1">
                <Crown className="h-3 w-3 text-yellow-500" />
                <span>Admin</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>New (24h)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 px-1 py-0.5 rounded-full">Latest</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// Invite Users Dialog Component
interface InviteUsersDialogProps {
  chatroomId: number;
}

interface EditChatroomDialogProps {
  chatroom: CityChatroom;
  onSuccess: () => void;
}

function EditChatroomDialog({ chatroom, onSuccess }: EditChatroomDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: chatroom.name,
    description: chatroom.description || '',
    isPublic: chatroom.isPublic,
    maxMembers: chatroom.maxMembers,
    rules: chatroom.rules || '',
    tags: chatroom.tags || []
  });

  const availableTags = ['Events', 'Nightlife', 'Food', 'Culture', 'Business', 'Travel', 'Sports', 'Music', 'Art', 'Tech'];

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Chatroom name is required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/chatrooms/${chatroom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          isPublic: formData.isPublic,
          maxMembers: formData.maxMembers,
          rules: formData.rules.trim() || null,
          tags: formData.tags.length > 0 ? formData.tags : null
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Chatroom updated successfully"
        });
        onSuccess();
      } else {
        throw new Error('Failed to update chatroom');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update chatroom",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Chatroom Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter chatroom name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe your chatroom"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isPublic"
          checked={formData.isPublic}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
        />
        <Label htmlFor="isPublic">Public chatroom</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxMembers">Max Members</Label>
        <Input
          id="maxMembers"
          type="number"
          min="2"
          max="1000"
          value={formData.maxMembers}
          onChange={(e) => setFormData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 500 }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <Badge
              key={tag}
              variant={formData.tags.includes(tag) ? "default" : "outline"}
              className={`cursor-pointer ${
                formData.tags.includes(tag) 
                  ? "bg-gradient-to-r from-blue-600 to-orange-500 text-white" 
                  : "hover:bg-gray-100"
              }`}
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rules">Rules</Label>
        <Textarea
          id="rules"
          value={formData.rules}
          onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
          placeholder="Set chatroom rules (optional)"
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Updating..." : "Update Chatroom"}
        </Button>
      </div>
    </form>
  );
}

// Ask to Join Dialog Component
interface AskToJoinDialogProps {
  chatroomId: number;
}

function AskToJoinDialog({ chatroomId }: AskToJoinDialogProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', `/api/chatrooms/${chatroomId}/request-access`, { message });

      if (response.ok) {
        toast({
          title: "Request Sent",
          description: "Your access request has been sent to the chatroom creator. You'll receive a message when they respond."
        });
        setMessage("");
      } else {
        throw new Error('Failed to send request');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send access request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="message">Message (Optional)</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Let the creator know why you'd like to join..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-orange-500 text-white">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Request
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function InviteUsersDialog({ chatroomId }: InviteUsersDialogProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [inviteMessage, setInviteMessage] = useState("");

  // Fetch all users for selection
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
  });

  // Send invitations mutation
  const inviteUsersMutation = useMutation({
    mutationFn: async (data: { userIds: number[]; message: string }) => {
      const response = await fetch(`/api/chatrooms/${chatroomId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to send invitations');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitations sent!",
        description: "Selected users have been invited to join the chatroom.",
      });
      setSelectedUsers([]);
      setInviteMessage("");
    },
    onError: (error) => {
      toast({
        title: "Error sending invitations",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter((user: any) => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendInvitations = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to invite.",
        variant: "destructive",
      });
      return;
    }

    // Send invitations to all selected users
    await inviteUsersMutation.mutateAsync({
      userIds: selectedUsers,
      message: inviteMessage || "You've been invited to join this private chatroom!"
    });
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Users */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search users by name or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* User List */}
      <div className="max-h-64 overflow-y-auto space-y-2">
        {usersLoading ? (
          <div className="text-center py-4">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No users found
          </div>
        ) : (
          filteredUsers.map((user: any) => (
            <div
              key={user.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedUsers.includes(user.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => toggleUserSelection(user.id)}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-orange-500 flex items-center justify-center text-white font-medium">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{user.name}</h4>
                <p className="text-sm text-gray-500">@{user.username}</p>
                {user.location && (
                  <p className="text-xs text-gray-400">{user.location}</p>
                )}
              </div>
              {selectedUsers.includes(user.id) && (
                <UserPlus className="h-4 w-4 text-blue-600" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Invitation Message */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Invitation Message (Optional)
        </label>
        <Textarea
          placeholder="Add a personal message to your invitation..."
          value={inviteMessage}
          onChange={(e) => setInviteMessage(e.target.value)}
          rows={3}
        />
      </div>

      {/* Selected Users Count */}
      {selectedUsers.length > 0 && (
        <div className="text-sm text-gray-600">
          {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
        </div>
      )}

      {/* Send Invitations Button */}
      <Button
        onClick={handleSendInvitations}
        disabled={inviteUsersMutation.isPending || selectedUsers.length === 0}
        className="w-full bg-gradient-to-r from-blue-600 to-orange-500 text-white"
      >
        {inviteUsersMutation.isPending ? (
          "Sending Invitations..."
        ) : (
          `Send Invitation${selectedUsers.length !== 1 ? 's' : ''}`
        )}
      </Button>
    </div>
  );
}