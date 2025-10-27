import React, { useState, useContext, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AuthContext } from "@/App";
import { useIsMobile, useIsDesktop } from "@/hooks/useDeviceType";
import UserCard from "@/components/user-card";
import EventCard from "@/components/event-card";
import MessagePreview from "@/components/message-preview";
import DestinationModal from "@/components/destination-modal";
import ConnectModal from "@/components/connect-modal";
import { AdvancedSearchWidget } from "@/components/AdvancedSearchWidget";
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
import { Globe, Users, MapPin, Briefcase, Calendar, Filter, X, ChevronDown, ChevronRight, MessageCircle, Camera, Search, Store, Hash, Tag, AlertCircle, ArrowUpDown, Clock, Zap, Star, Coffee, Phone, Plane, Sparkles } from "lucide-react";
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
  const [showAdvancedSearchWidget, setShowAdvancedSearchWidget] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'active' | 'compatibility' | 'travel_experience' | 'closest_nearby' | 'aura' | 'references' | 'alphabetical'>('recent');
  
  // Load all sections immediately to prevent layout shift
  const [loadedSections, setLoadedSections] = useState<Set<string>>(
    new Set(['hero', 'users', 'events', 'messages', 'weather', 'meetups'])
  );
  const [activeSection, setActiveSection] = useState<string>('hero');

  const { user, setUser } = useContext(AuthContext);

  // **OPTIMIZED**: Stable user ID calculation
  const currentUserId = useMemo(() => {
    return user?.id || JSON.parse(localStorage.getItem('travelconnect_user') || '{}')?.id;
  }, [user?.id]);

  // **OPTIMIZED**: Single user data fetch with longer stale time
  const { data: currentUserProfile, isLoading: isLoadingCurrentUser } = useQuery<User>({
    queryKey: [`/api/users/${currentUserId}`],
    enabled: !!currentUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent excessive refetching
    refetchOnWindowFocus: false, // Prevent refetch on focus changes
  });

  // **OPTIMIZED**: Travel plans with longer stale time
  const { data: travelPlans = [], isLoading: isLoadingTravelPlans } = useQuery({
    queryKey: [`/api/travel-plans/${currentUserId}`],
    enabled: !!currentUserId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // **OPTIMIZED**: Simplified effective user with minimal dependencies
  const effectiveUser = useMemo(() => {
    console.log('Discovery memo - currentUserId:', currentUserId);
    
    if (!currentUserId) {
      return null;
    }
    
    // Get the best available user data
    const userData = currentUserProfile || user || JSON.parse(localStorage.getItem('travelconnect_user') || 'null');
    
    if (!userData?.id) {
      return null;
    }

    // **SIMPLIFIED**: Only calculate what we need
    const currentTravelDestination = getCurrentTravelDestination(travelPlans || []);
    const isCurrentlyTraveling = !!currentTravelDestination;
    
    return {
      ...userData,
      isCurrentlyTraveling,
      travelDestination: currentTravelDestination,
    };
  }, [currentUserId, currentUserProfile?.id, travelPlans?.length]); // Minimal dependencies

  // **OPTIMIZED**: Discovery data with debounced loading
  const [allUserLocations, setAllUserLocations] = useState<any[]>([]);
  
  // Build all user locations for discovery
  const discoveryLocations = useMemo(() => {
    console.log('Discovery memo - currentUserId:', currentUserId);
    
    const locations = [];
    
    if (!effectiveUser) return locations;
    
    // Add hometown
    const hometown = [effectiveUser.hometownCity, effectiveUser.hometownState, effectiveUser.hometownCountry]
      .filter(Boolean).join(', ');
    if (hometown) {
      console.log('🏠 USER DISCOVERY: Hometown', hometown);
      locations.push({
        city: hometown,
        type: 'hometown'
      });
    }
    
    // Add current travel destination
    const currentTravelDestination = getCurrentTravelDestination(travelPlans || []);
    if (currentTravelDestination) {
      console.log('✈️ USER DISCOVERY: Current travel', currentTravelDestination);
      locations.push({
        city: currentTravelDestination,
        type: 'current_travel'
      });
    }
    
    // Add all travel plans
    if (Array.isArray(travelPlans)) {
      travelPlans.forEach(plan => {
        console.log('📅 USER DISCOVERY: Travel plan', plan.destination);
        locations.push({
          city: plan.destination,
          type: 'planned_travel'
        });
      });
    }
    
    console.log('Discovery - All locations:', locations);
    return locations;
  }, [effectiveUser?.id, effectiveUser?.hometownCity, travelPlans?.length]);

  // **OPTIMIZED**: Lazy load heavy components
  const LazyUsersSection = React.lazy(() => import('@/components/LazyUsersSection'));
  const LazyEventsSection = React.lazy(() => import('@/components/LazyEventsSection'));

  // Get hero image with caching
  const heroImageSrc = useMemo(() => {
    console.log('🖼️ Home Hero: Using static image:', staticHeroImage);
    return staticHeroImage;
  }, []);

  // **OPTIMIZED**: Simplified user lookup
  const getCurrentUser = () => {
    try {
      const storedUser = localStorage.getItem('travelconnect_user') || localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
      return null;
    }
  };

  const handleSectionView = (sectionName: string) => {
    setActiveSection(sectionName);
    setLoadedSections(prev => new Set([...prev, sectionName]));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        
        {/* **OPTIMIZED**: Static Hero Section */}
        <Card className="overflow-hidden bg-gradient-to-r from-blue-600 to-orange-500 text-white border-0">
          <div 
            className="relative min-h-[300px] bg-cover bg-center flex items-center justify-center"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          >
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="relative z-10 text-center max-w-2xl px-4">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Welcome to Nearby Traveler
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-6">
                Connect with fellow travelers and locals worldwide
              </p>
              
              {effectiveUser && (
                <div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
                  <p className="text-lg">
                    Welcome back, <span className="font-semibold">{effectiveUser.username}</span>!
                  </p>
                  {effectiveUser.isCurrentlyTraveling && effectiveUser.travelDestination && (
                    <p className="text-blue-100 mt-2">
                      Currently traveling in {effectiveUser.travelDestination}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* **OPTIMIZED**: Component Grid with Stable Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Weather Widget */}
          <div className="lg:col-span-1">
            <React.Suspense fallback={<div className="h-32 bg-gray-100 rounded-lg animate-pulse" />}>
              <CurrentLocationWeatherWidget />
            </React.Suspense>
          </div>
          
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setShowConnectModal(true)}
                  >
                    <Users className="w-5 h-5" />
                    <span className="text-xs">Find People</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setShowAdvancedSearchWidget(true)}
                  >
                    <Search className="w-5 h-5" />
                    <span className="text-xs">Advanced Search</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    <span className="text-xs">Events</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-xs">Messages</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* **OPTIMIZED**: Lazy Loaded Content Sections */}
        <div className="space-y-6">
          
          {/* Discovery Section */}
          <React.Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
            <EnhancedDiscovery locations={discoveryLocations} />
          </React.Suspense>
          
          {/* Messages Widget */}
          <React.Suspense fallback={<div className="h-48 bg-gray-100 rounded-lg animate-pulse" />}>
            <MessagesWidget />
          </React.Suspense>
          
          {/* Events Widget */}
          <React.Suspense fallback={<div className="h-48 bg-gray-100 rounded-lg animate-pulse" />}>
            <EventsWidget />
          </React.Suspense>
          
          {/* Quick Meetups */}
          <React.Suspense fallback={<div className="h-48 bg-gray-100 rounded-lg animate-pulse" />}>
            <QuickMeetupWidget />
          </React.Suspense>
        </div>

        {/* Modals */}
        <DestinationModal 
          isOpen={showDestinationModal} 
          onClose={() => setShowDestinationModal(false)} 
        />
        
        <ConnectModal 
          isOpen={showConnectModal} 
          onClose={() => setShowConnectModal(false)}
          mode={connectModalMode}
          targetUser={connectTargetUser}
        />
        
        <AdvancedSearchWidget 
          open={showAdvancedSearchWidget}
          onOpenChange={setShowAdvancedSearchWidget}
        />
      </div>
    </div>
  );
}