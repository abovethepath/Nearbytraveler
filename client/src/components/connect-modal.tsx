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
  Plane, Home, Calendar as CalendarDays, Plus, Filter, ChevronDown, ChevronUp, ChevronRight
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { authStorage } from "@/lib/auth";
import { getAllInterests, getAllActivities, getAllEvents, getAllLanguages } from "../../../shared/base-options";
import { GENDER_OPTIONS, SEXUAL_PREFERENCE_OPTIONS, USER_TYPE_OPTIONS, TRAVELER_TYPE_OPTIONS, MILITARY_STATUS_OPTIONS } from "@/lib/formConstants";
import { BASE_TRAVELER_TYPES } from "../../../shared/base-options";

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

interface SearchFilters {
  gender: string[];
  sexualPreference: string[];
  minAge: string;
  maxAge: string;
  interests: string[];
  activities: string[];
  events: string[];
  userType: string[];
  travelerTypes: string[];
  militaryStatus: string[];
  languages: string[];
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
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    gender: [],
    sexualPreference: [],
    minAge: "",
    maxAge: "",
    interests: [],
    activities: [],
    events: [],
    userType: [],
    travelerTypes: [],
    militaryStatus: [],
    languages: []
  });
  const [customInputs, setCustomInputs] = useState({
    interests: "",
    activities: "",
    events: "",
    languages: ""
  });
  
  // Enhanced filters state with collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    demographics: false,
    topChoices: false,
    interests: false,
    activities: false,
    events: false,
    travelerTypes: false,
    militaryStatus: false
  });
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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
  const { data: travelPlans = [] } = useQuery<TravelPlan[]>({
    queryKey: [`/api/travel-plans/${user?.id}`],
    enabled: !!user?.id && typeof user.id === 'number' && !isNaN(user.id) && isOpen,
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
        // Timezone-safe date parsing for travel plans
        const parseDate = (dateInput: any) => {
          if (!dateInput) return new Date();
          const dateString = typeof dateInput === 'string' ? dateInput : dateInput.toISOString();
          const parts = dateString.split('T')[0].split('-');
          if (parts.length === 3) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const day = parseInt(parts[2]);
            return new Date(year, month, day);
          }
          return new Date(dateInput);
        };
        
        const startDate = parseDate(plan.startDate);
        const endDate = plan.endDate ? parseDate(plan.endDate) : null;
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
        ...(endDate && { endDate: endDate.toISOString() }),
        ...(searchFilters.gender.length > 0 && { gender: JSON.stringify(searchFilters.gender) }),
        ...(searchFilters.sexualPreference.length > 0 && { sexualPreference: JSON.stringify(searchFilters.sexualPreference) }),
        ...(searchFilters.minAge && { minAge: searchFilters.minAge }),
        ...(searchFilters.maxAge && { maxAge: searchFilters.maxAge }),
        ...(searchFilters.interests.length > 0 && { interests: JSON.stringify(searchFilters.interests) }),
        ...(searchFilters.activities.length > 0 && { activities: JSON.stringify(searchFilters.activities) }),
        ...(searchFilters.events.length > 0 && { events: JSON.stringify(searchFilters.events) }),
        ...(searchFilters.userType.length > 0 && { userType: JSON.stringify(searchFilters.userType) }),
        ...(searchFilters.travelerTypes.length > 0 && { travelerTypes: JSON.stringify(searchFilters.travelerTypes) }),
        ...(searchFilters.militaryStatus.length > 0 && { militaryStatus: JSON.stringify(searchFilters.militaryStatus) }),
        ...(searchFilters.languages.length > 0 && { languages: JSON.stringify(searchFilters.languages) })
      });
      
      return apiRequest('GET', `/api/users?${params}`);
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
    setSearchFilters({
      gender: [],
      sexualPreference: [],
      minAge: "",
      maxAge: "",
      interests: [],
      activities: [],
      events: [],
      userType: [],
      travelerTypes: [],
      militaryStatus: [],
      languages: []
    });
    setCustomInputs({
      interests: "",
      activities: "",
      events: "",
      languages: ""
    });
  };

  // Handle preference selection for matching filters
  const handleFilterToggle = (type: keyof SearchFilters, value: string) => {
    setSearchFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value) 
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }));
  };

  // Handle custom input for matching filters
  const handleCustomInput = (type: keyof typeof customInputs, value: string) => {
    setCustomInputs(prev => ({ ...prev, [type]: value }));
  };

  const addCustomItem = (type: keyof SearchFilters) => {
    const value = customInputs[type].trim();
    if (value && !searchFilters[type].includes(value)) {
      setSearchFilters(prev => ({
        ...prev,
        [type]: [...prev[type], value]
      }));
      setCustomInputs(prev => ({ ...prev, [type]: "" }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: keyof SearchFilters) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomItem(type);
    }
  };

  const getDisplayUserType = (user: User, contextLocation?: string) => {
    if (user.userType === 'business') return 'Business';
    if (user.userType === 'local') return 'Local';
    if (user.userType === 'current_traveler') return 'Traveler';
    return user.userType;
  };

  const handleTravelPlanSelect = (plan: TravelPlan) => {
    setSearchLocation(plan.destination);
    // Timezone-safe date parsing helper
    const parseDate = (dateInput: any) => {
      if (!dateInput) return new Date();
      const dateString = typeof dateInput === 'string' ? dateInput : dateInput.toISOString();
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        return new Date(year, month, day);
      }
      return new Date(dateInput);
    };
    
    if (plan.startDate) setStartDate(parseDate(plan.startDate));
    if (plan.endDate) setEndDate(parseDate(plan.endDate));
    
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
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-white via-blue-50 to-orange-50 dark:from-gray-800 dark:via-blue-900/20 dark:to-orange-900/20 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto m-4 border border-blue-200/20 dark:border-blue-600/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-3 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent leading-tight">Connect with Travelers & Locals</h2>
                <p className="text-gray-600 dark:text-gray-300 text-base mt-1">
                  Find and connect with amazing people in your area
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-5 h-5" />
            </Button>
          </div>

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
                    travelPlans.filter((plan: TravelPlan) => {
                      // Show current and planned trips, but hide past trips
                      if (!plan.startDate) return true; // Show trips without dates (planned)
                      
                      const now = new Date();
                      // Timezone-safe date parsing
                      const parseDate = (dateInput: any) => {
                        if (!dateInput) return new Date();
                        const dateString = typeof dateInput === 'string' ? dateInput : dateInput.toISOString();
                        const parts = dateString.split('T')[0].split('-');
                        if (parts.length === 3) {
                          const year = parseInt(parts[0]);
                          const month = parseInt(parts[1]) - 1;
                          const day = parseInt(parts[2]);
                          return new Date(year, month, day);
                        }
                        return new Date(dateInput);
                      };
                      const endDate = plan.endDate ? parseDate(plan.endDate) : null;
                      
                      // If trip has end date, only hide if it's completely finished
                      if (endDate) {
                        return endDate >= now; // Show current and planned trips
                      }
                      
                      // If no end date, always show (could be current or planned)
                      return true;
                    }).map((plan: TravelPlan) => (
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

            {/* Simple Search Button */}
            <Button 
              onClick={handleSearch}
              disabled={!searchLocation.trim() || isSearching}
              className="w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              {isSearching ? "Searching..." : "Find Locals and Travelers"}
            </Button>

            {/* Advanced Filters Toggle */}
            <div className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="w-full flex items-center justify-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
                {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>

            {/* Matching Filters - The 4 Sections - Only show when toggled */}
            {showAdvancedFilters && (
              <div className="space-y-6 border-t pt-6">
                <div>
                  <h3 className="text-sm font-medium mb-3 text-gray-900 dark:text-white">Find People Who Share Your Interests</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                    Select interests, activities, events, and languages to find better matches (optional but recommended)
                  </p>
                </div>

              {/* Interests */}
              <div>
                <Label className="text-sm font-medium text-gray-900 dark:text-white">Interests</Label>
                <div className="flex flex-wrap gap-1 mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
                  {getAllInterests().slice(0, 20).map(interest => {
                    const displayText = interest.startsWith("**") && interest.endsWith("**") ? 
                      interest.slice(2, -2) : interest;
                    const isSelected = searchFilters.interests.includes(interest);
                    
                    return (
                      <Button
                        key={interest}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterToggle("interests", interest)}
                        className={`h-6 px-2 text-xs transition-colors ${
                          isSelected 
                            ? "bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0" 
                            : "bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-600"
                        }`}
                      >
                        {displayText}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add custom interest..."
                    value={customInputs.interests}
                    onChange={(e) => handleCustomInput("interests", e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, "interests")}
                    className="text-sm h-8"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addCustomItem("interests")}
                    className="h-8 px-2"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Activities */}
              <div>
                <Label className="text-sm font-medium text-gray-900 dark:text-white">Activities</Label>
                <div className="flex flex-wrap gap-1 mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border">
                  {getAllActivities().slice(0, 20).map(activity => {
                    const isSelected = searchFilters.activities.includes(activity);
                    
                    return (
                      <Button
                        key={activity}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterToggle("activities", activity)}
                        className={`h-6 px-2 text-xs transition-colors ${
                          isSelected 
                            ? "bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0" 
                            : "bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-600"
                        }`}
                      >
                        {activity}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add custom activity..."
                    value={customInputs.activities}
                    onChange={(e) => handleCustomInput("activities", e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, "activities")}
                    className="text-sm h-8"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addCustomItem("activities")}
                    className="h-8 px-2"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Events */}
              <div>
                <Label className="text-sm font-medium text-gray-900 dark:text-white">Events</Label>
                <div className="flex flex-wrap gap-1 mt-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border">
                  {getAllEvents().slice(0, 20).map(event => {
                    const isSelected = searchFilters.events.includes(event);
                    
                    return (
                      <Button
                        key={event}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterToggle("events", event)}
                        className={`h-6 px-2 text-xs transition-colors ${
                          isSelected 
                            ? "bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0" 
                            : "bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-600"
                        }`}
                      >
                        {event}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add custom event type..."
                    value={customInputs.events}
                    onChange={(e) => handleCustomInput("events", e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, "events")}
                    className="text-sm h-8"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addCustomItem("events")}
                    className="h-8 px-2"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Languages */}
              <div>
                <Label className="text-sm font-medium text-gray-900 dark:text-white">Languages</Label>
                <div className="flex flex-wrap gap-1 mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  {getAllLanguages().slice(0, 15).map(language => {
                    const isSelected = searchFilters.languages.includes(language);
                    
                    return (
                      <Button
                        key={language}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterToggle("languages", language)}
                        className={`h-6 px-2 text-xs transition-colors ${
                          isSelected 
                            ? "bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0" 
                            : "bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-600"
                        }`}
                      >
                        {language}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add custom language..."
                    value={customInputs.languages}
                    onChange={(e) => handleCustomInput("languages", e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, "languages")}
                    className="text-sm h-8"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addCustomItem("languages")}
                    className="h-8 px-2"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              </div>
            )}

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
                  Found {searchResults.length} {(() => {
                    const hasBusinesses = searchResults.some(user => user.userType === 'business');
                    const hasNonBusinesses = searchResults.some(user => user.userType !== 'business');
                    
                    if (hasBusinesses && hasNonBusinesses) {
                      return "people and businesses";
                    } else if (hasBusinesses && !hasNonBusinesses) {
                      return "businesses";
                    } else {
                      return "people";
                    }
                  })()} in {searchLocation}
                  {startDate && endDate && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      ({format(startDate, "MMM d")} - {format(endDate, "MMM d")})
                    </span>
                  )}
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                  {searchResults.map((user) => (
                    <Card key={user.id} className="hover:shadow-2xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-white via-blue-50/30 to-orange-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-orange-900/20 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-600/30 rounded-2xl overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex items-center space-x-6 flex-1 cursor-pointer group"
                            onClick={() => handleViewProfile(user.id)}
                          >
                            <Avatar className="w-16 h-16 ring-4 ring-blue-100 dark:ring-blue-800 group-hover:ring-blue-200 dark:group-hover:ring-blue-700 transition-all">
                              <AvatarImage src={user.profileImage} alt={user.username} className="object-cover" />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-orange-500 text-white text-xl font-bold">
                                {user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-gray-900 dark:text-white mb-2">{user.username}</h4>
                              <p className="text-base text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{user.bio}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span className="font-medium">{user.location}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              size="lg"
                              variant="outline"
                              onClick={() => handleMessage(user.id)}
                              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700 font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Message
                            </Button>
                            <Button
                              size="lg"
                              onClick={() => handleConnect(user.id)}
                              disabled={connectMutation.isPending}
                              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 hover:from-orange-600 hover:to-orange-700 font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                            >
                              <UserPlus className="w-4 h-4" />
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