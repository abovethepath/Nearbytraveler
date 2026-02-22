import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import WhatsAppChat from "@/components/WhatsAppChat";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getApiBaseUrl } from "@/lib/queryClient";

interface QuickMeetup {
  id: number;
  title: string;
  city: string;
  expiresAt: string;
  participantCount: number;
}

interface MeetupChatroom {
  id: number;
  meetupId: number;
  name: string;
}

export default function QuickMeetupChat() {
  const [, params] = useRoute("/quick-meetup-chat/:meetupId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const meetupId = params?.meetupId ? parseInt(params.meetupId) : null;

  const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || '{}');

  const { data: meetup, isLoading: meetupLoading, isError: meetupError, error, failureCount } = useQuery<QuickMeetup>({
    queryKey: ['/api/quick-meets', meetupId],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/quick-meets/${meetupId}`);
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    enabled: !!meetupId,
    retry: 2,
    retryDelay: 1000
  });

  const { data: chatroom, isLoading: chatroomLoading } = useQuery<MeetupChatroom>({
    queryKey: ['/api/quick-meetup-chatrooms', meetupId],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/quick-meetup-chatrooms/${meetupId}`);
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    enabled: !!meetupId && !!meetup,
    retry: 2,
    retryDelay: 1000
  });

  const queryClient = useQueryClient();
  const joinMutation = useMutation({
    mutationFn: async () => {
      const headers = { 'x-user-id': String(user?.id || '') };
      if (!user?.id) throw new Error('Not logged in');
      const base = getApiBaseUrl();
      const [joinMeetupRes, joinChatRes] = await Promise.all([
        fetch(`${base}/api/quick-meets/${meetupId}/join`, { method: 'POST', headers }),
        fetch(`${base}/api/quick-meetup-chatrooms/${chatroom!.id}/join`, { method: 'POST', headers })
      ]);
      if (!joinMeetupRes.ok) {
        const err = await joinMeetupRes.json().catch(() => ({}));
        throw new Error(err.message || `Join meetup failed: ${joinMeetupRes.status}`);
      }
      if (!joinChatRes.ok) {
        const err = await joinChatRes.json().catch(() => ({}));
        throw new Error(err.message || `Join chatroom failed: ${joinChatRes.status}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quick-meets', meetupId] });
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatroom?.id}/members`] });
    }
  });

  useEffect(() => {
    if (meetupError && error && failureCount >= 2) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        toast({
          title: "Meetup No Longer Available",
          description: "This quick meet has expired or been deleted.",
          variant: "default",
        });
        setLocation('/quick-meetups');
      }
    }
  }, [meetupError, error, failureCount, toast, setLocation]);

  useEffect(() => {
    if (meetup && chatroom?.id && user?.id && !joinMutation.isSuccess && !joinMutation.isPending) {
      joinMutation.mutate();
    }
  }, [meetup?.id, chatroom?.id, user?.id]);

  if (!meetupId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">Invalid meetup ID</p>
        <Button onClick={() => setLocation('/quick-meetups')} variant="outline" data-testid="button-back-to-quick-meetups">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quick Meetups
        </Button>
      </div>
    );
  }

  if (meetupLoading || chatroomLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
  }

  if (joinMutation.isPending) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Joining hangout...</div>;
  }

  if (joinMutation.isError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-sm text-red-300">{joinMutation.error instanceof Error ? joinMutation.error.message : 'Failed to join'}</p>
        <Button onClick={() => setLocation('/quick-meetups')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quick Meetups
        </Button>
      </div>
    );
  }

  if (meetupError || !meetup) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">
          {meetupError ? `Error loading meetup: ${error instanceof Error ? error.message : 'Unknown error'}` : 'Meetup not found'}
        </p>
        <Button onClick={() => setLocation('/quick-meetups')} variant="outline" data-testid="button-back-to-quick-meetups-error">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quick Meetups
        </Button>
      </div>
    );
  }

  if (!chatroom?.id) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">Chatroom not found</p>
        <Button onClick={() => setLocation('/quick-meetups')} variant="outline" data-testid="button-back-to-quick-meetups-no-chatroom">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quick Meetups
        </Button>
      </div>
    );
  }

  if (!joinMutation.isSuccess) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Joining hangout...</div>;
  }

  return (
    <WhatsAppChat
      chatId={chatroom.id}
      chatType="meetup"
      title={meetup.title}
      subtitle={`${meetup.participantCount || 1} participants`}
      currentUserId={user.id}
    />
  );
}
