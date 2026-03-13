import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getApiBaseUrl } from "@/lib/queryClient";
import { getProfileImageUrl } from "@/components/simple-avatar";
import { UserPlus, MessageCircle } from "lucide-react";

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs === 1 ? "1h ago" : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

function cityLabel(user: any): string {
  return user.hometownCity || "";
}

function displayName(user: any): string {
  return user.firstName || user.name || user.username || "New member";
}

interface RecentlyJoinedProps {
  currentUserId?: number;
}

export default function RecentlyJoined({ currentUserId }: RecentlyJoinedProps) {
  const [, setLocation] = useLocation();

  const { data: newUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/users/recently-joined"],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/users/recently-joined?limit=30&days=14`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 3 * 60 * 1000,
  });

  const filtered = newUsers.filter((u) => u.id !== currentUserId);
  if (filtered.length === 0) return null;

  return (
    <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-orange-500 shrink-0" />
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">
          New to Nearby Traveler
        </h2>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
          — say hello 👋
        </span>
      </div>

      <div
        className="flex gap-3 px-4 pb-4 overflow-x-auto"
        style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {filtered.map((user) => {
          const city = cityLabel(user);
          const img = getProfileImageUrl(user);
          const initial = (user.username || user.name || "?")[0].toUpperCase();

          return (
            <div
              key={user.id}
              className="flex-shrink-0 flex flex-col items-center gap-2 w-[108px] bg-gray-50 dark:bg-gray-800 rounded-xl p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
              onClick={() => setLocation(`/profile/${user.id}`)}
            >
              {/* Avatar */}
              <div className="relative">
                {img ? (
                  <img
                    src={img}
                    alt={user.username}
                    className="w-14 h-14 rounded-full object-cover border-2 border-orange-400/60"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white bg-gradient-to-br from-orange-400 to-pink-500 border-2 border-orange-400/60">
                    {initial}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-800" />
              </div>

              {/* Name */}
              <p className="text-xs font-semibold text-gray-900 dark:text-white text-center leading-tight truncate w-full">
                {displayName(user)}
              </p>

              {/* City */}
              {city && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center leading-tight truncate w-full">
                  📍 {city}
                </p>
              )}

              {/* Time */}
              <p className="text-[10px] text-orange-400 font-medium">
                {timeAgo(user.createdAt)}
              </p>

              {/* Say Hello button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation(`/messages/${user.id}`);
                }}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold transition-colors w-full justify-center"
              >
                <MessageCircle className="w-3 h-3" />
                Say hi
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
