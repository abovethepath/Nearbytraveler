import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Heart, MapPin, Star, Plane } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SimpleAvatar } from "@/components/simple-avatar";

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
  destinationCity?: string | null;
}

interface ResponsiveUserGridProps {
  users: User[];
  title?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  limit?: number;
}

export default function ResponsiveUserGrid({ 
  users, 
  title, 
  showViewAll, 
  onViewAll, 
  limit = 6 
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

  // CRITICAL: Get travel destination from ALL sources - MUST show when user is Nearby Traveler
  const getTravelDestination = (user: User): string | null => {
    if (user.userType === 'business') return null;
    const raw = user.destinationCity || (user.travelDestination && user.travelDestination.split(',')[0]?.trim());
    const dest = raw && String(raw).toLowerCase() !== 'null' && String(raw).trim() ? raw.trim() : null;
    if (dest) return dest;
    const plans = (user as any).travelPlans;
    if (Array.isArray(plans)) {
      const now = new Date();
      const active = plans.find((p: any) => {
        try {
          const start = new Date(p.startDate);
          const end = new Date(p.endDate);
          return now >= start && now <= end;
        } catch { return false; }
      });
      const c = active?.destinationCity || (active?.destination && active.destination.split(',')[0]?.trim());
      if (c && String(c).toLowerCase() !== 'null') return c;
    }
    return null;
  };

  // 4-line block: Line 1 Nearby Local, Line 2 city, Line 3 Nearby Traveler, Line 4 destination (mobile-friendly)
  const UserLocationLines = ({ user }: { user: User }) => {
    if (user.userType === 'business') {
      return <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">Business User</span>;
    }
    const hometown = user.hometownCity || '—';
    const destination = getTravelDestination(user);
    const isTraveling = !!destination || !!(user as any).isCurrentlyTraveling;
    return (
      <div className="text-center text-gray-600 dark:text-gray-400 font-medium min-w-0">
        <div className="text-sm sm:text-base font-semibold text-orange-600 dark:text-orange-400 whitespace-nowrap">Nearby Local</div>
        <div className="truncate px-0.5" title={hometown}>{hometown}</div>
        {isTraveling && destination && (
          <>
            <div className="text-sm sm:text-base font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">Nearby Traveler</div>
            <div className="truncate px-0.5 font-semibold text-blue-600 dark:text-blue-400" title={destination}>
              {destination}
            </div>
          </>
        )}
      </div>
    );
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
    const travelDest = getTravelDestination(user);
    return (
    <Card 
      className={`group cursor-pointer bg-white dark:bg-gray-800 border hover:shadow-xl transition-all duration-200 overflow-hidden ${isAvailable ? 'border-green-400 dark:border-green-500 ring-2 ring-green-400/30' : 'border-gray-200 dark:border-gray-700'}`}
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
      
      {/* Content */}
      <div className="px-6 pb-6 -mt-12 text-center">
        {/* Large Circular Avatar with white ring */}
        <div className="flex justify-center mb-4">
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
        
        {/* User Info */}
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 truncate">
          {user.username}
        </h3>
        
        {/* Subtitle - 4 lines: Nearby Local, city, Nearby Traveler, destination */}
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">
          <UserLocationLines user={user} />
        </div>
        
        {/* Bio */}
        {user.bio && (
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-4 px-2">
            {user.bio}
          </p>
        )}
        
        {/* Interests Badge */}
        <div className="flex justify-center mb-4">
          {getInterestsBadge(user)}
        </div>
        
        {/* Connect Button - LinkedIn style */}
        <button 
          className="w-full py-2 px-4 border-2 border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 rounded-full font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setLocation(`/profile/${user.id}`);
          }}
        >
          View Profile
        </button>
      </div>
    </Card>
  );
  };

  // Mobile Card Component - LINKEDIN INSPIRED PROFESSIONAL DESIGN
  const MobileUserCard = ({ user }: { user: User }) => {
    const isAvailable = availableNowIds.includes(user.id);
    const travelDest = getTravelDestination(user);
    return (
    <Card 
      className={`cursor-pointer bg-white dark:bg-gray-800 border hover:shadow-xl transition-all duration-200 overflow-hidden h-full ${isAvailable ? 'border-green-400 dark:border-green-500 ring-2 ring-green-400/30' : 'border-gray-200 dark:border-gray-700'}`}
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
      
      {/* Content */}
      <div className="px-3 pb-4 -mt-8 text-center">
        {/* Circular Avatar with white ring */}
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 p-1 shadow-lg">
            <SimpleAvatar 
              user={user} 
              size="xl" 
              className="w-full h-full"
            />
          </div>
        </div>
        
        {/* Username */}
        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1 truncate px-1">
          {user.username}
        </h3>
        
        {/* Subtitle - 4 lines: Nearby Local, city, Nearby Traveler, destination */}
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3 font-medium min-w-0">
          <UserLocationLines user={user} />
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