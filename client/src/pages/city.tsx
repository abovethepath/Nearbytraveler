import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAutoHideHero } from "@/hooks/useAutoHideHero";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, MapPin, Calendar, Filter, ArrowLeft, ArrowUpDown, ChevronDown, X, Clock, Globe, Star, Zap, Briefcase, Phone, Building2, ExternalLink } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import UserCard from "@/components/user-card";
import EventCard from "@/components/event-card";
import { SimpleAvatar } from "@/components/simple-avatar";

import WeatherWidget from "@/components/WeatherWidget";

import { CityChatlroomsWidget } from "@/components/CityChatlroomsWidget";
import { CityStatsWidget } from "@/components/CityStatsWidget";
import { CityMap } from "@/components/CityMap";
import { SecretExperiencesWidget } from "@/components/SecretExperiencesWidget";
import { AICityGuideWidget } from "@/components/AICityGuideWidget";
import { CityArrivalsWidget } from "@/components/CityArrivalsWidget";
import { CityLiveFeed } from "@/components/CityLiveFeed";
import { CityBulletinBoard } from "@/components/CityBulletinBoard";
import { LivePresenceWidget } from "@/components/LivePresenceWidget";
import { useAuth } from "@/App";
import { getApiBaseUrl } from "@/lib/queryClient";
import type { User, Event } from "@shared/schema";

// Removed all city images and photo gallery functions per user request

interface CityPageProps {
  cityName?: string;
}

