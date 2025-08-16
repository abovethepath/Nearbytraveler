import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Globe, Phone, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getCurrentTravelDestination } from "@/lib/dateUtils";

interface BusinessesGridProps {
  currentLocation?: {
    city: string;
    state: string;
    country: string;
  } | null;
  travelPlans?: any[];
}

export default function BusinessesGrid({ currentLocation, travelPlans = [] }: BusinessesGridProps) {
  const [, setLocation] = useLocation();
  const [displayLimit, setDisplayLimit] = useState(3);

  // Determine ALL locations for business discovery (hometown + all travel destinations)
  const locationsForDiscovery = useMemo(() => {
    const locations: Array<{city: string; state: string; country: string; type: string}> = [];
    
    // Add hometown
    if (currentLocation?.city) {
      locations.push({ 
        ...currentLocation, 
        type: 'hometown'
      });
    }

    // Add current travel destination if traveling
    const currentDestination = getCurrentTravelDestination(travelPlans);
    if (currentDestination) {
      const [city, state, country] = currentDestination.split(', ');
      locations.push({
        city: city || '',
        state: state || '',
        country: country || 'United States',
        type: 'current_travel'
      });
    }

    // Add ALL planned travel destinations from travel plans
    if (travelPlans && travelPlans.length > 0) {
      travelPlans.forEach(plan => {
        if (plan.destination && !locations.some(loc => loc.city === plan.destination.split(',')[0].trim())) {
          const [city, state, country] = (plan.destination || '').split(', ');
          locations.push({
            city: city || '',
            state: state || '',
            country: country || 'United States',
            type: 'planned_travel'
          });
        }
      });
    }
    
    console.log('BusinessesGrid - All locations for discovery:', locations);
    return locations;
  }, [currentLocation, travelPlans]);

  // Fetch businesses from ALL locations (hometown + all travel destinations)
  const { data: businesses = [], isLoading: businessesLoading } = useQuery({
    queryKey: ['/api/businesses/all-locations', locationsForDiscovery.map(loc => `${loc.city}-${loc.state}-${loc.country}`)],
    queryFn: async () => {
      if (!locationsForDiscovery.length) return [];
      
      console.log('BusinessesGrid - Fetching businesses from ALL locations:', locationsForDiscovery);

      // Fetch businesses from all cities in parallel
      const businessPromises = locationsForDiscovery.map(async (location) => {
        const cityName = location.city;
        console.log(`BusinessesGrid - Fetching businesses for ${location.type}:`, cityName);

        try {
          const params = new URLSearchParams({
            city: location.city,
            state: location.state || '',
            country: location.country || ''
          });
          
          const response = await fetch(`/api/businesses?${params}`);
          if (!response.ok) throw new Error(`Failed to fetch businesses for ${cityName}`);
          const data = await response.json();
          console.log(`BusinessesGrid - ${location.type} businesses API response:`, data.length, 'businesses for', cityName);
          return data.map((business: any) => ({ ...business, sourceLocation: location }));
        } catch (error) {
          console.error(`BusinessesGrid - Error fetching businesses for ${cityName}:`, error);
          return [];
        }
      });

      const allBusinessArrays = await Promise.all(businessPromises);
      const combined = allBusinessArrays.flat();

      // Remove duplicates by business ID
      const unique = combined.filter((business, index, self) => 
        index === self.findIndex((b) => b.id === business.id)
      );

      console.log('BusinessesGrid - Combined businesses from ALL locations:', unique.length, 'businesses from', locationsForDiscovery.length, 'locations');
      return unique;
    },
    enabled: locationsForDiscovery.length > 0
  });

  if (!locationsForDiscovery.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading location data...</p>
      </div>
    );
  }

  if (businessesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-gray-100 h-64 rounded-lg" />
        ))}
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No businesses found in your areas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid Layout - 2 cols on mobile, 3 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {businesses.slice(0, displayLimit).map((business: any) => (
          <Card 
            key={business.id} 
            className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer"
            onClick={() => setLocation(`/business/${business.id}`)}
          >
            {/* Business Photo Header */}
            {business.profileImage && (
              <div className="relative h-24 bg-cover bg-center">
                <img
                  src={business.profileImage}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
            )}
            
            <CardContent className="p-3">
              <div className="mb-3">
                <h3 className="font-bold text-sm text-black dark:text-white leading-tight line-clamp-2 mb-1">{business.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {business.businessType || 'Business'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                  {business.businessDescription || business.services || 'Local business offering quality services'}
                </p>
              </div>

              <div className="space-y-1 mb-3">
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="text-xs truncate">{business.streetAddress || `${business.city}, ${business.state}`}</span>
                </div>
                {business.phoneNumber && (
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="text-xs truncate">{business.phoneNumber}</span>
                  </div>
                )}
                {business.website && (
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <Globe className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="text-xs truncate hover:text-blue-600 dark:hover:text-blue-400">Website</span>
                  </div>
                )}
              </div>

              {business.tags && business.tags.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {business.tags.slice(0, 2).map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-1">
                <Button 
                  size="sm" 
                  className="text-xs h-6 bg-blue-500 hover:bg-blue-600 text-white border-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation(`/business/${business.id}`);
                  }}
                >
                  Details
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-6 border-green-200 hover:bg-green-50 dark:border-green-700 dark:hover:bg-green-900"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation(`/business/${business.id}/offers`);
                  }}
                >
                  Offers
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More / Load Less buttons */}
      {businesses.length > 3 && (
        <div className="text-center py-4 space-x-3">
          {displayLimit < businesses.length && (
            <Button 
              variant="outline" 
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:border-gray-600"
              onClick={() => setDisplayLimit(Math.min(displayLimit + 3, businesses.length))}
            >
              Load More ({Math.min(3, businesses.length - displayLimit)} more businesses)
            </Button>
          )}
          {displayLimit > 3 && (
            <Button
              variant="outline"
              onClick={() => setDisplayLimit(3)}
              className="bg-gray-50 hover:bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white dark:border-gray-500"
            >
              Load Less
            </Button>
          )}
        </div>
      )}
    </div>
  );
}