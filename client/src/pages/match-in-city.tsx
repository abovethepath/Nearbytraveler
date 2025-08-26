import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/App";
import { 
  MapPin, 
  Plus, 
  Users, 
  Heart, 
  Edit, 
  Trash2, 
  Search,
  Target,
  Zap,
  ArrowLeft,
  Camera,
  Info,
  X
} from "lucide-react";
// Removed CityPhotoUploadWidget to improve performance
// Removed MobileNav - using global mobile navigation

// Removed problematic city images and photo gallery functions

// DISABLED: Metro consolidation per user request - return original city names
const consolidateToMetroArea = (city: string, state?: string): string => {
  return city; // No consolidation
};

export default function MatchInCity() {
  const [location, setLocation] = useLocation();
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityDescription, setNewActivityDescription] = useState('');
  const [editActivityName, setEditActivityName] = useState('');
  const [editActivityDescription, setEditActivityDescription] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [cityActivities, setCityActivities] = useState<any[]>([]);
  const [cityEvents, setCityEvents] = useState<any[]>([]);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [matchingUsers, setMatchingUsers] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user: authUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // Get user data from localStorage (same as other working components)
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('travelconnect_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };
  
  const user = getUserData() || authUser;
  

  const [allCities, setAllCities] = useState<any[]>([]);
  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [searchingCity, setSearchingCity] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Fetch all cities on component mount
  useEffect(() => {
    fetchAllCities();
  }, []);

  // Fetch city activities and events when a city is selected
  useEffect(() => {
    if (selectedCity) {
      console.log('🎯 CITY SELECTED:', selectedCity);
      console.log('🎯 FETCHING DATA FOR CITY:', selectedCity);
      fetchCityActivities();
      fetchUserActivities();
      fetchCityEvents();
      fetchUserEvents();
      fetchMatchingUsers();
      fetchConnections();
    }
  }, [selectedCity]);

  const fetchConnections = async () => {
    const currentUser = getUserData();
    if (!currentUser?.id) return;
    try {
      const response = await fetch(`/api/connections/${currentUser.id}`);
      if (response.ok) {
        const connections = await response.json();
        setConnections(connections);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  // Check if a city is in LA area for enhanced prominence
  const isLAAreaCity = (cityName: string, stateName: string) => {
    const laMetroCities = [
      'Los Angeles', 'Santa Monica', 'Venice', 'Venice Beach', 'Beverly Hills', 
      'West Hollywood', 'Hollywood', 'Pasadena', 'Burbank', 'Glendale', 'Long Beach',
      'Manhattan Beach', 'El Segundo', 'Culver City', 'Marina del Rey', 'Redondo Beach'
    ];
    // Check if it's a LA metro city, regardless of state field (some entries have empty state)
    const isLAMetroCity = laMetroCities.some(city => city.toLowerCase() === cityName.toLowerCase());
    
    // Return true if it's a LA metro city AND either state is California OR state is empty (for database entries with missing state)
    return isLAMetroCity && (
      stateName?.toLowerCase() === 'california' || 
      !stateName || 
      stateName === ''
    );
  };

  // Filter cities based on search with LA prioritization
  useEffect(() => {
    let filtered = allCities;
    
    if (citySearchTerm) {
      filtered = allCities.filter(city => 
        city.city.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
        city.state.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
        city.country.toLowerCase().includes(citySearchTerm.toLowerCase())
      );
    }
    
    // Sort with LA area cities first, then by user count
    const sorted = filtered.sort((a, b) => {
      const aIsLA = isLAAreaCity(a.city, a.state);
      const bIsLA = isLAAreaCity(b.city, b.state);
      
      // LA cities first
      if (aIsLA && !bIsLA) return -1;
      if (!aIsLA && bIsLA) return 1;
      
      // Then by user count
      return (b.userCount || 0) - (a.userCount || 0);
    });
    
    setFilteredCities(sorted);
  }, [citySearchTerm, allCities]);

  // Removed city photos functionality to improve performance

  const fetchAllCities = async () => {
    setCitiesLoading(true);
    try {
      const response = await fetch('/api/city-stats');
      if (response.ok) {
        const cities = await response.json();
        // Consolidate NYC variations and add gradient colors
        const consolidatedCities = cities.map((city: any, index: number) => {
          // Consolidate NYC variations
          let cityName = city.city;
          if (['NYC', 'Manhattan', 'New York', 'New york city', 'NYC', 'nyc'].includes(cityName)) {
            cityName = 'New York City';
          }

          // Dynamic gradient colors with more variety
          const gradients = [
            'from-orange-400 via-red-500 to-purple-600',
            'from-blue-400 via-purple-500 to-indigo-600', 
            'from-yellow-400 via-orange-500 to-red-600',
            'from-gray-400 via-blue-500 to-purple-600',
            'from-red-400 via-orange-500 to-yellow-600',
            'from-green-400 via-blue-500 to-purple-600',
            'from-indigo-400 via-purple-500 to-pink-600',
            'from-teal-400 via-cyan-500 to-blue-600',
            'from-purple-400 via-pink-500 to-red-600',
            'from-emerald-400 via-teal-500 to-cyan-600',
            'from-purple-400 via-indigo-500 to-blue-600',
            'from-teal-400 via-blue-500 to-indigo-600',
            'from-cyan-400 via-blue-500 to-purple-600'
          ];

          return {
            ...city,
            city: cityName,
            gradient: gradients[index % gradients.length],
            image: city.photoUrl || `https://images.unsplash.com/photo-${1500000000 + (index * 1000)}?auto=format&fit=crop&w=800&q=80`
          };
        });

        // Remove duplicates (in case of NYC consolidation)
        const uniqueCities = consolidatedCities.reduce((acc: any[], current: any) => {
          const exists = acc.find(city => 
            city.city.toLowerCase() === current.city.toLowerCase() && 
            city.state.toLowerCase() === current.state.toLowerCase()
          );
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, []);

        setAllCities(uniqueCities);
        setFilteredCities(uniqueCities);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setCitiesLoading(false);
    }
  };

  const fetchCityActivities = async () => {
    try {
      const response = await fetch(`/api/city-activities/${encodeURIComponent(selectedCity)}`);
      if (response.ok) {
        const activities = await response.json();

        setCityActivities(activities);
      }
    } catch (error) {
      console.error('Error fetching city activities:', error);
    }
  };

  const fetchUserActivities = async () => {
    const currentUser = getUserData();
    if (!currentUser?.id) {
      console.log('No user available - skipping fetchUserActivities');
      setUserActivities([]);
      return;
    }
    const userId = currentUser.id;
    console.log('Fetching activities for user ID:', userId);

    try {
      const response = await fetch(`/api/user-city-interests/${userId}/${encodeURIComponent(selectedCity)}`);
      if (response.ok) {
        const activities = await response.json();
        setUserActivities(activities);
      }
    } catch (error) {
      console.error('Error fetching user activities:', error);
      setUserActivities([]);
    }
  };

  const fetchCityEvents = async () => {
    try {
      const response = await fetch(`/api/events?city=${encodeURIComponent(selectedCity)}`);
      if (response.ok) {
        const events = await response.json();
        setCityEvents(events);
      }
    } catch (error) {
      console.error('Error fetching city events:', error);
    }
  };

  const fetchUserEvents = async () => {
    const currentUser = getUserData();
    if (!currentUser?.id) {
      console.log('No user available - skipping fetchUserEvents');
      setUserEvents([]);
      return;
    }
    const userId = currentUser.id;
    console.log('Fetching events for user ID:', userId);
    try {
      const response = await fetch(`/api/user-event-interests/${userId}/${encodeURIComponent(selectedCity)}`);
      if (response.ok) {
        const events = await response.json();
        setUserEvents(events);
      }
    } catch (error) {
      console.error('Error fetching user events:', error);
      setUserEvents([]);
    }
  };

  const fetchMatchingUsers = async () => {
    const currentUser = getUserData();
    if (!currentUser?.id) return;
    try {
      const response = await fetch(`/api/city-matches/${currentUser.id}/${encodeURIComponent(selectedCity)}`);
      if (response.ok) {
        const matches = await response.json();
        setMatchingUsers(matches);
      }
    } catch (error) {
      console.error('Error fetching matching users:', error);
    }
  };

  const addActivity = async () => {
    if (!newActivityName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide activity name.",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentUser = getUserData();
      if (!currentUser?.id) {
        toast({ title: 'Error', description: 'Please refresh the page', variant: 'destructive' });
        return;
      }
      const userId = currentUser.id;

      const response = await fetch('/api/city-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId.toString()
        },
        body: JSON.stringify({
          cityName: selectedCity,
          state: allCities.find(c => c.city === selectedCity)?.state || '',
          country: allCities.find(c => c.city === selectedCity)?.country || '',
          activityName: newActivityName,
          category: 'general',
          description: newActivityDescription || 'User added activity',
          createdByUserId: userId
        }),
      });

      if (response.ok) {
        const newActivity = await response.json();
        toast({
          title: "Activity Added",
          description: "Your activity has been added successfully!",
        });
        setNewActivityName('');
        setNewActivityDescription('');
        setShowAddForm(false);
        fetchCityActivities();
        
        // Automatically add the new activity to user's personal list since they created it
        await toggleActivity(newActivity);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to add activity",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add activity",
        variant: "destructive",
      });
    }
  };

  const toggleActivity = async (activity: any) => {
    const currentUser = getUserData();
    if (!currentUser?.id) {
      toast({ title: 'Error', description: 'Please refresh the page', variant: 'destructive' });
      return;
    }
    const userId = currentUser.id;

    const isCurrentlyActive = userActivities.some(ua => ua.activityId === activity.id);

    try {
      if (isCurrentlyActive) {
        // Find the correct user activity interest record ID
        const userActivityRecord = userActivities.find(ua => ua.activityId === activity.id);
        if (!userActivityRecord) {
          toast({ title: 'Error', description: 'Could not find activity record', variant: 'destructive' });
          return;
        }
        
        // Remove activity using the user interest record ID, not the activity ID
        const response = await fetch(`/api/user-city-interests/${userActivityRecord.id}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': userId.toString()
          }
        });
        if (response.ok) {
          toast({
            title: "Interest Removed",
            description: `Removed interest in ${activity.activityName}`,
          });
          // Immediately update local state
          setUserActivities(prev => prev.filter(ua => ua.activityId !== activity.id));
          // Invalidate profile queries to refresh "Things I Want to Do"
          queryClient.invalidateQueries({ queryKey: [`/api/user-city-interests/${userId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
        }
      } else {
        // Add activity
        const response = await fetch('/api/user-city-interests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId.toString()
          },
          body: JSON.stringify({
            activityId: activity.id,
            cityName: selectedCity
          })
        });
        
        if (response.ok || response.status === 409) {
          // Handle both successful creation (200) and already exists (409) cases
          const newInterest = await response.json();
          toast({
            title: "Interest Added",
            description: `Added interest in ${activity.activityName}`,
          });
          // Immediately update local state - check if already exists first
          setUserActivities(prev => {
            const alreadyExists = prev.some(ua => ua.activityId === activity.id);
            if (alreadyExists) {
              return prev; // No need to add again
            }
            return [...prev, newInterest];
          });
          // Invalidate profile queries to refresh "Things I Want to Do"
          queryClient.invalidateQueries({ queryKey: [`/api/user-city-interests/${userId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
        } else {
          // Handle error case
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          toast({
            title: "Error",
            description: errorData.error || `Failed to add interest in ${activity.activityName}`,
            variant: "destructive",
          });
          // Refresh user activities from server to ensure accurate state
          fetchUserActivities();
        }
      }
      fetchMatchingUsers();
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to update activity interest",
        variant: "destructive",
      });
    }
  };

  const deleteActivity = async (activityId: number) => {
    const currentUser = getUserData();
    if (!currentUser?.id) {
      toast({ title: 'Error', description: 'Please refresh the page', variant: 'destructive' });
      return;
    }
    const userId = currentUser.id;

    if (!confirm('Are you sure you want to delete this activity? This will remove it for everyone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/city-activities/${activityId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId.toString()
        }
      });

      if (response.ok) {
        toast({
          title: "Activity Deleted",
          description: "Activity has been removed successfully",
        });
        // Immediately update local state
        setCityActivities(prev => prev.filter(activity => activity.id !== activityId));
        setUserActivities(prev => prev.filter(ua => ua.activityId !== activityId));
        fetchMatchingUsers();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete activity",
          variant: "destructive",
        });
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to delete activity",
        variant: "destructive",
      });
    }
  };

  const updateActivity = async () => {
    const currentUser = getUserData();
    if (!currentUser?.id) {
      toast({ title: 'Error', description: 'Please refresh the page', variant: 'destructive' });
      return;
    }
    const userId = currentUser.id;

    if (!editingActivity) {
      return;
    }

    try {
      const response = await fetch(`/api/city-activities/${editingActivity.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId.toString()
        },
        body: JSON.stringify({
          activityName: editActivityName,
          description: editActivityDescription
        })
      });



      if (response.ok) {
        const updatedActivity = await response.json();


        toast({
          title: "Activity Updated",
          description: `Updated "${editingActivity.activityName}" to "${editActivityName}"`,
        });

        // Immediately update local state
        setCityActivities(prev => prev.map(activity => 
          activity.id === editingActivity.id 
            ? { ...activity, activityName: editActivityName, description: editActivityDescription }
            : activity
        ));

        // Clear edit form
        setEditingActivity(null);
        setEditActivityName('');
        setEditActivityDescription('');


      } else {
        const error = await response.json();

        toast({
          title: "Error",
          description: error.error || "Failed to update activity",
          variant: "destructive",
        });
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to update activity",
        variant: "destructive",
      });
    }
  };

  const enhanceCityWithMoreActivities = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/city-activities/${encodeURIComponent(selectedCity)}/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': getUserData()?.id?.toString() || '0'
        }
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Activities Enhanced!",
          description: `Added ${result.addedActivities} new AI-generated activities to ${selectedCity}`,
        });
        
        // Refresh the city activities
        fetchCityActivities();
      } else {
        const error = await response.json();
        toast({
          title: "Enhancement Failed",
          description: error.error || "Failed to enhance city activities",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enhance city activities",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isActivityActive = (activityId: number) => {
    return userActivities.some(ua => ua.activityId === activityId);
  };

  const isEventActive = (eventId: number) => {
    return userEvents.some(ue => ue.eventId === eventId);
  };

  const toggleEvent = async (event: any) => {
    const currentUser = getUserData();
    if (!currentUser?.id) {
      toast({ title: 'Error', description: 'Please refresh the page', variant: 'destructive' });
      return;
    }
    const userId = currentUser.id;
    const isCurrentlyActive = userEvents.some(ue => ue.eventId === event.id);

    try {
      if (isCurrentlyActive) {
        // Remove event interest
        const response = await fetch(`/api/user-event-interests/${event.id}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': userId.toString()
          }
        });
        if (response.ok) {
          toast({
            title: "Event Interest Removed",
            description: `Removed interest in ${event.title}`,
          });
          setUserEvents(prev => prev.filter(ue => ue.eventId !== event.id));
          // Invalidate profile queries to refresh "Things I Want to Do"
          queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/all-events`] });
          queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
        }
      } else {
        // Add event interest
        const response = await fetch('/api/user-event-interests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId.toString()
          },
          body: JSON.stringify({
            eventId: event.id,
            cityName: selectedCity
          })
        });
        if (response.ok) {
          const newInterest = await response.json();
          toast({
            title: "Event Interest Added",
            description: `Added interest in ${event.title}`,
          });
          setUserEvents(prev => [...prev, newInterest]);
          // Invalidate profile queries to refresh "Things I Want to Do"
          queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/all-events`] });
          queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
        }
      }
      fetchMatchingUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update event interest",
        variant: "destructive",
      });
    }
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const joinEvent = async (eventId: number) => {
    const currentUser = getUserData();
    if (!currentUser?.id) {
      toast({ title: 'Error', description: 'Please refresh the page', variant: 'destructive' });
      return;
    }
    const userId = currentUser.id;
    
    try {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          notes: "Looking forward to attending!"
        })
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "You've successfully joined the event",
        });
        // Also add to event interests if not already added
        toggleEvent(selectedEvent);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to join event",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join event",
        variant: "destructive",
      });
    }
  };

  const handleCustomCitySearch = async (cityName: string) => {
    setSearchingCity(true);
    setSearchError('');
    
    try {
      // Set the city immediately to show the city page
      setSelectedCity(cityName);
      setCitySearchTerm(''); // Clear after setting the city
      
      // Check if the city has any activities after a short delay
      setTimeout(async () => {
        try {
          const response = await fetch(`/api/city-activities/${encodeURIComponent(cityName)}`);
          if (response.ok) {
            const activities = await response.json();
            if (activities.length === 0) {
              setSearchError(`No activities found for ${cityName}. AI might not have data for this location yet.`);
            }
          }
        } catch (error) {
          setSearchError(`Could not load data for ${cityName}. AI might not have information about this location.`);
        } finally {
          setSearchingCity(false);
        }
      }, 3000); // Give AI time to process
      
    } catch (error) {
      setSearchError(`Unable to search for ${cityName}. Please try again or choose a different city.`);
      setSearchingCity(false);
    }
  };

  console.log('🎯 RENDERING - selectedCity:', selectedCity);
  
  if (!selectedCity) {
    console.log('🎯 RENDERING: Showing city selection interface');
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        <div className="container mx-auto px-4 py-4">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white mb-4">
              🎯 City-Specific Matching
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Find People Who Want to Do What You Want to Do
            </p>
          </div>

          {/* Show loading state */}
          {citiesLoading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="text-white/70 mt-4 text-lg">Loading cities...</p>
            </div>
          ) : (
            <>
              {/* City Search */}
              <div className="mb-6">
                <div className="max-w-md mx-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
                    <Input
                      placeholder="Search cities..."
                      value={citySearchTerm}
                      onChange={(e) => setCitySearchTerm(e.target.value)}
                      className="pl-9 py-2 text-sm bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40"
                    />
                  </div>
                </div>
              </div>

              {/* Featured Los Angeles Metro - FRONT AND CENTER (Same Size) */}
              {(filteredCities.some(city => isLAAreaCity(city.city, city.state)) || filteredCities.some(city => city.city.includes("Los Angeles Metro"))) && (
            <div className="mb-12">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-white mb-4">🌟 LOS ANGELES METRO</h2>
                <p className="text-white/90 text-lg font-semibold">Full Platform Features • Most Active City</p>
              </div>
              <div className="flex justify-center mb-8">
                <div className="grid grid-cols-1 max-w-sm">
                  {filteredCities.filter(city => isLAAreaCity(city.city, city.state) || city.city.includes("Los Angeles Metro")).map((city, index) => (
                    <Card
                      key={`featured-${city.city}-${city.state}-${index}`}
                      className="group cursor-pointer transform hover:scale-105 transition-all duration-300 overflow-hidden relative bg-gradient-to-br from-orange-500/40 to-red-500/40 backdrop-blur-sm border-orange-400/80 ring-4 ring-orange-300/60 shadow-xl shadow-orange-500/50"
                      onClick={() => {
                        setSelectedCity(city.city);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <div className="relative h-32 overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                          <MapPin className="w-12 h-12 text-white/60" />
                        </div>
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 animate-pulse font-bold">
                            🌟 FEATURED
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-orange-300" />
                          <h3 className="font-semibold text-lg text-orange-100 truncate">{city.city}</h3>
                        </div>
                        <p className="text-sm text-orange-200/90 mb-3 truncate">
                          {city.state && `${city.state}, `}{city.country}
                        </p>
                        <div className="text-center mb-3">
                          <p className="text-white/80 text-xs">All features active</p>
                        </div>
                        <Button 
                          className="w-full text-sm bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCity(city.city);
                          }}
                        >
                          Explore LA Metro
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
              )}

              {/* Other Cities Grid - Bigger cards */}
              {filteredCities.filter(city => !isLAAreaCity(city.city, city.state) && !city.city.includes("Los Angeles Metro")).length > 0 && (
            <div className="mb-8">
              <div className="text-center mb-8">
                <h3 className="text-4xl font-bold text-white mb-4">Other Cities</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {filteredCities.filter(city => !isLAAreaCity(city.city, city.state) && !city.city.includes("Los Angeles Metro")).map((city, index) => (
                  <Card
                    key={`other-${city.city}-${city.state}-${index}`}
                    className="group cursor-pointer transform hover:scale-105 transition-all duration-300 overflow-hidden relative bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/40"
                    onClick={() => {
                      setSelectedCity(city.city);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <div className="relative h-32 overflow-hidden">
                      <div className={`w-full h-full bg-gradient-to-br ${city.gradient} flex items-center justify-center`}>
                        <MapPin className="w-12 h-12 text-white/60" />
                      </div>
                      <div className="absolute inset-0 bg-black/20" />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-white/80" />
                        <h3 className="font-semibold text-lg text-white truncate">{city.city}</h3>
                      </div>
                      <p className="text-sm text-white/60 mb-3 truncate">
                        {city.state && `${city.state}, `}{city.country}
                      </p>
                      <Button 
                        className="w-full text-sm bg-blue-500 hover:bg-blue-600 text-white py-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCity(city.city);
                        }}
                      >
                        Explore
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                </div>
              </div>
              )}

              {/* Search for Other Cities Tab */}
              <div className="mb-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-white mb-2">🔍 Search Any City</h3>
                  <p className="text-white/70">Don't see your city? Search for any city worldwide</p>
                </div>
                <div className="max-w-md mx-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                    <Input
                      placeholder="Type any city name (e.g., Tokyo, Paris, Sydney)..."
                      value={citySearchTerm}
                      onChange={(e) => setCitySearchTerm(e.target.value)}
                      className="pl-10 py-3 text-lg bg-white/20 border-white/30 text-white placeholder-white/50 focus:border-white/60"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && citySearchTerm.trim() && !searchingCity) {
                          handleCustomCitySearch(citySearchTerm.trim());
                        }
                      }}
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <Button 
                      onClick={() => {
                        if (citySearchTerm.trim() && !searchingCity) {
                          handleCustomCitySearch(citySearchTerm.trim());
                        }
                      }}
                      disabled={!citySearchTerm.trim() || searchingCity}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-2 flex items-center gap-2"
                    >
                      {searchingCity ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Searching...
                        </>
                      ) : (
                        'Search This City'
                      )}
                    </Button>
                  </div>
                  
                  {/* Search Status Messages */}
                  {searchingCity && (
                    <div className="mt-4 p-4 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-200">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-200"></div>
                        <p className="text-sm font-medium">Searching for city data...</p>
                      </div>
                      <p className="text-xs text-blue-300 mt-1">AI is generating activities and events for {selectedCity}. This may take a few moments.</p>
                    </div>
                  )}
                  
                  {searchError && (
                    <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
                      <div className="text-yellow-200">
                        <p className="text-sm font-medium">Limited Results Found</p>
                        <p className="text-xs text-yellow-300 mt-1">{searchError}</p>
                        <p className="text-xs text-yellow-300 mt-2">AI isn't always perfect at finding city data. You can still explore the city and add your own activities!</p>
                      </div>
                    </div>
                  )}
                  </div>
                </CardContent>
              </Card>
            </div>
            </>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => {
              // Navigate back to city match selection page
              setSelectedCity('');
            }}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Cities
          </Button>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center`}>
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{selectedCity}</h1>
                <p className="text-white/70">Add activities and events. Others click to match!</p>
              </div>
            </div>

            {/* Simplified city display - no photo upload */}
            <div className="flex items-center gap-2">
              <div className="text-white/60 text-sm">
                Activity matching for {selectedCity}
              </div>
            </div>
          </div>
        </div>

        {/* Removed problematic photo gallery */}

        {/* HOW MATCHING WORKS - Small compact widget */}
        <Card className="mb-3 bg-white/5 backdrop-blur-sm border-white/10 max-w-2xl">
          <CardContent className="p-3">
            <div className="text-white/80 text-xs">
              <strong className="text-blue-400">Quick Start:</strong> Click blue activities below to add them to your profile, then see who else wants to do the same things in {selectedCity}!
            </div>
          </CardContent>
        </Card>




        {/* Global Activities Section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white mb-2">🌍 All {selectedCity} Activities ({cityActivities.length})</h2>
          <Button
            onClick={() => enhanceCityWithMoreActivities()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-4 py-2 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            disabled={isLoading}
          >
            🤖 Get More AI Activities
          </Button>
        </div>

        {/* Global Activities Section */}
        <div className="bg-gray-800/60 rounded-lg p-4 mb-6">
          <h3 className="text-blue-400 font-semibold text-lg mb-3">
            Everyone can add/edit activities for {selectedCity}
          </h3>
          <div className="text-gray-300 text-sm mb-3">
            🔵 Click blue activities to add them to your personal list below • ✏️ Edit/delete to change for EVERYONE
          </div>

          {/* Add Activity Section - Moved above activities */}
          <div className="mb-4" data-add-activity-section>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
              <h3 className="text-white text-sm font-medium mb-2">+ Add Activity</h3>
              <div className="space-y-2">
                <Input
                  placeholder="Add activity or event"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  className="w-full bg-white/10 border-white/20 text-white placeholder-white/40 text-sm h-8"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newActivityName.trim()) {
                      addActivity();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Optional description"
                    value={newActivityDescription}
                    onChange={(e) => setNewActivityDescription(e.target.value)}
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder-white/40 text-sm h-8"
                  />
                  <Button
                    onClick={addActivity}
                    disabled={!newActivityName.trim() || isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 h-8 text-sm"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>



          <TooltipProvider>
            <div className="flex flex-wrap gap-2">
              {cityActivities.map((activity) => {
                const isActive = isActivityActive(activity.id);

                return (
                  <div key={activity.id} className="relative group">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => toggleActivity(activity)}
                          className="px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md border border-blue-400/20"
                          style={{ color: '#ffffff !important' }}
                        >
                          {activity.activityName}
                          {activity.description && (
                            <Info className="w-3 h-3 ml-1 opacity-60" />
                          )}
                        </button>
                      </TooltipTrigger>
                      {activity.description && (
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">{activity.description}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>

                    {/* Edit/Delete on hover */}
                    <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingActivity(activity);
                          setEditActivityName(activity.activityName);
                          setEditActivityDescription(activity.description || '');
                        }}
                        className="w-5 h-5 bg-blue-600 hover:bg-blue-700 rounded-full text-white text-xs flex items-center justify-center"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteActivity(activity.id);
                        }}
                        className="w-5 h-5 bg-red-600 hover:bg-red-700 rounded-full text-white text-xs flex items-center justify-center"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}

            {/* Add new activity */}
            <button
              onClick={() => {
                // Scroll to the text input section
                const addActivitySection = document.querySelector('[data-add-activity-section]');
                if (addActivitySection) {
                  addActivitySection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                  });
                  // Focus the input field after scrolling
                  setTimeout(() => {
                    const input = addActivitySection.querySelector('input');
                    if (input) input.focus();
                  }, 500);
                }
              }}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-600 hover:bg-gray-500 text-white border-2 border-dashed border-gray-400"
            >
              + Add Activity
            </button>
            </div>
          </TooltipProvider>



          {/* Edit Activity Form */}
          {editingActivity && (
            <div className="mt-4 pt-4 border-t border-gray-600">
              <h4 className="text-white font-medium mb-2">Edit Activity</h4>
              <div className="space-y-2">
                <Input
                  placeholder="Activity name..."
                  value={editActivityName}
                  onChange={(e) => setEditActivityName(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-white/60"
                  autoFocus
                />
                <Textarea
                  placeholder="Description required - details about this activity..."
                  value={editActivityDescription}
                  onChange={(e) => setEditActivityDescription(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-white/60 resize-none h-20"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={updateActivity}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={!editActivityName.trim() || !editActivityDescription.trim()}
                  >
                    Update Activity
                  </Button>
                  <Button 
                    onClick={() => {
                      setEditingActivity(null);
                      setEditActivityName('');
                      setEditActivityDescription('');
                    }}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>



        {cityActivities.length === 0 && (
          <div className="text-center py-8 text-white/60">
            <h3 className="text-lg font-semibold mb-2">No activities yet in {selectedCity}</h3>
            <p className="text-sm">Be the first to add activities!</p>
          </div>
        )}

        {/* Events Section  */}
        <div className="mt-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white mb-2">🎉 Events in {selectedCity} ({cityEvents.length})</h2>
          </div>

          <div className="bg-gray-800/60 rounded-lg p-4 mb-6">
            <h3 className="text-red-400 font-semibold text-lg mb-3">
              {selectedCity} Events
            </h3>

            <TooltipProvider>
              <div className="flex flex-wrap gap-2">
                {cityEvents.map((event) => {
                  const isActive = isEventActive(event.id);

                  return (
                    <div key={event.id} className="relative group">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEventClick(event)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 cursor-pointer hover:shadow-md ${
                                isActive 
                                  ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg border border-green-400/20' 
                                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-sm border border-red-400/20'
                              }`}
                              style={{ color: '#ffffff' }}
                            >
                              <span className="text-xs opacity-75">
                                {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
                              </span>
                              <span className="mx-1">•</span>
                              {event.title}
                              <Info className="w-3 h-3 ml-1 opacity-60" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEvent(event);
                              }}
                              className={`w-6 h-6 rounded-full text-xs font-bold transition-all duration-200 ${
                                isActive 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-gray-500 hover:bg-gray-600 text-white'
                              }`}
                              title={isActive ? "Remove Interest" : "Add Interest"}
                            >
                              {isActive ? '✓' : '+'}
                            </button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm font-medium">Click event name to view details and join</p>
                          <p className="text-xs text-gray-400 mt-1">Click + to add interest without joining</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            </TooltipProvider>

            {cityEvents.length === 0 && (
              <div className="text-center py-8 text-white/60">
                <h3 className="text-lg font-semibold mb-2">No events yet in {selectedCity}</h3>
                <p className="text-sm">Events created by users will appear here!</p>
              </div>
            )}
          </div>
        </div>

        {/* My Personal Selections Section */}
        <Card className="mb-6 bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="w-5 h-5" />
              My Selected Activities in {selectedCity}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white/80 text-sm mb-3">
              Activities you've selected that appear on your profile:
            </div>
            {userActivities.length === 0 && userEvents.length === 0 ? (
              <p className="text-white/60 text-sm italic">Click blue activities above to add them to your list!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {/* User Activities */}
                {userActivities.map((userActivity) => {
                  const globalActivity = cityActivities.find(ca => ca.id === userActivity.activityId);
                  if (!globalActivity) return null;
                  
                  return (
                    <div
                      key={`activity-${userActivity.id}`}
                      className="relative group px-3 py-1 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white border border-purple-400/30 shadow-sm"
                    >
                      <span>{globalActivity.activityName}</span>
                      <button
                        onClick={() => toggleActivity(globalActivity)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                        title="Remove activity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
                
                {/* User Events */}
                {userEvents.map((userEvent) => {
                  const globalEvent = cityEvents.find(ce => ce.id === userEvent.eventId);
                  if (!globalEvent) {
                    console.log(`🔍 Event not found: ${userEvent.eventId} in`, cityEvents.map(ce => ce.id));
                    console.log(`🎪 Available userEvent data:`, userEvent);
                    // Show user event even if global event not found - with remove button
                    return (
                      <div
                        key={`event-${userEvent.id}`}
                        className="relative group px-3 py-1 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white border border-purple-400/30 shadow-sm"
                      >
                        <span>📅 {userEvent.eventtitle || userEvent.eventTitle || (userEvent.eventId ? `Event ${userEvent.eventId}` : "Saved Event")}</span>
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/user-event-interests/${userEvent.id}`, {
                                method: 'DELETE',
                                headers: { 'x-user-id': getUserData()?.id?.toString() || '0' }
                              });
                              if (response.ok) {
                                setUserEvents(prev => prev.filter(ue => ue.id !== userEvent.id));
                                queryClient.invalidateQueries({ queryKey: [`/api/users/${getUserData()?.id}/all-events`] });
                                toast({ title: "Removed", description: "Event removed from your list" });
                              }
                            } catch (error) {
                              toast({ title: "Error", description: "Failed to remove event", variant: "destructive" });
                            }
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                          title="Remove event"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  }
                  
                  return (
                    <div
                      key={`event-${userEvent.id}`}
                      className="relative group px-3 py-1 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white border border-purple-400/30 shadow-sm"
                    >
                      <span>📅 {globalEvent.title}</span>
                      <button
                        onClick={() => toggleEvent(globalEvent)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                        title="Remove event"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Matching Users Section */}
        <div className="mt-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                People Interested ({(matchingUsers || []).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(matchingUsers || []).length === 0 ? (
                <div className="text-center py-6 text-white/60">
                  <Users className="w-12 h-12 mx-auto opacity-30 mb-3" />
                  <p className="text-sm">Add activities and events to find people with similar interests!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(matchingUsers || []).slice(0, 5).map((user: any, index: number) => (
                    <div key={user.id || index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{user.username || 'Anonymous'}</div>
                        {user.sharedActivityNames && Array.isArray(user.sharedActivityNames) && user.sharedActivityNames.length > 0 && (
                          <div className="text-white/50 text-xs mt-1">
                            Both interested in: {(user.sharedActivityNames || []).slice(0, 2).join(', ')}
                            {(user.sharedActivityNames || []).length > 2 && ` +${(user.sharedActivityNames || []).length - 2} more`}
                          </div>
                        )}
                        <div className="text-white/60 text-xs">
                          {user.commonActivities || 1} shared interest{(user.commonActivities || 1) === 1 ? '' : 's'}
                          {user.matchStrength && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                              user.matchStrength >= 3 ? 'bg-green-500/20 text-green-300' :
                              user.matchStrength >= 2 ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-blue-500/20 text-blue-300'
                            }`}>
                              {user.matchStrength >= 3 ? 'High Match' : 
                               user.matchStrength >= 2 ? 'Good Match' : 
                               'Potential Match'}
                            </span>
                          )}
                        </div>
                      </div>
                      {(() => {
                        // Check if user is already connected
                        const isConnected = connections.some(conn => 
                          conn.connectedUser?.id === user.id && conn.status === 'accepted'
                        );
                        // Special case for nearbytraveler (user id 1)
                        const isNearbyTraveler = user.id === 1;
                        
                        if (isConnected || isNearbyTraveler) {
                          return (
                            <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" disabled>
                              Connected
                            </Button>
                          );
                        }
                        return (
                          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                            Connect
                          </Button>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Event Details Modal */}
        {selectedEvent && (
          <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  🎉 {selectedEvent.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex gap-2">
                  <Badge className="bg-blue-500 text-white" variant="secondary">
                    {selectedEvent.category || 'Event'}
                  </Badge>
                  <Badge variant="outline">
                    {selectedEvent.city}
                  </Badge>
                  {selectedEvent.participantCount && (
                    <Badge variant="outline">
                      {selectedEvent.participantCount} attending
                    </Badge>
                  )}
                </div>
                
                {selectedEvent.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {/* Date & Time - CRITICAL MISSING INFO */}
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-500 mt-1">📅</div>
                    <div>
                      <p className="font-medium text-black dark:text-white">Date & Time</p>
                      <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                        {selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Date not specified'}
                      </p>
                      {selectedEvent.date && (
                        <div className="space-y-1">
                          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                            Start Time: {new Date(selectedEvent.date).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                          {selectedEvent.endDate && (
                            <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                              End Time: {new Date(selectedEvent.endDate).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location & Address - CRITICAL MISSING INFO */}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <p className="font-medium text-black dark:text-white">Location & Address</p>
                      {selectedEvent.streetAddress ? (
                        <div className="text-sm text-gray-700 dark:text-gray-200">
                          <p className="font-medium">{selectedEvent.streetAddress}</p>
                          <p>{selectedEvent.city}, {selectedEvent.state} {selectedEvent.zipCode}</p>
                          <p>{selectedEvent.country}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                          {selectedEvent.city}, {selectedEvent.state}
                          {selectedEvent.zipCode && ` ${selectedEvent.zipCode}`}
                          {selectedEvent.country && `, ${selectedEvent.country}`}
                        </p>
                      )}
                      {selectedEvent.venue && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          Venue: {selectedEvent.venue}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Additional Event Details */}
                  {selectedEvent.organizer && (
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-gray-500 mt-1" />
                      <div>
                        <p className="font-medium text-black dark:text-white">Organizer</p>
                        <p className="text-sm text-gray-700 dark:text-gray-200">{selectedEvent.organizer}</p>
                        {selectedEvent.organizerContact && (
                          <p className="text-xs text-gray-600 dark:text-gray-300">{selectedEvent.organizerContact}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedEvent.requirements && (
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-gray-500 mt-1" />
                      <div>
                        <p className="font-medium text-black dark:text-white">Requirements</p>
                        <p className="text-sm text-gray-700 dark:text-gray-200">{selectedEvent.requirements}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Event Organizer */}
                {selectedEvent.organizerName && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Organized by</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedEvent.organizerName[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200">{selectedEvent.organizerName}</p>
                        <p className="text-sm text-blue-600 dark:text-blue-300">Event Organizer</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    onClick={() => {
                      const venueQuery = selectedEvent.venueName ? `${selectedEvent.title} ${selectedEvent.venueName}` : selectedEvent.title;
                      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(venueQuery + ' tickets event')}`;
                      window.open(searchUrl, '_blank');
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Get Tickets & Info
                  </Button>
                  <Button 
                    onClick={() => {
                      toggleEvent(selectedEvent);
                      setShowEventModal(false);
                    }}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    {isEventActive(selectedEvent.id) ? 'Remove Interest' : 'Add Interest'}
                  </Button>
                </div>

                {/* Share Event */}
                <div className="text-center pt-2 border-t">
                  <p className="text-sm text-gray-500 mb-2">Share this event with friends</p>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/event-details/${selectedEvent.id}`;
                      navigator.clipboard.writeText(shareUrl);
                      toast({
                        title: "Link Copied!",
                        description: "Event link has been copied to clipboard",
                      });
                    }}
                  >
                    📋 Copy Event Link
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </div>
  );
}