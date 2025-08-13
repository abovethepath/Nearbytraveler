import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
  Info
} from "lucide-react";
import { CityPhotoUploadWidget } from "@/components/CityPhotoUploadWidget";

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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [allCities, setAllCities] = useState<any[]>([]);
  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [cityPhotos, setCityPhotos] = useState<any>({});
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);


  // Fetch all cities and photos on component mount
  useEffect(() => {
    fetchAllCities();
    fetchCityPhotos();
  }, []);

  // Fetch city activities and events when a city is selected
  useEffect(() => {
    if (selectedCity) {
      fetchCityActivities();
      fetchUserActivities();
      fetchCityEvents();
      fetchUserEvents();
      fetchMatchingUsers();
    }
  }, [selectedCity]);

  // Filter cities based on search
  useEffect(() => {
    if (citySearchTerm) {
      const filtered = allCities.filter(city => 
        city.city.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
        city.state.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
        city.country.toLowerCase().includes(citySearchTerm.toLowerCase())
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities(allCities);
    }
  }, [citySearchTerm, allCities]);

  const fetchCityPhotos = async () => {
    try {
      const response = await fetch('/api/city-photos/all');
      if (response.ok) {
        const photos = await response.json();
        console.log('📸 CITY PHOTOS: Fetched all photos:', photos);
        setCityPhotos(photos);
      }
    } catch (error) {
      console.error('Error fetching city photos:', error);
    }
  };

  // Get photo URL for a city
  const getCityPhotoUrl = (cityName: string) => {
    if (!cityPhotos || !Array.isArray(cityPhotos)) return null;

    console.log(`🔍 Looking for photo for: ${cityName}`);
    console.log(`📷 Available photos:`, cityPhotos.length);

    // Find photos for this city (exact match first)
    let matchingPhotos = cityPhotos.filter((photo: any) => 
      photo.city && photo.city.toLowerCase() === cityName.toLowerCase()
    );

    // If no exact match, try partial matches
    if (matchingPhotos.length === 0) {
      matchingPhotos = cityPhotos.filter((photo: any) => 
        photo.city && (
          photo.city.toLowerCase().includes(cityName.toLowerCase()) ||
          cityName.toLowerCase().includes(photo.city.toLowerCase())
        )
      );
    }

    if (matchingPhotos.length > 0) {
      // Use the most recent photo (highest ID)
      const photo = matchingPhotos.sort((a: any, b: any) => b.id - a.id)[0];
      console.log(`✅ Found photo for ${cityName}:`, photo.city);
      return photo.imageUrl || photo.imageData;
    }

    console.log(`❌ No photo found for ${cityName}`);
    return null;
  };

  const fetchAllCities = async () => {
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

          // Dynamic gradient colors - removed pink overtones
          const gradients = [
            'from-orange-400 via-red-500 to-purple-600',
            'from-blue-400 via-purple-500 to-indigo-600', 
            'from-yellow-400 via-orange-500 to-red-600',
            'from-gray-400 via-blue-500 to-purple-600',
            'from-red-400 via-orange-500 to-yellow-600',
            'from-orange-400 via-yellow-500 to-red-600',
            'from-green-400 via-blue-500 to-purple-600',
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
    // Force user ID to 1 for now to fix authentication issue
    const userId = user?.id || 1;


    try {
      const response = await fetch(`/api/user-city-interests/${userId}/${encodeURIComponent(selectedCity)}`);
      if (response.ok) {
        const activities = await response.json();

        setUserActivities(activities);
      }
    } catch (error) {
      console.error('Error fetching user activities:', error);
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
    const userId = user?.id || 1;
    try {
      const response = await fetch(`/api/user-event-interests/${userId}/${encodeURIComponent(selectedCity)}`);
      if (response.ok) {
        const events = await response.json();
        setUserEvents(events);
      }
    } catch (error) {
      console.error('Error fetching user events:', error);
    }
  };

  const fetchMatchingUsers = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/city-matches/${user.id}/${encodeURIComponent(selectedCity)}`);
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
      // Force user ID to 1 for testing authentication bypass
      const userId = user?.id || 1;

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
        toast({
          title: "Activity Added",
          description: "Your activity has been added successfully!",
        });
        setNewActivityName('');
        setNewActivityDescription('');
        setShowAddForm(false);
        fetchCityActivities();
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
    // Force user ID to 1 for now to fix authentication issue
    const userId = user?.id || 1;

    const isCurrentlyActive = userActivities.some(ua => ua.activityId === activity.id);

    try {
      if (isCurrentlyActive) {
        // Remove activity
        const response = await fetch(`/api/user-city-interests/${activity.id}`, {
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
        if (response.ok) {
          const newInterest = await response.json();
          toast({
            title: "Interest Added",
            description: `Added interest in ${activity.activityName}`,
          });
          // Immediately update local state
          setUserActivities(prev => [...prev, newInterest]);
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
    // Force user ID to 1 for now to fix authentication issue
    const userId = user?.id || 1;

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
    // Force user ID to 1 for now to fix authentication issue
    const userId = user?.id || 1;

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
          'x-user-id': (user?.id || 1).toString()
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

  if (!selectedCity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-full">
                <Target className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              🎯 City-Specific Matching
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Find People Who Want to Do What You Want to Do
            </p>
            <p className="text-lg text-white/70 max-w-3xl mx-auto mt-4">
              Add your favorite activities, events, or plans to your city's shared list — and find others who want to do the same. Whether you're exploring or just looking to connect, Nearby Traveler helps you match with like-minded people based on shared city experiences.
            </p>
          </div>

          {/* How it Works Section */}
          <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-center text-2xl">
                🤝 COLLABORATIVE CITY ACTIVITY MATCHING
              </CardTitle>
            </CardHeader>
            <CardContent className="text-white">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-500/20 p-4 rounded-lg">
                  <h3 className="font-bold text-lg mb-2">1. Add Activities to Your City</h3>
                  <ul className="space-y-1 text-sm">
                    <li>+ "Comic-Con"</li>
                    <li>+ "Auto Show"</li>
                    <li>+ "Ted Talk"</li>
                    <li>+ "Coachella"</li>
                    <li>+ "South by Southwest"</li>
                    <li>+ "Lollapalooza"</li>
                    <li>+ "New York Fashion Week"</li>
                    <li>+ "Mardi Gras"</li>
                  </ul>
                </div>
                <div className="bg-blue-500/20 p-4 rounded-lg">
                  <h3 className="font-bold text-lg mb-2">2. Click What Others Added</h3>
                  <p className="text-sm">
                    See what activities others have created. Click the buttons to add activities to your profile. 
                    Match with others who want the same experiences.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* City Search */}
          <div className="mb-8">
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <Input
                  placeholder="Search cities..."
                  value={citySearchTerm}
                  onChange={(e) => setCitySearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40"
                />
              </div>
              <p className="text-center text-white/60 text-sm mt-2">
                Found {filteredCities.length} cities
              </p>
            </div>
          </div>

          {/* Cities Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCities.map((city, index) => (
              <Card
                key={`${city.city}-${city.state}-${index}`}
                className="group cursor-pointer transform hover:scale-105 transition-all duration-300 bg-white/10 backdrop-blur-sm border-white/20 overflow-hidden relative"
                onClick={() => {
                  setSelectedCity(city.city);
                  // Scroll to top when city is selected
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="relative h-48 overflow-hidden">
                  {(() => {
                    const photoUrl = getCityPhotoUrl(city.city);
                    return photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={city.city}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback to gradient if photo fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${city.gradient}`}></div>
                    );
                  })()}
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-blue-500 text-white">
                      🎯 MATCH HERE
                    </Badge>
                  </div>
                  {/* Removed user count display */}
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-white" />
                    <h3 className="text-xl font-bold text-white">{city.city}</h3>
                  </div>
                  <p className="text-white/70 text-sm mb-4">
                    {city.state && `${city.state}, `}{city.country}
                  </p>

                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCity(city.city);
                      }}
                    >
                      ⚡ Start City Matching
                    </Button>

                    {/* Photo Upload for this city */}
                    <div className="pt-2 border-t border-white/10">
                      <CityPhotoUploadWidget cityName={city.city} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const selectedCityData = allCities.find(c => c.city === selectedCity);
  const isActivityActive = (activityId: number) => {
    return userActivities.some(ua => ua.activityId === activityId);
  };

  const isEventActive = (eventId: number) => {
    return userEvents.some(ue => ue.eventId === eventId);
  };

  const toggleEvent = async (event: any) => {
    const userId = user?.id || 1;
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
    const userId = user?.id || 1;
    
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => {
              // Navigate directly to cities page
              setLocation('/cities');
            }}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Cities
          </Button>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${selectedCityData?.gradient} flex items-center justify-center`}>
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{selectedCity}</h1>
                <p className="text-white/70">Add activities and events. Others click to match!</p>
              </div>
            </div>

            {/* City Photo Upload in Header */}
            <div className="flex items-center gap-2">
              <CityPhotoUploadWidget cityName={selectedCity} />
            </div>
          </div>
        </div>

        {/* HOW MATCHING WORKS - Explanation at top */}
        <Card className="mb-6 bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              How Activity Matching Works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-white">
            <div className="space-y-3 text-sm">
              <p><strong>1. Select Activities:</strong> Click the colorful pills below to turn them GREEN. These become your "Things I Want to Do" and appear on your profile.</p>
              <p><strong>2. Real-Time Matching:</strong> The system finds other users who selected the same activities in {selectedCity}.</p>
              <p><strong>3. Keyword Search:</strong> Your activity selections are searchable! If you select "Highline", others can search "Highline" and find you.</p>
              <p><strong>4. Connect:</strong> View matched users below and click "Connect" to start chatting and planning your activities together!</p>
              <p><strong>5. Add New Activities:</strong> Use the text box below to add activities that others can discover and join.</p>
              <div className="bg-blue-500/20 p-3 rounded-lg mt-3">
                <p className="font-medium">🔍 Search Tip: Select specific activities like "poker night", "Highline walk", or "rooftop drinks" - others searching these keywords will find you!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Activity Text Input Section */}
        <Card className="mb-6 bg-white/10 backdrop-blur-sm border-white/20" data-add-activity-section>
          <CardHeader>
            <CardTitle className="text-white">Add New Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Input
                placeholder="Type activity or event in this exact city to match with people who want to do the same thing! Example: 'Taylor Swift concert April 3rd' or 'Rooftop bar sunset drinks Friday'"
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
                className="w-full bg-white/10 border-white/20 text-white placeholder-white/60"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newActivityName.trim()) {
                    addActivity();
                  }
                }}
              />
              <Textarea
                placeholder="Optional: Add description - will appear when people hover over your activity! Example: 'Meet at 7pm entrance, bring ID, $20 cover charge'"
                value={newActivityDescription}
                onChange={(e) => setNewActivityDescription(e.target.value)}
                className="w-full bg-white/10 border-white/20 text-white placeholder-white/60 resize-none h-20"
              />
              <Button
                onClick={addActivity}
                disabled={!newActivityName.trim() || isLoading}
                className="bg-green-600 hover:bg-green-700 text-white w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Activity to {selectedCity}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activities Section Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white mb-2">⭐ Activities I Want to Do ({cityActivities.length})</h2>
          <Button
            onClick={() => enhanceCityWithMoreActivities()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-4 py-2 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            disabled={isLoading}
          >
            🤖 Get More AI Activities
          </Button>
        </div>

        {/* City Section like in screenshot */}
        <div className="bg-gray-800/60 rounded-lg p-4 mb-6">
          <h3 className="text-red-400 font-semibold text-lg mb-3">
            {selectedCity}{selectedCityData?.state ? `, ${selectedCityData.state}` : ''}
          </h3>



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
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                            isActive 
                              ? 'bg-green-500 shadow-lg' 
                              : 'bg-blue-500 hover:bg-blue-600'
                          }`}
                          style={{ color: '#000000 !important' }}
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

        {/* Events Section */}
        <div className="mt-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white mb-2">🎉 Events Available in {selectedCity} ({cityEvents.length})</h2>
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
                              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1 cursor-pointer hover:shadow-lg ${
                                isActive 
                                  ? 'bg-green-500 shadow-lg' 
                                  : 'bg-blue-500 hover:bg-blue-600'
                              }`}
                              style={{ color: 'black' }}
                            >
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

        {/* Matching Users Section */}
        <div className="mt-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                People Interested ({matchingUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(matchingUsers as any[]).length === 0 ? (
                <div className="text-center py-6 text-white/60">
                  <Users className="w-12 h-12 mx-auto opacity-30 mb-3" />
                  <p className="text-sm">Add activities and events to find people with similar interests!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(matchingUsers as any[]).slice(0, 5).map((user: any, index: number) => (
                    <div key={user.id || index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{user.username || 'Anonymous'}</div>
                        {user.sharedActivityNames && user.sharedActivityNames.length > 0 && (
                          <div className="text-white/50 text-xs mt-1">
                            Both interested in: {user.sharedActivityNames.slice(0, 2).join(', ')}
                            {user.sharedActivityNames.length > 2 && ` +${user.sharedActivityNames.length - 2} more`}
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
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                        Connect
                      </Button>
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
                    onClick={() => joinEvent(selectedEvent.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    Join Event
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