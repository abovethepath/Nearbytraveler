import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getApiBaseUrl, apiRequest } from "@/lib/queryClient";

interface CityPulseData {
  city: string;
  newTravelers: number;
  openToMeet: number;
  eventsThisWeek: number;
  eventsCreatedToday: number;
  connectionsToday: number;
  newMembersToday: number;
}

interface CityPulseProps {
  city: string | undefined;
}

export function CityPulse({ city }: CityPulseProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const queryCity = city || "Los Angeles";

  const currentUserId = (() => {
    try {
      const stored =
        localStorage.getItem("user") ||
        localStorage.getItem("travelconnect_user") ||
        localStorage.getItem("current_user");
      const u = stored ? JSON.parse(stored) : null;
      const id = Number(u?.id) || 0;
      return id || null;
    } catch {
      return null;
    }
  })();

  const { data } = useQuery<CityPulseData>({
    queryKey: ["/api/city-pulse", queryCity],
    queryFn: async () => {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/city-pulse?city=${encodeURIComponent(queryCity)}`);
      if (!res.ok) throw new Error("Failed to fetch city pulse");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });

  const { data: connectionRequests = [] } = useQuery<any[]>({
    queryKey: currentUserId ? [`/api/connections/${currentUserId}/requests`] : [],
    enabled: !!currentUserId,
    staleTime: 30_000,
  });
  const pendingRequestsCount = Array.isArray(connectionRequests) ? connectionRequests.length : 0;

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: currentUserId ? [`/api/notifications/${currentUserId}`] : [],
    enabled: !!currentUserId,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const { data: unreadMsgData } = useQuery<{ unreadCount: number }>({
    queryKey: currentUserId ? [`/api/messages/${currentUserId}/unread-count`] : [],
    enabled: !!currentUserId,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const unreadNotifs = Array.isArray(notifications)
    ? notifications.filter((n: any) => !n.isRead)
    : [];

  const vouchNotifIds = unreadNotifs
    .filter((n: any) => n.type === "vouch_received")
    .map((n: any) => n.id);
  const referenceNotifIds = unreadNotifs
    .filter((n: any) => typeof n.type === "string" && n.type.startsWith("reference_written:"))
    .map((n: any) => n.id);
  const connectionAcceptedNotifIds = unreadNotifs
    .filter((n: any) => n.type === "connection_accepted")
    .map((n: any) => n.id);
  const meetAcceptedNotifIds = unreadNotifs
    .filter((n: any) => n.type === "meet_accepted")
    .map((n: any) => n.id);
  const groupChatAddedNotifIds = unreadNotifs
    .filter((n: any) => n.type === "chatroom_added")
    .map((n: any) => n.id);

  const markNotificationsRead = async (ids: number[]) => {
    if (!ids.length) return;
    await Promise.allSettled(
      ids.map((id) => apiRequest("PUT", `/api/notifications/${id}/read`))
    );
    if (currentUserId) {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${currentUserId}`] });
    }
  };

  if (!data) return null;

  const pills: {
    emoji: string;
    count: number;
    label: string;
    notifIds?: number[];
    onClick: () => void;
  }[] = [
    {
      emoji: "🧡",
      count: pendingRequestsCount,
      label: `new connection request${pendingRequestsCount === 1 ? "" : "s"} →`,
      onClick: () => setLocation("/activity"),
    },
    {
      emoji: "🏅",
      count: vouchNotifIds.length,
      label: `vouch${vouchNotifIds.length === 1 ? "" : "es"} received →`,
      notifIds: vouchNotifIds,
      onClick: () => setLocation("/profile?tab=vouches"),
    },
    {
      emoji: "✍️",
      count: referenceNotifIds.length,
      label: `reference${referenceNotifIds.length === 1 ? "" : "s"} received →`,
      notifIds: referenceNotifIds,
      onClick: () => setLocation("/profile?tab=references"),
    },
    {
      emoji: "🤝",
      count: connectionAcceptedNotifIds.length,
      label: `connection${connectionAcceptedNotifIds.length === 1 ? "" : "s"} accepted →`,
      notifIds: connectionAcceptedNotifIds,
      onClick: () => setLocation("/activity"),
    },
    {
      emoji: "🎉",
      count: meetAcceptedNotifIds.length,
      label: `meetup request${meetAcceptedNotifIds.length === 1 ? "" : "s"} accepted →`,
      notifIds: meetAcceptedNotifIds,
      onClick: () => setLocation("/messages"),
    },
    {
      emoji: "💬",
      count: groupChatAddedNotifIds.length,
      label: `added to group chat${groupChatAddedNotifIds.length === 1 ? "" : "s"} →`,
      notifIds: groupChatAddedNotifIds,
      onClick: () => setLocation("/messages"),
    },
    {
      emoji: "💌",
      count: Number(unreadMsgData?.unreadCount) || 0,
      label: `unread message${(Number(unreadMsgData?.unreadCount) || 0) === 1 ? "" : "s"} →`,
      onClick: () => setLocation("/messages"),
    },
    {
      emoji: "👋",
      count: data.newTravelers,
      label: "new travelers today",
      onClick: () => setLocation("/discover"),
    },
    {
      emoji: "🟢",
      count: data.openToMeet,
      label: "open to meet now",
      onClick: () => {
        const desktopSection = document.getElementById("available-now-section-desktop");
        const mobileSection = document.getElementById("available-now-section");
        const target =
          desktopSection && getComputedStyle(desktopSection).display !== "none"
            ? desktopSection
            : mobileSection;
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          setLocation("/quick-meetups");
        }
      },
    },
    {
      emoji: "📅",
      count: data.eventsThisWeek,
      label: "events this week",
      onClick: () => setLocation("/events"),
    },
    {
      emoji: "✨",
      count: data.eventsCreatedToday,
      label: "events created today",
      onClick: () => setLocation("/events"),
    },
    {
      emoji: "🤝",
      count: data.connectionsToday,
      label: "new connections today",
      onClick: () => setLocation("/messages"),
    },
    {
      emoji: "👥",
      count: data.newMembersToday,
      label: `joined today in ${data.city}`,
      onClick: () => setLocation("/discover"),
    },
  ];

  const visiblePills = pills.filter((p) => p.count > 0);
  if (visiblePills.length === 0) return null;

  return (
    <div className="w-full bg-orange-50/80 dark:bg-gray-950 border-b border-orange-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div
          className="flex gap-3 px-4 py-2.5 overflow-x-auto"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {visiblePills.map((pill, i) => (
            <button
              key={`${pill.label}-${i}`}
              onClick={() => {
                if (pill.notifIds?.length) {
                  markNotificationsRead(pill.notifIds);
                }
                pill.onClick();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 whitespace-nowrap shrink-0 transition-colors hover:border-orange-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500"
            >
              <span>{pill.emoji}</span>
              <span className="font-bold text-[13px] text-orange-600 dark:text-white">
                {pill.count}
              </span>
              <span className="text-[12px] font-medium text-orange-800 dark:text-white">
                {pill.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
