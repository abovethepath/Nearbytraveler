import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, MapPin, Calendar, Filter, ArrowLeft, Camera, ArrowUpDown, ChevronDown, Clock, Globe, Star, Zap, Briefcase, Phone } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import UserCard from "@/components/user-card";
import EventCard from "@/components/event-card";

import WeatherWidget from "@/components/WeatherWidget";

import { CityTravelTipsWidget } from "@/components/CityTravelTipsWidget";
import { CityChatlroomsWidget } from "@/components/CityChatlroomsWidget";
import { CityStatsWidget } from "@/components/CityStatsWidget";
import { CityMap } from "@/components/CityMap";
import { CityPhotoUploadWidget } from "@/components/CityPhotoUploadWidget";
import { useAuth } from "@/App";
import type { User, Event } from "@shared/schema";

// Default city images
const getCityImage = (cityName: string) => {
  const cityImages: Record<string, string> = {
    'Los Angeles Metro': '/attached_assets/LA PHOTO_1750698856553.jpg',
    'Boston': '/attached_assets/thaniel hall_1750699608804.jpeg',
    'Budapest': '/attached_assets/budapest-at-night-chain-bridge-and-buda-castle-matthias-hauser_1750699409380.jpg',
    'New York': 'https://images.unsplash.com/photo-1496588152823-86ff7695e68f?w=400&h=250&fit=crop&auto=format',
    'Manhattan': 'https://images.unsplash.com/photo-1496588152823-86ff7695e68f?w=400&h=250&fit=crop&auto=format',
    'Chicago': 'https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=400&h=250&fit=crop&auto=format',
    'San Francisco': 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=250&fit=crop&auto=format',
    'Philadelphia': 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=400&h=250&fit=crop&auto=format',
    'Seattle': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=250&fit=crop&auto=format',
    'Miami': 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=400&h=250&fit=crop&auto=format',
    'Austin': 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=400&h=250&fit=crop&auto=format',
    'Denver': 'https://images.unsplash.com/photo-1619856699906-09e1f58c98b1?w=400&h=250&fit=crop&auto=format',
    'Nashville': 'https://images.unsplash.com/photo-1549213783-8284d0336c4f?w=400&h=250&fit=crop&auto=format',
    'New Orleans': 'https://images.unsplash.com/photo-1569982175971-d92b01cf8694?w=400&h=250&fit=crop&auto=format',
    'Portland': 'https://images.unsplash.com/photo-1544547606-5f134e64d0df?w=400&h=250&fit=crop&auto=format',
    'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=250&fit=crop&auto=format',
    'Paris': 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&h=250&fit=crop&auto=format',
    'Rome': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=400&h=250&fit=crop&auto=format',
    'Milan': 'https://images.unsplash.com/photo-1543832923-44667a44c804?w=400&h=250&fit=crop&auto=format',
    'Barcelona': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&h=250&fit=crop&auto=format',
    'Madrid': 'https://images.unsplash.com/photo-1543785734-4b6e564642f8?w=400&h=250&fit=crop&auto=format',
    'Amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&h=250&fit=crop&auto=format',
    'Berlin': 'https://images.unsplash.com/photo-1587330979470-3day839981a7?w=400&h=250&fit=crop&auto=format',
    'Prague': 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=400&h=250&fit=crop&auto=format',
    'Vienna': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=400&h=250&fit=crop&auto=format',
    'Lisbon': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=400&h=250&fit=crop&auto=format',
    'Dublin': 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=400&h=250&fit=crop&auto=format',
    'Stockholm': 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=400&h=250&fit=crop&auto=format',
    'Munich': 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=400&h=250&fit=crop&auto=format',
    'Tokyo': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&h=250&fit=crop&auto=format',
    'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&h=250&fit=crop&auto=format',
    'Hong Kong': 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=400&h=250&fit=crop&auto=format',
    'Seoul': 'https://images.unsplash.com/photo-1549693578-d683be217e58?w=400&h=250&fit=crop&auto=format',
    'Bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=250&fit=crop&auto=format',
    'Sydney': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop&auto=format',
    'Melbourne': 'https://images.unsplash.com/photo-1545044846-351ba102b6d5?w=400&h=250&fit=crop&auto=format',
    'Toronto': 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=400&h=250&fit=crop&auto=format',
    'Vancouver': 'https://images.unsplash.com/photo-1549224026-fca8d92ca2d2?w=400&h=250&fit=crop&auto=format',
    'Mexico City': 'https://images.unsplash.com/photo-1585464231875-d9ef1707a874?w=400&h=250&fit=crop&auto=format',
    'Cape Town': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400&h=250&fit=crop&auto=format',
    'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=250&fit=crop&auto=format',
    'Mumbai': 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&h=250&fit=crop&auto=format'
  };
  return cityImages[cityName] || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=250&fit=crop&auto=format';
};

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
  
  // Fetch uploaded city photos with cache control
  const { data: cityPhotos, refetch: refetchPhotos, error: photosError, isLoading: photosLoading } = useQuery({
    queryKey: ['/api/city-photos/all'], 
    queryFn: async () => {
      const response = await fetch(`/api/city-photos/all`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch city photos');
      return response.json();
    },
    staleTime: 0
  });

  // Listen for photo upload messages and refresh immediately
  useEffect(() => {
    const handlePhotoUpload = (event: MessageEvent) => {
      if (event.data.type === 'PHOTO_UPLOADED') {
        console.log('Photo upload detected, forcing refresh');
        // Force immediate cache invalidation
        queryClient.invalidateQueries({ queryKey: ['/api/city-photos/all'] });
        queryClient.invalidateQueries({ queryKey: ['/api/city-photos'] });
        // Force refetch
        refetchPhotos();
        // Force page refresh after delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    window.addEventListener('message', handlePhotoUpload);
    return () => window.removeEventListener('message', handlePhotoUpload);
  }, [queryClient, refetchPhotos]);

  // Get the display image - user uploaded photo takes priority over default
  const getDisplayImage = () => {
    // For Los Angeles Metro, use the known good image
    if (parsedCityName.toLowerCase().includes('los angeles')) {
      // Check if we have uploaded photos first
      if (cityPhotos && Array.isArray(cityPhotos)) {
        const laPhoto = cityPhotos.find((photo: any) => 
          photo.city && photo.city.toLowerCase().includes('los angeles')
        );
        if (laPhoto && (laPhoto.imageUrl || laPhoto.imageData)) {
          const photoUrl = laPhoto.imageUrl || laPhoto.imageData;
          // Apply cache busting if it's an uploaded asset
          if (photoUrl.startsWith('/attached_assets/')) {
            return `${photoUrl}?v=${Date.now()}&city=la`;
          }
          return photoUrl;
        }
      }
      // Use the known LA photo with cache busting
      return `/attached_assets/LA PHOTO_1750698856553.jpg?v=${Date.now()}&default=true`;
    }
    
    // For other cities, try to find uploaded photos
    if (cityPhotos && Array.isArray(cityPhotos)) {
      const matchingPhoto = cityPhotos.find((photo: any) => {
        if (!photo.city) return false;
        return photo.city.toLowerCase() === parsedCityName.toLowerCase() ||
               photo.city.toLowerCase().includes(parsedCityName.toLowerCase()) ||
               parsedCityName.toLowerCase().includes(photo.city.toLowerCase());
      });
      
      if (matchingPhoto && (matchingPhoto.imageUrl || matchingPhoto.imageData)) {
        const photoUrl = matchingPhoto.imageUrl || matchingPhoto.imageData;
        // Apply cache busting if it's an uploaded asset
        if (photoUrl.startsWith('/attached_assets/')) {
          return `${photoUrl}?v=${Date.now()}&city=${encodeURIComponent(parsedCityName)}`;
        }
        return photoUrl;
      }
    }
    
    // Fall back to default city image
    return getCityImage(parsedCityName);
  };

  // Get photographer username
  const getPhotographerUsername = () => {
    if (cityPhotos && Array.isArray(cityPhotos)) {
      const matchingPhoto = cityPhotos.find((photo: any) => {
        if (!photo.city) return false;
        return photo.city.toLowerCase() === parsedCityName.toLowerCase() ||
               photo.city.toLowerCase().includes(parsedCityName.toLowerCase());
      });
      
      if (matchingPhoto) {
        return matchingPhoto.photographerUsername || 'Community';
      }
    }
    return 'Community';
  };

  // Fetch users for this city using metropolitan area consolidation
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/city', decodedCityName, 'users', filter, 'metro'],
    queryFn: async () => {
      const cityName = decodedCityName.split(',')[0].trim();
      const response = await fetch(`/api/city/${encodeURIComponent(cityName)}/users`);
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
      const cityName = decodedCityName.split(',')[0].trim();
      const response = await fetch(`/api/events?city=${encodeURIComponent(cityName)}`);
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
      
      {/* Mobile-optimized Hero Section - Enhanced for LA */}
      <div className={`relative mb-6 rounded-xl overflow-hidden shadow-2xl mx-4 mt-2 ${
        isLAArea ? 'ring-4 ring-orange-400/30 shadow-orange-500/20' : ''
      }`}>
        <div className={`${isLAArea ? 'h-[350px] sm:h-[500px]' : 'h-[300px] sm:h-[400px]'} relative`}>
          {/* Background Image */}
          <img 
            src={getDisplayImage()}
            alt={`${decodedCityName} city view`}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70"></div>
          
          {/* Mobile-optimized Content Overlay - Enhanced for LA */}
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
            {isLAArea && (
              <div className="mb-2 sm:mb-4">
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs sm:text-sm px-3 py-1 rounded-full shadow-lg animate-pulse">
                  🌟 Beta Launch City
                </Badge>
              </div>
            )}
            <h1 className={`${
              isLAArea 
                ? 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-orange-300 via-yellow-300 to-red-300 bg-clip-text text-transparent'
                : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white'
            } font-bold mb-3 sm:mb-4 drop-shadow-2xl leading-tight`}>
              {decodedCityName}
            </h1>
            <p className={`${
              isLAArea 
                ? 'text-lg sm:text-xl md:text-2xl text-yellow-100 font-medium'
                : 'text-base sm:text-lg md:text-xl text-white/90'
            } max-w-2xl drop-shadow-lg px-4`}>
              {isLAArea 
                ? 'Your premier destination for authentic local experiences and community connections'
                : 'Connect with locals, discover events, and explore authentic experiences'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Upload Photo Section - Always show for all users to contribute */}
      <div className="mx-4 mb-6">
        {(() => {
          // Check if we have an uploaded photo to show attribution
          const hasUploadedPhoto = cityPhotos && Array.isArray(cityPhotos) && 
            cityPhotos.some((photo: any) => 
              photo.city && (
                photo.city.toLowerCase() === parsedCityName.toLowerCase() ||
                photo.city.toLowerCase().includes(parsedCityName.toLowerCase())
              )
            );

          // Show photo attribution if photo exists
          if (hasUploadedPhoto) {
            const photographerUsername = getPhotographerUsername();
            return (
              <div className="flex justify-between items-center px-2 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Photo by: @{photographerUsername || 'Community'}
                </p>
              </div>
            );
          }
          return null;
        })()}
        
        {/* Always show upload widget for all users */}
        <CityPhotoUploadWidget cityName={decodedCityName} />
      </div>

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

                {/* Users Grid */}
                {filteredUsers.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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
                                  {(business as any).businessDescription || business.bio || 'Local business serving the community'}
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