import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Zap, Clock, MapPin, Users, Coffee, Plus } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/App';
import { authStorage } from '@/lib/auth';
import SmartLocationInput from '@/components/SmartLocationInput';

interface NewMeetup {
  title: string;
  description: string;
  meetingPoint: string;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  responseTime: string;
}

export function QuickMeetupWidget({ city, profileUserId }: { city?: string; profileUserId?: number }) {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedMeetup, setExpandedMeetup] = useState<number | null>(null);
  const [isCustomActivity, setIsCustomActivity] = useState(false);

  // CRITICAL FIX: Get user data like navbar does (authStorage is more reliable)
  const actualUser = user || authStorage.getUser();
  console.log('🔧 USER DATA SOURCES:', { 
    contextUser: user ? `ID:${user.id}` : 'null',
    storageUser: authStorage.getUser() ? `ID:${authStorage.getUser()?.id}` : 'null',
    actualUser: actualUser ? `ID:${actualUser.id} Username:${actualUser.username}` : 'null'
  });

  // Fetch existing quick meetups
  const { data: quickMeetups, isLoading } = useQuery({
    queryKey: ['/api/quick-meetups', city, profileUserId],
    queryFn: async () => {
      let url = '/api/quick-meetups';
      const params = new URLSearchParams();
      
      if (city) params.append('city', city);
      if (profileUserId) params.append('userId', profileUserId.toString());
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          ...(actualUser?.id && { 'x-user-id': actualUser.id.toString() })
        }
      });
      if (!response.ok) throw new Error('Failed to fetch quick meetups');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });
  const [newMeetup, setNewMeetup] = useState<NewMeetup>({
    title: '',
    description: '',
    meetingPoint: '',
    streetAddress: '',
    city: actualUser?.hometownCity || '',
    state: actualUser?.hometownState || '',
    country: actualUser?.hometownCountry || 'United States',
    zipcode: '',
    responseTime: '1hour'
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentCityName = city?.split(',')[0] || 'your city';

  // Debug logging - check authentication (REMOVED - using actualUser now)

  // Join meetup mutation
  const joinMutation = useMutation({
    mutationFn: async (meetupId: number) => {
      if (!actualUser?.id) {
        console.error('❌ JOIN FAILED: User not authenticated:', { contextUser: user, storageUser: authStorage.getUser() });
        throw new Error("Please log in to join meetups");
      }

      console.log('🚀 ATTEMPTING JOIN:', { meetupId, userId: actualUser.id });
      
      const result = await apiRequest('POST', `/api/quick-meetups/${meetupId}/join`, {
        userId: actualUser.id
      });

      console.log('✅ JOIN SUCCESS:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quick-meetups'] });
      toast({
        title: "Joined!",
        description: "You've successfully joined the meetup.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join meetup",
        variant: "destructive",
      });
    },
  });

  const handleJoinMeetup = (meetupId: number) => {
    joinMutation.mutate(meetupId);
  };

  const createMutation = useMutation({
    mutationFn: async (meetupData: any) => {
      if (!actualUser?.id) {
        throw new Error("Please log in to create meetups");
      }

      // Calculate expiration based on response time
      const now = new Date();
      let expireHours = 1; // default 1 hour
      switch (meetupData.responseTime) {
        case '1hour': expireHours = 1; break;
        case '2hours': expireHours = 2; break;
        case '3hours': expireHours = 3; break;
        case '4hours': expireHours = 4; break;
        case '6hours': expireHours = 6; break;
        case '8hours': expireHours = 8; break;
        case '12hours': expireHours = 12; break;
        case '24hours': expireHours = 24; break;
        default: expireHours = 1;
      }
      const expiresAt = new Date(now.getTime() + (expireHours * 60 * 60 * 1000));

      console.log('🚀 CREATING QUICK MEETUP:', meetupData);
      console.log('🏠 STREET ADDRESS FROM FORM:', meetupData.streetAddress);
      
      const meetupPayload = {
        title: meetupData.title,
        description: meetupData.description || 'Quick meetup',
        meetingPoint: meetupData.meetingPoint,
        street: meetupData.streetAddress || '',
        city: meetupData.city,
        state: meetupData.state,
        country: meetupData.country,
        zipcode: meetupData.zipcode || '',
        location: `${meetupData.city}, ${meetupData.state}`,
        responseTime: meetupData.responseTime,
        expiresAt: expiresAt.toISOString(),
        maxParticipants: 10,
        minParticipants: 1,
        costEstimate: null,
        availability: 'available',
        urgency: 'medium',
        autoCancel: false,
        isActive: true,
        isSpontaneous: true,
        organizerId: actualUser.id,
        userId: actualUser.id,
        participantCount: 1,
        availableAt: now.toISOString(),
        createdAt: now.toISOString(),
        category: 'social'
      };

      console.log('📦 MEETUP PAYLOAD:', meetupPayload);
      console.log('🏠 STREET IN PAYLOAD:', meetupPayload.street);
      
      return await apiRequest('POST', '/api/quick-meetups', meetupPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quick-meetups'] });
      setShowCreateForm(false);
      setIsCustomActivity(false);
      setNewMeetup({
        title: '',
        description: '',
        meetingPoint: '',
        streetAddress: '',
        city: actualUser?.hometownCity || '',
        state: actualUser?.hometownState || '',
        country: actualUser?.hometownCountry || 'United States',
        zipcode: '',
        responseTime: '1hour'
      });
      toast({
        title: "Quick Meetup Posted!",
        description: "Your availability is now live for others to join.",
      });
    },
    onError: (error: any) => {
      console.error('❌ CREATE MEETUP ERROR:', error);
      toast({
        title: "Error Creating Meetup",
        description: error.message || "Failed to post availability. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCreateMeetup = () => {
    console.log('🔥 CLICKED: Post My Availability button');
    console.log('🔥 FORM DATA:', newMeetup);
    
    if (!newMeetup.title.trim() || !newMeetup.meetingPoint.trim()) {
      console.log('🔥 VALIDATION FAILED: Missing title or meeting point');
      toast({
        title: "Missing Information",
        description: "Please fill in activity and meeting point.",
        variant: "destructive"
      });
      return;
    }

    if (!newMeetup.city.trim() || !newMeetup.state.trim() || !newMeetup.country.trim()) {
      console.log('🔥 VALIDATION FAILED: Missing location data');
      console.log('🔥 LOCATION VALUES:', { 
        city: `"${newMeetup.city}"`, 
        state: `"${newMeetup.state}"`, 
        country: `"${newMeetup.country}"` 
      });
      toast({
        title: "Missing Location",
        description: "Please select country, state, and city.",
        variant: "destructive"
      });
      return;
    }

    console.log('🔥 VALIDATION PASSED - Creating meetup');
    createMutation.mutate(newMeetup);
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 w-full">
        <CardContent className="p-4 bg-transparent">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-gray-900 dark:text-white">Loading quick meetups...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 overflow-x-hidden">
      {/* PRIMARY CTA BUTTON - TOP PLACEMENT */}
      <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 hover:shadow-lg transition-all duration-200 w-full max-h-[90vh] overflow-hidden">
        <CardContent className="p-4 bg-transparent">
          {!showCreateForm ? (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Ready to Meet</h3>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Create Quick Meetup
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Create instant meetups and connect with nearby travelers
                </p>
              </div>
              <Button
                onClick={() => {
                  console.log('🔥 CLICKED: I\'m Available Now button');
                  setShowCreateForm(true);
                  console.log('🔥 FORM STATE CHANGED TO TRUE');
                }}
                className="w-full text-base py-3 h-12 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white border-0 font-semibold rounded-lg shadow-lg"
              >
                🎯 I'm Available Now
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[80vh] overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">I'm Available for:</h4>
                </div>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  size="sm"
                  variant="ghost"
                  className="text-xs px-2 py-1 h-6"
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-2 flex-1">
                {/* HOUR DROPDOWN - MOVED TO TOP FOR VISIBILITY */}
                <Select 
                  value={newMeetup.responseTime}
                  onValueChange={(value) => setNewMeetup(prev => ({ ...prev, responseTime: value }))}
                >
                  <SelectTrigger className="h-8 text-xs bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600 text-gray-900 dark:text-white font-medium">
                    <SelectValue placeholder="Available for how long?" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    <SelectItem value="1hour">⏰ Available for 1 hour, drop down for more</SelectItem>
                    <SelectItem value="2hours">⏰ Available for 2 hours</SelectItem>
                    <SelectItem value="3hours">⏰ Available for 3 hours</SelectItem>
                    <SelectItem value="4hours">⏰ Available for 4 hours</SelectItem>
                    <SelectItem value="6hours">⏰ Available for 6 hours</SelectItem>
                    <SelectItem value="8hours">⏰ Available for 8 hours</SelectItem>
                    <SelectItem value="12hours">⏰ Available for 12 hours</SelectItem>
                    <SelectItem value="24hours">⏰ Available for 24 hours</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={isCustomActivity ? "custom" : (newMeetup.title || "custom")}
                  onValueChange={(value) => {
                    console.log('🔥 ACTIVITY SELECTED:', value);
                    if (value === "custom") {
                      setIsCustomActivity(true);
                      setNewMeetup(prev => ({ ...prev, title: '' }));
                    } else {
                      setIsCustomActivity(false);
                      setNewMeetup(prev => ({ ...prev, title: value }));
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue placeholder="What activity?" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    <SelectItem value="Coffee Chat">☕ Coffee Chat</SelectItem>
                    <SelectItem value="Quick Walk">🚶 Quick Walk</SelectItem>
                    <SelectItem value="Lunch">🍽️ Lunch</SelectItem>
                    <SelectItem value="Drinks">🍻 Drinks</SelectItem>
                    <SelectItem value="Bike Ride">🚴 Bike Ride</SelectItem>
                    <SelectItem value="Go out and Party">🎉 Go out and Party</SelectItem>
                    <SelectItem value="Beach Day">🏖️ Beach Day</SelectItem>
                    <SelectItem value="Food Tour">🍕 Food Tour</SelectItem>
                    <SelectItem value="Sunset Viewing">🌅 Sunset Viewing</SelectItem>
                    <SelectItem value="Local Sightseeing">📸 Local Sightseeing</SelectItem>
                    <SelectItem value="Workout">💪 Workout</SelectItem>
                    <SelectItem value="Explore Area">🗺️ Explore Area</SelectItem>
                    <SelectItem value="custom">✏️ Custom Activity</SelectItem>
                  </SelectContent>
                </Select>
                
                {isCustomActivity && (
                  <input
                    type="text"
                    placeholder="Enter custom activity..."
                    value={newMeetup.title}
                    onChange={(e) => setNewMeetup(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    style={{ fontSize: '16px' }}
                    autoComplete="off"
                    inputMode="text"
                  />
                )}
                
                <textarea
                  placeholder="Brief description (optional)..."
                  value={newMeetup.description}
                  onChange={(e) => setNewMeetup(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded h-12 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                
                <input
                  type="text"
                  placeholder="Meeting point (e.g., Starbucks on Main St)"
                  value={newMeetup.meetingPoint}
                  onChange={(e) => setNewMeetup(prev => ({ ...prev, meetingPoint: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                
                <input
                  type="text"
                  placeholder="Street address (optional)"
                  value={newMeetup.streetAddress}
                  onChange={(e) => setNewMeetup(prev => ({ ...prev, streetAddress: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                
                {/* Location Selection - FIXED TO USE SMARTLOCATIONINPUT */}
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Location *</div>
                <SmartLocationInput
                  city={newMeetup.city}
                  state={newMeetup.state}
                  country={newMeetup.country}
                  onLocationChange={(location) => {
                    console.log('🔥 LOCATION CHANGED:', location);
                    setNewMeetup(prev => ({
                      ...prev,
                      city: location.city,
                      state: location.state,
                      country: location.country
                    }));
                  }}
                  required={true}
                  placeholder={{
                    country: "Country",
                    state: "State",
                    city: "City"
                  }}
                />
              </div>
              
              <Button
                onClick={handleCreateMeetup}
                disabled={createMutation.isPending}
                className="w-full text-xs py-2 h-8 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white border-0"
              >
                {createMutation.isPending ? 'Posting...' : 'Post My Availability'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Quick Meetups - Only show ACTIVE meetups */}
      {quickMeetups && quickMeetups.length > 0 && (
        <div className="grid gap-3">
          {quickMeetups
            .filter((meetup: any) => new Date(meetup.expiresAt).getTime() > Date.now())
            .slice(0, 3)
            .map((meetup: any) => {
              const isOwn = meetup.organizerId === user?.id;
              const expiresAtLocal = new Date(meetup.expiresAt);
              const timeLeft = Math.max(0, expiresAtLocal.getTime() - Date.now());
              const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
              const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
              const untilStr = expiresAtLocal.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

              return (
                <Card key={meetup.id} className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 overflow-visible">
                  <CardContent className="p-3 space-y-3 overflow-visible">
                    {/* Top row: avatar + author + countdown (wraps on small) */}
                    <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={meetup.organizerProfileImage} className="object-cover" />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-orange-500 text-white">
                            {meetup.organizerUsername?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                            @{meetup.organizerUsername} {isOwn && '(you)'}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Posted {new Date(meetup.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-600 shrink-0"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`} left
                      </Badge>
                    </div>

                    {/* Title */}
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white break-words">
                      {meetup.title}
                    </h4>

                    {/* Location details (always visible) */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-start gap-2 min-w-0">
                        <MapPin className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-gray-700 dark:text-gray-300 min-w-0">
                          <div className="truncate"><span className="font-medium">Meet:</span> {meetup.meetingPoint}</div>
                          {meetup.street && (
                            <div className="truncate"><span className="font-medium">Address:</span> {meetup.street}</div>
                          )}
                          <div className="truncate">
                            <span className="font-medium">City:</span> {meetup.city}
                            {meetup.state ? `, ${meetup.state}` : ''}{meetup.country ? `, ${meetup.country}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        Available until {untilStr}
                      </div>
                    </div>

                    {/* Optional description (clamped) */}
                    {meetup.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 break-words line-clamp-3">
                        {meetup.description}
                      </p>
                    )}
                  
                    {/* Participants */}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[11px]">
                        <Users className="w-3 h-3 mr-1" />
                        {meetup.participantCount} joined
                      </Badge>
                    </div>

                    {/* Action */}
                    <div className="pt-2 border-t border-orange-200 dark:border-orange-700">
                      {!isOwn ? (
                        <Button
                          size="sm"
                          onClick={() => handleJoinMeetup(meetup.id)}
                          disabled={joinMutation.isPending}
                          className="w-full sm:w-auto max-w-full inline-flex items-center justify-center gap-2 rounded-full
                                     text-xs py-2 h-9 bg-gradient-to-r from-blue-500 to-orange-500
                                     hover:from-blue-600 hover:to-orange-600 text-white border-0 overflow-hidden"
                        >
                          <span className="truncate">
                            {joinMutation.isPending ? 'Joining...' : '🤝 Join Meetup'}
                          </span>
                        </Button>
                      ) : (
                        <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-2">
                          You created this meetup
                        </div>
                      )}
                    </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}