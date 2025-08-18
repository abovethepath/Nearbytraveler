import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import type { User } from "@shared/schema";

interface AdvancedSearchWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdvancedSearchWidget({ open, onOpenChange }: AdvancedSearchWidgetProps) {
  const { toast } = useToast();
  
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
    setLocationFilter({
      country: "",
      state: "",
      city: ""
    });
    setAdvancedSearchResults([]);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search
          </DialogTitle>
          <DialogDescription>
            Find people using detailed filters and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Search */}
          <div>
            <Label htmlFor="search">Search by name or username</Label>
            <Input
              id="search"
              placeholder="Search people..."
              value={advancedFilters.search}
              onChange={(e) => setAdvancedFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          {/* Location Filter */}
          <div>
            <Label>Location</Label>
            <SmartLocationInput
              country={locationFilter.country}
              state={locationFilter.state}
              city={locationFilter.city}
              onLocationChange={handleLocationChange}
              placeholder="Search by location..."
            />
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
                    <Label htmlFor={`gender-${option}`}>{option}</Label>
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
                    <Label htmlFor="minAge">Min Age</Label>
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
                    <Label htmlFor="maxAge">Max Age</Label>
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
                    <Label htmlFor={`userType-${option}`}>{option}</Label>
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
                      <Label htmlFor={`interest-${option}`} className="text-sm">{option}</Label>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Search Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleAdvancedSearch}
              disabled={isAdvancedSearching}
              className="flex-1"
            >
              {isAdvancedSearching ? "Searching..." : "Search People"}
              <Search className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={clearAdvancedFilters}
              variant="outline"
            >
              Clear Filters
              <X className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Search Results */}
          {advancedSearchResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Search Results ({advancedSearchResults.length})</h3>
              </div>
              <div className="grid gap-4 max-h-60 overflow-y-auto">
                {advancedSearchResults.map((user) => (
                  <Card key={user.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">@{user.username}</h4>
                          <p className="text-sm text-gray-600">
                            {user.hometownCity && `${user.hometownCity}, `}
                            {user.hometownState}
                          </p>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {user.userType || 'User'}
                            </Badge>
                            {user.age && (
                              <Badge variant="outline" className="text-xs">
                                Age {user.age}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}