import React from "react";

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
  travelStartDate?: string | Date;
  travelEndDate?: string | Date;
  isTravelerToCity?: boolean;
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
  secretActivities?: string;
}

interface UserCardProps {
  user: User;
  searchLocation?: string;
  currentUserId?: number;
  isCurrentUser?: boolean;
  showCompatibilityScore?: boolean;
  compatibilityData?: any;
  compact?: boolean;
  connectionDegree?: {
    degree: number;
    mutualCount: number;
  };
}

export default function UserCard({ 
  user, 
  searchLocation, 
  currentUserId,
  isCurrentUser = false,
  showCompatibilityScore = false,
  compatibilityData,
  compact = false,
  connectionDegree
}: UserCardProps) {
  
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, '', `/profile/${user.id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const getUserGradient = () => {
    if (user.avatarGradient) return user.avatarGradient;
    const gradients = [
      'linear-gradient(135deg, #3B82F6 0%, #A855F7 50%, #F97316 100%)',
      'linear-gradient(135deg, #10B981 0%, #059669 50%, #F97316 100%)',
      'linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #F97316 100%)',
      'linear-gradient(135deg, #A855F7 0%, #EC4899 50%, #EF4444 100%)',
      'linear-gradient(135deg, #6366F1 0%, #3B82F6 50%, #10B981 100%)',
      'linear-gradient(135deg, #F97316 0%, #EF4444 50%, #EC4899 100%)',
      'linear-gradient(135deg, #14B8A6 0%, #3B82F6 50%, #A855F7 100%)',
      'linear-gradient(135deg, #EAB308 0%, #F97316 50%, #EF4444 100%)',
    ];
    return gradients[user.id % gradients.length];
  };

  const getTravelCity = () => {
    if ((user as any).travelPlans && Array.isArray((user as any).travelPlans)) {
      const now = new Date();
      const currentTrip = (user as any).travelPlans.find((plan: any) => {
        const start = new Date(plan.startDate);
        const end = new Date(plan.endDate);
        return now >= start && now <= end;
      });
      if (currentTrip?.destinationCity) return currentTrip.destinationCity;
    }
    if (user.isCurrentlyTraveling && user.travelDestination) {
      const city = user.travelDestination.split(',')[0].trim();
      if (city && city.toLowerCase() !== 'null') return city;
    }
    return null;
  };

  const travelCity = getTravelCity();
  const displayCity = user.hometownCity || 'Unknown';
  const displayName = user.userType === 'business' && user.businessName 
    ? user.businessName 
    : `@${user.username}`;

  // Fix percentage - if it's a decimal like 0.234, multiply by 100; if already whole, use as is
  const getMatchPercent = () => {
    if (!compatibilityData?.score) return null;
    const score = compatibilityData.score;
    if (score < 1) {
      return Math.round(score * 100);
    }
    return Math.round(score);
  };

  const matchPercent = getMatchPercent();
  const thingsInCommon = compatibilityData?.sharedInterests?.length || 0;
  const mutualFriends = connectionDegree?.mutualCount || 0;

  return (
    <button 
      className="w-full min-w-0 max-w-none rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all text-left"
      onClick={handleCardClick}
      data-testid={`user-card-${user.id}`}
    >
      {/* Photo section */}
      <div className="relative aspect-square">
        {user.profileImage ? (
          <img 
            src={user.profileImage} 
            alt={user.username}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div 
            className="absolute inset-0 w-full h-full flex items-center justify-center"
            style={{ background: getUserGradient() }}
          >
            <span className="text-4xl font-bold text-white/90">
              {user.name?.charAt(0) || user.username?.charAt(0) || '?'}
            </span>
          </div>
        )}
        
        {/* Travel badge on photo */}
        {travelCity && (
          <div className="absolute top-1.5 left-1.5">
            <span className="bg-blue-500/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
              ✈️ {travelCity}
            </span>
          </div>
        )}
        
        {/* Business badge */}
        {user.userType === 'business' && (
          <div className="absolute top-1.5 right-1.5">
            <span className="bg-orange-500/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
              Biz
            </span>
          </div>
        )}
      </div>
      
      {/* Info box below photo */}
      <div className="p-2 bg-white dark:bg-gray-800">
        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {displayName}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {displayCity}
        </div>
        
        {/* Stats box */}
        <div className="mt-1.5 text-[11px] text-gray-600 dark:text-gray-300 space-y-0.5">
          {thingsInCommon > 0 && (
            <div className="truncate">
              <span className="text-orange-500 font-medium">{thingsInCommon} things in common</span>
              {matchPercent && <span className="text-gray-400"> • {matchPercent}% match</span>}
            </div>
          )}
          {mutualFriends > 0 && (
            <div className="text-cyan-600 dark:text-cyan-400 truncate">
              {mutualFriends} mutual friends
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
