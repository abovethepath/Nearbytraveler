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

// Predefined categories for events
const EVENT_CATEGORIES = [
  "Food & Dining",
  "Adventure Sports",
  "Social Networking",
  "Culture & Arts",
  "Music & Entertainment",
  "Business & Professional",
  "Educational & Learning",
  "Health & Wellness",
  "Outdoor Activities",
  "Nightlife & Parties",
  "LGBTQIA+ Events",
  "Parties",
  "LGBTQIA+ Event",
  "Travel & Tourism",
  "Technology",
  "Volunteering",
  "Sports & Fitness",
  "Family & Kids",
  "Custom" // This will allow for custom category input
];

// Predefined tags for events - Streamlined for travelers
const PREDEFINED_TAGS = [
  "Family Friendly",
  "Pet Friendly", 
  "Beginner Friendly",
  "Advanced Level",
  "Free Event",
  "Indoor",
  "Outdoor",
  "Photography",
  "Networking",
  "Cultural",
  "Sports",
  "Food & Drink",
  "Music",
  "Art",
  "Tech",
  "Casual Meetup",
  "Creative",
  "Fitness",
  "Wellness",
  "Adventure",
  "Social",
  "Party",
  "Gaming",
  "Language Exchange",
  "Solo Travelers",
  "Celebration"
];

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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [useBusinessAddress, setUseBusinessAddress] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState("");
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

  // Load template data on component mount
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
      if (template.tags) setSelectedTags(template.tags);
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
    }
  }, []);

  // Tag management functions with limit
  const MAX_TAGS = 6;
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else if (prev.length < MAX_TAGS) {
        return [...prev, tag];
      }
      return prev; // Don't add if at limit
    });
  };

  const addCustomTag = () => {
    const trimmedTag = customTag.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag) && selectedTags.length < MAX_TAGS) {
      setSelectedTags(prev => [...prev, trimmedTag]);
      setCustomTag("");
    } else if (selectedTags.length >= MAX_TAGS) {
      toast({
        title: "Tag limit reached",
        description: `You can only add up to ${MAX_TAGS} tags per event.`,
        variant: "destructive"
      });
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

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
      setSelectedTags([]);
      setCustomTag("");
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
        tags: selectedTags,
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
                {(errors.city || errors.country) && (
                  <p className="text-sm text-red-500">
                    {errors.city?.message || errors.country?.message}
                  </p>
                )}
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
                        <SelectTrigger className="w-full bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600">
                          <SelectValue placeholder="Choose repeat frequency" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
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
                      <SelectValue placeholder="Open to all genders" />
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

            {/* Tags */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Event Tags ({selectedTags.length}/{MAX_TAGS})
              </Label>
              <div className="space-y-3">
                {/* Predefined Tags */}
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-white">Quick Tags</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                    {PREDEFINED_TAGS.map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant={selectedTags.includes(tag) ? "secondary" : "outline"}
                        size="sm"
                        className={`justify-start text-xs h-auto py-2 px-3 text-left whitespace-normal leading-tight ${
                          selectedTags.includes(tag) 
                            ? "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white border-gray-300 dark:border-gray-500" 
                            : "hover:bg-gray-50 dark:hover:bg-gray-700"
                        } ${
                          !selectedTags.includes(tag) && selectedTags.length >= MAX_TAGS 
                            ? "opacity-50 cursor-not-allowed" 
                            : ""
                        }`}
                        onClick={() => {
                          if (selectedTags.includes(tag) || selectedTags.length < MAX_TAGS) {
                            toggleTag(tag);
                          } else {
                            toast({
                              title: "Tag limit reached",
                              description: `You can only add up to ${MAX_TAGS} tags per event.`,
                              variant: "destructive"
                            });
                          }
                        }}
                        disabled={!selectedTags.includes(tag) && selectedTags.length >= MAX_TAGS}
                      >
                        {selectedTags.includes(tag) ? "✓ " : ""}{tag}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Custom Tag Input */}
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-white">Add Custom Tag</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      placeholder="Enter custom tag..."
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomTag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCustomTag}
                      disabled={!customTag.trim() || selectedTags.length >= MAX_TAGS}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {/* Selected Tags Display */}
                {selectedTags.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-white">Selected Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="flex items-center gap-1 cursor-pointer hover:bg-red-100"
                          onClick={() => removeTag(tag)}
                        >
                          {tag}
                          <X className="w-3 h-3" />
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                      Click on a tag to remove it • {selectedTags.length}/{MAX_TAGS} tags used
                      {selectedTags.length >= MAX_TAGS && " (limit reached)"}
                    </p>
                  </div>
                )}
              </div>
            </div>

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

            {/* Private Event Visibility Options */}
            <div className="border-2 border-red-200 rounded-lg p-6 space-y-4 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-800 dark:text-red-300">
                    ⚠️ RESTRICT EVENT VISIBILITY
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                    WARNING: These options will HIDE your event from users who don't meet the criteria
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Gender Restrictions */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-red-800 dark:text-red-300 text-sm">GENDER RESTRICTIONS</h4>
                    
                    <div className="flex items-center space-x-3 p-2 bg-pink-50 dark:bg-pink-900/20 rounded border border-pink-200 dark:border-pink-800">
                      <Checkbox
                        id="womenOnly"
                        {...register("womenOnly")}
                        className="border-pink-500"
                      />
                      <div>
                        <Label htmlFor="womenOnly" className="text-sm font-bold text-pink-800 dark:text-pink-300 cursor-pointer">
                          🚺 WOMEN ONLY EVENT
                        </Label>
                        <p className="text-xs text-pink-700 dark:text-pink-400 mt-1">
                          Only women can see and join this event
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <Checkbox
                        id="menOnly"
                        {...register("menOnly")}
                        className="border-blue-500"
                      />
                      <div>
                        <Label htmlFor="menOnly" className="text-sm font-bold text-blue-800 dark:text-blue-300 cursor-pointer">
                          🚹 MEN ONLY EVENT
                        </Label>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                          Only men can see and join this event
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Community Restrictions */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-red-800 dark:text-red-300 text-sm">COMMUNITY RESTRICTIONS</h4>
                    
                    <div className="flex items-center space-x-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                      <Checkbox
                        id="lgbtqiaOnly"
                        {...register("lgbtqiaOnly")}
                        className="border-purple-500"
                      />
                      <div>
                        <Label htmlFor="lgbtqiaOnly" className="text-sm font-bold text-purple-800 dark:text-purple-300 cursor-pointer">
                          🏳️‍🌈 LGBTQIA+ ONLY EVENT
                        </Label>
                        <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                          Only LGBTQIA+ community members can see and join
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                      <Checkbox
                        id="veteransOnly"
                        {...register("veteransOnly")}
                        className="border-green-500"
                      />
                      <div>
                        <Label htmlFor="veteransOnly" className="text-sm font-bold text-green-800 dark:text-green-300 cursor-pointer">
                          🎖️ VETERANS ONLY EVENT
                        </Label>
                        <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                          Only military veterans can see and join this event
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                      <Checkbox
                        id="singlePeopleOnly"
                        {...register("singlePeopleOnly")}
                        className="border-yellow-500"
                      />
                      <div>
                        <Label htmlFor="singlePeopleOnly" className="text-sm font-bold text-yellow-800 dark:text-yellow-300 cursor-pointer">
                          💔 SINGLES ONLY EVENT
                        </Label>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                          Only single people looking to meet others can see this
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Age Restrictions */}
                <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-red-800 dark:text-red-300 text-sm mb-3">AGE RESTRICTIONS</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ageRestrictionMin" className="text-sm font-medium text-red-700 dark:text-red-400">
                        Minimum Age (21+ events, 18+ events, etc.)
                      </Label>
                      <Input
                        type="number"
                        id="ageRestrictionMin"
                        {...register("ageRestrictionMin")}
                        placeholder="e.g. 21"
                        min="13"
                        max="100"
                        className="mt-1 border-red-300 dark:border-red-700"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ageRestrictionMax" className="text-sm font-medium text-red-700 dark:text-red-400">
                        Maximum Age (under 30, under 40, etc.)
                      </Label>
                      <Input
                        type="number"
                        id="ageRestrictionMax"
                        {...register("ageRestrictionMax")}
                        placeholder="e.g. 30"
                        min="13"
                        max="100"
                        className="mt-1 border-red-300 dark:border-red-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Restriction Field */}
                <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-red-800 dark:text-red-300 text-sm mb-3">CUSTOM RESTRICTION</h4>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                    <Label htmlFor="customRestriction" className="text-sm font-bold text-orange-800 dark:text-orange-300">
                      🏷️ CREATE CUSTOM "XX ONLY" TAG
                    </Label>
                    <p className="text-xs text-orange-700 dark:text-orange-400 mt-1 mb-2">
                      Use consistent "XX only" format for clear restrictions: "Taylor Swift fans only", "Dog lovers only", "Photographers only"
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        id="customRestriction"
                        {...register("customRestriction")}
                        placeholder="Taylor Swift fans, Dog lovers, Photographers..."
                        className="flex-1 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-900"
                        onChange={(e) => {
                          // Update the form value
                          setValue("customRestriction", e.target.value);
                        }}
                      />
                      <span className="text-orange-800 dark:text-orange-300 font-semibold text-sm">only</span>
                    </div>
                    
                    {/* Live Preview */}
                    {watch("customRestriction") && watch("customRestriction").trim() && (
                      <div className="mt-2 p-2 bg-orange-100 dark:bg-orange-900/40 rounded border border-orange-300 dark:border-orange-700">
                        <p className="text-xs text-orange-700 dark:text-orange-400 font-medium">Preview restriction tag:</p>
                        <div className="mt-1">
                          <span className="inline-block px-2 py-1 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 text-xs font-semibold rounded">
                            🏷️ {watch("customRestriction").trim()} only
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      The word "only" will be automatically added. This creates consistent, clear restrictions that users can easily understand.
                    </p>
                  </div>
                </div>

                {/* Warning */}
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded">
                  <p className="text-sm font-bold text-red-800 dark:text-red-300">
                    ⚠️ IMPORTANT: If you select ANY of these options or add a custom restriction, your event will be HIDDEN from users who don't meet the criteria. 
                    Only use these for events that truly need to be restricted to specific communities.
                  </p>
                </div>
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