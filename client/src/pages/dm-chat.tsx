import React, { useState, useEffect, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import WhatsAppChat from "@/components/WhatsAppChat";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, User, Zap } from "lucide-react";
import { AuthContext } from "@/App";
import { getApiBaseUrl } from "@/lib/queryClient";
import { ChatPageSkeleton } from "@/components/ui/chat-page-skeleton";
import { WhatYouHaveInCommon } from "@/components/what-you-have-in-common";
import { getProfileImageUrl, SimpleAvatar } from "@/components/simple-avatar";

interface UserDetails {
  id: number;
  username: string;
  name: string;
  profileImage?: string;
  profilePhoto?: string;
  hometown?: string;
  hometownCity?: string;
  hometownState?: string;
  hometownCountry?: string;
  currentCity?: string;
  isOnline?: boolean;
  userType?: string;
}

function getOtherUserIdFromLocation(location: string): number {
  const pathParts = location.split('?')[0].split('/').filter(Boolean);
  const pathId = pathParts[1];
  let numFromPath = pathId && !isNaN(parseInt(pathId, 10)) ? parseInt(pathId, 10) : 0;
  if (!numFromPath && typeof window !== 'undefined') {
    const winPath = window.location.pathname.split('/').filter(Boolean);
    const winId = winPath[1];
    numFromPath = winId && !isNaN(parseInt(winId, 10)) ? parseInt(winId, 10) : 0;
  }
  if (numFromPath) return numFromPath;
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const q = params.get('userId') || params.get('user');
  const numFromQuery = q && !isNaN(parseInt(q, 10)) ? parseInt(q, 10) : 0;
  return numFromQuery;
}

export default function DMChat() {
  const [location, setLocation] = useLocation();
  const otherUserId = useMemo(() => getOtherUserIdFromLocation(location), [location]);

  const authContext = useContext(AuthContext);
  const contextUser = authContext?.user;
  const authLoading = authContext?.authLoading;
  const [resolvedUser, setResolvedUser] = useState<any>(contextUser ?? {});

  useEffect(() => {
    if (contextUser?.id) {
      setResolvedUser(contextUser);
      return;
    }
    setResolvedUser({});
  }, [contextUser?.id]);

  const user = resolvedUser;

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log("💬 DMChat debug", {
      location,
      otherUserId,
      resolvedUserId: user?.id,
      has_user_key: !!localStorage.getItem("user"),
      has_travelconnect_user_key: !!localStorage.getItem("travelconnect_user"),
      has_current_user_key: !!localStorage.getItem("current_user"),
    });
  }, [location, otherUserId, user?.id]);

  const { data: otherUser, isLoading, isError } = useQuery<UserDetails>({
    queryKey: ['/api/users', otherUserId],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/users/${otherUserId}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    enabled: !!otherUserId,
    retry: 2,
    retryDelay: 1000
  });

  if (!otherUserId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">Invalid conversation</p>
        <Button onClick={() => setLocation('/messages')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Messages
        </Button>
      </div>
    );
  }

  if (!user?.id) {
    if (authLoading) return <ChatPageSkeleton variant="dark" />;
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">Please log in to view this conversation</p>
        <Button onClick={() => setLocation('/messages')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Messages
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <ChatPageSkeleton variant="dark" />;
  }

  if (isError || !otherUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">User not found</p>
        <Button onClick={() => setLocation('/messages')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Messages
        </Button>
      </div>
    );
  }

  const getFirstName = (fullName: string | null | undefined): string => {
    if (!fullName || fullName.trim() === '') return '';
    return fullName.trim().split(' ')[0] || '';
  };

  const displayName = otherUser.username || getFirstName(otherUser.name) || 'User';
  const avatarUrl = getProfileImageUrl(otherUser);
  const cityDisplay = otherUser.currentCity || otherUser.hometownCity || otherUser.hometown || null;
  const isOnline = otherUser.isOnline ?? false;

  const chatComponent = (
    <WhatsAppChat
      chatId={otherUserId}
      chatType="dm"
      title={displayName}
      subtitle={otherUser.hometown || "Direct Message"}
      currentUserId={user.id}
      otherUserUsername={otherUser.username}
      otherUserProfileImage={otherUser.profileImage}
    />
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* LEFT PANEL — desktop only, 30% width */}
      <aside className="hidden md:flex flex-col w-[300px] lg:w-[340px] xl:w-[380px] shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">

        {/* Profile section */}
        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800">

          {/* Back to messages */}
          <button
            onClick={() => setLocation('/messages')}
            className="self-start flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Messages
          </button>

          {/* Avatar with online indicator */}
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
              />
            ) : (
              <SimpleAvatar user={otherUser} size="xl" className="w-24 h-24 text-2xl" />
            )}
            {isOnline && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
            )}
          </div>

          {/* Username + status */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              @{displayName}
            </h2>
            {isOnline ? (
              <p className="text-green-500 text-sm font-medium mt-0.5">Online</p>
            ) : (
              <p className="text-gray-400 text-sm mt-0.5">Offline</p>
            )}
          </div>

          {/* City */}
          {cityDisplay && (
            <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              {cityDisplay}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 w-full mt-1">
            <Button
              onClick={() => setLocation(`/profile/${otherUserId}`)}
              variant="outline"
              className="w-full gap-2 text-sm border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              <User className="w-4 h-4" />
              View Full Profile
            </Button>
            <Button
              onClick={() => setLocation('/quick-meetups')}
              className="w-full gap-2 text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0"
            >
              <Zap className="w-4 h-4" />
              Quick Meetup
            </Button>
          </div>
        </div>

        {/* What You Have In Common */}
        {user?.id && otherUserId && (
          <div className="px-4 py-4">
            <WhatYouHaveInCommon
              currentUserId={user.id}
              otherUserId={otherUserId}
            />
          </div>
        )}
      </aside>

      {/* RIGHT PANEL — chat (full width on mobile, 70% on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {chatComponent}
      </div>
    </div>
  );
}
