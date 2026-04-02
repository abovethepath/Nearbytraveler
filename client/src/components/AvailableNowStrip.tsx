import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
import { useLocation } from "wouter";
import { getApiBaseUrl, apiRequest } from "@/lib/queryClient";
import { Zap, UserPlus, MessageCircle, ChevronLeft, ChevronRight, ChevronRight as ArrowRight, Check, Loader2, XCircle } from "lucide-react";
import { getMetroAreaName } from "@shared/metro-areas";

function timeLeft(expiresAt: string): string | null {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m left`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h left`;
}

const ACTIVITY_LABELS: Record<string, string> = {
  coffee: "Coffee", food: "Food", drinks: "Drinks", explore: "Explore",
  music: "Music", fitness: "Fitness", hike: "Hike", bike: "Bike",
  beach: "Beach", sightseeing: "Sightseeing",
};

function getActivityLabel(act: string): string {
  return ACTIVITY_LABELS[act] || act;
}

interface AvailableNowStripProps {
  currentUserId?: number;
  userCity?: string;
  isCurrentlyTraveling?: boolean;
  travelDestination?: string;
}

const SCROLL_AMOUNT = 170;

export default function AvailableNowStrip({ currentUserId: propUserId, userCity, isCurrentlyTraveling, travelDestination }: AvailableNowStripProps) {
  const [, setLocation] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sendingTo, setSendingTo] = useState<number | null>(null);
  // Fallback: resolve userId from localStorage if prop is temporarily undefined during re-render
  const currentUserId = propUserId || (() => {
    try { const u = JSON.parse(localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || '{}'); return Number(u?.id) || undefined; } catch { return undefined; }
  })();

  // City switcher: default to travel destination if traveling
  const homeCity = userCity || "";
  const destCity = travelDestination || "";
  const hasTwoLocations = isCurrentlyTraveling && !!destCity && destCity.toLowerCase() !== homeCity.toLowerCase();
  const defaultView = (isCurrentlyTraveling && destCity) ? 'trip' : 'home';
  const [cityView, setCityView] = useState<'home' | 'trip'>(defaultView);
  const activeCity = getMetroAreaName((cityView === 'trip' && hasTwoLocations) ? destCity : homeCity);

  // Fetch sent requests from API so state reflects cancellations
  const { data: sentRequestsData } = useQuery<{ sentToUserIds: number[] }>({
    queryKey: ["/api/available-now/sent-requests"],
    enabled: !!currentUserId,
    staleTime: 10000,
    refetchInterval: 20000,
  });
  const [localSent, setLocalSent] = useState<Set<number>>(new Set());
  const sentRequests = React.useMemo(() => {
    const set = new Set(sentRequestsData?.sentToUserIds || []);
    for (const id of localSent) set.add(id);
    return set;
  }, [sentRequestsData, localSent]);

  const sendJoinRequest = async (toUserId: number, isOpenJoin?: boolean) => {
    if (!currentUserId || sentRequests.has(toUserId) || sendingTo) return;
    setSendingTo(toUserId);
    try {
      if (isOpenJoin) {
        // Open join — skip request, join chatroom directly
        try {
          const res = await fetch(`${getApiBaseUrl()}/api/available-now/open-join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': String(currentUserId) },
            credentials: 'include',
            body: JSON.stringify({ toUserId }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.chatroomId) {
              setSendingTo(null);
              setLocation(`/meetup-chatroom-chat/${data.chatroomId}?title=Meetup Chat`);
              return;
            }
          }
          // If open-join returned 403 (requires approval), fall through to regular request
        } catch {
          // Open-join network error — fall through to regular request
        }
      }
      // Regular request flow (also fallback if open-join fails)
      const res = await fetch(`${getApiBaseUrl()}/api/available-now/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': String(currentUserId) },
        credentials: 'include',
        body: JSON.stringify({ toUserId }),
      });
      if (res.ok || res.status === 409) {
        setLocalSent(prev => new Set(prev).add(toUserId));
      }
    } catch { /* silent */ }
    setSendingTo(null);
  };

  // Fetch user's existing meetup chatrooms to detect already-joined hangouts
  const { data: myGroupChats } = useQuery<{ chatrooms: any[] }>({
    queryKey: ["/api/available-now/my-group-chats"],
    enabled: !!currentUserId,
    staleTime: 15000,
  });

  // Map availableNowId → chatroomId for quick lookup
  const joinedChatroomMap = React.useMemo(() => {
    const map = new Map<number, number>();
    for (const chat of myGroupChats?.chatrooms || []) {
      if (chat.availableNowId) map.set(chat.availableNowId, chat.id);
    }
    return map;
  }, [myGroupChats]);

  const queryClient = useQueryClient();
  const { data: myStatus } = useQuery<{ isAvailable: boolean } | null>({
    queryKey: ["/api/available-now/my-status"],
    enabled: !!currentUserId,
    staleTime: 0,
  });
  const stopAvailable = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/available-now"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/available-now"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/my-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/active-ids"] });
    },
  });

  const { data: availableUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/available-now", activeCity],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/available-now?city=${encodeURIComponent(activeCity)}`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: true,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const filtered = availableUsers.filter((e) => e.user?.id !== currentUserId && e.isAvailable);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT, behavior: "smooth" });
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
      {myStatus?.isAvailable && (
        <div className="px-4 pt-3 pb-2 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-green-800 dark:text-green-300">You're Live</span>
          </div>
          <button
            onClick={() => stopAvailable.mutate()}
            disabled={stopAvailable.isPending}
            className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 flex items-center gap-1"
          >
            <XCircle className="w-3.5 h-3.5" />
            {stopAvailable.isPending ? "Stopping..." : "No Longer Available"}
          </button>
        </div>
      )}
      <div className="px-4 pt-4 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-green-500 shrink-0" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Available Now Near You
            </h2>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          </div>
          <button
            onClick={() => setLocation("/available-now")}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
          >
            See all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {hasTwoLocations && (
          <div className="flex gap-1">
            <button
              onClick={() => setCityView('trip')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                cityView === 'trip'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {getMetroAreaName(destCity)}
            </button>
            <button
              onClick={() => setCityView('home')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                cityView === 'home'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {getMetroAreaName(homeCity)}
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="px-4 pb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No one available in {activeCity || 'this city'} right now
          </p>
        </div>
      ) : (
      <div className="relative">
        <button
          onClick={() => scroll("left")}
          className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>

        <div
          ref={scrollRef}
          className="flex flex-nowrap gap-3 px-4 pb-4 overflow-x-auto lg:overflow-x-hidden lg:px-8"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {filtered.slice(0, 8).map((entry) => {
            const user = entry.user || {};
            const name = user.firstName || (user.fullName || user.username || "User").split(" ")[0];
            const photo = user.profilePhoto || user.profileImage;
            const initial = (name[0] || "?").toUpperCase();
            const city = entry.city || "";
            const activities = entry.activities || [];
            const customNote = entry.customNote || "";

            return (
              <div
                key={entry.id}
                className="flex-shrink-0 w-[160px] bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setLocation(`/profile/${user.id}`)}
              >
                {/* Photo */}
                <div className="relative w-full h-[120px]">
                  {photo ? (
                    <img src={photo} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-br from-green-400 to-blue-500">
                      {initial}
                    </div>
                  )}
                  {/* Time left */}
                  {(() => {
                    const remaining = entry.expiresAt ? timeLeft(entry.expiresAt) : null;
                    return remaining ? (
                      <div className="absolute top-1.5 right-1.5">
                        <span className="text-[9px] font-medium text-white bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                          {remaining}
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Name + city below photo */}
                <div className="px-2.5 pt-1.5">
                  <p className="text-gray-900 dark:text-white text-xs font-bold leading-tight truncate">{name}</p>
                  {city && <p className="text-gray-500 dark:text-gray-400 text-[10px] leading-tight truncate">{city}</p>}
                </div>

                {/* Custom note + activity pills */}
                <div className="px-2.5 pt-1 pb-1.5 space-y-1">
                  {customNote && (
                    <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 leading-tight line-clamp-1">
                      {customNote}
                    </p>
                  )}
                  {activities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {activities.slice(0, 2).map((act: string, i: number) => (
                        <span key={i} className="text-[9px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full">
                          {getActivityLabel(act)}
                        </span>
                      ))}
                    </div>
                  )}
                  {!customNote && activities.length === 0 && (
                    <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 leading-tight">
                      Available to hang out
                    </p>
                  )}
                </div>

                {/* Join / Go to Chat */}
                <div className="px-2.5 pb-2.5">
                  {joinedChatroomMap.has(entry.id) ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const chatroomId = joinedChatroomMap.get(entry.id);
                        setLocation(`/meetup-chatroom-chat/${chatroomId}?title=${encodeURIComponent(entry.chatroomName || 'Meetup Chat')}`);
                      }}
                      className="flex items-center gap-1 w-full justify-center px-2 py-1.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-semibold transition-colors"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Go to Chat
                    </button>
                  ) : sentRequests.has(user.id) ? (
                    <div className="flex items-center gap-1 w-full justify-center px-2 py-1.5 rounded-full bg-gray-600 text-white text-[11px] font-semibold">
                      <Check className="w-3 h-3" />
                      Requested
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sendJoinRequest(user.id, !!(entry as any).openJoin || !!(entry as any).open_join);
                      }}
                      disabled={sendingTo === user.id}
                      className="flex items-center gap-1 w-full justify-center px-2 py-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
                    >
                      {sendingTo === user.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <UserPlus className="w-3 h-3" />
                      )}
                      Join
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => scroll("right")}
          className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
      )}
    </div>
  );
}
