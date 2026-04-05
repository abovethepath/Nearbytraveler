import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import React, { useContext, useState } from "react";
import { AuthContext } from "@/App";
import { getApiBaseUrl } from "@/lib/queryClient";
import { Zap, UserPlus, MessageCircle, ArrowLeft, MapPin, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvailableNowWidget } from "@/components/AvailableNowWidget";
import { getMetroAreaName } from "@shared/metro-areas";
import { useToast } from "@/hooks/use-toast";

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

export default function AvailableNowPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  // City switcher: default to travel destination if currently traveling
  const homeCity = user?.hometownCity || "";
  const isTraveling = (user as any)?.isCurrentlyTraveling;
  const rawDest = (user as any)?.travelDestination || "";
  const destCity = (user as any)?.destinationCity || (user as any)?.destination_city || (rawDest ? rawDest.split(',')[0]?.trim() : "") || "";
  const hasTwoLocations = isTraveling && !!destCity && destCity.toLowerCase() !== homeCity.toLowerCase();
  const defaultView = (isTraveling && destCity) ? 'trip' : 'home';
  const [cityView, setCityView] = useState<'home' | 'trip'>(defaultView);
  const activeCity = getMetroAreaName((cityView === 'trip' && hasTwoLocations) ? destCity : homeCity);

  const { data: availableUsers = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/available-now", activeCity],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/available-now?city=${encodeURIComponent(activeCity)}`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 20000,
    staleTime: 10000,
  });

  const filtered = availableUsers.filter((e) => e.user?.id !== user?.id && e.isAvailable);
  const [sendingTo, setSendingTo] = useState<number | null>(null);

  // Fetch sent requests from API so state survives refresh and reflects cancellations
  const { data: sentRequestsData } = useQuery<{ sentToUserIds: number[] }>({
    queryKey: ["/api/available-now/sent-requests"],
    enabled: !!user?.id,
    staleTime: 10000,
    refetchInterval: 20000,
  });
  const [localSent, setLocalSent] = useState<Set<number>>(new Set());
  const sentRequests = React.useMemo(() => {
    const set = new Set(sentRequestsData?.sentToUserIds || []);
    for (const id of localSent) set.add(id);
    return set;
  }, [sentRequestsData, localSent]);

  const { data: myGroupChats } = useQuery<{ chatrooms: any[] }>({
    queryKey: ["/api/available-now/my-group-chats"],
    enabled: !!user?.id,
    staleTime: 15000,
  });
  const joinedChatroomMap = React.useMemo(() => {
    const map = new Map<number, number>();
    for (const chat of myGroupChats?.chatrooms || []) {
      if (chat.availableNowId) map.set(chat.availableNowId, chat.id);
    }
    return map;
  }, [myGroupChats]);

  const sendJoinRequest = async (toUserId: number, username?: string) => {
    if (!user?.id || sentRequests.has(toUserId) || sendingTo) return;
    setSendingTo(toUserId);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/available-now/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': String(user.id) },
        credentials: 'include',
        body: JSON.stringify({ toUserId }),
      });
      if (res.ok || res.status === 409) {
        setLocalSent(prev => new Set(prev).add(toUserId));
        toast({
          title: "Request sent!",
          description: username ? `We'll notify you when @${username} accepts.` : "We'll notify you when they accept.",
        });
      }
    } catch { /* silent */ }
    setSendingTo(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => setLocation("/")} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-500" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Available Now</h1>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
          </div>
          {activeCity && !hasTwoLocations && (
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {getMetroAreaName(activeCity)}
            </span>
          )}
        </div>
        {hasTwoLocations && (
          <div className="max-w-2xl mx-auto flex gap-1.5 mt-2">
            <button
              onClick={() => setCityView('trip')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                cityView === 'trip'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {getMetroAreaName(destCity)}
            </button>
            <button
              onClick={() => setCityView('home')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
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

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Activation widget — set yourself as Available Now */}
        <AvailableNowWidget currentUser={user} />

        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Finding available people...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Zap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No one available right now</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Be the first! Post your availability and let others find you.
            </p>
            <Button onClick={() => setLocation("/quick-meetups")} className="bg-green-500 hover:bg-green-600 text-white">
              <Zap className="w-4 h-4 mr-2" />
              Go Available
            </Button>
          </div>
        ) : (
          filtered.map((entry) => {
            const u = entry.user || {};
            const name = u.firstName || (u.fullName || u.username || "User").split(" ")[0];
            const username = u.username || "";
            const photo = u.profilePhoto || u.profileImage;
            const initial = (name[0] || "?").toUpperCase();
            const city = entry.city || "";
            const activities = entry.activities || [];
            const customNote = entry.customNote || "";

            const remaining = entry.expiresAt ? timeLeft(entry.expiresAt) : null;

            return (
              <div
                key={entry.id}
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                {/* Photo */}
                <div
                  className="relative w-full h-[200px] cursor-pointer"
                  onClick={() => setLocation(`/profile/${u.id}`)}
                >
                  {photo ? (
                    <img src={photo} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-white bg-gradient-to-br from-green-400 to-blue-500">
                      {initial}
                    </div>
                  )}
                  {/* Time left top-right */}
                  {remaining && (
                    <div className="absolute top-3 right-3">
                      <span className="text-xs font-medium text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                        {remaining}
                      </span>
                    </div>
                  )}
                  {/* Green dot top-left */}
                  <div className="absolute top-3 left-3">
                    <span className="flex items-center gap-1.5 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      Available
                    </span>
                  </div>
                </div>

                {/* Name + city below photo */}
                <div className="px-4 pt-3 cursor-pointer" onClick={() => setLocation(`/profile/${u.id}`)}>
                  <p className="text-gray-900 dark:text-white text-lg font-bold leading-tight">{name}</p>
                  {city && <p className="text-gray-500 dark:text-gray-400 text-sm leading-tight">{city}</p>}
                </div>

                {/* Content below photo */}
                <div className="p-4 space-y-3">
                  {/* Custom note */}
                  {customNote && (
                    <p className="text-blue-600 dark:text-blue-400 font-bold text-base leading-snug">
                      {customNote}
                    </p>
                  )}

                  {/* Activity pills */}
                  {activities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {activities.slice(0, 6).map((act: string, i: number) => (
                        <span key={i} className="text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
                          {getActivityLabel(act)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Fallback when no custom note and no activities */}
                  {!customNote && activities.length === 0 && (
                    <p className="text-blue-600 dark:text-blue-400 font-bold text-base leading-snug">
                      Available to hang out
                    </p>
                  )}

                  {/* Username */}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    @{username}
                  </p>

                  {/* Join / Go to Chat button */}
                  {joinedChatroomMap.has(entry.id) ? (
                    <Button
                      onClick={() => {
                        const chatroomId = joinedChatroomMap.get(entry.id);
                        setLocation(`/meetup-chatroom-chat/${chatroomId}?title=${encodeURIComponent(entry.chatroomName || 'Meetup Chat')}`);
                      }}
                      className="w-full min-h-[48px] bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Go to Chat
                    </Button>
                  ) : sentRequests.has(u.id) ? (
                    <Button disabled className="w-full min-h-[48px] bg-gray-600 text-white font-semibold">
                      <Check className="w-4 h-4 mr-2" />
                      Request Sent
                    </Button>
                  ) : (
                    <Button
                      onClick={() => sendJoinRequest(u.id, u.username)}
                      disabled={sendingTo === u.id}
                      className="w-full min-h-[48px] bg-green-500 hover:bg-green-600 text-white font-semibold"
                    >
                      {sendingTo === u.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                      )}
                      Join
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
