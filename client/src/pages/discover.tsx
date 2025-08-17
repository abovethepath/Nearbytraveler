import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar, Star, Search, Compass, TrendingUp, MessageCircle, Heart, Plane } from "lucide-react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
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

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading destinations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 py-8">
      {/* MobileNav removed - using global MobileTopNav and MobileBottomNav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Discover Amazing Destinations
          </h1>
          <p className="text-lg text-black dark:text-white max-w-2xl mx-auto">
            Explore amazing cities, connect with locals and travelers, and find your next adventure
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>



        {/* FEATURED LOS ANGELES METRO - MASSIVE HERO SECTION */}
        {sortedCities.some(city => city.city === 'Los Angeles Metro') && (
          <div className="mb-12">
            <div className="flex justify-center">
              {sortedCities.filter(city => city.city === 'Los Angeles Metro').map((city, index) => (
                <Card
                  key={`featured-${city.city}-${index}`}
                  className="group cursor-pointer transform hover:scale-105 transition-all duration-300 overflow-hidden relative bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm border-orange-400/40 ring-4 ring-orange-300/40 shadow-2xl max-w-sm w-full"
                  onClick={() => setLocation(`/city/${encodeURIComponent(city.city)}`)}
                >
                  <div className="relative h-36 overflow-hidden">
                    <div className={`w-full h-full bg-gradient-to-br ${getCityGradient(city.city, index)} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <MapPin className="w-12 h-12 text-white/60" />
                    </div>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-lg px-4 py-2">
                        🌟 FOCUS
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <MapPin className="w-6 h-6 text-orange-300" />
                      <h3 className="font-bold text-lg text-orange-100">{city.city}</h3>
                    </div>
                    <p className="text-lg mb-6 text-orange-200/80">
                      {city.country === 'United States' 
                        ? `${city.city}, ${city.state || 'California'}, United States`
                        : city.country || 'Unknown Location'
                      }
                    </p>
                    <Button 
                      className="w-full font-bold text-base py-2 transition-all duration-300 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-2xl"
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

        {/* ALL OTHER CITIES GRID - No heading text */}
        {sortedCities.filter(city => city.city !== 'Los Angeles Metro').length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {sortedCities.filter(city => city.city !== 'Los Angeles Metro').map((city, index) => (
              <Card
                key={`${city.city}-${city.state}-${index}`}
                className="group cursor-pointer transform hover:scale-105 transition-all duration-300 overflow-hidden relative"
                onClick={() => setLocation(`/city/${encodeURIComponent(city.city)}`)}
              >
                <div className="relative h-48 overflow-hidden">
                  <div className={`w-full h-full bg-gradient-to-br ${getCityGradient(city.city, index + 1)} group-hover:scale-110 transition-transform duration-300`}>
                  </div>
                  <div className="absolute inset-0 bg-black/30" />

                  {/* Activity badges showing actual meaningful data */}
                  <div className="absolute top-3 right-3 space-y-1">
                    {city.eventCount > 5 && (
                      <Badge className="bg-purple-500 text-white block">
                        🎉 Active Events
                      </Badge>
                    )}
                    {(city.localCount + city.travelerCount) > 10 && (
                      <Badge className="bg-blue-500 text-white block">
                        👥 Active Community
                      </Badge>
                    )}
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-bold text-xl text-white mb-2">{city.city}</h3>
                    <p className="text-sm text-gray-200 mb-3">
                      {city.country === 'United States' 
                        ? `${city.city}, ${city.state || 'Unknown State'}, United States`
                        : city.state 
                          ? `${city.city}, ${city.state}, ${city.country}`
                          : `${city.city}, ${city.country || 'Unknown Location'}`
                      }
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {city.localCount > 0 && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          <Users className="w-3 h-3 mr-1" />
                          {city.localCount} {city.localCount === 1 ? 'Local' : 'Locals'}
                        </Badge>
                      )}
                      {city.travelerCount > 0 && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          <Plane className="w-3 h-3 mr-1" />
                          {city.travelerCount} {city.travelerCount === 1 ? 'Traveler' : 'Travelers'}
                        </Badge>
                      )}
                      {city.eventCount > 0 && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          <Calendar className="w-3 h-3 mr-1" />
                          {city.eventCount} {city.eventCount === 1 ? 'Event' : 'Events'}
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
}