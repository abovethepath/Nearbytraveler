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
            <h4 className="font-medium text-gray-900 dark:text-white mb-1 text-crisp text-base md:text-lg">{event.title}</h4>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-2 text-crisp leading-relaxed">{event.description}</p>
            <div className="flex items-center text-xs md:text-sm text-gray-500 dark:text-gray-400 space-x-4 text-crisp">
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
            <ImageLoader
              src={event.imageUrl}
              alt={event.title}
              className="w-12 h-12 rounded-lg object-cover ml-3"
              loading="lazy"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
           onClick={() => setLocation(`/events/${event.id}`)}>
        {/* Image + category - Mobile-first approach */}
        {event.imageUrl && (
          <div className="relative">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full aspect-[16/9] object-cover"
              loading="lazy"
            />
            {/* Featured badge: hidden on mobile, overlay on md+ */}
            <div className="hidden md:block">
              {featured && (
                <span className="md:absolute md:top-3 md:left-3 inline-block rounded-full px-3 py-1 text-xs font-semibold bg-travel-blue text-white">
                  Featured
                </span>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 md:p-5 text-left">
          {/* Mobile featured badge (not overlay) */}
          <div className="md:hidden mb-2">
            {featured && (
              <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold bg-travel-blue text-white">
                Featured
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 mb-2">
            {event.title}
          </h3>

          {event.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3 mb-3">
              {event.description}
            </p>
          )}

          {/* Meta row(s) — wrap on small screens to avoid overlap */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center mb-3">
            <div className="min-w-0 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Calendar className="h-4 w-4 shrink-0 text-travel-blue" />
              <span className="truncate">{formatEventDate(event.date)}</span>
            </div>
            <div className="min-w-0 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <MapPin className="h-4 w-4 shrink-0 text-travel-blue" />
              <span className="truncate">{event.location}</span>
            </div>
            <div className="min-w-0 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Users className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {(event as any).participantCount ?? 0} attending
              </span>
            </div>
          </div>

          {/* Event detail tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {event.costEstimate && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                💰 {event.costEstimate}
              </span>
            )}
            
            {event.isSpontaneous && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                ⚡ Last Minute
              </span>
            )}
            
            {event.isRecurring && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                🔄 Recurring
              </span>
            )}
            
            {event.urgency === 'urgent' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                🚨 Urgent
              </span>
            )}
            
            {event.maxParticipants && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                👥 Max {event.maxParticipants}
              </span>
            )}

            {/* Show specific event tags (not category) - filter out redundant tags */}
            {event.tags && event.tags.length > 0 && event.tags
              .filter((tag: string) => {
                if (!tag || typeof tag !== 'string') return false;
                
                // Filter out tags that are redundant with the main category
                const categoryLower = (event.category || '').toLowerCase();
                const tagLower = tag.toLowerCase().trim();
                
                // Skip empty tags
                if (!tagLower) return false;
                
                // Remove exact matches or substring matches with category keywords
                const categoryWords = categoryLower.split(/[,&\s]+/).filter(word => word.length > 2);
                const tagWords = tagLower.split(/[\s]+/);
                
                // Check if any tag word matches any category word
                for (const tagWord of tagWords) {
                  for (const categoryWord of categoryWords) {
                    if (tagWord.includes(categoryWord) || categoryWord.includes(tagWord)) {
                      return false; // Filter out redundant tag
                    }
                  }
                }
                
                return true; // Keep non-redundant tag
              })
              .slice(0, 3)
              .map((tag: string, index: number) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                >
                  {tag}
                </span>
              ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 sm:items-center sm:justify-between">
            <div className="flex gap-2 flex-1 sm:flex-none">
              <Button 
                size="sm" 
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation(`/event-chat/${event.id}`);
                }}
              >
                Chat
              </Button>
              <Button 
                size="sm" 
                className="flex-1 sm:flex-none text-white border-0"
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
            </div>
          </div>
        </div>
      </div>
    
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