import React, { useState, useContext, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AuthContext } from "@/App";
import { useIsMobile, useIsDesktop } from "@/hooks/useDeviceType";
import UserCard from "@/components/user-card";
import EventCard from "@/components/event-card";
import MessagePreview from "@/components/message-preview";
// MobileNav removed - using global mobile navigation
import DestinationModal from "@/components/destination-modal";
import ConnectModal from "@/components/connect-modal";
import Recommendations from "@/components/recommendations";
import AIChatBot from "@/components/ai-chat-bot";
import NotificationBell from "@/components/notification-bell";
import { EmbeddedChatWidget } from "@/components/EmbeddedChatWidget";


import { datesOverlap, formatDateForDisplay, getCurrentTravelDestination } from "@/lib/dateUtils";
import { format } from "date-fns";
import { getVersionedCityImage } from "@/lib/imageVersioning";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Globe, Users, MapPin, Briefcase, Calendar, Filter, X, ChevronDown, ChevronRight, MessageCircle, Camera, Search, Store, Hash, Tag, AlertCircle, ArrowUpDown, Clock, Zap, Star, Coffee, Phone, Plane } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { getAllInterests, getAllActivities, getAllEvents, getAllLanguages, validateSelections, getMostPopularInterests } from "../../../shared/base-options";
import { BASE_TRAVELER_TYPES } from "../../../shared/base-options";
import { getInterestStyle, getActivityStyle, getEventStyle } from "@/lib/topChoicesUtils";
import type { User, Event, Message } from "@shared/schema";
import SmartPhotoGallery from "@/components/smart-photo-gallery";
import SmartLocationInput from "@/components/SmartLocationInput";
import AICityEventsWidget from "@/components/ai-city-events";
import TravelMatches from "@/components/travel-matches";

import ResponsiveUserGrid from "@/components/ResponsiveUserGrid";
import { SimpleAvatar } from "@/components/simple-avatar";

import MessagesWidget from "@/components/MessagesWidget";
import EventsWidget from "@/components/EventsWidget";
import EventsGrid from "@/components/EventsGrid";
import CurrentLocationWeatherWidget from "@/components/CurrentLocationWeatherWidget";
import EnhancedDiscovery from "@/components/EnhancedDiscovery";

import BusinessesGrid from "@/components/BusinessesGrid";
import { QuickMeetupWidget } from "@/components/QuickMeetupWidget";
import { ContextualEventRecommendations } from "@/components/ContextualEventRecommendations";
import QuickDealsDiscovery from "@/components/QuickDealsDiscovery";
import CityMap from "@/components/CityMap";
import PeopleDiscoveryWidget from "@/components/PeopleDiscoveryWidget";
import LocationSortedEvents from "@/components/LocationSortedEvents";


// Import centralized constants for consistency
import { GENDER_OPTIONS, SEXUAL_PREFERENCE_OPTIONS, PRIVACY_NOTES } from "@/lib/formConstants";

