import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, getApiBaseUrl } from '@/lib/queryClient';
import { TravelCrew } from './TravelCrew';
import {
  Calendar,
  Clock,
  MapPin,
  Share2,
  Copy,
  Mail,
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Globe,
  Ticket,
  Star,
  Users,
  ChevronDown,
  ChevronUp,
  Check,
  ExternalLink
} from 'lucide-react';

interface TravelPlan {
  id: number;
  destination: string;
  destinationCity?: string | null;
  destinationCountry?: string | null;
  startDate: string;
  endDate: string;
  notes?: string;
}

interface ItineraryItem {
  id?: number;
  date: string;
  startTime?: string;
  title: string;
  description?: string;
  location?: string;
  category?: string;
  orderIndex: number;
}

interface EventItem {
  id: number;
  title: string;
  date: string;
  time?: string;
  location?: string;
  status: 'going' | 'interested';
}

interface MeetupItem {
  id: number;
  title: string;
  date: string;
  time?: string;
  meetingPoint?: string;
  isOrganizer: boolean;
}

interface TripItineraryViewProps {
  travelPlan: TravelPlan;
  userId: number;
  isOwnProfile?: boolean;
  onClose?: () => void;
}

const categories = [
  { value: 'activity', label: 'Activity', icon: '🎯' },
  { value: 'food', label: 'Food & Dining', icon: '🍽️' },
  { value: 'transport', label: 'Transport', icon: '🚗' },
  { value: 'accommodation', label: 'Accommodation', icon: '🏨' },
  { value: 'sightseeing', label: 'Sightseeing', icon: '📸' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎭' },
  { value: 'other', label: 'Other', icon: '📝' }
];

export default function TripItineraryView({ 
  travelPlan, 
  userId, 
  isOwnProfile = false,
  onClose 
}: TripItineraryViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [newItem, setNewItem] = useState<Partial<ItineraryItem>>({
    date: '',
    startTime: '',
    title: '',
    description: '',
    location: '',
    category: 'activity'
  });

  const dateRange = useMemo(() => {
    const start = new Date(travelPlan.startDate);
    const end = new Date(travelPlan.endDate);
    const dates: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [travelPlan.startDate, travelPlan.endDate]);

  const { data: itineraryData, isLoading } = useQuery({
    queryKey: [`/api/travel-plans/${travelPlan.id}/itineraries`],
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/travel-plans/${travelPlan.id}/itineraries`);
      if (!response.ok) return [];
      return response.json();
    }
  });

  const currentItinerary = (itineraryData || [])[0];
  const isPublic = currentItinerary?.isPublic || false;

  const updatePrivacyMutation = useMutation({
    mutationFn: async (newIsPublic: boolean) => {
      if (!currentItinerary?.id) {
        throw new Error('No itinerary found');
      }
      return apiRequest('PATCH', `/api/itineraries/${currentItinerary.id}/privacy`, { isPublic: newIsPublic }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/travel-plans/${travelPlan.id}/itineraries`] });
      toast({ title: isPublic ? 'Itinerary is now private' : 'Itinerary is now public' });
    },
    onError: () => {
      toast({ title: 'Failed to update privacy setting', variant: 'destructive' });
    }
  });

  const { data: userEvents = [] } = useQuery<any[]>({
    queryKey: ['/api/user-event-interests', userId],
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/user-event-interests?userId=${userId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: isOwnProfile
  });

  const { data: userMeetups = [] } = useQuery<any[]>({
    queryKey: ['/api/quick-meetups/user', userId],
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/quick-meetups/user/${userId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: isOwnProfile
  });

  const itineraryItems = useMemo(() => {
    return (itineraryData || []).flatMap((itinerary: any) => itinerary.items || []);
  }, [itineraryData]);

  const relevantEvents = useMemo((): EventItem[] => {
    const start = new Date(travelPlan.startDate);
    const end = new Date(travelPlan.endDate);
    return userEvents.filter((event: any) => {
      const eventDate = new Date(event.eventDate || event.date);
      return eventDate >= start && eventDate <= end;
    }).map((event: any): EventItem => ({
      id: event.eventId || event.id,
      title: event.eventTitle || event.title,
      date: (event.eventDate || event.date)?.split('T')[0],
      time: event.eventTime || event.time,
      location: event.eventLocation || event.location,
      status: event.interestType === 'going' ? 'going' : 'interested'
    }));
  }, [userEvents, travelPlan.startDate, travelPlan.endDate]);

  const relevantMeetups = useMemo(() => {
    const start = new Date(travelPlan.startDate);
    const end = new Date(travelPlan.endDate);
    return userMeetups.filter((meetup: any) => {
      const meetupDate = new Date(meetup.date || meetup.meetupDate);
      return meetupDate >= start && meetupDate <= end;
    }).map((meetup: any) => ({
      id: meetup.id,
      title: meetup.title,
      date: (meetup.date || meetup.meetupDate)?.split('T')[0],
      time: meetup.time,
      meetingPoint: meetup.meetingPoint,
      isOrganizer: meetup.organizerId === userId
    }));
  }, [userMeetups, travelPlan.startDate, travelPlan.endDate, userId]);

  const itemsByDate = useMemo(() => {
    const grouped: Record<string, { items: ItineraryItem[]; events: EventItem[]; meetups: MeetupItem[] }> = {};
    dateRange.forEach(date => {
      grouped[date] = { items: [], events: [], meetups: [] };
    });
    itineraryItems.forEach((item: any) => {
      const dateKey = item.date?.split('T')[0];
      if (grouped[dateKey]) {
        grouped[dateKey].items.push(item);
      }
    });
    relevantEvents.forEach((event: EventItem) => {
      if (grouped[event.date]) {
        grouped[event.date].events.push(event);
      }
    });
    relevantMeetups.forEach((meetup: MeetupItem) => {
      if (grouped[meetup.date]) {
        grouped[meetup.date].meetups.push(meetup);
      }
    });
    return grouped;
  }, [dateRange, itineraryItems, relevantEvents, relevantMeetups]);

  const addItemMutation = useMutation({
    mutationFn: async (item: Partial<ItineraryItem>) => {
      let itineraryId = (itineraryData || [])[0]?.id;
      if (!itineraryId) {
        const itineraryResponse = await apiRequest('POST', '/api/itineraries', {
          travelPlanId: travelPlan.id,
          title: `${travelPlan.destination} Itinerary`,
          isPublic: false,
          tags: []
        });
        const newItinerary = await itineraryResponse.json();
        itineraryId = newItinerary.id;
      }
      return apiRequest('POST', `/api/itineraries/${itineraryId}/items`, {
        ...item,
        orderIndex: itineraryItems.length
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/travel-plans/${travelPlan.id}/itineraries`] });
      setShowAddItem(false);
      setNewItem({ date: '', startTime: '', title: '', description: '', location: '', category: 'activity' });
      toast({ title: 'Activity added!' });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/itinerary-items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/travel-plans/${travelPlan.id}/itineraries`] });
      toast({ title: 'Activity removed' });
    }
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const toggleDay = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`My Trip to ${travelPlan.destination}`);
    const body = encodeURIComponent(generateShareText());
    window.open(`mailto:?subject=${subject}&body=${body}`);
    setShowShareDialog(false);
  };

  const shareViaText = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`sms:?body=${text}`);
    setShowShareDialog(false);
  };

  const copyLink = () => {
    const shareUrl = `${window.location.origin}/trip/${travelPlan.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: 'Link copied!' });
    setShowShareDialog(false);
  };

  const copyItinerary = () => {
    navigator.clipboard.writeText(generateShareText());
    toast({ title: 'Itinerary copied!' });
    setShowShareDialog(false);
  };

  const generateShareText = () => {
    let text = `🗺️ My Trip to ${travelPlan.destination}\n`;
    text += `📅 ${formatDate(travelPlan.startDate)} - ${formatDate(travelPlan.endDate)}\n\n`;
    
    dateRange.forEach(date => {
      const dayData = itemsByDate[date];
      const hasContent = dayData.items.length > 0 || dayData.events.length > 0 || dayData.meetups.length > 0;
      if (hasContent) {
        text += `📆 ${formatDate(date)}\n`;
        dayData.items.forEach(item => {
          text += `  • ${item.startTime ? formatTime(item.startTime) + ' - ' : ''}${item.title}`;
          if (item.location) text += ` @ ${item.location}`;
          text += '\n';
        });
        dayData.events.forEach(event => {
          text += `  🎫 ${event.title} (${event.status === 'going' ? 'Going' : 'Interested'})\n`;
        });
        dayData.meetups.forEach(meetup => {
          text += `  👥 ${meetup.title}${meetup.isOrganizer ? ' (Hosting)' : ''}\n`;
        });
        text += '\n';
      }
    });
    
    return text;
  };

  const getCategoryIcon = (category?: string) => {
    return categories.find(c => c.value === category)?.icon || '📝';
  };

  const getDayNumber = (date: string) => {
    const index = dateRange.indexOf(date);
    return index + 1;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {travelPlan.destination}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {formatDate(travelPlan.startDate)} - {formatDate(travelPlan.endDate)}
            <span className="ml-2 text-sm">({dateRange.length} days)</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isOwnProfile && (
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2" title={isPublic ? 'Discoverable in searches' : 'Only accessible via link'}>
              {isPublic ? <Globe className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-gray-500" />}
              <span className="text-sm text-gray-700 dark:text-gray-300">{isPublic ? 'Discoverable' : 'Link only'}</span>
              <Switch 
                checked={isPublic} 
                onCheckedChange={(newValue) => updatePrivacyMutation.mutate(newValue)}
                disabled={!currentItinerary || updatePrivacyMutation.isPending}
              />
            </div>
          )}

          <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">Share Itinerary</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button onClick={copyLink} variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                  <Copy className="w-6 h-6 text-blue-500" />
                  <span>Copy Link</span>
                </Button>
                <Button onClick={copyItinerary} variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                  <Copy className="w-6 h-6 text-purple-500" />
                  <span>Copy Text</span>
                </Button>
                <Button onClick={shareViaEmail} variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                  <Mail className="w-6 h-6 text-red-500" />
                  <span>Email</span>
                </Button>
                <Button onClick={shareViaText} variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                  <MessageSquare className="w-6 h-6 text-green-500" />
                  <span>Text Message</span>
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {isOwnProfile && (
            <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Activity
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-white">Add Activity</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-gray-700 dark:text-gray-300">Date</Label>
                      <Select value={newItem.date || ''} onValueChange={v => setNewItem(prev => ({ ...prev, date: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {dateRange.map(date => (
                            <SelectItem key={date} value={date}>
                              Day {getDayNumber(date)} - {formatDate(date)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-700 dark:text-gray-300">Time</Label>
                      <Input
                        type="time"
                        value={newItem.startTime || ''}
                        onChange={e => setNewItem(prev => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Activity</Label>
                    <Input
                      value={newItem.title || ''}
                      onChange={e => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="What are you doing?"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Location</Label>
                    <Input
                      value={newItem.location || ''}
                      onChange={e => setNewItem(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Where?"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Category</Label>
                    <Select value={newItem.category || 'activity'} onValueChange={v => setNewItem(prev => ({ ...prev, category: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Notes</Label>
                    <Textarea
                      value={newItem.description || ''}
                      onChange={e => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Any details?"
                      rows={2}
                    />
                  </div>
                  <Button
                    onClick={() => addItemMutation.mutate(newItem)}
                    disabled={!newItem.title || !newItem.date || addItemMutation.isPending}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {addItemMutation.isPending ? 'Adding...' : 'Add Activity'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="mb-6">
        <TravelCrew 
          travelPlanId={travelPlan.id} 
          userId={userId} 
          isOwner={isOwnProfile} 
        />
      </div>

      <div className="space-y-3">
        {dateRange.map(date => {
          const dayData = itemsByDate[date];
          const totalItems = dayData.items.length + dayData.events.length + dayData.meetups.length;
          const isExpanded = expandedDays.has(date) || totalItems > 0;

          return (
            <Card key={date} className="overflow-hidden border-gray-200 dark:border-gray-700">
              <button
                onClick={() => toggleDay(date)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-blue-500 flex items-center justify-center text-white font-bold">
                    {getDayNumber(date)}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white">{formatDate(date)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {totalItems === 0 ? 'No activities yet' : `${totalItems} ${totalItems === 1 ? 'activity' : 'activities'}`}
                    </p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>

              {isExpanded && (
                <CardContent className="pt-0 pb-4 px-4">
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
                    {dayData.items.length === 0 && dayData.events.length === 0 && dayData.meetups.length === 0 && (
                      <p className="text-gray-400 dark:text-gray-500 text-center py-4 text-sm">
                        Nothing planned yet
                      </p>
                    )}

                    {dayData.items.map((item: ItineraryItem) => (
                      <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group">
                        <span className="text-xl">{getCategoryIcon(item.category)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {item.startTime && (
                              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                                {formatTime(item.startTime)}
                              </span>
                            )}
                            <span className="font-medium text-gray-900 dark:text-white">{item.title}</span>
                          </div>
                          {item.location && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" /> {item.location}
                            </p>
                          )}
                          {item.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                          )}
                        </div>
                        {isOwnProfile && item.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteItemMutation.mutate(item.id!)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}

                    {dayData.events.map((event: EventItem) => (
                      <div key={event.id} className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <Ticket className="w-5 h-5 text-purple-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">{event.title}</span>
                            <Badge variant={event.status === 'going' ? 'default' : 'secondary'} className="text-xs">
                              {event.status === 'going' ? (
                                <><Check className="w-3 h-3 mr-1" /> Going</>
                              ) : (
                                <><Star className="w-3 h-3 mr-1" /> Interested</>
                              )}
                            </Badge>
                          </div>
                          {event.location && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" /> {event.location}
                            </p>
                          )}
                        </div>
                        <a href={`/event/${event.id}`} className="text-purple-500 hover:text-purple-600">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ))}

                    {dayData.meetups.map((meetup: MeetupItem) => (
                      <div key={meetup.id} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Users className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">{meetup.title}</span>
                            {meetup.isOrganizer && (
                              <Badge className="text-xs bg-blue-500">Hosting</Badge>
                            )}
                          </div>
                          {meetup.meetingPoint && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" /> {meetup.meetingPoint}
                            </p>
                          )}
                        </div>
                        <a href={`/quick-meetups/${meetup.id}`} className="text-blue-500 hover:text-blue-600">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {relevantEvents.length > 0 || relevantMeetups.length > 0 ? (
        <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-blue-50 dark:from-orange-900/20 dark:to-blue-900/20 rounded-xl">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">📅 Auto-synced:</span> Your events and meetups during this trip are automatically included above.
          </p>
        </div>
      ) : null}
    </div>
  );
}
