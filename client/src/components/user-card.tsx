import React from "react";
import { useLocation } from "wouter";
import { Plane } from "lucide-react";
import { getCurrentTravelDestination } from "@/lib/dateUtils";
import { isNativeIOSApp } from "@/lib/nativeApp";
import { formatHometownForDisplay } from "@/lib/locationDisplay";

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
  // Use prop first (from parent's effectiveAvailableNowIds), fallback to API-returned isAvailableNow
  const showAvailableNow = isAvailableNow || !!(user as any).isAvailableNow || !!(user as any).is_available_now || !!(user as any).availableNow;
  
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
  // CRITICAL: Must show for EVERY user with active travel plan, not just current user
  // API returns camelCase (destinationCity, travelPlans) - support snake_case fallbacks
  const getTravelCity = (): string | null => {
    const toDisplay = (s: string | null | undefined): string | null => {
      if (s == null || s === '') return null;
      const t = String(s).trim();
      if (!t || t.toLowerCase() === 'null' || t.toLowerCase() === 'undefined') return null;
      return t;
    };
    const u = user as any;
    const debugUsernames = ['barbara809', 'aml101371'];
    if (debugUsernames.includes(u.username)) {
      console.log(`[Travel Badge] ${u.username} FULL DATA:`, JSON.stringify(u, null, 2));
    }
    // 1. From travelPlans / travel_plans (active trip) - same as current user's Los Angeles badge
    const plans = u.travelPlans ?? u.travel_plans;
    if (Array.isArray(plans) && plans.length > 0) {
      const dest = getCurrentTravelDestination(plans);
      if (dest) {
        const city = String(dest).split(',')[0]?.trim();
        const r = toDisplay(city);
        if (r) return r;
      }
      // Fallback: API may format destination as "City, State, Country" - if dest empty, use plan.destinationCity
      for (const plan of plans) {
        const start = plan.startDate ?? plan.start_date;
        const end = plan.endDate ?? plan.end_date;
        if (start && end) {
          const now = new Date();
          const s = new Date(start);
          const e = new Date(end);
          if (now >= s && now <= e) {
            const city = toDisplay(plan.destinationCity ?? plan.destination_city ?? plan.destination?.split(',')[0]?.trim());
            if (city) return city;
          }
        }
      }
    }
    // 2. From destinationCity / destination_city (API-enriched - server sets ONLY for users with active travel)
    const destCity = toDisplay(u.destinationCity ?? u.destination_city);
    if (destCity) return destCity;
    // 3. From travelDestination / travel_destination (API - server sets ONLY from active plan)
    const td = u.travelDestination ?? u.travel_destination;
    if (td) {
      const city = String(td).split(',')[0]?.trim();
      const r = toDisplay(city);
      if (r) return r;
    }
    // NOTE: We intentionally do NOT use location, currentCity, or locationBasedStatus here.
    // The traveling badge must ONLY show for CURRENT travel (trip dates active today), not future travel.
    return null;
  };

  const travelCityFinal = getTravelCity();
  const displayCity = formatHometownForDisplay(user);

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
  const bioSnippet = user.bio ? (user.bio.length > 100 ? user.bio.slice(0, 100) + '…' : user.bio) : '';

  return (
    <button 
      className={`w-full min-w-0 max-w-none rounded-xl overflow-hidden bg-white dark:bg-gray-800 border shadow-sm hover:shadow-md transition-all text-left ${compact ? 'rounded-lg' : 'lg:rounded-2xl'} ${showAvailableNow ? 'border-green-400 dark:border-green-500 ring-2 ring-green-400/30' : 'border-gray-200 dark:border-gray-700'}`}
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
        {showAvailableNow && (
          <div className="absolute bottom-1.5 left-1.5 right-1.5">
            <span className="status-badge animate-pulsate-green flex items-center justify-center gap-1 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg w-full">
              <span className="status-badge w-1.5 h-1.5 bg-white rounded-full"></span>
              Available Now
            </span>
          </div>
        )}
      </div>
      
      {/* Info box - order: 1) @username 2) bio (higher for more space) 3) X things in common (hidden for own card) 4) Nearby Local 5) Nearby Traveler */}
      <div className={`bg-white dark:bg-gray-800 ${compact ? 'p-1 min-h-[6.5rem]' : 'p-1 lg:p-1.5 min-h-[7.5rem]'} flex flex-col justify-start`}>
        {/* Mobile / compact: exact order, fixed height */}
        <div className={compact ? '' : 'lg:hidden'}>
          <div className={`font-semibold text-gray-900 dark:text-white truncate ${compact ? 'text-sm' : 'text-sm'}`}>
            {displayName}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-500 line-clamp-3 mt-0.5 min-h-[2.75rem]" title={user.bio || undefined}>
            {bioSnippet || '\u00A0'}
          </div>
          {!isCurrentUser && (
            <div className="text-xs font-medium text-orange-500 truncate mt-0.5">
              {thingsInCommon} things in common
            </div>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {user.userType === 'business' && user.streetAddress 
              ? `📍 ${user.streetAddress}` 
              : displayCity}
          </div>
          <div className="min-h-[1.25rem] mt-0.5">
            {travelCityFinal && user.userType !== 'business' ? (
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 truncate">
                <Plane className="w-3 h-3 flex-shrink-0" />
                <span>Nearby Traveler → {travelCityFinal}</span>
              </div>
            ) : (
              <span className="invisible text-xs">&#8203;</span>
            )}
          </div>
        </div>
        
        {/* Desktop (non-compact only): same order, fixed height */}
        <div className={compact ? 'hidden' : 'hidden lg:flex lg:flex-col lg:min-h-[7.5rem]'} style={{ minHeight: '7.5rem' }}>
          <div className={`font-semibold text-gray-900 dark:text-white truncate ${isNativeIOSApp() ? 'text-sm' : 'text-xs'}`}>
            {displayName}
          </div>
          <div className={`text-gray-600 dark:text-gray-500 line-clamp-3 mt-0.5 min-h-[2.75rem] truncate ${isNativeIOSApp() ? 'text-xs' : 'text-[11px]'}`} title={user.bio || undefined}>
            {bioSnippet || '\u00A0'}
          </div>
          {!isCurrentUser && (
            <div className={`font-medium text-orange-500 truncate ${isNativeIOSApp() ? 'text-sm mt-0.5' : 'text-xs mt-0.5'}`}>
              {thingsInCommon} things in common
            </div>
          )}
          <div className={`text-gray-500 dark:text-gray-400 truncate ${isNativeIOSApp() ? 'text-xs mt-0.5' : 'text-[11px] mt-0.5'}`}>
            {user.userType === 'business' && user.streetAddress 
              ? `📍 ${user.streetAddress}` 
              : displayCity}
          </div>
          <div className="min-h-[1.25rem] mt-0.5">
            {travelCityFinal && user.userType !== 'business' ? (
              <div className={`font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 truncate ${isNativeIOSApp() ? 'text-xs' : 'text-[11px]'}`}>
                <Plane className="w-3 h-3 flex-shrink-0" />
                <span>Nearby Traveler → {travelCityFinal}</span>
              </div>
            ) : (
              <span className="invisible text-xs">&#8203;</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
