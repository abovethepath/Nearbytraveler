import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, getApiBaseUrl, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Check, X, MessageCircle } from "lucide-react";
import { AuthContext } from "@/App";

interface ChatInviteNotification {
  id: number;
  fromUserId: number;
  type: string;
  title: string;
  message: string;
  data: string;
  isRead: boolean;
  createdAt: string;
}

interface ParsedInviteData {
  chatroomId: number;
  chatroomType: string;
  chatroomName?: string;
  inviterName?: string;
  inviterUsername?: string;
}

export function ChatInviteAlertBar() {
  const [, setLocation] = useLocation();
  const authContext = React.useContext(AuthContext);
  const userId = authContext?.user?.id;

  const { data: notifications } = useQuery<ChatInviteNotification[]>({
    queryKey: ["/api/notifications", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await apiRequest("GET", `/api/notifications/${userId}`);
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const pendingInvites = (notifications || []).filter(
    (n) => !n.isRead && n.type === "chatroom_invite"
  );

  const acceptMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const base = getApiBaseUrl();
      const res = await apiRequest("POST", `${base}/api/chatroom-invites/${notificationId}/accept`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetup-chatrooms/mine"] });
      if (data.chatroomId) {
        const type = data.chatroomType || "meetup";
        if (type === "meetup") {
          setLocation(`/meetup-chat/${data.chatroomId}`);
        } else {
          setLocation(`/messages`);
        }
      }
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const base = getApiBaseUrl();
      await apiRequest("POST", `${base}/api/chatroom-invites/${notificationId}/decline`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", userId] });
    },
  });

  if (pendingInvites.length === 0) return null;

  return (
    <div className="w-full">
      {pendingInvites.map((invite) => {
        let parsed: ParsedInviteData = { chatroomId: 0, chatroomType: "meetup" };
        try { parsed = JSON.parse(invite.data || "{}"); } catch {}

        const inviterName = parsed.inviterUsername || parsed.inviterName || "Someone";
        const chatName = parsed.chatroomName || "a chat";
        const isAccepting = acceptMutation.isPending && acceptMutation.variables === invite.id;
        const isDeclining = declineMutation.isPending && declineMutation.variables === invite.id;

        return (
          <div
            key={invite.id}
            className="w-full bg-blue-600 dark:bg-blue-700 border-b border-blue-700 dark:border-blue-800"
          >
            <div className="max-w-7xl mx-auto px-4 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <MessageCircle className="w-4 h-4 text-white shrink-0" />
                  <p className="text-sm text-white font-medium truncate">
                    <span className="font-bold">@{inviterName}</span> invited you to join <span className="font-bold">'{chatName}'</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => acceptMutation.mutate(invite.id)}
                    disabled={isAccepting || isDeclining}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-white text-blue-700 text-xs font-bold hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3 h-3" />
                    {isAccepting ? "Joining..." : "Accept"}
                  </button>
                  <button
                    onClick={() => declineMutation.mutate(invite.id)}
                    disabled={isAccepting || isDeclining}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-800 text-white text-xs font-bold hover:bg-blue-900 transition-colors disabled:opacity-50"
                  >
                    <X className="w-3 h-3" />
                    Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
