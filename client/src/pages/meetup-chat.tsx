import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { isNativeIOSApp } from "@/lib/nativeApp";
import WhatsAppChat from "@/components/WhatsAppChat";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/App";
import { ChatPageSkeleton } from "@/components/ui/chat-page-skeleton";

interface Meetup {
  id: number;
  title: string;
  city: string;
  date: string;
  participantCount: number;
}

export default function MeetupChat() {
  const [, params] = useRoute<{ meetupId: string }>("/meetup-chat/:meetupId");
  const [, setLocation] = useLocation();
  const meetupId = params?.meetupId ? parseInt(params.meetupId) : null;

  const { user, authLoading } = useAuth();

  const { data: meetup, isLoading, isError, error } = useQuery<Meetup>({
    queryKey: [`/api/quick-meets/${meetupId}`],
    enabled: !!meetupId,
    retry: 2,
    retryDelay: 1000
  });

  if (!meetupId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">Invalid meetup ID</p>
        <Button onClick={() => setLocation(isNativeIOSApp() ? '/home' : '/')} variant="outline" data-testid="button-go-home">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Home
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <ChatPageSkeleton variant="dark" />;
  }

  if (isError || !meetup) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">
          {isError ? `Error loading meetup: ${error instanceof Error ? error.message : 'Unknown error'}` : 'Meetup not found'}
        </p>
        <Button onClick={() => setLocation(isNativeIOSApp() ? '/home' : '/')} variant="outline" data-testid="button-go-home-error">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="flex overflow-hidden h-full max-w-[1100px] mx-auto w-full">
      <WhatsAppChat
        chatId={meetupId}
        chatType="meetup"
        meetupId={meetupId}
        title={meetup.title}
        subtitle={`${meetup.participantCount} participants`}
        currentUserId={user?.id}
      />
    </div>
  );
}
