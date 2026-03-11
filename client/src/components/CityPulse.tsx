import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getApiBaseUrl } from "@/lib/queryClient";

interface CityPulseData {
  city: string;
  newTravelers: number;
  openToMeet: number;
  eventsThisWeek: number;
  eventsCreatedToday: number;
  connectionsToday: number;
  newMembersToday: number;
}

interface CityPulseProps {
  city: string | undefined;
}

export function CityPulse({ city }: CityPulseProps) {
  const [, setLocation] = useLocation();
  const queryCity = city || "Los Angeles";

  const { data } = useQuery<CityPulseData>({
    queryKey: ["/api/city-pulse", queryCity],
    queryFn: async () => {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/city-pulse?city=${encodeURIComponent(queryCity)}`);
      if (!res.ok) throw new Error("Failed to fetch city pulse");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });

  if (!data) return null;

  const pills: { emoji: string; count: number; label: string; onClick: () => void }[] = [
    {
      emoji: "👋",
      count: data.newTravelers,
      label: "new travelers today",
      onClick: () => setLocation("/discover"),
    },
    {
      emoji: "🟢",
      count: data.openToMeet,
      label: "open to meet now",
      onClick: () => setLocation("/meetups"),
    },
    {
      emoji: "📅",
      count: data.eventsThisWeek,
      label: "events this week",
      onClick: () => setLocation("/events"),
    },
    {
      emoji: "🎉",
      count: data.eventsCreatedToday,
      label: "events created today",
      onClick: () => setLocation("/events"),
    },
    {
      emoji: "🤝",
      count: data.connectionsToday,
      label: "new connections today",
      onClick: () => setLocation("/discover"),
    },
    {
      emoji: "👥",
      count: data.newMembersToday,
      label: `joined today in ${data.city}`,
      onClick: () => setLocation("/discover"),
    },
  ];

  const visiblePills = pills.filter((p) => p.count > 0);
  if (visiblePills.length === 0) return null;

  return (
    <div className="w-full bg-orange-50/80 dark:bg-gray-950 border-b border-orange-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div
          className="flex gap-3 px-4 py-2.5 overflow-x-auto"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {visiblePills.map((pill) => (
            <button
              key={pill.label}
              onClick={pill.onClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800/80 border border-orange-200 dark:border-gray-700 whitespace-nowrap shrink-0 transition-colors hover:border-orange-300 dark:hover:border-gray-500 shadow-sm"
            >
              <span className={pill.emoji === "🟢" ? "city-pulse-live-dot" : ""}>
                {pill.emoji}
              </span>
              <span className="font-bold text-[13px] text-orange-500 dark:text-[#FF6B35]">
                {pill.count}
              </span>
              <span className="text-[12px] font-medium text-gray-700 dark:text-white/70">
                {pill.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
