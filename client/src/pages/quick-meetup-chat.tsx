import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import WhatsAppChat from "@/components/WhatsAppChat";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface QuickMeetup {
  id: number;
  title: string;
  city: string;
  expiresAt: string;
  participantCount: number;
  chatroomId: number;
}

export default function QuickMeetupChat() {
  const [, params] = useRoute("/quick-meetup-chat/:meetupId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const meetupId = params?.meetupId ? parseInt(params.meetupId) : null;

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const { data: meetup, isLoading, isError, error } = useQuery<QuickMeetup>({
    queryKey: [`/api/quick-meets/${meetupId}`],
    enabled: !!meetupId,
    retry: 2,
    retryDelay: 1000
  });

  // Auto-redirect on 404 errors (expired/deleted meetups)
  useEffect(() => {
    if (isError && error) {
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
  }, [isError, error, toast, setLocation]);

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

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
  }

  if (isError || !meetup) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">
          {isError ? `Error loading meetup: ${error instanceof Error ? error.message : 'Unknown error'}` : 'Meetup not found'}
        </p>
        <Button onClick={() => setLocation('/quick-meetups')} variant="outline" data-testid="button-back-to-quick-meetups-error">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quick Meetups
        </Button>
      </div>
    );
  }

  if (!meetup.chatroomId) {
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

  return (
    <WhatsAppChat
      chatId={meetup.chatroomId}
      chatType="meetup"
      title={meetup.title}
      subtitle={`${meetup.participantCount} participants`}
      currentUserId={user.id}
    />
  );
}
