import React, { useState, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "@/App";
import UserCard from "@/components/user-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { MapPin, Users, Globe, Plane, Home, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { User } from "@shared/schema";

interface EnhancedDiscoveryProps {
  className?: string;
}

export default function EnhancedDiscovery({ className = "" }: EnhancedDiscoveryProps) {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("hometown");
  const [sortBy, setSortBy] = useState<'compatibility' | 'recent' | 'closest_nearby' | 'travel_experience' | 'mutual_connections'>('compatibility');
  
  // Use localStorage user if context user is not ready yet
  const effectiveUser = user || (function() {
    try {
      const stored = localStorage.getItem('travelconnect_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const userId = effectiveUser?.id;
  const hometownCity = effectiveUser?.hometownCity;
  const currentTravelDestination = effectiveUser?.isCurrentlyTraveling ? effectiveUser?.travelDestination : null;

  // Get travel plans to show planned destinations
  const { data: travelPlans } = useQuery({
    queryKey: ['/api/travel-plans', userId],
    enabled: !!userId,
  });

  // Enhanced discovery locations
  const discoveryLocations = useMemo(() => {
    const locations = [];
    
    // Hometown users
    if (hometownCity) {
      locations.push({
        key: 'hometown',
        label: `${hometownCity} Locals`,
        location: `${hometownCity}, ${effectiveUser?.hometownState}, ${effectiveUser?.hometownCountry}`,
        icon: Home,
        description: `Connect with locals in your hometown`
      });
    }
    
    // Current travel destination
    if (currentTravelDestination) {
      locations.push({
        key: 'current',
        label: `${currentTravelDestination.split(',')[0]} Travelers`,
        location: currentTravelDestination,
        icon: Plane,
        description: `Connect with travelers in your current destination`
      });
    }
    
    // Planned destinations
    if (travelPlans && travelPlans.length > 0) {
      travelPlans.forEach((plan: any, index: number) => {
        if (plan.destination && plan.destination !== currentTravelDestination) {
          locations.push({
            key: `planned-${index}`,
            label: `${plan.destination.split(',')[0]} (Planned)`,
            location: plan.destination,
            icon: Globe,
            description: `Connect with people for your upcoming trip`
          });
        }
      });
    }
    
    return locations;
  }, [hometownCity, effectiveUser?.hometownState, effectiveUser?.hometownCountry, currentTravelDestination, travelPlans]);

  // Get users for the active location
  const activeLocation = discoveryLocations.find(loc => loc.key === activeTab);
  
  const { data: discoveredUsers, isLoading } = useQuery({
    queryKey: ['/api/users/search-by-location', activeLocation?.location],
    enabled: !!activeLocation?.location,
  });

  // Enhanced users with mutual connections data
  const { data: usersWithMutualConnections, isLoading: mutualConnectionsLoading } = useQuery({
    queryKey: ['/api/users-with-mutual-connections', userId, discoveredUsers?.map((u: any) => u.id)],
    queryFn: async () => {
      if (!discoveredUsers || !userId) return [];
      
      // Get mutual connections count for each user
      const usersWithMutuals = await Promise.all(
        discoveredUsers.map(async (user: any) => {
          if (user.id === userId) return { ...user, mutualConnectionsCount: 0 };
          
          try {
            const response = await fetch(`/api/mutual-connections/${userId}/${user.id}`);
            const mutualConnections = await response.json();
            return {
              ...user,
              mutualConnectionsCount: mutualConnections.length,
              mutualConnections: mutualConnections
            };
          } catch (error) {
            console.error(`Failed to fetch mutual connections for user ${user.id}:`, error);
            return { ...user, mutualConnectionsCount: 0 };
          }
        })
      );
      
      return usersWithMutuals;
    },
    enabled: !!(discoveredUsers && userId && discoveredUsers.length > 0),
  });

  // Enhanced sorting algorithm
  const getSortedUsers = (users: User[]) => {
    if (!users || !effectiveUser) return [];
    
    return [...users].sort((a, b) => {
      switch (sortBy) {
        case 'compatibility':
          // Calculate compatibility score based on interests, activities, travel style
          const aScore = calculateCompatibilityScore(a, effectiveUser);
          const bScore = calculateCompatibilityScore(b, effectiveUser);
          return bScore - aScore;
          
        case 'travel_experience':
          // Sort by travel plans count and experience
          const aTravelScore = (a.travelPlans?.length || 0) + (a.countries?.length || 0);
          const bTravelScore = (b.travelPlans?.length || 0) + (b.countries?.length || 0);
          return bTravelScore - aTravelScore;
          
        case 'mutual_connections':
          // Sort by number of mutual connections (highest first)
          const aMutualCount = (a as any).mutualConnectionsCount || 0;
          const bMutualCount = (b as any).mutualConnectionsCount || 0;
          if (aMutualCount !== bMutualCount) {
            return bMutualCount - aMutualCount;
          }
          // If mutual counts are equal, fall back to compatibility
          return calculateCompatibilityScore(b, effectiveUser) - calculateCompatibilityScore(a, effectiveUser);
          
        case 'closest_nearby':
          // Sort by location proximity
          const aDistance = calculateLocationDistance(a, effectiveUser);
          const bDistance = calculateLocationDistance(b, effectiveUser);
          return aDistance - bDistance;
          
        case 'recent':
        default:
          // Sort by recent activity
          return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      }
    });
  };

  // Calculate compatibility score based on shared interests and travel style
  const calculateCompatibilityScore = (otherUser: User, currentUser: User): number => {
    let score = 0;
    
    // Shared interests
    const userInterests = currentUser.interests || [];
    const otherInterests = otherUser.interests || [];
    const sharedInterests = userInterests.filter(interest => otherInterests.includes(interest));
    score += sharedInterests.length * 10;
    
    // Shared activities
    const userActivities = currentUser.activities || [];
    const otherActivities = otherUser.activities || [];
    const sharedActivities = userActivities.filter(activity => otherActivities.includes(activity));
    score += sharedActivities.length * 8;
    
    // Age compatibility (prefer similar ages)
    if (currentUser.age && otherUser.age) {
      const ageDiff = Math.abs(currentUser.age - otherUser.age);
      score += Math.max(0, 20 - ageDiff);
    }
    
    // Travel style compatibility
    if (currentUser.travelStyle === otherUser.travelStyle) {
      score += 15;
    }
    
    // Boost for verified profiles
    if (otherUser.isVerified) {
      score += 5;
    }
    
    return score;
  };

  // Calculate rough location distance (simplified)
  const calculateLocationDistance = (otherUser: User, currentUser: User): number => {
    // This is a simplified distance calculation
    // In a real app, you'd use actual geocoding
    const currentCity = currentUser.hometownCity?.toLowerCase() || '';
    const otherCity = otherUser.hometownCity?.toLowerCase() || '';
    
    if (currentCity === otherCity) return 0;
    
    const currentState = currentUser.hometownState?.toLowerCase() || '';
    const otherState = otherUser.hometownState?.toLowerCase() || '';
    
    if (currentState === otherState) return 1;
    
    const currentCountry = currentUser.hometownCountry?.toLowerCase() || '';
    const otherCountry = otherUser.hometownCountry?.toLowerCase() || '';
    
    if (currentCountry === otherCountry) return 2;
    
    return 3;
  };

  const sortedUsers = useMemo(() => {
    if (!discoveredUsers) return [];
    // Keep current user in discovery - they should see themselves as newest member
    return getSortedUsers(discoveredUsers);
  }, [discoveredUsers, sortBy, userId, effectiveUser]);

  // Check if user is truly not authenticated (not just loading)
  if (!user && !localStorage.getItem('travelconnect_user')) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Please log in to discover people</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Discover People
          </CardTitle>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compatibility">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Best Match
                </div>
              </SelectItem>
              <SelectItem value="closest_nearby">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Closest Nearby
                </div>
              </SelectItem>
              <SelectItem value="travel_experience">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Most Traveled
                </div>
              </SelectItem>
              <SelectItem value="recent">Recently Active</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {discoveryLocations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Complete your profile to discover people!</p>
            <Button onClick={() => window.location.href = '/profile'}>
              Update Profile
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-1 mb-4" style={{ gridTemplateColumns: `repeat(${discoveryLocations.length}, 1fr)` }}>
              {discoveryLocations.map((location) => {
                const Icon = location.icon;
                return (
                  <TabsTrigger key={location.key} value={location.key} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {location.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {discoveryLocations.map((location) => (
              <TabsContent key={location.key} value={location.key}>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{location.description}</p>
                  {activeLocation && (
                    <Badge variant="outline" className="mt-2">
                      <MapPin className="h-3 w-3 mr-1" />
                      {activeLocation.location}
                    </Badge>
                  )}
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : sortedUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-2">No people found in this location yet</p>
                    <p className="text-sm text-gray-400">Be the first to connect here!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedUsers.slice(0, 6).map((discoveredUser: User) => (
                      <UserCard 
                        key={discoveredUser.id} 
                        user={discoveredUser}
                        showCompatibilityScore={sortBy === 'compatibility'}
                        compatibilityScore={calculateCompatibilityScore(discoveredUser, effectiveUser)}
                        currentUserId={effectiveUser?.id}
                      />
                    ))}
                    
                    {sortedUsers.length > 6 && (
                      <div className="text-center pt-4">
                        <Button
                          variant="outline"
                          onClick={() => window.location.href = `/users?location=${encodeURIComponent(activeLocation?.location || '')}`}
                        >
                          View All {sortedUsers.length} People
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}