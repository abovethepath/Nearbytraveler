import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Clock, Users, User, Info, Share2, Copy, Check, ArrowLeft } from "lucide-react";
import { UniversalBackButton } from "@/components/UniversalBackButton";
import { type Event, type EventParticipant, type User as UserType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ParticipantAvatars } from "@/components/ParticipantAvatars";

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
  
  // Get current user
  const getCurrentUser = () => {
    const storedUser = localStorage.getItem('travelconnect_user');
    return storedUser ? JSON.parse(storedUser) : null;
  };
  
  const currentUser = getCurrentUser();

  // Fetch event details - allow access without authentication for viral sharing
  const { data: event, isLoading: eventLoading, error: eventError } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId && !isNaN(parseInt(eventId)),
    retry: 1, // Reduce retries for faster loading
    queryFn: async () => {
      console.log(`🎪 Fetching event details for ID: ${eventId}`);
      const response = await fetch(`/api/events/${eventId}`);
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

  // Join event mutation
  const joinEventMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id || !eventId) throw new Error("Missing user or event ID");
      
      return await apiRequest("POST", `/api/events/${eventId}/join`, {
        userId: currentUser.id,
        notes: "Looking forward to attending!"
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "You've successfully joined the event",
      });
      // Invalidate events cache to refresh participant counts
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/participants`] });
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

  const isParticipant = participants.some(p => p.userId === currentUser?.id);
  const isOrganizer = viewAsGuest ? false : event.organizerId === currentUser?.id;
  const organizer = users.find(u => u.id === event.organizerId);

  // Share functionality
  const shareEvent = async () => {
    const eventUrl = `${window.location.origin}/events/${eventId}`;
    const shareData = {
      title: event.title,
      text: `Check out this event: ${event.title}`,
      url: eventUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // Fallback to copy link
        copyToClipboard(eventUrl);
      }
    } else {
      copyToClipboard(eventUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Event link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually from the address bar",
        variant: "destructive",
      });
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
          
          {/* Share Button */}
          <Button
            variant="outline"
            onClick={shareEvent}
            className="flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Copied!" : "Share Event"}
          </Button>
        </div>
      </div>

      {/* Event Image */}
      {event.imageUrl && (
        <div className="mb-8">
          <img 
            src={event.imageUrl} 
            alt={event.title}
            className="w-full h-64 md:h-80 object-cover rounded-xl shadow-lg"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Event Details */}
        <div className="lg:col-span-2 space-y-6">
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
                    <p className="text-sm text-gray-500">
                      {event.street && `${event.street}, `}
                      {event.city}
                      {event.state && `, ${event.state}`}
                      {event.zipcode && ` ${event.zipcode}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-travel-blue" />
                  <div>
                    <p className="font-medium">{participants.length} attending</p>
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
                    <p className="font-medium">Organized by</p>
                    <p className="text-sm text-gray-500">
                      {organizer?.username || 'Unknown'}
                    </p>
                  </div>
                </div>
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
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
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
                  <Badge variant="outline" className="mb-4">Event Organizer</Badge>
                  <p className="text-sm text-gray-600 mb-4">You're organizing this event</p>
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
                  
                  {/* Preview how others see the join button */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Preview - How others see this event:</p>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Join this event</h4>
                      <p className="text-xs text-gray-600 mb-3">
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
                      <Badge variant="default" className="mb-4 bg-green-100 text-green-800">
                        You're attending
                      </Badge>
                      <p className="text-sm text-gray-600 mb-4">
                        You've joined this event. We'll send you updates!
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full mb-3"
                        onClick={() => leaveEventMutation.mutate()}
                        disabled={leaveEventMutation.isPending}
                      >
                        {leaveEventMutation.isPending ? "Leaving..." : "Leave Event"}
                      </Button>
                      
                      {/* Open Chat Button for participants */}
                      <Button 
                        className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
                        onClick={() => setLocation(`/event-chat/${eventId}`)}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Open Chat
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="font-semibold mb-4">Join this event</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Connect with other attendees and get event updates
                      </p>
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white border-0"
                        style={{ 
                          background: 'linear-gradient(to right, #3b82f6, #ea580c)',
                          border: 'none'
                        }}
                        onClick={() => joinEventMutation.mutate()}
                        disabled={joinEventMutation.isPending}
                      >
                        {joinEventMutation.isPending ? "Joining..." : "Join Event"}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participants */}
          {participants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attendees ({participants.length})</CardTitle>
                {/* Participant Avatars */}
                <ParticipantAvatars
                  type="event"
                  itemId={parseInt(eventId)}
                  maxVisible={10}
                  className="mt-3"
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {participants
                    .sort((a, b) => {
                      // Event creator first, then alphabetical by username
                      const userA = users.find(u => u.id === a.userId);
                      const userB = users.find(u => u.id === b.userId);
                      
                      if (a.userId === event.organizerId) return -1;
                      if (b.userId === event.organizerId) return 1;
                      
                      return (userA?.username || '').localeCompare(userB?.username || '');
                    })
                    .slice(0, 10).map((participant) => {
                    const user = users.find(u => u.id === participant.userId);
                    return (
                      <div key={participant.id} className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user?.profileImage || undefined} />
                          <AvatarFallback>
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <button
                            onClick={() => setLocation(`/profile/${user?.id}`)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                          >
                            {user?.username || 'Unknown'}
                          </button>
                          {user?.id === event.organizerId && (
                            <Badge variant="default" className="text-xs ml-2 bg-orange-500 hover:bg-orange-600">
                              Event Creator
                            </Badge>
                          )}
                          <button
                            onClick={() => setLocation(`/messages?user=${user?.id}`)}
                            className="text-xs text-blue-500 hover:text-blue-700 ml-2"
                          >
                            Message
                          </button>
                          {participant.status && participant.status !== 'confirmed' && (
                            <Badge variant="outline" className="text-xs ml-2">
                              {participant.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {participants.length > 10 && (
                    <p className="text-sm text-gray-500 text-center pt-2">
                      +{participants.length - 10} more attendees
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}