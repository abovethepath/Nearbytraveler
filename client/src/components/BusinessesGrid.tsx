import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Tag } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getCurrentTravelDestination } from "@/lib/dateUtils";
import { getApiBaseUrl } from "@/lib/queryClient";

interface BusinessesGridProps {
  currentLocation?: {
    city: string;
    state: string;
    country: string;
  } | null;
  travelPlans?: any[];
}

// Helper functions for safe text processing
const stripHtml = (s?: string) => (s ? s.replace(/<[^>]+>/g, "").trim() : "");
const safeUrl = (u?: string) =>
  !u ? "" : /^https?:\/\//i.test(u) ? u : `https://${u}`;

export default function BusinessesGrid({ currentLocation, travelPlans = [] }: BusinessesGridProps) {
  const [, setLocation] = useLocation();
  const [displayLimit, setDisplayLimit] = useState(6);

  // Determine current location for business discovery - just where user is RIGHT NOW
  const currentLocationForBusinesses = useMemo(() => {
    // Check if user is currently traveling
    const currentDestination = getCurrentTravelDestination(travelPlans);
    if (currentDestination) {
      // User is traveling - show businesses from travel destination
      return {
        city: currentDestination.destinationCity,
        state: currentDestination.destinationState || '',
        country: currentDestination.destinationCountry,
        type: 'current_travel'
      };
    }
    
    // User is at home - show businesses from hometown
    if (currentLocation?.city) {
      return { 
        ...currentLocation, 
        type: 'hometown'
      };
    }
    
    return null;
  }, [currentLocation, travelPlans]);

  // Fetch businesses from current location only
  const { data: businesses = [], isLoading: businessesLoading } = useQuery({
    queryKey: ['/api/businesses/current-location', currentLocationForBusinesses ? `${currentLocationForBusinesses.city}-${currentLocationForBusinesses.state}-${currentLocationForBusinesses.country}` : 'none'],
    queryFn: async () => {
      if (!currentLocationForBusinesses) return [];
      
      console.log('BusinessesGrid - Fetching businesses from current location:', currentLocationForBusinesses);

      // Fetch businesses from current city only
      const location = currentLocationForBusinesses;
      const cityName = location.city;
      console.log(`BusinessesGrid - Fetching businesses for ${location.type}:`, cityName);

      try {
        const params = new URLSearchParams({
          city: location.city,
          state: location.state || '',
          country: location.country || ''
        });
        
        const response = await fetch(`${getApiBaseUrl()}/api/businesses?${params}`);
        if (!response.ok) throw new Error(`Failed to fetch businesses for ${cityName}`);
        const data = await response.json();
        console.log(`BusinessesGrid - ${location.type} businesses API response:`, data.length, 'businesses for', cityName);
        return data.map((business: any) => ({ ...business, sourceLocation: location }));
      } catch (error) {
        console.error(`BusinessesGrid - Error fetching businesses for ${cityName}:`, error);
        return [];
      }
    },
    enabled: !!currentLocationForBusinesses
  });

  if (!currentLocationForBusinesses) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading location data...</p>
      </div>
    );
  }

  if (businessesLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 h-64 rounded-lg" />
        ))}
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No businesses found in your current area</p>
      </div>
    );
  }

  const visible = businesses.slice(0, displayLimit);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {visible.map((b: any) => {
          const title = b.businessName || b.name || b.username || "Business";
          const category = b.businessType || b.category || b.specialty;
          const city = b.city || b.sourceLocation?.city;
          const state = b.state || b.sourceLocation?.state;
          const country = b.country || b.sourceLocation?.country;
          const website = b.website || b.url || b.site;
          const phone = b.phone || b.phoneNumber;
          const bioRaw = b.bio || b.description || b.businessDescription || b.about || "";
          const bio = stripHtml(bioRaw);

          return (
            <Card key={b.id} className="overflow-hidden hover:shadow-lg transition-shadow min-w-0">
              <CardContent className="p-5 md:p-6">
                {/* Header row */}
                <div className="flex items-start gap-4 min-w-0">
                  {(b.logoUrl || b.profileImage) && (
                    <img
                      src={b.logoUrl || b.profileImage}
                      alt={title}
                      className="h-16 w-16 rounded-lg object-cover shrink-0"
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base md:text-lg leading-tight" title={title}>
                      {title}
                    </h3>
                    {category && (
                      <Badge variant="secondary" className="mt-1.5 text-xs font-medium">
                        {category}
                      </Badge>
                    )}
                    <div className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 min-w-0">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {b.streetAddress || b.street_address || b.address ? 
                          `${b.streetAddress || b.street_address || b.address}, ${city}` :
                          [city, state, country].filter(Boolean).join(", ")
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio — safe wrapping + clamp */}
                {bio && (
                  <p
                    className="mt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed
                               whitespace-normal break-words [overflow-wrap:anywhere] hyphens-auto
                               line-clamp-3 md:line-clamp-4"
                    title={bio}
                  >
                    {bio}
                  </p>
                )}

                {/* Contact info */}
                <div className="mt-4 space-y-2">
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 min-w-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="h-4 w-4 shrink-0" />
                      <span className="truncate">{phone}</span>
                    </a>
                  )}
                  {b.streetAddress && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 min-w-0">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{b.streetAddress}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-3">
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
                    onClick={() => setLocation(`/business/${b.id}`)}
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-orange-300 dark:border-orange-600 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-sm py-2"
                    onClick={() => setLocation(`/business/${b.id}/offers`)}
                  >
                    <Tag className="h-4 w-4 mr-1.5" />
                    Deals
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Show more */}
      {businesses.length > displayLimit && (
        <div className="text-center mt-6">
          <Button onClick={() => setDisplayLimit((n) => n + 6)}>
            Show more ({businesses.length - displayLimit} remaining)
          </Button>
        </div>
      )}
    </>
  );
}