import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Heart, MapPin, Calendar, Home, Plane, Clock } from "lucide-react";
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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function PersonCard({
  user,
  group,
  cityName,
  onProfileClick,
}: {
  user: CityUser;
  group: "local" | "here" | "soon";
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

  const displayName = (user.firstName || '').split(' ')[0] || `@${user.username}`;
  let from = user.hometownCity || user.hometownCountry || null;
  if (from && from.includes(",")) from = from.split(",")[0].trim();
  if (from) from = abbreviateCity(from);

  const config = {
    local: {
      dot: "bg-blue-400",
      badge: "Lives here",
      badgeCls: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800",
    },
    here: {
      dot: "bg-emerald-400",
      badge: "Here now",
      badgeCls: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800",
    },
    soon: {
      dot: "bg-sky-400",
      badge: "Coming soon",
      badgeCls: "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/40 border border-sky-200 dark:border-sky-800",
    },
  }[group];

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
        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${config.dot}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">
          {displayName}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${config.badgeCls}`}>
            {config.badge}
          </span>
          {group !== "local" && from && (
            <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              {from}
            </span>
          )}
        </div>
        {group === "soon" && (user.startDate || user.endDate) && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5 mt-1 leading-tight">
            <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
            {formatDate(user.startDate)}{user.endDate ? ` – ${formatDate(user.endDate)}` : ""}
          </p>
        )}
      </div>

      {group !== "local" && isLoggedIn && (
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

function GroupSection({
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
  if (users.length === 0) return null;
  const shown = users.slice(0, 5);
  const extra = users.length - shown.length;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        {icon}
        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {title}
        </span>
        <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-500 font-semibold">
          {users.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {shown.map((u) => (
          <PersonCard
            key={u.userId}
            user={u}
            group={group}
            cityName={cityName}
            onProfileClick={() => onProfileClick(u.userId)}
          />
        ))}
        {extra > 0 && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center py-1">
            +{extra} more
          </p>
        )}
      </div>
    </div>
  );
}

export function CityArrivalsWidget({ cityName }: Props) {
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();

  const { data, isLoading } = useQuery<CityPeopleData>({
    queryKey: ["/api/cities", cityName, "arrivals"],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/cities/${encodeURIComponent(cityName)}/arrivals`, {
        credentials: "include",
      });
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
  const total = locals.length + hereNow.length + comingSoon.length;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
        <div className="h-12 bg-gradient-to-r from-blue-400 to-orange-400 opacity-60" />
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

  // Determine if current user is a local here — show travelers first for locals
  const currentUserHometown = ((currentUser as any)?.hometownCity || "").toLowerCase();
  const cityLower = cityName.toLowerCase();
  const isCurrentUserLocal = currentUserHometown === cityLower || currentUserHometown.startsWith(cityLower + ",");

  const sections: Array<{
    key: string;
    title: string;
    icon: React.ReactNode;
    users: CityUser[];
    group: "local" | "here" | "soon";
  }> = isCurrentUserLocal
    ? [
        { key: "here",  title: "Here Now",           icon: <Plane className="w-3.5 h-3.5 text-emerald-500" />, users: hereNow,    group: "here"  },
        { key: "soon",  title: "Coming Soon",         icon: <Clock className="w-3.5 h-3.5 text-sky-500"     />, users: comingSoon, group: "soon"  },
        { key: "local", title: `Locals in ${cityName}`, icon: <Home  className="w-3.5 h-3.5 text-blue-500"    />, users: locals,     group: "local" },
      ]
    : [
        { key: "local", title: `Locals in ${cityName}`, icon: <Home  className="w-3.5 h-3.5 text-blue-500"    />, users: locals,     group: "local" },
        { key: "here",  title: "Here Now",           icon: <Plane className="w-3.5 h-3.5 text-emerald-500" />, users: hereNow,    group: "here"  },
        { key: "soon",  title: "Coming Soon",         icon: <Clock className="w-3.5 h-3.5 text-sky-500"     />, users: comingSoon, group: "soon"  },
      ];

  return (
    <div className="rounded-2xl border border-blue-200 dark:border-blue-900/40 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-orange-400 px-4 py-3 flex items-center gap-2.5">
        <div className="bg-white dark:bg-gray-900/25 rounded-lg p-1.5 flex-shrink-0">
          <Home className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight">People in {cityName}</p>
          <p className="text-white/75 text-[10px] leading-tight">
            {[
              locals.length > 0 && `${locals.length} locals`,
              hereNow.length > 0 && `${hereNow.length} here now`,
              comingSoon.length > 0 && `${comingSoon.length} coming soon`,
            ].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span className="bg-white dark:bg-gray-900/25 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
          {total}
        </span>
      </div>

      {/* Groups */}
      <div className="bg-white dark:bg-gray-900 p-3 space-y-4">
        {sections.map((s) => (
          <GroupSection
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
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center pt-1">
            ♥ save a traveler to be notified when they arrive
          </p>
        )}
      </div>
    </div>
  );
}
