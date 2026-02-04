import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Zap, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface Notification {
  id: number;
  userId: number;
  fromUserId?: number;
  type: string;
  title: string;
  message: string;
  data?: string;
  isRead: boolean;
  createdAt: string;
}

interface MeetupAlertBannerProps {
  userId: number;
}

export function MeetupAlertBanner({ userId }: MeetupAlertBannerProps) {
  const [, setLocation] = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: [`/api/notifications/${userId}`],
    enabled: !!userId,
    refetchInterval: 30000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('PUT', `/api/notifications/${userId}/read-all`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${userId}`] });
    },
  });

  const meetupNotifications = notifications.filter(
    (n) => !n.isRead && n.type === 'quick_meetup_nearby'
  );

  if (dismissed || meetupNotifications.length === 0) {
    return null;
  }

  const latestMeetup = meetupNotifications[0];

  const handleViewMeetups = () => {
    try {
      const data = latestMeetup.data ? JSON.parse(latestMeetup.data) : {};
      if (data.meetupId) {
        setLocation(`/quick-meetups?id=${data.meetupId}`);
      } else {
        setLocation('/quick-meetups');
      }
    } catch {
      setLocation('/quick-meetups');
    }
  };

  const handleDismiss = () => {
    markAllReadMutation.mutate();
    setDismissed(true);
  };

  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-lg shadow-lg mb-4 animate-pulse-once">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">
              {meetupNotifications.length === 1 
                ? "Someone wants to meet nearby!" 
                : `${meetupNotifications.length} new meetups in your area!`}
            </p>
            <p className="text-xs text-orange-100 truncate">
              {latestMeetup.message}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="secondary"
            className="bg-white text-orange-600 hover:bg-orange-50 text-xs px-3"
            onClick={handleViewMeetups}
          >
            View <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
