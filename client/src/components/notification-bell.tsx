import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, MessageCircle, UserPlus, Zap, Users, Handshake } from "lucide-react";
import websocketService from "@/services/websocketService";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface NotificationBellProps {
  userId: number;
}

interface ConnectionRequest {
  id: number;
  status: string;
  createdAt: string;
  requesterUser: {
    id: number;
    username: string;
    name: string;
    profileImage?: string;
  };
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  isRead?: boolean;
}

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

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Fetch pending connection requests
  const { data: connectionRequests = [] } = useQuery<ConnectionRequest[]>({
    queryKey: [`/api/connections/${userId}/requests`],
    enabled: !!userId,
  });

  // Fetch messages to count unread ones
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: [`/api/messages/${userId}`],
    enabled: !!userId,
  });

  // Fetch general notifications (including meetup notifications)
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: [`/api/notifications/${userId}`],
    enabled: !!userId,
    refetchInterval: 30000,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${userId}`] });
    },
  });

  // Count unread messages
  const unreadMessages = messages.filter(
    (message) => message.receiverId === userId && !message.isRead
  );

  // Filter unread meetup notifications
  const meetupNotifications = notifications.filter(
    (n) => !n.isRead && (n.type === 'quick_meetup_nearby' || n.type === 'quick_meetup_joined')
  );

  // Filter unread Available Now meet request notifications
  const meetRequestNotifications = notifications.filter(
    (n) => !n.isRead && n.type === 'available_now_meet_request'
  );

  const totalNotifications = connectionRequests.length + unreadMessages.length + meetupNotifications.length + meetRequestNotifications.length;

  // Real-time: when server pushes a notification via WebSocket, refetch so bell updates immediately
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;
  useEffect(() => {
    const onNotification = () => {
      queryClientRef.current.invalidateQueries({ queryKey: [`/api/notifications/${userId}`] });
      queryClientRef.current.invalidateQueries({ queryKey: ["/api/available-now/requests"] });
    };
    websocketService.on("notification", onNotification);
    return () => {
      websocketService.off("notification", onNotification);
    };
  }, [userId]);

  const handleMeetupNotificationClick = (notification: Notification) => {
    markAsReadMutation.mutate(notification.id);
    try {
      const data = notification.data ? JSON.parse(notification.data) : {};
      if (data.meetupId) {
        setLocation(`/quick-meetups?id=${data.meetupId}`);
      } else {
        setLocation('/quick-meetups');
      }
    } catch {
      setLocation('/quick-meetups');
    }
  };

  const handleMeetRequestNotificationClick = (notification: Notification) => {
    markAsReadMutation.mutate(notification.id);
    setLocation('/home');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative p-0 bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent data-[state=open]:bg-transparent focus-visible:ring-0 focus:outline-none border-0 shadow-none cursor-pointer"
          style={{ background: 'transparent !important' }}
        >
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          {totalNotifications > 0 && (
            <div className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-semibold bg-red-500 text-white rounded-full">
              {totalNotifications > 9 ? "9+" : totalNotifications}
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-white dark:bg-gray-900 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="text-gray-900 dark:text-white">Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {totalNotifications === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            No new notifications
          </div>
        ) : (
          <>
            {/* Available Now meet request notifications - Show first for urgency */}
            {meetRequestNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-pointer p-3 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                onClick={() => handleMeetRequestNotificationClick(notification)}
              >
                <div className="flex items-center gap-3 w-full">
                  <Handshake className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-300 truncate">
                      {notification.message}
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    New
                  </Badge>
                </div>
              </DropdownMenuItem>
            ))}
            {(meetRequestNotifications.length > 0) && (meetupNotifications.length > 0 || connectionRequests.length > 0 || unreadMessages.length > 0) && (
              <DropdownMenuSeparator />
            )}

            {/* Quick Meetup Notifications */}
            {meetupNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-pointer p-3 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                onClick={() => handleMeetupNotificationClick(notification)}
              >
                <div className="flex items-center gap-3 w-full">
                  {notification.type === 'quick_meetup_nearby' ? (
                    <Zap className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  ) : (
                    <Users className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-300 truncate">
                      {notification.message}
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    New
                  </Badge>
                </div>
              </DropdownMenuItem>
            ))}
            
            {meetupNotifications.length > 0 && (connectionRequests.length > 0 || unreadMessages.length > 0) && (
              <DropdownMenuSeparator />
            )}

            {/* Connection Requests */}
            {connectionRequests.length > 0 && (
              <>
                <DropdownMenuItem
                  className="cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => setLocation("/requests")}
                >
                  <div className="flex items-center gap-3 w-full">
                    <UserPlus className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {connectionRequests.length} Connection Request{connectionRequests.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-300 truncate">
                        {connectionRequests.length === 1 
                          ? `From ${connectionRequests[0]?.requesterUser?.username || 'Unknown user'}`
                          : `From ${connectionRequests[0]?.requesterUser?.username || 'Unknown user'} and ${connectionRequests.length - 1} other${connectionRequests.length > 2 ? 's' : ''}`
                        }
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                      {connectionRequests.length}
                    </Badge>
                  </div>
                </DropdownMenuItem>
                {unreadMessages.length > 0 && <DropdownMenuSeparator />}
              </>
            )}

            {/* Unread Messages */}
            {unreadMessages.length > 0 && (
              <DropdownMenuItem
                className="cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => setLocation("/messages")}
              >
                <div className="flex items-center gap-3 w-full">
                  <MessageCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {unreadMessages.length} Unread Message{unreadMessages.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-300 truncate">
                      {unreadMessages.length === 1 
                        ? `New message received`
                        : `${unreadMessages.length} new messages`
                      }
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    {unreadMessages.length}
                  </Badge>
                </div>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
