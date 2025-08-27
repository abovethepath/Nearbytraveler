import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, DollarSign, ExternalLink } from "lucide-react";
import { parseISO, isToday, isTomorrow, isThisWeek, format } from "date-fns";

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

// Clean EventsGrid - NO MORE UGLY LOCATION TAGS
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
      
      if (isToday(date)) {
        return { text: "Today", className: "bg-red-500 text-white" };
      } else if (isTomorrow(date)) {
        return { text: "Tomorrow", className: "bg-orange-500 text-white" };
      } else if (isThisWeek(date)) {
        return { text: format(date, "EEE"), className: "bg-blue-500 text-white" };
      } else {
        return { text: format(date, "MMM d"), className: "bg-gray-600 text-white" };
      }
    } catch {
      return { text: "TBD", className: "bg-gray-500 text-white" };
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

  const getEventTypeColor = (category: string | undefined) => {
    const colors: Record<string, string> = {
      'music': 'bg-purple-500 text-white',
      'food': 'bg-green-500 text-white',
      'sports': 'bg-blue-500 text-white',
      'arts': 'bg-pink-500 text-white',
      'business': 'bg-gray-700 text-white',
      'technology': 'bg-indigo-500 text-white',
      'social': 'bg-yellow-500 text-white',
      'nightlife': 'bg-red-500 text-white',
      'outdoor': 'bg-emerald-500 text-white',
      'community': 'bg-teal-500 text-white',
      'dining': 'bg-orange-500 text-white',
    };
    return colors[category?.toLowerCase() || ''] || 'bg-gray-600 text-white';
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
              <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-4">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (allEvents.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {showLocation && location ? `Events in ${location}` : "Nearby Events"}
          </h2>
        </div>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border">
          <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No upcoming events found
          </h3>
          <p className="text-gray-500 dark:text-gray-500 mb-4">
            {location ? `No events scheduled in ${location}` : "No events in your area"}
          </p>
          <Button
            onClick={() => setNavigationLocation('/events/create')}
            className="bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600"
          >
            Create Event
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {displayEvents.map((event: Event) => {
          const eventDate = event.startDate || event.date || '';
          const dateInfo = formatEventDate(eventDate);
          const startTime = formatTime(event.startTime);
          const endTime = formatTime(event.endTime);
          const eventTitle = event.name || event.title || 'Untitled Event';
          
          return (
            <Card key={event.id} className="bg-slate-800 text-white hover:bg-slate-700 transition-all duration-200 border-slate-700 group">
              <CardContent className="p-4">
                {/* Header with title and date - better layout */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-3">
                    <h3 className="text-lg font-semibold text-white leading-tight group-hover:text-blue-300 transition-colors">
                      {eventTitle}
                    </h3>
                  </div>
                  <Badge className={`${dateInfo.className} text-xs font-medium flex-shrink-0`}>
                    {dateInfo.text}
                  </Badge>
                </div>
                
                {/* Category badge */}
                {event.category && (
                  <Badge className={`${getEventTypeColor(event.category)} text-xs mb-3`}>
                    {event.category}
                  </Badge>
                )}

                {/* Description */}
                {event.description && (
                  <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                    {event.description.length > 80 ? event.description.substring(0, 80) + '...' : event.description}
                  </p>
                )}

                {/* Location */}
                <div className="flex items-center gap-2 mb-2 text-gray-300">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{event.location}</span>
                </div>

                {/* Time */}
                {(startTime || endTime) && (
                  <div className="flex items-center gap-2 mb-3 text-gray-300">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      {startTime}
                      {endTime && startTime !== endTime && ` - ${endTime}`}
                    </span>
                  </div>
                )}

                {/* Bottom section: Attendees count and single action button */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                  {/* Attendee count */}
                  <div className="flex items-center gap-1 text-gray-400">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {event.attendeeCount || 0} interested
                    </span>
                  </div>
                  
                  {/* Single action button */}
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setNavigationLocation(`/events/${event.id}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </div>

                {/* Organizer info */}
                {event.organizer && (
                  <div className="text-xs text-gray-400 mt-2">
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
            Show More Events ({allEvents.length - currentDisplayCount} more)
          </Button>
        </div>
      )}
    </div>
  );
};

export default EventsGrid;