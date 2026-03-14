import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Users, MapPin, X, ExternalLink, UserCheck, Loader2, Calendar, Activity as ActivityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getApiBaseUrl, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";

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
  meetRequest?: { id: number; status: string; fromUserId: number } | null;
};

type ActivityLogItem = ActivityBase & {
  kind: "activity_log";
  type: string;
  actor?: { id: number; username?: string | null; name?: string | null; profileImage?: string | null } | null;
  linkUrl?: string | null;
  relatedId?: number | null;
  relatedType?: string | null;
  relatedTitle?: string | null;
};

type AnyActivityItem = ActivityEventChatItem | ActivityNotificationItem | ActivityLogItem;

type ActivityFeedResponse = {
  items: AnyActivityItem[];
  unreadCount: number;
};

type RequesterProfile = {
  id: number;
  username: string | null;
  name: string | null;
  fullName: string | null;
  profileImage: string | null;
  profilePhoto: string | null;
  bio: string | null;
  location: string | null;
  interests: string[] | null;
  travelStyle: string | null;
  connectionCount?: number;
  citiesVisited?: number;
  mutualConnections?: Array<{ id: number; username: string | null; profileImage: string | null }>;
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
  size = "sm",
}: {
  username?: string | null;
  profileImage?: string | null;
  fallbackLabel?: string;
  size?: "sm" | "lg";
}) {
  const sizeClass = size === "lg" ? "h-20 w-20 text-2xl" : "h-10 w-10 text-base";
  if (profileImage) {
    return <img src={profileImage} alt="" className={`${sizeClass} rounded-full object-cover`} />;
  }
  const initial = (username || fallbackLabel || "?")[0]?.toUpperCase?.() || "?";
  return (
    <div className={`${sizeClass} rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-700 dark:text-gray-200`}>
      {initial}
    </div>
  );
}

