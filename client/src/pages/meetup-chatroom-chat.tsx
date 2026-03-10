import { useRoute, useLocation } from "wouter";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import WhatsAppChat from "@/components/WhatsAppChat";
import { useAuth } from "@/App";
import { ChatPageSkeleton } from "@/components/ui/chat-page-skeleton";
import { getApiBaseUrl } from "@/lib/queryClient";
import { ArrowLeft, Lock } from "lucide-react";

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

  const title = chatroomInfo?.chatroomName || titleFromUrl;
  const isExpired = chatroomInfo?.isExpired ?? false;

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

  if (isExpired) {
    const ClosedState = (
      <div className="flex flex-col h-full bg-gray-900">
        <div
          className="flex items-center gap-3 px-4 shrink-0 bg-gray-900 border-b border-gray-700"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)", minHeight: 56 }}
        >
          <button
            onClick={() => navigate("/messages")}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5 text-gray-200" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{title}</p>
            <p className="text-xs text-gray-400">Chat ended</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
            <Lock className="w-7 h-7 text-gray-500" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-base mb-1">This hangout has ended</p>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              The chatroom is now closed. Messages will be automatically deleted 24 hours after the hangout ends.
            </p>
          </div>
          <button
            onClick={() => navigate("/messages")}
            className="mt-2 px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );

    if (isDesktop) {
      return (
        <div
          className="flex overflow-hidden max-w-[850px] mx-auto w-full"
          style={{ height: "calc(100vh - 56px - 80px)" }}
        >
          {ClosedState}
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
          zIndex: 50,
        }}
      >
        {ClosedState}
      </div>
    );
  }

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
