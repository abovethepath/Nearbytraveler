// Events page - v2.2 - Complete location fix
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, Users, Search, Filter, Plus, Info, X, Heart, UserCheck, CheckCircle, Star, Sparkles, ChevronDown, MessageCircle, History } from "lucide-react";
import { useIsMobile, useIsDesktop } from "@/hooks/useDeviceType";

import { type Event, type EventParticipant, type User as UserType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getApiBaseUrl } from "@/lib/queryClient";
import BackButton from "@/components/back-button";
import CreateEvent from "@/pages/create-event";

import { ParticipantAvatars } from "@/components/ParticipantAvatars";
import { formatDateForDisplay } from "@/lib/dateUtils";
import { PublicationSchedule } from "@/components/PublicationSchedule";
import { InterestButton } from "@/components/InterestButton";
const eventsBgImage = "/event%20page%20bbq%20party_1753299541268.png";
// MobileNav removed - using global mobile navigation

// Helper function to format event location properly
function formatEventLocation(event: Event | any): string {
  const parts = [];
  
  if (event.venueName) parts.push(event.venueName);
  if (event.city) parts.push(event.city);
  // Only add state if it's different from city (avoids "Berlin, Berlin")
  if (event.state && event.state !== event.city) parts.push(event.state);
  if (event.country) parts.push(event.country);
  
  return parts.join(', ') || event.location || 'Location TBD';
}

