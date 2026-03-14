import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, MessageCircle, UserPlus, Zap, Users, Handshake, Plane } from "lucide-react";
import websocketService from "@/services/websocketService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    location?: string;
    hometownCity?: string;
    hometownState?: string;
    hometownCountry?: string;
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
  const [open, setOpen] = useState(false);

  const formatTimeAgo = (dateString: string) => {
    const t = new Date(dateString).getTime();
    if (!Number.isFinite(t)) return "";
    const diffMs = Date.now() - t;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Fetch pending connection requests
  const { data: connectionRequests = [] } = useQuery<ConnectionRequest[]>({
    queryKey: [`/api/connections/${userId}/requests`],
    enabled: !!userId,
    // If the user is offline (or WS isn't connected), still surface new requests without a full reload.
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
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

  // Mark all notifications as read (when opening the notifications panel)
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PUT", `/api/notifications/${userId}/read-all`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${userId}`] });
    },
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

  // Filter unread DM notifications (one per sender, with sender info embedded in data)
  const messageNotifications = notifications.filter(
    (n) => !n.isRead && n.type === 'new_message'
  );

  // Filter chatroom invite notifications
  const chatroomInviteNotifications = notifications.filter(
    (n) => !n.isRead && n.type === 'chatroom_invite'
  );

  // Catch-all: any other unread notification type not handled by a specific group above
  const HANDLED_TYPES = new Set(['quick_meetup_nearby', 'quick_meetup_joined', 'available_now_meet_request', 'new_message', 'chatroom_invite']);
  const generalNotifications = notifications.filter(
    (n) => !n.isRead && !HANDLED_TYPES.has(n.type)
  );

  const respondToConnectionRequestMutation = useMutation({
    mutationFn: async ({ connectionId, status }: { connectionId: number; status: "accepted" | "rejected" }) => {
      return await apiRequest("PUT", `/api/connections/${connectionId}`, { status });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [`/api/connections/${userId}/requests`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/connections/${userId}`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/notifications/${userId}`] });
    },
  });

  const respondToChatroomInviteMutation = useMutation({
    mutationFn: async ({ notificationId, action }: { notificationId: number; action: "accept" | "decline" }) => {
      return await apiRequest("POST", `/api/chatroom-invites/${notificationId}/${action}`);
    },
    onSuccess: async (res, { action }) => {
      await queryClient.invalidateQueries({ queryKey: [`/api/notifications/${userId}`] });
      if (action === "accept") {
        const data = await res.json().catch(() => ({}));
        if (data.chatroomId) {
          setLocation(`/meetup-chatroom-chat/${data.chatroomId}?title=${encodeURIComponent(data.chatroomName || 'Chat')}&subtitle=Group+chat`);
        }
      }
    },
  });

  // Badge count: unread notifications (includes new_message) + any raw unread DMs not yet in notifications
  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;
  // Avoid double-counting: if we have new_message notifications, use those for the message count
  const rawUnreadCount = messageNotifications.length > 0 ? 0 : unreadMessages.length;
  const totalNotifications = rawUnreadCount + unreadNotificationCount;
  const hasAnyDropdownItems = totalNotifications > 0 || connectionRequests.length > 0 || generalNotifications.length > 0;

  // Real-time: when server pushes a notification via WebSocket, refetch so bell updates immediately
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;
  useEffect(() => {
    const onNotification = () => {
      queryClientRef.current.invalidateQueries({ queryKey: [`/api/notifications/${userId}`] });
      queryClientRef.current.invalidateQueries({ queryKey: [`/api/connections/${userId}/requests`] });
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
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen && userId) {
          const hasPendingInvites = notifications.some(
            (n) => !n.isRead && n.type === 'chatroom_invite'
          );
          if (!hasPendingInvites) {
            markAllAsReadMutation.mutate();
          } else {
            const nonActionableUnread = notifications.filter(
              (n) => !n.isRead && n.type !== 'chatroom_invite'
            );
            for (const n of nonActionableUnread) {
              markAsReadMutation.mutate(n.id);
            }
          }
        }
      }}
      modal={false}
    >
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
        
        {!hasAnyDropdownItems ? (
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
                <div className="px-2 pt-1 pb-2">
                  <div className="flex items-center justify-between px-1.5 pb-2">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Connection Requests</span>
                    </div>
                    <Badge variant="secondary">{connectionRequests.length}</Badge>
                  </div>

                  <div className="space-y-2">
                    {connectionRequests.slice(0, 3).map((req) => {
                      const username = req.requesterUser?.username || "unknown";
                      const displayCity =
                        req.requesterUser?.hometownCity ||
                        req.requesterUser?.location ||
                        "—";
                      const timeAgo = req.createdAt ? formatTimeAgo(req.createdAt) : "";

                      return (
                        <DropdownMenuItem
                          key={req.id}
                          className="cursor-default p-0 focus:bg-transparent"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <div className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2">
                            <div className="flex flex-col gap-2 w-full">
                              <button
                                type="button"
                                className="flex flex-col sm:flex-row sm:items-start gap-2 w-full text-left"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOpen(false);
                                  setLocation(`/profile/${req.requesterUser?.id}`);
                                }}
                              >
                                <div className="flex items-start gap-2 w-full min-w-0">
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-orange-500 flex items-center justify-center overflow-hidden shrink-0">
                                    {req.requesterUser?.profileImage ? (
                                      <img
                                        src={req.requesterUser.profileImage}
                                        alt={username}
                                        className="w-9 h-9 object-cover"
                                      />
                                    ) : (
                                      <span className="text-white text-xs font-bold">
                                        {username.slice(0, 2).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="text-sm font-semibold text-gray-900 dark:text-white break-all whitespace-normal">
                                        @{username}
                                      </span>
                                      {timeAgo && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 whitespace-nowrap">
                                          {timeAgo}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 break-words">
                                      {displayCity}
                                    </div>
                                  </div>
                                </div>
                              </button>

                              <div className="grid grid-cols-2 gap-2 w-full">
                                <Button
                                  size="sm"
                                  className="h-8 w-full bg-green-600 hover:bg-green-700 text-white"
                                  disabled={respondToConnectionRequestMutation.isPending}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpen(false);
                                    respondToConnectionRequestMutation.mutate({ connectionId: req.id, status: "accepted" });
                                  }}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 w-full"
                                  disabled={respondToConnectionRequestMutation.isPending}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpen(false);
                                    respondToConnectionRequestMutation.mutate({ connectionId: req.id, status: "rejected" });
                                  }}
                                >
                                  Decline
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}

                    {(connectionRequests.length > 3) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 text-xs text-gray-600 dark:text-gray-300"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpen(false);
                          setLocation("/requests");
                        }}
                      >
                        View all requests
                      </Button>
                    )}
                  </div>
                </div>
                {unreadMessages.length > 0 && <DropdownMenuSeparator />}
              </>
            )}

            {/* Chatroom Invites */}
            {chatroomInviteNotifications.length > 0 && (
              <>
                <div className="px-2 pt-1 pb-2">
                  <div className="flex items-center justify-between px-1.5 pb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Chat Invites</span>
                    </div>
                    <Badge variant="secondary">{chatroomInviteNotifications.length}</Badge>
                  </div>

                  <div className="space-y-2">
                    {chatroomInviteNotifications.slice(0, 5).map((notification) => {
                      let inviteData: Record<string, any> = {};
                      try { inviteData = notification.data ? JSON.parse(notification.data) : {}; } catch {}
                      const inviterName = inviteData.inviterName || "Someone";
                      const inviterUsername = inviteData.inviterUsername || "";
                      const chatName = inviteData.chatroomName || "a chatroom";
                      const inviterImage = inviteData.inviterProfileImage;
                      const timeAgo = notification.createdAt ? formatTimeAgo(notification.createdAt) : "";

                      return (
                        <DropdownMenuItem
                          key={notification.id}
                          className="cursor-default p-0 focus:bg-transparent"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <div className="w-full rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-2">
                            <div className="flex flex-col gap-2 w-full">
                              <div className="flex items-start gap-2 w-full">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center overflow-hidden shrink-0">
                                  {inviterImage ? (
                                    <img src={inviterImage} alt={inviterName} className="w-9 h-9 object-cover" />
                                  ) : (
                                    <span className="text-white text-xs font-bold">
                                      {inviterName.slice(0, 2).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white break-all whitespace-normal">
                                      {inviterName}
                                    </span>
                                    {timeAgo && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 whitespace-nowrap">
                                        {timeAgo}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-orange-700 dark:text-orange-300 font-medium">
                                    Personal invite to "{chatName}"
                                  </div>
                                  {inviterUsername && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      @{inviterUsername}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 w-full">
                                <Button
                                  size="sm"
                                  className="h-8 w-full bg-green-600 hover:bg-green-700 text-white"
                                  disabled={respondToChatroomInviteMutation.isPending}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpen(false);
                                    respondToChatroomInviteMutation.mutate({ notificationId: notification.id, action: "accept" });
                                  }}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 w-full"
                                  disabled={respondToChatroomInviteMutation.isPending}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpen(false);
                                    respondToChatroomInviteMutation.mutate({ notificationId: notification.id, action: "decline" });
                                  }}
                                >
                                  Decline
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                </div>
                {(messageNotifications.length > 0 || unreadMessages.length > 0 || generalNotifications.length > 0) && <DropdownMenuSeparator />}
              </>
            )}

            {/* Per-sender DM notifications (rich: avatar + sender + preview) */}
            {messageNotifications.map((notification) => {
              let senderUsername = '';
              let senderProfileImage: string | null = null;
              let msgPreview = notification.message;
              try {
                const d = notification.data ? JSON.parse(notification.data) : {};
                senderUsername = d.senderUsername || '';
                senderProfileImage = d.senderProfileImage || null;
                msgPreview = d.preview || notification.message;
              } catch {}
              const displayName = senderUsername ? `@${senderUsername}` : notification.title;
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="cursor-pointer p-3 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                  onClick={() => {
                    markAsReadMutation.mutate(notification.id);
                    setLocation(notification.fromUserId ? `/messages/${notification.fromUserId}` : '/messages');
                  }}
                >
                  <div className="flex items-center gap-3 w-full">
                    {senderProfileImage ? (
                      <img src={senderProfileImage} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-300 truncate">{msgPreview}</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      New
                    </Badge>
                  </div>
                </DropdownMenuItem>
              );
            })}

            {/* General notifications (saved_traveler_arrived + any future types) */}
            {generalNotifications.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {generalNotifications.map((notification) => {
                  let notifData: Record<string, any> = {};
                  try { notifData = notification.data ? JSON.parse(notification.data) : {}; } catch {}
                  const isTravelerArrival = notification.type === 'saved_traveler_arrived';
                  return (
                    <DropdownMenuItem
                      key={notification.id}
                      className="cursor-pointer p-3 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                      onClick={() => {
                        markAsReadMutation.mutate(notification.id);
                        if (isTravelerArrival && notifData.savedUserId) {
                          setLocation(`/profile/${notifData.savedUserId}`);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Plane className="w-4 h-4 text-orange-500 flex-shrink-0" />
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
                  );
                })}
              </>
            )}

            {/* Fallback: raw unread count when no new_message notifications exist yet */}
            {messageNotifications.length === 0 && unreadMessages.length > 0 && (
              <DropdownMenuItem
                className="cursor-pointer p-3 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                onClick={() => setLocation("/messages")}
              >
                <div className="flex items-center gap-3 w-full">
                  <MessageCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {unreadMessages.length} Unread Message{unreadMessages.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-300 truncate">
                      Tap to open messages
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
