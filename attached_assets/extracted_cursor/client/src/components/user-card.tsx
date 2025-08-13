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
import { UserPlus, MessageCircle, Handshake, Info, FileText, Clock, Star } from "lucide-react";
import type { User } from "@shared/schema";
import ConnectionCelebration from "./connection-celebration";
import { useConnectionCelebration } from "@/hooks/useConnectionCelebration";
import { formatDateForDisplay, getCurrentTravelDestination } from "@/lib/dateUtils";
import { getInterestStyle, getActivityStyle, getEventStyle } from "@/lib/topChoicesUtils";
import { SimpleAvatar } from "@/components/simple-avatar";

interface UserCardProps {
  user: User;
  searchLocation?: string;
  showCompatibilityScore?: boolean;
  compatibilityScore?: number;
}

export default function UserCard({ user, searchLocation, showCompatibilityScore = false, compatibilityScore = 0 }: UserCardProps) {
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
          console.log('UserCard using fallback user from localStorage:', parsedUser);
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

  // Check connection status between current user and this user
  const { data: connectionStatus, refetch: refetchConnectionStatus } = useQuery({
    queryKey: ['/api/connections/status', effectiveUser?.id, user.id],
    queryFn: async () => {
      if (!effectiveUser?.id) return null;
      const response = await fetch(`/api/connections/status/${effectiveUser.id}/${user.id}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!effectiveUser?.id && effectiveUser.id !== user.id,
  });



  const getFilteredInterests = (user: User) => {
    return user.interests || [];
  };

  // Define the standardized "Top Choices for Most Locals and Travelers" list
  const topChoicesInterests = [
    "Single and Looking", "Craft Beer & Breweries", "Coffee Culture", "Cocktails & Bars",
    "Nightlife & Dancing", "Photography", "Street Art", "Food Tours / Trucks", 
    "Rooftop Bars", "Pub Crawls & Bar Tours", "Local Food Specialties", "Walking Tours",
    "Happy Hour Deals", "Discounts For Travelers", "Boat & Water Tours", "Brunch Spots",
    "Adventure Tours", "City Tours & Sightseeing", "Hiking & Nature", "Museums",
    "Local Unknown Hotspots", "Meet Locals/Travelers", "Yoga & Wellness", "Live Music Venues",
    "Beach Activities", "Fine Dining", "Historical Tours", "Festivals & Events"
  ];

  const isTopChoiceInterest = (interest: string) => {
    return topChoicesInterests.includes(interest);
  };



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
      console.log('🔵 CONNECT: Connection request successful');
      
      toast({
        title: "Connection Request Sent",
        description: "Your connection request has been sent successfully!",
      });
      
      // Immediately refetch the connection status
      refetchConnectionStatus();
      
      // Invalidate connection status to refresh the button state
      queryClient.invalidateQueries({
        queryKey: ['/api/connections/status', effectiveUser?.id, user.id]
      });
      
      // Also invalidate the broader connection queries
      queryClient.invalidateQueries({
        queryKey: ['/api/connections/status']
      });
      
      // Force immediate re-fetch with fresh data
      setTimeout(() => {
        refetchConnectionStatus();
      }, 100);
      
      // Don't show celebration animation for requests - only for accepted connections
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
    
    console.log('🔵 CONNECT: Connection status check:', connectionStatus);
    console.log('🔵 CONNECT: Mutation pending:', connectMutation.isPending);
    
    // Check if connection already exists or is pending
    if (connectionStatus?.status === 'pending' || connectionStatus?.status === 'accepted') {
      console.log('🔵 CONNECT: Blocked - connection already exists/pending');
      return;
    }
    
    // Prevent multiple requests while one is in progress
    if (connectMutation.isPending) {
      console.log('🔵 CONNECT: Blocked - mutation already pending');
      return;
    }
    
    console.log('🔵 CONNECT: Proceeding with connection request');
    connectMutation.mutate(user.id);
  };

  const getTravelBackgroundImage = () => {
    const socialTravelImages = [
      'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Group of friends traveling
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // People backpacking together
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Friends on beach vacation
      'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Group hiking together
      'https://images.unsplash.com/photo-1543269664-647b4c32e8d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Friends celebrating travel
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Team working/traveling together
      'https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'  // Group adventure activities
    ];
    return socialTravelImages[user.id % socialTravelImages.length];
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

  return (
    <>
      <Card 
        className="user-card card-hover border-gray-200 dark:border-gray-700 shadow-lg bg-gray-50 dark:bg-gray-800 overflow-hidden cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Travel Photo Header */}
      <div 
        className="relative h-32 bg-cover bg-center"
        style={{
          backgroundImage: `url('${user.coverPhoto || getTravelBackgroundImage()}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        <div className="absolute -bottom-8 left-6">
          <SimpleAvatar 
            user={user} 
            size="lg" 
            className="border-3 border-white shadow-lg"
          />
        </div>
      </div>
      
      <CardContent className="p-6 pt-10">
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {user.username}
            </h3>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            <p className="text-sunset-orange font-medium">
              {(() => {
                // Check if currently traveling first using user's travel fields
                if (user.isCurrentlyTraveling && user.travelDestination) {
                  const today = new Date();
                  const startDate = user.travelStartDate ? new Date(user.travelStartDate) : null;
                  const endDate = user.travelEndDate ? new Date(user.travelEndDate) : null;
                  
                  // Check if within travel dates
                  if (startDate && endDate && today >= startDate && today <= endDate) {
                    return `✈️ Traveling to ${user.travelDestination}`;
                  }
                }
                
                // Show location based on user type
                if (user.userType === 'business') {
                  return `🏢 Nearby Business in ${user.hometownCity || 'Los Angeles'}`;
                } else {
                  return `🏠 Nearby Local in ${(user.hometownCity || user.hometown || user.location || '').split(',')[0]}`;
                }
              })()}
            </p>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{user.bio}</p>
          
          {/* Travel Interests & Preferences */}
          {((user.travelInterests?.length || 0) > 0 || (user.preferredActivities?.length || 0) > 0 || (user.plannedEvents?.length || 0) > 0) && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-600 mb-1">Travel Interests</h4>
              <div className="flex flex-wrap gap-1">
                {user.travelInterests?.slice(0, 2).map((interest) => (
                  <Badge 
                    key={interest} 
                    className={`text-xs ${getInterestStyle(interest)}`}
                  >
                    {interest}
                  </Badge>
                ))}
                {user.preferredActivities?.slice(0, 2).map((activity) => (
                  <Badge key={activity} className={`text-xs ${getActivityStyle()}`}>
                    {activity}
                  </Badge>
                ))}
                {user.plannedEvents?.slice(0, 1).map((event) => (
                  <Badge key={event} className={`text-xs ${getEventStyle()}`}>
                    {event}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Local Expertise */}
          {((user.localExpertise?.length || 0) > 0 || (user.localActivities?.length || 0) > 0) && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-600 dark:text-white mb-1">Local Expertise</h4>
              <div className="flex flex-wrap gap-1">
                {user.localExpertise?.slice(0, 2).map((expertise) => (
                  <Badge key={expertise} className="text-xs bg-orange-50 text-orange-700 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-700">
                    {expertise}
                  </Badge>
                ))}
                {user.localActivities?.slice(0, 2).map((activity) => (
                  <Badge key={activity} className="text-xs bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700">
                    {activity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* General Interests (fallback) */}
          {(!user.travelInterests?.length && !user.preferredActivities?.length && !user.plannedEvents?.length && !user.localExpertise?.length && !user.localActivities?.length) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {getFilteredInterests(user)?.slice(0, 3).map((interest) => (
                <Badge
                  key={interest}
                  className={`text-xs ${getInterestStyle(interest)}`}
                >
                  {interest}
                </Badge>
              ))}
              {(() => {
                const filteredInterests = getFilteredInterests(user);
                const totalOverflow = Math.max(0, (filteredInterests?.length || 0) - 3);
                
                return totalOverflow > 0 ? (
                  <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                    +{totalOverflow} more
                  </Badge>
                ) : null;
              })()}
            </div>
          )}
          
          {/* Compatibility Score Display */}
          {showCompatibilityScore && compatibilityScore > 0 && (
            <div className="mb-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {compatibilityScore}% Match
                </span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(compatibilityScore, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-2 mt-auto">
            {connectionStatus?.status === 'accepted' ? (
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-2 h-10 min-w-0"
                disabled
              >
                Connected
              </Button>
            ) : connectionStatus?.status === 'pending' ? (
              <Button 
                className="flex-1 bg-gray-500 text-white cursor-not-allowed text-sm px-3 py-2 h-10 min-w-0"
                disabled
              >
                Pending
              </Button>
            ) : (
              <Button 
                className="flex-1 bg-travel-blue hover:bg-blue-700 text-white btn-bounce text-sm px-3 py-2 h-10 min-w-0"
                onClick={handleConnect}
                disabled={connectMutation.isPending}
              >
                {connectMutation.isPending ? "Connecting..." : "Connect"}
              </Button>
            )}
            <Button 
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white btn-bounce text-sm px-3 py-2 h-10 min-w-0"
              onClick={() => setLocation(`/messages?userId=${user.id}`)}
            >
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