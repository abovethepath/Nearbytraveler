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
      <div className="space-y-4 sm:grid sm:grid-cols-2 xl:grid-cols-3 sm:gap-4 sm:space-y-0">
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
          const locationText = b.streetAddress || b.street_address || b.address
            ? `${b.streetAddress || b.street_address || b.address}, ${city}`
            : [city, state, country].filter(Boolean).join(", ");

          return (
            <div
              key={b.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
              onClick={() => setLocation(`/business/${b.id}`)}
            >
              {/* Mobile: horizontal layout */}
              <div className="flex sm:hidden p-4 gap-4">
                {(b.logoUrl || b.profileImage) && (
                  <img
                    src={b.logoUrl || b.profileImage}
                    alt={title}
                    className="h-20 w-20 rounded-lg object-cover shrink-0"
                    loading="lazy"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                    {title}
                  </h3>
                  {category && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{category}</p>
                  )}
                  {bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{bio}</p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{locationText}</span>
                  </div>
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1 hover:text-gray-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="h-3 w-3 shrink-0" />
                      <span>{phone}</span>
                    </a>
                  )}
                  <div className="flex gap-2 mt-2.5">
                    <Button
                      size="sm"
                      className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      onClick={(e) => { e.stopPropagation(); setLocation(`/business/${b.id}`); }}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-4 border-orange-300 dark:border-orange-600 text-orange-600 dark:text-orange-400 text-xs"
                      onClick={(e) => { e.stopPropagation(); setLocation(`/business/${b.id}/offers`); }}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      Deals
                    </Button>
                  </div>
                </div>
              </div>

              {/* Desktop: vertical card layout */}
              <div className="hidden sm:block p-5">
                <div className="flex items-start gap-4 min-w-0">
                  {(b.logoUrl || b.profileImage) && (
                    <img
                      src={b.logoUrl || b.profileImage}
                      alt={title}
                      className="h-14 w-14 rounded-lg object-cover shrink-0"
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight">{title}</h3>
                    {category && (
                      <Badge variant="secondary" className="mt-1 text-xs">{category}</Badge>
                    )}
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{locationText}</span>
                    </div>
                  </div>
                </div>
                {bio && (
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{bio}</p>
                )}
                <div className="mt-3 space-y-1">
                  {phone && (
                    <a href={`tel:${phone}`} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700" onClick={(e) => e.stopPropagation()}>
                      <Phone className="h-3.5 w-3.5 shrink-0" /><span>{phone}</span>
                    </a>
                  )}
                  {b.streetAddress && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{b.streetAddress}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs" onClick={(e) => { e.stopPropagation(); setLocation(`/business/${b.id}`); }}>View</Button>
                  <Button size="sm" variant="outline" className="flex-1 border-orange-300 text-orange-600 text-xs" onClick={(e) => { e.stopPropagation(); setLocation(`/business/${b.id}/offers`); }}>
                    <Tag className="h-3.5 w-3.5 mr-1" />Deals
                  </Button>
                </div>
              </div>
            </div>
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