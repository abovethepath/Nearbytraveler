import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cloud, Sun, CloudRain, Thermometer } from "lucide-react";

interface WeatherWidgetProps {
  city: string;
  state?: string;
  country: string;
}

interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
  };
  current: {
    temp_f: number;
    temp_c: number;
    condition: {
      text: string;
      icon: string;
    };
    feelslike_f: number;
    feelslike_c: number;
  };
}

export default function WeatherWidget({ city, state, country }: WeatherWidgetProps) {
  const { data: weather, isLoading, error } = useQuery({
    queryKey: ['/api/weather', city, state, country],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('city', city);
      if (state) params.append('state', state);
      params.append('country', country);
      
      const response = await fetch(`/api/weather?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      return response.json() as Promise<WeatherData>;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - refresh more frequently for current weather
    retry: 1
  });

  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes('rain') || lower.includes('drizzle')) {
      return <CloudRain className="h-6 w-6 text-blue-500" />;
    }
    if (lower.includes('cloud') || lower.includes('overcast')) {
      return <Cloud className="h-6 w-6 text-gray-500" />;
    }
    if (lower.includes('sun') || lower.includes('clear') || lower.includes('fair')) {
      return <Sun className="h-6 w-6 text-yellow-500" />;
    }
    return <Cloud className="h-6 w-6 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading weather...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Weather unavailable</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardContent className="p-4">
        {/* Main temperature and condition */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getWeatherIcon(weather.current.condition.text)}
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(weather.current.temp_f)}°F
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(weather.current.temp_c)}°C
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {weather.current.condition.text}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Feels like {Math.round(weather.current.feelslike_f)}°F
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}