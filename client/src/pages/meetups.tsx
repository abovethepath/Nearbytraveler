import { useState, useEffect } from "react";
import { useAuth } from "@/App";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, Users, Zap, Calendar, Edit, MessageCircle, Map, Plus, Eye, Settings, Trash2, Coffee, User, ChevronDown, ChevronUp, Archive, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import SmartLocationInput from "@/components/SmartLocationInput";

import { ParticipantAvatars } from "@/components/ParticipantAvatars";

interface QuickMeetup {
  id: number;
  title: string;
  description?: string;
  meetingPoint: string;
  organizerId: number;
  organizerUsername: string;
  organizerName?: string;
  organizerProfileImage?: string;

  currentParticipants: number;
  participantsList?: Array<{
    id: number;
    username: string;
    profileImage?: string;
  }>;
  createdAt: string;
  expiresAt: string;
  city: string;
  isActive: boolean;
  responseTime: string;
  chatroomId?: number;
  latitude?: number;
  longitude?: number;
  location?: string;
  street?: string;
  state?: string;
  country?: string;
}

export default function MeetupsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // State for creating new meetup
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // State for viewing meetup details
  const [selectedQuickMeet, setSelectedQuickMeet] = useState<QuickMeetup | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const [newQuickMeet, setNewQuickMeet] = useState({
    title: "",
    description: "",
    meetingPoint: "",
    streetAddress: "",
    city: user?.hometownCity || "",
    state: user?.hometownState || "",
    country: user?.hometownCountry || "United States",
    zipcode: "",
    responseTime: "1hour"
  });

  // Fetch active meetups
  const { data: quickMeets = [], isLoading } = useQuery({
    queryKey: ["/api/availability"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch user's archived meetups
  const { data: archivedQuickMeets = [], isLoading: archivedLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/archived-meetups`],
    enabled: !!user?.id,
    staleTime: 60000, // Cache for 1 minute
  });

  // State for collapsible archived section
  const [showArchived, setShowArchived] = useState(false);

  // Create meetup mutation
  const createQuickMeetMutation = useMutation({
    mutationFn: async (quickMeetData: any) => {
      console.log("Creating quick meet with data:", quickMeetData);
      return await apiRequest("POST", "/api/availability", quickMeetData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      setIsCreateDialogOpen(false);
      setNewQuickMeet({
        title: "",
        description: "",
        meetingPoint: "",
        streetAddress: "",
        city: "",
        state: "",
        country: "",
        zipcode: "",
        responseTime: "1hour"
      });
      toast({
        title: "Success",
        description: "Your quick meet has been created and is now visible to others!",
      });
    },
    onError: (error: any) => {
      console.error("Meetup creation error:", error);
      toast({
        title: "Error creating quick meet",
        description: error.message || "Failed to create quick meet. Please check required fields.",
        variant: "destructive",
      });
    },
  });

  // Join meetup mutation
  const joinQuickMeetMutation = useMutation({
    mutationFn: async (quickMeetId: number) => {
      // Get user from multiple sources for reliability
      const localStorageUser = localStorage.getItem('user');
      const currentUser = user || (localStorageUser ? JSON.parse(localStorageUser) : null);
      
      if (!currentUser?.id) {
        throw new Error("Please log in to join quick meets");
      }
      
      console.log("Joining meetup with user ID:", currentUser.id);
      
      return await apiRequest("POST", `/api/availability/${quickMeetId}/join`, {
        userId: currentUser.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      toast({
        title: "Joined!",
        description: "You've successfully joined the quick meet. Click the Chat button to coordinate with other participants!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join quick meet",
        variant: "destructive",
      });
    },
  });

  // Leave meetup mutation
  const leaveQuickMeetMutation = useMutation({
    mutationFn: async (quickMeetId: number) => {
      return await apiRequest("POST", `/api/availability/${quickMeetId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      toast({
        title: "Left quick meet",
        description: "You've left the quick meet successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to leave quick meet",
        variant: "destructive",
      });
    },
  });

  // Reinstate archived meetup mutation
  const reinstateQuickMeetMutation = useMutation({
    mutationFn: async ({ quickMeetId, duration }: { quickMeetId: number; duration: string }) => {
      return await apiRequest("POST", `/api/quick-meets/${quickMeetId}/restart`, { duration });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/archived-meetups`] });
      toast({
        title: "Meetup Reinstated!",
        description: "Your meetup is now active again with a new chat room. Others can join now!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reinstate meetup",
        variant: "destructive",
      });
    },
  });

  const handleCreateQuickMeet = () => {
    // Get fresh user data from multiple sources for debugging  
    const localStorageUser = localStorage.getItem('user');
    const sessionUser = sessionStorage.getItem('user');
    
    console.log("=== AUTHENTICATION DEBUG ===");
    console.log("User from useAuth():", user);
    console.log("User from localStorage:", localStorageUser);
    console.log("User from sessionStorage:", sessionUser);
    console.log("Original user variable:", user);
    
    // Use the most reliable user source
    const currentUser = user || (localStorageUser ? JSON.parse(localStorageUser) : null);
    console.log("Final currentUser:", currentUser);
    
    if (!currentUser?.id) {
      console.log("ERROR: No authenticated user found");
      toast({
        title: "Authentication Error",
        description: "Please log in to create a meetup.",
        variant: "destructive",
      });
      return;
    }

    if (!newQuickMeet.title.trim() || !newQuickMeet.meetingPoint.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in the title and meeting point.",
        variant: "destructive",
      });
      return;
    }

    // Validate required address fields
    if (!newQuickMeet.city.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in the city for location-based discovery.",
        variant: "destructive",
      });
      return;
    }

    const quickMeetData = {
      ...newQuickMeet,
      street: newQuickMeet.streetAddress,
      // Use form fields if provided, fall back to user data as last resort
      city: newQuickMeet.city.trim() || currentUser?.hometownCity || currentUser?.location || "Unknown",
      state: newQuickMeet.state.trim() || currentUser?.hometownState || "",
      country: newQuickMeet.country.trim() || currentUser?.hometownCountry || "",
      zipcode: newQuickMeet.zipcode.trim() || "",
      // Always create chatroom for meetup coordination
      createChatroom: true,
      chatroomName: `${newQuickMeet.title} - Let's Meet Now`
    };
    
    console.log("Quick meet data being sent:", quickMeetData);
    createQuickMeetMutation.mutate(quickMeetData);
  };

  const handleJoinQuickMeet = (quickMeetId: number) => {
    joinQuickMeetMutation.mutate(quickMeetId);
  };

  const handleLeaveQuickMeet = (quickMeetId: number) => {
    leaveQuickMeetMutation.mutate(quickMeetId);
  };

  const isUserInQuickMeet = (quickMeet: QuickMeetup) => {
    // Only check participants list, not creator - creator needs to join like everyone else
    return quickMeet.participantsList?.some(p => p.id === user?.id) || false;
  };

  const isUserOwner = (quickMeet: QuickMeetup) => {
    return quickMeet.organizerId === user?.id;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Zap className="w-8 h-8 text-orange-500" />
            Let's Meet Now
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Connect with people who are available right now for spontaneous quick meets
          </p>
        </div>
        
        {/* Create Meetup Button */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Meetup
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-full">
            <DialogHeader>
              <DialogTitle>Create a Quick Meet</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    What are you doing?
                  </label>
                  
                  {/* Quick Activity Dropdown */}
                  <div className="mb-3">
                    <Select
                      value={newQuickMeet.title}
                      onValueChange={(value) => {
                        if (value !== "custom") {
                          setNewMeetup(prev => ({ ...prev, title: value }));
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a common activity or create custom below" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Let's Grab Coffee">☕ Let's Grab Coffee</SelectItem>
                        <SelectItem value="Let's Get a Drink">🍺 Let's Get a Drink</SelectItem>
                        <SelectItem value="Let's Grab a Bite">🍽️ Let's Grab a Bite</SelectItem>
                        <SelectItem value="Let's Go for a Hike">🥾 Let's Go for a Hike</SelectItem>
                        <SelectItem value="Let's Take a Walk">🚶 Let's Take a Walk</SelectItem>
                        <SelectItem value="Let's Go for a Bike Ride">🚴 Let's Go for a Bike Ride</SelectItem>
                        <SelectItem value="Let's Go out and Party">🎉 Let's Go out and Party</SelectItem>
                        <SelectItem value="Let's Hit the Beach">🏖️ Let's Hit the Beach</SelectItem>
                        <SelectItem value="Let's Go Food Hunting">🍕 Let's Go Food Hunting</SelectItem>
                        <SelectItem value="Let's Watch the Sunset">🌅 Let's Watch the Sunset</SelectItem>
                        <SelectItem value="Let's Go Sightseeing">📸 Let's Go Sightseeing</SelectItem>
                        <SelectItem value="Let's Go Shopping">🛍️ Let's Go Shopping</SelectItem>
                        <SelectItem value="Let's See a Movie">🎬 Let's See a Movie</SelectItem>
                        <SelectItem value="Let's Play Pool">🎱 Let's Play Pool</SelectItem>
                        <SelectItem value="Let's Go Dancing">💃 Let's Go Dancing</SelectItem>
                        <SelectItem value="Let's Explore the City">🏙️ Let's Explore the City</SelectItem>
                        <SelectItem value="Let's Check Out Live Music">🎵 Let's Check Out Live Music</SelectItem>
                        <SelectItem value="Let's Play Some Sports">⚽ Let's Play Some Sports</SelectItem>
                        <SelectItem value="custom">✍️ Create Custom Activity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Custom Input Field */}
                  <Input
                    placeholder="Or type your custom activity here..."
                    value={newMeetup.title}
                    onChange={(e) => setNewMeetup(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Meeting Point
                  </label>
                  <Input
                    placeholder="e.g., Starbucks on Main St, Central Park entrance"
                    value={newQuickMeet.meetingPoint}
                    onChange={(e) => setNewMeetup(prev => ({ ...prev, meetingPoint: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Street Address
                  </label>
                  <Input
                    placeholder="e.g., 123 Main Street"
                    value={newMeetup.streetAddress}
                    onChange={(e) => setNewMeetup(prev => ({ ...prev, streetAddress: e.target.value }))}
                  />
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                {/* Location Selection with SmartLocationInput */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Meetup Location *
                  </label>
                  <SmartLocationInput
                    city={newMeetup.city}
                    state={newMeetup.state}
                    country={newMeetup.country}
                    onLocationChange={(location) => {
                      setNewMeetup(prev => ({
                        ...prev,
                        city: location.city,
                        state: location.state,
                        country: location.country
                      }));
                    }}
                    required={true}
                    placeholder={{
                      country: "Select country",
                      state: "Select state/region",
                      city: "Select city"
                    }}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Zip Code
                  </label>
                  <Input
                    placeholder="e.g., 90210"
                    value={newMeetup.zipcode}
                    onChange={(e) => setNewMeetup(prev => ({ ...prev, zipcode: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            
            {/* Full width fields at bottom */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description (optional)
                </label>
                <Textarea
                  placeholder="Any additional details..."
                  value={newMeetup.description}
                  onChange={(e) => setNewMeetup(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>
              
              {/* Active For dropdown with buttons on same line */}
              <div className="flex items-end gap-3 pt-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Active For
                  </label>
                  <Select 
                    value={newMeetup.responseTime} 
                    onValueChange={(value) => setNewMeetup(prev => ({ ...prev, responseTime: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1hour">1 hour</SelectItem>
                      <SelectItem value="2hours">2 hours</SelectItem>
                      <SelectItem value="3hours">3 hours</SelectItem>
                      <SelectItem value="6hours">6 hours</SelectItem>
                      <SelectItem value="12hours">12 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateQuickMeet}
                  disabled={createMeetupMutation.isPending}
                  className="px-6 bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600"
                >
                  {createMeetupMutation.isPending ? "Creating..." : "Create Meetup"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Meetups Grid */}
      {meetups.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Coffee className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No active meetups right now
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Be the first to create a meetup and connect with people nearby!
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Meetup
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetups.map((meetup: QuickMeetup) => (
            <Card key={meetup.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={meetup.organizerProfileImage} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-orange-500 text-white font-semibold">
                        {meetup.organizerUsername?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        @{meetup.organizerUsername || "Unknown"}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {getTimeRemaining(meetup.expiresAt)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <CardTitle className="text-lg">{meetup.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {meetup.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {meetup.description}
                  </p>
                )}
                
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{meetup.meetingPoint}</span>
                </div>
                
                {meetup.street && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-3 h-3 ml-1" />
                    <span className="text-xs">{meetup.street}</span>
                  </div>
                )}
                
                {/* Participant Avatars */}
                <ParticipantAvatars
                  type="meetup"
                  itemId={meetup.id}
                  maxVisible={3}
                  className="my-2"
                />
                
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Created {format(new Date(meetup.createdAt), "h:mm a")}</span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-3">
                  {/* View Details Button - Always visible */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMeetup(meetup);
                      setIsDetailsDialogOpen(true);
                    }}
                    className="flex-shrink-0"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                  
                  {/* Chat Button - Navigate to full chat page */}
                  <Button
                    size="sm"
                    onClick={() => setLocation(`/meetup-chat/${meetup.id}`)}
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Open Chat
                  </Button>
                  
                  {/* Join/Leave Button */}
                  {isUserInMeetup(meetup) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLeaveMeetup(meetup.id)}
                      disabled={leaveMeetupMutation.isPending}
                      className="flex-1"
                    >
                      Leave
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleJoinMeetup(meetup.id)}
                      disabled={joinMeetupMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600"
                    >
                      Join
                    </Button>
                  )}
                </div>
                

              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* My Past Meetups Section */}
      {user && archivedMeetups.length > 0 && (
        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Past Meetups
            </h2>
            <Button
              variant="outline"
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2"
            >
              {showArchived ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show {archivedMeetups.length} archived meetups
                </>
              )}
            </Button>
          </div>

          {showArchived && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archivedMeetups.map((meetup: any) => (
                <Card key={meetup.id} className="border-gray-300 dark:border-gray-600 opacity-90">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white">
                          <Archive className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Archived Meetup
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            Expired {format(new Date(meetup.expiresAt), "MMM d, h:mm a")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <CardTitle className="text-lg text-gray-700 dark:text-gray-300">
                      {meetup.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {meetup.description || "No description provided"}
                    </p>
                    
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{meetup.meetingPoint}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{meetup.currentParticipants} participants joined</span>
                    </div>
                    
                    <div className="pt-3 border-t flex flex-col gap-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        One-click to recreate this meetup:
                      </p>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => reinstateMeetupMutation.mutate({ meetupId: meetup.id, duration: "2hours" })}
                          disabled={reinstateMeetupMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          2h
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => reinstateMeetupMutation.mutate({ meetupId: meetup.id, duration: "4hours" })}
                          disabled={reinstateMeetupMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          4h
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => reinstateMeetupMutation.mutate({ meetupId: meetup.id, duration: "12hours" })}
                          disabled={reinstateMeetupMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          12h
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Meetup Details Modal */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Meetup Details</span>
              {selectedMeetup && selectedMeetup.creatorId === user?.id && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // TODO: Implement edit functionality
                      toast({
                        title: "Edit Feature",
                        description: "Edit functionality coming soon!",
                      });
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this meetup?")) {
                        // TODO: Implement delete functionality
                        toast({
                          title: "Delete Feature",
                          description: "Delete functionality coming soon!",
                        });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedMeetup && (
            <div className="space-y-6">
              {/* Creator Info */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-orange-500 flex items-center justify-center text-white font-semibold">
                  {selectedMeetup.creator?.profileImage ? (
                    <img 
                      src={selectedMeetup.creator.profileImage} 
                      alt={selectedMeetup.creator.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-lg">
                    @{selectedMeetup.creator?.username || "Unknown"}
                  </p>
                  <Badge variant="secondary">
                    {getTimeRemaining(selectedMeetup.expiresAt)}
                  </Badge>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedMeetup.title}
                </h3>
                {selectedMeetup.description && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedMeetup.description}
                  </p>
                )}
              </div>

              {/* Location & Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Meeting Point</p>
                      <p className="text-sm">{selectedMeetup.meetingPoint}</p>
                      {selectedMeetup.street && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          📍 {selectedMeetup.street}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Users className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Participants</p>
                      <p className="text-sm">{selectedMeetup.currentParticipants} people joined</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Clock className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Created</p>
                      <p className="text-sm">{format(new Date(selectedMeetup.createdAt), "h:mm a")}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Map className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm">{selectedMeetup.city}, {selectedMeetup.state}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Participants List */}
              {selectedMeetup.participantsList && selectedMeetup.participantsList.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Participants ({selectedMeetup.participantsList.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedMeetup.participantsList.map((participant) => (
                      <div key={participant.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-orange-500 flex items-center justify-center text-white text-sm font-semibold">
                          {participant.profileImage ? (
                            <img 
                              src={participant.profileImage} 
                              alt={participant.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            participant.username[0].toUpperCase()
                          )}
                        </div>
                        <span className="text-sm">@{participant.username}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedMeetup.chatroomId && isUserInMeetup(selectedMeetup) && (
                  <Button
                    onClick={() => {
                      setLocation(`/chat/${selectedMeetup.chatroomId}`);
                      setIsDetailsDialogOpen(false);
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Open Chat - Coordinate Here!
                  </Button>
                )}
                
                {!isUserInMeetup(selectedMeetup) && (
                  <Button
                    onClick={() => {
                      handleJoinMeetup(selectedMeetup.id);
                      setIsDetailsDialogOpen(false);
                    }}
                    disabled={joinMeetupMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600"
                  >
                    Join This Meetup
                  </Button>
                )}
                
                {isUserInMeetup(selectedMeetup) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleLeaveMeetup(selectedMeetup.id);
                      setIsDetailsDialogOpen(false);
                    }}
                    disabled={leaveMeetupMutation.isPending}
                  >
                    Leave Meetup
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}