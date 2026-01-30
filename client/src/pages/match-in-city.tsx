import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/App";
import { apiRequest, queryClient, getApiBaseUrl } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { getTravelActivities } from "@shared/base-options";
import { METRO_AREAS } from "@shared/constants";

// City Pick categories for user-created picks
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

// Universal → categories mapping for finding city-specific activities
const UNIVERSAL_TO_CATEGORIES: Record<string, string[]> = {
  "Guided Tours": ["Tourism", "Culture", "Local", "Sightseeing"],
  "Hiking & Nature": ["Outdoor", "Nature", "Parks"],
  "Beach / Waterfront": ["Outdoor", "Beach", "Nature"],
  "Museums & Galleries": ["Culture", "Tourism", "Art"],
  "Nightlife & Dancing": ["Nightlife", "Entertainment"],
  "Restaurants & Local Eats": ["Food", "Local", "Dining"],
  "Coffee & Brunch": ["Food", "Dining", "Local"],
  "Live Music": ["Entertainment", "Nightlife", "Events"],
  "History & Architecture": ["Culture", "Tourism", "Local"],
  "Local Markets": ["Shopping", "Food", "Local"],
  "Bars / Happy Hour": ["Nightlife", "Food"],
  "Street Food / Food Trucks": ["Food", "Local"],
  "Scenic / Photography Spots": ["Tourism", "Outdoor", "Nature"],
  "Biking / Cycling": ["Outdoor", "Sports"],
  "Fitness / Workouts": ["Sports", "Outdoor"],
};

