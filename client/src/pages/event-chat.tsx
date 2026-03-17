import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import WhatsAppChat from "@/components/WhatsAppChat";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/App";
import { ChatPageSkeleton } from "@/components/ui/chat-page-skeleton";

interface Event {
  id: number;
  title: string;
  location: string;
  date: string;
  imageUrl?: string | null;
}

function formatEventDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const datePart = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${datePart} at ${timePart}`;
  } catch {
    return dateStr;
  }
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

  // Also try reading from the URL directly as a fallback (for App.tsx startsWith rendering)
  const urlEventId = (() => {
    try {
      const parts = window.location.pathname.split('/event-chat/');
      const raw = parts[1]?.split('?')[0]?.split('/')[0];
      return raw ? parseInt(raw) : null;
    } catch { return null; }
  })();

  const eventId = (params?.eventId ? parseInt(params.eventId) : null) ?? urlEventId;

  const { user, authLoading } = useAuth();
  const userId = user?.id;

  const { data: event, isLoading: eventLoading, isError: eventError, error: eventErr, failureCount } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch the event chatroom — this also creates it if it doesn't exist yet
  const { data: chatroom, isLoading: chatroomLoading, isError: chatroomError } = useQuery<EventChatroom>({
    queryKey: [`/api/event-chatrooms/${eventId}`],
    enabled: !!eventId,
    retry: 2,
    retryDelay: 1000,
  });

  // Auto-redirect only on confirmed 404 (deleted event) after all retries
  useEffect(() => {
    if (eventError && eventErr && failureCount >= 2) {
      const msg = eventErr instanceof Error ? eventErr.message : String(eventErr);
      if (msg.includes('404') || msg.includes('not found')) {
        toast({ title: "Event No Longer Available", description: "This event has been deleted or is no longer accessible." });
        setLocation('/events');
      }
    }
  }, [eventError, eventErr, failureCount, toast, setLocation]);

  if (!eventId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">Invalid event ID</p>
        <Button onClick={() => setLocation('/events')} variant="outline" className="border-gray-600 text-gray-300" data-testid="button-back-to-events">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>
      </div>
    );
  }

  if (eventLoading || chatroomLoading || authLoading) {
    return <ChatPageSkeleton variant="dark" />;
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">Please log in to view this chat</p>
        <Button onClick={() => setLocation('/events')} variant="outline" className="border-gray-600 text-gray-300">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">Event not found</p>
        <Button onClick={() => setLocation('/events')} variant="outline" className="border-gray-600 text-gray-300" data-testid="button-back-to-events-error">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>
      </div>
    );
  }

  if (chatroomError || !chatroom) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg font-semibold">{event.title}</p>
        <p className="text-sm text-gray-400">Unable to load the event chat. Please try again.</p>
        <div className="flex gap-3">
          <Button onClick={() => window.location.reload()} className="bg-orange-500 hover:bg-orange-600 text-white">
            Try Again
          </Button>
          <Button onClick={() => setLocation('/events')} variant="outline" className="border-gray-600 text-gray-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex overflow-hidden h-full max-w-[1100px] mx-auto w-full">
      <WhatsAppChat
        chatId={chatroom.id}
        chatType="event"
        title={event.title}
        subtitle={event.date ? formatEventDate(event.date) : 'Event Chat'}
        currentUserId={userId}
        eventId={eventId}
        eventImageUrl={event.imageUrl || undefined}
      />
    </div>
  );
}
