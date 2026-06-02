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
        <Button onClick={() => setLocation('/meetups')} variant="outline" data-testid="button-back-to-meetups">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Meetups
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <ChatPageSkeleton variant="dark" />;
  }

  // queryClient throws `new Error("${status}: ${body}")` on non-ok responses
  // (see client/src/lib/queryClient.ts), so a 404 surfaces as a message
  // starting with "404: ". Treat that — and a successful empty response — as
  // "meetup no longer exists." Everything else is a real network/server error.
  const is404 = error instanceof Error && /^404\b/.test(error.message);
  const meetupGone = (isError && is404) || (!isError && !isLoading && !meetup);

  if (meetupGone) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold">This meetup has ended</h1>
        <p className="text-base text-gray-300 max-w-md">
          This meetup is no longer available — it may have ended or been removed.
        </p>
        <Button onClick={() => setLocation('/meetups')} variant="outline" data-testid="button-back-to-meetups-ended">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Meetups
        </Button>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-base text-gray-300 max-w-md">
          Couldn't load this meetup. Please check your connection and try again.
        </p>
        <Button onClick={() => setLocation('/meetups')} variant="outline" data-testid="button-back-to-meetups-error">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Meetups
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
        title={meetup!.title}
        subtitle={`${meetup!.participantCount} participants`}
        currentUserId={user?.id}
        onBack={() => setLocation('/messages')}
      />
    </div>
  );
}