// Keywords that help match universals to city activities (for keyword-based fallback)
const UNIVERSAL_KEYWORDS: Record<string, string[]> = {
  "Guided Tours": ["tour", "walk", "hike", "guide"],
  "Hiking & Nature": ["hike", "trail", "park", "nature", "garden", "observatory"],
  "Beach / Waterfront": ["beach", "pier", "boardwalk", "waterfront", "harbor", "marina"],
  "Museums & Galleries": ["museum", "gallery", "art", "center", "exhibit"],
  "Nightlife & Dancing": ["club", "bar", "nightlife", "lounge", "dance"],
  "Restaurants & Local Eats": ["restaurant", "diner", "eatery", "food", "market", "kitchen"],
  "Coffee & Brunch": ["coffee", "cafe", "brunch", "bakery", "roastery"],
  "Live Music": ["music", "venue", "jazz", "concert", "hall"],
  "History & Architecture": ["historic", "architecture", "old town", "heritage", "landmark"],
  "Local Markets": ["market", "flea", "artisan", "farmers"],
  "Bars / Happy Hour": ["bar", "pub", "cocktail", "wine", "beer", "speakeasy"],
  "Street Food / Food Trucks": ["food truck", "street food"],
  "Scenic / Photography Spots": ["view", "vista", "skyline", "sunset", "overlook", "scenic"],
  "Biking / Cycling": ["bike", "cycling", "path", "trail"],
  "Fitness / Workouts": ["run", "gym", "fitness", "yoga"],
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
  Lightbulb,
  Loader2,
  MoreHorizontal,
  RotateCcw
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
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedCity, setSelectedCity] = useState<string>('');
  
  console.log('🔧 MATCH IN CITY RENDER - selectedCity:', selectedCity);
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
  const [activeMobileSection, setActiveMobileSection] = useState<'popular' | 'ai' | 'preferences' | 'selected' | 'all'>('all');

  // Add City Pick Modal State
  const [showAddPickModal, setShowAddPickModal] = useState(false);
  const [newPickName, setNewPickName] = useState('');
  const [newPickCategory, setNewPickCategory] = useState('other');
  const [newPickDate, setNewPickDate] = useState(''); // Optional date for dated picks like "Taylor Swift Jan 30"
  const [showEventSuggestion, setShowEventSuggestion] = useState(false);
  const [similarActivity, setSimilarActivity] = useState<{id: number, name: string} | null>(null);

  // AI Features State
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState(false);
  const [matchingInsight, setMatchingInsight] = useState<{ [userId: number]: any }>({});
  const [matchingInsightLoading, setMatchingInsightLoading] = useState<{ [userId: number]: boolean }>({});
  
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
    
    // Add hometown from profile (more complete data than auth user)
    const profile: any = userProfile || user;
    if (profile?.hometownCity) {
      const hometownLower = profile.hometownCity.toLowerCase();
      relevantCityNames.push(hometownLower);
      // Also add metro area name if applicable
      const metroName = getMetroName(profile.hometownCity);
      if (metroName) {
        relevantCityNames.push(metroName.toLowerCase());
      }
    }
    
    // Add current destination from profile
    if (profile?.destinationCity) {
      const destLower = profile.destinationCity.toLowerCase();
      relevantCityNames.push(destLower);
      // Also add metro area name if applicable
      const metroName = getMetroName(profile.destinationCity);
      if (metroName) {
        relevantCityNames.push(metroName.toLowerCase());
      }
    }
    
    // Add all travel plan destinations (filtered by userId for safety)
    if (travelPlans && Array.isArray(travelPlans)) {
      travelPlans.forEach((plan: any) => {
        // Only include plans that belong to current user
        if (plan.destinationCity && plan.userId === user?.id) {
          const planCityLower = plan.destinationCity.toLowerCase();
          relevantCityNames.push(planCityLower);
          // Also add metro area name if applicable
          const metroName = getMetroName(plan.destinationCity);
          if (metroName) {
            relevantCityNames.push(metroName.toLowerCase());
          }
        }
      });
    }
    
    console.log('🏙️ getUserRelevantCities:', relevantCityNames);
    return [...new Set(relevantCityNames)]; // Remove duplicates
  };

  // Fetch all cities on component mount
  useEffect(() => {
    // FORCE RESET - ensure we start with no city selected
    console.log('🔧 FORCE RESETTING selectedCity to empty string');
    setSelectedCity('');
    
    // Clear any URL params that might be setting city
    const urlParams = new URLSearchParams(window.location.search);
    const cityFromUrl = urlParams.get('city');
    if (cityFromUrl) {
      console.log('🔧 Found city in URL, clearing it:', cityFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    fetchAllCities();
  }, []);
  
  // Default to showing only user's hometown and travel destinations, with fallback to all cities
  useEffect(() => {
    if (allCities.length > 0) {
      const relevantCityNames = getUserRelevantCities();
      console.log('🏙️ MATCH: User relevant cities:', relevantCityNames);
      console.log('🏙️ MATCH: All cities available:', allCities.map(c => c.city));
      
      if (relevantCityNames.length > 0) {
        const userCities = allCities.filter(city => 
          relevantCityNames.includes(city.city.toLowerCase())
        );
        console.log('🏙️ MATCH: Matched cities:', userCities.map(c => c.city));
        
        // If user has relevant cities but none matched, show all cities as fallback
        if (userCities.length === 0) {
          console.log('🏙️ MATCH: No cities matched user locations, showing ALL cities as fallback');
          setFilteredCities(allCities);
        } else {
          console.log('🏙️ MATCH: Showing', userCities.length, 'user-relevant cities');
          setFilteredCities(userCities);
        }
      } else {
        // FALLBACK: Show all cities if user has no hometown or travel plans
        console.log('🏙️ MATCH: No relevant cities found, showing all', allCities.length, 'cities');
        setFilteredCities(allCities);
      }
    }
  }, [allCities, user, userProfile, travelPlans]);

  // Fetch city activities when a city is selected
  useEffect(() => {
    if (selectedCity) {
      fetchCityActivities();
      fetchUserActivities();
      fetchMatchingUsers();
    }
  }, [selectedCity]);

  // Filter cities based on search - search ALL cities when typing
  useEffect(() => {
    if (citySearchTerm) {
      const filtered = allCities.filter(city => 
        city.city.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
        city.state.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
        city.country.toLowerCase().includes(citySearchTerm.toLowerCase())
      );
      setFilteredCities(filtered);
    } else {
      // When search is cleared, go back to showing user's relevant cities or all cities as fallback
      const relevantCityNames = getUserRelevantCities();
      if (relevantCityNames.length > 0) {
        const userCities = allCities.filter(city => 
          relevantCityNames.includes(city.city.toLowerCase())
        );
        setFilteredCities(userCities);
      } else {
        // FALLBACK: Show all cities if user has no hometown or travel plans
        setFilteredCities(allCities);
      }
    }
  }, [citySearchTerm, allCities, user, userProfile, travelPlans]);

  // Hydrate initial selections from user profile
  useEffect(() => {
    // Skip hydration for new users who aren't logged in
    if (!user?.id || !userProfile?.activities || !selectedCity) {
      console.log('🔄 SKIP HYDRATION: New user or no profile data');
      return;
    }
    
    console.log('🔄 Hydrating activities from user profile for city:', selectedCity);
    
    // Extract activities for current city from user profile
    const cityPrefix = `${selectedCity}:`;
    const cityActivitiesFromProfile = userProfile.activities
      .filter((activity: string) => activity.startsWith(cityPrefix))
      .map((activity: string) => activity.replace(cityPrefix, '').trim());
    
    console.log('🔄 Found existing activities for city:', {
      cityActivitiesFromProfile,
      totalProfileActivities: userProfile.activities.length
    });
    
    if (cityActivitiesFromProfile.length > 0) {
      // Cross-reference with cityActivities to get activityIds
      const hydratedUserActivities = cityActivitiesFromProfile
        .map((activityName, index) => {
          // Find the matching activity from cityActivities
          const matchingActivity = cityActivities.find(activity => 
            activity.activityName === activityName
          );
          
          if (matchingActivity) {
            return {
              id: `hydrated-${selectedCity}-${index}`, // Temporary ID for hydrated items
              userId: user.id,
              cityName: selectedCity,
              activityName: activityName,
              activityId: matchingActivity.id // Include the required activityId
            };
          }
          return null;
        })
        .filter(Boolean); // Remove null entries
      
      // Set the hydrated activities to pre-select pills
      setUserActivities(hydratedUserActivities);
      
      console.log('✅ Hydrated activities for pills:', {
        found: hydratedUserActivities.length,
        fromProfile: cityActivitiesFromProfile.length
      });
    } else {
      // No existing activities for this city, clear any previous selections
      setUserActivities([]);
    }
    
  }, [userProfile?.activities, selectedCity, user?.id, cityActivities]);

  // Sync selected activities to user profile
  const syncActivitiesToProfile = async (selectedActivityNames: string[], cityName: string) => {
    if (!user?.id) return;
    
    try {
      console.log('🔄 Syncing activities to profile:', { selectedActivityNames, cityName });
      
      // Wait for profile query to be available, don't sync if loading
      if (!userProfile) {
        console.log('⏳ Profile not loaded yet, skipping sync to prevent data loss');
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
      
      console.log('🔄 Profile update:', {
        currentActivities: currentActivities.length,
        selectedForThisCity: selectedActivityNames.length,
        totalAfterUpdate: updatedActivities.length,
        cityName
      });
      
      // Update user profile
      await apiRequest('PUT', `/api/users/${user.id}`, {
        activities: updatedActivities
      });
      
      // Invalidate profile query to refresh UI
      queryClient.invalidateQueries({ queryKey: ['/api/users', user.id] });
      
      console.log('✅ Activities synced to profile successfully');
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
      console.log('🏙️ MATCH: Fetching cities from city stats API...');
      const apiBase = getApiBaseUrl();
      // Add refresh=true to clear any stale cache and get featured cities in order
      const response = await fetch(`${apiBase}/api/city-stats?refresh=true`);
      if (response.ok) {
        const citiesData = await response.json();
        console.log('🏙️ MATCH: Loaded', citiesData.length, 'cities from API');
        
        const gradientOptions = [
          "from-orange-400/20 to-blue-600/20",
          "from-blue-400/20 to-orange-600/20",
          "from-blue-300/20 to-orange-500/20", 
          "from-orange-300/20 to-blue-500/20",
          "from-blue-500/20 to-orange-400/20",
          "from-orange-500/20 to-blue-400/20",
          "from-blue-600/20 to-orange-300/20",
          "from-orange-600/20 to-blue-300/20"
        ];
        
        const citiesWithPhotos = citiesData.map((city: any, index: number) => ({
          ...city,
          gradient: gradientOptions[index % gradientOptions.length]
        }));
        
        // Store ALL cities - filtering happens in separate useEffect based on user data
        setAllCities(citiesWithPhotos);
        // Don't set filteredCities here - let the user-filter useEffect handle it
        console.log('🏙️ MATCH: Cities loaded successfully:', citiesWithPhotos.length);
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
    console.log('🎯 FETCHING ACTIVITIES FOR CITY:', selectedCity);
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/city-activities/${encodeURIComponent(selectedCity)}`);
      console.log('🎯 ACTIVITIES API RESPONSE:', response.status, response.ok);
      if (response.ok) {
        const activities = await response.json();
        console.log('🎯 CITY ACTIVITIES FETCHED:', activities.length, 'activities for', selectedCity);
        console.log('🎯 FIRST FEW ACTIVITIES:', activities.slice(0, 5));
        setCityActivities(activities);
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
      console.log('🔧 NEW USER: No user logged in, starting with clean slate');
      setUserActivities([]);
      return;
    }
    
    const userId = actualUser.id;
    console.log('🔧 FETCH USER ACTIVITIES: using userId =', userId, 'user object:', actualUser);
    
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/user-city-interests/${userId}/${encodeURIComponent(selectedCity)}`);
      if (response.ok) {
        const activities = await response.json();
        console.log('🎯 USER ACTIVITIES FETCHED:', activities.length, activities);
        setUserActivities(activities);
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
        console.log('👥 MATCHING USERS FETCHED:', users.length);
        setMatchingUsers(users);
      }
    } catch (error) {
      console.error('Error fetching matching users:', error);
    }
  };

  const addActivity = async () => {
    if (!newActivityName.trim() || !newActivityDescription.trim()) return;

    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/city-activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          city: selectedCity,
          activityName: newActivityName.trim(),
          description: newActivityDescription.trim(),
          category: 'user-generated',
          state: '',
          country: ''
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
    console.log('🎯 TOGGLE ACTIVITY:', activity.activityName, 'isCurrentlyActive:', isCurrentlyActive, 'userId:', userId);

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
        
        console.log('🗑️ REMOVING: userActivityRecord.id =', userActivityRecord.id, 'activityId =', activity.id, 'userId =', userId);
        
        // Remove activity using the correct user_city_interests ID
        const apiBase = getApiBaseUrl();
        const response = await fetch(`${apiBase}/api/user-city-interests/${userActivityRecord.id}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': userId.toString()
          }
        });
        
        console.log('🗑️ DELETE response status:', response.status, 'ok:', response.ok);
        
        if (response.ok) {
          console.log('✅ Successfully removed activity');
          // Immediately update local state
          setUserActivities(prev => prev.filter(ua => ua.activityId !== activity.id));
          
          // If this is a user-created activity, also delete the underlying city_activity
          // so it doesn't show as a gray chip
          if (activity.source === 'user' && activity.createdByUserId === userId) {
            console.log('🗑️ Also deleting user-created city_activity:', activity.id);
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
        // Add activity
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
          console.log('✅ Successfully added activity:', newInterest);
          // Immediately update local state
          setUserActivities(prev => [...prev, newInterest]);
          // Refresh to sync with database
          await fetchUserActivities();
          // CRITICAL: Invalidate profile page cache so changes appear immediately
          queryClient.invalidateQueries({ queryKey: [`/api/user-city-interests/${userId}`] });
        } else {
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
      console.log('❌ UPDATE BLOCKED: no editingActivity');
      return;
    }

    const storedUser = localStorage.getItem('travelconnect_user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null);
    const userId = actualUser?.id;
    console.log('🔧 UPDATE: using userId =', userId);
    console.log('✏️ UPDATING ACTIVITY:', editingActivity.id, 'from:', editingActivity.activityName, 'to:', editActivityName);

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

      console.log('✏️ UPDATE RESPONSE:', response.status, response.ok);

      if (response.ok) {
        const updatedActivity = await response.json();
        console.log('✏️ UPDATED ACTIVITY DATA:', updatedActivity);
        
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
        
        console.log('✏️ EDIT FORM CLEARED AND STATE UPDATED');
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
    console.log('🔧 DELETE: using userId =', userId);
    console.log('🗑️ DELETING ACTIVITY:', activityId);

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
    console.log('➕ ADDING ACTIVITY:', newActivity, 'userId:', userId);

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
        console.log('🎯 Auto-selecting new activity:', newActivityData.activityName);
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
          console.log('✅ Auto-selected activity for user');
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

  // Add City Pick with category (for the modal)
  const handleAddCityPick = async () => {
    if (!newPickName.trim()) return;
    
    const storedUser = localStorage.getItem('travelconnect_user');
    const authUser = localStorage.getItem('user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null) || (authUser ? JSON.parse(authUser) : null);
    const userId = actualUser?.id;
    
    if (!userId) {
      toast({ title: "Error", description: "Please log in to add picks", variant: "destructive" });
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
        
        toast({
          title: "City Pick Added!",
          description: `"${newPickName}" added to your picks for ${selectedCity}`,
        });
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.error || "Failed to add pick", variant: "destructive" });
      }
    } catch (error) {
      console.error('Add city pick error:', error);
      toast({ title: "Error", description: "Failed to add pick", variant: "destructive" });
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
        toast({ title: "Removed", description: `"${activityName}" removed from your picks` });
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

  // Clear all picks for this city
  const handleClearAllPicks = async () => {
    const userPicksForCity = userActivities.filter(ua => ua.cityName === selectedCity);
    if (userPicksForCity.length === 0) {
      toast({ title: "No picks", description: "You don't have any picks to clear" });
      return;
    }
    
    if (!confirm(`Clear all ${userPicksForCity.length} picks for ${selectedCity}?`)) return;
    
    const storedUser = localStorage.getItem('travelconnect_user');
    const authUser = localStorage.getItem('user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null) || (authUser ? JSON.parse(authUser) : null);
    const userId = actualUser?.id;
    
    try {
      const apiBase = getApiBaseUrl();
      // Delete all picks for this city
      for (const pick of userPicksForCity) {
        await fetch(`${apiBase}/api/user-city-interests/${pick.id}`, {
          method: 'DELETE',
          headers: { 'x-user-id': userId?.toString() || '' }
        });
      }
      
      setUserActivities(prev => prev.filter(ua => ua.cityName !== selectedCity));
      toast({ title: "Cleared", description: `All picks for ${selectedCity} have been cleared` });
      fetchMatchingUsers();
    } catch (error) {
      console.error('Clear all error:', error);
      toast({ title: "Error", description: "Failed to clear picks", variant: "destructive" });
    }
  };

  // Reset to popular picks only (clears user-created, keeps popular/featured)
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
      toast({ title: "No popular picks", description: `No curated picks available for ${selectedCity}` });
      return;
    }
    
    if (!confirm(`Reset to ${featuredActivities.length} popular picks for ${selectedCity}? This will remove your custom picks.`)) return;
    
    try {
      const apiBase = getApiBaseUrl();
      
      // First clear all current picks
      for (const pick of userPicksForCity) {
        await fetch(`${apiBase}/api/user-city-interests/${pick.id}`, {
          method: 'DELETE',
          headers: { 'x-user-id': currentUserId?.toString() || '' }
        });
      }
      
      // Then add all featured activities
      const newPicks: any[] = [];
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
          const newPick = await response.json();
          newPicks.push(newPick);
        }
      }
      
      setUserActivities(prev => [
        ...prev.filter(ua => ua.cityName !== selectedCity),
        ...newPicks
      ]);
      toast({ title: "Reset complete", description: `Added ${newPicks.length} popular picks for ${selectedCity}` });
      fetchMatchingUsers();
    } catch (error) {
      console.error('Reset to popular error:', error);
      toast({ title: "Error", description: "Failed to reset picks", variant: "destructive" });
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
    
    console.log('🔄 TOGGLE ACTIVITY CLICKED!!!:', activityId, activityName, 'currently selected:', isCurrentlySelected);
    console.log('🔄 TOGGLE: userId =', userId, 'city =', selectedCity);

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
    
    console.log('🗑️ DELETE ACTIVITY: userActivityId:', userActivityId, 'userId:', userId, 'actualUser:', actualUser);
    
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/user-city-interests/${userActivityId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId.toString()
        }
      });

      console.log('🗑️ DELETE RESPONSE:', response.status, response.ok);

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
        // Update the city activity name in the city activities list
        const cityActivityResponse = await fetch(`${apiBase}/api/city-activities/${editingActivity.activityId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId.toString()
          },
          body: JSON.stringify({
            activityName: editingActivityName,
            description: 'Updated activity'
          })
        });

        if (cityActivityResponse.ok) {
          setCityActivities(prev => prev.map(activity => 
            activity.id === editingActivity.activityId 
              ? { ...activity, name: editingActivityName }
              : activity
          ));
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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-orange-900">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Toggle Button */}
          {!isInitialHeroVisible && (
            <div className="mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleInitialHeroVisibility}
                className="text-sm bg-white/10 text-white border-white/20 hover:bg-white/20"
                data-testid="button-show-match-initial-hero"
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                Show Hero Section
              </Button>
            </div>
          )}
          
          {isInitialHeroVisible && (
          <div className="text-center mb-8 relative">
            {/* Hide Hero Button - positioned below title on mobile */}
            <div className="flex justify-end mb-2 md:absolute md:top-0 md:right-0 md:mb-0">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleInitialHeroVisibility}
                className="text-sm bg-white/10 text-white border-white/20 hover:bg-white/20"
                data-testid="button-hide-match-initial-hero"
              >
                <X className="w-4 h-4 mr-2" />
                Hide
              </Button>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">🎯 Match in City</h1>
            <p className="text-xl text-white/80 mb-4">Select a city to start matching with people!</p>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-white/90 text-sm leading-relaxed">
                🎯 <strong>Choose activities you want to do</strong> → Get matched with others who share your interests<br/>
                ✏️ <strong>Add your own activities</strong> → Help others discover new experiences<br/>
                💫 <strong>Connect with locals & travelers</strong> → Plan meetups and explore together
              </p>
            </div>
          </div>
          )}

          {/* Search Cities */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-white/50" />
              <Input
                placeholder="Search cities..."
                value={citySearchTerm}
                onChange={(e) => setCitySearchTerm(e.target.value)}
                className="pl-12 bg-white/10 border-white/20 text-white placeholder-white/50"
              />
            </div>
          </div>

          {/* Cities Grid - RESTORED BEAUTIFUL DESIGN */}
          {isCitiesLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
              <p className="text-white text-lg">Loading cities...</p>
            </div>
          ) : filteredCities.length === 0 && citySearchTerm ? (
            <div className="flex flex-col items-center justify-center py-20">
              <MapPin className="w-12 h-12 text-white/50 mb-4" />
              <p className="text-white text-lg font-medium mb-2">
                No cities found matching your search
              </p>
              <p className="text-white/70 text-center max-w-md">
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
        </div>
      </div>
    );
  }

  const selectedCityData = allCities.find(c => c.city === selectedCity);
  const isActivityActive = (activityId: number) => {
    const isActive = userActivities.some(ua => ua.activityId === activityId);
    console.log(`🔍 ACTIVITY ACTIVE CHECK: ${activityId} = ${isActive}, userActivities:`, userActivities.length);
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
        
        toast({
          title: "Activity Deleted",
          description: "Activity removed from city",
        });
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedCity('')}
            className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cities
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCity}</h1>
          </div>
          <div className="w-20" />
        </div>

        {/* Hero Toggle Button */}
        {!isHeroVisible && (
          <div className="max-w-4xl mx-auto mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleHeroVisibility}
              className="text-sm"
              data-testid="button-show-match-hero"
            >
              <ChevronDown className="w-4 h-4 mr-2" />
              Show Instructions
            </Button>
          </div>
        )}

        {/* Instructions */}
        {isHeroVisible && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              {/* Mobile: Stack vertically, Desktop: Side by side */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200">🎯 How City Plans Works</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleHeroVisibility}
                  className="text-sm w-fit"
                  data-testid="button-hide-match-hero"
                >
                  <X className="w-4 h-4 mr-2" />
                  Hide Instructions
                </Button>
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <p>• <strong>Choose activities you want to do</strong> → Get matched with others who share your interests</p>
                <p>• <strong>Add your own activities</strong> → Help others discover new experiences</p>
                <p>• <strong>Connect with locals & travelers</strong> → Plan meetups and explore together</p>
                <p>• <strong>Edit or delete outdated activities</strong> → Keep your interests current and relevant</p>
              </div>
            </div>
          </div>
        )}

        {/* Activity Selection Interface - GORGEOUS RESTORED DESIGN */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-white via-blue-50 to-orange-50 dark:from-gray-800 dark:via-blue-900/30 dark:to-orange-900/30 border border-blue-200/50 dark:border-blue-700/50 rounded-2xl shadow-2xl backdrop-blur-sm">
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent mb-2">⭐ City Plans for {selectedCity}</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">Pick to match faster in this city.</p>
              </div>

              {/* Mobile Section Switcher - Show only on mobile */}
              <div className="md:hidden sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm py-3 -mx-8 px-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {[
                    { id: 'selected', label: `✓ Your Picks`, count: userActivities.filter(ua => ua.cityName === selectedCity).length },
                    { id: 'popular', label: '⭐ Popular', count: cityActivities.filter(a => (a as any).isFeatured || (a as any).source === 'featured').length },
                    { id: 'ai', label: '✨ AI Ideas', count: cityActivities.filter(a => !((a as any).isFeatured || (a as any).source === 'featured') && a.category !== 'universal').length },
                    { id: 'preferences', label: '✈️ Preferences', count: 20 },
                  ].map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveMobileSection(section.id as typeof activeMobileSection)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                        activeMobileSection === section.id
                          ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {section.label} {section.count > 0 && <span className="ml-1 opacity-80">({section.count})</span>}
                    </button>
                  ))}
                  <button
                    onClick={() => setActiveMobileSection('all')}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      activeMobileSection === 'all'
                        ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
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
                      placeholder="Search city picks..."
                      value={activitySearchFilter}
                      onChange={(e) => setActivitySearchFilter(e.target.value)}
                      className="pl-9 py-2 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-full"
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

              {/* SECTION 1: YOUR PICKS - User's selected + user-created activities */}
              {(() => {
                const userPicksForCity = userActivities.filter(ua => ua.cityName === selectedCity);
                const storedUser = localStorage.getItem('travelconnect_user');
                const authUser = localStorage.getItem('user');
                const actualUser = user || (storedUser ? JSON.parse(storedUser) : null) || (authUser ? JSON.parse(authUser) : null);
                const currentUserId = actualUser?.id;
                
                // Mobile: only show if this section is active or showing all
                const isMobileVisible = activeMobileSection === 'selected' || activeMobileSection === 'all';
                
                return (
                  <div className={`mb-8 md:block ${isMobileVisible ? 'block' : 'hidden'}`}>
                    {/* Header with action buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                          Your Picks {userPicksForCity.length > 0 && <span className="text-green-600">({userPicksForCity.length})</span>}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Things you want to do in {selectedCity}</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Button
                          onClick={() => setShowAddPickModal(true)}
                          size="sm"
                          className="bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add a City Pick
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
                        {/* Overflow menu for cleanup actions */}
                        {userPicksForCity.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white dark:bg-gray-900">
                              <DropdownMenuItem 
                                onClick={handleClearAllPicks}
                                className="text-red-600 dark:text-red-400 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Clear all picks
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={handleResetToPopular}
                                className="cursor-pointer"
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Reset to Popular
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    
                    {/* User's picks display */}
                    {userPicksForCity.length > 0 ? (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl border border-green-200 dark:border-green-700">
                        <div className="flex flex-wrap gap-2">
                          {userPicksForCity.map((ua) => {
                            const activity = cityActivities.find(ca => ca.id === ua.activityId);
                            const activityName = ua.activityName || activity?.activityName || 'Unknown';
                            // Check if user-created: from activity data, or from userActivity source field, or if creator matches current user
                            const isUserCreated = (activity?.createdByUserId === currentUserId) || 
                                                  (activity?.source === 'user' && activity?.createdByUserId === currentUserId) ||
                                                  (ua.source === 'user' && ua.createdByUserId === currentUserId);
                            const categoryInfo = CITY_PICK_CATEGORIES.find(c => c.id === activity?.category);
                            
                            return (
                              <div key={ua.id} className="group relative">
                                <div className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg text-sm font-medium shadow-md">
                                  {categoryInfo && <span className="text-xs">{categoryInfo.emoji}</span>}
                                  <span>{activityName}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isUserCreated && activity) {
                                        // Delete user-created pick
                                        if (confirm(`Delete "${activityName}"? This will remove it completely.`)) {
                                          handleDeleteCityActivity(activity.id);
                                        }
                                      } else {
                                        // Unselect (not delete)
                                        handleUnselectPick(ua.id, activityName);
                                      }
                                    }}
                                    className="ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors"
                                    title={isUserCreated ? "Delete pick" : "Remove from your picks"}
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
                          No picks yet. Select from below or add your own!
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Add City Pick Modal */}
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
                    <DialogTitle className="text-xl font-bold">Add a City Pick</DialogTitle>
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
                                ✓ You already have <strong>"{similarActivity.name}"</strong> in your picks!
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
                      className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white"
                    >
                      Add Pick
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* Dynamic City Activities - Featured + AI + Universal */}
              <div className="space-y-8">
                
                {/* SECTION 1: Popular in {City} - Featured Activities */}
                {(() => {
                  const featuredActivities = cityActivities
                    .filter(a => (a as any).isFeatured || (a as any).source === 'featured')
                    .filter(a => !activitySearchFilter || a.activityName.toLowerCase().includes(activitySearchFilter.toLowerCase()));
                  if (featuredActivities.length === 0 && !activitySearchFilter) return null;
                  
                  // Mobile: only show if this section is active or showing all
                  const isMobileVisible = activeMobileSection === 'popular' || activeMobileSection === 'all';
                  
                  return (
                    <div className={`md:block ${isMobileVisible ? 'block' : 'hidden'}`}>
                      <div className="text-center mb-6">
                        <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-2">⭐ Popular in {selectedCity}</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Must-see spots and local favorites</p>
                        <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 mx-auto rounded-full mt-2"></div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {featuredActivities
                          .sort((a, b) => ((a as any).rank || 0) - ((b as any).rank || 0))
                          .map((activity) => {
                            const isSelected = userActivities.some(ua => ua.activityId === activity.id);
                            return (
                              <button
                                key={activity.id}
                                className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg border-2 ${
                                  isSelected 
                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-yellow-400 shadow-yellow-200'
                                    : 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 text-gray-700 dark:text-gray-100 border-yellow-200 dark:border-yellow-600 hover:border-yellow-300 dark:hover:border-yellow-500'
                                }`}
                                onClick={() => toggleActivity(activity)}
                                data-testid={`featured-activity-${activity.id}`}
                              >
                                <span className="flex items-center justify-center gap-1.5">
                                  <span className="text-xs">⭐</span>
                                  {activity.activityName}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                      
                      {/* Mobile-only Jump to Match Preferences button */}
                      <div className="md:hidden mt-4 text-center">
                        <button
                          onClick={() => setActiveMobileSection('preferences')}
                          className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center justify-center gap-1 mx-auto"
                        >
                          <span>✈️</span> Jump to Match Preferences
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* SUGGESTED FOR YOU - Contextual follow-ups based on selections */}
                {(() => {
                  // Get user's selected universal preferences for this city
                  const selectedUniversals = userActivities
                    .filter(ua => ua.cityName === selectedCity)
                    .map(ua => ua.activityName)
                    .filter(name => getTravelActivities().includes(name));
                  
                  if (selectedUniversals.length === 0) return null;
                  
                  // Get featured activities (Popular section) to exclude
                  const featuredActivityIds = new Set(
                    cityActivities
                      .filter(a => (a as any).isFeatured || (a as any).source === 'featured')
                      .map(a => a.id)
                  );
                  
                  // Track user's already-selected activity IDs
                  const userSelectedIds = new Set(
                    userActivities.filter(ua => ua.cityName === selectedCity).map(ua => ua.activityId)
                  );
                  
                  // Track already-suggested to avoid duplicates
                  const suggestedIds = new Set<number>();
                  const suggestedNormalized = new Set<string>();
                  
                  // Generate suggestions - prefer named city-specific items first
                  const suggestions: { name: string; because: string; existingActivity: any }[] = [];
                  
                  for (const universal of selectedUniversals) {
                    if (suggestions.length >= 5) break;
                    
                    const categories = UNIVERSAL_TO_CATEGORIES[universal] || [];
                    const keywords = UNIVERSAL_KEYWORDS[universal] || [];
                    
                    // Find city activities matching this universal by category or keywords
                    // Use scoring: +3 category match, +2 exact keyword match, +1 partial match
                    const scoredActivities = cityActivities
                      .map(ca => {
                        // Skip if already in Popular section
                        if (featuredActivityIds.has(ca.id)) return null;
                        // Skip if already selected by user
                        if (userSelectedIds.has(ca.id)) return null;
                        // Skip if already suggested
                        if (suggestedIds.has(ca.id)) return null;
                        // Skip universal activities (they belong in preferences section)
                        if (ca.category === 'universal') return null;
                        
                        let score = 0;
                        const nameNorm = normalizeName(ca.activityName);
                        
                        // +3 for category match
                        if (ca.category && categories.some(cat => 
                          cat.toLowerCase() === ca.category?.toLowerCase()
                        )) {
                          score += 3;
                        }
                        
                        // +2 for exact keyword match in name
                        if (keywords.some(kw => {
                          const kwNorm = kw.toLowerCase();
                          // Exact word match (not substring)
                          return nameNorm.split(/\s+/).some(word => word === kwNorm || word.startsWith(kwNorm));
                        })) {
                          score += 2;
                        }
                        
                        // Must have some match to be included
                        if (score === 0) return null;
                        
                        return { activity: ca, score };
                      })
                      .filter((item): item is { activity: any; score: number } => item !== null)
                      .sort((a, b) => {
                        // Sort by score first
                        if (a.score !== b.score) return b.score - a.score;
                        // Then featured first
                        const aFeat = (a.activity as any).isFeatured ? 1 : 0;
                        const bFeat = (b.activity as any).isFeatured ? 1 : 0;
                        if (aFeat !== bFeat) return bFeat - aFeat;
                        // Then by rank
                        return ((a.activity as any).rank || 999) - ((b.activity as any).rank || 999);
                      });
                    
                    const matchingActivities = scoredActivities.map(s => s.activity);
                    
                    // Add up to 2 suggestions per universal to keep variety
                    let addedForUniversal = 0;
                    for (const activity of matchingActivities) {
                      if (suggestions.length >= 5 || addedForUniversal >= 2) break;
                      
                      const nameNorm = normalizeName(activity.activityName);
                      // Skip synonyms/duplicates
                      if (suggestedNormalized.has(nameNorm)) continue;
                      
                      suggestedIds.add(activity.id);
                      suggestedNormalized.add(nameNorm);
                      suggestions.push({
                        name: activity.activityName,
                        because: universal,
                        existingActivity: activity
                      });
                      addedForUniversal++;
                    }
                  }
                  
                  // If no suggestions but user has selections, show fallback hint
                  if (suggestions.length === 0) {
                    return (
                      <div className="mb-6 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Want more ideas? Tap <span className="font-medium text-purple-600 dark:text-purple-400">"Suggest 6 more"</span> below.
                        </p>
                      </div>
                    );
                  }
                  
                  // Get unique trigger universals for display
                  const triggerUniversals = [...new Set(suggestions.map(s => s.because))];
                  
                  return (
                    <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 sm:p-6 border border-green-200 dark:border-green-700">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-1">
                          <Lightbulb className="inline-block w-5 h-5 mr-1 -mt-1" />
                          Suggested for you
                        </h3>
                        <p className="text-green-600 dark:text-green-400 text-sm">
                          Because you picked: {triggerUniversals.slice(0, 2).join(', ')}
                          {triggerUniversals.length > 2 && ` +${triggerUniversals.length - 2} more`}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {suggestions.map((suggestion, index) => {
                          const isAlreadySelected = userSelectedIds.has(suggestion.existingActivity.id);
                          
                          return (
                            <div key={suggestion.existingActivity.id} className="relative group">
                              <button
                                onClick={async () => {
                                  if (isAlreadySelected) return;
                                  
                                  const actualUser = user || JSON.parse(localStorage.getItem('user') || '{}');
                                  if (!actualUser?.id) return;
                                  
                                  try {
                                    const apiBase = getApiBaseUrl();
                                    // Add existing activity to user's interests
                                    await fetch(`${apiBase}/api/user-city-interests`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', 'x-user-id': actualUser.id.toString() },
                                      body: JSON.stringify({ userId: actualUser.id, activityId: suggestion.existingActivity.id, cityName: selectedCity })
                                    });
                                    
                                    fetchUserActivities();
                                    fetchCityActivities();
                                    toast({ title: "Added!", description: suggestion.name });
                                  } catch (error) {
                                    console.error('Error adding suggestion:', error);
                                  }
                                }}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                                  isAlreadySelected 
                                    ? 'bg-green-500 text-white border-green-400'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-green-300 dark:border-green-600 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  {isAlreadySelected ? '✓' : <Plus className="w-3 h-3" />}
                                  {suggestion.name}
                                </span>
                              </button>
                              {/* "Why?" tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                You picked {suggestion.because}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* SECTION 2: More {City} Ideas - AI-Generated Activities */}
                <div className={`md:block ${activeMobileSection === 'ai' || activeMobileSection === 'all' ? 'block' : 'hidden'}`}>
                  <div className="text-center mb-6">
                    <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">✨ More {selectedCity} Ideas</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-4">AI-generated unique experiences for this city</p>
                    <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
                    
                    {/* AI Enhancement Button */}
                    <Button
                      onClick={async () => {
                        try {
                          setIsLoading(true);
                          toast({
                            title: "Generating Ideas",
                            description: `Finding unique ${selectedCity} experiences...`,
                          });
                          
                          const apiBase = getApiBaseUrl();
                          const response = await fetch(`${apiBase}/api/city-activities/${selectedCity}/enhance`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                          });
                          
                          if (response.ok) {
                            toast({
                              title: "New Ideas Added!",
                              description: `Found unique ${selectedCity} experiences`,
                            });
                            fetchCityActivities(); // Refresh the list
                          } else {
                            throw new Error('Failed to generate activities');
                          }
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to generate ideas",
                            variant: "destructive",
                          });
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      size="sm"
                      className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      data-testid="button-enhance-ai-activities"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Finding ideas...' : 'Suggest 6 more ideas'}
                    </Button>
                  </div>
                  
                  {cityActivities.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {(() => {
                        // Universal activities list for comparison - use TRAVEL_ACTIVITIES
                        const universalActivities = getTravelActivities();
                        
                        // Check if a city activity is too similar to a universal activity
                        const isSimilarToUniversal = (activityName: string) => {
                          const normalized = activityName.toLowerCase().trim();
                          return universalActivities.some(universal => {
                            const universalNormalized = universal.toLowerCase().trim();
                            // Check for exact match or if one contains the other
                            return normalized === universalNormalized || 
                                   normalized.includes(universalNormalized) || 
                                   universalNormalized.includes(normalized);
                          });
                        };
                        
                        // Filter out universal category, featured, similar to universal, and dismissed AI activities
                        // Only show AI and user-created activities in this section
                        return cityActivities
                          .filter(activity => {
                            // Exclude featured (they have their own section)
                            if ((activity as any).isFeatured || (activity as any).source === 'featured') return false;
                            if (activity.category === 'universal') return false;
                            if (isSimilarToUniversal(activity.activityName)) return false;
                            // Filter out dismissed AI activities
                            if (activity.createdByUserId === 1 && dismissedAIActivities.has(activity.id)) return false;
                            // Hide dated picks after their date has passed
                            const activityDate = (activity as any).activityDate;
                            if (activityDate) {
                              const pickDate = new Date(activityDate);
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              if (pickDate < today) return false; // Hide expired dated picks
                            }
                            // Apply search filter
                            if (activitySearchFilter && !activity.activityName.toLowerCase().includes(activitySearchFilter.toLowerCase())) return false;
                            return true;
                          })
                          .sort((a, b) => {
                            // AI-created (createdByUserId === 1) activities first
                            const aIsAI = a.createdByUserId === 1;
                            const bIsAI = b.createdByUserId === 1;
                            if (aIsAI && !bIsAI) return -1;
                            if (!aIsAI && bIsAI) return 1;
                            return 0;
                          })
                          .map((activity, index) => {
                        const isSelected = userActivities.some(ua => ua.activityId === activity.id);
                        const userActivity = userActivities.find(ua => ua.activityId === activity.id);
                        
                        // Get current user ID - check multiple sources
                        const storedUser = localStorage.getItem('travelconnect_user');
                        const actualUser = user || (storedUser ? JSON.parse(storedUser) : null);
                        const currentUserId = actualUser?.id;
                        
                        // Check if this activity was created by current user (for EDIT permission)
                        const isUserCreated = activity.createdByUserId === currentUserId;
                        
                        // AI-created activities can be dismissed (not deleted from DB, just hidden)
                        const isAICreated = activity.createdByUserId === 1;
                        // User-created activities can be edited/deleted
                        const canShowUserActions = !isAICreated && activity.createdByUserId && activity.createdByUserId > 1;
                        
                        return (
                          <div key={activity.id} className="group relative">
                            <button
                              className={`w-full px-5 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 ${
                                isSelected 
                                  ? 'bg-gradient-to-r from-blue-600 to-orange-600 text-white border-blue-400 shadow-blue-200'
                                  : isAICreated
                                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 text-gray-700 dark:text-gray-100 border-purple-200 dark:border-purple-500 hover:border-purple-300 dark:hover:border-purple-400'
                                    : 'bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-100 border-gray-200 dark:border-gray-500 hover:border-blue-300 dark:hover:border-blue-400 hover:shadow-blue-100 dark:hover:shadow-blue-900/50'
                              }`}
                              onClick={() => {
                                toggleActivity(activity);
                              }}
                              onMouseDown={(e) => {
                                console.log('🖱️ PILL MOUSE DOWN!', activity.activityName);
                              }}
                              data-testid="activity-pill"
                              type="button"
                              style={{ pointerEvents: 'auto', zIndex: 1 }}
                            >
                              <span className="relative z-10 flex items-center justify-center gap-1.5">
                                {isAICreated && <span className="text-xs">✨</span>}
                                {activity.activityName}
                                {(activity as any).activityDate && (
                                  <span className="text-xs opacity-80">
                                    • {new Date((activity as any).activityDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </span>
                            </button>
                            
                            {/* DISMISS button for AI-created activities */}
                            {isAICreated && (
                              <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  className="w-5 h-5 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-gray-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissAIActivity(activity.id);
                                  }}
                                  title="Dismiss this AI suggestion"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                            
                            {/* Edit/Delete buttons - ONLY show for USER-created activities (NOT AI/system activities) */}
                            {canShowUserActions && (
                              <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                                {/* EDIT button - only for activity creator */}
                                {isUserCreated && (
                                  <button
                                    className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log('🔧 EDIT CLICKED for activity:', activity.activityName);
                                      setEditingActivity({ id: userActivity?.id || activity.id, name: activity.activityName, activityId: activity.id });
                                      setEditingActivityName(activity.activityName);
                                    }}
                                  >
                                    <Edit className="w-2.5 h-2.5" />
                                  </button>
                                )}
                                {/* DELETE button - available to ALL users for user-created activities only */}
                                <button
                                  className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('🔧 DELETE CLICKED for activity:', activity.activityName);
                                    if (userActivity) {
                                      handleDeleteActivity(userActivity.id);
                                    } else {
                                      // Delete city activity if user hasn't selected it
                                      handleDeleteCityActivity(activity.id);
                                    }
                                  }}
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                    </div>
                  )}
                </div>

                {/* SECTION 3: Universal Travel Activities - Always show these for every city */}
                <div className={`mt-8 md:block ${activeMobileSection === 'preferences' || activeMobileSection === 'all' ? 'block' : 'hidden'}`}>
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-orange-500 bg-clip-text text-transparent mb-2">✈️ Universal Match Preferences</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Match with travelers & locals who want to do these same things in {selectedCity}</p>
                    <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-orange-500 mx-auto rounded-full mt-2"></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {(() => {
                      // Use the proper TRAVEL_ACTIVITIES from base-options.ts
                      const travelActivities = getTravelActivities()
                        .filter(a => !activitySearchFilter || a.toLowerCase().includes(activitySearchFilter.toLowerCase()));
                      
                      return travelActivities.map((activity, index) => {
                      // Check if user already has this activity in their interests
                      const isSelected = userActivities.some(ua => ua.activityName === activity && ua.cityName === selectedCity);
                      
                      return (
                        <button
                          key={activity}
                          className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg border-2 ${
                            isSelected 
                              ? 'bg-gradient-to-r from-blue-600 to-orange-600 text-white border-blue-400 shadow-blue-200'
                              : 'bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-100 border-gray-200 dark:border-gray-500 hover:border-blue-300 dark:hover:border-blue-400 hover:shadow-blue-100 dark:hover:shadow-blue-900/50'
                          }`}
                          onClick={async () => {
                            console.log('🎯 Universal activity clicked:', activity);
                            
                            // Get authenticated user - check multiple sources
                            const storedUser = localStorage.getItem('travelconnect_user');
                            const authStorageUser = localStorage.getItem('user');
                            
                            let actualUser = user;
                            if (!actualUser && storedUser) {
                              try {
                                actualUser = JSON.parse(storedUser);
                              } catch (e) {
                                console.error('Failed to parse stored user:', e);
                              }
                            }
                            if (!actualUser && authStorageUser) {
                              try {
                                actualUser = JSON.parse(authStorageUser);
                              } catch (e) {
                                console.error('Failed to parse auth storage user:', e);
                              }
                            }
                            
                            console.log('🔧 AUTH CHECK:', { user, storedUser: !!storedUser, authStorageUser: !!authStorageUser, actualUser: !!actualUser });
                            
                            // This should never happen due to page-level auth protection
                            if (!actualUser?.id) {
                              console.error('❌ CRITICAL: No user ID found despite page-level auth');
                              return;
                            }
                            
                            const userId = actualUser.id;
                            console.log('🔧 Using userId:', userId);
                            
                            // Create this as a city activity if it doesn't exist, then toggle
                            try {
                              const apiBase = getApiBaseUrl();
                              if (!isSelected) {
                                // First create the activity for this city if it doesn't exist
                                const createResponse = await fetch(`${apiBase}/api/city-activities`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'x-user-id': userId.toString()
                                  },
                                  body: JSON.stringify({
                                    cityName: selectedCity,
                                    activityName: activity,
                                    createdByUserId: userId,
                                    description: 'Universal activity',
                                    category: 'universal'
                                  })
                                });
                                
                                if (createResponse.ok) {
                                  const newActivity = await createResponse.json();
                                  
                                  // Add to user interests
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
                                    const newUserActivity = await interestResponse.json();
                                    setUserActivities(prev => [...prev, newUserActivity]);
                                    fetchUserActivities(); // Refresh to sync
                                    
                                    // Sync to user profile immediately with captured state
                                    const selectedNames = [...userActivities, newUserActivity]
                                      .filter(ua => ua.cityName === selectedCity)
                                      .map(ua => ua.activityName);
                                    
                                    // Immediate sync with captured city name and state
                                    syncActivitiesToProfile(selectedNames, selectedCity);
                                  }
                                }
                              } else {
                                // Remove from user activities (handleDeleteActivity already syncs to profile)
                                const userActivity = userActivities.find(ua => ua.activityName === activity && ua.cityName === selectedCity);
                                if (userActivity) {
                                  await handleDeleteActivity(userActivity.id);
                                }
                              }
                            } catch (error) {
                              console.error('Error handling universal activity:', error);
                            }
                          }}
                          data-testid={`universal-activity-${activity.replace(/\s+/g, '-').toLowerCase()}`}
                        >
                          {activity}
                        </button>
                      );
                    });
                    })()}
                  </div>
                </div>

                {/* SECTION 4: Selected Items - Mobile Only View */}
                <div className={`mt-8 md:hidden ${activeMobileSection === 'selected' ? 'block' : 'hidden'}`}>
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent mb-2">✓ Your Selected Picks</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{userActivities.filter(ua => ua.cityName === selectedCity).length} picks for {selectedCity}</p>
                    <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-blue-500 mx-auto rounded-full mt-2"></div>
                  </div>
                  {userActivities.filter(ua => ua.cityName === selectedCity).length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {userActivities.filter(ua => ua.cityName === selectedCity).map((activity) => (
                        <div key={activity.id} className="group relative">
                          <div className="px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg border-2 border-green-400">
                            <span className="flex items-center justify-center gap-1.5">
                              <span className="text-xs">✓</span>
                              {activity.activityName}
                            </span>
                          </div>
                          <button
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                            onClick={() => handleDeleteActivity(activity.id)}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>No picks selected yet.</p>
                      <p className="text-sm mt-2">Tap on activities in other sections to add them!</p>
                    </div>
                  )}
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
              <span className="text-sm text-gray-500 dark:text-gray-400">({matchingUsers.length})</span>
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
                      {matchedUser.sharedActivities.slice(0, 2).join(', ')}
                      {matchedUser.sharedActivities.length > 2 && '...'}
                    </p>
                    
                    {/* AI Insight (expandable) */}
                    {matchingInsight[matchedUser.id] && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
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

      {/* Edit Activity Modal */}
      {editingActivity && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Activity</h3>
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
          </div>
        </div>
      )}

      {/* Sticky Selected Bar - Always visible when activities are selected for current city */}
      {selectedCity && userActivities.filter(ua => ua.cityName === selectedCity).length > 0 && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40">
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
                    description: `All picks for ${selectedCity} have been cleared.`,
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
                    title: "Picks Saved!",
                    description: `Your ${userActivities.filter(ua => ua.cityName === selectedCity).length} picks for ${selectedCity} are saved. You'll match with others who share these interests.`,
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
    </div>
  );
}