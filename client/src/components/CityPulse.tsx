import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getApiBaseUrl, apiRequest } from "@/lib/queryClient";
import { PillPopover, PillPopoverType } from "@/components/PillPopover";

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
  isLocal?: boolean;
}

export function CityPulse({ city, isLocal }: CityPulseProps) {
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
    queryKey: currentUserId ? ['/api/messages', currentUserId, 'unread-count'] : [],
    queryFn: async () => {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/messages/${currentUserId}/unread-count`, { credentials: 'include' });
      if (!res.ok) return { unreadCount: 0 };
      return res.json();
    },
    enabled: !!currentUserId,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const unreadNotifs = Array.isArray(notifications)
    ? notifications.filter((n: any) => !n.isRead)
    : [];

  // Notification groups — track both IDs (for marking read) and fromUserId (for popover)
  const vouchNotifs = unreadNotifs.filter((n: any) => n.type === "vouch_received");
  const referenceNotifs = unreadNotifs.filter(
    (n: any) => typeof n.type === "string" && n.type.startsWith("reference_written:")
  );
  const connectionAcceptedNotifs = unreadNotifs.filter(
    (n: any) => n.type === "connection_accepted"
  );
  const meetAcceptedNotifs = unreadNotifs.filter((n: any) => n.type === "meet_accepted");
  const groupChatAddedNotifs = unreadNotifs.filter((n: any) => n.type === "chatroom_added");

  const vouchNotifIds = vouchNotifs.map((n: any) => n.id);
  const referenceNotifIds = referenceNotifs.map((n: any) => n.id);
  const connectionAcceptedNotifIds = connectionAcceptedNotifs.map((n: any) => n.id);
  const meetAcceptedNotifIds = meetAcceptedNotifs.map((n: any) => n.id);
  const groupChatAddedNotifIds = groupChatAddedNotifs.map((n: any) => n.id);

  // fromUserIds for popover display
  const vouchFromUserIds = [...new Set(vouchNotifs.map((n: any) => n.fromUserId).filter(Boolean))];
  const referenceFromUserIds = [...new Set(referenceNotifs.map((n: any) => n.fromUserId).filter(Boolean))];
  const connectionAcceptedFromUserIds = [...new Set(connectionAcceptedNotifs.map((n: any) => n.fromUserId).filter(Boolean))];
  const meetAcceptedFromUserIds = [...new Set(meetAcceptedNotifs.map((n: any) => n.fromUserId).filter(Boolean))];

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

  const arrivingCount = data.newTravelers || 0;

  // Pills definition — popoverType signals which pills get a popover; null = navigate as before
  type PillDef = {
    emoji: string;
    count: number;
    label: string;
    notifIds?: number[];
    highlight?: boolean;
    popoverType?: PillPopoverType;
    popoverUserIds?: number[];
    popoverRequestData?: any[];
    onClick?: () => void;
    onPopoverClose?: () => void;
  };

  const pills: PillDef[] = [
    // ✈️ Arriving today — only shown to locals
    ...(isLocal && arrivingCount > 0
      ? [
          {
            emoji: "✈️",
            count: arrivingCount,
            label: `traveler${arrivingCount === 1 ? "" : "s"} arriving in ${data.city} today →`,
            highlight: true,
            popoverType: "travelers" as PillPopoverType,
          },
        ]
      : []),
    // 🧡 Pending connection requests → popover showing requesters
    {
      emoji: "🧡",
      count: pendingRequestsCount,
      label: `new connection request${pendingRequestsCount === 1 ? "" : "s"} →`,
      popoverType: "connection-requests" as PillPopoverType,
      popoverRequestData: connectionRequests,
    },
    // 🏅 Vouches → popover showing who vouched
    {
      emoji: "🏅",
      count: vouchNotifIds.length,
      label: `vouch${vouchNotifIds.length === 1 ? "" : "es"} received →`,
      notifIds: vouchNotifIds,
      popoverType: "notification-users" as PillPopoverType,
      popoverUserIds: vouchFromUserIds,
      onPopoverClose: () => markNotificationsRead(vouchNotifIds),
    },
    // ✍️ References → popover showing who wrote the reference
    {
      emoji: "✍️",
      count: referenceNotifIds.length,
      label: `reference${referenceNotifIds.length === 1 ? "" : "s"} received →`,
      notifIds: referenceNotifIds,
      popoverType: "notification-users" as PillPopoverType,
      popoverUserIds: referenceFromUserIds,
      onPopoverClose: () => markNotificationsRead(referenceNotifIds),
    },
    // 🤝 Connections accepted → popover showing who accepted
    {
      emoji: "🤝",
      count: connectionAcceptedNotifIds.length,
      label: `connection${connectionAcceptedNotifIds.length === 1 ? "" : "s"} accepted →`,
      notifIds: connectionAcceptedNotifIds,
      popoverType: "notification-users" as PillPopoverType,
      popoverUserIds: connectionAcceptedFromUserIds,
      onPopoverClose: () => markNotificationsRead(connectionAcceptedNotifIds),
    },
    // 🎉 Meetup accepted → popover showing who accepted
    {
      emoji: "🎉",
      count: meetAcceptedNotifIds.length,
      label: `meetup request${meetAcceptedNotifIds.length === 1 ? "" : "s"} accepted →`,
      notifIds: meetAcceptedNotifIds,
      popoverType: "notification-users" as PillPopoverType,
      popoverUserIds: meetAcceptedFromUserIds,
      onPopoverClose: () => markNotificationsRead(meetAcceptedNotifIds),
    },
    // 💬 Added to group chat → navigate (no specific user list to show)
    {
      emoji: "💬",
      count: groupChatAddedNotifIds.length,
      label: `added to group chat${groupChatAddedNotifIds.length === 1 ? "" : "s"} →`,
      notifIds: groupChatAddedNotifIds,
      onClick: () => {
        markNotificationsRead(groupChatAddedNotifIds);
        setLocation("/messages");
      },
    },
    // 💬 Unread messages → navigate and immediately clear count
    {
      emoji: "💬",
      count: Number(unreadMsgData?.unreadCount) || 0,
      label: `unread message${(Number(unreadMsgData?.unreadCount) || 0) === 1 ? "" : "s"} →`,
      onClick: () => {
        setLocation("/messages");
        // Invalidate so the count re-fetches (and clears) once messages page marks them read
        if (currentUserId) {
          queryClient.invalidateQueries({ queryKey: ['/api/messages', currentUserId, 'unread-count'] });
        }
      },
    },
    // 🟢 Open to meet now → popover
    {
      emoji: "🟢",
      count: data.openToMeet,
      label: "open to meet now",
      popoverType: "available-now" as PillPopoverType,
    },
    // 📅 Events this week → navigate
    {
      emoji: "📅",
      count: data.eventsThisWeek,
      label: "events this week",
      onClick: () => setLocation("/events"),
    },
    // ✨ Events created today → navigate
    {
      emoji: "✨",
      count: data.eventsCreatedToday,
      label: "events created today",
      onClick: () => setLocation("/events"),
    },
    // 🤝 New connections today → popover
    {
      emoji: "🤝",
      count: data.connectionsToday,
      label: "new connections today",
      popoverType: "connections-today" as PillPopoverType,
    },
    // 👥 New members today → popover
    {
      emoji: "👥",
      count: data.newMembersToday,
      label: `joined today in ${data.city}`,
      popoverType: "new-members" as PillPopoverType,
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
          {visiblePills.map((pill, i) => {
            const pillEl = (
              <div
                key={`inner-${pill.label}-${i}`}
                className={
                  pill.highlight
                    ? "flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 transition-colors shadow-sm text-white font-semibold cursor-pointer"
                    : "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 whitespace-nowrap shrink-0 transition-colors hover:border-orange-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500 cursor-pointer"
                }
                style={pill.highlight ? { backgroundColor: "#FF6B35" } : undefined}
              >
                <span>{pill.emoji}</span>
                <span
                  className={`font-bold text-[13px] ${pill.highlight ? "text-white" : "text-orange-600 dark:text-white"}`}
                >
                  {pill.count}
                </span>
                <span
                  className={`text-[12px] font-medium ${pill.highlight ? "text-white" : "text-orange-800 dark:text-white"}`}
                >
                  {pill.label}
                </span>
              </div>
            );

            if (pill.popoverType) {
              return (
                <PillPopover
                  key={`${pill.label}-${i}`}
                  type={pill.popoverType}
                  label={`${pill.count} ${pill.label}`}
                  city={queryCity}
                  userIds={pill.popoverUserIds}
                  requestData={pill.popoverRequestData}
                  currentUserId={currentUserId}
                  onClose={pill.onPopoverClose}
                >
                  {pillEl}
                </PillPopover>
              );
            }

            return (
              <button
                key={`${pill.label}-${i}`}
                onClick={() => {
                  if (pill.notifIds?.length) markNotificationsRead(pill.notifIds);
                  pill.onClick?.();
                }}
              >
                {pillEl}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
