import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
interface CityChatlroomsWidgetProps {
  city: string;
  state?: string;
  country: string;
}

export function CityChatlroomsWidget({ city, state, country }: CityChatlroomsWidgetProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  // Removed authentication requirement - chatrooms are now publicly accessible

  // Fetch chatrooms for this city with forced refresh
  const { data: chatrooms = [], isLoading } = useQuery({
    queryKey: ['/api/chatrooms', city, state, country], // Stable cache key
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('city', city);
      if (state) params.append('state', state);
      if (country) params.append('country', country);
      
      const response = await fetch(`/api/chatrooms?${params}`);
      if (!response.ok) throw new Error('Failed to fetch chatrooms');
      const data = await response.json();
      return data;
    },
    enabled: !!city,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000 // 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            City Chatrooms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chatrooms.length) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            City Chatrooms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No chatrooms available for {city} yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Debug logging
  console.log('Chatrooms data received:', chatrooms);
  chatrooms.forEach((chatroom: any) => {
    console.log(`Chatroom ${chatroom.name}: memberCount =`, chatroom.memberCount, 'type:', typeof chatroom.memberCount);
  });

  // Show the first 2 chatrooms, prioritizing popular ones
  const displayedChatrooms = chatrooms
    .sort((a: any, b: any) => (b.memberCount || 0) - (a.memberCount || 0))
    .slice(0, 2);

  const handleJoinChatroom = (chatroomId: number, chatroomName: string) => {
    // Navigate directly to the chatroom
    setLocation(`/chatroom/${chatroomId}`);
  };

  const viewAllChatrooms = () => {
    // Navigate to city-specific chatrooms page  
    setLocation(`/city-chatrooms/${encodeURIComponent(city)}`);
  };

  return (
    <Card 
      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow opacity-100" 
      style={{ 
        backgroundColor: document.documentElement.classList.contains('dark') ? 'rgb(31, 41, 55)' : 'rgb(255, 255, 255)', 
        opacity: '1',
        '--tw-bg-opacity': '1'
      }} 
      onClick={viewAllChatrooms}
    >
      <CardHeader>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          {chatrooms.length} chatrooms available
        </div>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-500" />
          City Chatrooms
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedChatrooms.map((chatroom: any) => (
          <div 
            key={chatroom.id}
            className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
          >
            <div className="space-y-2">
              {/* Full chatroom title on its own line */}
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
                  {chatroom.name}
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinChatroom(chatroom.id, chatroom.name);
                  }}
                  className="text-xs px-3 py-1 h-auto ml-2 flex-shrink-0"
                >
                  Open
                </Button>
              </div>
              
              {/* Status badges and member count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={chatroom.isPublic ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {chatroom.isPublic ? "Public" : "Private"}
                  </Badge>
                  {chatroom.userIsMember && (
                    <Badge variant="outline" className="text-xs">
                      Joined
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Users className="h-3 w-3" />
                  <span>{typeof chatroom.memberCount === 'number' ? chatroom.memberCount : parseInt(chatroom.memberCount) || 0} members</span>
                </div>
              </div>
              
              {/* Description if available */}
              {chatroom.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {chatroom.description}
                </p>
              )}
            </div>
          </div>
        ))}
        
        {chatrooms.length > 2 && (
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              viewAllChatrooms();
            }}
            className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            View All Chatrooms in {city}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}