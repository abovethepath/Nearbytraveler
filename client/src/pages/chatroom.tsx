import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import WhatsAppChat from "@/components/WhatsAppChat";
import { useAuth } from "@/App";
import { ChatPageSkeleton } from "@/components/ui/chat-page-skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { formatChatroomName } from "@/lib/formatChatroomName";

interface ChatroomDetails {
  id: number;
  name: string;
  description: string;
  city: string;
  memberCount: number;
}

export default function ChatroomPage() {
  const params = useParams<{ id: string }>();
  const chatroomId = parseInt(params.id || '0');

  const { user, authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: chatroomData, isLoading, isError, error } = useQuery<ChatroomDetails | ChatroomDetails[]>({
    queryKey: [`/api/chatrooms/${chatroomId}`],
    enabled: !!chatroomId,
    retry: 2,
    retryDelay: 1000,
  });
  const chatroom = Array.isArray(chatroomData) ? chatroomData[0] : chatroomData;

  if (!chatroomId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">Invalid chatroom</p>
        <Button onClick={() => setLocation("/chatrooms")} variant="outline" data-testid="button-back-to-chatrooms-invalid">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chatrooms
        </Button>
      </div>
    );
  }

  if (authLoading) {
    return <ChatPageSkeleton variant="dark" />;
  }

  if (!user?.id) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">Please log in to view this chat</p>
        <Button onClick={() => setLocation("/auth")} variant="outline" data-testid="button-login-to-chatroom">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Sign in
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <ChatPageSkeleton variant="dark" />;
  }

  if (isError || !chatroom) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4 px-6 text-center">
        <p className="text-lg font-semibold">Couldn't load this chatroom</p>
        <p className="text-sm text-gray-300">
          {error instanceof Error ? error.message : "Please try again."}
        </p>
        <Button onClick={() => setLocation("/chatrooms")} variant="outline" data-testid="button-back-to-chatrooms-error">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chatrooms
        </Button>
      </div>
    );
  }

  return (
    <div className="flex overflow-hidden h-full max-w-[850px] mx-auto w-full">
      <WhatsAppChat
        chatId={chatroomId}
        chatType="chatroom"
        title={formatChatroomName(chatroom.name)}
        subtitle={`${chatroom.memberCount} members`}
        currentUserId={user?.id}
      />
    </div>
  );
}
