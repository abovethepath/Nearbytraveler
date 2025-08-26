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
    hometownCity?: string;
    hometownState?: string;
    activeTravelDestination?: string;
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
    'Playa del Rey': [33.9425, -118.4081], // User's location
    'Santa Monica': [34.0195, -118.4912],
    'Venice': [33.9850, -118.4695],
    'Beverly Hills': [34.0736, -118.4004],
    'Hollywood': [34.0928, -118.3287],
    'Culver City': [34.0211, -118.3965],
    'Marina del Rey': [33.9802, -118.4517],
    'Manhattan Beach': [33.8847, -118.4109],
    'Hermosa Beach': [33.8622, -118.3998],
    'Redondo Beach': [33.8492, -118.3884],
    'El Segundo': [33.9164, -118.4015],
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
  
  // Check for exact city match first
  if (cityCoords[city]) {
    return cityCoords[city];
  }
  
  // Check for Los Angeles metro area cities - default to LA coordinates
  const laCities = ['Los Angeles', 'Playa del Rey', 'Santa Monica', 'Venice', 'Beverly Hills', 'Hollywood', 'Culver City', 'Marina del Rey', 'Manhattan Beach', 'Hermosa Beach', 'Redondo Beach', 'El Segundo', 'West Hollywood', 'Pasadena', 'Burbank', 'Glendale', 'Long Beach', 'Torrance', 'Inglewood'];
  if (city && laCities.some(laCity => city.toLowerCase().includes(laCity.toLowerCase()))) {
    return [34.0522, -118.2437]; // Los Angeles center
  }
  
  // Default to Los Angeles instead of NYC for this app
  return [34.0522, -118.2437];
};

export function CityMap({ city, state, country }: CityMapProps) {
  // Query for regular map data (users and events)
  const { data: mapData, isLoading: isLoadingMapData, error: mapErr } = useQuery<MapData>({
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
    retry: 1,
  });

  // Query for businesses with geolocation and active deals/events
  const { data: businessMapData, isLoading: isLoadingBusinesses, error: bizErr } = useQuery<Array<{
    id: number;
    name: string;
    username: string;
    city: string;
    state: string;
    country: string;
    currentLatitude: number;
    currentLongitude: number;
    businessType?: string;
    specialty?: string;
    streetAddress?: string;
  }>>({
    queryKey: ['/api/businesses/map', city, state, country],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('city', city);
      if (state) params.append('state', state);
      params.append('country', country);
      
      const response = await fetch(`/api/businesses/map?${params}`);
      if (!response.ok) throw new Error('Failed to fetch business map data');
      return response.json();
    },
    enabled: !!city && !!country,
    retry: 1,
  });

  const isLoading = isLoadingMapData || isLoadingBusinesses;
  const center = getCityCoordinates(city, country);

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

  // ✅ Safer coordinate filtering with Number.isFinite
  const locations = [
    // users
    ...(mapData?.users ?? [])
      .filter(u => Number.isFinite(Number(u.latitude)) && Number.isFinite(Number(u.longitude)))
      .map(user => ({
        id: user.id,
        lat: Number(user.latitude),
        lng: Number(user.longitude),
        name: `@${user.username}`,
        type: 'user' as const,
        description: user.activeTravelDestination 
          ? `${user.activeTravelDestination}` 
          : `${user.hometownCity || city}`
      })),
    // events
    ...(mapData?.events ?? [])
      .filter(e => Number.isFinite(Number(e.latitude)) && Number.isFinite(Number(e.longitude)))
      .map(event => ({
        id: event.id + 10000, // Offset to avoid ID conflicts
        lat: Number(event.latitude),
        lng: Number(event.longitude),
        name: event.title,
        type: 'event' as const,
        description: `Event on ${new Date(event.date).toLocaleDateString('en-US', { 
          year: 'numeric', // CRITICAL: Always shows 4-digit year (2025, not 25)
          month: 'short', 
          day: 'numeric' 
        })}`
      })),
    // businesses
    ...(businessMapData ?? [])
      .filter(b => Number.isFinite(Number(b.currentLatitude)) && Number.isFinite(Number(b.currentLongitude)))
      .map(business => ({
        id: business.id + 20000, // Offset to avoid ID conflicts
        lat: Number(business.currentLatitude),
        lng: Number(business.currentLongitude),
        name: business.name,
        type: 'business' as const,
        description: `${business.businessType || 'Business'}${business.streetAddress ? ` at ${business.streetAddress}` : ` in ${business.city}`}`
      }))
  ];

  console.log('🗺️ CityMap locations:', locations.length, 'total locations processed');
  console.log('🗺️ CityMap first location sample:', locations[0]);
  console.log('🗺️ CityMap all locations:', locations);
  console.log('🗺️ CityMap center coordinates:', center);
  console.log('🗺️ CityMap mapData:', mapData);
  console.log('🗺️ NEW businessMapData:', businessMapData);
  console.log('🗺️ Business locations found:', businessMapData?.length || 0);

  const hasError = mapErr || bizErr;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {city} Overview Map
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ✅ Notice moved here + hard wrapping for tiny screens */}
        <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800 wrap-any">
          <strong className="font-semibold">Map Notice:</strong> Interactive maps are provided for general reference only. Location accuracy and availability may vary. We are not responsible for map functionality or data accuracy.
        </p>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
            <span className="text-gray-600 dark:text-gray-300">Users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
            <span className="text-gray-600 dark:text-gray-300">Businesses</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-sm" />
            <span className="text-gray-600 dark:text-gray-300">Events</span>
          </div>
        </div>

        {/* ✅ Map needs an explicit height container */}
        <div className="map-shell">
          <InteractiveMap
            key={`${city}-${state ?? ''}-${country}`} // force remount when city changes
            locations={locations}
            center={center}
            zoom={12}
          />
          {(!locations || locations.length === 0) && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50/60 dark:bg-gray-900/20">
              <MapPin className="h-12 w-12 mb-2 opacity-50" />
              <p>No location data available for {city}</p>
              <p className="text-sm">Users can share their location to appear on the map</p>
            </div>
          )}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-red-600 dark:text-red-400 bg-red-50/60 dark:bg-red-900/10">
              Unable to load map data. Please try again.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default CityMap;