import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, MapPin, Calendar, Filter, ArrowLeft, ArrowUpDown, ChevronDown, X, Clock, Globe, Star, Zap, Briefcase, Phone, Building2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import UserCard from "@/components/user-card";
import EventCard from "@/components/event-card";

import WeatherWidget from "@/components/WeatherWidget";

import { CityTravelTipsWidget } from "@/components/CityTravelTipsWidget";
import { CityChatlroomsWidget } from "@/components/CityChatlroomsWidget";
import { CityStatsWidget } from "@/components/CityStatsWidget";
import { CityMap } from "@/components/CityMap";
import { SecretExperiencesWidget } from "@/components/SecretExperiencesWidget";
import { useAuth } from "@/App";
import type { User, Event } from "@shared/schema";

// Removed all city images and photo gallery functions per user request

interface CityPageProps {
  cityName?: string;
}

export default function CityPage({ cityName }: CityPageProps) {
  const [location, setLocation] = useLocation();
  const [filter, setFilter] = useState("all");
  const [eventTab, setEventTab] = useState<"current" | "past">("current");
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  
  // Hero section visibility state
  const [isHeroVisible, setIsHeroVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('hideCityHero');
    return saved !== 'true'; // Default to visible
  });

  const toggleHeroVisibility = () => {
    const newValue = !isHeroVisible;
    setIsHeroVisible(newValue);
    localStorage.setItem('hideCityHero', String(!newValue));
  };
  
  // Remove lazy loading - load all widgets immediately
  const loadedWidgets = new Set(['stats', 'secrets', 'tips', 'map']);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // Use robust authentication check with localStorage fallback
  const authContext = useAuth();
  const authStorageUser = localStorage.getItem('user');
  const hasStoredUser = !!authStorageUser;
  const isActuallyAuthenticated = authContext.isAuthenticated || hasStoredUser;

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
      const response = await fetch(`/api/city/${encodeURIComponent(cityName)}/users${queryString}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const allUsers = await response.json();
      
      // Apply filter on frontend since backend returns all users
      if (filter === 'all') return allUsers;
      return allUsers.filter((user: any) => user.user_type === filter);
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
      
      const response = await fetch(`/api/events?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
    enabled: !!decodedCityName,
  });

  // Filter and sort users based on selected filter and sort option
  // CRITICAL FIX: Exclude businesses from "Discover People" section regardless of filter
  const filteredUsers = users
    .filter((user: User) => {
      // ALWAYS exclude businesses from people discovery section
      if (user.userType === "business") return false;
      
      if (filter === "all") return true;
      if (filter === "travelers") return user.userType === "traveler";
      if (filter === "locals") return user.userType === "local";
      // businesses filter is now meaningless since businesses are excluded above
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

  // Separate current and past events - with preview limits
  const allCurrentEvents = events.filter((event: Event) => new Date(event.date) >= new Date());
  const allPastEvents = events.filter((event: Event) => new Date(event.date) < new Date());
  
  // Show events based on preview mode
  const currentEvents = showAllEvents ? allCurrentEvents : allCurrentEvents.slice(0, 3);
  const pastEvents = showAllEvents ? allPastEvents : allPastEvents.slice(0, 3);

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
          onClick={() => setLocation('/cities')}
          className="inline-flex items-center gap-2 px-4 py-3 text-base font-medium text-gray-600 bg-white border border-gray-300 rounded-xl shadow-sm hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 active:scale-95 transition-all duration-200 touch-manipulation min-h-[48px]"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Cities
        </button>
      </div>
      
      {/* City Header - Always Visible */}
      <div 
        className="relative mx-4 mt-2 mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-orange-600 dark:from-blue-900 dark:via-indigo-900 dark:to-orange-900"
        style={{
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent dark:from-black/80 dark:via-black/50 dark:to-black/20" />
        <div className="relative z-10 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              {isLAArea && (
                <Badge className="bg-orange-500 text-white text-xs mb-2">
                  🌟 Beta Launch City
                </Badge>
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight drop-shadow-lg">
                {decodedCityName}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-white/90 flex-shrink-0">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">{parsedCityName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 xl:col-span-3">
              {/* Discover and Connect Section */}
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

                    {/* Sort By Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto sm:ml-2 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-orange-50 dark:hover:from-blue-900/30 dark:hover:to-orange-900/30 transition-all duration-300 rounded-xl hover:scale-105"
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
                            isCurrentlyTraveling: user.isCurrentlyTraveling || false
                          }} 
                          searchLocation={decodedCityName} 
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
                    className="bg-gradient-to-r from-green-500 to-orange-500 text-white hover:from-green-600 hover:to-orange-600 transition-all duration-300 rounded-xl shadow-lg"
                    onClick={() => setLocation('/deals')}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    View All Deals
                  </Button>
                </div>

                {/* Business Users Grid */}
                {users.filter((user: User) => user.userType === 'business').length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {users
                      .filter((user: User) => user.userType === 'business')
                      .slice(0, 6)
                      .map((business: User) => (
                        <Card key={business.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                                  {(business as any).businessName || business.name || business.username}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                                  {(business as any).businessDescription || 'Local business serving the community'}
                                </p>
                              </div>
                              <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-800">
                                Business
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              {(business as any).businessAddress && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <MapPin className="w-4 h-4" />
                                  <span className="truncate">{(business as any).businessAddress}</span>
                                </div>
                              )}
                              {(business as any).businessPhone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <Phone className="w-4 h-4" />
                                  <span>{(business as any).businessPhone}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white border-0"
                                onClick={() => setLocation(`/profile/${business.id}`)}
                              >
                                View Profile
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 border-green-200 hover:bg-green-50 dark:border-green-700 dark:hover:bg-green-900"
                                onClick={() => setLocation('/deals')}
                              >
                                View Deals
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
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
                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Events in {decodedCityName}</h2>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Discover local events and activities</p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant={eventTab === "current" ? "default" : "outline"}
                      onClick={() => setEventTab("current")}
                      className={`flex-1 sm:flex-none text-sm ${eventTab === "current" ? "bg-gradient-to-r from-blue-600 to-orange-500 text-white" : ""}`}
                    >
                      Current ({currentEvents.length})
                    </Button>
                    <Button
                      variant={eventTab === "past" ? "default" : "outline"}
                      onClick={() => setEventTab("past")}
                      className={`flex-1 sm:flex-none text-sm ${eventTab === "past" ? "bg-gradient-to-r from-blue-600 to-orange-500 text-white" : ""}`}
                    >
                      Past ({pastEvents.length})
                    </Button>
                  </div>
                </div>

                {/* Events Grid */}
                {eventTab === "current" ? (
                  currentEvents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                      {currentEvents.map((event: Event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-6 sm:p-8 text-center">
                        <Calendar className="w-10 sm:w-12 h-10 sm:h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No current events in {decodedCityName}</p>
                      </CardContent>
                    </Card>
                  )
                ) : (
                  pastEvents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                      {pastEvents.map((event: Event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-6 sm:p-8 text-center">
                        <Calendar className="w-10 sm:w-12 h-10 sm:h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No past events in {decodedCityName}</p>
                      </CardContent>
                    </Card>
                  )
                )}
                
                {/* View All Events Controls - Preview Mode */}
                {((eventTab === "current" && allCurrentEvents.length > 3) || (eventTab === "past" && allPastEvents.length > 3)) && (
                  <div className="flex justify-center mt-6">
                    {!showAllEvents ? (
                      <Button
                        onClick={() => setShowAllEvents(true)}
                        variant="outline"
                        className="bg-gradient-to-r from-green-500 to-blue-500 text-white border-0 hover:from-green-600 hover:to-blue-600"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        View All {eventTab === "current" ? allCurrentEvents.length : allPastEvents.length} {eventTab === "current" ? "Current" : "Past"} Events
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
            </div>

            {/* Sidebar - Enhanced for LA */}
            <div className={`lg:col-span-1 xl:col-span-1 space-y-4 sm:space-y-6 ${
              isLAArea ? 'lg:col-span-1 xl:col-span-1' : ''
            }`}>
              <div className={isLAArea ? 'space-y-6' : 'space-y-4 sm:space-y-6'}>
                <div className={isLAArea ? 'ring-2 ring-orange-200/50 rounded-xl p-1' : ''}>
                  <WeatherWidget 
                    city={parsedCityName === 'Los Angeles Metro' ? 'Los Angeles' : parsedCityName} 
                    state={parsedStateName || 'California'} 
                    country={parsedCountryName} 
                  />
                </div>
                {/* City Stats Widget - Always Loaded */}
                <div className={isLAArea ? 'ring-2 ring-orange-200/50 rounded-xl p-1' : ''}>
                  <CityStatsWidget city={parsedCityName} country={parsedCountryName} />
                </div>
                {/* Secret Experiences Widget - Always Loaded */}
                <div className={isLAArea ? 'ring-2 ring-orange-200/50 rounded-xl p-1' : ''}>
                  <SecretExperiencesWidget city={parsedCityName} state={parsedStateName} country={parsedCountryName} />
                </div>
                {/* Travel Tips Widget - Always Loaded */}
                <div className={isLAArea ? 'ring-2 ring-orange-200/50 rounded-xl p-1' : ''}>
                  <CityTravelTipsWidget city={parsedCityName} country={parsedCountryName} />
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
        </main>
    </div>
  );
}