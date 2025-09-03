import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Search, X, Users, Filter } from "lucide-react";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import EventCard from "@/components/event-card";
import { Calendar, UserPlus } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authStorage } from "@/lib/auth";

interface AdvancedSearchWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdvancedSearchWidget({ open, onOpenChange }: AdvancedSearchWidgetProps) {
  const { toast } = useToast();
  const currentUser = authStorage.getUser();

  console.log("🔍 AdvancedSearchWidget render:", { open });

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
  const [eventSearchResults, setEventSearchResults] = useState<any[]>([]);
  const [isAdvancedSearching, setIsAdvancedSearching] = useState(false);

  // Connection functionality
  const sendConnectionMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      const response = await apiRequest('POST', '/api/connections', {
        requesterId: currentUser?.id,
        targetUserId: targetUserId,
        receiverId: targetUserId
      });
      if (!response.ok) throw new Error('Failed to send connection request');
      return response.json();
    },
    onSuccess: (_, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: [`/api/connections/${currentUser?.id}`] });
      const targetUser = advancedSearchResults.find(u => u.id === targetUserId);
      toast({
        title: "Connection request sent",
        description: `Your connection request has been sent to @${targetUser?.username}.`,
      });
    },
    onError: (error) => {
      console.error('Connection error:', error);
      toast({
        title: "Connection failed",
        description: "Failed to send connection request. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle checkbox changes for array fields
  const handleCheckboxChange = (field: keyof typeof advancedFilters, value: string, checked: boolean) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field] as string[]), value]
        : (prev[field] as string[]).filter(item => item !== value)
    }));
  };

  // Handle advanced search
  const handleAdvancedSearch = async () => {
    setIsAdvancedSearching(true);
    
    try {
      console.log('🔍 Performing advanced search with filters:', advancedFilters);
      
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
      
      // Search users
      const userResponse = await apiRequest("GET", `/api/search-users?${params.toString()}`);
      const userData = await userResponse.json();
      console.log('🔍 Advanced user search results:', userData);
      
      // Handle the response format: { users: [], total: number, page: number, hasMore: boolean }
      if (!userResponse.ok) {
        throw new Error(`Search failed: ${userResponse.status}`);
      }
      const users = userData.users || userData || [];
      setAdvancedSearchResults(users);
      
      // Also search events if there's a keyword search
      let events: any[] = [];
      if (advancedFilters.search && advancedFilters.search.trim()) {
        try {
          const eventParams = new URLSearchParams();
          eventParams.append('search', advancedFilters.search);
          if (advancedFilters.location) eventParams.append('city', advancedFilters.location);
          
          const eventResponse = await apiRequest("GET", `/api/search-events?${eventParams.toString()}`);
          events = await eventResponse.json();
          console.log('🔍 Advanced event search results:', events);
        } catch (eventError) {
          console.error('🔍 Event search error:', eventError);
          // Don't fail the whole search if events fail
        }
      }
      setEventSearchResults(events);
      
      const totalResults = users.length + events.length;
      toast({
        title: "Search Complete",
        description: `Found ${users.length} users and ${events.length} events matching your criteria`,
      });
    } catch (error) {
      console.error('🔍 Advanced search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search. Please try again.",
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
    setLocationFilter({
      country: "",
      state: "",
      city: ""
    });
    setAdvancedSearchResults([]);
    setEventSearchResults([]);
  };

  // Update location filter when SmartLocationInput changes
  const handleLocationChange = (location: { city: string; state: string; country: string }) => {
    setLocationFilter(location);
    const locationString = [location.city, location.state, location.country].filter(Boolean).join(', ');
    setAdvancedFilters(prev => ({ ...prev, location: locationString }));
  };

  // Sample options for filters
  const genderOptions = ["Male", "Female", "Non-binary", "Other"];
  const sexualPreferenceOptions = ["Straight", "Gay", "Lesbian", "Bisexual", "Pansexual", "Asexual", "Other"];
  const userTypeOptions = ["Local", "Traveler", "Business"];
  const travelerTypeOptions = ["Solo", "Couple", "Group", "Family", "Business"];
  const militaryStatusOptions = ["Active Duty", "Veteran", "Civilian"];

  // Sample interests and activities (you might want to get these from an API)
  const interestOptions = [
    "Family Activities", "Local Food Specialties", "Cheap Eats", "Fine Dining", "Brunch Spots",
    "Craft Beer & Breweries", "Cocktails & Bars", "Photography", "Live Music Venues", "Architecture",
    "Art Galleries", "Cultural Sites", "Hiking & Nature", "Beach Activities", "City Tours & Sightseeing"
  ];

  const activityOptions = [
    "Local Connections", "Experience Sharing", "Travel Buddy", "Language Exchange", 
    "Business Networking", "Cultural Exchange", "Adventure Buddy"
  ];

  const eventOptions = [
    "Meetups", "Networking Events", "Cultural Events", "Outdoor Activities", 
    "Food & Drink", "Entertainment", "Sports", "Educational"
  ];


  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center"
      style={{ zIndex: 999999 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
              <Search className="h-5 w-5" />
              Advanced Search
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
              Find people using detailed filters and preferences
            </p>
          </div>
          <Button 
            onClick={() => onOpenChange(false)}
            variant="ghost"
            size="sm"
            className="flex-shrink-0 ml-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            data-testid="button-close-search"
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close search</span>
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Search */}
          <div>
            <Label htmlFor="search" className="text-black dark:text-white">Search by name or username</Label>
            <Input
              id="search"
              placeholder="Search people..."
              value={advancedFilters.search}
              onChange={(e) => setAdvancedFilters(prev => ({ ...prev, search: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAdvancedSearch();
                }
              }}
              className="mt-1"
            />
          </div>

          {/* Location Filter */}
          <div>
            <Label className="text-black dark:text-white">Location</Label>
            <div className="mt-1">
              <SmartLocationInput
                country={locationFilter.country}
                state={locationFilter.state}
                city={locationFilter.city}
                onLocationChange={handleLocationChange}
                placeholder="Search by location..."
              />
            </div>
          </div>

          {/* Collapsible Filters */}
          <div className="space-y-4">
            {/* Gender Filter */}
            <Collapsible open={expandedSections.gender} onOpenChange={() => toggleSection('gender')}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Gender {advancedFilters.gender.length > 0 && `(${advancedFilters.gender.length})`}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {genderOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`gender-${option}`}
                      checked={advancedFilters.gender.includes(option)}
                      onCheckedChange={(checked) => handleCheckboxChange('gender', option, checked as boolean)}
                    />
                    <Label htmlFor={`gender-${option}`} className="text-black dark:text-white">{option}</Label>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Age Range */}
            <Collapsible open={expandedSections.ageRange} onOpenChange={() => toggleSection('ageRange')}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Age Range</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minAge" className="text-black dark:text-white">Min Age</Label>
                    <Input
                      id="minAge"
                      type="number"
                      placeholder="18"
                      value={advancedFilters.minAge || ""}
                      onChange={(e) => setAdvancedFilters(prev => ({ 
                        ...prev, 
                        minAge: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxAge" className="text-black dark:text-white">Max Age</Label>
                    <Input
                      id="maxAge"
                      type="number"
                      placeholder="65"
                      value={advancedFilters.maxAge || ""}
                      onChange={(e) => setAdvancedFilters(prev => ({ 
                        ...prev, 
                        maxAge: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* User Type */}
            <Collapsible open={expandedSections.userType} onOpenChange={() => toggleSection('userType')}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>User Type {advancedFilters.userType.length > 0 && `(${advancedFilters.userType.length})`}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {userTypeOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`userType-${option}`}
                      checked={advancedFilters.userType.includes(option)}
                      onCheckedChange={(checked) => handleCheckboxChange('userType', option, checked as boolean)}
                    />
                    <Label htmlFor={`userType-${option}`} className="text-black dark:text-white">{option}</Label>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Interests */}
            <Collapsible open={expandedSections.interests} onOpenChange={() => toggleSection('interests')}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Interests {advancedFilters.interests.length > 0 && `(${advancedFilters.interests.length})`}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {interestOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`interest-${option}`}
                        checked={advancedFilters.interests.includes(option)}
                        onCheckedChange={(checked) => handleCheckboxChange('interests', option, checked as boolean)}
                      />
                      <Label htmlFor={`interest-${option}`} className="text-sm text-black dark:text-white">{option}</Label>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Activities */}
            <Collapsible open={expandedSections.activities} onOpenChange={() => toggleSection('activities')}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Activities {advancedFilters.activities.length > 0 && `(${advancedFilters.activities.length})`}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  {activityOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`activity-${option}`}
                        checked={advancedFilters.activities.includes(option)}
                        onCheckedChange={(checked) => handleCheckboxChange('activities', option, checked as boolean)}
                      />
                      <Label htmlFor={`activity-${option}`} className="text-sm text-black dark:text-white">{option}</Label>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Search Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button
              onClick={handleAdvancedSearch}
              disabled={isAdvancedSearching}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-0"
            >
              {isAdvancedSearching ? "Searching..." : "Search People & Events"}
              <Search className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={clearAdvancedFilters}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 whitespace-nowrap"
            >
              Clear Filters
              <X className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Search Results */}
          {advancedSearchResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-black dark:text-white" />
                <h3 className="text-lg font-semibold text-black dark:text-white">Search Results ({advancedSearchResults.length})</h3>
              </div>
              <div className="grid gap-4 max-h-80 overflow-y-auto">
                {advancedSearchResults.map((user) => (
                  <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        <div 
                          className="w-12 h-12 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center cursor-pointer shrink-0"
                          onClick={() => window.open(`/profile/${user.id}`, '_blank')}
                        >
                          {user.profileImage ? (
                            <img 
                              src={user.profileImage} 
                              alt={`@${user.username}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <Users className={`h-6 w-6 text-gray-600 ${user.profileImage ? 'hidden' : ''}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 
                            className="font-medium text-black dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => window.open(`/profile/${user.id}`, '_blank')}
                          >
                            @{user.username}
                          </h4>
                          {user.name && (
                            <p className="text-sm text-gray-800 dark:text-gray-300 font-medium">
                              {user.name}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            📍 {user.hometownCity && `${user.hometownCity}, `}
                            {user.hometownState}
                          </p>
                          {user.bio && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {user.bio}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {user.userType === 'traveler' ? '✈️ Traveler' : 
                               user.userType === 'business' ? '🏢 Business' : '🏠 Local'}
                            </Badge>
                            {user.age && (
                              <Badge variant="outline" className="text-xs">
                                Age {user.age}
                              </Badge>
                            )}
                            {user.gender && (
                              <Badge variant="outline" className="text-xs">
                                {user.gender}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                          <Button
                            size="sm"
                            onClick={() => sendConnectionMutation.mutate(user.id)}
                            disabled={sendConnectionMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none"
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Connect
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/messages?userId=${user.id}`, '_blank')}
                            className="border-gray-300 dark:border-gray-600 flex-1 sm:flex-none"
                          >
                            Message
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No Results Message */}
          {!isAdvancedSearching && advancedSearchResults.length === 0 && eventSearchResults.length === 0 && (
            (advancedFilters.search || advancedFilters.location || advancedFilters.interests.length > 0 || 
             advancedFilters.activities.length > 0 || advancedFilters.userType.length > 0) && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No results found</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Try adjusting your search filters or search terms
                </p>
                <Button
                  onClick={clearAdvancedFilters}
                  variant="outline"
                  size="sm"
                >
                  Clear all filters
                </Button>
              </div>
            )
          )}

          {/* Event Search Results */}
          {eventSearchResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-black dark:text-white" />
                <h3 className="text-lg font-semibold text-black dark:text-white">Events Found ({eventSearchResults.length})</h3>
              </div>
              <div className="grid gap-4 max-h-60 overflow-y-auto">
                {eventSearchResults.map((event) => (
                  <EventCard key={event.id} event={event} compact={true} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}