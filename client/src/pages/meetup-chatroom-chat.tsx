import { useRoute, useLocation } from "wouter";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import WhatsAppChat from "@/components/WhatsAppChat";
import { useAuth } from "@/App";
import { ChatPageSkeleton } from "@/components/ui/chat-page-skeleton";
import { getApiBaseUrl } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MeetupChatroomChat() {
  const [, params] = useRoute<{ chatroomId: string }>("/meetup-chatroom-chat/:chatroomId");
  const [, navigate] = useLocation();
  const { user, authLoading } = useAuth();

  const chatroomId = params?.chatroomId ? parseInt(params.chatroomId) : null;

  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const titleFromUrl = searchParams.get("title") || "Meetup Chat";
  const subtitle = searchParams.get("subtitle") || "Group chat";

  const { data: chatroomInfo } = useQuery<{
    id: number;
    chatroomName: string;
    isActive: boolean;
    expiresAt: string | null;
    isExpired: boolean;
  }>({
    queryKey: [`/api/meetup-chatrooms/${chatroomId}/info`],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (user?.id) headers["x-user-id"] = String(user.id);
      const res = await fetch(`${getApiBaseUrl()}/api/meetup-chatrooms/${chatroomId}/info`, { headers });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!chatroomId && !!user?.id,
    retry: false,
  });

  const { toast } = useToast();
  const title = chatroomInfo?.chatroomName || titleFromUrl;
  const isExpired = chatroomInfo?.isExpired ?? false;

  useEffect(() => {
    if (window.innerWidth < 768) {
      document.body.classList.add("is-chat-page");
    }
    return () => document.body.classList.remove("is-chat-page");
  }, []);

  useEffect(() => {
    if (isExpired) {
      toast({
        title: "Meetup ended",
        description: "This meetup chat has expired and is no longer available.",
      });
      navigate("/messages");
    }
  }, [isExpired, navigate, toast]);

  if (!chatroomId) {
    navigate("/messages");
    return null;
  }

  if (authLoading || !user?.id) {
    return <ChatPageSkeleton variant="dark" />;
  }

  const isDesktop = window.innerWidth >= 768;

  if (isDesktop) {
    return (
      <div
        className="flex overflow-hidden max-w-[1100px] mx-auto w-full"
        style={{ height: "calc(100dvh - 56px - 60px)" }}
      >
        <WhatsAppChat
          chatId={chatroomId}
          chatType="meetup"
          title={title}
          subtitle={subtitle}
          currentUserId={user.id}
          onBack={() => navigate("/messages")}
          readOnly={isExpired}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        overflow: "hidden",
        zIndex: 50,
      }}
    >
      <div className="flex overflow-hidden h-full max-w-[1100px] mx-auto w-full">
        <WhatsAppChat
          chatId={chatroomId}
          chatType="meetup"
          title={title}
          subtitle={subtitle}
          currentUserId={user.id}
          onBack={() => navigate("/messages")}
          readOnly={isExpired}
        />
      </div>
    </div>
  );
}
