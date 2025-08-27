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
        return { text: "Today", className: "bg-red-100 text-red-800" };
      } else if (isTomorrow(date)) {
        return { text: "Tomorrow", className: "bg-orange-100 text-orange-800" };
      } else if (isThisWeek(date)) {
        return { text: format(date, "EEE"), className: "bg-blue-100 text-blue-800" };
      } else {
        return { text: format(date, "MMM d"), className: "bg-gray-100 text-gray-800" };
      }
    } catch {
      return { text: "TBD", className: "bg-gray-100 text-gray-600" };
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
      'music': 'bg-purple-100 text-purple-800',
      'food': 'bg-green-100 text-green-800',
      'sports': 'bg-blue-100 text-blue-800',
      'arts': 'bg-pink-100 text-pink-800',
      'business': 'bg-gray-100 text-gray-800',
      'technology': 'bg-indigo-100 text-indigo-800',
      'social': 'bg-yellow-100 text-yellow-800',
      'nightlife': 'bg-red-100 text-red-800',
      'outdoor': 'bg-emerald-100 text-emerald-800',
    };
    return colors[category?.toLowerCase() || ''] || 'bg-gray-100 text-gray-600';
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
            <Card key={event.id} className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                    {eventTitle}
                  </CardTitle>
                  <Badge className={dateInfo.className} variant="secondary">
                    {dateInfo.text}
                  </Badge>
                </div>
                
                {/* Only show event category - NO LOCATION TAGS */}
                {event.category && (
                  <Badge className={getEventTypeColor(event.category)} variant="secondary">
                    {event.category}
                  </Badge>
                )}
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Description */}
                {event.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {event.description.length > 80 ? event.description.substring(0, 80) + '...' : event.description}
                  </p>
                )}

                {/* Location - just the actual location */}
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{event.location}</span>
                </div>

                {/* Time */}
                {(startTime || endTime) && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {startTime}
                      {endTime && startTime !== endTime && ` - ${endTime}`}
                    </span>
                  </div>
                )}

                {/* Price */}
                {event.price && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-green-600">
                      {event.price}
                    </span>
                  </div>
                )}

                {/* Capacity/Attendance */}
                {(event.attendeeCount !== undefined || event.capacity) && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {event.attendeeCount || 0}
                      {event.capacity && ` / ${event.capacity}`} 
                      {event.capacity ? ' spots' : ' interested'}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setNavigationLocation(`/events/${event.id}`)}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Join
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setNavigationLocation(`/events/${event.id}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                </div>

                {/* Organizer */}
                {event.organizer && (
                  <div className="text-xs text-gray-500 pt-1 border-t">
                    Organized by {event.organizer}
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
            className="px-8"
          >
            Show More Events ({allEvents.length - currentDisplayCount} more)
          </Button>
        </div>
      )}
    </div>
  );
};

export default EventsGrid;