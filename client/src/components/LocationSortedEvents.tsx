import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MapPin, Clock, Users, Star, ExternalLink, Heart, Share2 } from 'lucide-react';
import { isLAMetroCity, getMetroCities } from '@shared/constants';

interface Event {
  id: number;
  title: string;
  description?: string;
  eventImage?: string;
  date: string;
  time?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  venue?: string;
  address?: string;
  organizer?: string;
  category?: string;
  price?: number;
  capacity?: number;
  attendeeCount?: number;
  rating?: number;
  tags?: string[];
  distance?: number;
}

interface LocationSortedEventsProps {
  events: Event[];
  currentUserLocation?: string;
  title?: string;
  showViewAll?: boolean;
  onEventClick?: (event: Event) => void;
  onViewAll?: () => void;
}

export default function LocationSortedEvents({ 
  events, 
  currentUserLocation, 
  title = "Upcoming Events",
  showViewAll = true,
  onEventClick,
  onViewAll 
}: LocationSortedEventsProps) {

  // Sort events by location proximity and date
  const sortedEvents = React.useMemo(() => {
    if (!events) return [];
    
    return [...events].sort((a, b) => {
      // If we have current user location, prioritize same city/metro area
      if (currentUserLocation) {
        const currentCity = currentUserLocation.split(',')[0].trim();
        
        // Check if current city is in LA Metro area
        const isCurrentCityLAMetro = isLAMetroCity(currentCity);
        const laMetroCities = isCurrentCityLAMetro ? getMetroCities(currentCity) : [];
        
        // Check if event is in current city or same metro area
        const aInCurrentArea = () => {
          const eventCity = a.city || a.location || '';
          
          // Direct city match
          if (eventCity.toLowerCase().includes(currentCity.toLowerCase())) return true;
          
          // LA Metro area match
          if (isCurrentCityLAMetro && isLAMetroCity(eventCity)) return true;
          
          return false;
        };
        
        const bInCurrentArea = () => {
          const eventCity = b.city || b.location || '';
          
          // Direct city match
          if (eventCity.toLowerCase().includes(currentCity.toLowerCase())) return true;
          
          // LA Metro area match
          if (isCurrentCityLAMetro && isLAMetroCity(eventCity)) return true;
          
          return false;
        };
        
        const aInArea = aInCurrentArea();
        const bInArea = bInCurrentArea();
        
        if (aInArea && !bInArea) return -1;
        if (!aInArea && bInArea) return 1;
      }
      
      // Then sort by distance if available
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      
      // Finally by date (soonest first)
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [events, currentUserLocation]);

  const formatEventLocation = (event: Event) => {
    const parts = [];
    
    // Add venue/business name first
    if (event.venue) parts.push(event.venue);
    
    // Add street address if available
    if (event.address) parts.push(event.address);
    
    // Add city, state
    if (event.city && event.state) {
      parts.push(`${event.city}, ${event.state}`);
    } else if (event.city) {
      parts.push(event.city);
    }
    
    return parts.join(', ') || event.location || 'Location TBD';
  };

  const formatEventDate = (dateString: string, time?: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    let dateLabel = '';
    if (isToday) dateLabel = 'Today';
    else if (isTomorrow) dateLabel = 'Tomorrow';
    else dateLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    if (time) {
      return `${dateLabel} at ${time}`;
    }
    return dateLabel;
  };

  const formatDistance = (distance?: number) => {
    if (distance === undefined) return null;
    if (distance < 1) return `${Math.round(distance * 1000)}m away`;
    return `${distance.toFixed(1)}km away`;
  };

  const EventCard = ({ event }: { event: Event }) => (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" 
      onClick={() => onEventClick?.(event)}
    >
      {/* Photo on top */}
      {event.eventImage && (
        <div className="w-full h-32 overflow-hidden">
          <img 
            src={event.eventImage} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardContent className="p-4">
        {/* Event title */}
        <h3 className="font-semibold text-gray-900 dark:text-white text-base break-words mb-2">
          {event.title}
        </h3>

        {/* Address */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{formatEventLocation(event)}</span>
        </div>

        {/* Party details (date/time) */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>{formatEventDate(event.date, event.time)}</span>
        </div>

        {/* Join/View buttons */}
        <div className="flex gap-2 mb-3">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEventClick?.(event);
            }}
            className="flex-1 text-xs bg-purple-600 hover:bg-purple-700 text-white"
          >
            View Event
          </Button>
          
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // Handle join event action
            }}
            className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white"
          >
            Join Event
          </Button>
        </div>

        {/* Number of people going */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <Users className="h-4 w-4 shrink-0" />
          <span>{event.attendeeCount || 1} going</span>
          {event.organizer && (
            <span className="text-gray-500">• by {event.organizer}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full">
      {/* Clean header without border */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">{title}</span>
        </div>
        {showViewAll && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewAll}
            className="text-gray-600 dark:text-gray-400"
          >
            View All Events
          </Button>
        )}
      </div>
      
      {/* Events grid without container */}
      {sortedEvents.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No upcoming events found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}