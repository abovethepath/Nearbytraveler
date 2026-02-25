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
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 min-w-0">
        {visible.map((b: any) => {
          const title = b.businessName || b.name || b.username || "Business";
          const category = b.businessType || b.category || b.specialty;
          const city = b.city || b.sourceLocation?.city;
          const state = b.state || b.sourceLocation?.state;
          const country = b.country || b.sourceLocation?.country;
          const phone = b.phone || b.phoneNumber;
          const bioRaw = b.bio || b.description || b.businessDescription || b.about || "";
          const bio = stripHtml(bioRaw);
          const locationText = b.streetAddress || b.street_address || b.address
            ? `${b.streetAddress || b.street_address || b.address}, ${city}`
            : [city, state, country].filter(Boolean).join(", ");

          return (
            <div
              key={b.id}
              className="rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow cursor-pointer overflow-hidden flex flex-col min-w-0"
              onClick={() => setLocation(`/business/${b.id}`)}
            >
              {/* Large hero image */}
              {(b.logoUrl || b.profileImage) && (
                <div className="w-full h-48 sm:h-52 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <img
                    src={b.logoUrl || b.profileImage}
                    alt={title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="p-4 sm:p-5 flex flex-col flex-1 min-h-0">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg sm:text-xl leading-tight break-words">
                  {title}
                </h3>
                {category && (
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mt-1">{category}</p>
                )}

                {bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 leading-relaxed line-clamp-3">{bio}</p>
                )}

                <div className="mt-4 space-y-2">
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{phone}</span>
                    </a>
                  )}
                  {b.streetAddress && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{b.streetAddress}</span>
                    </div>
                  )}
                </div>

                <div className="mt-auto flex flex-row gap-2 pt-4">
                  <Button
                    className="flex-1 min-w-0 h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shrink-0"
                    onClick={(e) => { e.stopPropagation(); setLocation(`/business/${b.id}`); }}
                  >
                    View Business
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 min-w-0 h-11 border-2 border-orange-400 dark:border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-sm font-semibold shrink-0"
                    onClick={(e) => { e.stopPropagation(); setLocation(`/business/${b.id}/offers`); }}
                  >
                    <Tag className="h-4 w-4 mr-1.5 shrink-0" />
                    Deals
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