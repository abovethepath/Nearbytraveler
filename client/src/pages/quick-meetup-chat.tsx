import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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

  let user: { id?: number } = {};
  try {
    user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || '{}');
  } catch {
    user = {};
  }

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

  if (!user?.id) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">Please log in to view this chat</p>
        <Button onClick={() => setLocation('/quick-meetups')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quick Meetups
        </Button>
      </div>
    );
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
