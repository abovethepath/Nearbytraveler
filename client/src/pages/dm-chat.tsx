import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import WhatsAppChat from "@/components/WhatsAppChat";
import { authStorage } from "@/lib/auth";

interface UserDetails {
  id: number;
  username: string;
  name: string;
  profileImage?: string;
  hometown?: string;
}

export default function DMChat() {
  // CRITICAL FIX: Extract ID from window.location since useParams doesn't work with startsWith routes
  const pathParts = window.location.pathname.split('/');
  const otherUserId = parseInt(pathParts[2] || '0');
  const currentUser = authStorage.getUser();

  const { data: otherUser } = useQuery<UserDetails>({
    queryKey: [`/api/users/${otherUserId}`],
    enabled: !!otherUserId
  });

  if (!otherUser || !currentUser) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
  }

  // PRIVACY: Extract first name only from full name
  const getFirstName = (fullName: string | null | undefined): string => {
    if (!fullName || fullName.trim() === '') return '';
    const parts = fullName.trim().split(' ');
    return parts[0] || '';
  };

  const displayName = getFirstName(otherUser.name) || otherUser.username;

  return (
    <WhatsAppChat
      chatId={otherUserId}
      chatType="dm"
      title={displayName}
      subtitle={otherUser.hometown || "Direct Message"}
      currentUserId={currentUser.id}
    />
  );
}
