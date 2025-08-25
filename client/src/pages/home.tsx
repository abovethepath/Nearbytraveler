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
import { Globe, Users, MapPin, Briefcase, Calendar, Filter, X, ChevronDown, ChevronRight, MessageCircle, Camera, Search, Store, Hash, Tag, AlertCircle, ArrowUpDown, Clock, Zap, Star, Coffee } from "lucide-react";
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
import CurrentLocationWeatherWidget from "@/components/CurrentLocationWeatherWidget";
import EnhancedDiscovery from "@/components/EnhancedDiscovery";

import BusinessesGrid from "@/components/BusinessesGrid";
import { QuickMeetupWidget } from "@/components/QuickMeetupWidget";
import QuickDealsDiscovery from "@/components/QuickDealsDiscovery";
import CityMap from "@/components/CityMap";
import PeopleDiscoveryWidget from "@/components/PeopleDiscoveryWidget";


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

  // Function to sort users based on selected sorting option
  const getSortedUsers = (users: any[]) => {
    if (!users) return [];

    return [...users].sort((a, b) => {
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

  const { user, setUser } = useContext(AuthContext);
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();

  // Helper function to get current user location for widgets
  const getCurrentUserLocation = () => {
    // If user context is not loaded yet, try to get from currentUserProfile or localStorage
    const effectiveUser = user || currentUserProfile || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('travelconnect_user') || '{}') : null);

    // First check if user is currently traveling
    if (effectiveUser?.isCurrentlyTraveling && effectiveUser?.travelDestination) {
      return effectiveUser.travelDestination;
    }

    // Then check if user has a full hometown location
    if (effectiveUser?.hometownCity && effectiveUser?.hometownState && effectiveUser?.hometownCountry) {
      return `${effectiveUser.hometownCity}, ${effectiveUser.hometownState}, ${effectiveUser.hometownCountry}`;
    }

    // Fallback to just the hometown city
    if (effectiveUser?.hometownCity) {
      return effectiveUser.hometownCity;
    }

    // Final fallback to location field
    return effectiveUser?.location || 'Unknown';
  };

  // Use static hero image to prevent caching issues - try URL encoding for space
  const staticHeroImage = '/travelers%20coffee_1750995178947.png';

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

  // Check for URL parameter to auto-open advanced filters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('filters') === 'open') {
      setShowAdvancedFilters(true);
      // Scroll to filters section after a brief delay
      setTimeout(() => {
        if (filtersRef.current) {
          filtersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      // Clean up URL without refreshing page
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Helper function to handle filter closing with return navigation
  const handleCloseFilters = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('return');
    
    if (returnUrl) {
      // Navigate back to the return URL
      setLocation(returnUrl);
    } else {
      // Just close filters normally
      setShowAdvancedFilters(false);
    }
  };

  // Auto-populate filters with user's preferences when advanced filters open
  useEffect(() => {
    if (showAdvancedFilters && user) {
      setFilters(prev => ({
        ...prev,
        interests: user.interests || [],
        activities: user.localActivities || [],
        events: user.localEvents || []
      }));
    }
  }, [showAdvancedFilters, user]);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const filtersRef = useRef<HTMLDivElement>(null);

  // Close filters when clicking outside - enhanced version to prevent closing on scroll
  useEffect(() => {
    let isScrolling = false;
    let isDragging = false;
    let scrollTimer: NodeJS.Timeout;

    const handleScroll = () => {
      isScrolling = true;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        isScrolling = false;
      }, 150);
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (event.buttons > 0) {
        isDragging = true;
        setTimeout(() => {
          isDragging = false;
        }, 100);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if currently scrolling or dragging
      if (isScrolling || isDragging) return;

      // Check if the click target is within the filters panel
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        // Additional checks to prevent closing on scroll-related interactions
        const target = event.target as HTMLElement;

        // Don't close if clicking on scrollbars, scroll areas, or within the filters
        if (target && (
          target.closest('[data-radix-scroll-area-viewport]') ||
          target.closest('.overflow-y-auto') ||
          target.closest('.overflow-auto') ||
          target.classList.contains('scrollbar-thumb') ||
          target.classList.contains('scrollbar-track') ||
          target.closest('.bg-gray-50') || // The filters card background
          target.tagName === 'HTML' || // Clicking on page scroll area
          target.tagName === 'BODY'   // Clicking on page scroll area
        )) {
          return;
        }

        // Only close if it's a genuine click outside the component
        handleCloseFilters();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseFilters();
      }
    };

    if (showAdvancedFilters) {
      // Use capture phase to catch scroll events early
      document.addEventListener('scroll', handleScroll, { capture: true, passive: true });
      window.addEventListener('scroll', handleScroll, { passive: true });
      document.addEventListener('wheel', handleScroll, { passive: true });
      document.addEventListener('touchmove', handleScroll, { passive: true });
      document.addEventListener('mousemove', handleMouseMove, { passive: true });

      // Delay adding click listener to avoid immediate closure
      const clickTimer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      // Also listen for scroll events on the filters panel itself
      if (filtersRef.current) {
        filtersRef.current.addEventListener('scroll', handleScroll, { passive: true });
      }

      document.addEventListener('keydown', handleEscapeKey);

      return () => {
        clearTimeout(clickTimer);
        clearTimeout(scrollTimer);
        document.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('wheel', handleScroll);
        document.removeEventListener('touchmove', handleScroll);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);

        if (filtersRef.current) {
          filtersRef.current.removeEventListener('scroll', handleScroll);
        }
      };
    }

    // Return cleanup function for the case where showAdvancedFilters is false
    return () => {};
  }, [showAdvancedFilters]);





  // Scroll to top when home page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Get user ID from context or localStorage
  const getUserId = () => {
    if (user?.id) return user.id;
    try {
      const storedUser = localStorage.getItem('travelconnect_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        return parsedUser?.id;
      }
    } catch {
      return null;
    }
    return null;
  };

  const currentUserId = getUserId();

  // Fetch current user's complete profile data
  const { data: currentUserProfile, isLoading: isLoadingUserProfile } = useQuery<User>({
    queryKey: [`/api/users/${currentUserId}`],
    enabled: !!currentUserId,
  });

  // Fetch travel plans for the current user
  const { data: travelPlans = [], isLoading: isLoadingTravelPlans } = useQuery<any[]>({
    queryKey: [`/api/travel-plans/${currentUserId}`],
    enabled: !!currentUserId,
  });

  // Get current user ID for matched users query (use the same ID)
  const matchedUsersUserId = currentUserId;

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

  // Get effective user for filtering (prioritize fresh API data)
  const effectiveUser = currentUserProfile || user || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('travelconnect_user') || '{}') : null);

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
    if (travelPlans && travelPlans.length > 0) {
      travelPlans.forEach(plan => {
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

    // Sort with member-created events first
    const sortedEvents = uniqueEvents.sort((a: any, b: any) => {
      // Prioritize member-created events (not AI-generated) first
      const aMemberCreated = !a.isAIGenerated;
      const bMemberCreated = !b.isAIGenerated;

      if (aMemberCreated && !bMemberCreated) return -1;
      if (!aMemberCreated && bMemberCreated) return 1;

      // Within same type, prioritize events created by current user
      const userCreatedA = a.organizerId === currentUserId;
      const userCreatedB = b.organizerId === currentUserId;

      if (userCreatedA && !userCreatedB) return -1;
      if (!userCreatedA && userCreatedB) return 1;

      // Then sort by date - earliest upcoming events first
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    console.log('Filtered events:', sortedEvents.length, 'upcoming events from ALL locations (member-created events prioritized, recurring deduplicated)');
    return sortedEvents;
  }, [allEvents, currentUserId]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages/${currentUserId}`],
    enabled: !!currentUserId,
  });

  // Fetch business offers from ALL locations (hometown + all travel destinations)
  const { data: allBusinessOffers = [], isLoading: businessOffersLoading } = useQuery<any[]>({
    queryKey: [`/api/business-offers/all-locations`, discoveryLocations.allCities.map(loc => loc.city)],
    queryFn: async () => {
      if (!discoveryLocations.allCities.length) return [];

      console.log('Fetching business offers from ALL locations:', discoveryLocations.allCities);

      // Fetch business offers from all cities in parallel
      const offerPromises = discoveryLocations.allCities.map(async (location) => {
        const cityName = location.city.split(',')[0].trim();
        console.log(`Fetching business offers for ${location.type}:`, cityName);

        try {
          const response = await fetch(`/api/business-deals?city=${encodeURIComponent(cityName)}`);
          if (!response.ok) throw new Error(`Failed to fetch business offers for ${cityName}`);
          const data = await response.json();
          console.log(`${location.type} Business Offers API response:`, data.length, 'offers for', cityName);
          return data.map((offer: any) => ({ ...offer, sourceLocation: location }));
        } catch (error) {
          console.error(`Error fetching business offers for ${cityName}:`, error);
          return [];
        }
      });

      const allOffersArrays = await Promise.all(offerPromises);
      const combined = allOffersArrays.flat();

      // Remove duplicates by offer ID
      const unique = combined.filter((offer, index, self) => 
        index === self.findIndex((o) => o.id === offer.id)
      );

      console.log('Combined business offers:', unique.length, 'offers from ALL', discoveryLocations.allCities.length, 'locations');
      return unique;
    },
    enabled: discoveryLocations.allCities.length > 0 && !!currentUserId && !isLoadingTravelPlans && !isLoadingUserProfile,
    staleTime: 0,
    gcTime: 0,
  });

  const businessOffers = allBusinessOffers;

  // businessOffersLoading is now defined in the query above

  // Fetch active quick meetups from ALL locations (hometown + all travel destinations)
  const { data: allMeetups = [], isLoading: meetupsLoading } = useQuery<any[]>({
    queryKey: [`/api/quick-meetups/all-locations`, discoveryLocations.allCities.map(loc => loc.city)],
    queryFn: async () => {
      if (!discoveryLocations.allCities.length) return [];

      console.log('Fetching active quick meetups from ALL locations:', discoveryLocations.allCities);

      // Fetch meetups from all cities in parallel
      const meetupPromises = discoveryLocations.allCities.map(async (location) => {
        const cityName = location.city.split(',')[0].trim();
        console.log(`Fetching quick meetups for ${location.type}:`, cityName);

        try {
          const response = await fetch(`/api/quick-meetups?city=${encodeURIComponent(cityName)}`);
          if (!response.ok) throw new Error(`Failed to fetch quick meetups for ${cityName}`);
          const data = await response.json();
          console.log(`${location.type} Quick Meetups API response:`, data.length, 'meetups for', cityName);
          return data.map((meetup: any) => ({ ...meetup, sourceLocation: location }));
        } catch (error) {
          console.error(`Error fetching quick meetups for ${cityName}:`, error);
          return [];
        }
      });

      const allMeetupsArrays = await Promise.all(meetupPromises);
      const combined = allMeetupsArrays.flat();

      // Remove duplicates by meetup ID
      const unique = combined.filter((meetup, index, self) => 
        index === self.findIndex((m) => m.id === meetup.id)
      );

      console.log('Combined meetups:', unique.length, 'meetups from ALL', discoveryLocations.allCities.length, 'locations');
      return unique;
    },
    enabled: discoveryLocations.allCities.length > 0 && !!currentUserId && !isLoadingTravelPlans && !isLoadingUserProfile,
    staleTime: 30 * 1000, // 30-second cache
    gcTime: 0,
  });

  const meetups = allMeetups;

  // Query users - prioritize specific location filter, otherwise show ALL users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users/discover-people", { location: filters.location }],
    queryFn: async () => {
      const searchLocation = filters.location;

      // If there's a specific location filter, use that
      if (searchLocation && searchLocation.trim() !== '') {
        console.log('Fetching users for specific location filter:', searchLocation);
        const response = await fetch(`/api/users/search-by-location?location=${encodeURIComponent(searchLocation)}`, {
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

{/* HERO — SCOPED, SAFE */}
<section
  className="
    hero-clean relative text-white overflow-hidden
    bg-cover bg-center bg-no-repeat
    min-h-[34svh] sm:min-h-[40vh] md:min-h-[36vh] xl:min-h-[32vh]
  "
  style={{ backgroundImage: "url('/travelers coffee_1750995178947.png')" }}
>
  {/* Readability overlay (non-interactive) */}
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/45 via-black/30 to-black/55"
  />

  <div className="relative w-full mx-auto py-4 sm:py-6">
    <div className="mx-auto px-4 max-w-screen-md text-center">
      <h1
        className="
          font-bold text-balance drop-shadow
          text-[clamp(1.35rem,6vw,2rem)] sm:text-[clamp(1.25rem,3.2vw,2rem)]
          leading-tight
        "
        style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
      >
        {effectiveUser?.userType === "business" ? (
          <>
            Connect Your <span className="text-orange-400">Business</span>{" "}
            with <span className="hero-blue">Travelers</span> &{" "}
            <span className="hero-blue">Locals</span>
          </>
        ) : (
          <>
            Connect with <span className="text-orange-400">Like-Minded</span>{" "}
            <span className="hero-blue">Travelers</span> &{" "}
            <span className="hero-blue">Locals</span>
          </>
        )}
      </h1>

      <p
        className="
          mt-3 sm:mt-2 mx-auto max-w-prose
          text-white/95
          text-[clamp(0.9rem,3.8vw,1rem)] sm:text-[clamp(0.8rem,2vw,1rem)]
          leading-snug whitespace-normal break-words [overflow-wrap:anywhere]
        "
        style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.7)" }}
      >
        {effectiveUser?.userType === "business"
          ? "Reach customers through interest-based matching, business notifications, and location-targeted discovery."
          : "Discover amazing experiences & make meaningful connections based on demographics, activities, interests, and events."}
      </p>

      {effectiveUser?.userType === "business" && (
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 justify-center px-4 sm:px-0">
          <Button
            size="sm"
            className="
              bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600
              text-black px-3 py-1.5 text-xs sm:text-sm w-full sm:w-auto shadow-lg border-none
            "
            onClick={() => setLocation("/business-dashboard")}
          >
            <Store className="w-3 h-3 mr-1" />
            Manage Business
          </Button>
          <Button
            size="sm"
            className="
              bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600
              text-black px-3 py-1.5 text-xs sm:text-sm w-full sm:w-auto shadow-lg border-none
            "
            onClick={() => {
              setConnectModalMode("current");
              setShowConnectModal(true);
            }}
          >
            <Users className="w-3 h-3 mr-1" />
            Find Customers
          </Button>
        </div>
      )}
    </div>
  </div>
</section>

      <main className="pt-2 sm:pt-4 pb-24 md:pb-8 lg:pb-4">
        <div className="w-full max-w-full px-2 sm:px-4 lg:px-6">



        {/* Advanced Filters Modal - Clean modal approach */}
        {showAdvancedFilters && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
            <Card className="w-[min(100vw-1.5rem,56rem)] max-h-[85svh] overflow-y-auto p-4 sm:p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-800">
              <Card className="p-4 sm:p-6 mx-0 sm:mx-0 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg">
                {/* Header with Search Now CTA and Close Button */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <Filter className="w-4 sm:w-5 h-4 sm:h-5 mr-1 sm:mr-2" />
                    Advanced Filters
                  </h3>
                  <div className="flex items-center gap-2">
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
                      data-testid="button-clear-all-filters-advanced"
                    >
                      <X className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Clear All Filters</span>
                      <span className="sm:hidden">Clear All</span>
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600"
                      size="sm"
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCloseFilters}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Keyword Search */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Keyword Search</label>
                  <input
                    type="text"
                    placeholder="Search by name, bio, interests, activities..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Location Search */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Location Search</label>
                  <SmartLocationInput
                    city={locationFilter.city}
                    state={locationFilter.state}
                    country={locationFilter.country}
                    onLocationChange={(location) => {
                      console.log('🔍 Advanced Search: Location changed:', location);
                      setLocationFilter(location);
                      const fullLocation = `${location.city}${location.state ? `, ${location.state}` : ""}, ${location.country}`;
                      setFilters({...filters, location: fullLocation});
                      console.log('🔍 Advanced Search: Filters updated:', {...filters, location: fullLocation});
                    }}
                    required={false}
                    placeholder={{
                      country: "Select country to search",
                      state: "Select state/region",
                      city: "Select city to search"
                    }}
                  />
                </div>

                {/* Date Range Search */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Travel Date Range</label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">From Date</label>
                      <input
                        type="date"
                        max="9999-12-31"
                        value={filters.startDate || ''}
                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">To Date</label>
                      <input
                        type="date"
                        max="9999-12-31"
                        value={filters.endDate || ''}
                        onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Collapsible Advanced Filters */}
                <div className="space-y-3 mb-4">
                  {/* Gender Filter Section */}
                  <Collapsible open={expandedSections.gender} onOpenChange={() => toggleSection('gender')}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender Filter</span>
                        <div className="flex items-center gap-2">
                          {filters.gender.length > 0 && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                              {filters.gender.length}
                            </Badge>
                          )}
                          {expandedSections.gender ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <div className="flex flex-wrap gap-2">
                        {GENDER_OPTIONS.map((gender) => (
                          <button
                            key={gender}
                            onClick={() => {
                              if (filters.gender.includes(gender)) {
                                setFilters({...filters, gender: filters.gender.filter(g => g !== gender)});
                              } else {
                                setFilters({...filters, gender: [...filters.gender, gender]});
                              }
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                              filters.gender.includes(gender)
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {gender}
                          </button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Sexual Preference Filter Section */}
                  <Collapsible open={expandedSections.sexualPreference} onOpenChange={() => toggleSection('sexualPreference')}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sexual Preference Filter</span>
                        <div className="flex items-center gap-2">
                          {filters.sexualPreference.length > 0 && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                              {filters.sexualPreference.length}
                            </Badge>
                          )}
                          {expandedSections.sexualPreference ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <div className="flex flex-wrap gap-2">
                        {SEXUAL_PREFERENCE_OPTIONS.map((preference) => (
                          <button
                            key={preference}
                            onClick={() => {
                              if (filters.sexualPreference.includes(preference)) {
                                setFilters({...filters, sexualPreference: filters.sexualPreference.filter(p => p !== preference)});
                              } else {
                                setFilters({...filters, sexualPreference: [...filters.sexualPreference, preference]});
                              }
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                              filters.sexualPreference.includes(preference)
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {preference}
                          </button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* User Type Filter Section */}
                  <Collapsible open={expandedSections.userType} onOpenChange={() => toggleSection('userType')}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">User Type Filter</span>
                        <div className="flex items-center gap-2">
                          {filters.userType.length > 0 && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                              {filters.userType.length}
                            </Badge>
                          )}
                          {expandedSections.userType ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
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
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                              filters.userType.includes(type)
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Age Range Filter Section */}
                  <Collapsible open={expandedSections.ageRange} onOpenChange={() => toggleSection('ageRange')}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Age Range Filter</span>
                        <div className="flex items-center gap-2">
                          {(filters.minAge || filters.maxAge) && (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                              {filters.minAge || '?'}-{filters.maxAge || '?'}
                            </Badge>
                          )}
                          {expandedSections.ageRange ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          type="number" 
                          placeholder="Min Age"
                          value={filters.minAge}
                          onChange={(e) => setFilters({...filters, minAge: e.target.value})}
                          className="w-full text-sm px-3 py-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        />
                        <Input 
                          type="number" 
                          placeholder="Max Age"
                          value={filters.maxAge}
                          onChange={(e) => setFilters({...filters, maxAge: e.target.value})}
                          className="w-full text-sm px-3 py-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Traveler Type Filter Section */}
                  <Collapsible open={expandedSections.travelerType} onOpenChange={() => toggleSection('travelerType')}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Traveler Type Filter</span>
                        <div className="flex items-center gap-2">
                          {filters.travelerTypes.length > 0 && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                              {filters.travelerTypes.length}
                            </Badge>
                          )}
                          {expandedSections.travelerType ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <div className="flex flex-wrap gap-2">
                        {BASE_TRAVELER_TYPES.map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              if (filters.travelerTypes.includes(type)) {
                                setFilters({...filters, travelerTypes: filters.travelerTypes.filter(t => t !== type)});
                              } else {
                                setFilters({...filters, travelerTypes: [...filters.travelerTypes, type]});
                              }
                            }}
                            className={`px-3 py-2 rounded-full text-xs md:text-sm font-medium transition-colors ${
                              filters.travelerTypes.includes(type)
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* Location Filter */}
                <div className="mb-4 hidden">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Location</label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Search by city or location"
                      value={filters.location}
                      onChange={(e) => setFilters({...filters, location: e.target.value})}
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    />
                    <Select 
                      value={filters.location} 
                      onValueChange={(value) => setFilters({...filters, location: value === "custom" ? "" : value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Or select from your destinations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Type custom location</SelectItem>
                        {effectiveUser?.hometown && (
                          <SelectItem value={effectiveUser.hometown}>
                            🏠 {effectiveUser.hometown} (Hometown)
                          </SelectItem>
                        )}
                        {effectiveUser?.location && effectiveUser.location !== effectiveUser.hometown && (
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

              {/* Sort By Dropdown - Desktop Only */}
              {isDesktop && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 rounded-xl"
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
                    Most Travel Aura
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('references')}>
                    <Users className="w-4 h-4 mr-2" />
                    Most References
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('alphabetical')}>
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    Alphabetical
                  </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {(usersLoading || (activeFilter === "best-matches" && matchedUsersLoading)) ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg">
                      <div className="flex space-x-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg w-1/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {/* Mobile grid: 2 cols on very small, 3 cols at ≥640px; desktop uses widget below */}
                <div className="sm:hidden">
                  <div className="grid grid-cols-2 gap-3">
                    {getSortedUsers(filteredUsers).slice(0, displayLimit).map((u: any) => (
                      <button
                        key={u.id}
                        onClick={() => setLocation(`/profile/${u.id}`)}
                        className="group text-left rounded-xl border bg-white dark:bg-gray-800 p-2 hover:shadow-sm"
                      >
                        <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-gray-100">
                          {u.profileImage ? (
                            <img
                              src={u.profileImage}
                              alt={u.username}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                // Replace with colorful avatar if image fails to load
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          {/* Colorful fallback avatar with profile completion reminder */}
                          <div className={`${u.profileImage ? 'hidden' : ''} h-full w-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center relative group cursor-help`}>
                            <span className="text-white font-bold text-lg">{u.username?.charAt(0)?.toUpperCase() || 'U'}</span>
                            {/* Tooltip */}
                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                              Upload a photo!
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 min-w-0">
                          <div className="text-sm font-semibold truncate text-gray-900 dark:text-white">
                            @{u.username}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {u.hometownCity && u.hometownCountry
                              ? `${u.hometownCity}, ${u.hometownCountry.replace("United States", "USA")}`
                              : u.location || "New member"}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {(() => {
                  const people = getSortedUsers(filteredUsers).slice(0, displayLimit);
                  
                  return (
                    <>
                      {/* Tablets only (≥640px and <1024px): keep your widget here */}
                      <div className="hidden sm:block lg:hidden">
                        <PeopleDiscoveryWidget
                          people={people.map((user: any) => {
                            return {
                              id: user.id,
                              username: user.username,
                              name: user.username,
                              profileImage: user.profileImage,
                              location: user.hometownCity && user.hometownCountry ? `${user.hometownCity}, ${user.hometownCountry.replace("United States","USA")}` : user.location || "Location not set",
                              distance: user.hometownCity && user.hometownState ? `${user.hometownCity}, ${user.hometownState}` : user.location || "New member",
                              commonInterests: [],
                              userType: user.userType as "traveler" | "local" | "business",
                            };
                          })}
                          title="Nearby Travelers"
                          showSeeAll={false}
                          currentUserId={effectiveUser?.id || currentUserProfile?.id || user?.id}
                        />
                      </div>

                      {/* Desktop (≥1024px): force 4 across (5 on very wide) */}
                      <div className="hidden lg:grid grid-cols-4 xl:grid-cols-5 gap-4">
                        {people.map((u: any) => (
                          <button
                            key={u.id}
                            onClick={() => setLocation(`/profile/${u.id}`)}
                            className="group text-left rounded-xl border bg-white dark:bg-gray-800 p-3 hover:shadow-sm"
                          >
                            <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-gray-100">
                              {u.profileImage ? (
                                <img 
                                  src={u.profileImage} 
                                  alt={u.username} 
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              {/* Colorful fallback avatar */}
                              <div className={`${u.profileImage ? 'hidden' : ''} h-full w-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center relative group cursor-help`}>
                                <span className="text-white font-bold text-xl">{u.username?.charAt(0)?.toUpperCase() || 'U'}</span>
                                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                  Add profile photo!
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 min-w-0">
                              <div className="text-sm font-semibold truncate text-gray-900 dark:text-white">@{u.username}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {u.hometownCity && u.hometownCountry ? `${u.hometownCity}, ${u.hometownCountry.replace("United States","USA")}` : u.location || "New member"}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  );
                })()}

                {/* Load More Button */}
                {getSortedUsers(filteredUsers).length > displayLimit && (
                  <div className="text-center mt-6">
                    <Button 
                      onClick={() => setDisplayLimit(prev => prev + 12)}
                      variant="outline"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-2xl"
                    >
                      Load More ({getSortedUsers(filteredUsers).length - displayLimit} remaining)
                    </Button>
                  </div>
                )}

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    {activeFilter === "travel-dates" ? (
                      <div>
                        <p className="text-gray-500 mb-2">No travel connections found for {user?.travelDestination}</p>
                        <p className="text-sm text-gray-400">
                          Try adjusting your travel dates or check back later for new travelers
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500">No users found for the selected filter.</p>
                    )}
                  </div>
                )}

                {/* Load Less Button */}
                {displayLimit > 8 && (
                  <div className="text-center mt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDisplayLimit(6);
                        // Scroll to top of Discover People section
                        const discoverSection = document.querySelector('[data-testid="discover-people-section"]');
                        if (discoverSection) {
                          discoverSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="bg-gray-50 hover:bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white dark:border-gray-500"
                    >
                      Load Less
                    </Button>
                  </div>
                )}
              </div>
            )}


            {/* Local Events Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  Local Events
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="bg-gradient-to-r from-purple-500 to-orange-500 text-white hover:from-purple-600 hover:to-orange-600 rounded-xl shadow-lg"
                  onClick={() => setLocation('/events')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </div>



              {eventsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-100 h-48 rounded-lg" />
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <Calendar className="w-10 sm:w-12 h-10 sm:h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-gray-500 mb-2">No events found in your area</p>
                  <p className="text-xs sm:text-sm text-gray-400">Check back later for new events</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {events.slice(0, eventsDisplayCount).map((event) => (
                    <article 
                      key={event.id} 
                      className="event-card relative overflow-hidden rounded-2xl bg-gray-800/40 shadow-sm text-left-important hover:shadow-lg cursor-pointer"
                      onClick={() => setLocation(`/events/${event.id}`)}
                    >
                      {/* Image (no overlay needed) */}
                      <div className="relative">
                        <img 
                          src={event.imageUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop'} 
                          alt={event.title} 
                          className="w-full aspect-[16/9] object-cover" 
                          loading="lazy" 
                        />
                      </div>

                      {/* Pills live in normal flow (hotfix enforces non-absolute) */}
                      <div className="pills px-4 pt-3 flex flex-wrap gap-2">
                        {event.category && <span className="chip bg-gray-900/80 text-white">{event.category}</span>}
                        {(event as any).participantCount && (
                          <span className="chip bg-purple-600 text-white">{(event as any).participantCount} attending</span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 md:p-5">
                        <h3 className="text-white text-base md:text-lg font-semibold leading-snug line-clamp-2">{event.title}</h3>
                        {event.description && <p className="mt-1 text-sm text-gray-300 leading-relaxed wrap-any">{event.description}</p>}

                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                          {event.location && (
                            <div className="minw0 flex items-center gap-2 text-sm text-gray-300">
                              <MapPin className="h-4 w-4 shrink-0" />
                              <span className="wrap-any whitespace-normal">{event.location}</span>
                            </div>
                          )}
                          {event.date && (
                            <div className="minw0 flex items-center gap-2 text-sm text-gray-300">
                              <Calendar className="h-4 w-4 shrink-0" />
                              <span className="wrap-any whitespace-normal">
                                {(() => {
                                  const eventDate = new Date(event.date);
                                  const currentYear = new Date().getFullYear();
                                  const eventYear = eventDate.getFullYear();
                                  const dateStr = eventDate.toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: eventYear !== currentYear ? 'numeric' : undefined
                                  });
                                  const timeStr = eventDate.toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  });
                                  return `${dateStr} at ${timeStr}`;
                                })()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Load More / Load Less buttons for Events */}
              {!eventsLoading && events.length > 3 && (
                <div className="text-center pt-4 space-x-3">
                  {eventsDisplayCount < events.length && (
                    <Button
                      variant="outline"
                      onClick={() => setEventsDisplayCount(Math.min(eventsDisplayCount + 6, events.length))}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 hover:border-purple-300 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-200 dark:border-purple-700"
                    >
                      Load More ({Math.min(6, events.length - eventsDisplayCount)} more events)
                    </Button>
                  )}
                  {eventsDisplayCount > 3 && (
                    <Button
                      variant="outline"
                      onClick={() => setEventsDisplayCount(3)}
                      className="bg-gray-50 hover:bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white dark:border-gray-500"
                    >
                      Load Less
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Quick Meetups Section - Only show for non-business users */}
            {user?.userType !== 'business' && effectiveUser?.userType !== 'business' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Ready to Meet
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={() => setLocation('/quick-meetups')}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    View All
                  </Button>
                </div>

                {/* Quick Meetup Widget - Simplified on Mobile */}
                {isMobile ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">Quick Meetups</h3>
                      <Button size="sm" variant="ghost" onClick={() => setLocation('/quick-meetups')}>
                        View All
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Find spontaneous meetups nearby</p>
                  </div>
                ) : (
                  <QuickMeetupWidget />
                )}
              </div>
            )}

            {/* Quick Deals Section - Flash Deals with Timers */}
            <div className="space-y-6">
              <QuickDealsDiscovery 
                userLocation={{
                  city: effectiveUser?.hometownCity || "",
                  state: effectiveUser?.hometownState || "",
                  country: effectiveUser?.hometownCountry || "United States"
                }}
              />
            </div>

            {/* Discover Businesses Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  Local Businesses
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="bg-gradient-to-r from-green-500 to-orange-500 text-white hover:from-green-600 hover:to-orange-600 rounded-xl shadow-lg"
                  onClick={() => setLocation('/deals')}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </div>

              {/* Business Grid - Simplified on Mobile */}
              {isMobile ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">Local Deals</h3>
                    <Button size="sm" variant="ghost" onClick={() => setLocation('/deals')}>
                      <Briefcase className="w-4 h-4 mr-1" />
                      View All
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Discover local business offers and deals</p>
                  <Button 
                    className="w-full text-sm bg-gradient-to-r from-green-500 to-orange-500 text-white hover:from-green-600 hover:to-orange-600"
                    onClick={() => setLocation('/deals')}
                  >
                    Browse Local Deals
                  </Button>
                </div>
              ) : (
                <BusinessesGrid 
                  currentLocation={{
                    city: effectiveUser?.hometownCity || "",
                    state: effectiveUser?.hometownState || "",
                    country: effectiveUser?.hometownCountry || "United States"
                  }}
                  travelPlans={travelPlans}
                />
              )}
            </div>

            {/* Load More / Load Less buttons for Businesses */}
            {businessesDisplayCount > 3 && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setBusinessesDisplayCount(3)}
                  className="bg-gray-50 hover:bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white dark:border-gray-500"
                >
                  Load Less
                </Button>
              </div>
            )}
          </div>

          {/* Right Sidebar - Widgets - Simplified on Mobile */}
          <div className="col-span-1 lg:col-span-1 space-y-3 sm:space-y-6 min-w-0">
            {/* Weather Widget - Desktop Only */}
            {isDesktop && (
              <div>
                <CurrentLocationWeatherWidget />
              </div>
            )}

            {/* Messages Widget - Always Show */}
            <div>
              <MessagesWidget userId={currentUserId} />
            </div>

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