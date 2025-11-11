import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import WhatsAppChat from "@/components/WhatsAppChat";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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

export default function EventChat() {
  const [, params] = useRoute("/event-chat/:eventId");
  const [, setLocation] = useLocation();
  const eventId = params?.eventId ? parseInt(params.eventId) : null;

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const { data: event, isLoading, isError, error } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
    retry: 2,
    retryDelay: 1000
  });

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

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
  }

  if (isError || !event) {
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

  return (
    <WhatsAppChat
      chatId={eventId}
      chatType="event"
      title={event.title}
      subtitle={new Date(event.date).toLocaleDateString()}
      currentUserId={user.id}
    />
  );
}
