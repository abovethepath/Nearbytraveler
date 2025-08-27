import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, DollarSign, Star, ExternalLink } from "lucide-react";
import { formatDateForDisplay } from "@/lib/dateUtils";

interface EventsGridProps {
  location?: string;
  limit?: number;
  showLocation?: boolean;
  className?: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  location: string;
  category?: string;
  tags?: string[];
  imageUrl?: string;
  participantCount?: number;
  costEstimate?: string;
  isFree?: boolean;
  isRecurring?: boolean;
  isSpontaneous?: boolean;
  isAIGenerated?: boolean;
  organizerId?: number;
  organizerName?: string;
  rating?: number;
  website?: string;
  ticketUrl?: string;
}

function EventsGrid({ location, limit = 6, showLocation = true, className = "" }: EventsGridProps) {
  const [, setNavigationLocation] = useLocation();
  const [displayCount, setDisplayCount] = useState(limit);

  // Fetch events based on location or general events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['/api/events/nearby', location],
    queryFn: async () => {
      const url = location 
        ? `/api/events?city=${encodeURIComponent(location)}`
        : '/api/events/nearby';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Filter to only upcoming events and sort by date
  const upcomingEvents = events
    .filter((event: Event) => new Date(event.date) >= new Date())
    .sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const displayedEvents = upcomingEvents.slice(0, displayCount);

  if (isLoading) {
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

  if (upcomingEvents.length === 0) {
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {showLocation && location ? `Events in ${location}` : "Nearby Events"}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setNavigationLocation('/events')}
          className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
        >
          View All
          <ExternalLink className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedEvents.map((event: Event) => (
          <Card
            key={event.id}
            className="hover:shadow-lg transition-shadow cursor-pointer group overflow-hidden border-gray-200 dark:border-gray-700"
            onClick={() => setNavigationLocation(`/events/${event.id}`)}
          >
            {/* Event Image */}
            {event.imageUrl ? (
              <div className="relative h-32 bg-cover bg-center overflow-hidden">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                
                {/* Event badges overlay */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {event.isFree && (
                    <Badge className="bg-green-500 text-white border-0 text-xs">
                      FREE
                    </Badge>
                  )}
                  {event.isSpontaneous && (
                    <Badge className="bg-orange-500 text-white border-0 text-xs">
                      ⚡ Last Minute
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Calendar className="w-12 h-12 text-white/80" />
                
                {/* Event badges overlay */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {event.isFree && (
                    <Badge className="bg-green-500 text-white border-0 text-xs">
                      FREE
                    </Badge>
                  )}
                  {event.isSpontaneous && (
                    <Badge className="bg-orange-500 text-white border-0 text-xs">
                      ⚡ Last Minute
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <CardContent className="p-4">
              {/* Event Title and Category */}
              <div className="mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {event.title}
                </h3>
                {event.category && (
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full mt-1">
                    {event.category}
                  </span>
                )}
              </div>

              {/* Event Description */}
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                {event.description || "Join us for this exciting event!"}
              </p>

              {/* Event Details */}
              <div className="space-y-2 mb-3">
                {/* Date and Time */}
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">
                    {formatDateForDisplay(event.date, "UTC")} at{" "}
                    {new Date(event.date).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>

                {/* Participants and Cost */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{Math.max(1, event.participantCount || 1)} attending</span>
                  </div>
                  
                  {event.costEstimate && (
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span className="font-medium">{event.costEstimate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 border-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNavigationLocation(`/events/${event.id}`);
                  }}
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Join Event
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNavigationLocation(`/events/${event.id}`);
                  }}
                  className="border-gray-300 dark:border-gray-600"
                >
                  Details
                </Button>
              </div>

              {/* Event Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {event.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {event.tags.length > 3 && (
                    <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                      +{event.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {upcomingEvents.length > displayCount && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={() => setDisplayCount(displayCount + 6)}
            className="bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Load More Events
          </Button>
        </div>
      )}

      {/* Load Less Button */}
      {displayCount > limit && (
        <div className="text-center pt-2">
          <Button
            variant="outline"
            onClick={() => setDisplayCount(limit)}
            className="bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Load Less
          </Button>
        </div>
      )}
    </div>
  );
}

export default EventsGrid;