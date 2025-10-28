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

  // Desktop Card Component - MODERN 2025 GLASS MORPHISM DESIGN
  const DesktopUserCard = ({ user }: { user: User }) => (
    <Card 
      className="group relative p-6 cursor-pointer bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border-2 border-white/20 dark:border-gray-700/20 hover:border-blue-500/30 dark:hover:border-orange-500/30 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
      onClick={() => setLocation(`/profile/${user.id}`)}
    >
      {/* Subtle gradient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-orange-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative flex items-start space-x-4">
        <div className="relative flex-shrink-0">
          {/* Avatar glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-orange-400 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
          <SimpleAvatar 
            user={user} 
            size="lg" 
            className="relative ring-2 ring-white/50 dark:ring-gray-700/50"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-orange-500 transition-all duration-300">
            @{user.username}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span className="truncate font-medium">{getLocation(user)}</span>
          </div>
          {user.bio && (
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-3 leading-relaxed">
              {user.bio}
            </p>
          )}
          <div className="flex items-center justify-between">
            {getInterestsBadge(user)}
            {user.aura && user.aura > 0 && (
              <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{user.aura}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  // Mobile Card Component - MODERN 2025 GLASS MORPHISM DESIGN
  const MobileUserCard = ({ user }: { user: User }) => (
    <Card 
      className="group relative p-4 cursor-pointer bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-2 border-white/30 dark:border-gray-700/30 hover:border-blue-500/40 dark:hover:border-orange-500/40 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.05] h-full"
      onClick={() => setLocation(`/profile/${user.id}`)}
    >
      {/* Gradient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-orange-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative flex flex-col items-center text-center space-y-3">
        <div className="relative">
          {/* Avatar glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-orange-400 rounded-lg blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
          <SimpleAvatar 
            user={user} 
            size="xl" 
            className="relative w-20 h-20 rounded-xl ring-2 ring-white/50 dark:ring-gray-700/50"
          />
        </div>
        <div className="w-full space-y-2">
          <h3 className="font-bold text-base truncate bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-orange-500 transition-all duration-300">
            @{user.username}
          </h3>
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <MapPin className="w-3 h-3 text-blue-500" />
            <span className="truncate font-medium">{getLocation(user)}</span>
          </div>
          <div className="scale-90">
            {getInterestsBadge(user)}
          </div>
          {user.aura && user.aura > 0 && (
            <div className="flex items-center justify-center gap-1 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 px-2 py-1 rounded-full">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{user.aura}</span>
            </div>
          )}
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