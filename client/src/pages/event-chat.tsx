import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import WhatsAppChat from "@/components/WhatsAppChat";

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
  const eventId = params?.eventId ? parseInt(params.eventId) : null;

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const { data: event } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId
  });

  if (!event || !eventId) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
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
