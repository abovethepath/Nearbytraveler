import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { MapPin, Trash2, Plus, Pencil, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useEffect, useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link, useLocation } from "wouter";
import { getMetroAreaName, getMetroCities } from "@shared/metro-areas";
import { Building2 } from "lucide-react";
import { resolveAndJoinHostelChatroom } from "@/lib/hostelChatrooms";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { profileEditButtonClass } from "@/components/profile/editButtonClass";
import SubInterestSelector from "@/components/SubInterestSelector";

function useIsDarkModeClass() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.documentElement;
    const update = () => setIsDark(el.classList.contains("dark"));
    update();

    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

type CityAccent = {
  darkBg: string;
  accent: string; // border + text in dark mode
};

const CITY_ACCENTS: CityAccent[] = [
  { darkBg: "#7C3500", accent: "#FF8C42" }, // orange (LA)
  { darkBg: "#0F3D2E", accent: "#34D399" }, // teal (Austin)
  { darkBg: "#3B1F6B", accent: "#C084FC" }, // purple (Paris)
  { darkBg: "#0D2F5E", accent: "#60A5FA" }, // blue (Tokyo)
];

function hashToIndex(input: string, mod: number) {
  const s = String(input || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return mod > 0 ? h % mod : 0;
}

function getCityAccent(cityLike: string): CityAccent {
  const raw = String(cityLike || "").trim().toLowerCase();
  if (raw.includes("los angeles")) return CITY_ACCENTS[0];
  if (raw.includes("austin")) return CITY_ACCENTS[1];
  if (raw.includes("paris")) return CITY_ACCENTS[2];
  if (raw.includes("tokyo")) return CITY_ACCENTS[3];
  return CITY_ACCENTS[hashToIndex(raw, CITY_ACCENTS.length)];
}

function hexToRgb(hex: string) {
  const h = String(hex || "").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return { r: 0, g: 0, b: 0 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
  hostelName?: string | null;
  hostelVisibility?: string | null; // 'private' | 'public'
  startDate: string;
  endDate: string;
  status: string;
}

function shouldShowThingsNudge(userId: number) {
  try {
    const raw = localStorage.getItem(`nt_nudges_${userId}`);
    const s = raw ? JSON.parse(raw) : { logins: 0, thingsToDo: false };
    return (s.logins || 0) <= 5 && !s.thingsToDo;
  } catch { return false; }
}

export function ThingsIWantToDoSection({ userId, isOwnProfile }: ThingsIWantToDoSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const isDarkModeClass = useIsDarkModeClass();
  const [, setLocation] = useLocation();
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; cityName: string } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editCityKey, setEditCityKey] = useState<string>("");
  const [newActivityName, setNewActivityName] = useState("");
  const [editSubInterests, setEditSubInterests] = useState<string[]>([]);
  const [subInterestsDirty, setSubInterestsDirty] = useState(false);

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

  const [localLocationSharingEnabled, setLocalLocationSharingEnabled] = useState<boolean>(false);
  useEffect(() => {
    if (!isOwnProfile) return;
    setLocalLocationSharingEnabled(!!(userProfile as any)?.locationSharingEnabled);
  }, [isOwnProfile, (userProfile as any)?.locationSharingEnabled]);

  const updateLocationSharingMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return apiRequest("PUT", `/api/users/${userId}`, { locationSharingEnabled: enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
    },
    onError: () => {
      setLocalLocationSharingEnabled(!!(userProfile as any)?.locationSharingEnabled);
      toast?.({
        title: "Error",
        description: "Failed to update location visibility",
        variant: "destructive",
      });
    },
  });

  const handleLocationVisibilityToggle = (enabled: boolean) => {
    if (!isOwnProfile) return;
    setLocalLocationSharingEnabled(enabled);
    updateLocationSharingMutation.mutate(enabled);

    if (enabled && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          apiRequest("POST", `/api/users/${userId}/location`, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            locationSharingEnabled: true,
          }).catch(() => {
            // Preference already saved; best-effort coordinate update only
          });
        },
        () => {
          // Preference already saved; best-effort coordinate update only
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    }
  };
  
  // Get user's sub-interests (specific interests like Pickleball, Yoga, etc.)
  // Sub-interests are stored as "CityName: SubInterest" format - extract by city
  const getSubInterestsForCity = (cityName: string): string[] => {
    if (!userProfile?.subInterests || !Array.isArray(userProfile.subInterests)) {
      return [];
    }
    const cityPrefix = `${cityName}: `;
    return userProfile.subInterests
      .filter((si: string) => si.startsWith(cityPrefix))
      .map((si: string) => si.replace(cityPrefix, '').trim())
      .filter(Boolean);
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
          hostelName: (plan as any).hostelName,
          hostelVisibility: (plan as any).hostelVisibility,
          destinationState: (plan as any).destinationState,
          destinationCountry: (plan as any).destinationCountry,
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

  const addActivity = useMutation({
    mutationFn: async (payload: { cityName: string; activityName: string }) => {
      const response = await apiRequest("POST", "/api/user-city-interests", payload);
      if (!response.ok) {
        const data = await response.json().catch(() => ({} as any));
        throw new Error(data?.error || data?.message || "Failed to add activity");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user-city-interests/${userId}`] });
      toast({ title: "Added", description: "Added to your list." });
      setNewActivityName("");
      if (isOwnProfile) {
        try {
          const key = `nt_nudges_${userId}`;
          const raw = localStorage.getItem(key);
          const s = raw ? JSON.parse(raw) : { logins: 0 };
          s.thingsToDo = true;
          localStorage.setItem(key, JSON.stringify(s));
        } catch {}
      }
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to add activity",
        variant: "destructive",
      });
    },
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
    const metro = getMetroAreaName(cityName);
    if (metro && metro !== cityName) return metro;

    const userMetro = (userProfile as any)?.metropolitanArea as string | undefined;
    if (!userMetro) return metro;

    const hometown = (userProfile as any)?.hometownCity as string | undefined;
    const profileLocationCity = typeof (userProfile as any)?.location === "string"
      ? String((userProfile as any).location).split(",")[0]?.trim()
      : undefined;

    const normalized = String(cityName || "").trim().toLowerCase();
    const normalizedHometown = String(hometown || "").trim().toLowerCase();
    const normalizedProfileCity = String(profileLocationCity || "").trim().toLowerCase();

    // If the city is the user's signup/home city (even if it's a neighborhood), display metro area name.
    if (normalized && (normalized === normalizedHometown || normalized === normalizedProfileCity)) {
      return userMetro;
    }

    // If this city is one of the metro's member cities, use the metro area name.
    const metroCities = getMetroCities(userMetro).map((c) => c.trim().toLowerCase());
    if (metroCities.includes(normalized)) return userMetro;

    return metro;
  };

  // Group by city with metro consolidation - memoized to prevent infinite re-renders
  const citiesByName = useMemo(() => {
    const cities: Record<string, { activities: UserActivity[], events: UserEvent[], travelPlan?: { cityName: string; tripId: number; startDate: string; endDate: string; fullDestination: string; hostelName?: string | null; hostelVisibility?: string | null; isPast: boolean } }> = {};

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
  const hometownDisplayName = consolidateCity(userProfile?.hometownCity || hometownCityKey || (isOwnProfile ? 'Add your city' : ''));

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
      <div className="rounded-2xl border-2 border-orange-200/70 dark:border-orange-700/50 bg-gradient-to-br from-orange-50 via-white to-white dark:from-[#24140b] dark:via-gray-900/40 dark:to-gray-900 shadow-lg p-6">
        <h2 className="text-2xl md:text-3xl font-black text-[#1a1a1a] dark:text-white mb-6 flex items-center gap-2">
          <span aria-hidden>✈️</span>
          <span>📍 Things I Want to Do in:</span>
        </h2>
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const otherUsername = (userProfile as any)?.username ? `@${(userProfile as any).username}` : "@username";

  const openPrefilledDmForCity = (cityLabel: string) => {
    const city = String(cityLabel || "").split(",")[0]?.trim() || "this city";
    const prefilledMessage = `Hey! I noticed you haven't filled out your plans for ${city} yet — what are you hoping to do there?`;
    setLocation(`/messages?userId=${encodeURIComponent(String(userId))}&prefill=${encodeURIComponent(prefilledMessage)}`);
  };

  const normalizeCityItems = (cityKey: string) => {
    const cityData = (cityKey && citiesByName[cityKey]) || { activities: [], events: [], travelPlan: null };
    const activities = (cityData.activities || []).filter((a: any) => String(a?.activityName || "").trim().length > 0);
    const events = (cityData.events || []).filter((e: any) => String(e?.eventTitle || (e as any)?.title || "").trim().length > 0);
    const subInterests = getSubInterestsForCity(cityKey);
    return { cityData, activities, events, subInterests };
  };

  // Render a single city row: city name (no label) | activity pills | + Add Plans
  const renderCityRow = (cityKey: string, displayName: string, isDestination: boolean) => {
    const { cityData, activities, events, subInterests: citySubInterests } = normalizeCityItems(cityKey);
    const hasContent = activities.length > 0 || events.length > 0 || (cityData.travelPlan && citySubInterests.length > 0);
    const showHostel =
      !!cityData.travelPlan?.hostelName &&
      (isOwnProfile || cityData.travelPlan?.hostelVisibility === "public");

    const accent = getCityAccent(displayName || cityKey);
    const cityBorder = isDarkModeClass ? rgba(accent.accent, 0.45) : rgba(accent.accent, 0.38);
    const citySurface = isDarkModeClass ? rgba(accent.darkBg, 0.28) : rgba(accent.accent, 0.10);
    const pillBaseClass =
      "h-8 px-4 rounded-full text-xs sm:text-sm font-semibold inline-flex items-center border shadow-sm transition-shadow";
    const pillStyle: React.CSSProperties = isDarkModeClass
      ? { backgroundColor: accent.darkBg, borderColor: rgba(accent.accent, 0.55), color: accent.accent }
      : { backgroundColor: rgba(accent.accent, 0.16), borderColor: rgba(accent.accent, 0.45), color: "#000000" };

    return (
      <div
        key={cityKey}
        className="relative rounded-xl p-3 sm:p-4 mb-3 last:mb-0 border"
        style={{ borderColor: cityBorder, backgroundColor: citySurface }}
      >
        {/* Header row: city label + actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div
              className="text-base sm:text-lg font-extrabold truncate flex items-center gap-2"
              title={displayName}
              style={{ color: isDarkModeClass ? accent.accent : "#111827" }}
            >
              <span aria-hidden>📍</span>
              <span className="truncate">{displayName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isOwnProfile && (
              <Link href={cityKey ? `/match-in-city?city=${encodeURIComponent(getMetroCities(cityKey).length > 0 ? getMetroCities(cityKey)[0] : cityKey)}` : '/match-in-city'}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
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

        {/* Pills row: activities/events below header */}
        <div className="mt-2 flex flex-wrap gap-2">
          {/* Public hostel (trip) */}
          {showHostel && (
            <button
              type="button"
              className={`${pillBaseClass} hover:shadow-md hover:underline underline-offset-2 text-left`}
              style={pillStyle}
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  // IMPORTANT: Use the trip's underlying destination city (not a metro display label)
                  const city = String(cityData.travelPlan?.cityName || cityData.travelPlan?.fullDestination || "").split(",")[0]?.trim();
                  const country = (cityData.travelPlan as any)?.destinationCountry || "United States";
                  const result = await resolveAndJoinHostelChatroom({
                    hostelName: String(cityData.travelPlan?.hostelName || ""),
                    city,
                    country,
                  });
                  setLocation(`/chatroom/${result.chatroomId}`);
                } catch (err: any) {
                  toast?.({
                    title: "Can't open hostel chatroom",
                    description: err?.message || "Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              data-testid="button-open-hostel-chatroom"
            >
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span className="break-words">Staying at {cityData.travelPlan?.hostelName}</span>
              </span>
            </button>
          )}
          {/* Sub-Interest Pills - for travel destinations */}
          {cityData.travelPlan && citySubInterests.map((subInterest, idx) => (
            <div key={`sub-${idx}-${subInterest}`} className="relative group">
              <div className={pillBaseClass} style={pillStyle}>
                ✨ {subInterest}
              </div>
            </div>
          ))}

          {/* Activity Pills (display only; editing happens in modal) */}
          {activities.map((activity: any) => (
            <div key={`act-${activity.id}`} className="relative">
              <div
                className={`${pillBaseClass} hover:shadow-[0_0_12px_rgba(0,0,0,0.12)]`}
                style={pillStyle}
              >
                {activity.activityName}
              </div>
            </div>
          ))}

          {/* Event Pills (display only; editing happens in modal) */}
          {events.map((event: any) => {
            const eventId = (event as any).eventId || event.id;
            const eventUrl = `/events/${eventId}`;
            const eventDate = (event as any).date || (event as any).eventDate;
            const isEventPast = eventDate ? new Date(eventDate) < new Date() : false;
            return (
              <div key={`evt-${event.id}`} className={`relative ${isEventPast ? 'opacity-60' : ''}`}>
                <Link href={eventUrl}>
                  <div
                    className={`${pillBaseClass} cursor-pointer transition-all md:hover:scale-105 hover:shadow-md`}
                    style={pillStyle}
                  >
                    {isEventPast ? '⏰' : '📅'} {event.eventTitle || (event as any).title}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Other-user: per-city prompt when the row exists but has no items */}
        {!isOwnProfile && activities.length === 0 && events.length === 0 && (!cityData.travelPlan || citySubInterests.length === 0) && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => openPrefilledDmForCity(displayName)}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline underline-offset-2"
              data-testid={`button-ask-plans-prefill-dm-row-${encodeURIComponent(cityKey)}`}
            >
              Ask {otherUsername} what they&apos;re planning to do here →
            </button>
          </div>
        )}
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
      rowsToShow.push({ key: firstHometown, displayName: consolidateCity(firstHometown), isDestination: false });
      addedKeys.add(firstHometown);
    } else {
      rowsToShow.push({ key: '', displayName: hometownDisplayName, isDestination: false });
    }
  } else {
    rowsToShow.push({ key: '', displayName: hometownDisplayName, isDestination: false });
  }
  // Row 2: Current destination - only if currently traveling (and not same as hometown)
  if (isCurrentlyTraveling && currentDestCityKey && !addedKeys.has(currentDestCityKey)) {
    rowsToShow.push({ key: currentDestCityKey, displayName: consolidateCity(currentDestination!.cityName), isDestination: true });
    addedKeys.add(currentDestCityKey);
  }
  // Rows 3+: All other cities with activities or events (future trips, past trips, etc.)
  cities.forEach(cityKey => {
    if (addedKeys.has(cityKey)) return;
    const { cityData, activities, events, subInterests } = normalizeCityItems(cityKey);
    const hasContent = activities.length > 0 || events.length > 0 || (cityData.travelPlan && (subInterests.length > 0));
    if (hasContent) {
      const displayName = consolidateCity(cityData.travelPlan?.cityName || cityKey);
      rowsToShow.push({ key: cityKey, displayName, isDestination: !!cityData.travelPlan });
      addedKeys.add(cityKey);
    }
  });
  const uniqueRows = rowsToShow.filter((r, i, arr) => arr.findIndex(x => x.key === r.key) === i);
  const showContent = isOwnProfile ? uniqueRows.length > 0 : cities.length > 0;
  const headerCity = (uniqueRows[0]?.displayName || userProfile?.hometownCity || "").split(",")[0]?.trim() || "this city";
  const openPrefilledDm = () => openPrefilledDmForCity(headerCity);

  return (
    <div 
      data-testid="things-i-want-to-do-section"
      data-section="things-i-want-to-do"
    >
      {showContent ? (
        <div className={`rounded-2xl border-2 border-orange-200/70 dark:border-orange-700/50 bg-gradient-to-br from-orange-50 via-white to-white dark:from-[#24140b] dark:via-gray-900/40 dark:to-gray-900 shadow-lg ${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-2xl md:text-3xl font-black text-[#1a1a1a] dark:text-white flex items-center gap-2">
              <span aria-hidden>✈️</span>
              <span>📍 Things I Want to Do in:</span>
            </h2>
            {isOwnProfile && (
              <div className="flex items-center gap-2">
                {shouldShowThingsNudge(userId) && (
                  <span className="text-red-500 dark:text-red-400 text-xs font-semibold whitespace-nowrap nudge-pulse">
                    The more you add, the better your matches →
                  </span>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditCityKey(hometownCityKey || uniqueRows.find((r) => !!r.key)?.key || "");
                    setEditSubInterests(userProfile?.subInterests || []);
                    setSubInterestsDirty(false);
                    setEditOpen(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0 shadow-md hover:shadow-lg"
                  data-testid="button-edit-things-to-do"
                >
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Edit
                </Button>
              </div>
            )}
          </div>
          {isOwnProfile && (
            <div className="mb-4 flex items-center gap-2" data-testid="location-visibility-toggle-row">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className={localLocationSharingEnabled ? "w-4 h-4 text-green-600 dark:text-green-400" : "w-4 h-4 text-gray-500 dark:text-gray-400"} />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  Make myself visible
                </span>
              </div>
              <Switch
                checked={!!localLocationSharingEnabled}
                onCheckedChange={handleLocationVisibilityToggle}
                disabled={updateLocationSharingMutation.isPending}
                className="scale-[0.7] origin-left shrink-0"
              />
            </div>
          )}
          <div className="space-y-0">
            {uniqueRows.map(({ key, displayName, isDestination }) => renderCityRow(key, displayName, isDestination))}
          </div>
          {/* Per-city prompts are shown inline on empty rows for other-user profiles. */}
        </div>
      ) : (
        <div className={`rounded-2xl border-2 border-orange-200/70 dark:border-orange-700/50 bg-gradient-to-br from-orange-50 via-white to-white dark:from-[#24140b] dark:via-gray-900/40 dark:to-gray-900 shadow-lg ${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className={`font-black text-[#1a1a1a] dark:text-white flex items-center gap-2 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              <span aria-hidden>✈️</span>
              <span>📍 Things I Want to Do in{isOwnProfile ? ":" : ` ${headerCity}:`}</span>
            </h2>
            {isOwnProfile && (
              <div className="flex items-center gap-2">
                {shouldShowThingsNudge(userId) && (
                  <span className="text-red-500 dark:text-red-400 text-xs font-semibold whitespace-nowrap nudge-pulse">
                    The more you add, the better your matches →
                  </span>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditCityKey(hometownCityKey || uniqueRows.find((r) => !!r.key)?.key || "");
                    setEditSubInterests(userProfile?.subInterests || []);
                    setSubInterestsDirty(false);
                    setEditOpen(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0 shadow-md hover:shadow-lg"
                  data-testid="button-edit-things-to-do"
                >
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Edit
                </Button>
              </div>
            )}
          </div>
          {isOwnProfile && (
            <div className="mb-4 flex items-center gap-2" data-testid="location-visibility-toggle-row">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className={localLocationSharingEnabled ? "w-4 h-4 text-green-600 dark:text-green-400" : "w-4 h-4 text-gray-500 dark:text-gray-400"} />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  Make myself visible
                </span>
              </div>
              <Switch
                checked={!!localLocationSharingEnabled}
                onCheckedChange={handleLocationVisibilityToggle}
                disabled={updateLocationSharingMutation.isPending}
                className="scale-[0.7] origin-left shrink-0"
              />
            </div>
          )}
          {isOwnProfile ? (
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
          ) : (
            <div className="py-8">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No plans added yet.
              </p>
              <button
                type="button"
                onClick={openPrefilledDm}
                className="mt-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline underline-offset-2"
                data-testid="button-ask-plans-prefill-dm-empty"
              >
                Ask {otherUsername} what they&apos;re planning to do here →
              </button>
            </div>
          )}
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

      {/* Current user only: edit widget/modal to manage items without inline X buttons */}
      {isOwnProfile && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-900">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Edit Things I Want to Do</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">City</label>
                  <select
                    value={editCityKey}
                    onChange={(e) => setEditCityKey(e.target.value)}
                    className="mt-1 w-full h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white px-2"
                    data-testid="select-things-to-do-city"
                  >
                    {(uniqueRows || [])
                      .filter((r) => !!r.key)
                      .map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.displayName}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">Add item</label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      value={newActivityName}
                      onChange={(e) => setNewActivityName(e.target.value)}
                      placeholder="Type something you want to do…"
                      className="h-9"
                      data-testid="input-add-thing-to-do"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const name = newActivityName.trim();
                        const city = String(editCityKey || "").trim();
                        if (!name || !city) return;
                        addActivity.mutate({ cityName: city, activityName: name });
                      }}
                      disabled={addActivity.isPending || !newActivityName.trim() || !editCityKey}
                      className="h-9"
                      data-testid="button-add-thing-to-do"
                    >
                      Add
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Items show as clean pills on your profile. Deletes only appear here.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <SubInterestSelector
                  selectedSubInterests={editSubInterests}
                  onSubInterestsChange={(newSubs) => {
                    setEditSubInterests(newSubs);
                    setSubInterestsDirty(true);
                  }}
                  excludeCategories={["tours"]}
                  showOptionalLabel={true}
                />
                {subInterestsDirty && (
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={async () => {
                        try {
                          await apiRequest("PATCH", `/api/users/${userId}`, { subInterests: editSubInterests });
                          queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
                          setSubInterestsDirty(false);
                          toast({ title: "Sub-interests saved" });
                        } catch (err) {
                          toast({ title: "Failed to save sub-interests", variant: "destructive" });
                        }
                      }}
                      className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0"
                    >
                      Save Sub-Interests
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-3 max-h-[45vh] overflow-auto pr-1">
                {uniqueRows
                  .filter((r) => !!r.key)
                  .map((r) => {
                    const cityKey = r.key;
                    const cityData = (cityKey && citiesByName[cityKey]) || { activities: [], events: [], travelPlan: null };
                    const cityActs = Array.isArray(cityData.activities) ? cityData.activities : [];
                    const cityEvts = Array.isArray(cityData.events) ? cityData.events : [];
                    const citySubInterests = getSubInterestsForCity(cityKey);
                    const hasAny =
                      cityActs.length > 0 || cityEvts.length > 0 || (Array.isArray(citySubInterests) && citySubInterests.length > 0);

                    if (!hasAny) return null;

                    return (
                      <div key={`edit-city-${cityKey}`} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-3">
                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate" title={r.displayName}>
                          {r.displayName}
                        </div>

                        {cityActs.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">Activities</div>
                            <div className="space-y-1">
                              {cityActs.map((a: any) => (
                                <div key={`edit-act-${a.id}`} className="flex items-center justify-between gap-2 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-1">
                                  <div className="text-sm text-gray-900 dark:text-white truncate">{a.activityName}</div>
                                  <button
                                    type="button"
                                    onClick={() => deleteActivity.mutate(a.id)}
                                    className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                                    title="Remove"
                                    data-testid={`button-delete-thing-${a.id}`}
                                  >
                                    <X className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {cityEvts.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">Events</div>
                            <div className="space-y-1">
                              {cityEvts.map((e: any) => (
                                <div key={`edit-evt-${e.id}`} className="flex items-center justify-between gap-2 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-1">
                                  <div className="text-sm text-gray-900 dark:text-white truncate">{e.eventTitle || e.title}</div>
                                  <button
                                    type="button"
                                    onClick={() => deleteEvent.mutate(e)}
                                    className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                                    title="Remove"
                                  >
                                    <X className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}