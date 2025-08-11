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
}

export function PeopleDiscoveryWidget({ 
  people, 
  title = "Nearby Travelers",
  showSeeAll = true,
  userLocation = "Culver City",
  onPersonClick 
}: PeopleDiscoveryWidgetProps) {
  const [, setLocation] = useLocation();
  const { user: currentUser } = useContext(AuthContext);
  const currentUserId = currentUser?.id;
  const [displayCount, setDisplayCount] = React.useState(6); // Show 6 people initially (3x2 grid)

  const PersonWithCommonalities = ({ person }: { person: PersonCard }) => {
    // Fetch travel plans for this person to show travel destination
    const { data: travelPlans } = useQuery({
      queryKey: [`/api/travel-plans/${person.id}`],
      enabled: !!person.id
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
              <div className="mb-1">
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
              
              {/* Line 3: Countries and references stats */}
              <div className="mb-2">
                <p className="text-gray-500 dark:text-gray-500 text-xs truncate">
                  0 countries ⭐ 0 references
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

    // Use the EXACT same compatibility API that profile pages use
    const { data: compatibilityData } = useQuery({
      queryKey: [`/api/compatibility/${currentUserId}/${person.id}`],
      enabled: !!currentUserId && !!person.id && currentUserId !== person.id
    });

    // Debug logging
    React.useEffect(() => {
      if (compatibilityData) {
        console.log(`✅ PEOPLE DISCOVERY: User ${person.username} (${person.id}) compatibility data:`, compatibilityData);
      }
    }, [compatibilityData, person.username, person.id]);

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
            
            {/* Line 2: Current status - Nearby Local/Traveler in current city */}
            <div className="mb-1">
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
            
            {/* Line 3: Countries and references stats */}
            <div className="mb-2">
              <p className="text-gray-500 dark:text-gray-500 text-xs truncate">
                0 countries ⭐ 0 references
              </p>
            </div>
            
            {/* Things in Common Badge */}
            {compatibilityData && (compatibilityData as any).totalCommonalities !== undefined ? (
              <div className="inline-flex items-center gap-1 bg-green-500 rounded-full px-3 py-1">
                <Heart className="w-3 h-3 text-white" />
                <span className="text-white font-medium text-xs">
                  {(compatibilityData as any).totalCommonalities} things in common
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 bg-purple-500 rounded-full px-3 py-1">
                <span className="text-white font-medium text-xs">
                  Discovering...
                </span>
              </div>
            )}
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
      {/* People Grid - 3 Column Avatar Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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