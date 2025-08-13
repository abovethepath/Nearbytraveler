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
      <Badge variant="secondary" className="text-xs">
        {count} interest{count !== 1 ? 's' : ''}
      </Badge>
    );
  };

  // Desktop Card Component - LARGER SIZE FOR BETTER DESKTOP EXPERIENCE
  const DesktopUserCard = ({ user }: { user: User }) => (
    <Card 
      className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => setLocation(`/profile/${user.id}`)}
    >
      <div className="flex items-start space-x-4">
        <SimpleAvatar 
          user={user} 
          size="lg" 
          className="flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">@{user.username}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{getLocation(user)}</span>
          </div>
          {user.bio && (
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-3">
              {user.bio}
            </p>
          )}
          <div className="flex items-center justify-between">
            {getInterestsBadge(user)}
            {user.aura && user.aura > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{user.aura}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  // Mobile Compact Card Component (optimized for 3 per screen)
  const MobileUserCard = ({ user }: { user: User }) => (
    <div 
      className="flex-shrink-0 w-28 cursor-pointer"
      onClick={() => setLocation(`/profile/${user.id}`)}
    >
      <Card className="p-3 h-full">
        <div className="flex flex-col items-center text-center space-y-2">
          <SimpleAvatar 
            user={user} 
            size="sm" 
            className="mx-auto"
          />
          <div className="w-full">
            <h3 className="font-semibold text-xs truncate">@{user.username}</h3>
            <div className="flex items-center justify-center gap-1 text-xs text-gray-600 dark:text-gray-400 mt-1">
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate text-xs">{getLocation(user).split(',')[0]}</span>
            </div>
            {user.userType && (
              <Badge variant="outline" className="text-xs mt-1 px-1 py-0">
                {user.userType === 'current_traveler' ? 'Traveler' : 
                 user.userType === 'local' ? 'Local' : 'Business'}
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </div>
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

      {/* Mobile Horizontal Scroll (hidden on desktop) */}
      <div className="md:hidden">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {displayUsers.map((user) => (
            <MobileUserCard key={user.id} user={user} />
          ))}
        </div>
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