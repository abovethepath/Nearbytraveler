import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import WhatsAppChat from "@/components/WhatsAppChat";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getApiBaseUrl } from "@/lib/queryClient";
import { useAuth } from "@/App";
import { ChatPageSkeleton } from "@/components/ui/chat-page-skeleton";

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
  const [, params] = useRoute<{ meetupId: string }>("/quick-meetup-chat/:meetupId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const meetupId = params?.meetupId ? parseInt(params.meetupId) : null;

  const { user, authLoading } = useAuth();

  useEffect(() => {
    if (window.innerWidth < 768) {
      document.body.classList.add('is-chat-page');
    }
    return () => document.body.classList.remove('is-chat-page');
  }, []);

  const { data: meetup, isLoading: meetupLoading, isError: meetupError, error, failureCount } = useQuery<QuickMeetup>({
    queryKey: ['/api/quick-meets', meetupId],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/quick-meets/${meetupId}`, { credentials: 'include' });
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
      const res = await fetch(`${getApiBaseUrl()}/api/quick-meetup-chatrooms/${meetupId}`, { credentials: 'include' });
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
          description: "This meetup has expired or been deleted.",
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
          Back to Available Now
        </Button>
      </div>
    );
  }

  if (meetupLoading || chatroomLoading) {
    return <ChatPageSkeleton variant="dark" />;
  }

  if (meetupError || !meetup) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">
          {meetupError ? `Error loading meetup: ${error instanceof Error ? error.message : 'Unknown error'}` : 'Meetup not found'}
        </p>
        <Button onClick={() => setLocation('/quick-meetups')} variant="outline" data-testid="button-back-to-quick-meetups-error">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Available Now
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
          Back to Available Now
        </Button>
      </div>
    );
  }

  if (!user?.id) {
    if (authLoading) return <ChatPageSkeleton variant="dark" />;
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">Please log in to view this chat</p>
        <Button onClick={() => setLocation('/quick-meetups')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Available Now
        </Button>
      </div>
    );
  }

  const isDesktop = window.innerWidth >= 768;

  if (isDesktop) {
    return (
      <div className="flex overflow-hidden max-w-[978px] mx-auto w-full" style={{ height: 'calc(100dvh - 56px - 60px)' }}>
        <WhatsAppChat
          chatId={chatroom.id}
          chatType="meetup"
          meetupId={meetupId}
          title={meetup.title}
          subtitle={`${meetup.participantCount || 1} participants`}
          currentUserId={user.id}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 50,
      }}
    >
      <div className="flex overflow-hidden h-full max-w-[850px] mx-auto w-full">
        <WhatsAppChat
          chatId={chatroom.id}
          chatType="meetup"
          meetupId={meetupId}
          title={meetup.title}
          subtitle={`${meetup.participantCount || 1} participants`}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
