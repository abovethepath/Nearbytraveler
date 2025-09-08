import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, MapPin, Users, Clock, Coffee, Beer, Music, Camera, Utensils, Plane } from 'lucide-react';
import { useAuth } from '@/App';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Hangout {
  id: number;
  hostId: number;
  host: {
    username: string;
    name: string;
    profileImage?: string;
  };
  title: string;
  description: string;
  category: 'coffee' | 'drinks' | 'food' | 'sightseeing' | 'nightlife' | 'outdoor' | 'cultural' | 'sports';
  location: string;
  meetingPoint: string;
  datetime: string;
  maxParticipants: number;
  currentParticipants: number;
  isPublic: boolean;
  requirements?: string;
  costEstimate?: string;
  attendees: Array<{
    id: number;
    username: string;
    name: string;
    profileImage?: string;
  }>;
  isJoined: boolean;
  createdAt: string;
}

export function LocalHangouts({ city, isOwnProfile = false }: { city?: string; isOwnProfile?: boolean }) {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [newHangout, setNewHangout] = useState({
    title: '',
    description: '',
    category: 'coffee' as const,
    location: city || '',
    meetingPoint: '',
    datetime: '',
    maxParticipants: 4,
    isPublic: true,
    requirements: '',
    costEstimate: ''
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: hangouts = [] } = useQuery({
    queryKey: [`/api/hangouts${city ? `?city=${city}` : ''}`],
    enabled: true
  });

  const createHangoutMutation = useMutation({
    mutationFn: async (data: typeof newHangout) => {
      return apiRequest(`/api/hangouts`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hangouts`] });
      setShowCreateForm(false);
      setNewHangout({
        title: '',
        description: '',
        category: 'coffee',
        location: city || '',
        meetingPoint: '',
        datetime: '',
        maxParticipants: 4,
        isPublic: true,
        requirements: '',
        costEstimate: ''
      });
      toast({
        title: "Hangout created",
        description: "Your local hangout is now live and others can join",
      });
    },
    onError: (error) => {
      console.error('Error creating hangout:', error);
      toast({
        title: "Error",
        description: "Failed to create hangout",
        variant: "destructive",
      });
    },
  });

  const joinHangoutMutation = useMutation({
    mutationFn: async (hangoutId: number) => {
      return apiRequest(`/api/hangouts/${hangoutId}/join`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hangouts`] });
      toast({
        title: "Joined hangout",
        description: "You've successfully joined this local hangout",
      });
    },
  });

  const leaveHangoutMutation = useMutation({
    mutationFn: async (hangoutId: number) => {
      return apiRequest(`/api/hangouts/${hangoutId}/leave`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hangouts`] });
      toast({
        title: "Left hangout",
        description: "You've left this hangout",
      });
    },
  });

  const categoryLabels = {
    coffee: 'Coffee & Chat',
    drinks: 'Drinks & Bar',
    food: 'Food & Dining',
    sightseeing: 'Sightseeing',
    nightlife: 'Nightlife',
    outdoor: 'Outdoor Activities',
    cultural: 'Cultural Events',
    sports: 'Sports & Fitness'
  };

  const categoryIcons = {
    coffee: Coffee,
    drinks: Beer,
    food: Utensils,
    sightseeing: Camera,
    nightlife: Music,
    outdoor: MapPin,
    cultural: Calendar,
    sports: Users
  };

  const categoryColors = {
    coffee: 'bg-amber-100 text-amber-800 border-amber-200',
    drinks: 'bg-orange-100 text-orange-800 border-orange-200',
    food: 'bg-orange-100 text-orange-800 border-orange-200',
    sightseeing: 'bg-blue-100 text-blue-800 border-blue-200',
    nightlife: 'bg-pink-100 text-pink-800 border-pink-200',
    outdoor: 'bg-green-100 text-green-800 border-green-200',
    cultural: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    sports: 'bg-red-100 text-red-800 border-red-200'
  };

  const getTimeStatus = (datetime: string) => {
    const now = new Date();
    const hangoutTime = new Date(datetime);
    const diffHours = (hangoutTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 0) return { label: 'Past', color: 'bg-gray-100 text-gray-600' };
    if (diffHours < 2) return { label: 'Starting Soon', color: 'bg-red-100 text-red-600' };
    if (diffHours < 6) return { label: 'Today', color: 'bg-orange-100 text-orange-600' };
    if (diffHours < 24) return { label: 'Today', color: 'bg-blue-100 text-blue-600' };
    return { label: 'Upcoming', color: 'bg-green-100 text-green-600' };
  };

  const filteredHangouts = hangouts.filter((hangout: Hangout) => {
    if (filter === 'all') return true;
    if (filter === 'joined') return hangout.isJoined;
    if (filter === 'hosting') return hangout.hostId === user?.id;
    return hangout.category === filter;
  });

  const upcomingCount = hangouts.filter((h: Hangout) => new Date(h.datetime) > new Date()).length;
  const joinedCount = hangouts.filter((h: Hangout) => h.isJoined).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Local Hangouts {city && `in ${city}`}
          </CardTitle>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600"
          >
            {showCreateForm ? 'Cancel' : 'Create Hangout'}
          </Button>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{upcomingCount} upcoming</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{joinedCount} joined</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Hangouts' },
            { key: 'joined', label: 'Joined' },
            { key: 'hosting', label: 'Hosting' },
            { key: 'coffee', label: 'Coffee' },
            { key: 'drinks', label: 'Drinks' },
            { key: 'food', label: 'Food' },
            { key: 'sightseeing', label: 'Sightseeing' }
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === filterOption.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        {showCreateForm && (
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h4 className="font-semibold">Create Local Hangout</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  value={newHangout.category}
                  onChange={(e) => setNewHangout(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full p-2 border rounded-md"
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Max Participants</label>
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={newHangout.maxParticipants}
                  onChange={(e) => setNewHangout(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newHangout.title}
                onChange={(e) => setNewHangout(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Coffee & local tips at trendy café"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newHangout.description}
                onChange={(e) => setNewHangout(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What will you do together? Share details about the hangout..."
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Location/Area</label>
                <Input
                  value={newHangout.location}
                  onChange={(e) => setNewHangout(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Downtown, Soho, etc."
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Meeting Point</label>
                <Input
                  value={newHangout.meetingPoint}
                  onChange={(e) => setNewHangout(prev => ({ ...prev, meetingPoint: e.target.value }))}
                  placeholder="Starbucks on Main St, Central Park entrance"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date & Time</label>
                <input
                  type="datetime-local"
                  value={newHangout.datetime}
                  onChange={(e) => setNewHangout(prev => ({ ...prev, datetime: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  min={new Date().toISOString().slice(0, 16)}
                  max="9999-12-31T23:59"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Cost Estimate</label>
                <Input
                  value={newHangout.costEstimate}
                  onChange={(e) => setNewHangout(prev => ({ ...prev, costEstimate: e.target.value }))}
                  placeholder="Free, $10-15, $$, etc."
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Requirements (Optional)</label>
              <Textarea
                value={newHangout.requirements}
                onChange={(e) => setNewHangout(prev => ({ ...prev, requirements: e.target.value }))}
                placeholder="Any age restrictions, what to bring, etc."
                className="min-h-[60px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={newHangout.isPublic}
                onChange={(e) => setNewHangout(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="isPublic" className="text-sm">
                Public hangout (visible to all community members)
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => createHangoutMutation.mutate(newHangout)}
                disabled={createHangoutMutation.isPending || !newHangout.title || !newHangout.datetime}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                {createHangoutMutation.isPending ? 'Creating...' : 'Create Hangout'}
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {filteredHangouts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hangouts found</p>
            <p className="text-sm">
              {filter === 'all' 
                ? "Be the first to create a local hangout"
                : `No hangouts in the ${filter} category`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHangouts.map((hangout: Hangout) => {
              const IconComponent = categoryIcons[hangout.category];
              const timeStatus = getTimeStatus(hangout.datetime);
              const isHost = hangout.hostId === user?.id;
              const isFull = hangout.currentParticipants >= hangout.maxParticipants;
              const isPast = new Date(hangout.datetime) < new Date();
              
              return (
                <div key={hangout.id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                        <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold truncate">{hangout.title}</h4>
                          <Badge className={categoryColors[hangout.category]}>
                            {categoryLabels[hangout.category]}
                          </Badge>
                          <Badge className={timeStatus.color}>
                            {timeStatus.label}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {hangout.description}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{hangout.meetingPoint}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(hangout.datetime).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{hangout.currentParticipants}/{hangout.maxParticipants} joined</span>
                          </div>
                          {hangout.costEstimate && (
                            <div className="flex items-center gap-1">
                              <span>💰</span>
                              <span>{hangout.costEstimate}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <div className="text-xs text-gray-500">
                            Hosted by @{hangout.host.username}
                          </div>
                          {hangout.attendees.length > 0 && (
                            <div className="flex -space-x-2">
                              {hangout.attendees.slice(0, 3).map((attendee) => (
                                <div
                                  key={attendee.id}
                                  className="w-6 h-6 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
                                  title={`@${attendee.username}`}
                                >
                                  {attendee.username.charAt(0).toUpperCase()}
                                </div>
                              ))}
                              {hangout.attendees.length > 3 && (
                                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white">
                                  +{hangout.attendees.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {!isHost && !isPast && (
                        hangout.isJoined ? (
                          <Button
                            onClick={() => leaveHangoutMutation.mutate(hangout.id)}
                            size="sm"
                            variant="outline"
                            disabled={leaveHangoutMutation.isPending}
                          >
                            Leave
                          </Button>
                        ) : (
                          <Button
                            onClick={() => joinHangoutMutation.mutate(hangout.id)}
                            size="sm"
                            disabled={joinHangoutMutation.isPending || isFull}
                            className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600"
                          >
                            {isFull ? 'Full' : 'Join'}
                          </Button>
                        )
                      )}
                      
                      {isHost && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Host
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {hangout.requirements && (
                    <div className="text-xs text-gray-600 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      <strong>Requirements:</strong> {hangout.requirements}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}