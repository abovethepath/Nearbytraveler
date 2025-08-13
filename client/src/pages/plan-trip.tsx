import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/App";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, Building2, Heart, MessageCircle, Star, ArrowLeft, Home, User, Plus, X, Compass, Sparkles, Camera, Coffee, Utensils, Palette, Music, TreePine, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getAllInterests, getAllActivities, getAllEvents, getAllLanguages, validateSelections, MOST_POPULAR_INTERESTS, ADDITIONAL_INTERESTS } from "../../../shared/base-options";
import { BASE_TRAVELER_TYPES } from "../../../shared/base-options";
import { COUNTRIES, CITIES_BY_COUNTRY } from "@/lib/locationData";
import { US_CITIES_BY_STATE } from "@shared/locationData";
import UserCard from "@/components/user-card";
import BackButton from "@/components/back-button";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { getInterestStyle, getActivityStyle, getEventStyle } from "@/lib/topChoicesUtils";
import type { TravelPlan, InsertTravelPlan } from "@shared/schema";

interface TripPlan {
  destination: string;
  destinationCity: string;
  destinationState: string;
  destinationCountry: string;
  startDate: string;
  endDate: string;
  interests: string[];
  activities: string[];
  events: string[];
  travelerTypes: string[];
  accommodation: string;
  transportation: string;
  notes: string;
  isVeteran?: boolean;
  isActiveDuty?: boolean;
  travelStyle?: string[];
}

interface User {
  id: number;
  name: string;
  userType: string;
  location: string;
  bio: string;
  interests: string[];
  profileImage: string;
  hometownCity?: string;
  hometownState?: string;
  travelDestination?: string;
  travelStartDate?: string;
  travelEndDate?: string;
}

interface Business {
  id: number;
  name: string;
  userType: string;
  location: string;
  bio: string;
  interests: string[];
  profileImage: string;
}

