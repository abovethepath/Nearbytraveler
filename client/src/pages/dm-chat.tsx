import React, { useState, useEffect, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import WhatsAppChat from "@/components/WhatsAppChat";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, User, Plane, Users, Star, X, UserPlus } from "lucide-react";
import GroupDMDialog from "@/components/GroupDMDialog";
import { AuthContext } from "@/App";
import { getApiBaseUrl } from "@/lib/queryClient";
import { ChatPageSkeleton } from "@/components/ui/chat-page-skeleton";
import { getProfileImageUrl, SimpleAvatar } from "@/components/simple-avatar";
import { computeCommonStats } from "@/lib/whatYouHaveInCommonStats";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WhatYouHaveInCommon } from "@/components/what-you-have-in-common";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const [showThingsModal, setShowThingsModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);

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

  const { data: otherUserTravelPlans = [] } = useQuery<any[]>({
    queryKey: [`/api/travel-plans/${otherUserId}`],
    enabled: !!otherUserId,
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
      <div className="flex flex-col items-center justify-center h-screen bg-[#0f1117] text-white gap-4">
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
      <div className="flex flex-col items-center justify-center h-screen bg-[#0f1117] text-white gap-4">
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

  const displayName = (otherUser as any).firstName || otherUser.username || getFirstName(otherUser.name) || 'User';
  const avatarUrl = getProfileImageUrl(otherUser);

  // Hometown — the permanent base city
  const hometownDisplay = otherUser.hometownCity || otherUser.hometown || null;

  // Travel destination — check active travel plan (within today's date range)
  const travelDestination = (() => {
    const now = new Date();
    const activePlan = (otherUserTravelPlans as any[]).find(plan => {
      const start = new Date(plan.startDate);
      const end = new Date(plan.endDate);
      return start <= now && end >= now;
    });
    if (!activePlan) return null;
    const dest = (activePlan.destination || activePlan.destinationCity || "").trim();
    const home = hometownDisplay?.trim() || "";
    if (!dest || dest.toLowerCase() === home.toLowerCase()) return null;
    return dest;
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
      subtitle={(() => {
        const loc = otherUser.hometownCity || otherUser.hometown || "";
        const firstName = (otherUser as any).firstName;
        const usernamePrefix = firstName && otherUser.username ? `@${otherUser.username}` : null;
        const cityDisplay = (() => {
          if (!loc) return null;
          const parts = loc.split(",").map((s: string) => s.trim());
          if (parts.length >= 3) {
            const country = parts[parts.length - 1];
            const isUS = /united states|usa|us/i.test(country);
            if (isUS) {
              const state = parts[parts.length - 2];
              const stateAbbr: Record<string, string> = { "Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA","Colorado":"CO","Connecticut":"CT","Delaware":"DE","Florida":"FL","Georgia":"GA","Hawaii":"HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA","Kansas":"KS","Kentucky":"KY","Louisiana":"LA","Maine":"ME","Maryland":"MD","Massachusetts":"MA","Michigan":"MI","Minnesota":"MN","Mississippi":"MS","Missouri":"MO","Montana":"MT","Nebraska":"NE","Nevada":"NV","New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND","Ohio":"OH","Oklahoma":"OK","Oregon":"OR","Pennsylvania":"PA","Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD","Tennessee":"TN","Texas":"TX","Utah":"UT","Vermont":"VT","Virginia":"VA","Washington":"WA","West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY" };
              return `${parts[0]}, ${stateAbbr[state] || state}`;
            }
            return `${parts[0]}, ${country}`;
          }
          return parts.length === 2 ? loc : parts[0];
        })();
        if (usernamePrefix && cityDisplay) return `${usernamePrefix} · ${cityDisplay}`;
        if (usernamePrefix) return usernamePrefix;
        return cityDisplay || "Direct Message";
      })()}
      currentUserId={user.id}
      otherUserUsername={otherUser.username}
      otherUserProfileImage={otherUser.profileImage}
    />
  );

  return (
    <div className="flex overflow-hidden h-full max-w-[1100px] mx-auto w-full">
      {/* LEFT PANEL — desktop only, same height as WhatsAppChat so layout locks perfectly */}
      <aside className="hidden md:flex flex-col w-[280px] lg:w-[300px] xl:w-[320px] shrink-0 overflow-hidden h-full border-l-[3px] border-r-[3px] border-[#e0e0e0] dark:border-[#2d2d2d]" style={{ backgroundColor: '#0d1117' }}>
        <div className="px-6 pt-5 pb-2">
          <button
            onClick={() => setLocation('/messages')}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Messages
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 px-6 pt-16 pb-8 flex-1 overflow-y-auto">

          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-28 h-28 rounded-full object-cover ring-2 ring-gray-700"
            />
          ) : (
            <SimpleAvatar user={otherUser} size="lg" className="!w-28 !h-28 text-3xl aspect-square" />
          )}

          <h2 className="text-xl font-bold text-white leading-tight text-center">
            {(otherUser as any).firstName || `@${displayName}`}
          </h2>
          {(otherUser as any).firstName && otherUser.username && (
            <p className="text-sm text-gray-400 -mt-1">@{otherUser.username}</p>
          )}

          {hometownDisplay && (
            <p className="flex items-center justify-center gap-1.5 text-sm text-gray-400">
              <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              {hometownDisplay}
            </p>
          )}

          {travelDestination && (
            <p className="flex items-center justify-center gap-1.5 text-sm text-blue-400 font-medium">
              <Plane className="w-3.5 h-3.5 shrink-0" />
              Traveling to {travelDestination}
            </p>
          )}

          <Button
            onClick={() => setLocation(`/profile/${otherUserId}`)}
            variant="outline"
            className="w-full gap-2 text-sm !bg-transparent border-gray-600 text-gray-200 hover:border-orange-500 hover:text-orange-500 dark:border-gray-700 dark:text-gray-300 dark:hover:border-orange-600 dark:hover:text-orange-400 hover:!bg-transparent transition-colors mt-1"
          >
            <User className="w-4 h-4" />
            View Full Profile
          </Button>

          <Button
            onClick={() => setShowGroupDialog(true)}
            variant="outline"
            className="w-full gap-2 text-sm !bg-transparent border-green-300 text-green-700 hover:border-green-500 hover:text-green-600 dark:border-green-800 dark:text-green-400 dark:hover:border-green-500 dark:hover:text-green-300 hover:!bg-transparent dark:hover:!bg-green-900/20 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add People to Chat
          </Button>

          <hr className="w-full border-gray-700" />

          <div className="flex justify-center gap-3 w-full">
            <button
              onClick={() => setShowThingsModal(true)}
              className="flex-1 flex flex-col items-center gap-1 rounded-xl bg-gray-800 py-3 px-2 cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-orange-500">
                <Star className="w-4 h-4" />
                <span className="text-lg font-bold text-white">{thingsInCommonCount}</span>
              </div>
              <span className="text-xs text-gray-400 text-center leading-tight">Things in Common</span>
            </button>
            <button
              onClick={() => setShowContactsModal(true)}
              className="flex-1 flex flex-col items-center gap-1 rounded-xl bg-gray-800 py-3 px-2 cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-blue-500">
                <Users className="w-4 h-4" />
                <span className="text-lg font-bold text-white">{contactsInCommonCount}</span>
              </div>
              <span className="text-xs text-gray-400 text-center leading-tight">{contactsInCommonCount === 1 ? 'Connection' : 'Connections'} in Common</span>
            </button>
          </div>

        </div>
      </aside>

      {/* RIGHT PANEL — chat (full width on mobile, 70% on desktop) */}
      <div
        className="flex-1 flex flex-col min-w-0 overflow-hidden md:border-r-[3px] md:border-r-[#e0e0e0] md:dark:border-r-[#2d2d2d]"
        style={{ backgroundColor: "#0f1117" }}
      >
        {chatComponent}
      </div>

      {/* Things in Common modal */}
      <Dialog open={showThingsModal} onOpenChange={setShowThingsModal}>
        <DialogContent className="bg-white dark:bg-gray-900 max-w-lg w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Star className="w-5 h-5 text-orange-500" />
              Things in Common with @{displayName}
            </DialogTitle>
          </DialogHeader>
          <WhatYouHaveInCommon currentUserId={user.id} otherUserId={otherUserId} />
        </DialogContent>
      </Dialog>

      {/* Contacts in Common modal */}
      <Dialog open={showContactsModal} onOpenChange={setShowContactsModal}>
        <DialogContent className="bg-white dark:bg-gray-900 max-w-sm w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Users className="w-5 h-5 text-blue-500" />
              Connections in Common
            </DialogTitle>
          </DialogHeader>
          {Array.isArray(mutualConnections) && mutualConnections.length > 0 ? (
            <ul className="space-y-3 mt-2">
              {(mutualConnections as any[]).map((contact: any) => (
                <li key={contact.id} className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 shrink-0">
                    {contact.profileImage ? (
                      <AvatarImage src={contact.profileImage} alt={contact.username} />
                    ) : null}
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium">
                      {(contact.username?.[0] ?? '?').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">@{contact.username}</p>
                    {contact.hometownCity && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {contact.hometownCity}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No connections in common yet.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Group DM creator */}
      {showGroupDialog && user && (
        <GroupDMDialog
          open={showGroupDialog}
          onClose={() => setShowGroupDialog(false)}
          currentUserId={user.id}
          initialUser={{
            id: otherUserId,
            username: otherUser.username,
            firstName: (otherUser as any).firstName,
            name: otherUser.name,
            profileImage: otherUser.profileImage,
          }}
        />
      )}
    </div>
  );
}
