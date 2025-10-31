import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SimpleAvatar } from "./simple-avatar";
import { InterestPills } from "./InterestPills";
import ConnectButton from "./ConnectButton";

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
  userType?: string;
  businessName?: string;
  businessType?: string;
  streetAddress?: string;
  phoneNumber?: string;
  city?: string;
  state?: string;
  country?: string;
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

  // Get user's individual gradient - matches profile page gradient
  const getUserGradient = () => {
    if (user.avatarGradient) {
      return user.avatarGradient;
    }
    
    // CSS gradient mapping matching ProfileComplete gradients
    const gradients = [
      'linear-gradient(135deg, #3B82F6 0%, #A855F7 50%, #F97316 100%)', // Blue-Purple-Orange
      'linear-gradient(135deg, #10B981 0%, #059669 50%, #F97316 100%)', // Green-Emerald-Orange
      'linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #F97316 100%)', // Blue-Cyan-Orange
      'linear-gradient(135deg, #A855F7 0%, #EC4899 50%, #EF4444 100%)', // Purple-Pink-Red
      'linear-gradient(135deg, #6366F1 0%, #3B82F6 50%, #10B981 100%)', // Indigo-Blue-Green
      'linear-gradient(135deg, #F97316 0%, #EF4444 50%, #EC4899 100%)', // Orange-Red-Pink
      'linear-gradient(135deg, #14B8A6 0%, #3B82F6 50%, #A855F7 100%)', // Teal-Blue-Purple
      'linear-gradient(135deg, #EAB308 0%, #F97316 50%, #EF4444 100%)', // Yellow-Orange-Red
    ];
    
    // Use user ID to consistently pick the same gradient
    const index = user.id % gradients.length;
    return gradients[index];
  };

  return (
    <Card 
      className="user-card h-full flex flex-col backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-gray-300/50 dark:border-gray-600/50 shadow-xl hover:shadow-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:bg-white/90 dark:hover:bg-gray-800/90"
      onClick={handleCardClick}
      data-testid={`user-card-${user.id}`}
    >
      {/* Individual User Gradient Banner - keeps user's personal color */}
      <div 
        className="h-24 relative overflow-hidden flex-shrink-0" 
        style={{ background: getUserGradient() }}
      >
        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>
      </div>
      
      <CardContent className="p-4 pb-5 -mt-12 flex flex-col flex-grow min-h-0">
        {/* User Info - Content that can vary */}
        <div className="space-y-3 flex flex-col">
          {/* Large Circular Avatar with enhanced ring */}
          <div className="flex justify-center">
            <SimpleAvatar 
              user={user} 
              size="lg" 
              className="ring-4 ring-white dark:ring-gray-800 shadow-2xl w-24 h-24 border-2 border-white/50 dark:border-gray-700/50"
            />
          </div>
          
          <div className="text-center">
            {user.userType === 'business' && user.businessName ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text">
                  {user.businessName}
                </h3>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Nearby Business
                  </span>
                  {(user as any).businessType && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {(user as any).businessType}
                      </span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text">
                @{user.username}
              </h3>
            )}
          </div>
          
          {/* Location and Travel Info */}
          <div className="space-y-2">
            {user.userType === 'business' ? (
              /* Business Contact Information */
              <div className="space-y-2 text-sm">
                {user.streetAddress && (
                  <div className="flex flex-col items-center justify-center gap-1 text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{user.streetAddress}</span>
                    </div>
                    {(user.city || user.hometownCity) && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {user.city || user.hometownCity}{user.state && `, ${user.state}`}
                      </span>
                    )}
                  </div>
                )}
                {(user as any).phoneNumber && (
                  <div className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{(user as any).phoneNumber}</span>
                  </div>
                )}
              </div>
            ) : (
              /* Regular User Travel/Location Info */
              <>
                {(() => {
                  // Check if user has travel plans data and use new logic
                  if ((user as any).travelPlans && Array.isArray((user as any).travelPlans)) {
                    const currentOrNextTrip = getCurrentOrNextTrip((user as any).travelPlans);
                    if (currentOrNextTrip) {
                      return (
                        <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">
                          {currentOrNextTrip.isCurrent ? '🧳' : '✈️'} 
                          <span className="text-center">
                            {currentOrNextTrip.isCurrent ? 'Traveling to' : 'Next trip to'} {currentOrNextTrip.destination.split(',')[0]}
                          </span>
                        </div>
                      );
                    }
                  }
                  
                  // Fallback to existing logic for backward compatibility
                  if (user.isCurrentlyTraveling && user.travelDestination) {
                    return (
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">
                        🧳 <span className="text-center">Traveling to {user.travelDestination.split(',')[0]}</span>
                      </div>
                    );
                  }
                  
                  return null;
                })() as React.ReactNode}
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/30 px-3 py-1.5 rounded-lg">
                  🏠 <span className="text-center">Local in {user.hometownCity ? user.hometownCity.split(',')[0] : getLocation()}</span>
                </div>
              </>
            )}
          </div>
          
          {/* Bio - Fixed height to ensure alignment */}
          <div className="min-h-[3rem] flex items-start justify-center">
            {user.bio && (() => {
              // Remove "Born: [date]" information from bio display
              const cleanBio = String(user.bio)
                .replace(/Born:\s*[^\n]*/gi, '') // Remove "Born: ..." lines
                .replace(/\n\n+/g, '\n') // Replace multiple newlines with single
                .trim(); // Remove leading/trailing whitespace
              
              return cleanBio ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed text-center font-medium">
                  {cleanBio}
                </p>
              ) : null;
            })()}
          </div>
        </div>
        
        {/* Spacer to push CTA to bottom */}
        <div className="flex-grow"></div>
        
        {/* CTA Section - Always at bottom */}
        {!isCurrentUser && currentUserId && (
          <div className="pt-4">
              <div className="flex flex-col gap-2">
                {/* Things in Common Badge */}
                {compatibilityData && (() => {
                  const data = compatibilityData as any;
                  const totalCommon = 
                    (data.sharedInterests?.length || 0) +
                    (data.sharedActivities?.length || 0) +
                    (data.sharedEvents?.length || 0);
                  
                  const matchPercentage = Math.round((data.score || 0) * 100);
                  
                  return totalCommon > 0 ? (
                    <div className="bg-gradient-to-r from-blue-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md text-center">
                      {totalCommon} Things in Common • {matchPercentage}% Match
                    </div>
                  ) : null;
                })()}
                
                {/* Connect Button */}
                <div onClick={(e) => e.stopPropagation()}>
                  <ConnectButton
                    currentUserId={currentUserId}
                    targetUserId={user.id}
                    targetUsername={user.username}
                    targetName={user.name}
                    className="w-full bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                    size="default"
                  />
                </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}