import React, { useState, useContext } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserPlus, MessageCircle, Handshake, Info, FileText, Clock, Star, Users } from "lucide-react";
import type { User, TravelPlan } from "@shared/schema";
import ConnectionCelebration from "./connection-celebration";
import { useConnectionCelebration } from "@/hooks/useConnectionCelebration";
import { formatDateForDisplay, getCurrentTravelDestination, getCurrentOrNextTrip } from "@/lib/dateUtils";
import { getInterestStyle, getActivityStyle, getEventStyle } from "@/lib/topChoicesUtils";
import { SimpleAvatar } from "@/components/simple-avatar";
import { parseLocalDate } from "@/lib/dateFixUtils";

interface UserCardProps {
  user: User;
  searchLocation?: string;
  showCompatibilityScore?: boolean;
  compatibilityScore?: number;
  currentUserId?: number;
}

export default function UserCard({ user, searchLocation, showCompatibilityScore = false, compatibilityScore = 0, currentUserId }: UserCardProps) {
  const authContext = useContext(AuthContext);
  const { user: currentUser, isAuthenticated } = authContext;
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isVisible, celebrationData, triggerCelebration, hideCelebration } = useConnectionCelebration();
  
  // Emergency fallback - check localStorage directly if context fails
  const [fallbackUser, setFallbackUser] = useState<User | null>(null);
  
  React.useEffect(() => {
    if (!currentUser) {
      const storedUser = localStorage.getItem('travelconnect_user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setFallbackUser(parsedUser);
        } catch (error) {
          console.error('Error parsing fallback user:', error);
        }
      }
    } else {
      setFallbackUser(null);
    }
  }, [currentUser]);

  // Use context user if available, otherwise fallback
  const effectiveUser = currentUser || fallbackUser;
  const effectiveIsAuthenticated = isAuthenticated || !!fallbackUser;
  
  // Fetch compatibility data between current user and this user
  const { data: compatibilityData } = useQuery({
    queryKey: [`/api/compatibility/${currentUserId || effectiveUser?.id}/${user.id}`],
    enabled: !!(currentUserId || effectiveUser?.id) && currentUserId !== user.id && effectiveUser?.id !== user.id,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnReconnect: false,
    retry: false
  });

  // Check connection status between current user and this user
  const { data: connectionStatus, refetch: refetchConnectionStatus } = useQuery({
    queryKey: ['/api/connections/status', effectiveUser?.id, user.id],
    queryFn: async () => {
      if (!effectiveUser?.id) return null;
      try {
        const result = await apiRequest("GET", `/api/connections/status/${effectiveUser.id}/${user.id}`);
        return result;
      } catch (error) {
        return null;
      }
    },
    enabled: !!effectiveUser?.id && effectiveUser.id !== user.id,
    staleTime: 0,
    gcTime: 0,
  });

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      const currentUserId = effectiveUser?.id;
      if (!currentUserId) throw new Error("Not authenticated");
      
      return await apiRequest("POST", "/api/connections", { 
        requesterId: currentUserId,
        targetUserId: targetUserId 
      });
    },
    onSuccess: () => {
      toast({
        title: "Connection Request Sent",
        description: "Your connection request has been sent successfully!",
      });
      
      // Force immediate cache invalidation and refetch
      queryClient.removeQueries({
        queryKey: ['/api/connections/status', effectiveUser?.id, user.id]
      });
      
      // Invalidate all connection-related queries
      queryClient.invalidateQueries({
        queryKey: ['/api/connections']
      });
      
      // Force immediate re-fetch with fresh data
      setTimeout(() => {
        refetchConnectionStatus();
      }, 50);
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to send connection request";
      const isPrivacyError = errorMessage.includes("privacy settings");
      
      toast({
        title: isPrivacyError ? "Privacy Restriction" : "Connection Failed",
        description: isPrivacyError 
          ? "This user's privacy settings prevent connection requests from new users."
          : errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    if (!effectiveIsAuthenticated) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to connect with other users",
        variant: "destructive",
      });
      return;
    }
    
    // Check if connection already exists or is pending
    if (String(connectionStatus?.status) === 'pending' || String(connectionStatus?.status) === 'accepted') {
      return;
    }
    
    // Prevent multiple requests while one is in progress
    if (connectMutation.isPending) {
      return;
    }
    
    connectMutation.mutate(user.id);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setLocation(`/profile/${user.id}`);
    // Scroll to top of page after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const getLocation = () => {
    if (user.hometownCity && user.hometownCountry) {
      return `${user.hometownCity}, ${user.hometownCountry}`;
    }
    return user.location || "Location not set";
  };

  return (
    <>
      <Card 
        className="user-card border-gray-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-800 overflow-hidden cursor-pointer transition-shadow hover:shadow-lg"
        onClick={handleCardClick}
        data-testid={`user-card-${user.id}`}
      >
        {/* Header with gradient background */}
        <div className="relative h-24 bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="absolute -bottom-6 left-4">
            <SimpleAvatar 
              user={user} 
              size="lg" 
              className="border-4 border-white shadow-lg w-12 h-12"
            />
          </div>
        </div>
      
        <CardContent className="p-4 pt-8">
          {/* User Info */}
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {user.name || `@${user.username}`}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                @{user.username}
              </p>
            </div>
            
            {/* Location and Travel Info */}
            <div className="space-y-2">
              {(() => {
                // Check if user has travel plans data and use new logic
                if ((user as any).travelPlans && Array.isArray((user as any).travelPlans)) {
                  const currentOrNextTrip = getCurrentOrNextTrip((user as any).travelPlans);
                  if (currentOrNextTrip) {
                    return (
                      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                        {currentOrNextTrip.isCurrent ? '🧳' : '✈️'} 
                        <span className="truncate">
                          {currentOrNextTrip.isCurrent ? 'Traveling to' : 'Next trip to'} {currentOrNextTrip.destination.split(',')[0]}
                        </span>
                      </div>
                    );
                  }
                }
                
                // Fallback to existing logic for backward compatibility
                if (user.isCurrentlyTraveling && user.travelDestination) {
                  return (
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                      🧳 <span className="truncate">Traveling to {user.travelDestination.split(',')[0]}</span>
                    </div>
                  );
                }
                
                return null;
              })()}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                🏠 <span className="truncate">Local in {user.hometownCity ? user.hometownCity.split(',')[0] : getLocation()}</span>
              </div>
            </div>
            
            {/* Bio */}
            {user.bio && (
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                {String(user.bio)}
              </p>
            )}
            
            {/* Things in Common Badge */}
            {compatibilityData && (() => {
              const data = compatibilityData as any;
              const totalCommon = 
                (data.sharedInterests?.length || 0) +
                (data.sharedActivities?.length || 0) +
                (data.sharedEvents?.length || 0) +
                (data.sharedTravelIntent?.length || 0) +
                (data.sharedSexualPreferences?.length || 0) +
                (data.sharedLanguages?.length || 0) +
                (data.sharedCountries?.length || 0) +
                (data.locationOverlap ? 1 : 0) +
                (data.dateOverlap ? 1 : 0) +
                (data.userTypeCompatibility ? 1 : 0) +
                (data.travelIntentCompatibility ? 1 : 0) +
                (data.bothVeterans ? 1 : 0) +
                (data.bothActiveDuty ? 1 : 0) +
                (data.sameFamilyStatus ? 1 : 0) +
                (data.sameAge ? 1 : 0) +
                (data.sameGender ? 1 : 0);
              
              return totalCommon > 0 ? (
                <div className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-400 inline-block">
                  {totalCommon} Things in Common
                </div>
              ) : null;
            })()}
            
            {/* Interests */}
            {(user.interests?.length || 0) > 0 && (
              <div className="flex flex-wrap gap-2">
                {user.interests?.slice(0, 3).map((interest) => (
                  <span 
                    key={interest} 
                    className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  >
                    {interest}
                  </span>
                ))}
                {(user.interests?.length || 0) > 3 && (
                  <span className="text-sm text-gray-500">+{(user.interests?.length || 0) - 3} more</span>
                )}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {(() => {
                if (String(user.username) === 'nearbytraveler' || String(connectionStatus?.status) === 'accepted') {
                  return (
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium"
                      disabled
                      data-testid={`button-connected-${user.id}`}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Connected
                    </Button>
                  );
                } else if (String(connectionStatus?.status) === 'pending') {
                  return (
                    <Button 
                      className="flex-1 bg-gray-500 text-white cursor-not-allowed font-medium"
                      disabled
                      data-testid={`button-pending-${user.id}`}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Pending
                    </Button>
                  );
                } else {
                  return (
                    <Button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                      onClick={handleConnect}
                      disabled={connectMutation.isPending}
                      data-testid={`button-connect-${user.id}`}
                    >
                      {connectMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  );
                }
              })()}
              <Button 
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium"
                onClick={() => setLocation(`/messages?userId=${user.id}`)}
                data-testid={`button-message-${user.id}`}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Connection Celebration Modal */}
      {celebrationData && (
        <ConnectionCelebration
          isVisible={isVisible}
          onComplete={hideCelebration}
          connectionType={celebrationData.type}
          userInfo={celebrationData.userInfo || { username: user.username }}
        />
      )}
    </>
  );
}