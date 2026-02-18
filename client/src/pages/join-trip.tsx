import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, getApiBaseUrl } from '@/lib/queryClient';
import { isNativeIOSApp } from '@/lib/nativeApp';
import { Users, MapPin, Calendar, Check, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function JoinTrip() {
  const [, params] = useRoute('/join-trip/:token');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const token = params?.token || '';

  const { data: inviteData, isLoading, error } = useQuery({
    queryKey: ['/api/invite', token],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/invite/${token}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load invite');
      }
      return res.json();
    },
    enabled: !!token,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/join-trip/${token}`, {}).then(r => r.json());
    },
    onSuccess: (data) => {
      toast({ title: "You've joined the travel crew!" });
      if (data.travelPlan?.id) {
        setLocation(`/profile`);
      } else {
        setLocation('/profile');
      }
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to join trip', 
        description: error.message || 'Please try again',
        variant: 'destructive' 
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !inviteData?.valid) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <X className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Invalid or Expired Invite
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This invite link is no longer valid. Please ask for a new invite.
            </p>
            <Button onClick={() => setLocation(isNativeIOSApp() ? '/home' : '/')} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { trip, invitedBy } = inviteData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-orange-500" />
          </div>
          <CardTitle className="text-xl">Join Travel Crew</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {invitedBy && (
            <div className="flex items-center justify-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              {invitedBy.profileImage ? (
                <img src={invitedBy.profileImage} className="w-12 h-12 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 font-medium">
                    {(invitedBy.name || invitedBy.username || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">
                  {invitedBy.name || invitedBy.username}
                </p>
                <p className="text-sm text-gray-500">invited you to join their trip</p>
              </div>
            </div>
          )}

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {trip.destinationCity || trip.destination}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  {trip.startDate && format(new Date(trip.startDate), 'MMM d, yyyy')}
                  {trip.endDate && ` - ${format(new Date(trip.endDate), 'MMM d, yyyy')}`}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Join Travel Crew
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setLocation(isNativeIOSApp() ? '/home' : '/')}
            >
              Maybe Later
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            By joining, you'll be able to coordinate with the trip organizer, 
            see shared events, and chat with the crew.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
