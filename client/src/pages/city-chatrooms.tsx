import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Users, MapPin, UserPlus, Loader2, Plus, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface CityChatroom {
  id: number;
  name: string;
  description: string;
  city: string;
  state: string;
  country: string;
  memberCount: number;
  userIsMember: boolean;
  tags: string[];
}

export default function CityChatroomsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newChatroom, setNewChatroom] = useState({
    name: '',
    description: ''
  });
  
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

  // Fetch chatrooms with proper member counts
  const { data: chatrooms = [], isLoading, refetch } = useQuery<CityChatroom[]>({
    queryKey: ['/api/chatrooms/my-locations'],
    refetchInterval: 10000, // Refresh every 10 seconds
    refetchOnWindowFocus: true
  });

  // Join chatroom mutation
  const joinMutation = useMutation({
    mutationFn: async (chatroomId: number) => {
      if (!currentUser) throw new Error("User not found");
      
      const response = await apiRequest('POST', `/api/chatrooms/${chatroomId}/join`, {
        userId: currentUser.id
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join chatroom');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.newMember) {
        toast({
          title: "Success! ⭐ +1 Aura",
          description: "Successfully joined the chatroom and earned aura!",
        });
      } else {
        toast({
          title: "Success",
          description: "You're already a member of this chatroom",
        });
      }
      // Refresh chatrooms and user data to update member status and aura
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms/my-locations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join chatroom",
        variant: "destructive",
      });
    }
  });

  // Leave chatroom mutation  
  const leaveMutation = useMutation({
    mutationFn: async (chatroomId: number) => {
      if (!currentUser) throw new Error("User not found");
      
      const response = await apiRequest('POST', `/api/chatrooms/${chatroomId}/leave`, {
        userId: currentUser.id
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to leave chatroom');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success", 
        description: "Left the chatroom",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms/my-locations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to leave chatroom",
        variant: "destructive",
      });
    }
  });


  // Create chatroom mutation
  const createChatroomMutation = useMutation({
    mutationFn: async (chatroomData: { name: string; description: string }) => {
      if (!currentUser) throw new Error("User not found");
      
      const response = await apiRequest('POST', '/api/chatrooms', {
        ...chatroomData,
        createdById: currentUser.id,
        city: currentUser.hometownCity || currentUser.location?.split(',')[0] || 'Unknown',
        state: currentUser.hometownState || currentUser.location?.split(',')[1]?.trim() || 'Unknown',
        country: currentUser.hometownCountry || 'United States'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create chatroom');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Chatroom Created!",
        description: `Successfully created "${data.name}". You are now the organizer.`,
      });
      setIsCreateDialogOpen(false);
      setNewChatroom({ name: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms/my-locations'] });
    },
    onError: (error: any) => {
      console.error('Create chatroom error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create chatroom. Please try again.",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading Chatrooms...
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Finding chatrooms in your area
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Back Button */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/discover')}
            className="inline-flex items-center gap-2 px-4 py-3 text-base font-medium text-gray-600 bg-white border border-gray-300 rounded-xl shadow-sm hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 active:scale-95 transition-all duration-200 touch-manipulation min-h-[48px]"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Cities
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            💬 City Chatrooms
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            Connect with locals and travelers in your city
          </p>
          
          {/* Create Chatroom Button */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create New Chatroom
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg backdrop-blur-sm">
              <DialogHeader>
                <DialogTitle>Create New Chatroom</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="chatroom-name">Chatroom Name</Label>
                  <Input
                    id="chatroom-name"
                    placeholder="e.g., Coffee Lovers Meetup"
                    value={newChatroom.name}
                    onChange={(e) => setNewChatroom(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="chatroom-description">Description</Label>
                  <Textarea
                    id="chatroom-description"
                    placeholder="Describe what this chatroom is about..."
                    value={newChatroom.description}
                    onChange={(e) => setNewChatroom(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => setIsCreateDialogOpen(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createChatroomMutation.mutate(newChatroom)}
                    disabled={!newChatroom.name.trim() || createChatroomMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {createChatroomMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Chatrooms Grid - Mobile Responsive */}
        {chatrooms.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {chatrooms.map((chatroom) => (
              <Card 
                key={chatroom.id} 
                className="group cursor-pointer transform hover:scale-105 transition-all duration-300 overflow-hidden relative bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl border-gray-200 dark:border-gray-700"
                onClick={() => navigate(`/simple-chatroom/${chatroom.id}`)}
              >
                {/* Header with gradient background */}
                <div className="relative h-24 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-white/80" />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-white/20 text-white backdrop-blur-sm">
                      <Users className="w-3 h-3 mr-1" />
                      {chatroom.memberCount || 0}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  {/* Title and Location */}
                  <div className="mb-4">
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {chatroom.name}
                    </h3>
                    <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{chatroom.city}, {chatroom.state}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-3 min-h-[3rem]">
                    {chatroom.description}
                  </p>
                  
                  {/* Tags */}
                  {chatroom.tags && chatroom.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {chatroom.tags.slice(0, 3).map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {chatroom.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          +{chatroom.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    {chatroom.userIsMember ? (
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/simple-chatroom/${chatroom.id}`);
                          }}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Open Chat
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            leaveMutation.mutate(chatroom.id);
                          }}
                          disabled={leaveMutation.isPending}
                          className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          Leave
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          joinMutation.mutate(chatroom.id);
                        }}
                        disabled={joinMutation.isPending}
                      >
                        {joinMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <UserPlus className="w-4 h-4 mr-2" />
                        )}
                        Join Chatroom
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <MessageCircle className="w-20 h-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                No Chatrooms Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                No chatrooms available for your locations yet. Create one to get started!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}