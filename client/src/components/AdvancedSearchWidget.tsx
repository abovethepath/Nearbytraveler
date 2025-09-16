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
import { MOST_POPULAR_INTERESTS, ADDITIONAL_INTERESTS, getAllActivities, getAllEvents, getPrivateInterests } from "@shared/base-options";
import { GENDER_OPTIONS, SEXUAL_PREFERENCE_OPTIONS, MILITARY_STATUS_OPTIONS } from "@/lib/formConstants";
import { InterestPills } from "@/components/InterestPills";

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
    topChoices: [] as string[],
    interests: [] as string[],
    privateInterests: [] as string[],
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
    travelerTypes: false,
    interests: false,
    privateInterests: false,
    activities: false,
    events: false,
    militaryStatus: false
  });

  // Check if current user has any private interests (for showing private search option)
  const userHasPrivateInterests = currentUser && currentUser.privateInterests && currentUser.privateInterests.length > 0;

  // State for search results
  const [advancedSearchResults, setAdvancedSearchResults] = useState<User[]>([]);
  const [eventSearchResults, setEventSearchResults] = useState<any[]>([]);
  const [isAdvancedSearching, setIsAdvancedSearching] = useState(false);

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Connection mutation
  const connectionMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest(`/api/connections/connect`, {
        method: "POST",
        body: { targetUserId: userId }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      toast({
        title: "Success",
        description: "Connection request sent successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send connection request",
        variant: "destructive",
      });
    }
  });

  // Advanced search handler
  const handleAdvancedSearch = async () => {
    console.log('🔍 Starting advanced search with filters:', advancedFilters);
    setIsAdvancedSearching(true);
    
    try {
      // Build search params for users
      const params = new URLSearchParams();
      if (advancedFilters.search) params.append('search', advancedFilters.search);
      if (advancedFilters.gender.length > 0) params.append('gender', advancedFilters.gender.join(','));
      if (advancedFilters.sexualPreference.length > 0) params.append('sexualPreference', advancedFilters.sexualPreference.join(','));
      if (advancedFilters.minAge) params.append('minAge', advancedFilters.minAge.toString());
      if (advancedFilters.maxAge) params.append('maxAge', advancedFilters.maxAge.toString());
      if (advancedFilters.topChoices.length > 0) params.append('topChoices', advancedFilters.topChoices.join(','));
      if (advancedFilters.interests.length > 0) params.append('interests', advancedFilters.interests.join(','));
      if (advancedFilters.privateInterests.length > 0) params.append('privateInterests', advancedFilters.privateInterests.join(','));
      if (advancedFilters.activities.length > 0) params.append('activities', advancedFilters.activities.join(','));
      if (advancedFilters.events.length > 0) params.append('events', advancedFilters.events.join(','));
      if (advancedFilters.location) params.append('location', advancedFilters.location);
      if (advancedFilters.userType.length > 0) params.append('userType', advancedFilters.userType.join(','));
      if (advancedFilters.travelerTypes.length > 0) params.append('travelerTypes', advancedFilters.travelerTypes.join(','));
      if (advancedFilters.militaryStatus.length > 0) params.append('militaryStatus', advancedFilters.militaryStatus.join(','));
      if (currentUser?.id) params.append('currentUserId', currentUser.id.toString());

      console.log('🔍 Search params:', params.toString());

      // Search users
      const usersResponse = await fetch(`/api/search-users?${params}`);
      const usersData = await usersResponse.json();
      console.log('🔍 Search results:', usersData);
      setAdvancedSearchResults(usersData.users || []);

      // Search events
      const eventParams = new URLSearchParams();
      if (advancedFilters.search) eventParams.append('search', advancedFilters.search);
      if (locationFilter.city) eventParams.append('city', locationFilter.city);

      const eventsResponse = await fetch(`/api/search-events?${eventParams}`);
      const eventsData = await eventsResponse.json();
      console.log('🔍 Event search results:', eventsData);
      setEventSearchResults(eventsData || []);

      toast({
        title: "Search Complete",
        description: `Found ${usersData.users?.length || 0} users and ${eventsData?.length || 0} events`,
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
      topChoices: [],
      interests: [],
      privateInterests: [],
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

  // Complete options for all filters
  const genderOptions = GENDER_OPTIONS;
  const sexualPreferenceOptions = SEXUAL_PREFERENCE_OPTIONS;
  const userTypeOptions = ["Local", "Traveler", "Business"];
  const travelerTypeOptions = ["Solo", "Couple", "Group", "Family", "Business"];
  const militaryStatusOptions = MILITARY_STATUS_OPTIONS;

  // Use proper lists from base-options
  const topChoicesOptions = MOST_POPULAR_INTERESTS;
  const interestOptions = ADDITIONAL_INTERESTS;
  const privateInterestOptions = getPrivateInterests();
  const activityOptions = getAllActivities();
  const eventOptions = getAllEvents();


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

          {/* Search CTA Button */}
          <div className="text-center">
            <Button 
              onClick={handleAdvancedSearch}
              disabled={isAdvancedSearching}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white py-3 px-8 rounded-xl font-semibold text-lg shadow-lg transition-all duration-200 transform hover:scale-105"
              data-testid="button-search-top"
            >
              {isAdvancedSearching ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Search Now
                </>
              )}
            </Button>
          </div>

          {/* Collapsible Filters */}
          <div className="space-y-4">
            {/* Top Choices Filter */}
            <Collapsible open={expandedSections.topChoices} onOpenChange={() => toggleSection('topChoices')}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Top Choices {advancedFilters.topChoices.length > 0 && `(${advancedFilters.topChoices.length})`}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {topChoicesOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`topChoice-${option}`}
                        checked={advancedFilters.topChoices.includes(option)}
                        onCheckedChange={(checked) => {
                          setAdvancedFilters(prev => ({
                            ...prev,
                            topChoices: checked 
                              ? [...prev.topChoices, option]
                              : prev.topChoices.filter(t => t !== option)
                          }));
                        }}
                      />
                      <Label htmlFor={`topChoice-${option}`} className="text-sm font-medium cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

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
                      onCheckedChange={(checked) => {
                        setAdvancedFilters(prev => ({
                          ...prev,
                          gender: checked 
                            ? [...prev.gender, option]
                            : prev.gender.filter(g => g !== option)
                        }));
                      }}
                    />
                    <Label htmlFor={`gender-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Sexual Preference Filter */}
            <Collapsible open={expandedSections.sexualPreference} onOpenChange={() => toggleSection('sexualPreference')}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Sexual Preference {advancedFilters.sexualPreference.length > 0 && `(${advancedFilters.sexualPreference.length})`}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {sexualPreferenceOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sexPref-${option}`}
                      checked={advancedFilters.sexualPreference.includes(option)}
                      onCheckedChange={(checked) => {
                        setAdvancedFilters(prev => ({
                          ...prev,
                          sexualPreference: checked 
                            ? [...prev.sexualPreference, option]
                            : prev.sexualPreference.filter(sp => sp !== option)
                        }));
                      }}
                    />
                    <Label htmlFor={`sexPref-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>


            {/* Military Status Filter */}
            <Collapsible open={expandedSections.militaryStatus} onOpenChange={() => toggleSection('militaryStatus')}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Military Status {advancedFilters.militaryStatus.length > 0 && `(${advancedFilters.militaryStatus.length})`}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {militaryStatusOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`military-${option}`}
                      checked={advancedFilters.militaryStatus.includes(option)}
                      onCheckedChange={(checked) => {
                        setAdvancedFilters(prev => ({
                          ...prev,
                          militaryStatus: checked 
                            ? [...prev.militaryStatus, option]
                            : prev.militaryStatus.filter(m => m !== option)
                        }));
                      }}
                    />
                    <Label htmlFor={`military-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Interests Filter */}
            <Collapsible open={expandedSections.interests} onOpenChange={() => toggleSection('interests')}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Interests {advancedFilters.interests.length > 0 && `(${advancedFilters.interests.length})`}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {interestOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`interest-${option}`}
                        checked={advancedFilters.interests.includes(option)}
                        onCheckedChange={(checked) => {
                          setAdvancedFilters(prev => ({
                            ...prev,
                            interests: checked 
                              ? [...prev.interests, option]
                              : prev.interests.filter(i => i !== option)
                          }));
                        }}
                      />
                      <Label htmlFor={`interest-${option}`} className="text-sm cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Private Interests Filter - Only show if user has private interests */}
            {userHasPrivateInterests && (
              <Collapsible open={expandedSections.privateInterests} onOpenChange={() => toggleSection('privateInterests')}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-red-50 border-red-200 hover:bg-red-100 text-red-700">
                    <span>🔒 Private Interests {advancedFilters.privateInterests.length > 0 && `(${advancedFilters.privateInterests.length})`}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <div className="text-xs text-red-600 mb-2 p-2 bg-red-50 rounded border border-red-200">
                    🔒 <strong>Adult Content:</strong> Search for people with matching private interests. Results are discreet and never shown publicly.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {privateInterestOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`private-interest-${option}`}
                          checked={advancedFilters.privateInterests.includes(option)}
                          onCheckedChange={(checked) => {
                            setAdvancedFilters(prev => ({
                              ...prev,
                              privateInterests: checked 
                                ? [...prev.privateInterests, option]
                                : prev.privateInterests.filter(i => i !== option)
                            }));
                          }}
                        />
                        <Label htmlFor={`private-interest-${option}`} className="text-sm cursor-pointer text-red-700">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Activities Filter */}
            <Collapsible open={expandedSections.activities} onOpenChange={() => toggleSection('activities')}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Activities {advancedFilters.activities.length > 0 && `(${advancedFilters.activities.length})`}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {activityOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`activity-${option}`}
                        checked={advancedFilters.activities.includes(option)}
                        onCheckedChange={(checked) => {
                          setAdvancedFilters(prev => ({
                            ...prev,
                            activities: checked 
                              ? [...prev.activities, option]
                              : prev.activities.filter(a => a !== option)
                          }));
                        }}
                      />
                      <Label htmlFor={`activity-${option}`} className="text-sm cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Events Filter */}
            <Collapsible open={expandedSections.events} onOpenChange={() => toggleSection('events')}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Events {advancedFilters.events.length > 0 && `(${advancedFilters.events.length})`}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {eventOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`event-${option}`}
                        checked={advancedFilters.events.includes(option)}
                        onCheckedChange={(checked) => {
                          setAdvancedFilters(prev => ({
                            ...prev,
                            events: checked 
                              ? [...prev.events, option]
                              : prev.events.filter(e => e !== option)
                          }));
                        }}
                      />
                      <Label htmlFor={`event-${option}`} className="text-sm cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* User Type Filter */}
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
                      onCheckedChange={(checked) => {
                        setAdvancedFilters(prev => ({
                          ...prev,
                          userType: checked 
                            ? [...prev.userType, option]
                            : prev.userType.filter(ut => ut !== option)
                        }));
                      }}
                    />
                    <Label htmlFor={`userType-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Traveler Types Filter */}
            <Collapsible open={expandedSections.travelerTypes} onOpenChange={() => toggleSection('travelerTypes')}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Traveler Types {advancedFilters.travelerTypes.length > 0 && `(${advancedFilters.travelerTypes.length})`}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {travelerTypeOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`travelerType-${option}`}
                      checked={advancedFilters.travelerTypes.includes(option)}
                      onCheckedChange={(checked) => {
                        setAdvancedFilters(prev => ({
                          ...prev,
                          travelerTypes: checked 
                            ? [...prev.travelerTypes, option]
                            : prev.travelerTypes.filter(tt => tt !== option)
                        }));
                      }}
                    />
                    <Label htmlFor={`travelerType-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Age Range */}
          <div className="space-y-2">
            <Label className="text-black dark:text-white">Age Range</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min age"
                value={advancedFilters.minAge || ''}
                onChange={(e) => setAdvancedFilters(prev => ({ 
                  ...prev, 
                  minAge: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="w-24"
              />
              <span className="self-center">to</span>
              <Input
                type="number"
                placeholder="Max age"
                value={advancedFilters.maxAge || ''}
                onChange={(e) => setAdvancedFilters(prev => ({ 
                  ...prev, 
                  maxAge: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="w-24"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleAdvancedSearch}
              disabled={isAdvancedSearching}
              className="flex-1 bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600"
            >
              {isAdvancedSearching ? "Searching..." : "Search"}
            </Button>
            <Button 
              onClick={clearAdvancedFilters}
              variant="outline"
            >
              Clear All
            </Button>
          </div>

          {/* Search Results */}
          {advancedSearchResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  Found {advancedSearchResults.length} {advancedSearchResults.length === 1 ? 'person' : 'people'}
                </h3>
                <Button 
                  onClick={() => onOpenChange(false)}
                  variant="outline" 
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                  data-testid="button-close-to-see-results"
                >
                  Close to see {advancedSearchResults.length === 1 ? 'profile' : 'profiles'}
                </Button>
              </div>
              <div className="grid gap-4">
                {advancedSearchResults.map((user) => (
                  <Card key={user.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Profile Image */}
                        <div className="flex-shrink-0">
                          {user.profileImage ? (
                            <img 
                              src={user.profileImage} 
                              alt={user.name || user.username}
                              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
                              {(user.name || user.username)?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        
                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-black dark:text-white text-lg">
                              {user.name || user.username}
                            </h4>
                            {user.userType && (
                              <Badge variant="secondary" className="text-xs">
                                {user.userType}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            @{user.username}
                          </p>
                          {user.location && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 mb-2 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {user.location}
                            </p>
                          )}
                          {user.bio && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                              {user.bio.length > 120 ? `${user.bio.substring(0, 120)}...` : user.bio}
                            </p>
                          )}
                          {/* Interests Preview */}
                          {user.interests && user.interests.length > 0 && (
                            <InterestPills 
                              interests={user.interests}
                              variant="card"
                              maxRows={2}
                              maxVisibleMobile={8}
                              maxVisibleDesktop={10}
                              className="mb-3"
                            />
                          )}
                        </div>
                        
                        {/* Connect Button */}
                        <div className="flex-shrink-0">
                          <Button
                            onClick={() => connectionMutation.mutate(user.id)}
                            disabled={connectionMutation.isPending}
                            className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-6 py-2"
                            data-testid={`button-connect-${user.id}`}
                          >
                            {connectionMutation.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Connecting...
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Connect
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {eventSearchResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Events ({eventSearchResults.length})
              </h3>
              <div className="grid gap-4">
                {eventSearchResults.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}