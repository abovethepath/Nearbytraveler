import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Heart, Plane, MapPin, Bookmark, Bell } from "lucide-react";
import { SimpleAvatar } from "@/components/simple-avatar";
import { apiRequest } from "@/lib/queryClient";

interface SavedTraveler {
  id: number;
  savedUserId: number;
  cityName: string | null;
  username: string;
  firstName: string | null;
  profileImage: string | null;
  hometownCity: string | null;
  hometownCountry: string | null;
  destinationCity: string | null;
  startDate: string | null;
  endDate: string | null;
  tripStatus: "here_now" | "arriving_soon" | "upcoming" | null;
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getStatusConfig(status: SavedTraveler["tripStatus"], city: string | null) {
  if (status === "here_now") return {
    dot: "bg-emerald-400",
    label: city ? `Here now · ${city}` : "Here now",
    labelCls: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800",
    iconEl: <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block flex-shrink-0" />,
  };
  if (status === "arriving_soon") return {
    dot: "bg-amber-400",
    label: city ? `Arriving soon · ${city}` : "Arriving soon",
    labelCls: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800",
    iconEl: <Plane className="w-2.5 h-2.5 flex-shrink-0" />,
  };
  return {
    dot: "bg-sky-400",
    label: city ? `Going to ${city}` : "Trip planned",
    labelCls: "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/40 border border-sky-200 dark:border-sky-800",
    iconEl: <Plane className="w-2.5 h-2.5 flex-shrink-0" />,
  };
}

export function SavedTravelersWidget() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  const { data: saved = [], isLoading } = useQuery<SavedTraveler[]>({
    queryKey: ["/api/saved-travelers"],
    staleTime: 5 * 60 * 1000,
  });

  const unsaveMutation = useMutation({
    mutationFn: async (savedUserId: number) => {
      await apiRequest("DELETE", `/api/saved-travelers/${savedUserId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/saved-travelers"] });
      qc.invalidateQueries({ queryKey: ["/api/saved-travelers/check"] });
    },
  });

  const handleUnsave = (e: React.MouseEvent, savedUserId: number) => {
    e.stopPropagation();
    setRemovingIds((s) => new Set(s).add(savedUserId));
    unsaveMutation.mutate(savedUserId, {
      onSettled: () =>
        setRemovingIds((s) => {
          const n = new Set(s);
          n.delete(savedUserId);
          return n;
        }),
    });
  };

  if (isLoading || saved.length === 0) return null;

  const hereNowCount = saved.filter((t) => t.tripStatus === "here_now").length;
  const hasUpcoming = saved.some((t) => t.tripStatus !== "here_now");

  return (
    <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-sm overflow-hidden">
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 px-4 py-3 flex items-center gap-2.5">
        <div className="bg-white/25 rounded-lg p-1.5 flex-shrink-0">
          <Bookmark className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight">Saved Travelers</p>
          <p className="text-white/75 text-[10px] leading-tight">
            {hereNowCount > 0
              ? `${hereNowCount} here now · get notified on arrival`
              : "Get notified when they arrive"}
          </p>
        </div>
        <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
          {saved.length}
        </span>
      </div>

      {/* Cards */}
      <div className="bg-white dark:bg-gray-900 p-3 space-y-2">
        {saved.map((traveler) => {
          const cfg = getStatusConfig(traveler.tripStatus, traveler.destinationCity);
          const displayName = traveler.firstName || `@${traveler.username}`;
          const from = traveler.hometownCity || traveler.hometownCountry || null;
          const isRemoving = removingIds.has(traveler.savedUserId);

          return (
            <div
              key={traveler.id}
              className={`flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer ${
                isRemoving ? "opacity-40 pointer-events-none" : ""
              }`}
              onClick={() => setLocation(`/profile/${traveler.savedUserId}`)}
            >
              {/* Avatar with status dot */}
              <div className="relative flex-shrink-0">
                <SimpleAvatar
                  user={{ id: traveler.savedUserId, username: traveler.username, profileImage: traveler.profileImage }}
                  size="md"
                />
                {traveler.tripStatus && (
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${cfg.dot}`} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">
                  {displayName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {traveler.tripStatus && (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.labelCls}`}>
                      {cfg.iconEl}
                      {cfg.label}
                    </span>
                  )}
                  {from && !traveler.tripStatus && (
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                      {from}
                    </span>
                  )}
                </div>
                {traveler.startDate && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5 mt-1 leading-tight">
                    <Bell className="w-2.5 h-2.5 flex-shrink-0" />
                    {formatDateShort(traveler.startDate)}
                    {traveler.endDate ? ` – ${formatDateShort(traveler.endDate)}` : ""}
                  </p>
                )}
              </div>

              {/* Unsave button */}
              <button
                type="button"
                onClick={(e) => handleUnsave(e, traveler.savedUserId)}
                title="Remove from saved"
                className="flex-shrink-0 p-2 rounded-full text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
              >
                <Heart className="w-4 h-4" fill="currentColor" />
              </button>
            </div>
          );
        })}

        {hasUpcoming && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center pt-1">
            You'll receive a notification when they arrive
          </p>
        )}
      </div>
    </div>
  );
}
