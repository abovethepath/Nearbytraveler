import { useState } from 'react';
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
  const [restartDuration, setRestartDuration] = useState<string>('1hour');
  const [editingMeetup, setEditingMeetup] = useState<QuickMeetup | null>(null);
  const [deletingMeetup, setDeletingMeetup] = useState<QuickMeetup | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    duration: '1hour'
  });

  const { data: allMeetups = [], isLoading } = useQuery<QuickMeetup[]>({
    queryKey: ['/api/quick-meets'],
    queryFn: async () => {
      const response = await fetch('/api/quick-meets');
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
      const response = await fetch(`/api/quick-meets/${selectedMeetupId}/participants`);
      if (!response.ok) throw new Error('Failed to fetch participants');
      return response.json();
    },
    enabled: !!selectedMeetupId,
  });

  // Restart meetup mutation
  const restartMeetupMutation = useMutation({
    mutationFn: async ({ meetupId, duration }: { meetupId: number; duration: string }) => {
      const response = await fetch(`/api/quick-meets/${meetupId}/restart`, {
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
      const response = await fetch(`/api/quick-meets/${meetupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': actualUser?.id?.toString() || '',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update quick meet');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Quick meet updated successfully.",
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

  // Delete meetup mutation
  const deleteMeetupMutation = useMutation({
    mutationFn: async (meetupId: number) => {
      const response = await fetch(`/api/quick-meets/${meetupId}`, {
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
              <span>{meetup.city}, {meetup.state}{meetup.zipcode && ` ${meetup.zipcode}`}</span>
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="flex-1 text-xs h-7 bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Restart Meetup
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Restart "{meetup.title}"</DialogTitle>
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
                          onClick={() => {
                            // Close dialog by clicking outside or some other method
                            document.querySelector('[data-state="open"]')?.querySelector('button')?.click();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="flex-1 bg-orange-500 hover:bg-orange-600"
                          onClick={() => {
                            restartMeetupMutation.mutate({ 
                              meetupId: meetup.id, 
                              duration: restartDuration 
                            });
                            // Close dialog
                            document.querySelector('[data-state="open"]')?.querySelector('button')?.click();
                          }}
                          disabled={restartMeetupMutation.isPending}
                        >
                          {restartMeetupMutation.isPending ? 'Restarting...' : 'Restart Meetup'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="flex gap-1 flex-1">
                  <Button 
                    size="sm" 
                    className="text-xs h-7 bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => {
                      // Navigate to dedicated meetup management page
                      setLocation(`/quick-meetup-chat/${meetup.id}`);
                    }}
                  >
                    <UserCheck className="w-3 h-3 mr-1" />
                    Manage ({meetup.participantCount})
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-7 border-orange-300 text-orange-600 hover:bg-orange-50"
                    onClick={() => {
                      setEditingMeetup(meetup);
                      setEditForm({
                        title: meetup.title,
                        description: meetup.description || '',
                        duration: '1hour'
                      });
                    }}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
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
                      const response = await fetch(`/api/quick-meets/${meetup.id}/join`, {
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
      {/* Edit Meetup Dialog */}
      <Dialog open={!!editingMeetup} onOpenChange={(open) => !open && setEditingMeetup(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit "{editingMeetup?.title}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Quick meet title"
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
                className="bg-white"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-duration">Extend Duration</Label>
              <Select value={editForm.duration} onValueChange={(value) => setEditForm({ ...editForm, duration: value })}>
                <SelectTrigger>
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
                onClick={() => setEditingMeetup(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                onClick={() => {
                  if (editingMeetup) {
                    updateMeetupMutation.mutate({
                      meetupId: editingMeetup.id,
                      updates: {
                        title: editForm.title,
                        description: editForm.description,
                        duration: editForm.duration
                      }
                    });
                    setEditingMeetup(null);
                  }
                }}
                disabled={updateMeetupMutation.isPending || !editForm.title.trim()}
              >
                {updateMeetupMutation.isPending ? 'Updating...' : 'Update Quick Meet'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
            className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showCreateForm ? 'Cancel' : 'Create Quick Meet'}
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
      <AlertDialogContent>
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
    </>
  );
}

export default QuickMeetupsPage;