import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import WhatsAppChat from "@/components/WhatsAppChat";

interface ChatroomDetails {
  id: number;
  name: string;
  description: string;
  city: string;
  memberCount: number;
}

export default function WhatsAppChatroom() {
  const params = useParams();
  const chatroomId = parseInt(params.id || '0');

  const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || '{}');

  const { data: chatroom } = useQuery<ChatroomDetails>({
    queryKey: [`/api/chatrooms/${chatroomId}`],
    enabled: !!chatroomId
  });

  if (!chatroom) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <WhatsAppChat
      chatId={chatroomId}
      chatType="chatroom"
      title={chatroom.name}
      subtitle={`${chatroom.memberCount} members`}
      currentUserId={user?.id}
    />
  );
}
