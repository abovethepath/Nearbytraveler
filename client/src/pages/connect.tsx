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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Users, Heart, MapPin, Calendar as CalendarIcon, TrendingUp, ArrowLeft, Edit, Filter, ChevronDown, ChevronRight, Search, X, MessageCircle } from "lucide-react";
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
import { SmartLocationInput } from "@/components/SmartLocationInput";



export default function ConnectPage() {
  const [, setLocation] = useLocation();
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  console.log('ConnectPage - user data:', user?.username, user?.location);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("location-search");
  
  // Connect modal state - auto-open on page load
  const [showConnectModal, setShowConnectModal] = useState(true);
  const [connectModalMode, setConnectModalMode] = useState<'current' | 'hometown'>('current');

  // Handle URL parameters for tab switching
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'advanced-filters') {
      setActiveTab('advanced-filters');
      setShowConnectModal(false); // Close modal when going to advanced filters
      // Clean up URL
      window.history.replaceState({}, '', '/connect');
    }
  }, []);
  


  // Location search state
  const [searchLocation, setSearchLocation] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState({
    search: "",
    gender: [] as string[],
    sexualPreference: [] as string[],
    minAge: undefined as number | undefined,
    maxAge: undefined as number | undefined,
    interests: [] as string[],
    activities: [] as string[],
    events: [] as string[],
    location: "",
    userType: [] as string[],
    travelerTypes: [] as string[],
    militaryStatus: [] as string[]
  });

  // Location filter state for SmartLocationInput
  const [locationFilter, setLocationFilter] = useState({
    country: "",
    state: "",
    city: ""
  });

  // Collapsible section states for advanced search
  const [expandedSections, setExpandedSections] = useState({
    topChoices: false,
    gender: false,
    sexualPreference: false,
    userType: false,
    ageRange: false,
    travelerType: false,
    interests: false,
    activities: false,
    events: false,
    militaryStatus: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  const [advancedSearchResults, setAdvancedSearchResults] = useState<User[]>([]);
  const [isAdvancedSearching, setIsAdvancedSearching] = useState(false);
  const [hasAdvancedSearched, setHasAdvancedSearched] = useState(false);

  // User data queries with proper refetch configuration
  const { data: userTravelPlans = [], isLoading: isLoadingTravelPlans, refetch: refetchTravelPlans } = useQuery({
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

  // Advanced search function
  const handleAdvancedSearch = async () => {
    setIsAdvancedSearching(true);
    setHasAdvancedSearched(true);
    
    try {
      console.log('Performing advanced search with filters:', advancedFilters);
      
      // Build query parameters for the search
      const params = new URLSearchParams();
      
      if (advancedFilters.search) params.append('search', advancedFilters.search);
      if (advancedFilters.gender.length > 0) params.append('gender', advancedFilters.gender.join(','));
      if (advancedFilters.sexualPreference.length > 0) params.append('sexualPreference', advancedFilters.sexualPreference.join(','));
      if (advancedFilters.minAge) params.append('minAge', advancedFilters.minAge.toString());
      if (advancedFilters.maxAge) params.append('maxAge', advancedFilters.maxAge.toString());
      if (advancedFilters.interests.length > 0) params.append('interests', advancedFilters.interests.join(','));
      if (advancedFilters.activities.length > 0) params.append('activities', advancedFilters.activities.join(','));
      if (advancedFilters.events.length > 0) params.append('events', advancedFilters.events.join(','));
      if (advancedFilters.location) params.append('location', advancedFilters.location);
      if (advancedFilters.userType.length > 0) params.append('userType', advancedFilters.userType.join(','));
      if (advancedFilters.travelerTypes.length > 0) params.append('travelerTypes', advancedFilters.travelerTypes.join(','));
      if (advancedFilters.militaryStatus.length > 0) params.append('militaryStatus', advancedFilters.militaryStatus.join(','));
      
      const response = await fetch(`/api/users/search?${params.toString()}`);
      
      const data = await response.json();
      console.log('Advanced search results:', data);
      setAdvancedSearchResults(data || []);
      
      toast({
        title: "Search Complete",
        description: `Found ${data?.length || 0} users matching your criteria`,
      });
    } catch (error) {
      console.error('Advanced search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdvancedSearching(false);
    }
  };

  // Clear advanced filters
  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      search: "",
      gender: [],
      sexualPreference: [],
      minAge: undefined,
      maxAge: undefined,
      interests: [],
      activities: [],
      events: [],
      location: "",
      userType: [],
      travelerTypes: [],
      militaryStatus: []
    });
    setAdvancedSearchResults([]);
    setHasAdvancedSearched(false);
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
                        setActiveTab("location-search");
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
                    setActiveTab("location-search");
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
                      setActiveTab("location-search");
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-xl p-1 sm:p-2">
            <TabsTrigger 
              value="location-search" 
              className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-600 data-[state=active]:text-white transition-all duration-300 px-2 sm:px-4 py-1.5 sm:py-2"
            >
              Location
            </TabsTrigger>
            <TabsTrigger 
              value="advanced-filters" 
              className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all duration-300 px-2 sm:px-4 py-1.5 sm:py-2"
            >
              Advanced
            </TabsTrigger>
          </TabsList>




          {/* Location Search Tab */}
          <TabsContent value="location-search" className="space-y-4 sm:space-y-6">
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
                >
                  <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
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

                {searchResults.length > 0 && (
                  <ResponsiveUserGrid 
                    users={searchResults}
                    title={`Found ${searchResults.length} ${searchResults.length === 1 ? 'person' : 'people'} in ${searchLocation}`}
                  />
                )}

                {hasSearched && searchResults.length === 0 && !isSearching && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2 text-black dark:text-white">No travelers found</h3>
                      <p className="text-black dark:text-white mb-4">
                        No one is currently traveling to {searchLocation} during your selected dates.
                      </p>
                      <Button variant="outline" onClick={() => setActiveTab("smart-matches")}>
                        Try Smart Matches Instead
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <ResponsiveUserGrid 
                    users={searchResults}
                    title={`Found ${searchResults.length} ${searchResults.length === 1 ? 'person' : 'people'} in ${searchLocation}`}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Filters Tab - Exact Copy from Home Page */}
          <TabsContent value="advanced-filters" className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800">
              {/* Search Bar */}
              <div className="mb-4 sm:mb-6 bg-white dark:bg-gray-700 p-3 sm:p-4 rounded-lg border dark:border-gray-600 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center">
                    <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Search Users
                  </label>
                  <Button
                    className="bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600 w-full sm:w-auto"
                    size="sm"
                    onClick={handleAdvancedSearch}
                    disabled={isAdvancedSearching}
                  >
                    <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    {isAdvancedSearching ? "Searching..." : "Search Now"}
                  </Button>
                </div>
                <Input
                  placeholder="Search by name, username, city..."
                  value={advancedFilters.search}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, search: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      console.log('Enter pressed - search triggered');
                    }
                  }}
                  className="w-full text-sm sm:text-base"
                />
              </div>
              
              {/* Gender Filter Section */}
              <Collapsible open={expandedSections.gender} onOpenChange={() => toggleSection('gender')}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender Filter</span>
                    <div className="flex items-center gap-2">
                      {advancedFilters.gender.length > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {advancedFilters.gender.length}
                        </Badge>
                      )}
                      {expandedSections.gender ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="flex flex-wrap gap-2">
                    {["Male", "Female", "Trans Male", "Trans Female", "Non-Binary", "Other"].map((gender) => (
                      <button
                        key={gender}
                        onClick={() => {
                          if (advancedFilters.gender.includes(gender)) {
                            setAdvancedFilters(prev => ({ ...prev, gender: prev.gender.filter(g => g !== gender) }));
                          } else {
                            setAdvancedFilters(prev => ({ ...prev, gender: [...prev.gender, gender] }));
                          }
                        }}
                        className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                          advancedFilters.gender.includes(gender)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Sexual Preference Filter Section */}
              <Collapsible open={expandedSections.sexualPreference} onOpenChange={() => toggleSection('sexualPreference')}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sexual Preference Filter</span>
                    <div className="flex items-center gap-2">
                      {advancedFilters.sexualPreference.length > 0 && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                          {advancedFilters.sexualPreference.length}
                        </Badge>
                      )}
                      {expandedSections.sexualPreference ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="flex flex-wrap gap-2">
                    {SEXUAL_PREFERENCE_OPTIONS.map((preference) => (
                      <button
                        key={preference}
                        onClick={() => {
                          if (advancedFilters.sexualPreference.includes(preference)) {
                            setAdvancedFilters(prev => ({ ...prev, sexualPreference: prev.sexualPreference.filter(p => p !== preference) }));
                          } else {
                            setAdvancedFilters(prev => ({ ...prev, sexualPreference: [...prev.sexualPreference, preference] }));
                          }
                        }}
                        className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                          advancedFilters.sexualPreference.includes(preference)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {preference}
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* User Type Filter Section */}
              <Collapsible open={expandedSections.userType} onOpenChange={() => toggleSection('userType')}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">User Type Filter</span>
                    <div className="flex items-center gap-2">
                      {advancedFilters.userType.length > 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          {advancedFilters.userType.length}
                        </Badge>
                      )}
                      {expandedSections.userType ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="flex flex-wrap gap-2">
                    {["traveler", "local", "business"].map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          if (advancedFilters.userType.includes(type)) {
                            setAdvancedFilters(prev => ({ ...prev, userType: prev.userType.filter(t => t !== type) }));
                          } else {
                            setAdvancedFilters(prev => ({ ...prev, userType: [...prev.userType, type] }));
                          }
                        }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                          advancedFilters.userType.includes(type)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Age Range Filter Section */}
              <Collapsible open={expandedSections.ageRange} onOpenChange={() => toggleSection('ageRange')}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Age Range Filter</span>
                    <div className="flex items-center gap-2">
                      {(advancedFilters.minAge || advancedFilters.maxAge) && (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                          {advancedFilters.minAge || '?'}-{advancedFilters.maxAge || '?'}
                        </Badge>
                      )}
                      {expandedSections.ageRange ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      type="number" 
                      placeholder="Min Age"
                      value={advancedFilters.minAge || ""}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minAge: e.target.value ? parseInt(e.target.value) : undefined }))}
                      className="w-full text-sm px-3 py-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    />
                    <Input 
                      type="number" 
                      placeholder="Max Age"
                      value={advancedFilters.maxAge || ""}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxAge: e.target.value ? parseInt(e.target.value) : undefined }))}
                      className="w-full text-sm px-3 py-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Traveler Type Filter Section */}
              <Collapsible open={expandedSections.travelerType} onOpenChange={() => toggleSection('travelerType')}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Traveler Type Filter</span>
                    <div className="flex items-center gap-2">
                      {advancedFilters.travelerTypes.length > 0 && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                          {advancedFilters.travelerTypes.length}
                        </Badge>
                      )}
                      {expandedSections.travelerType ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="flex flex-wrap gap-2">
                    {BASE_TRAVELER_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          if (advancedFilters.travelerTypes.includes(type)) {
                            setAdvancedFilters(prev => ({ ...prev, travelerTypes: prev.travelerTypes.filter(t => t !== type) }));
                          } else {
                            setAdvancedFilters(prev => ({ ...prev, travelerTypes: [...prev.travelerTypes, type] }));
                          }
                        }}
                        className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                          advancedFilters.travelerTypes.includes(type)
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Location Filter - Use SmartLocationInput for consistency */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 dark:text-white mb-2 block">Location Filter</label>
                <div className="space-y-2">
                  <SmartLocationInput
                    city={locationFilter.city}
                    state={locationFilter.state}
                    country={locationFilter.country}
                    onLocationChange={(location) => {
                      setLocationFilter(location);
                      const fullLocation = `${location.city}${location.state ? `, ${location.state}` : ""}, ${location.country}`;
                      setAdvancedFilters(prev => ({ ...prev, location: fullLocation }));
                    }}
                    required={false}
                    placeholder={{
                      country: "Select country to filter by",
                      state: "Select state/region",
                      city: "Select city to filter by"
                    }}
                  />
                  <Select 
                    value={advancedFilters.location} 
                    onValueChange={(value) => setAdvancedFilters(prev => ({ ...prev, location: value === "clear" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Or select from your destinations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clear">Clear location filter</SelectItem>
                      {user?.hometown && (
                        <SelectItem value={user.hometown}>
                          🏠 {user.hometown} (Hometown)
                        </SelectItem>
                      )}
                      {user?.location && user.location !== user.hometown && (
                        <SelectItem value={user.location}>
                          📍 {user.location} (Current)
                      </SelectItem>
                      )}
                      {userTravelPlans?.filter(plan => plan.destination).map((plan, index) => (
                        <SelectItem key={index} value={plan.destination}>
                          ✈️ {plan.destination} (Travel Plan)
                        </SelectItem>
                      ))}
                      {user?.travelDestination && 
                       !userTravelPlans.some(plan => plan.destination === user.travelDestination) && (
                        <SelectItem value={user.travelDestination}>
                          🗺️ {user.travelDestination}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Top Choices for Most Travelers Section */}
              <Collapsible open={expandedSections.topChoices} onOpenChange={() => toggleSection('topChoices')}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-10 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 border-blue-200 dark:border-blue-700 hover:from-blue-100 hover:to-orange-100 dark:hover:from-blue-900/30 dark:hover:to-orange-900/30"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">⭐ Top Choices for Most Travelers</span>
                    <div className="flex items-center gap-2">
                      {getMostPopularInterests().filter(choice => advancedFilters.interests.includes(choice)).length > 0 && (
                        <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-orange-100 text-gray-800 dark:from-blue-900 dark:to-orange-900 dark:text-gray-200">
                          {getMostPopularInterests().filter(choice => advancedFilters.interests.includes(choice)).length}
                        </Badge>
                      )}
                      {expandedSections.topChoices ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="flex flex-wrap gap-2">
                    {getMostPopularInterests().map((choice) => (
                      <button
                        key={choice}
                        onClick={() => {
                          if (advancedFilters.interests.includes(choice)) {
                            setAdvancedFilters(prev => ({ 
                              ...prev, 
                              interests: prev.interests.filter(i => i !== choice) 
                            }));
                          } else {
                            setAdvancedFilters(prev => ({ 
                              ...prev, 
                              interests: [...prev.interests, choice] 
                            }));
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          advancedFilters.interests.includes(choice)
                            ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Interests Filter Section */}
              <Collapsible open={expandedSections.interests} onOpenChange={() => toggleSection('interests')}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Interests Filter</span>
                    <div className="flex items-center gap-2">
                      {advancedFilters.interests.length > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {advancedFilters.interests.length}
                        </Badge>
                      )}
                      {expandedSections.interests ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="flex flex-wrap gap-2">
                    {getAllInterests().filter(interest => !getMostPopularInterests().includes(interest)).map((interest) => {
                      const displayText = interest.startsWith("**") && interest.endsWith("**") ? 
                        interest.slice(2, -2) : interest;
                      
                      return (
                        <button
                          key={interest}
                          onClick={() => {
                            if (advancedFilters.interests.includes(interest)) {
                              setAdvancedFilters(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
                            } else {
                              setAdvancedFilters(prev => ({ ...prev, interests: [...prev.interests, interest] }));
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            advancedFilters.interests.includes(interest)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {displayText}
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Activities Filter Section */}
              <Collapsible open={expandedSections.activities} onOpenChange={() => toggleSection('activities')}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Activities Filter</span>
                    <div className="flex items-center gap-2">
                      {advancedFilters.activities.length > 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          {advancedFilters.activities.length}
                        </Badge>
                      )}
                      {expandedSections.activities ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="flex flex-wrap gap-2">
                    {getAllActivities().map((activity, index) => (
                      <button
                        key={`filter-activity-${activity}-${index}`}
                        onClick={() => {
                          if (advancedFilters.activities.includes(activity)) {
                            setAdvancedFilters(prev => ({ ...prev, activities: prev.activities.filter(a => a !== activity) }));
                          } else {
                            setAdvancedFilters(prev => ({ ...prev, activities: [...prev.activities, activity] }));
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          advancedFilters.activities.includes(activity)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {activity}
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Events Filter Section */}
              <Collapsible open={expandedSections.events} onOpenChange={() => toggleSection('events')}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Events Filter</span>
                    <div className="flex items-center gap-2">
                      {advancedFilters.events.length > 0 && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                          {advancedFilters.events.length}
                        </Badge>
                      )}
                      {expandedSections.events ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="flex flex-wrap gap-2">
                    {getAllEvents().map((eventType) => (
                      <button
                        key={eventType}
                        onClick={() => {
                          if (advancedFilters.events.includes(eventType)) {
                            setAdvancedFilters(prev => ({ ...prev, events: prev.events.filter(e => e !== eventType) }));
                          } else {
                            setAdvancedFilters(prev => ({ ...prev, events: [...prev.events, eventType] }));
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          advancedFilters.events.includes(eventType)
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {eventType}
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Military Status Filter Section */}
              <Collapsible open={expandedSections.militaryStatus} onOpenChange={() => toggleSection('militaryStatus')}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Military Status Filter</span>
                    <div className="flex items-center gap-2">
                      {advancedFilters.militaryStatus.length > 0 && (
                        <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                          {advancedFilters.militaryStatus.length}
                        </Badge>
                      )}
                      {expandedSections.militaryStatus ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "veteran", label: "Veteran", color: "red" },
                      { value: "active_duty", label: "Active Duty", color: "blue" }
                    ].map((status) => (
                      <button
                        key={status.value}
                        onClick={() => {
                          if (advancedFilters.militaryStatus.includes(status.value)) {
                            setAdvancedFilters(prev => ({ ...prev, militaryStatus: prev.militaryStatus.filter(s => s !== status.value) }));
                          } else {
                            setAdvancedFilters(prev => ({ ...prev, militaryStatus: [...prev.militaryStatus, status.value] }));
                          }
                        }}
                        className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                          advancedFilters.militaryStatus.includes(status.value)
                            ? (status.color === 'red' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white')
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Button
                  variant="outline"
                  onClick={clearAdvancedFilters}
                  className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400 w-full sm:w-auto"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Clear All Filters
                </Button>
                
                <Button
                  className="bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600 w-full sm:w-auto text-xs sm:text-sm"
                  onClick={handleAdvancedSearch}
                  disabled={isAdvancedSearching}
                >
                  <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  {isAdvancedSearching ? "Searching..." : "Search Now"}
                </Button>
              </div>
            </Card>

            {/* Search Results */}
            {hasAdvancedSearched && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Search Results ({advancedSearchResults.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isAdvancedSearching ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[150px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : advancedSearchResults.length > 0 ? (
                    <ResponsiveUserGrid 
                      users={advancedSearchResults}
                      title={`Found ${advancedSearchResults.length} ${advancedSearchResults.length === 1 ? 'person' : 'people'} matching your filters`}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2 text-black dark:text-white">No users found</h3>
                      <p className="text-gray-600 dark:text-white mb-4">
                        Try adjusting your search criteria or clearing some filters.
                      </p>
                      <Button variant="outline" onClick={clearAdvancedFilters}>
                        Clear All Filters
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
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