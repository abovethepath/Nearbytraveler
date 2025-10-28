import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Heart, MapPin, Star } from "lucide-react";
import { useLocation } from "wouter";
import { SimpleAvatar } from "@/components/simple-avatar";

interface User {
  id: number;
  username: string;
  profileImage?: string | null;
  bio?: string | null;
  hometownCity?: string | null;
  hometownCountry?: string | null;
  location?: string | null;
  interests?: string[];
  userType?: string;
  aura?: number;
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

  const getLocation = (user: User) => {
    if (user.location) return user.location;
    if (user.hometownCity && user.hometownCountry) {
      return `${user.hometownCity}, ${user.hometownCountry}`;
    }
    return "Location not set";
  };

  const getInterestsBadge = (user: User) => {
    if (!user.interests || user.interests.length === 0) return null;
    const count = user.interests.length;
    return (
      <div className="inline-flex items-center justify-center h-10 min-w-[8rem] rounded-full px-4 text-base font-bold leading-none whitespace-nowrap bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 appearance-none select-none gap-1.5 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200">
        {count} interest{count !== 1 ? 's' : ''}
      </div>
    );
  };

  // Desktop Card Component - LINKEDIN INSPIRED PROFESSIONAL DESIGN
  const DesktopUserCard = ({ user }: { user: User }) => (
    <Card 
      className="group cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 overflow-hidden"
      onClick={() => setLocation(`/profile/${user.id}`)}
    >
      {/* Cover Background */}
      <div className="h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500"></div>
      
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
        
        {/* Location */}
        <div className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{getLocation(user)}</span>
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

  // Mobile Card Component - LINKEDIN INSPIRED PROFESSIONAL DESIGN
  const MobileUserCard = ({ user }: { user: User }) => (
    <Card 
      className="cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 overflow-hidden h-full"
      onClick={() => setLocation(`/profile/${user.id}`)}
    >
      {/* Gradient Cover - smaller for mobile */}
      <div className="h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500"></div>
      
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
        
        {/* Location */}
        <div className="flex items-center justify-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
          <MapPin className="w-3 h-3" />
          <span className="truncate text-xs">{getLocation(user)}</span>
        </div>
        
        {/* Interests Badge - smaller */}
        <div className="flex justify-center scale-75">
          {getInterestsBadge(user)}
        </div>
      </div>
    </Card>
  );

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