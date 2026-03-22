import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/queryClient";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PillPopoverType =
  | "travelers"
  | "available-now"
  | "new-members"
  | "connections-today"
  | "connection-requests"
  | "notification-users"; // vouches, references, connections accepted, meetups accepted

interface PillUser {
  id: number;
  username: string;
  first_name?: string | null;
  firstName?: string | null;
  full_name?: string | null;
  fullName?: string | null;
  profile_image?: string | null;
  profilePhoto?: string | null;
  profileImage?: string | null;
  hometown_city?: string | null;
  hometownCity?: string | null;
  user_type?: string | null;
  // travelers extra
  destination_city?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  // available-now extra
  city?: string | null;
  user?: {
    id: number;
    username: string;
    firstName?: string | null;
    fullName?: string | null;
    profilePhoto?: string | null;
  };
  // connection request extra
  requester?: { id: number; username: string; profileImage?: string | null; firstName?: string | null; fullName?: string | null; hometownCity?: string | null };
  requesterId?: number;
}

interface PillPopoverProps {
  type: PillPopoverType;
  label: string;
  city?: string;
  userIds?: number[];
  requestData?: any[];
  children: React.ReactNode;
  currentUserId?: number | null;
  onNavigateFallback?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDisplayLabel(u: PillUser): string {
  const first = u.first_name || u.firstName || "";
  const full = u.full_name || u.fullName || u.user?.fullName || "";
  const uname = u.username || u.user?.username || "";
  return first || full.split(" ")[0] || uname;
}

function getAvatarSrc(u: PillUser): string {
  return u.profile_image || u.profilePhoto || u.profileImage || u.user?.profilePhoto || "";
}

function getInitials(u: PillUser): string {
  const name = getDisplayLabel(u);
  return name ? name[0].toUpperCase() : "?";
}

function getSubtitle(u: PillUser, type: PillPopoverType): string {
  if (type === "travelers") {
    const city = u.hometown_city || u.hometownCity || "";
    if (u.start_date && u.end_date) {
      const days = Math.ceil(
        (new Date(u.end_date).getTime() - new Date(u.start_date).getTime()) / 86400000
      );
      return `From ${city}${city ? " · " : ""}${days} day${days !== 1 ? "s" : ""}`;
    }
    return city ? `From ${city}` : "";
  }
  if (type === "available-now") {
    return u.city || u.user?.username ? `@${u.user?.username || u.username}` : "";
  }
  const city = u.hometown_city || u.hometownCity || u.city || "";
  return city || "";
}

function daysStaying(u: PillUser): string | null {
  if (!u.start_date || !u.end_date) return null;
  const days = Math.ceil(
    (new Date(u.end_date).getTime() - new Date(u.start_date).getTime()) / 86400000
  );
  return `${days} day${days !== 1 ? "s" : ""}`;
}

// ─── User row ──────────────────────────────────────────────────────────────────

function UserRow({
  u,
  type,
  onClose,
  currentUserId,
}: {
  u: PillUser;
  type: PillPopoverType;
  onClose: () => void;
  currentUserId?: number | null;
}) {
  const [, setLocation] = useLocation();
  const username = u.username || u.user?.username || "";
  const displayId = u.id || u.user?.id;
  const avatar = getAvatarSrc(u);
  const label = getDisplayLabel(u);
  const subtitle = getSubtitle(u, type);

  const goToProfile = () => {
    onClose();
    if (username) setLocation(`/profile/${username}`);
  };

  const goToMessages = () => {
    onClose();
    if (displayId) setLocation(`/messages?userId=${displayId}`);
  };

  // Don't show yourself
  if (displayId === currentUserId) return null;

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <button onClick={goToProfile} className="shrink-0">
        <Avatar className="w-10 h-10">
          {avatar ? <AvatarImage src={avatar} alt={label} /> : null}
          <AvatarFallback className="bg-orange-100 text-orange-700 text-sm font-semibold">
            {getInitials(u)}
          </AvatarFallback>
        </Avatar>
      </button>
      <div className="flex-1 min-w-0">
        <button onClick={goToProfile} className="text-left w-full">
          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{label}</p>
          {username && <p className="text-xs text-gray-500 dark:text-gray-400">@{username}</p>}
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{subtitle}</p>
          )}
          {type === "travelers" && daysStaying(u) && (
            <p className="text-xs text-orange-600 font-medium mt-0.5">Staying {daysStaying(u)}</p>
          )}
        </button>
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs px-2.5"
          onClick={goToProfile}
        >
          Profile
        </Button>
        {(type === "travelers" || type === "available-now" || type === "connection-requests") && (
          <Button
            size="sm"
            className="h-7 text-xs px-2.5 bg-orange-500 hover:bg-orange-600 text-white border-0"
            onClick={goToMessages}
          >
            Say Hi
          </Button>
        )}
        {(type === "connections-today" || type === "notification-users" || type === "new-members") && (
          <Button
            size="sm"
            className="h-7 text-xs px-2.5 bg-orange-500 hover:bg-orange-600 text-white border-0"
            onClick={goToMessages}
          >
            Message
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Inner content (shared between popover and sheet) ─────────────────────────

function PopoverInner({
  type,
  city,
  userIds,
  requestData,
  label,
  onClose,
  currentUserId,
}: {
  type: PillPopoverType;
  city?: string;
  userIds?: number[];
  requestData?: any[];
  label: string;
  onClose: () => void;
  currentUserId?: number | null;
}) {
  const base = getApiBaseUrl();

  const { data: cityUsers = [], isLoading: cityLoading } = useQuery<PillUser[]>({
    queryKey: ["/api/city-pulse/users", city, type],
    queryFn: async () => {
      const res = await fetch(`${base}/api/city-pulse/users?city=${encodeURIComponent(city || "")}&type=${type}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: (type === "travelers" || type === "new-members" || type === "connections-today") && !!city,
    staleTime: 60_000,
  });

  const { data: availableUsers = [], isLoading: availableLoading } = useQuery<PillUser[]>({
    queryKey: ["/api/available-now", city],
    queryFn: async () => {
      const res = await fetch(`${base}/api/available-now?city=${encodeURIComponent(city || "")}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: type === "available-now" && !!city,
    staleTime: 30_000,
  });

  // Use the snapshotted userIds (frozen at open time) so the list never empties while open
  const frozenIdsKey = userIds?.join(",") ?? "";
  const { data: notifUsers = [], isLoading: notifLoading } = useQuery<PillUser[]>({
    queryKey: ["/api/users/by-ids", frozenIdsKey],
    queryFn: async () => {
      if (!userIds?.length) return [];
      const res = await fetch(`${base}/api/users/by-ids?ids=${userIds.join(",")}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: type === "notification-users" && !!userIds?.length,
    staleTime: 5 * 60_000,
  });

  const isLoading = cityLoading || availableLoading || notifLoading;

  let users: PillUser[] = [];
  if (type === "travelers" || type === "new-members" || type === "connections-today") {
    users = cityUsers;
  } else if (type === "available-now") {
    users = availableUsers;
  } else if (type === "notification-users") {
    users = notifUsers;
  } else if (type === "connection-requests" && requestData) {
    users = requestData.map((r: any) => ({
      id: r.requester?.id || r.requesterId || r.id,
      username: r.requester?.username || r.username || "",
      first_name: r.requester?.firstName || r.firstName || r.first_name,
      full_name: r.requester?.fullName || r.fullName || r.full_name,
      profile_image: r.requester?.profileImage || r.profileImage || r.profile_image,
      hometown_city: r.requester?.hometownCity || r.hometownCity || r.hometown_city,
    }));
  }

  return (
    <div className="w-full">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        {label}
      </p>
      {isLoading ? (
        <div className="py-6 text-center text-gray-400 text-sm">Loading…</div>
      ) : users.length === 0 ? (
        <div className="py-6 text-center text-gray-400 text-sm">
          {type === "travelers" ? "No travelers arriving today." :
           type === "available-now" ? "No one available right now. Be the first!" :
           type === "new-members" ? "No new members today." :
           type === "connections-today" ? "No new connections today." :
           type === "connection-requests" ? "No pending requests." :
           "Nothing new right now."}
        </div>
      ) : (
        <ScrollArea className="max-h-[60vh]">
          <div className="pr-2">
            {users.map((u, i) => (
              <UserRow
                key={u.id || i}
                u={u}
                type={type}
                onClose={onClose}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function PillPopover({
  type,
  label,
  city,
  userIds,
  requestData,
  children,
  currentUserId,
  onNavigateFallback,
  onOpen,
  onClose,
}: PillPopoverProps) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Snapshot userIds and requestData at open time so the list stays stable
  // while the popover is visible (even if parent state changes underneath it).
  const [frozenUserIds, setFrozenUserIds] = useState<number[] | undefined>(undefined);
  const [frozenRequestData, setFrozenRequestData] = useState<any[] | undefined>(undefined);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Single handler for all open/close transitions — avoids dual-trigger conflicts
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !open) {
      // Opening: snapshot user data so the list stays stable while visible
      setFrozenUserIds(userIds && userIds.length > 0 ? [...userIds] : undefined);
      setFrozenRequestData(requestData ? [...requestData] : undefined);
      onOpen?.();
    } else if (!newOpen && open) {
      // Closing: mark notifications read AFTER user has seen the popover
      onClose?.();
    }
    setOpen(newOpen);
  };

  const handleClose = () => handleOpenChange(false);

  if (isMobile) {
    return (
      <>
        <button onClick={() => handleOpenChange(true)} className="contents">
          {children}
        </button>
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-5 pt-4 pb-8 max-h-[80vh]"
          >
            <SheetHeader>
              <SheetTitle className="text-left text-base font-semibold text-gray-900 dark:text-white mb-1">
                {label}
              </SheetTitle>
            </SheetHeader>
            <PopoverInner
              type={type}
              city={city}
              userIds={frozenUserIds}
              requestData={frozenRequestData}
              label=""
              onClose={handleClose}
              currentUserId={currentUserId}
            />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="contents">{children}</button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl p-4"
      >
        <PopoverInner
          type={type}
          city={city}
          userIds={frozenUserIds}
          requestData={frozenRequestData}
          label={label}
          onClose={handleClose}
          currentUserId={currentUserId}
        />
      </PopoverContent>
    </Popover>
  );
}
