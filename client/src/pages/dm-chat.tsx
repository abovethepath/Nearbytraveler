import React, { useState, useEffect, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import WhatsAppChat from "@/components/WhatsAppChat";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, User, Plane, Users, Star } from "lucide-react";
import { AuthContext } from "@/App";
import { getApiBaseUrl } from "@/lib/queryClient";
import { ChatPageSkeleton } from "@/components/ui/chat-page-skeleton";
import { getProfileImageUrl, SimpleAvatar } from "@/components/simple-avatar";
import { computeCommonStats } from "@/lib/whatYouHaveInCommonStats";

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

  const { data: compatibilityData } = useQuery<any>({
    queryKey: [`/api/compatibility/${user?.id}/${otherUserId}`],
    enabled: !!user?.id && !!otherUserId,
  });

  const { data: mutualConnections = [] } = useQuery<any[]>({
    queryKey: [`/api/mutual-connections/${user?.id}/${otherUserId}`],
    enabled: !!user?.id && !!otherUserId,
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

  // Hometown — the permanent base city
  const hometownDisplay = otherUser.hometownCity || otherUser.hometown || null;

  // Travel destination — only show if currentCity differs from hometown (they are traveling)
  const travelDestination = (() => {
    const current = otherUser.currentCity?.trim();
    const home = hometownDisplay?.trim();
    if (!current || !home) return null;
    return current.toLowerCase() !== home.toLowerCase() ? current : null;
  })();

  // Counts for the stat pills
  const commonStats = computeCommonStats(compatibilityData ?? null, {
    mutualCount: Array.isArray(mutualConnections) ? mutualConnections.length : 0
  });
  const thingsInCommonCount = commonStats.totalCommon;
  const contactsInCommonCount = Array.isArray(mutualConnections) ? mutualConnections.length : 0;

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
    <div className="flex overflow-hidden">
      {/* LEFT PANEL — desktop only, same height as WhatsAppChat so layout locks perfectly */}
      <aside className="hidden md:flex flex-col w-[280px] lg:w-[300px] xl:w-[320px] shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-hidden h-[calc(100dvh-5.5rem)]">
        <div className="flex flex-col items-center gap-4 px-6 pt-8 pb-8">

          {/* Back to messages */}
          <button
            onClick={() => setLocation('/messages')}
            className="self-start flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Messages
          </button>

          {/* Avatar */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-28 h-28 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
            />
          ) : (
            <SimpleAvatar user={otherUser} size="xl" className="w-28 h-28 text-3xl" />
          )}

          {/* Username */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight text-center">
            @{displayName}
          </h2>

          {/* Hometown */}
          {hometownDisplay && (
            <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              {hometownDisplay}
            </p>
          )}

          {/* Travel destination — only when actively traveling */}
          {travelDestination && (
            <p className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 font-medium">
              <Plane className="w-3.5 h-3.5 shrink-0" />
              Traveling to {travelDestination}
            </p>
          )}

          {/* View Full Profile button */}
          <Button
            onClick={() => setLocation(`/profile/${otherUserId}`)}
            variant="outline"
            className="w-full gap-2 text-sm border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:text-orange-600 dark:hover:text-orange-400 transition-colors mt-1"
          >
            <User className="w-4 h-4" />
            View Full Profile
          </Button>

          {/* Stats row */}
          <div className="flex gap-3 w-full mt-1">
            <div className="flex-1 flex flex-col items-center gap-1 rounded-xl bg-gray-50 dark:bg-gray-800 py-3 px-2">
              <div className="flex items-center gap-1.5 text-orange-500">
                <Star className="w-4 h-4" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">{thingsInCommonCount}</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight">Things in Common</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1 rounded-xl bg-gray-50 dark:bg-gray-800 py-3 px-2">
              <div className="flex items-center gap-1.5 text-blue-500">
                <Users className="w-4 h-4" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">{contactsInCommonCount}</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight">Contacts in Common</span>
            </div>
          </div>

        </div>
      </aside>

      {/* RIGHT PANEL — chat (full width on mobile, 70% on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {chatComponent}
      </div>
    </div>
  );
}
