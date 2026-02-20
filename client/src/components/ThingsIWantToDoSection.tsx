import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Trash2, Plane, MapPin, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useEffect, useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "wouter";

interface ThingsIWantToDoSectionProps {
  userId: number;
  isOwnProfile: boolean;
}

interface UserProfile {
  id: number;
  subInterests?: string[] | null;
  [key: string]: any;
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

interface TravelPlan {
  id: number;
  userId: number;
  destination: string;
  destinationCity?: string;
  destinationState?: string;
  destinationCountry?: string;
  startDate: string;
  endDate: string;
  status: string;
}

export function ThingsIWantToDoSection({ userId, isOwnProfile }: ThingsIWantToDoSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; cityName: string } | null>(null);

  // Fetch user's travel plans to get trip destinations
  const { data: travelPlans = [], isLoading: loadingTravelPlans } = useQuery<TravelPlan[]>({
    queryKey: [`/api/users/${userId}/travel-plans`],
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fetch city-specific activities
  const { data: cityActivities = [], isLoading: loadingCityActivities } = useQuery({
    queryKey: [`/api/user-city-interests/${userId}`],
    staleTime: 0, // Always fresh - no cache delay
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fetch user profile with general interests/activities/events and sub-interests
  const { data: userProfile, isLoading: loadingProfile } = useQuery<UserProfile>({
    queryKey: [`/api/users/${userId}`],
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
  
  // Get user's sub-interests (specific interests like Pickleball, Yoga, etc.)
  // Sub-interests are stored as "CityName: SubInterest" format - extract by city
  const getSubInterestsForCity = (cityName: string): string[] => {
    if (!userProfile?.subInterests || !Array.isArray(userProfile.subInterests)) {
      return [];
    }
    const cityPrefix = `${cityName}: `;
    return userProfile.subInterests
      .filter((si: string) => si.startsWith(cityPrefix))
      .map((si: string) => si.replace(cityPrefix, ''));
  };

  // Fetch events that the user is attending  
  const { data: joinedEvents = [], isLoading: loadingJoinedEvents } = useQuery({
    queryKey: [`/api/users/${userId}/all-events`],
    staleTime: 0, // Always refresh to get latest joined events
    gcTime: 0,
  });

  // Fetch user event interests (events they marked interest in from city pages)
  const { data: eventInterestsData = [], isLoading: loadingEventInterests } = useQuery({
    queryKey: [`/api/user-event-interests/${userId}`],
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Get destination cities from travel plans (all trips - we'll mark past ones)
  const travelDestinations = useMemo(() => {
    if (!Array.isArray(travelPlans)) return [];
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return travelPlans
      .map((plan: TravelPlan) => {
        const endDate = new Date(plan.endDate);
        endDate.setHours(23, 59, 59, 999);
        const isPast = endDate < now;
        
        return {
          cityName: plan.destinationCity || plan.destination,
          tripId: plan.id,
          startDate: plan.startDate,
          endDate: plan.endDate,
          fullDestination: plan.destination,
          isPast
        };
      })
      .filter((dest, index, self) => 
        index === self.findIndex(d => d.cityName === dest.cityName)
      );
  }, [travelPlans]);

  // Only use city-specific activities (no general profile interests)
  const allActivities = useMemo(() => {
    console.log('🔍 ThingsIWantToDoSection - cityActivities:', {
      userId,
      cityActivities,
      isArray: Array.isArray(cityActivities),
      length: Array.isArray(cityActivities) ? cityActivities.length : 'not array',
      sample: Array.isArray(cityActivities) && cityActivities[0] ? {
        id: cityActivities[0].id,
        activityName: cityActivities[0].activityName,
        cityName: cityActivities[0].cityName
      } : 'no sample'
    });
    return Array.isArray(cityActivities) ? cityActivities : [];
  }, [cityActivities]);
  const [dismissedEventIds, setDismissedEventIds] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(`dismissed_events_${userId}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const dismissEvent = (eventId: number) => {
    setDismissedEventIds(prev => {
      const next = new Set(prev);
      next.add(eventId);
      localStorage.setItem(`dismissed_events_${userId}`, JSON.stringify([...next]));
      return next;
    });
  };

  const allEvents = useMemo(() => {
    const combined = [];
    
    // Add specific events the user joined
    if (Array.isArray(joinedEvents)) {
      combined.push(...joinedEvents);
    }
    
    // Add event interests (events marked from city pages)
    if (Array.isArray(eventInterestsData)) {
      eventInterestsData.forEach((eventInterest) => {
        combined.push({
          id: eventInterest.id,
          userId: userId,
          eventId: eventInterest.eventid || eventInterest.eventId,
          eventTitle: eventInterest.eventtitle || eventInterest.eventTitle,
          cityName: eventInterest.cityname || eventInterest.cityName,
          isEventInterest: true
        });
      });
    }
    
    return combined.filter(e => !dismissedEventIds.has(e.id));
  }, [joinedEvents, eventInterestsData, userId, dismissedEventIds]);

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

  // Delete event (handles joined events, event interests, and organizer events)
  const deleteEvent = useMutation({
    mutationFn: async (eventData: any) => {
      if (eventData.isEventInterest) {
        const response = await apiRequest('DELETE', `/api/user-event-interests/${eventData.id}`);
        if (!response.ok) throw new Error('Failed to delete event interest');
      } else {
        const eventId = eventData.id;
        const isOrganizer = (eventData as any).organizerId === userId;
        if (isOrganizer) {
          dismissEvent(eventId);
          return;
        }
        const response = await apiRequest('DELETE', `/api/events/${eventId}/leave`, { userId });
        if (!response.ok) throw new Error('Failed to leave event');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/all-events`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user-event-interests/${userId}`] });
      toast({ title: "Removed", description: "Event removed from your profile." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove event", variant: "destructive" });
    }
  });

  // Delete entire city - removes all activities and events for the city
  const executeCityDelete = async (cityName: string) => {
    const consolidatedName = consolidateCity(cityName);
    const cityData = citiesByName[consolidatedName] || citiesByName[cityName];
    const cityActs = cityData?.activities || [];
    const cityEvts = cityData?.events || [];

    try {
      await Promise.all(cityActs.map((a: any) => apiRequest('DELETE', `/api/user-city-interests/${a.id}`)));

      await Promise.all(cityEvts.map((e: any) => {
        if (e.isEventInterest) {
          return apiRequest('DELETE', `/api/user-event-interests/${e.id}`);
        } else {
          const isOrganizer = (e as any).organizerId === userId;
          if (isOrganizer) {
            dismissEvent(e.id);
            return Promise.resolve();
          }
          return apiRequest('DELETE', `/api/events/${e.id}/leave`, { userId });
        }
      }));

      queryClient.invalidateQueries({ queryKey: [`/api/user-city-interests/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/all-events`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user-event-interests/${userId}`] });

      toast({ 
        title: "Cleared", 
        description: `Removed all items from ${cityName}` 
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove items", variant: "destructive" });
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
    const cities: Record<string, { activities: UserActivity[], events: UserEvent[], travelPlan?: { cityName: string; tripId: number; startDate: string; endDate: string; fullDestination: string; isPast: boolean } }> = {};

    allActivities.forEach(activity => {
      const consolidatedCity = consolidateCity(activity.cityName);
      if (!cities[consolidatedCity]) {
        cities[consolidatedCity] = { activities: [], events: [] };
      }
      cities[consolidatedCity].activities.push(activity);
    });

    allEvents.forEach(event => {
      // Extract city from location field since cityName might not exist
      let cityName = event.cityName;
      
      if (!cityName && event.location) {
        // Try to extract city from location string like "Hollywood Bowl, Los Angeles" or "3200 The Strand, Manhattan Beach, California"
        const locationParts = event.location.split(',').map((part: string) => part.trim()).filter((part: string) => part && part !== 'undefined');
        
        if (locationParts.length >= 3) {
          // Format: "Address, City, State" - take the middle part (city)
          cityName = locationParts[locationParts.length - 2];
        } else if (locationParts.length === 2) {
          // Format: "Address, City" or "City, State" - take the last part 
          cityName = locationParts[1];
        } else if (locationParts.length === 1) {
          // Single location string - try to extract from words
          const words = locationParts[0].split(' ').filter((word: string) => word && word !== 'undefined');
          // Look for city names in the string
          cityName = words[words.length - 1] || 'Other';
        } else {
          cityName = 'Other';
        }
        
        // Clean up common state abbreviations from city names
        if (cityName === 'California' || cityName === 'CA') {
          cityName = 'Los Angeles'; // Default for California events
        }
      }
      
      if (!cityName) cityName = 'Other';
      
      const consolidatedCity = consolidateCity(cityName);
      if (!cities[consolidatedCity]) {
        cities[consolidatedCity] = { activities: [], events: [] };
      }
      cities[consolidatedCity].events.push(event);
    });

    // Also add cities from travel destinations (even if no activities/events yet)
    travelDestinations.forEach(dest => {
      const consolidatedCity = consolidateCity(dest.cityName);
      if (!cities[consolidatedCity]) {
        cities[consolidatedCity] = { activities: [], events: [], travelPlan: dest };
      } else {
        // Add travel plan info to existing city
        cities[consolidatedCity].travelPlan = dest;
      }
    });

    return cities;
  }, [allActivities, allEvents, travelDestinations]);

  // Sort cities: hometown first (no travel plan), then current trip, then planned, then past
  const cities = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return Object.keys(citiesByName).sort((a, b) => {
      const aPlan = citiesByName[a].travelPlan;
      const bPlan = citiesByName[b].travelPlan;
      
      // Cities without travel plans (hometown) go FIRST
      if (!aPlan && !bPlan) return 0;
      if (!aPlan) return -1;  // a is hometown, put first
      if (!bPlan) return 1;   // b is hometown, put first
      
      const aStart = new Date(aPlan.startDate);
      const aEnd = new Date(aPlan.endDate);
      const bStart = new Date(bPlan.startDate);
      const bEnd = new Date(bPlan.endDate);
      
      aEnd.setHours(23, 59, 59, 999);
      bEnd.setHours(23, 59, 59, 999);
      
      const aIsPast = aEnd < now;
      const bIsPast = bEnd < now;
      const aIsCurrent = aStart <= now && aEnd >= now;
      const bIsCurrent = bStart <= now && bEnd >= now;
      
      // Current trips second (after hometown)
      if (aIsCurrent && !bIsCurrent) return -1;
      if (!aIsCurrent && bIsCurrent) return 1;
      
      // Past trips last
      if (aIsPast && !bIsPast) return 1;
      if (!aIsPast && bIsPast) return -1;
      
      // Within same category, sort by start date (earliest first for planned, latest first for past)
      if (aIsPast && bIsPast) {
        // Past trips: most recent first
        return bEnd.getTime() - aEnd.getTime();
      }
      // Planned trips: earliest first
      return aStart.getTime() - bStart.getTime();
    });
  }, [citiesByName]);

  if (loadingCityActivities || loadingJoinedEvents || loadingEventInterests || loadingTravelPlans) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">⭐ Things I Want to Do in...</h2>
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  // If viewing another user's profile and they have no activities/events/trips, hide the entire widget
  if (!isOwnProfile && cities.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${isMobile ? 'p-4' : 'p-6'}`}>
      <h2 
        className={`font-semibold text-gray-900 dark:text-white mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}
        data-testid="things-i-want-to-do-section"
        data-section="things-i-want-to-do"
      >
        ⭐ Things I Want to Do in...
      </h2>

      {cities.length > 0 ? (
        <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
          {cities.map((cityName) => {
            const cityData = citiesByName[cityName];
            const isPastTrip = cityData.travelPlan?.isPast || false;
            
            return (
              <div key={cityName} className={isPastTrip ? 'opacity-50' : ''}>
                {/* City Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {cityData.travelPlan && (
                      <Plane className={`w-5 h-5 ${isPastTrip ? 'text-gray-400' : 'text-orange-500'}`} />
                    )}
                    <h3 className={`font-semibold text-xl ${isPastTrip ? 'text-gray-500 dark:text-gray-500' : 'text-blue-600 dark:text-blue-400'}`}>
                      {cityName}
                    </h3>
                    {cityData.travelPlan && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({new Date(cityData.travelPlan.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(cityData.travelPlan.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                      </span>
                    )}
                    {isPastTrip && (
                      <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600">
                        Past
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwnProfile && !isPastTrip && (
                      <Link href={`/match-in-city?city=${encodeURIComponent(cityName)}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                          title={`Add activities in ${cityName}`}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          <span className="text-sm">Add Plans</span>
                        </Button>
                      </Link>
                    )}
                    {isOwnProfile && (cityData.activities.length > 0 || cityData.events.length > 0 || isPastTrip) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDialog({ open: true, cityName })}
                        className={isPastTrip 
                          ? "text-gray-500 hover:text-red-400 hover:bg-red-900/20 border border-gray-400 dark:border-gray-600" 
                          : "text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        }
                        title={isPastTrip ? `Clear past trip to ${cityName}` : `Remove all from ${cityName}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        <span className="text-sm">{isPastTrip ? 'Clear' : 'Remove'}</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Pills or empty state for this destination */}
                {(() => {
                  const citySubInterests = getSubInterestsForCity(cityName);
                  return (cityData.activities.length > 0 || cityData.events.length > 0 || (cityData.travelPlan && citySubInterests.length > 0)) ? (
                  <div className={`flex flex-wrap ${isMobile ? 'gap-2' : 'gap-2'}`}>

                    {/* Sub-Interest Pills - Show for travel destinations (city-specific) */}
                    {cityData.travelPlan && citySubInterests.map((subInterest, idx) => (
                      <div key={`sub-${idx}-${subInterest}`} className="relative group">
                        <div className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-medium bg-gradient-to-r from-orange-500 to-yellow-500 border-0 h-7 min-w-[4rem] leading-none whitespace-nowrap shadow-sm">
                          <span style={{ color: 'white' }}>✨ {subInterest}</span>
                        </div>
                      </div>
                    ))}

                    {/* Activity Pills */}
                    {cityData.activities.map((activity) => (
                      <div key={`act-${activity.id}`} className="relative group">
                        <div className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-medium bg-gradient-to-r from-blue-600 to-blue-500 border-0 h-7 min-w-[4rem] leading-none whitespace-nowrap shadow-sm">
                          <span style={{ color: 'black' }}>{activity.activityName}</span>
                        </div>
                        {isOwnProfile && (
                          <button
                            onClick={() => deleteActivity.mutate(activity.id)}
                            className="absolute bg-gray-400 hover:bg-gray-500 text-white rounded-full flex items-center justify-center transition-opacity -top-1 -right-1 w-5 h-5 sm:opacity-0 sm:group-hover:opacity-100 opacity-80"
                            title="Remove activity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Event Pills - Clickable to go to event page */}
                    {cityData.events.map((event) => {
                      const eventId = (event as any).eventId || event.id;
                      const eventUrl = `/events/${eventId}`;
                      const eventDate = (event as any).date || (event as any).eventDate;
                      const isEventPast = eventDate ? new Date(eventDate) < new Date() : false;
                      
                      return (
                        <div key={`evt-${event.id}`} className={`relative group ${isEventPast ? 'opacity-60' : ''}`}>
                          <Link href={eventUrl}>
                            <div className={`inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-medium border-0 h-7 min-w-[4rem] leading-none whitespace-nowrap shadow-sm cursor-pointer transition-all hover:scale-105 ${isEventPast ? 'bg-gradient-to-r from-gray-500 to-gray-400' : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600'}`}>
                              <span style={{ color: 'black' }}>{isEventPast ? '⏰' : '📅'} {event.eventTitle || (event as any).title}</span>
                            </div>
                          </Link>
                          {isOwnProfile && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteEvent.mutate(event);
                              }}
                              className="absolute bg-gray-400 hover:bg-gray-500 text-white rounded-full flex items-center justify-center transition-opacity -top-1 -right-1 w-5 h-5 sm:opacity-0 sm:group-hover:opacity-100 opacity-80"
                              title="Remove event"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                  </div>
                ) : null;
                })()}
              </div>
            );
          })}
        </div>
      ) : (
        <Link href="/match-in-city">
          <div className="text-center py-12 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
            <p className={`text-orange-600 dark:text-orange-500 font-semibold mb-3 ${isMobile ? 'text-base' : 'text-xl'}`}>
              No activities or events selected yet.
            </p>
            <p className={`text-orange-500 dark:text-orange-400 underline hover:text-orange-600 dark:hover:text-orange-300 ${isMobile ? 'text-sm' : 'text-lg'}`}>
              Go to City Plans to select activities and events!
            </p>
          </div>
        </Link>
      )}
      <AlertDialog open={!!confirmDialog?.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">Remove {confirmDialog?.cityName}?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              This will remove all activities and events you've saved for {confirmDialog?.cityName} from your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (confirmDialog?.cityName) {
                  executeCityDelete(confirmDialog.cityName);
                }
                setConfirmDialog(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}