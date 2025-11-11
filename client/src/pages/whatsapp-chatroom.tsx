import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/App";
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
  const { user } = useAuth();
  const chatroomId = parseInt(params.id || '0');

  const { data: chatroomArray } = useQuery<ChatroomDetails[]>({
    queryKey: [`/api/chatrooms/${chatroomId}`],
    enabled: !!chatroomId
  });
  const chatroom = chatroomArray?.[0];

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
