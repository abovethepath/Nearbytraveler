import { useState, useEffect, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "@/App";
import { getCurrentTravelDestination } from "@/lib/dateUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  Wind, 
  Droplets, 
  Thermometer,
  MapPin,
  RefreshCw
} from "lucide-react";

interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  icon: string;
  condition: string;
}

interface WeatherResponse {
  weather?: WeatherData;
  city: string;
  country: string;
  current?: {
    temp_f: number;
    condition: {
      text: string;
    };
  };
}

export default function CurrentLocationWeatherWidget() {
  const { user } = useContext(AuthContext);
  const [currentCity, setCurrentCity] = useState<string>("");
  const [currentCountry, setCurrentCountry] = useState<string>("");

  // Get user data from localStorage (same as CurrentCityWidget)
  const getUserFromStorage = () => {
    try {
      const stored = localStorage.getItem('travelconnect_user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
    return null;
  };

  const currentUser = getUserFromStorage();

  // Get user's travel plans (same pattern as CurrentCityWidget)
  const { data: travelPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: [`/api/travel-plans/${currentUser?.id}`],
    enabled: !!currentUser?.id,
  });

  // Determine user's current location using same logic as CurrentCityWidget
  useEffect(() => {
    const effectiveUser = user || currentUser;
    
    if (!effectiveUser?.id || plansLoading) return;

    console.log('Weather Widget - User data:', {
      hometownCity: effectiveUser.hometownCity,
      hometownCountry: effectiveUser.hometownCountry,
      travelPlans: Array.isArray(travelPlans) ? travelPlans.length : 0
    });

    // Check if user is currently traveling using travel plans (same logic as CurrentCityWidget)
    const currentDestination = getCurrentTravelDestination(Array.isArray(travelPlans) ? travelPlans : []);
    if (currentDestination && effectiveUser.hometownCity) {
      // currentDestination is a string like "Montpellier, France", parse it
      const destinationParts = currentDestination.split(', ');
      const destinationCity = destinationParts[0] || '';
      const destinationCountry = destinationParts[destinationParts.length - 1] || '';
      
      const travelDestination = destinationCity.toLowerCase();
      const hometown = effectiveUser.hometownCity?.toLowerCase() || '';
      
      // Only show as traveler if destination is different from hometown
      if (!travelDestination.includes(hometown) && !hometown.includes(travelDestination)) {
        // User is traveling - show weather for travel destination
        let city = destinationCity;
        
        // Fix: Weather API doesn't recognize "Los Angeles Metro" - use "Los Angeles" instead
        if (city === 'Los Angeles Metro') {
          city = 'Los Angeles';
        }
        
        console.log('Weather Widget - Using travel destination:', { city, country: destinationCountry });
        setCurrentCity(city);
        setCurrentCountry(destinationCountry);
        return;
      }
    }
    
    // User is at home - show weather for hometown
    let city = effectiveUser.hometownCity || "";
    const country = effectiveUser.hometownCountry || "";
    
    // Fix: Weather API doesn't recognize "Los Angeles Metro" - use "Los Angeles" instead
    if (city === 'Los Angeles Metro') {
      city = 'Los Angeles';
    }
    
    console.log('Weather Widget - Using hometown:', { city, country });
    setCurrentCity(city);
    setCurrentCountry(country);
  }, [user, currentUser, travelPlans, plansLoading]);

  const { data: weatherData, isLoading, error, refetch } = useQuery<WeatherResponse>({
    queryKey: ['/api/weather', currentCity, currentCountry],
    enabled: !!currentCity && !!currentCountry,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('city', currentCity);
      params.append('country', currentCountry);
      
      console.log('Weather API call with params:', { city: currentCity, country: currentCountry });
      
      const response = await fetch(`/api/weather?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      return response.json() as Promise<WeatherResponse>;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes - refresh more frequently for current weather
  });

  const getWeatherIcon = (condition: string) => {
    if (!condition) return <Cloud className="w-8 h-8 text-gray-500" />;
    const lowerCondition = condition.toLowerCase();
    
    if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
      return <CloudRain className="w-8 h-8 text-blue-500" />;
    } else if (lowerCondition.includes('snow')) {
      return <CloudSnow className="w-8 h-8 text-blue-200" />;
    } else if (lowerCondition.includes('cloud')) {
      return <Cloud className="w-8 h-8 text-gray-500" />;
    } else if (lowerCondition.includes('clear') || lowerCondition.includes('sunny')) {
      return <Sun className="w-8 h-8 text-yellow-500" />;
    } else {
      return <Cloud className="w-8 h-8 text-gray-500" />;
    }
  };

  const getLocationLabel = () => {
    const effectiveUser = user || currentUser;
    if (!effectiveUser) return "Your Location";
    
    // Check if user is currently traveling using travel plans (same logic as CurrentCityWidget)
    const currentDestination = getCurrentTravelDestination(Array.isArray(travelPlans) ? travelPlans : []);
    if (currentDestination && effectiveUser.hometownCity) {
      // currentDestination is a string like "Montpellier, France", parse it
      const destinationParts = currentDestination.split(', ');
      const destinationCity = destinationParts[0] || '';
      const travelDestination = destinationCity.toLowerCase();
      const hometown = effectiveUser.hometownCity?.toLowerCase() || '';
      
      // Only show as traveler if destination is different from hometown
      if (!travelDestination.includes(hometown) && !hometown.includes(travelDestination)) {
        return "Your Travel Destination";
      }
    }
    
    return "Your Hometown";
  };

  const getLocationBadgeColor = () => {
    const effectiveUser = user || currentUser;
    if (!effectiveUser) return "secondary";
    
    // Check if user is currently traveling using travel plans (same logic as CurrentCityWidget)
    const currentDestination = getCurrentTravelDestination(Array.isArray(travelPlans) ? travelPlans : []);
    if (currentDestination && effectiveUser.hometownCity) {
      // currentDestination is a string like "Montpellier, France", parse it
      const destinationParts = currentDestination.split(', ');
      const destinationCity = destinationParts[0] || '';
      const travelDestination = destinationCity.toLowerCase();
      const hometown = effectiveUser.hometownCity?.toLowerCase() || '';
      
      // Only show as traveler if destination is different from hometown
      if (!travelDestination.includes(hometown) && !hometown.includes(travelDestination)) {
        return "default"; // Traveling
      }
    }
    
    return "secondary"; // At home
  };

  if (!currentCity || !currentCountry) {
    return (
      <div className="w-full relative overflow-hidden rounded-3xl" data-testid="weather-widget">
        {/* Animated Gradient Orbs Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-30 blur-3xl animate-float"></div>
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full opacity-30 blur-3xl animate-float-slow"></div>
        </div>
        
        {/* Glass Morphism Card */}
        <Card className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 border border-white/30 dark:border-gray-700/30 shadow-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent font-bold">
              <MapPin className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Current Weather
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Set your location in profile to see weather
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full relative overflow-hidden rounded-3xl" data-testid="weather-widget">
        {/* Animated Gradient Orbs Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-30 blur-3xl animate-float"></div>
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full opacity-30 blur-3xl animate-float-slow"></div>
        </div>
        
        {/* Glass Morphism Card */}
        <Card className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 border border-white/30 dark:border-gray-700/30 shadow-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent font-bold">
              <MapPin className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Current Weather
            </CardTitle>
            <CardDescription>
              <Badge variant={getLocationBadgeColor()} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                {getLocationLabel()}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-gradient-to-r from-blue-500 to-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Loading weather...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="w-full relative overflow-hidden rounded-3xl" data-testid="weather-widget">
        {/* Animated Gradient Orbs Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-30 blur-3xl animate-float"></div>
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full opacity-30 blur-3xl animate-float-slow"></div>
        </div>
        
        {/* Glass Morphism Card */}
        <Card className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 border border-white/30 dark:border-gray-700/30 shadow-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent font-bold">
              <MapPin className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Current Weather
            </CardTitle>
            <CardDescription>
              <Badge variant={getLocationBadgeColor()} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                {getLocationLabel()}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <Cloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Weather unavailable for {currentCity}
              </p>
              <button 
                onClick={() => refetch()}
                className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1.5 rounded-full hover:shadow-lg transition-all flex items-center mx-auto"
                data-testid="button-refresh-weather"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Try again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // API returns data with current.temp_f and current.condition.text structure
  const temperature = weatherData?.current?.temp_f;
  const condition = weatherData?.current?.condition?.text;

  return (
    <div className="w-full relative overflow-hidden rounded-3xl group" data-testid="weather-widget">
      {/* Animated Gradient Orbs Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-30 blur-3xl animate-float"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full opacity-30 blur-3xl animate-float-slow"></div>
      </div>
      
      {/* Glass Morphism Card with Hover Effect */}
      <Card className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 border border-white/30 dark:border-gray-700/30 shadow-2xl transition-all duration-300 group-hover:shadow-3xl group-hover:bg-white/70 dark:group-hover:bg-gray-900/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent font-bold">
              <MapPin className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Current Weather
            </div>
            <button 
              onClick={() => refetch()}
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30"
              title="Refresh weather"
              data-testid="button-refresh-weather"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </CardTitle>
          <CardDescription className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {currentCity}{currentCountry && `, ${currentCountry}`}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
              {getWeatherIcon(condition || 'sunny')}
            </div>
            <div className="flex-1">
              <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {temperature ? `${Math.round(temperature)}°F` : '--'}
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {temperature ? `${Math.round((temperature - 32) * 5/9)}°C` : ''}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 capitalize mt-1">
                {condition || 'Unknown'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}