import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Search, X, Users, Filter, MapPin, Building2, Zap } from "lucide-react";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, getApiBaseUrl } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import EventCard from "@/components/event-card";
import { Calendar, UserPlus } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authStorage } from "@/lib/auth";
import { MOST_POPULAR_INTERESTS, ADDITIONAL_INTERESTS, getAllActivities, ALL_INTERESTS, ALL_ACTIVITIES, TOP_CHOICES, PUBLIC_LIFESTYLE_INTERESTS } from "@shared/base-options";
import { formatCityDisplay } from "@/lib/locationDisplay";
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
    activities: [] as string[],
    location: "",
    userType: [] as string[],
    travelerTypes: [] as string[],
    militaryStatus: [] as string[],
    newToTown: false,
    travelingWithChildren: false,
    commonFriends: false,
    hostelName: "",
    privateInterests: [] as string[]
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
    activities: false,
    events: false,
    militaryStatus: false,
    newToTown: false,
    privateInterests: false
  });

  // State for search results
  const [advancedSearchResults, setAdvancedSearchResults] = useState<User[]>([]);
  const [eventSearchResults, setEventSearchResults] = useState<any[]>([]);
  const [isAdvancedSearching, setIsAdvancedSearching] = useState(false);

  const { data: availableActiveIds } = useQuery<number[]>({
    queryKey: ["/api/available-now/active-ids"],
    refetchInterval: 60000,
  });
  const availableUserIds = React.useMemo(() => new Set(availableActiveIds || []), [availableActiveIds]);

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Connection mutation
  const connectionMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("POST", `/api/connections/connect`, { targetUserId: userId });
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
      if (advancedFilters.activities.length > 0) params.append('activities', advancedFilters.activities.join(','));
      if (advancedFilters.location) params.append('location', advancedFilters.location);
      if (advancedFilters.userType.length > 0) params.append('userType', advancedFilters.userType.join(','));
      if (advancedFilters.travelerTypes.length > 0) params.append('travelerTypes', advancedFilters.travelerTypes.join(','));
      if (advancedFilters.militaryStatus.length > 0) params.append('militaryStatus', advancedFilters.militaryStatus.join(','));
      if (advancedFilters.newToTown) params.append('newToTown', 'true');
      if (advancedFilters.travelingWithChildren) params.append('travelingWithChildren', 'true');
      if (advancedFilters.commonFriends) params.append('commonFriends', 'true');
      if (advancedFilters.hostelName) params.append('hostelName', advancedFilters.hostelName);
      if (advancedFilters.privateInterests.length > 0) params.append('privateInterests', advancedFilters.privateInterests.join(','));
      if (currentUser?.id) params.append('currentUserId', currentUser.id.toString());

      console.log('🔍 Search params:', params.toString());

      // Search users
      const usersResponse = await fetch(`${getApiBaseUrl()}/api/search-users?${params}`);
      const usersData = await usersResponse.json();
      console.log('🔍 Search results:', usersData);
      setAdvancedSearchResults(usersData.users || []);

      // Search events
      const eventParams = new URLSearchParams();
      if (advancedFilters.search) eventParams.append('search', advancedFilters.search);
      if (locationFilter.city) eventParams.append('city', locationFilter.city);

      const eventsResponse = await fetch(`${getApiBaseUrl()}/api/search-events?${eventParams}`);
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
      activities: [],
      location: "",
      userType: [],
      travelerTypes: [],
      militaryStatus: [],
      newToTown: false,
      travelingWithChildren: false,
      commonFriends: false,
      hostelName: "",
      privateInterests: []
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
  const topChoicesOptions = TOP_CHOICES;

  // Use ALL_INTERESTS to match what users select in signup and profile editing
  // TOP_CHOICES (30 items) + ADDITIONAL_INTERESTS (73 items) = ALL_INTERESTS (103 items)
  const interestOptions = ALL_INTERESTS;
  const activityOptions = ALL_ACTIVITIES;


  if (!open) return null;

  return (
    <div 
      className="fixed inset-x-0 top-0 bottom-16 md:bottom-0 z-[999999] flex items-center justify-center"
      style={{ zIndex: 999999, touchAction: 'none' }}
    >
      {/* Backdrop - solid 95% opacity per platform requirements */}
      <div 
        className="absolute inset-0 bg-black/95"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal Content - solid background for maximum readability */}
      <div 
        className="relative w-full max-w-4xl max-h-[85vh] md:max-h-[90vh] mx-4 bg-white dark:bg-gray-900 rounded-lg shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: 'auto' }}
        data-testid="advanced-search-modal"
      >
        {/* Sticky X Button - Always visible floating in top-right corner */}
        <Button 
          onClick={() => onOpenChange(false)}
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 z-50 w-10 h-10 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-600"
          data-testid="button-close-search-sticky"
          aria-label="Close search"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Header */}
        <div className="flex items-center p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 pr-14">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
              <Search className="h-5 w-5" />
              Advanced Search
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
              Find people using detailed filters and preferences
            </p>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Keyword Search */}
          <div>
            <Label htmlFor="keyword-search" className="text-black dark:text-white font-semibold">Keyword Search</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Search across all profile fields: interests, activities, languages, countries, military status, travel preferences, and more
            </p>
            <Input
              id="keyword-search"
              placeholder="Try: veteran, spanish, france, luxury, polyamorous, kids, photographer..."
              value={advancedFilters.search}
              onChange={(e) => setAdvancedFilters(prev => ({ ...prev, search: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAdvancedSearch();
                }
              }}
              className="mt-1"
              data-testid="input-keyword-search"
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

          {/* Hostel Search Filter */}
          <div className="border border-orange-200 dark:border-orange-700 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <Label className="text-black dark:text-white font-semibold">Hostel Connect</Label>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Staying at a hostel or hotel? Enter the name and set your plans to Public — you'll automatically be added to a chatroom with other travelers staying there.
            </p>
            <Input
              placeholder="Enter hostel or hotel name"
              value={advancedFilters.hostelName}
              onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hostelName: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAdvancedSearch();
                }
              }}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              data-testid="input-hostel-search"
            />
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              🏨 Public plans = automatic chatroom with fellow guests
            </p>
          </div>

          {/* Search CTA Buttons */}
          <div className="flex gap-3 justify-center">
            <Button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔍 SEARCH BUTTON CLICKED - calling handleAdvancedSearch');
                handleAdvancedSearch();
              }}
              disabled={isAdvancedSearching}
              className="flex-1 sm:flex-none sm:min-w-[200px] bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white py-3 px-8 rounded-xl font-semibold text-lg shadow-lg transition-all duration-200 transform hover:scale-105"
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
            <Button 
              type="button"
              onClick={clearAdvancedFilters}
              variant="outline"
              className="px-6 py-3 rounded-xl font-semibold text-lg border-2 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-800"
              data-testid="button-clear-top"
            >
              Clear
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
                <div className="flex flex-wrap gap-2">
                  {topChoicesOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAdvancedFilters(prev => ({
                        ...prev,
                        topChoices: prev.topChoices.includes(option)
                          ? prev.topChoices.filter(t => t !== option)
                          : [...prev.topChoices, option]
                      }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        advancedFilters.topChoices.includes(option)
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-transparent border border-gray-300 dark:border-white/30 text-gray-600 dark:text-white/70 hover:border-orange-400"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Lifestyle Preferences Filter — public, App Store safe options */}
            <Collapsible open={expandedSections.privateInterests} onOpenChange={() => toggleSection('privateInterests')}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>✨</span>
                    <span>Lifestyle Preferences {advancedFilters.privateInterests.length > 0 && `(${advancedFilters.privateInterests.length})`}</span>
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 italic px-1">Find people who share your vibe and lifestyle preferences.</p>
                <div className="flex flex-wrap gap-2">
                  {PUBLIC_LIFESTYLE_INTERESTS.map((option) => {
                    const isSelected = advancedFilters.privateInterests.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setAdvancedFilters(prev => ({
                          ...prev,
                          privateInterests: isSelected
                            ? prev.privateInterests.filter(p => p !== option)
                            : [...prev.privateInterests, option]
                        }))}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          isSelected
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-transparent border border-gray-300 dark:border-white/30 text-gray-600 dark:text-white/70 hover:border-orange-400"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
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
                <div className="flex flex-wrap gap-2">
                  {genderOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAdvancedFilters(prev => ({
                        ...prev,
                        gender: prev.gender.includes(option)
                          ? prev.gender.filter(g => g !== option)
                          : [...prev.gender, option]
                      }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        advancedFilters.gender.includes(option)
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-transparent border border-gray-300 dark:border-white/30 text-gray-600 dark:text-white/70 hover:border-orange-400"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
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
                <div className="flex flex-wrap gap-2">
                  {sexualPreferenceOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAdvancedFilters(prev => ({
                        ...prev,
                        sexualPreference: prev.sexualPreference.includes(option)
                          ? prev.sexualPreference.filter(sp => sp !== option)
                          : [...prev.sexualPreference, option]
                      }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        advancedFilters.sexualPreference.includes(option)
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-transparent border border-gray-300 dark:border-white/30 text-gray-600 dark:text-white/70 hover:border-orange-400"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
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
                <div className="flex flex-wrap gap-2">
                  {militaryStatusOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAdvancedFilters(prev => ({
                        ...prev,
                        militaryStatus: prev.militaryStatus.includes(option)
                          ? prev.militaryStatus.filter(m => m !== option)
                          : [...prev.militaryStatus, option]
                      }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        advancedFilters.militaryStatus.includes(option)
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-transparent border border-gray-300 dark:border-white/30 text-gray-600 dark:text-white/70 hover:border-orange-400"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
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
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1">
                  {interestOptions.map((option) => {
                    const isSelected = advancedFilters.interests.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setAdvancedFilters(prev => ({
                            ...prev,
                            interests: isSelected 
                              ? prev.interests.filter(i => i !== option)
                              : [...prev.interests, option]
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Activities Filter */}
            <Collapsible open={expandedSections.activities} onOpenChange={() => toggleSection('activities')}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Activities {advancedFilters.activities.length > 0 && `(${advancedFilters.activities.length})`}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1">
                  {activityOptions.map((option) => {
                    const isSelected = advancedFilters.activities.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setAdvancedFilters(prev => ({
                            ...prev,
                            activities: isSelected 
                              ? prev.activities.filter(a => a !== option)
                              : [...prev.activities, option]
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
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
                <div className="flex flex-wrap gap-2">
                  {userTypeOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAdvancedFilters(prev => ({
                        ...prev,
                        userType: prev.userType.includes(option)
                          ? prev.userType.filter(ut => ut !== option)
                          : [...prev.userType, option]
                      }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        advancedFilters.userType.includes(option)
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-transparent border border-gray-300 dark:border-white/30 text-gray-600 dark:text-white/70 hover:border-orange-400"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
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
                <div className="flex flex-wrap gap-2">
                  {travelerTypeOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAdvancedFilters(prev => ({
                        ...prev,
                        travelerTypes: prev.travelerTypes.includes(option)
                          ? prev.travelerTypes.filter(tt => tt !== option)
                          : [...prev.travelerTypes, option]
                      }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        advancedFilters.travelerTypes.includes(option)
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-transparent border border-gray-300 dark:border-white/30 text-gray-600 dark:text-white/70 hover:border-orange-400"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* New to Town Filter */}
            <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
              <button
                type="button"
                data-testid="checkbox-new-to-town"
                onClick={() => setAdvancedFilters(prev => ({ ...prev, newToTown: !prev.newToTown }))}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors flex items-center gap-2 ${
                  advancedFilters.newToTown
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-transparent border border-gray-300 dark:border-white/30 text-gray-600 dark:text-white/70 hover:border-orange-400"
                }`}
              >
                <span>New to Town</span>
                <span className={`text-xs ${advancedFilters.newToTown ? "text-white/80" : "text-gray-500"}`}>only</span>
              </button>
            </div>

            {/* Traveling with Children Filter */}
            <div className="p-3 border rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <button
                type="button"
                onClick={() => setAdvancedFilters(prev => ({ ...prev, travelingWithChildren: !prev.travelingWithChildren }))}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors flex items-center gap-2 ${
                  advancedFilters.travelingWithChildren
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-transparent border border-gray-300 dark:border-white/30 text-gray-600 dark:text-white/70 hover:border-orange-400"
                }`}
              >
                <span>Traveling with Kids</span>
                <span className={`text-xs ${advancedFilters.travelingWithChildren ? "text-white/80" : "text-gray-500"}`}>only</span>
              </button>
            </div>

            {/* Common Friends Filter */}
            <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <button
                type="button"
                onClick={() => setAdvancedFilters(prev => ({ ...prev, commonFriends: !prev.commonFriends }))}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors flex items-center gap-2 ${
                  advancedFilters.commonFriends
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-transparent border border-gray-300 dark:border-white/30 text-gray-600 dark:text-white/70 hover:border-orange-400"
                }`}
              >
                <span>Mutual Connections</span>
                <span className={`text-xs ${advancedFilters.commonFriends ? "text-white/80" : "text-gray-500"}`}>only</span>
              </button>
            </div>
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
                className="w-32 min-w-[8rem]"
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
                className="w-32 min-w-[8rem]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔍 BOTTOM SEARCH BUTTON CLICKED - calling handleAdvancedSearch');
                handleAdvancedSearch();
              }}
              disabled={isAdvancedSearching}
              className="flex-1 bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600"
            >
              {isAdvancedSearching ? "Searching..." : "Search"}
            </Button>
            <Button 
              type="button"
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
                  <Card 
                    key={user.id} 
                    className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500 cursor-pointer"
                    onClick={() => {
                      onOpenChange(false);
                      window.location.href = `/profile/${user.id}`;
                    }}
                    data-testid={`user-card-${user.id}`}
                  >
                    <CardContent className="p-4">
                      {/* Header row with avatar, name, and connect button */}
                      <div className="flex items-center gap-3 mb-3">
                        {/* Profile Image */}
                        <div className="flex-shrink-0">
                          {user.profileImage ? (
                            <img 
                              src={user.profileImage} 
                              alt={user.username}
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                              {user.username?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        
                        {/* Username and badges */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-black dark:text-white truncate">
                              {(user as any).firstName || user.name || user.username}
                            </h4>
                            {availableUserIds.has(user.id) && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-blue-500 to-orange-500 text-white flex-shrink-0">
                                <Zap className="w-2.5 h-2.5" />
                                Available
                              </span>
                            )}
                          </div>
                          {/* Hostel match badge - shown when hostel search was used */}
                          {advancedFilters.hostelName && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-700">
                                <Building2 className="w-3 h-3" />
                                🏨 Same hostel!
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Connect Button */}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            connectionMutation.mutate(user.id);
                          }}
                          disabled={connectionMutation.isPending}
                          size="sm"
                          className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-3 py-1 flex-shrink-0"
                          data-testid={`button-connect-${user.id}`}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Connect
                        </Button>
                      </div>
                      
                      {/* User details - location and interests only */}
                      <div className="space-y-2">
                        {(user.hometownCity || user.location) && (
                          <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                              {user.hometownCity
                                ? formatCityDisplay(user.hometownCity, user.hometownState, user.hometownCountry)
                                : user.location}
                            </span>
                          </p>
                        )}
                        {/* Interests Preview */}
                        {user.interests && user.interests.length > 0 && (
                          <InterestPills 
                            interests={user.interests}
                            variant="card"
                            maxRows={2}
                            maxVisibleMobile={6}
                            maxVisibleDesktop={10}
                          />
                        )}
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
        
        {/* Footer - Sticky Close Button */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <Button 
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="w-full py-3 text-base font-medium"
            data-testid="button-close-search-bottom"
          >
            <X className="h-5 w-5 mr-2" />
            Close Search
          </Button>
        </div>
      </div>
    </div>
  );
}