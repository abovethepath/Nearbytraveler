import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Users, MapPin, UserPlus, Loader2 } from "lucide-react";

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
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully joined the chatroom!",
      });
      // Refresh chatrooms to update member status
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms/my-locations'] });
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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            💬 City Chatrooms
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Connect with locals and travelers in your city
          </p>
        </div>

        {/* Chatrooms Grid - Mobile Responsive */}
        {chatrooms.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {chatrooms.map((chatroom) => (
              <Card 
                key={chatroom.id} 
                className="group cursor-pointer transform hover:scale-105 transition-all duration-300 overflow-hidden relative bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl border-gray-200 dark:border-gray-700"
                onClick={() => {
                  console.log('🔥 CHATROOM CARD CLICK: ID', chatroom.id, 'Name:', chatroom.name);
                  window.location.href = `/simple-chatroom/${chatroom.id}`;
                }}
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
                          onClick={() => {
                            console.log(`🚀 CHATROOM FIX: Opening simple chatroom ${chatroom.id}`);
                            const url = `/simple-chatroom/${chatroom.id}?cacheBust=${Date.now()}`;
                            console.log('🌐 Opening URL:', url);
                            window.location.href = url;
                          }}
                          data-testid={`button-open-chat-${chatroom.id}`}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Open Chat
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => leaveMutation.mutate(chatroom.id)}
                          disabled={leaveMutation.isPending}
                          className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                          data-testid={`button-leave-${chatroom.id}`}
                        >
                          Leave
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => joinMutation.mutate(chatroom.id)}
                        disabled={joinMutation.isPending}
                        data-testid={`button-join-${chatroom.id}`}
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
                No chatrooms available for your locations yet. Chatrooms are automatically created as users join from different cities.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}