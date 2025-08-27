import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";
import { parseISO, format } from "date-fns";

interface EventsGridProps {
  location?: string;
  limit?: number;
  showLocation?: boolean;
  className?: string;
  userId?: number;
  travelDestination?: string;
  useDualLocation?: boolean;
  events?: any[];
  displayCount?: number;
  onShowMore?: () => void;
}

interface Event {
  id: string;
  name: string;
  title?: string;
  description?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  location: string;
  category?: string;
  price?: string;
  attendeeCount?: number;
  capacity?: number;
  organizer?: string;
  imageUrl?: string;
  locationContext?: 'travel' | 'hometown';
  locationLabel?: string;
}

// Business Card Style EventsGrid with Large Photos
const EventsGrid = ({ 
  events = [], 
  displayCount = 6, 
  onShowMore,
  location,
  limit = 6,
  showLocation = true,
  className = "",
  userId,
  travelDestination,
  useDualLocation = false
}: EventsGridProps) => {
  const [, setNavigationLocation] = useLocation();
  const [internalDisplayCount, setInternalDisplayCount] = useState(limit);
  
  // Use provided events or fetch them
  const { data: fetchedEvents = [], isLoading } = useQuery({
    queryKey: useDualLocation 
      ? [`/api/events/nearby-dual`, userId, travelDestination]
      : ['/api/events/nearby', location],
    queryFn: async () => {
      if (useDualLocation && userId) {
        const url = `/api/events/nearby-dual?userId=${userId}&travelDestination=${encodeURIComponent(travelDestination || '')}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch dual location events');
        return response.json();
      } else {
        console.log('🎯 EventsGrid: Fetching single location events');
        const url = location 
          ? `/api/events?city=${encodeURIComponent(location)}`
          : '/api/events/nearby';
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch events');
        return response.json();
      }
    },
    enabled: events.length === 0 && (!useDualLocation || !!userId),
    staleTime: 5 * 60 * 1000,
  });

  const allEvents = events.length > 0 ? events : fetchedEvents;
  
  // SORT: User-created events ALWAYS appear first, then external events
  const sortedEvents = [...allEvents].sort((a, b) => {
    // User-created events (no eventUrl or empty eventUrl) come first
    const aIsUserCreated = !a.eventUrl || a.eventUrl === '';
    const bIsUserCreated = !b.eventUrl || b.eventUrl === '';
    
    if (aIsUserCreated && !bIsUserCreated) return -1; // a comes first
    if (!aIsUserCreated && bIsUserCreated) return 1;  // b comes first
    
    // If both are same type, maintain original order
    return 0;
  });
  
  // Always use internal display count for load more functionality
  const currentDisplayCount = internalDisplayCount;
  const displayEvents = sortedEvents.slice(0, currentDisplayCount);

  const formatEventDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "MMM d");
    } catch {
      return "TBD";
    }
  };

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return null;
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  if (isLoading && events.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Events Near You
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                <div className="h-40 bg-slate-700"></div>
                <div className="p-4">
                  <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded w-full mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sortedEvents.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="col-span-full bg-slate-800 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-400 text-center">No events found near you.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Events Near You
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {displayEvents.map((event: Event) => {
          const eventDate = formatEventDate(event.startDate || event.date || '');
          const startTime = formatTime(event.startTime);
          const endTime = formatTime(event.endTime);
          const eventTitle = event.name || event.title || 'Untitled Event';
          
          // Always at least 1 attendee (the creator)
          const attendeeCount = Math.max(event.attendeeCount || 0, 1);
          
          return (
            <Card key={event.id} className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors overflow-hidden">
              {/* Large Event Photo - Like Business Cards */}
              <div className="relative h-40 bg-slate-700 overflow-hidden">
                {event.imageUrl ? (
                  <img 
                    src={event.imageUrl} 
                    alt={eventTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // Default placeholder with category-based gradient
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-60" />
                      <p className="text-sm opacity-80">Event Image</p>
                    </div>
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                {/* Event Title - Prominent like business name */}
                <h3 className="text-white font-bold text-lg mb-2 leading-tight">
                  {eventTitle}
                </h3>
                

                {/* Description - Like business description */}
                {event.description && (
                  <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                    {event.description.length > 70 ? event.description.substring(0, 70) + '...' : event.description}
                  </p>
                )}

                {/* Deal-style Time Display */}
                {startTime && (
                  <div className="bg-slate-700 rounded-lg p-2 mb-3">
                    <div className="text-orange-400 text-xs font-medium mb-1">Event Time</div>
                    <div className="text-white font-bold text-sm">
                      {startTime}
                      {endTime && startTime !== endTime && ` - ${endTime}`}
                    </div>
                  </div>
                )}

                {/* Location - Like business location */}
                <div className="flex items-start gap-2 text-gray-300 text-sm mb-3">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{event.location}</span>
                </div>

                {/* Attendee count - Like business contact info */}
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                  <Users className="h-4 w-4" />
                  <span>{attendeeCount} interested</span>
                </div>

                {/* Action Button - Like business "View Business" */}
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2"
                  onClick={() => {
                    // Check if it's an external event (has eventUrl)
                    if (event.eventUrl && event.eventUrl.startsWith('http')) {
                      // Open external event directly
                      window.open(event.eventUrl, '_blank');
                    } else {
                      // Navigate to internal event details
                      setNavigationLocation(`/events/${event.id}`);
                    }
                  }}
                >
                  {event.eventUrl && event.eventUrl.startsWith('http') ? 'View on External Site' : 'View Event'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Show More Button */}
      {sortedEvents.length > currentDisplayCount && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={onShowMore || (() => setInternalDisplayCount(internalDisplayCount + 6))}
            className="px-8 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            Load More ({sortedEvents.length - currentDisplayCount} remaining)
          </Button>
        </div>
      )}
    </>
  );
};

export default EventsGrid;