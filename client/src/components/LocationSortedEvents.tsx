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
    <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.03] bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-blue-900/20 border-l-4 border-l-purple-400">
      <CardContent className="p-5">
        {/* Event Header with Image */}
        <div className="flex items-start space-x-4 mb-4">
          {event.eventImage && (
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-purple-200 dark:ring-purple-700">
              <img 
                src={event.eventImage} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 mb-2">
                  {event.title}
                </h4>
                {event.category && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs mb-2">
                    {event.category}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Event Description */}
        {event.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Date and Time */}
        <div className="flex items-center space-x-2 mb-3 text-sm font-medium">
          <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-800/30 dark:to-blue-800/30 rounded-lg px-3 py-1.5">
            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <span className="text-purple-800 dark:text-purple-200">{formatEventDate(event.date, event.time)}</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start space-x-2 mb-3 text-sm">
          <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-800/30 dark:to-indigo-800/30 rounded-lg px-3 py-1.5">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <span className="text-blue-800 dark:text-blue-200 break-words">{formatEventLocation(event)}</span>
          </div>
        </div>

        {/* Organizer */}
        {event.organizer && (
          <div className="flex items-center space-x-2 mb-3 text-sm">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-800/30 dark:to-emerald-800/30 rounded-lg px-3 py-1.5">
              <Users className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-green-800 dark:text-green-200">by {event.organizer}</span>
            </div>
          </div>
        )}

        {/* Who's Going */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {event.attendeeCount || 1} going
              {event.capacity && ` • ${event.capacity} max`}
            </span>
            {/* Price */}
            {event.price !== undefined && (
              <span className="text-sm font-medium text-green-600 dark:text-green-400 ml-3">
                {event.price === 0 ? 'Free' : `$${event.price}`}
              </span>
            )}
          </div>

          {/* Distance */}
          {event.distance !== undefined && (
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {formatDistance(event.distance)}
            </span>
          )}
        </div>


        {/* Location Priority Indicator */}
        {currentUserLocation && (
          <>
            {(event.city?.toLowerCase().includes(currentUserLocation.toLowerCase()) || 
              event.location?.toLowerCase().includes(currentUserLocation.toLowerCase())) && (
              <div className="mb-3">
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs animate-pulse">
                  <MapPin className="w-3 h-3 mr-1" />
                  In your area
                </Badge>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 mt-4">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEventClick?.(event);
            }}
            className="flex-1 text-xs bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View Event
          </Button>
          
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // Handle join event action
            }}
            className="flex-1 text-xs bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium"
          >
            <Users className="w-3 h-3 mr-1" />
            Join Event
          </Button>
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
            {currentUserLocation && (
              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs">
                Near {currentUserLocation}
              </Badge>
            )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}