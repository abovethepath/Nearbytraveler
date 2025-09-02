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

// Helper functions for safe text processing
const stripHtml = (s?: string) => (s ? s.replace(/<[^>]+>/g, "").trim() : "");
const safeUrl = (u?: string) =>
  !u ? "" : /^https?:\/\//i.test(u) ? u : `https://${u}`;

export default function BusinessesGrid({ currentLocation, travelPlans = [] }: BusinessesGridProps) {
  const [, setLocation] = useLocation();
  const [displayLimit, setDisplayLimit] = useState(6);

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
      locations.push({
        city: currentDestination.destinationCity,
        state: currentDestination.destinationState || '',
        country: currentDestination.destinationCountry,
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
        <p className="text-gray-500">No businesses found in your areas</p>
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
            <Card key={b.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-4 md:p-5">
                {/* Header row */}
                <div className="flex items-start gap-3 min-w-0">
                  {/* Optional logo/avatar */}
                  {(b.logoUrl || b.profileImage) && (
                    <img
                      src={b.logoUrl || b.profileImage}
                      alt={title}
                      className="h-10 w-10 rounded-lg object-cover shrink-0"
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base md:text-lg break-words">
                      {title}
                    </h3>
                    {category && (
                      <div className="mt-1">
                        <span className="chip bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs">
                          {category}
                        </span>
                      </div>
                    )}

                    {/* Location row WITH STREET ADDRESS */}
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 min-w-0">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {/* Show street address first, then city */}
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
                    className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed
                               whitespace-normal break-words [overflow-wrap:anywhere] hyphens-auto
                               line-clamp-3 md:line-clamp-4"
                    title={bio}
                  >
                    {bio}
                  </p>
                )}

                {/* Contact row — wrap on small, use wrap-any for addresses */}
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {website && (
                    <a
                      href={safeUrl(website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline minw0"
                      title={website}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Globe className="h-4 w-4 shrink-0" />
                      <span className="truncate">{website}</span>
                    </a>
                  )}
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 minw0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="h-4 w-4 shrink-0" />
                      <span className="truncate">{phone}</span>
                    </a>
                  )}
                  {b.streetAddress && (
                    <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 minw0">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="wrap-any whitespace-normal">{b.streetAddress}</span>
                    </div>
                  )}
                  {b.openHours && (
                    <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 minw0">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span className="truncate">{b.openHours}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Button
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setLocation(`/business/${b.id}`)}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() =>
                      setLocation(
                        `/map?lat=${encodeURIComponent(
                          b.currentLatitude ?? b.latitude ?? ""
                        )}&lng=${encodeURIComponent(
                          b.currentLongitude ?? b.longitude ?? ""
                        )}`
                      )
                    }
                  >
                    Directions
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