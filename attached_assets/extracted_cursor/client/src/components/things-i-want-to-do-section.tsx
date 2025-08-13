import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Plus, X, Edit3, Calendar, Users, Sparkles, Heart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { capitalizeText, getCityActivityStyle } from "@/lib/topChoicesUtils";

interface ThingsIWantToDoSectionProps {
  userId: number;
  isOwnProfile: boolean;
}

interface CityActivity {
  id: number;
  city: string;
  activityName: string;
  description?: string;
  category?: string;
}

interface UserCityInterest {
  id: number;
  userId: number;
  cityName: string;
  activityId: number;
  activityName: string;
  isActive: boolean;
}

export function ThingsIWantToDoSection({ userId, isOwnProfile }: ThingsIWantToDoSectionProps) {
  const [newActivity, setNewActivity] = useState("");
  const [selectedCity, setSelectedCity] = useState("Los Angeles"); // Default city
  // Edit state removed - only delete functionality available
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all user city interests
  const { data: userCityInterests = [], refetch: refetchInterests } = useQuery<UserCityInterest[]>({
    queryKey: [`/api/user-city-interests/${userId}`],
    refetchOnWindowFocus: true,
    staleTime: 0 // Always fetch fresh data
  });

  // Get all available cities
  const { data: cities = [] } = useQuery<any[]>({
    queryKey: ['/api/city-stats']
  });

  // Get activity matches for the current user
  const { data: activityMatches = [] } = useQuery<any[]>({
    queryKey: [`/api/activity-matches/${userId}`],
    enabled: isOwnProfile
  });

  // Add new activity mutation
  const addActivityMutation = useMutation({
    mutationFn: async (activityName: string) => {
      // First create the city activity
      const activityResponse = await apiRequest('POST', '/api/city-activities', {
        city: selectedCity,
        activityName: activityName.trim(),
        description: `Activity in ${selectedCity}`,
        category: 'user-generated',
        state: '',
        country: ''
      });
      
      if (!activityResponse.ok) throw new Error('Failed to create activity');
      const newCityActivity = await activityResponse.json();

      // Then add user interest
      const interestResponse = await apiRequest('POST', '/api/user-city-interests', {
        activityId: newCityActivity.id,
        cityName: selectedCity
      });
      
      if (!interestResponse.ok) throw new Error('Failed to add interest');
      return interestResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user-city-interests/${userId}`] });
      setNewActivity("");
      toast({
        title: "Activity added",
        description: `Added "${newActivity}" to ${selectedCity}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add activity. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Remove activity mutation
  const removeActivityMutation = useMutation({
    mutationFn: async (interestId: number) => {
      console.log('Deleting interest ID:', interestId);
      const response = await apiRequest('DELETE', `/api/user-city-interests/${interestId}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to remove interest: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user-city-interests/${userId}`] });
      toast({
        title: "Activity removed",
        description: "Activity removed from your interests.",
      });
    },
    onError: (error) => {
      console.error('Remove activity error:', error);
      toast({
        title: "Error",
        description: "Failed to remove activity. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Removed update activity mutation - edit functionality disabled

  const handleAddActivity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newActivity.trim() && selectedCity) {
      addActivityMutation.mutate(newActivity.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddActivity();
    }
  };

  const handleRemoveActivity = (interestId: number) => {
    console.log('handleRemoveActivity called with ID:', interestId);
    removeActivityMutation.mutate(interestId);
  };

  // Edit functionality removed - only delete is available

  // Generate AI activities for a city
  const generateAIActivities = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await apiRequest('POST', `/api/ai-city-activities/${selectedCity}`);
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "AI Activities Generated",
          description: `Generated ${result.saved} new activities for ${selectedCity}!`,
        });
        // Refresh the city activities data
        queryClient.invalidateQueries({ queryKey: [`/api/user-city-interests/${userId}`] });
      } else {
        throw new Error('Failed to generate activities');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI activities. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Delete all activities for a city
  const deleteCityMutation = useMutation({
    mutationFn: async (cityName: string) => {
      const cityInterests = userCityInterests.filter(interest => interest.cityName === cityName);
      console.log('Deleting city interests:', cityInterests);
      
      const deletePromises = cityInterests.map(async (interest) => {
        const response = await apiRequest('DELETE', `/api/user-city-interests/${interest.id}`);
        if (!response.ok) {
          throw new Error(`Failed to delete interest ${interest.id}`);
        }
        return response.json();
      });
      
      await Promise.all(deletePromises);
      return cityName;
    },
    onSuccess: (cityName) => {
      queryClient.invalidateQueries({ queryKey: [`/api/user-city-interests/${userId}`] });
      toast({
        title: "City removed",
        description: `All activities for ${cityName} have been removed.`,
      });
    },
    onError: (error) => {
      console.error('Delete city error:', error);
      toast({
        title: "Error",
        description: "Failed to remove city. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleDeleteCity = (cityName: string) => {
    if (confirm(`Are you sure you want to remove all activities for ${cityName}? This action cannot be undone.`)) {
      deleteCityMutation.mutate(cityName);
    }
  };

  // Group interests by city
  const interestsByCity = userCityInterests.reduce((acc, interest) => {
    if (!acc[interest.cityName]) {
      acc[interest.cityName] = [];
    }
    acc[interest.cityName].push(interest);
    return acc;
  }, {} as Record<string, UserCityInterest[]>);

  if (!isOwnProfile && Object.keys(interestsByCity).length === 0) {
    return null; // Don't show section if viewing another profile with no interests
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">⭐ Things I Want to Do in... ({userCityInterests.length})</h2>
          {isOwnProfile && Object.keys(interestsByCity).length > 0 && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsEditing(!isEditing)}
              className="bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600"
            >
              <Edit3 className="w-3 h-3 mr-1" />
              {isEditing ? 'Done' : 'Edit'}
            </Button>
          )}
        </div>
        
        {/* City Display with Proper Styling and Capitalization */}
        {Object.keys(interestsByCity).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(interestsByCity).map(([cityName, interests]) => (
              <div key={cityName}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-red-500">{cityName}</h3>
                  {isOwnProfile && isEditing && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Delete city button clicked for:', cityName);
                        handleDeleteCity(cityName);
                      }}
                      className="h-7 px-2 text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Remove City
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <div key={interest.id} className="relative group">
                      <Badge 
                        className="bg-blue-500 text-white border-0 px-4 py-2 text-sm font-medium whitespace-nowrap min-w-[100px] h-9 flex items-center justify-center"
                      >
                        {capitalizeText(interest.activityName)}
                      </Badge>
                      {isOwnProfile && isEditing && (
                        <div className="absolute -top-2 -right-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Delete button clicked for interest:', interest);
                              handleRemoveActivity(interest.id);
                            }}
                            className="h-5 w-5 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
                          >
                            <X className="w-2 h-2" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>No activities selected yet. Visit the Match in City page to add activities.</p>
          </div>
        )}
      </div>
    </div>
  );
}