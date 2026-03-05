import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getApiBaseUrl } from "@/lib/queryClient";
import { useAuth } from "@/App";

type ActivityFilter = "all" | "events" | "connections" | "messages";

type ActivityBase = {
  id: string | number;
  category: "all" | "events" | "connections" | "messages";
  title: string;
  preview?: string | null;
  timestamp: string | Date;
  unread: boolean;
};

type ActivityEventChatItem = ActivityBase & {
  kind: "event_chat";
  type: "event_chat";
  moreCount?: number;
  chatroomId: number;
  eventId: number;
  eventTitle: string;
  imageUrl?: string | null;
};

type ActivityNotificationItem = ActivityBase & {
  kind: "notification";
  type: string;
  actor?: { id: number; username?: string | null; name?: string | null; profileImage?: string | null } | null;
  data?: any;
  connection?: { id: number; status: string; requesterId: number; receiverId: number } | null;
};

type ActivityFeedResponse = {
  items: Array<ActivityEventChatItem | ActivityNotificationItem>;
  unreadCount: number;
};

function safeDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatTimeAgo(value: unknown): string {
  const d = safeDate(value);
  if (!d) return "";
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return "now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return d.toLocaleDateString();
}

function InitialAvatar({
  username,
  profileImage,
  fallbackLabel,
}: {
  username?: string | null;
  profileImage?: string | null;
  fallbackLabel?: string;
}) {
  if (profileImage) {
    return <img src={profileImage} alt="" className="h-10 w-10 rounded-full object-cover" />;
  }
  const initial = (username || fallbackLabel || "?")[0]?.toUpperCase?.() || "?";
  return (
    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-700 dark:text-gray-200">
      {initial}
    </div>
  );
}

