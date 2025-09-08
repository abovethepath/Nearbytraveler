import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, MessageCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [, setLocation] = useLocation();

  // Fetch pending connection requests
  const { data: connectionRequests = [] } = useQuery<ConnectionRequest[]>({
    queryKey: [`/api/connections/${userId}/requests`],
    enabled: !!userId,
    select: (data) => {
      console.log('Connection requests received:', data);
      return data;
    }
  });

  // Fetch messages to count unread ones
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: [`/api/messages/${userId}`],
    enabled: !!userId,
  });

  // Count unread messages (messages where current user is receiver and isRead is false)
  const unreadMessages = messages.filter(
    (message) => message.receiverId === userId && !message.isRead
  );

  const totalNotifications = connectionRequests.length + unreadMessages.length;

  const handleBellClick = () => {
    if (connectionRequests.length > 0) {
      setLocation("/profile");
    } else if (unreadMessages.length > 0) {
      setLocation("/messages");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 hover:bg-gray-100"
        >
          <Bell className="w-8 h-8 text-gray-600" />
          {totalNotifications > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {totalNotifications > 9 ? "9+" : totalNotifications}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="text-gray-900 dark:text-white">Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {totalNotifications === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            No new notifications
          </div>
        ) : (
          <>
            {/* Connection Requests */}
            {connectionRequests.length > 0 && (
              <>
                <DropdownMenuItem
                  className="cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => setLocation("/profile")}
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