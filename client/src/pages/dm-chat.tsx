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
  const params = useParams();
  const otherUserId = parseInt(params.userId || '0');
  const currentUser = authStorage.getUser();

  const { data: otherUser } = useQuery<UserDetails>({
    queryKey: [`/api/users/${otherUserId}`],
    enabled: !!otherUserId
  });

  if (!otherUser || !currentUser) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <WhatsAppChat
      chatId={otherUserId}
      chatType="dm"
      title={otherUser.name || otherUser.username}
      subtitle={otherUser.hometown || "Direct Message"}
      currentUserId={currentUser.id}
    />
  );
}
