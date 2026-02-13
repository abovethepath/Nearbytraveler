import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, MapPin, Users, Search, Plus, MessageCircle, UserCheck, RotateCcw, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/App';
import { authStorage } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/queryClient';
import { QuickMeetupWidget } from '@/components/QuickMeetupWidget';
import { UniversalBackButton } from '@/components/UniversalBackButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface QuickMeetup {
  id: number;
  title: string;
  description: string;
  meetingPoint: string;
  street?: string;
  city: string;
  state: string;
  zipcode?: string;
  location: string;
  organizerId: number;
  expiresAt: string;
  availableAt: string;
  participantCount: number;
  responseTime: string;
  creator?: {
    id: number;
    username: string;
    name: string;
    profileImage: string;
  };
}

interface MeetupParticipant {
  id: number;
  meetupId: number;
  userId: number;
  status: string;
  joinedAt: string;
  user: {
    id: number;
    username: string;
    name: string;
    profileImage: string;
  };
}

function QuickMeetupsPage() {
  const { user } = useAuth();
  const actualUser = user || authStorage.getUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedMeetupId, setSelectedMeetupId] = useState<number | null>(null);
  const [isEditingMeetup, setIsEditingMeetup] = useState(false);
  const [restartDuration, setRestartDuration] = useState<string>('1hour');
  const [restartingMeetup, setRestartingMeetup] = useState<QuickMeetup | null>(null);
  const [deletingMeetup, setDeletingMeetup] = useState<QuickMeetup | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    meetingPoint: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    duration: '1hour'
  });

  // Read URL parameters: ?id= for manage, ?create=1 for open create form (e.g. from "+" → Create Hangout)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const create = params.get('create');
    if (create === '1' || create === 'true') {
      setShowCreateForm(true);
      window.history.replaceState({}, '', '/quick-meetups');
    }
    const meetupId = params.get('id');
    if (meetupId) {
      const id = parseInt(meetupId, 10);
      if (!isNaN(id)) {
        setSelectedMeetupId(id);
        window.history.replaceState({}, '', '/quick-meetups');
      }
    }
  }, []);

  const { data: allMeetups = [], isLoading } = useQuery<QuickMeetup[]>({
    queryKey: ['/api/quick-meets'],
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/quick-meets`);
      if (!response.ok) throw new Error('Failed to fetch meetups');
      const data = await response.json();
      
      // Transform backend data to match frontend interface
      return data.map((meetup: any) => ({
        ...meetup,
        creator: {
          id: meetup.organizerId,
          username: meetup.organizerUsername || 'unknown',
          name: meetup.organizerPublicName || meetup.organizerUsername || 'Unknown User',
          profileImage: meetup.organizerProfileImage || ''
        }
      }));
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get participants for selected meetup
  const { data: participants = [] } = useQuery<MeetupParticipant[]>({
    queryKey: ['/api/quick-meets', selectedMeetupId, 'participants'],
    queryFn: async () => {
      if (!selectedMeetupId) return [];
      const response = await fetch(`${getApiBaseUrl()}/api/quick-meets/${selectedMeetupId}/participants`);
      if (!response.ok) throw new Error('Failed to fetch participants');
      return response.json();
    },
    enabled: !!selectedMeetupId,
  });

  // Auto-close dialog if selected meetup no longer exists
  useEffect(() => {
    if (selectedMeetupId && !isLoading && allMeetups.length > 0) {
      const meetupExists = allMeetups.some(m => m.id === selectedMeetupId);
      if (!meetupExists) {
        setSelectedMeetupId(null);
        setIsEditingMeetup(false);
      }
    }
  }, [selectedMeetupId, allMeetups, isLoading]);

  // Restart meetup mutation
  const restartMeetupMutation = useMutation({
    mutationFn: async ({ meetupId, duration }: { meetupId: number; duration: string }) => {
      const response = await fetch(`${getApiBaseUrl()}/api/quick-meets/${meetupId}/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': actualUser?.id?.toString() || ''
        },
        body: JSON.stringify({ duration })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to restart quick meet');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Quick Meet Restarted Successfully!",
        description: `"${data.meetup.title}" is now active for ${restartDuration} with a fresh participant list.`,
      });
      
      // Refresh the meetups list
      queryClient.invalidateQueries({ queryKey: ['/api/quick-meets'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Restart Quick Meet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update meetup mutation
  const updateMeetupMutation = useMutation({
    mutationFn: async ({ meetupId, updates }: { meetupId: number; updates: any }) => {
      console.log('🚀 MUTATION FN CALLED with:', { meetupId, updates });
      console.log('👤 User ID for header:', actualUser?.id);
      
      const response = await fetch(`${getApiBaseUrl()}/api/quick-meets/${meetupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': actualUser?.id?.toString() || '',
        },
        body: JSON.stringify(updates),
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Response error:', error);
        throw new Error(error.message || 'Failed to update quick meet');
      }
      
      const data = await response.json();
      console.log('✅ Response data:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('🎉 MUTATION onSuccess callback fired');
      toast({
        title: "Success!",
        description: "Quick meet updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quick-meets'] });
      // Ensure selectedMeetupId stays set to the correct ID after update
      if (data?.meetup?.id) {
        setSelectedMeetupId(data.meetup.id);
      }
    },
    onError: (error: Error) => {
      console.error('💥 MUTATION onError callback fired:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete meetup mutation
  const deleteMeetupMutation = useMutation({
    mutationFn: async (meetupId: number) => {
      const response = await fetch(`${getApiBaseUrl()}/api/quick-meets/${meetupId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': actualUser?.id?.toString() || '',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete quick meet');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Meetup deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quick-meets'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove participant mutation
  const removeParticipantMutation = useMutation({
    mutationFn: async ({ meetupId, participantId }: { meetupId: number; participantId: number }) => {
      const response = await fetch(`${getApiBaseUrl()}/api/quick-meets/${meetupId}/participants/${participantId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': actualUser?.id?.toString() || '',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove participant');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Participant Removed",
        description: "The participant has been removed from the meetup.",
      });
      if (selectedMeetupId) {
        queryClient.invalidateQueries({ queryKey: ['/api/quick-meets', selectedMeetupId, 'participants'] });
        queryClient.invalidateQueries({ queryKey: ['/api/quick-meets'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter meetups based on search query
  const filteredMeetups = allMeetups.filter(meetup =>
    meetup.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meetup.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meetup.meetingPoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meetup.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meetup.creator?.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // API already returns sorted meetups (active first, newest first)
  // Just separate for display purposes
  const now = new Date();
  const activeMeetups = filteredMeetups.filter(meetup => new Date(meetup.expiresAt) > now);
  const expiredMeetups = filteredMeetups.filter(meetup => new Date(meetup.expiresAt) <= now);

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const timeDiff = expiration.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return "Expired";
    }
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    } else {
      return `${minutes}m left`;
    }
  };

  const MeetupCard = ({ meetup, isExpired = false }: { meetup: QuickMeetup, isExpired?: boolean }) => {
    const isOwn = meetup.organizerId === actualUser?.id;
    
    return (
      <Card className={`border ${isExpired ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50' : 'border-orange-200 dark:border-orange-700 bg-orange-50/30 dark:bg-orange-900/10'}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className={`font-semibold text-sm ${isExpired ? 'text-gray-600 dark:text-gray-400' : 'text-orange-800 dark:text-orange-200'}`}>
                {meetup.title}
              </h3>
              {meetup.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {meetup.description}
                </p>
              )}
            </div>
            <div className={`text-xs px-2 py-1 rounded-full ${isExpired ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
              {formatTimeRemaining(meetup.expiresAt)}
            </div>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <MapPin className="w-3 h-3" />
              <span>{meetup.meetingPoint}</span>
            </div>
            
            {meetup.street && (
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 ml-5">
                <span><strong>Address:</strong> {meetup.street}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 ml-5">
              <span>
                {meetup.city}
                {meetup.state && `, ${meetup.state}`}
                {meetup.zipcode && ` ${meetup.zipcode}`}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span>
                Available: {new Date(meetup.availableAt).toLocaleString('en-US', { 
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric',
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Users className="w-3 h-3" />
              <span>{meetup.participantCount || 1} attending</span>
              {meetup.creator && (
                <div className="flex items-center gap-1 ml-1">
                  <span>• by</span>
                  <Avatar className="w-4 h-4 cursor-pointer hover:ring-2 hover:ring-orange-400 transition-all" 
                          onClick={() => meetup.creator && setLocation(`/profile/${meetup.creator.id}`)}>
                    <AvatarImage 
                      src={meetup.creator.profileImage || ''} 
                      alt={`${meetup.creator.username}'s profile`}
                      className="object-cover" 
                    />
                    <AvatarFallback className="text-[10px] bg-gradient-to-br from-blue-500 to-orange-500 text-white font-semibold">
                      {(meetup.creator.username || meetup.creator.name || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span 
                    className="cursor-pointer hover:text-orange-600 dark:hover:text-orange-400"
                    onClick={() => meetup.creator && setLocation(`/profile/${meetup.creator.id}`)}
                  >
                    @{meetup.creator.username}
                  </span>
                  {meetup.creator && meetup.creator.id !== actualUser?.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/chat/${meetup.creator!.id}`);
                      }}
                      className="ml-1 p-0.5 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                      title="Send message"
                    >
                      <MessageCircle className="w-3 h-3 text-orange-500" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              size="sm"
              variant="outline" 
              className="text-xs h-7 border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 bg-white dark:bg-gray-800"
              onClick={() => {
                setLocation(`/quick-meetup-chat/${meetup.id}`);
              }}
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              Chat
            </Button>
            
            
            {isOwn ? (
              isExpired ? (
                <Button 
                  size="sm" 
                  className="flex-1 text-xs h-7 bg-orange-500 hover:bg-orange-600"
                  style={{ color: 'black' }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setRestartingMeetup(meetup);
                  }}
                >
                  <RotateCcw className="w-3 h-3 mr-1" style={{ color: 'black' }} />
                  <span style={{ color: 'black' }}>Restart Meetup</span>
                </Button>
              ) : (
                <div className="flex gap-1 flex-1">
                  <Button 
                    size="sm" 
                    className="text-xs h-7 bg-blue-500 hover:bg-blue-600 text-white flex-1"
                    onClick={() => {
                      // Select this meetup to show participants and management options
                      setSelectedMeetupId(meetup.id);
                    }}
                  >
                    <UserCheck className="w-3 h-3 mr-1" />
                    Manage ({meetup.participantCount})
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                        onClick={() => setDeletingMeetup(meetup)}
                      >
                        <Trash2 className="w-3 h-3 mr-2" />
                        Cancel Meetup
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            ) : (
              <Button 
                size="sm" 
                className={`flex-1 text-xs h-7 ${isExpired ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
                onClick={async () => {
                  if (isExpired) {
                    setShowCreateForm(true);
                  } else {
                    try {
                      const response = await fetch(`${getApiBaseUrl()}/api/quick-meets/${meetup.id}/join`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'x-user-id': actualUser?.id?.toString() || ''
                        }
                      });
                      
                      if (response.ok) {
                        toast({
                          title: "Successfully Joined!",
                          description: `You've joined "${meetup.title}". You can now chat with other participants.`,
                        });
                        queryClient.invalidateQueries({ queryKey: ['/api/quick-meets'] });
                      } else {
                        const error = await response.json();
                        toast({
                          title: "Failed to Join",
                          description: error.message || "Unable to join meetup",
                          variant: "destructive",
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Network error while trying to join meetup",
                        variant: "destructive",
                      });
                    }
                  }
                }}
              >
                {isExpired ? 'Create Similar' : 'Join'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {/* Manage Quick Meet Dialog */}
      <Dialog open={!!selectedMeetupId} onOpenChange={(open) => !open && setSelectedMeetupId(null)}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Manage Quick Meet</DialogTitle>
          </DialogHeader>
          {selectedMeetupId && (() => {
            // Show loading while meetups are being fetched
            if (isLoading || allMeetups.length === 0) {
              return (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading meetup details...</span>
                </div>
              );
            }
            const selectedMeetup = allMeetups.find(m => m.id === selectedMeetupId);
            if (!selectedMeetup) return <div className="text-center py-4 text-red-600">Meetup not found or has expired</div>;
            
            const isOrganizer = selectedMeetup.organizerId === actualUser?.id;
            
            return (
              <div className="space-y-4">
                {/* Edit Details Button (Organizer Only) */}
                {isOrganizer && !isEditingMeetup && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setIsEditingMeetup(true);
                      setEditForm({
                        title: selectedMeetup.title ?? '',
                        description: selectedMeetup.description ?? '',
                        meetingPoint: selectedMeetup.meetingPoint ?? '',
                        street: selectedMeetup.street ?? '',
                        city: selectedMeetup.city ?? '',
                        state: selectedMeetup.state ?? '',
                        zipcode: selectedMeetup.zipcode ?? '',
                        duration: '1hour'
                      });
                    }}
                    data-testid="button-edit-details"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Details
                  </Button>
                )}

                {/* Edit Mode */}
                {isEditingMeetup ? (
                  <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div>
                      <Label htmlFor="edit-title">Title</Label>
                      <Input
                        id="edit-title"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Quick meet title"
                        data-testid="input-edit-title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="What are you planning to do?"
                        rows={3}
                        className="bg-white dark:bg-gray-800"
                        data-testid="textarea-edit-description"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-meeting-point">Meeting Point</Label>
                      <Input
                        id="edit-meeting-point"
                        value={editForm.meetingPoint}
                        onChange={(e) => setEditForm({ ...editForm, meetingPoint: e.target.value })}
                        placeholder="e.g. Coffee shop entrance"
                        data-testid="input-edit-meeting-point"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="edit-street">Street Address</Label>
                        <Input
                          id="edit-street"
                          value={editForm.street}
                          onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                          placeholder="Street address"
                          data-testid="input-edit-street"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-city">City</Label>
                        <Input
                          id="edit-city"
                          value={editForm.city}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                          placeholder="City"
                          data-testid="input-edit-city"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="edit-state">State/Province (optional)</Label>
                        <Input
                          id="edit-state"
                          value={editForm.state}
                          onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                          placeholder="If applicable"
                          data-testid="input-edit-state"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-zipcode">Postal Code (optional)</Label>
                        <Input
                          id="edit-zipcode"
                          value={editForm.zipcode}
                          onChange={(e) => setEditForm({ ...editForm, zipcode: e.target.value })}
                          placeholder="If applicable"
                          data-testid="input-edit-zipcode"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-duration">Extend Duration</Label>
                      <Select value={editForm.duration} onValueChange={(value) => setEditForm({ ...editForm, duration: value })}>
                        <SelectTrigger data-testid="select-edit-duration">
                          <SelectValue placeholder="Select additional time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1hour">+1 Hour</SelectItem>
                          <SelectItem value="2hours">+2 Hours</SelectItem>
                          <SelectItem value="3hours">+3 Hours</SelectItem>
                          <SelectItem value="4hours">+4 Hours</SelectItem>
                          <SelectItem value="6hours">+6 Hours</SelectItem>
                          <SelectItem value="12hours">+12 Hours</SelectItem>
                          <SelectItem value="24hours">+24 Hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsEditingMeetup(false)}
                        data-testid="button-cancel-edit"
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => {
                          console.log('💾 SAVE BUTTON CLICKED');
                          console.log('📝 Edit Form Data:', editForm);
                          console.log('🔒 Button disabled?:', updateMeetupMutation.isPending || !editForm.title.trim());
                          console.log('⏳ Mutation pending?:', updateMeetupMutation.isPending);
                          console.log('📋 Title empty?:', !editForm.title.trim());
                          
                          updateMeetupMutation.mutate({
                            meetupId: selectedMeetup.id,
                            updates: {
                              title: editForm.title.trim(),
                              description: editForm.description.trim(),
                              meetingPoint: editForm.meetingPoint.trim(),
                              street: editForm.street.trim(),
                              city: editForm.city.trim(),
                              state: editForm.state.trim(),
                              zipcode: editForm.zipcode.trim(),
                              duration: editForm.duration
                            }
                          }, {
                            onSuccess: () => {
                              console.log('✅ Update successful, closing edit mode');
                              setIsEditingMeetup(false);
                            }
                          });
                        }}
                        disabled={updateMeetupMutation.isPending || !editForm.title?.trim()}
                        data-testid="button-save-edit"
                      >
                        {updateMeetupMutation.isPending ? (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin">⏳</span>
                            Saving...
                          </span>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View Mode - Meetup Details */
                  <div className="space-y-2 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                    <h3 className="font-bold text-lg text-orange-800 dark:text-orange-200">{selectedMeetup.title}</h3>
                    {selectedMeetup.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedMeetup.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <MapPin className="w-3 h-3" />
                      <span>{selectedMeetup.meetingPoint}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        {formatTimeRemaining(selectedMeetup.expiresAt)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Participants List */}
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Participants ({participants.length})
                  </h4>
                  {participants.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No participants yet
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          data-testid={`participant-${participant.userId}`}
                        >
                          <Avatar 
                            className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-orange-400 transition-all"
                            onClick={() => {
                              setLocation(`/profile/${participant.user.id}`);
                              setSelectedMeetupId(null);
                            }}
                            data-testid={`avatar-participant-${participant.userId}`}
                          >
                            <AvatarImage 
                              src={participant.user.profileImage || ''} 
                              alt={`${participant.user.username}'s profile`}
                              className="object-cover" 
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-orange-500 text-white font-semibold">
                              {(participant.user.username || participant.user.name || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p 
                              className="text-sm font-medium cursor-pointer hover:text-orange-600 dark:hover:text-orange-400 truncate"
                              onClick={() => {
                                setLocation(`/profile/${participant.user.id}`);
                                setSelectedMeetupId(null);
                              }}
                              data-testid={`name-participant-${participant.userId}`}
                            >
                              {participant.user.name || participant.user.username}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              @{participant.user.username}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {participant.userId === actualUser?.id && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                                You
                              </span>
                            )}
                            {participant.userId === selectedMeetup.organizerId && (
                              <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full">
                                Organizer
                              </span>
                            )}
                            {participant.userId !== actualUser?.id && (
                              <button
                                onClick={() => {
                                  setLocation(`/chat/${participant.user.id}`);
                                  setSelectedMeetupId(null);
                                }}
                                className="p-1.5 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                                title="Send message"
                                data-testid={`message-participant-${participant.userId}`}
                              >
                                <MessageCircle className="w-4 h-4 text-orange-500" />
                              </button>
                            )}
                            {isOrganizer && participant.userId !== actualUser?.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button
                                    className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                    title="Remove participant"
                                    data-testid={`remove-participant-${participant.userId}`}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white dark:bg-gray-900">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Participant?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove {participant.user.name || participant.user.username} from this meetup? They will be removed from the chatroom as well.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel data-testid={`cancel-remove-${participant.userId}`}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        removeParticipantMutation.mutate({
                                          meetupId: selectedMeetup.id,
                                          participantId: participant.userId
                                        });
                                      }}
                                      className="bg-red-500 hover:bg-red-600"
                                      data-testid={`confirm-remove-${participant.userId}`}
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedMeetupId(null)}
                    data-testid="button-close-manage-dialog"
                  >
                    Close
                  </Button>
                  <Button
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                    style={{ color: 'black' }}
                    onClick={() => {
                      setLocation(`/quick-meetup-chat/${selectedMeetup.id}`);
                      setSelectedMeetupId(null);
                    }}
                    data-testid="button-goto-chat"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" style={{ color: 'black' }} />
                    <span style={{ color: 'black' }}>Go to Chat</span>
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 w-full max-w-full overflow-x-hidden">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <UniversalBackButton />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-800 bg-clip-text text-transparent mb-2">
            All Quick Meets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find spontaneous hangouts and activities in your area
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search quick meets by activity, location, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Create New Meetup Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600"
            style={{ color: 'black' }}
          >
            <Plus className="w-4 h-4 mr-2" style={{ color: 'black' }} />
            <span style={{ color: 'black' }}>{showCreateForm ? 'Cancel' : 'Create Quick Meet'}</span>
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="mb-6">
            <Card className="border-blue-200 dark:border-blue-700">
              <CardContent className="p-4">
                <QuickMeetupWidget city={actualUser?.hometownCity || ''} />
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading meetups...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Meetups */}
            {activeMeetups.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-4">
                  Active Now ({activeMeetups.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {activeMeetups.map((meetup) => (
                    <MeetupCard key={meetup.id} meetup={meetup} />
                  ))}
                </div>
              </div>
            )}

            {/* Expired Meetups */}
            {expiredMeetups.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-2">
                  Expired Meetups ({expiredMeetups.length})
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <RotateCcw className="w-4 h-4 inline mr-1" />
                  Your expired meetups can be restarted with fresh participant lists and new durations
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {expiredMeetups.map((meetup) => (
                    <MeetupCard key={meetup.id} meetup={meetup} isExpired />
                  ))}
                </div>
              </div>
            )}

            {filteredMeetups.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Users className="w-16 h-16 mx-auto mb-4" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  No meetups found
                </h3>
                <p className="text-gray-500 dark:text-gray-500 mb-4">
                  {searchQuery ? 'Try adjusting your search terms' : 'Be the first to create a quick meetup!'}
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Meetup
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Delete Meetup Confirmation Dialog */}
    <AlertDialog open={!!deletingMeetup} onOpenChange={(open) => !open && setDeletingMeetup(null)}>
      <AlertDialogContent className="bg-white dark:bg-gray-800">
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel "{deletingMeetup?.title}"</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this meetup? This action cannot be undone and will remove all participants and chat history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            onClick={() => {
              if (deletingMeetup) {
                deleteMeetupMutation.mutate(deletingMeetup.id);
                setDeletingMeetup(null);
              }
            }}
            disabled={deleteMeetupMutation.isPending}
          >
            {deleteMeetupMutation.isPending ? 'Canceling...' : 'Cancel Meetup'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Restart Meetup Dialog - Controlled */}
    <Dialog open={!!restartingMeetup} onOpenChange={(open) => !open && setRestartingMeetup(null)}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle>Restart "{restartingMeetup?.title}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              This will create a new meetup with the same details but a fresh participant list. Choose how long it should stay active:
            </p>
            
            <Select value={restartDuration} onValueChange={setRestartDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1hour">1 Hour</SelectItem>
                <SelectItem value="2hours">2 Hours</SelectItem>
                <SelectItem value="3hours">3 Hours</SelectItem>
                <SelectItem value="4hours">4 Hours</SelectItem>
                <SelectItem value="6hours">6 Hours</SelectItem>
                <SelectItem value="12hours">12 Hours</SelectItem>
                <SelectItem value="24hours">24 Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRestartingMeetup(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              onClick={() => {
                if (restartingMeetup) {
                  restartMeetupMutation.mutate({ 
                    meetupId: restartingMeetup.id, 
                    duration: restartDuration 
                  });
                  setRestartingMeetup(null);
                }
              }}
              disabled={restartMeetupMutation.isPending}
            >
              {restartMeetupMutation.isPending ? 'Restarting...' : 'Restart Meetup'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

export default QuickMeetupsPage;