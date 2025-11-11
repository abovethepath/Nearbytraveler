import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import WhatsAppChat from "@/components/WhatsAppChat";

interface QuickMeetup {
  id: number;
  title: string;
  city: string;
  expiresAt: string;
  participantCount: number;
}

export default function QuickMeetupChat() {
  const [, params] = useRoute("/quick-meetup-chat/:meetupId");
  const meetupId = params?.meetupId ? parseInt(params.meetupId) : null;

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const { data: meetup } = useQuery<QuickMeetup>({
    queryKey: [`/api/quick-meetups/${meetupId}`],
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
