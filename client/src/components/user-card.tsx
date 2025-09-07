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
    // Navigate to user profile
    window.location.href = `/profile/${user.id}`;
  };

  const getLocation = () => {
    if (user.hometownCity && user.hometownCountry) {
      return `${user.hometownCity}, ${user.hometownCountry}`;
    }
    return user.location || "Location not set";
  };

  return (
    <Card 
      className="user-card border-gray-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-800 overflow-hidden cursor-pointer transition-shadow hover:shadow-lg"
      onClick={handleCardClick}
      data-testid={`user-card-${user.id}`}
    >
      {/* Header with gradient background */}
      <div className="relative h-20 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="absolute -bottom-4 left-4">
          <SimpleAvatar 
            user={user} 
            size="lg" 
            className="border-4 border-white shadow-lg w-10 h-10"
          />
        </div>
      </div>
    
      <CardContent className="p-4 pt-6">
        {/* User Info */}
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {user.name || `@${user.username}`}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              @{user.username}
            </p>
          </div>
          
          {/* Location and Travel Info */}
          <div className="space-y-2">
            {(() => {
              // Check if user has travel plans data and use new logic
              if ((user as any).travelPlans && Array.isArray((user as any).travelPlans)) {
                const currentOrNextTrip = getCurrentOrNextTrip((user as any).travelPlans);
                if (currentOrNextTrip) {
                  return (
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
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
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    🧳 <span className="truncate">Traveling to {user.travelDestination.split(',')[0]}</span>
                  </div>
                );
              }
              
              return null;
            })() as React.ReactNode}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              🏠 <span className="truncate">Local in {user.hometownCity ? user.hometownCity.split(',')[0] : getLocation()}</span>
            </div>
          </div>
          
          {/* Bio */}
          {user.bio && (
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
              {String(user.bio)}
            </p>
          )}
          
          {/* Things in Common Badge */}
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
              <div className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-400 inline-block">
                {totalCommon} Things in Common
              </div>
            ) : null;
          })()}
          
          {/* Interests */}
          {(user.interests?.length || 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {user.interests?.slice(0, 3).map((interest) => (
                <span 
                  key={interest} 
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  data-testid="interest-pill"
                >
                  {interest}
                </span>
              ))}
              {(user.interests?.length || 0) > 3 && (
                <span className="text-xs text-gray-500">+{(user.interests?.length || 0) - 3} more</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}