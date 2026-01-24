import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/App";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Search, 
  History, 
  MessageSquare,
  ArrowLeft,
  Clock,
  Filter,
  ChevronDown
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { getApiBaseUrl } from "@/lib/queryClient";

interface EventParticipant {
  userId: number;
  status: string;
  username: string;
  name: string | null;
  profileImage: string | null;
}

interface EventOrganizer {
  id: number;
  username: string;
  name: string | null;
  profileImage: string | null;
}

interface PastEvent {
  id: number;
  title: string;
  description: string | null;
  venueName: string | null;
  street: string;
  city: string;
  state: string | null;
  country: string;
  location: string;
  date: string;
  endDate: string | null;
  category: string;
  imageUrl: string | null;
  organizerId: number;
  organizer: EventOrganizer | null;
  participantCount: number;
  participants: EventParticipant[];
}

interface EventHistoryResponse {
  events: PastEvent[];
  total: number;
  city: string;
  daysBack: number;
}

export default function EventHistory() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [daysBack, setDaysBack] = useState("90");
  const [selectedEvent, setSelectedEvent] = useState<PastEvent | null>(null);

  // Get user's hometown for default city
  useEffect(() => {
    if (!selectedCity) {
      // Try hometownCity first, then hometown, then empty
      const city = user?.hometownCity || user?.hometown || "";
      if (city) {
        setSelectedCity(city);
      }
    }
  }, [user?.hometownCity, user?.hometown, selectedCity]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch past events
  const { data: historyData, isLoading, error } = useQuery<EventHistoryResponse>({
    queryKey: ['/api/events/history', selectedCity, debouncedSearch, daysBack],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCity) params.append('city', selectedCity);
      if (debouncedSearch) params.append('search', debouncedSearch);
      params.append('daysBack', daysBack);
      params.append('limit', '50');
      
      const response = await fetch(`${getApiBaseUrl()}/api/events/history?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch event history');
      return response.json();
    },
    enabled: true,
  });

  const pastEvents = historyData?.events || [];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Music': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Sports': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Food': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Networking': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Social': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'Culture': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'Outdoor': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const handleContactAttendee = (userId: number) => {
    navigate(`/messages?userId=${userId}`);
  };

  const handleViewProfile = (userId: number) => {
    navigate(`/users/${userId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/events')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <History className="h-6 w-6 text-orange-500" />
                Event History
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Browse past events and connect with attendees
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search past events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="City (e.g., Los Angeles)"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-48"
              />
              
              <Select value={daysBack} onValueChange={setDaysBack}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-red-500">Failed to load event history. Please try again.</p>
          </Card>
        ) : pastEvents.length === 0 ? (
          <Card className="p-8 text-center">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Past Events Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {selectedCity 
                ? `No events found in ${selectedCity} for the last ${daysBack} days.`
                : `No past events found for the last ${daysBack} days.`}
            </p>
            <Button onClick={() => navigate('/events')}>
              View Upcoming Events
            </Button>
          </Card>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Showing {pastEvents.length} past event{pastEvents.length !== 1 ? 's' : ''} 
              {selectedCity ? ` in ${selectedCity}` : ''} 
              {` from the last ${daysBack} days`}
            </p>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastEvents.map((event) => (
                <Card 
                  key={event.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-gray-200 dark:border-gray-700"
                  onClick={() => setSelectedEvent(event)}
                >
                  {event.imageUrl ? (
                    <div className="h-40 bg-cover bg-center relative" style={{ backgroundImage: `url(${event.imageUrl})` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <Badge className={`absolute top-3 left-3 ${getCategoryColor(event.category)}`}>
                        {event.category}
                      </Badge>
                      <Badge className="absolute top-3 right-3 bg-gray-800/80 text-white">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                      </Badge>
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-orange-400 to-pink-500 relative">
                      <Badge className={`absolute top-3 left-3 ${getCategoryColor(event.category)}`}>
                        {event.category}
                      </Badge>
                      <Badge className="absolute top-3 right-3 bg-gray-800/80 text-white">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                      {event.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(event.date), 'MMM d, yyyy • h:mm a')}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{event.venueName || event.city}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {event.participantCount} attended
                        </span>
                      </div>
                      
                      {/* Attendee avatars preview */}
                      {event.participants.length > 0 && (
                        <div className="flex -space-x-2">
                          {event.participants.slice(0, 3).map((p) => (
                            <Avatar key={p.userId} className="h-6 w-6 border-2 border-white dark:border-gray-800">
                              <AvatarImage src={p.profileImage || undefined} />
                              <AvatarFallback className="text-xs">
                                {(p.name || p.username).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {event.participants.length > 3 && (
                            <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                +{event.participants.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Event Details Modal with Attendees */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedEvent.title}</DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-6 pr-4">
                  {/* Event Details */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="h-5 w-5" />
                      <span>{format(new Date(selectedEvent.date), 'EEEE, MMMM d, yyyy • h:mm a')}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="h-5 w-5" />
                      <span>
                        {selectedEvent.venueName && `${selectedEvent.venueName}, `}
                        {selectedEvent.location}
                      </span>
                    </div>
                    
                    <Badge className={getCategoryColor(selectedEvent.category)}>
                      {selectedEvent.category}
                    </Badge>
                    
                    {selectedEvent.description && (
                      <p className="text-gray-700 dark:text-gray-300 mt-3">
                        {selectedEvent.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Organizer */}
                  {selectedEvent.organizer && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Event Organizer
                      </h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={selectedEvent.organizer.profileImage || undefined} />
                            <AvatarFallback>
                              {(selectedEvent.organizer.name || selectedEvent.organizer.username).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedEvent.organizer.name || selectedEvent.organizer.username}
                            </p>
                            <p className="text-sm text-gray-500">@{selectedEvent.organizer.username}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewProfile(selectedEvent.organizer!.id)}
                          >
                            View Profile
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleContactAttendee(selectedEvent.organizer!.id)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Attendees */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5 text-orange-500" />
                      Attendees ({selectedEvent.participantCount})
                    </h4>
                    
                    {selectedEvent.participants.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        No attendee information available
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selectedEvent.participants.map((participant) => (
                          <div 
                            key={participant.userId}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={participant.profileImage || undefined} />
                                <AvatarFallback>
                                  {(participant.name || participant.username).charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {participant.name || participant.username}
                                </p>
                                <p className="text-sm text-gray-500">@{participant.username}</p>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewProfile(participant.userId)}
                              >
                                Profile
                              </Button>
                              <Button 
                                size="sm"
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                                onClick={() => handleContactAttendee(participant.userId)}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Reach Out
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
