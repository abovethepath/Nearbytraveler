import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useContext, useState } from "react";
import { AuthContext } from "@/App";
import { getApiBaseUrl } from "@/lib/queryClient";
import { Zap, UserPlus, ArrowLeft, MapPin, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs === 1 ? "1h ago" : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "1 day ago" : `${days}d ago`;
}

function getIntent(entry: any): string {
  const activities = entry.activities || [];
  if (entry.customNote) return entry.customNote;
  if (activities.length > 0) return activities.join(", ");
  return "Available to hang out";
}

export default function AvailableNowPage() {
  const [, setLocation] = useLocation();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const userCity = user?.hometownCity || user?.destinationCity || "";

  const { data: availableUsers = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/available-now", userCity],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/available-now?city=${encodeURIComponent(userCity)}`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 20000,
    staleTime: 10000,
  });

  const filtered = availableUsers.filter((e) => e.user?.id !== user?.id && e.isAvailable);
  const [sentRequests, setSentRequests] = useState<Set<number>>(new Set());
  const [sendingTo, setSendingTo] = useState<number | null>(null);

  const sendJoinRequest = async (toUserId: number) => {
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
        setSentRequests(prev => new Set(prev).add(toUserId));
      }
    } catch { /* silent */ }
    setSendingTo(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => setLocation("/home")} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
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
          {userCity && (
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {userCity}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
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
            const intent = getIntent(entry);
            const activities = entry.activities || [];

            return (
              <div
                key={entry.id}
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                {/* Full bleed photo */}
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
                  {/* Name + city bottom-left */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-white text-lg font-bold leading-tight">{name}</p>
                    {city && <p className="text-white/80 text-sm leading-tight">{city}</p>}
                  </div>
                  {/* Time ago top-right */}
                  <div className="absolute top-3 right-3">
                    <span className="text-xs font-medium text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      {timeAgo(entry.createdAt || new Date().toISOString())}
                    </span>
                  </div>
                  {/* Green dot top-left */}
                  <div className="absolute top-3 left-3">
                    <span className="flex items-center gap-1.5 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      Available
                    </span>
                  </div>
                </div>

                {/* Content below photo */}
                <div className="p-4 space-y-3">
                  {/* Intent */}
                  <p className="text-blue-600 dark:text-blue-400 font-bold text-base leading-snug">
                    {intent}
                  </p>

                  {/* Activities pills */}
                  {activities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {activities.slice(0, 4).map((act: string, i: number) => (
                        <span key={i} className="text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
                          {act}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Username */}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    @{username}
                  </p>

                  {/* Join button */}
                  {sentRequests.has(u.id) ? (
                    <Button disabled className="w-full bg-gray-600 text-white font-semibold">
                      <Check className="w-4 h-4 mr-2" />
                      Request Sent
                    </Button>
                  ) : (
                    <Button
                      onClick={() => sendJoinRequest(u.id)}
                      disabled={sendingTo === u.id}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold"
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
