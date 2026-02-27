import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import WhatsAppChat from "@/components/WhatsAppChat";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { authStorage } from "@/lib/auth";

interface User {
  id: number;
  username: string;
  name: string;
  profileImage: string | null;
}

interface Event {
  id: number;
  title: string;
  location: string;
  date: string;
}

interface EventChatroom {
  id: number;
  eventId: number;
  chatroomName: string;
}

export default function EventChat() {
  const [, params] = useRoute<{ eventId: string }>("/event-chat/:eventId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const eventId = params?.eventId ? parseInt(params.eventId) : null;

  const [userId, setUserId] = useState<number | undefined>(() => authStorage.getUser()?.id ?? undefined);
  useEffect(() => {
    const u = authStorage.getUser();
    if (u?.id) setUserId(u.id);
  }, []);
  useEffect(() => {
    if (userId != null) return;
    const t1 = setTimeout(() => { const u = authStorage.getUser(); if (u?.id) setUserId(u.id); }, 300);
    const t2 = setTimeout(() => { const u = authStorage.getUser(); if (u?.id) setUserId(u.id); }, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [userId]);

  const { data: event, isLoading, isError, error, failureCount } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
    retry: 2,
    retryDelay: 1000
  });

  // Fetch the event chatroom to get the actual chatroom ID
  const { data: chatroom, isLoading: chatroomLoading } = useQuery<EventChatroom>({
    queryKey: [`/api/event-chatrooms/${eventId}`],
    enabled: !!eventId,
    retry: 2
  });

  // Auto-redirect on 404 errors (expired/deleted events)
  // Only redirect after all retry attempts are exhausted
  useEffect(() => {
    if (isError && error && failureCount >= 2) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        toast({
          title: "Event No Longer Available",
          description: "This event has been deleted or is no longer accessible.",
          variant: "default",
        });
        setLocation('/events');
      }
    }
  }, [isError, error, failureCount, toast, setLocation]);

  if (!eventId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">Invalid event ID</p>
        <Button onClick={() => setLocation('/events')} variant="outline" data-testid="button-back-to-events">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>
      </div>
    );
  }

  if (isLoading || chatroomLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
  }

  if (isError || !event || !chatroom) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">
          {isError ? `Error loading event: ${error instanceof Error ? error.message : 'Unknown error'}` : 'Event not found'}
        </p>
        <Button onClick={() => setLocation('/events')} variant="outline" data-testid="button-back-to-events-error">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>
      </div>
    );
  }

  if (!userId) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading chat...</div>;
  }

  return (
    <WhatsAppChat
      chatId={chatroom.id}
      chatType="event"
      title={event.title}
      subtitle={new Date(event.date).toLocaleDateString()}
      currentUserId={userId}
      eventId={eventId} // Pass the eventId so navigation back works correctly
    />
  );
}
