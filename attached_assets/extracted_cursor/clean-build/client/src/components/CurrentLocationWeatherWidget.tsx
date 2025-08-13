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
  weather: WeatherData;
  city: string;
  country: string;
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
  const { data: travelPlans, isLoading: plansLoading } = useQuery({
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
      travelPlans: travelPlans?.length || 0
    });

    // Check if user is currently traveling using travel plans (same logic as CurrentCityWidget)
    const currentDestination = getCurrentTravelDestination(travelPlans || []);
    if (currentDestination && effectiveUser.hometownCity) {
      const travelDestination = currentDestination.toLowerCase();
      const hometown = effectiveUser.hometownCity.toLowerCase();
      
      // Only show as traveler if destination is different from hometown
      if (!travelDestination.includes(hometown) && !hometown.includes(travelDestination)) {
        // User is traveling - show weather for travel destination
        const parts = currentDestination.split(', ');
        let city = parts[0] || "";
        const country = parts[parts.length - 1] || "";
        
        // Fix: Weather API doesn't recognize "Los Angeles Metro" - use "Los Angeles" instead
        if (city === 'Los Angeles Metro') {
          city = 'Los Angeles';
        }
        
        console.log('Weather Widget - Using travel destination:', { city, country });
        setCurrentCity(city);
        setCurrentCountry(country);
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
    const currentDestination = getCurrentTravelDestination(travelPlans || []);
    if (currentDestination && effectiveUser.hometownCity) {
      const travelDestination = currentDestination.toLowerCase();
      const hometown = effectiveUser.hometownCity.toLowerCase();
      
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
    const currentDestination = getCurrentTravelDestination(travelPlans || []);
    if (currentDestination && effectiveUser.hometownCity) {
      const travelDestination = currentDestination.toLowerCase();
      const hometown = effectiveUser.hometownCity.toLowerCase();
      
      // Only show as traveler if destination is different from hometown
      if (!travelDestination.includes(hometown) && !hometown.includes(travelDestination)) {
        return "default"; // Traveling
      }
    }
    
    return "secondary"; // At home
  };

  if (!currentCity || !currentCountry) {
    return (
      <Card className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center text-gray-900 dark:text-white">
            <MapPin className="w-5 h-5 mr-2" />
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
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center text-gray-900 dark:text-white">
            <MapPin className="w-5 h-5 mr-2" />
            Current Weather
          </CardTitle>
          <CardDescription>
            <Badge variant={getLocationBadgeColor()}>
              {getLocationLabel()}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Loading weather...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weatherData) {
    return (
      <Card className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center text-gray-900 dark:text-white">
            <MapPin className="w-5 h-5 mr-2" />
            Current Weather
          </CardTitle>
          <CardDescription>
            <Badge variant={getLocationBadgeColor()}>
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
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center mx-auto"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // API returns data with current.temp_f and current.condition.text structure
  const temperature = weatherData?.current?.temp_f;
  const condition = weatherData?.current?.condition?.text;

  return (
    <Card className="w-full bg-white dark:bg-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between text-gray-900 dark:text-white">
          <div className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Current Weather
          </div>
          <button 
            onClick={() => refetch()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh weather"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </CardTitle>
        <CardDescription className="text-sm text-gray-600 dark:text-gray-300">
          {currentCity}{currentCountry && `, ${currentCountry}`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center space-x-3">
          {getWeatherIcon(condition || 'sunny')}
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {temperature ? `${Math.round(temperature)}°F / ${Math.round((temperature - 32) * 5/9)}°C` : '--'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 capitalize">
              {condition || 'Unknown'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}