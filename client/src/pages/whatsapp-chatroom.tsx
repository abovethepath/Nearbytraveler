import { useParams, useLocation } from "wouter";
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
  const [, navigate] = useLocation();
  
  // CRITICAL FIX: Extract ID from window.location since useParams doesn't work with startsWith routes
  const pathParts = window.location.pathname.split('/');
  const chatroomId = parseInt(pathParts[2] || '0');
  
  // CRITICAL FIX: Get currentUserId from authStorage
  const currentUser = authStorage.getUser();
  const currentUserId = currentUser?.id;

  // VALIDATION: Don't fetch if chatroomId is invalid (0 or NaN)
  const isValidChatroomId = chatroomId > 0 && !isNaN(chatroomId);

  const { data: chatroom, isLoading } = useQuery<ChatroomDetails>({
    queryKey: [`/api/chatrooms/${chatroomId}`],
    enabled: isValidChatroomId && !!currentUserId
  });

  // VALIDATION: If chatroomId is invalid, redirect to chatrooms list
  if (!isValidChatroomId) {
    window.location.href = '/chatrooms';
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Redirecting...</div>;
  }

  if (isLoading || !chatroom || !currentUserId) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <WhatsAppChat
      chatId={chatroomId}
      chatType="chatroom"
      title={chatroom.name}
      subtitle={`${chatroom.memberCount} members`}
      currentUserId={currentUserId}
      onBack={() => navigate('/chatrooms')}
    />
  );
}
