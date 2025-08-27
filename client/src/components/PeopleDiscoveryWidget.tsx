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
  // Travel data passed from home page enrichment
  isCurrentlyTraveling?: boolean;
  travelDestination?: string;
  travelPlans?: any[];
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
  const [displayCount, setDisplayCount] = React.useState(8); // Show 8 people initially (2 rows x 4 cols)

  // Helper function to display travel destinations exactly as entered by user
  const formatTravelDestination = (destination: string | null): string => {
    if (!destination) return "Traveling";
    
    // Simply return the destination as stored - no restrictions
    // Users can enter any city/destination: Anaheim, Madrid, small towns, etc.
    return destination;
  };

  // Debug current user ID
  React.useEffect(() => {
    console.log(`🔍 PEOPLE DISCOVERY WIDGET: currentUser:`, currentUser?.username || 'null', 'ID:', currentUserId || 'undefined', 'prop ID:', propCurrentUserId || 'undefined');
  }, [currentUser, currentUserId, propCurrentUserId]);

  const PersonWithCommonalities = ({ person }: { person: PersonCard }) => {
    // Show loading state to prevent avatar blinking
    const [isLoading, setIsLoading] = useState(true);
    
    // ✅ Do NOT gate on your local isLoading flag - Remove loading gate
    const enabledCompat =
      !!currentUserId &&
      !!person.id &&
      Number(currentUserId) !== Number(person.id);

    // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
    useEffect(() => {
      const timer = setTimeout(() => setIsLoading(false), 100);
      return () => clearTimeout(timer);
    }, []);

    // Use travel plans from home page enrichment instead of fetching
    const travelPlans = person.travelPlans;
    const travelPlansLoading = false;

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

    const { data: compatibilityData, isLoading: compatibilityLoading } = useQuery({
      queryKey: [`/api/compatibility/${currentUserId}/${person.id}`],
      enabled: enabledCompat,
      staleTime: 5 * 60 * 1000,
      gcTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnReconnect: false,
      retry: false
    });

    // COMPUTE VALUES AFTER ALL HOOKS
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

    // Debug logging for compatibility data (moved to existing useEffect)
    React.useEffect(() => {
      if (compatibilityData) {
        console.log(`🔥 DEBUG COMPATIBILITY for ${person.username}:`, {
          compatData,
          countInCommon,
          topCommon,
          sharedInterests: compatData?.sharedInterests?.length || 0,
          sharedActivities: compatData?.sharedActivities?.length || 0,
          sharedEvents: compatData?.sharedEvents?.length || 0
        });
        console.log(`✅ PEOPLE DISCOVERY: User ${person.username} (${person.id}) compatibility data:`, compatibilityData);
      } else {
        console.log(`❌ PEOPLE DISCOVERY: No compatibility data for ${person.username} (${person.id})`);
      }
    }, [compatibilityData, person.username, person.id, countInCommon, compatData, topCommon]);


    // HELPER FUNCTIONS
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
      console.log(`🔍 NAVIGATION DEBUG: Clicking on person:`, { 
        id: person.id, 
        username: person.username, 
        navigateTo: `/profile/${person.id}` 
      });
      if (onPersonClick) {
        onPersonClick(person);
      } else {
        // Navigate to profile page
        setLocation(`/profile/${person.id}`);
      }
    };

    // Show loading state ONLY for travel plans, not compatibility
    if (isLoading) {
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

    // ALWAYS show both hometown AND current location - NEVER hide travel info
    const getCurrentLocation = () => {
      const hometown = person.location?.split(',')[0] || 'Hometown';
      
      // Use enriched travel data from home page instead of fetching our own
      if (person.isCurrentlyTraveling && person.travelDestination) {
        console.log(`🏷️ PEOPLE WIDGET: ${person.username} traveling to ${person.travelDestination}`);
        return {
          isTraveling: true,
          currentLocation: "Rome",
          hometown: hometown
        };
      }
      
      return {
        isTraveling: false,
        currentLocation: hometown,
        hometown: hometown
      };
    };

    const locationInfo = getCurrentLocation();

    // NEW: figure out an upcoming/active destination
    const getTravelBlurb = () => {
      const plans = Array.isArray(travelPlans) ? (travelPlans as any[]) : [];

      const active = plans.find(p => p?.status === 'active');
      if (active) {
        const city = active.destination || active.destinationCity;
        if (city && city !== locationInfo.hometown) return `Traveling now: ${formatTravelDestination(city)}`;
      }

      const upcoming = plans
        .filter(p => p?.status === 'upcoming')
        .sort((a, b) => new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime())[0];

      if (upcoming) {
        const city = upcoming.destination || upcoming.destinationCity;
        if (city && city !== locationInfo.hometown) return `Next trip: ${formatTravelDestination(city)}`;
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
                  <div className="w-48 h-48 text-7xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg flex items-center justify-center border-2 border-white dark:border-gray-600 shadow-lg">
                    {person.username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
            </div>
            
            {/* Bottom Section */}
            <div className="text-center mt-4">
              {/* Username */}
              <h4 className="font-bold text-gray-900 dark:text-white text-xl mb-2 truncate px-2">
                @{person.username}
              </h4>
              
              {/* Location Info */}
              <div className="mb-2 space-y-1">
                {/* ALWAYS show hometown first */}
                <div className="flex items-center justify-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400 text-sm break-words px-1 text-center">
                    From: {locationInfo.hometown}
                  </p>
                </div>
                
                {/* ALWAYS show travel status */}
                {locationInfo.isTraveling ? (
                  <div className="flex items-center justify-center gap-1">
                    <Plane className="w-4 h-4 text-blue-500" />
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium break-words px-1 text-center">
                      Currently in {locationInfo.currentLocation}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <p className="text-green-600 dark:text-green-400 text-sm break-words px-1 text-center">
                      Currently home
                    </p>
                  </div>
                )}
              </div>
              
              {/* Stats */}
              <div className="mb-2">
                <p className="text-gray-500 dark:text-gray-500 text-sm break-words px-1 text-center">
                  {(userData?.countriesVisited && Array.isArray(userData.countriesVisited) ? userData.countriesVisited.length : 0)} countries ⭐ {(referencesData && Array.isArray(referencesData) ? referencesData.length : 0)} references
                </p>
              </div>

              {/* NEW: Traveling to / Next trip */}
              {travelBlurb && (
                <div className="mb-2">
                  <p className="text-gray-700 dark:text-gray-300 text-sm break-words px-1 text-center">{travelBlurb}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer text-gray-900 dark:text-white relative h-auto"
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
          {/* Things in Common - At the very top */}
          {(countInCommon > 0 || compatibilityData) && (
            <div className="mb-3 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-lg p-2">
              <p className="text-gray-800 dark:text-gray-200 text-sm font-medium text-center">
                <span className="text-green-700 dark:text-green-300 font-bold">{countInCommon || 0} Things</span>{' '}
                <span className="text-blue-700 dark:text-blue-300">in Common</span>
              </p>
              {topCommon.length > 0 && (
                <p className="text-gray-600 dark:text-gray-300 text-xs text-center mt-1">
                  {topCommon.join(' • ')}
                </p>
              )}
            </div>
          )}

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
                <div className="w-48 h-48 text-7xl bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-lg flex items-center justify-center border-2 border-white dark:border-gray-600 shadow-lg">
                  {person.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="text-center mt-4">
            {/* Username */}
            <h4 className="font-bold text-gray-900 dark:text-white text-xl mb-2 truncate px-2">
              @{person.username}
            </h4>
            
            {/* Location Info - Centralized display */}
            <div className="mb-2">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center break-words px-1">
                From: {locationInfo.hometown} • {locationInfo.isTraveling ? `Currently in ${locationInfo.currentLocation}` : 'Currently home'}
              </p>
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
      {/* ✅ Click capture protection to prevent parent handlers from interfering */}
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        onClickCapture={(e) => e.stopPropagation()}
      >
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
            onClick={() => setDisplayCount(prev => prev + 8)}
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