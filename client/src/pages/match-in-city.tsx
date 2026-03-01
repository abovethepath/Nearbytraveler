import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/App";
import { apiRequest, queryClient, getApiBaseUrl } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { METRO_AREAS } from "@shared/constants";
import { getMetroAreaName, getMetroCities } from "@shared/metro-areas";
import { SUB_INTEREST_CATEGORIES } from "@shared/base-options";
import SubInterestSelector from "@/components/SubInterestSelector";
import { isNativeIOSApp } from "@/lib/nativeApp";

function useIsDarkModeClass() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const el = document.documentElement;
    const update = () => setIsDark(el.classList.contains("dark"));
    update();

    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

// City Plan categories for user-created plans
const CITY_PICK_CATEGORIES = [
  { id: 'food', label: 'Food & Dining', emoji: '🍽️' },
  { id: 'nightlife', label: 'Nightlife', emoji: '🌙' },
  { id: 'culture', label: 'Culture & Arts', emoji: '🎭' },
  { id: 'outdoor', label: 'Outdoors', emoji: '🏞️' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'other', label: 'Other', emoji: '✨' },
];

// Detect if input looks like an event (has date/time patterns)
const looksLikeEvent = (text: string): boolean => {
  const datePatterns = [
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}/i,
    /\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    /\b\d{1,2}\/\d{1,2}/,
    /\b\d{1,2}-\d{1,2}/,
    /\b(tonight|tomorrow|today|this weekend|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b\d{1,2}(:\d{2})?\s*(am|pm)\b/i,
    /\bat\s+\d{1,2}/i,
  ];
  return datePatterns.some(pattern => pattern.test(text));
};

// Normalize string for comparison
const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
import { 
  MapPin, 
  Plus, 
  Users, 
  Heart, 
  Edit, 
  Trash2, 
  Search,
  Target,
  Zap,
  ArrowLeft,
  X,
  ChevronDown,
  Sparkles,
  MessageCircle,
  Map,
  Loader2,
  MoreHorizontal,
  RotateCcw,
  ExternalLink,
  Check
} from "lucide-react";

interface MatchInCityProps {
  cityName?: string;
}

interface UserProfile {
  id: number;
  username: string;
  activities?: string[];
  [key: string]: any;
}

