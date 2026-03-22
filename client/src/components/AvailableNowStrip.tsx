import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { useLocation } from "wouter";
import { getApiBaseUrl } from "@/lib/queryClient";
import { Zap, MessageCircle, ChevronLeft, ChevronRight, ChevronRight as ArrowRight } from "lucide-react";

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
  if (activities.length > 0) return activities.slice(0, 2).join(", ");
  return "Available to hang out";
}

interface AvailableNowStripProps {
  currentUserId?: number;
  userCity?: string;
}

const SCROLL_AMOUNT = 170;

export default function AvailableNowStrip({ currentUserId, userCity }: AvailableNowStripProps) {
  const [, setLocation] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: availableUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/available-now", userCity || ""],
    queryFn: async () => {
      const city = userCity || "";
      const res = await fetch(`${getApiBaseUrl()}/api/available-now?city=${encodeURIComponent(city)}`, {
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
  if (filtered.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT, behavior: "smooth" });
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
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
            const intent = getIntent(entry);

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
                  {/* Name + city overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs font-bold leading-tight truncate">{name}</p>
                    {city && <p className="text-white/80 text-[10px] leading-tight truncate">{city}</p>}
                  </div>
                  {/* Time ago */}
                  <div className="absolute top-1.5 right-1.5">
                    <span className="text-[9px] font-medium text-white bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                      {timeAgo(entry.expiresAt ? new Date(Date.now() - (new Date(entry.expiresAt).getTime() - Date.now())).toISOString() : new Date().toISOString())}
                    </span>
                  </div>
                </div>

                {/* Intent */}
                <div className="px-2.5 pt-2 pb-1.5">
                  <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 leading-tight line-clamp-2 min-h-[28px]">
                    {intent}
                  </p>
                </div>

                {/* Say Hello */}
                <div className="px-2.5 pb-2.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/messages/${user.id}`);
                    }}
                    className="flex items-center gap-1 w-full justify-center px-2 py-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white text-[11px] font-semibold transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Say Hello
                  </button>
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
    </div>
  );
}
