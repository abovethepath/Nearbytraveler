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
import ImageLoader from "./ImageLoader";
import { InstagramShare } from "./InstagramShare";

interface EventCardProps {
  event: Event;
  compact?: boolean;
  featured?: boolean;
}

export default function EventCard({ event, compact = false, featured = false }: EventCardProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isVisible, celebrationData, triggerCelebration, hideCelebration } = useConnectionCelebration();

  // Get current user
  const getCurrentUser = () => {
    const storedUser = localStorage.getItem('travelconnect_user');
    return storedUser ? JSON.parse(storedUser) : null;
  };
  
  const currentUser = getCurrentUser();

  // Join event mutation
  const joinEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      if (!currentUser?.id) throw new Error("User not authenticated");
      return await apiRequest("POST", `/api/events/${eventId}/join`, { 
        userId: currentUser.id 
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
      return eventDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
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
        className="pl-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        onClick={() => setLocation(`/events/${event.id}`)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-white mb-1 text-crisp text-base">{event.title}</h4>
            <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400 space-y-1 text-crisp">
              <span>
                <Calendar className="w-3 h-3 inline mr-1" />
                {formatEventDate(event.date)}
              </span>
              <span className="flex items-start">
                <MapPin className="w-3 h-3 inline mr-1 mt-0.5 flex-shrink-0" />
                <span className="break-words">
                  {event.venueName && <><strong>{event.venueName}</strong><br /></>}
                  {event.street && <>{event.street}<br /></>}
                  {event.city}{event.state && event.state !== event.city && `, ${event.state}`}{event.country && `, ${event.country}`}
                </span>
              </span>
            </div>
          </div>
          {event.imageUrl && (
            <ImageLoader
              src={event.imageUrl}
              alt={event.title}
              className="w-12 h-12 rounded-lg object-cover ml-3 flex-shrink-0"
              loading="lazy"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <article className="event-card rounded-2xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-xl hover:shadow-2xl overflow-hidden transition-all duration-300 cursor-pointer text-left"
               onClick={() => setLocation(`/events/${event.id}`)}>
        {/* Image */}
        {event.imageUrl && (
          <div className="relative">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-48 object-cover"
              loading="lazy"
            />

          </div>
        )}


        {/* Content */}
        <div className="p-4 md:p-5 space-y-3">
          <h3 className="text-gray-900 dark:text-white text-lg font-semibold leading-snug line-clamp-2">
            {event.title}
          </h3>

          {event.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-normal break-words [overflow-wrap:anywhere] line-clamp-2">
              {event.description}
            </p>
          )}

          {/* Meta — wraps on small screens */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="min-w-0 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Calendar className="h-4 w-4 shrink-0 text-travel-blue" />
              <span className="truncate break-words [overflow-wrap:anywhere]">{formatEventDate(event.date)}</span>
            </div>
            <div className="min-w-0 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <MapPin className="h-4 w-4 shrink-0 text-travel-blue" />
              <span className="truncate break-words [overflow-wrap:anywhere]">
                {event.venueName && `${event.venueName}, `}{event.street || event.location}{event.city && `, ${event.city}`}{event.state && event.state !== event.city && `, ${event.state}`}{event.country && `, ${event.country}`}
              </span>
            </div>
            <div className="min-w-0 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Users className="h-4 w-4 shrink-0" />
              <span className="truncate break-words [overflow-wrap:anywhere]">{(event as any).participantCount ?? 0} attending</span>
            </div>
          </div>


          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              variant="outline"
              className="flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/event-chat/${event.id}`);
              }}
            >
              Chat
            </Button>
            <Button 
              size="sm" 
              className="flex-shrink-0 text-white border-0"
              onClick={(e) => {
                e.stopPropagation();
                handleJoinEvent();
              }}
              disabled={joinEventMutation.isPending}
              style={{ 
                background: 'linear-gradient(to right, #3b82f6, #ea580c)',
                border: 'none',
                color: 'white'
              }}
            >
              {joinEventMutation.isPending ? "Joining..." : "Join"}
            </Button>
            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
              <InstagramShare event={event} />
            </div>
          </div>
        </div>
      </article>
    
      {/* Event Join Celebration Modal */}
      {celebrationData && (
        <ConnectionCelebration
          isVisible={isVisible}
          onComplete={hideCelebration}
          connectionType={celebrationData.type}
          userInfo={celebrationData.userInfo || { username: 'User' }}
        />
      )}
    </>
  );
}