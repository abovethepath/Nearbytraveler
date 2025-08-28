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
  
  // EXACT weather widget logic for current user location display
  const [currentUserCity, setCurrentUserCity] = useState<string>("");
  const [currentUserCountry, setCurrentUserCountry] = useState<string>("");

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

  // Use context user if available, otherwise fallback - MOVED BEFORE useQuery
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

  // Fetch travel plans to show travel dates when visiting cities
  const { data: userTravelPlans = [] } = useQuery({
    queryKey: [`/api/travel-plans/${user.id}`],
    enabled: !!user.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // For current user only: fetch their travel plans to determine current location (EXACT weather widget logic)
  const isCurrentUserCard = effectiveUser && (user.id === effectiveUser.id || user.id === currentUserId);
  const { data: currentUserTravelPlans, isLoading: plansLoading } = useQuery({
    queryKey: [`/api/travel-plans/${effectiveUser?.id}`],
    enabled: !!effectiveUser?.id && isCurrentUserCard,
  });

  // EXACT weather widget useEffect for current user location determination
  React.useEffect(() => {
    if (!isCurrentUserCard || !effectiveUser?.id || plansLoading) return;

    console.log('UserCard - Current user data:', {
      hometownCity: effectiveUser.hometownCity,
      hometownCountry: effectiveUser.hometownCountry,
      travelPlans: currentUserTravelPlans?.length || 0
    });

    // Check if user is currently traveling using travel plans (same logic as weather widget)
    const currentDestination = getCurrentTravelDestination(currentUserTravelPlans || []);
    if (currentDestination && effectiveUser.hometownCity) {
      const travelDestination = currentDestination.toLowerCase();
      const hometown = effectiveUser.hometownCity.toLowerCase();
      
      // Only show as traveler if destination is different from hometown
      if (!travelDestination.includes(hometown) && !hometown.includes(travelDestination)) {
        // User is traveling - set travel destination
        const parts = currentDestination.split(', ');
        let city = parts[0] || "";
        const country = parts[parts.length - 1] || "";
        
        // Fix: Weather API doesn't recognize "Los Angeles Metro" - use "Los Angeles" instead
        if (city === 'Los Angeles Metro') {
          city = 'Los Angeles';
        }
        
        console.log('UserCard - Using travel destination:', { city, country });
        setCurrentUserCity(city);
        setCurrentUserCountry(country);
        return;
      }
    }
    
    // User is at home - set hometown
    let city = effectiveUser.hometownCity || "";
    const country = effectiveUser.hometownCountry || "";
    
    // Fix: Weather API doesn't recognize "Los Angeles Metro" - use "Los Angeles" instead
    if (city === 'Los Angeles Metro') {
      city = 'Los Angeles';
    }
    
    console.log('UserCard - Using hometown:', { city, country });
    setCurrentUserCity(city);
    setCurrentUserCountry(country);
  }, [effectiveUser, currentUserTravelPlans, plansLoading, isCurrentUserCard]);



  // Check connection status between current user and this user
  const { data: connectionStatus, refetch: refetchConnectionStatus } = useQuery({
    queryKey: ['/api/connections/status', effectiveUser?.id, user.id],
    queryFn: async () => {
      if (!effectiveUser?.id) return null;
      console.log(`🔄 CONNECTION API: Checking connection between user ${effectiveUser.id} and ${user.id}`);
      
      try {
        const result = await apiRequest("GET", `/api/connections/status/${effectiveUser.id}/${user.id}`);
        console.log(`🔄 CONNECTION API: Result for ${effectiveUser.id} <-> ${user.id}:`, result);
        return result;
      } catch (error) {
        console.log(`🔄 CONNECTION API: Error checking status:`, error);
        return null;
      }
    },
    enabled: !!effectiveUser?.id && effectiveUser.id !== user.id,
    staleTime: 0, // Force fresh data
    gcTime: 0, // Don't cache
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
    // For current user without search context, check if they're currently traveling
    if (!searchLocation && isCurrentUserCard) {
      const currentDestination = getCurrentTravelDestination(currentUserTravelPlans || []);
      if (currentDestination && effectiveUser?.hometownCity) {
        const travelDestination = currentDestination.toLowerCase();
        const hometown = effectiveUser.hometownCity.toLowerCase();
        
        // Only show as traveler if destination is different from hometown
        if (!travelDestination.includes(hometown) && !hometown.includes(travelDestination)) {
          // Find the matching travel plan for date formatting
          const matchingTravelPlan = (currentUserTravelPlans as TravelPlan[])?.find((plan: TravelPlan) => 
            plan.destination?.toLowerCase().includes(travelDestination)
          );
          
          if (matchingTravelPlan) {
            const startDate = parseLocalDate(matchingTravelPlan.startDate);
            const endDate = parseLocalDate(matchingTravelPlan.endDate);
            
            if (startDate && endDate) {
              const formattedStart = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const formattedEnd = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              
              return { 
                type: 'traveling', 
                title: `Visiting ${formattedStart} - ${formattedEnd}`,
                dates: { start: startDate, end: endDate }
              };
            }
          }
        }
      }
      return { type: 'hometown', title: 'Local Expertise' };
    }
    
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
      
      <CardContent className="p-4 sm:p-6 pt-8 sm:pt-10">
        <div className="space-y-2 sm:space-y-3 flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              @{user.username}
            </h3>
          </div>
          
          {/* Location Display - Rebuilt from Weather Widget Logic */}
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            <div className="flex items-center gap-2">
              {(() => {
                // Get location text using same logic as weather widget
                let locationText = "";
                let isTravel = false;
                
                if (isCurrentUserCard && currentUserCity && currentUserCountry) {
                  // For current user - use weather widget calculated location
                  locationText = currentUserCountry ? `${currentUserCity}, ${currentUserCountry}` : currentUserCity;
                  isTravel = user.hometownCity && 
                    !currentUserCity.toLowerCase().includes(user.hometownCity.toLowerCase()) && 
                    !user.hometownCity.toLowerCase().includes(currentUserCity.toLowerCase());
                } else {
                  // For other users - check their travel plans
                  const currentDestination = getCurrentTravelDestination(userTravelPlans || []);
                  if (currentDestination && user.hometownCity) {
                    const travelDestination = currentDestination.toLowerCase();
                    const hometown = user.hometownCity.toLowerCase();
                    
                    if (!travelDestination.includes(hometown) && !hometown.includes(travelDestination)) {
                      locationText = currentDestination;
                      isTravel = true;
                    } else {
                      locationText = user.hometownCity + (user.hometownCountry ? `, ${user.hometownCountry}` : '');
                      isTravel = false;
                    }
                  } else {
                    // Fallback to hometown
                    locationText = user.hometownCity + (user.hometownCountry ? `, ${user.hometownCountry}` : '');
                    isTravel = false;
                  }
                }
                
                // Default fallback
                if (!locationText) {
                  locationText = user.location || 'Location not specified';
                }
                
                return (
                  <>
                    {isTravel ? (
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        ✈️ {locationText}
                      </span>
                    ) : user.userType === 'business' ? (
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        🏢 {locationText}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        🏠 {locationText}
                      </span>
                    )}
                    
                    {/* Things in Common Badge */}
                    {compatibilityData && (compatibilityData.sharedInterests?.length > 0 || compatibilityData.sharedActivities?.length > 0 || compatibilityData.sharedEvents?.length > 0) && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full ml-2 dark:bg-blue-900/30 dark:text-blue-400">
                        {(compatibilityData.sharedInterests?.length || 0) + (compatibilityData.sharedActivities?.length || 0) + (compatibilityData.sharedEvents?.length || 0)} in common
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 mb-4 sm:mb-3 line-clamp-2 sm:line-clamp-3">{user.bio}</p>
          
          {/* Travel Interests & Preferences */}
          {((user.travelInterests?.length || 0) > 0 || (user.preferredActivities?.length || 0) > 0 || (user.plannedEvents?.length || 0) > 0) && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-600 mb-1">Travel Interests</h4>
              <div className="flex flex-wrap gap-1">
                {user.travelInterests?.slice(0, 2).map((interest) => (
                  <div 
                    key={interest} 
                    className="inline-flex items-center justify-center h-6 min-w-[6rem] rounded-full px-3 text-sm font-medium leading-none whitespace-nowrap bg-blue-500 text-white border-0 appearance-none select-none gap-1"
                  >
                    {interest}
                  </div>
                ))}
                {user.preferredActivities?.slice(0, 2).map((activity) => (
                  <div key={activity} className="inline-flex items-center justify-center h-6 min-w-[6rem] rounded-full px-3 text-sm font-medium leading-none whitespace-nowrap bg-green-500 text-white border-0 appearance-none select-none gap-1">
                    {activity}
                  </div>
                ))}
                {user.plannedEvents?.slice(0, 1).map((event) => (
                  <div key={event} className="inline-flex items-center justify-center h-6 min-w-[6rem] rounded-full px-3 text-sm font-medium leading-none whitespace-nowrap bg-purple-500 text-white border-0 appearance-none select-none gap-1">
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
                  <div className="pill inline-flex items-center justify-center h-6 min-w-[6rem] rounded-full px-3 text-sm font-medium leading-none whitespace-nowrap bg-green-500 text-white border-0 appearance-none select-none gap-1" style={{height: '1.5rem', minWidth: '6rem', padding: '0 0.75rem', fontSize: '0.875rem'}}>
                    <Clock className="w-3 h-3 mr-1" />
                    Travel Plan
                  </div>
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
                      <div key={expertise} className="pill inline-flex items-center justify-center h-6 min-w-[6rem] rounded-full px-3 text-sm font-medium leading-none whitespace-nowrap bg-orange-500 text-white border-0 appearance-none select-none gap-1" style={{height: '1.5rem', minWidth: '6rem', padding: '0 0.75rem', fontSize: '0.875rem'}}>
                        {expertise}
                      </div>
                    ))}
                    {user.localActivities?.slice(0, 2).map((activity) => (
                      <div key={activity} className="pill inline-flex items-center justify-center h-6 min-w-[6rem] rounded-full px-3 text-sm font-medium leading-none whitespace-nowrap bg-yellow-500 text-white border-0 appearance-none select-none gap-1" style={{height: '1.5rem', minWidth: '6rem', padding: '0 0.75rem', fontSize: '0.875rem'}}>
                        {activity}
                      </div>
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
                  className="inline-flex items-center justify-center h-6 min-w-[6rem] rounded-full px-3 text-sm font-medium leading-none whitespace-nowrap bg-blue-500 text-white border-0 appearance-none select-none gap-1"
                >
                  {interest}
                </div>
              ))}
              {(() => {
                const filteredInterests = getFilteredInterests(user);
                const totalOverflow = Math.max(0, (filteredInterests?.length || 0) - 3);
                
                return totalOverflow > 0 ? (
                  <div className="inline-flex items-center justify-center h-6 min-w-[6rem] rounded-full px-3 text-sm font-medium leading-none whitespace-nowrap bg-blue-500 text-white border-0 appearance-none select-none gap-1">
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


          
          <div className="flex gap-2 mt-auto pt-2 sm:pt-0">
            {(() => {
              console.log(`🔘 BUTTON: Rendering for user ${user.username} (id: ${user.id}), connectionStatus:`, connectionStatus);
              console.log(`🔘 BUTTON: effectiveUser:`, effectiveUser);
              console.log(`🔘 BUTTON: Is nearbytraveler?`, user.username === 'nearbytraveler');
              console.log(`🔘 BUTTON: Connection status accepted?`, connectionStatus?.status === 'accepted');
              
              if (user.username === 'nearbytraveler' || connectionStatus?.status === 'accepted') {
                return (
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-10 min-w-0"
                    disabled
                  >
                    Connected
                  </Button>
                );
              } else if (connectionStatus?.status === 'pending') {
                return (
                  <Button 
                    className="flex-1 bg-gray-500 text-white cursor-not-allowed text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-10 min-w-0"
                    disabled
                  >
                    Pending
                  </Button>
                );
              } else {
                return (
                  <Button 
                    className="flex-1 bg-travel-blue hover:bg-blue-700 text-white btn-bounce text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-10 min-w-0"
                    onClick={handleConnect}
                    disabled={connectMutation.isPending}
                  >
                    {connectMutation.isPending ? "Connecting..." : "Connect"}
                  </Button>
                );
              }
            })()}
            <Button 
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white btn-bounce text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-10 min-w-0"
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