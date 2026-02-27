import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Heart, MapPin, Star, Plane } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SimpleAvatar } from "@/components/simple-avatar";
import { getCurrentTravelDestination } from "@/lib/dateUtils";
import { formatHometownForDisplay } from "@/lib/locationDisplay";

interface User {
  id: number;
  username: string;
  profileImage?: string | null;
  bio?: string | null;
  hometownCity?: string | null;
  hometownState?: string | null;
  hometownCountry?: string | null;
  destinationCity?: string | null;
  destinationState?: string | null;
  destinationCountry?: string | null;
  travelDestination?: string | null;
  location?: string | null;
  interests?: string[];
  userType?: string;
  aura?: number;
  isCurrentlyTraveling?: boolean;
  travelPlans?: any[];
}

interface ResponsiveUserGridProps {
  users: User[];
  title?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  limit?: number;
  currentUserId?: number;
  compatibilityDataMap?: Record<number, { sharedInterests?: any[]; sharedActivities?: any[]; sharedEvents?: any[] }>;
}

export default function ResponsiveUserGrid({ 
  users, 
  title, 
  showViewAll, 
  onViewAll, 
  limit = 6,
  currentUserId,
  compatibilityDataMap
}: ResponsiveUserGridProps) {
  const [, setLocation] = useLocation();
  const displayUsers = limit ? users.slice(0, limit) : users;

  const { data: availableNowIds = [] } = useQuery<number[]>({
    queryKey: ['/api/available-now/active-ids'],
    refetchInterval: 30000,
  });

  const getLocation = (user: User) => {
    // ALWAYS use hometownCity - never fall back to location field (which contains metro area)
    if (user.hometownCity && user.hometownCountry) {
      return `${user.hometownCity}, ${user.hometownCountry}`;
    }
    if (user.hometownCity) {
      return user.hometownCity;
    }
    return "Location not set";
  };

  // Get travel destination for display - same logic for ALL users (each user's own travel data)
  const getTravelDestination = (user: User): string | null => {
    if (user.userType === 'business') return null;
    const u = user as any;
    const toDisplay = (s: string | null | undefined): string | null => {
      if (s == null || s === '') return null;
      const t = String(s).trim();
      if (!t || t.toLowerCase() === 'null' || t.toLowerCase() === 'undefined') return null;
      return t;
    };
    const debugUsernames = ['barbara809', 'aml101371'];
    if (debugUsernames.includes(u.username)) {
      console.log(`[Travel Badge] ResponsiveUserGrid ${u.username} FULL DATA:`, JSON.stringify(u, null, 2));
    }
    // 1. From travelPlans (active trip) - use dateUtils for consistent date parsing
    const plans = u.travelPlans ?? u.travel_plans;
    if (Array.isArray(plans) && plans.length > 0) {
      const dest = getCurrentTravelDestination(plans);
      if (dest) {
        const city = String(dest).split(',')[0]?.trim();
        const r = toDisplay(city);
        if (r) return r;
      }
      // Fallback: check plan.destinationCity directly for active plans
      const now = new Date();
      for (const plan of plans) {
        const start = plan.startDate ?? plan.start_date;
        const end = plan.endDate ?? plan.end_date;
        if (start && end) {
          const s = new Date(start);
          const e = new Date(end);
          if (now >= s && now <= e) {
            const city = toDisplay(plan.destinationCity ?? plan.destination_city ?? plan.destination?.split(',')[0]?.trim());
            if (city) return city;
          }
        }
      }
    }
    // 2. From destinationCity (API-enriched - server sets ONLY for users with active travel)
    const destCity = toDisplay(u.destinationCity ?? u.destination_city);
    if (destCity) return destCity;
    // 3. From travelDestination (API - server sets ONLY from active plan)
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

  const getThingsInCommon = (user: User) => {
    const data = compatibilityDataMap?.[user.id];
    if (!data) return 0;
    return (data.sharedInterests?.length || 0) + (data.sharedActivities?.length || 0) + (data.sharedEvents?.length || 0);
  };

  const getBioSnippet = (user: User) => {
    if (!user.bio) return '';
    return user.bio.length > 100 ? user.bio.slice(0, 100) + '…' : user.bio;
  };

  const getInterestsBadge = (user: User) => {
    if (!user.interests || user.interests.length === 0) return null;
    const count = user.interests.length;
    return (
      <div className="inline-flex items-center justify-center h-10 min-w-[8rem] rounded-full px-4 text-base font-bold leading-none whitespace-nowrap bg-gradient-to-r from-blue-500 to-purple-500 border-0 appearance-none select-none gap-1.5 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200">
        <span style={{ color: 'black' }}>{count} interest{count !== 1 ? 's' : ''}</span>
      </div>
    );
  };

  // Desktop Card Component - LINKEDIN INSPIRED PROFESSIONAL DESIGN
  const DesktopUserCard = ({ user }: { user: User }) => {
    const isAvailable = availableNowIds.includes(user.id);
    const isCurrentUser = currentUserId != null && user.id === currentUserId;
    const travelDest = getTravelDestination(user);
    return (
    <Card 
      className={`group cursor-pointer bg-white dark:bg-gray-800 border hover:shadow-xl transition-all duration-200 overflow-hidden h-full min-h-[320px] flex flex-col ${isAvailable ? 'border-green-400 dark:border-green-500 ring-2 ring-green-400/30' : 'border-gray-200 dark:border-gray-700'}`}
      onClick={() => setLocation(`/profile/${user.id}`)}
    >
      {/* Cover Background */}
      <div className="h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 relative">
        {/* CRITICAL: Travel badge on hero - left corner, airplane icon */}
        {travelDest && user.userType !== 'business' && (
          <div className="absolute top-1.5 left-1.5 z-10">
            <span className="flex items-center gap-1 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow-md">
              <Plane className="w-3 h-3" />
              {travelDest}
            </span>
          </div>
        )}
        {isAvailable && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              Available Now
            </span>
          </div>
        )}
      </div>
      
      {/* Content - reduced padding so content fills card better */}
      <div className="px-2 pb-2 pt-1 -mt-12 text-center">
        {/* Large Circular Avatar with white ring */}
        <div className="flex justify-center mb-2">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 p-1.5 shadow-lg">
              <SimpleAvatar 
                user={user} 
                size="xl" 
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
        
        {/* User Info - order: 1) @username 2) bio (higher for more space) 3) X things in common (hidden for own card) 4) Nearby Local 5) Nearby Traveler */}
        <div className="min-h-[6.5rem] text-left">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
            @{user.username}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 md:line-clamp-3 min-h-[2.75rem] mt-0.5" title={user.bio || undefined}>
            {getBioSnippet(user) || '\u00A0'}
          </p>
          {!isCurrentUser && (
            <p className="text-sm font-medium text-orange-500 truncate mt-0.5">
              {getThingsInCommon(user)} things in common
            </p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5" title={formatHometownForDisplay(user)}>
            {user.userType === 'business' ? 'Business User' : formatHometownForDisplay(user)}
          </p>
          <div className="min-h-[1.25rem] mt-0.5">
            {travelDest && user.userType !== 'business' ? (
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 truncate">
                Nearby Traveler → {travelDest}
              </p>
            ) : (
              <span className="invisible text-sm">&#8203;</span>
            )}
          </div>
        </div>
        
        {/* Interests Badge */}
        <div className="flex justify-center mb-2 mt-1">
          {getInterestsBadge(user)}
        </div>
        
        {/* Connect Button - LinkedIn style (hidden for current user) */}
        {!isCurrentUser && (
        <button 
          className="w-full py-2 px-4 border-2 border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 rounded-full font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setLocation(`/profile/${user.id}`);
          }}
        >
          View Profile
        </button>
        )}
      </div>
    </Card>
  );
  };

  // Mobile Card Component - LINKEDIN INSPIRED PROFESSIONAL DESIGN
  const MobileUserCard = ({ user }: { user: User }) => {
    const isAvailable = availableNowIds.includes(user.id);
    const isCurrentUser = currentUserId != null && user.id === currentUserId;
    const travelDest = getTravelDestination(user);
    return (
    <Card 
      className={`cursor-pointer bg-white dark:bg-gray-800 border hover:shadow-xl transition-all duration-200 overflow-hidden h-full min-h-[280px] flex flex-col ${isAvailable ? 'border-green-400 dark:border-green-500 ring-2 ring-green-400/30' : 'border-gray-200 dark:border-gray-700'}`}
      onClick={() => setLocation(`/profile/${user.id}`)}
    >
      {/* Gradient Cover - smaller for mobile */}
      <div className="h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 relative">
        {/* CRITICAL: Travel badge on hero - left corner */}
        {travelDest && user.userType !== 'business' && (
          <div className="absolute top-1 left-1 z-10">
            <span className="flex items-center gap-0.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md">
              <Plane className="w-2.5 h-2.5" />
              {travelDest}
            </span>
          </div>
        )}
        {isAvailable && (
          <div className="absolute top-1 right-1">
            <span className="flex items-center gap-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg animate-pulse">
              <span className="w-1 h-1 bg-white rounded-full"></span>
              Available
            </span>
          </div>
        )}
      </div>
      
      {/* Content - reduced padding so content fills card better */}
      <div className="px-2 pb-2 -mt-8 text-center">
        {/* Circular Avatar with white ring */}
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 p-1 shadow-lg">
            <SimpleAvatar 
              user={user} 
              size="xl" 
              className="w-full h-full"
            />
          </div>
        </div>
        
        {/* User Info - order: 1) @username 2) bio (higher for more space) 3) X things in common (hidden for own card) 4) Nearby Local 5) Nearby Traveler */}
        <div className="min-h-[6rem] text-left px-1">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">
            @{user.username}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 md:line-clamp-3 min-h-[2.25rem] mt-0.5" title={user.bio || undefined}>
            {getBioSnippet(user) || '\u00A0'}
          </p>
          {!isCurrentUser && (
            <p className="text-xs font-medium text-orange-500 truncate mt-0.5">
              {getThingsInCommon(user)} things in common
            </p>
          )}
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5" title={formatHometownForDisplay(user)}>
            {user.userType === 'business' ? 'Business User' : formatHometownForDisplay(user)}
          </p>
          <div className="min-h-[1rem] mt-0.5">
            {travelDest && user.userType !== 'business' ? (
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">
                Nearby Traveler → {travelDest}
              </p>
            ) : (
              <span className="invisible text-xs">&#8203;</span>
            )}
          </div>
        </div>
        
        {/* Interests Badge - smaller */}
        <div className="flex justify-center scale-75">
          {getInterestsBadge(user)}
        </div>
      </div>
    </Card>
  );
  };

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No users found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          {showViewAll && onViewAll && (
            <button 
              onClick={onViewAll}
              className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
            >
              View All ({users.length})
            </button>
          )}
        </div>
      )}

      {/* Desktop Grid (hidden on mobile) */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayUsers.map((user) => (
          <DesktopUserCard key={user.id} user={user} />
        ))}
      </div>

      {/* Mobile Grid (hidden on desktop) */}
      <div className="md:hidden grid grid-cols-2 gap-3">
        {displayUsers.map((user) => (
          <MobileUserCard key={user.id} user={user} />
        ))}
      </div>

      {/* Mobile View All Button */}
      {showViewAll && onViewAll && users.length > limit && (
        <div className="md:hidden text-center">
          <button 
            onClick={onViewAll}
            className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
          >
            View All {users.length} Users
          </button>
        </div>
      )}
    </div>
  );
}