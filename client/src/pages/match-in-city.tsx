import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/App";
import griffithSkylineImg from "@assets/griffith-observatory-skyline_1757211515328.jpg";
import { 
  MapPin, 
  Users, 
  Heart, 
  Search,
  Target,
  Zap,
  ArrowRight,
  Globe,
  Calendar,
  Star,
  Sparkles,
  TrendingUp,
  Coffee,
  Camera,
  Music,
  Utensils,
  Plane,
  Clock
} from "lucide-react";

// City stats interface
interface CityStats {
  city: string;
  state: string;
  country: string;
  localCount: number;
  travelerCount: number;
  businessCount: number;
  eventCount: number;
  description: string;
  highlights: string[];
}

export default function MatchInCity() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Fetch available cities
  const { data: cities = [], isLoading: citiesLoading } = useQuery<CityStats[]>({
    queryKey: ['/api/city-stats'],
  });

  const filteredCities = cities.filter(city =>
    city.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    const encodedCityName = encodeURIComponent(cityName);
    setLocation(`/city/${encodedCityName}`);
  };

  const handleSearchCity = () => {
    if (searchQuery.trim()) {
      const encodedQuery = encodeURIComponent(searchQuery.trim());
      setLocation(`/city/${encodedQuery}`);
    }
  };

  const totalUsers = cities.reduce((sum, city) => sum + city.localCount + city.travelerCount, 0);
  const totalEvents = cities.reduce((sum, city) => sum + city.eventCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={griffithSkylineImg} 
            alt="City Skyline" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-blue-500/10 to-purple-500/10"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20">
          <div className="text-center space-y-8">
            {/* Main Heading */}
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 mb-6">
                <Target className="h-8 w-8 text-orange-500" />
                <Sparkles className="h-6 w-6 text-blue-500" />
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-orange-600 via-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                City-Specific
                <br />
                <span className="text-4xl md:text-6xl">Matching</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Find People Who Want to Do <span className="font-semibold text-orange-600">Exactly</span> What You Want to Do, 
                <span className="font-semibold text-blue-600"> Exactly</span> Where You Want to Do It
              </p>
            </div>

            {/* Value Proposition Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <Target className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Precise Matching</h3>
                  <p className="text-gray-600 text-sm">Match with people who share your exact interests in your specific city</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Local Context</h3>
                  <p className="text-gray-600 text-sm">Discover people and activities based on your city's unique culture</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <Zap className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Connections</h3>
                  <p className="text-gray-600 text-sm">Skip the small talk - connect with people ready for the same adventures</p>
                </CardContent>
              </Card>
            </div>

            {/* Platform Stats */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-orange-100 mt-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{totalUsers.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 mt-1">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{cities.length}</div>
                  <div className="text-sm text-gray-600 mt-1">Cities Available</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{totalEvents.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 mt-1">Events & Meetups</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">24/7</div>
                  <div className="text-sm text-gray-600 mt-1">Matching Active</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* City Selection Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Search className="h-6 w-6 text-blue-500" />
              <Globe className="h-6 w-6 text-orange-500" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Choose Your City
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Start by selecting your city to find people with shared interests and discover local experiences
            </p>
          </div>

          {/* Available Cities */}
          {!showSearch && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-700">Available Cities</h3>
              <div className="grid gap-4">
                {citiesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : cities.length > 0 ? (
                  cities.map((city) => (
                    <Card 
                      key={`${city.city}-${city.state}`}
                      className="bg-white hover:bg-orange-50 border-2 hover:border-orange-300 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                      onClick={() => handleCitySelect(city.city)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <MapPin className="h-5 w-5 text-orange-500" />
                              <h3 className="text-xl font-semibold text-gray-900">
                                {city.city}
                              </h3>
                              {city.state && (
                                <Badge variant="outline" className="text-xs">
                                  {city.state}, {city.country}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>{city.localCount + city.travelerCount} people</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{city.eventCount} events</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-3">
                              {city.highlights.map((highlight, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {highlight}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="bg-white border-dashed border-2 border-gray-300">
                    <CardContent className="p-8 text-center">
                      <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No cities available yet. Check back soon!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Search Any City Section */}
          <div className="border-t border-gray-200 pt-8 mt-8">
            <div className="bg-gradient-to-r from-orange-50 to-blue-50 rounded-2xl p-8">
              <div className="text-center space-y-4">
                <Search className="h-8 w-8 text-blue-500 mx-auto" />
                <h3 className="text-2xl font-bold text-gray-900">Search Any City</h3>
                <p className="text-gray-600 max-w-lg mx-auto">
                  Don't see your city? Search for any city worldwide to start building your local community
                </p>
                
                <div className="max-w-md mx-auto">
                  <div className="flex space-x-2 mt-6">
                    <Input
                      type="text"
                      placeholder="Type any city name (e.g., Tokyo, London, Dubai)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchCity()}
                      className="flex-1 text-center border-2 border-blue-200 focus:border-blue-400"
                      data-testid="input-city-search"
                    />
                  </div>
                  <Button 
                    onClick={handleSearchCity}
                    disabled={!searchQuery.trim()}
                    className="w-full mt-3 bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    data-testid="button-search-city"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search This City
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">How City-Specific Matching Works</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-orange-600">1</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Choose Your City</h4>
                <p className="text-gray-600 text-sm">Select your city to see locals, travelers, events, and businesses in your area</p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-blue-600">2</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Find Your Matches</h4>
                <p className="text-gray-600 text-sm">Discover people with shared interests and activities specific to your location</p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Meet & Experience</h4>
                <p className="text-gray-600 text-sm">Connect instantly and start exploring your city together</p>
              </div>
            </div>
          </div>

          {/* Popular Activities Preview */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Popular Activities People Match For</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <Coffee className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">Coffee Meetups</span>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <Camera className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">Photography</span>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <Music className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">Live Music</span>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <Utensils className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">Food Tours</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}