export default function CityPage({ cityName }: CityPageProps) {
  const [location, setLocation] = useLocation();
  const [filter, setFilter] = useState("all");
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  
  const { isHeroVisible, toggleHeroVisibility, autoHidden, showHeroFromAutoHide } = useAutoHideHero('city');
  
  // Remove lazy loading - load all widgets immediately
  const loadedWidgets = new Set(['stats', 'secrets', 'tips', 'map']);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // Auth is session/cookie based; do not fall back to localStorage.
  const authContext = useAuth();
  const isActuallyAuthenticated = authContext.isAuthenticated;
  const currentUserId = authContext.user?.id;

  // Extract city name from URL if not provided as prop
  const urlCityName = cityName || (location.split('/')[2] ? decodeURIComponent(location.split('/')[2]) : '');
  const decodedCityName = urlCityName;
  
  // Debug logging
  console.log('🏙️ CityPage Debug:', { cityName, location, urlCityName, decodedCityName });
  
  // Parse city location data for weather widget
  const locationParts = decodedCityName.split(',').map(part => part.trim());
  const parsedCityName = locationParts[0] || '';
  const parsedStateName = locationParts[1] || '';
  const parsedCountryName = locationParts[2] || locationParts[1] || 'United States'; // Default to US if no country specified
  
  // Check if this is a Los Angeles area city for enhanced prominence
  const isLAArea = parsedCityName.toLowerCase().includes('los angeles') || 
                   parsedCityName.toLowerCase() === 'santa monica' ||
                   parsedCityName.toLowerCase() === 'venice' ||
                   parsedCityName.toLowerCase() === 'beverly hills' ||
                   parsedCityName.toLowerCase() === 'west hollywood' ||
                   parsedCityName.toLowerCase() === 'hollywood' ||
                   parsedCityName.toLowerCase() === 'santa monica' ||
                   decodedCityName.toLowerCase().includes('los angeles metro');
  
  // Removed flickering city photos functionality

  // Removed photo display functions per user request

  // Fetch available now user IDs for green badge
  const { data: availableNowIds = [] } = useQuery<number[]>({
    queryKey: ['/api/available-now/active-ids'],
    refetchInterval: 30000,
  });

  // Fetch city page info (official calendar URL)
  const { data: cityPageInfo } = useQuery<{ officialExternalCalendarUrl: string | null; officialExternalProvider: string | null }>({
    queryKey: ['/api/cities', parsedCityName, 'page-info'],
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/cities/${encodeURIComponent(parsedCityName)}/page-info`);
      if (!response.ok) return { officialExternalCalendarUrl: null, officialExternalProvider: null };
      return response.json();
    },
    enabled: !!parsedCityName,
  });

  // Fetch users for this city using metropolitan area consolidation
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/city', decodedCityName, 'users', filter, 'metro'],
    queryFn: async () => {
      const cityName = parsedCityName;
      const stateName = parsedStateName;
      const countryName = parsedCountryName;
      
      // Build query parameters for proper metro consolidation
      const params = new URLSearchParams();
      if (stateName) params.set('state', stateName);
      if (countryName) params.set('country', countryName);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`${getApiBaseUrl()}/api/city/${encodeURIComponent(cityName)}/users${queryString}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const allUsers = await response.json();
      
      // Return all users - filtering by city role happens in filteredUsers
      return allUsers;
    },
    enabled: !!decodedCityName,
  });

  // Fetch events for this city using events endpoint with city parameter
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/events', decodedCityName],
    queryFn: async () => {
      const cityName = parsedCityName;
      const stateName = parsedStateName;
      const countryName = parsedCountryName;
      
      // Build query parameters for proper metro consolidation
      const params = new URLSearchParams();
      params.set('city', cityName);
      if (stateName) params.set('state', stateName);
      if (countryName) params.set('country', countryName);
      
      // Add user ID for private event filtering
      const currentUser = JSON.parse(localStorage.getItem('travelconnect_user') || '{}');
      if (currentUser?.id) {
        params.set('userId', currentUser.id.toString());
      }
      
      const response = await fetch(`${getApiBaseUrl()}/api/events?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
    enabled: !!decodedCityName,
  });

  // Filter and sort users based on selected filter and sort option
  // CRITICAL FIX: Use city-specific roles instead of account type
  const filteredUsers = users
    .filter((user: any) => {
      // ALWAYS exclude businesses from people discovery section
      if (user.userType === "business") return false;
      
      if (filter === "all") return true;
      // Filter by relationship to THIS CITY, not account type
      if (filter === "travelers") return user.isTravelerToCity === true;
      if (filter === "locals") return user.isLocalToCity === true;
      return true;
    })
    .sort((a: User, b: User) => {
      switch (sortBy) {
        case 'closest_nearby':
          // Sort by location proximity - prioritize same city, then state, then country
          const currentUser = JSON.parse(localStorage.getItem('travelconnect_user') || '{}');
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
        
        case 'compatibility':
          // Sort by number of shared interests/activities
          const aShared = (a.interests?.length || 0) + (a.activities?.length || 0);
          const bShared = (b.interests?.length || 0) + (b.activities?.length || 0);
          return bShared - aShared;
        
        case 'recent':
          // Sort by creation date (most recent first)
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        
        case 'alphabetical':
          // Sort alphabetically by username
          return a.username.localeCompare(b.username);
        
        case 'travel_experience':
          // Sort by countries visited (most experienced first)
          const countriesA = a.countriesVisited ? a.countriesVisited.length : 0;
          const countriesB = b.countriesVisited ? b.countriesVisited.length : 0;
          return countriesB - countriesA;
        
        case 'aura':
          // Sort by travel aura (highest first)
          const auraA = a.aura || 0;
          const auraB = b.aura || 0;
          return auraB - auraA;
        
        case 'references':
          // Sort by number of references (most first)
          const referencesA = (a as any).references?.length || 0;
          const referencesB = (b as any).references?.length || 0;
          return referencesB - referencesA;
        
        case 'active':
          // Sort by last location update (most recent first)
          const lastUpdateA = new Date(a.lastLocationUpdate || 0).getTime();
          const lastUpdateB = new Date(b.lastLocationUpdate || 0).getTime();
          return lastUpdateB - lastUpdateA;
        
        default:
          // Default to most recent
          const defaultDateA = new Date(a.createdAt || 0).getTime();
          const defaultDateB = new Date(b.createdAt || 0).getTime();
          return defaultDateB - defaultDateA;
      }
    });

  // Paginate users - show top 3 for preview, 9 when expanded, all when fully expanded
  const displayedUsers = showAllUsers ? filteredUsers : filteredUsers.slice(0, 3);

  // Fetch connection degrees for displayed users (LinkedIn-style 1st/2nd/3rd degree)
  const displayedUserIds = React.useMemo(() => {
    return displayedUsers.map((u: any) => u.id);
  }, [displayedUsers]);

  const { data: connectionDegreesData } = useQuery<{ degrees: { [key: number]: { degree: number; mutualCount: number } } }>({
    queryKey: ['/api/connections/degrees/batch', currentUserId, displayedUserIds],
    queryFn: async () => {
      if (!currentUserId || displayedUserIds.length === 0) return { degrees: {} };
      const response = await fetch(`${getApiBaseUrl()}/api/connections/degrees/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, targetUserIds: displayedUserIds })
      });
      if (!response.ok) return { degrees: {} };
      return response.json();
    },
    enabled: !!(currentUserId && displayedUserIds.length > 0),
    staleTime: 5 * 60 * 1000,
  });

  const currentEvents = showAllEvents ? events : events.slice(0, 3);

  if (!decodedCityName) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">City not specified</p>
            <Button 
              onClick={() => setLocation('/discover')} 
              className="mt-4 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white"
            >
              Explore Cities
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (usersLoading || eventsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Loading {decodedCityName}...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      {/* Mobile-optimized Back Button */}
      <div className="px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLocation('/discover');
          }}
          className="inline-flex items-center gap-2 px-4 py-3 text-base font-medium text-gray-600 bg-white border border-gray-300 rounded-xl shadow-sm hover:text-gray-900 hover:bg-gray-50 focus:outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 min-h-[48px]"
          style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Cities
        </button>
      </div>
      
      {/* Show intro link when auto-hidden */}
      {!isHeroVisible && (
        <div className="mx-4 mt-2 mb-2">
          {autoHidden ? (
            <button
              onClick={showHeroFromAutoHide}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Show intro ›
            </button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleHeroVisibility}
              className="text-sm"
            >
              <ChevronDown className="w-4 h-4 mr-2" />
              Show City Header
            </Button>
          )}
        </div>
      )}

      {/* City Header - Standardized Layout */}
      {isHeroVisible && (
      <section className="relative py-4 sm:py-6 lg:py-10 overflow-hidden bg-white dark:bg-gray-900 mx-4 mt-2 mb-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="relative z-10 px-6 py-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              {isLAArea && (
                <Badge className="bg-orange-500 text-white text-xs mb-2">
                  Beta Launch City
                </Badge>
              )}
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                {decodedCityName}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-2 font-medium">
                Discover people, events, and businesses in {parsedCityName}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <MapPin className="w-5 h-5" />
                <span className="text-base">{parsedCityName}</span>
              </div>
              <button
                onClick={toggleHeroVisibility}
                className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 xl:col-span-3">
              {/* Live Presence — full width, top of main content */}
              <div className="mb-4">
                <LivePresenceWidget cityName={parsedCityName} country={parsedCountryName} />
              </div>

              {/* PEOPLE STRIP — horizontal scrolling avatar carousel */}
              {filteredUsers.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-orange-500" /> People in {decodedCityName}
                    </h3>
                    <button onClick={() => setLocation(`/city/${encodeURIComponent(parsedCityName)}`)} className="text-xs text-orange-500 hover:underline">
                      See all {filteredUsers.length}
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                    {filteredUsers.slice(0, 20).map((u: any) => (
                      <div key={u.id} className="flex-shrink-0 w-[72px] text-center cursor-pointer" onClick={() => setLocation(`/profile/${u.id}`)}>
                        <div className="relative mx-auto w-14 h-14 mb-1">
                          {u.profileImage ? (
                            <img src={u.profileImage} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-orange-300 dark:border-orange-600" loading="lazy" />
                          ) : (
                            <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-lg border-2 border-orange-300 dark:border-orange-600"
                                 style={{ backgroundColor: u.avatarColor || "#F97316" }}>
                              {(u.username || "?")[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate">@{u.username}</p>
                        <p className="text-[9px] text-gray-400 truncate">
                          {u.cityMatchType === "travel" ? "Traveler" : "Local"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EVENTS STRIP — horizontal scrolling compact event cards */}
              {events.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-500" /> Events in {decodedCityName}
                    </h3>
                    <button onClick={() => setLocation('/events')} className="text-xs text-blue-500 hover:underline">
                      See all {events.length}
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                    {events.slice(0, 10).map((event: any) => (
                      <div key={event.id} className="flex-shrink-0 w-48 cursor-pointer rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden hover:border-orange-300 dark:hover:border-orange-600 transition-colors"
                           onClick={() => setLocation(`/events/${event.id}`)}>
                        {event.imageUrl && (
                          <img src={event.imageUrl} alt="" className="w-full h-20 object-cover" loading="lazy" />
                        )}
                        <div className="p-2">
                          <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{event.title}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                            {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            {event.participantCount ? ` · ${event.participantCount} going` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* City Bulletin Board — full width */}
              <div className="mb-4">
                <CityBulletinBoard cityName={parsedCityName} />
              </div>

              {/* Who's Coming to Town — mobile only (also in sidebar for desktop) */}
              <div className="lg:hidden mb-4">
                <CityArrivalsWidget cityName={parsedCityName} />
              </div>

              {/* City Live Feed — mobile only (also in sidebar for desktop) */}
              <div className="lg:hidden mb-4">
                <CityLiveFeed cityName={parsedCityName} />
              </div>

              {/* People, Events, Businesses sections removed — available on Home page */}
              {false as boolean && (<>
              <div id="people-section" className="mb-6 sm:mb-8">
                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Discover and Connect with People</h2>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Connect with travelers, locals, and businesses in {decodedCityName}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-full sm:w-[140px] bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                          <SelectValue placeholder="Filter by" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                          <SelectItem value="all">All People ({users.filter((u: User) => u.userType !== 'business').length})</SelectItem>
                          <SelectItem value="travelers">Travelers</SelectItem>
                          <SelectItem value="locals">Locals ({users.filter((u: User) => u.userType === 'local').length})</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sort By Dropdown - SOLID backgrounds per UI/UX standards */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto sm:ml-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <ArrowUpDown className="w-4 h-4 mr-2" />
                          Sort By
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
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
                  </div>
                </div>

                {/* Meet People in City Button - Shows all content */}
                <div className="mb-6">
                  <Button 
                    onClick={() => {
                      setShowAllUsers(true);
                      setShowAllEvents(true);
                      setFilter("all");
                      // Scroll to content after state updates
                      setTimeout(() => {
                        const peopleSection = document.getElementById('people-section');
                        if (peopleSection) {
                          peopleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    size="lg"
                    data-testid="button-meet-people-city"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Meet People in {parsedCityName}
                  </Button>
                </div>

                {/* Users Grid */}
                {filteredUsers.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                      {displayedUsers.map((user: User) => (
                        <UserCard 
                          key={user.id} 
                          user={{
                            ...user, 
                            bio: user.bio || "",
                            location: user.location || "",
                            hometownCity: user.hometownCity || "",
                            hometownState: user.hometownState || "",
                            hometownCountry: user.hometownCountry || "",
                            profileImage: user.profileImage || "",
                            interests: user.interests || [],
                            isCurrentlyTraveling: user.isCurrentlyTraveling || false,
                            secretActivities: user.secretActivities || ""
                          }} 
                          searchLocation={decodedCityName}
                          currentUserId={isActuallyAuthenticated ? currentUserId : undefined}
                          isCurrentUser={isActuallyAuthenticated && !!currentUserId && user.id === currentUserId}
                          connectionDegree={connectionDegreesData?.degrees?.[user.id]}
                          isAvailableNow={availableNowIds.includes(user.id)}
                          variant="homeCity"
                        />
                      ))}
                    </div>
                    
                    {/* View All Controls - Preview Mode */}
                    {filteredUsers.length > 3 && (
                      <div className="flex justify-center mt-6">
                        {!showAllUsers ? (
                          <Button
                            onClick={() => setShowAllUsers(true)}
                            variant="outline"
                            className="bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            View All {filteredUsers.length} People
                          </Button>
                        ) : (
                          <Button
                            onClick={() => setShowAllUsers(false)}
                            variant="outline"
                            className="bg-gray-500 hover:bg-gray-600 text-white border-0"
                          >
                            Show Preview (Top 3)
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardContent className="p-8 text-center">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No {filter === "all" ? "people" : filter} found in {decodedCityName}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Local Businesses Section */}
              <div className="mb-6 sm:mb-8">
                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Local Businesses in {decodedCityName}</h2>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Discover local businesses and services</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600 transition-all duration-300 rounded-xl shadow-lg"
                    onClick={() => setLocation('/deals')}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    View All Deals
                  </Button>
                </div>

                {/* Business Users Grid - using same UserCard component for consistent sizing */}
                {users.filter((user: User) => user.userType === 'business').length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {users
                      .filter((user: User) => user.userType === 'business')
                      .slice(0, 6)
                      .map((business: User) => (
                        <UserCard 
                          key={business.id} 
                          user={business}
                          compact
                          currentUserId={isActuallyAuthenticated ? currentUserId : undefined}
                          isCurrentUser={isActuallyAuthenticated && !!currentUserId && business.id === currentUserId}
                          isAvailableNow={availableNowIds.includes(business.id)}
                        />
                      ))}
                  </div>
                ) : (
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardContent className="p-8 text-center">
                      <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No businesses found in {decodedCityName}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Events Section */}
              <div className="mb-6 sm:mb-8">
                {/* Official Events Calendar Button */}
                {cityPageInfo?.officialExternalCalendarUrl && (
                  <div className="mb-4 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-orange-50 to-blue-50 dark:from-orange-950/30 dark:to-blue-950/30 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Official {parsedCityName} Events</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">RSVP + guest list hosted on {cityPageInfo.officialExternalProvider === 'luma' ? 'Luma' : cityPageInfo.officialExternalProvider === 'partiful' ? 'Partiful' : 'external platform'}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white flex-shrink-0"
                        onClick={() => window.open(cityPageInfo.officialExternalCalendarUrl!, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Calendar
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Events in {decodedCityName}</h2>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Discover local events and activities</p>
                  </div>
                </div>

                {currentEvents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {currentEvents.map((event: Event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardContent className="p-6 sm:p-8 text-center">
                      <Calendar className="w-10 sm:w-12 h-10 sm:h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No upcoming events in {decodedCityName}</p>
                    </CardContent>
                  </Card>
                )}
                
                {events.length > 3 && (
                  <div className="flex justify-center mt-6">
                    {!showAllEvents ? (
                      <Button
                        onClick={() => setShowAllEvents(true)}
                        variant="outline"
                        className="bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        View All {events.length} Events
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setShowAllEvents(false)}
                        variant="outline"
                        className="bg-gray-500 hover:bg-gray-600 text-white border-0"
                      >
                        Show Preview (Top 3)
                      </Button>
                    )}
                  </div>
                )}
              </div>
              </>)}
            </div>

            {/* Sidebar - Enhanced for LA */}
            <div className={`lg:col-span-1 xl:col-span-1 space-y-4 sm:space-y-6 ${
              isLAArea ? 'lg:col-span-1 xl:col-span-1' : ''
            }`}>
              <div className={isLAArea ? 'space-y-6' : 'space-y-4 sm:space-y-6'}>
                {/* Who's Coming to Town — desktop sidebar */}
                <div className="hidden lg:block">
                  <CityArrivalsWidget cityName={parsedCityName} />
                </div>

                {/* City Live Feed — desktop sidebar */}
                <div className="hidden lg:block">
                  <CityLiveFeed cityName={parsedCityName} />
                </div>

                <div className={isLAArea ? 'ring-2 ring-orange-200/50 rounded-xl p-1' : ''}>
                  <WeatherWidget 
                    city={parsedCityName === 'Los Angeles Metro' ? 'Los Angeles' : parsedCityName} 
                    state={parsedStateName || 'California'} 
                    country={parsedCountryName} 
                  />
                </div>
                {/* AI City Guide Widget - Travel tips and insights */}
                <div className={isLAArea ? 'ring-2 ring-orange-200/50 rounded-xl p-1' : ''}>
                  <AICityGuideWidget cityName={parsedCityName} compact={false} />
                </div>
                {/* City Stats Widget - Always Loaded */}
                <div className={isLAArea ? 'ring-2 ring-orange-200/50 rounded-xl p-1' : ''}>
                  <CityStatsWidget city={parsedCityName} country={parsedCountryName} />
                </div>
                {/* Secret Experiences Widget - Always Loaded */}
                <div className={isLAArea ? 'ring-2 ring-orange-200/50 rounded-xl p-1' : ''}>
                  <SecretExperiencesWidget city={parsedCityName} state={parsedStateName} country={parsedCountryName} />
                </div>
                <div className={isLAArea ? 'ring-2 ring-orange-200/50 rounded-xl p-1' : ''}>
                  <CityChatlroomsWidget city={parsedCityName} country={parsedCountryName} />
                </div>
                {/* City Map Widget - Always Loaded */}
                <div className={isLAArea ? 'ring-2 ring-orange-200/50 rounded-xl p-1' : ''}>
                  <CityMap city={parsedCityName} country={parsedCountryName} />
                </div>
                {isLAArea && (
                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🌟</div>
                      <h3 className="font-bold text-orange-800 dark:text-orange-200 mb-2">Beta Launch Focus</h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        We're prioritizing the LA community with enhanced features and local partnerships!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