function MeetRequestModal({
  item,
  currentUserId,
  onClose,
  onActionComplete,
}: {
  item: ActivityNotificationItem;
  currentUserId: number;
  onClose: () => void;
  onActionComplete: () => void;
}) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const actorId = item.actor?.id || item.data?.fromUserId;
  const requestId = item.meetRequest?.id || item.data?.requestId;
  const hasMeetRequestData = !!item.meetRequest;
  const requestStatus = hasMeetRequestData ? (item.meetRequest!.status || "pending") : "expired";

  const { data: profile, isLoading: profileLoading } = useQuery<RequesterProfile>({
    queryKey: ["/api/users", actorId, "meet-profile"],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/users/${actorId}`, {
        credentials: "include",
        headers: { "x-user-id": String(currentUserId) },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    enabled: !!actorId,
    staleTime: 60000,
  });

  const { data: mutualData } = useQuery<Array<{ id: number; username: string | null; profileImage: string | null }>>({
    queryKey: ["/api/mutual-connections", currentUserId, actorId],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/mutual-connections/${currentUserId}/${actorId}`, {
        credentials: "include",
        headers: { "x-user-id": String(currentUserId) },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!actorId && !!currentUserId,
    staleTime: 60000,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ status }: { status: "accepted" | "declined" }) => {
      console.log(`[ACTIVITY MEET] Attempting to ${status} request ${requestId} for user ${currentUserId}`);
      const res = await fetch(`${getApiBaseUrl()}/api/available-now/requests/${requestId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-user-id": String(currentUserId) },
        body: JSON.stringify({ status }),
      });
      console.log(`[ACTIVITY MEET] Response status: ${res.status}`);
      if (!res.ok) {
        const errBody = await res.text();
        console.error(`[ACTIVITY MEET] Error body: ${errBody}`);
        throw new Error(errBody || "Failed to update meet request");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      console.log(`[ACTIVITY MEET] Success:`, _data);
      onActionComplete();
      if (variables.status === "accepted") {
        toast({ title: "It's a meet!", description: `Opening chat with @${displayName}...` });
        onClose();
        if (_data?.groupChatroomId) {
          const title = encodeURIComponent(_data.chatroomName || 'Meetup Chat');
          const subtitle = encodeURIComponent(_data.chatroomCity || 'Group chat');
          setLocation(`/meetup-chatroom-chat/${_data.groupChatroomId}?title=${title}&subtitle=${subtitle}`);
        } else {
          toast({ title: "It's a meet!", description: "Check your messages for the meetup chat." });
        }
      } else {
        toast({ title: "Meet request declined", description: "The request has been removed from your feed." });
        onClose();
      }
    },
    onError: (error: any) => {
      console.error(`[ACTIVITY MEET] Error:`, error);
      toast({ title: "Something went wrong", description: error?.message || "Please try again.", variant: "destructive" });
    },
  });

  const photo = profile?.profilePhoto || profile?.profileImage || item.actor?.profileImage;
  const displayName = profile?.fullName || profile?.name || profile?.username || item.actor?.username || item.actor?.name || "Someone";
  const usernameStr = profile?.username || item.actor?.username;
  const location = profile?.location;
  const bio = profile?.bio;
  const interests = profile?.interests || [];
  const mutualConns = mutualData || [];
  const isPending = requestStatus === "pending";

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/95" />
      <div
        className="relative w-full md:max-w-lg md:rounded-2xl rounded-t-2xl bg-white dark:bg-gray-900 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 pt-4 pb-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Meet Request</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          {profileLoading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="text-sm text-gray-500">Loading profile...</span>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center text-center gap-3 mb-5">
                <InitialAvatar username={usernameStr} profileImage={photo} fallbackLabel="?" size="lg" />
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{displayName}</div>
                  {usernameStr && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">@{usernameStr}</div>
                  )}
                </div>
                {location && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{location}</span>
                  </div>
                )}
              </div>

              {bio && (
                <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {bio}
                </div>
              )}

              {interests.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Interests</div>
                  <div className="flex flex-wrap gap-1.5">
                    {interests.slice(0, 12).map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                        {tag}
                      </span>
                    ))}
                    {interests.length > 12 && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium text-gray-500">+{interests.length - 12} more</span>
                    )}
                  </div>
                </div>
              )}

              {mutualConns.length > 0 && (
                <div className="mb-4 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40">
                  <div className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide mb-2">
                    {mutualConns.length} Mutual Connection{mutualConns.length !== 1 ? "s" : ""}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {mutualConns.slice(0, 5).map((mc) => (
                        <InitialAvatar key={mc.id} username={mc.username} profileImage={mc.profileImage} fallbackLabel="?" size="sm" />
                      ))}
                    </div>
                    {mutualConns.length > 5 && (
                      <span className="text-xs text-orange-600 dark:text-orange-400">+{mutualConns.length - 5}</span>
                    )}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => { onClose(); setLocation(`/profile/${actorId}`); }}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] mb-5 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Full Profile
              </button>

              {isPending && requestId ? (
                <div className="flex gap-3">
                  <Button
                    type="button"
                    className="flex-1 h-12 text-base font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                    onClick={() => respondMutation.mutate({ status: "accepted" })}
                    disabled={respondMutation.isPending}
                  >
                    {respondMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <UserCheck className="h-5 w-5 mr-2" />
                        Accept
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12 text-base font-bold border-red-300 dark:border-red-800 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => respondMutation.mutate({ status: "declined" })}
                    disabled={respondMutation.isPending}
                  >
                    {respondMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Decline"
                    )}
                  </Button>
                </div>
              ) : requestStatus === "accepted" ? (
                <Button
                  type="button"
                  className="w-full h-12 text-base font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                  onClick={async () => {
                    try {
                      const res = await fetch(`${getApiBaseUrl()}/api/meetup-chatrooms/shared/${actorId}`, {
                        credentials: 'include',
                        headers: { 'x-user-id': String(currentUserId) },
                      });
                      const data = await res.json();
                      if (data?.chatroom?.id) {
                        onClose();
                        const title = encodeURIComponent(data.chatroom.chatroomName || 'Meetup Chat');
                        const subtitle = encodeURIComponent(data.chatroom.city || 'Group chat');
                        setLocation(`/meetup-chatroom-chat/${data.chatroom.id}?title=${title}&subtitle=${subtitle}`);
                      } else {
                        toast({ title: "Chat not found", description: "The meetup chat could not be located.", variant: "destructive" });
                      }
                    } catch {
                      toast({ title: "Chat not found", description: "Unable to open chat. Please try again.", variant: "destructive" });
                    }
                  }}
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Go to Chat
                </Button>
              ) : (
                <div className="text-center py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {requestStatus === "declined" ? "Declined" : requestStatus === "expired" ? "Expired" : requestStatus}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ActivityFeed() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const auth = useAuth();
  const currentUser = auth.user;

  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [meetModalItem, setMeetModalItem] = useState<ActivityNotificationItem | null>(null);

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

  const respondToChatroomInvite = useMutation({
    mutationFn: async ({ notificationId, action }: { notificationId: number; action: "accept" | "decline" }) => {
      return await apiRequest("POST", `/api/chatroom-invites/${notificationId}/${action}`);
    },
    onSuccess: async (res, { action }) => {
      qc.invalidateQueries({ queryKey: ["/api/activity-feed", currentUser?.id] });
      qc.invalidateQueries({ queryKey: ["/api/notifications", currentUser?.id] });
      if (action === "accept") {
        const data = await res.json().catch(() => ({}));
        if (data.chatroomId) {
          setLocation(`/meetup-chatroom-chat/${data.chatroomId}?title=${encodeURIComponent(data.chatroomName || 'Chat')}&subtitle=Group+chat`);
        }
        toast({ title: "Invite accepted", description: "You've joined the chat!" });
      } else {
        toast({ title: "Invite declined" });
      }
    },
  });

  const items = (data?.items || []) as AnyActivityItem[];

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

  const handleMeetActionComplete = () => {
    qc.invalidateQueries({ queryKey: ["/api/activity-feed", currentUser?.id] });
    qc.invalidateQueries({ queryKey: ["/api/activity-feed", currentUser?.id, "unread-count"] });
    qc.invalidateQueries({ queryKey: ["/api/notifications", currentUser?.id] });
    qc.invalidateQueries({ queryKey: ["/api/available-now/requests"] });
  };

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
              <div className="font-bold text-red-700 dark:text-red-200">Couldn't load activity</div>
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
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">No activity yet — start exploring to connect with travelers near you!</div>
          <Button
            type="button"
            className="mt-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
            onClick={() => setLocation("/explore")}
          >
            Explore
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const timestamp = formatTimeAgo(item.timestamp);
            const unread = !!item.unread;
            const isMeetRequest = item.kind === "notification" && String((item as ActivityNotificationItem).type) === "available_now_meet_request";

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

              if (item.kind === "activity_log") {
                const logItem = item as ActivityLogItem;
                if (logItem.linkUrl) {
                  setLocation(logItem.linkUrl);
                } else if (logItem.actor?.id) {
                  setLocation(`/profile/${logItem.actor.id}`);
                }
                return;
              }

              const n = item as ActivityNotificationItem;
              const type = String(n.type || "");

              if (typeof n.id === "number") {
                markNotificationRead.mutate(n.id);
              }

              if (type === "available_now_meet_request") {
                setMeetModalItem(n);
                return;
              }

              if (type === "chatroom_invite") {
                return;
              }

              if (type === "new_message") {
                if (n.actor?.id) setLocation(`/messages/${n.actor.id}`);
                else setLocation("/messages");
                return;
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
              if (n.actor?.id) {
                setLocation(`/profile/${n.actor.id}`);
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

              if (item.kind === "activity_log") {
                const logItem = item as ActivityLogItem;
                if (logItem.actor?.profileImage) {
                  return <img src={logItem.actor.profileImage} alt="" className="h-10 w-10 rounded-full object-cover" />;
                }
                const action = logItem.type;
                if (action.includes("event") || action.includes("rsvp")) {
                  return (
                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  );
                }
                if (action.includes("community") || action.includes("chatroom")) {
                  return (
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  );
                }
                if (action.includes("connection") || action.includes("meet")) {
                  return (
                    <InitialAvatar
                      username={logItem.actor?.username || null}
                      profileImage={null}
                      fallbackLabel="NT"
                    />
                  );
                }
                return (
                  <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <ActivityIcon className="h-5 w-5 text-gray-500" />
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

            const meetRequestBadge = (() => {
              if (!isMeetRequest) return null;
              const n = item as ActivityNotificationItem;
              const status = n.meetRequest?.status;
              if (!status || status === "pending") return null;
              return (
                <div className="mt-1.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    status === "accepted"
                      ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}>
                    {status === "accepted" ? "Accepted" : status === "declined" ? "Declined" : status}
                  </span>
                </div>
              );
            })();

            const isChatroomInvite = item.kind === "notification" && String((item as ActivityNotificationItem).type) === "chatroom_invite";

            const chatroomInviteActions = (() => {
              if (!isChatroomInvite) return null;
              const n = item as ActivityNotificationItem;
              if (n.unread === false) return <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Responded</div>;
              return (
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 bg-green-600 hover:bg-green-700 text-white"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (typeof n.id === "number") respondToChatroomInvite.mutate({ notificationId: n.id, action: "accept" });
                    }}
                    disabled={respondToChatroomInvite.isPending}
                  >
                    Accept
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-8"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (typeof n.id === "number") respondToChatroomInvite.mutate({ notificationId: n.id, action: "decline" });
                    }}
                    disabled={respondToChatroomInvite.isPending}
                  >
                    Decline
                  </Button>
                </div>
              );
            })();

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
                className={`w-full text-left cursor-pointer ${isMeetRequest ? "group" : ""}`}
              >
                <Card className={`p-4 bg-white dark:bg-gray-900 border transition-colors ${
                  isMeetRequest || isChatroomInvite
                    ? "border-orange-200 dark:border-orange-900/50 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 hover:border-orange-300 dark:hover:border-orange-800"
                    : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}>
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
                      {meetRequestBadge}
                      {chatroomInviteActions}
                      {connectionActions}
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {meetModalItem && currentUser?.id && (
        <MeetRequestModal
          item={meetModalItem}
          currentUserId={currentUser.id}
          onClose={() => setMeetModalItem(null)}
          onActionComplete={handleMeetActionComplete}
        />
      )}
    </div>
  );
}
