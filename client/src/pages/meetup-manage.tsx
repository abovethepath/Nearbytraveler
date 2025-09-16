import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Users, MessageCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/App';
import { authStorage } from '@/lib/auth';
import { UniversalBackButton } from '@/components/UniversalBackButton';

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

function MeetupManagePage() {
  const { user } = useAuth();
  const actualUser = user || authStorage.getUser();
  const [match, params] = useRoute('/quick-meetups/:id/manage');
  const meetupId = params?.id ? parseInt(params.id) : null;

  const { data: meetup, isLoading: meetupLoading } = useQuery<QuickMeetup>({
    queryKey: ['/api/quick-meets', meetupId],
    queryFn: async () => {
      if (!meetupId) throw new Error('No meetup ID');
      const response = await fetch(`/api/quick-meets/${meetupId}`);
      if (!response.ok) throw new Error('Failed to fetch meetup');
      return response.json();
    },
    enabled: !!meetupId,
  });

  const { data: participants = [], isLoading: participantsLoading } = useQuery<MeetupParticipant[]>({
    queryKey: ['/api/quick-meets', meetupId, 'participants'],
    queryFn: async () => {
      if (!meetupId) return [];
      const response = await fetch(`/api/quick-meets/${meetupId}/participants`);
      if (!response.ok) throw new Error('Failed to fetch participants');
      return response.json();
    },
    enabled: !!meetupId,
  });

  if (!meetupId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-6 max-w-4xl">
          <UniversalBackButton />
          <div className="text-center py-8">
            <p className="text-red-600">Invalid meetup ID</p>
          </div>
        </div>
      </div>
    );
  }

  if (meetupLoading || participantsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-6 max-w-4xl">
          <UniversalBackButton />
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading meetup details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!meetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-6 max-w-4xl">
          <UniversalBackButton />
          <div className="text-center py-8">
            <p className="text-red-600">Meetup not found</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if user owns this meetup
  if (meetup.organizerId !== actualUser?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-6 max-w-4xl">
          <UniversalBackButton />
          <div className="text-center py-8">
            <p className="text-red-600">You don't have permission to manage this meetup</p>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <UniversalBackButton />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-800 bg-clip-text text-transparent mb-2">
            Manage Meetup
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Coordinate with participants and manage your meetup
          </p>
        </div>

        {/* Meetup Details */}
        <Card className="mb-6 border-orange-200 dark:border-orange-700">
          <CardHeader>
            <CardTitle className="text-orange-800 dark:text-orange-200">{meetup.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">{meetup.description}</p>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>{meetup.meetingPoint}</span>
              </div>
              
              {meetup.street && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 ml-6">
                  <span><strong>Address:</strong> {meetup.street}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 ml-6">
                <span>{meetup.city}, {meetup.state}{meetup.zipcode && ` ${meetup.zipcode}`}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
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

              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                <span className="font-medium">{meetup.participantCount} attending</span>
                <span className="px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs">
                  {formatTimeRemaining(meetup.expiresAt)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Participants ({participants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {participant.user?.profileImage ? (
                      <img 
                        src={participant.user.profileImage} 
                        alt={participant.user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                        {participant.user?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{participant.user?.username || 'Unknown User'}</p>
                      <p className="text-sm text-gray-500">
                        Joined {new Date(participant.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      window.location.href = `/messages?user=${participant.user?.id}`;
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                </div>
              ))}
              {participants.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No participants yet. Share your meetup to get people to join!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Group Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Group Communication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={() => {
                window.location.href = `/quick-meetup-chat/${meetup.id}`;
              }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Open Group Discussion
            </Button>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Coordinate logistics, share tips, and connect with participants
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MeetupManagePage;