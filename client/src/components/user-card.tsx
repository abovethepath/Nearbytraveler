import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SimpleAvatar } from "./simple-avatar";
import { InterestPills } from "./InterestPills";

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
  avatarGradient?: string;
  avatarColor?: string;
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

  // Get user's individual gradient or fallback to default
  const getUserGradient = () => {
    if (user.avatarGradient) {
      return user.avatarGradient;
    }
    // Default gradient if user hasn't set one
    return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  };

  return (
    <Card 
      className="user-card border-gray-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-800 overflow-hidden cursor-pointer transition-shadow hover:shadow-lg h-full"
      onClick={handleCardClick}
      data-testid={`user-card-${user.id}`}
    >
      {/* Individual User Gradient Banner */}
      <div 
        className="h-20" 
        style={{ background: getUserGradient() }}
      ></div>
      
      <CardContent className="p-4 pb-4 -mt-10 h-full flex flex-col">
        {/* User Info */}
        <div className="space-y-3 flex-1 flex flex-col justify-between">
          {/* Large Circular Avatar with white ring */}
          <div className="flex justify-center">
            <SimpleAvatar 
              user={user} 
              size="lg" 
              className="ring-4 ring-white dark:ring-gray-800 shadow-xl w-20 h-20"
            />
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              @{user.username}
            </h3>
          </div>
          
          {/* Location and Travel Info */}
          <div className="space-y-2">
            {(() => {
              // Check if user has travel plans data and use new logic
              if ((user as any).travelPlans && Array.isArray((user as any).travelPlans)) {
                const currentOrNextTrip = getCurrentOrNextTrip((user as any).travelPlans);
                if (currentOrNextTrip) {
                  return (
                    <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
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
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    🧳 <span className="truncate">Traveling to {user.travelDestination.split(',')[0]}</span>
                  </div>
                );
              }
              
              return null;
            })() as React.ReactNode}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              🏠 <span className="truncate">Local in {user.hometownCity ? user.hometownCity.split(',')[0] : getLocation()}</span>
            </div>
          </div>
          
          {/* Bio - Filter out birth date info */}
          {user.bio && (() => {
            // Remove "Born: [date]" information from bio display
            const cleanBio = String(user.bio)
              .replace(/Born:\s*[^\n]*/gi, '') // Remove "Born: ..." lines
              .replace(/\n\n+/g, '\n') // Replace multiple newlines with single
              .trim(); // Remove leading/trailing whitespace
            
            return cleanBio ? (
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed text-center">
                {cleanBio}
              </p>
            ) : null;
          })()}
          
          {/* Things in Common Badge - simplified to match backend algorithm */}
          {compatibilityData && (() => {
            const data = compatibilityData as any;
            // Use the same simple calculation as the backend algorithm
            const totalCommon = 
              (data.sharedInterests?.length || 0) +
              (data.sharedActivities?.length || 0) +
              (data.sharedEvents?.length || 0);
            
            const matchPercentage = Math.round((data.score || 0) * 100);
            
            return totalCommon > 0 ? (
              <div className="flex justify-center">
                <div className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-400 inline-block">
                  {totalCommon} Things in Common • {matchPercentage}% Match
                </div>
              </div>
            ) : null;
          })()}
          
          {/* Interests section removed - only showing "Things in Common" count */}
        </div>
      </CardContent>
    </Card>
  );
}