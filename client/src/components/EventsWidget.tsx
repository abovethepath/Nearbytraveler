import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, MapPin } from "lucide-react";
import { formatDateForDisplay } from "@/lib/dateUtils";

interface EventsWidgetProps {
  userId: number | undefined;
}

interface User {
  hometownCity?: string;
  hometownState?: string;
  hometownCountry?: string;
  isCurrentlyTraveling?: boolean;
  travelDestination?: string;
}

interface TravelPlan {
  destination?: string;
}

interface Location {
  city: string;
  type: string;
}

function EventsWidget({ userId }: EventsWidgetProps) {
  const [, setLocation] = useLocation();

  // Get current user data and travel plans
  const { data: user } = useQuery({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  }) as { data?: User };

  const { data: travelPlans = [] } = useQuery({
    queryKey: [`/api/travel-plans/${userId}`],
    enabled: !!userId,
  }) as { data: TravelPlan[] };

  // Get ALL travel destinations and hometown for comprehensive discovery
  const discoveryLocations = useMemo(() => {
    if (!userId) return { allCities: [] };
    
    const locations: Location[] = [];
    
    // Add hometown
    const hometownCity = user?.hometownCity && user?.hometownState && user?.hometownCountry 
      ? `${user.hometownCity}, ${user.hometownState}, ${user.hometownCountry}`
      : null;
    
    if (hometownCity) {
      locations.push({ city: hometownCity, type: 'hometown' });
    }
    
    // Add current travel destination if traveling
    if (user?.isCurrentlyTraveling && user?.travelDestination) {
      locations.push({ city: user.travelDestination, type: 'current_travel' });
    }
    
    // Add ALL planned travel destinations from travel plans
    if (travelPlans && travelPlans.length > 0) {
      travelPlans.forEach(plan => {
        if (plan.destination && !locations.some(loc => loc.city === plan.destination)) {
          locations.push({ city: plan.destination, type: 'planned_travel' });
        }
      });
    }
    
    return { allCities: locations };
  }, [userId, user?.hometownCity, user?.hometownState, user?.hometownCountry, user?.isCurrentlyTraveling, user?.travelDestination, travelPlans]);

  // Fetch events from ALL locations
  const { data: allEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: [`/api/events/widget-all-locations`, discoveryLocations.allCities.map(loc => loc.city)],
    queryFn: async () => {
      if (!discoveryLocations.allCities.length) return [];
      
      // Fetch events from all cities in parallel
      const eventPromises = discoveryLocations.allCities.map(async (location) => {
        const cityName = location.city.split(',')[0].trim();
        
        try {
          const response = await fetch(`/api/events?city=${encodeURIComponent(cityName)}`);
          if (!response.ok) throw new Error(`Failed to fetch events for ${cityName}`);
          const data = await response.json();
          return data.map((event: any) => ({ ...event, sourceLocation: location }));
        } catch (error) {
          console.error(`Error fetching events for ${cityName}:`, error);
          return [];
        }
      });
      
      const allEventsArrays = await Promise.all(eventPromises);
      const combined = allEventsArrays.flat();
      
      // Remove duplicates by event ID
      const unique = combined.filter((event, index, self) => 
        index === self.findIndex((e) => e.id === event.id)
      );
      
      return unique;
    },
    enabled: discoveryLocations.allCities.length > 0,
    staleTime: 0,
    gcTime: 0,
  });

  const today = new Date();
  // Only show upcoming events (future dates only)
  const relevantEvents = allEvents.filter((event: any) => {
    const eventDate = new Date(event.date);
    return eventDate >= today;
  })
  // Handle recurring events - only show one instance per series
  .reduce((uniqueEvents: any[], event: any) => {
    // If event has a series ID (recurring), only keep the earliest occurrence
    if (event.seriesId || event.recurringId || event.recurring) {
      const seriesKey = event.seriesId || event.recurringId || `${event.title}-${event.organizerId}`;
      const existingEvent = uniqueEvents.find(e => 
        (e.seriesId === seriesKey) || 
        (e.recurringId === seriesKey) || 
        (e.title === event.title && e.organizerId === event.organizerId && e.location === event.location)
      );
      
      if (!existingEvent) {
        uniqueEvents.push(event);
      } else {
        // Keep the earlier event
        const eventDate = new Date(event.date);
        const existingDate = new Date(existingEvent.date);
        if (eventDate < existingDate) {
          const index = uniqueEvents.findIndex(e => e.id === existingEvent.id);
          uniqueEvents[index] = event;
        }
      }
    } else {
      uniqueEvents.push(event);
    }
    return uniqueEvents;
  }, [])
  .sort((a: any, b: any) => {
    // Prioritize member-created events (not AI-generated) first
    const aMemberCreated = !a.isAIGenerated;
    const bMemberCreated = !b.isAIGenerated;
    
    if (aMemberCreated && !bMemberCreated) return -1;
    if (!aMemberCreated && bMemberCreated) return 1;
    
    // Within same type, prioritize events created by current user
    const userCreatedA = a.organizerId === userId;
    const userCreatedB = b.organizerId === userId;
    
    if (userCreatedA && !userCreatedB) return -1;
    if (!userCreatedA && userCreatedB) return 1;
    
    // Then sort by date - earliest upcoming events first
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <Card 
      className="bg-gray-50 dark:bg-gray-800 cursor-pointer hover:shadow-lg transition-shadow border-gray-200 dark:border-gray-700"
      onClick={() => setLocation("/events")}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Events</h3>
        </div>
        <div className="space-y-4">
          {relevantEvents.slice(0, 3).map((event: any) => (
            <div
              key={event.id}
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/events/${event.id}`);
              }}
              className="block w-full text-left hover:bg-white dark:hover:bg-gray-700 rounded-lg overflow-hidden transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99] border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              {/* Event Photo Header */}
              {event.imageUrl && (
                <div className="relative h-24 bg-cover bg-center">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>
              )}
              
              <div className="p-4">
                <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{event.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{event.description || "Join us for this exciting event!"}</p>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDateForDisplay(event.date, "UTC")} at{" "}
                      {new Date(event.date).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {event.endDate && (
                        <>
                          {" - "}
                          {new Date(event.endDate).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </span>
                  </div>
                  {/* Widget-specific detail tags - different from main category */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                      <Users className="w-4 h-4" />
                      <span>{Math.max(1, event.participantCount || 1)} attending</span>
                    </div>
                    
                    {/* Cost indicator tag */}
                    {event.costEstimate && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {event.costEstimate}
                      </span>
                    )}
                    
                    {/* Event type tags */}
                    {event.isSpontaneous && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        ⚡ Last Minute
                      </span>
                    )}
                    
                    {event.isRecurring && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        🔄 Recurring
                      </span>
                    )}
                    
                    {/* Show specific event tags (not category) - filter out redundant tags */}
                    {event.tags && event.tags.length > 0 && event.tags
                      .filter((tag: string) => {
                        // Filter out tags that are redundant with the main category
                        const categoryLower = event.category.toLowerCase();
                        const tagLower = tag.toLowerCase();
                        
                        // Remove tags that are already covered by the category
                        if (categoryLower.includes('health') && tagLower.includes('health')) return false;
                        if (categoryLower.includes('wellness') && tagLower.includes('wellness')) return false;
                        if (categoryLower.includes('sports') && tagLower.includes('sports')) return false;
                        if (categoryLower.includes('fitness') && tagLower.includes('fitness')) return false;
                        if (categoryLower.includes('entertainment') && tagLower.includes('entertainment')) return false;
                        if (categoryLower.includes('food') && (tagLower.includes('food') || tagLower.includes('dining'))) return false;
                        if (categoryLower.includes('dining') && (tagLower.includes('food') || tagLower.includes('dining'))) return false;
                        if (categoryLower.includes('family') && tagLower.includes('family')) return false;
                        
                        return true;
                      })
                      .slice(0, 2)
                      .map((tag: string, index: number) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                </div>
                </div>
              </div>
            </div>
          ))}
          
          {relevantEvents.length === 0 && (
            <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
              <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No upcoming events in your area</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation("/events/create");
                }}
                className="bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600 border-0 hover:scale-105 active:scale-95 transition-transform"
              >
                Create Event
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default EventsWidget;