export default function ActivityFeed() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const auth = useAuth();
  const currentUser = auth.user;

  const [filter, setFilter] = useState<ActivityFilter>("all");

  const { data, isLoading, isError, refetch, isFetching } = useQuery<ActivityFeedResponse>({
    queryKey: ["/api/activity-feed", currentUser?.id],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/activity-feed/${currentUser?.id}`, {
        credentials: "include",
        headers: currentUser?.id ? { "x-user-id": String(currentUser.id) } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch activity feed");
      return res.json();
    },
    enabled: !!currentUser?.id,
    staleTime: 15000,
    refetchInterval: 30000,
  });

  const markNotificationRead = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await fetch(`${getApiBaseUrl()}/api/notifications/${notificationId}/read`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to mark notification read");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/activity-feed", currentUser?.id] });
      qc.invalidateQueries({ queryKey: ["/api/activity-feed", currentUser?.id, "unread-count"] });
    },
  });

  const markEventChatRead = useMutation({
    mutationFn: async ({ chatroomId }: { chatroomId: number }) => {
      const res = await fetch(`${getApiBaseUrl()}/api/event-chatrooms/${chatroomId}/mark-read`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id }),
      });
      if (!res.ok) throw new Error("Failed to mark chat read");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/activity-feed", currentUser?.id] });
      qc.invalidateQueries({ queryKey: ["/api/activity-feed", currentUser?.id, "unread-count"] });
    },
  });

  const respondToConnection = useMutation({
    mutationFn: async ({ connectionId, status }: { connectionId: number; status: "accepted" | "rejected" }) => {
      const res = await fetch(`${getApiBaseUrl()}/api/connections/${connectionId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(currentUser?.id ? { "x-user-id": String(currentUser.id) } : {}) },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update connection");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/activity-feed", currentUser?.id] });
      qc.invalidateQueries({ queryKey: ["/api/activity-feed", currentUser?.id, "unread-count"] });
      qc.invalidateQueries({ queryKey: ["/api/notifications", currentUser?.id] });
    },
  });

  const items = (data?.items || []) as Array<ActivityEventChatItem | ActivityNotificationItem>;

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.category === filter);
  }, [items, filter]);

  const emptyLabel =
    filter === "messages"
      ? "No message activity yet."
      : filter === "events"
        ? "No event activity yet."
        : filter === "connections"
          ? "No connection activity yet."
          : "No activity yet.";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { key: "all", label: "All" },
            { key: "events", label: "Events" },
            { key: "connections", label: "Connections" },
            { key: "messages", label: "Messages" },
          ] as const
        ).map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setFilter(p.key)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold border transition-colors ${
              filter === p.key
                ? "bg-[#2563EB] border-[#2563EB] text-white"
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {p.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching || isLoading}
            className="h-8"
          >
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-[78px] w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <Card className="p-4 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-bold text-red-700 dark:text-red-200">Couldn’t load activity</div>
              <div className="text-sm text-red-600 dark:text-red-300">Please try again.</div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="text-gray-700 dark:text-gray-200 font-semibold">{emptyLabel}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">When you have activity, it’ll show up here.</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const timestamp = formatTimeAgo(item.timestamp);
            const unread = !!item.unread;

            const open = async () => {
              if (item.kind === "event_chat") {
                try {
                  await markEventChatRead.mutateAsync({ chatroomId: item.chatroomId });
                } catch {
                  // non-blocking
                }
                setLocation(`/event-chat/${item.eventId}`);
                return;
              }

              const n = item as ActivityNotificationItem;
              const type = String(n.type || "");

              if (typeof n.id === "number") {
                markNotificationRead.mutate(n.id);
              }

              if (type.startsWith("post_event_connect:")) {
                const eventId = n.data?.eventId;
                if (eventId) setLocation(`/events/${eventId}`);
                return;
              }
              if (type.startsWith("reference_written:")) {
                const profilePath = currentUser?.id ? `/profile/${currentUser.id}` : "/profile";
                setLocation(`${profilePath}?tab=references`);
                return;
              }
              if (type.startsWith("suggested_connections:")) {
                setLocation("/connect");
                return;
              }
            };

            const left = (() => {
              if (item.kind === "event_chat") {
                if (item.imageUrl) {
                  return <img src={item.imageUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />;
                }
                return (
                  <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-[#2563EB]" />
                  </div>
                );
              }

              const n = item as ActivityNotificationItem;
              const type = String(n.type || "");
              if (type.startsWith("post_event_connect:")) {
                const img = n.data?.imageUrl as string | null | undefined;
                if (img) return <img src={img} alt="" className="h-10 w-10 rounded-xl object-cover" />;
                return (
                  <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                    <Users className="h-5 w-5 text-[#E85D2F]" />
                  </div>
                );
              }

              return (
                <InitialAvatar
                  username={n.actor?.username || n.actor?.name || null}
                  profileImage={n.actor?.profileImage || null}
                  fallbackLabel="NT"
                />
              );
            })();

            const rightSide = (
              <div className="flex items-center gap-2 shrink-0">
                {unread && <span className="h-2 w-2 rounded-full bg-[#2563EB]" aria-label="Unread" />}
                <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{timestamp}</span>
              </div>
            );

            const connectionActions = (() => {
              if (item.kind !== "notification") return null;
              const n = item as ActivityNotificationItem;
              if (String(n.type) !== "connection_request") return null;
              const conn = n.connection;
              if (!conn?.id) return null;
              if (conn.status && conn.status !== "pending") {
                return (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {conn.status === "accepted" ? "Accepted" : conn.status === "rejected" ? "Declined" : conn.status}
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      await respondToConnection.mutateAsync({ connectionId: conn.id, status: "accepted" });
                      if (typeof n.id === "number") {
                        markNotificationRead.mutate(n.id);
                      }
                    }}
                    disabled={respondToConnection.isPending}
                  >
                    Accept
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 border-red-500/40 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      await respondToConnection.mutateAsync({ connectionId: conn.id, status: "rejected" });
                      if (typeof n.id === "number") {
                        markNotificationRead.mutate(n.id);
                      }
                    }}
                    disabled={respondToConnection.isPending}
                  >
                    Decline
                  </Button>
                </div>
              );
            })();

            return (
              <button
                key={`${item.kind}_${String(item.id)}`}
                type="button"
                onClick={() => open()}
                className="w-full text-left"
              >
                <Card className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0">{left}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 dark:text-gray-100 leading-snug truncate">
                            {item.title}
                          </div>
                          {item.preview ? (
                            <div className="mt-0.5 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                              {item.preview}
                              {item.kind === "event_chat" && (item.moreCount || 0) > 0 ? (
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                  +{item.moreCount} more
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        {rightSide}
                      </div>
                      {connectionActions}
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

