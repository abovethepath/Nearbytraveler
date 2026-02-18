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
  isAvailableNow?: boolean;
}

export default function UserCard({ 
  user, 
  searchLocation, 
  currentUserId,
  isCurrentUser = false,
  showCompatibilityScore = false,
  compatibilityData,
  compact = false,
  connectionDegree,
  isAvailableNow = false
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
      now.setHours(0, 0, 0, 0);
      const currentTrip = (user as any).travelPlans.find((plan: any) => {
        const start = new Date(plan.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(plan.endDate);
        end.setHours(23, 59, 59, 999);
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
      className={`w-full min-w-0 max-w-none rounded-xl overflow-hidden bg-white dark:bg-gray-800 border shadow-sm hover:shadow-md transition-all text-left ${compact ? 'rounded-lg' : 'lg:rounded-2xl'} ${isAvailableNow ? 'border-green-400 dark:border-green-500 ring-2 ring-green-400/30' : 'border-gray-200 dark:border-gray-700'}`}
      onClick={handleCardClick}
      data-testid={`user-card-${user.id}`}
    >
      {/* Photo section - square when compact, else taller on desktop */}
      <div className={`relative ${compact ? 'aspect-square' : 'aspect-square lg:aspect-[3/4]'}`}>
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
            <span className={`font-bold text-white/90 ${compact ? 'text-2xl' : 'text-4xl'}`}>
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
        
        {/* Available Now badge - show when user is available (web and native app) */}
        {isAvailableNow && (
          <div className="absolute bottom-1.5 left-1.5 right-1.5">
            <span className="status-badge animate-pulsate-green flex items-center justify-center gap-1 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg w-full">
              <span className="status-badge w-1.5 h-1.5 bg-white rounded-full"></span>
              Available Now
            </span>
          </div>
        )}
      </div>
      
      {/* Info box - compact when compact prop, else spacious on desktop */}
      <div className={`bg-white dark:bg-gray-800 ${compact ? 'p-2' : 'p-2 lg:p-4'}`}>
        {/* Mobile / compact: simple stacked layout */}
        <div className={compact ? '' : 'lg:hidden'}>
          <div className={`font-semibold text-gray-900 dark:text-white ${compact ? 'text-sm leading-tight' : 'text-sm'}`} style={compact ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' } : { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {displayName}
          </div>
          {user.userType === 'business' && user.businessType && (
            <div className="text-xs text-orange-600 dark:text-orange-400 truncate mt-0.5 font-medium">
              {user.businessType}
            </div>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {user.userType === 'business' && user.streetAddress 
              ? `📍 ${user.streetAddress}` 
              : displayCity}
          </div>
          {!compact && (
            <div className="mt-1.5 space-y-0.5">
              {thingsInCommon > 0 && (
                <div className="text-xs font-medium text-orange-500 truncate">
                  {thingsInCommon} things in common
                </div>
              )}
              {mutualFriends > 0 && (
                <div className="text-xs text-cyan-600 dark:text-cyan-400 truncate">
                  {mutualFriends} mutual friends
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Desktop (non-compact only): fixed 4-row grid with social proof first */}
        <div className={compact ? 'hidden' : 'hidden lg:grid lg:grid-rows-4 gap-0 leading-tight min-h-[88px]'}>
          <div className="text-sm font-semibold truncate text-orange-500">
            {thingsInCommon > 0 ? `${thingsInCommon} things in common` : '\u00A0'}
          </div>
          <div className="text-sm font-medium truncate text-cyan-600 dark:text-cyan-400">
            {mutualFriends > 0 ? `${mutualFriends} mutual friends` : '\u00A0'}
          </div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate mt-1">
            {displayName}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {displayCity}
          </div>
        </div>
      </div>
    </button>
  );
}
