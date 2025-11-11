import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import WhatsAppChat from "@/components/WhatsAppChat";

interface Meetup {
  id: number;
  title: string;
  city: string;
  date: string;
  participantCount: number;
}

export default function MeetupChat() {
  const [, params] = useRoute("/meetup-chat/:meetupId");
  const meetupId = params?.meetupId ? parseInt(params.meetupId) : null;

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const { data: meetup } = useQuery<Meetup>({
    queryKey: [`/api/quick-meets/${meetupId}`],
    enabled: !!meetupId
  });

  if (!meetup || !meetupId) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <WhatsAppChat
      chatId={meetupId}
      chatType="meetup"
      title={meetup.title}
      subtitle={`${meetup.participantCount} participants`}
      currentUserId={user.id}
    />
  );
}
