import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plane, MapPin, Heart } from "lucide-react";
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
  onProfileClick,
}: {
  user: ArrivalUser;
  cityName: string;
  onProfileClick: () => void;
}) {
  const auth = useAuth();
  const qc = useQueryClient();
  const isLoggedIn = !!auth.user;
  const [optimisticSaved, setOptimisticSaved] = useState(user.saved);

  const saveMutation = useMutation({
    mutationFn: async (save: boolean) => {
      if (save) {
        await apiRequest("POST", "/api/saved-travelers", {
          savedUserId: user.userId,
          cityName,
        });
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
  const from = user.hometownCity || user.hometownCountry || null;

  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 group">
      <button type="button" onClick={onProfileClick} className="relative flex-shrink-0">
        <SimpleAvatar
          user={{ id: user.userId, username: user.username, profileImage: user.profileImage }}
          size="sm"
        />
      </button>
      <button
        type="button"
        onClick={onProfileClick}
        className="flex-1 min-w-0 text-left"
      >
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
          {displayName}
        </p>
        {from && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate leading-tight flex items-center gap-0.5">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            {from}
          </p>
        )}
        {(user.startDate || user.endDate) && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">
            {formatDate(user.startDate)}{user.endDate ? ` – ${formatDate(user.endDate)}` : ""}
          </p>
        )}
      </button>
      {isLoggedIn && (
        <button
          type="button"
          onClick={handleHeart}
          title={optimisticSaved ? "Remove reminder" : "Remind me when they arrive"}
          className={`flex-shrink-0 p-1.5 rounded-full transition-colors ${
            optimisticSaved
              ? "text-rose-500 hover:text-rose-400"
              : "text-gray-300 dark:text-gray-600 hover:text-rose-400 dark:hover:text-rose-400"
          }`}
        >
          <Heart
            className="w-4 h-4"
            fill={optimisticSaved ? "currentColor" : "none"}
          />
        </button>
      )}
    </div>
  );
}

function Section({
  dot,
  label,
  sublabel,
  users,
  cityName,
  onProfileClick,
}: {
  dot: string;
  label: string;
  sublabel?: string;
  users: ArrivalUser[];
  cityName: string;
  onProfileClick: (id: number) => void;
}) {
  if (users.length === 0) return null;
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          {label}
        </span>
        {sublabel && (
          <span className="text-[10px] text-gray-400">{sublabel}</span>
        )}
        <span className="ml-auto text-xs font-semibold text-gray-400 dark:text-gray-500">
          {users.length}
        </span>
      </div>
      {users.map((u) => (
        <ArrivalCard
          key={u.userId}
          user={u}
          cityName={cityName}
          onProfileClick={() => onProfileClick(u.userId)}
        />
      ))}
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
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-36 mb-3" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 py-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700" />
            <div className="flex-1">
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-24 mb-1" />
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || total === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-orange-900/40 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Plane className="w-4 h-4 text-orange-500 flex-shrink-0" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
          Coming to {cityName}
        </h3>
        <span className="ml-auto bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {total}
        </span>
      </div>

      <Section
        dot="bg-emerald-500"
        label="Here Now"
        users={data.hereNow}
        cityName={cityName}
        onProfileClick={(id) => setLocation(`/profile/${id}`)}
      />
      <Section
        dot="bg-orange-500"
        label="Arriving Today"
        users={data.arrivingToday}
        cityName={cityName}
        onProfileClick={(id) => setLocation(`/profile/${id}`)}
      />
      <Section
        dot="bg-blue-500"
        label="Coming Soon"
        sublabel="≤3 days"
        users={data.arrivingSoon}
        cityName={cityName}
        onProfileClick={(id) => setLocation(`/profile/${id}`)}
      />

      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center">
        ♥ to get reminded when they arrive
      </p>
    </div>
  );
}
