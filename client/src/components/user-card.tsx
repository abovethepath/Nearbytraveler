import React from "react";
import { useLocation } from "wouter";
import { Plane } from "lucide-react";
import { getCurrentTravelDestination } from "@/lib/dateUtils";
import { isNativeIOSApp } from "@/lib/nativeApp";

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
  
  const [, setLocation] = useLocation();
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLocation(`/profile/${user.id}`);
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

  // Get travel destination for display - SAME logic as ResponsiveUserGrid/current user card
  // Every user who is currently traveling shows badge: plane icon + city name in top-left
  const getTravelCity = (): string | null => {
    const toDisplay = (s: string | null | undefined): string | null => {
      if (s == null || s === '') return null;
      const t = String(s).trim();
      if (!t || t.toLowerCase() === 'null' || t.toLowerCase() === 'undefined') return null;
      return t;
    };
    // 1. From travelPlans (active trip) - same as current user's Los Angeles badge
    const plans = (user as any).travelPlans;
    if (Array.isArray(plans) && plans.length > 0) {
      const dest = getCurrentTravelDestination(plans);
      if (dest) {
        const city = String(dest).split(',')[0]?.trim();
        const r = toDisplay(city);
        if (r) return r;
      }
    }
    // 2. From destinationCity (API-enriched - server sets for ALL users with active travel)
    const destCity = toDisplay((user as any).destinationCity);
    if (destCity) return destCity;
    // 3. From travelDestination (API fallback)
    const td = user.travelDestination;
    if (td) {
      const city = String(td).split(',')[0]?.trim();
      const r = toDisplay(city);
      if (r) return r;
    }
    return null;
  };

  const travelCityFinal = getTravelCity();
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
  // Use visible count (interests + activities + events) so the number matches what users see in "Things in common"
  const thingsInCommon = compatibilityData
    ? (compatibilityData.sharedInterests?.length || 0) + (compatibilityData.sharedActivities?.length || 0) + (compatibilityData.sharedEvents?.length || 0)
    : 0;
  const mutualFriends = connectionDegree?.mutualCount || 0;

  return (
    <button 
      className={`w-full min-w-0 max-w-none rounded-xl overflow-hidden bg-white dark:bg-gray-800 border shadow-sm hover:shadow-md transition-all text-left ${compact ? 'rounded-lg' : 'lg:rounded-2xl'} ${isAvailableNow ? 'border-green-400 dark:border-green-500 ring-2 ring-green-400/30' : 'border-gray-200 dark:border-gray-700'}`}
      onClick={handleCardClick}
      data-testid={`user-card-${user.id}`}
    >
      {/* Photo section - compact on desktop web to reduce card height; iOS keeps original */}
      <div className={`relative ${compact ? 'aspect-square' : isNativeIOSApp() ? 'aspect-square lg:aspect-[3/4]' : 'aspect-square lg:aspect-[4/5]'}`}>
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
        
        {/* CRITICAL: Travel badge on photo - MUST show when Nearby Traveler (airplane icon, left corner) */}
        {travelCityFinal && user.userType !== 'business' && (
          <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1">
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md whitespace-nowrap flex items-center gap-1">
              <Plane className="w-3 h-3 flex-shrink-0" />
              {travelCityFinal}
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
        
        {/* Available Now badge - green, visible to everyone (web and native app) */}
        {isAvailableNow && (
          <div className="absolute bottom-1.5 left-1.5 right-1.5">
            <span className="status-badge animate-pulsate-green flex items-center justify-center gap-1 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg w-full">
              <span className="status-badge w-1.5 h-1.5 bg-white rounded-full"></span>
              Available Now
            </span>
          </div>
        )}
      </div>
      
      {/* Info box - compact when compact prop; on desktop web use tighter padding to reduce card height */}
      <div className={`bg-white dark:bg-gray-800 ${compact ? 'p-2' : isNativeIOSApp() ? 'p-2 lg:p-4' : 'p-2 lg:p-2'}`}>
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
          {/* CRITICAL: Travel destination MUST appear under hometown - users must see immediately if traveling */}
          {travelCityFinal && user.userType !== 'business' && (
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1 truncate">
              <Plane className="w-3 h-3 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span>Nearby Traveler → {travelCityFinal}</span>
            </div>
          )}
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
        
        {/* Desktop (non-compact only): fixed 4-row grid; on desktop web use tighter spacing to reduce card height */}
        <div className={compact ? 'hidden' : `hidden lg:grid gap-0 leading-tight ${isNativeIOSApp() ? 'lg:grid-rows-4 min-h-[100px]' : 'lg:grid-rows-4 min-h-0'}`}>
          <div className={`font-semibold truncate text-orange-500 ${isNativeIOSApp() ? 'text-sm' : 'text-xs'}`}>
            {thingsInCommon > 0 ? `${thingsInCommon} things in common` : '\u00A0'}
          </div>
          <div className={`font-medium truncate text-cyan-600 dark:text-cyan-400 ${isNativeIOSApp() ? 'text-sm' : 'text-xs'}`}>
            {mutualFriends > 0 ? `${mutualFriends} mutual friends` : '\u00A0'}
          </div>
          <div className={`font-semibold text-gray-900 dark:text-white truncate ${isNativeIOSApp() ? 'text-sm mt-1' : 'text-xs mt-0.5'}`}>
            {displayName}
          </div>
          <div className="min-w-0">
            <div className={`text-gray-500 dark:text-gray-400 truncate ${isNativeIOSApp() ? 'text-xs' : 'text-[11px]'}`}>{displayCity}</div>
            {travelCityFinal && user.userType !== 'business' && (
              <div className={`font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 break-words min-w-0 ${isNativeIOSApp() ? 'text-xs mt-0.5' : 'text-[11px] mt-0.5'}`}>
                <Plane className="w-3 h-3 flex-shrink-0" />
                <span className="break-words">Nearby Traveler → {travelCityFinal}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
