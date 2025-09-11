import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SimpleAvatar } from "./simple-avatar";

export interface User {
  id: number;
  username: string;
  name?: string;
  bio?: string;
  location?: string;
  hometownCity?: string;
  hometownState?: string;
  hometownCountry?: string;
  profileImage?: string;
  interests?: string[];
  isCurrentlyTraveling?: boolean;
  travelDestination?: string;
}

interface UserCardProps {
  user: User;
  searchLocation?: string;
  currentUserId?: number;
  isCurrentUser?: boolean;
  showCompatibilityScore?: boolean;
  compatibilityData?: any;
}

function getCurrentOrNextTrip(travelPlans: any[]) {
  const now = new Date();
  
  // Find current trip (ongoing)
  const currentTrip = travelPlans.find(plan => {
    const start = new Date(plan.startDate);
    const end = new Date(plan.endDate);
    return now >= start && now <= end;
  });
  
  if (currentTrip) {
    return { ...currentTrip, isCurrent: true };
  }
  
  // Find next upcoming trip
  const upcomingTrips = travelPlans
    .filter(plan => new Date(plan.startDate) > now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
  if (upcomingTrips.length > 0) {
    return { ...upcomingTrips[0], isCurrent: false };
  }
  
  return null;
}

export default function UserCard({ 
  user, 
  searchLocation, 
  currentUserId,
  isCurrentUser = false,
  showCompatibilityScore = false,
  compatibilityData
}: UserCardProps) {
  
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Direct navigation without flash
    window.history.pushState({}, '', `/profile/${user.id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const getLocation = () => {
    if (user.hometownCity && user.hometownCountry) {
      return `${user.hometownCity}, ${user.hometownCountry}`;
    }
    return user.location || "Location not set";
  };

  return (
    <Card 
      className="user-card border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] rounded-xl h-96"
      onClick={handleCardClick}
      data-testid={`user-card-${user.id}`}
    >
      <CardContent className="p-6 h-full flex flex-col">
        {/* User Info */}
        <div className="space-y-4 flex-1 flex flex-col">
          {/* Large LinkedIn-style Avatar */}
          <div className="flex justify-center">
            <SimpleAvatar 
              user={user} 
              size="xl" 
              className="border-3 border-white dark:border-gray-600 shadow-lg w-24 h-24 sm:w-28 sm:h-28"
            />
          </div>
          
          {/* Name prominently displayed LinkedIn style */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate mb-1">
              @{user.username}
            </h3>
          </div>
          
          {/* Location and Travel Info - LinkedIn subtitle style */}
          <div className="space-y-3">
            {(() => {
              // Check if user has travel plans data and use new logic
              if ((user as any).travelPlans && Array.isArray((user as any).travelPlans)) {
                const currentOrNextTrip = getCurrentOrNextTrip((user as any).travelPlans);
                if (currentOrNextTrip) {
                  return (
                    <div className="flex items-center justify-center gap-2 text-base font-medium text-blue-600 dark:text-blue-400">
                      {currentOrNextTrip.isCurrent ? '🧳' : '✈️'} 
                      <span className="truncate">
                        {currentOrNextTrip.isCurrent ? 'Traveling to' : 'Next trip to'} {currentOrNextTrip.destination.split(',')[0]}
                      </span>
                    </div>
                  );
                }
              }
              
              // Fallback to existing logic for backward compatibility
              if (user.isCurrentlyTraveling && user.travelDestination) {
                return (
                  <div className="flex items-center justify-center gap-2 text-base font-medium text-blue-600 dark:text-blue-400">
                    🧳 <span className="truncate">Traveling to {user.travelDestination.split(',')[0]}</span>
                  </div>
                );
              }
              
              return null;
            })() as React.ReactNode}
            <div className="flex items-center justify-center gap-2 text-base text-gray-600 dark:text-gray-400">
              🏠 <span className="truncate">Local in {user.hometownCity ? user.hometownCity.split(',')[0] : getLocation()}</span>
            </div>
          </div>
          
          {/* Bio - LinkedIn description style */}
          {user.bio && (() => {
            // Remove "Born: [date]" information from bio display
            const cleanBio = String(user.bio)
              .replace(/Born:\s*[^\n]*/gi, '') // Remove "Born: ..." lines
              .replace(/\n\n+/g, '\n') // Replace multiple newlines with single
              .trim(); // Remove leading/trailing whitespace
            
            return cleanBio ? (
              <div className="px-2">
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed text-center">
                  {cleanBio}
                </p>
              </div>
            ) : null;
          })()}
          
          {/* Things in Common Badge - More prominent LinkedIn style */}
          {compatibilityData && (() => {
            const data = compatibilityData as any;
            const totalCommon = 
              (data.sharedInterests?.length || 0) +
              (data.sharedActivities?.length || 0) +
              (data.sharedEvents?.length || 0) +
              (data.sharedTravelIntent?.length || 0) +
              (data.sharedSexualPreferences?.length || 0) +
              (data.sharedLanguages?.length || 0) +
              (data.sharedCountries?.length || 0) +
              (data.locationOverlap ? 1 : 0) +
              (data.dateOverlap ? 1 : 0) +
              (data.userTypeCompatibility ? 1 : 0) +
              (data.travelIntentCompatibility ? 1 : 0) +
              (data.bothVeterans ? 1 : 0) +
              (data.bothActiveDuty ? 1 : 0) +
              (data.sameFamilyStatus ? 1 : 0) +
              (data.sameAge ? 1 : 0) +
              (data.sameGender ? 1 : 0);
            
            return totalCommon > 0 ? (
              <div className="flex justify-center">
                <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium px-4 py-2 rounded-lg dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 inline-block">
                  {totalCommon} Things in Common
                </div>
              </div>
            ) : null;
          })()}
          
          {/* Interests - Clean LinkedIn-style pills */}
          {(user.interests?.length || 0) > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-auto">
              {user.interests?.slice(0, 3).map((interest) => (
                <span 
                  key={interest} 
                  className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                  data-testid="interest-pill"
                >
                  {interest}
                </span>
              ))}
              {(user.interests?.length || 0) > 3 && (
                <span className="text-xs text-gray-500 flex items-center">+{(user.interests?.length || 0) - 3} more</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}