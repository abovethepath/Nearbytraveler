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

  // Fetch travel plans to show travel dates when visiting cities
  const { data: userTravelPlans = [] } = useQuery({
    queryKey: [`/api/travel-plans/${user.id}`],
    enabled: !!user.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });



  // Check connection status between current user and this user
  const { data: connectionStatus, refetch: refetchConnectionStatus } = useQuery({
    queryKey: ['/api/connections/status', effectiveUser?.id, user.id],
    queryFn: async () => {
      if (!effectiveUser?.id) return null;
      console.log(`🔄 CONNECTION API: Checking connection between user ${effectiveUser.id} and ${user.id}`);
      const response = await fetch(`/api/connections/status/${effectiveUser.id}/${user.id}`);
      if (!response.ok) return null;
      const result = await response.json();
      console.log(`🔄 CONNECTION API: Result for ${effectiveUser.id} <-> ${user.id}:`, result);
      return result;
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

  // Helper function to determine if user is in their hometown vs traveling
  const getLocationContext = () => {
    if (!searchLocation) return { type: 'unknown', title: 'Areas of Interest' };
    
    // Check if this is their hometown
    const isHometown = searchLocation.toLowerCase().includes(user.hometownCity?.toLowerCase() || '');
    if (isHometown) {
      return { type: 'hometown', title: 'Local Expertise' };
    }
    
    // Check if they have a travel plan to this city
    const searchCity = searchLocation.split(',')[0].trim();
    const matchingTravelPlan = (userTravelPlans as TravelPlan[])?.find((plan: TravelPlan) => 
      plan.destination?.toLowerCase().includes(searchCity.toLowerCase())
    );
    
    if (matchingTravelPlan) {
      // FIXED: Use shared date utility to prevent timezone conversion issues
      const startDate = parseLocalDate(matchingTravelPlan.startDate);
      const endDate = parseLocalDate(matchingTravelPlan.endDate);
      
      if (!startDate || !endDate) {
        return { type: 'general', title: 'Areas of Interest' };
      }
      
      const formattedStart = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const formattedEnd = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      return { 
        type: 'traveling', 
        title: `Visiting ${formattedStart} - ${formattedEnd}`,
        dates: { start: startDate, end: endDate }
      };
    }
    
    // Fallback
    return { type: 'general', title: 'Areas of Interest' };
  };

  const locationContext = getLocationContext();



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
        {/* Cover Photo Header - Only show if user has a real cover photo */}
        {user.coverPhoto ? (
          <div 
            className="relative h-32 bg-cover bg-center"
            style={{
              backgroundImage: `url('${user.coverPhoto}')`,
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
        ) : (
          /* No cover photo - clean header with just avatar */
          <div className="relative h-16 bg-gradient-to-r from-blue-500 to-purple-600">
            <div className="absolute -bottom-8 left-6">
              <SimpleAvatar 
                user={user} 
                size="lg" 
                className="border-3 border-white shadow-lg"
              />
            </div>
          </div>
        )}
      
      <CardContent className="p-6 pt-10">
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {user.username}
            </h3>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            <div className="flex items-center gap-2">
              {(() => {
                const today = new Date();
                
                // First, check if user has active travel plans using travel plans data
                const activeTravelPlan = userTravelPlans?.find((plan: TravelPlan) => {
                  const startDate = parseLocalDate(plan.startDate);
                  const endDate = parseLocalDate(plan.endDate);
                  return startDate && endDate && today >= startDate && today <= endDate;
                });
                
                if (activeTravelPlan) {
                  const city = activeTravelPlan.destinationCity || activeTravelPlan.destination.split(',')[0];
                  return (
                    <>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        Traveling
                      </span>
                      <span className="text-green-700 dark:text-green-300 font-medium">
                        📍 {city}
                      </span>
                    </>
                  );
                }
                
                // Check for future travel plans
                const futureTravelPlan = userTravelPlans?.find((plan: TravelPlan) => {
                  const startDate = parseLocalDate(plan.startDate);
                  return startDate && startDate > today;
                });
                
                if (futureTravelPlan) {
                  const startDate = parseLocalDate(futureTravelPlan.startDate);
                  const options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
                  const startMonth = startDate ? startDate.toLocaleDateString('en-US', options) : '';
                  const city = futureTravelPlan.destinationCity || futureTravelPlan.destination.split(',')[0];
                  return (
                    <>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                        Planning Trip
                      </span>
                      <span className="text-blue-700 dark:text-blue-300 font-medium">
                        ✈️ {city} in {startMonth}
                      </span>
                    </>
                  );
                }
                
                // Fallback to checking user's direct travel fields
                if (user.isCurrentlyTraveling && user.travelDestination) {
                  const startDate = user.travelStartDate ? parseLocalDate(user.travelStartDate) : null;
                  const endDate = user.travelEndDate ? parseLocalDate(user.travelEndDate) : null;
                  
                  // Check if within travel dates
                  if (startDate && endDate && today >= startDate && today <= endDate) {
                    return (
                      <>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                          Traveling
                        </span>
                        <span className="text-green-700 dark:text-green-300 font-medium">
                          📍 {user.travelDestination}
                        </span>
                      </>
                    );
                  }
                }
                
                // Show location based on user type and hometown
                if (user.userType === 'business') {
                  return (
                    <>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                        Business
                      </span>
                      <span className="text-purple-700 dark:text-purple-300 font-medium">
                        🏢 {user.hometownCity || 'Los Angeles'}
                      </span>
                    </>
                  );
                } else {
                  // For locals and travelers not currently traveling, show their hometown
                  return (
                    <>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        <span className="w-2 h-2 bg-gray-500 rounded-full mr-1"></span>
                        From
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        🏠 {(user.hometownCity || user.hometown || user.location || '').split(',')[0]}
                      </span>
                    </>
                  );
                }
              })()}
            </div>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{user.bio}</p>
          
          {/* Travel Interests & Preferences */}
          {((user.travelInterests?.length || 0) > 0 || (user.preferredActivities?.length || 0) > 0 || (user.plannedEvents?.length || 0) > 0) && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-600 mb-1">Travel Interests</h4>
              <div className="flex flex-wrap gap-1">
                {user.travelInterests?.slice(0, 2).map((interest) => (
                  <div 
                    key={interest} 
                    className="inline-flex items-center justify-center h-8 min-w-[7rem] rounded-full px-3 text-sm font-medium leading-none whitespace-nowrap bg-blue-500 text-white border-0 appearance-none select-none gap-1.5"
                  >
                    {interest}
                  </div>
                ))}
                {user.preferredActivities?.slice(0, 2).map((activity) => (
                  <div key={activity} className="inline-flex items-center justify-center h-8 min-w-[7rem] rounded-full px-3 text-sm font-medium leading-none whitespace-nowrap bg-green-500 text-white border-0 appearance-none select-none gap-1.5">
                    {activity}
                  </div>
                ))}
                {user.plannedEvents?.slice(0, 1).map((event) => (
                  <div key={event} className="inline-flex items-center justify-center h-8 min-w-[7rem] rounded-full px-3 text-sm font-medium leading-none whitespace-nowrap bg-purple-500 text-white border-0 appearance-none select-none gap-1.5">
                    {event}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Smart Context-Aware Section */}
          {((user.localExpertise?.length || 0) > 0 || (user.localActivities?.length || 0) > 0) && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-600 dark:text-white mb-1">{locationContext.title}</h4>
              
              {locationContext.type === 'traveling' ? (
                // Show travel status for visiting cities
                <div className="flex flex-col gap-1">
                  <Badge className="text-xs bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-700">
                    <Clock className="w-3 h-3 mr-1" />
                    Travel Plan
                  </Badge>
                  <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Handshake className="w-3 h-3" />
                    <span>Vouches: Can get from vouched users, can give once vouched</span>
                  </div>
                </div>
              ) : (
                // Show interests/expertise for hometown or general
                <div className="flex flex-col gap-1">
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
                  <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Handshake className="w-3 h-3" />
                    <span>Vouches: Can get from vouched users, can give once vouched</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* General Interests (fallback) */}
          {(!user.travelInterests?.length && !user.preferredActivities?.length && !user.plannedEvents?.length && !user.localExpertise?.length && !user.localActivities?.length) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {getFilteredInterests(user)?.slice(0, 3).map((interest) => (
                <div
                  key={interest}
                  className="inline-flex items-center justify-center h-8 min-w-[7rem] rounded-full px-3 text-sm font-medium leading-none whitespace-nowrap bg-blue-500 text-white border-0 appearance-none select-none gap-1.5"
                >
                  {interest}
                </div>
              ))}
              {(() => {
                const filteredInterests = getFilteredInterests(user);
                const totalOverflow = Math.max(0, (filteredInterests?.length || 0) - 3);
                
                return totalOverflow > 0 ? (
                  <div className="inline-flex items-center justify-center h-8 min-w-[7rem] rounded-full px-3 text-sm font-medium leading-none whitespace-nowrap bg-blue-500 text-white border-0 appearance-none select-none gap-1.5">
                    +{totalOverflow} more
                  </div>
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
            {(() => {
              console.log(`🔘 BUTTON: Rendering for user ${user.username} (id: ${user.id}), connectionStatus:`, connectionStatus);
              console.log(`🔘 BUTTON: effectiveUser:`, effectiveUser);
              console.log(`🔘 BUTTON: Is nearbytraveler?`, user.username === 'nearbytraveler');
              console.log(`🔘 BUTTON: Connection status accepted?`, connectionStatus?.status === 'accepted');
              
              if (user.username === 'nearbytraveler' || connectionStatus?.status === 'accepted') {
                return (
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-2 h-10 min-w-0"
                    disabled
                  >
                    Connected
                  </Button>
                );
              } else if (connectionStatus?.status === 'pending') {
                return (
                  <Button 
                    className="flex-1 bg-gray-500 text-white cursor-not-allowed text-sm px-3 py-2 h-10 min-w-0"
                    disabled
                  >
                    Pending
                  </Button>
                );
              } else {
                return (
                  <Button 
                    className="flex-1 bg-travel-blue hover:bg-blue-700 text-white btn-bounce text-sm px-3 py-2 h-10 min-w-0"
                    onClick={handleConnect}
                    disabled={connectMutation.isPending}
                  >
                    {connectMutation.isPending ? "Connecting..." : "Connect"}
                  </Button>
                );
              }
            })()}
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