export default function Events() {
  const [selectedLocation, setSelectedLocation] = useState<string>("hometown");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [customCity, setCustomCity] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [selectedTab, setSelectedTab] = useState('explore');
  const [userEventInterests, setUserEventInterests] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();

  // Hero section visibility state
  const [isHeroVisible, setIsHeroVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('hideEventsHeroSection');
    return saved !== 'true'; // Default to visible
  });

  const toggleHeroVisibility = () => {
    const newValue = !isHeroVisible;
    setIsHeroVisible(newValue);
    localStorage.setItem('hideEventsHeroSection', String(!newValue));
  };

  // Add/remove body class for modal
  React.useEffect(() => {
    if (showCreateEvent) {
      document.body.classList.add('create-event-modal-open');
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.classList.remove('create-event-modal-open');
        document.body.style.overflow = 'auto';
      };
    }
    return () => {}; // Always return a function
  }, [showCreateEvent]);

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('travelconnect_user') || '{}');

  // Get user data from API
  const { data: apiUser } = useQuery({
    queryKey: [`/api/users/${currentUser?.id || 1}`],
    staleTime: 30000, // Cache for 30 seconds to prevent constant refetching
    gcTime: 60000, // Keep in cache for 1 minute
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: !!currentUser?.id,
  });

  // Use API user data if available, fallback to localStorage
  const user = apiUser || currentUser;



  // Fetch user's travel plans to show multiple destinations
  const { data: userTravelPlans = [] } = useQuery({
    queryKey: ["/api/travel-plans", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`${getApiBaseUrl()}/api/travel-plans/${user.id}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Import travel destination detection logic
  const getCurrentTravelDestination = () => {
    if (!userTravelPlans || userTravelPlans.length === 0) return null;

    const now = new Date();
    const activePlan = userTravelPlans.find((plan: any) => {
      const startDate = new Date(plan.startDate);
      const endDate = new Date(plan.endDate);
      return startDate <= now && endDate >= now;
    });

    return activePlan?.destination || null;
  };

  // Determine which city to query based on selected location
  const getCityToQuery = () => {
    if (selectedLocation === "custom") return customCity;
    if (selectedLocation === "hometown") return user?.hometownCity || "Boston";
    if (selectedLocation.startsWith("destination-")) {
      const planId = selectedLocation.replace("destination-", "");
      const plan = userTravelPlans.find((p: any) => p.id.toString() === planId);
      return plan?.destination || plan?.destinationCity || "London";
    }

    // For "current" location: check if user is currently traveling
    const currentDestination = getCurrentTravelDestination();
    if (currentDestination) {
      console.log(`Events page: User is currently traveling to ${currentDestination}`);
      // Parse destination format like "Denver, Colorado, United States" to get city
      return currentDestination.split(',')[0].trim();
    }

    // Fallback to hometown if not traveling
    console.log(`Events page: User not traveling, using hometown ${user?.hometownCity}`);
    return user?.hometownCity || "Boston";
  };

  console.log(`Events page: selectedLocation = ${selectedLocation}, userTravelPlans =`, userTravelPlans);

  const cityToQuery = getCityToQuery();

  // Fetch events based on selected city with optimized loading
  const { data: events = [], isLoading, error } = useQuery<Event[]>({
    queryKey: ["/api/events", cityToQuery],
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/events?city=${encodeURIComponent(cityToQuery)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      // Backend handles metro area aggregation - return all events from API
      return data;
    },
    enabled: !(selectedLocation === "custom" && showCustomInput), // Don't auto-fetch while typing
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch all events to identify user's events - ALWAYS load when user is logged in
  const { data: allEvents = [], isLoading: allEventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", "all"],
    queryFn: async () => {
      console.log('🔍 Fetching ALL events for user events detection...');
      const response = await fetch(`${getApiBaseUrl()}/api/events`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      console.log('🔍 ALL EVENTS RESPONSE:', data.length, 'events');
      console.log('🔍 Events with organizerId 22 (brunchbig):', data.filter((e: any) => e.organizerId === 22));
      console.log('🔍 All Santa Monica events:', data.filter((e: any) => e.city?.toLowerCase().includes('santa monica')));
      return data;
    },
    enabled: !!currentUser, // Always fetch when user is logged in to show user events
    staleTime: 30000,
  });

  // Optimized participants fetch - only fetch for visible events and cache results
  const { data: participants = [] } = useQuery<EventParticipant[]>({
    queryKey: ["/api/events/participants", cityToQuery],
    queryFn: async () => {
      // Only fetch participants for the first 6 visible events to speed up initial load
      const visibleEvents = events.slice(0, 6);
      const allParticipants: EventParticipant[] = [];

      // Use Promise.all for parallel requests instead of sequential loop
      const participantPromises = visibleEvents.map(async (event) => {
        try {
          const response = await fetch(`${getApiBaseUrl()}/api/events/${event.id}/participants`);
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.error(`Failed to fetch participants for event ${event.id}:`, error);
        }
        return [];
      });

      const results = await Promise.all(participantPromises);
      results.forEach(eventParticipants => {
        if (eventParticipants) {
          allParticipants.push(...eventParticipants);
        }
      });

      return allParticipants;
    },
    enabled: events.length > 0,
    staleTime: 60000, // Cache participants for 1 minute
  });

  // Fetch users only when needed and cache aggressively
  const { data: allUsers = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    enabled: true, // Enable to fix "Oops Error" when accessing Events page
    staleTime: 300000, // Cache for 5 minutes
  });

  // Fetch external events (Meetup and Eventbrite)
  const { data: meetupEvents = [], isLoading: meetupLoading } = useQuery({
    queryKey: ["/api/external-events/meetup", cityToQuery],
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/external-events/meetup?city=${encodeURIComponent(cityToQuery)}`);
      if (!response.ok) return { events: [] };
      return response.json();
    },
    enabled: selectedTab === 'meetup' && !!cityToQuery,
    staleTime: 300000, // Cache for 5 minutes
  });





  // Removed premium event integrations (AllEvents, Ticketmaster, StubHub, Local RSS) - keeping only Community Events + Meetups

  // Join event mutation
  const joinEventMutation = useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: number; userId: number }) => {
      return await apiRequest("POST", `/api/events/${eventId}/join`, { userId });
    },
    onSuccess: async (_, { eventId }) => {
      toast({
        title: "Joined Event",
        description: "You've successfully joined the event!",
      });

      // Invalidate events cache to refresh participant counts
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/participants`] });
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to join event";
      const isPrivacyError = errorMessage.includes("privacy settings");

      toast({
        title: isPrivacyError ? "Privacy Restriction" : "Failed to Join Event",
        description: isPrivacyError 
          ? "The event organizer's privacy settings prevent you from joining this event. Try connecting with them first."
          : errorMessage,
        variant: "destructive",
      });
    },
  });

  // Leave event mutation
  const leaveEventMutation = useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: number; userId: number }) => {
      return await apiRequest("DELETE", `/api/events/${eventId}/leave`, { userId });
    },
    onSuccess: async (_, { eventId }) => {
      toast({
        title: "Left Event",
        description: "You've left the event.",
      });

      // Invalidate events cache to refresh participant counts
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/participants`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Leave Event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Separate events into upcoming and past
  const now = new Date();
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const endDate = event.endDate ? new Date(event.endDate) : eventDate;
    return endDate >= now;
  });

  const pastEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const endDate = event.endDate ? new Date(event.endDate) : eventDate;
    return endDate < now;
  });

  // Get the effective category filter
  const getEffectiveCategoryFilter = () => {
    if (categoryFilter === "custom") return customCategory;
    return categoryFilter;
  };

  const effectiveCategoryFilter = getEffectiveCategoryFilter();

  const filteredUpcomingEvents = upcomingEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         formatEventLocation(event).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = effectiveCategoryFilter === "all" || 
                           !effectiveCategoryFilter ||
                           event.category.toLowerCase().includes(effectiveCategoryFilter.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const filteredPastEvents = pastEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         formatEventLocation(event).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = effectiveCategoryFilter === "all" || 
                           !effectiveCategoryFilter ||
                           event.category.toLowerCase().includes(effectiveCategoryFilter.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  // Enhanced categories with emojis for visual appeal
  const categoryData = [
    { name: "Food & Dining", emoji: "🍕", color: "bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700" },
    { name: "Music & Entertainment", emoji: "🎵", color: "bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700" },
    { name: "Sports & Fitness", emoji: "⚽", color: "bg-green-100 hover:bg-green-200 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700" },
    { name: "Nightlife & Parties", emoji: "🌃", color: "bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700" },
    { name: "Social & Networking", emoji: "👥", color: "bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700" },
    { name: "Arts & Culture", emoji: "🎨", color: "bg-pink-100 hover:bg-pink-200 text-pink-700 border-pink-300 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700" },
    { name: "Family Activities", emoji: "👨‍👩‍👧", color: "bg-teal-100 hover:bg-teal-200 text-teal-700 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700" },
    { name: "Health & Wellness", emoji: "🧘", color: "bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700" },
    { name: "Education & Learning", emoji: "📚", color: "bg-amber-100 hover:bg-amber-200 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700" },
    { name: "Business & Professional", emoji: "💼", color: "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-700" },
  ];
  const categories = categoryData.map(c => c.name);

  const handleJoinEvent = (event: Event) => {
    if (!currentUser) return;

    const isUserJoined = participants.some(p => p.userId === currentUser.id && p.eventId === event.id);

    if (isUserJoined) {
      leaveEventMutation.mutate({ eventId: event.id, userId: currentUser.id });
    } else {
      joinEventMutation.mutate({ eventId: event.id, userId: currentUser.id });
    }
  };

  const getParticipantUser = (userId: number) => {
    return allUsers.find(user => user.id === userId);
  };

  const isUserJoined = (eventId: number) => {
    if (!currentUser) return false;
    return participants.some(p => p.userId === currentUser.id && p.eventId === eventId);
  };

  // Handle loading and error states in render without early returns to fix hooks ordering

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <BackButton fallbackRoute="/events-landing" />
              <h1 className="text-3xl font-bold text-gray-900">Events</h1>
            </div>
          </div>
        </div>
        <div className="container mx-auto p-6">
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <BackButton fallbackRoute="/events-landing" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Events</h1>
            </div>
          </div>
        </div>
        <div className="container mx-auto p-6">
          <div className="text-center py-8">
            <p className="text-red-500">Failed to load events. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 w-full max-w-[100vw] overflow-x-hidden box-border">
      {/* MobileNav removed - using global MobileTopNav and MobileBottomNav */}
      
      {/* Show Hero Button - Only visible when hero is hidden */}
      {!isHeroVisible && (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleHeroVisibility}
              className="text-sm"
              data-testid="button-show-events-hero"
            >
              <ChevronDown className="w-4 h-4 mr-2" />
              Show Events Hero
            </Button>
          </div>
        </div>
      )}

      {/* HERO SECTION — Airbnb Style Layout (Landing Page Layout) */}
      {isHeroVisible && (
        <section className="bg-white dark:bg-gray-900 py-8 sm:py-12 lg:py-16 relative">
          {/* Hide Hero Button */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleHeroVisibility}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              data-testid="button-hide-events-hero"
            >
              <X className="w-4 h-4 mr-1" />
              Hide
            </Button>
          </div>

          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="mb-4">
              <BackButton fallbackRoute="/events-landing" />
            </div>
          
          {isMobile ? (
            // Mobile: Keep vertical layout
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-black dark:text-white leading-tight mb-6">
                Events & Experiences
              </h1>
              
              <div className="mb-6 flex justify-center px-4">
                <div className="relative w-full max-w-sm rounded-xl overflow-hidden shadow-xl">
                  <img 
                    src={eventsBgImage}
                    alt="Events and experiences"
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </div>
              
              <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto px-4">
                Discover amazing events, create memorable experiences, and connect with fellow adventurers
              </p>
            </div>
          ) : (
            // Desktop: Enhanced engaging layout
            <div className="relative py-8 overflow-hidden">
              {/* Background decorative elements */}
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute top-16 left-8 w-28 h-28 bg-green-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-16 right-8 w-36 h-36 bg-purple-500 rounded-full blur-3xl"></div>
              </div>
              
              <div className="grid gap-8 md:gap-12 md:grid-cols-5 items-center relative z-10">
                {/* Left text side - wider and enhanced */}
                <div className="md:col-span-3">
                  {/* Premium badge */}
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100/80 to-purple-100/80 dark:from-green-900/20 dark:to-purple-900/20 border border-green-200 dark:border-green-700/50 rounded-full px-4 py-2 mb-6">
                    <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Discover • Create • Experience</span>
                  </div>

                  <div className="space-y-6">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight">
                      <span className="bg-gradient-to-r from-gray-900 via-green-700 to-gray-900 dark:from-white dark:via-green-200 dark:to-white bg-clip-text text-transparent">
                        Events &
                      </span>
                      <br />
                      <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                        Experiences
                      </span>
                    </h1>
                    
                    <div className="max-w-2xl space-y-4">
                      <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                        Every event is a story — <em className="text-purple-600 dark:text-purple-400 font-semibold">waiting to be created.</em>
                      </p>
                      <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                        From intimate coffee meetups to grand festivals, discover events that match your interests and travel style. Create unforgettable experiences with locals and fellow travelers.
                      </p>
                    </div>
                  </div>
                  
                  {/* Enhanced Features with attractive icons */}
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Community Events</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Join gatherings created by locals and fellow travelers</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Meetups</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Discover gatherings from Couchsurfing and Meetup communities</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Create Your Own</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Host events and bring your community together</p>
                      </div>
                    </div>
                  </div>
                </div>
              
                {/* Right image side - more prominent and engaging */}
                <div className="md:col-span-2 flex justify-center items-center relative">
                  {/* Decorative background blur effects */}
                  <div className="absolute inset-0 opacity-30 pointer-events-none">
                    <div className="absolute top-4 -left-8 w-24 h-24 bg-green-400/20 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-4 -right-8 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"></div>
                  </div>
                  
                  {/* Main image container with enhanced styling */}
                  <div className="relative group">
                    {/* Quote above image */}
                    <div className="text-center mb-4 relative z-10">
                      <p className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-200 italic leading-tight">
                        <span className="sm:hidden">Every event tells a story.</span>
                        <span className="hidden sm:inline">Every event is a story waiting to be created.</span>
                      </p>
                    </div>
                    
                    {/* Enhanced image container */}
                    <div className="relative">
                      {/* Subtle background glow */}
                      <div className="absolute -inset-3 bg-gradient-to-r from-green-200/30 via-purple-200/30 to-pink-200/30 dark:from-green-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-3xl blur-lg"></div>
                      
                      {/* Main image */}
                      <div className="relative w-full max-w-sm sm:max-w-md h-[240px] sm:h-[280px] md:h-[320px] lg:h-[380px] rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50 transform group-hover:scale-[1.02] transition-all duration-500">
                        <img
                          src={eventsBgImage}
                          alt="Events and experiences"
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Enhanced overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10">
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                            <p className="text-white/90 font-medium italic text-base drop-shadow-lg leading-relaxed">
                              "Where Stories Come to Life"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Floating stats badges */}
                      <div className="absolute -top-3 -right-3 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-xl border border-gray-200 dark:border-gray-600 transform rotate-3 group-hover:rotate-6 transition-transform duration-300">
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600 dark:text-green-400">∞</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Events</div>
                        </div>
                      </div>
                      
                      <div className="absolute -bottom-3 -left-3 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-xl border border-gray-200 dark:border-gray-600 transform -rotate-3 group-hover:-rotate-6 transition-transform duration-300">
                        <div className="text-center">
                          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">Live</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Now</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Clean Navigation Row - Tabs + Create Button */}
        <div className="flex items-center justify-between mb-6">
          {/* Left: Tab buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={() => setSelectedTab('explore')}
              variant={selectedTab === 'explore' ? 'default' : 'outline'}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedTab === 'explore' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              Community Events
            </Button>
            <Button 
              onClick={() => setSelectedTab('meetup')}
              variant={selectedTab === 'meetup' ? 'default' : 'outline'}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedTab === 'meetup' 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              Meetups
            </Button>
          </div>

          {/* Right: Create Event Button - visible on all screen sizes */}
          <Button 
            onClick={() => setShowCreateEvent(true)}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg shadow-md text-sm font-medium"
            data-testid="create-event-main-cta"
          >
            <Plus className="w-4 h-4 mr-1" />
            Create Event
          </Button>
        </div>

        {/* Unified Location Selector - Works for ALL tabs */}
        <div className="mb-6 space-y-4">
          {/* Location Selection */}
          <div className="w-full">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Location</SelectItem>
                {userTravelPlans.length > 0 && (
                  <>
                    {userTravelPlans.map((plan: any) => (
                      <SelectItem key={plan.id} value={`destination-${plan.id}`}>
                        {plan.destination || plan.destinationCity || `Trip ${plan.id}`}
                      </SelectItem>
                    ))}
                  </>
                )}
                <SelectItem value="hometown">Hometown</SelectItem>
                <SelectItem value="custom">Custom City</SelectItem>
              </SelectContent>
            </Select>

            {selectedLocation === "custom" && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Enter city name..."
                  value={customCity}
                  onChange={(e) => {
                    setCustomCity(e.target.value);
                    setShowCustomInput(true);
                  }}
                  className="w-full md:w-64 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <Button 
                  onClick={() => {
                    setShowCustomInput(false);
                    queryClient.invalidateQueries({ queryKey: ["/api/events", customCity] });
                  }}
                  disabled={!customCity.trim()}
                >
                  Search
                </Button>
              </div>
            )}
          </div>

          {/* Enhanced Search Input */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <Input
              placeholder="Search concerts, meetups, parties, dinners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 py-3 w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl shadow-sm"
            />
          </div>
        </div>

        {/* Colorful Category Chips */}
        <div className="mb-6 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                categoryFilter === "all" 
                  ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white" 
                  : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
              }`}
            >
              ✨ All Events
            </button>
            {categoryData.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setCategoryFilter(cat.name.toLowerCase())}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border whitespace-nowrap ${
                  categoryFilter === cat.name.toLowerCase() 
                    ? "ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-500 " + cat.color
                    : cat.color
                }`}
              >
                {cat.emoji} {cat.name.split(" & ")[0]}
              </button>
            ))}
          </div>
        </div>

        {selectedTab === 'explore' && (
        <div className="space-y-6">

          {/* Show loading skeleton immediately while data loads */}
          {isLoading && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-64 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="w-full md:w-64 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 max-w-full">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse">
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show content when loaded */}
          {!isLoading && (
            <>
          {/* Events Sections */}
          <div className="space-y-6 sm:space-y-8 max-w-full overflow-hidden">
            {/* User's Events Section - Show first */}
            {currentUser && (() => {
              // Filter events created by the user
              const createdEvents = allEvents.filter(event => {
                const userIdNum = parseInt(String(currentUser.id));
                const organizerIdNum = parseInt(String(event.organizerId));
                return userIdNum === organizerIdNum;
              });

              // Filter events the user has joined
              const joinedEventIds = participants
                .filter(p => p.userId === currentUser.id)
                .map(p => p.eventId);
              const joinedEvents = allEvents.filter(event => 
                joinedEventIds.includes(event.id) && event.organizerId !== currentUser.id
              );

              const allUserEvents = [...createdEvents, ...joinedEvents];

              if (allUserEvents.length > 0) {
                return (
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      My Events ({allUserEvents.length})
                    </h2>
                    <div className="grid gap-3 sm:gap-6 sm:grid-cols-2">
                      {allUserEvents.map((event) => (
                        <Card 
                          key={event.id} 
                          className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 border-blue-200 bg-blue-50/30 dark:border-blue-700 dark:bg-blue-900/20 w-full overflow-hidden"
                          onClick={() => setLocation(`/events/${event.id}`)}
                        >
                          <CardHeader className="pb-3">
                            {event.imageUrl && (
                              <div className="relative h-40 bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 overflow-hidden">
                                <img
                                  src={event.imageUrl}
                                  alt={event.title}
                                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                  loading="lazy"
                                />
                              </div>
                            )}
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-lg line-clamp-2 dark:text-white">{event.title}</CardTitle>
                              <div className="flex flex-col gap-1 ml-2">
                                <Badge variant="secondary" className={`shrink-0 ${
                                  createdEvents.some(e => e.id === event.id) 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {createdEvents.some(e => e.id === event.id) ? 'Organizer' : 'Joined'}
                                </Badge>
                                {/* Recurring event indicator */}
                                {event.isRecurring && (
                                  <Badge variant="outline" className="shrink-0 text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">
                                    🔄 {event.recurrenceType === 'weekly' ? 'Weekly' : 
                                         event.recurrenceType === 'daily' ? 'Daily' :
                                         event.recurrenceType === 'monthly' ? 'Monthly' :
                                         event.recurrenceType === 'biweekly' ? 'Bi-weekly' :
                                         'Recurring'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="px-3 sm:px-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white">
                                <Calendar className="w-4 h-4 text-gray-600 dark:text-white" />
                                {formatDateForDisplay(event.date)} at{" "}
                                {new Date(event.date).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white">
                                <MapPin className="w-4 h-4 text-gray-600 dark:text-white" />
                                {formatEventLocation(event)}
                              </div>

                              {event.description && (
                                <p className="text-sm text-gray-600 dark:text-white line-clamp-2">
                                  {event.description}
                                </p>
                              )}

                              {/* Attendance count */}
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                <Users className="w-4 h-4 inline mr-1" />
                                {(() => {
                                  const count = (event as any).participantCount ?? participants.filter(p => p.eventId === event.id).length;
                                  return count === 1 ? "1 attending" : `${count} attending`;
                                })()}
                              </div>

                              {/* Interest Button */}
                              <div className="flex justify-center mb-3" onClick={(e) => e.stopPropagation()}>
                                <InterestButton event={event} userId={user?.id} />
                              </div>

                              {/* Management buttons for created events */}
                              {createdEvents.some(e => e.id === event.id) ? (
                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="flex-1 bg-gradient-to-r from-orange-500 to-blue-600 text-white border-0 hover:from-orange-600 hover:to-blue-700"
                                      style={{ transition: 'none' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLocation(`/events/${event.id}`);
                                      }}
                                      data-testid={`button-view-${event.id}`}
                                    >
                                      View
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 hover:from-green-600 hover:to-emerald-700"
                                      style={{ transition: 'none' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLocation(`/event-chat/${event.id}`);
                                      }}
                                      data-testid={`button-chat-${event.id}`}
                                    >
                                      <MessageCircle className="w-4 h-4 mr-1" />
                                      Open Chat
                                    </Button>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLocation(`/events/${event.id}/edit`);
                                      }}
                                      data-testid={`button-edit-${event.id}`}
                                    >
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="flex-1 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Copy event:', event.id);
                                      }}
                                      data-testid={`button-copy-${event.id}`}
                                    >
                                      Copy
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2 pt-2">
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLocation(`/events/${event.id}`);
                                      }}
                                      className="flex-1 bg-gradient-to-r from-blue-600 to-orange-500 text-white border-0 hover:from-blue-700 hover:to-orange-600"
                                      style={{ 
                                        background: 'linear-gradient(to right, #2563eb, #ea580c)',
                                        border: 'none',
                                        transition: 'none' 
                                      }}
                                      data-testid={`button-view-event-${event.id}`}
                                    >
                                      View Event
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLocation(`/event-chat/${event.id}`);
                                      }}
                                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 hover:from-green-600 hover:to-emerald-700"
                                      style={{ transition: 'none' }}
                                      data-testid={`button-chat-participant-${event.id}`}
                                    >
                                      <MessageCircle className="w-4 h-4 mr-1" />
                                      Open Chat
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      size="sm" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleJoinEvent(event);
                                      }}
                                      disabled={joinEventMutation.isPending || leaveEventMutation.isPending}
                                      variant={isUserJoined(event.id) ? "outline" : "default"}
                                      className={isUserJoined(event.id) ? "flex-1" : "flex-1 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0"}
                                      style={!isUserJoined(event.id) ? { 
                                        background: 'linear-gradient(to right, #2563eb, #ea580c)',
                                        border: 'none'
                                      } : {}}
                                      data-testid={`button-join-leave-${event.id}`}
                                    >
                                      {isUserJoined(event.id) ? "Leave" : "Join Event"}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* All Community Events Section */}
            <div>
              <div className="flex items-center justify-between mb-4 gap-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">All Community Events</h2>
                <Button
                  variant="outline"
                  onClick={() => setLocation('/event-history')}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold text-orange-600 border-2 border-orange-400 hover:bg-orange-100 hover:border-orange-500 dark:text-orange-400 dark:border-orange-500 dark:hover:bg-orange-900/30 shadow-sm whitespace-nowrap"
                >
                  <History className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>Past Events</span>
                </Button>
              </div>
              {filteredUpcomingEvents.length === 0 ? (
                <div className="text-center py-10 sm:py-16 bg-gradient-to-br from-orange-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {upcomingEvents.length === 0 
                      ? `Be the first to host an event in ${cityToQuery}!`
                      : "No events match your search"
                    }
                  </h3>
                  <p className="text-base text-gray-600 dark:text-gray-300 px-6 mb-6 max-w-md mx-auto">
                    {upcomingEvents.length === 0 
                      ? "Your community is waiting! Create a dinner, meetup, or adventure and start connecting with locals and travelers."
                      : "Try different filters or search terms to find what you're looking for."
                    }
                  </p>
                  {upcomingEvents.length === 0 && (
                    <Button 
                      onClick={() => setShowCreateEvent(true)}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-xl shadow-lg text-base font-semibold"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Host Your Own Event
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredUpcomingEvents.map((event) => {
                    const eventDate = new Date(event.date);
                    const attendeeCount = (event as any).participantCount ?? participants.filter(p => p.eventId === event.id).length;
                    const eventParticipants = participants.filter(p => p.eventId === event.id).slice(0, 3);
                    
                    return (
                    <Card 
                      key={event.id} 
                      className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 w-full overflow-hidden bg-white dark:bg-gray-800 border-0 shadow-md rounded-xl group"
                      onClick={() => setLocation(`/events/${event.id}`)}
                    >
                      {/* Image with Date Badge */}
                      <div className="relative h-40 sm:h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
                        {event.imageUrl ? (
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-pink-500">
                            <Sparkles className="w-12 h-12 text-white/80" />
                          </div>
                        )}
                        
                        {/* Date Badge - Top Left */}
                        <div className="absolute top-3 left-3 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 shadow-lg text-center min-w-[50px]">
                          <div className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase">
                            {eventDate.toLocaleDateString([], { month: 'short' })}
                          </div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                            {eventDate.getDate()}
                          </div>
                        </div>

                        {/* Category/Recurring Badge - Top Right */}
                        {event.isRecurring && (
                          <Badge className="absolute top-3 right-3 bg-green-500 text-white border-0 text-xs">
                            🔄 {event.recurrenceType === 'weekly' ? 'Weekly' : 'Recurring'}
                          </Badge>
                        )}
                      </div>

                      <CardContent className="p-4">
                        {/* Title */}
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg line-clamp-2 mb-2 group-hover:text-orange-600 transition-colors">
                          {event.title}
                        </h3>

                        {/* Location */}
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="line-clamp-1">{formatEventLocation(event)}</span>
                        </div>

                        {/* Time */}
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {eventDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Attendees Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {/* Attendee Avatars */}
                            <div className="flex -space-x-2">
                              {eventParticipants.map((p, idx) => (
                                <div key={idx} className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                  <span className="text-white text-xs font-medium">
                                    {String.fromCharCode(65 + (p.userId % 26))}
                                  </span>
                                </div>
                              ))}
                              {attendeeCount > 3 && (
                                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                  <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">
                                    +{attendeeCount - 3}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                              {attendeeCount === 0 ? "Be first!" : `${attendeeCount} going`}
                            </span>
                          </div>

                          {/* Interest Button */}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinEvent(event);
                            }}
                            className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                          >
                            <Heart className="w-5 h-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          </>
          )}
        </div>
        )}

        {selectedTab === 'meetup' && (
                      <CardHeader className="pb-3">
                        {event.imageUrl && (
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="w-full h-40 object-cover rounded-lg mb-3"
                          />
                        )}
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg line-clamp-2 dark:text-white">{event.title}</CardTitle>
                          <div className="flex flex-col gap-1 ml-2">
                            <Badge variant="outline" className="shrink-0 text-xs">
                              Ended
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <Calendar className="w-4 h-4" />
                            {formatDateForDisplay(event.date)} at{" "}
                            {new Date(event.date).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <MapPin className="w-4 h-4" />
                            {formatEventLocation(event)}
                          </div>

                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                              {event.description}
                            </p>
                          )}

                          {/* Tags */}
                          {event.tags && event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {event.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {event.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{event.tags.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Attendance count */}
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            <Users className="w-4 h-4 inline mr-1 dark:text-gray-400" />
                            {(() => {
                              const count = participants.filter(p => p.eventId === event.id).length;
                              return count === 1 ? "1 attended" : `${count} attended`;
                            })()}
                          </div>

                          <div className="flex items-center justify-center pt-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/events/${event.id}`);
                              }}
                              className="w-full bg-gradient-to-r from-blue-600 to-orange-500 text-white border-0 hover:from-blue-700 hover:to-orange-600"
                              style={{ transition: 'none' }}
                            >
                              View Event
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
            </>
          )}
        </div>
        )}


        {/* Create Event Dialog */}
        {showCreateEvent && (
          <>
            <style>
              {`body { overflow: hidden; } body.create-event-modal-open .logo-container { display: none !important; }`}
            </style>
            <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Create New Event</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateEvent(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                  <CreateEvent onEventCreated={() => {
                    setShowCreateEvent(false);
                    queryClient.invalidateQueries({ queryKey: ["/api/events"] });
                  }} />
                </div>
              </div>
            </div>
          </>
        )}



        {/* Meetup Events Tab */}
        {selectedTab === 'meetup' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Local Meetups in {cityToQuery}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Discover meetups and community events happening near you
              </p>
            </div>

            {meetupLoading && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse">
                      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!meetupLoading && (
              <>
                {meetupEvents.events && meetupEvents.events.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {meetupEvents.events.map((event: any) => (
                      <Card key={event.id} className="hover:shadow-lg transition-shadow duration-200 border border-gray-200 w-full overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-start flex-wrap gap-2 mb-3">
                            <Badge className="bg-green-100 text-green-800">
                              Meetup
                            </Badge>
                            {event.attendees > 0 && (
                              <Badge variant="outline">
                                {event.attendees} going
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                            {event.title}
                          </h3>

                          {event.description && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                              {event.description}
                            </p>
                          )}

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(event.date).toLocaleDateString([], {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {event.venue !== 'TBD' && (
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span className="line-clamp-1">{event.venue}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <Users className="w-4 h-4" />
                              <span>{event.organizer}</span>
                            </div>
                          </div>

                          {/* Interest Button */}
                          <div className="flex justify-center mb-3">
                            <InterestButton 
                              event={{...event, source: 'meetup'}} 
                              userId={user?.id} 
                              variant="minimal" 
                            />
                          </div>

                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white border-0 hover:from-green-600 hover:to-green-700"
                            onClick={() => window.open(event.url, '_blank')}
                          >
                            View on Meetup
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 dark:text-white mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-white mb-2">No Meetups Found</h3>
                    <p className="text-gray-500 dark:text-white">
                      {meetupEvents.message || "No meetups found in this area. Try a different location."}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}




      </div>
    </div>
  );
}