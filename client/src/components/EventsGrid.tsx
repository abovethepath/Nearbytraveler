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
  locationContext?: 'travel' | 'hometown';
  locationLabel?: string;
}

// Clean EventsGrid with professional dark theme styling
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
        console.log('🎯 EventsGrid: Fetching dual location events');
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
  const currentDisplayCount = displayCount || internalDisplayCount;
  const displayEvents = allEvents.slice(0, currentDisplayCount);

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
            {showLocation && location ? `Events in ${location}` : "Nearby Events"}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                <div className="h-32 bg-slate-700 rounded-lg mb-3"></div>
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-full mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (allEvents.length === 0) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {displayEvents.map((event: Event) => {
          const eventDate = formatEventDate(event.startDate || event.date || '');
          const startTime = formatTime(event.startTime);
          const endTime = formatTime(event.endTime);
          const eventTitle = event.name || event.title || 'Untitled Event';
          
          // Always at least 1 attendee (the creator)
          const attendeeCount = Math.max(event.attendeeCount || 0, 1);
          
          return (
            <Card key={event.id} className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
              <CardContent className="p-4">
                {/* Event Title */}
                <h3 className="text-white font-semibold text-lg mb-2 leading-tight">
                  {eventTitle}
                </h3>
                
                {/* Small category badge - only if needed */}
                {event.category && (
                  <Badge className="bg-slate-600 text-gray-300 text-xs px-2 py-1 mb-3">
                    {event.category}
                  </Badge>
                )}

                {/* Description */}
                {event.description && (
                  <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                    {event.description.length > 80 ? event.description.substring(0, 80) + '...' : event.description}
                  </p>
                )}

                {/* Date with prominent styling */}
                <div className="mb-3">
                  <Badge className="bg-purple-600 text-white font-semibold px-3 py-1">
                    {eventDate}
                  </Badge>
                  {/* Start and End Time */}
                  {startTime && (
                    <div className="text-gray-400 text-sm mt-1">
                      {startTime}
                      {endTime && startTime !== endTime && ` - ${endTime}`}
                    </div>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-start gap-2 mb-4">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{event.location}</span>
                </div>

                {/* Bottom section - properly contained */}
                <div className="flex items-center justify-between">
                  {/* Attendee count */}
                  <div className="flex items-center gap-1 text-gray-400">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {attendeeCount} {attendeeCount === 1 ? 'person' : 'people'} interested
                    </span>
                  </div>
                  
                  {/* Compact action button */}
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm"
                    onClick={() => setNavigationLocation(`/events/${event.id}`)}
                  >
                    View
                  </Button>
                </div>

                {/* Organizer - if space allows */}
                {event.organizer && (
                  <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-slate-700">
                    by {event.organizer}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Show More Button */}
      {allEvents.length > currentDisplayCount && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={onShowMore || (() => setInternalDisplayCount(internalDisplayCount + 6))}
            className="px-8 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            Load More ({allEvents.length - currentDisplayCount} remaining)
          </Button>
        </div>
      )}
    </>
  );
};

export default EventsGrid;