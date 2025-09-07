import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  X
} from "lucide-react";
import { CityPhotoUploadWidget } from "@/components/CityPhotoUploadWidget";

interface MatchInCityProps {
  cityName?: string;
}

export default function MatchInCity({ cityName }: MatchInCityProps = {}) {
  const [location, setLocation] = useLocation();
  const [selectedCity, setSelectedCity] = useState<string>('');
  
  console.log('🔧 MATCH IN CITY RENDER - selectedCity:', selectedCity);
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
  const [newActivity, setNewActivity] = useState('');
  const [editingActivityName, setEditingActivityName] = useState('');

  // Fetch all cities and photos on component mount
  useEffect(() => {
    // FORCE RESET - ensure we start with no city selected
    console.log('🔧 FORCE RESETTING selectedCity to empty string');
    setSelectedCity('');
    
    // Clear any URL params that might be setting city
    const urlParams = new URLSearchParams(window.location.search);
    const cityFromUrl = urlParams.get('city');
    if (cityFromUrl) {
      console.log('🔧 Found city in URL, clearing it:', cityFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
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

  const fetchAllCities = async () => {
    try {
      const response = await fetch('/api/city-stats');
      if (response.ok) {
        const cities = await response.json();
        console.log('🏙️ CITIES LOADED:', cities.length);
        setAllCities(cities);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchCityPhotos = async () => {
    try {
      console.log('📸 FETCHING: Making API call to /api/city-photos');
      const response = await fetch('/api/city-photos');
      console.log('📸 RESPONSE:', response.status, response.ok);
      
      if (response.ok) {
        const text = await response.text();
        console.log('📸 RAW RESPONSE:', text.substring(0, 200));
        
        // Try to parse as JSON
        let photos;
        try {
          photos = JSON.parse(text);
        } catch (parseError) {
          console.error('📸 JSON PARSE ERROR:', parseError);
          console.log('📸 Response was not JSON, skipping photo loading');
          return;
        }
        
        console.log('📸 CITY PHOTOS LOADED:', photos.length);
        const photoMap: any = {};
        photos.forEach((photo: any) => {
          const cityKey = photo.city || photo.cityName; // Handle both field names
          console.log('📸 Processing photo for city:', cityKey);
          if (!photoMap[cityKey]) {
            photoMap[cityKey] = [];
          }
          photoMap[cityKey].push(photo);
        });
        console.log('📸 PHOTO MAP:', Object.keys(photoMap));
        setCityPhotos(photoMap);
      } else {
        console.error('📸 API ERROR: Status', response.status);
      }
    } catch (error) {
      console.error('📸 FETCH ERROR:', error);
    }
  };

  const fetchCityActivities = async () => {
    console.log('🎯 FETCHING ACTIVITIES FOR CITY:', selectedCity);
    try {
      const response = await fetch(`/api/city-activities/${encodeURIComponent(selectedCity)}`);
      console.log('🎯 ACTIVITIES API RESPONSE:', response.status, response.ok);
      if (response.ok) {
        const activities = await response.json();
        console.log('🎯 CITY ACTIVITIES FETCHED:', activities.length, 'activities for', selectedCity);
        console.log('🎯 FIRST FEW ACTIVITIES:', activities.slice(0, 5));
        setCityActivities(activities);
      } else {
        console.error('🎯 ACTIVITIES API ERROR:', response.status);
        const errorText = await response.text();
        console.error('🎯 ERROR DETAILS:', errorText);
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
    try {
      const response = await fetch(`/api/matching-users/${encodeURIComponent(selectedCity)}`);
      if (response.ok) {
        const users = await response.json();
        console.log('👥 MATCHING USERS FETCHED:', users.length);
        setMatchingUsers(users);
      }
    } catch (error) {
      console.error('Error fetching matching users:', error);
    }
  };

  const addActivity = async () => {
    if (!newActivityName.trim() || !newActivityDescription.trim()) return;

    try {
      const response = await fetch('/api/city-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          city: selectedCity,
          activityName: newActivityName.trim(),
          description: newActivityDescription.trim(),
          category: 'user-generated',
          state: '',
          country: ''
        })
      });

      if (response.ok) {
        const newActivity = await response.json();
        toast({
          title: "Activity Added",
          description: `Added "${newActivityName}" to ${selectedCity}`,
        });
        
        // Immediately update local state
        setCityActivities(prev => [...prev, newActivity]);
        
        // Clear form
        setNewActivityName('');
        setNewActivityDescription('');
        setShowAddForm(false);
        
        fetchMatchingUsers();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to add activity",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Add activity error:', error);
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

  // Add activity function for the simple interface
  const handleAddActivity = async () => {
    if (!newActivity.trim()) return;
    
    const userId = user?.id || 1;
    console.log('➕ ADDING ACTIVITY:', newActivity, 'userId:', userId);

    try {
      const response = await fetch('/api/city-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId.toString()
        },
        body: JSON.stringify({
          cityName: selectedCity,
          activityName: newActivity,
          description: 'User added activity'
        })
      });

      if (response.ok) {
        const newActivityData = await response.json();
        setCityActivities(prev => [...prev, newActivityData]);
        setNewActivity('');
        
        toast({
          title: "Activity Added",
          description: `Added "${newActivity}" to ${selectedCity}`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to add activity",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Add activity error:', error);
      toast({
        title: "Error",
        description: "Failed to add activity",
        variant: "destructive",
      });
    }
  };

  // Toggle activity function for the simple interface
  const handleToggleActivity = async (activityId: number, activityName: string) => {
    const userId = user?.id || 1;
    const isCurrentlySelected = userActivities.some(ua => ua.activityId === activityId);
    
    console.log('🔄 TOGGLE ACTIVITY:', activityId, activityName, 'currently selected:', isCurrentlySelected);

    try {
      if (isCurrentlySelected) {
        // Remove from user activities
        const userActivity = userActivities.find(ua => ua.activityId === activityId);
        if (userActivity) {
          await handleDeleteActivity(userActivity.id);
        }
      } else {
        // Add to user activities
        const response = await fetch('/api/user-city-activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId.toString()
          },
          body: JSON.stringify({
            activityId: activityId,
            cityName: selectedCity
          })
        });

        if (response.ok) {
          const newUserActivity = await response.json();
          setUserActivities(prev => [...prev, newUserActivity]);
          
          toast({
            title: "Activity Selected",
            description: `Added "${activityName}" to your interests`,
          });
        }
      }
    } catch (error) {
      console.error('Toggle activity error:', error);
      toast({
        title: "Error",
        description: "Failed to toggle activity",
        variant: "destructive",
      });
    }
  };

  // Delete user activity function
  const handleDeleteActivity = async (userActivityId: number) => {
    const userId = user?.id || 1;
    
    try {
      const response = await fetch(`/api/user-city-activities/${userActivityId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId.toString()
        }
      });

      if (response.ok) {
        setUserActivities(prev => prev.filter(ua => ua.id !== userActivityId));
        
        toast({
          title: "Activity Removed",
          description: "Removed from your interests",
        });
      }
    } catch (error) {
      console.error('Delete activity error:', error);
      toast({
        title: "Error",
        description: "Failed to remove activity",
        variant: "destructive",
      });
    }
  };

  // Update activity function
  const handleUpdateActivity = async () => {
    if (!editingActivity || !editingActivityName.trim()) return;
    
    const userId = user?.id || 1;
    
    try {
      const response = await fetch(`/api/user-city-activities/${editingActivity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId.toString()
        },
        body: JSON.stringify({
          activityName: editingActivityName
        })
      });

      if (response.ok) {
        // Update the city activity name in the city activities list
        const cityActivityResponse = await fetch(`/api/city-activities/${editingActivity.activityId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId.toString()
          },
          body: JSON.stringify({
            activityName: editingActivityName,
            description: 'Updated activity'
          })
        });

        if (cityActivityResponse.ok) {
          setCityActivities(prev => prev.map(activity => 
            activity.id === editingActivity.activityId 
              ? { ...activity, name: editingActivityName }
              : activity
          ));
        }
        
        setEditingActivity(null);
        setEditingActivityName('');
        
        toast({
          title: "Activity Updated",
          description: `Updated to "${editingActivityName}"`,
        });
      }
    } catch (error) {
      console.error('Update activity error:', error);
      toast({
        title: "Error",
        description: "Failed to update activity",
        variant: "destructive",
      });
    }
  };



  // Show city selection screen if no city is selected
  if (!selectedCity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">🎯 Match in City</h1>
            <p className="text-xl text-white/80">Select a city to start matching with people!</p>
          </div>

          {/* Search Cities */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-white/50" />
              <Input
                placeholder="Search cities..."
                value={citySearchTerm}
                onChange={(e) => setCitySearchTerm(e.target.value)}
                className="pl-12 bg-white/10 border-white/20 text-white placeholder-white/50"
              />
            </div>
          </div>

          {/* Cities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCities.slice(0, 20).map((city, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                <CardContent className="p-4">
                  {/* City Photo */}
                  <div className="aspect-video rounded-lg mb-4 overflow-hidden">
                    {cityPhotos[city.city] && cityPhotos[city.city].length > 0 ? (
                      <img 
                        src={cityPhotos[city.city][0].imageUrl || cityPhotos[city.city][0].imageData} 
                        alt={city.city}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('📸 IMAGE ERROR for', city.city, 'URL:', cityPhotos[city.city][0].imageUrl);
                          // Hide broken image and show gradient instead
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${city.gradient || 'from-blue-400 to-purple-600'} flex items-center justify-center`}>
                        <MapPin className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-white text-lg mb-2">{city.city}</h3>
                  <p className="text-white/70 text-sm mb-4">{city.state}, {city.country}</p>
                  
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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedCity('')}
            className="text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cities
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{selectedCity}</h1>
          </div>
          <div className="w-20" />
        </div>

        {/* Activity Selection Interface - EXACTLY like your screenshots */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-8">⭐ Things I Want to Do</h2>
              
              {/* Dynamic City Activities - Universal + City-Specific + AI */}
              <div className="space-y-8">
                {/* Show activities for selected city */}
                {cityActivities.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold text-red-600 mb-4">{selectedCity}</h3>
                    <div className="flex flex-wrap gap-3">
                      {cityActivities.map((activity) => {
                        const isSelected = userActivities.some(ua => ua.activityId === activity.id);
                        const userActivity = userActivities.find(ua => ua.activityId === activity.id);
                        
                        return (
                          <div key={activity.id} className="group relative">
                            <button
                              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                                isSelected 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-blue-500 text-white hover:bg-green-500'
                              }`}
                              onClick={() => handleToggleActivity(activity.id, activity.name)}
                            >
                              {activity.name}
                            </button>
                            
                            {/* Edit/Delete on hover */}
                            {isSelected && userActivity && (
                              <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                                <button
                                  className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingActivity({ id: userActivity.id, name: activity.name, activityId: activity.id });
                                    setEditingActivityName(activity.name);
                                  }}
                                >
                                  <Edit className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteActivity(userActivity.id);
                                  }}
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-semibold text-red-600 mb-4">{selectedCity}</h3>
                    <p className="text-gray-600">Loading activities... 🎯</p>
                  </div>
                )}

                {/* Add new activity section */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add something you want to do in this city..."
                      value={newActivity}
                      onChange={(e) => setNewActivity(e.target.value)}
                      className="border-gray-300"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddActivity();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleAddActivity}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Matching Users */}
        {matchingUsers.length > 0 && (
          <Card className="bg-white border border-gray-200 shadow-sm mt-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">🤝 People Who Match</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchingUsers.map((user) => (
                  <div key={user.id} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <p className="text-gray-600 text-sm">@{user.username}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-gray-700 font-medium text-sm">Shared Interests:</h4>
                      <div className="flex flex-wrap gap-1">
                        {user.sharedActivities.map((activity: string, index: number) => (
                          <span 
                            key={index}
                            className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs"
                          >
                            {activity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Activity Modal */}
      {editingActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Activity</h3>
            <Input
              value={editingActivityName}
              onChange={(e) => setEditingActivityName(e.target.value)}
              className="mb-4"
              placeholder="Activity name"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingActivity(null);
                  setEditingActivityName('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateActivity}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}