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
    if (event.venue) parts.push(event.venue);
    if (event.city) parts.push(event.city);
    if (event.state) parts.push(event.state);
    
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
    <Card className="cursor-pointer transition-all duration-200 hover:shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-3">
        {/* Compact Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1 mb-1">
              {event.title}
            </h4>
            <div className="flex items-center space-x-3 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formatEventDate(event.date, event.time)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{formatEventLocation(event)}</span>
              </div>
            </div>
          </div>
          {event.category && (
            <Badge className="bg-blue-500 text-white text-xs ml-2 flex-shrink-0">
              {event.category}
            </Badge>
          )}
        </div>

        {/* Bottom Row: Attendees + Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {event.attendeeCount || 1} going
            </span>
            {event.organizer && (
              <span className="text-xs text-gray-500 dark:text-gray-500">
                by {event.organizer}
              </span>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEventClick?.(event);
              }}
              className="text-xs px-2 py-1 h-6 bg-purple-600 hover:bg-purple-700 text-white"
            >
              View Event
            </Button>
            
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Handle join event action
              }}
              className="text-xs px-2 py-1 h-6 bg-green-600 hover:bg-green-700 text-white"
            >
              Join Event
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="w-full bg-gradient-to-br from-white via-purple-50/20 to-blue-50/20 dark:from-gray-900 dark:via-purple-900/10 dark:to-blue-900/10 border-purple-200 dark:border-purple-700 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400">{title}</span>
          </CardTitle>
          {showViewAll && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onViewAll}
              className="border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-900/20"
            >
              View All Events
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {sortedEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No upcoming events found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}