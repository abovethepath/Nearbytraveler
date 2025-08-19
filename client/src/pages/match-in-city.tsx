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
      console.log(`🃏 FRONTEND: Fetching activities for city: "${selectedCity}"`);
      const response = await fetch(`/api/city-activities/${encodeURIComponent(selectedCity)}`);
      console.log(`🃏 FRONTEND: Response status:`, response.status);
      
      if (response.ok) {
        const activities = await response.json();
        console.log(`🃏 FRONTEND: Got ${activities.length} activities for ${selectedCity}:`, activities);
        setCityActivities(activities);
      } else {
        console.error(`🃏 FRONTEND: Error response:`, response.status, response.statusText);
        const errorText = await response.text();
        console.error(`🃏 FRONTEND: Error details:`, errorText);
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
        
        // Refresh city activities
        fetchCityActivities();
      } else {
        const errorData = await response.text();
        console.error('Error adding activity:', response.status, errorData);
        toast({
          title: "Error",
          description: "Failed to add activity. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Network error adding activity:', error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    }
  };

  const editActivity = async () => {
    if (!editActivityName.trim()) {
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

      const response = await fetch(`/api/city-activities/${editingActivity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString()
        },
        body: JSON.stringify({
          activityName: editActivityName,
          description: editActivityDescription || 'User edited activity'
        }),
      });

      if (response.ok) {
        toast({
          title: "Activity Updated",
          description: "Your activity has been updated successfully!",
        });
        setEditActivityName('');
        setEditActivityDescription('');
        setEditingActivity(null);
        
        // Refresh city activities
        fetchCityActivities();
      } else {
        const errorData = await response.text();
        console.error('Error editing activity:', response.status, errorData);
        toast({
          title: "Error",
          description: "Failed to update activity. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Network error editing activity:', error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteActivity = async (activityId: number) => {
    if (!confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    try {
      const currentUser = getUserData();
      if (!currentUser?.id) {
        toast({ title: 'Error', description: 'Please refresh the page', variant: 'destructive' });
        return;
      }

      const response = await fetch(`/api/city-activities/${activityId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser.id.toString()
        },
      });

      if (response.ok) {
        toast({
          title: "Activity Deleted",
          description: "Activity has been removed successfully!",
        });
        // Refresh city activities
        fetchCityActivities();
      } else {
        const errorData = await response.text();
        console.error('Error deleting activity:', response.status, errorData);
        toast({
          title: "Error", 
          description: "Failed to delete activity. You can only delete your own activities.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Network error deleting activity:', error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    }
  };

  const joinActivity = async (activityId: number, activityName: string) => {
    try {
      const currentUser = getUserData();
      if (!currentUser?.id) {
        toast({ title: 'Error', description: 'Please refresh the page', variant: 'destructive' });
        return;
      }
      const userId = currentUser.id;

      const response = await fetch('/api/user-city-interests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId.toString()
        },
        body: JSON.stringify({
          userId: userId,
          activityId: activityId,
          cityName: selectedCity,
          activityName: activityName
        }),
      });

      if (response.ok) {
        toast({
          title: "Joined Activity",
          description: `You've joined the activity: ${activityName}`,
        });
        
        // Refresh user activities and matching users
        fetchUserActivities();
        fetchMatchingUsers();
      } else {
        const errorData = await response.text();
        console.error('Error joining activity:', response.status, errorData);
        toast({
          title: "Error",
          description: "Failed to join activity. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Network error joining activity:', error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    }
  };

  const leaveActivity = async (userActivityId: number, activityName: string) => {
    try {
      const currentUser = getUserData();
      if (!currentUser?.id) {
        toast({ title: 'Error', description: 'Please refresh the page', variant: 'destructive' });
        return;
      }

      const response = await fetch(`/api/user-city-interests/${userActivityId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser.id.toString()
        },
      });

      if (response.ok) {
        toast({
          title: "Left Activity",
          description: `You've left the activity: ${activityName}`,
        });
        
        // Refresh user activities and matching users
        fetchUserActivities();
        fetchMatchingUsers();
      } else {
        const errorData = await response.text();
        console.error('Error leaving activity:', response.status, errorData);
        toast({
          title: "Error",
          description: "Failed to leave activity. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Network error leaving activity:', error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    }
  };

  const joinEvent = async (eventId: number, eventTitle: string) => {
    try {
      const currentUser = getUserData();
      if (!currentUser?.id) {
        toast({ title: 'Error', description: 'Please refresh the page', variant: 'destructive' });
        return;
      }
      const userId = currentUser.id;

      const response = await fetch('/api/user-event-interests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId.toString()
        },
        body: JSON.stringify({
          userId: userId,
          eventId: eventId,
          cityName: selectedCity,
          eventTitle: eventTitle
        }),
      });

      if (response.ok) {
        toast({
          title: "Interested in Event",
          description: `You've shown interest in: ${eventTitle}`,
        });
        
        // Refresh user events and matching users
        fetchUserEvents();
        fetchMatchingUsers();
      } else {
        const errorData = await response.text();
        console.error('Error showing interest in event:', response.status, errorData);
        toast({
          title: "Error",
          description: "Failed to show interest in event. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Network error joining event:', error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    }
  };

  const leaveEvent = async (userEventId: number, eventTitle: string) => {
    try {
      const currentUser = getUserData();
      if (!currentUser?.id) {
        toast({ title: 'Error', description: 'Please refresh the page', variant: 'destructive' });
        return;
      }

      const response = await fetch(`/api/user-event-interests/${userEventId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser.id.toString()
        },
      });

      if (response.ok) {
        toast({
          title: "Removed Interest",
          description: `You've removed interest from: ${eventTitle}`,
        });
        
        // Refresh user events and matching users
        fetchUserEvents();
        fetchMatchingUsers();
      } else {
        const errorData = await response.text();
        console.error('Error removing interest from event:', response.status, errorData);
        toast({
          title: "Error",
          description: "Failed to remove interest. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Network error leaving event:', error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isUserJoinedActivity = (activityId: number) => {
    return userActivities.some(ua => ua.activityId === activityId);
  };

  const isUserJoinedEvent = (eventId: number) => {
    return userEvents.some(ue => ue.eventId === eventId);
  };

  const getUserActivityId = (activityId: number) => {
    const userActivity = userActivities.find(ua => ua.activityId === activityId);
    return userActivity ? userActivity.id : null;
  };

  const getUserEventId = (eventId: number) => {
    const userEvent = userEvents.find(ue => ue.eventId === eventId);
    return userEvent ? userEvent.id : null;
  };

  const isConnected = (userId: number) => {
    return connections.some(conn => 
      (conn.requesterId === user?.id && conn.recipientId === userId) || 
      (conn.recipientId === user?.id && conn.requesterId === userId)
    );
  };

  const sendConnectionRequest = async (recipientId: number, recipientName: string) => {
    try {
      const currentUser = getUserData();
      if (!currentUser?.id) {
        toast({ title: 'Error', description: 'Please refresh the page', variant: 'destructive' });
        return;
      }

      const response = await fetch('/api/connections/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString()
        },
        body: JSON.stringify({
          requesterId: currentUser.id,
          recipientId: recipientId
        }),
      });

      if (response.ok) {
        toast({
          title: "Connection Request Sent",
          description: `Connection request sent to ${recipientName}`,
        });
        
        // Refresh connections
        fetchConnections();
      } else {
        const errorData = await response.text();
        console.error('Error sending connection request:', response.status, errorData);
        toast({
          title: "Error",
          description: "Failed to send connection request. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Network error sending connection request:', error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startEditingActivity = (activity: any) => {
    setEditingActivity(activity);
    setEditActivityName(activity.activityName);
    setEditActivityDescription(activity.description);
  };

  const cancelEditing = () => {
    setEditingActivity(null);
    setEditActivityName('');
    setEditActivityDescription('');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">Please log in to access city matching</p>
          <Button onClick={() => setLocation('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden break-words">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Section */}
        <div className="overflow-hidden break-words">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">City Connections</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Find activities, events, and connect with like-minded people</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation('/')}
              className="hidden sm:flex"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>

          {/* City Selection */}
          <Card className="overflow-hidden break-words">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                Select a City
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 break-words overflow-hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search cities..."
                  value={citySearchTerm}
                  onChange={(e) => setCitySearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {citiesLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                  {filteredCities.slice(0, 20).map((city) => (
                    <div
                      key={`${city.city}-${city.state}`}
                      onClick={() => setSelectedCity(city.city)}
                      className={`relative cursor-pointer rounded-xl border-2 p-3 transition-all hover:shadow-lg ${
                        selectedCity === city.city
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 hover:dark:border-gray-600'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${city.gradient} opacity-10 rounded-xl`}></div>
                      <div className="relative z-10">
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {city.city}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {city.state}, {city.country}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="inline-flex items-center justify-center h-7 rounded-full px-3 text-[11px] font-medium whitespace-nowrap leading-none bg-blue-500 text-white border-0">
                            <Users className="w-3 h-3 mr-1" />
                            {city.userCount || 0}
                          </div>
                          {isLAAreaCity(city.city, city.state) && (
                            <div className="inline-flex items-center justify-center h-7 rounded-full px-3 text-[11px] font-medium whitespace-nowrap leading-none bg-orange-500 text-white border-0">
                              🔥 Hot
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* City Content */}
        {selectedCity && (
          <div className="space-y-6 overflow-hidden break-words">
            {/* Activities Section */}
            <Card className="overflow-hidden break-words">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-500" />
                    Activities in {selectedCity}
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Activity
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 break-words overflow-hidden">
                {/* Add Activity Form */}
                {showAddForm && (
                  <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20 space-y-4">
                    <Input
                      placeholder="Activity name"
                      value={newActivityName}
                      onChange={(e) => setNewActivityName(e.target.value)}
                    />
                    <Textarea
                      placeholder="Activity description (optional)"
                      value={newActivityDescription}
                      onChange={(e) => setNewActivityDescription(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addActivity}>
                        Add Activity
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Your Activities */}
                {userActivities.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      Your Activities ({userActivities.length})
                    </h4>
                    <div className="flex flex-wrap gap-2 overflow-hidden break-words">
                      {userActivities.map((activity) => (
                        <div key={activity.id} className="inline-flex items-center justify-center h-7 rounded-full px-3 text-[11px] font-medium whitespace-nowrap leading-none bg-red-500 text-white border-0">
                          {activity.activityName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Activities */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">All Activities ({cityActivities.length})</h4>
                  {cityActivities.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No activities found in {selectedCity}. Be the first to add one!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {cityActivities.map((activity) => (
                        <div key={activity.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow break-words overflow-hidden">
                          {editingActivity?.id === activity.id ? (
                            <div className="space-y-3">
                              <Input
                                value={editActivityName}
                                onChange={(e) => setEditActivityName(e.target.value)}
                                className="font-medium"
                              />
                              <Textarea
                                value={editActivityDescription}
                                onChange={(e) => setEditActivityDescription(e.target.value)}
                                className="min-h-[60px]"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={editActivity}>
                                  Save Changes
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEditing}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-gray-900 dark:text-white break-words">
                                    {activity.activityName}
                                  </h5>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 break-words">
                                    {activity.description}
                                  </p>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <div className="inline-flex items-center justify-center h-7 rounded-full px-3 text-[11px] font-medium whitespace-nowrap leading-none bg-gray-500 text-white border-0">
                                      {activity.category}
                                    </div>
                                    <div className="inline-flex items-center justify-center h-7 rounded-full px-3 text-[11px] font-medium whitespace-nowrap leading-none bg-blue-500 text-white border-0">
                                      <Users className="w-3 h-3 mr-1" />
                                      {activity.participantCount || 0} joined
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  {user?.id === activity.createdByUserId && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => startEditingActivity(activity)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => deleteActivity(activity.id)}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                  {isUserJoinedActivity(activity.id) ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => leaveActivity(getUserActivityId(activity.id)!, activity.activityName)}
                                      className="border-red-500 text-red-600 hover:bg-red-50"
                                    >
                                      Leave
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => joinActivity(activity.id, activity.activityName)}
                                      className="bg-green-500 hover:bg-green-600 text-white"
                                    >
                                      Join
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Events Section */}
            <Card className="overflow-hidden break-words">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-500" />
                  Events in {selectedCity}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 break-words overflow-hidden">
                {/* Your Events */}
                {userEvents.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      Your Events ({userEvents.length})
                    </h4>
                    <div className="flex flex-wrap gap-2 overflow-hidden break-words">
                      {userEvents.map((event) => (
                        <div key={event.id} className="inline-flex items-center justify-center h-7 rounded-full px-3 text-[11px] font-medium whitespace-nowrap leading-none bg-purple-500 text-white border-0">
                          {event.eventTitle}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Events */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">All Events ({cityEvents.length})</h4>
                  {cityEvents.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No events found in {selectedCity}.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {cityEvents.map((event) => (
                        <div key={event.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer break-words overflow-hidden" onClick={() => { setSelectedEvent(event); setShowEventModal(true); }}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 dark:text-white break-words">
                                {event.title}
                              </h5>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 break-words">
                                {event.description}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <div className="inline-flex items-center justify-center h-7 rounded-full px-3 text-[11px] font-medium whitespace-nowrap leading-none bg-purple-500 text-white border-0">
                                  {new Date(event.date).toLocaleDateString()}
                                </div>
                                <div className="inline-flex items-center justify-center h-7 rounded-full px-3 text-[11px] font-medium whitespace-nowrap leading-none bg-blue-500 text-white border-0">
                                  <Users className="w-3 h-3 mr-1" />
                                  {event.interestedCount || 0} interested
                                </div>
                              </div>
                            </div>
                            <div className="ml-4">
                              {isUserJoinedEvent(event.id) ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    leaveEvent(getUserEventId(event.id)!, event.title);
                                  }}
                                  className="border-red-500 text-red-600 hover:bg-red-50"
                                >
                                  Not Interested
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    joinEvent(event.id, event.title);
                                  }}
                                  className="bg-purple-500 hover:bg-purple-600 text-white"
                                >
                                  Interested
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Matching Users Section */}
            <Card className="overflow-hidden break-words">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  People with Similar Interests ({matchingUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 break-words overflow-hidden">
                {matchingUsers.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No matching users found in {selectedCity}. Join some activities to find people with similar interests!
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {matchingUsers.map((match) => (
                      <div
                        key={match.userId}
                        className="rounded-xl border p-3 hover:shadow-sm bg-white dark:bg-gray-800 cursor-pointer flex flex-col items-center text-center gap-2"
                        onClick={() => setLocation(`/profile/${match.userId}`)}
                      >
                        <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                          {match.name ? match.name.charAt(0).toUpperCase() : match.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="w-full">
                          <p className="font-medium text-sm truncate text-gray-900 dark:text-white">
                            {match.name || match.username}
                          </p>
                          <p className="text-xs truncate text-gray-500 dark:text-gray-400">
                            {match.location || 'Location not set'}
                          </p>
                          <div className="inline-flex items-center justify-center h-7 rounded-full px-3 text-[11px] font-medium whitespace-nowrap leading-none bg-green-500 text-white border-0 mt-1">
                            {match.sharedActivities} shared
                          </div>
                        </div>
                        {!isConnected(match.userId) && match.userId !== user?.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="hidden sm:inline-flex h-8 px-3 text-xs bg-blue-500 hover:bg-blue-600 text-white border-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendConnectionRequest(match.userId, match.name || match.username);
                            }}
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-lg overflow-hidden break-words">
          <DialogHeader>
            <DialogTitle className="break-words">
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 break-words overflow-hidden">
              <p className="text-gray-600 dark:text-gray-300 break-words">
                {selectedEvent.description}
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center justify-center h-7 rounded-full px-3 text-[11px] font-medium whitespace-nowrap leading-none bg-purple-500 text-white border-0">
                  📅 {new Date(selectedEvent.date).toLocaleDateString()}
                </div>
                {selectedEvent.time && (
                  <div className="inline-flex items-center justify-center h-7 rounded-full px-3 text-[11px] font-medium whitespace-nowrap leading-none bg-blue-500 text-white border-0">
                    🕒 {selectedEvent.time}
                  </div>
                )}
                {selectedEvent.location && (
                  <div className="inline-flex items-center justify-center h-7 rounded-full px-3 text-[11px] font-medium whitespace-nowrap leading-none bg-gray-500 text-white border-0 break-words">
                    📍 {selectedEvent.location}
                  </div>
                )}
              </div>
              {selectedEvent.price && (
                <div className="inline-flex items-center justify-center h-7 rounded-full px-3 text-[11px] font-medium whitespace-nowrap leading-none bg-green-500 text-white border-0">
                  💰 {selectedEvent.price}
                </div>
              )}
              <div className="flex gap-2 pt-4">
                {isUserJoinedEvent(selectedEvent.id) ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      leaveEvent(getUserEventId(selectedEvent.id)!, selectedEvent.title);
                      setShowEventModal(false);
                    }}
                    className="border-red-500 text-red-600 hover:bg-red-50"
                  >
                    Not Interested
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      joinEvent(selectedEvent.id, selectedEvent.title);
                      setShowEventModal(false);
                    }}
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    I'm Interested
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowEventModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}