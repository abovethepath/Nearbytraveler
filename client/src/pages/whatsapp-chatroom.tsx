import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import WhatsAppChat from "@/components/WhatsAppChat";
import { authStorage } from "@/lib/auth";

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
  
  // CRITICAL FIX: Get currentUserId from authStorage
  const currentUser = authStorage.getUser();
  const currentUserId = currentUser?.id;

  const { data: chatroom } = useQuery<ChatroomDetails>({
    queryKey: [`/api/chatrooms/${chatroomId}`],
    enabled: Boolean(params.id) && !!currentUserId
  });

  if (!chatroom || !currentUserId) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <WhatsAppChat
      chatId={chatroomId}
      chatType="chatroom"
      title={chatroom.name}
      subtitle={`${chatroom.memberCount} members`}
      currentUserId={currentUserId}
    />
  );
}
