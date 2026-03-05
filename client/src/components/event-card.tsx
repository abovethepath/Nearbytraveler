import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Instagram, Check, Phone } from "lucide-react";
import { useLocation } from "wouter";
import type { Event } from "@shared/schema";
import ConnectionCelebration from "./connection-celebration";
import { useConnectionCelebration } from "@/hooks/useConnectionCelebration";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient, getApiBaseUrl } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ImageLoader from "./ImageLoader";
import { InstagramShare } from "./InstagramShare";

function normalizeLocationString(raw: string): string {
  const tokens = String(raw || "")
    .split(/[,\\n]/g)
    .map((t) => t.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokens) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out.join(", ");
}

function buildEventLocationDisplay(event: Event): string {
  const rawParts = [
    event.venueName,
    event.street || event.location,
    event.city,
    event.state && event.state !== event.city ? event.state : null,
    event.country,
  ].filter(Boolean) as string[];

  // De-duplicate city/state/country even if they appear inside other fields.
  return normalizeLocationString(rawParts.join(", "));
}

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
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  };
  
  const currentUser = getCurrentUser();
  
  // Check if user is the event organizer
  const isOrganizer = currentUser?.id === event.organizerId;
  
  // Fetch participant status for current user
  const { data: participantStatus } = useQuery({
    queryKey: ['/api/events', event.id, 'participants', 'user-status', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      const response = await fetch(`${getApiBaseUrl()}/api/events/${event.id}/participants`, {
        credentials: 'include',
      });
      if (!response.ok) return null;
      const participants = await response.json();
      const userParticipant = participants.find((p: any) => p.userId === currentUser.id);
      return userParticipant?.status || null;
    },
    enabled: !!currentUser?.id && !isOrganizer,
    staleTime: 60000, // Cache for 1 minute
  });
  
  // User is already attending if they have 'going' or 'interested' status
  const isAlreadyAttending = participantStatus === 'going' || participantStatus === 'interested';
  const isGoing = participantStatus === 'going';
  const isInterested = participantStatus === 'interested';

  // Join event mutation (with status: 'interested' or 'going')
  const joinEventMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: number; status: 'interested' | 'going' }) => {
      if (!currentUser?.id) throw new Error("User not authenticated");
      return await apiRequest("POST", `/api/events/${eventId}/join`, { 
        userId: currentUser.id,
        status
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.status === 'going' ? "Going to Event!" : "Marked as Interested!",
        description: variables.status === 'going' 
          ? "You've successfully joined this event. Get ready for an amazing experience!" 
          : "You're interested in this event. You can change to 'Going' anytime!",
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

  const handleJoinEvent = (status: 'interested' | 'going') => {
    joinEventMutation.mutate({ eventId: event.id, status });
  };

  const formatEventDate = (date: Date | string) => {
    const eventDate = new Date(date);
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const tz = (event as any)?.timeZone as string | undefined;
    const timeOpts: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      ...(tz ? { timeZone: tz, timeZoneName: 'short' as const } : {}),
    };
    const dateTimeOpts: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      ...timeOpts,
    };

    if (diffDays === 0) {
      return `Today, ${eventDate.toLocaleTimeString([], timeOpts)}`;
    } else if (diffDays === 1) {
      return `Tomorrow, ${eventDate.toLocaleTimeString([], timeOpts)}`;
    } else if (diffDays < 7) {
      return eventDate.toLocaleDateString([], dateTimeOpts);
    } else {
      return tz
        ? eventDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', timeZone: tz })
        : eventDate.toLocaleDateString();
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

  // Build full address for maps link and display
  const fullAddress = buildEventLocationDisplay(event);
  const mapsUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null;
  const eventPhone = (event as { phone?: string }).phone;
  const telUrl = eventPhone ? `tel:${eventPhone.replace(/\s/g, "")}` : null;

  if (compact) {
    return (
      <div 
        className="pl-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        onClick={() => setLocation(`/events/${event.id}`)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-white mb-1 text-crisp text-base line-clamp-2 break-normal">
              {event.title}
            </h4>
            <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400 space-y-1 text-crisp">
              <span className="flex items-center gap-1 min-w-0">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis">
                  {formatEventDate(event.date)}
                </span>
              </span>
              <span className="flex items-center gap-1 min-w-0">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="min-w-0 truncate whitespace-nowrap overflow-hidden text-ellipsis underline underline-offset-1 hover:text-travel-blue dark:hover:text-blue-400"
                  >
                    {fullAddress}
                  </a>
                ) : (
                  <span className="min-w-0 truncate whitespace-nowrap overflow-hidden text-ellipsis">
                    {fullAddress}
                  </span>
                )}
              </span>
              {eventPhone && telUrl && (
                <span className="flex items-center gap-1 min-w-0">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <a
                    href={telUrl}
                    onClick={(e) => e.stopPropagation()}
                    className="min-w-0 truncate whitespace-nowrap overflow-hidden text-ellipsis underline underline-offset-1 hover:text-travel-blue dark:hover:text-blue-400"
                  >
                    {eventPhone}
                  </a>
                </span>
              )}
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
          <h3 className="text-gray-900 dark:text-white text-lg font-semibold leading-snug line-clamp-2 break-normal">
            {event.title}
          </h3>

          {event.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-normal break-words [overflow-wrap:anywhere] line-clamp-2">
              {event.description}
            </p>
          )}

          {event.requirements && (
            <p className="text-sm text-travel-blue dark:text-blue-400 font-medium leading-relaxed whitespace-normal break-words [overflow-wrap:anywhere]">
              📋 {event.requirements}
            </p>
          )}

          {/* Meta — single-line rows (no wrapping/overlap) */}
          <div className="flex flex-col gap-2">
            <div className="min-w-0 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Calendar className="h-4 w-4 shrink-0 text-travel-blue" />
              <span className="min-w-0 truncate whitespace-nowrap overflow-hidden text-ellipsis">
                {formatEventDate(event.date)}
              </span>
            </div>
            <div className="min-w-0 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <MapPin className="h-4 w-4 shrink-0 text-travel-blue" />
              {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="min-w-0 truncate whitespace-nowrap overflow-hidden text-ellipsis underline underline-offset-1 hover:text-travel-blue dark:hover:text-blue-400 text-left"
                >
                  {fullAddress}
                </a>
              ) : (
                <span className="min-w-0 truncate whitespace-nowrap overflow-hidden text-ellipsis">
                  {fullAddress}
                </span>
              )}
            </div>
            {eventPhone && telUrl && (
              <div className="min-w-0 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Phone className="h-4 w-4 shrink-0 text-travel-blue" />
                <a
                  href={telUrl}
                  onClick={(e) => e.stopPropagation()}
                  className="min-w-0 truncate whitespace-nowrap overflow-hidden text-ellipsis underline underline-offset-1 hover:text-travel-blue dark:hover:text-blue-400"
                >
                  {eventPhone}
                </a>
              </div>
            )}
            <div className="min-w-0 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Users className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate whitespace-nowrap overflow-hidden text-ellipsis">
                {(event as any).participantCount ?? 0} attending
              </span>
            </div>
          </div>


          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button 
              size="sm" 
              variant="outline"
              className="flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/event-chat/${event.id}`);
              }}
              data-testid="button-chat"
            >
              Chat
            </Button>
            
            {/* Show organizer badge if user is the organizer */}
            {isOrganizer ? (
              <Badge className="flex items-center gap-1 bg-gradient-to-r from-[#2563EB] to-[#E85D2F] text-white px-3 py-1">
                <Users className="h-3 w-3" />
                Organizer
              </Badge>
            ) : isGoing ? (
              /* Show "Going" badge if already going */
              <Badge className="flex items-center gap-1 bg-[#E85D2F] text-white px-3 py-1">
                <Check className="h-3 w-3" />
                Going
              </Badge>
            ) : isInterested ? (
              /* Show "Interested" badge and upgrade to Going button */
              <>
                <Badge className="flex items-center gap-1 bg-[#2563EB] text-white px-3 py-1">
                  <Check className="h-3 w-3" />
                  Interested
                </Badge>
                <Button 
                  size="sm" 
                  className="flex-1 min-w-[60px] text-white border-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinEvent('going');
                  }}
                  disabled={joinEventMutation.isPending}
                  style={{ 
                    background: 'linear-gradient(to right, #2563EB, #E85D2F)',
                    border: 'none',
                    color: 'white'
                  }}
                  data-testid="button-going"
                >
                  {joinEventMutation.isPending ? "..." : "I'm Going!"}
                </Button>
              </>
            ) : (
              /* Show both buttons for users not yet attending */
              <>
                <Button 
                  size="sm" 
                  className="flex-1 min-w-[60px] text-white border-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinEvent('going');
                  }}
                  disabled={joinEventMutation.isPending}
                  style={{ 
                    background: 'linear-gradient(to right, #2563EB, #E85D2F)',
                    border: 'none',
                    color: 'white'
                  }}
                  data-testid="button-going"
                >
                  {joinEventMutation.isPending ? "..." : "Join?"}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 min-w-[80px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinEvent('interested');
                  }}
                  disabled={joinEventMutation.isPending}
                  data-testid="button-interested"
                >
                  {joinEventMutation.isPending ? "..." : "Interested"}
                </Button>
              </>
            )}
            
            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
              <InstagramShare 
                event={event} 
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 px-2"
                    data-testid="button-share-instagram"
                  >
                    <Instagram className="h-4 w-4" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                }
              />
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