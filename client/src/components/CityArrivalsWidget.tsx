import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plane, Heart, MapPin, Calendar } from "lucide-react";
import { SimpleAvatar } from "@/components/simple-avatar";
import { getApiBaseUrl, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/App";

interface ArrivalUser {
  userId: number;
  username: string;
  firstName: string | null;
  profileImage: string | null;
  userType: string | null;
  hometownCity: string | null;
  hometownCountry: string | null;
  startDate: string | null;
  endDate: string | null;
  saved: boolean;
}

interface ArrivalsData {
  hereNow: ArrivalUser[];
  arrivingToday: ArrivalUser[];
  arrivingSoon: ArrivalUser[];
}

interface Props {
  cityName: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ArrivalCard({
  user,
  cityName,
  alreadyHere,
  status,
  onProfileClick,
}: {
  user: ArrivalUser;
  cityName: string;
  alreadyHere?: boolean;
  status: "here" | "today" | "soon";
  onProfileClick: () => void;
}) {
  const auth = useAuth();
  const qc = useQueryClient();
  const isLoggedIn = !!auth.user;
  const [optimisticSaved, setOptimisticSaved] = useState(user.saved);

  const saveMutation = useMutation({
    mutationFn: async (save: boolean) => {
      if (save) {
        await apiRequest("POST", "/api/saved-travelers", { savedUserId: user.userId, cityName });
      } else {
        await apiRequest("DELETE", `/api/saved-travelers/${user.userId}?cityName=${encodeURIComponent(cityName)}`);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/cities", cityName, "arrivals"] });
    },
  });

  const handleHeart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) return;
    const next = !optimisticSaved;
    setOptimisticSaved(next);
    saveMutation.mutate(next);
  };

  const displayName = user.firstName || `@${user.username}`;
  let from = user.hometownCity || user.hometownCountry || null;
  // Extract only city name if hometownCity contains full location (e.g., "Lisbon, Portugal")
  if (from && from.includes(",")) {
    from = from.split(",")[0].trim();
  }

  const statusConfig = {
    here:  { dot: "bg-emerald-400", badge: "Here now",      badgeCls: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800" },
    today: { dot: "bg-amber-400",   badge: "Arriving today", badgeCls: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800" },
    soon:  { dot: "bg-sky-400",     badge: "Coming soon",    badgeCls: "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/40 border border-sky-200 dark:border-sky-800" },
  }[status];

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
      onClick={onProfileClick}
    >
      <div className="relative flex-shrink-0">
        <SimpleAvatar
          user={{ id: user.userId, username: user.username, profileImage: user.profileImage }}
          size="md"
        />
        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${statusConfig.dot}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">
          {displayName}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusConfig.badgeCls}`}>
            {statusConfig.badge}
          </span>
          {from && (
            <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              {from}
            </span>
          )}
        </div>
        {(user.startDate || user.endDate) && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5 mt-1 leading-tight">
            <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
            {formatDate(user.startDate)}{user.endDate ? ` – ${formatDate(user.endDate)}` : ""}
          </p>
        )}
      </div>

      {isLoggedIn && !alreadyHere && (
        <button
          type="button"
          onClick={handleHeart}
          title={optimisticSaved ? "Remove reminder" : "Save — get notified when they arrive"}
          className={`flex-shrink-0 p-2 rounded-full transition-all ${
            optimisticSaved
              ? "text-rose-500 bg-rose-50 dark:bg-rose-900/30"
              : "text-gray-300 dark:text-gray-600 hover:text-rose-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          }`}
        >
          <Heart className="w-4 h-4" fill={optimisticSaved ? "currentColor" : "none"} />
        </button>
      )}
    </div>
  );
}

export function CityArrivalsWidget({ cityName }: Props) {
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<ArrivalsData>({
    queryKey: ["/api/cities", cityName, "arrivals"],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/cities/${encodeURIComponent(cityName)}/arrivals`, {
        credentials: "include",
      });
      if (!res.ok) return { hereNow: [], arrivingToday: [], arrivingSoon: [] };
      return res.json();
    },
    staleTime: 3 * 60 * 1000,
    enabled: !!cityName,
  });

  const total =
    (data?.hereNow.length ?? 0) +
    (data?.arrivingToday.length ?? 0) +
    (data?.arrivingSoon.length ?? 0);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
        <div className="h-12 bg-gradient-to-r from-orange-400 to-amber-400 opacity-60" />
        <div className="bg-white dark:bg-gray-900 p-3 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28" />
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || total === 0) return null;

  const hasArriving = (data.arrivingToday.length + data.arrivingSoon.length) > 0;

  return (
    <div className="rounded-2xl border border-orange-200 dark:border-orange-900/40 shadow-sm overflow-hidden">
      {/* Gradient header bar */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 px-4 py-3 flex items-center gap-2.5">
        <div className="bg-white/25 rounded-lg p-1.5 flex-shrink-0">
          <Plane className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight">Coming to {cityName}</p>
          <p className="text-white/75 text-[10px] leading-tight">
            {data.hereNow.length > 0 && `${data.hereNow.length} here now · `}
            {hasArriving && `${data.arrivingToday.length + data.arrivingSoon.length} arriving`}
          </p>
        </div>
        <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
          {total}
        </span>
      </div>

      {/* Cards */}
      <div className="bg-white dark:bg-gray-900 p-3 space-y-2">
        {data.hereNow.map((u) => (
          <ArrivalCard
            key={u.userId}
            user={u}
            cityName={cityName}
            alreadyHere={true}
            status="here"
            onProfileClick={() => setLocation(`/profile/${u.userId}`)}
          />
        ))}
        {data.arrivingToday.map((u) => (
          <ArrivalCard
            key={u.userId}
            user={u}
            cityName={cityName}
            status="today"
            onProfileClick={() => setLocation(`/profile/${u.userId}`)}
          />
        ))}
        {data.arrivingSoon.map((u) => (
          <ArrivalCard
            key={u.userId}
            user={u}
            cityName={cityName}
            status="soon"
            onProfileClick={() => setLocation(`/profile/${u.userId}`)}
          />
        ))}

        {hasArriving && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center pt-1">
            ♥ save a traveler to be notified when they arrive
          </p>
        )}
      </div>
    </div>
  );
}
