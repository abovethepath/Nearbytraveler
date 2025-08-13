import { useQuery } from '@tanstack/react-query';
import { InteractiveMap } from './InteractiveMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users, Calendar, Building2 } from 'lucide-react';

interface CityMapProps {
  city: string;
  state?: string;
  country: string;
}

interface MapData {
  users: Array<{
    id: number;
    username: string;
    latitude?: number;
    longitude?: number;
    userType: string;
  }>;
  events: Array<{
    id: number;
    title: string;
    latitude?: number;
    longitude?: number;
    date: string;
  }>;
  businesses: Array<{
    id: number;
    businessName: string;
    latitude?: number;
    longitude?: number;
    category: string;
  }>;
}

// Default city coordinates for major cities
const getCityCoordinates = (city: string, country: string): [number, number] => {
  const cityCoords: Record<string, [number, number]> = {
    'Los Angeles': [34.0522, -118.2437],
    'New York City': [40.7128, -74.0060],
    'Chicago': [41.8781, -87.6298],
    'Miami': [25.7617, -80.1918],
    'Las Vegas': [36.1699, -115.1398],
    'Nashville': [36.1627, -86.7816],
    'New Orleans': [29.9511, -90.0715],
    'Austin': [30.2672, -97.7431],
    'Boston': [42.3601, -71.0589],
    'Seattle': [47.6062, -122.3321],
    'Denver': [39.7392, -104.9903],
    'Philadelphia': [39.9526, -75.1652],
    'Portland': [45.5152, -122.6784],
    'Sydney': [-33.8688, 151.2093],
    'London': [51.5074, -0.1278],
    'Paris': [48.8566, 2.3522],
    'Berlin': [52.5200, 13.4050],
    'Tokyo': [35.6762, 139.6503],
    'Barcelona': [41.3851, 2.1734],
    'Amsterdam': [52.3676, 4.9041],
    'Prague': [50.0755, 14.4378],
    'Budapest': [47.4979, 19.0402],
    'Vienna': [48.2082, 16.3738],
    'Rome': [41.9028, 12.4964],
    'Warsaw': [52.2297, 21.0122],
    'Krakow': [50.0647, 19.9450],
    'Zagreb': [45.8150, 15.9819],
    'Ljubljana': [46.0569, 14.5058],
    'Buenos Aires': [-34.6037, -58.3816],
    'Santiago': [-33.4489, -70.6693],
    'San Jose': [9.9281, -84.0907],
    'Auckland': [-36.8485, 174.7633],
    'Cape Town': [-33.9249, 18.4241],
    'Marrakech': [31.6295, -7.9811],
    'Cairo': [30.0444, 31.2357],
    'Istanbul': [41.0082, 28.9784],
    'Tel Aviv': [32.0853, 34.7818],
    'Dubai': [25.2048, 55.2708],
    'Moscow': [55.7558, 37.6173]
  };
  
  return cityCoords[city] || [40.7128, -74.0060]; // Default to NYC
};

export function CityMap({ city, state, country }: CityMapProps) {
  const { data: mapData, isLoading } = useQuery<MapData>({
    queryKey: ['/api/city-map-data', city, state, country],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('city', city);
      if (state) params.append('state', state);
      params.append('country', country);
      
      const response = await fetch(`/api/city-map-data?${params}`);
      if (!response.ok) throw new Error('Failed to fetch map data');
      return response.json();
    },
    enabled: !!city && !!country,
  });

  const cityCenter = getCityCoordinates(city, country);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            City Overview Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const locations = [
    ...(mapData?.users?.filter(u => u.latitude && u.longitude).map(user => ({
      id: user.id,
      lat: user.latitude!,
      lng: user.longitude!,
      name: `@${user.username}`,
      type: 'user' as const,
      description: `${user.userType.charAt(0).toUpperCase() + user.userType.slice(1)} in ${city}`
    })) || []),
    ...(mapData?.events?.filter(e => e.latitude && e.longitude).map(event => ({
      id: event.id + 10000, // Offset to avoid ID conflicts
      lat: event.latitude!,
      lng: event.longitude!,
      name: event.title,
      type: 'event' as const,
      description: `Event on ${new Date(event.date).toLocaleDateString('en-US', { 
        year: 'numeric', // CRITICAL: Always shows 4-digit year (2025, not 25)
        month: 'short', 
        day: 'numeric' 
      })}`
    })) || []),
    ...(mapData?.businesses?.filter(b => b.latitude && b.longitude).map(business => ({
      id: business.id + 20000, // Offset to avoid ID conflicts
      lat: business.latitude!,
      lng: business.longitude!,
      name: business.businessName,
      type: 'business' as const,
      description: business.category
    })) || [])
  ];



  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {city} Overview Map
        </CardTitle>

      </CardHeader>
      <CardContent>
        <InteractiveMap
          locations={locations}
          center={cityCenter}
          zoom={12}
          height="400px"
        />
        {locations.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No location data available for {city}</p>
            <p className="text-sm">Users can share their location to appear on the map</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}