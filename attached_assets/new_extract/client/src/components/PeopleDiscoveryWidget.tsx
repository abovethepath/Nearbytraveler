import React from "react";
import { useLocation } from "wouter";
import { MapPin, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
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
  const currentUserId = 16; // Current user for compatibility testing

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
              <h4 className="font-bold text-gray-900 dark:text-white text-base mb-1 truncate">
                {person.username}
              </h4>
              
              {/* Location Info */}
              <div className="mb-2 space-y-1">
                {/* Hometown - Always show */}
                <p className="text-gray-600 dark:text-gray-400 text-xs truncate">
                  🏠 {person.location.split(',')[0]}
                </p>
                
                {/* Current Travel Location - Show if traveling */}
                {travelPlans && Array.isArray(travelPlans) && travelPlans.length > 0 && (travelPlans as any)[0]?.status === 'active' && (
                  <p className="text-blue-600 dark:text-blue-400 text-xs truncate">
                    ✈️ {(travelPlans as any)[0]?.destinationCity || (travelPlans as any)[0]?.destination?.split(',')[0]}
                  </p>
                )}
              </div>
              
              <div className="inline-flex items-center gap-1 bg-blue-500 rounded-full px-3 py-1">
                <span className="text-white font-medium text-xs">
                  You
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
        className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer text-gray-900 dark:text-white relative h-64"
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
            {/* Username */}
            <h4 className="font-bold text-gray-900 dark:text-white text-base mb-1 truncate">
              {person.username}
            </h4>
            
            {/* Location Info */}
            <div className="mb-2 space-y-1">
              {/* Hometown - Always show */}
              <p className="text-gray-600 dark:text-gray-400 text-xs truncate">
                🏠 {person.location.split(',')[0]}
              </p>
              
              {/* Current Travel Location - Show if traveling */}
              {travelPlans && Array.isArray(travelPlans) && travelPlans.length > 0 && (travelPlans as any)[0]?.status === 'active' && (
                <p className="text-blue-600 dark:text-blue-400 text-xs truncate">
                  ✈️ {(travelPlans as any)[0]?.destinationCity || (travelPlans as any)[0]?.destination?.split(',')[0]}
                </p>
              )}
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
              <div className="inline-flex items-center gap-1 bg-blue-500 rounded-full px-3 py-1">
                <span className="text-white font-medium text-xs">
                  Loading...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* People Grid - 3 Column Avatar Cards */}
      {people.map((person) => (
        <PersonWithCommonalities key={person.id} person={person} />
      ))}
    </div>
  );
}

export default PeopleDiscoveryWidget;