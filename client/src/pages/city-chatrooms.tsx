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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-800 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading chatrooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">💬 City Chatrooms</h1>
          <p className="text-white/80">Connect with locals and travelers in your city</p>
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-3 bg-black/20 rounded text-white/60 text-sm">
          <p>Found {chatrooms.length} chatrooms</p>
          <p>User: {currentUser?.username || 'Not logged in'}</p>
        </div>

        {/* Chatrooms Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {chatrooms.map((chatroom) => (
            <Card key={chatroom.id} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg mb-2">
                      {chatroom.name}
                    </CardTitle>
                    <div className="flex items-center text-white/60 text-sm mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {chatroom.city}, {chatroom.state}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
                    <Users className="w-3 h-3 mr-1" />
                    {chatroom.memberCount || 0}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-white/80 text-sm mb-4 line-clamp-3">
                  {chatroom.description}
                </p>
                
                {/* Tags */}
                {chatroom.tags && chatroom.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {chatroom.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-white/20 text-white/60">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Action Button */}
                <div className="flex gap-2">
                  {chatroom.userIsMember ? (
                    <>
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Joined
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => leaveMutation.mutate(chatroom.id)}
                        disabled={leaveMutation.isPending}
                        className="border-red-400/50 text-red-300 hover:bg-red-500/20"
                      >
                        Leave
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => joinMutation.mutate(chatroom.id)}
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

        {chatrooms.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Chatrooms Found</h3>
            <p className="text-white/60">No chatrooms available for your locations yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}