const USER_TYPE_OPTIONS = [
  "traveler", "local", "business"
];

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [activeLocationFilter, setActiveLocationFilter] = useState<string>("");
  const [connectModalMode, setConnectModalMode] = useState<'current' | 'hometown'>('current');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'active' | 'compatibility' | 'travel_experience' | 'closest_nearby' | 'aura' | 'references' | 'alphabetical'>('recent');

  const { user, setUser } = useContext(AuthContext);

  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Manage collapse state for filter sections
  const [expandedSections, setExpandedSections] = useState({
    demographics: false,
    topChoices: false,
    interests: false,
    activities: false,
    events: false,
    travelerTypes: false,
    militaryStatus: false,
    location: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Enhanced filters state
  const [filters, setFilters] = useState({
    gender: [] as string[],
    sexualPreference: [] as string[],
    minAge: "",
    maxAge: "",
    interests: [] as string[],
    activities: [] as string[],
    location: "",
    search: "",
    userType: [] as string[],
    events: [] as string[],
    travelerTypes: [] as string[],
    militaryStatus: [] as string[],
    startDate: "",
    endDate: ""
  });

  // Enhanced location filter
  const [locationFilter, setLocationFilter] = useState({
    country: "",
    state: "",
    city: ""
  });

  console.log('✅ Found user data in user:', user ? { id: user.id, username: user.username } : 'none');

  // Store multiple versions of user data as we have several sources
  // Priority: user context > localStorage > URL params
  const effectiveUser = useMemo(() => {
    console.log('🔧 Setting user in all storage keys:', user ? { id: user.id, username: user.username } : 'none');
    
    if (user) {
      return user;
    }

    // Fallback to localStorage
    const storedUser = localStorage.getItem('travelconnect_user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }

    return null;
  }, [user]);

  // Get user travel plans - use the same query as profile page for consistency
  const { data: travelPlans = [] } = useQuery({
    queryKey: [`/api/travel-plans-with-itineraries/${effectiveUser?.id}`],
    enabled: !!effectiveUser?.id
  });

  // Enrich user with travel destination data based on travel plans
  const enrichUserWithTravelData = (user: any, travelPlans: any[]) => {
    if (!user) return user;

    // Get current travel destination using the same logic as weather widget
    const currentTravelDestination = getCurrentTravelDestination(travelPlans || []);
    
    return {
      ...user,
      travelDestination: currentTravelDestination,
      isCurrentlyTraveling: !!currentTravelDestination
    };
  };

  // Apply enrichment to effective user consistently
  const enrichedEffectiveUser = enrichUserWithTravelData(effectiveUser, travelPlans);

  const {
    data: matchedUsers = []
  } = useQuery({
    queryKey: ['/api/users/best-matches', effectiveUser?.id],
    enabled: !!effectiveUser?.id && activeFilter === "best-matches"
  });

  // Get recommended events based on user's interests and location
  const { data: recommendedEvents = [] } = useQuery({
    queryKey: ['/api/events/recommendations', effectiveUser?.id],
    enabled: !!effectiveUser?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['/api/messages'],
    enabled: !!effectiveUser?.id,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Precompute search location for API calls
  const searchLocation = useMemo(() => {
    if (filters.location && filters.location.trim() !== "") {
      return filters.location;
    }
    
    if (activeFilter === "location" && activeLocationFilter && activeLocationFilter !== "") {
      return activeLocationFilter;
    }
    
    return "";
  }, [filters.location, activeFilter, activeLocationFilter]);

  // Date overlap checking function
  const checkDateOverlap = (startA: string, endA: string, startB: string, endB: string): boolean => {
    const start1 = new Date(startA);
    const end1 = new Date(endA);
    const start2 = new Date(startB);
    const end2 = new Date(endB);
    
    return start1 <= end2 && start2 <= end1;
  };

  // Query with unified users API logic to handle ALL users scenarios
  const { data: rawUsers = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['/api/users', { location: searchLocation }],
    queryFn: async () => {
      const currentUserId = effectiveUser?.id;

      if (searchLocation && searchLocation.trim() !== "") {
        // Location-specific API call - already handles server-side filtering by city
        console.log('Fetching users for location:', searchLocation);
        const response = await fetch(`/api/users?location=${encodeURIComponent(searchLocation)}`, {
          headers: {
            ...(currentUserId && { 'x-user-id': currentUserId.toString() })
          }
        });
        if (!response.ok) throw new Error('Failed to fetch users by location');
        const data = await response.json();
        console.log('Location search API response:', data.length, 'users for', searchLocation);
        return data;
      } else {
        // Show ALL users for general discovery (not limited to specific cities)
        console.log('Fetching ALL users for discovery');
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch all users');
        const data = await response.json();
        console.log('ALL users API response:', data.length, 'total users for discovery');
        return data;
      }
    },
    enabled: true, // Always enabled
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  // Enrich ALL users with travel data at query level (same pattern as effectiveUser)
  const users = useMemo(() => {
    if (!rawUsers.length) return [];
    
    console.log('🔄 ENRICHING USERS: Processing', rawUsers.length, 'users with travel data');
    
    return rawUsers.map(user => {
      const enriched = enrichUserWithTravelData(user, user.travelPlans);
      console.log(`🔄 USER ${user.username}: enriched with travel destination:`, enriched.travelDestination);
      return enriched;
    });
  }, [rawUsers]);

  // Auto-detect business location for automatic nearby user discovery
  const getBusinessLocation = () => {
    if (effectiveUser?.userType === 'business' && effectiveUser?.hometownCity) {
      return effectiveUser.hometownCity;
    }
    return null;
  };



  // Use matched users when "best-matches" filter is active, otherwise use regular users
  const usersToFilter = activeFilter === "best-matches" ? matchedUsers : users;

  // DEBUG: Check if events are somehow in the users data
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 PEOPLE DISCOVERY DEBUG:', {
      totalUsers: users.length,
      usersToFilterCount: usersToFilter.length,
      firstUser: usersToFilter[0],
      hasEventsInUsers: usersToFilter.some((item: any) => item.title || item.eventDate || item.description?.includes('Event')),
      userTypes: usersToFilter.map((item: any) => item.userType || item.type || 'unknown').slice(0, 5)
    });
  }

  // Prioritize users by SHARED MATCHES (interests + activities + events) first, then location relevance
  const prioritizeUsers = (users: User[]) => {
    if (!effectiveUser?.interests?.length && !effectiveUser?.activities?.length) return users;

    // Parse arrays safely
    const parseArray = (data: any): string[] => {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch {
          return [];
        }
      }
      return [];
    };

    const currentUserInterests = parseArray(effectiveUser.interests);
    const currentUserActivities = parseArray(effectiveUser.activities);
    const userHometown = effectiveUser?.hometownCity?.toLowerCase() || '';
    const userTravelDestinations = travelPlans?.map((plan: any) => plan.destination?.toLowerCase()) || [];

    return users.sort((a, b) => {
      // Priority 1: TOTAL SHARED MATCHES COUNT (interests + activities + events) - Most important factor
      const aSharedInterests = parseArray(a.interests).filter((interest: string) => 
        currentUserInterests.includes(interest)
      ).length;
      const aSharedActivities = parseArray(a.activities).filter((activity: string) => 
        currentUserActivities.includes(activity)
      ).length;
      const aTotalShared = aSharedInterests + aSharedActivities;

      const bSharedInterests = parseArray(b.interests).filter((interest: string) => 
        currentUserInterests.includes(interest)
      ).length;
      const bSharedActivities = parseArray(b.activities).filter((activity: string) => 
        currentUserActivities.includes(activity)
      ).length;
      const bTotalShared = bSharedInterests + bSharedActivities;

      if (aTotalShared !== bTotalShared) {
        return bTotalShared - aTotalShared; // Higher shared matches first
      }

      // Priority 2: Users from same hometown (but less important than interests)
      const aFromHometown = a.hometownCity?.toLowerCase()?.includes(userHometown) || false;
      const bFromHometown = b.hometownCity?.toLowerCase()?.includes(userHometown) || false;

      if (aFromHometown && !bFromHometown) return -1;
      if (!aFromHometown && bFromHometown) return 1;

      // Priority 3: Users traveling to my destinations
      const aToMyDestination = userTravelDestinations.some(dest => 
        a.location?.toLowerCase().includes(dest) || 
        a.travelDestination?.toLowerCase().includes(dest)
      );
      const bToMyDestination = userTravelDestinations.some(dest => 
        b.location?.toLowerCase().includes(dest) || 
        b.travelDestination?.toLowerCase().includes(dest)
      );

      if (aToMyDestination && !bToMyDestination) return -1;
      if (!aToMyDestination && bToMyDestination) return 1;

      return 0; // Keep original order for others
    });
  };

  const filteredUsers = prioritizeUsers(usersToFilter).filter(otherUser => {
    // Debug logging
    if (activeFilter === "location" && filters.location) {
      console.log(`Filtering user ${otherUser.username}:`, {
        location: otherUser.location,
        hometownCity: otherUser.hometownCity,
        filterLocation: filters.location,
        activeFilter
      });
    }

    // When location filter is active via Current City widget, server already filtered correctly
    // Don't exclude current user from location results - they should see themselves if they're in that city
    // BUT STILL EXCLUDE BUSINESS USERS FROM DISCOVER PEOPLE SECTION
    if (activeFilter === "location" && filters.location) {
      // CRITICAL FIX: Even with location filter, exclude businesses from "Discover People"
      if (otherUser.userType === "business") return false;
      return true; // Show all users returned by location search, including current user
    }

    // CRITICAL FIX: Exclude business users from "Discover People" section FIRST
    if (otherUser.userType === "business") return false;

    // CRITICAL FIX: Hide main user @nearbytravlr (ID 1) from all discovery
    if (otherUser.id === 1 || otherUser.username === 'nearbytravlr') {
      return false;
    }

    // CRITICAL FIX: Include current user when they're in their travel destination
    // Current user should appear in "Discover People" especially as newest member
    if (otherUser.id === effectiveUser?.id) {
      // Always include current user when:
      // 1. Location filter is active (they're viewing a specific city)
      // 2. Search is active
      // 3. They're currently traveling (should see themselves in their destination)
      // 4. Sorted by "recent" (newest members) - user should see themselves as newest
      if (filters.location || filters.search || effectiveUser?.isCurrentlyTraveling || sortBy === 'recent') return true;

      // Only exclude from general browsing without any specific context
      return false;
    }

    // Skip additional filtering for best matches - they're already optimally matched
    if (activeFilter === "best-matches") return true;

    // Apply advanced filters only when they are actually selected
    // Gender filter - only apply if at least one gender is selected
    if (filters.gender.length > 0 && !filters.gender.includes(otherUser.gender || "")) return false;

    // Sexual preference filter - only apply if at least one preference is selected
    if (filters.sexualPreference.length > 0) {
      const userPreferences = Array.isArray(otherUser.sexualPreference) ? otherUser.sexualPreference : [];
      const hasMatchingPreference = filters.sexualPreference.some(filterPref => 
        userPreferences.includes(filterPref)
      );
      if (!hasMatchingPreference) return false;
    }

    // Age filters - only apply if values are provided
    if ((filters.minAge && filters.minAge.trim() !== "") || (filters.maxAge && filters.maxAge.trim() !== "")) {
      if (otherUser.dateOfBirth) {
        const age = Math.floor((Date.now() - new Date(otherUser.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (filters.minAge && filters.minAge.trim() !== "" && age < parseInt(filters.minAge)) return false;
        if (filters.maxAge && filters.maxAge.trim() !== "" && age > parseInt(filters.maxAge)) return false;
      }
    }

    // Location filter - only apply if a location is specified
    if (filters.location && filters.location.trim() !== "") {
      const filterLocation = filters.location.toLowerCase();

      // Define metropolitan area mappings
      const metroAreas: Record<string, string[]> = {
        "playa del rey": ["los angeles", "la", "santa monica", "venice", "manhattan beach", "hermosa beach", "redondo beach", "torrance", "el segundo", "westchester", "lax", "beverly hills", "culver city", "marina del rey", "playa delrey"],
        "losangeles": ["los angeles", "la", "santa monica", "venice", "manhattan beach", "hermosa beach", "redondo beach", "torrance", "el segundo", "westchester", "lax", "beverly hills", "culver city", "marina del rey", "playa del rey"],
        "los angeles, ca": ["los angeles", "la", "santa monica", "venice", "manhattan beach", "hermosa beach", "redondo beach", "torrance", "el segundo", "westchester", "lax", "beverly hills", "culver city", "marina del rey", "playa del rey"],
        "new york": ["new york", "nyc", "brooklyn", "queens", "manhattan", "bronx", "staten island", "jersey city", "hoboken"],
        "manhattan, new york": ["new york", "nyc", "brooklyn", "queens", "manhattan", "bronx", "staten island", "jersey city", "hoboken"],
        "manhattan": ["new york", "nyc", "brooklyn", "queens", "manhattan", "bronx", "staten island", "jersey city", "hoboken"],
        "san francisco": ["san francisco", "sf", "oakland", "berkeley", "san jose", "palo alto", "mountain view", "fremont", "hayward"],
        "chicago": ["chicago", "evans ton", "naperville", "aurora", "joliet", "waukegan"],
        "miami": ["miami", "miami beach", "coral gables", "hialeah", "homestead", "aventura", "doral"],
        "london": ["london", "westminster", "camden", "kensington", "chelsea", "islington", "hackney", "tower hamlets", "southwark"],
        "tokyo": ["tokyo", "shibuya", "shinjuku", "harajuku", "ginza", "akihabara", "roppongi", "asakusa", "ueno"],
        "paris": ["paris", "montmartre", "marais", "latin quarter", "champs-élysées", "louvre", "notre dame"],
        "milan": ["milan", "milano", "lombardy", "lombardia"],
        "milan, italy": ["milan", "milano", "lombardy", "lombardia"],
        "denver": ["denver", "boulder", "aurora", "lakewood", "thornton", "arvada", "westminster", "centennial", "colorado springs"],
        "denver, colorado": ["denver", "boulder", "aurora", "lakewood", "thornton", "arvada", "westminster", "centennial", "colorado springs"],
        "denver, colorado, united states": ["denver", "boulder", "aurora", "lakewood", "thornton", "arvada", "westminster", "centennial", "colorado springs"],
        "barcelona": ["barcelona", "catalonia", "cataluña", "spain", "españa"],
        "barcelona, spain": ["barcelona", "catalonia", "cataluña", "spain", "españa"],
        "boston": ["boston", "cambridge", "somerville", "brookline", "newton", "quincy", "medford", "malden", "everett", "waltham"],
        "boston, massachusetts": ["boston", "cambridge", "somerville", "brookline", "newton", "quincy", "medford", "malden", "everett", "waltham"]
      };

      // Check if this location has metropolitan area coverage
      const metroKeywords = metroAreas[filterLocation] || [filterLocation];

      // Check if user matches any of the metropolitan area keywords
      // Use location field as primary current location, hometown fields for origin, and travel destination for current travelers
      const matchesMetroArea = metroKeywords.some((keyword) => {
        const userLocation = otherUser.location?.toLowerCase() || '';
        const userHometown = otherUser.hometownCity?.toLowerCase() || '';
        const userTravelDestination = otherUser.travelDestination?.toLowerCase() || '';

        // For users with new travel plans system, check their current travel destination
        const userTravelPlans = otherUser.id === effectiveUser?.id ? travelPlans : [];
        const userCurrentTravelDestination = getCurrentTravelDestination(userTravelPlans || []);
        const isCurrentlyTravelingToKeyword = userCurrentTravelDestination?.toLowerCase().includes(keyword);

        // Special debugging for location filtering
        const isCurrentUserTravelingHere = otherUser.id === effectiveUser?.id && userCurrentTravelDestination?.toLowerCase().includes(keyword);

        // Debug logging for location matching
        if (activeFilter === "location" && filters.location) {
          console.log(`Checking keyword "${keyword}" against user ${otherUser.username}:`, {
            userId: otherUser.id,
            effectiveUserId: effectiveUser?.id,
            userLocation,
            userHometown,
            userTravelDestination,
            userCurrentTravelDestination,
            isCurrentlyTraveling: otherUser.isCurrentlyTraveling,
            isCurrentlyTravelingToKeyword,
            locationMatch: userLocation.includes(keyword),
            hometownMatch: userHometown.includes(keyword),
            travelDestinationMatch: userTravelDestination.includes(keyword),
            isCurrentUser: otherUser.id === effectiveUser?.id,
            isCurrentUserTravelingHere,
            willMatch: userLocation.includes(keyword) || 
                      userHometown.includes(keyword) ||
                      (otherUser.isCurrentlyTraveling && userTravelDestination.includes(keyword)) ||
                      isCurrentlyTravelingToKeyword
          });
        }

        // For "la" keyword, ensure it's a word boundary to avoid matching "Amsterdam" -> "Amster[la]m"
        if (keyword === "la") {
          const wordBoundaryRegex = /\b(la|los angeles)\b/;
          return wordBoundaryRegex.test(userLocation) || 
                 wordBoundaryRegex.test(userHometown) ||
                 wordBoundaryRegex.test(userTravelDestination) ||
                 (userCurrentTravelDestination && wordBoundaryRegex.test(userCurrentTravelDestination.toLowerCase()));
        }

        // Check current location (location field), hometown (hometownCity field), travel destination (legacy), and current travel plans (new system)
        return userLocation.includes(keyword) || 
               userHometown.includes(keyword) ||
               (otherUser.isCurrentlyTraveling && userTravelDestination.includes(keyword)) ||
               isCurrentlyTravelingToKeyword; // Include users (especially current user) if they're traveling to this destination via travel plans
      });

      if (!matchesMetroArea) {
        if (activeFilter === "location" && filters.location) {
          console.log(`User ${otherUser.username} excluded - no metro area match`);
        }
        return false;
      } else {
        if (activeFilter === "location" && filters.location) {
          console.log(`User ${otherUser.username} INCLUDED - metro area match found!`);
        }
      }
    }

    // User type filter - check if user's type matches any selected filters
    if (filters.userType.length > 0 && !filters.userType.includes(otherUser.userType)) {
      if (activeFilter === "location" && filters.location) {
        console.log(`User ${otherUser.username} excluded - userType filter (user: ${otherUser.userType}, required: ${filters.userType})`);
      }
      return false;
    }

    // Search filter - check if search term matches name, username, bio, or location/city
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch = 
        otherUser.name?.toLowerCase().includes(searchTerm) ||
        otherUser.username?.toLowerCase().includes(searchTerm) ||
        otherUser.bio?.toLowerCase().includes(searchTerm) ||
        otherUser.location?.toLowerCase().includes(searchTerm) ||
        otherUser.hometownCity?.toLowerCase().includes(searchTerm) ||
        otherUser.hometownState?.toLowerCase().includes(searchTerm) ||
        otherUser.hometownCountry?.toLowerCase().includes(searchTerm) ||
        otherUser.gender?.toLowerCase().includes(searchTerm) ||
        otherUser.travelDestination?.toLowerCase().includes(searchTerm) ||
        otherUser.interests?.some(interest => interest.toLowerCase().includes(searchTerm)) ||
        otherUser.travelInterests?.some(interest => interest.toLowerCase().includes(searchTerm)) ||
        otherUser.localActivities?.some(activity => activity.toLowerCase().includes(searchTerm)) ||
        otherUser.preferredActivities?.some(activity => activity.toLowerCase().includes(searchTerm)) ||
        otherUser.travelStyle?.some(style => style.toLowerCase().includes(searchTerm)) ||
        otherUser.localExpertise?.some(expertise => expertise.toLowerCase().includes(searchTerm)) ||
        otherUser.languagesSpoken?.some(language => language.toLowerCase().includes(searchTerm)) ||
        otherUser.sexualPreference?.some(pref => pref.toLowerCase().includes(searchTerm));
      if (!matchesSearch) return false;
    }

    if (filters.interests.length > 0) {
      const userInterests = otherUser.interests || [];
      const hasMatchingInterest = filters.interests.some(interest => 
        userInterests.some(userInterest => 
          userInterest.toLowerCase().includes(interest.toLowerCase())
        )
      );
      if (!hasMatchingInterest) return false;
    }

    if (filters.activities.length > 0) {
      const userActivities = [...(otherUser.localActivities || []), ...(otherUser.preferredActivities || [])];
      const hasMatchingActivity = filters.activities.some(activity => 
        userActivities.some(userActivity => 
          userActivity.toLowerCase().includes(activity.toLowerCase())
        )
      );
      if (!hasMatchingActivity) return false;
    }

    if (filters.events.length > 0) {
      // For event filtering, we could check if user is attending certain event categories
      // or has shown interest in specific event types through their travel plans
      const userEventInterests = [...(otherUser.interests || []), ...(otherUser.travelInterests || [])];
      const hasMatchingEventInterest = filters.events.some(eventType => 
        userEventInterests.some(interest => 
          interest.toLowerCase().includes(eventType.toLowerCase())
        )
      );
      if (!hasMatchingEventInterest) return false;
    }

    // Apply basic filter logic
    // Business users already excluded at the top - this is redundant but keeping for safety

    if (activeFilter === "all") return true;
    if (activeFilter === "best-matches") return true;

    if (activeFilter === "travel-dates") {
      // Travel Companions should only show people you're traveling with, not businesses
      if (otherUser.userType === "business") return false;

      // Check if current user has any travel plans or legacy destination
      const hasLegacyTravel = effectiveUser?.travelDestination && effectiveUser?.travelStartDate && effectiveUser?.travelEndDate;
      const hasTravelPlans = travelPlans.length > 0;

      if (!hasLegacyTravel && !hasTravelPlans) {
        return false;
      }

      // Check for matches against all travel plans
      const hasMatchWithPlans = travelPlans.some(plan => {
        if (!plan.startDate || !plan.endDate) return false;

        return otherUser.travelDestination === plan.destination &&
               otherUser.travelStartDate && 
               otherUser.travelEndDate &&
               checkDateOverlap(
                 plan.startDate,
                 plan.endDate,
                 typeof otherUser.travelStartDate === 'string' ? otherUser.travelStartDate : otherUser.travelStartDate.toISOString(),
                 typeof otherUser.travelEndDate === 'string' ? otherUser.travelEndDate : otherUser.travelEndDate.toISOString()
               );
      });

      // Check for matches against legacy travel destination
      const hasMatchWithLegacy = hasLegacyTravel && 
        otherUser.travelDestination === effectiveUser.travelDestination &&
        otherUser.travelStartDate && 
        otherUser.travelEndDate &&
        checkDateOverlap(
          typeof effectiveUser.travelStartDate === 'string' ? effectiveUser.travelStartDate : effectiveUser.travelStartDate.toISOString(),
          typeof effectiveUser.travelEndDate === 'string' ? effectiveUser.travelEndDate : effectiveUser.travelEndDate.toISOString(),
          typeof otherUser.travelStartDate === 'string' ? otherUser.travelStartDate : otherUser.travelStartDate.toISOString(),
          typeof otherUser.travelEndDate === 'string' ? otherUser.travelEndDate : otherUser.travelEndDate.toISOString()
        );

      return hasMatchWithPlans || hasMatchWithLegacy;
    }

    // For non-location filters, match userType
    if (activeFilter !== "location") {
      return otherUser.userType === activeFilter;
    }

    // For location filter, if we made it here, user passes all filters
    if (activeFilter === "location" && filters.location) {
      console.log(`User ${otherUser.username} PASSED ALL FILTERS - will be displayed!`);
    }
    return true;
  });



  const handleDestinationComplete = async (destination: string, startDate?: string, endDate?: string, interests?: string[], activities?: string[]) => {
    try {
      // Get user ID from context or localStorage
      let userId = user?.id;
      if (!userId) {
        const storedUser = localStorage.getItem('travelconnect_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          userId = parsedUser?.id;
        }
      }

      if (!userId) {
        console.error('No user ID available');
        return;
      }

      // Create a new travel plan
      const travelPlanData: any = {
        userId: userId,
        destination: destination,
      };

      if (startDate) {
        travelPlanData.startDate = startDate;
      }
      if (endDate) {
        travelPlanData.endDate = endDate;
      }
      if (interests && interests.length > 0) {
        travelPlanData.interests = interests;
      }
      if (activities && activities.length > 0) {
        travelPlanData.activities = activities;
      }

      const response = await fetch('/api/travel-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(travelPlanData),
      });

      if (response.ok) {
        // Extract city from destination for location-based content
        const city = destination.split(',')[0].trim();

        // Update current city and location to show location-based content
        if (city) {
          const locationUpdate = {
            location: city,
            travelDestination: destination
          };

          const cityUpdateResponse = await fetch(`/api/users/${userId}`, {
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(locationUpdate),
          });

          if (cityUpdateResponse.ok) {
            const finalUpdatedUser = await cityUpdateResponse.json();

            console.log('Final updated user:', finalUpdatedUser);

            // Update user context using the proper setUser function from AuthContext
            if (setUser && typeof setUser === 'function') {
              setUser(finalUpdatedUser);
            }

            // Also store in localStorage
            localStorage.setItem('travelconnect_user', JSON.stringify(finalUpdatedUser));

            // Invalidate and refetch related queries
            await queryClient.invalidateQueries({ queryKey: ['/api/travel-plans'] });
            await queryClient.invalidateQueries({ queryKey: ['/api/users'] });
            await queryClient.invalidateQueries({ queryKey: ['/api/events'] });
            await queryClient.invalidateQueries({ queryKey: ['/api/businesses'] });

            // Show success message
            toast({
              title: "Travel plans updated!",
              description: `You're now exploring ${destination}`,
            });

            setShowDestinationModal(false);
          } else {
            console.error('Failed to update user location');
          }
        }
      } else {
        console.error('Failed to create travel plan');
      }
    } catch (error) {
      console.error('Error creating travel plan:', error);
    }
  };

  const handleConnectWithLocals = (mode: 'current' | 'hometown') => {
    setConnectModalMode(mode);
    setShowConnectModal(true);
  };

  const handleFilterUsers = (filterValue: string) => {
    if (filterValue === "location") {
      // For location filter, show all users near their current city
      const businessLocation = getBusinessLocation();
      if (businessLocation) {
        setActiveLocationFilter(businessLocation);
        setFilters(prev => ({ ...prev, location: businessLocation }));
      }
    }
    setActiveFilter(filterValue);
  };

  const handleLocationFilter = (location: string) => {
    setActiveLocationFilter(location);
    setActiveFilter("location");
    setFilters(prev => ({ ...prev, location }));
  };

  // Handle advanced filter close
  const handleCloseFilters = () => {
    setShowAdvancedFilters(false);
  };

  const sortUsers = (users: User[]) => {
    switch (sortBy) {
      case 'recent':
        return users.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case 'active':
        return users.sort((a, b) => new Date(b.lastSeen || 0).getTime() - new Date(a.lastSeen || 0).getTime());
      case 'compatibility':
        // Already handled by prioritizeUsers
        return users;
      case 'travel_experience':
        return users.sort((a, b) => {
          const aExperience = (a.visitedCountries || []).length + (a.travelPlans || []).length;
          const bExperience = (b.visitedCountries || []).length + (b.travelPlans || []).length;
          return bExperience - aExperience;
        });
      case 'closest_nearby':
        // Could implement geolocation-based sorting
        return users;
      case 'aura':
        return users.sort((a, b) => (b.auraScore || 0) - (a.auraScore || 0));
      case 'references':
        return users.sort((a, b) => (b.referenceCount || 0) - (a.referenceCount || 0));
      case 'alphabetical':
        return users.sort((a, b) => (a.name || a.username || '').localeCompare(b.name || b.username || ''));
      default:
        return users;
    }
  };

  const finalUsers = sortUsers(filteredUsers);

  if (usersError) {
    console.error('Error loading users:', usersError);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-orange-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-gray-900">
      {/* Skip mobile nav - using global navigation */}

      {/* Main Content Area */}
      <main className="pb-16 md:pb-8">
        {/* Hero Section - Destination-Aware */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 py-8 sm:py-12 lg:py-16">
            <div className="text-center">
              <div className="text-center">
                {effectiveUser?.userType === "business" ? (
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                    Business Dashboard - {effectiveUser?.hometownCity || effectiveUser?.location || "Your City"}
                  </h1>
                ) : enrichedEffectiveUser?.travelDestination ? (
                  <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                      NEARBY LOCAL {effectiveUser?.hometownCity || effectiveUser?.location || "HOME"}
                    </h1>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                      NEARBY TRAVELER {enrichedEffectiveUser.travelDestination}
                    </h1>
                  </div>
                ) : (
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                    NEARBY LOCAL {effectiveUser?.hometownCity || effectiveUser?.location || "HOME"}
                  </h1>
                )}
              </div>
              <p className="text-lg sm:text-xl md:text-2xl mb-8 text-blue-100">
                {effectiveUser?.userType === "business"
                  ? "Reach customers through interest-based matching, business notifications, and location-targeted discovery."
                  : effectiveUser?.userType === "local"
                    ? "Connect with travelers exploring your city and fellow locals with shared interests."
                    : enrichedEffectiveUser?.travelDestination
                      ? `Discover authentic connections and local experiences in ${enrichedEffectiveUser.travelDestination}.`
                      : "Connect with locals and fellow travelers sharing your interests."
                }
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {effectiveUser?.userType !== "business" && (
                  <Button
                    onClick={() => setShowDestinationModal(true)}
                    className="bg-white/90 text-blue-600 hover:bg-white hover:text-blue-700 font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
                    data-testid="button-add-destination"
                  >
                    <Plane className="w-5 h-5 mr-2" />
                    {enrichedEffectiveUser?.travelDestination ? "Add Another Trip" : "Add Travel Plans"}
                  </Button>
                )}

                <Button
                  onClick={() => handleConnectWithLocals('current')}
                  variant="outline"
                  className="border-white/50 text-white hover:bg-white/20 hover:border-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-200"
                  data-testid="button-connect-current"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Connect with People Here
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Search Overlay */}
        {showAdvancedFilters && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-white/20 dark:border-gray-700/20 shadow-2xl">
              <Card className="border-0">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl sm:text-2xl font-bold">Advanced Search</CardTitle>
                      <p className="text-blue-100 mt-1">Find people with shared interests, activities, and travel plans</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvancedFilters(false)}
                      className="text-white hover:bg-white/20 rounded-full p-2"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Search Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search People
                    </label>
                    <Input
                      placeholder="Search by name, username, bio, interests..."
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                      className="w-full"
                    />
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <SmartLocationInput
                      placeholder="Enter city, state, or country..."
                      value={filters.location}
                      onChange={(value) => setFilters({...filters, location: value})}
                      className="w-full"
                    />
                  </div>

                  {/* Demographics Section */}
                  <Collapsible open={expandedSections.demographics} onOpenChange={() => toggleSection('demographics')}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Demographics & Personal</span>
                        <div className="flex items-center gap-2">
                          {(filters.gender.length > 0 || filters.sexualPreference.length > 0 || filters.minAge || filters.maxAge) && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                              {filters.gender.length + filters.sexualPreference.length + (filters.minAge ? 1 : 0) + (filters.maxAge ? 1 : 0)}
                            </Badge>
                          )}
                          {expandedSections.demographics ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 space-y-4">
                      {/* Gender Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Gender
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {GENDER_OPTIONS.map((gender) => (
                            <button
                              key={gender.value}
                              onClick={() => {
                                if (filters.gender.includes(gender.value)) {
                                  setFilters({...filters, gender: filters.gender.filter(g => g !== gender.value)});
                                } else {
                                  setFilters({...filters, gender: [...filters.gender, gender.value]});
                                }
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                filters.gender.includes(gender.value)
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {gender.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sexual Preference Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Sexual Preference
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {SEXUAL_PREFERENCE_OPTIONS.map((pref) => (
                            <button
                              key={pref.value}
                              onClick={() => {
                                if (filters.sexualPreference.includes(pref.value)) {
                                  setFilters({...filters, sexualPreference: filters.sexualPreference.filter(p => p !== pref.value)});
                                } else {
                                  setFilters({...filters, sexualPreference: [...filters.sexualPreference, pref.value]});
                                }
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                filters.sexualPreference.includes(pref.value)
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {pref.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Age Range */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Min Age
                          </label>
                          <Input
                            type="number"
                            placeholder="18"
                            value={filters.minAge}
                            onChange={(e) => setFilters({...filters, minAge: e.target.value})}
                            min="18"
                            max="100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Max Age
                          </label>
                          <Input
                            type="number"
                            placeholder="65"
                            value={filters.maxAge}
                            onChange={(e) => setFilters({...filters, maxAge: e.target.value})}
                            min="18"
                            max="100"
                          />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* User Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      User Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {USER_TYPE_OPTIONS.map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            if (filters.userType.includes(type)) {
                              setFilters({...filters, userType: filters.userType.filter(t => t !== type)});
                            } else {
                              setFilters({...filters, userType: [...filters.userType, type]});
                            }
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            filters.userType.includes(type)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {type === 'currently_traveling' ? 'Travelers' : 
                           type === 'local' ? 'Locals' : 
                           type === 'business' ? 'Businesses' : 
                           type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location search bar */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Search Specific Location</h3>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Select value={filters.location} onValueChange={(value) => setFilters({...filters, location: value})}>
                          <SelectTrigger className="w-full bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                            <SelectValue placeholder="Search city or travel destination..." />
                          </SelectTrigger>
                          <SelectContent>
                            {effectiveUser?.location && (
                          <SelectItem value={effectiveUser.location}>
                            📍 {effectiveUser.location} (Current)
                        </SelectItem>
                        )}
                        {travelPlans.map((plan, index) => (
                          <SelectItem key={index} value={plan.destination}>
                            ✈️ {plan.destination} (Trip {formatDateForDisplay(plan.startDate, "PLAYA DEL REY")})
                          </SelectItem>
                        ))}
                        {effectiveUser?.travelDestination && 
                         !travelPlans.some(plan => plan.destination === effectiveUser.travelDestination) && (
                          <SelectItem value={effectiveUser.travelDestination}>
                            🗺️ {effectiveUser.travelDestination}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                  {/* Top Choices for Most Travelers Section */}
                  <Collapsible open={expandedSections.topChoices} onOpenChange={() => toggleSection('topChoices')}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-10 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 border-blue-200 dark:border-blue-700 hover:from-blue-100 hover:to-orange-100 dark:hover:from-blue-900/30 dark:hover:to-orange-900/30"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">⭐ Top Choices for Most Travelers</span>
                        <div className="flex items-center gap-2">
                          {getMostPopularInterests().filter(choice => filters.interests.includes(choice)).length > 0 && (
                            <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-orange-100 text-gray-800 dark:from-blue-900 dark:to-orange-900 dark:text-gray-200">
                              {getMostPopularInterests().filter(choice => filters.interests.includes(choice)).length}
                            </Badge>
                          )}
                          {expandedSections.topChoices ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <div className="flex flex-wrap gap-2">
                        {getMostPopularInterests().map((choice) => (
                          <button
                            key={choice}
                            onClick={() => {
                              if (filters.interests.includes(choice)) {
                                setFilters({...filters, interests: filters.interests.filter(i => i !== choice)});
                              } else {
                                setFilters({...filters, interests: [...filters.interests, choice]});
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              filters.interests.includes(choice)
                                ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {choice}
                          </button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Interests Filter Section */}
                  <Collapsible open={expandedSections.interests} onOpenChange={() => toggleSection('interests')}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Interests Filter</span>
                        <div className="flex items-center gap-2">
                          {filters.interests.length > 0 && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                              {filters.interests.length}
                            </Badge>
                          )}
                          {expandedSections.interests ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <div className="flex flex-wrap gap-2">
                        {getAllInterests().filter(interest => !getMostPopularInterests().includes(interest)).map((interest) => {
                          const displayText = interest.startsWith("**") && interest.endsWith("**") ? 
                            interest.slice(2, -2) : interest;
                          
                          return (
                            <button
                              key={interest}
                              onClick={() => {
                                if (filters.interests.includes(interest)) {
                                  setFilters({...filters, interests: filters.interests.filter(i => i !== interest)});
                                } else {
                                  setFilters({...filters, interests: [...filters.interests, interest]});
                                }
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                filters.interests.includes(interest)
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {displayText}
                            </button>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Activities Filter Section */}
                  <Collapsible open={expandedSections.activities} onOpenChange={() => toggleSection('activities')}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Activities Filter</span>
                        <div className="flex items-center gap-2">
                          {filters.activities.length > 0 && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                              {filters.activities.length}
                            </Badge>
                          )}
                          {expandedSections.activities ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <div className="flex flex-wrap gap-2">
                        {getAllActivities().map((activity, index) => (
                          <button
                            key={`filter-activity-${activity}-${index}`}
                            onClick={() => {
                              if (filters.activities.includes(activity)) {
                                setFilters({...filters, activities: filters.activities.filter(a => a !== activity)});
                              } else {
                                setFilters({...filters, activities: [...filters.activities, activity]});
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              filters.activities.includes(activity)
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {activity}
                          </button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Events Filter Section */}
                  <Collapsible open={expandedSections.events} onOpenChange={() => toggleSection('events')}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Events Filter</span>
                        <div className="flex items-center gap-2">
                          {filters.events.length > 0 && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                              {filters.events.length}
                            </Badge>
                          )}
                          {expandedSections.events ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <div className="flex flex-wrap gap-2">
                        {getAllEvents().map((eventType) => (
                          <button
                            key={eventType}
                            onClick={() => {
                              if (filters.events.includes(eventType)) {
                                setFilters({...filters, events: filters.events.filter(e => e !== eventType)});
                              } else {
                                setFilters({...filters, events: [...filters.events, eventType]});
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              filters.events.includes(eventType)
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {eventType}
                          </button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Military Status Filter Section */}
                  <Collapsible open={expandedSections.militaryStatus} onOpenChange={() => toggleSection('militaryStatus')}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Military Status Filter</span>
                        <div className="flex items-center gap-2">
                          {filters.militaryStatus.length > 0 && (
                            <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                              {filters.militaryStatus.length}
                            </Badge>
                          )}
                          {expandedSections.militaryStatus ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "veteran", label: "Veteran", color: "red" },
                          { value: "active_duty", label: "Active Duty", color: "blue" }
                        ].map((status) => (
                          <button
                            key={status.value}
                            onClick={() => {
                              if (filters.militaryStatus.includes(status.value)) {
                                setFilters({...filters, militaryStatus: filters.militaryStatus.filter(s => s !== status.value)});
                              } else {
                                setFilters({...filters, militaryStatus: [...filters.militaryStatus, status.value]});
                              }
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                              filters.militaryStatus.includes(status.value)
                                ? (status.color === 'red' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white')
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>



                {/* Action Buttons */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Reset all filters
                      setFilters({
                        gender: [],
                        sexualPreference: [],
                        minAge: "",
                        maxAge: "",
                        interests: [],
                        activities: [],
                        location: "",
                        search: "",
                        userType: [],
                        events: [],
                        travelerTypes: [],
                        militaryStatus: [],
                        startDate: "",
                        endDate: ""
                      });
                      // Reset active filter to show all users
                      setActiveFilter("all");
                      // Reset location filter
                      setActiveLocationFilter("");
                      // Reset location filter state
                      setLocationFilter({
                        country: "",
                        state: "",
                        city: ""
                      });
                    }}
                    className="w-full sm:w-auto"
                    data-testid="button-clear-all-filters"
                  >
                    <X className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Clear All Filters</span>
                    <span className="sm:hidden">Clear All</span>
                  </Button>

                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <div className="text-sm text-gray-600">
                      {filteredUsers.length} people found
                    </div>
                    <Button
                      className="bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600 w-full sm:w-auto"
                      onClick={() => {
                        handleCloseFilters();
                        // Scroll to discover people section only if staying on home page
                        const urlParams = new URLSearchParams(window.location.search);
                        if (!urlParams.get('return')) {
                          setTimeout(() => {
                            const discoverSection = document.querySelector('[data-testid="discover-people-section"]');
                            if (discoverSection) {
                              discoverSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 100);
                        }
                      }}
                    >
                      <Search className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                      Search Now
                    </Button>
                  </div>
                </div>

                {/* Bottom Close Button */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseFilters}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Close Filters
                  </Button>
                </div>
              </Card>
            </Card>
          </div>
        )}

        {/* Main Content - Responsive layout with animations */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-8 px-2 sm:px-4 lg:px-8 mt-2 sm:mt-0">
          {/* Discover Feed - Full width on mobile, 2 columns on desktop */}
          <div className="col-span-1 lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-8 min-w-0">
            <div className="flex items-center justify-between" data-testid="discover-people-section">
              <div className="flex items-center gap-2 sm:gap-4">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  {activeFilter === "travel-dates" 
                    ? `Travel Connections to ${user?.travelDestination}` 
                    : "Discover People"
                  }
                </h2>
                
                {/* Quick Clear All Button - Show when any filters are active */}
                {(activeFilter !== "all" || 
                  filters.location || 
                  filters.search || 
                  filters.gender.length > 0 || 
                  filters.sexualPreference.length > 0 || 
                  filters.interests.length > 0 || 
                  filters.activities.length > 0 || 
                  filters.userType.length > 0 ||
                  filters.minAge ||
                  filters.maxAge) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Reset all filters
                      setFilters({
                        gender: [],
                        sexualPreference: [],
                        minAge: "",
                        maxAge: "",
                        interests: [],
                        activities: [],
                        location: "",
                        search: "",
                        userType: [],
                        events: [],
                        travelerTypes: [],
                        militaryStatus: [],
                        startDate: "",
                        endDate: ""
                      });
                      // Reset active filter to show all users
                      setActiveFilter("all");
                      // Reset location filter
                      setActiveLocationFilter("");
                      // Reset location filter state
                      setLocationFilter({
                        country: "",
                        state: "",
                        city: ""
                      });
                    }}
                    className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 text-xs sm:text-sm"
                    data-testid="button-quick-clear-filters"
                  >
                    <X className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Clear Search</span>
                    <span className="sm:hidden">Clear</span>
                  </Button>
                )}
              </div>

              {/* Desktop Controls */}
              {isDesktop && (
                <div className="flex items-center gap-2">
                  {/* Advanced Search Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none rounded-xl shadow-md"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Advanced Search
                  </Button>

                  {/* Sort By Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 rounded-xl"
                    >
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      Sort By
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setSortBy('closest_nearby')}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Closest Nearby
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('compatibility')}>
                    <Users className="w-4 h-4 mr-2" />
                    Most Compatible
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('active')}>
                    <Zap className="w-4 h-4 mr-2" />
                    Recently Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('recent')}>
                    <Clock className="w-4 h-4 mr-2" />
                    Newest Members
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('travel_experience')}>
                    <Globe className="w-4 h-4 mr-2" />
                    Most Travel Experience
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('aura')}>
                    <Star className="w-4 h-4 mr-2" />
                    Highest Aura Score
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('references')}>
                    <Coffee className="w-4 h-4 mr-2" />
                    Most References
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('alphabetical')}>
                    <Hash className="w-4 h-4 mr-2" />
                    Alphabetical
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
                </div>
              )}
            </div>

            {/* Mobile Search & Filter Controls */}
            {isMobile && (
              <div className="flex flex-col gap-3">
                {/* Quick Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search people by name, interests..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="pl-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl"
                  />
                </div>

                {/* Mobile Control Row */}
                <div className="flex gap-2 items-center">
                  {/* Advanced Search Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none rounded-xl shadow-md flex-1"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>

                  {/* Sort By Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 rounded-xl px-3"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setSortBy('closest_nearby')}>
                        <MapPin className="w-4 h-4 mr-2" />
                        Closest Nearby
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('compatibility')}>
                        <Users className="w-4 h-4 mr-2" />
                        Most Compatible
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('active')}>
                        <Zap className="w-4 h-4 mr-2" />
                        Recently Active
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('recent')}>
                        <Clock className="w-4 h-4 mr-2" />
                        Newest Members
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('travel_experience')}>
                        <Globe className="w-4 h-4 mr-2" />
                        Travel Experience
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterUsers("all")}
                className={`rounded-full transition-all duration-200 ${
                  activeFilter === "all" 
                    ? "bg-gradient-to-r from-blue-500 to-orange-500 text-white border-none shadow-md" 
                    : "bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-orange-50 dark:hover:from-blue-900/30 dark:hover:to-orange-900/30"
                }`}
                data-testid="filter-all"
              >
                <Globe className="w-3 h-3 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">All People</span>
              </Button>

              <Button
                variant={activeFilter === "best-matches" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterUsers("best-matches")}
                className={`rounded-full transition-all duration-200 ${
                  activeFilter === "best-matches" 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none shadow-md" 
                    : "bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30"
                }`}
                data-testid="filter-best-matches"
              >
                <Users className="w-3 h-3 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Best Matches</span>
              </Button>

              <Button
                variant={activeFilter === "currently_traveling" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterUsers("currently_traveling")}
                className={`rounded-full transition-all duration-200 ${
                  activeFilter === "currently_traveling" 
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none shadow-md" 
                    : "bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30"
                }`}
                data-testid="filter-travelers"
              >
                <Plane className="w-3 h-3 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Travelers</span>
              </Button>

              <Button
                variant={activeFilter === "local" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterUsers("local")}
                className={`rounded-full transition-all duration-200 ${
                  activeFilter === "local" 
                    ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-none shadow-md" 
                    : "bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-amber-50 dark:hover:from-yellow-900/30 dark:hover:to-amber-900/30"
                }`}
                data-testid="filter-locals"
              >
                <MapPin className="w-3 h-3 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Locals</span>
              </Button>

              {/* Location quick filter for business users */}
              {effectiveUser?.userType === 'business' && (
                <Button
                  variant={activeFilter === "location" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterUsers("location")}
                  className={`rounded-full transition-all duration-200 ${
                    activeFilter === "location" 
                      ? "bg-gradient-to-r from-red-500 to-rose-500 text-white border-none shadow-md" 
                      : "bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 dark:hover:from-red-900/30 dark:hover:to-rose-900/30"
                  }`}
                  data-testid="filter-location"
                >
                  <Store className="w-3 h-3 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Near My Business</span>
                </Button>
              )}

              <Button
                variant={activeFilter === "travel-dates" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterUsers("travel-dates")}
                className={`rounded-full transition-all duration-200 ${
                  activeFilter === "travel-dates" 
                    ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-none shadow-md" 
                    : "bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-indigo-900/30 dark:hover:to-blue-900/30"
                }`}
                data-testid="filter-travel-companions"
              >
                <Calendar className="w-3 h-3 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Travel Companions</span>
              </Button>
            </div>

            {/* PEOPLE DISCOVERY WIDGET - DEDICATED WIDGET */}
            <PeopleDiscoveryWidget 
              users={finalUsers}
              isLoading={usersLoading}
              error={usersError}
              onLocationFilter={handleLocationFilter}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            />

            {/* Events Near You Section - Using centralized events widget */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  Events Near You
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Navigate to events page with preserved travel context
                    const destination = enrichedEffectiveUser?.travelDestination || effectiveUser?.location;
                    if (destination) {
                      navigate(`/events?city=${encodeURIComponent(destination)}`);
                    } else {
                      navigate('/events');
                    }
                  }}
                  className="bg-white/70 dark:bg-gray-800/70 border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700"
                  data-testid="button-view-all-events"
                >
                  View All Events
                </Button>
              </div>

              {/* Location-Sorted Events Widget - Automatically handles user's current location */}
              <LocationSortedEvents 
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              />
            </div>

            {/* Businesses Near You - Hidden for business users, visible for travelers and locals */}
            {effectiveUser?.userType !== "business" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    Local Businesses
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/businesses')}
                    className="bg-white/70 dark:bg-gray-800/70 border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700"
                    data-testid="button-view-all-businesses"
                  >
                    View All Businesses
                  </Button>
                </div>

                <BusinessesGrid 
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                />
              </div>
            )}

            {/* Quick Deals Discovery - Only for business users */}
            {effectiveUser?.userType === "business" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    Quick Deals Discovery
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/business-offers')}
                    className="bg-white/70 dark:bg-gray-800/70 border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700"
                    data-testid="button-view-all-deals"
                  >
                    View All Deals
                  </Button>
                </div>

                <QuickDealsDiscovery 
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                />
              </div>
            )}

          </div>

          {/* Right Sidebar - Desktop Only */}
          <div className="hidden lg:block space-y-6">
            {/* Current Location Weather Widget */}
            <CurrentLocationWeatherWidget 
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            />

            {/* Messages Widget */}
            <MessagesWidget 
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            />

            {/* Quick Meetup Widget - Only for non-business users */}
            {effectiveUser?.userType !== "business" && (
              <QuickMeetupWidget 
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              />
            )}

            {/* AI City Events Widget - Smart destination detection */}
            <AICityEventsWidget 
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            />

            {/* City Map Widget - Desktop Only - Interactive map showing users, events, and businesses */}
            {isDesktop && (
              <div>
              {(() => {
                // Priority 1: If user has active travel plans, show current travel destination
                const activeTravelPlan = travelPlans?.find(plan => plan.status === 'active');
                
                if (activeTravelPlan) {
                  // Use structured fields if available, otherwise parse destination string
                  if (activeTravelPlan.destinationCity) {
                    return (
                      <div className="rounded-2xl border max-w-full overflow-hidden md:overflow-visible [&_*>*]:min-w-0">
                        <CityMap 
                          city={activeTravelPlan.destinationCity} 
                          state={activeTravelPlan.destinationState}
                          country={activeTravelPlan.destinationCountry} 
                        />
                      </div>
                    );
                  } else if (activeTravelPlan.destination) {
                    // Parse destination string "City, State, Country" 
                    const parts = activeTravelPlan.destination.split(', ');
                    const city = parts[0];
                    const state = parts.length > 2 ? parts[1] : undefined;
                    const country = parts.length > 1 ? parts[parts.length - 1] : undefined;
                    
                    return (
                      <div className="rounded-2xl border max-w-full overflow-hidden md:overflow-visible [&_*>*]:min-w-0">
                        <CityMap 
                          city={city} 
                          state={state}
                          country={country} 
                        />
                      </div>
                    );
                  }
                }
                
                // Priority 2: Fallback to hometown if no active travel
                if (effectiveUser?.hometownCity && effectiveUser?.hometownCountry) {
                  return (
                    <div className="rounded-2xl border max-w-full overflow-hidden md:overflow-visible [&_*>*]:min-w-0">
                      <CityMap 
                        city={effectiveUser.hometownCity} 
                        state={effectiveUser.hometownState}
                        country={effectiveUser.hometownCountry} 
                      />
                    </div>
                  );
                }
                
                return null;
              })()}
              </div>
            )}

          </div>
        </div>
        </div>
      </main>

      {/* MobileNav removed - using global MobileTopNav and MobileBottomNav */}

      {/* Destination Modal */}
      <DestinationModal 
        isOpen={showDestinationModal}
        onComplete={handleDestinationComplete}
        onClose={() => setShowDestinationModal(false)}
        user={effectiveUser}
      />

      {/* Connect Modal */}
      <ConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        userTravelPlans={travelPlans}
        defaultLocationMode={connectModalMode}
      />

      {/* AI Chat Bot */}
      <AIChatBot />
    </div>
  );
}