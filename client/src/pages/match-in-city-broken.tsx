import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Camera
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
  const [matchingUsers, setMatchingUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [allCities, setAllCities] = useState<any[]>([]);
  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [cityPhotos, setCityPhotos] = useState<any>({});

  // Fetch all cities and photos on component mount
  useEffect(() => {
    fetchAllCities();
    fetchCityPhotos();
  }, []);

  // Fetch city activities when a city is selected
  useEffect(() => {
    if (selectedCity) {
      fetchCityActivities();
      fetchUserActivities();
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
        console.log('🎯 ACTIVITIES LOADED:', activities.length, activities[0]);
        setCityActivities(activities);
      }
    } catch (error) {
      console.error('Error fetching city activities:', error);
    }
  };

  const fetchUserActivities = async () => {
    // Force user ID to 1 for now to fix authentication issue
    const userId = user?.id || 1;
    console.log('🔧 FETCH USER ACTIVITIES: using userId =', userId, 'user object:', user);
    
    try {
      const response = await fetch(`/api/user-city-interests/${userId}/${encodeURIComponent(selectedCity)}`);
      if (response.ok) {
        const activities = await response.json();
        console.log('🎯 USER ACTIVITIES FETCHED:', activities.length, activities);
        setUserActivities(activities);
      }
    } catch (error) {
      console.error('Error fetching user activities:', error);
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
    if (!newActivityName.trim() || !newActivityDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both activity name and description.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/city-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id.toString() || '',
          'x-user-data': JSON.stringify(user || {})
        },
        body: JSON.stringify({
          cityName: selectedCity,
          activityName: newActivityName,
          description: newActivityDescription,
          category: 'general',
          state: allCities.find(c => c.city === selectedCity)?.state || '',
          country: allCities.find(c => c.city === selectedCity)?.country || ''
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
    console.log('🔧 TOGGLE: using userId =', userId);

    const isCurrentlyActive = userActivities.some(ua => ua.activityId === activity.id);
    console.log('🎯 TOGGLE ACTIVITY:', activity.activityName, 'isCurrentlyActive:', isCurrentlyActive);

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
      console.error('Toggle activity error:', error);
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

    console.log('🔧 DELETE: using userId =', userId);
    console.log('🗑️ DELETING ACTIVITY:', activityId);

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
      console.error('Delete activity error:', error);
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
      console.log('❌ UPDATE BLOCKED: no editingActivity');
      return;
    }

    console.log('🔧 UPDATE: using userId =', userId);
    console.log('✏️ UPDATING ACTIVITY:', editingActivity.id, 'from:', editingActivity.activityName, 'to:', editActivityName);

    try {
      const response = await fetch(`/api/city-activities/${editingActivity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId.toString()
        },
        body: JSON.stringify({
          activityName: editActivityName,
          description: editActivityDescription
        })
      });

      console.log('✏️ UPDATE RESPONSE:', response.status, response.ok);

      if (response.ok) {
        const updatedActivity = await response.json();
        console.log('✏️ UPDATED ACTIVITY DATA:', updatedActivity);
        
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
        
        console.log('✏️ EDIT FORM CLEARED AND STATE UPDATED');
      } else {
        const error = await response.json();
        console.error('❌ UPDATE ERROR RESPONSE:', error);
        toast({
          title: "Error",
          description: error.error || "Failed to update activity",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ UPDATE NETWORK ERROR:', error);
      toast({
        title: "Error",
        description: "Failed to update activity",
        variant: "destructive",
      });
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
              THE POINT OF THIS SITE: Add activities and events dynamically by user to your city's list and get 
              people who want to do the same exact activities and events! Create connections, collaboratively by city experiences.
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
                    <li>+ "Hike Hollywood Hills"</li>
                    <li>+ "Taylor Swift Concert April 3"</li>
                    <li>+ "Rooftop Bar Sunset"</li>
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
                onClick={() => setSelectedCity(city.city)}
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
    const isActive = userActivities.some(ua => ua.activityId === activityId);
    console.log(`🔍 ACTIVITY ACTIVE CHECK: ${activityId} = ${isActive}, userActivities:`, userActivities.length);
    return isActive;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedCity('');
              setEditingActivity(null);
              setEditActivityName('');
              setEditActivityDescription('');
              setNewActivityName('');
              setNewActivityDescription('');
              setShowAddForm(false);
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

        {/* Simple Header like in screenshot */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">⭐ Things I Want to Do ({cityActivities.length})</h2>
        </div>

        {/* City Section like in screenshot */}
        <div className="bg-gray-800/60 rounded-lg p-4 mb-6">
          <h3 className="text-red-400 font-semibold text-lg mb-3">{selectedCity}</h3>
          
          {/* Activity Pills - just like the screenshot */}
          <div className="flex flex-wrap gap-2">
            {cityActivities.map((activity) => {
              const isActive = isActivityActive(activity.id);
              console.log('🔍 RENDERING ACTIVITY:', activity.id, activity.activityName, 'isActive:', isActive);
              
              return (
                <div key={activity.id} className="relative group">
                  <button
                    onClick={() => toggleActivity(activity)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-green-500 text-white shadow-lg' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {activity.activityName}
                  </button>
                  
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
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-600 hover:bg-gray-500 text-white border-2 border-dashed border-gray-400"
            >
              + Add Activity
            </button>
          </div>

          {/* Add/Edit Forms - minimal */}
          {showAddForm && (
            <div className="mt-4 space-y-2">
              <Input
                placeholder="Activity name..."
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newActivityName.trim()) {
                    setNewActivityDescription('Added activity');
                    addActivity();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setNewActivityDescription('Added activity');
                    addActivity();
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1"
                  disabled={!newActivityName.trim()}
                >
                  Add
                </Button>
                <Button 
                  onClick={() => {
                    setShowAddForm(false);
                    setNewActivityName('');
                    setNewActivityDescription('');
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 text-sm px-3 py-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {editingActivity && (
            <div className="mt-4 space-y-2">
              <Input
                placeholder="Activity name..."
                value={editActivityName}
                onChange={(e) => setEditActivityName(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button 
                  onClick={updateActivity}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1"
                  disabled={!editActivityName.trim()}
                >
                  Update
                </Button>
                <Button 
                  onClick={() => {
                    setEditingActivity(null);
                    setEditActivityName('');
                    setEditActivityDescription('');
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 text-sm px-3 py-1"
                >
                  Cancel
                </Button>
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
                  <p className="text-sm">Add activities to find people with similar interests!</p>
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
                        <div className="text-white/60 text-xs">
                          {user.commonActivities || 1} shared interest{(user.commonActivities || 1) === 1 ? '' : 's'}
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
      </div>
    </div>
  );
}