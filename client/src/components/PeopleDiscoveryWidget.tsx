import React, { useContext } from "react";
import { useLocation } from "wouter";
import { MapPin, Heart } from "lucide-react";
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
  totalCommonalities?: number;
  currentUserId?: number;
}

interface PeopleDiscoveryWidgetProps {
  people: PersonCard[];
  title?: string;
  showSeeAll?: boolean;
  userLocation?: string;
  onPersonClick?: (person: PersonCard) => void;
  currentUserId?: number; // Add explicit currentUserId prop
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
  const [displayCount, setDisplayCount] = React.useState(6); // Show 6 people initially (3x2 grid)

  // Debug current user ID
  React.useEffect(() => {
    console.log(`🔍 PEOPLE DISCOVERY WIDGET: currentUser:`, currentUser?.username || 'null', 'ID:', currentUserId || 'undefined', 'prop ID:', propCurrentUserId || 'undefined');
  }, [currentUser, currentUserId, propCurrentUserId]);

  const PersonWithCommonalities = ({ person }: { person: PersonCard }) => {
    // Fetch travel plans for this person to show travel destination
    const { data: travelPlans } = useQuery({
      queryKey: [`/api/travel-plans/${person.id}`],
      enabled: !!person.id,
      staleTime: 60 * 60 * 1000, // 1 hour - very long to prevent blinking
      gcTime: 2 * 60 * 60 * 1000, // 2 hours
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnReconnect: false
    });

    // Don't show commonalities for the current user themselves
    if (person.id === currentUserId) {
      return (
        <div
          className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer text-gray-900 dark:text-white relative h-64"
          onClick={() => setLocation(`/profile/${person.id}`)}
        >
          {/* Main Content */}
          <div className="flex flex-col h-full">
            {/* Large Profile Photo */}
            <div className="flex-1 flex items-center justify-center mt-3">
              {person.profileImage ? (
                <img 
                  src={person.profileImage} 
                  alt={person.name}
                  loading="lazy"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              ) : (
                <div className="w-32 h-32 text-6xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg flex items-center justify-center">
                  {person.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            
            {/* Bottom Section */}
            <div className="text-center pb-2">
              {/* Line 1: Username with @ prefix */}
              <h4 className="font-bold text-gray-900 dark:text-white text-base mb-1 truncate">
                @{person.username}
              </h4>
              
              {/* Line 2: Current status - Nearby Local/Traveler in current city */}
              <div className="mb-1 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                {travelPlans && Array.isArray(travelPlans) && travelPlans.length > 0 && (travelPlans as any)[0]?.status === 'active' ? (
                  <p className="text-gray-600 dark:text-gray-400 text-xs truncate">
                    Nearby Traveler in {(travelPlans as any)[0]?.destinationCity || (travelPlans as any)[0]?.destination?.split(',')[0]}
                  </p>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-xs truncate">
                    Nearby Local in {person.location || 'Hometown'}
                  </p>
                )}
              </div>
              
              {/* Line 3: Countries and references + ALWAYS hometown */}
              <div className="mb-2">
                <p className="text-gray-500 dark:text-gray-500 text-xs truncate">
                  0 countries ⭐ 0 references • Nearby Local in {person.location?.split(',')[0] || 'Hometown'}
                </p>
              </div>
              
              <div className="inline-flex items-center gap-1 bg-blue-500 rounded-full px-3 py-1">
                <span className="text-white font-medium text-xs">
                  Your Profile
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Use the correct compatibility API endpoint
    const { data: compatibilityData } = useQuery({
      queryKey: [`/api/compatibility/${currentUserId}/${person.id}`],
      enabled: !!currentUserId && !!person.id && currentUserId !== person.id,
      staleTime: 60 * 60 * 1000, // 1 hour - very long to prevent blinking
      gcTime: 2 * 60 * 60 * 1000, // 2 hours
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnReconnect: false
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

    const handlePersonClick = () => {
      if (onPersonClick) {
        onPersonClick(person);
      } else {
        setLocation(`/profile/${person.id}`);
      }
    };

    return (
      <div
        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 hover:shadow-lg transition-all duration-200 cursor-pointer text-gray-900 dark:text-white relative h-72"
        onClick={handlePersonClick}
      >
        {/* Online Status - Top Right */}
        {person.isOnline && (
          <div className="absolute top-3 right-3">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex flex-col h-full">
          {/* Large Profile Photo */}
          <div className="flex-1 flex items-center justify-center mt-1">
            {person.profileImage ? (
              <img 
                src={person.profileImage} 
                alt={person.name}
                className="w-36 h-36 object-cover rounded-lg border-2 border-white dark:border-gray-600 shadow-sm"
              />
            ) : (
              <div className="w-36 h-36 text-4xl bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-lg flex items-center justify-center border-2 border-white dark:border-gray-600 shadow-sm">
                {person.username?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>
          
          {/* Bottom Section */}
          <div className="text-center pb-2">
            {/* Line 1: Username with @ prefix */}
            <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1 truncate">
              @{person.username}
            </h4>
            
            {/* Line 2: Current location - where they are currently */}
            <div className="mb-1 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              {(() => {
                // Find current travel plan based on status
                console.log('🧭 Travel plans for user', person.username, ':', travelPlans);
                const currentTravel = travelPlans && Array.isArray(travelPlans) ? 
                  (travelPlans as any).find((plan: any) => plan.status === 'active' || plan.status === 'current') : null;
                
                console.log('🧭 Current travel plan:', currentTravel);
                
                if (currentTravel) {
                  const cityName = currentTravel.destinationCity || currentTravel.destination_city || currentTravel.destination?.split(',')[0];
                  console.log('🧭 Using travel destination:', cityName);
                  return (
                    <p className="text-gray-600 dark:text-gray-400 text-xs truncate">
                      Traveling in {cityName || 'Unknown destination'}
                    </p>
                  );
                }
                
                console.log('🧭 No active travel, using location:', person.location);
                return (
                  <p className="text-gray-600 dark:text-gray-400 text-xs truncate">
                    Currently in {person.location?.split(',')[0] || 'Unknown'}
                  </p>
                );
              })()}
            </div>
            
            {/* Line 3: Hometown */}
            <div className="mb-1">
              <p className="text-gray-500 dark:text-gray-500 text-xs truncate">
                From {(person as any).hometownCity || person.location?.split(',')[0] || 'Unknown hometown'}
              </p>
            </div>
            
            {/* Line 4: Things in Common */}
            <div className="mb-3">
              {compatibilityData && (compatibilityData as any).totalCommonalities !== undefined ? (
                <p className="text-green-600 dark:text-green-400 text-xs font-medium">
                  {(compatibilityData as any).totalCommonalities} things in common
                </p>
              ) : (
                <p className="text-purple-600 dark:text-purple-400 text-xs">
                  Calculating compatibility...
                </p>
              )}
            </div>
            
            {/* Interested Button */}
            <div className="mb-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation(`/profile/${person.id}`);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                data-testid={`button-interested-${person.id}`}
              >
                Interested
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const displayedPeople = people.slice(0, displayCount);
  const hasMore = people.length > displayCount;
  const showingAll = displayCount >= people.length;

  return (
    <div className="space-y-4">
      {/* People Grid - 4 Column Avatar Cards with smaller gap */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {displayedPeople.map((person) => (
          <PersonWithCommonalities key={person.id} person={person} />
        ))}
      </div>
      
      {/* Load More / Load Less buttons */}
      {people.length > 6 && (
        <div className="text-center pt-4">
          {!showingAll ? (
            <button
              onClick={() => setDisplayCount(people.length)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              data-testid="button-load-more-people"
            >
              Load More ({people.length - displayCount} more)
            </button>
          ) : (
            <button
              onClick={() => setDisplayCount(6)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              data-testid="button-load-less-people"
            >
              Load Less
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default PeopleDiscoveryWidget;