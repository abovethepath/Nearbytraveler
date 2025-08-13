import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Star, 
  ExternalLink,
  CalendarDays
} from "lucide-react";
import { formatDateForDisplay } from "@/lib/dateUtils";

interface TravelItineraryProps {
  userId: number;
  destination: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

interface EventWithParticipants {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  category: string;
  maxParticipants?: number;
  price?: number;
  organizerId: number;
  organizer?: {
    id: number;
    username: string;
    profileImage?: string;
  };
  participantCount: number;
  userStatus: 'joined' | 'invited' | 'declined' | 'pending';
  joinedAt: string;
}

export default function TravelItinerary({ userId, destination, startDate, endDate }: TravelItineraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  // Fetch events the user has joined (created + participated in)
  const { data: itineraryEvents = [], isLoading } = useQuery({
    queryKey: ['/api/users', userId, 'all-events'],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/all-events`);
      if (!response.ok) throw new Error('Failed to fetch user events');
      return response.json();
    },
  });

  // Check if this user has too many events (admin/heavy users)
  const hasExcessiveEvents = itineraryEvents.length > 10;

  // Group events by date (using 'date' field from API)
  const eventsByDate = itineraryEvents.reduce((acc: Record<string, any[]>, event: any) => {
    const eventDateValue = event.date || event.startDate;
    if (!eventDateValue) return acc;
    
    const eventDate = new Date(eventDateValue);
    if (isNaN(eventDate.getTime())) return acc; // Skip invalid dates
    
    const dateString = eventDate.toDateString();
    if (!acc[dateString]) {
      acc[dateString] = [];
    }
    acc[dateString].push(event);
    return acc;
  }, {});

  // Sort dates
  const sortedDates = Object.keys(eventsByDate).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  // Get unique categories
  const categories = Array.from(new Set(itineraryEvents.map((event: EventWithParticipants) => event.category)));

  const filteredEvents = selectedCategory 
    ? itineraryEvents.filter((event: EventWithParticipants) => event.category === selectedCategory)
    : itineraryEvents;

  // Show compact archive view for users with excessive events
  if (hasExcessiveEvents) {
    const upcomingEvents = itineraryEvents.filter(event => {
      const eventDate = new Date(event.date || event.startDate);
      return eventDate > new Date();
    }).slice(0, 3);

    const recentEvents = itineraryEvents.filter(event => {
      const eventDate = new Date(event.date || event.startDate);
      return eventDate <= new Date();
    }).slice(0, 3);

    return (
      <Card className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Event Archive</span>
            </div>
            <Badge variant="outline" className="bg-white">
              {itineraryEvents.length} total events
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <div className="text-lg font-bold text-blue-600">{upcomingEvents.length}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Upcoming</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <div className="text-lg font-bold text-green-600">{recentEvents.length}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Recent</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <div className="text-lg font-bold text-orange-600">{categories.length}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Categories</div>
            </div>
          </div>

          {/* Recent Events Preview */}
          {upcomingEvents.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Next 3 Events</h4>
              <div className="space-y-2">
                {upcomingEvents.map(event => (
                  <div 
                    key={event.id}
                    className="flex items-center justify-between bg-white dark:bg-gray-800 rounded p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setLocation(`/event-details/${event.id}`)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{event.title}</div>
                      <div className="text-xs text-gray-500">{new Date(event.date || event.startDate).toLocaleDateString('en-US', { 
                        year: 'numeric', // CRITICAL: Always shows 4-digit year (2025, not 25)
                        month: 'short', 
                        day: 'numeric' 
                      })}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">{event.category}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/events')}
              className="px-6"
            >
              Browse All Events
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'joined': return 'bg-green-100 text-green-800 border-green-200';
      case 'invited': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (itineraryEvents.length === 0) {
    return (
      <div className="text-center py-8">
        <CalendarDays className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No Events Planned Yet</h3>
        <p className="text-sm text-gray-500 mb-4">
          Start building your itinerary by joining events in {destination}
        </p>
        <Button size="sm" onClick={() => window.location.href = '/events'}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Discover Events
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Travel Period Info */}
      {startDate && endDate && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Travel Period:</span>
            <span>
              {formatDateForDisplay(new Date(startDate))} - {formatDateForDisplay(new Date(endDate))}
            </span>
          </div>
        </div>
      )}

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All ({itineraryEvents.length})
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category} ({itineraryEvents.filter((e: EventWithParticipants) => e.category === category).length})
            </Button>
          ))}
        </div>
      )}

      {/* Events by Date */}
      <div className="space-y-6">
        {sortedDates.map((dateString) => {
          const eventsForDate = eventsByDate[dateString].filter(event => 
            !selectedCategory || event.category === selectedCategory
          );
          
          if (eventsForDate.length === 0) return null;

          return (
            <div key={dateString} className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-2">
                <CalendarDays className="w-4 h-4 text-gray-500" />
                <h4 className="font-medium text-gray-800">
                  {formatDateForDisplay(new Date(dateString))}
                </h4>
                <Badge variant="outline" className="text-xs">
                  {eventsForDate.length} event{eventsForDate.length > 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {eventsForDate.map((event) => (
                  <Card 
                    key={event.id} 
                    className="border-l-4 border-l-blue-400 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setLocation(`/event-details/${event.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-1">{event.title}</h5>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {(() => {
                                const eventDate = new Date(event.date || event.startDate);
                                return isNaN(eventDate.getTime()) ? 'Time TBD' : eventDate.toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit',
                                  hour12: true 
                                });
                              })()}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {event.participantCount} participant{event.participantCount > 1 ? 's' : ''}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{event.description}</p>
                        </div>
                        <Badge className={getStatusColor(event.userStatus)}>
                          {event.userStatus}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {event.category}
                          </Badge>
                          {event.price && (
                            <Badge variant="outline" className="text-xs">
                              ${event.price}
                            </Badge>
                          )}
                        </div>
                        
                        {event.organizer && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={event.organizer.profileImage} />
                              <AvatarFallback className="text-xs">
                                {event.organizer.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>by {event.organizer.username}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 p-3 rounded-lg border">
        <div className="text-sm text-gray-600 text-center">
          <strong>{filteredEvents.length}</strong> event{filteredEvents.length > 1 ? 's' : ''} planned
          {selectedCategory && ` in ${selectedCategory}`}
        </div>
      </div>
    </div>
  );
}