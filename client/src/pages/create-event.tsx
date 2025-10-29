import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertEventSchema, type InsertEvent } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, MapPin, Users, Clock, Tag, Info, ArrowLeft, X, Image as ImageIcon } from "lucide-react";
import { UniversalBackButton } from "@/components/UniversalBackButton";
import Logo from "@/components/logo";
import { COUNTRIES, US_CITIES_BY_STATE } from "@shared/locationData";
import { Badge } from "@/components/ui/badge";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { authStorage } from "@/lib/auth";

// UNIFIED event categories - matches events page exactly (no more duplicates!)
const EVENT_CATEGORIES = [
  "Food & Dining",
  "Social & Networking", 
  "Health & Wellness",
  "Arts & Culture",
  "Music & Entertainment",
  "Sports & Fitness",
  "Family Activities",
  "Nightlife & Parties",
  "Education & Learning",
  "Business & Professional",
  "Custom" // This will allow for custom category input
];

// Tags removed - keeping event creation simple! Event descriptions cover everything.

interface CreateEventProps {
  onEventCreated?: () => void;
}

// Extended form type to include separate time fields, full address, and recurring options
interface EventFormData {
  title: string;
  description?: string;
  venueName?: string; // Name of the venue (e.g., "Jameson Pub")
  street: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  location: string; // Combined display address
  date: string;
  startTime: string;
  endDate?: string;
  endTime?: string;
  category: string;
  maxParticipants?: number;
  isPublic?: boolean;
  tags?: string[];
  requirements?: string;
  imageUrl?: string;
  postToInstagram?: boolean;
  // Recurring event fields
  isRecurring?: boolean;
  recurrenceType?: string;
  recurrenceEnd?: string;
  // Same-day event checkbox
  isSameDay?: boolean;
  // PRIVATE EVENT VISIBILITY TAGS
  genderRestriction?: string;
  sexualOrientationRestriction?: string[];
  lgbtqiaOnly?: boolean;
  veteransOnly?: boolean;
  activeDutyOnly?: boolean;
  womenOnly?: boolean;
  menOnly?: boolean;
  singlePeopleOnly?: boolean;
  familiesOnly?: boolean;
  ageRestrictionMin?: number;
  ageRestrictionMax?: number;
  privateNotes?: string;
}

