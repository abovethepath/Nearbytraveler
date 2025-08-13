import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { 
  Users, X, MapPin, CalendarIcon, Search, MessageCircle, UserPlus,
  Plane, Home, Calendar as CalendarDays 
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { authStorage } from "@/lib/auth";

interface User {
  id: number;
  username: string;
  name: string;
  userType: 'local' | 'current_traveler' | 'business';
  bio: string;
  location: string;
  hometownCity: string;
  hometownState: string;
  hometownCountry: string;
  profileImage?: string;
  interests: string[];
  currentTravelDestination?: string;
  travelStartDate?: string;
  travelEndDate?: string;
}

interface TravelPlan {
  id: number;
  destination: string;
  startDate: string;
  endDate?: string;
  interests: string[];
  activities: string[];
  events: string[];
  travelStyle: string[];
  accommodation: string[];
  transportation: string[];
  notes?: string;
}

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  userTravelPlans?: TravelPlan[];
  defaultLocationMode?: 'current' | 'hometown';
  currentUser?: any;
}

export default function ConnectModal({ isOpen, onClose, userTravelPlans: propTravelPlans = [], defaultLocationMode = 'current', currentUser }: ConnectModalProps) {
  const [searchLocation, setSearchLocation] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Get current user data - prefer passed user, fallback to localStorage
  let user = currentUser;
  if (!user) {
    const storedUser = localStorage.getItem('user');
    try {
      if (storedUser && storedUser !== 'undefined') {
        user = JSON.parse(storedUser);
      }
    } catch (error) {
      console.log('ConnectModal - error parsing stored user:', error);
    }
  }

  // Fetch travel plans if user exists - always call hooks
  const { data: travelPlans = [] } = useQuery({
    queryKey: [`/api/travel-plans/${user?.id}`],
    enabled: !!user?.id && isOpen,
  });

  const getUserBucketLocation = (bucketType: 'who_is_here_now' | 'permanent_locals_from_my_area') => {
    // Get user from currentUser prop or authStorage fallback
    const activeUser = currentUser || authStorage.getUser();
    
    if (!activeUser) {
      console.log('ConnectModal - no user data available');
      return '';
    }
    
    console.log('ConnectModal - user type:', activeUser.userType, 'bucket:', bucketType);
    
    // BUSINESS: Always goes in their business city bucket
    if (activeUser.userType === 'business') {
      const businessLocation = activeUser.location || `${activeUser.hometownCity}, ${activeUser.hometownState}`;
      console.log('ConnectModal - business always in bucket:', businessLocation);
      return businessLocation;
    }
    
    if (bucketType === 'permanent_locals_from_my_area') {
      // PERMANENT LOCALS BUCKET: Always their hometown (never changes)
      if (activeUser.hometownCity) {
        if (activeUser.hometownState && (activeUser.hometownCountry === 'United States' || activeUser.hometownCountry === 'USA')) {
          return `${activeUser.hometownCity}, ${activeUser.hometownState}`;
        } else if (activeUser.hometownCountry && activeUser.hometownCountry !== 'United States' && activeUser.hometownCountry !== 'USA') {
          return `${activeUser.hometownCity}, ${activeUser.hometownCountry}`;
        } else {
          return activeUser.hometownCity;
        }
      } else if (activeUser.location) {
        return activeUser.location;
      }
    } else {
      // WHO IS HERE NOW BUCKET: Physical location today
      
      // Check if user has active travel plans (physically somewhere else)
      const now = new Date();
      const activeTravelPlan = travelPlans?.find((plan: TravelPlan) => {
        if (!plan.startDate) return false;
        const startDate = new Date(plan.startDate);
        const endDate = plan.endDate ? new Date(plan.endDate) : null;
        return startDate <= now && (!endDate || endDate >= now);
      });
      
      if (activeTravelPlan) {
        // Physically traveling - in destination bucket today
        console.log('ConnectModal - user physically in bucket:', activeTravelPlan.destination);
        return activeTravelPlan.destination;
      } else {
        // Physically at home - in hometown bucket today
        if (activeUser.hometownCity) {
          if (activeUser.hometownState && (activeUser.hometownCountry === 'United States' || activeUser.hometownCountry === 'USA')) {
            return `${activeUser.hometownCity}, ${activeUser.hometownState}`;
          } else if (activeUser.hometownCountry && activeUser.hometownCountry !== 'United States' && activeUser.hometownCountry !== 'USA') {
            return `${activeUser.hometownCity}, ${activeUser.hometownCountry}`;
          } else {
            return activeUser.hometownCity;
          }
        } else if (activeUser.location) {
          return activeUser.location;
        }
      }
    }
    
    return '';
  };

  // Re-initialize location when modal opens and automatically trigger search
  useEffect(() => {
    console.log('ConnectModal useEffect - isOpen:', isOpen, 'searchLocation:', searchLocation, 'mode:', defaultLocationMode);
    if (isOpen) {
      const expectedLocation = getUserBucketLocation('who_is_here_now');
      console.log('ConnectModal useEffect - WHO IS HERE NOW bucket:', expectedLocation);
      if (expectedLocation && expectedLocation.trim() !== '') {
        setSearchLocation(expectedLocation);
        setSearchResults([]);
        setIsSearching(false);
        setHasSearched(false);
        // Automatically search the "WHO IS HERE NOW" bucket
        setTimeout(() => {
          setIsSearching(true);
          searchMutation.mutate();
        }, 300);
      }
    } else if (!isOpen) {
      // Reset when modal closes
      handleReset();
    }
  }, [isOpen, defaultLocationMode, currentUser?.id]);

  const searchMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({
        location: searchLocation,
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() })
      });
      
      return apiRequest('GET', `/api/users/search-by-location?${params}`);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setSearchResults(data || []);
      setIsSearching(false);
      setHasSearched(true);
    },
    onError: (error) => {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for users. Please try again.",
        variant: "destructive"
      });
      setIsSearching(false);
      setHasSearched(true);
    }
  });

  const connectMutation = useMutation({
    mutationFn: (targetUserId: number) => 
      apiRequest('POST', '/api/connections/request', { targetUserId }),
    onSuccess: () => {
      toast({
        title: "Connection Request Sent!",
        description: "Your connection request has been sent successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to send connection request. Please try again.";
      const isPrivacyError = errorMessage.includes("privacy settings");
      
      toast({
        title: isPrivacyError ? "Privacy Restriction" : "Connection Failed",
        description: isPrivacyError 
          ? "This user's privacy settings prevent connection requests from new users."
          : errorMessage,
        variant: "destructive"
      });
    }
  });

  const handleSearch = () => {
    if (!searchLocation.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter a location to search.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSearching(true);
    searchMutation.mutate();
  };

  const handleConnect = (userId: number) => {
    connectMutation.mutate(userId);
  };

  const handleMessage = (userId: number) => {
    onClose();
    setLocation(`/messages?userId=${userId}`);
  };

  const handleViewProfile = (userId: number) => {
    onClose();
    setLocation(`/profile/${userId}`);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleReset = () => {
    setSearchLocation(getUserBucketLocation('who_is_here_now'));
    setStartDate(undefined);
    setEndDate(undefined);
    setSearchResults([]);
    setIsSearching(false);
    setHasSearched(false);
  };

  const getDisplayUserType = (user: User, contextLocation?: string) => {
    if (user.userType === 'business') return 'Business';
    if (user.userType === 'local') return 'Local';
    if (user.userType === 'current_traveler') return 'Traveler';
    return user.userType;
  };

  const handleTravelPlanSelect = (plan: TravelPlan) => {
    setSearchLocation(plan.destination);
    if (plan.startDate) setStartDate(new Date(plan.startDate));
    if (plan.endDate) setEndDate(new Date(plan.endDate));
    
    // Automatically trigger search
    setTimeout(() => {
      setIsSearching(true);
      searchMutation.mutate();
    }, 100);
  };

  const formatDateForDisplay = (dateString: string, format: 'SHORT' | 'LONG' = 'SHORT') => {
    try {
      const date = new Date(dateString);
      if (format === 'SHORT') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-900 dark:text-white" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Connect with Travelers & Locals</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Find and connect with locals and travelers in your area
          </p>

          <div className="space-y-6">
            {/* Quick Select Locations */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">Quick Search</h3>
              <div className="flex flex-wrap gap-2">
                {/* WHO IS HERE NOW BUCKET */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const location = getUserBucketLocation('who_is_here_now');
                    console.log('WHO IS HERE NOW bucket clicked, location:', location);
                    if (location) {
                      setSearchLocation(location);
                      setTimeout(() => {
                        setIsSearching(true);
                        searchMutation.mutate();
                      }, 100);
                    }
                  }}
                  className="flex items-center gap-1"
                  disabled={!getUserBucketLocation('who_is_here_now')}
                >
                  <MapPin className="w-3 h-3" />
                  People in {getUserBucketLocation('who_is_here_now') ? getUserBucketLocation('who_is_here_now') : 'this city'}
                </Button>
                
                {/* PERMANENT LOCALS BUCKET */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const location = getUserBucketLocation('permanent_locals_from_my_area');
                    if (location) {
                      setSearchLocation(location);
                      setTimeout(() => {
                        setIsSearching(true);
                        searchMutation.mutate();
                      }, 100);
                    }
                  }}
                  className="flex items-center gap-1"
                  disabled={!getUserBucketLocation('permanent_locals_from_my_area')}
                >
                  <Home className="w-3 h-3" />
                  Nearby Locals and Nearby Travelers from {getUserBucketLocation('permanent_locals_from_my_area') ? getUserBucketLocation('permanent_locals_from_my_area') : 'my area'}
                </Button>
                
                {/* Travel Plans */}
                {(currentUser || authStorage.getUser())?.userType !== 'business' && (
                  travelPlans && travelPlans.length > 0 ? (
                    travelPlans.map((plan: TravelPlan) => (
                      <Button
                        key={plan.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleTravelPlanSelect(plan)}
                        className="flex items-center gap-1"
                      >
                        <Plane className="w-3 h-3" />
                        {plan.destination}
                        <span className="ml-1 text-gray-500 dark:text-gray-400">
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
                    <div className="text-xs text-gray-500 dark:text-gray-400">No travel plans found</div>
                  )
                )}
              </div>
            </div>

            {/* Search Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <Input
                    id="location"
                    placeholder="Enter city or destination..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Start Date (Optional)</Label>
                <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select start date"}
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
                <Label>End Date (Optional)</Label>
                <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select end date"}
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

            <Button 
              onClick={handleSearch}
              disabled={!searchLocation.trim() || isSearching}
              className="w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              {isSearching ? "Searching..." : "Find Locals and Travelers"}
            </Button>

            {/* Search Results */}
            {isSearching && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Searching for travelers...</h3>
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
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Found {searchResults.length} people in {searchLocation}
                  {startDate && endDate && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      ({format(startDate, "MMM d")} - {format(endDate, "MMM d")})
                    </span>
                  )}
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {searchResults.map((user) => (
                    <Card key={user.id} className="hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex items-center space-x-4 flex-1 cursor-pointer"
                            onClick={() => handleViewProfile(user.id)}
                          >
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={user.profileImage} alt={user.username} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-orange-500 text-white">
                                {user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold hover:text-blue-600 transition-colors text-gray-900 dark:text-white">{user.username}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{user.bio}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <MapPin className="w-3 h-3" />
                                <span>{user.location}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {getDisplayUserType(user, searchLocation)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMessage(user.id)}
                              className="flex items-center gap-1"
                            >
                              <MessageCircle className="w-3 h-3" />
                              Message
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleConnect(user.id)}
                              disabled={connectMutation.isPending}
                              className="flex items-center gap-1"
                            >
                              <UserPlus className="w-3 h-3" />
                              {connectMutation.isPending ? "Connecting..." : "Connect"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {hasSearched && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No travelers found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  We couldn't find any travelers or locals in "{searchLocation}" for your selected dates.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Try adjusting your search criteria or dates.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}