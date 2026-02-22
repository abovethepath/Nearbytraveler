import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Zap, Clock, MapPin, Users, Coffee, Plus, MessageCircle, Edit3, Trash2, MessageSquare, Mic, Sparkles } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/App';
import { authStorage } from '@/lib/auth';
import SmartLocationInput from '@/components/SmartLocationInput';
import { isStateOptionalForCountry } from '@/lib/locationHelpers';
import { useLocation } from 'wouter';
import { AIQuickCreateMeetup } from '@/components/AIQuickCreateMeetup';

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
  const [, setLocation] = useLocation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedMeetup, setExpandedMeetup] = useState<number | null>(null);
  const [isCustomActivity, setIsCustomActivity] = useState(false);
  const [editingMeetupId, setEditingMeetupId] = useState<number | null>(null);
  const [useAiVoice, setUseAiVoice] = useState(false);

  // CRITICAL FIX: Get user data like navbar does (authStorage is more reliable)
  const actualUser = user || authStorage.getUser();

  // Fetch existing quick meetups
  const { data: quickMeetups, isLoading } = useQuery({
    queryKey: ['/api/quick-meets', city, profileUserId],
    queryFn: async () => {
      let url = '/api/quick-meets';
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
  const resolvedLocation = (() => {
    if (!actualUser) return { city: '', state: '', country: 'United States' };
    const now = new Date();
    const hasActiveTrip = actualUser.isCurrentlyTraveling &&
      actualUser.destinationCity &&
      (!actualUser.travelEndDate || new Date(actualUser.travelEndDate) >= now) &&
      (!actualUser.travelStartDate || new Date(actualUser.travelStartDate) <= now);
    if (hasActiveTrip) {
      return {
        city: actualUser.destinationCity || '',
        state: actualUser.destinationState || '',
        country: actualUser.destinationCountry || 'United States',
      };
    }
    if (actualUser.travelDestination && actualUser.isCurrentlyTraveling) {
      return {
        city: actualUser.travelDestination || '',
        state: '',
        country: actualUser.destinationCountry || actualUser.hometownCountry || 'United States',
      };
    }
    return {
      city: actualUser.hometownCity || '',
      state: actualUser.hometownState || '',
      country: actualUser.hometownCountry || 'United States',
    };
  })();

  const [newMeetup, setNewMeetup] = useState<NewMeetup>({
    title: '',
    description: '',
    meetingPoint: '',
    streetAddress: '',
    city: resolvedLocation.city,
    state: resolvedLocation.state,
    country: resolvedLocation.country,
    zipcode: '',
    responseTime: '24hours',
    organizerNotes: ''
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
        throw new Error("Please log in to join quick meets");
      }

      console.log('🚀 ATTEMPTING JOIN:', { meetupId, userId: actualUser.id });
      
      const result = await apiRequest('POST', `/api/quick-meets/${meetupId}/join`, {
        userId: actualUser.id
      });

      console.log('✅ JOIN SUCCESS:', result);
      return { meetupId, result };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/quick-meets'] });
      toast({
        title: "Joined!",
        description: "You've successfully joined the quick meet.",
      });
      // Navigate to chatroom after joining
      window.location.href = `/quick-meetup-chat/${data.meetupId}`;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join quick meet",
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
        throw new Error("Please log in to create quick meets");
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
        description: meetupData.description || 'Quick meet',
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
      
      return await apiRequest('POST', '/api/quick-meet', meetupPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quick-meets'] });
      setShowCreateForm(false);
      setIsCustomActivity(false);
      setNewMeetup({
        title: '',
        description: '',
        meetingPoint: '',
        streetAddress: '',
        city: resolvedLocation.city,
        state: resolvedLocation.state,
        country: resolvedLocation.country,
        zipcode: '',
        responseTime: '1hour',
        organizerNotes: ''
      });
      toast({
        title: "Quick Meet Posted!",
        description: "Your availability is now live for others to join.",
      });
    },
    onError: (error: any) => {
      console.error('❌ CREATE MEETUP ERROR:', error);
      toast({
        title: "Error Creating Quick Meet",
        description: error.message || "Failed to post availability. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update meetup mutation
  const updateMutation = useMutation({
    mutationFn: async ({ meetupId, updates }: { meetupId: number; updates: any }) => {
      return await apiRequest('PUT', `/api/quick-meets/${meetupId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quick-meets'] });
      setEditingMeetupId(null);
      toast({
        title: "Updated!",
        description: "Your quick meet has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update quick meet",
        variant: "destructive",
      });
    },
  });

  // Delete meetup mutation
  const deleteMutation = useMutation({
    mutationFn: async (meetupId: number) => {
      return await apiRequest('DELETE', `/api/quick-meets/${meetupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quick-meets'] });
      toast({
        title: "Deleted!",
        description: "Your quick meet has been deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete quick meet",
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

    // Check if state is required for this country
    const stateOptional = isStateOptionalForCountry(newMeetup.country);
    const stateRequired = !stateOptional && !newMeetup.state.trim();
    
    if (!newMeetup.city.trim() || !newMeetup.country.trim() || stateRequired) {
      console.log('🔥 VALIDATION FAILED: Missing location data');
      console.log('🔥 LOCATION VALUES:', { 
        city: `"${newMeetup.city}"`, 
        state: `"${newMeetup.state}"`, 
        country: `"${newMeetup.country}"`,
        stateOptional,
        stateRequired
      });
      const stateText = stateOptional ? "" : ", state,";
      toast({
        title: "Missing Location",
        description: `Please select country${stateText} and city.`,
        variant: "destructive"
      });
      return;
    }

    console.log('🔥 VALIDATION PASSED - Creating meetup');
    createMutation.mutate(newMeetup);
  };

  if (isLoading) {
    return (
      <div className="w-full relative overflow-hidden rounded-3xl" data-testid="quick-meetup-widget">
        {/* Animated Gradient Orbs Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-orange-300 to-amber-400 rounded-full opacity-25 blur-3xl animate-float"></div>
        </div>
        
        {/* Glass Morphism Card */}
        <Card className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 border border-white/30 dark:border-gray-700/30 shadow-2xl">
          <CardContent className="p-4 bg-transparent">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500 animate-pulse" />
              <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Loading quick meetups...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get ALL active meetups to show prominently at the top
  const allActiveMeetups = quickMeetups?.filter((meetup: any) => 
    new Date(meetup.expiresAt).getTime() > Date.now()
  ) || [];

  return (
    <div className="w-full relative overflow-hidden rounded-3xl group" data-testid="quick-meetup-widget">
      {/* ACTIVE MEETUPS - Show ALL active hangouts prominently at top for everyone to see */}
      {allActiveMeetups.length > 0 && (
        <div className="mb-4 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl blur-md opacity-40 animate-pulse"></div>
          <Card className="relative bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40 border-2 border-green-400 dark:border-green-500 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="font-bold text-green-700 dark:text-green-300 text-lg">
                  {allActiveMeetups.length} Active Quick Meetup{allActiveMeetups.length > 1 ? 's' : ''}
                </h3>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {allActiveMeetups.slice(0, 5).map((meetup: any) => {
                  const isOwn = meetup.organizerId === actualUser?.id;
                  const expiresAt = new Date(meetup.expiresAt);
                  const timeLeft = Math.max(0, expiresAt.getTime() - Date.now());
                  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                  
                  return (
                    <div 
                      key={meetup.id}
                      className={`bg-white dark:bg-gray-800 rounded-xl p-3 cursor-pointer hover:shadow-lg transition-all ${isOwn ? 'border-2 border-orange-400 dark:border-orange-500 ring-2 ring-orange-200 dark:ring-orange-800' : 'border border-green-200 dark:border-green-700'}`}
                      onClick={() => window.location.href = `/quick-meetup-chat/${meetup.id}`}
                    >
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="w-6 h-6 flex-shrink-0">
                            <AvatarImage src={meetup.organizerProfileImage || ''} />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-orange-500 text-white">
                              {(meetup.organizerPublicName || meetup.organizerUsername || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{meetup.title}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              by @{meetup.organizerUsername} {isOwn && <span className="text-orange-500 font-bold">(you)</span>}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-orange-500 text-white animate-pulse shrink-0">
                          <Clock className="w-3 h-3 mr-1" />
                          {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {meetup.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {meetup.participantCount || 0} joined
                        </span>
                      </div>
                      <div className="mt-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isOwn) {
                              setLocation(`/quick-meetups?id=${meetup.id}`);
                            } else {
                              window.location.href = `/quick-meetup-chat/${meetup.id}`;
                            }
                          }}
                          className={`w-full text-xs h-8 ${isOwn 
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600' 
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'} text-white`}
                        >
                          {isOwn ? <Edit3 className="w-3 h-3 mr-1" /> : <MessageSquare className="w-3 h-3 mr-1" />}
                          {isOwn ? 'Manage Your Meetup' : 'Join This Hangout!'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {allActiveMeetups.length > 5 && (
                <p className="text-xs text-center text-green-600 dark:text-green-400 mt-2 font-medium">
                  + {allActiveMeetups.length - 5} more active meetups below
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Animated Gradient Orbs Background - Blue-Orange Brand Theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-orange-300 via-amber-400 to-orange-400 rounded-full opacity-30 blur-3xl animate-float"></div>
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-gradient-to-br from-blue-300 to-cyan-400 rounded-full opacity-30 blur-3xl animate-float-slow"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full opacity-25 blur-3xl animate-float-slower"></div>
      </div>
      
      {/* Quick Meetup CTA */}
      <Card className="relative backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-2 border-orange-400/50 dark:border-orange-600/50 shadow-2xl hover:shadow-3xl hover:border-orange-500/60 dark:hover:border-orange-500/60 transition-all duration-300 w-full group-hover:bg-white/80 dark:group-hover:bg-gray-900/80">
        <CardContent className="p-6 bg-transparent">
          {!showCreateForm ? (
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="relative flex items-center justify-center gap-3">
                  <Coffee className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                  <h3 className="font-black text-2xl bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                    Quick Meetup
                  </h3>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-black dark:text-gray-300">
                  Post a meetup idea and connect with nearby people today
                </p>
              </div>
              
              <div className="relative">
                <Button
                  onClick={() => {
                    setShowCreateForm(true);
                  }}
                  className="w-full text-lg font-bold py-5 h-14 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 border-0 rounded-xl shadow-lg text-white"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Quick Meetup
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-orange-500 animate-bounce" />
                  <h4 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Create Quick Meetup</h4>
                </div>
                <Button
                  onClick={() => {
                    setShowCreateForm(false);
                    setUseAiVoice(false);
                  }}
                  size="sm"
                  variant="ghost"
                  className="text-sm px-3 py-2 h-8 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                >
                  ✕
                </Button>
              </div>

              {/* AI Voice Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={!useAiVoice ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseAiVoice(false)}
                  className={!useAiVoice ? "flex-1 bg-orange-500 hover:bg-orange-600 text-white" : "flex-1"}
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Quick Form
                </Button>
                <Button
                  variant={useAiVoice ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseAiVoice(true)}
                  className={useAiVoice 
                    ? "flex-1 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white" 
                    : "flex-1 relative bg-gradient-to-r from-purple-500/20 to-orange-500/20 border-2 border-purple-400 dark:border-purple-500 text-purple-700 dark:text-purple-300 hover:from-purple-500/30 hover:to-orange-500/30"
                  }
                >
                  <Mic className="mr-1 h-4 w-4" />
                  <Sparkles className="mr-1 h-3 w-3 text-orange-500" />
                  AI Voice
                  {!useAiVoice && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      TRY
                    </span>
                  )}
                </Button>
              </div>

              {useAiVoice ? (
                <AIQuickCreateMeetup
                  defaultCity={resolvedLocation.city || city?.split(',')[0] || ''}
                  autoStartListening={true}
                  onDraftReady={(draft) => {
                    setNewMeetup({
                      title: draft.title || '',
                      description: draft.description || '',
                      meetingPoint: draft.meetingPoint || '',
                      streetAddress: draft.streetAddress || '',
                      city: draft.city || resolvedLocation.city,
                      state: draft.state || resolvedLocation.state,
                      country: draft.country || resolvedLocation.country,
                      zipcode: draft.zipcode || '',
                      responseTime: draft.responseTime || '2hours',
                      organizerNotes: draft.organizerNotes || ''
                    });
                    setUseAiVoice(false);
                    if (draft.title && !['Coffee Chat', 'Quick Walk', 'Lunch', 'Drinks', 'Bike Ride', 'Go out and Party', 'Beach Day', 'Food Tour', 'Sunset Viewing', 'Local Sightseeing', 'Workout', 'Explore Area'].includes(draft.title)) {
                      setIsCustomActivity(true);
                    }
                  }}
                  onCancel={() => setUseAiVoice(false)}
                />
              ) : (
              <div className="space-y-2 flex-1">
                {/* HOUR DROPDOWN - MOVED TO TOP FOR VISIBILITY */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-orange-700 dark:text-orange-400 px-1 flex items-center gap-1">
                    ⏰ Choose time period:
                  </label>
                  <Select 
                    value={newMeetup.responseTime}
                    onValueChange={(value) => setNewMeetup(prev => ({ ...prev, responseTime: value }))}
                  >
                    <SelectTrigger className="h-12 text-sm bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 border-2 border-orange-400/80 dark:border-orange-500/80 text-gray-900 dark:text-white font-bold hover:border-orange-500 dark:hover:border-orange-400 transition-all shadow-md hover:shadow-lg">
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
                </div>

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
              
              <Button
                onClick={handleCreateMeetup}
                disabled={createMutation.isPending}
                className="w-full text-lg font-black py-4 h-14 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0 rounded-xl shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {createMutation.isPending ? 'Posting...' : 'Post Quick Meetup'}
                </span>
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] animate-shine"></div>
              </Button>
              </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Quick Meetups - Only show ACTIVE meetups */}
      {quickMeetups && quickMeetups.length > 0 && (
        <div className="grid gap-3 mt-4">
          {quickMeetups
            .filter((meetup: any) => new Date(meetup.expiresAt).getTime() > Date.now())
            .slice(0, 3)
            .map((meetup: any) => {
              const isOwn = meetup.organizerId === actualUser?.id;
              
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
                  className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border border-orange-300/50 dark:border-orange-700/50 overflow-visible cursor-pointer hover:shadow-xl hover:border-orange-400/60 dark:hover:border-orange-600/60 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300"
                  onClick={() => window.location.href = `/quick-meetup-chat/${meetup.id}`}
                  data-testid={`quick-meetup-card-${meetup.id}`}
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
                            {(meetup.organizerPublicName || meetup.organizerUsername || 'U').charAt(0).toUpperCase()}
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
                                      setLocation(`/quick-meetups?id=${meetup.id}`);
                                    }}
                                    className="p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                    title="Edit quick meet"
                                    data-testid={`button-edit-meetup-${meetup.id}`}
                                  >
                                    <Edit3 className="w-3 h-3 text-green-500" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm('Cancel this quick meet? This action cannot be undone.')) {
                                        deleteMeetup(meetup.id);
                                      }
                                    }}
                                    className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                    title="Cancel quick meet"
                                    data-testid={`button-cancel-meetup-${meetup.id}`}
                                  >
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            {meetup.organizerPublicName && `${meetup.organizerPublicName} • `}Posted {new Date(meetup.createdAt).toLocaleDateString()}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinMeetup(meetup.id);
                          }}
                          disabled={joinMutation.isPending}
                          className="w-full sm:w-auto max-w-full inline-flex items-center justify-center gap-2 rounded-full
                                     text-xs py-2 h-9 bg-gradient-to-r from-blue-500 to-orange-500
                                     hover:from-blue-600 hover:to-orange-600 text-white border-0 overflow-hidden"
                          data-testid={`button-join-meetup-${meetup.id}`}
                        >
                          <span className="truncate">
                            {joinMutation.isPending ? 'Joining...' : '🤝 Join Meetup'}
                          </span>
                        </Button>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/quick-meetup-chat/${meetup.id}`;
                            }}
                            className="flex-1 sm:flex-auto inline-flex items-center justify-center gap-2 rounded-full
                                       text-xs py-2 h-9 bg-gradient-to-r from-blue-500 to-cyan-500
                                       hover:from-blue-600 hover:to-cyan-600 text-white border-0"
                            data-testid={`button-join-chat-${meetup.id}`}
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span className="truncate">Join Chat</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/quick-meetups?id=${meetup.id}`);
                            }}
                            variant="outline"
                            className="flex-1 sm:flex-auto inline-flex items-center justify-center gap-2 rounded-full
                                       text-xs py-2 h-9 border-green-500 text-green-700 dark:text-green-400
                                       hover:bg-green-50 dark:hover:bg-green-900/20"
                            data-testid={`button-manage-meetup-${meetup.id}`}
                          >
                            <Edit3 className="w-3 h-3" />
                            <span className="truncate">Manage</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Cancel this quick meet? This action cannot be undone.')) {
                                deleteMeetup(meetup.id);
                              }
                            }}
                            variant="outline"
                            className="inline-flex items-center justify-center gap-2 rounded-full
                                       text-xs py-2 h-9 px-3 border-red-500 text-red-700 dark:text-red-400
                                       hover:bg-red-50 dark:hover:bg-red-900/20"
                            data-testid={`button-cancel-meetup-main-${meetup.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span className="truncate">Cancel</span>
                          </Button>
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