export default function PlanTrip() {
  console.log('🎯 PlanTrip component mounting');
  console.log('🎯 Current URL:', window.location.href);
  console.log('🎯 Current pathname:', window.location.pathname);
  
  const user = JSON.parse(localStorage.getItem('travelconnect_user') || 'null') || {};
  console.log('🎯 PlanTrip - User from storage:', user?.username || 'NO USER');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentLocation, setLocation] = useLocation();
  
  console.log('=== PLAN TRIP PAGE INITIALIZATION ===');
  console.log('Current URL location:', currentLocation);
  console.log('URL search params:', window.location.search);
  console.log('User ID:', user?.id);
  console.log('localStorage contents:', Object.keys(localStorage));
  console.log('Any cached travel plan data:', localStorage.getItem('editingTravelPlan'));
  
  // FORCE CLEAR any editing state that might exist
  localStorage.removeItem('editingTravelPlan');
  localStorage.removeItem('selectedTravelPlan');
  localStorage.removeItem('currentTravelPlanId');
  console.log('=== CLEARED ALL TRAVEL PLAN EDITING STATE ===');

  const [tripPlan, setTripPlan] = useState<TripPlan>({
    destination: "",
    destinationCity: "",
    destinationState: "",
    destinationCountry: "",
    startDate: "",
    endDate: "",
    interests: [], // Start empty - user should select what they want for this specific trip
    activities: [], // Start empty - user should select what they want for this specific trip
    events: [], // Start empty - user should select what they want for this specific trip
    travelerTypes: [],
    accommodation: "",
    transportation: "",
    notes: "",
    isVeteran: false,
    isActiveDuty: false,
    travelStyle: [],
  });
  const [hiddenGems, setHiddenGems] = useState<any[]>([]);
  const [isDiscoveringGems, setIsDiscoveringGems] = useState(false);
  

  const [searchResults, setSearchResults] = useState<{
    locals: User[];
    travelers: User[];
    businesses: Business[];
  }>({
    locals: [],
    travelers: [],
    businesses: []
  });

  // Check for edit mode from URL parameters
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Check if we're in edit mode
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
      setEditingPlanId(parseInt(editId));
      setIsEditMode(true);
    }
  }, []);

  // Load existing travel plan for editing
  const { data: existingPlan, isLoading: planLoading } = useQuery<any>({
    queryKey: [`/api/travel-plans/single/${editingPlanId}`],
    enabled: !!editingPlanId,
  });

  // Auto-populate trip plan with existing data when editing or user preferences when creating new
  const [hasInitialized, setHasInitialized] = useState(false);

  // Debug logging for plan data
  useEffect(() => {
    if (editingPlanId) {
      console.log('=== PLAN LOADING DEBUG ===');
      console.log('Editing plan ID:', editingPlanId);
      console.log('Plan loading state:', planLoading);
      console.log('Existing plan data:', existingPlan);
      console.log('Has initialized:', hasInitialized);
      console.log('Is edit mode:', isEditMode);
    }
  }, [editingPlanId, planLoading, existingPlan, hasInitialized, isEditMode]);
  // CRITICAL FIX: Separate initialization for edit vs new trip modes
  useEffect(() => {
    console.log('=== FORM POPULATION EFFECT ===');
    console.log('Is edit mode:', isEditMode);
    console.log('Existing plan:', existingPlan);
    console.log('Plan loading:', planLoading);
    console.log('Has initialized:', hasInitialized);
    
    // EDIT MODE: Load existing plan data when available
    if (isEditMode && existingPlan) {
      console.log('=== LOADING EXISTING PLAN FOR EDITING ===');
      console.log('Existing plan data:', existingPlan);
      
      // CRITICAL FIX: Use database fields directly, fallback to parsing destination string
      let parsedCity = existingPlan?.destinationCity || '';
      let parsedState = existingPlan?.destinationState || '';
      let parsedCountry = existingPlan?.destinationCountry || '';
      
      console.log('=== DATABASE FIELDS ===');
      console.log('destinationCity from DB:', existingPlan?.destinationCity);
      console.log('destinationState from DB:', existingPlan?.destinationState);
      console.log('destinationCountry from DB:', existingPlan?.destinationCountry);
      console.log('destination string from DB:', existingPlan?.destination);
      
      // Only parse from destination string if database fields are empty
      if ((!parsedCity || !parsedCountry) && existingPlan?.destination) {
        console.log('=== FALLBACK PARSING FROM DESTINATION STRING ===');
        const parts = existingPlan.destination.split(', ');
        console.log('Destination parts:', parts);
        
        if (parts.length >= 2) {
          if (!parsedCity) parsedCity = parts[0]; // First part should be city
          if (!parsedCountry) parsedCountry = parts[parts.length - 1]; // Last part should be country
          if (parts.length >= 3 && !parsedState) parsedState = parts[1]; // Middle part should be state
        }
      }
      
      const planData = {
        destination: existingPlan?.destination || '',
        destinationCity: parsedCity,
        destinationState: parsedState,
        destinationCountry: parsedCountry,
        startDate: existingPlan?.startDate ? existingPlan.startDate.split('T')[0] : '',
        endDate: existingPlan?.endDate ? existingPlan.endDate.split('T')[0] : '',
        interests: Array.isArray(existingPlan?.interests) ? existingPlan.interests : [],
        activities: Array.isArray(existingPlan?.activities) ? existingPlan.activities : [],
        events: Array.isArray(existingPlan?.events) ? existingPlan.events : [],
        travelerTypes: Array.isArray(existingPlan?.travelStyle) ? existingPlan.travelStyle : [],
        accommodation: existingPlan?.accommodation || '',
        transportation: existingPlan?.transportation || '',
        notes: existingPlan?.notes || ''
      };
      
      console.log('=== PARSED PLAN DATA FOR EDITING ===');
      console.log('Full existing plan:', existingPlan);
      console.log('Parsed city:', parsedCity);
      console.log('Parsed state:', parsedState);
      console.log('Parsed country:', parsedCountry);
      console.log('Start date:', existingPlan?.startDate, '→', planData.startDate);
      console.log('End date:', existingPlan.endDate, '→', planData.endDate);
      
      console.log('=== SETTING TRIP PLAN DATA ===');
      console.log('Plan data to set:', planData);
      
      setTripPlan(planData);
      
      console.log('=== TRIP PLAN LOADED FOR EDITING ===');
      console.log('Loaded interests:', existingPlan.interests);
      console.log('Loaded activities:', existingPlan.activities);
      console.log('Loaded events:', existingPlan.events);
      console.log('Loaded travel style:', existingPlan.travelStyle);
      console.log('Loaded accommodation:', existingPlan.accommodation);
      console.log('Loaded notes:', existingPlan.notes);
      
      setHasInitialized(true);
    }
  }, [isEditMode, existingPlan]);

  // Load user data for default preferences
  const { data: userData, isLoading: userLoading } = useQuery<any>({
    queryKey: [`/api/users/${user?.id}`],
    enabled: !!user?.id,
  });

  // NEW TRIP MODE: Load user defaults when not editing
  useEffect(() => {
    if (!isEditMode && userData && !userLoading && !hasInitialized) {
      console.log('=== LOADING USER DEFAULTS FOR NEW TRIP ===');
      console.log('User data for defaults:', userData);
      console.log('User interests from signup:', userData?.interests);
      console.log('User activities from signup:', userData?.activities);
      console.log('User events from signup:', userData?.events);
      
      setTripPlan(prev => ({
        ...prev,
        interests: userData?.defaultTravelInterests || userData?.interests || [],
        activities: userData?.defaultTravelActivities || userData?.activities || userData?.localActivities || [],
        events: userData?.defaultTravelEvents || userData?.events || userData?.localEvents || [],
        travelerTypes: userData?.travelStyle || []
      }));
      setHasInitialized(true);
      console.log('=== USER DEFAULTS LOADED FOR NEW TRIP ===');
    }
  }, [userData, userLoading, hasInitialized, isEditMode]);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/1"]
  });

  // Search for people and businesses when destination changes
  const searchDestination = async (destination: string) => {
    if (!destination.trim()) {
      setSearchResults({ locals: [], travelers: [], businesses: [] });
      return;
    }

    try {
      // Build search URL with date parameters if available
      let searchUrl = `/api/users/search-by-location?location=${encodeURIComponent(destination)}`;
      if (tripPlan.startDate && tripPlan.endDate) {
        searchUrl += `&startDate=${encodeURIComponent(tripPlan.startDate)}&endDate=${encodeURIComponent(tripPlan.endDate)}`;
      }
      
      // Search for users in this location
      const usersResponse = await fetch(searchUrl);
      const users = await usersResponse.json();

      // CRITICAL FIX: Proper user categorization based on search location vs their hometown
      const searchLocation = tripPlan.destination.toLowerCase();
      
      const locals = users.filter((user: User) => {
        // Check if this destination is their hometown/current location
        const userHometown = user.hometownCity?.toLowerCase() || '';
        const userState = user.hometownState?.toLowerCase() || '';
        const userLocation = user.location?.toLowerCase() || '';
        
        const isInHometown = 
          userHometown.includes(searchLocation) ||
          searchLocation.includes(userHometown) ||
          userLocation.includes(searchLocation) ||
          searchLocation.includes(userLocation) ||
          (userState && searchLocation.includes(userState));
        
        // CRITICAL FIX: Only exclude if they have travel plans TO THIS SAME DESTINATION
        const hasActiveTravelToThisDestination = user.travelDestination && 
          user.travelStartDate && user.travelEndDate &&
          user.travelDestination.toLowerCase().includes(searchLocation);
        
        // Only show as local if they're from this place AND don't have travel plans to this same place
        return isInHometown && !hasActiveTravelToThisDestination && user.id !== (user?.id || 1);
      });

      // Travelers are those with active travel plans to this destination (exclude locals)
      let travelers = users.filter((user: User) => {
        const hasActiveTravelToDestination = user.travelDestination && 
          user.travelStartDate && user.travelEndDate &&
          user.travelDestination.toLowerCase().includes(searchLocation);
        
        // CRITICAL FIX: Exclude users who are already categorized as locals
        const isAlreadyLocal = locals.some((local: User) => local.id === user.id);
        
        return hasActiveTravelToDestination && !isAlreadyLocal && user.id !== (user?.id || 1);
      });

      // Filter businesses by location - CRITICAL FIX: Only show businesses in the destination
      let businesses = users.filter((user: User) => {
        if (user.userType !== 'business') return false;
        
        // Check if business is in the search destination
        const businessLocation = user.location?.toLowerCase() || '';
        const businessHometown = user.hometownCity?.toLowerCase() || '';
        const businessState = user.hometownState?.toLowerCase() || '';
        
        const isInDestination = 
          businessLocation.includes(searchLocation) ||
          searchLocation.includes(businessLocation) ||
          businessHometown.includes(searchLocation) ||
          searchLocation.includes(businessHometown) ||
          (businessState && searchLocation.includes(businessState));
        
        return isInDestination;
      });

      setSearchResults({ locals, travelers, businesses });
    } catch (error) {
      console.error('Error searching destination:', error);
    }
  };

  // Debounced search when destination or dates change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (tripPlan.destination) {
        searchDestination(tripPlan.destination);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [tripPlan.destination, tripPlan.startDate, tripPlan.endDate]);

  // End trip mutation
  const endTrip = useMutation({
    mutationFn: async (planId: number) => {
      const response = await apiRequest('DELETE', `/api/travel-plans/${planId}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Trip Ended",
        description: "Your trip has been successfully ended.",
      });
      // Clear edit mode and navigate to profile
      localStorage.removeItem('editingTravelPlan');
      setLocation('/profile');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to end trip. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create/Update travel plan mutation
  const createTravelPlan = useMutation({
    mutationFn: async (plan: TripPlan) => {
      // Build proper destination string from components
      const destinationParts = [plan.destinationCity];
      if (plan.destinationState) {
        destinationParts.push(plan.destinationState);
      }
      destinationParts.push(plan.destinationCountry);
      const fullDestination = destinationParts.join(', ');
      
      const travelPlanData = {
        userId: user?.id,
        destination: fullDestination,
        destinationCity: plan.destinationCity,
        destinationState: plan.destinationState,
        destinationCountry: plan.destinationCountry,
        startDate: plan.startDate ? new Date(plan.startDate).toISOString() : null,
        endDate: plan.endDate ? new Date(plan.endDate).toISOString() : null,
        interests: plan.interests || [],
        activities: plan.activities || [],
        events: plan.events || [],
        travelerTypes: plan.travelerTypes || [], // This gets mapped to travelStyle on server
        accommodation: plan.accommodation || '',
        transportation: plan.transportation || '',
        notes: plan.notes || ''
      };

      if (isEditMode && editingPlanId) {
        console.log('=== UPDATE TRAVEL PLAN MUTATION ===');
        console.log('Updating existing travel plan ID:', editingPlanId);
        console.log('Plan data:', travelPlanData);
        
        const response = await apiRequest("PUT", `/api/travel-plans/${editingPlanId}`, travelPlanData);
        return response;
      } else {
        console.log('=== CREATE TRAVEL PLAN MUTATION ===');
        console.log('Creating NEW travel plan with data:', travelPlanData);
        
        try {
          const response = await apiRequest("POST", "/api/travel-plans", travelPlanData);
          console.log('✅ CREATE SUCCESS:', response);
          return response;
        } catch (error) {
          console.error('❌ CREATE ERROR:', error);
          throw error;
        }
      }
    },
    onSuccess: (data) => {
      console.log('=== TRAVEL PLAN SUCCESS ===');
      console.log('Travel plan data:', data);
      
      toast({
        title: isEditMode ? "Trip Plan Updated!" : "Trip Plan Created!",
        description: isEditMode ? "Your travel plan has been updated successfully." : "Your travel plan has been saved and you can now connect with locals and travelers.",
      });
      
      // Reset form to completely clean state
      setTripPlan({
        destination: "",
        destinationCity: "",
        destinationState: "",
        destinationCountry: "",
        startDate: "",
        endDate: "",
        interests: [],
        activities: [],
        events: [],
        travelerTypes: [],
        accommodation: "",
        transportation: "",
        notes: ""
      });
      
      window.scrollTo(0, 0);
      // Invalidate all travel plan queries to ensure they update everywhere
      queryClient.invalidateQueries({ queryKey: ["/api/travel-plans"] });
      queryClient.invalidateQueries({ queryKey: [`/api/travel-plans/${user?.id || 1}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id || 1}/travel-plans`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id || 1}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      // Invalidate location searches since travel plans affect matching
      queryClient.invalidateQueries({ queryKey: ["/api/users/search-by-location"] });
    },
    onError: (error) => {
      console.error('Travel plan creation error:', error);
      toast({
        title: "Error",
        description: `Failed to create trip plan: ${error.message}. Please try again.`,
        variant: "destructive",
      });
    }
  });

  // Save current preferences as defaults mutation
  const saveAsDefaults = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}/defaults`, {
        defaultTravelInterests: tripPlan.interests,
        defaultTravelActivities: tripPlan.activities,
        defaultTravelEvents: tripPlan.events
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Defaults Saved!",
        description: "Your current preferences have been saved as defaults for future trips.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save defaults. Please try again.",
        variant: "destructive",
      });
    }
  });


  const removeActivity = (activity: string) => {
    setTripPlan(prev => ({
      ...prev,
      activities: prev.activities.filter(a => a !== activity)
    }));
  };






  const removeItem = (type: keyof TripPlan, item: string) => {
    setTripPlan(prev => ({
      ...prev,
      [type]: (prev[type] as string[]).filter(i => i !== item)
    }));
  };

  const discoverHiddenGems = async () => {
    if (!tripPlan.destinationCity.trim()) {
      toast({
        title: "Destination required",
        description: "Please select a destination city to discover hidden gems.",
        variant: "destructive",
      });
      return;
    }

    setIsDiscoveringGems(true);
    try {
      const destination = [tripPlan.destinationCity, tripPlan.destinationState, tripPlan.destinationCountry].filter(Boolean).join(', ');
      
      const userProfile = {
        interests: tripPlan.interests,
        travelerTypes: tripPlan.travelerTypes,
        currentLocation: destination,
        userId: user?.id
      };

      const response = await apiRequest("/api/hidden-gems/discover", "POST", {
        destination: destination,
        preferences: {
          categories: tripPlan.interests,
          maxResults: 8,
          excludePopular: true
        },
        userProfile
      });

      const gems = Array.isArray(response) ? response : [];
      setHiddenGems(gems);
      toast({
        title: "Hidden gems discovered!",
        description: `Found ${gems.length} authentic local experiences.`,
      });
    } catch (error: any) {
      toast({
        title: "Discovery failed",
        description: error.message || "Failed to discover hidden gems. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDiscoveringGems(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== FORM SUBMIT DEBUG ===');
    console.log('Current tripPlan state:', tripPlan);
    console.log('User ID:', user?.id);
    console.log('Destination validation:', { city: tripPlan.destinationCity?.trim(), country: tripPlan.destinationCountry?.trim() });
    console.log('Selection counts:', { 
      interests: tripPlan.interests.length, 
      activities: tripPlan.activities.length, 
      events: tripPlan.events.length,
      total: tripPlan.interests.length + tripPlan.activities.length + tripPlan.events.length 
    });
    
    if (!tripPlan.destinationCity.trim()) {
      toast({
        title: "Destination Required",
        description: "Please select a city for your trip destination.",
        variant: "destructive",
      });
      return;
    }
    if (!tripPlan.destinationCountry.trim()) {
      toast({
        title: "Country Required",
        description: "Please select a country for your trip destination.",
        variant: "destructive",
      });
      return;
    }

    // Validate minimum selections (reduced to 1 total for easier trip planning)
    const totalSelections = tripPlan.interests.length + tripPlan.activities.length + tripPlan.events.length;
    if (totalSelections < 1) {
      toast({
        title: "Selection Required",
        description: `Please select at least 1 item total across interests, activities, and events. Currently selected: ${totalSelections}/1`,
        variant: "destructive",
      });
      return;
    }

    // Validate dates - Allow all future trips for regular trip planning
    if (tripPlan.startDate && tripPlan.endDate) {
      const startDate = new Date(tripPlan.startDate);
      const endDate = new Date(tripPlan.endDate);
      
      if (endDate < startDate) {
        toast({
          title: "Invalid Dates",
          description: "End date cannot be before start date. Please check your travel dates.",
          variant: "destructive",
        });
        return;
      }
    }

    console.log('About to call createTravelPlan.mutate with:', tripPlan);
    console.log('Mutation status:', { isPending: createTravelPlan.isPending, isError: createTravelPlan.isError });
    createTravelPlan.mutate(tripPlan);
  };



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div 
        className="relative h-64 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/attached_assets/people-planning-vacation-trip-map-85261359_1750857749346.webp')`
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white">
            <Compass className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2">
              {isEditMode ? "Edit Your Trip" : "Plan Your Trip"}
            </h1>
            <p className="text-xl opacity-90">
              {isEditMode ? "Update your travel plan details" : "Discover your perfect travel companions"}
            </p>
          </div>
        </div>
      </div>

      {/* Trip Planning Form - Full Page Layout */}
      <div className="container max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-8">
            <div className="mb-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Create your travel plan and connect with Nearby Locals, fellow Nearby Travelers and Nearby Businesses at your destination
              </p>
              <p className="text-gray-700 dark:text-gray-300 font-medium mt-2">
                FILL OUT AS DETAILED AS POSSIBLE TO ENSURE THE BEST MATCHES. YOU CAN SAVE YOUR CHOICES AS DEFAULTS ON ALL FUTURE TRIPS.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Travel Destination - Use SmartLocationInput like signup forms */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-black dark:text-white">Travel Destination *</Label>
                <SmartLocationInput
                  city={tripPlan.destinationCity}
                  state={tripPlan.destinationState}
                  country={tripPlan.destinationCountry}
                  onLocationChange={(location) => {
                    setTripPlan(prev => ({
                      ...prev,
                      destinationCity: location.city,
                      destinationState: location.state,
                      destinationCountry: location.country,
                      destination: [location.city, location.state, location.country].filter(Boolean).join(', ')
                    }));
                  }}
                  required={true}
                  placeholder={{
                    country: "Select country",
                    state: "Select state/region",
                    city: "Select city"
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="text-black dark:text-white">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={tripPlan.startDate}
                    min="1925-01-01"
                    max="9999-12-31"
                    onChange={(e) => setTripPlan(prev => ({ ...prev, startDate: e.target.value }))}
                    placeholder="20__-__-__"
                    className="bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600 calendar-white-icon"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-black dark:text-white">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={tripPlan.endDate}
                    min="1925-01-01"
                    max="9999-12-31"
                    onChange={(e) => setTripPlan(prev => ({ ...prev, endDate: e.target.value }))}
                    placeholder="20__-__-__"
                    className="bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600 dark:[&::-webkit-calendar-picker-indicator]:filter dark:[&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
              </div>

              {/* Traveler Types */}
              <div>
                <Label className="text-sm font-medium mb-2 block text-black dark:text-white">
                  Traveler Type on This Trip
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">Select all that apply to help us match you with the right people and experiences</p>
                <div className="grid grid-cols-3 gap-2 border rounded-lg p-3 border-gray-300 dark:border-gray-600">
                  {BASE_TRAVELER_TYPES.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`traveler-type-${type}`}
                        checked={tripPlan.travelerTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTripPlan(prev => ({ ...prev, travelerTypes: [...prev.travelerTypes, type] }));
                          } else {
                            setTripPlan(prev => ({ ...prev, travelerTypes: prev.travelerTypes.filter(t => t !== type) }));
                          }
                        }}
                      />
                      <Label htmlFor={`traveler-type-${type}`} className="text-sm text-black dark:text-white">{type}</Label>
                    </div>
                  ))}
                </div>
              </div>


              {/* Interests Section */}
              <div>
                
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">💫</div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">What Are You Into?</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">Pick at least 10 things to find your perfect matches!</p>
                  <div className="text-xs text-purple-600 dark:text-purple-400">💡 These save as your defaults for faster setup next time</div>
                </div>
                
                {/* I am a Veteran checkbox - positioned prominently */}
                <div className="mb-4">
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      checked={tripPlan.isVeteran || false}
                      onCheckedChange={(checked) => setTripPlan(prev => ({ ...prev, isVeteran: !!checked }))}
                    />
                    <span className="text-sm font-bold text-black dark:text-white">I am a Veteran</span>
                  </label>
                </div>

                {/* I am active duty checkbox - positioned prominently */}
                <div className="mb-4">
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      checked={tripPlan.isActiveDuty || false}
                      onCheckedChange={(checked) => setTripPlan(prev => ({ ...prev, isActiveDuty: !!checked }))}
                    />
                    <span className="text-sm font-bold text-black dark:text-white">I am active duty</span>
                  </label>
                </div>
                
                {/* Top Choices Section */}
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
                    <div className="text-center mb-6">
                      <Star className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <span className="text-lg">🔥</span> Quick Picks - Most Popular
                        </h4>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const newInterests = [...new Set([...tripPlan.interests, ...MOST_POPULAR_INTERESTS])];
                            setTripPlan(prev => ({ ...prev, interests: newInterests }));
                          }}
                          className="text-xs h-6 px-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          Select All
                        </Button>
                      </div>
                    </div>
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-blue-500 via-orange-500 to-red-500 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-yellow-300 text-lg">⭐</span>
                      <h4 className="text-white font-bold text-lg">Top Choices for Most Locals and Travelers</h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {MOST_POPULAR_INTERESTS.map((interest: string) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => {
                            if (tripPlan.interests.includes(interest)) {
                              setTripPlan(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
                            } else {
                              setTripPlan(prev => ({ ...prev, interests: [...prev.interests, interest] }));
                            }
                          }}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                            tripPlan.interests.includes(interest)
                              ? 'bg-white text-blue-600 font-bold transform scale-105'
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* All Interests Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mt-4 border border-gray-200 dark:border-gray-600">
                  <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer list-none mb-4">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span className="text-base">✨</span> More Options ({ADDITIONAL_INTERESTS.length} available)
                    </h4>
                    <div className="text-gray-400 group-open:rotate-180 transition-transform">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </summary>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-4 border-t border-gray-200 dark:border-gray-600">
                    {ADDITIONAL_INTERESTS.map((interest: string) => (
                      <Button
                        key={interest}
                        type="button"
                        variant={tripPlan.interests.includes(interest) ? "default" : "outline"}
                        onClick={() => {
                          if (tripPlan.interests.includes(interest)) {
                            setTripPlan(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
                          } else {
                            setTripPlan(prev => ({ ...prev, interests: [...prev.interests, interest] }));
                          }
                        }}
                        className="h-auto py-2 px-3 text-sm font-medium transition-colors duration-200"
                      >
                        {interest}
                      </Button>
                    ))}
                  </div>
                </details>
                </div>
              </div>
                
                
              </div>

              {/* Activities Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6">
                <div className="text-center mb-6">
                  <Coffee className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">What Do You Want To Do? 🎯</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Tap the ones that sound fun!</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex flex-wrap gap-2">
                    {getAllActivities().map((activity, index) => {
                      const displayText = activity.startsWith("**") && activity.endsWith("**") ? 
                        activity.slice(2, -2) : activity;
                      const isSelected = tripPlan.activities.includes(activity);
                      
                      return (
                        <Button
                          key={`activity-${index}`}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (isSelected) {
                              setTripPlan(prev => ({ ...prev, activities: prev.activities.filter(a => a !== activity) }));
                            } else {
                              setTripPlan(prev => ({ ...prev, activities: [...prev.activities, activity] }));
                            }
                          }}
                          className={`h-8 px-3 text-xs transition-all ${
                            isSelected 
                              ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                              : "bg-white hover:bg-green-50 text-green-700 border-green-300 dark:bg-gray-700 dark:text-green-300 dark:border-green-600 dark:hover:bg-green-900/30"
                          }`}
                        >
                          {displayText}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                
                
              </div>

              {/* Events & Experiences Section */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-6">
                <div className="text-center mb-6">
                  <Calendar className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">What Events Sound Cool? 🎉</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Pick the vibes you're into!</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 mb-4">
                  <div className="flex flex-wrap gap-2">
                    {getAllEvents().map((event, index) => {
                      const isSelected = tripPlan.events.includes(event);
                      
                      return (
                        <Button
                          key={`event-${index}`}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (isSelected) {
                              setTripPlan(prev => ({
                                ...prev,
                                events: prev.events.filter(e => e !== event)
                              }));
                            } else {
                              setTripPlan(prev => ({
                                ...prev,
                                events: [...prev.events, event]
                              }));
                            }
                          }}
                          className={`h-8 px-3 text-xs transition-all ${
                            isSelected 
                              ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-600" 
                              : "bg-white hover:bg-orange-50 text-orange-700 border-orange-300 dark:bg-gray-700 dark:text-orange-300 dark:border-orange-600 dark:hover:bg-orange-900/30"
                          }`}
                        >
                          {event}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                
              </div>



              {/* City Activities Information - No interruption to trip planning flow */}
              <div className="mb-4 bg-gradient-to-r from-blue-600 to-green-600 p-6 rounded-lg border-2 border-blue-400">
                <p className="text-2xl font-bold text-white text-center drop-shadow-lg mb-2">
                  🎯 Want to Find People Doing Specific Activities ON THIS TRIP?
                </p>
                <p className="text-lg text-white/90 text-center font-medium">
                  After completing your trip plan, visit the City Match page to add and check off specific activities, events, and plans to THIS CITY. Find others who want to do the exact same things!
                </p>
              </div>





              {/* Accommodation */}
              <div>
                <Label htmlFor="accommodation" className="text-black dark:text-white">
                  Accommodation on This Trip *
                </Label>
                <Select value={tripPlan.accommodation} onValueChange={(value) => setTripPlan(prev => ({ ...prev, accommodation: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotel-booked">Hotel Booked</SelectItem>
                    <SelectItem value="hostel-booked">Hostel Booked</SelectItem>
                    <SelectItem value="airbnb-booked">Airbnb Booked</SelectItem>
                    <SelectItem value="hotel">Looking for Hotel</SelectItem>
                    <SelectItem value="hostel">Looking for Hostel</SelectItem>
                    <SelectItem value="airbnb">Looking for Airbnb</SelectItem>
                    <SelectItem value="couch">Looking for Couch</SelectItem>
                    <SelectItem value="friends-family">Stay with Friends/Family</SelectItem>
                    <SelectItem value="camping">Camping</SelectItem>
                    <SelectItem value="undecided">Undecided</SelectItem>
                  </SelectContent>
                </Select>
              </div>



              {/* Transportation */}
              <div>
                <Label className="text-sm font-medium mb-2 block text-black dark:text-white">
                  Transportation Method
                </Label>
                <Select value={tripPlan.transportation} onValueChange={(value) => setTripPlan(prev => ({ ...prev, transportation: value }))}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="Select transportation method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Flight">Flight</SelectItem>
                    <SelectItem value="Car">Car</SelectItem>
                    <SelectItem value="Car Rental Need">Car Rental Need</SelectItem>
                    <SelectItem value="Train">Train</SelectItem>
                    <SelectItem value="Bus">Bus</SelectItem>
                    <SelectItem value="Cruise">Cruise</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>



              {/* Notes */}
              <div>
                <Label className="text-sm font-medium mb-2 block text-black dark:text-white">
                  Trip Notes (Optional) - Keyword Searchable
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Other travelers can search these notes to find you! Include hotels, hostels, concerts, restaurants, or specific events you'll attend.
                </p>
                <Textarea
                  value={tripPlan.notes}
                  onChange={(e) => setTripPlan(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g., Staying at Virgin Hotel, attending Taylor Swift concert Aug 10th, want to check out Gordon Ramsay Hell's Kitchen, looking for hiking buddies to Red Rock Canyon..."
                  className="bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                {(tripPlan.interests.length > 0 || tripPlan.activities.length > 0 || tripPlan.events.length > 0) && (
                  <Button 
                    type="button" 
                    className="w-full bg-red-600 text-white hover:bg-red-700" 
                    disabled={saveAsDefaults.isPending}
                    onClick={() => saveAsDefaults.mutate()}
                  >
                    {saveAsDefaults.isPending ? "Saving..." : "Do you want to save as NEW Default Preferences?"}
                  </Button>
                )}
                
                <Button type="submit" className="w-full" disabled={createTravelPlan.isPending}>
                  {createTravelPlan.isPending ? 
                    (isEditMode ? "Updating..." : "Creating...") : 
                    (isEditMode ? "Update Trip Plan" : "Create Trip Plan")
                  }
                </Button>
                
                {isEditMode && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    className="w-full mt-2"
                    disabled={endTrip.isPending}
                    onClick={() => {
                      if (confirm("Are you sure you want to end this trip? This action cannot be undone.")) {
                        if (editingPlanId) {
                          endTrip.mutate(editingPlanId);
                        }
                      }
                    }}
                  >
                    {endTrip.isPending ? "Ending Trip..." : "End Trip"}
                  </Button>
                )}
              </div>
            </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}