export default function MatchInCity({ cityName }: MatchInCityProps = {}) {
  const [location, setLocation] = useLocation();
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const isDarkModeClass = useIsDarkModeClass();
  
  // iOS app fix: Fall back to localStorage if auth context is empty
  const user = authUser || (() => {
    try {
      const storedUser = localStorage.getItem('travelconnect_user');
      const authStorageUser = localStorage.getItem('user');
      if (storedUser) return JSON.parse(storedUser);
      if (authStorageUser) return JSON.parse(authStorageUser);
      return null;
    } catch {
      return null;
    }
  })();
  
  const [selectedCity, setSelectedCity] = useState<string>('');
  
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityDescription, setNewActivityDescription] = useState('');
  const [editActivityName, setEditActivityName] = useState('');
  const [editActivityDescription, setEditActivityDescription] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [cityActivities, setCityActivities] = useState<any[]>([]);
  const [matchingUsers, setMatchingUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [allCities, setAllCities] = useState<any[]>([]);
  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const [isCitiesLoading, setIsCitiesLoading] = useState(true);
  const [editingActivityName, setEditingActivityName] = useState('');
  const [activitySearchFilter, setActivitySearchFilter] = useState('');
  const [activeMobileSection, setActiveMobileSection] = useState<'popular' | 'ai' | 'preferences' | 'selected' | 'events' | 'all'>('all');
  const [customActivityText, setCustomActivityText] = useState('');
  const [addingCustomActivity, setAddingCustomActivity] = useState(false);

  // Clear All Plans Confirmation Dialog
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  
  // Add City Plan Modal State
  const [showAddPickModal, setShowAddPickModal] = useState(false);
  const [newPickName, setNewPickName] = useState('');
  const [newPickCategory, setNewPickCategory] = useState('other');
  const [newPickDate, setNewPickDate] = useState(''); // Optional date for dated plans like "Taylor Swift Jan 30"
  const [showEventSuggestion, setShowEventSuggestion] = useState(false);
  const [similarActivity, setSimilarActivity] = useState<{id: number, name: string} | null>(null);

  // Pagination for city activities
  const [displayedActivitiesLimit, setDisplayedActivitiesLimit] = useState(100);
  
  // AI Features State
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState(false);
  const [matchingInsight, setMatchingInsight] = useState<{ [userId: number]: any }>({});
  const [matchingInsightLoading, setMatchingInsightLoading] = useState<{ [userId: number]: boolean }>({});
  
  // Real Events State (from Ticketmaster/external APIs)
  const [realEvents, setRealEvents] = useState<any[]>([]);
  const [realEventsLoading, setRealEventsLoading] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  
  // Sub-Interests State (monetizable specific interests like Pickleball, Yoga, etc.)
  const [userSubInterests, setUserSubInterests] = useState<string[]>([]);
  const [subInterestsLoading, setSubInterestsLoading] = useState(false);
  
  // Dismissed AI activities (persisted in localStorage per city)
  const [dismissedAIActivities, setDismissedAIActivities] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(`dismissedAIActivities_${selectedCity}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  
  // Update dismissed activities when city changes
  useEffect(() => {
    if (selectedCity) {
      try {
        const saved = localStorage.getItem(`dismissedAIActivities_${selectedCity}`);
        setDismissedAIActivities(saved ? new Set(JSON.parse(saved)) : new Set());
      } catch {
        setDismissedAIActivities(new Set());
      }
      // Reset the activities display limit when changing cities
      setDisplayedActivitiesLimit(100);
    }
  }, [selectedCity]);
  
  const dismissAIActivity = (activityId: number) => {
    setDismissedAIActivities(prev => {
      const newSet = new Set(prev);
      newSet.add(activityId);
      // Persist to localStorage
      localStorage.setItem(`dismissedAIActivities_${selectedCity}`, JSON.stringify([...newSet]));
      return newSet;
    });
    toast({
      title: "Activity Dismissed",
      description: "This AI activity has been hidden from your view",
    });
  };

  // Hero section visibility state (for after city selection)
  const [isHeroVisible, setIsHeroVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('hideMatchInCityHero');
    return saved !== 'true'; // Default to visible
  });

  const toggleHeroVisibility = () => {
    const newValue = !isHeroVisible;
    setIsHeroVisible(newValue);
    localStorage.setItem('hideMatchInCityHero', String(!newValue));
  };
  
  // Hero section visibility state (for initial city selection screen)
  const [isInitialHeroVisible, setIsInitialHeroVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('hideMatchInitialHero');
    return saved !== 'true'; // Default to visible
  });

  const toggleInitialHeroVisibility = () => {
    const newValue = !isInitialHeroVisible;
    setIsInitialHeroVisible(newValue);
    localStorage.setItem('hideMatchInitialHero', String(!newValue));
  };

  // Fetch user profile to sync with existing activities
  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: [`/api/users/${user?.id}`],
    queryFn: () => fetch(`${getApiBaseUrl()}/api/users/${user?.id}`, { credentials: 'include' }).then(res => res.json()),
    enabled: !!user?.id
  });

  // Fetch user's travel plans to get destination cities (user-scoped endpoint)
  const { data: travelPlans } = useQuery<any[]>({
    queryKey: [`/api/travel-plans/${user?.id}`],
    queryFn: () => fetch(`${getApiBaseUrl()}/api/travel-plans/${user?.id}`, { credentials: 'include' }).then(res => res.json()),
    enabled: !!user?.id
  });

  // Helper: Check if a city belongs to a metro area and return the metro name
  const getMetroName = (cityName: string): string | null => {
    const lowerCity = cityName.toLowerCase();
    for (const [metroKey, metroConfig] of Object.entries(METRO_AREAS)) {
      const cities = (metroConfig as any).cities || [];
      if (cities.some((c: string) => c.toLowerCase() === lowerCity)) {
        return (metroConfig as any).metroName || metroKey;
      }
    }
    return null;
  };

  // Get user's relevant cities (hometown + travel destinations)
  // Uses userProfile for complete data since auth user may have minimal fields
  const getUserRelevantCities = () => {
    const relevantCityNames: string[] = [];
    
    const profile: any = userProfile || user;
    if (profile?.hometownCity) {
      const displayCity = getMetroAreaName(profile.hometownCity);
      relevantCityNames.push(displayCity.toLowerCase());
      if (displayCity !== profile.hometownCity) {
        relevantCityNames.push(profile.hometownCity.toLowerCase());
      }
    }
    
    if (profile?.destinationCity) {
      const displayDest = getMetroAreaName(profile.destinationCity);
      relevantCityNames.push(displayDest.toLowerCase());
      if (displayDest !== profile.destinationCity) {
        relevantCityNames.push(profile.destinationCity.toLowerCase());
      }
    }
    
    if (travelPlans && Array.isArray(travelPlans)) {
      const now = new Date();
      const gracePeriodDays = 3;
      
      travelPlans.forEach((plan: any) => {
        if (plan.endDate) {
          const endDate = new Date(plan.endDate);
          const gracePeriodEnd = new Date(endDate);
          gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);
          if (now > gracePeriodEnd) {
            return;
          }
        }
        
        const rawCityName = plan.destinationCity || plan.destination;
        if (rawCityName && plan.userId === user?.id) {
          const displayCity = getMetroAreaName(rawCityName);
          relevantCityNames.push(displayCity.toLowerCase());
          if (displayCity !== rawCityName) {
            relevantCityNames.push(rawCityName.toLowerCase());
          }
        }
      });
    }
    
    return [...new Set(relevantCityNames)]; // Remove duplicates
  };

  // Fetch all cities on component mount and handle URL city parameter
  useEffect(() => {
    // Check for city in URL params - this is used when coming from trip planning
    const urlParams = new URLSearchParams(window.location.search);
    const cityFromUrl = urlParams.get('city');
    
    if (cityFromUrl) {
      // IMPORTANT: Use the city from URL - this is how trip planning links work
      setSelectedCity(cityFromUrl);
      // Clear URL params after using them (clean URL)
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // No city in URL - start fresh
      setSelectedCity('');
    }
    
    fetchAllCities();
  }, []);
  
  // Build user's cities from profile and travel plans - always include these
  const getUserCitiesWithData = () => {
    const cities: any[] = [];
    const addedCityNames = new Set<string>();
    const profile: any = userProfile || user;
    
    const gradientOptions = [
      // Light mode: deeper, saturated blue→orange for contrast over photos.
      // Dark mode: keep previous softer overlays unchanged.
      "from-blue-900/90 to-orange-600/80 dark:from-orange-400/20 dark:to-blue-600/20",
      "from-blue-800/90 to-orange-500/80 dark:from-blue-400/20 dark:to-orange-600/20",
      "from-blue-900/90 to-amber-500/80 dark:from-blue-300/20 dark:to-orange-500/20",
    ];
    
    // Add hometown (use metro area name if applicable)
    if (profile?.hometownCity) {
      const displayCity = getMetroAreaName(profile.hometownCity);
      const cityLower = displayCity.toLowerCase();
      if (!addedCityNames.has(cityLower)) {
        addedCityNames.add(cityLower);
        const existingCity = allCities.find(c => c.city.toLowerCase() === cityLower);
        if (existingCity) {
          cities.push({ ...existingCity, isHometown: true });
        } else {
          cities.push({
            city: displayCity,
            country: profile.hometownCountry || '',
            state: profile.hometownState || '',
            gradient: gradientOptions[0],
            isHometown: true,
            isPlaceholder: true
          });
        }
      }
    }
    
    // Add all travel plan destinations (show trips until a few days after they end)
    if (travelPlans && Array.isArray(travelPlans)) {
      const now = new Date();
      const gracePeriodDays = 3; // Show trips for 3 days after they end
      
      travelPlans.forEach((plan: any, index: number) => {
        // Skip trips that ended more than gracePeriodDays ago
        if (plan.endDate) {
          const endDate = new Date(plan.endDate);
          const gracePeriodEnd = new Date(endDate);
          gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);
          if (now > gracePeriodEnd) {
            return; // Skip this past trip
          }
        }
        
        const rawCityName = plan.destinationCity || plan.destination;
        if (rawCityName && plan.userId === user?.id) {
          const displayCity = getMetroAreaName(rawCityName);
          const cityLower = displayCity.toLowerCase();
          if (!addedCityNames.has(cityLower)) {
            addedCityNames.add(cityLower);
            const existingCity = allCities.find(c => c.city.toLowerCase() === cityLower);
            if (existingCity) {
              cities.push({ ...existingCity, isTravelDestination: true });
            } else {
              cities.push({
                city: displayCity,
                country: plan.destinationCountry || '',
                state: plan.destinationState || '',
                gradient: gradientOptions[(index + 1) % gradientOptions.length],
                isTravelDestination: true,
                isPlaceholder: true
              });
            }
          }
        }
      });
    }
    
    return cities;
  };
  
  // Launch cities that have pre-built featured activities
  const LAUNCH_CITY_NAMES = [
    'Los Angeles', 'Los Angeles Metro', 'New York City', 'San Francisco', 'Austin', 'Chicago',
    'Miami', 'New Orleans', 'Tokyo', 'Paris', 'London', 'Rome',
    'Barcelona', 'Amsterdam', 'Bangkok', 'Singapore', 'Dubai', 'Istanbul'
  ];

  // Default to showing only user's hometown and travel destinations, with fallback to all cities
  useEffect(() => {
    // Build list of user's cities (hometown + travel destinations)
    const userCities = getUserCitiesWithData();
    
    if (userCities.length > 0) {
      // Always show user's own cities (hometown + travel destinations)
      setFilteredCities(userCities);
    } else if (allCities.length > 0) {
      // FALLBACK: Show all cities if user has no hometown or travel plans
      setFilteredCities(allCities);
    }
  }, [allCities, user, userProfile, travelPlans]);

  // Build launch cities list (cities with pre-built activities, excluding user's own cities)
  const getLaunchCities = () => {
    const userCityNames = getUserCitiesWithData().map(c => c.city.toLowerCase());
    return allCities.filter(city => 
      LAUNCH_CITY_NAMES.some(lc => lc.toLowerCase() === city.city.toLowerCase()) &&
      !userCityNames.includes(city.city.toLowerCase())
    );
  };

  // Fetch real events from Ticketmaster API (function declaration for hoisting)
  async function fetchRealEvents() {
    if (!selectedCity) return;
    
    setRealEventsLoading(true);
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/external-events/ticketmaster?city=${encodeURIComponent(selectedCity)}`);
      
      if (response.ok) {
        const data = await response.json();
        // Filter to only events in the next 30 days with valid dates
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        const upcomingEvents = (data.events || []).filter((event: any) => {
          if (!event.date) return false;
          const eventDate = new Date(event.date);
          // Check for valid date
          if (isNaN(eventDate.getTime())) return false;
          return eventDate >= now && eventDate <= thirtyDaysFromNow;
        });
        
        setRealEvents(upcomingEvents);
      } else {
        setRealEvents([]);
      }
    } catch (error) {
      console.error('Error fetching real events:', error);
      setRealEvents([]);
    } finally {
      setRealEventsLoading(false);
    }
  }
  
  // Fetch city activities when a city is selected
  useEffect(() => {
    if (selectedCity) {
      fetchCityActivities();
      fetchUserActivities();
      fetchMatchingUsers();
      fetchRealEvents();
      // Clear selected events when changing cities
      setSelectedEventIds(new Set());
      setShowAllEvents(false);
    }
  }, [selectedCity]);

  // Filter cities based on search - search ALL cities when typing
  useEffect(() => {
    if (citySearchTerm) {
      // When searching, search across ALL cities (both user's cities and database cities)
      const userCities = getUserCitiesWithData();
      const combinedCities = [...userCities];
      
      // Add any database cities not already in user's list
      allCities.forEach(city => {
        if (!combinedCities.find(c => c.city.toLowerCase() === city.city.toLowerCase())) {
          combinedCities.push(city);
        }
      });
      
      const filtered = combinedCities.filter(city => 
        city.city.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
        (city.state && city.state.toLowerCase().includes(citySearchTerm.toLowerCase())) ||
        (city.country && city.country.toLowerCase().includes(citySearchTerm.toLowerCase()))
      );
      setFilteredCities(filtered);
    } else {
      // When search is cleared, go back to showing user's cities (hometown + travel destinations)
      const userCities = getUserCitiesWithData();
      if (userCities.length > 0) {
        setFilteredCities(userCities);
      } else {
        // FALLBACK: Show all cities if user has no hometown or travel plans
        setFilteredCities(allCities);
      }
    }
  }, [citySearchTerm, allCities, user, userProfile, travelPlans]);

  // Sync userSubInterests from userActivities - sub-interests are persisted as user-city-interests
  useEffect(() => {
    if (!selectedCity) {
      setUserSubInterests([]);
      return;
    }
    const allSubInterests = SUB_INTEREST_CATEGORIES.flatMap(c => c.subInterests);
    const citySubs = userActivities
      .filter(ua => ua.cityName === selectedCity && allSubInterests.includes(ua.activityName))
      .map(ua => ua.activityName);
    setUserSubInterests(citySubs);
  }, [selectedCity, userActivities]);
  
  // Handler to update sub-interests - persist to user-city-interests so they appear on profile
  const handleSubInterestsChange = async (newSubInterests: string[]) => {
    const storedUser = localStorage.getItem('travelconnect_user') || localStorage.getItem('user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null);
    const userId = actualUser?.id;
    if (!userId || !selectedCity) {
      setUserSubInterests(newSubInterests);
      return;
    }
    const prev = userSubInterests;
    const added = newSubInterests.filter(s => !prev.includes(s));
    const removed = prev.filter(s => !newSubInterests.includes(s));
    setUserSubInterests(newSubInterests);
    setSubInterestsLoading(true);
    const apiBase = getApiBaseUrl();
    try {
      for (const subInterest of added) {
        const res = await fetch(`${apiBase}/api/user-city-interests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': String(userId) },
          body: JSON.stringify({ activityName: subInterest, cityName: selectedCity })
        });
        if (res.ok) {
          const created = await res.json();
          if (created.removed) {
            setUserActivities(u => u.filter(x => x.activityName !== subInterest || x.cityName !== selectedCity));
            continue;
          }
          setUserActivities(u => [...u, created]);
          setCityActivities(c => {
            const exists = c.some(a => a.activityName === subInterest && a.cityName === selectedCity);
            if (exists) return c;
            return [...c, { id: created.activityId, activityName: subInterest, cityName: selectedCity }];
          });
        }
      }
      for (const subInterest of removed) {
        const ua = userActivities.find(ua => ua.activityName === subInterest && ua.cityName === selectedCity);
        if (ua?.id) {
          await fetch(`${apiBase}/api/user-city-interests/${ua.id}`, { method: 'DELETE', headers: { 'x-user-id': String(userId) } });
          setUserActivities(u => u.filter(x => x.id !== ua.id));
        }
      }
      queryClient.invalidateQueries({ queryKey: [`/api/user-city-interests/${userId}`] });
    } catch (e) {
      console.error('Sub-interests save error:', e);
      toast({ title: "Error", description: "Failed to save selections", variant: "destructive" });
    } finally {
      setSubInterestsLoading(false);
    }
  };

  // NOTE: userActivities are loaded from user-city-interests via fetchUserActivities when selectedCity changes.
  // Do NOT overwrite with userProfile.activities - that caused state loss when navigating.

  // Sync selected activities to user profile
  const syncActivitiesToProfile = async (selectedActivityNames: string[], cityName: string) => {
    if (!user?.id) return;
    
    try {
      
      // Wait for profile query to be available, don't sync if loading
      if (!userProfile) {
        return;
      }
      
      // Get current user activities from profile (guaranteed to be loaded)
      const currentActivities = userProfile.activities || [];
      
      // Add city-specific prefix to avoid conflicts (e.g., "Los Angeles: Beach Activities")
      const cityPrefixedActivities = selectedActivityNames.map(activity => 
        `${cityName}: ${activity}`
      );
      
      // Merge with existing activities (remove old ones from this city, add new ones)
      const cityPrefix = `${cityName}:`;
      const otherCityActivities = currentActivities.filter((activity: string) => 
        !activity.startsWith(cityPrefix)
      );
      const updatedActivities = [...otherCityActivities, ...cityPrefixedActivities];
      
      
      // Update user profile
      await apiRequest('PUT', `/api/users/${user.id}`, {
        activities: updatedActivities
      });
      
      // Invalidate profile query to refresh UI
      queryClient.invalidateQueries({ queryKey: ['/api/users', user.id] });
      
    } catch (error) {
      console.error('❌ Failed to sync activities to profile:', error);
      toast({
        title: "Sync Warning", 
        description: "Activities saved locally but may not appear in profile immediately",
        variant: "destructive"
      });
    }
  };

  const fetchAllCities = async () => {
    setIsCitiesLoading(true);
    try {
      const apiBase = getApiBaseUrl();
      // Add refresh=true to clear any stale cache and get featured cities in order
      const response = await fetch(`${apiBase}/api/city-stats?refresh=true`);
      if (response.ok) {
        const citiesData = await response.json();
        
        const gradientOptions = [
          // Light mode: vibrant blue→orange travel gradients (high contrast for white text).
          // Dark mode: preserve previous washed overlays (unchanged look in dark).
          "from-blue-900/90 to-orange-600/80 dark:from-orange-400/20 dark:to-blue-600/20",
          "from-blue-800/90 to-orange-500/80 dark:from-blue-400/20 dark:to-orange-600/20",
          "from-blue-900/90 to-amber-500/80 dark:from-blue-300/20 dark:to-orange-500/20",
          "from-blue-950/90 to-orange-700/80 dark:from-orange-300/20 dark:to-blue-500/20",
          "from-blue-950/90 to-orange-600/80 dark:from-blue-500/20 dark:to-orange-400/20",
          "from-blue-900/90 to-amber-600/80 dark:from-orange-500/20 dark:to-blue-400/20",
          "from-blue-950/90 to-orange-600/80 dark:from-blue-600/20 dark:to-orange-300/20",
          "from-blue-900/90 to-orange-700/80 dark:from-orange-600/20 dark:to-blue-300/20"
        ];
        
        const citiesWithPhotos = citiesData.map((city: any, index: number) => ({
          ...city,
          gradient: gradientOptions[index % gradientOptions.length]
        }));
        
        // Store ALL cities - filtering happens in separate useEffect based on user data
        setAllCities(citiesWithPhotos);
        // Don't set filteredCities here - let the user-filter useEffect handle it
      } else {
        console.error('🏙️ MATCH: Failed to fetch cities from API');
        setAllCities([]);
        setFilteredCities([]);
      }
    } catch (error) {
      console.error('🏙️ MATCH: Error loading cities:', error);
      setAllCities([]);
      setFilteredCities([]);
    } finally {
      setIsCitiesLoading(false);
    }
  };


  const fetchCityActivities = async () => {
    try {
      const apiBase = getApiBaseUrl();
      // When selectedCity is a metro area, use first metro city for city-activities API
      const metroCities = getMetroCities(selectedCity);
      const cityForFetch = metroCities.length > 0 ? metroCities[0] : selectedCity;
      const response = await fetch(`${apiBase}/api/city-activities/${encodeURIComponent(cityForFetch)}`);
      if (response.ok) {
        const activities = await response.json();
        const list = Array.isArray(activities) ? activities : [];
        const featuredCount = list.filter((a: any) => a.isFeatured || a.source === 'featured').length;
        if (process.env.NODE_ENV === 'development') console.log(`🎯 MATCH: Fetched ${list.length} activities for ${selectedCity} (${featuredCount} featured)`);
        setCityActivities(list);
        // If server didn't auto-seed and we got 0 for a launch city, trigger seed then refetch
        if (list.length === 0 && LAUNCH_CITY_NAMES.some(c => c.toLowerCase() === cityForFetch.trim().toLowerCase())) {
          try {
            await fetch(`${apiBase}/api/city-activities/${encodeURIComponent(cityForFetch)}/seed-and-refresh`, { method: 'POST' });
            const retry = await fetch(`${apiBase}/api/city-activities/${encodeURIComponent(cityForFetch)}`);
            if (retry.ok) {
              const retryData = await retry.json();
              setCityActivities(Array.isArray(retryData) ? retryData : []);
            }
          } catch (e) {
            console.warn('Seed-and-refresh failed:', e);
          }
        }
      } else {
        console.error('🎯 ACTIVITIES API ERROR:', response.status);
        const errorText = await response.text();
        console.error('🎯 ERROR DETAILS:', errorText);
      }
    } catch (error) {
      console.error('Error fetching city activities:', error);
    }
  };

  const fetchUserActivities = async () => {
    // Get user from multiple storage locations
    const storedUser = localStorage.getItem('travelconnect_user');
    const authUser = localStorage.getItem('user');
    
    let actualUser = user;
    if (!actualUser && storedUser) {
      try {
        actualUser = JSON.parse(storedUser);
      } catch (e) {
        console.error('Failed to parse travelConnectUser:', e);
      }
    }
    if (!actualUser && authUser) {
      try {
        actualUser = JSON.parse(authUser);
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
    
    if (!actualUser || !actualUser.id) {
      setUserActivities([]);
      return;
    }
    
    const userId = actualUser.id;
    
    try {
      const apiBase = getApiBaseUrl();
      // When selectedCity is a metro area (e.g. "Los Angeles Metro"), fetch ALL interests and filter to metro cities
      // This fixes persistence when navigating from profile "Add Plans" link which uses consolidated city names
      const metroCities = getMetroCities(selectedCity);
      if (metroCities.length > 0) {
        const response = await fetch(`${apiBase}/api/user-city-interests/${userId}`);
        if (response.ok) {
          const allActivities = await response.json();
          const filtered = allActivities.filter((ua: any) =>
            metroCities.some((c: string) => c.toLowerCase() === (ua.cityName || '').toLowerCase())
          );
          setUserActivities(filtered);
        }
      } else {
        const response = await fetch(`${apiBase}/api/user-city-interests/${userId}/${encodeURIComponent(selectedCity)}`);
        if (response.ok) {
          const activities = await response.json();
          setUserActivities(activities);
        }
      }
    } catch (error) {
      console.error('Error fetching user activities:', error);
    }
  };

  const fetchMatchingUsers = async () => {
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/matching-users/${encodeURIComponent(selectedCity)}`);
      if (response.ok) {
        const data = await response.json();
        // Handle both old format (array) and new format (object with users property)
        const users = Array.isArray(data) ? data : (data.users || []);
        setMatchingUsers(users);
      }
    } catch (error) {
      console.error('Error fetching matching users:', error);
    }
  };

  const addActivity = async () => {
    if (!newActivityName.trim()) return;
    const storedUser = localStorage.getItem('travelconnect_user') || localStorage.getItem('user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null);
    const userId = actualUser?.id;
    if (!userId) {
      toast({ title: "Error", description: "Please log in to add activities", variant: "destructive" });
      return;
    }

    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/city-activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(userId)
        },
        body: JSON.stringify({
          cityName: selectedCity,
          activityName: newActivityName.trim(),
          description: (newActivityDescription && newActivityDescription.trim()) || `User-created activity in ${selectedCity}`,
          category: 'other',
          state: '',
          country: 'United States',
          createdByUserId: userId
        })
      });

      if (response.ok) {
        const newActivity = await response.json();
        toast({
          title: "Activity Added",
          description: `Added "${newActivityName}" to ${selectedCity}`,
        });
        
        // Immediately update local state
        setCityActivities(prev => [...prev, newActivity]);
        
        // Clear form
        setNewActivityName('');
        setNewActivityDescription('');
        setShowAddForm(false);
        
        fetchMatchingUsers();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to add activity",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Add activity error:', error);
      toast({
        title: "Error",
        description: "Failed to add activity",
        variant: "destructive",
      });
    }
  };

  const toggleActivity = async (activity: any) => {
    const storedUser = localStorage.getItem('travelconnect_user');
    const authUser = localStorage.getItem('user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null) || (authUser ? JSON.parse(authUser) : null);
    const userId = actualUser?.id;

    if (!userId) {
      console.error('❌ No user ID found');
      toast({
        title: "Error",
        description: "Please log in to manage activities",
        variant: "destructive",
      });
      return;
    }

    const isCurrentlyActive = userActivities.some(ua => ua.activityId === activity.id);

    try {
      if (isCurrentlyActive) {
        // Find the user_city_interests record ID (not the activity ID!)
        const userActivityRecord = userActivities.find(ua => ua.activityId === activity.id);
        if (!userActivityRecord) {
          console.error('❌ Could not find user activity record for activityId:', activity.id);
          console.error('❌ User activities:', userActivities);
          toast({
            title: "Error",
            description: "Could not find activity record to remove",
            variant: "destructive",
          });
          return;
        }
        
        if (!userActivityRecord.id) {
          console.error('❌ userActivityRecord has no ID:', userActivityRecord);
          toast({
            title: "Error",
            description: "Invalid activity record - missing ID",
            variant: "destructive",
          });
          return;
        }
        
        
        // Remove activity using the correct user_city_interests ID
        const apiBase = getApiBaseUrl();
        const response = await fetch(`${apiBase}/api/user-city-interests/${userActivityRecord.id}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': userId.toString()
          }
        });
        
        
        if (response.ok) {
          // Immediately update local state
          setUserActivities(prev => prev.filter(ua => ua.activityId !== activity.id));
          
          // If this is a user-created activity, also delete the underlying city_activity
          // so it doesn't show as a gray chip
          if (activity.source === 'user' && activity.createdByUserId === userId) {
            try {
              await fetch(`${apiBase}/api/city-activities/${activity.id}`, {
                method: 'DELETE',
                headers: { 'x-user-id': userId.toString() }
              });
              // Remove from local cityActivities state
              setCityActivities(prev => prev.filter(ca => ca.id !== activity.id));
            } catch (err) {
              console.error('Failed to delete city_activity:', err);
            }
          }
          
          // Refresh to sync with database
          await fetchUserActivities();
          // CRITICAL: Invalidate profile page cache so changes appear immediately
          queryClient.invalidateQueries({ queryKey: [`/api/user-city-interests/${userId}`] });
          
          toast({
            title: "Activity Removed",
            description: `Removed "${activity.activityName}" from your interests`,
          });
        } else {
          const error = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('❌ DELETE failed:', error);
          toast({
            title: "Error",
            description: error.error || "Failed to remove activity",
            variant: "destructive",
          });
        }
      } else {
        // Add activity - optimistic update so pill highlights immediately (fixes double-click)
        const optId = `opt-${activity.id}-${Date.now()}`;
        const optimisticRecord = { id: optId, userId, activityId: activity.id, cityName: selectedCity, activityName: activity.activityName };
        setUserActivities(prev => [...prev, optimisticRecord]);
        const apiBase = getApiBaseUrl();
        const response = await fetch(`${apiBase}/api/user-city-interests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId.toString()
          },
          body: JSON.stringify({
            activityId: activity.id,
            cityName: selectedCity
          })
        });
        if (response.ok) {
          const newInterest = await response.json();
          // Replace optimistic record with real one (avoid duplicate + blink from fetchUserActivities)
          setUserActivities(prev => prev.filter(ua => ua.id !== optId).concat(newInterest));
          queryClient.invalidateQueries({ queryKey: [`/api/user-city-interests/${userId}`] });
        } else {
          setUserActivities(prev => prev.filter(ua => ua.id !== optId));
          const error = await response.json();
          console.error('❌ POST failed:', error);
          toast({
            title: "Error",
            description: error.error || "Failed to add activity",
            variant: "destructive",
          });
        }
      }
      fetchMatchingUsers();
    } catch (error) {
      console.error('Toggle activity error:', error);
      toast({
        title: "Error",
        description: "Failed to update activity interest",
        variant: "destructive",
      });
    }
  };

  const updateActivity = async () => {
    if (!editingActivity) {
      return;
    }

    const storedUser = localStorage.getItem('travelconnect_user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null);
    const userId = actualUser?.id;

    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/city-activities/${editingActivity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId.toString()
        },
        body: JSON.stringify({
          activityName: editActivityName,
          description: editActivityDescription
        })
      });


      if (response.ok) {
        const updatedActivity = await response.json();
        
        toast({
          title: "Activity Updated",
          description: `Updated "${editingActivity.activityName}" to "${editActivityName}"`,
        });
        
        // Immediately update local state
        setCityActivities(prev => prev.map(activity => 
          activity.id === editingActivity.id 
            ? { ...activity, activityName: editActivityName, description: editActivityDescription }
            : activity
        ));
        
        // Clear edit form
        setEditingActivity(null);
        setEditActivityName('');
        setEditActivityDescription('');
        
      } else {
        const error = await response.json();
        console.error('❌ UPDATE ERROR RESPONSE:', error);
        toast({
          title: "Error",
          description: error.error || "Failed to update activity",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ UPDATE NETWORK ERROR:', error);
      toast({
        title: "Error",
        description: "Failed to update activity",
        variant: "destructive",
      });
    }
  };

  const deleteActivity = async (activityId: number) => {
    if (!confirm('Are you sure you want to delete this activity? This will remove it for everyone.')) {
      return;
    }

    const storedUser = localStorage.getItem('travelconnect_user');
    const authUser = localStorage.getItem('user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null) || (authUser ? JSON.parse(authUser) : null);
    const userId = actualUser?.id;

    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/city-activities/${activityId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId.toString()
        }
      });

      if (response.ok) {
        toast({
          title: "Activity Deleted",
          description: "Activity has been removed successfully",
        });
        // Immediately update local state
        setCityActivities(prev => prev.filter(activity => activity.id !== activityId));
        setUserActivities(prev => prev.filter(ua => ua.activityId !== activityId));
        fetchMatchingUsers();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete activity",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Delete activity error:', error);
      toast({
        title: "Error",
        description: "Failed to delete activity",
        variant: "destructive",
      });
    }
  };

  // Add activity function for the simple interface
  const handleAddActivity = async () => {
    if (!newActivity.trim()) return;
    
    // Get user from localStorage if not in context (same as toggle function)
    const storedUser = localStorage.getItem('travelconnect_user');
    const authUser = localStorage.getItem('user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null) || (authUser ? JSON.parse(authUser) : null);
    const userId = actualUser?.id;

    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/city-activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId.toString()
        },
        body: JSON.stringify({
          cityName: selectedCity,
          activityName: newActivity,
          createdByUserId: userId,
          description: 'User added activity'
        })
      });

      if (response.ok) {
        const newActivityData = await response.json();
        setCityActivities(prev => [...prev, newActivityData]);
        
        // Automatically add the new activity to user's interests (make it green)
        const interestResponse = await fetch(`${apiBase}/api/user-city-interests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId.toString()
          },
          body: JSON.stringify({
            activityId: newActivityData.id,
            cityName: selectedCity
          })
        });
        
        if (interestResponse.ok) {
          const newUserActivity = await interestResponse.json();
          setUserActivities(prev => [...prev, newUserActivity]);
        }
        
        setNewActivity('');
        
        toast({
          title: "Activity Added & Selected",
          description: `Created and selected "${newActivity}" for ${selectedCity}`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to add activity",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Add activity error:', error);
      toast({
        title: "Error",
        description: "Failed to add activity",
        variant: "destructive",
      });
    }
  };

  // Add City Plan with category (for the modal)
  const handleAddCityPick = async () => {
    if (!newPickName.trim()) return;
    
    const storedUser = localStorage.getItem('travelconnect_user');
    const authUser = localStorage.getItem('user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null) || (authUser ? JSON.parse(authUser) : null);
    const userId = actualUser?.id;
    
    if (!userId) {
      toast({ title: "Error", description: "Please log in to add plans", variant: "destructive" });
      return;
    }

    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/city-activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId.toString()
        },
        body: JSON.stringify({
          cityName: selectedCity,
          activityName: newPickName.trim(),
          category: newPickCategory,
          createdByUserId: userId,
          source: 'user',
          description: `User-created ${newPickCategory} activity`,
          activityDate: newPickDate || null
        })
      });

      if (response.ok) {
        const newActivityData = await response.json();
        const addedName = newPickName.trim();
        setCityActivities(prev => [...prev, newActivityData]);
        
        // Auto-select the new pick
        const interestResponse = await fetch(`${apiBase}/api/user-city-interests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId.toString() },
          body: JSON.stringify({ activityId: newActivityData.id, cityName: selectedCity })
        });
        
        if (interestResponse.ok) {
          const newUserActivity = await interestResponse.json();
          setUserActivities(prev => [...prev, newUserActivity]);
        }
        
        setNewPickName('');
        setNewPickCategory('other');
        setNewPickDate('');
        setShowAddPickModal(false);
        setShowEventSuggestion(false);
        
        queryClient.invalidateQueries({ queryKey: [`/api/user-city-interests/${userId}`] });
        fetchUserActivities();
        fetchCityActivities();
        
        toast({
          title: "City Plan Added!",
          description: `"${addedName}" added to your plans for ${selectedCity}`,
        });
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.error || "Failed to add plan", variant: "destructive" });
      }
    } catch (error) {
      console.error('Add city plan error:', error);
      toast({ title: "Error", description: "Failed to add plan", variant: "destructive" });
    }
  };

  // Unselect a pick (for popular/AI items - doesn't delete globally)
  const handleUnselectPick = async (userActivityId: number, activityName: string) => {
    const storedUser = localStorage.getItem('travelconnect_user');
    const authUser = localStorage.getItem('user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null) || (authUser ? JSON.parse(authUser) : null);
    const userId = actualUser?.id;
    
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/user-city-interests/${userActivityId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId?.toString() || '' }
      });
      
      if (response.ok) {
        setUserActivities(prev => prev.filter(ua => ua.id !== userActivityId));
        toast({ title: "Removed", description: `"${activityName}" removed from your plans` });
        fetchMatchingUsers();
      }
    } catch (error) {
      console.error('Unselect error:', error);
      toast({ title: "Error", description: "Failed to remove pick", variant: "destructive" });
    }
  };

  // Find similar existing activity for quality control
  const findSimilarActivity = (input: string): {id: number, name: string} | null => {
    if (!input || input.length < 3) return null;
    const normalized = normalizeName(input);
    
    // Skip common short words
    if (['the', 'and', 'for', 'with'].includes(normalized)) return null;
    
    // Check all city activities for similarity
    for (const activity of cityActivities) {
      const activityNormalized = normalizeName(activity.activityName);
      
      // Exact match
      if (normalized === activityNormalized) {
        return { id: activity.id, name: activity.activityName };
      }
      
      // One contains the other (with reasonable length)
      if (normalized.length >= 4 && activityNormalized.length >= 4) {
        if (activityNormalized.includes(normalized) || normalized.includes(activityNormalized)) {
          return { id: activity.id, name: activity.activityName };
        }
      }
      
      // Word-based similarity (>= 60% common words)
      const inputWords = normalized.split(/\s+/).filter(w => w.length > 2);
      const activityWords = activityNormalized.split(/\s+/).filter(w => w.length > 2);
      if (inputWords.length >= 2 && activityWords.length >= 2) {
        const commonWords = inputWords.filter(w => activityWords.includes(w));
        const similarity = commonWords.length / Math.min(inputWords.length, activityWords.length);
        if (similarity >= 0.6) {
          return { id: activity.id, name: activity.activityName };
        }
      }
    }
    return null;
  };

  // Toggle event selection (add/remove from interested events) - saves to backend
  const toggleEventInterest = async (event: any) => {
    const eventId = event.id;
    const isCurrentlySelected = selectedEventIds.has(eventId);
    
    const storedUser = localStorage.getItem('travelconnect_user');
    const authUser = localStorage.getItem('user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null) || (authUser ? JSON.parse(authUser) : null);
    const userId = actualUser?.id;
    
    if (!userId) {
      toast({ title: "Error", description: "Please log in to add plans", variant: "destructive" });
      return;
    }
    
    if (isCurrentlySelected) {
      // Remove from plans - find the user interest and delete it
      const eventActivity = userActivities.find(ua => 
        ua.cityName === selectedCity && 
        ua.activityName === event.title
      );
      
      if (eventActivity) {
        try {
          const apiBase = getApiBaseUrl();
          // Use user-city-interests endpoint to remove user's selection
          await fetch(`${apiBase}/api/user-city-interests/${eventActivity.id}`, {
            method: 'DELETE',
            headers: { 'x-user-id': userId.toString() }
          });
          
          setSelectedEventIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(eventId);
            return newSet;
          });
          
          await fetchUserActivities();
          fetchMatchingUsers();
          toast({ title: "Removed", description: `"${event.title}" removed from your plans` });
        } catch (error) {
          toast({ title: "Error", description: "Failed to remove event", variant: "destructive" });
        }
      }
    } else {
      // Add to plans - first create city activity, then add user interest
      try {
        const apiBase = getApiBaseUrl();
        const eventDate = new Date(event.date).toLocaleDateString('en-US', { 
          weekday: 'short', month: 'short', day: 'numeric' 
        });
        
        // Step 1: Create the city activity
        const activityResponse = await fetch(`${apiBase}/api/city-activities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId.toString()
          },
          body: JSON.stringify({
            cityName: selectedCity,
            activityName: event.title,
            category: event.category || 'Events',
            createdByUserId: userId,
            description: `${eventDate}${event.venue ? ' at ' + event.venue : ''}`
          })
        });
        
        if (activityResponse.ok) {
          const newActivity = await activityResponse.json();
          
          // Step 2: Add user interest for this activity
          const interestResponse = await fetch(`${apiBase}/api/user-city-interests`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': userId.toString()
            },
            body: JSON.stringify({
              activityId: newActivity.id,
              cityName: selectedCity
            })
          });
          
          if (interestResponse.ok) {
            setSelectedEventIds(prev => {
              const newSet = new Set(prev);
              newSet.add(eventId);
              return newSet;
            });
            
            await fetchUserActivities();
            fetchMatchingUsers();
            toast({ title: "Added to Your Plans", description: `"${event.title}" - ${eventDate}` });
          }
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to add event", variant: "destructive" });
      }
    }
  };
  
  // Check if an event is selected
  const isEventSelected = (eventId: string) => selectedEventIds.has(eventId);

  // Clear all plans for this city - opens confirmation dialog
  const handleClearAllPicks = () => {
    const userPicksForCity = userActivities.filter(ua => ua.cityName === selectedCity);
    if (userPicksForCity.length === 0) {
      toast({ title: "No plans", description: "You don't have any plans to clear" });
      return;
    }
    setShowClearAllDialog(true);
  };
  
  // Actually clear all plans after confirmation
  const confirmClearAllPicks = async () => {
    setShowClearAllDialog(false);
    const userPicksForCity = userActivities.filter(ua => ua.cityName === selectedCity);
    
    const storedUser = localStorage.getItem('travelconnect_user');
    const authUser = localStorage.getItem('user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null) || (authUser ? JSON.parse(authUser) : null);
    const userId = actualUser?.id;
    
    try {
      const apiBase = getApiBaseUrl();
      // Delete all plans for this city
      for (const pick of userPicksForCity) {
        await fetch(`${apiBase}/api/user-city-interests/${pick.id}`, {
          method: 'DELETE',
          headers: { 'x-user-id': userId?.toString() || '' }
        });
      }
      
      setUserActivities(prev => prev.filter(ua => ua.cityName !== selectedCity));
      toast({ title: "Cleared", description: `All plans for ${selectedCity} have been cleared` });
      fetchMatchingUsers();
    } catch (error) {
      console.error('Clear all error:', error);
      toast({ title: "Error", description: "Failed to clear plans", variant: "destructive" });
    }
  };

  // Reset to popular plans only (clears user-created, keeps popular/featured)
  const handleResetToPopular = async () => {
    const userPicksForCity = userActivities.filter(ua => ua.cityName === selectedCity);
    const storedUser = localStorage.getItem('travelconnect_user');
    const authUser = localStorage.getItem('user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null) || (authUser ? JSON.parse(authUser) : null);
    const currentUserId = actualUser?.id;
    
    // Find featured activities for this city
    const featuredActivities = cityActivities.filter(a => 
      (a as any).isFeatured || (a as any).source === 'featured'
    );
    
    if (featuredActivities.length === 0) {
      toast({ title: "No popular plans", description: `No curated plans available for ${selectedCity}` });
      return;
    }
    
    if (!confirm(`Reset to ${featuredActivities.length} popular plans for ${selectedCity}? This will remove your custom plans.`)) return;
    
    try {
      const apiBase = getApiBaseUrl();
      
      // First clear all current plans
      for (const pick of userPicksForCity) {
        await fetch(`${apiBase}/api/user-city-interests/${pick.id}`, {
          method: 'DELETE',
          headers: { 'x-user-id': currentUserId?.toString() || '' }
        });
      }
      
      // Then add all featured activities
      const newPlans: any[] = [];
      for (const activity of featuredActivities) {
        const response = await fetch(`${apiBase}/api/user-city-interests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUserId?.toString() || ''
          },
          body: JSON.stringify({
            activityId: activity.id,
            cityName: selectedCity
          })
        });
        
        if (response.ok) {
          const newPlan = await response.json();
          newPlans.push(newPlan);
        }
      }
      
      setUserActivities(prev => [
        ...prev.filter(ua => ua.cityName !== selectedCity),
        ...newPlans
      ]);
      toast({ title: "Reset complete", description: `Added ${newPlans.length} popular plans for ${selectedCity}` });
      fetchMatchingUsers();
    } catch (error) {
      console.error('Reset to popular error:', error);
      toast({ title: "Error", description: "Failed to reset plans", variant: "destructive" });
    }
  };

  // Toggle activity function for the simple interface
  const handleToggleActivity = async (activityId: number, activityName: string) => {
    // Get user from localStorage if not in context
    const storedUser = localStorage.getItem('travelconnect_user');
    const authUser = localStorage.getItem('user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null) || (authUser ? JSON.parse(authUser) : null);
    const userId = actualUser?.id;
    const isCurrentlySelected = userActivities.some(ua => ua.activityId === activityId);
    

    try {
      if (isCurrentlySelected) {
        // Remove from user activities
        const userActivity = userActivities.find(ua => ua.activityId === activityId);
        if (userActivity) {
          await handleDeleteActivity(userActivity.id);
        }
      } else {
        // Add to user activities
        const apiBase = getApiBaseUrl();
        const response = await fetch(`${apiBase}/api/user-city-interests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId.toString()
          },
          body: JSON.stringify({
            activityId: activityId,
            cityName: selectedCity
          })
        });

        if (response.ok) {
          const newUserActivity = await response.json();
          setUserActivities(prev => [...prev, newUserActivity]);
          
          // Force re-fetch to ensure UI is in sync
          setTimeout(() => {
            fetchUserActivities();
          }, 100);
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to add activity",
            variant: "destructive",
          });
        }
      }
      
      // Sync to user profile immediately with captured state
      const currentSelectedNames = userActivities
        .filter(ua => ua.cityName === selectedCity)
        .map(ua => ua.activityName);
      
      const updatedSelectedNames = [...currentSelectedNames];
      if (!isCurrentlySelected) {
        updatedSelectedNames.push(activityName);
      } else {
        const index = updatedSelectedNames.indexOf(activityName);
        if (index > -1) updatedSelectedNames.splice(index, 1);
      }
      
      // Immediate sync with captured city name and state
      syncActivitiesToProfile(updatedSelectedNames, selectedCity);
      
    } catch (error) {
      console.error('Toggle activity error:', error);
      toast({
        title: "Error",
        description: "Failed to toggle activity",
        variant: "destructive",
      });
    }
  };

  // Delete user activity function
  const handleDeleteActivity = async (userActivityId: number) => {
    const storedUser = localStorage.getItem('travelconnect_user');
    const authUser = localStorage.getItem('user');
    const travelconnectUser = localStorage.getItem('travelconnect_user');
    const actualUser = user || 
      (storedUser ? JSON.parse(storedUser) : null) || 
      (authUser ? JSON.parse(authUser) : null) ||
      (travelconnectUser ? JSON.parse(travelconnectUser) : null);
    const userId = actualUser?.id;
    
    
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/user-city-interests/${userActivityId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId.toString()
        }
      });


      if (response.ok) {
        setUserActivities(prev => prev.filter(ua => ua.id !== userActivityId));
        
        // Force re-fetch to ensure UI is in sync
        setTimeout(() => {
          fetchUserActivities();
        }, 100);
        
        // Sync to user profile immediately with captured state
        const remainingSelectedNames = userActivities
          .filter(ua => ua.cityName === selectedCity && ua.id !== userActivityId)
          .map(ua => ua.activityName);
        
        // Immediate sync with captured city name and state
        syncActivitiesToProfile(remainingSelectedNames, selectedCity);
        
        toast({
          title: "Activity Removed",
          description: "Removed from your interests",
        });
      } else {
        const error = await response.json();
        console.error('🗑️ DELETE FAILED:', error);
        toast({
          title: "Error",
          description: error.error || "Failed to remove activity",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Delete activity error:', error);
      toast({
        title: "Error",
        description: "Failed to remove activity",
        variant: "destructive",
      });
    }
  };

  // AI Feature Functions
  const fetchAiActivitySuggestions = async () => {
    if (!selectedCity) return;
    
    // Get user ID from multiple sources (matching existing pattern)
    const storedUser = localStorage.getItem('travelconnect_user');
    const authUser = localStorage.getItem('user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null) || (authUser ? JSON.parse(authUser) : null);
    const userId = actualUser?.id;
    
    if (!userId) {
      toast({
        title: "Login Required",
        description: "Please log in to get personalized activity suggestions",
        variant: "destructive",
      });
      return;
    }
    
    setAiSuggestionsLoading(true);
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/ai/activity-suggestions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userId.toString()
        },
        credentials: 'include',
        body: JSON.stringify({ cityName: selectedCity })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.suggestions) {
          setAiSuggestions(data.suggestions);
          toast({
            title: "AI Suggestions Ready!",
            description: `Generated ${data.suggestions.length} personalized activity ideas`,
          });
        } else {
          toast({
            title: "Note",
            description: data.error || "Could not generate suggestions",
            variant: "destructive",
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast({
          title: "Error",
          description: errorData.error || "Failed to generate activity suggestions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('AI suggestions error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI suggestions",
        variant: "destructive",
      });
    } finally {
      setAiSuggestionsLoading(false);
    }
  };

  const fetchMatchingInsight = async (matchedUserId: number) => {
    if (!selectedCity) return;
    
    // Get user ID from multiple sources (matching existing pattern)
    const storedUser = localStorage.getItem('travelconnect_user');
    const authUser = localStorage.getItem('user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null) || (authUser ? JSON.parse(authUser) : null);
    const userId = actualUser?.id;
    
    if (!userId) {
      toast({
        title: "Login Required",
        description: "Please log in to see compatibility insights",
        variant: "destructive",
      });
      return;
    }
    
    setMatchingInsightLoading(prev => ({ ...prev, [matchedUserId]: true }));
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/ai/matching-insight`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userId.toString()
        },
        credentials: 'include',
        body: JSON.stringify({ matchedUserId, cityName: selectedCity })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.insight) {
          setMatchingInsight(prev => ({ ...prev, [matchedUserId]: data.insight }));
        } else {
          toast({
            title: "Note",
            description: data.error || "Could not generate compatibility insight",
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast({
          title: "Error",
          description: errorData.error || "Failed to get compatibility insight",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Matching insight error:', error);
      toast({
        title: "Error",
        description: "Failed to get compatibility insight",
        variant: "destructive",
      });
    } finally {
      setMatchingInsightLoading(prev => ({ ...prev, [matchedUserId]: false }));
    }
  };

  // Update activity function
  const handleUpdateActivity = async () => {
    if (!editingActivity || !editingActivityName.trim()) return;
    
    const userId = user?.id || 1;
    
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/user-city-interests/${editingActivity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId.toString()
        },
        body: JSON.stringify({
          activityName: editingActivityName
        })
      });

      if (response.ok) {
        // Only update the global city activity if the current user created it (avoids non-creators changing e.g. "May 4" to "May 5")
        const cityActivity = cityActivities.find(ca => ca.id === editingActivity.activityId);
        const isCreator = cityActivity && cityActivity.createdByUserId === userId;
        if (isCreator) {
          const cityActivityResponse = await fetch(`${apiBase}/api/city-activities/${editingActivity.activityId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': userId.toString()
            },
            body: JSON.stringify({
              activityName: editingActivityName,
              description: cityActivity?.description || 'Updated activity'
            })
          });

          if (cityActivityResponse.ok) {
            setCityActivities(prev => prev.map(activity =>
              activity.id === editingActivity.activityId
                ? { ...activity, activityName: editingActivityName }
                : activity
            ));
          }
        }

        setEditingActivity(null);
        setEditingActivityName('');

        toast({
          title: "Activity Updated",
          description: `Updated to "${editingActivityName}"`,
        });
      }
    } catch (error) {
      console.error('Update activity error:', error);
      toast({
        title: "Error",
        description: "Failed to update activity",
        variant: "destructive",
      });
    }
  };



  // Show city selection screen if no city is selected
  if (!selectedCity) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8">
          {/* Hero section and toggle — hidden on iOS for a cleaner city plans experience */}
          {!isNativeIOSApp() && (
            <>
              {!isInitialHeroVisible && (
                <div className="mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleInitialHeroVisibility}
                    className="text-sm bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white border-gray-300 dark:border-white/20 hover:bg-gray-300 dark:hover:bg-white/20"
                    data-testid="button-show-match-initial-hero"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Show Hero Section
                  </Button>
                </div>
              )}
              {isInitialHeroVisible && (
                <div className="text-center mb-8 relative">
                  <div className="flex justify-end mb-2 md:absolute md:top-0 md:right-0 md:mb-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleInitialHeroVisibility}
                      className="text-sm bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white border-gray-300 dark:border-white/20 hover:bg-gray-300 dark:hover:bg-white/20"
                      data-testid="button-hide-match-initial-hero"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Hide
                    </Button>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">🎯 City Plans</h1>
                  <p className="text-xl text-gray-600 dark:text-white/80 mb-4">Pick a city, then choose plans to match with people who want to do the same things.</p>
                  <div className="bg-gray-100 dark:bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-2xl mx-auto border border-gray-200 dark:border-white/20">
                    <p className="text-gray-700 dark:text-white/90 text-sm leading-relaxed">
                      🎯 <strong>Pick your plans</strong> → Select what you'd actually do in that city<br/>
                      👥 <strong>Find your people</strong> → We'll show matches with the most shared plans<br/>
                      ➕ <strong>Add your own</strong> → Create a plan or event and invite others
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Search Cities */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-white/50" />
              <Input
                placeholder="Search cities..."
                value={citySearchTerm}
                onChange={(e) => setCitySearchTerm(e.target.value)}
                className="pl-12 bg-white dark:bg-white/10 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/50"
              />
            </div>
          </div>

          {/* Cities Grid - RESTORED BEAUTIFUL DESIGN */}
          {isCitiesLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 dark:border-white mb-4"></div>
              <p className="text-gray-700 dark:text-white text-lg">Loading cities...</p>
            </div>
          ) : filteredCities.length === 0 && citySearchTerm ? (
            <div className="flex flex-col items-center justify-center py-20">
              <MapPin className="w-12 h-12 text-gray-400 dark:text-white/50 mb-4" />
              <p className="text-gray-700 dark:text-white text-lg font-medium mb-2">
                No cities found matching your search
              </p>
              <p className="text-gray-500 dark:text-white/70 text-center max-w-md">
                Try a different search term to find more cities
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCities.map((city, index) => (
              <div 
                key={index}
                className="relative overflow-hidden rounded-xl cursor-pointer transition-transform hover:scale-105 shadow-lg group"
                onClick={() => setSelectedCity(city.city)}
              >
                {/* Beautiful city photo background like original */}
                <div 
                  className="w-full h-48 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${city.photo})` }}
                >
                  {/* Gradient overlay for text readability */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${city.gradient} backdrop-blur-[1px]`}></div>
                  
                  {/* Content - EXACTLY like original screenshots */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                    <h3 className="text-xl font-bold mb-2 drop-shadow-lg">{city.city}</h3>
                    <p className="text-sm opacity-90 drop-shadow-lg">
                      {city.state ? `${city.state}, ${city.country}` : city.country}
                    </p>
                    
                    {/* Match button like in screenshots */}
                    <div className="mt-3">
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md">
                        ⚡ Start City Plans
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Explore Launch Cities - Show pre-built cities users can browse */}
          {!citySearchTerm && (() => {
            const launchCities = getLaunchCities();
            if (launchCities.length === 0) return null;
            return (
              <div className="mt-12">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Explore Cities</h2>
                  <p className="text-gray-600 dark:text-white/70">Browse curated activities in cities we've launched</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {launchCities.map((city, index) => (
                    <div 
                      key={`launch-${index}`}
                      className="relative overflow-hidden rounded-xl cursor-pointer transition-transform hover:scale-105 shadow-lg group"
                      onClick={() => setSelectedCity(city.city)}
                    >
                      <div 
                        className="w-full h-36 bg-cover bg-center relative"
                        style={{ backgroundImage: `url(${city.photo})` }}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${city.gradient} backdrop-blur-[1px]`}></div>
                        <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                          <h3 className="text-lg font-bold drop-shadow-lg">{city.city}</h3>
                          <p className="text-xs opacity-90 drop-shadow-lg">
                            {city.state ? `${city.state}, ${city.country}` : city.country}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  const selectedCityData = allCities.find(c => c.city === selectedCity);
  const isActivityActive = (activityId: number) => {
    const isActive = userActivities.some(ua => ua.activityId === activityId);
    return isActive;
  };

  // Delete city activity function (for activities user hasn't selected)
  const handleDeleteCityActivity = async (activityId: number) => {
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/city-activities/${activityId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove from city activities list
        setCityActivities(prev => prev.filter(activity => activity.id !== activityId));
        // Also remove from user activities (Your Plans) if present
        setUserActivities(prev => prev.filter(ua => ua.activityId !== activityId));
        
        toast({
          title: "Activity Deleted",
          description: "Activity removed from city",
        });
        
        // Refresh matching users
        fetchMatchingUsers();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete activity",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Delete city activity error:', error);
      toast({
        title: "Error", 
        description: "Failed to delete activity",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-2 min-w-0">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedCity('')}
            className="text-gray-300 hover:bg-slate-800 hover:text-white shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cities
          </Button>
          <div className="text-center min-w-0 flex-1 px-2">
            <h1 className="text-sm sm:text-lg md:text-2xl font-bold text-white truncate whitespace-nowrap" title={selectedCity}>{selectedCity}</h1>
          </div>
          <div className="w-20 shrink-0" />
        </div>

        {/* Hero / Instructions — hidden on iOS for cleaner experience */}
        {!isNativeIOSApp() && (
          <>
            {!isHeroVisible && (
              <div className="max-w-4xl mx-auto mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleHeroVisibility}
                  className="text-sm text-gray-600 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                  data-testid="button-show-match-hero"
                >
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show Instructions
                </Button>
              </div>
            )}
            {isHeroVisible && (
              <div className="max-w-4xl mx-auto mb-6">
                <div className="bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-200">🎯 How City Plans Works</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleHeroVisibility}
                      className="text-sm w-fit text-gray-600 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
                      data-testid="button-hide-match-hero"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Hide Instructions
                    </Button>
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                    <p>• <strong>Choose activities you want to do</strong> → Get matched with others who share your interests</p>
                    <p>• <strong>Add your own activities</strong> → Help others discover new experiences</p>
                    <p>• <strong>Connect with locals & travelers</strong> → Plan meetups and explore together</p>
                    <p>• <strong>Edit or delete outdated activities</strong> → Keep your interests current and relevant</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Activity Selection Interface - GORGEOUS RESTORED DESIGN */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl backdrop-blur-sm">
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent mb-2 truncate whitespace-nowrap" title={selectedCity}>⭐ City Plans for {selectedCity}</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">Pick to match faster in this city.</p>
                {/* Save & Find Matches - Top */}
                <div className="mt-6">
                  <Button
                    onClick={() => {
                      fetchMatchingUsers();
                      toast({ title: "Plans saved!", description: `Finding matches in ${selectedCity}...` });
                      const matchSection = document.querySelector('[data-testid="matching-users-section"]');
                      if (matchSection) matchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Save & Find Matches
                  </Button>
                </div>
              </div>

              {/* Mobile Section Switcher - Show only on mobile */}
              <div className="md:hidden sticky top-0 z-30 bg-white dark:bg-slate-900 backdrop-blur-sm py-2 -mx-8 px-3 mb-6 border-b border-gray-200 dark:border-slate-700">
                <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {[
                    { id: 'popular', label: '🎯 Things to Do' },
                    { id: 'preferences', label: '✈️ Connect On' },
                    { id: 'selected', label: '✓ My Plans' },
                    { id: 'events', label: '📅 Events' },
                  ].map((section) => (
                    <button
                      key={section.id}
                      onClick={() => {
                        setActiveMobileSection(section.id as typeof activeMobileSection);
                        setTimeout(() => {
                          const el = document.getElementById(`mobile-section-${section.id}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 50);
                      }}
                      className={`flex-shrink-0 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        activeMobileSection === section.id
                          ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
                      }`}
                    >
                      {section.label}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setActiveMobileSection('all');
                      setTimeout(() => {
                        const el = document.getElementById('mobile-section-selected');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 50);
                    }}
                    className={`flex-shrink-0 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      activeMobileSection === 'all'
                        ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
                    }`}
                  >
                    Show All
                  </button>
                </div>
                {/* Search filter for activities */}
                <div className="mt-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search city plans..."
                      value={activitySearchFilter}
                      onChange={(e) => setActivitySearchFilter(e.target.value)}
                      className="pl-9 py-2 text-sm bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-full"
                    />
                    {activitySearchFilter && (
                      <button
                        onClick={() => setActivitySearchFilter('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Clear All Plans Confirmation Dialog */}
              <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
                <AlertDialogContent className="bg-white dark:bg-slate-900">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all plans?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all {userActivities.filter(ua => ua.cityName === selectedCity).length} plans for {selectedCity}. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmClearAllPicks} className="bg-red-600 hover:bg-red-700">
                      Clear all
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Add City Plan Modal */}
              <Dialog open={showAddPickModal} onOpenChange={(open) => {
                setShowAddPickModal(open);
                if (!open) {
                  // Reset state when closing modal
                  setShowEventSuggestion(false);
                  setNewPickName('');
                  setNewPickCategory('other');
                  setNewPickDate('');
                  setSimilarActivity(null);
                }
              }}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Add a City Plan</DialogTitle>
                    <DialogDescription>
                      Add a recurring activity you want to do in {selectedCity}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        What do you want to do?
                      </label>
                      <Input
                        placeholder="e.g., Jogging buddies, Vintage shopping, Poker night..."
                        value={newPickName}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewPickName(value);
                          setShowEventSuggestion(looksLikeEvent(value));
                          // Check for similar existing activities
                          const similar = findSimilarActivity(value);
                          setSimilarActivity(similar);
                        }}
                        className="text-gray-800 dark:text-white"
                        autoFocus
                      />
                      {/* Similar activity suggestion - quality control */}
                      {similarActivity && !showEventSuggestion && (() => {
                        // Check if this activity is already selected
                        const isAlreadySelected = userActivities.some(
                          ua => ua.activityId === similarActivity.id && ua.cityName === selectedCity
                        );
                        
                        if (isAlreadySelected) {
                          return (
                            <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                              <p className="text-sm text-green-700 dark:text-green-300">
                                ✓ You already have <strong>"{similarActivity.name}"</strong> in your plans!
                              </p>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-700">
                            <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                              This already exists as <strong>"{similarActivity.name}"</strong> — add that instead?
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-amber-500 hover:bg-amber-600 text-white"
                                onClick={() => {
                                  // Add the existing activity (not toggle - always add)
                                  handleToggleActivity(similarActivity.id, similarActivity.name);
                                  setShowAddPickModal(false);
                                  setNewPickName('');
                                  setSimilarActivity(null);
                                }}
                              >
                                Add "{similarActivity.name}"
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-amber-300 text-amber-600"
                                onClick={() => setSimilarActivity(null)}
                              >
                                Create new anyway
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                      {showEventSuggestion && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                          <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                            This looks like a specific event with a date. Would you like to add it as an Event instead?
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-300 text-blue-600"
                            onClick={() => {
                              setShowAddPickModal(false);
                              setLocation(`/create-event?city=${encodeURIComponent(selectedCity)}&title=${encodeURIComponent(newPickName)}`);
                            }}
                          >
                            Add as Event
                          </Button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Category
                      </label>
                      <Select value={newPickCategory} onValueChange={setNewPickCategory}>
                        <SelectTrigger className="text-gray-800 dark:text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CITY_PICK_CATEGORIES.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <span className="flex items-center gap-2">
                                <span>{cat.emoji}</span>
                                <span>{cat.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Date (optional)
                      </label>
                      <Input
                        type="date"
                        value={newPickDate}
                        onChange={(e) => setNewPickDate(e.target.value)}
                        className="text-gray-800 dark:text-white"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Add a date to match with others going to a specific event like "Taylor Swift Jan 30"
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowAddPickModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddCityPick}
                      disabled={!newPickName.trim()}
                      className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                    >
                      Add Plan
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* Dynamic City Activities - Group 1: City-Specific First, Group 2: Generic Travel-Social */}
              <div className="space-y-8">
                
                {/* GROUP 1: City-Specific Activities (each city's hardcoded list) */}
                {(() => {
                  const storedUser2 = localStorage.getItem('travelconnect_user');
                  const actualUser2 = user || (storedUser2 ? JSON.parse(storedUser2) : null);
                  const currentUserId2 = actualUser2?.id;
                  
                  // Enforce order: Group 1 = FEATURED, Group 2 = STATIC (+ AI/user-created), Group 3 = GENERIC
                  const isFeatured = (a: any) => (a.isFeatured || a.source === 'featured');
                  const isStatic = (a: any) => a.source === 'static';
                  const isGeneric = (a: any) => a.source === 'generic';
                  const baseFilter = (activity: any) => {
                    if (activity.category === 'universal') return false;
                    if (activity.createdByUserId === 1 && dismissedAIActivities.has(activity.id)) return false;
                    const activityDate = activity.activityDate;
                    if (activityDate) {
                      const pickDate = new Date(activityDate);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (pickDate < today) return false;
                    }
                    if (activitySearchFilter && !activity.activityName.toLowerCase().includes(activitySearchFilter.toLowerCase())) return false;
                    return true;
                  };
                  
                  const group1Featured = cityActivities
                    .filter(activity => isFeatured(activity) && baseFilter(activity))
                    .sort((a, b) => ((a as any).rank || 999) - ((b as any).rank || 999));
                  
                  const group2Static = cityActivities
                    .filter(activity => !isFeatured(activity) && !isGeneric(activity) && baseFilter(activity));
                  
                  const group3Generic = cityActivities
                    .filter(activity => isGeneric(activity))
                    .filter(activity => !activitySearchFilter || activity.activityName.toLowerCase().includes(activitySearchFilter.toLowerCase()));
                  
                  const allCityActivities = [...group1Featured, ...group2Static, ...group3Generic];
                  
                  if (allCityActivities.length === 0 && !activitySearchFilter) return null;
                  
                  const isMobileVisible = activeMobileSection === 'popular' || activeMobileSection === 'ai' || activeMobileSection === 'all';
                  const displayedGroup1 = group1Featured;
                  const displayedGroup2 = group2Static.slice(0, displayedActivitiesLimit);
                  const displayedGroup3 = group3Generic;
                  const hasMoreGroup2 = group2Static.length > displayedActivitiesLimit;
                  
                  return (
                    <div id="mobile-section-popular" className={`md:block ${isMobileVisible ? 'block' : 'hidden'}`}>
                      {/* GROUP 1: Featured (curated top activities) */}
                      <div className="text-center mb-6">
                        <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-2">🎯 Group 1: Things to Do in {selectedCity}</h3>
                        <p className="text-gray-400 text-xs sm:text-sm">Curated top spots and experiences — tap to add to your plans</p>
                        <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 mx-auto rounded-full mt-2"></div>
                        {/* Inline text box: add custom "thing I want to do" — editable/deletable by all */}
                        <div className="flex flex-col sm:flex-row gap-2 mt-4 max-w-xl mx-auto">
                          <input
                            type="text"
                            placeholder="Type something you want to do in this city..."
                            value={customActivityText}
                            onChange={(e) => setCustomActivityText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                (document.querySelector('[data-add-custom-activity]') as HTMLButtonElement)?.click();
                              }
                            }}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-500 dark:placeholder-gray-400"
                          />
                          <Button
                            data-add-custom-activity
                            size="sm"
                            disabled={!customActivityText.trim() || addingCustomActivity}
                            onClick={async () => {
                              if (!customActivityText.trim()) return;
                              const stored = localStorage.getItem('travelconnect_user') || localStorage.getItem('user');
                              const u = user || (stored ? JSON.parse(stored) : null);
                              const uid = u?.id;
                              if (!uid) {
                                toast({ title: "Error", description: "Please log in to add activities", variant: "destructive" });
                                return;
                              }
                              setAddingCustomActivity(true);
                              try {
                                const apiBase = getApiBaseUrl();
                                const res = await fetch(`${apiBase}/api/city-activities`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', 'x-user-id': String(uid) },
                                  body: JSON.stringify({
                                    cityName: selectedCity,
                                    activityName: customActivityText.trim(),
                                    description: `User-created: ${customActivityText.trim()} in ${selectedCity}`,
                                    category: 'other',
                                    state: '',
                                    country: 'United States',
                                    createdByUserId: uid
                                  })
                                });
                                if (res.ok) {
                                  const newActivity = await res.json();
                                  const addedName = customActivityText.trim();
                                  setCityActivities(prev => [...prev, newActivity]);
                                  setCustomActivityText('');
                                  toast({ title: "Added", description: `"${addedName}" added to ${selectedCity}` });
                                  fetchMatchingUsers();
                                } else {
                                  const err = await res.json();
                                  toast({ title: "Error", description: err.error || "Failed to add", variant: "destructive" });
                                }
                              } finally {
                                setAddingCustomActivity(false);
                              }
                            }}
                          >
                            {addingCustomActivity ? 'Adding…' : 'Add'}
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {displayedGroup1.length > 0 && displayedGroup1.map((activity) => {
                          const isSelected = userActivities.some(ua => 
                            ua.activityId === activity.id || 
                            (ua.activityName && activity.activityName && ua.activityName.toLowerCase().trim() === activity.activityName.toLowerCase().trim() && ua.cityName === selectedCity)
                          );
                          const isFeatured = (activity as any).isFeatured || (activity as any).source === 'featured';
                          const isAICreated = activity.createdByUserId === 1;
                          const isUserCreated = activity.createdByUserId != null && activity.createdByUserId !== 1; // any user-created: deletable by all
                          const isCreatedByMe = activity.createdByUserId === currentUserId2; // only creator can edit (avoids someone changing e.g. "Taylor Swift May 4" to May 5)
                          const userActivity = userActivities.find(ua => ua.activityId === activity.id || (ua.activityName === activity.activityName && ua.cityName === selectedCity));
                          
                              return (
                            <div key={activity.id} className="group relative">
                              <button
                                className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg border touch-manipulation select-none ${
                                  isSelected 
                                    ? 'bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white border-orange-400/50'
                                    : isFeatured
                                      ? 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50 hover:border-yellow-400/50 dark:bg-gray-800 dark:text-gray-100 dark:border-slate-700 dark:hover:bg-gray-800'
                                      : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-slate-700 dark:hover:bg-gray-800 dark:hover:border-slate-500'
                                }`}
                                type="button"
                                onPointerDown={(e) => {
                                  if (e.pointerType === 'touch') {
                                    e.preventDefault();
                                    toggleActivity(activity);
                                  }
                                }}
                                onClick={() => toggleActivity(activity)}
                              >
                                <span className="flex items-center justify-center gap-1.5">
                                  {isSelected && <span className="text-xs">✓</span>}
                                  {!isSelected && isFeatured && <span className="text-xs">⭐</span>}
                                  {!isSelected && isAICreated && <span className="text-xs">✨</span>}
                                  {activity.activityName}
                                  {(activity as any).activityDate && (
                                    <span className="text-xs opacity-80">
                                      • {new Date((activity as any).activityDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  )}
                                </span>
                              </button>
                              {isAICreated && !isSelected && (
                                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    className="w-5 h-5 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-gray-600"
                                    onClick={(e) => { e.stopPropagation(); dismissAIActivity(activity.id); }}
                                    title="Hide this suggestion"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              )}
                              {isUserCreated && (
                                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  {isCreatedByMe && (
                                    <button
                                      className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingActivity(activity);
                                        setEditActivityName(activity.activityName);
                                        setEditActivityDescription((activity as any).description || '');
                                        setEditingActivityName(activity.activityName);
                                      }}
                                      title="Edit (only you can edit what you added)"
                                    >
                                      <Edit className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                  <button
                                    className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCityActivity(activity.id);
                                    }}
                                    title="Remove from city (visible to everyone)"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* GROUP 2: Static + AI/user-created (More Things to Do) */}
                      {displayedGroup2.length > 0 && (
                        <div className="mt-8">
                          <div className="text-center mb-4">
                            <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent mb-1">📍 Group 2: More Things to Do</h3>
                            <p className="text-gray-400 text-xs sm:text-sm">Additional spots, local favorites, and unique ideas</p>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {displayedGroup2.map((activity) => {
                              const isAICreated = activity.createdByUserId === 1;
                              const isUserCreated = activity.createdByUserId != null && activity.createdByUserId !== 1;
                              const isCreatedByMe = activity.createdByUserId === currentUserId2;
                              const isSelected = userActivities.some(ua => 
                                ua.activityId === activity.id || 
                                (ua.activityName && activity.activityName && ua.activityName.toLowerCase().trim() === activity.activityName.toLowerCase().trim() && ua.cityName === selectedCity)
                              );
                              return (
                                <div key={activity.id} className="group relative">
                                  <button
                                    type="button"
                                    className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg border touch-manipulation select-none ${
                                      isSelected 
                                        ? 'bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white border-orange-400/50'
                                        : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-slate-700 dark:hover:bg-gray-800 dark:hover:border-slate-500'
                                    }`}
                                    onPointerDown={(e) => {
                                      if (e.pointerType === 'touch') {
                                        e.preventDefault();
                                        toggleActivity(activity);
                                      }
                                    }}
                                    onClick={() => toggleActivity(activity)}
                                  >
                                    <span className="flex items-center justify-center gap-1.5">
                                      {isSelected && <span className="text-xs">✓</span>}
                                      {activity.activityName}
                                    </span>
                                  </button>
                                  {isAICreated && !isSelected && (
                                    <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        className="w-5 h-5 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-gray-600"
                                        onClick={(e) => { e.stopPropagation(); dismissAIActivity(activity.id); }}
                                        title="Hide this suggestion"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  )}
                                  {isUserCreated && (
                                    <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                      {isCreatedByMe && (
                                        <button
                                          className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-700"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingActivity(activity);
                                            setEditActivityName(activity.activityName);
                                            setEditActivityDescription((activity as any).description || '');
                                            setEditingActivityName(activity.activityName);
                                          }}
                                          title="Edit"
                                        >
                                          <Edit className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                      <button
                                        className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-700"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteCityActivity(activity.id); }}
                                        title="Remove"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {hasMoreGroup2 && (
                            <div className="flex justify-center mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDisplayedActivitiesLimit(prev => prev + 30)}
                                className="border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                              >
                                Show {Math.min(30, group2Static.length - displayedActivitiesLimit)} more
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Save & Find Matches - Middle (between activity groups) */}
                      <div className="my-8 text-center">
                        <Button
                          onClick={() => {
                            fetchMatchingUsers();
                            toast({ title: "Plans saved!", description: `Finding matches in ${selectedCity}...` });
                            const matchSection = document.querySelector('[data-testid="matching-users-section"]');
                            if (matchSection) matchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg"
                        >
                          <Check className="w-5 h-5 mr-2" />
                          Save & Find Matches
                        </Button>
                      </div>
                      
                      {/* GROUP 3: Generic (Connect On) */}
                      {group3Generic.length > 0 && (
                        <div className="mt-8">
                          <div className="text-center mb-4">
                            <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-500 to-orange-500 bg-clip-text text-transparent mb-1">✈️ Group 3: Connect On</h3>
                            <p className="text-gray-400 text-xs sm:text-sm">Popular ways to connect with travelers & locals in any city</p>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                            {displayedGroup3.map((activity) => {
                              const isSelected = userActivities.some(ua => 
                                ua.activityId === activity.id || 
                                (ua.activityName && activity.activityName && ua.activityName.toLowerCase().trim() === activity.activityName.toLowerCase().trim() && ua.cityName === selectedCity)
                              );
                              return (
                                <button
                                  key={activity.id}
                                  type="button"
                                  className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg border touch-manipulation select-none ${
                                    isSelected 
                                      ? 'bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white border-orange-400/50'
                                      : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-slate-700 dark:hover:bg-gray-800 dark:hover:border-slate-500'
                                  }`}
                                  onPointerDown={(e) => {
                                    if (e.pointerType === 'touch') {
                                      e.preventDefault();
                                      toggleActivity(activity);
                                    }
                                  }}
                                  onClick={() => toggleActivity(activity)}
                                >
                                  <span className="flex items-center justify-center gap-1.5">
                                    {isSelected && <span className="text-xs">✓</span>}
                                    {activity.activityName}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-center gap-3 mt-4">
                        <Button
                          onClick={async () => {
                            try {
                              setIsLoading(true);
                              toast({ title: "Generating Ideas", description: `Finding unique ${selectedCity} experiences...` });
                              const apiBase = getApiBaseUrl();
                              const response = await fetch(`${apiBase}/api/city-activities/${selectedCity}/enhance`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                              });
                              if (response.ok) {
                                toast({ title: "New Ideas Added!", description: `Found unique ${selectedCity} experiences` });
                                fetchCityActivities();
                              } else {
                                throw new Error('Failed');
                              }
                            } catch (error) {
                              toast({ title: "Error", description: "Failed to generate ideas", variant: "destructive" });
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          size="sm"
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Finding ideas...' : '✨ Suggest more ideas'}
                        </Button>
                      </div>
                    </div>
                  );
                })()}


                {/* SAVE & FIND MATCHES BUTTON */}
                <div className="my-8 text-center">
                  <Button
                    onClick={() => {
                      fetchMatchingUsers();
                      toast({ title: "Plans saved!", description: `Finding matches in ${selectedCity}...` });
                      const matchSection = document.querySelector('[data-testid="matching-users-section"]');
                      if (matchSection) matchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Save & Find Matches
                  </Button>
                </div>

                {/* SECTION 3: YOUR PLANS - User's selected + user-created activities */}
                {(() => {
                  const userPicksForCity = userActivities.filter(ua => ua.cityName === selectedCity);
                  const storedUser3 = localStorage.getItem('travelconnect_user');
                  const authUser3 = localStorage.getItem('user');
                  const actualUser3 = user || (storedUser3 ? JSON.parse(storedUser3) : null) || (authUser3 ? JSON.parse(authUser3) : null);
                  const currentUserId3 = actualUser3?.id;
                  
                  const isMobileVisible = activeMobileSection === 'selected' || activeMobileSection === 'all';
                  
                  return (
                    <div id="mobile-section-selected" className={`md:block ${isMobileVisible ? 'block' : 'hidden'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-orange-500 bg-clip-text text-transparent">
                            Your Plans
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Things you want to do in {selectedCity}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Button
                            onClick={() => setShowAddPickModal(true)}
                            size="sm"
                            className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add a City Plan
                          </Button>
                          <Button
                            onClick={() => setLocation(`/create-event?city=${encodeURIComponent(selectedCity)}`)}
                            size="sm"
                            variant="outline"
                            className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/30"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add an Event
                          </Button>
                          {userPicksForCity.length > 0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white dark:bg-gray-900">
                                <DropdownMenuItem onClick={handleClearAllPicks} className="text-red-600 dark:text-red-400 cursor-pointer">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Clear all plans
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleResetToPopular} className="cursor-pointer">
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  Reset to Popular
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      
                      {userPicksForCity.length > 0 ? (
                        <div className="p-4 bg-gradient-to-r from-orange-50/50 to-blue-50/50 dark:from-orange-900/20 dark:to-blue-900/20 rounded-xl border border-orange-200/50 dark:border-orange-700/50">
                          <div className="flex flex-wrap gap-2">
                            {userPicksForCity.map((ua) => {
                              const activity = cityActivities.find(ca => ca.id === ua.activityId);
                              const activityName = ua.activityName || activity?.activityName || 'Unknown';
                              const isUserCreated = (activity?.createdByUserId != null && activity?.createdByUserId !== 1) ||
                                                    (ua.source === 'user' && ua.createdByUserId != null && ua.createdByUserId !== 1);
                              const categoryInfo = CITY_PICK_CATEGORIES.find(c => c.id === activity?.category);
                              
                              return (
                                <div key={ua.id} className="group relative">
                                  <div className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-orange-500 text-white rounded-lg text-sm font-medium shadow-md">
                                    {categoryInfo && <span className="text-xs">{categoryInfo.emoji}</span>}
                                    <span>{activityName}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isUserCreated && activity) {
                                          if (confirm(`Delete "${activityName}"? This will remove it completely.`)) {
                                            handleDeleteCityActivity(activity.id);
                                          }
                                        } else {
                                          handleUnselectPick(ua.id, activityName);
                                        }
                                      }}
                                      className="ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors"
                                      title={isUserCreated ? "Delete plan" : "Remove from your plans"}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            No plans yet — select activities above to get started!
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* SECTION 4: Events in Next 30 Days */}
                {(() => {
                  // Mobile: only show if this section is active or showing all
                  const isMobileVisible = activeMobileSection === 'events' || activeMobileSection === 'all';
                  
                  // Show section if we have events or are loading
                  if (!realEventsLoading && realEvents.length === 0) return null;
                  
                  // Limit to first 6 events unless expanded
                  const displayEvents = showAllEvents ? realEvents : realEvents.slice(0, 6);
                  
                  return (
                    <div id="mobile-section-events" className={`mt-8 md:block ${isMobileVisible ? 'block' : 'hidden'}`}>
                      <div className="text-center mb-6">
                        <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">📅 Events in Next 30 Days</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Click to add to Your Plans • Use "Tickets" button for details</p>
                        <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full mt-2"></div>
                      </div>
                      
                      {realEventsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                          <p className="text-gray-500 dark:text-gray-400">Loading events...</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayEvents.map((event: any, index: number) => {
                              const isSelected = isEventSelected(event.id);
                              return (
                                <div
                                  key={event.id || index}
                                  onClick={() => toggleEventInterest(event)}
                                  className={`cursor-pointer rounded-xl p-4 transition-all border-2 ${
                                    isSelected 
                                      ? 'bg-gradient-to-br from-orange-50 to-blue-50 dark:from-orange-900/30 dark:to-blue-900/30 border-orange-400 dark:border-orange-600 ring-2 ring-orange-300 dark:ring-orange-700' 
                                      : 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-200 dark:border-purple-700 hover:shadow-lg hover:border-purple-400'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    {event.image && (
                                      <img 
                                        src={event.image} 
                                        alt={event.title} 
                                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">{event.title}</h4>
                                        {isSelected && (
                                          <span className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                        📅 {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                      </p>
                                      {event.venue && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">📍 {event.venue}</p>
                                      )}
                                      <div className="flex items-center justify-between mt-2">
                                        {event.category && (
                                          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                                            {event.category}
                                          </span>
                                        )}
                                        {event.url && (
                                          <a
                                            href={event.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 text-xs rounded-full hover:bg-blue-200 dark:hover:bg-blue-700/50 transition-colors"
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                            Tickets
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {realEvents.length > 6 && (
                            <div className="text-center mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAllEvents(!showAllEvents)}
                                className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:from-purple-200 hover:to-pink-200"
                              >
                                {showAllEvents ? 'Show fewer events' : `Show ${realEvents.length - 6} more events`}
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* SECTION 5: Deeper Interests - Sub-interests for more specific matching */}
                <div className="mt-8">
                  <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-800/50">
                    <SubInterestSelector
                      selectedSubInterests={userSubInterests}
                      onSubInterestsChange={handleSubInterestsChange}
                      showOptionalLabel={false}
                      variant={isDarkModeClass ? "dark" : "default"}
                    />
                    {subInterestsLoading && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-orange-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* Matching Users - Photo Grid Layout */}
        {matchingUsers.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4 px-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">🤝 People Who Match</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
              {matchingUsers.map((matchedUser) => (
                <div 
                  key={matchedUser.id} 
                  className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/profile/${matchedUser.id}`)}
                >
                  {/* Large Photo - 4:5 aspect ratio for portrait style */}
                  <div className="relative aspect-[4/5] bg-gradient-to-br from-blue-400 to-orange-500">
                    {matchedUser.profileImage ? (
                      <img 
                        src={matchedUser.profileImage} 
                        alt={matchedUser.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl md:text-5xl font-bold text-white/90">
                          {matchedUser.name?.charAt(0) || matchedUser.username?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    {/* AI Insight star badge */}
                    <button
                      className="absolute top-2 right-2 w-7 h-7 bg-white/90 dark:bg-gray-900/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchMatchingInsight(matchedUser.id);
                      }}
                      title="Get AI compatibility insight"
                    >
                      {matchingInsightLoading[matchedUser.id] ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      )}
                    </button>
                    {/* Match count badge */}
                    {matchedUser.sharedActivities.length > 0 && (
                      <div className="absolute bottom-2 left-2 bg-green-500/90 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {matchedUser.sharedActivities.length} match{matchedUser.sharedActivities.length !== 1 ? 'es' : ''}
                      </div>
                    )}
                  </div>
                  
                  {/* User Info - Compact */}
                  <div className="p-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {matchedUser.username}
                      </h3>
                      {matchedUser.age && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{matchedUser.age}</span>
                      )}
                    </div>
                    {/* Shared activities preview */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {matchedUser.sharedActivities.slice(0, 5).join(', ')}
                      {matchedUser.sharedActivities.length > 5 && '...'}
                    </p>
                    
                    {/* AI Insight (expandable) */}
                    {matchingInsight[matchedUser.id] && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              style={{ width: `${matchingInsight[matchedUser.id].compatibilityScore}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                            {matchingInsight[matchedUser.id].compatibilityScore}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {matchingInsight[matchedUser.id].whyYoullConnect}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Activity Modal — city activity (creator only) or user pick */}
      {editingActivity && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Activity</h3>
            {/* City activity edit (creator only): name + description */}
            {!(editingActivity as any).activityId ? (
              <>
                <Input
                  value={editActivityName}
                  onChange={(e) => setEditActivityName(e.target.value)}
                  className="mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  placeholder="Activity name"
                />
                <Input
                  value={editActivityDescription}
                  onChange={(e) => setEditActivityDescription(e.target.value)}
                  className="mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  placeholder="Description (optional)"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingActivity(null);
                      setEditActivityName('');
                      setEditActivityDescription('');
                    }}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={updateActivity}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Input
                  value={editingActivityName}
                  onChange={(e) => setEditingActivityName(e.target.value)}
                  className="mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  placeholder="Activity name"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingActivity(null);
                      setEditingActivityName('');
                    }}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateActivity}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Save
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sticky Selected Bar - Always visible when activities are selected for current city */}
      {selectedCity && userActivities.filter(ua => ua.cityName === selectedCity).length > 0 && (
        <div className="fixed bottom-24 md:bottom-14 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500 text-white px-3 py-1 text-sm font-semibold">
                Selected: {userActivities.filter(ua => ua.cityName === selectedCity).length}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  // Clear all activities for this city
                  const activitiesToClear = userActivities.filter(ua => ua.cityName === selectedCity);
                  for (const activity of activitiesToClear) {
                    try {
                      await apiRequest('DELETE', `/api/user-activities/${activity.id}`);
                    } catch (error) {
                      console.error('Error clearing activity:', error);
                    }
                  }
                  setUserActivities(prev => prev.filter(ua => ua.cityName !== selectedCity));
                  toast({
                    title: "Cleared",
                    description: `All plans for ${selectedCity} have been cleared.`,
                  });
                }}
                className="text-gray-600 dark:text-gray-400 hover:text-red-500"
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  toast({
                    title: "Plans Saved!",
                    description: `Your ${userActivities.filter(ua => ua.cityName === selectedCity).length} plans for ${selectedCity} are saved. You'll match with others who share these interests.`,
                  });
                  setLocation('/discover');
                }}
                className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-semibold"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save button pinned to very bottom - full width mobile, centered desktop */}
      {selectedCity && (
        <div
          className="fixed left-0 right-0 z-50 p-4 pb-4 bg-slate-900/95 backdrop-blur border-t border-slate-700"
          style={{ bottom: "calc(60px + var(--sab))" }}
        >
          <div className="max-w-2xl mx-auto flex justify-center">
            <Button
              onClick={() => {
                fetchMatchingUsers();
                toast({ title: "Plans saved!", description: `Finding matches in ${selectedCity}...` });
                const matchSection = document.querySelector('[data-testid="matching-users-section"]');
                if (matchSection) matchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="w-full md:w-auto md:min-w-[220px] bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg"
            >
              <Check className="w-5 h-5 mr-2" />
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
