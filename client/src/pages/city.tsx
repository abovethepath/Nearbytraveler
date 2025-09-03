import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, MapPin, Calendar, Filter, ArrowLeft, ArrowUpDown, ChevronDown, Clock, Globe, Star, Zap, Briefcase, Phone, Building2 } from "lucide-react";
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
  const [sortBy, setSortBy] = useState("recent");
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
      return allUsers.filter(user => user.user_type === filter);
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
          const referencesA = a.references?.length || 0;
          const referencesB = b.references?.length || 0;
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

  // Paginate users - show top 9 by default, all when expanded
  const displayedUsers = showAllUsers ? filteredUsers : filteredUsers.slice(0, 9);

  // Separate current and past events
  const currentEvents = events.filter((event: Event) => new Date(event.date) >= new Date());
  const pastEvents = events.filter((event: Event) => new Date(event.date) < new Date());

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
      
      {/* Hero Section - Mobile vs Desktop Layout */}
      <div className={`relative mb-6 rounded-xl overflow-hidden mx-4 mt-2 bg-gradient-to-r from-blue-600 to-purple-700 ${
        isLAArea ? 'from-orange-500 to-red-600' : ''
      }`}>
        {/* Mobile: Centered layout */}
        <div className="block md:hidden h-[200px] relative flex flex-col justify-center items-center text-center px-4">
          {isLAArea && (
            <div className="mb-2 sm:mb-4">
              <Badge className="bg-white/20 text-white text-xs sm:text-sm px-3 py-1 rounded-full">
                🌟 Beta Launch City
              </Badge>
            </div>
          )}
          <h1 className={`${
            isLAArea 
              ? 'text-4xl sm:text-5xl font-bold text-white'
              : 'text-3xl sm:text-4xl font-bold text-white'
          } mb-3 sm:mb-4 leading-tight`}>
            {decodedCityName}
          </h1>
        </div>

        {/* Desktop: Enhanced engaging layout */}
        <div className="hidden md:block relative py-12 overflow-hidden">
          {/* Enhanced background effects */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-16 left-8 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-16 right-8 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-8 grid gap-8 md:gap-12 md:grid-cols-5 items-center relative z-10">
            {/* Left text side - wider and enhanced */}
            <div className="md:col-span-3">
              {/* Enhanced badge for LA areas */}
              {isLAArea && (
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 mb-8">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium">🌟 Beta Launch City - Experience the Future</span>
                </div>
              )}

              <div className="space-y-6">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight">
                  <span className="bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent drop-shadow-lg">
                    {decodedCityName}
                  </span>
                </h1>
                
                <div className="max-w-2xl space-y-4">
                  <p className="text-lg lg:text-xl text-white/90 leading-relaxed font-medium">
                    Your gateway to authentic connections — <em className="text-blue-200 font-semibold">where every encounter counts.</em>
                  </p>
                  <p className="text-base text-white/70 leading-relaxed">
                    Connect with travelers, locals, and businesses in {parsedCityName}. From hidden local gems to popular attractions, discover authentic experiences with like-minded people.
                  </p>
                </div>
              </div>
              
              {/* Enhanced Features with attractive icons */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/30">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Local Community</h3>
                    <p className="text-sm text-white/70">Connect with verified travelers and long-time locals</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/30">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Live Events & Activities</h3>
                    <p className="text-sm text-white/70">Discover what's happening right now in the city</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/30">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Business Partners</h3>
                    <p className="text-sm text-white/70">Find exclusive deals and partnership opportunities</p>
                  </div>
                </div>
              </div>
            </div>
          
            {/* Right image side - enhanced city visualization */}
            <div className="md:col-span-2 flex justify-center items-center relative">
              {/* Decorative background effects */}
              <div className="absolute inset-0 opacity-40 pointer-events-none">
                <div className="absolute top-4 -left-8 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-4 -right-8 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
              </div>
              
              {/* Enhanced city visualization */}
              <div className="relative group">
                {/* City visualization container */}
                <div className="relative">
                  {/* Background glow */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-white/20 via-blue-200/20 to-white/20 rounded-3xl blur-xl"></div>
                  
                  {/* Main city interface mockup */}
                  <div className="relative bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 p-8 w-80 h-80 flex flex-col justify-center items-center transform group-hover:scale-[1.02] transition-all duration-500">
                    {/* Dynamic city icon */}
                    <div className="relative mb-6">
                      <MapPin className="w-20 h-20 text-white/80 mx-auto transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500" />
                      <div className="absolute -inset-2 bg-white/20 rounded-full blur-md"></div>
                    </div>
                    
                    {/* City stats */}
                    <h3 className="text-xl font-bold text-white mb-4">Explore {parsedCityName}</h3>
                    
                    <div className="space-y-2 w-full text-center">
                      <div className="flex justify-center items-center gap-2 text-sm text-white/80">
                        <Users className="w-4 h-4" />
                        <span>Active Community</span>
                      </div>
                      <div className="flex justify-center items-center gap-2 text-sm text-white/80">
                        <Calendar className="w-4 h-4" />
                        <span>Live Events</span>
                      </div>
                      <div className="flex justify-center items-center gap-2 text-sm text-white/80">
                        <Building2 className="w-4 h-4" />
                        <span>Local Businesses</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating activity indicators */}
                  <div className="absolute -top-3 -right-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-xl border border-white/50 dark:border-gray-600 transform rotate-3 group-hover:rotate-6 transition-transform duration-300">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">Live</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Now</div>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-3 -left-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-xl border border-white/50 dark:border-gray-600 transform -rotate-3 group-hover:-rotate-6 transition-transform duration-300">
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600 dark:text-orange-400">∞</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Stories</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* City Photo Gallery section completely removed per user request */}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 xl:col-span-3">
              {/* Discover and Connect Section */}
              <div className="mb-6 sm:mb-8">
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

                {/* Meet People in City Button */}
                <div className="mb-6">
                  <Button 
                    onClick={() => setLocation(`/city/${encodeURIComponent(decodedCityName)}/match`)}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    size="lg"
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
                        <UserCard key={user.id} user={user} searchLocation={decodedCityName} />
                      ))}
                    </div>
                    
                    {/* Load More/Less Controls */}
                    {filteredUsers.length > 9 && (
                      <div className="flex justify-center mt-6">
                        {!showAllUsers ? (
                          <Button
                            onClick={() => setShowAllUsers(true)}
                            variant="outline"
                            className="bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600"
                          >
                            Load More ({filteredUsers.length - 9} more people)
                          </Button>
                        ) : (
                          <Button
                            onClick={() => setShowAllUsers(false)}
                            variant="outline"
                            className="bg-gray-500 hover:bg-gray-600 text-white border-0"
                          >
                            Show Less (Top 9)
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
                <div className={isLAArea ? 'ring-2 ring-orange-200/50 rounded-xl p-1' : ''}>
                  <CityStatsWidget city={parsedCityName} country={parsedCountryName} />
                </div>
                <div className={isLAArea ? 'ring-2 ring-orange-200/50 rounded-xl p-1' : ''}>
                  <SecretExperiencesWidget city={parsedCityName} state={parsedStateName} country={parsedCountryName} />
                </div>
                <div className={isLAArea ? 'ring-2 ring-orange-200/50 rounded-xl p-1' : ''}>
                  <CityTravelTipsWidget city={parsedCityName} country={parsedCountryName} />
                </div>
                <div className={isLAArea ? 'ring-2 ring-orange-200/50 rounded-xl p-1' : ''}>
                  <CityChatlroomsWidget city={parsedCityName} country={parsedCountryName} />
                </div>
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