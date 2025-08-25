import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Heart, Star, Globe, Edit, Users, Calendar, Target } from 'lucide-react';
import { useQuery as useAuthQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type User = {
  id: number;
  username: string;
  email: string;
  password?: string;
  name: string;
  profileImage?: string;
  hometownCity?: string;
  hometownState?: string;
  hometownCountry?: string;
  interests?: string[];
  activities?: string[];
  events?: string[];
  topChoices?: string[];
  userType?: string;
  bio?: string;
  location?: string;
};

export default function ProfilePage() {
  const [, params] = useRoute('/profile/:userId?');
  // Get current user
  const { data: currentUser } = useAuthQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });
  const queryClient = useQueryClient();
  
  const userId = params?.userId || currentUser?.id;
  const isOwnProfile = !params?.userId || params?.userId === String(currentUser?.id);
  
  // Edit mode state
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [editFormData, setEditFormData] = useState({
    topChoices: [] as string[],
    interests: [] as string[],
    activities: [] as string[],
    events: [] as string[]
  });

  // Fetch user data
  const { data: user, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      setEditingPreferences(false);
    },
  });

  // Initialize form data when user data loads
  useEffect(() => {
    if (user) {
      setEditFormData({
        topChoices: user.topChoices || [],
        interests: user.interests || [],
        activities: user.activities || [],
        events: user.events || []
      });
    }
  }, [user]);

  const handleSaveAll = () => {
    updateMutation.mutate(editFormData);
  };

  const handleCancel = () => {
    setEditingPreferences(false);
    setEditFormData({
      topChoices: user?.topChoices || [],
      interests: user?.interests || [],
      activities: user?.activities || [],
      events: user?.events || []
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  if (!user) {
    return <div className="p-8 text-center">User not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.profileImage} />
                <AvatarFallback className="text-2xl">
                  {user.name?.[0]}{user.username?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  @{user.username}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  {user.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  From: {user.hometownCity}, {user.hometownState || user.hometownCountry}
                </p>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-2">
                  {user.userType === 'business' 
                    ? `Nearby Business in ${user.hometownCity}`
                    : `Nearby Local ${user.hometownCity}`
                  }
                </p>
              </div>
            </div>

            {user.bio && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">{user.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preferences Section - Your Clean 4-Row Layout */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-orange-500" />
                Preferences
              </CardTitle>
              
              {/* Single Edit All Button */}
              {isOwnProfile && !editingPreferences && (
                <Button
                  onClick={() => setEditingPreferences(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit All Preferences
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {editingPreferences ? (
              // EDITING MODE - Simple form interface
              <div className="space-y-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-blue-700 dark:text-blue-300">
                    Edit your preferences to match with travelers, locals, and businesses
                  </p>
                </div>

                {/* Simple text inputs for each category */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Top Choices (comma separated)</label>
                    <Input
                      value={editFormData.topChoices.join(', ')}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        topChoices: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      placeholder="Travel, Food, Music, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Interests (comma separated)</label>
                    <Input
                      value={editFormData.interests.join(', ')}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        interests: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      placeholder="Photography, Art, Technology, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Activities (comma separated)</label>
                    <Input
                      value={editFormData.activities.join(', ')}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        activities: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      placeholder="Hiking, Swimming, Golf, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Events (comma separated)</label>
                    <Input
                      value={editFormData.events.join(', ')}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        events: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      placeholder="Concerts, Sports, Festivals, etc."
                    />
                  </div>
                </div>

                {/* Save/Cancel Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={handleSaveAll}
                    disabled={updateMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save All Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // DISPLAY MODE - Your Beautiful 4 Rows
              <div className="space-y-6">
                
                {/* ROW 1: Top Choices (Yellow Pills) */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-yellow-500" />
                    <h4 className="font-medium text-gray-800 dark:text-white">Top Choices</h4>
                    <span className="text-sm text-gray-500">({(user.topChoices || []).length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(user.topChoices || []).length > 0 ? (
                      user.topChoices!.slice(0, 8).map((choice, index) => (
                        <div key={index} className="inline-flex items-center justify-center h-10 min-w-[6rem] rounded-full px-4 text-base font-medium leading-none whitespace-nowrap bg-yellow-500 text-white border-0">
                          {choice}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No top choices selected yet</p>
                    )}
                  </div>
                </div>

                {/* ROW 2: Interests (Blue Pills) */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4 text-blue-500" />
                    <h4 className="font-medium text-gray-800 dark:text-white">Interests</h4>
                    <span className="text-sm text-gray-500">({(user.interests || []).length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(user.interests || []).length > 0 ? (
                      user.interests!.slice(0, 8).map((interest, index) => (
                        <div key={index} className="inline-flex items-center justify-center h-10 min-w-[6rem] rounded-full px-4 text-base font-medium leading-none whitespace-nowrap bg-blue-600 text-white border-0">
                          {interest}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No interests selected yet</p>
                    )}
                  </div>
                </div>

                {/* ROW 3: Activities (Green Pills) */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-green-500" />
                    <h4 className="font-medium text-gray-800 dark:text-white">Activities</h4>
                    <span className="text-sm text-gray-500">({(user.activities || []).length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(user.activities || []).length > 0 ? (
                      user.activities!.slice(0, 8).map((activity, index) => (
                        <div key={index} className="inline-flex items-center justify-center h-10 min-w-[6rem] rounded-full px-4 text-base font-medium leading-none whitespace-nowrap bg-green-600 text-white border-0">
                          {activity}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No activities selected yet</p>
                    )}
                  </div>
                </div>

                {/* ROW 4: Events (Purple Pills) */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <h4 className="font-medium text-gray-800 dark:text-white">Events</h4>
                    <span className="text-sm text-gray-500">({(user.events || []).length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(user.events || []).length > 0 ? (
                      user.events!.slice(0, 8).map((event, index) => (
                        <div key={index} className="inline-flex items-center justify-center h-10 min-w-[6rem] rounded-full px-4 text-base font-medium leading-none whitespace-nowrap bg-purple-600 text-white border-0">
                          {event}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No events selected yet</p>
                    )}
                  </div>
                </div>

              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}