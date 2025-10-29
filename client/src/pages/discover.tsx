import { useState, useEffect, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar, Star, Search, Compass, TrendingUp, MessageCircle, Heart, Plane, X, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { AuthContext } from "@/App";
import { MobilePreview } from "@/components/MobilePreview";
import { useIsMobile, useIsDesktop } from "@/hooks/useDeviceType";
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
      console.log('Business user detected on discover page, redirecting to business dashboard');
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

  // Filter cities based on search
  console.log("Discover page - allCities:", allCities);
  console.log("Discover page - searchQuery:", searchQuery);

  const filtered = allCities.filter((city: CityStats) =>
    city.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort cities to put Los Angeles Metro prominently at the top
  const sortedCities = filtered.sort((a, b) => {
    // Los Angeles Metro always goes first
    if (a.city === 'Los Angeles Metro') return -1;
    if (b.city === 'Los Angeles Metro') return 1;
    
    // Then sort alphabetically
    return a.city.localeCompare(b.city);
  });

  console.log("Discover page - filtered cities:", filtered.length);

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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Toggle Button */}
      {!isHeroVisible && (
        <div className="px-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleHeroVisibility}
            className="text-sm"
            data-testid="button-show-discover-hero"
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            Show Hero Section
          </Button>
        </div>
      )}
      
      {/* Hero Section - Desktop Only */}
      {isHeroVisible && !isMobile && (
      <section className="bg-white dark:bg-gray-900 py-4 sm:py-8 lg:py-12 relative">
        {/* Hide Hero Button */}
        <div className="absolute top-2 right-2 z-20">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleHeroVisibility}
            className="text-sm bg-white dark:bg-gray-800"
            data-testid="button-hide-discover-hero"
          >
            <X className="w-4 h-4 mr-2" />
            Hide Hero Section
          </Button>
        </div>
        
        {(
          // Desktop: Enhanced engaging layout (text left, image right)
          <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-6 py-8 sm:py-12 md:py-16 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
              <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-500 rounded-full blur-3xl"></div>
            </div>
            
            <div className="grid gap-8 md:gap-12 md:grid-cols-5 items-center relative z-10">
              {/* Left text side - wider and enhanced */}
              <div className="md:col-span-3">
                {/* Premium badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100/80 to-orange-100/80 dark:from-blue-900/20 dark:to-orange-900/20 border border-blue-200 dark:border-blue-700/50 rounded-full px-4 py-2 mb-6">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Explore • Connect • Experience</span>
                </div>

                <div className="space-y-6">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight">
                    <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent">
                      Discover Amazing
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 bg-clip-text text-transparent">
                      Destinations
                    </span>
                  </h1>
                  
                  <div className="max-w-2xl space-y-4">
                    <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                      Every destination tells a story — <em className="text-orange-600 dark:text-orange-400 font-semibold">discover yours.</em>
                    </p>
                    <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                      Explore amazing cities, connect with locals and travelers, and find your next adventure. From hidden gems to popular hotspots, discover what makes each destination unique.
                    </p>
                  </div>
                </div>
                
                {/* Enhanced Features with attractive icons */}
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Global Destinations</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Explore cities worldwide and find your perfect travel match</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Local Connections</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Meet locals and travelers who share your interests and passion for exploration</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Smart Discovery</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered recommendations tailored to your travel style and preferences</p>
                    </div>
                  </div>
                </div>
              </div>
          
              {/* Right image side - Dynamic LA Skyline */}
              <div className="md:col-span-2 flex justify-center items-center relative order-first md:order-last">
                {/* Decorative background blur effects */}
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                  <div className="absolute top-4 -left-8 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-4 -right-8 w-32 h-32 bg-orange-400/20 rounded-full blur-2xl"></div>
                </div>
                
                {/* Main image container with enhanced styling */}
                <div className="relative group">
                  {/* Quote above image */}
                  <div className="text-center mb-4 relative z-10">
                    <p className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-200 italic leading-tight">
                      <span className="sm:hidden">Every destination tells a story.</span>
                    </p>
                  </div>
                  
                  {/* Compact image container */}
                  <div className="relative">
                    {/* Subtle background glow */}
                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-200/30 via-purple-200/30 to-orange-200/30 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-orange-900/20 rounded-2xl blur-lg"></div>
                    
                    {/* Standardized Los Angeles Photo */}
                    <div className="relative w-full max-w-sm h-[240px] rounded-xl overflow-hidden shadow-xl border border-gray-200/50 dark:border-gray-700/50 transform group-hover:scale-[1.02] transition-all duration-300">
                      {/* Loading placeholder */}
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                        <div className="text-center">
                          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-pulse" />
                          <p className="text-gray-500 text-sm">Loading skyline...</p>
                        </div>
                      </div>
                      
                      {/* Real Los Angeles Griffith Observatory Photo */}
                      <div className="relative w-full h-full overflow-hidden">
                        <img 
                          src="/Los_Angeles_1753819372180.jpg"
                          alt="Los Angeles skyline from Griffith Observatory"
                          className="w-full h-full object-cover"
                          loading="eager"
                        />
                        
                        {/* Enhanced gradient overlay for better contrast */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                        
                        
                        
                        {/* Subtle city name overlay */}
                        <div className="absolute bottom-4 left-4 text-white/90 font-bold text-sm bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
                          Los Angeles
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {sortedCities.filter(city => city.city !== 'Los Angeles Metro').map((city, index) => (
              <Card
                key={`${city.city}-${city.state}-${index}`}
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800 border-0 shadow-lg rounded-2xl"
                onClick={() => setLocation(`/city/${encodeURIComponent(city.city)}`)}
              >
                <div className="relative h-48 sm:h-56 overflow-hidden rounded-t-2xl">
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
                
                <CardContent className="p-5">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">
                    {city.city}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
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