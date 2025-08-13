import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageCircle, Globe, Calendar, MapPin, Hash, UserPlus } from "lucide-react";
import { authStorage } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Chatroom, User, ChatroomMember } from "@shared/schema";

interface GroupChatRoomsProps {
  onJoinRoom: (roomId: number, roomName: string, roomType: string) => void;
}

export function GroupChatRooms({ onJoinRoom }: GroupChatRoomsProps) {
  const user = authStorage.getUser();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("joined");

  // Fetch user's joined rooms
  const { data: joinedRooms = [], isLoading: loadingJoined } = useQuery({
    queryKey: ['/api/chatrooms/my-rooms'],
    enabled: !!user?.id,
  });

  // Fetch available public rooms
  const { data: publicRooms = [], isLoading: loadingPublic } = useQuery({
    queryKey: ['/api/chatrooms/public'],
  });

  // Fetch rooms by category
  const { data: eventRooms = [] } = useQuery({
    queryKey: ['/api/chatrooms/events'],
  });

  const { data: cityRooms = [] } = useQuery({
    queryKey: ['/api/chatrooms/cities'],
  });

  // Join room mutation
  const joinRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      return await apiRequest(`/api/chatrooms/${roomId}/join`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms/my-rooms'] });
    }
  });

  // Leave room mutation
  const leaveRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      return await apiRequest(`/api/chatrooms/${roomId}/leave`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms/my-rooms'] });
    }
  });

  const handleJoinRoom = async (room: any) => {
    if (room.isMember) {
      onJoinRoom(room.id, room.name, room.type);
    } else {
      await joinRoomMutation.mutateAsync(room.id);
      onJoinRoom(room.id, room.name, room.type);
    }
  };

  const handleLeaveRoom = async (roomId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await leaveRoomMutation.mutateAsync(roomId);
  };

  const getRoomIcon = (type: string) => {
    switch (type) {
      case 'event': return Calendar;
      case 'city': return MapPin;
      case 'meetup': return Users;
      case 'general': return Hash;
      default: return MessageCircle;
    }
  };

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case 'event': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'city': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'meetup': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'general': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    }
  };

  const filterRooms = (rooms: any[]) => {
    return rooms.filter(room => 
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const RoomCard = ({ room, showLeaveButton = false }: { room: any, showLeaveButton?: boolean }) => {
    const Icon = getRoomIcon(room.type);
    
    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleJoinRoom(room)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <CardTitle className="text-sm font-medium line-clamp-1">
                {room.name}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getRoomTypeColor(room.type)}>
                {room.type}
              </Badge>
              {showLeaveButton && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => handleLeaveRoom(room.id, e)}
                  className="h-6 w-16 text-xs"
                >
                  Leave
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {room.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {room.description}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {room.memberCount || 0} members
              </span>
              {room.isPublic ? (
                <Globe className="w-3 h-3" />
              ) : (
                <span>Private</span>
              )}
            </div>
            {room.lastActivity && (
              <p className="text-xs text-gray-500">
                Last active: {new Date(room.lastActivity).toLocaleDateString('en-US', { 
                  year: 'numeric', // CRITICAL: Always shows 4-digit year (2025, not 25)
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Group Chat Rooms</h2>
        <Input
          placeholder="Search rooms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-3"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mx-4 mt-2">
          <TabsTrigger value="joined">My Rooms</TabsTrigger>
          <TabsTrigger value="public">Public</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="cities">Cities</TabsTrigger>
        </TabsList>

        <TabsContent value="joined" className="flex-1 p-4 overflow-y-auto">
          {loadingJoined ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : joinedRooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>You haven't joined any rooms yet</p>
              <p className="text-sm">Browse other tabs to find rooms to join</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filterRooms(joinedRooms).map((room) => (
                <RoomCard key={room.id} room={room} showLeaveButton={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="public" className="flex-1 p-4 overflow-y-auto">
          {loadingPublic ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {filterRooms(publicRooms).map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="events" className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-3">
            {filterRooms(eventRooms).map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cities" className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-3">
            {filterRooms(cityRooms).map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}