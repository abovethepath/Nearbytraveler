import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Hash, Crown, Plane } from "lucide-react";

interface EnhancedUserGridProps {
  users: any[];
  currentUser: any;
  onUserClick: (user: any) => void;
}

export function EnhancedUserGrid({ users, currentUser, onUserClick }: EnhancedUserGridProps) {
  
  // Calculate things in common between current user and another user
  const calculateThingsInCommon = (user: any) => {
    if (!currentUser || user.id === currentUser.id) return 0;
    
    const currentInterests = new Set(currentUser.interests || []);
    const currentActivities = new Set(currentUser.activities || []);
    const currentEvents = new Set(currentUser.localEvents || []);
    
    const userInterests = user.interests || [];
    const userActivities = user.activities || [];
    const userEvents = user.localEvents || [];
    
    let commonCount = 0;
    
    // Count common interests
    userInterests.forEach((interest: string) => {
      if (currentInterests.has(interest)) commonCount++;
    });
    
    // Count common activities  
    userActivities.forEach((activity: string) => {
      if (currentActivities.has(activity)) commonCount++;
    });
    
    // Count common events
    userEvents.forEach((event: string) => {
      if (currentEvents.has(event)) commonCount++;
    });
    
    return commonCount;
  };

  // Format location display
  const formatLocation = (city: string, state: string, country: string) => {
    if (!city) return 'Unknown Location';
    
    const parts = [city];
    if (state) parts.push(state);
    if (country && country !== state) parts.push(country);
    
    return parts.join(', ');
  };

  // Sort users with current user first, then by things in common
  const sortedUsers = React.useMemo(() => {
    const otherUsers = users.filter(user => user.id !== currentUser?.id);
    const usersWithCommonality = otherUsers.map(user => ({
      ...user,
      thingsInCommon: calculateThingsInCommon(user)
    })).sort((a, b) => b.thingsInCommon - a.thingsInCommon);
    
    return currentUser ? [{ ...currentUser, thingsInCommon: 0 }, ...usersWithCommonality] : usersWithCommonality;
  }, [users, currentUser]);

  const UserCard = ({ user, isCurrentUser }: { user: any; isCurrentUser: boolean }) => (
    <Card 
      className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
        isCurrentUser ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
      onClick={() => onUserClick?.(user)}
    >
      {isCurrentUser && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-blue-500 text-white p-1 rounded-full">
            <Crown className="w-4 h-4" />
          </div>
        </div>
      )}
      
      <CardContent className="p-4 text-center">
        {/* Avatar */}
        <div className="flex justify-center mb-3">
          <Avatar className="w-16 h-16 ring-2 ring-gray-200 dark:ring-gray-700">
            <AvatarImage src={user.profileImage} alt={`${user.username}'s avatar`} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold text-lg">
              {user.username?.[0]?.toUpperCase() || user.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Username */}
        <div className="mb-2">
          <p className="font-semibold text-gray-900 dark:text-white text-sm">
            @{user.username}
            {isCurrentUser && <span className="text-blue-500 ml-1">(You)</span>}
          </p>
        </div>

        {/* Hometown */}
        <div className="mb-2">
          <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 dark:text-gray-300">
            <MapPin className="w-3 h-3" />
            <span className="truncate text-xs">
              {formatLocation(user.hometownCity, user.hometownState, user.hometownCountry)}
            </span>
          </div>
        </div>

        {/* Currently Traveling */}
        {user.isCurrentlyTraveling && user.travelDestination && (
          <div className="mb-2">
            <div className="flex items-center justify-center space-x-1 text-sm text-orange-600 dark:text-orange-400">
              <Plane className="w-3 h-3" />
              <span className="truncate font-medium text-xs">
                {user.travelDestination}
              </span>
            </div>
          </div>
        )}

        {/* Things in Common */}
        {!isCurrentUser && (
          <div className="mt-3">
            <Badge variant="secondary" className="text-xs">
              <Hash className="w-3 h-3 mr-1" />
              {user.thingsInCommon} things in common
            </Badge>
          </div>
        )}

        {/* Current User Badge */}
        {isCurrentUser && (
          <div className="mt-3">
            <Badge className="text-xs bg-blue-500 text-white">
              That's You!
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedUsers.map((user) => (
          <UserCard 
            key={user.id} 
            user={user} 
            isCurrentUser={user.id === currentUser?.id}
          />
        ))}
      </div>

      {sortedUsers.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No users found matching your criteria</p>
        </div>
      )}
    </div>
  );
}