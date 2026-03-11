import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plane, MapPin, Clock } from "lucide-react";
import { SimpleAvatar } from "@/components/simple-avatar";
import { getApiBaseUrl } from "@/lib/queryClient";

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
}

interface ArrivalsData {
  hereNow: ArrivalUser[];
  arrivingToday: ArrivalUser[];
  arrivingSoon: ArrivalUser[];
}

interface Props {
  cityName: string;
}

function daysUntil(dateStr: string | null): number {
  if (!dateStr) return 0;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ArrivalUserPill({ user, onClick }: { user: ArrivalUser; onClick: () => void }) {
  const displayName = user.firstName || `@${user.username}`;
  const from = user.hometownCity || user.hometownCountry || null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left min-w-0"
    >
      <div className="relative flex-shrink-0">
        <SimpleAvatar
          user={{ id: user.userId, username: user.username, profileImage: user.profileImage }}
          size="sm"
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">{displayName}</p>
        {from && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate leading-tight flex items-center gap-0.5">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            {from}
          </p>
        )}
      </div>
    </button>
  );
}

function Section({
  icon,
  label,
  sublabel,
  color,
  users,
  onUserClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  color: string;
  users: ArrivalUser[];
  onUserClick: (id: number) => void;
}) {
  if (users.length === 0) return null;
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center gap-2 mb-2">
        <span className={`flex items-center justify-center w-6 h-6 rounded-full ${color} flex-shrink-0`}>
          {icon}
        </span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">{label}</span>
        {sublabel && <span className="text-xs text-gray-500 dark:text-gray-400">{sublabel}</span>}
        <span className="ml-auto text-xs font-semibold text-gray-400">{users.length}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {users.map((u) => (
          <ArrivalUserPill key={u.userId} user={u} onClick={() => onUserClick(u.userId)} />
        ))}
      </div>
    </div>
  );
}

export function CityArrivalsWidget({ cityName }: Props) {
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<ArrivalsData>({
    queryKey: ["/api/cities", cityName, "arrivals"],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/cities/${encodeURIComponent(cityName)}/arrivals`);
      if (!res.ok) return { hereNow: [], arrivingToday: [], arrivingSoon: [] };
      return res.json();
    },
    staleTime: 3 * 60 * 1000,
    enabled: !!cityName,
  });

  const total = (data?.hereNow.length ?? 0) + (data?.arrivingToday.length ?? 0) + (data?.arrivingSoon.length ?? 0);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-3" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-28 bg-gray-100 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || total === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-orange-900/40 p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Plane className="w-4 h-4 text-orange-500" />
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Who's Coming to {cityName}</h3>
        <span className="ml-auto bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full">
          {total}
        </span>
      </div>

      <Section
        icon={<Clock className="w-3.5 h-3.5 text-white" />}
        label="Here Now"
        color="bg-emerald-500"
        users={data.hereNow}
        onUserClick={(id) => setLocation(`/profile/${id}`)}
      />

      <Section
        icon={<Plane className="w-3.5 h-3.5 text-white" />}
        label="Arriving Today"
        color="bg-orange-500"
        users={data.arrivingToday}
        onUserClick={(id) => setLocation(`/profile/${id}`)}
      />

      <Section
        icon={<Plane className="w-3.5 h-3.5 text-white" />}
        label="Coming Soon"
        sublabel="within 3 days"
        color="bg-blue-500"
        users={data.arrivingSoon}
        onUserClick={(id) => setLocation(`/profile/${id}`)}
      />
    </div>
  );
}
