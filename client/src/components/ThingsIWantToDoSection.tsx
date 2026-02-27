import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Trash2, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useEffect, useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "wouter";
import { getMetroCities } from "@shared/metro-areas";

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

  // Hometown city key for lookup (consolidated) and display name
  const hometownCityKey = useMemo(() => {
    const hometown = userProfile?.hometownCity;
    if (hometown) return consolidateCity(hometown);
    // Fallback: first city without a travel plan
    const firstHometown = cities.find(c => !citiesByName[c].travelPlan);
    return firstHometown || '';
  }, [userProfile?.hometownCity, cities, citiesByName]);

  // Display: city name only, no labels like "Hometown" or "My Hometown"
  const hometownDisplayName = userProfile?.hometownCity || hometownCityKey || (isOwnProfile ? 'Add your city' : '');

  // Current destination - only when user is actively traveling (startDate <= now <= endDate)
  const { isCurrentlyTraveling, currentDestination } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    for (const dest of travelDestinations) {
      const start = new Date(dest.startDate);
      const end = new Date(dest.endDate);
      end.setHours(23, 59, 59, 999);
      if (start <= now && end >= now && !dest.isPast) {
        return { isCurrentlyTraveling: true, currentDestination: dest };
      }
    }
    return { isCurrentlyTraveling: false, currentDestination: null };
  }, [travelDestinations]);

  const currentDestCityKey = currentDestination ? consolidateCity(currentDestination.cityName) : '';

  if (loadingCityActivities || loadingJoinedEvents || loadingEventInterests || loadingTravelPlans || loadingProfile) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Things I Want to Do in:</h2>
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  // If viewing another user's profile and they have no activities/events/trips, hide the entire widget
  if (!isOwnProfile && cities.length === 0) {
    return null;
  }

  // Render a single city row: city name (no label) | activity pills | + Add Plans
  const renderCityRow = (cityKey: string, displayName: string, isDestination: boolean) => {
    const cityData = (cityKey && citiesByName[cityKey]) || { activities: [], events: [], travelPlan: null };
    const citySubInterests = getSubInterestsForCity(cityKey);
    const hasContent = cityData.activities.length > 0 || cityData.events.length > 0 || (cityData.travelPlan && citySubInterests.length > 0);

    return (
      <div key={cityKey} className="flex flex-wrap items-center gap-2 py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0 first:pt-0">
        <span className={`font-semibold shrink-0 basis-full sm:basis-auto ${isDestination ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`}>
          {displayName}
        </span>
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Sub-Interest Pills - for travel destinations */}
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
          {/* Event Pills */}
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
        <div className="flex items-center gap-2 shrink-0">
          {isOwnProfile && (
            <Link href={cityKey ? `/match-in-city?city=${encodeURIComponent(getMetroCities(cityKey).length > 0 ? getMetroCities(cityKey)[0] : cityKey)}` : '/match-in-city'}>
              <Button
                variant="outline"
                size="sm"
                className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 h-8 text-xs"
                title={`Add activities in ${displayName}`}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Plans
              </Button>
            </Link>
          )}
          {isOwnProfile && cityKey && (hasContent || cityData.travelPlan?.isPast) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDialog({ open: true, cityName: cityKey })}
              className={`h-8 text-xs ${cityData.travelPlan?.isPast 
                ? "text-gray-500 hover:text-red-400 hover:bg-red-900/20 border border-gray-400 dark:border-gray-600" 
                : "text-red-400 hover:text-red-300 hover:bg-red-900/20"
              }`}
              title={cityData.travelPlan?.isPast ? `Clear past trip to ${displayName}` : `Remove all from ${displayName}`}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              {cityData.travelPlan?.isPast ? 'Clear' : 'Remove'}
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Build rows: Show ALL cities with activities/events (not just hometown + current destination)
  // This ensures Group 1, 2, 3, and Get More Specific activities from all cities appear on profile
  const rowsToShow: { key: string; displayName: string; isDestination: boolean }[] = [];
  const addedKeys = new Set<string>();
  // Row 1: Hometown - always show first for own profile
  if (hometownCityKey) {
    rowsToShow.push({ key: hometownCityKey, displayName: hometownDisplayName, isDestination: false });
    addedKeys.add(hometownCityKey);
  } else if (cities.length > 0) {
    const firstHometown = cities.find(c => !citiesByName[c].travelPlan);
    if (firstHometown) {
      rowsToShow.push({ key: firstHometown, displayName: firstHometown, isDestination: false });
      addedKeys.add(firstHometown);
    } else {
      rowsToShow.push({ key: '', displayName: hometownDisplayName, isDestination: false });
    }
  } else {
    rowsToShow.push({ key: '', displayName: hometownDisplayName, isDestination: false });
  }
  // Row 2: Current destination - only if currently traveling (and not same as hometown)
  if (isCurrentlyTraveling && currentDestCityKey && !addedKeys.has(currentDestCityKey)) {
    rowsToShow.push({ key: currentDestCityKey, displayName: currentDestination!.cityName, isDestination: true });
    addedKeys.add(currentDestCityKey);
  }
  // Rows 3+: All other cities with activities or events (future trips, past trips, etc.)
  cities.forEach(cityKey => {
    if (addedKeys.has(cityKey)) return;
    const cityData = citiesByName[cityKey];
    const hasContent = cityData.activities.length > 0 || cityData.events.length > 0 || (cityData.travelPlan && (getSubInterestsForCity(cityKey).length > 0));
    if (hasContent) {
      const displayName = cityData.travelPlan?.cityName || cityKey;
      rowsToShow.push({ key: cityKey, displayName, isDestination: !!cityData.travelPlan });
      addedKeys.add(cityKey);
    }
  });
  const uniqueRows = rowsToShow.filter((r, i, arr) => arr.findIndex(x => x.key === r.key) === i);
  const showContent = isOwnProfile ? uniqueRows.length > 0 : cities.length > 0;

  return (
    <div 
      data-testid="things-i-want-to-do-section"
      data-section="things-i-want-to-do"
    >
      {showContent ? (
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${isMobile ? 'p-4' : 'p-6'}`}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Things I Want to Do in:</h2>
          <div className="space-y-0">
            {uniqueRows.map(({ key, displayName, isDestination }) => renderCityRow(key, displayName, isDestination))}
          </div>
        </div>
      ) : (
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${isMobile ? 'p-4' : 'p-6'}`}>
          <h2 className={`font-semibold text-gray-900 dark:text-white mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>
            Things I Want to Do in:
          </h2>
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
        </div>
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