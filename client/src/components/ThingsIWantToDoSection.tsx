import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ThingsIWantToDoSectionProps {
  userId: number;
  isOwnProfile: boolean;
}

interface UserActivity {
  id: number;
  userId: number;
  cityName: string;
  activityId: number;
  activityName: string;
}

interface UserEvent {
  id: number;
  userId: number;
  eventId?: number;
  externalEventId?: string;
  eventSource?: string;
  eventTitle: string;
  cityName: string;
  eventData?: any;
}

export function ThingsIWantToDoSection({ userId, isOwnProfile }: ThingsIWantToDoSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Fetch activities
  const { data: activities = [], isLoading: loadingActivities } = useQuery({
    queryKey: [`/api/user-city-interests/${userId}`],
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fetch events that the user is attending  
  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: [`/api/users/${userId}/all-events`],
    staleTime: 0, // Always refresh to get latest joined events
    gcTime: 0,
  });

  // Use the data directly from queries - no local state management needed
  const localActivities = useMemo(() => Array.isArray(activities) ? activities : [], [activities]);
  const localEvents = useMemo(() => {
    console.log('🎯 ThingsIWantToDoSection events data:', { 
      userId, 
      rawEvents: events, 
      eventsCount: events?.length,
      eventsType: typeof events,
      firstEventSample: events?.[0] ? {
        id: events[0].id,
        title: events[0].title,
        eventTitle: events[0].eventTitle,
        cityName: events[0].cityName,
        location: events[0].location,
        allKeys: Object.keys(events[0])
      } : null
    });
    return Array.isArray(events) ? events : [];
  }, [events, userId]);

  // Delete activity
  const deleteActivity = useMutation({
    mutationFn: async (activityId: number) => {
      const response = await apiRequest('DELETE', `/api/user-city-interests/${activityId}`);
      if (!response.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      // Just invalidate cache - no local state updates needed
      queryClient.invalidateQueries({ queryKey: [`/api/user-city-interests/${userId}`] });
      toast({ title: "Removed", description: "Activity deleted successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove activity", variant: "destructive" });
    }
  });

  // Delete event
  const deleteEvent = useMutation({
    mutationFn: async (eventId: number) => {
      const response = await apiRequest('DELETE', `/api/event-interests/${eventId}`);
      if (!response.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      // Just invalidate cache - no local state updates needed
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/all-events`] });
      toast({ title: "Removed", description: "Event deleted successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove event", variant: "destructive" });
    }
  });

  // Delete entire city
  const deleteCity = async (cityName: string) => {
    const cityActivities = localActivities.filter(a => a.cityName === cityName);
    const cityEvents = localEvents.filter(e => e.cityName === cityName);

    if (!confirm(`Remove all ${cityActivities.length} activities and ${cityEvents.length} events from ${cityName}?`)) {
      return;
    }

    try {
      // Delete all activities for this city
      await Promise.all(cityActivities.map(a => apiRequest('DELETE', `/api/user-city-interests/${a.id}`)));

      // Delete all events for this city
      await Promise.all(cityEvents.map(e => apiRequest('DELETE', `/api/event-interests/${e.id}`)));

      // Refresh cache only - no local state updates needed
      queryClient.invalidateQueries({ queryKey: [`/api/user-city-interests/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/all-events`] });

      toast({ 
        title: "City Removed", 
        description: `Removed ${cityActivities.length} activities and ${cityEvents.length} events from ${cityName}` 
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove city", variant: "destructive" });
    }
  };

  // Metro consolidation helper
  const consolidateCity = (cityName: string): string => {
    const laMetroCities = [
      'Los Angeles', 'Santa Monica', 'Venice', 'Venice Beach', 'El Segundo',
      'Manhattan Beach', 'Beverly Hills', 'West Hollywood', 'Pasadena',
      'Burbank', 'Glendale', 'Long Beach', 'Torrance', 'Inglewood',
      'Compton', 'Downey', 'Pomona', 'Playa del Rey', 'Redondo Beach',
      'Culver City', 'Marina del Rey', 'Hermosa Beach', 'Hawthorne',
      'Gardena', 'Carson', 'Lakewood', 'Norwalk', 'Whittier', 'Montebello',
      'East Los Angeles', 'Monterey Park', 'Alhambra', 'South Pasadena',
      'San Fernando', 'North Hollywood', 'Hollywood', 'Studio City',
      'Sherman Oaks', 'Encino', 'Reseda', 'Van Nuys', 'Northridge',
      'Malibu', 'Pacific Palisades', 'Brentwood', 'Westwood', 'Century City',
      'West LA', 'Koreatown', 'Mid-City', 'Miracle Mile', 'Los Feliz',
      'Silver Lake', 'Echo Park', 'Downtown LA', 'Arts District',
      'Little Tokyo', 'Chinatown', 'Boyle Heights', 'East LA',
      'Highland Park', 'Eagle Rock', 'Atwater Village', 'Glassell Park',
      'Mount Washington', 'Cypress Park', 'Sun Valley', 'Pacoima',
      'Sylmar', 'Granada Hills', 'Porter Ranch', 'Chatsworth',
      'Canoga Park', 'Woodland Hills', 'Tarzana', 'Panorama City',
      'Mission Hills', 'Sepulveda', 'Arleta', 'San Pedro', 'Wilmington',
      'Harbor City', 'Harbor Gateway', 'Watts', 'South LA', 'Crenshaw',
      'Leimert Park', 'View Park', 'Baldwin Hills', 'Ladera Heights'
    ];
    
    return laMetroCities.includes(cityName) ? 'Los Angeles Metro' : cityName;
  };

  // Group by city with metro consolidation - memoized to prevent infinite re-renders
  const citiesByName = useMemo(() => {
    const cities: Record<string, { activities: UserActivity[], events: UserEvent[] }> = {};

    localActivities.forEach(activity => {
      const consolidatedCity = consolidateCity(activity.cityName);
      if (!cities[consolidatedCity]) {
        cities[consolidatedCity] = { activities: [], events: [] };
      }
      cities[consolidatedCity].activities.push(activity);
    });

    localEvents.forEach(event => {
      const cityName = event.cityName || 'Other';
      const consolidatedCity = consolidateCity(cityName);
      if (!cities[consolidatedCity]) {
        cities[consolidatedCity] = { activities: [], events: [] };
      }
      cities[consolidatedCity].events.push(event);
    });

    return cities;
  }, [localActivities, localEvents]);

  const cities = useMemo(() => Object.keys(citiesByName), [citiesByName]);

  if (loadingActivities || loadingEvents) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-6">⭐ Things I Want to Do in...</h2>
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  // If viewing another user's profile and they have no activities/events, hide the entire widget
  if (!isOwnProfile && cities.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gray-800 rounded-lg ${isMobile ? 'p-4' : 'p-6'}`}>
      <h2 className={`font-semibold text-white mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>
        ⭐ Things I Want to Do in...
      </h2>

      {cities.length > 0 ? (
        <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
          {cities.map((cityName) => {
            const cityData = citiesByName[cityName];
            return (
              <div key={cityName}>
                {/* City Header */}
                <div className={`flex items-center justify-between mb-3 ${isMobile ? 'flex-col gap-2 items-start' : ''}`}>
                  <h3 className={`font-semibold text-red-500 ${isMobile ? 'text-base' : 'text-lg'}`}>
                    {cityName}
                  </h3>
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size={isMobile ? "sm" : "sm"}
                      onClick={() => deleteCity(cityName)}
                      className={`text-red-400 hover:text-red-300 hover:bg-red-900/20 ${isMobile ? 'min-h-[44px] px-3' : ''}`}
                      title={`Remove all from ${cityName}`}
                    >
                      <Trash2 className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} mr-1`} />
                      <span className={isMobile ? 'text-xs' : 'text-sm'}>Remove City</span>
                    </Button>
                  )}
                </div>

                {/* Pills */}
                <div className={`flex flex-wrap ${isMobile ? 'gap-2' : 'gap-2'}`}>

                  {/* Activity Pills */}
                  {cityData.activities.map((activity) => (
                    <div
                      key={`act-${activity.id}`}
                      className={`relative group bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors ${
                        isMobile 
                          ? 'px-3 py-2 text-sm min-h-[40px] flex items-center' 
                          : 'px-3 py-2 text-sm'
                      }`}
                    >
                      <span>{activity.activityName}</span>
                      {isOwnProfile && (
                        <button
                          onClick={() => deleteActivity.mutate(activity.id)}
                          className={`absolute bg-gray-400 hover:bg-gray-500 text-white rounded-full flex items-center justify-center transition-opacity ${
                            isMobile 
                              ? '-top-1 -right-1 w-6 h-6 opacity-100' 
                              : '-top-1 -right-1 w-5 h-5 opacity-0 group-hover:opacity-100'
                          }`}
                          title="Remove activity"
                        >
                          <X className={isMobile ? 'w-3 h-3' : 'w-3 h-3'} />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Event Pills */}
                  {cityData.events.map((event) => (
                    <div
                      key={`evt-${event.id}`}
                      className={`relative group bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors ${
                        isMobile 
                          ? 'px-3 py-2 text-sm min-h-[40px] flex items-center' 
                          : 'px-3 py-2 text-sm'
                      }`}
                    >
                      <span>📅 {event.eventTitle}</span>
                      {isOwnProfile && (
                        <button
                          onClick={() => deleteEvent.mutate(event.id)}
                          className={`absolute bg-gray-400 hover:bg-gray-500 text-white rounded-full flex items-center justify-center transition-opacity ${
                            isMobile 
                              ? '-top-1 -right-1 w-6 h-6 opacity-100' 
                              : '-top-1 -right-1 w-5 h-5 opacity-0 group-hover:opacity-100'
                          }`}
                          title="Remove event"
                        >
                          <X className={isMobile ? 'w-3 h-3' : 'w-3 h-3'} />
                        </button>
                      )}
                    </div>
                  ))}

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className={`text-gray-400 mb-4 ${isMobile ? 'text-sm' : 'text-base'}`}>
            No activities or events selected yet.
          </p>
          <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            Go to city match pages to select activities and events!
          </p>
        </div>
      )}
    </div>
  );
}