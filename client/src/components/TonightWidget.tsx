import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Calendar, Users, Plane, Zap, ChevronRight } from "lucide-react";
import { SimpleAvatar } from "@/components/simple-avatar";
import { getApiBaseUrl } from "@/lib/queryClient";
import { useAuth } from "@/App";

interface TonightEvent {
  id: number;
  title: string;
  date: string;
  category: string;
  venueName: string | null;
  location: string;
  imageUrl: string | null;
}

interface TonightTraveler {
  userId: number;
  username: string;
  firstName: string | null;
  profileImage: string | null;
  hometownCity: string | null;
  hometownCountry: string | null;
}

interface TonightData {
  city: string;
  tonightEvents: TonightEvent[];
  availableNowCount: number;
  hereNowTravelers: TonightTraveler[];
}

interface Props {
  city: string;
}

function formatEventTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TonightWidget({ city }: Props) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data, isLoading } = useQuery<TonightData>({
    queryKey: ["/api/tonight", city],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/tonight/${encodeURIComponent(city)}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    enabled: !!city,
  });

  if (isLoading) return null;

  const hasEvents = (data?.tonightEvents?.length ?? 0) > 0;
  const hasAvailable = (data?.availableNowCount ?? 0) > 0;
  const hasTravelers = (data?.hereNowTravelers?.length ?? 0) > 0;

  if (!hasEvents && !hasAvailable && !hasTravelers) return null;

  const displayCity = city.split(",")[0].trim();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-orange-200 dark:border-orange-900/40 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 pt-3.5 pb-2 flex items-center gap-2 border-b border-orange-100 dark:border-orange-900/30">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse flex-shrink-0" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
            Tonight in {displayCity}
          </h3>
        </div>
        <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-500 font-medium">Live</span>
      </div>

      <div className="p-4 space-y-4">

        {/* Open to Meet Right Now */}
        {hasAvailable && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Open to Meet
              </span>
            </div>
            <button
              onClick={() => setLocation("/quick-meetups")}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  {data!.availableNowCount} {data!.availableNowCount === 1 ? "person" : "people"} available now
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          </div>
        )}

        {/* Events Tonight */}
        {hasEvents && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Events Tonight
              </span>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                {data!.tonightEvents.length}
              </span>
            </div>
            <div className="space-y-1">
              {data!.tonightEvents.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setLocation(`/events/${ev.id}`)}
                  className="w-full flex items-center gap-2.5 py-2 px-0.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left group"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center overflow-hidden">
                    {ev.imageUrl ? (
                      <img src={ev.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Calendar className="w-4 h-4 text-orange-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
                      {ev.title}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5 truncate">
                      {formatEventTime(ev.date)}{ev.venueName ? ` · ${ev.venueName}` : ""}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Here Right Now travelers */}
        {hasTravelers && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Plane className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Travelers Here Now
              </span>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                {data!.hereNowTravelers.length}
              </span>
            </div>
            {/* Avatar strip */}
            <div className="flex items-center gap-1">
              {data!.hereNowTravelers.slice(0, 6).map((t) => (
                <button
                  key={t.userId}
                  onClick={() => setLocation(`/profile/${t.userId}`)}
                  title={t.firstName || `@${t.username}`}
                  className="flex-shrink-0 ring-2 ring-white dark:ring-gray-900 rounded-full hover:ring-orange-300 dark:hover:ring-orange-600 transition-all"
                >
                  <SimpleAvatar
                    user={{ id: t.userId, username: t.username, profileImage: t.profileImage }}
                    size="sm"
                  />
                </button>
              ))}
              {data!.hereNowTravelers.length > 6 && (
                <button
                  onClick={() => setLocation("/discover")}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-900 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                    +{data!.hereNowTravelers.length - 6}
                  </span>
                </button>
              )}
              {user && (
                <button
                  onClick={() => setLocation("/discover")}
                  className="ml-auto text-[11px] font-semibold text-orange-500 dark:text-orange-400 hover:underline flex-shrink-0"
                >
                  View all
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default TonightWidget;
