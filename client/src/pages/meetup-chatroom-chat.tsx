import { useRoute, useLocation } from "wouter";
import { useEffect } from "react";
import WhatsAppChat from "@/components/WhatsAppChat";
import { useAuth } from "@/App";
import { ChatPageSkeleton } from "@/components/ui/chat-page-skeleton";
import { isNativeIOSApp } from "@/lib/nativeApp";

export default function MeetupChatroomChat() {
  const [, params] = useRoute<{ chatroomId: string }>("/meetup-chatroom-chat/:chatroomId");
  const [, navigate] = useLocation();
  const { user, authLoading } = useAuth();

  const chatroomId = params?.chatroomId ? parseInt(params.chatroomId) : null;

  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const title = searchParams.get("title") || "Meetup Chat";
  const subtitle = searchParams.get("subtitle") || "Group chat";

  useEffect(() => {
    if (window.innerWidth < 768) {
      document.body.classList.add("is-chat-page");
    }
    return () => document.body.classList.remove("is-chat-page");
  }, []);

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
        className="flex overflow-hidden max-w-[850px] mx-auto w-full"
        style={{ height: "calc(100vh - 56px - 80px)" }}
      >
        <WhatsAppChat
          chatId={chatroomId}
          chatType="meetup"
          title={title}
          subtitle={subtitle}
          currentUserId={user.id}
          onBack={() => navigate("/messages")}
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
      <div className="flex overflow-hidden h-full max-w-[850px] mx-auto w-full">
        <WhatsAppChat
          chatId={chatroomId}
          chatType="meetup"
          title={title}
          subtitle={subtitle}
          currentUserId={user.id}
          onBack={() => navigate("/messages")}
        />
      </div>
    </div>
  );
}