export default function CreateEvent({ onEventCreated }: CreateEventProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [useBusinessAddress, setUseBusinessAddress] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState("");
  const [meetupUrl, setMeetupUrl] = useState("");
  const [isImportingMeetup, setIsImportingMeetup] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Get current user data
  const currentUser = JSON.parse(localStorage.getItem('travelconnect_user') || '{}');
  
  // Check for event template in localStorage
  const loadEventTemplate = () => {
    // Check for template from business dashboard duplication
    const templateData = localStorage.getItem('eventTemplate');
    // Check for template from profile page Event Organizer Hub duplication
    const duplicateData = localStorage.getItem('duplicateEventData');
    
    const dataToUse = templateData || duplicateData;
    
    if (dataToUse) {
      try {
        const template = JSON.parse(dataToUse);
        // Clear the template from storage after loading
        localStorage.removeItem('eventTemplate');
        localStorage.removeItem('duplicateEventData');
        return template;
      } catch (error) {
        console.error('Error loading event template:', error);
      }
    }
    return null;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<EventFormData>({
    defaultValues: {
      isPublic: true,
      isRecurring: false,
    },
    mode: "onChange"
  });

  // Load template data on component mount OR set default location from user profile
  React.useEffect(() => {
    const template = loadEventTemplate();
    if (template) {
      // Apply template data to form
      if (template.venueName) setValue("venueName", template.venueName);
      if (template.street) setValue("street", template.street);
      if (template.city) setValue("city", template.city);
      if (template.state) setValue("state", template.state);
      if (template.country) setValue("country", template.country);
      if (template.category) setSelectedCategories([template.category]);
      if (template.requirements) setValue("requirements", template.requirements);
      if (template.maxParticipants) setValue("maxParticipants", template.maxParticipants);
      
      // Update location state
      if (template.country) {
        setSelectedCountry(template.country);
        if (template.country === "United States") {
          setAvailableStates(Object.keys(US_CITIES_BY_STATE));
        }
      }
      if (template.state) {
        setSelectedState(template.state);
        if (template.country === "United States" && US_CITIES_BY_STATE[template.state]) {
          setAvailableCities(US_CITIES_BY_STATE[template.state]);
        }
      }
      
      toast({
        title: "Template loaded!",
        description: "Using your previous event as a template. Just add new title and date!"
      });
    } else {
      // No template - set defaults from user's profile location
      if (currentUser.hometownCity) {
        setValue("city", currentUser.hometownCity);
      }
      if (currentUser.hometownState) {
        setValue("state", currentUser.hometownState);
        setSelectedState(currentUser.hometownState);
      }
      if (currentUser.hometownCountry) {
        setValue("country", currentUser.hometownCountry);
        setSelectedCountry(currentUser.hometownCountry);
        if (currentUser.hometownCountry === "United States") {
          setAvailableStates(Object.keys(US_CITIES_BY_STATE));
          if (currentUser.hometownState && US_CITIES_BY_STATE[currentUser.hometownState]) {
            setAvailableCities(US_CITIES_BY_STATE[currentUser.hometownState]);
          }
        }
      }
    }
  }, []);


  // Business address handler
  const handleUseBusinessAddress = (checked: boolean) => {
    setUseBusinessAddress(checked);
    if (checked && currentUser.userType === 'business') {
      // Auto-fill with business address data
      setValue("street", currentUser.streetAddress || "");
      setValue("city", currentUser.hometownCity || "");
      setValue("state", currentUser.hometownState || "");
      setValue("country", currentUser.hometownCountry || "");
      setValue("zipcode", currentUser.zipCode || "");
      setValue("location", `${currentUser.hometownCity}${currentUser.hometownState ? `, ${currentUser.hometownState}` : ""}, ${currentUser.hometownCountry}`);
      
      // Update component state
      setSelectedCountry(currentUser.hometownCountry || "");
      setSelectedState(currentUser.hometownState || "");
    } else if (!checked) {
      // Clear fields when unchecked
      setValue("street", "");
      setValue("city", "");
      setValue("state", "");
      setValue("country", "");
      setValue("zipcode", "");
      setValue("location", "");
      setSelectedCountry("");
      setSelectedState("");
    }
  };

  // Location handlers
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedState("");
    setValue("country", country);
    setValue("state", "");
    setValue("city", "");
    
    if (country === "United States") {
      setAvailableStates(Object.keys(US_CITIES_BY_STATE));
    } else {
      setAvailableStates([]);
    }
    setAvailableCities([]);
    
    // Force re-render by clearing and setting city field
    setTimeout(() => {
      setValue("city", "");
    }, 0);
    
    updateLocationString();
  };

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setValue("state", state);
    setValue("city", "");
    
    if (selectedCountry === "United States" && US_CITIES_BY_STATE[state]) {
      setAvailableCities(US_CITIES_BY_STATE[state]);
    } else {
      setAvailableCities([]);
    }
    updateLocationString();
  };

  const handleCityChange = (city: string) => {
    setValue("city", city);
    updateLocationString();
  };

  const updateLocationString = () => {
    const street = watch("street");
    const city = watch("city");
    const state = watch("state");
    const country = watch("country");
    
    let location = "";
    if (street) location += street;
    if (city) location += (location ? ", " : "") + city;
    if (state) location += (location ? ", " : "") + state;
    
    setValue("location", location);
  };

  const createEventMutation = useMutation({
    mutationFn: async (eventData: InsertEvent) => {
      return await apiRequest("POST", "/api/events", eventData);
    },
    onSuccess: () => {
      toast({
        title: "Event Created!",
        description: "Your event has been created successfully. Others can now join!",
      });
      // CRITICAL: Invalidate ALL events-related queries to show new event immediately
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", "all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/all-locations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/participants"] });
      
      // Invalidate events for all possible cities
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey[0] === "/api/events" || 
                 (Array.isArray(query.queryKey) && query.queryKey.includes("events"));
        }
      });
      
      // Force a complete refresh of all event-related data
      queryClient.refetchQueries({ queryKey: ["/api/events"] });
      
      reset();
      setSelectedCategories([]);
      setCustomCategory("");
      setImagePreview(null);
      setUseBusinessAddress(false);
      setSelectedCountry("");
      setSelectedState("");
      setIsRecurring(false);
      setRecurrenceType("");
      onEventCreated?.();
    },
    onError: (error) => {
      // CRITICAL: Enhanced error handling with visible error messages
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("🚨 EVENT CREATION MUTATION ERROR:", error);
      
      toast({
        title: "❌ Failed to Create Event",
        description: errorMessage,
        variant: "destructive",
        duration: 8000, // Show for 8 seconds
        className: "z-[9999] bg-red-600 text-white border-red-700", // High z-index to appear above all widgets
      });
    },
  });

  const onSubmit = async (data: any) => {
    
    setIsSubmitting(true);
    try {
      // Get user data to set organizer ID using the proper auth system
      let user = authStorage.getUser();
      
      if (!user || !user.id) {
        // Try emergency refresh if no user found
        const refreshedUser = await authStorage.forceRefreshUser();
        if (!refreshedUser || !refreshedUser.id) {
          throw new Error('User not found. Please log in again.');
        }
        user = refreshedUser;
      }
      
      // Combine date and time fields into proper datetime strings
      let startDateTime = null;
      let endDateTime = null;

      // Create datetime in local timezone to preserve event's local time
      if (data.date && data.startTime) {
        // Parse as local time, not UTC
        const dateTimeParts = `${data.date}T${data.startTime}`.split(/[T:-]/);
        startDateTime = new Date(
          parseInt(dateTimeParts[0]), // year
          parseInt(dateTimeParts[1]) - 1, // month (0-indexed)
          parseInt(dateTimeParts[2]), // day
          parseInt(dateTimeParts[3]), // hour
          parseInt(dateTimeParts[4]) // minute
        );
      } else if (data.date) {
        const dateParts = data.date.split('-');
        startDateTime = new Date(
          parseInt(dateParts[0]), // year
          parseInt(dateParts[1]) - 1, // month (0-indexed)
          parseInt(dateParts[2]) // day
        );
      }

      if (data.endDate && data.endTime) {
        const dateTimeParts = `${data.endDate}T${data.endTime}`.split(/[T:-]/);
        endDateTime = new Date(
          parseInt(dateTimeParts[0]), // year
          parseInt(dateTimeParts[1]) - 1, // month (0-indexed)
          parseInt(dateTimeParts[2]), // day
          parseInt(dateTimeParts[3]), // hour
          parseInt(dateTimeParts[4]) // minute
        );
      } else if (data.endDate) {
        const dateParts = data.endDate.split('-');
        endDateTime = new Date(
          parseInt(dateParts[0]), // year
          parseInt(dateParts[1]) - 1, // month (0-indexed)
          parseInt(dateParts[2]) // day
        );
      }
      
      // Ensure we have a valid start date
      if (!startDateTime || isNaN(startDateTime.getTime())) {
        throw new Error('Start date and time are required and must be valid');
      }
      
      // Ensure end date is valid if provided
      if (endDateTime && isNaN(endDateTime.getTime())) {
        throw new Error('End date must be a valid date');
      }

      // Create combined display location from address fields - avoid undefined concatenation
      const locationParts = [];
      if (data.street) locationParts.push(data.street);
      if (data.city) locationParts.push(data.city);
      if (data.state) locationParts.push(data.state);
      const displayLocation = locationParts.join(', ');
      
      // Validate categories and remove duplicates/redundancy
      let finalCategories = [...selectedCategories];
      if (selectedCategories.includes("Custom") && customCategory.trim()) {
        finalCategories = finalCategories.filter(cat => cat !== "Custom").concat([customCategory.trim()]);
      } else if (selectedCategories.includes("Custom")) {
        finalCategories = finalCategories.filter(cat => cat !== "Custom");
      }
      
      // Remove redundant categories (e.g., if both "Adventure Sports" and "Sports & Fitness" are selected, keep only "Adventure Sports")
      const redundancyMap = {
        "Adventure Sports": ["Sports & Fitness"],
        "Health & Wellness": ["Sports & Fitness"],
        "Entertainment": ["Music", "Arts & Culture"],
        "Food & Dining": ["Food"]
      };
      
      finalCategories = finalCategories.filter((category, index, array) => {
        // Check if this category should be removed due to redundancy
        for (const [primary, redundant] of Object.entries(redundancyMap)) {
          if (redundant.includes(category) && array.includes(primary)) {
            return false; // Remove the redundant category
          }
        }
        return true;
      });
      
      // Remove duplicates
      finalCategories = [...new Set(finalCategories)];
      
      if (finalCategories.length === 0) {
        throw new Error('At least one event category is required');
      }

      const eventData = {
        title: data.title,
        description: data.description || '',
        venueName: data.venueName || '',
        street: data.street,
        city: data.city,
        state: data.state || '',
        country: data.country,
        zipcode: data.zipcode,
        location: displayLocation,
        date: startDateTime,
        endDate: endDateTime,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        category: finalCategories.join(", "),
        organizerId: user.id,
        maxParticipants: data.maxParticipants ? parseInt(data.maxParticipants.toString()) : null,
        isPublic: data.isPublic !== false,
        tags: [],
        requirements: data.requirements || '',
        imageUrl: data.imageUrl || null,
        // Recurring event fields
        isRecurring: data.isRecurring || false,
        recurrenceType: data.recurrenceType || null,
        recurrenceEnd: data.recurrenceEnd && data.recurrenceEnd.trim() ? (() => {
          const date = new Date(data.recurrenceEnd);
          return !isNaN(date.getTime()) ? date : null;
        })() : null,
        // Private visibility fields
        genderRestriction: data.genderRestriction || null,
        sexualOrientationRestriction: data.sexualOrientationRestriction || null,
        lgbtqiaOnly: data.lgbtqiaOnly || false,
        veteransOnly: data.veteransOnly || false,
        activeDutyOnly: data.activeDutyOnly || false,
        womenOnly: data.womenOnly || false,
        menOnly: data.menOnly || false,
        singlePeopleOnly: data.singlePeopleOnly || false,
        familiesOnly: data.familiesOnly || false,
        ageRestrictionMin: data.ageRestrictionMin || null,
        ageRestrictionMax: data.ageRestrictionMax || null,
        privateNotes: data.privateNotes || null,
        customRestriction: data.customRestriction ? 
          data.customRestriction.trim().toLowerCase().endsWith(' only') ? 
            data.customRestriction.trim() : 
            `${data.customRestriction.trim()} only` 
          : null,
      };

      await createEventMutation.mutateAsync(eventData);
    } catch (error) {
      
      // Extract detailed error message from API response
      let errorMessage = "Event creation failed";
      
      if (error && typeof error === 'object' && (error as any).message) {
        errorMessage = (error as any).message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Show error prominently
      toast({
        title: "❌ Event Creation Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // Show for 10 seconds
        className: "z-[9999] bg-red-600 text-white border-red-700 fixed top-4 right-4 max-w-md", // Fixed position, high z-index
      });
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div>
      {/* Header with Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <UniversalBackButton 
                destination="/events"
                label="Back"
                className="bg-transparent"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Users className="w-6 h-6 text-blue-600" />
            Create New Event
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-300">
            Create an event for your city where locals and travelers can connect and join
          </p>
        </CardHeader>
        
        <CardContent>
          <form 
            onSubmit={(e) => {
              console.log('🎯 Form onSubmit event triggered');
              console.log('🎯 Form element:', e.target);
              console.log('🎯 Form validity:', (e.target as HTMLFormElement).checkValidity());
              handleSubmit(onSubmit)(e);
            }}
            className="space-y-6"
          >
            {/* Import from Meetup */}
            <Card className="border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-purple-800 dark:text-purple-200">
                  🚀 Quick Import from Meetup.com
                </CardTitle>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Paste your Meetup event URL to auto-fill the form in seconds!
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={meetupUrl}
                    onChange={(e) => setMeetupUrl(e.target.value)}
                    placeholder="https://www.meetup.com/your-group/events/12345/"
                    className="flex-1 bg-white dark:bg-gray-800"
                    data-testid="input-meetup-url"
                  />
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!meetupUrl.trim()) {
                        toast({
                          title: "Missing URL",
                          description: "Please paste a Meetup event URL",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      setIsImportingMeetup(true);
                      try {
                        const response = await fetch(`/api/scrape-meetup?url=${encodeURIComponent(meetupUrl)}`);
                        if (!response.ok) {
                          throw new Error('Failed to fetch Meetup event');
                        }
                        const eventData = await response.json();
                        
                        // Auto-fill the form with scraped data
                        if (eventData.title) setValue("title", eventData.title);
                        if (eventData.description) setValue("description", eventData.description);
                        if (eventData.venueName) setValue("venueName", eventData.venueName);
                        if (eventData.street) setValue("street", eventData.street);
                        if (eventData.city) setValue("city", eventData.city);
                        if (eventData.state) setValue("state", eventData.state);
                        if (eventData.country) setValue("country", eventData.country);
                        if (eventData.zipcode) setValue("zipcode", eventData.zipcode);
                        if (eventData.date) setValue("date", eventData.date);
                        if (eventData.startTime) setValue("startTime", eventData.startTime);
                        if (eventData.maxParticipants) setValue("maxParticipants", eventData.maxParticipants);
                        
                        // Update location state
                        if (eventData.country) setSelectedCountry(eventData.country);
                        if (eventData.state) setSelectedState(eventData.state);
                        
                        toast({
                          title: "✨ Event imported!",
                          description: "Check the details and create your event",
                        });
                      } catch (error) {
                        toast({
                          title: "Import failed",
                          description: error instanceof Error ? error.message : "Could not import Meetup event",
                          variant: "destructive"
                        });
                      } finally {
                        setIsImportingMeetup(false);
                      }
                    }}
                    disabled={isImportingMeetup || !meetupUrl.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    data-testid="button-import-meetup"
                  >
                    {isImportingMeetup ? "Importing..." : "Import"}
                  </Button>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  💡 Tip: This works with any public Meetup event. Just paste the URL and click Import!
                </p>
              </CardContent>
            </Card>

            {/* Event Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Event Title *
              </Label>
              <Input
                id="title"
                {...register("title", { required: "Event title is required" })}
                placeholder="e.g., Beach Volleyball Tournament, Food Tour, Art Gallery Night"
                className="w-full"
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Description
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe your event, what to expect, what to bring, etc."
                className="w-full min-h-[100px]"
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Full Address */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <MapPin className="w-5 h-5" />
                  Event Address
                </Label>
                
                {/* Use Business Address Checkbox - Only show for business users */}
                {currentUser.userType === 'business' && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="useBusinessAddress"
                      checked={useBusinessAddress}
                      onCheckedChange={handleUseBusinessAddress}
                    />
                    <Label htmlFor="useBusinessAddress" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Use Business Address
                    </Label>
                  </div>
                )}
              </div>
              
              {/* Venue Name */}
              <div className="space-y-2">
                <Label htmlFor="venueName" className="text-sm font-medium dark:text-white">
                  Venue Name (Optional)
                </Label>
                <Input
                  id="venueName"
                  {...register("venueName")}
                  placeholder="e.g., Jameson Pub, Central Park, Coffee Shop"
                  className="w-full bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600"
                />
                {errors.venueName && (
                  <p className="text-sm text-red-500">{errors.venueName.message}</p>
                )}
              </div>

              {/* Street Address */}
              <div className="space-y-2">
                <Label htmlFor="street" className="text-sm font-medium dark:text-white">
                  Street Address *
                </Label>
                <Input
                  id="street"
                  {...register("street", { required: "Street address is required" })}
                  placeholder="123 Main Street"
                  className="w-full bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600"
                />
                {errors.street && (
                  <p className="text-sm text-red-500">{errors.street.message}</p>
                )}
              </div>

              {/* Event Location - Use SmartLocationInput like signup forms */}
              <div className="space-y-2">
                <Label className="text-sm font-medium dark:text-white">Event Location *</Label>
                <SmartLocationInput
                  city={watch("city") || ""}
                  state={watch("state") || ""}
                  country={watch("country") || ""}
                  onLocationChange={(location) => {
                    setValue("city", location.city);
                    setValue("state", location.state);
                    setValue("country", location.country);
                    setValue("location", `${location.city}${location.state ? `, ${location.state}` : ""}`);
                  }}
                  required={true}
                  placeholder={{
                    country: "Select country",
                    state: "Select state/region",
                    city: "Select city"
                  }}
                />
              </div>


            </div>

            {/* Date and Time */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <CalendarIcon className="w-5 h-5" />
                Event Schedule
              </Label>
              
              {/* Start Date & Time */}
              <div className="border rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                <h4 className="font-medium text-sm text-gray-700 dark:text-white uppercase tracking-wide">Start</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-sm font-medium dark:text-white">
                      Date *
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      {...register("date", { required: "Event date is required" })}
                      min={new Date().toISOString().split('T')[0]}
                      max="9999-12-31"
                      placeholder="20__-__-__"
                      className="w-full bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600"
                      style={{ colorScheme: 'light dark' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-sm font-medium dark:text-white">
                      Time *
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      {...register("startTime", { required: "Start time is required" })}
                      className="w-full bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600"
                      style={{ colorScheme: 'light dark' }}
                    />
                  </div>
                </div>
                {(errors.date || errors.startTime) && (
                  <div className="space-y-1">
                    {errors.date && (
                      <p className="text-sm text-red-500">{errors.date.message}</p>
                    )}
                    {errors.startTime && (
                      <p className="text-sm text-red-500">{errors.startTime.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Same Day Checkbox */}
              <div className="flex items-center gap-3 py-2">
                <Checkbox
                  id="isSameDay"
                  checked={watch("isSameDay") || false}
                  onCheckedChange={(checked) => {
                    setValue("isSameDay", !!checked);
                    if (checked) {
                      // Auto-copy start date to end date
                      const startDate = watch("date");
                      if (startDate) {
                        setValue("endDate", startDate);
                      }
                    }
                  }}
                />
                <Label htmlFor="isSameDay" className="text-sm font-medium text-gray-700 dark:text-white cursor-pointer">
                  ✅ Same day event (most events start and end on the same day)
                </Label>
              </div>

              {/* End Date & Time */}
              <div className="border rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                <h4 className="font-medium text-sm text-gray-700 dark:text-white uppercase tracking-wide">
                  {watch("isSameDay") ? "End Time *" : "End Date & Time *"}
                </h4>
                <div className={`grid ${watch("isSameDay") ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"} gap-4`}>
                  {!watch("isSameDay") && (
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-sm font-medium dark:text-white">
                        Date *
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        {...register("endDate", { required: !watch("isSameDay") ? "End date is required" : false })}
                        min={new Date().toISOString().split('T')[0]}
                        max="9999-12-31"
                        placeholder="20__-__-__"
                        className="w-full bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600"
                        style={{ colorScheme: 'light dark' }}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-sm font-medium dark:text-white">
                      {watch("isSameDay") ? "End Time *" : "Time *"}
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      {...register("endTime", { required: "End time is required" })}
                      className="w-full bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600"
                      style={{ colorScheme: 'light dark' }}
                    />
                  </div>
                </div>
                {(errors.endDate || errors.endTime) && (
                  <div className="space-y-1">
                    {errors.endDate && (
                      <p className="text-sm text-red-500">{errors.endDate.message}</p>
                    )}
                    {errors.endTime && (
                      <p className="text-sm text-red-500">{errors.endTime.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Recurring Event Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
                  <CalendarIcon className="w-5 h-5" />
                  Repeat Event
                </Label>
              </div>
              
              <div className="border rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isRecurring"
                    checked={isRecurring}
                    onCheckedChange={(checked) => {
                      setIsRecurring(!!checked);
                      setValue("isRecurring", !!checked);
                      if (!checked) {
                        setRecurrenceType("");
                        setValue("recurrenceType", "");
                        setValue("recurrenceEnd", "");
                      }
                    }}
                  />
                  <Label htmlFor="isRecurring" className="text-sm font-medium text-gray-700 dark:text-white cursor-pointer">
                    Make this a recurring event
                  </Label>
                </div>

                {isRecurring && (
                  <div className="space-y-4 pt-2 border-t border-gray-300 dark:border-gray-600">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 dark:text-white">
                        How often should this event repeat? *
                      </Label>
                      <Select
                        value={recurrenceType}
                        onValueChange={(value) => {
                          setRecurrenceType(value);
                          setValue("recurrenceType", value);
                        }}
                      >
                        <SelectTrigger 
                          className="w-full bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600"
                          data-testid="select-recurrence-type"
                        >
                          <SelectValue placeholder="Choose repeat frequency" />
                        </SelectTrigger>
                        <SelectContent 
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 z-[9999]"
                          position="popper"
                          sideOffset={5}
                        >
                          <SelectItem value="daily" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700">Every Day</SelectItem>
                          <SelectItem value="weekly" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700">Every Week (same day)</SelectItem>
                          <SelectItem value="biweekly" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700">Every 2 Weeks</SelectItem>
                          <SelectItem value="monthly" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700">Every Month (same date)</SelectItem>
                          <SelectItem value="monthly_weekday" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700">Every Month (same weekday)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {recurrenceType && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-white">
                          When should the recurring events end? *
                        </Label>
                        <Input
                          type="date"
                          {...register("recurrenceEnd", { 
                            required: isRecurring ? "End date is required for recurring events" : false 
                          })}
                          min={new Date().toISOString().split('T')[0]}
                          max="9999-12-31"
                          className="w-full bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600"
                          style={{ colorScheme: 'light dark' }}
                        />
                        {errors.recurrenceEnd && (
                          <p className="text-sm text-red-500">{errors.recurrenceEnd.message}</p>
                        )}
                      </div>
                    )}

                    {recurrenceType && (
                      <div className="text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md p-3 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-300">
                        <strong>Preview:</strong> {
                          recurrenceType === 'daily' ? 'Your event will repeat every day until the end date.' :
                          recurrenceType === 'weekly' ? 'Your event will repeat every week on the same day until the end date.' :
                          recurrenceType === 'biweekly' ? 'Your event will repeat every 2 weeks on the same day until the end date.' :
                          recurrenceType === 'monthly' ? 'Your event will repeat monthly on the same date until the end date.' :
                          recurrenceType === 'monthly_weekday' ? 'Your event will repeat monthly on the same weekday until the end date.' :
                          'Select a repeat frequency to see preview.'
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Event Categories * (Select all that apply)
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                {EVENT_CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCategories([...selectedCategories, category]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== category));
                          if (category === "Custom") {
                            setCustomCategory(""); // Clear custom category when unchecked
                          }
                        }
                      }}
                    />
                    <Label htmlFor={category} className="text-sm font-medium text-gray-700 dark:text-white cursor-pointer">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
              
              {selectedCategories.includes("Custom") && (
                <div className="space-y-2">
                  <Label htmlFor="customCategory">Custom Category</Label>
                  <Input
                    id="customCategory"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter your custom category"
                    className="w-full bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600"
                  />
                </div>
              )}
              
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>

            {/* Max Participants */}
            <div className="space-y-2">
              <Label htmlFor="maxParticipants" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Maximum Participants
              </Label>
              <Input
                id="maxParticipants"
                type="number"
                {...register("maxParticipants", { valueAsNumber: true })}
                placeholder="Leave empty for unlimited"
                className="w-full"
              />
              <p className="text-sm text-gray-500 dark:text-gray-300">
                Leave empty for unlimited participants
              </p>
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements or Notes</Label>
              <Textarea
                id="requirements"
                {...register("requirements")}
                placeholder="Any special requirements, age restrictions, what to bring, etc."
                className="w-full"
              />
            </div>

            {/* PRIVATE EVENT VISIBILITY TAGS */}
            <Card className="border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-orange-800 dark:text-orange-200">
                  🔒 Private Event Settings
                </CardTitle>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Control who can see this event based on demographics. These settings create safe spaces for specific communities.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Gender Restrictions */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Gender Restriction</Label>
                  <Select onValueChange={(value) => setValue("genderRestriction", value || undefined)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select gender restriction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Women only</SelectItem>
                      <SelectItem value="male">Men only</SelectItem>
                      <SelectItem value="non-binary">Non-binary only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Toggle Options */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="lgbtqiaOnly" 
                      {...register("lgbtqiaOnly")}
                      data-testid="checkbox-lgbtqia-only"
                    />
                    <Label htmlFor="lgbtqiaOnly" className="text-sm">🏳️‍🌈 LGBTQIA+ only</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="veteransOnly" 
                      {...register("veteransOnly")}
                      data-testid="checkbox-veterans-only"
                    />
                    <Label htmlFor="veteransOnly" className="text-sm">🪖 Veterans only</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="singlePeopleOnly" 
                      {...register("singlePeopleOnly")}
                      data-testid="checkbox-single-people-only"
                    />
                    <Label htmlFor="singlePeopleOnly" className="text-sm">💝 Singles only</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="familiesOnly" 
                      {...register("familiesOnly")}
                      data-testid="checkbox-families-only"
                    />
                    <Label htmlFor="familiesOnly" className="text-sm">👨‍👩‍👧‍👦 Families only</Label>
                  </div>
                </div>

                {/* Age Restrictions */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ageRestrictionMin" className="text-sm">Minimum Age</Label>
                    <Input
                      id="ageRestrictionMin"
                      type="number"
                      {...register("ageRestrictionMin", { valueAsNumber: true })}
                      placeholder="18"
                      min="13"
                      max="99"
                      data-testid="input-age-min"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ageRestrictionMax" className="text-sm">Maximum Age</Label>
                    <Input
                      id="ageRestrictionMax"
                      type="number"
                      {...register("ageRestrictionMax", { valueAsNumber: true })}
                      placeholder="65"
                      min="13"
                      max="99"
                      data-testid="input-age-max"
                    />
                  </div>
                </div>

                {/* Private Organizer Notes */}
                <div className="space-y-2">
                  <Label htmlFor="privateNotes" className="text-sm">Private Organizer Notes</Label>
                  <Textarea
                    id="privateNotes"
                    {...register("privateNotes")}
                    placeholder="Internal notes about who you want to attend (only you can see this)"
                    className="w-full text-sm"
                    rows={2}
                    data-testid="textarea-private-notes"
                  />
                  <p className="text-xs text-gray-500">These notes are private and only visible to you as the organizer.</p>
                </div>
              </CardContent>
            </Card>

            {/* Tags section removed - keeping it simple! Event descriptions cover everything */}

            {/* Event Image Upload */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <ImageIcon className="w-5 h-5" />
                Event Photo (Optional)
              </Label>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Event preview"
                      className="max-w-full h-48 object-cover rounded-lg mx-auto"
                    />
                    <div className="flex gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setImagePreview(null);
                          setValue("imageUrl", "");
                        }}
                      >
                        Remove Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-gray-500 dark:text-gray-300">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Upload an event photo to attract more participants</p>
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            const result = e.target?.result as string;
                            setImagePreview(result);
                            setValue("imageUrl", result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                )}
              </div>
            </div>


            {/* Instagram Posting Option - Only show if user has handle */}
            {currentUser.instagramHandle && (
              <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-r from-pink-50 to-gray-50 dark:from-pink-900/20 dark:to-gray-900/20 dark:border-gray-600">
                <h4 className="font-medium text-sm text-gray-700 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram Sharing (Optional)
                </h4>
                
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="postToInstagram"
                    {...register("postToInstagram")}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-500 data-[state=checked]:to-gray-600 border-pink-400"
                  />
                  <div className="flex-1">
                    <Label htmlFor="postToInstagram" className="text-sm font-medium cursor-pointer">
                      Share this event on Instagram
                    </Label>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      Post to @{currentUser.instagramHandle} and @nearbytraveler's feed to reach more people
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || createEventMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-gray-600 hover:from-blue-600 hover:to-gray-700 active:scale-95 text-white font-semibold py-4 px-6 min-h-[52px] touch-manipulation text-lg"
                style={{ 
                  WebkitTapHighlightColor: 'rgba(59, 130, 246, 0.1)',
                  touchAction: 'manipulation',
                  userSelect: 'none'
                }}
                onClick={(e) => {
                  console.log('🎯 Create Event Button clicked!', {
                    isSubmitting,
                    isPending: createEventMutation.isPending,
                    disabled: isSubmitting || createEventMutation.isPending,
                    buttonType: e.currentTarget.type,
                    formElement: e.currentTarget.form
                  });
                  
                  // Mobile Safari sometimes needs explicit form submission
                  if (!isSubmitting && !createEventMutation.isPending) {
                    console.log('🎯 Button not disabled, allowing normal form submission');
                    
                    // Fallback: If React form isn't submitting, manually trigger it
                    setTimeout(() => {
                      const form = e.currentTarget.form;
                      if (form && !isSubmitting) {
                        console.log('🎯 Manual form submission fallback');
                        const formData = new FormData(form);
                        console.log('🎯 Manual form data:', Object.fromEntries(formData));
                        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                      }
                    }, 100);
                  }
                }}
                onTouchStart={(e) => {
                  console.log('🎯 Touch started on Create Event button');
                  e.currentTarget.style.transform = 'scale(0.98)';
                }}
                onTouchEnd={(e) => {
                  console.log('🎯 Touch ended on Create Event button');
                  e.currentTarget.style.transform = '';
                }}
              >
                {isSubmitting || createEventMutation.isPending ? (
                  "Creating Event..."
                ) : (
                  "Create Event"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}