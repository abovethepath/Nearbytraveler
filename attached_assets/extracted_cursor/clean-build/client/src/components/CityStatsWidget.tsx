import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CityStatsWidgetProps {
  city: string;
  state?: string;
  country: string;
  onOpenModal?: (city: string, state: string, country: string, userType: string, title: string) => void;
}

interface CityStats {
  city: string;
  state: string;
  country: string;
  localCount: number;
  travelerCount: number;
  businessCount: number;
  eventCount: number;
}

export function CityStatsWidget({ city, state, country, onOpenModal }: CityStatsWidgetProps) {
  const { data: allStats, isLoading } = useQuery({
    queryKey: ['/api/city-stats', city, state, country],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (state) params.append('state', state);
      if (country) params.append('country', country);
      
      const url = `/api/city-stats/${city}?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch city stats');
      }
      const data = await response.json();
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000 // 5 minutes
  });

  // Find the stats for the specific city
  const stats = Array.isArray(allStats) 
    ? allStats.find(s => s.city.toLowerCase() === city.toLowerCase())
    : allStats;

  console.log('CityStatsWidget - Final stats object:', stats);
  console.log('CityStatsWidget - All stats received:', allStats);

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">
            City Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  // Use actual stats or fallback defaults
  const displayStats = stats ? {
    city: stats.city,
    state: stats.state || '',
    country: stats.country,
    localCount: stats.localCount || 0,
    travelerCount: stats.travelerCount || 0,
    businessCount: stats.businessCount || 0,
    eventCount: stats.eventCount || 0
  } : {
    city: city,
    state: state || '',
    country: country,
    localCount: 0,
    travelerCount: 0,
    businessCount: 0,
    eventCount: 0
  };

  console.log('CityStatsWidget - Using display stats:', displayStats);

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">
          City Stats <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">(cumulative)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {displayStats.travelerCount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">TRAVELERS</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {displayStats.localCount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">LOCALS</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {displayStats.businessCount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">BUSINESSES</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {displayStats.eventCount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">EVENTS</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}