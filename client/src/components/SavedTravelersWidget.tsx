import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Heart, Plane, MapPin, Bookmark } from "lucide-react";
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

function TripStatusBadge({ status, city }: { status: SavedTraveler["tripStatus"]; city: string | null }) {
  if (!status || !city) return null;
  if (status === "here_now") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        Here now · {city}
      </span>
    );
  }
  if (status === "arriving_soon") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 rounded-full">
        <Plane className="w-2.5 h-2.5" />
        Arriving soon · {city}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full">
      <Plane className="w-2.5 h-2.5" />
      Going to {city}
    </span>
  );
}

export function SavedTravelersWidget() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

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

  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  const handleUnsave = (e: React.MouseEvent, savedUserId: number) => {
    e.stopPropagation();
    setRemovingIds((s) => new Set(s).add(savedUserId));
    unsaveMutation.mutate(savedUserId, {
      onSettled: () => setRemovingIds((s) => { const n = new Set(s); n.delete(savedUserId); return n; }),
    });
  };

  if (isLoading || saved.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-rose-200 dark:border-rose-900/40 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Bookmark className="w-4 h-4 text-rose-500 flex-shrink-0" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
          Saved Travelers
        </h3>
        <span className="ml-auto bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {saved.length}
        </span>
      </div>

      <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
        {saved.map((traveler) => {
          const displayName = traveler.firstName || `@${traveler.username}`;
          const from = traveler.hometownCity || traveler.hometownCountry || null;
          const isRemoving = removingIds.has(traveler.savedUserId);

          return (
            <div
              key={traveler.id}
              className={`flex items-center gap-2 py-2 group transition-opacity ${isRemoving ? "opacity-40 pointer-events-none" : ""}`}
            >
              <button
                type="button"
                onClick={() => setLocation(`/profile/${traveler.savedUserId}`)}
                className="relative flex-shrink-0"
              >
                <SimpleAvatar
                  user={{ id: traveler.savedUserId, username: traveler.username, profileImage: traveler.profileImage }}
                  size="sm"
                />
              </button>

              <button
                type="button"
                onClick={() => setLocation(`/profile/${traveler.savedUserId}`)}
                className="flex-1 min-w-0 text-left"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
                  {displayName}
                </p>
                {traveler.tripStatus ? (
                  <TripStatusBadge status={traveler.tripStatus} city={traveler.destinationCity} />
                ) : from ? (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate leading-tight flex items-center gap-0.5 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                    {from}
                  </p>
                ) : null}
                {traveler.tripStatus && traveler.startDate && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">
                    {formatDateShort(traveler.startDate)}
                    {traveler.endDate ? ` – ${formatDateShort(traveler.endDate)}` : ""}
                  </p>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => handleUnsave(e, traveler.savedUserId)}
                title="Remove"
                className="flex-shrink-0 p-1.5 rounded-full text-rose-400 hover:text-rose-600 transition-colors"
              >
                <Heart className="w-4 h-4" fill="currentColor" />
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 text-center">
        You'll be notified when they arrive
      </p>
    </div>
  );
}
