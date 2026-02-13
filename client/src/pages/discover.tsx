import { useState, useEffect, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar, Star, Search, Compass, TrendingUp, MessageCircle, Heart, Plane, X, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import BackButton from "@/components/back-button";
import { AuthContext } from "@/App";
import { MobilePreview } from "@/components/MobilePreview";
import { useIsMobile, useIsDesktop } from "@/hooks/useDeviceType";
import { getApiBaseUrl } from "@/lib/queryClient";
// MobileNav removed - using global mobile navigation


interface CityStats {
  city: string;
  state?: string;
  country?: string;
  localCount: number;
  travelerCount: number;
  businessCount: number;
  eventCount: number;
  description?: string;
  imageUrl?: string;
  highlights?: string[];
}

export default function DiscoverPage() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useContext(AuthContext);
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  
  // Fetch user profile for complete hometown/destination data
  const { data: userProfile } = useQuery<any>({
    queryKey: ['/api/users', user?.id],
    enabled: !!user?.id
  });

  // Fetch user's travel plans for destination cities
  const { data: travelPlans } = useQuery<any[]>({
    queryKey: ['/api/travel-plans', user?.id],
    queryFn: () => fetch(`${getApiBaseUrl()}/api/travel-plans/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id
  });

  // Get user's relevant cities (hometown + travel destinations)
  const getUserRelevantCities = useMemo(() => {
    const relevantCityNames: string[] = [];
    const profile: any = userProfile || user;
    
    if (profile?.hometownCity) {
      relevantCityNames.push(profile.hometownCity.toLowerCase());
    }
    if (profile?.destinationCity) {
      relevantCityNames.push(profile.destinationCity.toLowerCase());
    }
    if (travelPlans && Array.isArray(travelPlans)) {
      travelPlans.forEach((plan: any) => {
        if (plan.destinationCity && plan.userId === user?.id) {
          relevantCityNames.push(plan.destinationCity.toLowerCase());
        }
      });
    }
    return [...new Set(relevantCityNames)];
  }, [user, userProfile, travelPlans]);
  
  // Hero section visibility state
  const [isHeroVisible, setIsHeroVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('hideDiscoverHero');
    return saved !== 'true'; // Default to visible
  });

  const toggleHeroVisibility = () => {
    const newValue = !isHeroVisible;
    setIsHeroVisible(newValue);
    localStorage.setItem('hideDiscoverHero', String(!newValue));
  };

  // Redirect business users away from destination discovery page
  useEffect(() => {
    if (user?.userType === 'business') {
      setLocation('/business-dashboard');
    }
  }, [user, setLocation]);

  // Fetch city stats
  const { data: allCities = [], isLoading: statsLoading } = useQuery<CityStats[]>({
    queryKey: ["/api/city-stats"],
  });

  // Get gradient class for cities with varied colors
  const getCityGradient = (cityName: string, index: number) => {
    const gradients = [
      'from-orange-400 via-red-500 to-purple-600',
      'from-blue-400 via-purple-500 to-indigo-600', 
      'from-yellow-400 via-orange-500 to-red-600',
      'from-gray-400 via-blue-500 to-purple-600',
      'from-red-400 via-orange-500 to-yellow-600',
      'from-green-400 via-blue-500 to-purple-600',
      'from-indigo-400 via-purple-500 to-pink-600',
      'from-teal-400 via-cyan-500 to-blue-600',
      'from-purple-400 via-pink-500 to-red-600',
      'from-emerald-400 via-teal-500 to-cyan-600'
    ];
    
    // Los Angeles gets the featured gradient
    if (cityName === 'Los Angeles Metro' || cityName === 'Los Angeles') {
      return 'from-orange-500 to-red-500';
    }
    
    return gradients[index % gradients.length];
  };

  const filtered = useMemo(() => {
    if (searchQuery) {
      // Search across ALL cities when user types
      return allCities.filter((city: CityStats) =>
        city.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (city.state && city.state.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (city.country && city.country.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    } else {
      // Show ALL cities (not just user's cities)
      return allCities;
    }
  }, [allCities, searchQuery]);

  // Sort cities: user's cities first, then alphabetically
  const sortedCities = [...filtered].sort((a, b) => {
    const aIsUserCity = getUserRelevantCities.includes(a.city.toLowerCase());
    const bIsUserCity = getUserRelevantCities.includes(b.city.toLowerCase());
    
    // User's cities always go first
    if (aIsUserCity && !bIsUserCity) return -1;
    if (!aIsUserCity && bIsUserCity) return 1;
    
    // Within user's cities, Los Angeles Metro goes first
    if (aIsUserCity && bIsUserCity) {
      if (a.city === 'Los Angeles Metro') return -1;
      if (b.city === 'Los Angeles Metro') return 1;
    }
    
    // Then sort alphabetically
    return a.city.localeCompare(b.city);
  });

  // Don't show destination discovery to business users while redirecting
  if (user?.userType === 'business') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Redirecting to Business Dashboard...
          </h2>
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading destinations...</div>
        </div>
      </div>
    );
  }

  const pageContent = (
    <div className="min-h-screen bg-white dark:bg-gray-900 w-full max-w-full overflow-x-hidden">
      {/* Mobile Tagline - Simple one-liner */}
      {isMobile && (
        <div className="px-4 py-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Discover your next adventure
          </p>
        </div>
      )}

      {/* Show Hero Button - Only visible when hero is hidden */}
      {!isHeroVisible && !isMobile && (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleHeroVisibility}
              className="text-sm"
              data-testid="button-show-discover-hero"
            >
              <ChevronDown className="w-4 h-4 mr-2" />
              Show Cities Hero
            </Button>
          </div>
        </div>
      )}

      {/* HERO SECTION — Standardized Layout */}
      {isHeroVisible && !isMobile && (
        <section className="relative py-8 sm:py-12 lg:py-16 overflow-hidden bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-center justify-between">
              <BackButton fallbackRoute="/" />
              <button
                onClick={toggleHeroVisibility}
                className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                data-testid="button-hide-discover-hero"
              >
                <X className="w-4 h-4" />
                Hide
              </button>
            </div>

            <div className="relative py-8">
              <div className="grid gap-8 md:gap-12 md:grid-cols-5 items-center">
                <div className="md:col-span-3">
                  <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-6 py-2.5 mb-8">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full"></div>
                    <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Explore • Connect • Experience</span>
                  </div>

                  <div className="space-y-6">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                      <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                        Discover Amazing
                      </span>
                      <br />
                      <span className="text-gray-900 dark:text-white">
                        Destinations
                      </span>
                    </h1>

                    <div className="max-w-2xl space-y-4">
                      <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                        Every destination tells a story — discover yours.
                      </p>
                      <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                        Explore amazing cities, connect with locals and travelers, and find your next adventure. From hidden gems to popular hotspots, discover what makes each destination unique.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-center items-center relative order-first md:order-last">
                  <div className="relative group">
                    <div className="relative">
                      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] rounded-xl overflow-hidden shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                        <img
                          src="/Los_Angeles_1753819372180.jpg"
                          alt="Los Angeles skyline"
                          className="w-full h-full object-cover"
                          loading="eager"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Search Section */}
      <section className="bg-gray-50 dark:bg-gray-800 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Bar - Modern style */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-gray-600" />
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-6 text-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white"
              />
            </div>
          </div>



        {/* Empty state when search returns no results */}
        {sortedCities.length === 0 && !statsLoading && searchQuery && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <MapPin className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No destinations found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
              Try a different search term to find more cities
            </p>
          </div>
        )}

        {/* FEATURED LOS ANGELES METRO - Airbnb-style featured card */}
        {sortedCities.some(city => city.city === 'Los Angeles Metro') && (
          <div className="mb-12 sm:mb-16">
            <div className="flex justify-center">
              {sortedCities.filter(city => city.city === 'Los Angeles Metro').map((city, index) => (
                <Card
                  key={`featured-${city.city}-${index}`}
                  className="group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white dark:bg-gray-800 border-0 shadow-xl w-full max-w-md rounded-3xl"
                  onClick={() => setLocation(`/city/${encodeURIComponent(city.city)}`)}
                >
                  <div className="relative h-48 sm:h-56 overflow-hidden rounded-t-3xl">
                    <div className={`w-full h-full bg-gradient-to-br ${getCityGradient(city.city, index)} flex items-center justify-center group-hover:scale-105 transition-transform duration-500`}>
                      <MapPin className="w-16 h-16 text-white/70" />
                    </div>
                    <div className="absolute top-4 right-4">
                      <div className="bg-white dark:bg-gray-800 rounded-full px-3 py-1 shadow-lg">
                        <span className="text-orange-500 font-semibold text-sm">🌟</span>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                        {city.city}
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-base leading-relaxed">
                      {city.country === 'United States' 
                        ? `${city.city}, ${city.state || 'California'}, United States`
                        : city.country || 'Unknown Location'
                      }
                    </p>
                    <Button 
                      className="w-full font-semibold text-base py-3 px-6 transition-all duration-300 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl shadow-lg hover:shadow-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/city/${encodeURIComponent(city.city)}`);
                      }}
                    >
                      🌟 EXPLORE LA METRO
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ALL OTHER CITIES GRID - Clean Airbnb-style cards */}
        {sortedCities.filter(city => city.city !== 'Los Angeles Metro').length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
            {sortedCities.filter(city => city.city !== 'Los Angeles Metro').map((city, index) => (
              <Card
                key={`${city.city}-${city.state}-${index}`}
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800 border-0 shadow-lg rounded-2xl"
                onClick={() => setLocation(`/city/${encodeURIComponent(city.city)}`)}
              >
                <div className="relative h-36 sm:h-56 overflow-hidden rounded-t-2xl">
                  <div className={`w-full h-full bg-gradient-to-br ${getCityGradient(city.city, index + 1)} group-hover:scale-105 transition-transform duration-300 flex items-center justify-center`}>
                    <MapPin className="w-12 h-12 text-white/60" />
                  </div>
                  
                  {/* Activity badges - Clean style */}
                  <div className="absolute top-3 right-3 space-y-2">
                    {city.eventCount > 5 && (
                      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
                        <span className="text-purple-600 font-medium text-sm">🎉</span>
                      </div>
                    )}
                    {(city.localCount + city.travelerCount) > 10 && (
                      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
                        <span className="text-blue-600 font-medium text-sm">👥</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <CardContent className="p-3 sm:p-5">
                  <h3 className="font-bold text-base sm:text-xl text-gray-900 dark:text-white mb-2">
                    {city.city}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-base leading-relaxed">
                    {city.country === 'United States' 
                      ? `${city.city}, ${city.state || 'Unknown State'}, United States`
                      : city.state 
                        ? `${city.city}, ${city.state}, ${city.country}`
                        : `${city.city}, ${city.country || 'Unknown Location'}`
                    }
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        </div>
      </section>
    </div>
  );

  return (
    <>
      {pageContent}
      <MobilePreview>
        {pageContent}
      </MobilePreview>
    </>
  );
}