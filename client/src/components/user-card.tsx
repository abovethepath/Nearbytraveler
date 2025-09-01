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
import { formatDateForDisplay, getCurrentTravelDestination } from "@/lib/dateUtils";
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
    if (connectionStatus?.status === 'pending' || connectionStatus?.status === 'accepted') {
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
        className="user-card card-hover border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 overflow-hidden cursor-pointer h-fit"
        onClick={handleCardClick}
      >
        {/* Ultra Compact Header for Mobile */}
        <div className="relative h-8 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="absolute -bottom-3 sm:-bottom-4 left-2 sm:left-3">
            <SimpleAvatar 
              user={user} 
              size="xs" 
              className="border-2 border-white shadow-sm w-6 h-6 sm:w-8 sm:h-8"
            />
          </div>
        </div>
      
        <CardContent className="p-2 sm:p-3 pt-4 sm:pt-6">
          {/* Ultra Compact User Info */}
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
              @{user.username}
            </h3>
            
            <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1 truncate">
              {user.isCurrentlyTraveling && user.travelDestination ? (
                <>🧳 <span className="truncate">Traveling to {user.travelDestination.split(',')[0]}</span></>
              ) : (
                <>🏠 <span className="truncate">Local {user.hometownCity ? user.hometownCity.split(',')[0] : getLocation()}</span></>
              )}
            </div>
            
            {/* Compact Bio - Hidden on mobile for space */}
            {user.bio && (
              <p className="hidden sm:block text-xs text-gray-700 dark:text-gray-300 line-clamp-1 leading-tight">
                {user.bio}
              </p>
            )}
            
            {/* Things in Common Badge - Ultra Compact */}
            {compatibilityData && (compatibilityData.sharedInterests?.length > 0 || compatibilityData.sharedActivities?.length > 0 || compatibilityData.sharedEvents?.length > 0) && (
              <div className="bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-400 inline-block">
                {(compatibilityData.sharedInterests?.length || 0) + (compatibilityData.sharedActivities?.length || 0) + (compatibilityData.sharedEvents?.length || 0)} Things in Common
              </div>
            )}
            
            {/* Ultra Compact Interests - Only show 1 on mobile */}
            {(user.interests?.length || 0) > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {user.interests?.slice(0, 1).map((interest) => (
                  <span 
                    key={interest} 
                    className="inline-flex items-center justify-center h-3 sm:h-4 rounded-full px-1 sm:px-2 text-xs font-medium leading-none whitespace-nowrap bg-blue-500 text-white truncate max-w-16 sm:max-w-none"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}
            
            {/* Ultra Compact Buttons */}
            <div className="flex gap-1 mt-2 sm:mt-3">
              {(() => {
                if (user.username === 'nearbytraveler' || connectionStatus?.status === 'accepted') {
                  return (
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs px-1 sm:px-2 py-1 h-6 sm:h-7 min-w-0"
                      disabled
                    >
                      ✓
                    </Button>
                  );
                } else if (connectionStatus?.status === 'pending') {
                  return (
                    <Button 
                      className="flex-1 bg-gray-500 text-white cursor-not-allowed text-xs px-1 sm:px-2 py-1 h-6 sm:h-7 min-w-0"
                      disabled
                    >
                      ⏳
                    </Button>
                  );
                } else {
                  return (
                    <Button 
                      className="flex-1 bg-travel-blue hover:bg-blue-700 text-white text-xs px-1 sm:px-2 py-1 h-6 sm:h-7 min-w-0"
                      onClick={handleConnect}
                      disabled={connectMutation.isPending}
                    >
                      {connectMutation.isPending ? "..." : "+"}
                    </Button>
                  );
                }
              })()}
              <Button 
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs px-1 sm:px-2 py-1 h-6 sm:h-7 min-w-0"
                onClick={() => setLocation(`/messages?userId=${user.id}`)}
              >
                💬
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