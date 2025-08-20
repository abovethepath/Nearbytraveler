import React, { useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MapPin, Heart, Plane } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "@/App";
import type { User, UserCityInterest, TravelPlan } from "@/../../shared/schema";

interface PersonCard {
  id: number;
  username: string;
  name: string;
  profileImage?: string;
  location: string;
  distance?: string;
  commonInterests?: string[];
  userType: "traveler" | "local" | "business";
  isOnline?: boolean;
  currentUserId?: number;
}

interface PeopleDiscoveryWidgetProps {
  people: PersonCard[];
  title?: string;
  showSeeAll?: boolean;
  userLocation?: string;
  onPersonClick?: (person: PersonCard) => void;
  currentUserId?: number;
}

export function PeopleDiscoveryWidget({ 
  people, 
  title = "Nearby Travelers",
  showSeeAll = true,
  userLocation = "Culver City",
  onPersonClick,
  currentUserId: propCurrentUserId 
}: PeopleDiscoveryWidgetProps) {
  const [, setLocation] = useLocation();
  const { user: currentUser } = useContext(AuthContext);
  const currentUserId = propCurrentUserId || currentUser?.id;
  const [displayCount, setDisplayCount] = React.useState(6); // Show 6 people initially (3 rows x 2 cols)

  // Debug current user ID
  React.useEffect(() => {
    console.log(`🔍 PEOPLE DISCOVERY WIDGET: currentUser:`, currentUser?.username || 'null', 'ID:', currentUserId || 'undefined', 'prop ID:', propCurrentUserId || 'undefined');
  }, [currentUser, currentUserId, propCurrentUserId]);

  const PersonWithCommonalities = ({ person }: { person: PersonCard }) => {
    // Show loading state to prevent avatar blinking
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
      const timer = setTimeout(() => setIsLoading(false), 100);
      return () => clearTimeout(timer);
    }, []);

    // Fetch travel plans for this person to show travel destination
    const { data: travelPlans, isLoading: travelPlansLoading } = useQuery({
      queryKey: [`/api/travel-plans/${person.id}`],
      enabled: !!person.id && !isLoading,
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnReconnect: false,
      retry: false
    });

    // Fetch user data to get countries visited and references count
    const { data: userData, isLoading: userDataLoading } = useQuery<User>({
      queryKey: [`/api/users/${person.id}`],
      enabled: !!person.id && !isLoading,
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnReconnect: false,
      retry: false
    });

    // Fetch references count for this user
    const { data: referencesData, isLoading: referencesLoading } = useQuery({
      queryKey: [`/api/users/${person.id}/references`],
      enabled: !!person.id && !isLoading,
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnReconnect: false,
      retry: false
    });

    // Use the correct compatibility API endpoint
    const { data: compatibilityData, isLoading: compatibilityLoading } = useQuery({
      queryKey: [`/api/compatibility/${currentUserId}/${person.id}`],
      enabled: !!currentUserId && !!person.id && currentUserId !== person.id && !isLoading,
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnReconnect: false,
      retry: false
    });

    // Debug logging
    React.useEffect(() => {
      console.log(`🔍 PEOPLE DISCOVERY: User ${person.username} (${person.id}) currentUserId: ${currentUserId}, enabled: ${!!currentUserId && !!person.id && currentUserId !== person.id}`);
      console.log(`🔍 QUERY KEY: ["/api/compatibility/${currentUserId}/${person.id}"]`);
      if (compatibilityData) {
        console.log(`✅ PEOPLE DISCOVERY: User ${person.username} (${person.id}) compatibility data:`, compatibilityData);
      } else {
        console.log(`❌ PEOPLE DISCOVERY: No compatibility data for ${person.username} (${person.id})`);
      }
    }, [compatibilityData, person.username, person.id, currentUserId]);

    const getCountryFlag = (location: string) => {
      if (location.includes('United States') || location.includes('USA')) return '🇺🇸';
      if (location.includes('United Kingdom') || location.includes('UK')) return '🇬🇧';
      if (location.includes('Canada')) return '🇨🇦';
      if (location.includes('Australia')) return '🇦🇺';
      if (location.includes('Germany')) return '🇩🇪';
      if (location.includes('France')) return '🇫🇷';
      if (location.includes('Spain')) return '🇪🇸';
      if (location.includes('Italy')) return '🇮🇹';
      if (location.includes('Japan')) return '🇯🇵';
      if (location.includes('Mexico')) return '🇲🇽';
      return '🌍';
    };

    const handleAvatarClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setLocation(`/profile/${person.id}`);
    };

    const handleCardClick = () => {
      if (onPersonClick) {
        onPersonClick(person);
      } else {
        // Navigate to profile page
        setLocation(`/profile/${person.id}`);
      }
    };

    // Show loading state to prevent blinking
    if (isLoading || compatibilityLoading) {
      return (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-96 animate-pulse">
          <div className="flex flex-col h-full">
            <div className="flex-1 flex items-center justify-center">
              <div className="w-48 h-48 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
            </div>
            <div className="text-center mt-4">
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mx-auto"></div>
            </div>
          </div>
        </div>
      );
    }

    // Get current travel destination if different from hometown
    const getCurrentLocation = () => {
      const activeTravelPlan = travelPlans && Array.isArray(travelPlans) ? 
        (travelPlans as any).find((plan: any) => plan.status === 'active') : null;
      
      if (activeTravelPlan) {
        const travelDestination = activeTravelPlan.destinationCity || activeTravelPlan.destination?.split(',')[0];
        const hometown = person.location?.split(',')[0];
        
        // Only show travel destination if it's different from hometown
        if (travelDestination && travelDestination !== hometown) {
          return {
            isTraveling: true,
            currentLocation: travelDestination,
            hometown: hometown || 'Hometown'
          };
        }
      }
      
      return {
        isTraveling: false,
        currentLocation: person.location?.split(',')[0] || 'Hometown',
        hometown: person.location?.split(',')[0] || 'Hometown'
      };
    };

    const locationInfo = getCurrentLocation();

    // NEW: count + list the top common items
    const compatData = compatibilityData as any;
    const countInCommon =
      (compatData?.sharedInterests?.length || 0) +
      (compatData?.sharedActivities?.length || 0) +
      (compatData?.sharedEvents?.length || 0);

    const topCommon: string[] = [
      ...(compatData?.sharedInterests ?? []),
      ...(compatData?.sharedActivities ?? []),
      ...((compatData?.sharedEvents ?? []).map((e: any) => e?.title).filter(Boolean)),
    ].slice(0, 3);

    // NEW: figure out an upcoming/active destination
    const getTravelBlurb = () => {
      const plans = Array.isArray(travelPlans) ? (travelPlans as any[]) : [];

      const active = plans.find(p => p?.status === 'active');
      if (active) {
        const city = active.destinationCity || active.destination?.split(',')[0];
        if (city && city !== locationInfo.hometown) return `Traveling now: ${city}`;
      }

      const upcoming = plans
        .filter(p => p?.status === 'upcoming')
        .sort((a, b) => new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime())[0];

      if (upcoming) {
        const city = upcoming.destinationCity || upcoming.destination?.split(',')[0];
        if (city && city !== locationInfo.hometown) return `Next trip: ${city}`;
      }

      return null;
    };

    const travelBlurb = getTravelBlurb();

    // Don't show commonalities for the current user themselves
    if (person.id === currentUserId) {
      return (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 text-gray-900 dark:text-white relative h-96">
          <div className="flex flex-col h-full">
            {/* Large Profile Photo - Clickable */}
            <div className="flex-1 flex items-center justify-center">
              <div 
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleAvatarClick}
              >
                {person.profileImage ? (
                  <img 
                    src={person.profileImage} 
                    alt={person.name}
                    loading="lazy"
                    className="w-48 h-48 object-cover rounded-lg border-2 border-white dark:border-gray-600 shadow-lg"
                  />
                ) : (
                  <div className="w-48 h-48 text-6xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg flex items-center justify-center border-2 border-white dark:border-gray-600 shadow-lg">
                    {person.username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
            </div>
            
            {/* Bottom Section */}
            <div className="text-center mt-4">
              {/* Username */}
              <h4 className="font-bold text-gray-900 dark:text-white text-xl mb-2 truncate">
                @{person.username}
              </h4>
              
              {/* Location Info */}
              <div className="mb-2 space-y-1">
                {locationInfo.isTraveling ? (
                  <>
                    <div className="flex items-center justify-center gap-1">
                      <Plane className="w-4 h-4 text-blue-500" />
                      <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                        Currently in {locationInfo.currentLocation}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Hometown: {locationInfo.hometown}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Hometown: {locationInfo.hometown}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Stats */}
              <div className="mb-2">
                <p className="text-gray-500 dark:text-gray-500 text-sm">
                  {(userData?.countriesVisited && Array.isArray(userData.countriesVisited) ? userData.countriesVisited.length : 0)} countries ⭐ {(referencesData && Array.isArray(referencesData) ? referencesData.length : 0)} references
                </p>
              </div>

              {/* NEW: Traveling to / Next trip */}
              {travelBlurb && (
                <div className="mb-2">
                  <p className="text-gray-700 dark:text-gray-300 text-sm">{travelBlurb}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer text-gray-900 dark:text-white relative h-96"
        onClick={handleCardClick}
      >
        {/* Online Status - Top Right */}
        {person.isOnline && (
          <div className="absolute top-6 right-6">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex flex-col h-full">
          {/* Large Profile Photo - Clickable */}
          <div className="flex-1 flex items-center justify-center">
            <div 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleAvatarClick}
            >
              {person.profileImage ? (
                <img 
                  src={person.profileImage} 
                  alt={person.name}
                  className="w-48 h-48 object-cover rounded-lg border-2 border-white dark:border-gray-600 shadow-lg"
                  loading="lazy"
                />
              ) : (
                <div className="w-48 h-48 text-6xl bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-lg flex items-center justify-center border-2 border-white dark:border-gray-600 shadow-lg">
                  {person.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="text-center mt-4">
            {/* Username */}
            <h4 className="font-bold text-gray-900 dark:text-white text-xl mb-2 truncate">
              @{person.username}
            </h4>
            
            {/* Location Info */}
            <div className="mb-2 space-y-1">
              {locationInfo.isTraveling ? (
                <>
                  <div className="flex items-center justify-center gap-1">
                    <Plane className="w-4 h-4 text-blue-500" />
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                      Currently in {locationInfo.currentLocation}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Hometown: {locationInfo.hometown}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Hometown: {locationInfo.hometown}
                  </p>
                </div>
              )}
            </div>
            
            {/* Stats */}
            <div className="mb-2">
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                {(userData?.countriesVisited && Array.isArray(userData.countriesVisited) ? userData.countriesVisited.length : 0)} countries ⭐ {(referencesData && Array.isArray(referencesData) ? referencesData.length : 0)} references
              </p>
            </div>

            {/* NEW: Traveling to / Next trip */}
            {travelBlurb && (
              <div className="mb-2">
                <p className="text-gray-700 dark:text-gray-300 text-sm">{travelBlurb}</p>
              </div>
            )}

            {/* NEW: Things in common */}
            {countInCommon > 0 && (
              <div className="mb-2">
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  <span className="font-semibold">{countInCommon} Things In Common:</span>{' '}
                  {topCommon.join(' • ')}
                </p>
              </div>
            )}

            {/* Click to see more details */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                Click to view full profile
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        {showSeeAll && (
          <button 
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
            onClick={() => setLocation('/discover')}
          >
            See All
          </button>
        )}
      </div>

      {/* People Grid - 2 per row on all screen sizes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {people.slice(0, displayCount).map((person) => (
          <PersonWithCommonalities 
            key={person.id} 
            person={person}
          />
        ))}
      </div>

      {/* Show More Button */}
      {people.length > displayCount && (
        <div className="text-center mt-6">
          <button
            onClick={() => setDisplayCount(prev => prev + 4)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Show More
          </button>
        </div>
      )}
    </div>
  );
}

export default PeopleDiscoveryWidget;