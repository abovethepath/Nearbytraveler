import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Zap, Clock, MapPin, Users, Coffee, Plus, MessageCircle, Edit3, Trash2, MessageSquare } from 'lucide-react';
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
  organizerNotes: string; // Contact info like "call me if lost"
}

export function QuickMeetupWidget({ city, profileUserId, triggerCreate }: { city?: string; profileUserId?: number; triggerCreate?: boolean }) {
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
    responseTime: '24hours',
    organizerNotes: '' // Contact info like "call me if lost"
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentCityName = city?.split(',')[0] || 'your city';

  // Trigger create form when triggerCreate prop is true
  useEffect(() => {
    if (triggerCreate) {
      setShowCreateForm(true);
    }
  }, [triggerCreate]);

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

      // Calculate expiration based on response time - ALWAYS USE LOCAL TIME
      const now = new Date();
      let expireHours = 1; // default 1 hour
      switch (meetupData.responseTime) {
        case '1hour': expireHours = 1; break;
        case '2hours': expireHours = 2; break;
        case '3hours': expireHours = 3; break;
        case '6hours': expireHours = 6; break;
        case '12hours': expireHours = 12; break;
        case '24hours': expireHours = 24; break;
        default: expireHours = 1; // default to 1 hour instead of 24
      }
      
      // Create expiration time in LOCAL timezone (not UTC)
      const expiresAt = new Date();
      expiresAt.setHours(now.getHours() + expireHours, now.getMinutes(), now.getSeconds(), now.getMilliseconds());

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
        organizerNotes: meetupData.organizerNotes || '', // Contact notes like "call me if lost"
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
        responseTime: '1hour',
        organizerNotes: ''
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

  // Delete meetup mutation
  const deleteMutation = useMutation({
    mutationFn: async (meetupId: number) => {
      return await apiRequest('DELETE', `/api/quick-meetups/${meetupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quick-meetups'] });
      toast({
        title: "Deleted!",
        description: "Your meetup has been deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete meetup",
        variant: "destructive",
      });
    },
  });

  const deleteMeetup = (meetupId: number) => {
    deleteMutation.mutate(meetupId);
  };

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
    <div className="w-full">
      {/* ENERGETIC PRIMARY CTA - LETS MEET NOW! */}
      <Card className="border-2 border-orange-400 dark:border-orange-600 bg-gradient-to-br from-orange-100 via-red-50 to-pink-100 dark:from-orange-900/40 dark:via-red-900/30 dark:to-pink-900/40 hover:shadow-xl hover:shadow-orange-200 dark:hover:shadow-orange-900/30 transition-all duration-300 w-full max-h-[90vh] overflow-hidden animate-pulse-slow">
        <CardContent className="p-6 bg-transparent">
          {!showCreateForm ? (
            <div className="text-center space-y-4">
              <div className="relative">
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div className="relative flex items-center justify-center gap-3">
                  <Zap className="h-8 w-8 text-orange-600 dark:text-orange-400 animate-bounce" />
                  <h3 className="font-black text-2xl bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                    LET'S MEET NOW!
                  </h3>
                  <Zap className="h-8 w-8 text-orange-600 dark:text-orange-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-bold text-orange-800 dark:text-orange-200">
                  🚀 Available This Second?
                </p>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Create instant meetup • Expires today
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                  ⚡ Lightning-fast connections with nearby people!
                </p>
              </div>
              
              <div className="relative">
                <Button
                  onClick={() => {
                    console.log('🔥 CLICKED: LETS MEET NOW! button');
                    setShowCreateForm(true);
                    console.log('🔥 FORM STATE CHANGED TO TRUE');
                  }}
                  className="w-full text-xl font-black py-6 h-16 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white border-0 rounded-xl shadow-2xl hover:shadow-orange-300 dark:hover:shadow-orange-900/50 transform hover:scale-105 transition-all duration-300 relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    🎯 LETS MEET NOW!
                    <Clock className="h-6 w-6 animate-spin" />
                  </span>
                  {/* Animated shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] animate-shine"></div>
                </Button>
                
                {/* Quick action buttons */}
                <div className="mt-3 flex gap-2 justify-center">
                  <Badge className="bg-orange-500 text-white px-3 py-1 text-xs font-bold animate-pulse">TODAY</Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[80vh] overflow-y-auto no-scrollbar flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-orange-500 animate-bounce" />
                  <h4 className="font-bold text-lg bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">🚀 LET'S DO THIS!</h4>
                </div>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  size="sm"
                  variant="ghost"
                  className="text-sm px-3 py-2 h-8 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
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
                    <SelectItem value="1hour">⏰ 1 hour</SelectItem>
                    <SelectItem value="2hours">⏰ 2 hours</SelectItem>
                    <SelectItem value="3hours">⏰ 3 hours</SelectItem>
                    <SelectItem value="6hours">⏰ 6 hours</SelectItem>
                    <SelectItem value="12hours">⏰ 12 hours</SelectItem>
                    <SelectItem value="24hours">⏰ Today (24 hours)</SelectItem>
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
                
                <textarea
                  placeholder="Contact notes (e.g., 'Call me if lost: 555-1234', 'Text if running late')"
                  value={newMeetup.organizerNotes}
                  onChange={(e) => setNewMeetup(prev => ({ ...prev, organizerNotes: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded h-16 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  data-testid="input-organizer-notes"
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
                className="w-full text-lg font-black py-4 h-14 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white border-0 rounded-xl shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {createMutation.isPending ? '🚀 POSTING...' : '🎯 LETS MEET NOW!'}
                  {!createMutation.isPending && <Clock className="h-5 w-5 animate-spin" />}
                </span>
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] animate-shine"></div>
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
              
              // ALWAYS USE LOCAL TIME for countdown calculations
              const now = new Date();
              const expiresAtLocal = new Date(meetup.expiresAt);
              const timeLeft = Math.max(0, expiresAtLocal.getTime() - now.getTime());
              const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
              const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
              
              // Display expiration time in LOCAL timezone
              const untilStr = expiresAtLocal.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Explicit local timezone
              });

              return (
                <Card 
                  key={meetup.id} 
                  className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 overflow-visible cursor-pointer hover:shadow-md hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-200"
                  onClick={() => window.location.href = `/quick-meetup-chat/${meetup.id}`}
                >
                  <CardContent className="p-3 space-y-3 overflow-visible">
                    {/* Top row: avatar + author + countdown (wraps on small) */}
                    <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="w-8 h-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-orange-400 transition-all" 
                                onClick={() => !isOwn && meetup.organizerId && (window.location.href = `/profile/${meetup.organizerId}`)}>
                          <AvatarImage 
                            src={meetup.organizerProfileImage || ''} 
                            alt={`${meetup.organizerUsername || 'User'}'s profile`}
                            className="object-cover" 
                          />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-orange-500 text-white font-semibold">
                            {(meetup.organizerUsername || meetup.organizerName || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <p 
                              className={`text-xs font-medium text-gray-700 dark:text-gray-300 truncate ${!isOwn ? 'cursor-pointer hover:text-orange-600 dark:hover:text-orange-400' : ''}`}
                              onClick={() => !isOwn && meetup.organizerId && (window.location.href = `/profile/${meetup.organizerId}`)}
                            >
                              @{meetup.organizerUsername || 'Unknown'} {isOwn && '(you)'}
                            </p>
                            {/* Action buttons */}
                            <div className="flex items-center gap-1">
                              {!isOwn && meetup.organizerId && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/chat/${meetup.organizerId}`;
                                  }}
                                  className="p-1 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                                  title="Message organizer"
                                >
                                  <MessageCircle className="w-3 h-3 text-orange-500" />
                                </button>
                              )}
                              
                              {/* Group Chat Button - Available to all participants */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/quick-meetup-chat/${meetup.id}`;
                                }}
                                className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                title="Join group chat"
                              >
                                <MessageSquare className="w-3 h-3 text-blue-500" />
                              </button>

                              {/* Edit/Delete buttons for owner */}
                              {isOwn && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // TODO: Implement edit modal
                                      console.log('Edit meetup:', meetup.id);
                                    }}
                                    className="p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                    title="Edit meetup"
                                  >
                                    <Edit3 className="w-3 h-3 text-green-500" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm('Delete this meetup? This action cannot be undone.')) {
                                        deleteMeetup(meetup.id);
                                      }
                                    }}
                                    className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                    title="Delete meetup"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            {meetup.organizerName && `${meetup.organizerName} • `}Posted {new Date(meetup.createdAt).toLocaleDateString()}
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

                    {/* Organizer Contact Notes */}
                    {meetup.organizerNotes && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md border border-blue-200 dark:border-blue-800" data-testid="organizer-notes">
                        <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
                          📞 Contact Info: {meetup.organizerNotes}
                        </p>
                      </div>
                    )}
                  
                    {/* Participants and Call to Action */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="text-[11px]">
                        <Users className="w-3 h-3 mr-1" />
                        {meetup.participantCount} joined
                      </Badge>
                      
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                        Click to view details & chat →
                      </div>
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