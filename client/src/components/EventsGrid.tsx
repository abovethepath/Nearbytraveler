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
        return { text: format(date, "MMM d"), className: "bg-purple-500 text-white" };
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
      'music': 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      'food': 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      'sports': 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
      'arts': 'bg-gradient-to-r from-pink-500 to-rose-500 text-white',
      'business': 'bg-gradient-to-r from-gray-600 to-gray-700 text-white',
      'technology': 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white',
      'social': 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
      'nightlife': 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
      'outdoor': 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
      'community': 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white',
      'dining': 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
    };
    return colors[category?.toLowerCase() || ''] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="col-span-full bg-white shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">No events found near you.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {displayEvents.map((event: Event) => {
          const eventDate = event.startDate || event.date || '';
          const dateInfo = formatEventDate(eventDate);
          const startTime = formatTime(event.startTime);
          const endTime = formatTime(event.endTime);
          const eventTitle = event.name || event.title || 'Untitled Event';
          
          // Always at least 1 attendee (the creator)
          const attendeeCount = Math.max(event.attendeeCount || 0, 1);
          
          return (
            <Card key={event.id} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden group">
              {/* Colorful top stripe based on category */}
              <div className={`h-2 ${getEventTypeColor(event.category)}`}></div>
              
              <CardContent className="p-6">
                {/* Event Title - Full width, no interference */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                  {eventTitle}
                </h3>
                
                {/* Category Badge */}
                {event.category && (
                  <Badge className={`${getEventTypeColor(event.category)} text-sm font-medium mb-4`}>
                    {event.category}
                  </Badge>
                )}

                {/* Description */}
                {event.description && (
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {event.description.length > 100 ? event.description.substring(0, 100) + '...' : event.description}
                  </p>
                )}

                {/* Date and Time - Together, not cutting off title */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <Badge className={`${dateInfo.className} text-sm font-medium`}>
                      {dateInfo.text}
                    </Badge>
                    {startTime && (
                      <span className="text-gray-600 font-medium">
                        at {startTime}
                        {endTime && startTime !== endTime && ` - ${endTime}`}
                      </span>
                    )}
                  </div>

                  {/* Full Address */}
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{event.location}</span>
                  </div>
                </div>

                {/* Price if available */}
                {event.price && (
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <span className="text-lg font-bold text-green-600">{event.price}</span>
                  </div>
                )}

                {/* Bottom section */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  {/* Attendee count - ALWAYS at least 1 */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-blue-600">
                      <Users className="h-5 w-5" />
                      <span className="font-semibold">{attendeeCount}</span>
                    </div>
                    <span className="text-gray-500">
                      {attendeeCount === 1 ? 'person interested' : 'people interested'}
                    </span>
                  </div>
                  
                  {/* Action button */}
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200"
                    onClick={() => setNavigationLocation(`/events/${event.id}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>

                {/* Organizer */}
                {event.organizer && (
                  <div className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
                    <span className="font-medium">Organized by:</span> {event.organizer}
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
            className="px-8 py-3 border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white font-medium rounded-lg transition-all duration-200"
          >
            Show More Events ({allEvents.length - currentDisplayCount} more)
          </Button>
        </div>
      )}
    </>
  );
};

export default EventsGrid;