import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, ExternalLink } from "lucide-react";

interface CommunityEvent {
  id: number;
  provider: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  venueName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  imageUrl: string | null;
  url: string | null;
  organizerName: string | null;
  category: string | null;
  isFree: boolean | null;
  priceInfo: string | null;
  attendeeCount: number | null;
  sharedByUsername: string;
  sharedByName: string;
  sharedByAvatar: string | null;
  integrationDisplayName: string | null;
}

export type { CommunityEvent };

function formatEventDate(dateStr: string): string {
  const eventDate = new Date(dateStr);
  const now = new Date();
  const diffTime = eventDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today, ${eventDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return `Tomorrow, ${eventDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  } else if (diffDays < 7) {
    return eventDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
  return eventDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function ExternalEventCard({ event }: { event: CommunityEvent }) {
  const providerColors: Record<string, { bg: string; text: string; border: string }> = {
    luma: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
    partiful: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-400", border: "border-pink-200 dark:border-pink-800" },
  };

  const colors = providerColors[event.provider] || providerColors.luma;

  const handleClick = () => {
    if (event.url) {
      window.open(event.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card
      className={`rounded-2xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-xl hover:shadow-2xl overflow-hidden transition-all duration-300 cursor-pointer text-left`}
      onClick={handleClick}
    >
      {event.imageUrl && (
        <div className="relative">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
          <div className="absolute top-3 left-3">
            <Badge className={`${colors.bg} ${colors.text} border ${colors.border} text-xs font-semibold`}>
              {event.provider === "luma" ? "Luma" : "Partiful"}
            </Badge>
          </div>
        </div>
      )}

      <div className="p-4 md:p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-gray-900 dark:text-white text-lg font-semibold leading-snug line-clamp-2 flex-1">
            {event.title}
          </h3>
          {!event.imageUrl && (
            <Badge className={`${colors.bg} ${colors.text} border ${colors.border} text-xs font-semibold shrink-0`}>
              {event.provider === "luma" ? "Luma" : "Partiful"}
            </Badge>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="h-4 w-4 shrink-0 text-travel-blue" />
            <span>{formatEventDate(event.startTime)}</span>
          </div>

          {(event.venueName || event.city) && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <MapPin className="h-4 w-4 shrink-0 text-travel-blue" />
              <span className="truncate">
                {event.venueName && `${event.venueName}, `}
                {event.city}
                {event.state && event.state !== event.city && `, ${event.state}`}
              </span>
            </div>
          )}

          {event.attendeeCount && event.attendeeCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Users className="h-4 w-4 shrink-0" />
              <span>{event.attendeeCount} attending</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {event.sharedByAvatar ? (
              <img src={event.sharedByAvatar} alt="" className="w-5 h-5 rounded-full" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                {event.sharedByName?.charAt(0) || '?'}
              </div>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Shared by <span className="font-medium text-gray-700 dark:text-gray-300">{event.sharedByUsername}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {event.isFree ? (
              <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                Free
              </Badge>
            ) : event.priceInfo ? (
              <Badge variant="outline" className="text-xs text-gray-600 dark:text-gray-400">
                {event.priceInfo}
              </Badge>
            ) : null}
            {event.url && (
              <ExternalLink className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
