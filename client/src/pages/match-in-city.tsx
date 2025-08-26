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

// City data with beautiful backgrounds matching the screenshot
const FEATURED_CITIES = [
  {
    city: "New York City",
    state: "New York",
    country: "United States",
    gradient: "from-blue-600 to-purple-800",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
    userCount: 1250,
    eventCount: 89
  },
  {
    city: "Los Angeles",
    state: "California", 
    country: "United States",
    gradient: "from-orange-500 to-red-600",
    image: "https://images.unsplash.com/photo-1544989164-925f34938ea0?w=800&q=80",
    userCount: 890,
    eventCount: 67
  },
  {
    city: "Portland",
    state: "Oregon",
    country: "United States", 
    gradient: "from-green-500 to-blue-600",
    image: "https://images.unsplash.com/photo-1545093149-618ce3bcf49d?w=800&q=80",
    userCount: 445,
    eventCount: 34
  },
  {
    city: "Boston",
    state: "Massachusetts",
    country: "United States",
    gradient: "from-red-500 to-orange-600", 
    image: "https://images.unsplash.com/photo-1558469370-e1c6b21ee809?w=800&q=80",
    userCount: 567,
    eventCount: 41
  },
  {
    city: "San Francisco",
    state: "California",
    country: "United States",
    gradient: "from-teal-500 to-cyan-600",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    userCount: 789,
    eventCount: 56
  },
  {
    city: "Chicago",
    state: "Illinois", 
    country: "United States",
    gradient: "from-indigo-500 to-purple-600",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
    userCount: 623,
    eventCount: 48
  },
  {
    city: "Miami",
    state: "Florida",
    country: "United States",
    gradient: "from-pink-500 to-orange-500",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    userCount: 401,
    eventCount: 29
  },
  {
    city: "Seattle",
    state: "Washington",
    country: "United States",
    gradient: "from-gray-600 to-blue-700",
    image: "https://images.unsplash.com/photo-1541698444083-023c97d3f4b6?w=800&q=80",
    userCount: 512,
    eventCount: 38
  }
];

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
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

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
  
  const currentUser = getUserData() || user;

  // Filter cities based on search
  const filteredCities = FEATURED_CITIES.filter(city =>
    city.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch city activities when a city is selected
  useEffect(() => {
    if (selectedCity) {
      fetchCityActivities();
      fetchUserActivities();
      fetchMatchingUsers();
    }
  }, [selectedCity]);

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
    const userId = currentUser?.id || 1;
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

  const fetchMatchingUsers = async () => {
    try {
      const response = await fetch(`/api/matching-users/${encodeURIComponent(selectedCity)}`);
      if (response.ok) {
        const users = await response.json();
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
        
        setCityActivities(prev => [...prev, newActivity]);
        setNewActivityName('');
        setNewActivityDescription('');
        setShowAddForm(false);
        fetchMatchingUsers();
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
    const userId = currentUser?.id || 1;
    const isCurrentlyActive = userActivities.some(ua => ua.activityId === activity.id);

    try {
      if (isCurrentlyActive) {
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
          setUserActivities(prev => prev.filter(ua => ua.activityId !== activity.id));
        }
      } else {
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
    const userId = currentUser?.id || 1;
    
    if (!editingActivity) return;

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

      if (response.ok) {
        toast({
          title: "Activity Updated",
          description: `Updated "${editingActivity.activityName}" to "${editActivityName}"`,
        });
        
        setCityActivities(prev => prev.map(activity => 
          activity.id === editingActivity.id 
            ? { ...activity, activityName: editActivityName, description: editActivityDescription }
            : activity
        ));
        
        setEditingActivity(null);
        setEditActivityName('');
        setEditActivityDescription('');
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

  const deleteActivity = async (activityId: number) => {
    const userId = currentUser?.id || 1;

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
        setCityActivities(prev => prev.filter(activity => activity.id !== activityId));
        setUserActivities(prev => prev.filter(ua => ua.activityId !== activityId));
        fetchMatchingUsers();
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

  // Show city selection screen if no city is selected
  if (!selectedCity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Match in Cities
            </h1>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Connect with travelers and locals worldwide. Select a destination to start matching with people who share your interests.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
              <Input
                placeholder="Search destinations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 bg-white/10 border-white/20 text-white placeholder-blue-200 h-12 text-lg"
              />
            </div>
          </div>

          {/* Featured Cities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {filteredCities.map((city, index) => (
              <Card key={city.city} className="group overflow-hidden bg-white/5 backdrop-blur-lg border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 cursor-pointer">
                <div className="relative">
                  {/* City Image */}
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={city.image}
                      alt={city.city}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        // Fallback to gradient if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    {/* Fallback gradient */}
                    <div 
                      className={`w-full h-full bg-gradient-to-br ${city.gradient} items-center justify-center hidden`}
                    >
                      <MapPin className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* MATCH HERE Badge */}
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-3 py-1">
                      🎯 MATCH HERE
                    </Badge>
                  </div>
                </div>

                <CardContent className="relative p-6">
                  {/* City Info */}
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-white mb-1">{city.city}</h3>
                    <p className="text-blue-200 font-medium">{city.state}, {city.country}</p>
                    <p className="text-blue-300 text-sm mt-2">Collaborative travel guide</p>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between items-center mb-6 text-sm">
                    <div className="flex items-center gap-1 text-blue-200">
                      <Users className="w-4 h-4" />
                      <span>{city.userCount} users</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-200">
                      <Calendar className="w-4 h-4" />
                      <span>{city.eventCount} events</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    onClick={() => setSelectedCity(city.city)}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Start City Matching
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {filteredCities.length === 0 && searchTerm && (
            <div className="text-center mt-12">
              <p className="text-blue-200 text-lg">No destinations found matching "{searchTerm}"</p>
              <Button 
                onClick={() => setSearchTerm('')}
                variant="outline"
                className="mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Show All Destinations
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show city activities screen when a city is selected
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setSelectedCity('')}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">🎯 {selectedCity}</h1>
              <p className="text-white/70">Find people with similar interests</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* City Activities */}
          <div className="lg:col-span-2">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  City Activities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Activity Form */}
                {showAddForm && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="space-y-3">
                      <Input
                        placeholder="Activity name..."
                        value={newActivityName}
                        onChange={(e) => setNewActivityName(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder-white/50"
                      />
                      <Textarea
                        placeholder="Activity description..."
                        value={newActivityDescription}
                        onChange={(e) => setNewActivityDescription(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder-white/50"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={addActivity}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          Add Activity
                        </Button>
                        <Button 
                          onClick={() => setShowAddForm(false)}
                          variant="outline"
                          size="sm"
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Activity Button */}
                {!showAddForm && (
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Activity
                  </Button>
                )}

                {/* Activities List */}
                <div className="space-y-3">
                  {cityActivities.map((activity) => {
                    const userActivity = userActivities.find(ua => ua.activityId === activity.id);
                    const isUserActivity = !!userActivity;
                    const isEditing = editingActivity?.id === activity.id;

                    return (
                      <div 
                        key={activity.id} 
                        className={`p-4 rounded-lg border transition-all ${
                          isUserActivity 
                            ? 'bg-blue-500/20 border-blue-400/30' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <Input
                              value={editActivityName}
                              onChange={(e) => setEditActivityName(e.target.value)}
                              className="bg-white/10 border-white/20 text-white placeholder-white/50"
                            />
                            <Textarea
                              value={editActivityDescription}
                              onChange={(e) => setEditActivityDescription(e.target.value)}
                              className="bg-white/10 border-white/20 text-white placeholder-white/50"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button 
                                onClick={updateActivity}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Save
                              </Button>
                              <Button 
                                onClick={() => {
                                  setEditingActivity(null);
                                  setEditActivityName('');
                                  setEditActivityDescription('');
                                }}
                                variant="outline"
                                size="sm"
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-white">{activity.activityName}</h4>
                              {activity.description && (
                                <p className="text-white/70 text-sm mt-1">{activity.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                onClick={() => toggleActivity(activity)}
                                size="sm"
                                variant={isUserActivity ? "default" : "outline"}
                                className={isUserActivity 
                                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                  : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                                }
                              >
                                {isUserActivity ? (
                                  <>
                                    <Heart className="w-4 h-4 mr-1 fill-current" />
                                    Interested
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4 mr-1" />
                                    Join
                                  </>
                                )}
                              </Button>
                              
                              <Button
                                onClick={() => {
                                  setEditingActivity(activity);
                                  setEditActivityName(activity.activityName);
                                  setEditActivityDescription(activity.description || '');
                                }}
                                size="sm"
                                variant="ghost"
                                className="text-white/70 hover:bg-white/10 hover:text-white"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                onClick={() => deleteActivity(activity.id)}
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:bg-red-500/20 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Matching Users */}
          <div>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Matching People ({matchingUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {matchingUsers.length === 0 ? (
                  <p className="text-white/70 text-center py-8">
                    No matching users yet. Add some activities to find people with similar interests!
                  </p>
                ) : (
                  matchingUsers.map((matchUser) => (
                    <div key={matchUser.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{matchUser.username}</h4>
                          <p className="text-white/70 text-sm">{matchUser.userType || 'Traveler'}</p>
                        </div>
                      </div>
                      
                      {matchUser.commonActivities && matchUser.commonActivities.length > 0 && (
                        <div className="mb-3">
                          <p className="text-white/70 text-sm mb-2">Common interests:</p>
                          <div className="flex flex-wrap gap-1">
                            {matchUser.commonActivities.slice(0, 3).map((activity: string, index: number) => (
                              <Badge key={index} variant="secondary" className="bg-blue-500/20 text-blue-200 text-xs">
                                {activity}
                              </Badge>
                            ))}
                            {matchUser.commonActivities.length > 3 && (
                              <Badge variant="secondary" className="bg-white/10 text-white/70 text-xs">
                                +{matchUser.commonActivities.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        size="sm" 
                        className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
                        variant="outline"
                        onClick={() => setLocation(`/profile/${matchUser.id}`)}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        View Profile
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}