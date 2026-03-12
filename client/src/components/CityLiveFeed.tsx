import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Zap, Plane, CalendarPlus, Users, Star } from "lucide-react";
import { getDisplayName } from "@/lib/displayName";

interface FeedItem {
  feed_type: string;
  related_id: number | null;
  related_title: string | null;
  user_id: number;
  created_at: string;
  link_url: string | null;
  username: string;
  profile_image: string | null;
  user_type: string | null;
  name: string | null;
  first_name: string | null;
}

function feedIcon(feedType: string) {
  switch (feedType) {
    case "event_created":
      return <CalendarPlus className="w-3.5 h-3.5 text-blue-500" />;
    case "traveler_arrived":
      return <Plane className="w-3.5 h-3.5 text-orange-500" />;
    case "went_available_now":
      return <Zap className="w-3.5 h-3.5 text-green-500" />;
    case "event_rsvp":
      return <Users className="w-3.5 h-3.5 text-purple-500" />;
    case "event_interested":
      return <Star className="w-3.5 h-3.5 text-yellow-500" />;
    default:
      return <Zap className="w-3.5 h-3.5 text-gray-400" />;
  }
}

function feedText(item: FeedItem): string {
  const name = getDisplayName({ username: item.username, firstName: item.first_name, name: item.name });
  switch (item.feed_type) {
    case "event_created":
      return `${name} created "${item.related_title}"`;
    case "traveler_arrived":
      return `${name} is heading to ${item.related_title || "town"}`;
    case "went_available_now":
      return item.related_title
        ? `${name} is available — "${item.related_title}"`
        : `${name} is open to meet right now`;
    case "event_rsvp":
      return `${name} is going to "${item.related_title}"`;
    case "event_interested":
      return `${name} is interested in "${item.related_title}"`;
    default:
      return `${name} did something`;
  }
}

interface Props {
  cityName: string;
}

export function CityLiveFeed({ cityName }: Props) {
  const { data: items = [], isLoading } = useQuery<FeedItem[]>({
    queryKey: ["/api/city-live-feed", cityName],
    queryFn: async () => {
      const res = await fetch(`/api/city-live-feed/${encodeURIComponent(cityName)}`);
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading || items.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <Zap className="w-4 h-4 text-orange-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Live in {cityName}
        </h3>
        <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Live
        </span>
      </div>

      <ul className="divide-y divide-gray-50 dark:divide-gray-800/60">
        {items.map((item, idx) => {
          const profileUrl = `/profile/${item.user_id}`;
          const actionUrl = item.link_url || profileUrl;
          return (
            <li key={`${item.feed_type}-${item.related_id}-${idx}`} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
              <Link href={profileUrl}>
                <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 cursor-pointer">
                  {item.profile_image ? (
                    <img
                      src={item.profile_image}
                      alt={item.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
                      {item.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={actionUrl}>
                  <p className="text-xs text-gray-800 dark:text-gray-200 leading-snug line-clamp-2 cursor-pointer hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                    <span className="inline-flex items-center gap-0.5 mr-1 align-middle">
                      {feedIcon(item.feed_type)}
                    </span>
                    {feedText(item)}
                  </p>
                </Link>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
