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
  // People discovery cards: show shared INTERESTS count (as originally displayed)
  const thingsInCommon = compatibilityData?.sharedInterests?.length || 0;
  const bioSnippet = user.bio ? (user.bio.length > 100 ? user.bio.slice(0, 100) + '…' : user.bio) : '';

  return (
    <button 
      type="button"
      className={`user-card w-full min-w-0 max-w-none !p-0 block overflow-hidden shadow-sm hover:shadow-md transition-all text-left flex flex-col items-stretch gap-0 leading-none ${compact ? 'rounded-lg' : 'rounded-[14px] lg:rounded-[14px]'} ${showAvailableNow ? 'border-green-400 dark:border-green-500 ring-2 ring-green-400/30' : ''}`}
      style={{
        backgroundColor: '#1a1d27',
        border: '1px solid #2a2d3a',
        borderRadius: 14,
        padding: 0,
      }}
      onClick={handleCardClick}
      data-testid={`user-card-${user.id}`}
      data-is-current-user={isCurrentUser ? 'true' : undefined}
    >
      {/* Photo section - flush to top edge (no padding/margin); identical for current user and others */}
      <div 
        className={`relative block flex-shrink-0 w-full !m-0 !p-0 self-stretch overflow-hidden ${compact ? 'aspect-square rounded-t-lg' : isNativeIOSApp() ? 'aspect-square lg:aspect-[3/4] rounded-t-[14px]' : 'aspect-square lg:aspect-[4/5] rounded-t-[14px]'}`}
        style={{ margin: 0, padding: 0, minHeight: 0, flexShrink: 0 }}
      >
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
      
      {/* Info box - order: 1) @username 2) bio (3 lines) 3) X things in common 4) location tags */}
      <div className={`${compact ? 'p-1 min-h-[6.5rem]' : 'p-1 lg:p-1.5 min-h-[7.5rem]'} flex flex-col justify-start`} style={{ backgroundColor: '#1a1d27' }}>
        {/* Mobile / compact */}
        <div className={compact ? '' : 'lg:hidden'}>
          <div
            className="truncate"
            style={{ color: '#7eb8f7', fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500, marginBottom: 6 }}
          >
            {displayName}
          </div>
          <div
            title={user.bio || undefined}
            style={{
              color: '#8b8fa8',
              fontSize: 12.5,
              lineHeight: 1.5,
              minHeight: '3.75rem',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}
          >
            {bioSnippet || '\u00A0'}
          </div>
          {!isCurrentUser && (
            <div className="truncate mt-0.5" style={{ color: '#e8834a', fontSize: 12, fontWeight: 600 }}>
              {thingsInCommon} things in common
            </div>
          )}
          <div className="truncate mt-0.5" style={{ color: '#5a5e75', fontSize: 11.5 }}>
            {user.userType === 'business' && user.streetAddress ? (
              `📍 ${user.streetAddress}`
            ) : (
              <>
                <span style={{ color: '#e8834a', fontWeight: 700 }}>Nearby Local</span>
                <span> → {displayCity}</span>
              </>
            )}
          </div>
          <div className="min-h-[1.25rem] mt-0.5">
            {travelCityFinal && user.userType !== 'business' ? (
              <div className="flex items-center gap-1 truncate" style={{ color: '#5b9cf6', fontSize: 11.5, fontWeight: 600 }}>
                <Plane className="w-3 h-3 flex-shrink-0" />
                <span>Nearby Traveler → {travelCityFinal}</span>
              </div>
            ) : (
              <span className="invisible text-xs">&#8203;</span>
            )}
          </div>
        </div>

        {/* Desktop (non-compact only) */}
        <div className={compact ? 'hidden' : 'hidden lg:flex lg:flex-col lg:min-h-[7.5rem]'} style={{ minHeight: '7.5rem' }}>
          <div
            className="truncate"
            style={{ color: '#7eb8f7', fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500, marginBottom: 6 }}
          >
            {displayName}
          </div>
          <div
            title={user.bio || undefined}
            style={{
              color: '#8b8fa8',
              fontSize: 12.5,
              lineHeight: 1.5,
              minHeight: '3.75rem',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}
          >
            {bioSnippet || '\u00A0'}
          </div>
          {!isCurrentUser && (
            <div className="truncate mt-0.5" style={{ color: '#e8834a', fontSize: 12, fontWeight: 600 }}>
              {thingsInCommon} things in common
            </div>
          )}
          <div className="truncate mt-0.5" style={{ color: '#5a5e75', fontSize: 11.5 }}>
            {user.userType === 'business' && user.streetAddress ? (
              `📍 ${user.streetAddress}`
            ) : (
              <>
                <span style={{ color: '#e8834a', fontWeight: 700 }}>Nearby Local</span>
                <span> → {displayCity}</span>
              </>
            )}
          </div>
          <div className="min-h-[1.25rem] mt-0.5">
            {travelCityFinal && user.userType !== 'business' ? (
              <div className="flex items-center gap-1 truncate" style={{ color: '#5b9cf6', fontSize: 11.5, fontWeight: 600 }}>
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
