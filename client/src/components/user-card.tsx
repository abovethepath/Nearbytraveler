import React from "react";
import { useLocation } from "wouter";
import { Plane, MapPin } from "lucide-react";

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

  const u = user as any;
  // Get current travel destination: travelPlans (active trip) → destinationCity → travelDestination (camelCase or snake_case from API). Show whenever we have any signal.
  const getTravelCity = (): string | null => {
    // 1) Active travel plan by date
    if (u.travelPlans && Array.isArray(u.travelPlans)) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const currentTrip = u.travelPlans.find((plan: any) => {
        const startDate = plan?.startDate ?? plan?.start_date;
        const endDate = plan?.endDate ?? plan?.end_date;
        if (!startDate || !endDate) return false;
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return now >= start && now <= end;
      });
      if (currentTrip?.destinationCity) return String(currentTrip.destinationCity).trim();
      if (currentTrip?.destination_city) return String(currentTrip.destination_city).trim();
      if (currentTrip?.destination) return String(currentTrip.destination).split(',')[0].trim();
      // No active trip by date: use next/any plan's destination so we still show "Traveling to X"
      for (const plan of u.travelPlans) {
        const city = plan?.destinationCity ?? plan?.destination_city ?? (plan?.destination ? String(plan.destination).split(',')[0].trim() : null);
        if (city && String(city).toLowerCase() !== 'null') return String(city).trim();
      }
    }
    // 2) destinationCity (from API enrichment or profile) – always trust server
    const destCity = u.destinationCity ?? u.destination_city;
    if (destCity && String(destCity).toLowerCase() !== 'null') return String(destCity).trim();
    // 3) travelDestination string (e.g. "Los Angeles, CA, USA" → show "Los Angeles")
    const travelDest = user.travelDestination ?? u.travel_destination;
    if (travelDest && typeof travelDest === 'string') {
      const city = travelDest.split(',')[0].trim();
      if (city && city.toLowerCase() !== 'null') return city;
    }
    // 4) Build from destination state/country if no city (API sometimes returns these only)
    const destState = u.destinationState ?? u.destination_state;
    const destCountry = u.destinationCountry ?? u.destination_country;
    if (destState && String(destState).toLowerCase() !== 'null') return String(destState).trim();
    if (destCountry && String(destCountry).toLowerCase() !== 'null') return String(destCountry).trim();
    // 5) If marked as traveling but no destination yet, show generic "Traveling" so the plane line still appears
    if (user.isCurrentlyTraveling || u.is_currently_traveling) {
      return travelDest ? String(travelDest).split(',')[0].trim() : 'away';
    }
    return null;
  };

  const travelCity = getTravelCity();
  const displayCity = user.hometownCity || u.hometown_city || 'Unknown';
  // Show travel badge: valid city → "Traveling to X", traveling but no city → "Currently traveling", else nothing
  const hasValidDestination = travelCity && travelCity !== 'away' && String(travelCity).toLowerCase() !== 'null';
  const isTravelingNoCity = travelCity === 'away' || (!!(user.isCurrentlyTraveling ?? u.is_currently_traveling) && !hasValidDestination);
  const travelingLabel = hasValidDestination ? `Traveling to ${travelCity}` : (isTravelingNoCity ? 'Currently traveling' : '');
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
      className={`w-full h-full min-w-0 max-w-none rounded-xl overflow-hidden bg-white dark:bg-gray-800 border shadow-sm hover:shadow-md transition-all text-left flex flex-col ${compact ? 'rounded-lg' : 'lg:rounded-2xl'} ${isAvailableNow ? 'border-green-400 dark:border-green-500 ring-2 ring-green-400/30' : 'border-gray-200 dark:border-gray-700'}`}
      onClick={handleCardClick}
      data-testid={`user-card-${user.id}`}
    >
      {/* Photo section - fixed aspect ratio so card height is consistent */}
      <div className={`relative w-full flex-shrink-0 ${compact ? 'aspect-square' : 'aspect-square lg:aspect-[4/3]'}`}>
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
        
        {/* Travel badge on photo - valid destination or "Currently traveling" when no city */}
        {(hasValidDestination || isTravelingNoCity) && user.userType !== 'business' && (
          <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-0.5 bg-blue-500/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap max-w-[85%]">
            <Plane className="w-3 h-3 flex-shrink-0" aria-hidden />
            <span className="truncate">{hasValidDestination ? travelCity : 'Traveling'}</span>
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
      
      {/* Info box - fixed min-height so "things in common" / missing fields don't change card height */}
      <div className={`bg-white dark:bg-gray-800 flex flex-col justify-start flex-1 min-h-[72px] ${compact ? 'p-2' : 'p-2 lg:p-4'}`}>
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
          {/* Line 1: Hometown – "From [city]" with map pin */}
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5" title={displayCity}>
            {user.userType === 'business' && user.streetAddress ? (
              <>📍 {user.streetAddress}</>
            ) : (
              <>
                <MapPin className="w-3 h-3 flex-shrink-0 text-gray-400 dark:text-gray-500" aria-hidden />
                <span>From {displayCity}</span>
              </>
            )}
          </div>
          {/* Line 2: Under hometown – plane icon + destination (only when we have a valid destination) */}
          {hasValidDestination && user.userType !== 'business' && (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5 truncate" title={travelingLabel}>
              <Plane className="w-3 h-3 flex-shrink-0" aria-hidden />
              <span className="truncate">{travelingLabel}</span>
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
          <div className="truncate">
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate" title={displayCity}>
              <MapPin className="w-3 h-3 flex-shrink-0 text-gray-400" aria-hidden />
              <span>From {displayCity}</span>
            </div>
            {hasValidDestination && user.userType !== 'business' && (
              <div className="flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 truncate" title={travelingLabel}>
                <Plane className="w-2.5 h-2.5 flex-shrink-0" aria-hidden />
                <span>{travelingLabel}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
