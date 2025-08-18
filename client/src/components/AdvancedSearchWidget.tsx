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
      
      const response = await fetch(`/api/users/search?${params.toString()}`);
      
      const data = await response.json();
      console.log('🔍 Advanced search results:', data);
      setAdvancedSearchResults(data || []);
      
      toast({
        title: "Search Complete",
        description: `Found ${data?.length || 0} users matching your criteria`,
      });
    } catch (error) {
      console.error('🔍 Advanced search error:', error);
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
      <DialogContent className="max-w-md bg-white dark:bg-gray-900 border shadow-2xl" style={{ zIndex: 999999 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black dark:text-white">
            <Search className="h-5 w-5" />
            TEST - Advanced Search
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            This is a test to see if the dialog shows up
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-black dark:text-white">
          <p>If you can see this text, the dialog is working!</p>
          
          <div>
            <Label htmlFor="test-search" className="text-black dark:text-white">Test Search Input</Label>
            <Input
              id="test-search"
              placeholder="Type something..."
              className="bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => {
              console.log('🔍 TEST: Search button clicked');
              toast({
                title: "Test Search",
                description: "Dialog is working!",
              });
            }} className="flex-1">
              <Search className="mr-2 h-4 w-4" />
              Test Search
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}