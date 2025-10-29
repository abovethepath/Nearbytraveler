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

  // Get user's individual gradient - unique for each user based on ID
  const getUserGradient = () => {
    if (user.avatarGradient) {
      return user.avatarGradient;
    }
    
    // Generate consistent unique gradient based on user ID
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Pink-Red
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Blue-Cyan
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Green-Teal
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Pink-Yellow
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', // Cyan-Deep Purple
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // Mint-Pink
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', // Coral-Pink
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', // Peach
      'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)', // Red-Blue
      'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', // Purple-Blue
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Magenta-Red
      'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', // Pink-Blue
      'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)', // Light Pink
      'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', // Sky Blue
      'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)', // Purple-Yellow
      'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)', // Peach-Pink
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', // Orange-Peach
      'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)', // Red-Peach
      'linear-gradient(135deg, #fbc2eb 0%, #a18cd1 100%)', // Pink-Purple
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
      
      <CardContent className="p-4 pb-5 -mt-12 flex flex-col flex-grow">
        {/* User Info */}
        <div className="space-y-3 flex flex-col flex-grow">
          {/* Large Circular Avatar with enhanced ring */}
          <div className="flex justify-center">
            <SimpleAvatar 
              user={user} 
              size="lg" 
              className="ring-4 ring-white dark:ring-gray-800 shadow-2xl w-24 h-24 border-2 border-white/50 dark:border-gray-700/50"
            />
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text">
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
          </div>
          
          {/* Bio - Filter out birth date info */}
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
          
          {/* Things in Common Badge - modernized with gradient */}
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
                <div className="bg-gradient-to-r from-blue-500 to-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg inline-block">
                  {totalCommon} Things in Common • {matchPercentage}% Match
                </div>
              </div>
            ) : null;
          })()}
          
          {/* Connect Button - only show if not current user */}
          {!isCurrentUser && currentUserId && (
            <div className="pt-4">
              <ConnectButton
                currentUserId={currentUserId}
                targetUserId={user.id}
                targetUsername={user.username}
                targetName={user.name}
                className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                size="default"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}