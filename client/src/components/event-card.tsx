import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users } from "lucide-react";
import { useLocation } from "wouter";
import type { Event } from "@shared/schema";
import ConnectionCelebration from "./connection-celebration";
import { useConnectionCelebration } from "@/hooks/useConnectionCelebration";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EventCardProps {
  event: Event;
  compact?: boolean;
  featured?: boolean;
}

export default function EventCard({ event, compact = false, featured = false }: EventCardProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isVisible, celebrationData, triggerCelebration, hideCelebration } = useConnectionCelebration();

  // Join event mutation
  const joinEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const currentUserId = 1; // Get from auth context
      return await apiRequest("POST", `/api/events/${eventId}/join`, { 
        userId: currentUserId 
      });
    },
    onSuccess: () => {
      toast({
        title: "Event Joined!",
        description: "You've successfully joined this event. Get ready for an amazing experience!",
      });
      
      // Invalidate events cache to refresh participant counts
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', event.id] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${event.id}/participants`] });
      
      // Trigger celebration animation
      triggerCelebration({
        type: 'event_join',
        userInfo: {
          username: 'You',
          destination: event.location
        }
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Join Event",
        description: error.message || "Unable to join event at this time",
        variant: "destructive",
      });
    },
  });

  const handleJoinEvent = () => {
    joinEventMutation.mutate(event.id);
  };

  const formatEventDate = (date: Date | string) => {
    const eventDate = new Date(date);
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today, ${eventDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Tomorrow, ${eventDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return eventDate.toLocaleDateString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
    } else {
      return eventDate.toLocaleDateString();
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "food":
        return "border-sunset-orange";
      case "adventure":
        return "border-adventure-green";
      case "culture":
        return "border-travel-blue";
      case "social":
        return "border-orange-500";
      default:
        return "border-gray-300";
    }
  };

  if (compact) {
    return (
      <div 
        className={`border-l-4 ${getCategoryColor(event.category)} pl-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer`}
        onClick={() => setLocation(`/events/${event.id}`)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">{event.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{event.description}</p>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
              <span>
                <Calendar className="w-3 h-3 inline mr-1" />
                {formatEventDate(event.date)}
              </span>
              <span>
                <MapPin className="w-3 h-3 inline mr-1" />
                {event.location}
              </span>
            </div>
          </div>
          {event.imageUrl && (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-12 h-12 rounded-lg object-cover ml-3"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Card 
        className={`hover:shadow-lg transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer ${featured ? 'ring-2 ring-travel-blue' : ''}`}
        onClick={() => setLocation(`/events/${event.id}`)}
      >
      {event.imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          {featured && (
            <Badge className="absolute top-3 left-3 bg-travel-blue text-white">
              Featured
            </Badge>
          )}
          <Badge className="absolute top-3 right-3 bg-white text-gray-900">
            {event.category}
          </Badge>
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{event.title}</h3>
        </div>
        
        {event.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{event.description}</p>
        )}
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="w-4 h-4 mr-2 text-travel-blue" />
            {formatEventDate(event.date)}
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <MapPin className="w-4 h-4 mr-2 text-travel-blue" />
            {event.location}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Users className="w-4 h-4 mr-1" />
            <span>{event.participantCount || 1} attending</span>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/event-chat/${event.id}`);
              }}
              className="text-sm px-3 py-1"
            >
              Open Chat
            </Button>
            <Button 
              size="sm" 
              className="text-white btn-bounce border-0"
              onClick={(e) => {
                e.stopPropagation();
                handleJoinEvent();
              }}
              disabled={joinEventMutation.isPending}
              style={{ 
                background: 'linear-gradient(to right, #3b82f6, #ea580c) !important',
                border: 'none !important',
                color: 'white !important'
              }}
            >
              {joinEventMutation.isPending ? "Joining..." : "Join Event"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    
      {/* Event Join Celebration Modal */}
      {celebrationData && (
        <ConnectionCelebration
          isVisible={isVisible}
          onComplete={hideCelebration}
          connectionType={celebrationData.type}
          userInfo={celebrationData.userInfo}
        />
      )}
    </>
  );
}
