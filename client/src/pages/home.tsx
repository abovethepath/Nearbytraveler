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
import { Globe, Users, MapPin, Briefcase, Calendar, Filter, X, ChevronDown, ChevronRight, MessageCircle, Camera, Search, Store, Hash, Tag, AlertCircle, ArrowUpDown, Clock, Zap, Star, Coffee, Phone, Plane, Sparkles, Package } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { getAllInterests, getAllActivities, getAllLanguages, validateSelections, getMostPopularInterests } from "../../../shared/base-options";
import { BASE_TRAVELER_TYPES } from "../../../shared/base-options";
import { getInterestStyle, getActivityStyle, getEventStyle } from "@/lib/topChoicesUtils";
import type { User, Event, Message } from "@shared/schema";
import SmartPhotoGallery from "@/components/smart-photo-gallery";
import SmartLocationInput from "@/components/SmartLocationInput";
import AICityEventsWidget from "@/components/ai-city-events";
import TravelMatches from "@/components/travel-matches";
const staticHeroImage = "/travelers_1756778615408.jpg";

import ResponsiveUserGrid from "@/components/ResponsiveUserGrid";
import { SimpleAvatar } from "@/components/simple-avatar";
import { ThemeToggle } from "@/components/theme-toggle";

import MessagesWidget from "@/components/MessagesWidget";
import EventsWidget from "@/components/EventsWidget";
import EventsGrid from "@/components/EventsGrid";
import CurrentLocationWeatherWidget from "@/components/CurrentLocationWeatherWidget";
import EnhancedDiscovery from "@/components/EnhancedDiscovery";

