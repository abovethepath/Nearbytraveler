import { useState, useEffect, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar, Star, Search, Compass, TrendingUp, MessageCircle, Heart, Plane } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header - Responsive text sizing */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 px-2">
            Discover Amazing Destinations
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-black dark:text-white max-w-2xl mx-auto px-4">
            Explore amazing cities, connect with locals and travelers, and find your next adventure
          </p>
        </div>

        {/* Search Bar - Mobile optimized */}
        <div className="max-w-md mx-auto mb-6 sm:mb-8 px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
            <Input
              type="text"
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 sm:pl-10 text-sm sm:text-base"
            />
          </div>
        </div>



        {/* FEATURED LOS ANGELES METRO - Mobile responsive */}
        {sortedCities.some(city => city.city === 'Los Angeles Metro') && (
          <div className="mb-8 sm:mb-12 px-2 sm:px-0">
            <div className="flex justify-center">
              {sortedCities.filter(city => city.city === 'Los Angeles Metro').map((city, index) => (
                <Card
                  key={`featured-${city.city}-${index}`}
                  className="group cursor-pointer transform hover:scale-105 transition-all duration-300 overflow-hidden relative bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm border-orange-400/40 ring-2 sm:ring-4 ring-orange-300/40 shadow-2xl w-full max-w-sm"
                  onClick={() => setLocation(`/city/${encodeURIComponent(city.city)}`)}
                >
                  <div className="relative h-28 sm:h-36 overflow-hidden">
                    <div className={`w-full h-full bg-gradient-to-br ${getCityGradient(city.city, index)} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <MapPin className="w-8 sm:w-12 h-8 sm:h-12 text-white/60" />
                    </div>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm sm:text-lg px-2 sm:px-4 py-1 sm:py-2">
                        🌟 FOCUS
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <MapPin className="w-5 sm:w-6 h-5 sm:h-6 text-orange-300 flex-shrink-0" />
                      <h3 className="font-bold text-base sm:text-lg text-orange-100">
                        {city.city}
                      </h3>
                    </div>
                    <p className="text-sm sm:text-lg mb-4 sm:mb-6 text-orange-200/80">
                      {city.country === 'United States' 
                        ? `${city.city}, ${city.state || 'California'}, United States`
                        : city.country || 'Unknown Location'
                      }
                    </p>
                    <Button 
                      className="w-full font-bold text-sm sm:text-base py-2 transition-all duration-300 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-2xl"
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

        {/* ALL OTHER CITIES GRID - Mobile responsive */}
        {sortedCities.filter(city => city.city !== 'Los Angeles Metro').length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-6 sm:mt-8">
            {sortedCities.filter(city => city.city !== 'Los Angeles Metro').map((city, index) => (
              <Card
                key={`${city.city}-${city.state}-${index}`}
                className="group cursor-pointer transform hover:scale-105 transition-all duration-300 overflow-hidden relative"
                onClick={() => setLocation(`/city/${encodeURIComponent(city.city)}`)}
              >
                <div className="relative h-36 sm:h-48 overflow-hidden">
                  <div className={`w-full h-full bg-gradient-to-br ${getCityGradient(city.city, index + 1)} group-hover:scale-110 transition-transform duration-300`}>
                  </div>
                  <div className="absolute inset-0 bg-black/30" />

                  {/* Activity badges - Mobile sized */}
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3 space-y-1">
                    {city.eventCount > 5 && (
                      <Badge className="bg-purple-500 text-white block text-xs">
                        🎉 Active Events
                      </Badge>
                    )}
                    {(city.localCount + city.travelerCount) > 10 && (
                      <Badge className="bg-blue-500 text-white block text-xs">
                        👥 Active Community
                      </Badge>
                    )}
                  </div>

                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                    <h3 className="font-bold text-lg sm:text-xl text-white mb-1 sm:mb-2">
                      {city.city}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-200 mb-2 sm:mb-3 line-clamp-2">
                      {city.country === 'United States' 
                        ? `${city.city}, ${city.state || 'Unknown State'}, United States`
                        : city.state 
                          ? `${city.city}, ${city.state}, ${city.country}`
                          : `${city.city}, ${city.country || 'Unknown Location'}`
                      }
                    </p>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {city.localCount > 0 && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                          <Users className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                          <span className="hidden sm:inline">{city.localCount} </span>
                          <span className="sm:hidden">{city.localCount}</span>
                          <span className="hidden sm:inline">{city.localCount === 1 ? 'Local' : 'Locals'}</span>
                        </Badge>
                      )}
                      {city.travelerCount > 0 && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                          <Plane className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                          <span className="hidden sm:inline">{city.travelerCount} </span>
                          <span className="sm:hidden">{city.travelerCount}</span>
                          <span className="hidden sm:inline">{city.travelerCount === 1 ? 'Traveler' : 'Travelers'}</span>
                        </Badge>
                      )}
                      {city.eventCount > 0 && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                          <Calendar className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                          <span className="hidden sm:inline">{city.eventCount} </span>
                          <span className="sm:hidden">{city.eventCount}</span>
                          <span className="hidden sm:inline">{city.eventCount === 1 ? 'Event' : 'Events'}</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>
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