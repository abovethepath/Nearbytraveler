import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Clock, Users, User, Info, Share2, Copy, Check, ArrowLeft, Mail, Link2, MessageCircle, Camera, Upload, Loader2 } from "lucide-react";
import { UniversalBackButton } from "@/components/UniversalBackButton";
import { type Event, type EventParticipant, type User as UserType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getApiBaseUrl } from "@/lib/queryClient";
import { ParticipantAvatars } from "@/components/ParticipantAvatars";
import { InstagramShare } from "@/components/InstagramShare";

import { useLocation } from "wouter";

interface EventDetailsProps {
  eventId: string;
}

export default function EventDetails({ eventId }: EventDetailsProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [viewAsGuest, setViewAsGuest] = useState(false);
  const [showFullNames, setShowFullNames] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Get current user
  const getCurrentUser = () => {
    const storedUser = localStorage.getItem('travelconnect_user');
    return storedUser ? JSON.parse(storedUser) : null;
  };
  
  const currentUser = getCurrentUser();

  // Upload event photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadingImage(true);
      
      // Convert file to base64
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
    onSuccess: async (imageData: string) => {
      try {
        // Upload to server
        const response = await apiRequest("POST", `/api/events/${eventId}/image`, { imageUrl: imageData });
        
        toast({
          title: "Photo uploaded!",
          description: "Your event photo has been added.",
        });
        
        // Refresh event data
        queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Failed to save photo. Please try again.",
          variant: "destructive",
        });
      } finally {
        setUploadingImage(false);
      }
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      });
      setUploadingImage(false);
    }
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please choose an image under 5MB.",
          variant: "destructive",
        });
        return;
      }
      uploadPhotoMutation.mutate(file);
    }
  };

  // Fetch event details - allow access without authentication for viral sharing
  const { data: event, isLoading: eventLoading, error: eventError } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId && !isNaN(parseInt(eventId)),
    retry: 1, // Reduce retries for faster loading
    queryFn: async () => {
      console.log(`🎪 Fetching event details for ID: ${eventId}`);
      const response = await fetch(`${getApiBaseUrl()}/api/events/${eventId}`);
      if (!response.ok) {
        console.error(`🎪 Event ${eventId} not found in database - might be external event`);
        throw new Error(`Event not found: ${response.status}`);
      }
      const data = await response.json();
      console.log(`🎪 Successfully loaded event: ${data.title}`);
      return data;
    }
  });

  // Fetch event participants - only if user is authenticated
  const { data: participants = [], isLoading: participantsLoading } = useQuery<EventParticipant[]>({
    queryKey: [`/api/events/${eventId}/participants`],
    enabled: !!eventId && !!currentUser,
  });

  // Fetch users for participant details
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  // Join event mutation (with status: 'interested' or 'going')
  const joinEventMutation = useMutation({
    mutationFn: async (status: 'interested' | 'going') => {
      if (!currentUser?.id || !eventId) throw new Error("Missing user or event ID");
      
      return await apiRequest("POST", `/api/events/${eventId}/join`, {
        userId: currentUser.id,
        notes: status === 'going' ? "Looking forward to attending!" : "Interested in this event",
        status
      });
    },
    onSuccess: async (data, status) => {
      toast({
        title: "Success!",
        description: status === 'going' ? "You're going to this event!" : "Marked as interested",
      });
      // Invalidate and refetch to update UI immediately
      await queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/participants`] });
      await queryClient.refetchQueries({ queryKey: [`/api/events/${eventId}/participants`] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId] });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to join event";
      const isPrivacyError = errorMessage.includes("privacy settings");
      
      toast({
        title: isPrivacyError ? "Privacy Restriction" : "Error",
        description: isPrivacyError 
          ? "The event organizer's privacy settings prevent you from joining this event. Try connecting with them first."
          : errorMessage,
        variant: "destructive",
      });
    },
  });

  // Leave event mutation
  const leaveEventMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id || !eventId) throw new Error("Missing user or event ID");
      
      return await apiRequest("DELETE", `/api/events/${eventId}/leave`, {
        userId: currentUser.id
      });
    },
    onSuccess: () => {
      toast({
        title: "Left Event",
        description: "You've left the event",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/participants`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser.id}/all-events`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to leave event",
        variant: "destructive",
      });
    },
  });

  if (eventLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-4">
          <UniversalBackButton 
            destination="/events"
            label="Back"
            className="bg-transparent hover:bg-gray-100"
          />
        </div>
        
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => setLocation("/events")}>Browse Events</Button>
        </div>
      </div>
    );
  }

  const currentParticipant = participants.find(p => p.userId === currentUser?.id);
  const isParticipant = !!currentParticipant;
  const participantStatus = currentParticipant?.status;
  const participantRole = currentParticipant?.role;
  const isPrimaryOrganizer = viewAsGuest ? false : event.organizerId === currentUser?.id;
  const isCoOrganizer = viewAsGuest ? false : participantRole === 'co-organizer';
  const isOrganizer = isPrimaryOrganizer || isCoOrganizer;
  const organizer = users.find(u => u.id === event.organizerId);
  
  // Separate participants by status
  const goingParticipants = participants.filter(p => p.status === 'going');
  const interestedParticipants = participants.filter(p => p.status === 'interested');
  
  // Check if organizer is already counted in going participants
  const organizerIsInGoingList = goingParticipants.some(p => p.userId === event.organizerId);
  
  // Organizer is ALWAYS going - add 1 if they're not already in the going list
  const goingCount = goingParticipants.length + (organizerIsInGoingList ? 0 : 1);
  const interestedCount = interestedParticipants.length;

  // Get event URL for sharing
  const getEventUrl = () => `${window.location.origin}/events/${eventId}`;
  
  // Get formatted event details for sharing
  const getShareMessage = () => {
    const dateObj = new Date(event.date);
    const eventDateStr = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    const eventTimeStr = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const location = event.city ? ` in ${event.city}` : '';
    return `Hey! Check out this event: "${event.title}"${location} on ${eventDateStr} at ${eventTimeStr}. Join me! ${getEventUrl()}`;
  };

  // WhatsApp share - opens WhatsApp with pre-filled message
  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(getShareMessage());
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // Email share - opens email client with pre-filled subject and body
  const shareViaEmail = () => {
    const subject = encodeURIComponent(`You're invited: ${event.title}`);
    const dateObj = new Date(event.date);
    const eventDate = dateObj.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const eventTime = `Time: ${dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}\n`;
    const location = event.city ? `Location: ${event.city}${event.state ? `, ${event.state}` : ''}\n` : '';
    
    const body = encodeURIComponent(
      `Hi!\n\nI wanted to invite you to this event:\n\n` +
      `${event.title}\n\n` +
      `Date: ${eventDate}\n` +
      eventTime +
      location +
      `\n${event.description || ''}\n\n` +
      `RSVP here: ${getEventUrl()}\n\n` +
      `Hope to see you there!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Copy invite link
  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(getEventUrl());
      setCopied(true);
      toast({
        title: "Invite link copied!",
        description: "Share this link with friends to invite them",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link from the address bar",
        variant: "destructive"
      });
    }
  };

  // Native share (for mobile devices)
  const shareEvent = async () => {
    const eventUrl = getEventUrl();
    const shareData = {
      title: event.title,
      text: getShareMessage(),
      url: eventUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // Fallback to copy link
        copyInviteLink();
      }
    } else {
      copyInviteLink();
    }
  };

  // Handle loading and error states
  if (eventLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Event Not Available</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This event might be from an external source like Ticketmaster or Eventbrite and doesn't have a detailed page on our platform yet.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mb-6">
            For full event details, please visit the event organizer's original website or platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => window.history.back()} variant="outline">
              Go Back
            </Button>
            <Button onClick={() => setLocation('/events')} className="bg-blue-600 hover:bg-blue-700">
              Browse All Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 max-w-4xl">


        <div className="flex items-center justify-between mb-8">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => {
              // Check if user came from a specific page, otherwise go to events
              if (window.history.length > 1) {
                window.history.back();
              } else {
                setLocation('/events');
              }
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        
        <div className="flex items-center gap-2">
          {/* View as Guest Toggle (only for organizers) */}
          {currentUser && event.organizerId === currentUser?.id && (
            <Button
              variant={viewAsGuest ? "default" : "outline"}
              onClick={() => setViewAsGuest(!viewAsGuest)}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              {viewAsGuest ? "View as Organizer" : "View as Guest"}
            </Button>
          )}
          
          {/* Instagram Share */}
          <InstagramShare event={event} />
        </div>
        
      </div>

      {/* Event Image */}
      {event.imageUrl ? (
        <div className="mb-4 sm:mb-6 md:mb-8 w-full overflow-hidden rounded-xl shadow-lg relative group">
          <img 
            src={event.imageUrl} 
            alt={event.title}
            className="w-full h-48 sm:h-56 md:h-64 lg:h-80 object-cover"
          />
          {/* Replace photo button for organizers */}
          {isOrganizer && !viewAsGuest && (
            <label className="absolute bottom-3 right-3 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingImage}
              />
              <div className="flex items-center gap-2 px-3 py-2 bg-black/70 hover:bg-black/90 text-white text-sm rounded-lg transition-colors">
                {uploadingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Change Photo
                  </>
                )}
              </div>
            </label>
          )}
        </div>
      ) : isOrganizer && !viewAsGuest ? (
        <div className="mb-4 sm:mb-6 md:mb-8 w-full">
          <label className="cursor-pointer block">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploadingImage}
            />
            <div className="w-full h-48 sm:h-56 md:h-64 rounded-xl border-2 border-dashed border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 flex flex-col items-center justify-center gap-3 hover:border-orange-500 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
              {uploadingImage ? (
                <>
                  <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                  <p className="text-orange-600 dark:text-orange-400 font-medium">Uploading photo...</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-orange-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-orange-600 dark:text-orange-400 font-medium">Add Event Photo</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tap to upload an image for your event</p>
                  </div>
                </>
              )}
            </div>
          </label>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar - Going List on LEFT like Couchsurfing */}
        <div className="order-2 lg:order-1 space-y-6">
          {/* Participants - Couchsurfing Style */}
          {(() => {
            // Use the already-calculated counts that include organizer
            return (
              <Card className="border border-gray-200 shadow-lg sticky top-4">
                <CardHeader className="pb-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400" data-testid="badge-going-count">
                      {goingCount} Going
                    </span>
                    {interestedCount > 0 && (
                      <span className="text-sm text-yellow-600 dark:text-yellow-400" data-testid="badge-interested-count">
                        +{interestedCount} Interested
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowFullNames(!showFullNames)}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mt-1 underline"
                  >
                    {showFullNames ? "Username" : "Real name"}
                  </button>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {goingParticipants
                      .sort((a, b) => {
                        if (a.userId === event?.organizerId) return -1;
                        if (b.userId === event?.organizerId) return 1;
                        const userA = users.find(u => u.id === a.userId);
                        const userB = users.find(u => u.id === b.userId);
                        return (userA?.username || '').localeCompare(userB?.username || '');
                      })
                      .slice(0, 15).map((participant) => {
                      const user = users.find(u => u.id === participant.userId);
                      const userLocation = user?.hometownCity && user?.hometownState 
                        ? `${user.hometownCity}, ${user.hometownState.length > 2 ? user.hometownState.substring(0, 2).toUpperCase() : user.hometownState}, ${user.hometownCountry === 'United States' ? 'USA' : user.hometownCountry || ''}`
                        : user?.hometownCity || '';
                      
                      return (
                        <div key={participant.id} className="flex items-start gap-3 pb-3 border-b border-gray-200 dark:border-gray-800 last:border-0 last:pb-0">
                          <Avatar 
                            className="w-10 h-10 cursor-pointer ring-2 ring-blue-100 dark:ring-blue-900"
                            onClick={() => setLocation(`/profile/${user?.id}`)}
                          >
                            <AvatarImage src={user?.profileImage || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                              {user?.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setLocation(`/profile/${user?.id}`)}
                                className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline text-left truncate"
                              >
                                {showFullNames ? (user?.name || user?.username || 'Unknown') : (user?.username || user?.name || 'Unknown')}
                              </button>
                              {user?.id === event?.organizerId && event?.isOriginalOrganizer !== false && (
                                <Badge variant="default" className="text-xs bg-orange-500 hover:bg-orange-600 shrink-0">
                                  Host
                                </Badge>
                              )}
                              {participant.role === 'co-organizer' && user?.id !== event?.organizerId && (
                                <Badge variant="default" className="text-xs bg-blue-500 hover:bg-blue-600 shrink-0">
                                  Co-Host
                                </Badge>
                              )}
                              {user?.id === event?.sharedBy && (
                                <Badge variant="outline" className="text-xs border-purple-500 text-purple-600 dark:text-purple-400 shrink-0">
                                  Shared
                                </Badge>
                              )}
                            </div>
                            {userLocation && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {userLocation}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {goingParticipants.length > 15 && (
                      <button 
                        className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 py-2"
                      >
                        View all {goingParticipants.length} attendees
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
          
          {/* Join This Event Card - Also on left sidebar - only show if logged in and not organizer */}
          {currentUser?.id && !isOrganizer && (
            <Card className="border border-gray-200 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-800 dark:to-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Join this event</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300">Connect with other attendees and get event updates</p>
              </CardHeader>
              <CardContent>
                {participantStatus ? (
                  <div className="space-y-3">
                    <Badge className="w-full justify-center py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      ✓ {participantStatus === 'going' ? 'Going' : 'Interested'}
                    </Badge>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
                      onClick={() => joinEventMutation.mutate('going')}
                      disabled={joinEventMutation.isPending}
                      data-testid="button-going"
                    >
                      {joinEventMutation.isPending ? "..." : "Join?"}
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => joinEventMutation.mutate('interested')}
                      disabled={joinEventMutation.isPending}
                      data-testid="button-interested"
                    >
                      {joinEventMutation.isPending ? "..." : "Interested"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Login prompt for non-logged in users */}
          {!currentUser?.id && (
            <Card className="border border-gray-200 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
              <CardContent className="p-4 text-center">
                <p className="font-medium mb-2">Want to join this event?</p>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white"
                  onClick={() => setLocation('/auth')}
                >
                  Log in to RSVP
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Event Details - on RIGHT */}
        <div className="order-1 lg:order-2 lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                <Badge variant="secondary" className="mb-4">
                  {event.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Event Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-travel-blue" />
                  <div>
                    <p className="font-medium">{new Date(event.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(event.date).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {event.endDate && (
                        <span> - {new Date(event.endDate).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-travel-blue" />
                  <div>
                    <p className="font-medium">{event.location}</p>
                    {/* Only show additional address if it's different from location */}
                    {(event.street || event.city || event.state || event.country || event.zipcode) && 
                     `${event.street ? event.street + ', ' : ''}${event.city}${event.state ? ', ' + event.state : ''}${event.country ? ', ' + event.country : ''}${event.zipcode ? ' ' + event.zipcode : ''}` !== event.location && (
                      <p className="text-sm text-gray-500">
                        {event.street && `${event.street}, `}
                        {event.city}
                        {event.state && `, ${event.state}`}
                        {event.country && `, ${event.country}`}
                        {event.zipcode && ` ${event.zipcode}`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-travel-blue" />
                  <div>
                    <p className="font-medium">{goingCount} going</p>
                    {interestedCount > 0 && (
                      <p className="text-sm text-orange-600">
                        {interestedCount} interested
                      </p>
                    )}
                    {event.maxParticipants && (
                      <p className="text-sm text-gray-500">
                        Max {event.maxParticipants} participants
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-travel-blue" />
                  <div>
                    {event.externalOrganizerName && (event.isOriginalOrganizer === false || event.sharedBy) ? (
                      // Imported event - show external organizer AND who shared it
                      <>
                        <p className="font-medium">Event by {event.externalOrganizerName}</p>
                        <p className="text-sm text-gray-500">
                          Shared by {organizer?.username || 'Unknown'}
                        </p>
                      </>
                    ) : (
                      // Regular event - show organizer
                      <>
                        <p className="font-medium">
                          {event.isOriginalOrganizer === false || event.sharedBy ? 'Shared by' : 'Organized by'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {organizer?.username || 'Unknown'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Recurring Event Info */}
                {event.isRecurring && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-travel-blue" />
                    <div>
                      <p className="font-medium">Recurring Event</p>
                      <p className="text-sm text-gray-500">
                        Repeats {event.recurrenceType}
                        {event.recurrenceEnd && (
                          <span> until {new Date(event.recurrenceEnd).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Description */}
              {event.description && (
                <div>
                  <h3 className="font-semibold mb-2 dark:text-white">About this event</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{event.description}</p>
                </div>
              )}

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Tags</h3>
                  <div className="flex flex-wrap gap-2 max-w-full">
                    {event.tags.map((tag, index) => (
                      <Badge 
                        key={`${tag}-${index}`} 
                        variant="secondary" 
                        className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0 hover:bg-gray-200 dark:hover:bg-gray-600 whitespace-nowrap flex-shrink-0"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {event.requirements && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2 dark:text-white">
                    <Info className="w-4 h-4" />
                    Requirements
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">{event.requirements}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Join/Leave Event */}
          <Card>
            <CardContent className="p-6">
              {isOrganizer ? (
                <div className="text-center space-y-3">
                  <Badge variant="outline" className="mb-4">
                    {isPrimaryOrganizer ? "Event Organizer" : "Co-Organizer"}
                  </Badge>
                  <p className="text-sm text-gray-600 mb-4">
                    {isPrimaryOrganizer ? "You're organizing this event" : "You're co-organizing this event"}
                  </p>
                  
                  {isParticipant ? (
                    <>
                      <Badge className="w-full justify-center py-2 mb-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        ✓ Going ({isPrimaryOrganizer ? 'Organizer' : 'Co-Organizer'})
                      </Badge>
                    </>
                  ) : (
                    /* If organizer somehow isn't in participant list, show button to add them */
                    <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">You need to be in the attendee list</p>
                      <Button 
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                        onClick={() => joinEventMutation.mutate('going')}
                        disabled={joinEventMutation.isPending}
                      >
                        {joinEventMutation.isPending ? "Joining..." : "Join as Going"}
                      </Button>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full mb-3"
                    onClick={() => setLocation(`/manage-event/${eventId}`)}
                  >
                    Manage Event
                  </Button>
                  
                  {/* Open Chat Button for organizers */}
                  <Button 
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
                    onClick={() => setLocation(`/event-chat/${eventId}`)}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Open Chat
                  </Button>
                  
                  {/* Leave event option for organizers */}
                  {isParticipant && (
                    <button
                      onClick={() => leaveEventMutation.mutate()}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline mt-2"
                      disabled={leaveEventMutation.isPending}
                    >
                      {leaveEventMutation.isPending ? "Leaving..." : "Leave event"}
                    </button>
                  )}
                  
                  {/* Preview how others see the join button */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 mb-2">Preview - How others see this event:</p>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Join this event</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        Connect with other attendees and get event updates
                      </p>
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0"
                        disabled
                      >
                        Join Event
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  {isParticipant ? (
                    <>
                      {/* Current RSVP Status Button (like Plura - shows your current status) */}
                      <Button 
                        className={`w-full mb-2 ${
                          participantStatus === 'going' 
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white' 
                            : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
                        }`}
                        disabled
                        data-testid={`status-${participantStatus}`}
                      >
                        {participantStatus === 'going' ? 'Going' : 'Interested'}
                      </Button>
                      
                      {/* Change Status Link - Only show "Change to Going" for interested users */}
                      {participantStatus === 'interested' && (
                        <button
                          onClick={() => joinEventMutation.mutate('going')}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline mb-3 w-full"
                          disabled={joinEventMutation.isPending}
                          data-testid="button-change-status"
                        >
                          {joinEventMutation.isPending ? "Updating..." : "Change to Going"}
                        </button>
                      )}
                      
                      <button
                        onClick={() => leaveEventMutation.mutate()}
                        className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white underline mb-4 w-full"
                        disabled={leaveEventMutation.isPending}
                        data-testid="button-leave-event"
                      >
                        {leaveEventMutation.isPending ? "Leaving..." : "No longer interested"}
                      </button>
                      
                      {/* Open Chat Button for participants */}
                      <Button 
                        className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
                        onClick={() => setLocation(`/event-chat/${eventId}`)}
                        data-testid="button-open-chat"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Go to chat
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* Two side-by-side RSVP buttons (like Plura) */}
                      <div className="flex gap-3">
                        <Button 
                          className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
                          onClick={() => joinEventMutation.mutate('going')}
                          disabled={joinEventMutation.isPending}
                          data-testid="button-going"
                        >
                          {joinEventMutation.isPending ? "..." : "Join?"}
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1 border-2 border-white dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => joinEventMutation.mutate('interested')}
                          disabled={joinEventMutation.isPending}
                          data-testid="button-interested"
                        >
                          {joinEventMutation.isPending ? "..." : "Interested"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {event?.externalRsvpUrl && (
        <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {event.externalRsvpProvider === 'luma' ? 'RSVP on Luma' : 
             event.externalRsvpProvider === 'partiful' ? 'RSVP on Partiful' : 
             'External RSVP'}
          </p>
          <a
            href={event.externalRsvpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {event.externalRsvpProvider === 'luma' ? 'RSVP on Luma' : 
             event.externalRsvpProvider === 'partiful' ? 'RSVP on Partiful' : 
             'RSVP Externally'}
          </a>
        </div>
      )}

      {/* Share Section - At Bottom */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Share this event with your friends:
        </p>
        <div className="flex items-center gap-3">
          {/* Facebook */}
          <button
            onClick={() => {
              const url = encodeURIComponent(`${window.location.origin}/events/${eventId}`);
              window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
            }}
            className="w-10 h-10 rounded-full bg-[#1877F2] hover:bg-[#166fe5] flex items-center justify-center transition-colors shadow-md"
            data-testid="button-share-facebook"
            title="Share on Facebook"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>
          
          {/* WhatsApp */}
          <button
            onClick={shareViaWhatsApp}
            className="w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#20bd5a] flex items-center justify-center transition-colors shadow-md"
            data-testid="button-share-whatsapp"
            title="Share on WhatsApp"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </button>
          
          {/* Twitter/X */}
          <button
            onClick={() => {
              const text = encodeURIComponent(getShareMessage());
              const url = encodeURIComponent(`${window.location.origin}/events/${eventId}`);
              window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
            }}
            className="w-10 h-10 rounded-full bg-[#1DA1F2] hover:bg-[#1a91da] flex items-center justify-center transition-colors shadow-md"
            data-testid="button-share-twitter"
            title="Share on Twitter"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </button>
          
          {/* Email */}
          <button
            onClick={shareViaEmail}
            className="w-10 h-10 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center transition-colors shadow-md"
            data-testid="button-share-email"
            title="Share via Email"
          >
            <Mail className="w-5 h-5 text-white" />
          </button>
          
          {/* Copy Link */}
          <button
            onClick={copyInviteLink}
            className={`w-10 h-10 rounded-full ${copied ? 'bg-green-500' : 'bg-gray-500 hover:bg-gray-600'} flex items-center justify-center transition-colors shadow-md`}
            data-testid="button-copy-link"
            title={copied ? "Copied!" : "Copy Link"}
          >
            {copied ? <Check className="w-5 h-5 text-white" /> : <Link2 className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}