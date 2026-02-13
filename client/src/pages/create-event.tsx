import React, { useState, useEffect } from "react";
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
import { CalendarIcon, MapPin, Users, Clock, Tag, Info, ArrowLeft, X, Image as ImageIcon, ChevronDown, ChevronUp } from "lucide-react";
import { UniversalBackButton } from "@/components/UniversalBackButton";
import Logo from "@/components/logo";
import { COUNTRIES, US_CITIES_BY_STATE } from "@shared/locationData";
import { Badge } from "@/components/ui/badge";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { authStorage } from "@/lib/auth";
import { AIQuickCreateEvent } from "@/components/AIQuickCreateEvent";
import { Sparkles } from "lucide-react";

// Categories removed - users can describe their event in the description field!

interface CreateEventProps {
  onEventCreated?: () => void;
  isModal?: boolean; // When true, hide the header since parent modal provides it
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
  additionalCities?: string[]; // Cross-metro visibility - show event in these cities too
  date: string;
  startTime: string;
  endDate?: string;
  endTime?: string;
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

export default function CreateEvent({ onEventCreated, isModal = false }: CreateEventProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [useBusinessAddress, setUseBusinessAddress] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState("");
  const [eventUrl, setEventUrl] = useState("");
  const [isImportingEvent, setIsImportingEvent] = useState(false);
  const [importedFromUrl, setImportedFromUrl] = useState(false);
  const [isOriginalOrganizer, setIsOriginalOrganizer] = useState<boolean | null>(null);
  const [importedPlatform, setImportedPlatform] = useState("");
  const [externalOrganizerName, setExternalOrganizerName] = useState("");
  const [showPrivateSettings, setShowPrivateSettings] = useState(false);
  const [additionalCities, setAdditionalCities] = useState<string[]>([]);
  const [showAdditionalCities, setShowAdditionalCities] = useState(false);
  const [showAiQuickCreate, setShowAiQuickCreate] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Auto-open AI Quick Create if ?ai=true in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ai') === 'true') {
      setShowAiQuickCreate(true);
    }
  }, []);

  // Get current user data (check both keys - auth may use 'user' or 'travelconnect_user')
  const currentUser = JSON.parse(localStorage.getItem('travelconnect_user') || localStorage.getItem('user') || '{}');
  
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

  // Default date to 2026 for easier event creation (will revert to current year in November)
  // This helps users create events without manually adjusting the year
  const getDefaultDate = () => {
    const now = new Date();
    // Default to 2026 - users are creating events for 2026, not 2025
    // TODO: Revert to standard behavior in November 2026
    return `2026-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
      date: getDefaultDate(), // Default to 2026 for easier event creation
    },
    mode: "onChange"
  });

  // Load template data on component mount OR set default location from user profile
  React.useEffect(() => {
    const template = loadEventTemplate();
    if (template) {
      // Apply template data to form - NOW INCLUDING ALL FIELDS
      if (template.title) setValue("title", template.title);
      if (template.description) setValue("description", template.description);
      if (template.venueName) setValue("venueName", template.venueName);
      if (template.street) setValue("street", template.street);
      if (template.city) setValue("city", template.city);
      if (template.state) setValue("state", template.state);
      if (template.country) setValue("country", template.country);
      if (template.category) setValue("category", template.category);
      if (template.tags) setValue("tags", template.tags);
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
        description: "Event duplicated! Update the title and date, then publish."
      });
    } else {
      // No template - set defaults based on travel status
      // CRITICAL: If user is traveling, use travel destination. Otherwise use hometown.
      const isCurrentlyTraveling = currentUser.destinationCity || currentUser.travelDestination;
      
      if (isCurrentlyTraveling) {
        // User is traveling - use their travel destination
        const destinationCity = currentUser.destinationCity || currentUser.travelDestination?.split(',')[0]?.trim();
        const destinationState = currentUser.destinationState || currentUser.travelDestination?.split(',')[1]?.trim();
        const destinationCountry = currentUser.destinationCountry || currentUser.travelDestination?.split(',')[2]?.trim() || 'United States';
        
        if (destinationCity) setValue("city", destinationCity);
        if (destinationState) {
          setValue("state", destinationState);
          setSelectedState(destinationState);
        }
        if (destinationCountry) {
          setValue("country", destinationCountry);
          setSelectedCountry(destinationCountry);
          if (destinationCountry === "United States") {
            setAvailableStates(Object.keys(US_CITIES_BY_STATE));
            if (destinationState && US_CITIES_BY_STATE[destinationState]) {
              setAvailableCities(US_CITIES_BY_STATE[destinationState]);
            }
          }
        }
      } else {
        // User is NOT traveling - use their hometown
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
    }
  }, []);


  // Business address handler
  const handleUseBusinessAddress = (checked: boolean) => {
    setUseBusinessAddress(checked);
    if (checked && currentUser.userType === 'business') {
      // Auto-fill with business address data AND venue name
      const businessName = currentUser.businessName || currentUser.name || "";
      setValue("venueName", businessName, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); // Auto-fill venue name with business name
      setValue("street", currentUser.streetAddress || "", { shouldDirty: true });
      setValue("city", currentUser.hometownCity || "", { shouldDirty: true });
      setValue("state", currentUser.hometownState || "", { shouldDirty: true });
      setValue("country", currentUser.hometownCountry || "", { shouldDirty: true });
      setValue("zipcode", currentUser.zipCode || "", { shouldDirty: true });
      setValue("location", `${currentUser.hometownCity}${currentUser.hometownState ? `, ${currentUser.hometownState}` : ""}, ${currentUser.hometownCountry}`, { shouldDirty: true });
      
      // Update component state
      setSelectedCountry(currentUser.hometownCountry || "");
      setSelectedState(currentUser.hometownState || "");
    } else if (!checked) {
      // Clear fields when unchecked (but keep venue name - user may want to keep it)
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

  const handleAiDraftReady = (draft: any) => {
    // Close AI Quick Create panel first
    setShowAiQuickCreate(false);
    
    // Populate all form fields
    if (draft.title) setValue("title", draft.title, { shouldValidate: true, shouldDirty: true });
    
    // Combine description with notes (special instructions like "ask the manager", "back room")
    let fullDescription = draft.description || "";
    if (draft.notes && draft.notes.trim()) {
      // Append notes to description so attendees can see the special instructions
      if (fullDescription) {
        fullDescription += "\n\n📋 Special Instructions: " + draft.notes;
      } else {
        fullDescription = "📋 Special Instructions: " + draft.notes;
      }
    }
    if (fullDescription) setValue("description", fullDescription, { shouldValidate: true, shouldDirty: true });
    if (draft.venueName) setValue("venueName", draft.venueName, { shouldValidate: true, shouldDirty: true });
    if (draft.street) setValue("street", draft.street, { shouldValidate: true, shouldDirty: true });
    if (draft.city) {
      setValue("city", draft.city, { shouldValidate: true, shouldDirty: true });
    }
    if (draft.state) {
      setValue("state", draft.state, { shouldValidate: true, shouldDirty: true });
      setSelectedState(draft.state);
    }
    if (draft.country) {
      setValue("country", draft.country, { shouldValidate: true, shouldDirty: true });
      setSelectedCountry(draft.country);
      if (draft.country === "United States") {
        setAvailableStates(Object.keys(US_CITIES_BY_STATE));
        if (draft.state && US_CITIES_BY_STATE[draft.state]) {
          setAvailableCities(US_CITIES_BY_STATE[draft.state]);
        }
      }
    }
    if (draft.zipcode) setValue("zipcode", draft.zipcode, { shouldValidate: true, shouldDirty: true });
    
    if (draft.startDateTime) {
      try {
        const startDate = new Date(draft.startDateTime);
        if (!isNaN(startDate.getTime())) {
          setValue("date", startDate.toISOString().split('T')[0], { shouldValidate: true, shouldDirty: true });
          setValue("startTime", startDate.toTimeString().slice(0, 5), { shouldValidate: true, shouldDirty: true });
        }
      } catch (e) {
        console.error('Error parsing start date:', e);
      }
    }
    
    if (draft.endDateTime) {
      try {
        const endDate = new Date(draft.endDateTime);
        if (!isNaN(endDate.getTime())) {
          setValue("endDate", endDate.toISOString().split('T')[0], { shouldValidate: true, shouldDirty: true });
          setValue("endTime", endDate.toTimeString().slice(0, 5), { shouldValidate: true, shouldDirty: true });
        }
      } catch (e) {
        console.error('Error parsing end date:', e);
      }
    }
    
    if (draft.maxParticipants) setValue("maxParticipants", draft.maxParticipants, { shouldValidate: true, shouldDirty: true });
    if (draft.restrictions) setValue("requirements", draft.restrictions.join(", "), { shouldValidate: true, shouldDirty: true });
    if (draft.tags && Array.isArray(draft.tags)) {
      setValue("tags", draft.tags as any, { shouldValidate: true, shouldDirty: true });
    }
    if (draft.isRecurring) {
      setIsRecurring(true);
      setValue("isRecurring", true, { shouldValidate: true, shouldDirty: true });
      if (draft.recurrenceType) {
        setRecurrenceType(draft.recurrenceType);
        setValue("recurrenceType", draft.recurrenceType, { shouldValidate: true, shouldDirty: true });
      }
    }
    
    // Build location string from components
    const locationParts = [];
    if (draft.street) locationParts.push(draft.street);
    if (draft.city) locationParts.push(draft.city);
    if (draft.state) locationParts.push(draft.state);
    if (locationParts.length > 0) {
      setValue("location", locationParts.join(", "), { shouldValidate: true, shouldDirty: true });
    }
    
    // Show toast and scroll to form after a brief delay to let React re-render
    setTimeout(() => {
      toast({
        title: "Form populated!",
        description: "Scroll down to review and edit your event details.",
      });
      
      // Scroll to the title field so user can see the populated form
      const titleInput = document.getElementById("title");
      if (titleInput) {
        titleInput.scrollIntoView({ behavior: "smooth", block: "center" });
        titleInput.focus();
      }
    }, 150);
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
      setImagePreview(null);
      setUseBusinessAddress(false);
      setSelectedCountry("");
      setSelectedState("");
      setIsRecurring(false);
      setRecurrenceType("");
      onEventCreated?.();
      
      // Redirect to events page after successful creation
      setTimeout(() => {
        setLocation('/events');
      }, 1500); // Small delay to show the success toast
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
    // Validate organizer confirmation if event was imported from URL
    if (importedFromUrl && isOriginalOrganizer === null) {
      toast({
        title: "Organizer Confirmation Required",
        description: "Please confirm whether you are the original organizer of this imported event",
        variant: "destructive"
      });
      return;
    }
    
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
        category: "General", // Default category - users can specify type in description
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
        // Event import attribution
        importedFromUrl: importedFromUrl,
        importedPlatform: importedFromUrl ? importedPlatform : null,
        isOriginalOrganizer: importedFromUrl ? (isOriginalOrganizer === true) : true,
        externalOrganizerName: (importedFromUrl && externalOrganizerName) ? externalOrganizerName : null,
        // Cross-metro visibility - show event in additional cities
        additionalCities: additionalCities.length > 0 ? additionalCities : null,
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
      {/* Header with Navigation - Hidden when in modal mode */}
      {!isModal && (
        <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
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
      )}

      <div className={isModal ? "" : "max-w-2xl mx-auto p-6"}>
        <Card className={isModal ? "border-0 shadow-none" : ""}>
          {!isModal && (
          <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Users className="w-6 h-6 text-blue-600" />
            Create New Event
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-300">
            Create an event for your city where locals and travelers can connect and join
          </p>
        </CardHeader>
          )}
        
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
            {/* AI Quick Create - Describe your event in natural language */}
            <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-orange-800 dark:text-orange-200">
                    <Sparkles className="w-5 h-5" />
                    AI Quick Create
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAiQuickCreate(!showAiQuickCreate)}
                    className="text-orange-600 hover:text-orange-800 dark:text-orange-400"
                  >
                    {showAiQuickCreate ? "Hide" : "Try it"}
                  </Button>
                </div>
                {!showAiQuickCreate && (
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Describe your event in plain English and let AI fill out the form for you!
                  </p>
                )}
              </CardHeader>
              {showAiQuickCreate && (
                <CardContent>
                  <AIQuickCreateEvent
                    onDraftReady={handleAiDraftReady}
                    defaultCity={currentUser.hometownCity || currentUser.destinationCity}
                  />
                </CardContent>
              )}
            </Card>

            {/* Import from URL - Couchsurfing, Meetup, etc. */}
            <Card className="border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-purple-800 dark:text-purple-200">
                  🚀 Quick Import from URL
                </CardTitle>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Paste a Couchsurfing or Meetup event URL to auto-fill the form in seconds!
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={eventUrl}
                    onChange={(e) => setEventUrl(e.target.value)}
                    placeholder="https://www.couchsurfing.com/events/... or https://www.meetup.com/..."
                    className="flex-1 bg-white dark:bg-gray-800"
                    data-testid="input-event-url"
                  />
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!eventUrl.trim()) {
                        toast({
                          title: "Missing URL",
                          description: "Please paste a Couchsurfing or Meetup event URL",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      // Check if it's a supported URL
                      if (!eventUrl.includes('meetup.com') && !eventUrl.includes('couchsurfing.com')) {
                        toast({
                          title: "Invalid URL",
                          description: "Please paste a Couchsurfing or Meetup event URL",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      setIsImportingEvent(true);
                      try {
                        const response = await apiRequest('POST', '/api/events/import-url', { url: eventUrl });
                        
                        if (!response.ok) {
                          // Parse error message from backend
                          const errorData = await response.json();
                          throw new Error(errorData.message || "Failed to import event");
                        }
                        const eventData = await response.json();
                        
                        console.log('📥 Imported event data:', eventData);
                        
                        // Auto-fill the form with scraped data - using shouldValidate/shouldDirty to force input updates
                        if (eventData.title) setValue("title", eventData.title, { shouldValidate: true, shouldDirty: true });
                        if (eventData.description) setValue("description", eventData.description, { shouldValidate: true, shouldDirty: true });
                        if (eventData.venueName) setValue("venueName", eventData.venueName, { shouldValidate: true, shouldDirty: true });
                        
                        // Handle location - street address comes separately now
                        if (eventData.street) {
                          setValue("street", eventData.street, { shouldValidate: true, shouldDirty: true });
                        } else if (eventData.location) {
                          // Fallback: parse from full location
                          const addressParts = eventData.location.split(',').map((p: string) => p.trim());
                          if (addressParts.length > 0) setValue("street", addressParts[0], { shouldValidate: true, shouldDirty: true });
                        }
                        
                        if (eventData.city) setValue("city", eventData.city, { shouldValidate: true, shouldDirty: true });
                        if (eventData.state) setValue("state", eventData.state, { shouldValidate: true, shouldDirty: true });
                        if (eventData.country) setValue("country", eventData.country, { shouldValidate: true, shouldDirty: true });
                        if (eventData.zipcode) setValue("zipcode", eventData.zipcode, { shouldValidate: true, shouldDirty: true });
                        
                        // Handle date - convert to YYYY-MM-DD format
                        if (eventData.date) {
                          try {
                            const parsedDate = new Date(eventData.date);
                            if (!isNaN(parsedDate.getTime())) {
                              const formattedDate = parsedDate.toISOString().split('T')[0];
                              setValue("date", formattedDate, { shouldValidate: true, shouldDirty: true });
                              console.log('📅 Set date:', formattedDate, 'from', eventData.date);
                              
                              // Handle end date for multi-day events
                              if (eventData.endDate) {
                                // Multi-day event - use provided end date
                                const parsedEndDate = new Date(eventData.endDate);
                                if (!isNaN(parsedEndDate.getTime())) {
                                  const formattedEndDate = parsedEndDate.toISOString().split('T')[0];
                                  setValue("isSameDay", false, { shouldValidate: true, shouldDirty: true });
                                  setValue("endDate", formattedEndDate, { shouldValidate: true, shouldDirty: true });
                                  console.log('📅 Set end date:', formattedEndDate, 'from', eventData.endDate, '(multi-day event)');
                                }
                              } else {
                                // Same-day event - use same date for both start and end
                                setValue("isSameDay", false, { shouldValidate: true, shouldDirty: true });
                                setValue("endDate", formattedDate, { shouldValidate: true, shouldDirty: true });
                                console.log('📅 Set end date:', formattedDate, '(same-day event)');
                              }
                            }
                          } catch (e) {
                            console.error('Date parse error:', e);
                          }
                        }
                        
                        // Handle start and end times - convert from 12-hour to 24-hour format
                        const convert12to24Hour = (time12h: string): string => {
                          const match = time12h.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                          if (!match) return time12h; // Return as-is if format doesn't match
                          
                          let [_, hours, minutes, period] = match;
                          let hour = parseInt(hours);
                          
                          if (period.toUpperCase() === 'PM' && hour !== 12) {
                            hour += 12;
                          } else if (period.toUpperCase() === 'AM' && hour === 12) {
                            hour = 0;
                          }
                          
                          return `${hour.toString().padStart(2, '0')}:${minutes}`;
                        };
                        
                        if (eventData.startTime) {
                          const time24h = convert12to24Hour(eventData.startTime);
                          setValue("startTime", time24h, { shouldValidate: true, shouldDirty: true });
                          console.log('⏰ Set start time:', time24h, 'from', eventData.startTime);
                        }
                        if (eventData.endTime) {
                          const time24h = convert12to24Hour(eventData.endTime);
                          setValue("endTime", time24h, { shouldValidate: true, shouldDirty: true });
                          console.log('⏰ Set end time:', time24h, 'from', eventData.endTime);
                        }
                        
                        // Handle image URL
                        if (eventData.imageUrl) {
                          setValue("imageUrl", eventData.imageUrl, { shouldValidate: true, shouldDirty: true });
                          setImagePreview(eventData.imageUrl);
                          console.log('🖼️ Set image:', eventData.imageUrl);
                        }
                        
                        // Update location state
                        if (eventData.country) setSelectedCountry(eventData.country);
                        if (eventData.state) setSelectedState(eventData.state);
                        
                        console.log('✅ Import complete - check form fields above');
                        
                        // Mark as imported and track platform AND organizer
                        const sourcePlatform = eventData.source || (eventUrl.includes('couchsurfing') ? 'Couchsurfing' : 'Meetup');
                        setImportedFromUrl(true);
                        setImportedPlatform(sourcePlatform);
                        setExternalOrganizerName(eventData.organizer || ''); // Store external organizer name (e.g., "Dan Cullen")
                        setIsOriginalOrganizer(null); // Reset to require user confirmation
                        
                        toast({
                          title: "✨ Event imported!",
                          description: `Successfully imported from ${sourcePlatform}. Please confirm if you are the original organizer.`,
                        });
                      } catch (error) {
                        toast({
                          title: "Import failed",
                          description: error instanceof Error ? error.message : "Could not import event",
                          variant: "destructive"
                        });
                      } finally {
                        setIsImportingEvent(false);
                      }
                    }}
                    disabled={isImportingEvent || !eventUrl.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    data-testid="button-import-event"
                  >
                    {isImportingEvent ? "Importing..." : "Import"}
                  </Button>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    💡 Tip: Works with Couchsurfing and Meetup events! Automatically imports title, organizer, location, date/time, and cover image.
                  </p>
                  <p className="text-xs text-purple-500/80 dark:text-purple-400/80 italic">
                    Note: Event descriptions are often hidden behind login walls and cannot be imported. You'll need to add the description manually.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Organizer Confirmation - Shows after importing from URL */}
            {importedFromUrl && (
              <Card className="border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-orange-800 dark:text-orange-200">
                    ⚠️ Organizer Confirmation Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    You imported this event from <strong>{importedPlatform}</strong>. Please confirm your role:
                  </p>
                  
                  <div className="space-y-3">
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isOriginalOrganizer === true 
                          ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
                      }`}
                      onClick={() => setIsOriginalOrganizer(true)}
                      data-testid="option-original-organizer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                          isOriginalOrganizer === true 
                            ? 'border-green-500 bg-green-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isOriginalOrganizer === true && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            ✅ I am the original organizer
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            I created this event on {importedPlatform} and I'm the official organizer
                          </p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isOriginalOrganizer === false 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                      onClick={() => setIsOriginalOrganizer(false)}
                      data-testid="option-sharing-event"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                          isOriginalOrganizer === false 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isOriginalOrganizer === false && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            📢 I'm sharing someone else's event
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            I found this event and want to share it with the Nearby Traveler community
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isOriginalOrganizer === null && (
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                      ⚠️ Please select an option above before creating the event
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

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
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium dark:text-white">Event Location *</Label>
                  {currentUser?.hometownCity && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2 text-orange-600 border-orange-300 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-700 dark:hover:bg-orange-900/20"
                      onClick={() => {
                        setValue("city", currentUser.hometownCity || "");
                        setValue("state", currentUser.hometownState || "");
                        setValue("country", currentUser.hometownCountry || "United States");
                        setValue("location", `${currentUser.hometownCity}${currentUser.hometownState ? `, ${currentUser.hometownState}` : ""}`);
                        setSelectedCountry(currentUser.hometownCountry || "United States");
                        setSelectedState(currentUser.hometownState || "");
                        if (currentUser.hometownCountry === "United States") {
                          setAvailableStates(Object.keys(US_CITIES_BY_STATE));
                          if (currentUser.hometownState && US_CITIES_BY_STATE[currentUser.hometownState]) {
                            setAvailableCities(US_CITIES_BY_STATE[currentUser.hometownState]);
                          }
                        }
                        toast({
                          title: "Location set!",
                          description: `Using your hometown: ${currentUser.hometownCity}`,
                        });
                      }}
                    >
                      🏠 Use my hometown
                    </Button>
                  )}
                </div>
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

              {/* Additional Cities for Cross-Metro Visibility */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <button
                  type="button"
                  onClick={() => setShowAdditionalCities(!showAdditionalCities)}
                  className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  <svg className={`w-4 h-4 transition-transform ${showAdditionalCities ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  📍 Show event in additional cities (expand reach)
                </button>
                
                {showAdditionalCities && (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Your event in Westminster can also appear when people search for nearby cities like Los Angeles. Add cities where you want more visibility.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {additionalCities.map((city, index) => (
                        <span key={index} className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                          {city}
                          <button
                            type="button"
                            onClick={() => setAdditionalCities(additionalCities.filter((_, i) => i !== index))}
                            className="hover:text-red-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type a city name (e.g., Los Angeles)"
                        className="flex-1 px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.currentTarget;
                            const cityName = input.value.trim();
                            if (cityName && !additionalCities.includes(cityName)) {
                              setAdditionalCities([...additionalCities, cityName]);
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          const cityName = input.value.trim();
                          if (cityName && !additionalCities.includes(cityName)) {
                            setAdditionalCities([...additionalCities, cityName]);
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Quick add:</span>
                      {['Los Angeles', 'Orange County', 'San Diego', 'Long Beach', 'Irvine'].map(city => (
                        !additionalCities.includes(city) && (
                          <button
                            key={city}
                            type="button"
                            onClick={() => setAdditionalCities([...additionalCities, city])}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-800 rounded text-gray-700 dark:text-gray-300"
                          >
                            + {city}
                          </button>
                        )
                      ))}
                    </div>
                  </div>
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
                    <div className="flex gap-1 items-center">
                      <select
                        className="flex-1 h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        value={watch("startTime") ? (parseInt(watch("startTime").split(':')[0]) > 12 ? (parseInt(watch("startTime").split(':')[0]) - 12).toString() : (parseInt(watch("startTime").split(':')[0]) === 0 ? '12' : parseInt(watch("startTime").split(':')[0]).toString())) : ''}
                        onChange={(e) => {
                          const hour = parseInt(e.target.value);
                          const currentTime = watch("startTime") || '09:00';
                          const currentMinute = currentTime.split(':')[1] || '00';
                          const currentHour = parseInt(currentTime.split(':')[0]) || 0;
                          const isPM = currentHour >= 12;
                          let newHour = hour;
                          if (isPM && hour !== 12) newHour = hour + 12;
                          if (!isPM && hour === 12) newHour = 0;
                          setValue("startTime", `${newHour.toString().padStart(2, '0')}:${currentMinute}`);
                        }}
                      >
                        <option value="">Hr</option>
                        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <span className="text-lg font-bold dark:text-white">:</span>
                      <select
                        className="flex-1 h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        value={watch("startTime") ? watch("startTime").split(':')[1] : ''}
                        onChange={(e) => {
                          const currentTime = watch("startTime") || '09:00';
                          const currentHour = currentTime.split(':')[0] || '09';
                          setValue("startTime", `${currentHour}:${e.target.value}`);
                        }}
                      >
                        <option value="">Min</option>
                        {['00', '15', '30', '45'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <div className="flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden">
                        <button
                          type="button"
                          className={`px-2 py-2 text-sm font-medium transition-colors ${
                            !watch("startTime") || parseInt(watch("startTime").split(':')[0]) < 12
                              ? 'bg-orange-500 text-white'
                              : 'bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => {
                            const currentTime = watch("startTime");
                            if (!currentTime) {
                              setValue("startTime", '09:00');
                            } else {
                              const hour = parseInt(currentTime.split(':')[0]);
                              const minute = currentTime.split(':')[1];
                              if (hour >= 12) {
                                const newHour = hour === 12 ? 0 : hour - 12;
                                setValue("startTime", `${newHour.toString().padStart(2, '0')}:${minute}`);
                              }
                            }
                          }}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          className={`px-2 py-2 text-sm font-medium transition-colors ${
                            watch("startTime") && parseInt(watch("startTime").split(':')[0]) >= 12
                              ? 'bg-orange-500 text-white'
                              : 'bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => {
                            const currentTime = watch("startTime");
                            if (!currentTime) {
                              setValue("startTime", '12:00');
                            } else {
                              const hour = parseInt(currentTime.split(':')[0]);
                              const minute = currentTime.split(':')[1];
                              if (hour < 12) {
                                const newHour = hour === 0 ? 12 : hour + 12;
                                setValue("startTime", `${newHour.toString().padStart(2, '0')}:${minute}`);
                              }
                            }
                          }}
                        >
                          PM
                        </button>
                      </div>
                    </div>
                    <input type="hidden" {...register("startTime", { required: "Start time is required" })} />
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
              <div className="flex items-center gap-3 py-3 px-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
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
                  className="h-5 w-5 border-2 border-blue-500 dark:border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor="isSameDay" className="text-sm font-medium text-gray-800 dark:text-white cursor-pointer">
                  Same day event (most events start and end on the same day)
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
                    <div className="flex gap-1 items-center">
                      <select
                        className="flex-1 h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        value={(() => {
                          const t = watch("endTime");
                          if (!t) return '';
                          const h = parseInt(t.split(':')[0]);
                          return h > 12 ? (h - 12).toString() : (h === 0 ? '12' : h.toString());
                        })()}
                        onChange={(e) => {
                          const hour = parseInt(e.target.value);
                          const currentTime = watch("endTime") || '17:00';
                          const currentMinute = currentTime.split(':')[1] || '00';
                          const currentHour = parseInt(currentTime.split(':')[0]) || 12;
                          const isPM = currentHour >= 12;
                          let newHour = hour;
                          if (isPM && hour !== 12) newHour = hour + 12;
                          if (!isPM && hour === 12) newHour = 0;
                          setValue("endTime", `${newHour.toString().padStart(2, '0')}:${currentMinute}`);
                        }}
                      >
                        <option value="">Hr</option>
                        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <span className="text-lg font-bold dark:text-white">:</span>
                      <select
                        className="flex-1 h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        value={watch("endTime")?.split(':')[1] || ''}
                        onChange={(e) => {
                          const currentTime = watch("endTime") || '17:00';
                          const currentHour = currentTime.split(':')[0] || '17';
                          setValue("endTime", `${currentHour}:${e.target.value}`);
                        }}
                      >
                        <option value="">Min</option>
                        {['00', '15', '30', '45'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <div className="flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden">
                        <button
                          type="button"
                          className={`px-2 py-2 text-sm font-medium transition-colors ${
                            !watch("endTime") || parseInt(watch("endTime")?.split(':')[0] || '0') < 12
                              ? 'bg-orange-500 text-white'
                              : 'bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => {
                            const currentTime = watch("endTime");
                            if (!currentTime) {
                              setValue("endTime", '09:00');
                            } else {
                              const hour = parseInt(currentTime.split(':')[0]);
                              const minute = currentTime.split(':')[1];
                              if (hour >= 12) {
                                const newHour = hour === 12 ? 0 : hour - 12;
                                setValue("endTime", `${newHour.toString().padStart(2, '0')}:${minute}`);
                              }
                            }
                          }}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          className={`px-2 py-2 text-sm font-medium transition-colors ${
                            watch("endTime") && parseInt(watch("endTime")?.split(':')[0] || '0') >= 12
                              ? 'bg-orange-500 text-white'
                              : 'bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => {
                            const currentTime = watch("endTime");
                            if (!currentTime) {
                              setValue("endTime", '12:00');
                            } else {
                              const hour = parseInt(currentTime.split(':')[0]);
                              const minute = currentTime.split(':')[1];
                              if (hour < 12) {
                                const newHour = hour === 0 ? 12 : hour + 12;
                                setValue("endTime", `${newHour.toString().padStart(2, '0')}:${minute}`);
                              }
                            }
                          }}
                        >
                          PM
                        </button>
                      </div>
                    </div>
                    <input type="hidden" {...register("endTime", { required: "End time is required" })} />
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
                <div className="flex items-center gap-3 py-2 px-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
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
                    className="h-5 w-5 border-2 border-purple-500 dark:border-purple-400 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                  <Label htmlFor="isRecurring" className="text-sm font-medium text-gray-800 dark:text-white cursor-pointer">
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
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                          position="popper"
                          sideOffset={8}
                          style={{ zIndex: 999999 }}
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

            {/* Category field removed - users describe event type in description */}

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

            {/* PRIVATE EVENT VISIBILITY TAGS - Collapsible */}
            <Card className="border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
              <CardHeader 
                className="pb-3 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors rounded-t-lg"
                onClick={() => setShowPrivateSettings(!showPrivateSettings)}
              >
                <CardTitle className="text-lg flex items-center justify-between text-orange-800 dark:text-orange-200">
                  <span className="flex items-center gap-2">
                    🔒 Private Event Settings
                    <span className="text-xs font-normal text-orange-600 dark:text-orange-400">(Optional)</span>
                  </span>
                  {showPrivateSettings ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </CardTitle>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Control who can see this event based on demographics. Click to expand.
                </p>
              </CardHeader>
              {showPrivateSettings && (
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
              )}
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
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Event preview"
                        className="max-w-full h-48 object-cover rounded-lg mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setValue("imageUrl", "");
                        }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                        aria-label="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
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

            {/* Submit Button - use onClick so submission always runs (fixes WebView/touch where type="submit" can be ignored) */}
            <div className="pt-4">
              <Button
                type="button"
                disabled={isSubmitting || createEventMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-gray-600 hover:from-blue-600 hover:to-gray-700 active:scale-95 font-semibold py-4 px-6 min-h-[52px] touch-manipulation text-lg"
                style={{
                  color: 'black',
                  WebkitTapHighlightColor: 'rgba(59, 130, 246, 0.1)',
                  touchAction: 'manipulation',
                  userSelect: 'none'
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isSubmitting || createEventMutation.isPending) return;
                  handleSubmit(onSubmit, (validationErrors) => {
                    toast({
                      title: "Please fix the form",
                      description: "Fill in all required fields (title, address, date, start time).",
                      variant: "destructive"
                    });
                  })(e);
                }}
              >
                <span style={{ color: 'black' }}>
                  {isSubmitting || createEventMutation.isPending ? "Creating Event..." : "Create Event"}
                </span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}