import BusinessesGrid from "@/components/BusinessesGrid";
import { QuickMeetupWidget } from "@/components/QuickMeetupWidget";
import { ContextualEventRecommendations } from "@/components/ContextualEventRecommendations";
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
  const [connectTargetUser, setConnectTargetUser] = useState<any>(null);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'active' | 'compatibility' | 'travel_experience' | 'closest_nearby' | 'aura' | 'references' | 'alphabetical'>('recent');
  
  // Lazy loading state - track which sections have been loaded - LOAD ALL IMMEDIATELY FOR DEMO
  const [loadedSections, setLoadedSections] = useState<Set<string>>(new Set(['hero', 'users', 'events', 'messages', 'weather', 'quickMeets'])); // Load all sections immediately
  const [activeSection, setActiveSection] = useState<string>('hero');

  // Hero section visibility state
  const [isHeroVisible, setIsHeroVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('hideHeroSection');
    return saved !== 'true'; // Default to visible
  });

  const toggleHeroVisibility = () => {
    const newValue = !isHeroVisible;
    setIsHeroVisible(newValue);
    localStorage.setItem('hideHeroSection', String(!newValue));
  };

  const { user, setUser } = useContext(AuthContext);

  // Function to handle section loading
  const handleSectionView = (sectionName: string) => {
    setActiveSection(sectionName);
    setLoadedSections(prev => new Set([...prev, sectionName]));
  };

  // Fetch current user profile data
  const getCurrentUserId = () => {
    return user?.id || 
           JSON.parse(localStorage.getItem('user') || '{}')?.id ||
           JSON.parse(localStorage.getItem('travelconnect_user') || '{}')?.id;
  };

  const getUserId = () => getCurrentUserId();
  const currentUserId = getUserId();

  const { data: currentUserProfile, isLoading: isLoadingCurrentUser } = useQuery<User>({
    queryKey: [`/api/users/${currentUserId}`],
    enabled: !!currentUserId,
  });

  const { data: travelPlans = [], isLoading: isLoadingTravelPlans } = useQuery<any[]>({
    queryKey: [`/api/travel-plans/${currentUserId}`],
    enabled: !!currentUserId,
    staleTime: 30000, // 30 seconds to reduce flickering
  });

  const matchedUsersUserId = currentUserId;

  // Create effective user with proper travel context for metro area detection
  const effectiveUser = useMemo(() => {
    console.log('Discovery memo - currentUserId:', currentUserId);
    
    if (!currentUserId) {
      return null;
    }
    
    // Get the best available user data
    const userData = currentUserProfile || user || 
                    JSON.parse(localStorage.getItem('user') || 'null') ||
                    JSON.parse(localStorage.getItem('travelconnect_user') || 'null');
    
    if (!userData?.id) {
      return null;
    }

    // Calculate current travel status with proper destination logic
    // Prioritize API data over travel plans for travel status
    const currentTravelDestination = getCurrentTravelDestination(Array.isArray(travelPlans) ? travelPlans : []);
    const isCurrentlyTraveling = userData.isCurrentlyTraveling ?? !!currentTravelDestination;
    
    // Use the active travel plan destination first, fallback to API data
    const travelDestination = currentTravelDestination || userData.travelDestination || null;

    // Return enriched user data with travel context
    const enrichedUser = {
      ...userData,
      isCurrentlyTraveling,
      travelDestination,
      // Travel destination is already set above
    };

    return enrichedUser;
  }, [currentUserId, currentUserProfile?.hometownCity, currentUserProfile?.hometownState, currentUserProfile?.hometownCountry, currentUserProfile?.isCurrentlyTraveling, currentUserProfile?.travelDestination, travelPlans]);

  // FIXED enrichedEffectiveUser using exact Weather Widget logic
  const enrichedEffectiveUser = useMemo(() => {
    if (!effectiveUser) return null;
    
    const currentTravelDestination = getCurrentTravelDestination(Array.isArray(travelPlans) ? travelPlans : []);
    const actualCurrentLocation = currentTravelDestination || effectiveUser.location;
    
    console.log('🔍 FIXED enrichedEffectiveUser:', {
      id: effectiveUser.id,
      originalLocation: effectiveUser.location,
      travelDestination: currentTravelDestination,
      actualCurrentLocation
    });
    
    return {
      ...effectiveUser,
      isCurrentlyTraveling: !!currentTravelDestination,
      travelDestination: currentTravelDestination,
      actualCurrentLocation // Add this new field
    };
  }, [effectiveUser, travelPlans]);

  // Debug logging as requested
  console.log('🔍 DEBUG - Weather widget location source:');
  console.log('- effectiveUser:', effectiveUser?.location);  
  console.log('- travelPlans:', travelPlans);
  console.log('- getCurrentTravelDestination result:', getCurrentTravelDestination(travelPlans || []));
  console.log('- enrichedEffectiveUser:', enrichedEffectiveUser);

  // Helper function to display travel destinations exactly as entered by user
  const formatTravelDestination = (destination: string | null): string => {
    console.log('🎯 formatTravelDestination called with:', destination);
    if (!destination) return "Traveling";
    
    // Simply return the destination as stored - no restrictions
    // Users can enter any city/destination: Anaheim, Madrid, small towns, etc.
    return destination;
  };

  // Debug logging function for travel destination data
  const debugTravelData = (label: string, user: any, travelPlans?: any[]) => {
    console.log(`🔍 ${label}:`, {
      userId: user?.id,
      username: user?.username,
      isCurrentlyTraveling: user?.isCurrentlyTraveling,
      travelDestination: user?.travelDestination,
      currentTravelPlan: user?.currentTravelPlan,
      travelPlansCount: travelPlans?.length || 0,
      travelPlans: travelPlans?.map(tp => ({
        destination: tp.destination,
        destinationCity: tp.destinationCity,
        startDate: tp.startDate,
        endDate: tp.endDate
      }))
    });
  };

  // Function to get current location (same logic as weather widget)
  const getCurrentUserLocation = () => {
    // Use exact same logic as weather widget
    const currentTravelPlan = getCurrentTravelDestination(Array.isArray(travelPlans) ? travelPlans : []);
    if (currentTravelPlan) {
      // Avoid duplication when state/prefecture contains city name (e.g. "Hiroshima Prefecture")
      const city = currentTravelPlan.destinationCity;
      const state = currentTravelPlan.destinationState;
      const country = currentTravelPlan.destinationCountry;
      
      // Skip state if it already contains the city name to avoid duplication
      const shouldShowState = state && !state.toLowerCase().includes(city?.toLowerCase() || '');
      
      return `${city}${shouldShowState ? `, ${state}` : ''}, ${country}`;
    }

    if (enrichedEffectiveUser?.isCurrentlyTraveling && enrichedEffectiveUser?.travelDestination) {
      return enrichedEffectiveUser.travelDestination; // This should be "Rome"  
    }

    const hometown = [effectiveUser?.hometownCity, effectiveUser?.hometownState, effectiveUser?.hometownCountry]
      .filter(Boolean).join(', ');
    return hometown || effectiveUser?.location || 'Unknown';
  };

  const enrichUserWithTravelData = (user: any, travelPlans?: any[]) => {
    if (!user) return user;
    
    // Use THIS user's individual travel plans, not the current user's travel plans
    const userTravelPlans = user.travelPlans || [];
    const currentTravelDestination = getCurrentTravelDestination(userTravelPlans);
    
    if (user.id === effectiveUser?.id) {
      // For current user, use weather widget's location logic
      const currentLocation = getCurrentUserLocation();
      const isCurrentlyTraveling = !!currentTravelDestination;
      
      return {
        ...user,
        travelDestination: currentTravelDestination || user.travelDestination,
        isCurrentlyTraveling,
        displayLocation: currentLocation, // This will show "Rome" instead of "Traveling"
        locationContext: isCurrentlyTraveling ? 'traveling' : 'hometown'
      };
    }
    
    // For other users, use THEIR travel plans to detect their travel status
    const isCurrentlyTraveling = !!currentTravelDestination;
    const displayLocation = currentTravelDestination || 
      [user.hometownCity, user.hometownState, user.hometownCountry].filter(Boolean).join(', ') || user.location;

    return {
      ...user,
      travelDestination: currentTravelDestination || user.travelDestination,
      isCurrentlyTraveling,
      displayLocation,
      locationContext: isCurrentlyTraveling ? 'traveling' : 'hometown'
    };
  };

  // Priority system for users
  const prioritizeUsers = (users: any[]) => {
    if (!users.length) return users;
    
    const currentLocation = getCurrentUserLocation();
    const hometown = effectiveUser?.hometownCity;
    
    return users.sort((a, b) => {
      // Current user always first
      if (a.id === effectiveUser?.id) return -1;
      if (b.id === effectiveUser?.id) return 1;
      
      // Score based on location relevance
      let scoreA = 0, scoreB = 0;
      
      // Priority 1: Current travel location (highest priority)
      if (currentLocation) {
        if (a.displayLocation?.toLowerCase().includes(currentLocation.toLowerCase())) scoreA += 1000;
        if (b.displayLocation?.toLowerCase().includes(currentLocation.toLowerCase())) scoreB += 1000;
      }
      
      // Priority 2: Hometown location (medium priority) 
      if (hometown) {
        if (a.hometownCity?.toLowerCase().includes(hometown.toLowerCase())) scoreA += 500;
        if (b.hometownCity?.toLowerCase().includes(hometown.toLowerCase())) scoreB += 500;
      }
      
      // Priority 3: Shared interests
      const parseArray = (data: any) => Array.isArray(data) ? data : [];
      const userInterests = parseArray(effectiveUser?.interests);
      
      const aShared = parseArray(a.interests).filter(i => userInterests.includes(i)).length;
      const bShared = parseArray(b.interests).filter(i => userInterests.includes(i)).length;
      
      scoreA += aShared * 10;
      scoreB += bShared * 10;
      
      return scoreB - scoreA;
    });
  };

  // Get compatibility data from API (matches profile page calculation)
  const { data: compatibilityData } = useQuery({
    queryKey: [`/api/users/${user?.id || currentUserProfile?.id || effectiveUser?.id}/matches`],
    enabled: !!(user?.id || currentUserProfile?.id || effectiveUser?.id),
  });

  // ONLY USER-CREATED EVENTS: Get events from both hometown AND travel destination
  const { data: userPriorityEvents = [] } = useQuery({
    queryKey: ['/api/events', effectiveUser?.hometownCity, effectiveUser?.travelDestination, travelPlans?.map(p => p.id).join(',')],
    queryFn: async () => {
      const cities = [];
      
      // Always include hometown
      if (effectiveUser?.hometownCity) {
        cities.push(effectiveUser.hometownCity);
      }
      
      // CRITICAL FIX: Also check travel plans directly for active destinations
      const currentTravelDestination = getCurrentTravelDestination(Array.isArray(travelPlans) ? travelPlans : []);
      
      // Include travel destination from active travel plan
      if (currentTravelDestination) {
        const travelCity = currentTravelDestination.split(',')[0].trim();
        if (!cities.includes(travelCity) && travelCity !== effectiveUser?.hometownCity) {
          cities.push(travelCity);
        }
      }
      
      // Fallback: Include travel destination from effectiveUser if set
      if (effectiveUser?.isCurrentlyTraveling && effectiveUser?.travelDestination) {
        const travelCity = effectiveUser.travelDestination.split(',')[0].trim();
        if (!cities.includes(travelCity) && travelCity !== effectiveUser?.hometownCity) {
          cities.push(travelCity);
        }
      }
      
      // If no cities, default to Culver City
      if (cities.length === 0) {
        cities.push('Culver City');
      }
      
      console.log(`🎪 HOME: Fetching events from cities:`, cities, {
        hometown: effectiveUser?.hometownCity,
        travelDestination: effectiveUser?.travelDestination,
        currentTravelDestination,
        isCurrentlyTraveling: effectiveUser?.isCurrentlyTraveling,
        travelPlansCount: travelPlans?.length
      });
      
      // Fetch events from all relevant cities
      const allEvents = [];
      for (const city of cities) {
        try {
          const userId = effectiveUser?.id;
          const userParam = userId ? `&userId=${userId}` : '';
          const response = await fetch(`/api/events?city=${encodeURIComponent(city)}${userParam}`);
          const cityEvents = await response.json();
          allEvents.push(...cityEvents);
        } catch (error) {
          console.error(`Failed to fetch events for ${city}:`, error);
        }
      }
      
      // ONLY INCLUDE EVENTS WITH organizerId (user-created events) and remove duplicates
      const userCreatedEvents = allEvents
        .filter((event: any) => event.organizerId && event.organizerId > 0)
        .filter((event, index, arr) => arr.findIndex(e => e.id === event.id) === index); // Remove duplicates
      
      return userCreatedEvents.sort((a, b) => {
        // USER CREATED EVENTS PRIORITY BY USER
        const aIsUserCreated = a.createdBy === effectiveUser?.id || a.userId === effectiveUser?.id;
        const bIsUserCreated = b.createdBy === effectiveUser?.id || b.userId === effectiveUser?.id;
        
        if (aIsUserCreated && !bIsUserCreated) return -1;
        if (!aIsUserCreated && bIsUserCreated) return 1;
        
        // Then by date
        return new Date(b.startDate || b.createdAt).getTime() - new Date(a.startDate || a.createdAt).getTime();
      });
    },
    enabled: !!effectiveUser,
  });

  // Function to get things in common using API compatibility data (matches profile page)
  const getThingsInCommon = (otherUser: any) => {
    if (!compatibilityData || !otherUser) return 0;
    
    // Find the compatibility data for this specific user
    const userCompatibility = Array.isArray(compatibilityData) ? compatibilityData.find((match: any) => match.userId === otherUser.id) : null;
    
    if (userCompatibility) {
      // Calculate total from all shared categories
      let total = 0;
      total += userCompatibility.sharedInterests?.length || 0;
      total += userCompatibility.sharedActivities?.length || 0;
      total += userCompatibility.sharedEvents?.length || 0;
      total += userCompatibility.sharedLanguages?.length || 0;
      total += userCompatibility.sharedCountries?.length || 0;
      total += userCompatibility.sharedTravelIntent?.length || 0;
      total += userCompatibility.sharedSexualPreferences?.length || 0;
      
      // Add boolean matches
      if (userCompatibility.locationOverlap) total += 1;
      if (userCompatibility.dateOverlap) total += 1;
      if (userCompatibility.userTypeCompatibility) total += 1;
      if (userCompatibility.bothVeterans) total += 1;
      if (userCompatibility.bothActiveDuty) total += 1;
      if (userCompatibility.sameFamilyStatus) total += 1;
      if (userCompatibility.sameAge) total += 1;
      if (userCompatibility.sameGender) total += 1;
      if (userCompatibility.travelIntentCompatibility) total += 1;
      
      return total;
    }
    
    // Fallback to simple local calculation if API data not available
    if (!effectiveUser) return 0;
    
    let commonCount = 0;
    
    // Compare interests (both regular and travel interests)
    const currentUserInterests = [...(effectiveUser.interests || []), ...(effectiveUser.travelInterests || [])];
    const otherUserInterests = [...(otherUser.interests || []), ...(otherUser.travelInterests || [])];
    const commonInterests = currentUserInterests.filter(interest => 
      otherUserInterests.some(other => other.toLowerCase().trim() === interest.toLowerCase().trim())
    );
    commonCount += commonInterests.length;
    
    // Compare activities
    const currentUserActivities = [...(effectiveUser.localActivities || []), ...(effectiveUser.preferredActivities || [])];
    const otherUserActivities = [...(otherUser.localActivities || []), ...(otherUser.preferredActivities || [])];
    const commonActivities = currentUserActivities.filter(activity => 
      otherUserActivities.some(other => other.toLowerCase().trim() === activity.toLowerCase().trim())
    );
    commonCount += commonActivities.length;
    
    // Compare languages
    const currentUserLanguages = effectiveUser.languagesSpoken || [];
    const otherUserLanguages = otherUser.languagesSpoken || [];
    const commonLanguages = currentUserLanguages.filter((language: string) => 
      otherUserLanguages.some((other: string) => other.toLowerCase().trim() === language.toLowerCase().trim())
    );
    commonCount += commonLanguages.length;
    
    // Compare sexual preferences
    const currentUserSexualPreferences = effectiveUser.sexualPreference || [];
    const otherUserSexualPreferences = otherUser.sexualPreference || [];
    const commonSexualPreferences = currentUserSexualPreferences.filter((pref: string) => 
      otherUserSexualPreferences.some((other: string) => other.toLowerCase().trim() === pref.toLowerCase().trim())
    );
    commonCount += commonSexualPreferences.length;
    
    // Compare family status
    if (effectiveUser.familyStatus && otherUser.familyStatus && 
        effectiveUser.familyStatus.toLowerCase() === otherUser.familyStatus.toLowerCase()) {
      commonCount += 1;
    }
    
    // Compare veteran status
    if (effectiveUser.isVeteran && otherUser.isVeteran) {
      commonCount += 1;
    }
    
    // Compare active duty status
    if (effectiveUser.isActiveDuty && otherUser.isActiveDuty) {
      commonCount += 1;
    }
    
    // Compare age range (within 5 years considered a match)
    if (effectiveUser.age && otherUser.age && 
        Math.abs(effectiveUser.age - otherUser.age) <= 5) {
      commonCount += 1;
    }
    
    // Compare gender if both specified
    if (effectiveUser.gender && otherUser.gender && 
        effectiveUser.gender.toLowerCase() === otherUser.gender.toLowerCase()) {
      commonCount += 1;
    }
    
    return commonCount;
  };

  // Function to sort users based on selected sorting option
  const getSortedUsers = (users: any[]) => {
    if (!users) return [];

    // Enrich users with travel destination data for all users
    const enrichedUsers = [...users].map(user => {
      const currentUserId = effectiveUser?.id || currentUserProfile?.id;
      
      // If this is the current user, add travel destination from effectiveUser
      if (user.id === currentUserId && effectiveUser) {
        return {
          ...user,
          isCurrentlyTraveling: effectiveUser.isCurrentlyTraveling,
          travelDestination: effectiveUser.travelDestination,
          currentTravelPlan: effectiveUser.currentTravelPlan
        };
      }
      
      // For other users, they should already have travelDestination from the database
      // Make sure they have isCurrentlyTraveling set properly
      return {
        ...user,
        isCurrentlyTraveling: user.isCurrentlyTraveling || !!user.travelDestination,
        travelDestination: user.travelDestination
      };
    });

    return enrichedUsers.sort((a, b) => {
      // Always put the current user first
      const currentUserId = user?.id || currentUserProfile?.id || effectiveUser?.id;
      if (a.id === currentUserId) return -1;
      if (b.id === currentUserId) return 1;

      // Then apply the selected sorting
      switch (sortBy) {
        case 'closest_nearby':
          // Sort by location proximity - prioritize same city, then state, then country
          const currentUser = user || JSON.parse(localStorage.getItem('travelconnect_user') || '{}');
          const currentCity = currentUser?.hometownCity?.toLowerCase() || '';
          const currentState = currentUser?.hometownState?.toLowerCase() || '';
          const currentCountry = currentUser?.hometownCountry?.toLowerCase() || '';

          // Calculate proximity score (higher = closer)
          const getProximityScore = (user: any) => {
            const userCity = user.hometownCity?.toLowerCase() || '';
            const userState = user.hometownState?.toLowerCase() || '';
            const userCountry = user.hometownCountry?.toLowerCase() || '';

            if (userCity === currentCity) return 100; // Same city
            if (userState === currentState) return 50; // Same state/region
            if (userCountry === currentCountry) return 25; // Same country
            return 0; // Different country
          };

          return getProximityScore(b) - getProximityScore(a);
        case 'recent':
          // Sort by creation date (most recent first)
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'active':
          // Sort by recently active users
          return new Date(b.lastLocationUpdate || b.createdAt || 0).getTime() - new Date(a.lastLocationUpdate || a.createdAt || 0).getTime();
        case 'aura':
          // Sort by Travel Aura points (highest first)
          return (b.aura || 0) - (a.aura || 0);
        case 'references':
          // Sort by number of references/reviews (assuming references are stored in a field)
          const aReferences = a.references?.length || 0;
          const bReferences = b.references?.length || 0;
          return bReferences - aReferences;
        case 'compatibility':
          // Sort by number of shared interests/activities
          const aShared = (a.interests?.length || 0) + (a.activities?.length || 0);
          const bShared = (b.interests?.length || 0) + (b.activities?.length || 0);
          return bShared - aShared;
        case 'travel_experience':
          // Sort by travel experience (number of countries visited)
          const aCountries = a.countriesVisited?.length || 0;
          const bCountries = b.countriesVisited?.length || 0;
          return bCountries - aCountries;
        case 'alphabetical':
          // Sort alphabetically by username
          return (a.username || '').localeCompare(b.username || '');
        default:
          return 0;
      }
    });
  };
  const [eventsDisplayCount, setEventsDisplayCount] = useState(3);
  const [businessesDisplayCount, setBusinessesDisplayCount] = useState(3);
  const [displayLimit, setDisplayLimit] = useState(8);
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

  // Location filter state for SmartLocationInput in advanced search
  const [locationFilter, setLocationFilter] = useState({
    country: "",
    state: "",
    city: ""
  });

  // Collapsible section states for advanced search
  const [expandedSections, setExpandedSections] = useState({
    topChoices: false,
    gender: false,
    sexualPreference: false,
    userType: false,
    ageRange: false,
    travelerType: false,
    interests: false,
    activities: false,
    events: false,
    militaryStatus: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();


  // Use static hero image to prevent caching issues - try URL encoding for space

  console.log('🖼️ Home Hero: Using static image:', staticHeroImage);
  
  // Verify image exists
  const checkImageExists = async (url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log('🖼️ Image check:', url, response.ok ? 'EXISTS' : 'MISSING');
      return response.ok;
    } catch (error) {
      console.log('🖼️ Image check failed:', url, error);
      return false;
    }
  };
  
  React.useEffect(() => {
    checkImageExists(staticHeroImage);
  }, []);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Scroll to top when home page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);




  // Handle destination selection from DestinationModal
  const handleDestinationSelected = (destination: any) => {
    console.log('🎯 Destination selected:', destination);
    setShowDestinationModal(false);
    // Additional logic for handling destination selection can be added here
  };

  // Query for matched users data  
  const { data: matchedUsers = [], isLoading: matchedUsersLoading, refetch: refetchMatchedUsers } = useQuery<User[]>({
    queryKey: ["/api/users", "matched", matchedUsersUserId],
    queryFn: async () => {
      if (!matchedUsersUserId) return [];

      const params = new URLSearchParams({
        matched: 'true',
        userId: matchedUsersUserId.toString()
      });
      const response = await fetch(`/api/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch matched users');
      const data = await response.json();
      return data;
    },
    enabled: !!matchedUsersUserId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  // Force fresh user data fetch on component mount
  React.useEffect(() => {
    const refreshUserData = async () => {
      if (user?.id) {
        try {
          // Clear any cached data first
          localStorage.removeItem('travelconnect_user');

          const response = await fetch(`/api/users/${user.id}?t=${Date.now()}`);
          if (response.ok) {
            const freshUser = await response.json();
            console.log('Fresh user data from database:', freshUser);

            // Update with fresh data
            localStorage.setItem('travelconnect_user', JSON.stringify(freshUser));
            setUser(freshUser);
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      }
    };

    refreshUserData();
  }, [user?.id]); // Run when user ID changes

  const checkDateOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    return datesOverlap(start1, end1, start2, end2);
  };


  // Server now handles all metropolitan area consolidation automatically
  // No client-side consolidation needed

  // Get ALL travel destinations and hometown for comprehensive discovery
  const discoveryLocations = useMemo(() => {
    console.log('Discovery memo - currentUserId:', currentUserId);

    if (!currentUserId) {
      console.log('Discovery - no auth, returning empty');
      return { allCities: [] };
    }

    const locations: Array<{city: string; type: string}> = [];

    // Add hometown with LA metro consolidation for user discovery
    const hometownCity = effectiveUser?.hometownCity && effectiveUser?.hometownState && effectiveUser?.hometownCountry 
      ? `${effectiveUser.hometownCity}, ${effectiveUser.hometownState}, ${effectiveUser.hometownCountry}`
      : null;

    if (hometownCity) {
      // Server handles all metropolitan area consolidation automatically
      locations.push({ city: hometownCity, type: 'hometown' });
      console.log('🏠 USER DISCOVERY: Hometown', hometownCity);
    }

    // Add current travel destination if traveling
    if (effectiveUser?.isCurrentlyTraveling && effectiveUser?.travelDestination) {
      locations.push({ city: effectiveUser.travelDestination, type: 'current_travel' });
      console.log('✈️ USER DISCOVERY: Current travel', effectiveUser.travelDestination);
    }

    // Add ALL planned travel destinations from travel plans
    if (Array.isArray(travelPlans) && travelPlans.length > 0) {
      travelPlans.forEach((plan: any) => {
        if (plan.destination && !locations.some(loc => loc.city === plan.destination)) {
          locations.push({ city: plan.destination, type: 'planned_travel' });
          console.log('📅 USER DISCOVERY: Travel plan', plan.destination);
        }
      });
    }

    console.log('Discovery - All locations:', locations);

    return { allCities: locations };
  }, [currentUserId, effectiveUser?.hometownCity, effectiveUser?.hometownState, effectiveUser?.hometownCountry, effectiveUser?.isCurrentlyTraveling, effectiveUser?.travelDestination, travelPlans]);

  // Fetch events from ALL locations (hometown + all travel destinations)
  const { data: allEvents = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: [`/api/events/all-locations`, discoveryLocations.allCities.map(loc => loc.city)],
    queryFn: async () => {
      if (!discoveryLocations.allCities.length) return [];

      console.log('Fetching events from ALL locations:', discoveryLocations.allCities);

      // Fetch events from all cities in parallel
      const eventPromises = discoveryLocations.allCities.map(async (location) => {
        const cityName = location.city.split(',')[0].trim();
        console.log(`Fetching events for ${location.type}:`, cityName);

        try {
          const response = await fetch(`/api/events?city=${encodeURIComponent(cityName)}`);
          if (!response.ok) throw new Error(`Failed to fetch events for ${cityName}`);
          const data = await response.json();
          console.log(`${location.type} Events API response:`, data.length, 'events for', cityName);
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

      console.log('Combined and filtered events:', unique.length, 'events from ALL', discoveryLocations.allCities.length, 'locations');
      return unique;
    },
    enabled: discoveryLocations.allCities.length > 0,
    staleTime: 0,
    gcTime: 0,
  });

  // Filter events to only show upcoming ones with user priority and recurring deduplication
  const events = useMemo(() => {
    if (!allEvents.length) return [];

    // Filter to only show upcoming events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingEvents = allEvents.filter(event => new Date(event.date) >= today);

    // Handle recurring events - only show one instance per series
    const uniqueEvents = upcomingEvents.reduce((unique: any[], event: any) => {
      // If event has a series ID (recurring), only keep the earliest occurrence
      if (event.seriesId || event.recurringId || event.recurring) {
        const seriesKey = event.seriesId || event.recurringId || `${event.title}-${event.organizerId}`;
        const existingEvent = unique.find(e => 
          (e.seriesId === seriesKey) || 
          (e.recurringId === seriesKey) || 
          (e.title === event.title && e.organizerId === event.organizerId && e.location === event.location)
        );

        if (!existingEvent) {
          unique.push(event);
        } else {
          // Keep the earlier event
          const eventDate = new Date(event.date);
          const existingDate = new Date(existingEvent.date);
          if (eventDate < existingDate) {
            const index = unique.findIndex(e => e.id === existingEvent.id);
            unique[index] = event;
          }
        }
      } else {
        unique.push(event);
      }
      return unique;
    }, []);

    // Sort with LOCATION PRIORITY FIRST - hometown events before distant cities
    const sortedEvents = uniqueEvents.sort((a: any, b: any) => {
      // Get location priority scores (higher = more important)
      const getLocationPriority = (event: any) => {
        if (!event.sourceLocation) return 0;
        
        // Hometown events get highest priority
        if (event.sourceLocation.type === 'hometown') return 100;
        // Current travel destination gets second priority  
        if (event.sourceLocation.type === 'current_travel') return 80;
        // Planned travel destinations get lower priority
        if (event.sourceLocation.type === 'planned_travel') return 60;
        
        return 0;
      };

      const aPriority = getLocationPriority(a);
      const bPriority = getLocationPriority(b);
      
      // Sort by location priority first (hometown events first!)
      if (aPriority !== bPriority) return bPriority - aPriority;

      // Within same location priority, prioritize member-created events
      const aMemberCreated = !a.isAIGenerated;
      const bMemberCreated = !b.isAIGenerated;

      if (aMemberCreated && !bMemberCreated) return -1;
      if (!aMemberCreated && bMemberCreated) return 1;

      // Within same type, prioritize events created by current user
      const userCreatedA = a.organizerId === currentUserId;
      const userCreatedB = b.organizerId === currentUserId;

      if (userCreatedA && !userCreatedB) return -1;
      if (!userCreatedA && userCreatedB) return 1;

      // Finally sort by date - earliest upcoming events first
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    console.log('Filtered events:', sortedEvents.length, 'events from ALL locations (member-created events prioritized, recurring deduplicated)');
    return sortedEvents;
  }, [allEvents, currentUserId]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages/${currentUserId}`],
    enabled: !!currentUserId && loadedSections.has('messages'), // Only load when messages section is viewed
  });

  // Business deals functionality removed - focusing on travelers and locals

  // Fetch active quick meetups from ALL locations (hometown + all travel destinations) - LAZY LOADED
  const { data: allQuickMeets = [], isLoading: quickMeetsLoading } = useQuery<any[]>({
    queryKey: [`/api/quick-meets/all-locations`, discoveryLocations.allCities.map(loc => loc.city)],
    queryFn: async () => {
      if (!discoveryLocations.allCities.length) return [];

      console.log('Fetching active quick meetups from ALL locations:', discoveryLocations.allCities);

      // Fetch meetups from all cities in parallel
      const quickMeetPromises = discoveryLocations.allCities.map(async (location) => {
        const cityName = location.city.split(',')[0].trim();
        console.log(`Fetching quick meetups for ${location.type}:`, cityName);

        try {
          const response = await fetch(`/api/quick-meets?city=${encodeURIComponent(cityName)}`);
          if (!response.ok) throw new Error(`Failed to fetch quick meets for ${cityName}`);
          const data = await response.json();
          console.log(`${location.type} Quick Meets API response:`, data.length, 'meets for', cityName);
          return data.map((meetup: any) => ({ ...meetup, sourceLocation: location }));
        } catch (error) {
          console.error(`Error fetching quick meets for ${cityName}:`, error);
          return [];
        }
      });

      const allQuickMeetsArrays = await Promise.all(quickMeetPromises);
      const combined = allQuickMeetsArrays.flat();

      // Remove duplicates by meetup ID
      const unique = combined.filter((quickMeet, index, self) => 
        index === self.findIndex((m) => m.id === quickMeet.id)
      );

      console.log('Combined quick meets:', unique.length, 'meets from ALL', discoveryLocations.allCities.length, 'locations');
      return unique;
    },
    staleTime: 30 * 1000, // 30-second cache
    gcTime: 0,
  });

  const quickMeets = allQuickMeets;

  // Query users - prioritize specific location filter, otherwise show ALL users
  const { data: rawUsers = [], isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/users/discover-people", { location: filters.location }],
    queryFn: async () => {
      const searchLocation = filters.location;

      try {
        // If there's a specific location filter, use that
        if (searchLocation && searchLocation.trim() !== '') {
          console.log('Fetching users for specific location filter:', searchLocation);
          const response = await fetch(`/api/users/search-by-location?location=${encodeURIComponent(searchLocation)}`, {
            headers: {
              ...(currentUserId && { 'x-user-id': currentUserId.toString() })
            }
          });
          if (!response.ok) {
            console.error('Location search API failed:', response.status, response.statusText);
            throw new Error('Failed to fetch users by location');
          }
          const data = await response.json();
          console.log('Location search API response:', data.length, 'users for', searchLocation);
          return data;
        } else {
          // Show ALL users for general discovery (not limited to specific cities)
          console.log('Fetching ALL users for discovery');
          const response = await fetch('/api/users');
          if (!response.ok) {
            console.error('Users API failed:', response.status, response.statusText);
            throw new Error('Failed to fetch all users');
          }
          const data = await response.json();
          console.log('ALL users API response:', data.length, 'total users for discovery');
          return data;
        }
      } catch (error) {
        console.error('Users query error:', error);
        throw error;
      }
    },
    enabled: true, // Always enabled
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  // Enrich ALL users with travel data and apply prioritization
  const users = useMemo(() => {
    if (!rawUsers.length) return [];
    
    const weatherWidgetLocation = getCurrentUserLocation(); // Get EXACT location weather widget uses
    
    return rawUsers.map(user => {
      const enriched = enrichUserWithTravelData(user, user.travelPlans);
      
      // For current user - use WEATHER WIDGET location
      if (user.id === effectiveUser?.id) {
        enriched.displayLocation = weatherWidgetLocation; // Force to use weather widget location
      } else {
        // For other users
        enriched.displayLocation = enriched.isCurrentlyTraveling && enriched.travelDestination
          ? enriched.travelDestination
          : [user.hometownCity, user.hometownState, user.hometownCountry].filter(Boolean).join(', ');
      }
      
      return enriched;
    });
  }, [rawUsers, travelPlans, effectiveUser?.id]);

  // Auto-detect business location for automatic nearby user discovery
  const getBusinessLocation = () => {
    if (effectiveUser?.userType === 'business' && effectiveUser?.hometownCity) {
      return effectiveUser.hometownCity;
    }
    return null;
  };



  // Use matched users when "best-matches" filter is active, otherwise use regular users
  const usersToFilter = activeFilter === "best-matches" ? matchedUsers : users;

  // Debug disabled for performance


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
        const currentDestinationString = userCurrentTravelDestination && typeof userCurrentTravelDestination === 'object' ? 
          `${userCurrentTravelDestination.destinationCity || ''}${userCurrentTravelDestination.destinationState ? `, ${userCurrentTravelDestination.destinationState}` : ''}${userCurrentTravelDestination.destinationCountry ? `, ${userCurrentTravelDestination.destinationCountry}` : ''}`.replace(/^,\s*/, '') : 
          (typeof userCurrentTravelDestination === 'string' ? userCurrentTravelDestination : '');
        const isCurrentlyTravelingToKeyword = currentDestinationString.toLowerCase().includes(keyword);

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
        otherUser.interests?.some((interest: string) => interest.toLowerCase().includes(searchTerm)) ||
        otherUser.travelInterests?.some((interest: string) => interest.toLowerCase().includes(searchTerm)) ||
        otherUser.localActivities?.some((activity: string) => activity.toLowerCase().includes(searchTerm)) ||
        otherUser.preferredActivities?.some((activity: string) => activity.toLowerCase().includes(searchTerm)) ||
        otherUser.travelStyle?.some((style: string) => style.toLowerCase().includes(searchTerm)) ||
        otherUser.localExpertise?.some((expertise: string) => expertise.toLowerCase().includes(searchTerm)) ||
        otherUser.languagesSpoken?.some((language: string) => language.toLowerCase().includes(searchTerm)) ||
        otherUser.sexualPreference?.some((pref: string) => pref.toLowerCase().includes(searchTerm));
      if (!matchesSearch) return false;
    }

    if (filters.interests.length > 0) {
      const userInterests = otherUser.interests || [];
      const hasMatchingInterest = filters.interests.some((interest: string) => 
        userInterests.some((userInterest: string) => 
          userInterest.toLowerCase().includes(interest.toLowerCase())
        )
      );
      if (!hasMatchingInterest) return false;
    }

    if (filters.activities.length > 0) {
      const userActivities = [...(otherUser.localActivities || []), ...(otherUser.preferredActivities || [])];
      const hasMatchingActivity = filters.activities.some((activity: string) => 
        userActivities.some((userActivity: string) => 
          userActivity.toLowerCase().includes(activity.toLowerCase())
        )
      );
      if (!hasMatchingActivity) return false;
    }

    if (filters.events.length > 0) {
      // For event filtering, we could check if user is attending certain event categories
      // or has shown interest in specific event types through their travel plans
      const userEventInterests = [...(otherUser.interests || []), ...(otherUser.travelInterests || [])];
      const hasMatchingEventInterest = filters.events.some((eventType: string) => 
        userEventInterests.some((interest: string) => 
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
      const hasTravelPlans = Array.isArray(travelPlans) && travelPlans.length > 0;

      if (!hasLegacyTravel && !hasTravelPlans) {
        return false;
      }

      // Check for matches against all travel plans
      const hasMatchWithPlans = Array.isArray(travelPlans) ? travelPlans.some((plan: any) => {
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
      }) : false;

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

            // Update localStorage with the new user data
            localStorage.setItem('travelconnect_user', JSON.stringify(finalUpdatedUser));

            // Invalidate queries to refresh content including recommendations
            queryClient.invalidateQueries({ queryKey: ['/api/users'] });
            queryClient.invalidateQueries({ queryKey: ['/api/events'] });
            queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
            queryClient.invalidateQueries({ queryKey: [`/api/travel-plans/${userId}`] });

            setShowDestinationModal(false);

            toast({
              title: "Travel plan created!",
              description: `Added ${destination} to your travel plans`,
            });
          }
        }
      } else {
        throw new Error('Failed to create travel plan');
      }
    } catch (error) {
      console.error('Failed to create travel plan:', error);
      toast({
        title: "Error",
        description: "Failed to create travel plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

{/* Hero Toggle Button & Theme Toggle (when hero is hidden) */}
{!isHeroVisible && (
  <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleHeroVisibility}
        className="text-sm"
        data-testid="button-show-hero"
      >
        <ChevronDown className="w-4 h-4 mr-2" />
        Show Welcome Message
      </Button>
      <ThemeToggle />
    </div>
  </div>
)}

{/* HERO SECTION — Modern Glass Morphism Design 2025 */}
{isHeroVisible && (
<section className="relative py-8 sm:py-12 lg:py-20 overflow-hidden">
  {/* Dramatic animated gradient background */}
  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-orange-100 dark:from-gray-900 dark:to-gray-900"></div>
  
  {/* DRAMATIC Floating orbs - highly visible animated background */}
  <div className="absolute inset-0 opacity-70 dark:opacity-60 pointer-events-none overflow-hidden">
    {/* Large blue orb - top left */}
    <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-gradient-to-br from-blue-500 via-cyan-400 to-blue-600 rounded-full blur-3xl animate-float-slow opacity-80"></div>
    
    {/* Huge orange orb - bottom right */}
    <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-orange-400 via-amber-400 to-orange-500 rounded-full blur-3xl animate-float-slower opacity-60"></div>
    
    {/* Medium cyan orb - center */}
    <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-gradient-to-br from-cyan-400 via-blue-400 to-cyan-500 rounded-full blur-3xl animate-float opacity-50"></div>
    
    {/* Small accent orb - top right */}
    <div className="absolute top-10 right-20 w-[300px] h-[300px] bg-gradient-to-br from-cyan-400 via-blue-300 to-cyan-500 rounded-full blur-2xl animate-float-slow opacity-60"></div>
    
    {/* Small accent orb - bottom left */}
    <div className="absolute bottom-10 left-20 w-[350px] h-[350px] bg-gradient-to-br from-amber-300 via-orange-300 to-amber-400 rounded-full blur-2xl animate-float-slower opacity-50"></div>
  </div>

  {isMobile ? (
    // Mobile: Modern vertical layout with glass morphism
    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
      {/* DRAMATIC Glass morphism badge */}
      <div className="inline-flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-2 border-blue-500/30 dark:border-orange-500/30 rounded-full px-8 py-3 mb-8 shadow-2xl">
        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
        <span className="text-base font-black bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Connect • Discover • Experience</span>
      </div>

      <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-8 px-2 drop-shadow-2xl">
        {effectiveUser?.userType === "business" ? (
          <>
            <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent animate-gradient drop-shadow-xl">Nearby Traveler</span>
            <br />
            <span className="text-3xl sm:text-4xl text-gray-900 dark:text-white drop-shadow-lg">Connect Your Business</span>
            <br />
            <span className="text-3xl sm:text-4xl text-gray-900 dark:text-white drop-shadow-lg">with Travelers & Locals</span>
          </>
        ) : (
          <>
            <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent animate-gradient drop-shadow-xl">Nearby Traveler</span>
            <br />
            <span className="text-3xl sm:text-4xl text-gray-900 dark:text-white drop-shadow-lg">Connect with Travelers</span>
            <br />
            <span className="text-3xl sm:text-4xl text-gray-900 dark:text-white drop-shadow-lg">& Locals Worldwide</span>
          </>
        )}
      </h1>
      
      {/* Glass morphism image container */}
      <div className="mb-8 flex justify-center px-4">
        <div className="relative w-full max-w-sm group">
          {/* Glow effect behind */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-orange-500 rounded-2xl opacity-75 blur-lg group-hover:opacity-100 transition duration-500"></div>
          
          {/* Main image with glass morphism overlay */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20">
            <img 
              src={staticHeroImage}
              alt="Travelers connecting at coffee shop"
              className="w-full h-auto object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
            
            {/* Glassmorphism text overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/10 dark:bg-black/20 backdrop-blur-md border-t border-white/20">
              <p className="text-white font-semibold text-sm text-center drop-shadow-lg">
                "Where Local Experiences Meet Worldwide Connections"
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto px-4 space-y-4">
        <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
          Travel doesn't change you.<br />
          <em className="text-orange-600 dark:text-orange-400 font-semibold">The people you meet do.</em>
        </p>
        <p className="text-lg text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
          Nearby Traveler helps travelers meet locals and other travelers through shared interests, activities, and events — building friendships that last a lifetime.
        </p>
      </div>
      
      {effectiveUser?.userType === "business" && (
        <div className="flex flex-col gap-4 justify-center pt-8">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            onClick={() => setLocation("/business-dashboard")}
          >
            <Store className="w-5 h-5 mr-2" />
            Manage Business
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-3 text-lg transform hover:scale-105 transition-all duration-300"
            onClick={() => {
              setConnectModalMode("current");
              setShowConnectModal(true);
            }}
          >
            <Users className="w-5 h-5 mr-2" />
            Find Customers
          </Button>
        </div>
      )}
    </div>
  ) : (
    // Desktop: Modern glass morphism layout with enhanced visuals
    <div className="relative mx-auto max-w-7xl px-2 sm:px-4 md:px-6 py-12 sm:py-16 md:py-24 z-10">
      
      <div className="grid gap-8 md:gap-12 md:grid-cols-5 items-center relative z-10">
        {/* Left text side - wider and enhanced */}
        <div className="md:col-span-3">
          {/* Glass morphism premium badge */}
          <div className="inline-flex items-center gap-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 rounded-full px-6 py-2.5 mb-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Connect • Discover • Experience</span>
          </div>

          <div className="space-y-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.1]">
              {effectiveUser?.userType === "business" ? (
                <>
                  <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                    Nearby Traveler
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent">
                    Connect Your Business
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 bg-clip-text text-transparent">
                    with Travelers & Locals
                  </span>
                </>
              ) : (
                <>
                  <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                    Nearby Traveler
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent">
                    Connect with Travelers
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 bg-clip-text text-transparent">
                    & Locals Worldwide
                  </span>
                </>
              )}
            </h1>
            
            <div className="max-w-2xl space-y-4">
              <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                Travel doesn't change you.<br />
                <em className="text-orange-600 dark:text-orange-400 font-semibold">The people you meet do.</em>
              </p>
              <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                Nearby Traveler helps travelers meet locals and other travelers through shared interests, activities, and events — building friendships that last a lifetime.
              </p>
            </div>
          </div>
          
          {/* Enhanced Features with attractive icons */}
          <div className="mt-8 space-y-4">
            {effectiveUser?.userType === "business" ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Store className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Smart Customer Matching</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered connections with travelers and locals who love your offerings</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Location-Targeted Discovery</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reach the right customers at the right time in your area</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Business Notifications</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Real-time alerts for new customers and partnership opportunities</p>
                  </div>
                </div>
                
                {/* Business action buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-8 py-3 text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                    onClick={() => setLocation("/business-dashboard")}
                  >
                    <Store className="w-5 h-5 mr-2" />
                    Manage Business
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-3 text-lg transform hover:scale-105 transition-all duration-200"
                    onClick={() => {
                      setConnectModalMode("current");
                      setShowConnectModal(true);
                    }}
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Find Customers
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Smart Matching</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered connections based on shared interests and compatibility</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Local Experiences</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Discover hidden gems and authentic local experiences in any city</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Real-time Connect</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Instant messaging and live notifications for spontaneous quick meets</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      
        {/* Right image side - more prominent and engaging */}
        <div className="md:col-span-2 flex justify-center items-center relative order-first md:order-last">
          {/* Decorative background blur effects */}
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-4 -left-8 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-4 -right-8 w-32 h-32 bg-orange-400/20 rounded-full blur-2xl"></div>
          </div>
          
          {/* Main image container with enhanced styling */}
          <div className="relative group">
            {/* Enhanced image container */}
            <div className="relative">
              {/* Subtle background glow */}
              <div className="absolute -inset-3 bg-gradient-to-r from-blue-200/30 to-orange-200/30 dark:from-blue-900/20 dark:to-orange-900/20 rounded-3xl blur-lg"></div>
              
              {/* Main image - standardized height matching landing page */}
              <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] rounded-xl overflow-hidden shadow-xl border border-gray-200/50 dark:border-gray-700/50 transform group-hover:scale-[1.02] transition-all duration-300">
                {/* Loading placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <Coffee className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-pulse" />
                    <p className="text-gray-500 text-sm">Loading image...</p>
                  </div>
                </div>
                
                <img
                  src={staticHeroImage}
                  alt="Travelers connecting at coffee shop"
                  className="w-full h-full object-cover transition-opacity duration-500 relative z-10"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  onLoad={(e) => {
                    e.currentTarget.style.opacity = '1';
                    // Hide the loading placeholder
                    const placeholder = e.currentTarget.previousElementSibling as HTMLElement;
                    if (placeholder) placeholder.style.display = 'none';
                  }}
                  style={{ opacity: '0' }}
                />
                
                {/* Enhanced overlay with better contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10">
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                    <p className="text-white/90 font-medium italic text-base drop-shadow-lg leading-relaxed">
                      "Where Local Experiences Meet Worldwide Connections"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
  
  {/* Theme Toggle & Hide Hero Buttons */}
  <div className="absolute top-4 right-4 z-10 flex gap-2">
    <ThemeToggle />
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleHeroVisibility}
      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      data-testid="button-hide-hero"
    >
      <X className="w-4 h-4 mr-1" />
      Hide
    </Button>
  </div>
</section>
)}

      <main className="pt-2 sm:pt-4 pb-24 md:pb-8 lg:pb-4 relative">
        {/* Border-to-Border Soft Blue-Orange Gradient Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          {/* Soft Blue Orb - Top Left */}
          <div className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-blue-300 via-blue-400 to-cyan-300 rounded-full opacity-20 blur-3xl animate-float"></div>
          
          {/* Soft Orange Orb - Top Right */}
          <div className="absolute -top-32 -right-32 w-[700px] h-[700px] bg-gradient-to-br from-orange-300 via-orange-400 to-amber-300 rounded-full opacity-25 blur-3xl animate-float-slow"></div>
          
          {/* Soft Blue Orb - Middle Left */}
          <div className="absolute top-1/3 -left-48 w-[650px] h-[650px] bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full opacity-15 blur-3xl animate-float-slower"></div>
          
          {/* Soft Orange Orb - Middle Right */}
          <div className="absolute top-1/2 -right-48 w-[700px] h-[700px] bg-gradient-to-br from-orange-400 to-amber-400 rounded-full opacity-20 blur-3xl animate-float"></div>
          
          {/* Soft Blue Orb - Bottom Left */}
          <div className="absolute -bottom-40 -left-32 w-[750px] h-[750px] bg-gradient-to-br from-blue-300 via-cyan-400 to-blue-400 rounded-full opacity-20 blur-3xl animate-float-slow hidden lg:block"></div>
          
          {/* Soft Orange Orb - Bottom Right */}
          <div className="absolute -bottom-48 -right-40 w-[800px] h-[800px] bg-gradient-to-br from-orange-300 via-amber-400 to-orange-400 rounded-full opacity-25 blur-3xl animate-float-slower hidden lg:block"></div>
        </div>
        
        <div className="w-full max-w-full px-2 sm:px-4 lg:px-6">

        {/* Main Content - Standard three-column layout */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6 px-2 sm:px-4 lg:px-8 mt-2 sm:mt-0">
          
          {/* Main Content - Center column */}
          <div className="col-span-1 lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-8 min-w-0 relative">

            {/* Glass Morphism Content Panel - Now in FRONT of orbs with lighter backdrop */}
            <div className="relative z-10 backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 rounded-3xl p-4 sm:p-6 border border-white/30 dark:border-gray-700/30 shadow-2xl">
            
            <div className="flex items-center justify-between mb-6" data-testid="discover-people-section">
              <div className="flex items-center gap-2 sm:gap-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 via-cyan-600 to-orange-500 bg-clip-text text-transparent">
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
                    className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                    data-testid="button-clear-all-filters"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32 sm:w-40" data-testid="select-sort">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="active">Most Active</SelectItem>
                    <SelectItem value="compatibility">Compatibility</SelectItem>
                    <SelectItem value="closest_nearby">Closest</SelectItem>
                    <SelectItem value="travel_experience">Travel Exp</SelectItem>
                    <SelectItem value="aura">Travel Aura</SelectItem>
                    <SelectItem value="references">References</SelectItem>
                    <SelectItem value="alphabetical">A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.location && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  📍 {filters.location}
                </Badge>
              )}
              
              {filters.search && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  🔍 "{filters.search}"
                </Badge>
              )}
            </div>

            {/* User Grid Display */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4">{filteredUsers.length > 0 ? (
                filteredUsers.slice(0, showAllUsers ? filteredUsers.length : 8).map((otherUser) => (
                  <div key={otherUser.id} className="transform hover:scale-[1.02] transition-transform min-w-0 overflow-hidden">
                    <UserCard 
                      user={otherUser} 
                      currentUserId={effectiveUser?.id}
                      isCurrentUser={otherUser.id === effectiveUser?.id}
                      compatibilityData={compatibilityData?.find((match: any) => match.userId === otherUser.id)}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                  {filters.location || filters.search || activeFilter !== "all" ? (
                    <>No users found matching your current filters. Try adjusting your search criteria.</>
                  ) : (
                    <>No users available to discover right now.</>
                  )}
                </div>
              )}
            </div>

            {/* Load More Button */}
            {filteredUsers.length > 8 && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => {
                    setShowAllUsers(!showAllUsers);
                    if (!showAllUsers) {
                      // Scroll to top when showing all users
                      setTimeout(() => {
                        const discoverSection = document.querySelector('[data-testid="discover-people-section"]');
                        if (discoverSection) {
                          discoverSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }, 100);
                    }
                  }}
                  className="bg-gray-50 hover:bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white dark:border-gray-500"
                  data-testid="button-load-more-users"
                >
                  {showAllUsers ? 'Load Less' : `Load More (${filteredUsers.length - 8} more)`}
                </Button>
              </div>
            )}
            
            </div>
            {/* End Glass Morphism Content Panel */}

            {/* Local Events Section - UNDER Discover People */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm" data-testid="local-events-section">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Calendar className="w-6 h-6 mr-3 text-blue-500" />
                    Local Events
                  </h2>
                </div>
                
                {/* Quick Meetup Widget - "Let's Meet Now" - MOVED HERE for better visibility - HIDE FOR BUSINESS USERS */}
                {loadedSections.has('quickMeets') && effectiveUser?.userType !== 'business' && (
                  <div className="mb-8">
                    <QuickMeetupWidget currentUser={effectiveUser} />
                  </div>
                )}
                
                {/* User-Created Events */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-green-500" />
                    Created by Community Members
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {userPriorityEvents
                      ?.filter((event: any) => !event.isAIGenerated && !event.source && event.organizerId)
                      ?.slice(0, 4)
                      ?.map((event: any) => (
                        <EventCard 
                          key={event.id}
                          event={event} 
                          currentUser={effectiveUser}
                        />
                      )) || (
                        <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No community events yet. Be the first to create one!</p>
                        </div>
                      )}
                  </div>
                </div>

                {/* API-Pulled Events */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-blue-500" />
                    Local Area Events
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {userPriorityEvents
                      ?.filter((event: any) => event.source && !event.isAIGenerated)
                      ?.slice(0, 4)
                      ?.map((event: any) => (
                        <EventCard 
                          key={event.id}
                          event={event} 
                          currentUser={effectiveUser}
                        />
                      )) || (
                        <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                          <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No local area events found at the moment.</p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Local Businesses Section */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm" data-testid="local-businesses-section">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Package className="w-6 h-6 mr-3 text-orange-500" />
                    Local Businesses
                  </h2>
                </div>
                <BusinessesGrid 
                  currentLocation={
                    effectiveUser?.hometownCity ? {
                      city: effectiveUser.hometownCity,
                      state: effectiveUser.hometownState || '',
                      country: effectiveUser.hometownCountry || 'USA'
                    } : null
                  }
                  travelPlans={effectiveUser?.userType !== 'business' ? travelPlans : []}
                />
              </div>
            </Card>
          </div>

          {/* Right Sidebar - Weather, Messages, Quick Meetups, Events */}
          <div className="col-span-1 space-y-6 sm:space-y-8 md:space-y-10">
            
            {/* Weather Widget */}
            {loadedSections.has('weather') && (
              <div className="relative">
                <CurrentLocationWeatherWidget currentUser={effectiveUser} />
              </div>
            )}
            
            {/* Messages Widget */}
            {loadedSections.has('messages') && (
              <div className="relative pt-2">
                <div className="absolute -top-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
                <MessagesWidget userId={currentUserId} />
              </div>
            )}
            
            {/* Quick Meetup Widget moved to Local Events section for better discoverability */}

            {/* Business Deals Section - REMOVED: Focusing on travelers and locals */}
          </div>
        </div>

        </div>
        {/* End of main content */}
      </main>
      
      {/* Connect and Destination Modals */}
      <DestinationModal 
        isOpen={showDestinationModal}
        onClose={() => setShowDestinationModal(false)}
        onSelect={handleDestinationSelected}
      />

      <ConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        userId={connectTargetUser?.id}
        defaultLocationMode={connectModalMode}
      />
    </div>
  );
}
