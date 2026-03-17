import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Heart, MapPin, Plane, Home, Clock, ChevronRight } from "lucide-react";
import { SimpleAvatar } from "@/components/simple-avatar";
import { abbreviateCity } from "@/lib/displayName";
import { getApiBaseUrl, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/App";

interface CityUser {
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

interface CityPeopleData {
  locals: CityUser[];
  hereNow: CityUser[];
  comingSoon: CityUser[];
}

interface Props {
  cityName: string;
}

function formatArrivalDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function daysUntil(dateStr: string | null): number {
  if (!dateStr) return 99;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function getStatusConfig(group: "local" | "here" | "soon", user: CityUser) {
  if (group === "here") {
    return {
      label: "Here now",
      emoji: "🟢",
      pillCls: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
      dotCls: "bg-emerald-400",
    };
  }
  if (group === "soon") {
    const days = daysUntil(user.startDate);
    let label: string;
    if (days === 0) label = "Arrives today";
    else if (days === 1) label = "Tomorrow";
    else if (days <= 6) label = `${days} days away`;
    else label = `Arrives ${formatArrivalDate(user.startDate)}`;
    return {
      label,
      emoji: "✈️",
      pillCls: "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800",
      dotCls: "bg-sky-400",
    };
  }
  return {
    label: "Lives here",
    emoji: "🏠",
    pillCls: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    dotCls: "bg-blue-400",
  };
}

function ArrivalRow({
  user,
  group,
  cityName,
  onProfileClick,
  isLast,
}: {
  user: CityUser;
  group: "local" | "here" | "soon";
  cityName: string;
  onProfileClick: () => void;
  isLast: boolean;
}) {
  const auth = useAuth();
  const qc = useQueryClient();
  const isLoggedIn = !!auth.user;
  const [optimisticSaved, setOptimisticSaved] = useState(user.saved);
  const [showSayHi, setShowSayHi] = useState(false);

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

  const displayName = (user.firstName || "").split(" ")[0] || `@${user.username}`;
  let from = user.hometownCity || user.hometownCountry || null;
  if (from && from.includes(",")) from = from.split(",")[0].trim();
  if (from) from = abbreviateCity(from);

  const status = getStatusConfig(group, user);
  const isTraveler = group === "here" || group === "soon";

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer group relative ${
        isLast ? "" : "border-b border-gray-100 dark:border-gray-800/60"
      } hover:bg-sky-50/50 dark:hover:bg-sky-900/10`}
      onClick={onProfileClick}
      onMouseEnter={() => setShowSayHi(true)}
      onMouseLeave={() => setShowSayHi(false)}
    >
      {/* Avatar with status dot */}
      <div className="relative flex-shrink-0">
        <SimpleAvatar
          user={{ id: user.userId, username: user.username, profileImage: user.profileImage }}
          size="sm"
        />
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${status.dotCls}`}
        />
      </div>

      {/* Name + hometown */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">
          {displayName}
        </p>
        {from && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight flex items-center gap-0.5 mt-0.5">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            {from}
          </p>
        )}
      </div>

      {/* Right side — status pill or Say Hi */}
      <div className="flex-shrink-0 flex items-center gap-1.5">
        {/* Heart button for travelers (always visible, shrinks on hover to make room for Say Hi) */}
        {isTraveler && isLoggedIn && (
          <button
            type="button"
            onClick={handleHeart}
            title={optimisticSaved ? "Remove reminder" : "Save — get notified when they arrive"}
            className={`flex-shrink-0 p-1 rounded-full transition-all ${
              showSayHi ? "opacity-0 w-0 overflow-hidden p-0" : ""
            } ${
              optimisticSaved
                ? "text-rose-500"
                : "text-gray-300 dark:text-gray-600 hover:text-rose-400 dark:hover:text-rose-400"
            }`}
          >
            <Heart className="w-3.5 h-3.5" fill={optimisticSaved ? "currentColor" : "none"} />
          </button>
        )}

        {/* Say Hi — slides in on hover */}
        {showSayHi && isLoggedIn ? (
          <button
            type="button"
            className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-colors whitespace-nowrap"
            onClick={(e) => {
              e.stopPropagation();
              onProfileClick();
            }}
          >
            Say Hi 👋
          </button>
        ) : (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${status.pillCls}`}>
            {status.label} {status.emoji}
          </span>
        )}
      </div>
    </div>
  );
}

function ArrivalSection({
  title,
  icon,
  users,
  group,
  cityName,
  onProfileClick,
}: {
  title: string;
  icon: React.ReactNode;
  users: CityUser[];
  group: "local" | "here" | "soon";
  cityName: string;
  onProfileClick: (id: number) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  if (users.length === 0) return null;

  const MAX_VISIBLE = 5;
  const visible = showAll ? users : users.slice(0, MAX_VISIBLE);
  const hidden = users.length - MAX_VISIBLE;

  return (
    <div>
      {/* Section label */}
      <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-50/80 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800/60">
        {icon}
        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          {title}
        </span>
        <span className="ml-auto text-[10px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums">
          {users.length}
        </span>
      </div>

      {/* Rows */}
      {visible.map((u, i) => (
        <ArrivalRow
          key={u.userId}
          user={u}
          group={group}
          cityName={cityName}
          onProfileClick={() => onProfileClick(u.userId)}
          isLast={i === visible.length - 1 && hidden <= 0}
        />
      ))}

      {/* View all link */}
      {!showAll && hidden > 0 && (
        <button
          type="button"
          className="w-full flex items-center justify-center gap-1 py-2 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 border-t border-gray-100 dark:border-gray-800/60 hover:bg-sky-50/30 dark:hover:bg-sky-900/10 transition-colors"
          onClick={() => setShowAll(true)}
        >
          View all {users.length} {group === "local" ? "locals" : group === "here" ? "travelers here" : "coming soon"}
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export function CityArrivalsWidget({ cityName }: Props) {
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();

  const { data, isLoading } = useQuery<CityPeopleData>({
    queryKey: ["/api/cities", cityName, "arrivals"],
    queryFn: async () => {
      const res = await fetch(
        `${getApiBaseUrl()}/api/cities/${encodeURIComponent(cityName)}/arrivals`,
        { credentials: "include" }
      );
      if (!res.ok) return { locals: [], hereNow: [], comingSoon: [] };
      return res.json();
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    enabled: !!cityName,
  });

  const locals = data?.locals ?? [];
  const hereNow = data?.hereNow ?? [];
  const comingSoon = data?.comingSoon ?? [];
  const travelerCount = hereNow.length + comingSoon.length;
  const total = locals.length + travelerCount;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-sky-100 dark:border-slate-700 overflow-hidden animate-pulse">
        {/* Skeleton header */}
        <div className="h-11 bg-slate-800 dark:bg-slate-950" />
        {/* Skeleton rows */}
        <div className="bg-white dark:bg-gray-900">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
              <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                <div className="h-2 bg-gray-100 dark:bg-gray-700/60 rounded w-16" />
              </div>
              <div className="h-5 bg-gray-100 dark:bg-gray-700/60 rounded-full w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || total === 0) return null;

  const currentUserHometown = ((currentUser as any)?.hometownCity || "").toLowerCase();
  const cityLower = cityName.toLowerCase();
  const isCurrentUserLocal =
    currentUserHometown === cityLower || currentUserHometown.startsWith(cityLower + ",");

  const sections: Array<{
    key: string;
    title: string;
    icon: React.ReactNode;
    users: CityUser[];
    group: "local" | "here" | "soon";
  }> = isCurrentUserLocal
    ? [
        { key: "here",  title: "Here now",    icon: <Plane className="w-3 h-3 text-emerald-500" />, users: hereNow,    group: "here"  },
        { key: "soon",  title: "Coming soon",  icon: <Clock className="w-3 h-3 text-sky-500"     />, users: comingSoon, group: "soon"  },
        { key: "local", title: "Locals",       icon: <Home  className="w-3 h-3 text-blue-500"    />, users: locals,     group: "local" },
      ]
    : [
        { key: "local", title: "Locals",       icon: <Home  className="w-3 h-3 text-blue-500"    />, users: locals,     group: "local" },
        { key: "here",  title: "Here now",    icon: <Plane className="w-3 h-3 text-emerald-500" />, users: hereNow,    group: "here"  },
        { key: "soon",  title: "Coming soon",  icon: <Clock className="w-3 h-3 text-sky-500"     />, users: comingSoon, group: "soon"  },
      ];

  return (
    <div className="rounded-2xl border border-sky-100 dark:border-slate-700 overflow-hidden shadow-sm">
      {/* Airport-board header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-2.5 flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-base leading-none">✈️</span>
          <div>
            <p className="text-white font-bold text-sm leading-tight tracking-tight">
              Visiting {cityName}
            </p>
            <p className="text-slate-400 text-[10px] leading-tight font-medium tracking-wide">
              {[
                hereNow.length > 0 && `${hereNow.length} here now`,
                comingSoon.length > 0 && `${comingSoon.length} coming soon`,
                locals.length > 0 && `${locals.length} locals`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* Arrival board rows */}
      <div className="bg-white dark:bg-gray-900 divide-y-0">
        {sections.map((s) => (
          <ArrivalSection
            key={s.key}
            title={s.title}
            icon={s.icon}
            users={s.users}
            group={s.group}
            cityName={cityName}
            onProfileClick={(id) => setLocation(`/profile/${id}`)}
          />
        ))}

        {comingSoon.length > 0 && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center py-2 border-t border-gray-100 dark:border-gray-800/60">
            ♥ save a traveler to be notified when they arrive
          </p>
        )}
      </div>
    </div>
  );
}
