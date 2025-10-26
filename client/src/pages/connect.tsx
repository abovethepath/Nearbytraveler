import { useContext, useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AuthContext } from "@/App";
import { MobilePreview } from "@/components/MobilePreview";
import UserCard from "@/components/user-card";
import ResponsiveUserGrid from "@/components/ResponsiveUserGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Users, Heart, MapPin, Calendar as CalendarIcon, TrendingUp, ArrowLeft, Edit, ChevronDown, ChevronRight, X, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { getAllInterests, getAllActivities, getAllEvents, getAllLanguages, validateSelections, getMostPopularInterests } from "../../../shared/base-options";
import { BASE_TRAVELER_TYPES } from "../../../shared/base-options";
import { getInterestStyle, getActivityStyle, getEventStyle } from "@/lib/topChoicesUtils";
import { SEXUAL_PREFERENCE_OPTIONS } from "@/lib/formConstants";

import { formatDateForDisplay } from "@/lib/dateUtils";
import BackButton from "@/components/back-button";
import ConnectModal from "@/components/connect-modal";
import type { User, TravelPlan } from "@shared/schema";



export default function ConnectPage() {
  const [, setLocation] = useLocation();
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  console.log('ConnectPage - user data:', user?.username, user?.location);
  
  // Connect modal state - auto-open on page load
  const [showConnectModal, setShowConnectModal] = useState(true);
  const [connectModalMode, setConnectModalMode] = useState<'current' | 'hometown'>('current');
  


  // Location search state
  const [searchLocation, setSearchLocation] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  // User data queries with proper refetch configuration
  const { data: userTravelPlans = [], isLoading: isLoadingTravelPlans, refetch: refetchTravelPlans } = useQuery<TravelPlan[]>({
    queryKey: [`/api/travel-plans/${user?.id}`],
    enabled: !!user?.id && typeof user.id === 'number' && !isNaN(user.id),
    staleTime: 0, // Always consider data stale for fresh fetches
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  

  
  // Refetch travel plans when component mounts or user changes
  useEffect(() => {
    if (user?.id && typeof user.id === 'number' && !isNaN(user.id)) {
      refetchTravelPlans();
    }
  }, [user?.id, refetchTravelPlans]);



  // Initialize location based on user data
  useEffect(() => {
    if (user && !searchLocation) {
      const currentLocation = user.location || user.hometownCity || "";
      setSearchLocation(currentLocation);
    }
  }, [user, searchLocation]);

  // Get user's location helper
  const getUserLocation = (mode: 'current' | 'hometown') => {
    if (!user) return "";
    
    if (mode === 'hometown') {
      // Build hometown from city, state, country
      const parts = [];
      if (user.hometownCity) parts.push(user.hometownCity);
      if (user.hometownState) parts.push(user.hometownState);
      if (user.hometownCountry && user.hometownCountry !== 'United States') parts.push(user.hometownCountry);
      return parts.join(', ') || "";
    } else {
      // Check if user is currently traveling based on any active travel plan
      const now = new Date();
      
      // Check all travel plans to find current destination
      if (userTravelPlans && userTravelPlans.length > 0) {
        const currentTrip = userTravelPlans.find((plan: TravelPlan) => {
          if (!plan.startDate || !plan.endDate) return false;
          // FIXED: Manual date parsing to prevent timezone conversion
          const parseLocalDate = (dateInput: string | Date | null | undefined) => {
            if (!dateInput) return null;
            let dateString: string;
            if (dateInput instanceof Date) {
              dateString = dateInput.toISOString();
            } else {
              dateString = dateInput;
            }
            const parts = dateString.split('T')[0].split('-');
            if (parts.length === 3) {
              const year = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1;
              const day = parseInt(parts[2]);
              return new Date(year, month, day);
            }
            return null;
          };
          
          const start = parseLocalDate(plan.startDate);
          const end = parseLocalDate(plan.endDate);
          if (!start || !end) return false;
          return now >= start && now <= end;
        });
        
        if (currentTrip) {
          return currentTrip.destination;
        }
      }
      
      // Fallback to stored travel destination
      if (user.travelStartDate && user.travelEndDate && user.travelDestination) {
        const travelStart = new Date(user.travelStartDate);
        const travelEnd = new Date(user.travelEndDate);
        if (now >= travelStart && now <= travelEnd) {
          return user.travelDestination;
        }
      }
      
      // Otherwise show their regular location
      return user.location || "";
    }
  };

  // Location search functionality
  const searchMutation = useMutation({
    mutationFn: async (): Promise<User[]> => {
      if (!searchLocation.trim()) {
        throw new Error("Please enter a location to search");
      }
      
      const params = new URLSearchParams({
        location: searchLocation.trim(),
        ...(startDate && { startDate: startDate.toISOString().split('T')[0] }),
        ...(endDate && { endDate: endDate.toISOString().split('T')[0] })
      });
      
      console.log('ConnectModal searching for:', searchLocation.trim());
      const response = await fetch(`/api/users?${params}`, {
        headers: {
          'X-User-ID': '34'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to search for travelers and locals');
      }
      const results = await response.json();
      console.log('ConnectModal search results:', results);
      return results;
    },
    onSuccess: (data: User[]) => {
      console.log('ConnectModal onSuccess with data:', data);
      setSearchResults(data);
      setIsSearching(false);
      setHasSearched(true);
    },
    onError: (error: any) => {
      console.error('ConnectModal search error:', error);
      toast({
        title: "Search Error",
        description: error.message || "Failed to search for travelers",
        variant: "destructive",
      });
      setIsSearching(false);
    },
  });

  const handleSearch = () => {
    setIsSearching(true);
    searchMutation.mutate();
  };

  const handleTravelPlanSelect = (plan: TravelPlan) => {
    setSearchLocation(plan.destination);
    // FIXED: Use same parseLocalDate function
    const parseLocalDate = (dateInput: string | Date | null | undefined) => {
      if (!dateInput) return null;
      let dateString: string;
      if (dateInput instanceof Date) {
        dateString = dateInput.toISOString();
      } else {
        dateString = dateInput;
      }
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        return new Date(year, month, day);
      }
      return null;
    };
    
    const startDate = parseLocalDate(plan.startDate);
    const endDate = parseLocalDate(plan.endDate);
    if (startDate) setStartDate(startDate);
    if (endDate) setEndDate(endDate);
    setSearchResults([]);
    setHasSearched(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageContent = (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <BackButton />
        </div>

        {/* Quick Connect Section */}
        <Card 
          className="mb-4 sm:mb-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setConnectModalMode('current');
            setShowConnectModal(true);
          }}
        >
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              Quick Connect
            </CardTitle>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">Connect with travelers and locals in your destinations</p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
              {/* Current Travel Destination (if traveling) */}
              {(() => {
                const currentLocation = getUserLocation('current');
                const hometown = getUserLocation('hometown');
                const isCurrentlyTraveling = currentLocation !== user?.location;
                
                if (isCurrentlyTraveling && currentLocation) {
                  return (
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchLocation(currentLocation);
                        setStartDate(undefined);
                        setEndDate(undefined);
                        setSearchResults([]);
                        setHasSearched(false);
                        setTimeout(() => handleSearch(), 100);
                      }}
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 bg-blue-50 border-blue-200"
                    >
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                      <span className="truncate max-w-[100px] sm:max-w-none">
                        {currentLocation.split(',')[0]}
                      </span>
                    </Button>
                  );
                }
                return null;
              })()}
              
              {/* Hometown */}
              {getUserLocation('hometown') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchLocation(getUserLocation('hometown'));
                    setStartDate(undefined);
                    setEndDate(undefined);
                    setSearchResults([]);
                    setHasSearched(false);
                    setTimeout(() => handleSearch(), 100);
                  }}
                  className="flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  🏠 Hometown {getUserLocation('hometown').split(',')[0]}
                </Button>
              )}
              
              {/* Travel Plans */}
              {isLoadingTravelPlans ? (
                <div className="space-y-2">
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : userTravelPlans && userTravelPlans.length > 0 ? (
                userTravelPlans.map((plan: TravelPlan) => (
                  <Button
                    key={plan.id}
                    variant="outline"
                    onClick={() => {
                      handleTravelPlanSelect(plan);
                      setTimeout(() => handleSearch(), 100);
                    }}
                    className="flex items-center gap-2"
                  >
                    ✈️ {plan.destination}
                    <span className="ml-1 text-sm text-gray-500">
                      {plan.startDate && plan.endDate ? (
                        `${formatDateForDisplay(plan.startDate, "SHORT")} - ${formatDateForDisplay(plan.endDate, "SHORT")}`
                      ) : plan.startDate ? (
                        `From ${formatDateForDisplay(plan.startDate, "SHORT")}`
                      ) : (
                        "Dates TBD"
                      )}
                    </span>
                  </Button>
                ))
              ) : null}
            </div>
            
            {/* Call to Action Button */}
            <div className="border-t pt-4 text-center">
              <Button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  setConnectModalMode('current');
                  setShowConnectModal(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-orange-500 text-white hover:from-blue-700 hover:to-orange-600 font-semibold px-6 py-3"
                size="lg"
              >
                <Users className="w-5 h-5 mr-2" />
                Connect with Travelers & Locals
              </Button>
              <p className="text-sm text-gray-500 mt-2">Or click anywhere on this card</p>
            </div>
          </CardContent>
        </Card>

        {/* Location Search */}
        <div className="space-y-4 sm:space-y-6">
          <Card>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                {/* Quick Select Buttons */}
                <div>
                  <h3 className="text-xs sm:text-sm font-medium mb-2 text-black dark:text-white">Quick Select</h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {/* Current Location */}
                    {getUserLocation('current') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchLocation(getUserLocation('current'));
                          setStartDate(undefined);
                          setEndDate(undefined);
                          setSearchResults([]);
                          setHasSearched(false);
                        }}
                        className="text-xs"
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        Current ({getUserLocation('current').split(',')[0]})
                      </Button>
                    )}
                    
                    {/* Hometown */}
                    {getUserLocation('hometown') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchLocation(getUserLocation('hometown'));
                          setStartDate(undefined);
                          setEndDate(undefined);
                          setSearchResults([]);
                          setHasSearched(false);
                        }}
                        className="text-xs"
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        Hometown ({getUserLocation('hometown')})
                      </Button>
                    )}
                    
                    {/* Travel Plans */}
                    {userTravelPlans && userTravelPlans.length > 0 ? (
                      userTravelPlans.map((plan: TravelPlan) => (
                        <Button
                          key={plan.id}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchLocation(plan.destination);
                            // FIXED: Use same parseLocalDate function
                            const parseLocalDate = (dateInput: string | Date | null | undefined) => {
                              if (!dateInput) return null;
                              let dateString: string;
                              if (dateInput instanceof Date) {
                                dateString = dateInput.toISOString();
                              } else {
                                dateString = dateInput;
                              }
                              const parts = dateString.split('T')[0].split('-');
                              if (parts.length === 3) {
                                const year = parseInt(parts[0]);
                                const month = parseInt(parts[1]) - 1;
                                const day = parseInt(parts[2]);
                                return new Date(year, month, day);
                              }
                              return null;
                            };
                            
                            const startDate = parseLocalDate(plan.startDate);
                            const endDate = parseLocalDate(plan.endDate);
                            if (startDate) setStartDate(startDate);
                            if (endDate) setEndDate(endDate);
                            setSearchResults([]);
                            setHasSearched(false);
                            setTimeout(() => handleSearch(), 100);
                          }}
                          className="text-xs"
                        >
                          ✈️ {plan.destination}
                          <span className="ml-1 text-gray-500">
                            {plan.startDate && plan.endDate ? (
                              `${formatDateForDisplay(plan.startDate, "SHORT")} - ${formatDateForDisplay(plan.endDate, "SHORT")}`
                            ) : plan.startDate ? (
                              `From ${formatDateForDisplay(plan.startDate, "SHORT")}`
                            ) : (
                              "Dates TBD"
                            )}
                          </span>
                        </Button>
                      ))
                    ) : (
                      <div className="text-xs text-gray-500">No travel plans found</div>
                    )}
                  </div>
                </div>

                {/* Search Form - Stack on mobile */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-xs sm:text-sm text-black dark:text-white">Location</Label>
                    <div className="relative">
                      <Input
                        id="location"
                        placeholder="Enter city or destination..."
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="text-sm sm:text-base pr-8"
                      />
                      <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Date pickers - Full width on mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm text-black dark:text-white">Start Date (Optional)</Label>
                      <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal text-xs sm:text-sm">
                            <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="truncate">
                              {startDate ? format(startDate, "PPP") : "Select start date"}
                            </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => {
                            setStartDate(date);
                            setShowStartCalendar(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm text-black dark:text-white">End Date (Optional)</Label>
                        <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal text-xs sm:text-sm">
                              <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="truncate">
                                {endDate ? format(endDate, "PPP") : "Select end date"}
                              </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => {
                            setEndDate(date);
                            setShowEndCalendar(false);
                          }}
                          disabled={(date) => startDate ? date < startDate : false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                </div>

                <Button 
                  onClick={handleSearch}
                  disabled={!searchLocation.trim() || isSearching}
                  className="w-full text-sm sm:text-base"
                  data-testid="button-search-location"
                >
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  {isSearching ? "Searching..." : "Find Locals and Travelers"}
                </Button>

                {/* Search Results */}
                {isSearching && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-black dark:text-white">Searching for travelers...</h3>
                    {[1, 2, 3].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-1/2" />
                              <Skeleton className="h-3 w-3/4" />
                            </div>
                            <Skeleton className="h-8 w-20" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {hasSearched && searchResults.length === 0 && !isSearching && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2 text-black dark:text-white">No travelers found</h3>
                      <p className="text-black dark:text-white mb-4">
                        No one is currently traveling to {searchLocation} during your selected dates.
                      </p>
                      <p className="text-sm text-gray-500">
                        Try searching a different location or use the Search button in the bottom navigation for more filter options.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <ResponsiveUserGrid 
                    users={searchResults as any}
                    title={`Found ${searchResults.length} ${searchResults.length === 1 ? 'person' : 'people'} in ${searchLocation}`}
                  />
                )}
              </CardContent>
            </Card>
        </div>
      </main>

      {/* Connect Modal Widget */}
      <ConnectModal 
        isOpen={showConnectModal}
        onClose={() => {
          console.log('ConnectModal closing');
          setShowConnectModal(false);
        }}
        userTravelPlans={userTravelPlans || []}
        defaultLocationMode={connectModalMode}
        currentUser={user}
      />
    </div>
  );

  return (
    <>
      {pageContent}
      <MobilePreview>
        {pageContent}
      </MobilePreview>
    </>
  );
}
