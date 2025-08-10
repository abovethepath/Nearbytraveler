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
import { Calendar, Clock, MapPin, Users, Search, Filter, Plus, Info, X, Heart, UserCheck, CheckCircle } from "lucide-react";

import { type Event, type EventParticipant, type User as UserType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BackButton from "@/components/back-button";
import CreateEvent from "@/pages/create-event";

import { ParticipantAvatars } from "@/components/ParticipantAvatars";
import { formatDateForDisplay } from "@/lib/dateUtils";
import { PublicationSchedule } from "@/components/PublicationSchedule";
import eventsBgImage from "@assets/event page bbq party_1753299541268.png";
// MobileNav removed - using global mobile navigation

export default function Events() {
  const [selectedLocation, setSelectedLocation] = useState<string>("current");
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

  // Get user data from API to ensure fresh data
  const { data: apiUser } = useQuery({
    queryKey: [`/api/users/${currentUser?.id || 1}`],
    staleTime: 0, // Always fetch fresh data
    enabled: !!currentUser?.id,
  });

  // Use API user data if available, fallback to localStorage
  const user = apiUser || currentUser;



  // Fetch user's travel plans to show multiple destinations
  const { data: userTravelPlans = [] } = useQuery({
    queryKey: ["/api/travel-plans", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/travel-plans/${user.id}`);
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
      const response = await fetch(`/api/events?city=${encodeURIComponent(cityToQuery)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      return response.json();
    },
    enabled: !(selectedLocation === "custom" && showCustomInput), // Don't auto-fetch while typing
    staleTime: 30000, // Cache for 30 seconds to improve performance
  });

  // Fetch all events for My Events tab only when needed
  const { data: allEvents = [], isLoading: allEventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", "all"],
    queryFn: async () => {
      const response = await fetch(`/api/events`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      return response.json();
    },
    enabled: selectedTab === 'my-events', // Only fetch when My Events tab is active
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
          const response = await fetch(`/api/events/${event.id}/participants`);
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
      const response = await fetch(`/api/external-events/meetup?city=${encodeURIComponent(cityToQuery)}`);
      if (!response.ok) return { events: [] };
      return response.json();
    },
    enabled: selectedTab === 'meetup' && !!cityToQuery,
    staleTime: 300000, // Cache for 5 minutes
  });





  const { data: allEventsData = { events: [] }, isLoading: isAllEventsLoading } = useQuery({
    queryKey: ["/api/external-events/allevents", cityToQuery],
    queryFn: async () => {
      const response = await fetch(`/api/external-events/allevents?city=${encodeURIComponent(cityToQuery)}`);
      if (!response.ok) return { events: [] };
      const data = await response.json();
      console.log('🎉 AllEvents API Response:', data);
      return data;
    },
    enabled: selectedTab === 'allevents' && !!cityToQuery,
    staleTime: 300000, // Cache for 5 minutes
  });

  // Fetch Ticketmaster events (concerts, shows, sports)
  const { data: ticketmasterEvents = [], isLoading: ticketmasterLoading } = useQuery({
    queryKey: ["/api/external-events/ticketmaster", cityToQuery],
    queryFn: async () => {
      const response = await fetch(`/api/external-events/ticketmaster?city=${encodeURIComponent(cityToQuery)}`);
      if (!response.ok) return { events: [] };
      return response.json();
    },
    enabled: selectedTab === 'ticketmaster' && !!cityToQuery,
    staleTime: 300000, // Cache for 5 minutes
  });

  // Fetch StubHub events (premium travel-friendly events)
  const { data: stubhubEvents = [], isLoading: stubhubLoading } = useQuery({
    queryKey: ["/api/external-events/stubhub", cityToQuery],
    queryFn: async () => {
      const response = await fetch(`/api/external-events/stubhub?city=${encodeURIComponent(cityToQuery)}`);
      if (!response.ok) return { events: [] };
      return response.json();
    },
    enabled: selectedTab === 'stubhub' && !!cityToQuery,
    staleTime: 300000, // Cache for 5 minutes
  });

  // Fetch Local LA events (RSS feeds + neighborhood events)
  const { data: localLAEvents = [], isLoading: localLALoading } = useQuery({
    queryKey: ["/api/external-events/local-la"],
    queryFn: async () => {
      const response = await fetch(`/api/external-events/local-la`);
      if (!response.ok) return { events: [] };
      return response.json();
    },
    enabled: selectedTab === 'local-la',
    staleTime: 600000, // Cache for 10 minutes (RSS feeds don't change frequently)
  });

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
                         event.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = effectiveCategoryFilter === "all" || 
                           !effectiveCategoryFilter ||
                           event.category.toLowerCase().includes(effectiveCategoryFilter.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const filteredPastEvents = pastEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = effectiveCategoryFilter === "all" || 
                           !effectiveCategoryFilter ||
                           event.category.toLowerCase().includes(effectiveCategoryFilter.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const categories = [
    "Parties",
    "Food & Dining",
    "Adventure & Sports", 
    "Culture & Arts",
    "Social & Networking",
    "Music & Entertainment",
    "Business & Professional",
    "Health & Wellness",
    "Education & Learning",
  ];

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
  if (isLoading || allEventsLoading) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
      {/* MobileNav removed - using global MobileTopNav and MobileBottomNav */}
      {/* Modern Hero Header with Background Image */}
      <div className="relative overflow-hidden bg-gray-900 min-h-[400px]">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${eventsBgImage})` }}
        ></div>
        {/* Subtle overlay to maintain text readability without heavy color tint */}
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-12">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <BackButton fallbackRoute="/events-landing" />
            <div className="flex-1"></div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Events & Experiences
            </h1>
            <p className="text-sm sm:text-lg text-blue-100 max-w-2xl mx-auto px-2">
              Discover amazing events, create memorable experiences, and connect with fellow adventurers
            </p>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-orange-400/20 rounded-full blur-lg"></div>
      </div>
      
      {/* SPACE ADDED BETWEEN HEADER AND CTA BUTTONS AS REQUESTED */}
      <div className="py-6"></div>
      
      <div className="container mx-auto px-2 sm:px-6">

        {/* Three Button Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <Button 
            onClick={() => setSelectedTab('explore')}
            className={`px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
              selectedTab === 'explore' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Community Events
          </Button>
          <Button 
            onClick={() => setSelectedTab('meetup')}
            className={`px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
              selectedTab === 'meetup' 
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Local Meetups
          </Button>

          <Button 
            onClick={() => setSelectedTab('allevents')}
            className={`px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
              selectedTab === 'allevents' 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            City Events
          </Button>
          <Button 
            onClick={() => setSelectedTab('ticketmaster')}
            className={`px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
              selectedTab === 'ticketmaster' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Concerts & Shows
          </Button>
          <Button 
            onClick={() => setSelectedTab('stubhub')}
            className={`px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
              selectedTab === 'stubhub' 
                ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Premium Events
          </Button>
          <Button 
            onClick={() => setSelectedTab('local-la')}
            className={`px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
              selectedTab === 'local-la' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Local LA
          </Button>

          <Button 
            onClick={() => setSelectedTab('my-events')}
            className={`px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
              selectedTab === 'my-events' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            My Events
          </Button>

          <Button 
            onClick={() => setShowCreateEvent(true)}
            className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg text-sm sm:text-base"
          >
            <Plus className="w-4 sm:w-5 h-4 sm:h-5 mr-1 sm:mr-2" />
            Create Event
          </Button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          {/* Location Selection */}
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-full md:w-64 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
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
              <div className="flex gap-2">
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

          {/* Search and Filters */}
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white w-4 h-4" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <Filter className="w-4 h-4 mr-2 text-gray-500 dark:text-white" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category.toLowerCase()}>
                      {category}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Category</SelectItem>
                </SelectContent>
              </Select>

              {categoryFilter === "custom" && (
                <Input
                  placeholder="Enter custom category..."
                  value={customCategory}
                  onChange={(e) => {
                    setCustomCategory(e.target.value);
                    setShowCustomCategoryInput(true);
                  }}
                  className="w-full sm:w-48 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              )}
            </div>
          </div>

          {/* Events Sections */}
          <div className="space-y-6 sm:space-y-8">
            {/* Upcoming Events Section */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Upcoming Events</h2>
              {filteredUpcomingEvents.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <Calendar className="w-10 sm:w-12 h-10 sm:h-12 text-gray-300 dark:text-white mx-auto mb-3" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-600 dark:text-white mb-2">No upcoming events</h3>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-white px-4">
                    {upcomingEvents.length === 0 
                      ? `No upcoming events in ${cityToQuery}. Be the first to create one!`
                      : "Try adjusting your search or filters."
                    }
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredUpcomingEvents.map((event) => (
                    <Card 
                      key={event.id} 
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                      onClick={() => setLocation(`/events/${event.id}`)}
                    >
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
                          <Badge variant="secondary" className="ml-2 shrink-0">
                            {event.category}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
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
                            {event.location}
                          </div>

                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-white line-clamp-2">
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
                            <Users className="w-4 h-4 inline mr-1" />
                            {(() => {
                              // Use participantCount from event object if available, otherwise fallback to participants array
                              const count = (event as any).participantCount ?? participants.filter(p => p.eventId === event.id).length;
                              return count === 1 ? "1 attending" : `${count} attending`;
                            })()}
                          </div>

                          <div className="flex items-center gap-2 pt-2">
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
                            >
                              View Event
                            </Button>

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
                            >
                              {isUserJoined(event.id) ? "Leave" : "Join Event"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Past Events Section */}
            {filteredPastEvents.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Past Events</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredPastEvents.map((event) => (
                    <Card 
                      key={event.id} 
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] opacity-75"
                      onClick={() => setLocation(`/events/${event.id}`)}
                    >
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
                            <Badge variant="secondary" className="shrink-0">
                              {event.category}
                            </Badge>
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
                            {event.location}
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

        {selectedTab === 'my-events' && (
        <div className="space-y-6">
          {(() => {
            if (!currentUser) return null;

            // Filter events created by the user (fix ID matching)
            const createdEvents = allEvents.filter(event => {
              // Convert both to numbers for proper comparison
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

            if (allUserEvents.length === 0) {
              return (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 dark:text-white mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-white mb-2">No Events Yet</h3>
                  <p className="text-gray-500 dark:text-white mb-4">
                    Events you've created and events you've joined will appear here.
                  </p>
                  <Button 
                    onClick={() => setShowCreateEvent(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {/* Created Events */}
                {createdEvents.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Events I Created ({createdEvents.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {createdEvents.map((event) => (
                        <Card 
                          key={event.id} 
                          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border border-gray-200"
                          onClick={() => setLocation(`/events/${event.id}`)}
                        >
                          {/* Event Photo Header */}
                          {event.imageUrl && (
                            <div className="relative h-40 bg-cover bg-center rounded-t-lg overflow-hidden">
                              <img
                                src={event.imageUrl}
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                            </div>
                          )}
                          
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Organizer
                              </Badge>
                              <Badge variant="outline">
                                {event.category}
                              </Badge>
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
                                  {formatDateForDisplay(event.date)} at{" "}
                                  {new Date(event.date).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                  {event.endDate && (
                                    <>
                                      {" - "}
                                      {new Date(event.endDate).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span className="line-clamp-1">{event.location}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Users className="w-4 h-4" />
                                <span>
                                  {participants.filter(p => p.eventId === event.id).length} joined
                                  {event.maxParticipants && ` / ${event.maxParticipants} max`}
                                </span>
                              </div>
                            </div>

                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full bg-gradient-to-r from-orange-500 to-blue-600 text-white border-0 hover:from-orange-600 hover:to-blue-700"
                              style={{ transition: 'none' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/events/${event.id}`);
                              }}
                            >
                              Manage Event
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Joined Events */}
                {joinedEvents.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Events I Joined ({joinedEvents.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {joinedEvents.map((event) => (
                        <Card 
                          key={event.id} 
                          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border border-gray-200"
                          onClick={() => setLocation(`/events/${event.id}`)}
                        >
                          {/* Event Photo Header */}
                          {event.imageUrl && (
                            <div className="relative h-40 bg-cover bg-center rounded-t-lg overflow-hidden">
                              <img
                                src={event.imageUrl}
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                            </div>
                          )}
                          
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                Participant
                              </Badge>
                              <Badge variant="outline">
                                {event.category}
                              </Badge>
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
                                  {formatDateForDisplay(event.date)} at{" "}
                                  {new Date(event.date).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                  {event.endDate && (
                                    <>
                                      {" - "}
                                      {new Date(event.endDate).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span className="line-clamp-1">{event.location}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Users className="w-4 h-4" />
                                <span>
                                  {participants.filter(p => p.eventId === event.id).length} joined
                                  {event.maxParticipants && ` / ${event.maxParticipants} max`}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white border-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/events/${event.id}`);
                                }}
                              >
                                View Details
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJoinEvent(event);
                                }}
                              >
                                Leave Event
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        )}

        {/* Create Event Dialog */}
        {showCreateEvent && (
          <>
            <style>
              {`body { overflow: hidden; } body.create-event-modal-open .logo-container { display: none !important; }`}
            </style>
            <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Event</h2>
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
                <div className="p-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {meetupEvents.events.map((event: any) => (
                      <Card key={event.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border border-gray-200">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
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



        {/* City Events Tab */}
        {selectedTab === 'allevents' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                City Events in {cityToQuery}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Discover parties, concerts, shows, sports, and more happening in your city
              </p>
            </div>

            {isAllEventsLoading && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            {!isAllEventsLoading && (
              <>
                {allEventsData.events && allEventsData.events.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allEventsData.events.map((event: any) => (
                      <Card key={event.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border border-gray-200">
                        {event.image && (
                          <div className="relative h-40 bg-cover bg-center rounded-t-lg overflow-hidden">
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                          </div>
                        )}
                        
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <Badge className="bg-red-100 text-red-800">
                              City Event
                            </Badge>
                            {event.category && (
                              <Badge variant="outline">
                                {event.category}
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
                            {event.address && (
                              <div className="flex items-center gap-2 text-xs px-2 py-1 rounded">
                                {event.address.includes(',') && event.address.split(',').length === 2 && /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(event.address.trim()) ? (
                                  <>
                                    <MapPin className="w-3 h-3" />
                                    <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">GPS Available</span>
                                  </>
                                ) : (
                                  <>
                                    <MapPin className="w-3 h-3" />
                                    <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1 rounded">Address Available</span>
                                  </>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <Users className="w-4 h-4" />
                              <span>{event.organizer}</span>
                            </div>
                            {event.price && (
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-medium">{event.price}</span>
                              </div>
                            )}
                          </div>

                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white border-0 hover:from-red-600 hover:to-red-700"
                            onClick={() => {
                              // Store event data for the details page
                              localStorage.setItem(`external-event-${event.id}`, JSON.stringify(event));
                              setLocation(`/external-events/${event.id}`);
                            }}
                          >
                            View Event Details
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 dark:text-white mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-white mb-2">No City Events Found</h3>
                    <p className="text-gray-500 dark:text-white">
                      No events found in {cityToQuery}. Try searching a different city or check back later for new events.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Ticketmaster Events Tab - Concerts & Shows */}
        {selectedTab === 'ticketmaster' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Concerts & Shows in {cityToQuery}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Discover concerts, sports events, theater shows, and entertainment
              </p>
            </div>

            {ticketmasterLoading && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            {!ticketmasterLoading && (
              <>
                {ticketmasterEvents.events && ticketmasterEvents.events.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ticketmasterEvents.events.map((event: any) => (
                      <Card key={event.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border border-gray-200">
                        {event.image && (
                          <div className="relative h-40 bg-cover bg-center rounded-t-lg overflow-hidden">
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                          </div>
                        )}
                        
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <Badge className="bg-blue-100 text-blue-800">
                              Entertainment
                            </Badge>
                            {event.category && (
                              <Badge variant="outline">
                                {event.category}
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
                            {event.price && (
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-medium">{event.price}</span>
                              </div>
                            )}
                          </div>

                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700"
                            onClick={() => {
                              // Store event data for the details page
                              localStorage.setItem(`external-event-${event.id}`, JSON.stringify(event));
                              setLocation(`/external-events/${event.id}`);
                            }}
                          >
                            View Event Details
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 dark:text-white mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-white mb-2">No Events Found</h3>
                    <p className="text-gray-500 dark:text-white">
                      {ticketmasterEvents.message || "No entertainment events found in this area. Try a different location."}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Local LA Events Tab - RSS feeds and neighborhood events */}
        {selectedTab === 'local-la' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Local LA Events
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Authentic events from Venice Beach, Beverly Hills, and Hollywood neighborhoods
              </p>
            </div>

            {localLALoading && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse">
                      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!localLALoading && (
              <>
                {localLAEvents.events && localLAEvents.events.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {localLAEvents.events.map((event: any) => (
                      <Card key={event.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border border-gray-200">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <Badge className="bg-purple-100 text-purple-800">
                              {event.location || 'Local LA'}
                            </Badge>
                            <Badge variant="outline">
                              {event.source}
                            </Badge>
                          </div>

                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                            {event.title}
                          </h3>

                          {event.description && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-3">
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
                            {event.venue && event.venue !== 'Various LA Locations' && (
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span className="line-clamp-1">{event.venue}</span>
                              </div>
                            )}
                            {event.address && (
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="line-clamp-1">{event.address}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <span className="font-medium">{event.category}</span>
                            </div>
                          </div>

                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 hover:from-purple-600 hover:to-purple-700"
                            onClick={() => window.open(event.url, '_blank')}
                          >
                            Learn More
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 dark:text-white mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-white mb-2">No Local Events Found</h3>
                    <p className="text-gray-500 dark:text-white">
                      {localLAEvents.message || "No local LA events available at the moment. Check back soon for updates from local sources."}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Curated Events Tab */}
        {selectedTab === 'curated' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Curated Events in {cityToQuery}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Handpicked events from trusted local publications like Timeout, LAist, and Gothamist
              </p>
            </div>

            {false && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse">
                      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {true && (
              <>
                {(curatedEvents as any)?.events && (curatedEvents as any).events.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(curatedEvents as any).events.map((event: any) => (
                      <Card key={event.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border border-gray-200">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <Badge className="bg-orange-100 text-orange-800">
                              {event.location || 'Curated'}
                            </Badge>
                            <Badge variant="outline">
                              {event.source}
                            </Badge>
                          </div>

                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                            {event.title}
                          </h3>

                          {event.description && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-3">
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
                            {event.venue && (
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span className="line-clamp-1">{event.venue}</span>
                              </div>
                            )}
                            {event.address && (
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="line-clamp-1">{event.address}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <span className="font-medium">{event.category}</span>
                            </div>
                          </div>

                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 hover:from-orange-600 hover:to-orange-700"
                            onClick={() => window.open(event.url, '_blank')}
                          >
                            Read More
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 dark:text-white mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-white mb-2">No Curated Events Found</h3>
                    <p className="text-gray-500 dark:text-white">Check back later for new curated events from local publications, or explore other cities.</p>
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