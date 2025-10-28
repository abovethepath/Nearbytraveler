import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/App";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
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
  X
} from "lucide-react";

interface MatchInCityProps {
  cityName?: string;
}

export default function MatchInCity({ cityName }: MatchInCityProps = {}) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
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

  const [allCities, setAllCities] = useState<any[]>([]);
  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const [editingActivityName, setEditingActivityName] = useState('');

  // Fetch all cities on component mount
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

  // Fetch user profile to sync with existing activities
  const { data: userProfile } = useQuery({
    queryKey: ['/api/users', user?.id],
    enabled: !!user?.id
  });

  // Hydrate initial selections from user profile
  useEffect(() => {
    // Skip hydration for new users who aren't logged in
    if (!user?.id || !userProfile?.activities || !selectedCity) {
      console.log('🔄 SKIP HYDRATION: New user or no profile data');
      return;
    }
    
    console.log('🔄 Hydrating activities from user profile for city:', selectedCity);
    
    // Extract activities for current city from user profile
    const cityPrefix = `${selectedCity}:`;
    const cityActivitiesFromProfile = userProfile.activities
      .filter((activity: string) => activity.startsWith(cityPrefix))
      .map((activity: string) => activity.replace(cityPrefix, '').trim());
    
    console.log('🔄 Found existing activities for city:', {
      cityActivitiesFromProfile,
      totalProfileActivities: userProfile.activities.length
    });
    
    if (cityActivitiesFromProfile.length > 0) {
      // Cross-reference with cityActivities to get activityIds
      const hydratedUserActivities = cityActivitiesFromProfile
        .map((activityName, index) => {
          // Find the matching activity from cityActivities
          const matchingActivity = cityActivities.find(activity => 
            activity.activityName === activityName
          );
          
          if (matchingActivity) {
            return {
              id: `hydrated-${selectedCity}-${index}`, // Temporary ID for hydrated items
              userId: user.id,
              cityName: selectedCity,
              activityName: activityName,
              activityId: matchingActivity.id // Include the required activityId
            };
          }
          return null;
        })
        .filter(Boolean); // Remove null entries
      
      // Set the hydrated activities to pre-select pills
      setUserActivities(hydratedUserActivities);
      
      console.log('✅ Hydrated activities for pills:', {
        found: hydratedUserActivities.length,
        fromProfile: cityActivitiesFromProfile.length
      });
    } else {
      // No existing activities for this city, clear any previous selections
      setUserActivities([]);
    }
    
  }, [userProfile?.activities, selectedCity, user?.id, cityActivities]);

  // Sync selected activities to user profile
  const syncActivitiesToProfile = async (selectedActivityNames: string[], cityName: string) => {
    if (!user?.id) return;
    
    try {
      console.log('🔄 Syncing activities to profile:', { selectedActivityNames, cityName });
      
      // Wait for profile query to be available, don't sync if loading
      if (!userProfile) {
        console.log('⏳ Profile not loaded yet, skipping sync to prevent data loss');
        return;
      }
      
      // Get current user activities from profile (guaranteed to be loaded)
      const currentActivities = userProfile.activities || [];
      
      // Add city-specific prefix to avoid conflicts (e.g., "Los Angeles: Beach Activities")
      const cityPrefixedActivities = selectedActivityNames.map(activity => 
        `${cityName}: ${activity}`
      );
      
      // Merge with existing activities (remove old ones from this city, add new ones)
      const cityPrefix = `${cityName}:`;
      const otherCityActivities = currentActivities.filter((activity: string) => 
        !activity.startsWith(cityPrefix)
      );
      const updatedActivities = [...otherCityActivities, ...cityPrefixedActivities];
      
      console.log('🔄 Profile update:', {
        currentActivities: currentActivities.length,
        selectedForThisCity: selectedActivityNames.length,
        totalAfterUpdate: updatedActivities.length,
        cityName
      });
      
      // Update user profile
      await apiRequest('PUT', `/api/users/${user.id}`, {
        activities: updatedActivities
      });
      
      // Invalidate profile query to refresh UI
      queryClient.invalidateQueries({ queryKey: ['/api/users', user.id] });
      
      console.log('✅ Activities synced to profile successfully');
    } catch (error) {
      console.error('❌ Failed to sync activities to profile:', error);
      toast({
        title: "Sync Warning", 
        description: "Activities saved locally but may not appear in profile immediately",
        variant: "destructive"
      });
    }
  };

  const fetchAllCities = async () => {
    try {
      // FIXED: Use dynamic city stats API instead of hardcoded cities
      console.log('🏙️ MATCH: Fetching cities from city stats API...');
      const response = await fetch('/api/city-stats');
      if (response.ok) {
        const citiesData = await response.json();
        console.log('🏙️ MATCH: Loaded', citiesData.length, 'cities from API');
        
        // Add default photos and gradients to the dynamic cities
        const citiesWithPhotos = citiesData.map((city: any, index: number) => {
          // Using colorful gradients instead of photos for easier management
          
          const gradientOptions = [
            "from-orange-400/20 to-blue-600/20",
            "from-blue-400/20 to-orange-600/20",
            "from-blue-300/20 to-orange-500/20", 
            "from-orange-300/20 to-blue-500/20",
            "from-blue-500/20 to-orange-400/20",
            "from-orange-500/20 to-blue-400/20",
            "from-blue-600/20 to-orange-300/20",
            "from-orange-600/20 to-blue-300/20"
          ];
          
          return {
            ...city,
            gradient: gradientOptions[index % gradientOptions.length]
          };
        });
        
        setAllCities(citiesWithPhotos);
        console.log('🏙️ MATCH: Cities loaded successfully:', citiesWithPhotos.length);
      } else {
        console.error('🏙️ MATCH: Failed to fetch cities from API, falling back to hardcoded');
        // Fallback to original cities if API fails
        const launchCities = [
          { 
            city: "Los Angeles Metro", 
            state: "California", 
            country: "United States", 
            gradient: "from-orange-400/20 to-red-600/20",
            localCount: 0,
            travelerCount: 0,
            businessCount: 0,
            eventCount: 0
          }
        ];
        setAllCities(launchCities);
      }
    } catch (error) {
      console.error('🏙️ MATCH: Error loading cities:', error);
      setAllCities([]);
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
    // Get user from multiple storage locations
    const storedUser = localStorage.getItem('travelConnectUser');
    const authUser = localStorage.getItem('user');
    
    let actualUser = user;
    if (!actualUser && storedUser) {
      try {
        actualUser = JSON.parse(storedUser);
      } catch (e) {
        console.error('Failed to parse travelConnectUser:', e);
      }
    }
    if (!actualUser && authUser) {
      try {
        actualUser = JSON.parse(authUser);
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
    
    if (!actualUser || !actualUser.id) {
      console.log('🔧 NEW USER: No user logged in, starting with clean slate');
      setUserActivities([]);
      return;
    }
    
    const userId = actualUser.id;
    console.log('🔧 FETCH USER ACTIVITIES: using userId =', userId, 'user object:', actualUser);
    
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
    const storedUser = localStorage.getItem('travelConnectUser');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null);
    const userId = actualUser?.id;

    const isCurrentlyActive = userActivities.some(ua => ua.activityId === activity.id);
    console.log('🎯 TOGGLE ACTIVITY:', activity.activityName, 'isCurrentlyActive:', isCurrentlyActive);

    try {
      if (isCurrentlyActive) {
        // Find the user_city_interests record ID (not the activity ID!)
        const userActivityRecord = userActivities.find(ua => ua.activityId === activity.id);
        if (!userActivityRecord) {
          console.error('❌ Could not find user activity record for activityId:', activity.id);
          toast({
            title: "Error",
            description: "Could not find activity record to remove",
            variant: "destructive",
          });
          return;
        }
        
        console.log('🗑️ REMOVING: userActivityRecord.id =', userActivityRecord.id, 'activityId =', activity.id);
        
        // Remove activity using the correct user_city_interests ID
        const response = await fetch(`/api/user-city-interests/${userActivityRecord.id}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': userId.toString()
          }
        });
        
        if (response.ok) {
          console.log('✅ Successfully removed activity');
          // Immediately update local state
          setUserActivities(prev => prev.filter(ua => ua.activityId !== activity.id));
          // Refresh to sync with database
          await fetchUserActivities();
        } else {
          const error = await response.json();
          console.error('❌ DELETE failed:', error);
          toast({
            title: "Error",
            description: error.error || "Failed to remove activity",
            variant: "destructive",
          });
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
          console.log('✅ Successfully added activity:', newInterest);
          // Immediately update local state
          setUserActivities(prev => [...prev, newInterest]);
          // Refresh to sync with database
          await fetchUserActivities();
        } else {
          const error = await response.json();
          console.error('❌ POST failed:', error);
          toast({
            title: "Error",
            description: error.error || "Failed to add activity",
            variant: "destructive",
          });
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
    if (!editingActivity) {
      console.log('❌ UPDATE BLOCKED: no editingActivity');
      return;
    }

    const storedUser = localStorage.getItem('travelConnectUser');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null);
    const userId = actualUser?.id;
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
    if (!confirm('Are you sure you want to delete this activity? This will remove it for everyone.')) {
      return;
    }

    const storedUser = localStorage.getItem('travelConnectUser');
    const authUser = localStorage.getItem('user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null) || (authUser ? JSON.parse(authUser) : null);
    const userId = actualUser?.id;
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
    
    // Get user from localStorage if not in context (same as toggle function)
    const storedUser = localStorage.getItem('travelConnectUser');
    const authUser = localStorage.getItem('user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null) || (authUser ? JSON.parse(authUser) : null);
    const userId = actualUser?.id;
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
          createdByUserId: userId,
          description: 'User added activity'
        })
      });

      if (response.ok) {
        const newActivityData = await response.json();
        setCityActivities(prev => [...prev, newActivityData]);
        
        // Automatically add the new activity to user's interests (make it green)
        console.log('🎯 Auto-selecting new activity:', newActivityData.activityName);
        const interestResponse = await fetch('/api/user-city-interests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId.toString()
          },
          body: JSON.stringify({
            activityId: newActivityData.id,
            cityName: selectedCity
          })
        });
        
        if (interestResponse.ok) {
          const newUserActivity = await interestResponse.json();
          setUserActivities(prev => [...prev, newUserActivity]);
          console.log('✅ Auto-selected activity for user');
        }
        
        setNewActivity('');
        
        toast({
          title: "Activity Added & Selected",
          description: `Created and selected "${newActivity}" for ${selectedCity}`,
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
    // Get user from localStorage if not in context
    const storedUser = localStorage.getItem('travelConnectUser');
    const authUser = localStorage.getItem('user');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null) || (authUser ? JSON.parse(authUser) : null);
    const userId = actualUser?.id;
    const isCurrentlySelected = userActivities.some(ua => ua.activityId === activityId);
    
    console.log('🔄 TOGGLE ACTIVITY CLICKED!!!:', activityId, activityName, 'currently selected:', isCurrentlySelected);
    console.log('🔄 TOGGLE: userId =', userId, 'city =', selectedCity);

    try {
      if (isCurrentlySelected) {
        // Remove from user activities
        const userActivity = userActivities.find(ua => ua.activityId === activityId);
        if (userActivity) {
          await handleDeleteActivity(userActivity.id);
        }
      } else {
        // Add to user activities
        const response = await fetch('/api/user-city-interests', {
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
          
          // Force re-fetch to ensure UI is in sync
          setTimeout(() => {
            fetchUserActivities();
          }, 100);
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to add activity",
            variant: "destructive",
          });
        }
      }
      
      // Sync to user profile immediately with captured state
      const currentSelectedNames = userActivities
        .filter(ua => ua.cityName === selectedCity)
        .map(ua => ua.activityName);
      
      const updatedSelectedNames = [...currentSelectedNames];
      if (!isCurrentlySelected) {
        updatedSelectedNames.push(activityName);
      } else {
        const index = updatedSelectedNames.indexOf(activityName);
        if (index > -1) updatedSelectedNames.splice(index, 1);
      }
      
      // Immediate sync with captured city name and state
      syncActivitiesToProfile(updatedSelectedNames, selectedCity);
      
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
    const storedUser = localStorage.getItem('travelConnectUser');
    const actualUser = user || (storedUser ? JSON.parse(storedUser) : null);
    const userId = actualUser?.id;
    
    console.log('🗑️ DELETE ACTIVITY: userActivityId:', userActivityId, 'userId:', userId);
    
    try {
      const response = await fetch(`/api/user-city-interests/${userActivityId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId.toString()
        }
      });

      console.log('🗑️ DELETE RESPONSE:', response.status, response.ok);

      if (response.ok) {
        setUserActivities(prev => prev.filter(ua => ua.id !== userActivityId));
        
        // Force re-fetch to ensure UI is in sync
        setTimeout(() => {
          fetchUserActivities();
        }, 100);
        
        // Sync to user profile immediately with captured state
        const remainingSelectedNames = userActivities
          .filter(ua => ua.cityName === selectedCity && ua.id !== userActivityId)
          .map(ua => ua.activityName);
        
        // Immediate sync with captured city name and state
        syncActivitiesToProfile(remainingSelectedNames, selectedCity);
        
        toast({
          title: "Activity Removed",
          description: "Removed from your interests",
        });
      } else {
        const error = await response.json();
        console.error('🗑️ DELETE FAILED:', error);
        toast({
          title: "Error",
          description: error.error || "Failed to remove activity",
          variant: "destructive",
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
      const response = await fetch(`/api/user-city-interests/${editingActivity.id}`, {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-orange-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">🎯 Match in City</h1>
            <p className="text-xl text-white/80 mb-4">Select a city to start matching with people!</p>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-white/90 text-sm leading-relaxed">
                🎯 <strong>Choose activities you want to do</strong> → Get matched with others who share your interests<br/>
                ✏️ <strong>Add your own activities</strong> → Help others discover new experiences<br/>
                💫 <strong>Connect with locals & travelers</strong> → Plan meetups and explore together
              </p>
            </div>
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

          {/* Cities Grid - RESTORED BEAUTIFUL DESIGN */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCities.slice(0, 20).map((city, index) => (
              <div 
                key={index}
                className="relative overflow-hidden rounded-xl cursor-pointer transition-transform hover:scale-105 shadow-lg group"
                onClick={() => setSelectedCity(city.city)}
              >
                {/* Beautiful city photo background like original */}
                <div 
                  className="w-full h-48 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${city.photo})` }}
                >
                  {/* Gradient overlay for text readability */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${city.gradient} backdrop-blur-[1px]`}></div>
                  
                  {/* Content - EXACTLY like original screenshots */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                    <h3 className="text-xl font-bold mb-2 drop-shadow-lg">{city.city}</h3>
                    <p className="text-sm opacity-90 drop-shadow-lg">
                      {city.state ? `${city.state}, ${city.country}` : city.country}
                    </p>
                    
                    {/* Match button like in screenshots */}
                    <div className="mt-3">
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md">
                        ⚡ Start City Matching
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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

  // Delete city activity function (for activities user hasn't selected)
  const handleDeleteCityActivity = async (activityId: number) => {
    try {
      const response = await fetch(`/api/city-activities/${activityId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove from city activities list
        setCityActivities(prev => prev.filter(activity => activity.id !== activityId));
        
        toast({
          title: "Activity Deleted",
          description: "Activity removed from city",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete activity",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Delete city activity error:', error);
      toast({
        title: "Error", 
        description: "Failed to delete activity",
        variant: "destructive",
      });
    }
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

        {/* Instructions */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">🎯 How City Matching Works</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Choose activities you want to do</strong> → Get matched with others who share your interests</p>
              <p>• <strong>Add your own activities</strong> → Help others discover new experiences</p>
              <p>• <strong>Connect with locals & travelers</strong> → Plan meetups and explore together</p>
              <p>• <strong>Edit or delete outdated activities</strong> → Keep your interests current and relevant</p>
            </div>
          </div>
        </div>

        {/* Activity Selection Interface - GORGEOUS RESTORED DESIGN */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-white via-blue-50 to-orange-50 border border-blue-200/50 rounded-2xl shadow-2xl backdrop-blur-sm">
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent mb-4">⭐ Discover Your Perfect {selectedCity} Experience</h2>
                <p className="text-lg text-gray-600">Select activities that inspire you and connect with fellow adventurers</p>
              </div>

              {/* Add new activity section - GORGEOUS DESIGN - MOVED TO TOP */}
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-orange-50 rounded-2xl border border-blue-200/50 shadow-inner">
                <div className="text-center mb-4">
                  <h4 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent mb-2">✨ Create Your Own Experience</h4>
                  <p className="text-gray-600 text-sm">Share something unique you want to do in {selectedCity}</p>
                </div>
                <div className="flex gap-3">
                  <Input
                    placeholder="e.g., Taylor Swift November 8th, Pickleball Saturday Mornings..."
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    className="border-blue-200 bg-white/80 backdrop-blur-sm focus:border-blue-400 focus:ring-blue-200 rounded-xl text-gray-800 placeholder-gray-500 shadow-md"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddActivity();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleAddActivity}
                    className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              
              {/* Dynamic City Activities - Universal + City-Specific + AI */}
              <div className="space-y-8">
                {/* City-Specific AI Activities Section */}
                <div>
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-2">📍 {selectedCity} Specific Activities</h3>
                    <p className="text-gray-600 text-sm mb-4">AI-generated activities unique to this city</p>
                    <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full"></div>
                    
                    {/* AI Enhancement Button */}
                    <Button
                      onClick={async () => {
                        try {
                          setIsLoading(true);
                          toast({
                            title: "🤖 Generating AI Activities",
                            description: `Creating unique activities for ${selectedCity}...`,
                          });
                          
                          const response = await fetch(`/api/city-activities/${selectedCity}/enhance`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                          });
                          
                          if (response.ok) {
                            toast({
                              title: "✨ AI Activities Generated!",
                              description: `Added unique ${selectedCity} activities`,
                            });
                            fetchCityActivities(); // Refresh the list
                          } else {
                            throw new Error('Failed to generate activities');
                          }
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to generate AI activities",
                            variant: "destructive",
                          });
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      className="mt-4 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                      data-testid="button-enhance-ai-activities"
                      disabled={isLoading}
                    >
                      {isLoading ? '🤖 Generating...' : '🤖 Get More AI Activities'}
                    </Button>
                  </div>
                  
                  {cityActivities.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {cityActivities.map((activity, index) => {
                        const isSelected = userActivities.some(ua => ua.activityId === activity.id);
                        const userActivity = userActivities.find(ua => ua.activityId === activity.id);
                        
                        // Get current user ID - check multiple sources
                        const storedUser = localStorage.getItem('travelConnectUser');
                        const actualUser = user || (storedUser ? JSON.parse(storedUser) : null);
                        const currentUserId = actualUser?.id;
                        
                        // Only show edit/delete for activities created by this user
                        const isUserCreated = activity.createdByUserId === currentUserId;
                        
                        return (
                          <div key={activity.id} className="group relative">
                            <button
                              className={`w-full px-5 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 ${
                                isSelected 
                                  ? 'bg-gradient-to-r from-blue-600 to-orange-600 text-white border-blue-400 shadow-blue-200'
                                  : 'bg-gradient-to-r from-gray-50 to-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-blue-100'
                              }`}
                              onClick={() => {
                                handleToggleActivity(activity.id, activity.activityName);
                              }}
                              onMouseDown={(e) => {
                                console.log('🖱️ PILL MOUSE DOWN!', activity.activityName);
                              }}
                              data-testid="activity-pill"
                              type="button"
                              style={{ pointerEvents: 'auto', zIndex: 1 }}
                            >
                              <span className="relative z-10">{activity.activityName}</span>
                            </button>
                            
                            {/* Edit/Delete ONLY for user-created activities */}
                            {isUserCreated && (
                              <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                                <button
                                  className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('🔧 EDIT CLICKED for activity:', activity.activityName);
                                    setEditingActivity({ id: userActivity?.id || activity.id, name: activity.activityName, activityId: activity.id });
                                    setEditingActivityName(activity.activityName);
                                  }}
                                >
                                  <Edit className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('🔧 DELETE CLICKED for activity:', activity.activityName);
                                    if (userActivity) {
                                      handleDeleteActivity(userActivity.id);
                                    } else {
                                      // Delete city activity if user hasn't selected it
                                      handleDeleteCityActivity(activity.id);
                                    }
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
                  )}
                </div>

                {/* Universal Activities - Always show these for every city */}
                <div className="mt-8">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-orange-500 bg-clip-text text-transparent mb-2">🎯 Popular Activities & Interests</h3>
                    <p className="text-gray-600 text-sm">Click to add to your "Things I Want To Do" profile</p>
                    <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-orange-500 mx-auto rounded-full mt-2"></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {[
                      "Meet Locals", "Meet Travelers", "Single and Looking",
                      "Family Activities", "Traveling with Children", "Local Food Specialties", "Restaurants & Dining",
                      "Coffee Culture", "Craft Beer & Breweries", "Wine Tasting", "Cocktail Bars",
                      "Museums", "Art Galleries", "Historical Tours", "Architecture",
                      "City Tours & Sightseeing", "Walking Tours", "Bike Tours", "Photography",
                      "Nightlife & Dancing", "Live Music & Concerts", "LGBTQ+ Friendly", "Theater & Shows", "Comedy Clubs",
                      "Beach Activities", "Hiking & Nature", "Parks & Recreation", "Outdoor Adventures",
                      "Shopping", "Local Markets", "Street Food", "Brunch Spots",
                      "Festivals & Events", "Cultural Experiences", "Networking & Business",
                      "Sports & Fitness", "Yoga & Wellness", "Volunteer Opportunities", "Language Exchange"
                    ].map((activity, index) => {
                      // Check if user already has this activity in their interests
                      const isSelected = userActivities.some(ua => ua.activityName === activity && ua.cityName === selectedCity);
                      
                      return (
                        <button
                          key={activity}
                          className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg border-2 ${
                            isSelected 
                              ? 'bg-gradient-to-r from-blue-600 to-orange-600 text-white border-blue-400 shadow-blue-200'
                              : 'bg-gradient-to-r from-gray-50 to-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-blue-100'
                          }`}
                          onClick={async () => {
                            console.log('🎯 Universal activity clicked:', activity);
                            
                            // Get authenticated user - check multiple sources
                            const storedUser = localStorage.getItem('travelConnectUser');
                            const authStorageUser = localStorage.getItem('user');
                            
                            let actualUser = user;
                            if (!actualUser && storedUser) {
                              try {
                                actualUser = JSON.parse(storedUser);
                              } catch (e) {
                                console.error('Failed to parse stored user:', e);
                              }
                            }
                            if (!actualUser && authStorageUser) {
                              try {
                                actualUser = JSON.parse(authStorageUser);
                              } catch (e) {
                                console.error('Failed to parse auth storage user:', e);
                              }
                            }
                            
                            console.log('🔧 AUTH CHECK:', { user, storedUser: !!storedUser, authStorageUser: !!authStorageUser, actualUser: !!actualUser });
                            
                            // This should never happen due to page-level auth protection
                            if (!actualUser?.id) {
                              console.error('❌ CRITICAL: No user ID found despite page-level auth');
                              return;
                            }
                            
                            const userId = actualUser.id;
                            console.log('🔧 Using userId:', userId);
                            
                            // Create this as a city activity if it doesn't exist, then toggle
                            try {
                              if (!isSelected) {
                                // First create the activity for this city if it doesn't exist
                                const createResponse = await fetch('/api/city-activities', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'x-user-id': userId.toString()
                                  },
                                  body: JSON.stringify({
                                    cityName: selectedCity,
                                    activityName: activity,
                                    createdByUserId: userId,
                                    description: 'Universal activity',
                                    category: 'universal'
                                  })
                                });
                                
                                if (createResponse.ok) {
                                  const newActivity = await createResponse.json();
                                  
                                  // Add to user interests
                                  const interestResponse = await fetch('/api/user-city-interests', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'x-user-id': userId.toString()
                                    },
                                    body: JSON.stringify({
                                      activityId: newActivity.id,
                                      cityName: selectedCity
                                    })
                                  });
                                  
                                  if (interestResponse.ok) {
                                    const newUserActivity = await interestResponse.json();
                                    setUserActivities(prev => [...prev, newUserActivity]);
                                    fetchUserActivities(); // Refresh to sync
                                    
                                    // Sync to user profile immediately with captured state
                                    const selectedNames = [...userActivities, newUserActivity]
                                      .filter(ua => ua.cityName === selectedCity)
                                      .map(ua => ua.activityName);
                                    
                                    // Immediate sync with captured city name and state
                                    syncActivitiesToProfile(selectedNames, selectedCity);
                                  }
                                }
                              } else {
                                // Remove from user activities (handleDeleteActivity already syncs to profile)
                                const userActivity = userActivities.find(ua => ua.activityName === activity && ua.cityName === selectedCity);
                                if (userActivity) {
                                  await handleDeleteActivity(userActivity.id);
                                }
                              }
                            } catch (error) {
                              console.error('Error handling universal activity:', error);
                            }
                          }}
                          data-testid={`universal-activity-${activity.replace(/\s+/g, '-').toLowerCase()}`}
                        >
                          {activity}
                        </button>
                      );
                    })}
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
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-orange-600 flex items-center justify-center text-white font-bold">
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