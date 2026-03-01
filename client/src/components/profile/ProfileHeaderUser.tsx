import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Camera, MapPin, MessageSquare, MessageCircle, Share2, Users, Building2, Calendar, Plane } from "lucide-react";
import { SimpleAvatar } from "@/components/simple-avatar";
import ConnectButton from "@/components/ConnectButton";
import { ReportUserButton } from "@/components/report-user-button";
import { formatLocationCompact, formatTravelDestinationShort, getCurrentTravelDestination } from "@/lib/dateUtils";
import { isNativeIOSApp } from "@/lib/nativeApp";
import { useIsDesktop } from "@/hooks/useDeviceType";
import { getInterestStyle, getActivityStyle, getEventStyle } from "@/lib/topChoicesUtils";
import { VouchButton } from "@/components/VouchButton";
import { ProfileTabBar } from "./ProfileTabBar";
import { WhatYouHaveInCommon } from "@/components/what-you-have-in-common";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ProfilePageProps } from "./profile-complete-types";

export function ProfileHeaderUser(props: ProfilePageProps) {
  const {
    user,
    setLocation,
    isOwnProfile,
    gradientOptions,
    selectedGradient,
    setShowExpandedPhoto,
    uploadingPhoto,
    handleAvatarUpload,
    toast,
    connectionDegreeData,
    userVouches,
    userConnections,
    travelPlans,
    openTab,
    hostelMatch,
    currentUser,
    handleMessage,
    setShowWriteReferenceModal,
    userChatrooms = [],
    compatibilityData,
  } = props as Record<string, any>;

  const isDesktop = useIsDesktop();
  const isDesktopOtherUser = !isNativeIOSApp() && isDesktop && !isOwnProfile;

  const hometown = formatLocationCompact(user?.hometownCity, user?.hometownState, user?.hometownCountry);
  const currentTravelPlan = getCurrentTravelDestination(travelPlans || []);
  const invalidDestinations = ['unknown', '—', '–', '-', '--', 'n/a', 'null', ''];
  const hasValidTravelDestination = currentTravelPlan && typeof currentTravelPlan === 'string' && currentTravelPlan.trim().length > 0 && !invalidDestinations.includes(currentTravelPlan.trim().toLowerCase()) && !/^[\s\-—–]+$/.test(currentTravelPlan);
  const connectionsCount = (userConnections as any[])?.length ?? 0;
  const vouchesCount = (userVouches as any[])?.length ?? 0;
  const mutedOrange = "#e8834a";
  const mutedOrangeHover = "#d4703a";

  const shareButton = (inline = false) => (
    <button
      type="button"
      onClick={async () => {
        const profileUrl = `https://nearbytraveler.org/profile/${user?.username}`;
        const fullMessage = `Check out this profile on NearbyTraveler: @${user?.username} - ${profileUrl}`;
        if (navigator.share) {
          try {
            await navigator.share({
              title: `@${user?.username} on NearbyTraveler`,
              text: fullMessage,
              url: profileUrl,
            });
          } catch (e) {}
        } else {
          await navigator.clipboard.writeText(fullMessage);
          toast?.({ title: "Profile link copied!", description: "You can now paste it anywhere." });
        }
      }}
      className={inline ? "p-1.5 rounded-full bg-white/90 hover:bg-white dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors inline-flex items-center justify-center shrink-0 ring-1 ring-gray-300/60 dark:ring-gray-500/60 shadow-sm" : "absolute top-4 right-4 z-20 p-1.5 rounded-full bg-white/80 hover:bg-white dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"}
      style={{ touchAction: 'manipulation' }}
      title="Share profile"
      data-testid="button-share-profile"
    >
      <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
    </button>
  );

  const isDesktopOwnProfile = !isNativeIOSApp() && isOwnProfile;
  const queryClient = useQueryClient();
  const [localLocationSharingEnabled, setLocalLocationSharingEnabled] = React.useState<boolean>(
    !!user?.locationSharingEnabled,
  );

  React.useEffect(() => {
    if (!isOwnProfile) return;
    setLocalLocationSharingEnabled(!!user?.locationSharingEnabled);
  }, [isOwnProfile, user?.locationSharingEnabled]);

  const updateLocationSharingMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user?.id) throw new Error("User not found");
      return apiRequest("PUT", `/api/users/${user.id}`, { locationSharingEnabled: enabled });
    },
    onSuccess: async () => {
      if (!user?.id) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] }),
        queryClient.invalidateQueries({ queryKey: ["/api/users", user.id] }),
      ]);
    },
    onError: () => {
      setLocalLocationSharingEnabled(!!user?.locationSharingEnabled);
      toast?.({
        title: "Error",
        description: "Failed to update location visibility",
        variant: "destructive",
      });
    },
  });

  const handleLocationVisibilityToggle = (enabled: boolean) => {
    if (!isOwnProfile || !user?.id) return;
    setLocalLocationSharingEnabled(enabled);
    updateLocationSharingMutation.mutate(enabled);

    if (enabled && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          apiRequest("POST", `/api/users/${user.id}/location`, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            locationSharingEnabled: true,
          })
            .then(() => {
              queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
              queryClient.invalidateQueries({ queryKey: ["/api/users", user.id] });
            })
            .catch(() => {
              // Preference is already saved; best-effort update for coordinates
            });
        },
        () => {
          // Preference is already saved; best-effort update for coordinates
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    }
  };

  const locationVisibilityToggleRow = () => {
    if (!isOwnProfile) return null;
    const enabled = !!localLocationSharingEnabled;
    const activeIconClass = enabled ? "text-green-600 dark:text-green-400" : "text-black/70 dark:text-gray-400";

    return (
      <div className="mt-1.5 flex items-center justify-between gap-2 w-full" data-testid="location-visibility-toggle-row">
        <div className="flex items-center gap-1">
          <MapPin className={`w-3 h-3 ${activeIconClass}`} />
          <span className="text-[11px] font-medium leading-none !text-black dark:!text-gray-200 crisp-hero-text">
            Visible on city map
          </span>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleLocationVisibilityToggle}
          disabled={updateLocationSharingMutation.isPending}
          className="scale-[0.78] origin-right"
        />
      </div>
    );
  };

  return (
    <div
      className={`bg-gradient-to-r ${gradientOptions?.[selectedGradient]} px-3 sm:px-6 lg:px-10 relative isolate ${isNativeIOSApp() ? 'py-6 sm:py-8 lg:py-12' : isDesktopOwnProfile ? 'py-4 sm:py-5 lg:pt-6 lg:pb-16' : 'pt-12 sm:pt-14 lg:pt-20 pb-6 sm:pb-8 lg:pb-16'}`}
      style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)' }}
    >
      {!isOwnProfile && !isDesktopOtherUser && shareButton(false)}
      <div
        className={`mx-auto relative z-10 ${isDesktopOwnProfile ? 'pl-4 sm:pl-6 lg:pl-8' : ''}`}
        style={isDesktopOtherUser ? { maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto' } : undefined}
      >
        {isDesktopOwnProfile ? (
          /* Desktop own profile: balanced layout - larger avatar, readable city text, proportional @username, tabs at bottom */
          <div className="flex flex-col lg:relative">
            {/* Desktop (lg+): overlapping avatar block anchored to hero bottom-left */}
            {/* Avoid transforms on the text block (crisper desktop text). Avatar overlap is achieved via bottom offset instead of translate. */}
            <div className="hidden lg:flex flex-col items-start absolute left-8 bottom-[-80px] z-30">
              <div className="relative">
                <div
                  className="w-40 h-40 rounded-full overflow-hidden cursor-pointer ring-4 ring-white/90 shadow-2xl"
                  onClick={() => { if (user?.profileImage) setShowExpandedPhoto(true); }}
                  title={user?.profileImage ? "Click to enlarge photo" : undefined}
                >
                  <SimpleAvatar user={user} size="xl" className="w-full h-full block object-cover" />
                </div>
                <label
                  className={`absolute bottom-1 right-1 w-10 h-10 rounded-full p-0 flex items-center justify-center cursor-pointer ${!user?.profileImage ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-600/90 hover:bg-gray-500'} text-white border-2 border-white overflow-hidden ${uploadingPhoto ? 'pointer-events-none opacity-50' : ''}`}
                  style={!user?.profileImage ? { backgroundColor: mutedOrange } : undefined}
                  data-testid="button-upload-avatar"
                >
                  <Camera className="h-5 w-5 pointer-events-none" />
                  <input id="avatar-upload-input" type="file" accept="image/*" onChange={(e) => { handleAvatarUpload?.(e); }} className="sr-only" disabled={uploadingPhoto} aria-label="Change avatar" />
                </label>
              </div>

              {user?.newToTownUntil && new Date(user.newToTownUntil) > new Date() && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800/50 border border-green-300 dark:border-green-600 text-green-900 dark:text-green-100 mt-2">
                  New to Town
                </span>
              )}

              <div className="mt-3 text-left">
                <span
                  className="block text-sm font-semibold text-orange-600 dark:text-orange-400 lg:text-base crisp-hero-text"
                  style={{ color: mutedOrange }}
                >
                  Nearby Local
                </span>
                <span className="block text-base font-medium !text-black crisp-hero-text">{hometown}</span>
              </div>
              {hasValidTravelDestination && (
                <div className="mt-1.5 text-left">
                  <span className="block text-xs font-semibold text-blue-600 dark:text-blue-400 lg:text-sm crisp-hero-text">
                    Nearby Traveler
                  </span>
                  <span className="block text-sm font-medium !text-black lg:text-base crisp-hero-text" title={currentTravelPlan}>
                    {!isNativeIOSApp() && formatTravelDestinationShort(currentTravelPlan) ? formatTravelDestinationShort(currentTravelPlan) : currentTravelPlan}
                  </span>
                </div>
              )}
              {locationVisibilityToggleRow()}
            </div>

            <div className="flex flex-row items-start gap-6 lg:gap-8">
            {/* LEFT: Larger avatar + Nearby Local/Traveler city text (more readable) */}
            <div className="flex flex-col items-start flex-shrink-0 min-w-0 lg:hidden">
              <div className="relative">
                <div
                  className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full overflow-hidden cursor-pointer"
                  onClick={() => { if (user?.profileImage) setShowExpandedPhoto(true); }}
                  title={user?.profileImage ? "Click to enlarge photo" : undefined}
                >
                  <SimpleAvatar user={user} size="xl" className="w-full h-full block object-cover" />
                </div>
                {/* Add Photo - overlay at bottom right of avatar circle */}
                <label
                  className={`absolute bottom-0 right-0 w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full p-0 flex items-center justify-center cursor-pointer ${!user?.profileImage ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-600/90 hover:bg-gray-500'} text-white border-2 border-white overflow-hidden ${uploadingPhoto ? 'pointer-events-none opacity-50' : ''}`}
                  style={!user?.profileImage ? { backgroundColor: mutedOrange } : undefined}
                  data-testid="button-upload-avatar"
                >
                  <Camera className="h-4 w-4 md:h-5 md:w-5 pointer-events-none" />
                  <input id="avatar-upload-input" type="file" accept="image/*" onChange={(e) => { handleAvatarUpload?.(e); }} className="sr-only" disabled={uploadingPhoto} aria-label="Change avatar" />
                </label>
              </div>
              {user?.newToTownUntil && new Date(user.newToTownUntil) > new Date() && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800/50 border border-green-300 dark:border-green-600 text-green-900 dark:text-green-100 mt-2">
                  New to Town
                </span>
              )}
              <div className="mt-2.5 text-left">
                <span className="block text-sm font-semibold text-orange-600 dark:text-orange-400">Nearby Local</span>
                <span className="block text-base font-medium !text-black">{hometown}</span>
              </div>
              {hasValidTravelDestination && (
                <div className="mt-1.5 text-left">
                  <span className="block text-sm font-semibold text-blue-600 dark:text-blue-400">Nearby Traveler</span>
                  <span className="block text-base font-medium !text-black" title={currentTravelPlan}>
                    {!isNativeIOSApp() && formatTravelDestinationShort(currentTravelPlan) ? formatTravelDestinationShort(currentTravelPlan) : currentTravelPlan}
                  </span>
                </div>
              )}
              {locationVisibilityToggleRow()}
            </div>
            {/* RIGHT: @username + Share Profile, buttons - bio has its own dedicated section below hero */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5 pt-0.5 lg:pl-[18rem]">
              <div className="flex items-center gap-1.5 shrink-0 lg:inline-flex lg:items-center lg:gap-2 lg:bg-black/35 lg:backdrop-blur-none lg:rounded-full lg:px-3 lg:py-1.5 lg:shadow-sm w-fit max-w-full">
                <h1 className="text-lg sm:text-xl font-bold !text-black lg:!text-white break-all leading-tight lg:[text-shadow:0_1px_2px_rgba(0,0,0,0.65)] crisp-hero-text">@{user?.username}</h1>
                {isDesktopOwnProfile && shareButton(true)}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    const chatCity = user?.hometownCity || user?.location?.split(',')[0] || 'General';
                    setLocation(`/city-chatrooms?city=${encodeURIComponent(chatCity)}`);
                  }}
                  className="inline-flex items-center h-7 rounded-md px-3 text-sm font-semibold bg-orange-500 hover:bg-orange-600 lg:bg-[color:var(--mutedOrange)] lg:hover:bg-[color:var(--mutedOrangeHover)] text-white border-0 shadow-sm transition-colors"
                  style={{ ["--mutedOrange" as any]: mutedOrange, ["--mutedOrangeHover" as any]: mutedOrangeHover }}
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  Chatrooms{(userChatrooms?.length || 0) > 0 ? ` (${userChatrooms.length})` : ''}
                </button>
                <button
                  type="button"
                  onClick={() => setLocation('/share-qr')}
                  className="inline-flex items-center h-7 rounded-md px-3 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  Invite Friends
                </button>
              </div>
            </div>
            </div>
            {/* Desktop: tab bar integrated at bottom of hero */}
            {!isNativeIOSApp() && (
              <div className="w-full mt-4 lg:pl-[18rem]">
                <ProfileTabBar {...props} variant="hero" />
              </div>
            )}
          </div>
        ) : (
        <div className="flex flex-col lg:relative">
        {/* Desktop (lg+ other-user): overlapping avatar block anchored to hero bottom-left */}
        {isDesktopOtherUser && (
          <div className="hidden lg:flex flex-col items-start absolute left-8 bottom-[-92px] z-30">
            <div className="relative flex flex-col items-center">
              <div
                className={`rounded-full border-4 border-white/90 shadow-2xl overflow-hidden ${user?.profileImage ? 'cursor-pointer hover:border-white transition-all' : ''}`}
                onClick={() => { if (user?.profileImage) setShowExpandedPhoto(true); }}
                title={user?.profileImage ? "Click to enlarge photo" : undefined}
              >
                <div className="w-56 h-56 rounded-full overflow-hidden no-scrollbar">
                  <SimpleAvatar user={user} size="xl" className="w-full h-full block object-cover" />
                </div>
              </div>
              {user?.newToTownUntil && new Date(user.newToTownUntil) > new Date() && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800/50 border border-green-300 dark:border-green-600 text-green-900 dark:text-green-100 mt-3">
                  New to Town
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1 min-w-0 w-full max-w-[280px] mt-4">
              <span
                className="text-lg font-semibold text-orange-600 dark:text-orange-400 crisp-hero-text"
                style={{ color: mutedOrange }}
              >
                Nearby Local
              </span>
              <span className="text-base font-medium break-words !text-black crisp-hero-text" title={hometown}>{hometown}</span>
              {hasValidTravelDestination && (
                <>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1 crisp-hero-text">
                    Nearby Traveler
                  </span>
                  <span className="text-sm font-medium break-words !text-black crisp-hero-text" title={currentTravelPlan!}>
                    {!isNativeIOSApp() && formatTravelDestinationShort(currentTravelPlan!) ? formatTravelDestinationShort(currentTravelPlan!) : currentTravelPlan}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        <div className={`flex flex-row items-start relative z-20 ${!isNativeIOSApp() ? 'gap-6 sm:gap-8' : 'gap-4 sm:gap-6'} ${isDesktopOtherUser ? 'flex-nowrap' : 'flex-wrap'}`}>
          <div className={`relative flex-shrink-0 ${isNativeIOSApp() ? 'flex flex-col items-center' : 'flex flex-col items-start'} ${isDesktopOtherUser ? 'lg:hidden' : ''}`}>
            {/* Avatar + New to Town badge stack (desktop: centered column; iOS: unchanged) */}
            <div className={`relative ${!isNativeIOSApp() ? 'flex flex-col items-center' : ''}`}>
              {/* Avatar wrapper - relative for camera button positioning */}
              <div className="relative">
                <div
                  className={`rounded-full border-4 border-white dark:border-gray-600 shadow-xl overflow-hidden ${!isOwnProfile && user?.profileImage ? 'cursor-pointer hover:border-orange-400 transition-all' : ''}`}
                  onClick={() => { if (!isOwnProfile && user?.profileImage) setShowExpandedPhoto(true); }}
                  title={!isOwnProfile && user?.profileImage ? "Click to enlarge photo" : undefined}
                >
                  <div className="w-36 h-36 sm:w-40 sm:h-40 md:w-56 md:h-56 rounded-full overflow-hidden no-scrollbar">
                    <SimpleAvatar user={user} size="xl" className="w-full h-full block object-cover" />
                  </div>
                </div>
                {/* Camera button - over bottom edge of avatar (desktop other-user: N/A; iOS own: bottom-right) */}
                {isOwnProfile && !isNativeIOSApp() && (
                  <>
                    {!user?.profileImage && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap z-20 animate-pulse">Add Photo</div>
                    )}
                    <div
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 h-10 w-10 sm:h-11 sm:w-11 rounded-full p-0 flex items-center justify-center cursor-pointer ${!user?.profileImage ? 'bg-orange-500 hover:bg-orange-600 animate-bounce' : 'bg-gray-600 hover:bg-gray-500'} text-white shadow-lg border-2 border-white z-10 overflow-hidden ${uploadingPhoto ? 'pointer-events-none opacity-50' : ''}`}
                      data-testid="button-upload-avatar"
                    >
                      <Camera className="h-4 w-4 sm:h-5 sm:w-5 pointer-events-none" />
                      <input id="avatar-upload-input" type="file" accept="image/*" onChange={(e) => { handleAvatarUpload?.(e); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" style={{ fontSize: '200px' }} disabled={uploadingPhoto} aria-label="Change avatar" />
                    </div>
                  </>
                )}
              </div>
              {/* New to Town badge - directly below avatar (desktop other-user) */}
              {!isNativeIOSApp() && user?.newToTownUntil && new Date(user.newToTownUntil) > new Date() && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800/50 border border-green-300 dark:border-green-600 text-green-900 dark:text-green-100 mt-3">
                  New to Town
                </span>
              )}
            </div>
            {isNativeIOSApp() && !isOwnProfile && user?.newToTownUntil && new Date(user.newToTownUntil) > new Date() && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800/50 border border-green-300 dark:border-green-600 text-green-900 dark:text-green-100 mt-2">
                New to Town
              </span>
            )}
            {/* iOS: camera/add photo for own profile */}
            {isOwnProfile && isNativeIOSApp() && (
              <>
                {!user?.profileImage && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap z-20 animate-pulse">Add Photo</div>
                )}
                <div
                  className={`absolute bottom-2 right-2 h-10 w-10 sm:h-11 sm:w-11 rounded-full p-0 flex items-center justify-center cursor-pointer ${!user?.profileImage ? 'bg-orange-500 hover:bg-orange-600 animate-bounce' : 'bg-gray-600 hover:bg-gray-500'} text-white shadow-lg border-2 border-white z-10 overflow-hidden ${uploadingPhoto ? 'pointer-events-none opacity-50' : ''}`}
                  data-testid="button-upload-avatar"
                >
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5 pointer-events-none" />
                  <input id="avatar-upload-input" type="file" accept="image/*" onChange={(e) => { handleAvatarUpload?.(e); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" style={{ fontSize: '200px' }} disabled={uploadingPhoto} aria-label="Change avatar" />
                </div>
              </>
            )}
            <div className={`flex flex-col gap-1 min-w-0 w-full max-w-[280px] sm:max-w-none ${!isNativeIOSApp() ? 'mt-5' : 'mt-3'}`}>
              <span className="text-base sm:text-lg lg:text-xl font-semibold text-orange-600 dark:text-orange-400 crisp-hero-text">Nearby Local</span>
              <span className={`text-base sm:text-lg font-medium break-words crisp-hero-text ${isDesktopOtherUser ? '!text-black' : !isNativeIOSApp() ? 'text-black dark:text-gray-100 md:text-black md:dark:text-black' : ''}`} title={hometown} style={isNativeIOSApp() ? { color: '#000' } : undefined}>{hometown}</span>
              {hasValidTravelDestination && (
                <>
                  <span className="text-base sm:text-lg lg:text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1 crisp-hero-text">Nearby Traveler</span>
                  <span className={`text-base sm:text-lg font-medium break-words crisp-hero-text ${isDesktopOtherUser ? '!text-black' : !isNativeIOSApp() ? 'text-black dark:text-gray-100 md:text-black md:dark:text-black' : ''}`} title={currentTravelPlan!} style={isNativeIOSApp() ? { color: '#000' } : undefined}>
                    {!isNativeIOSApp() && formatTravelDestinationShort(currentTravelPlan!) ? formatTravelDestinationShort(currentTravelPlan!) : currentTravelPlan}
                  </span>
                </>
              )}
              {locationVisibilityToggleRow()}
              {(() => {
                if (!hasValidTravelDestination) return null;
                const now = new Date();
                const activePlanWithHostel = (travelPlans || []).find((plan: any) => {
                  if (!plan.startDate || !plan.endDate) return false;
                  const start = new Date(plan.startDate);
                  const end = new Date(plan.endDate);
                  const isActive = now >= start && now <= end;
                  const hasPublicHostel = plan.hostelName && plan.hostelVisibility === 'public';
                  const matchesDestination = plan.destination && currentTravelPlan!.toLowerCase().includes(plan.destination.split(',')[0].toLowerCase().trim());
                  return isActive && hasPublicHostel && matchesDestination;
                });
                return activePlanWithHostel ? (
                  <div className="flex items-center gap-1.5 text-sm font-medium text-black dark:text-gray-100 mt-1 crisp-hero-text">
                    <Building2 className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <span className="break-words">Staying at {activePlanWithHostel.hostelName}</span>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
          <div className={`flex-1 min-w-0 overflow-hidden ${!isNativeIOSApp() && isOwnProfile ? 'pt-1' : ''} ${isDesktopOtherUser ? 'lg:pl-[18rem]' : ''}`}>
            <div className={`space-y-2 w-full overflow-hidden ${!isNativeIOSApp() && isOwnProfile ? 'mt-0 pt-6 sm:pt-8' : 'mt-2'}`}>
              {(() => {
                return (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`flex items-center gap-1.5 shrink-0 w-fit max-w-full ${isDesktopOtherUser ? '' : 'lg:inline-flex lg:items-center lg:gap-2 lg:bg-black/35 lg:backdrop-blur-none lg:rounded-full lg:px-3 lg:py-1.5 lg:shadow-sm'}`}>
                        <h1 className={`text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold break-all ${isDesktopOtherUser ? '!text-black' : 'text-black'} lg:!text-white lg:[text-shadow:0_1px_2px_rgba(0,0,0,0.65)] crisp-hero-text`}>@{user?.username}</h1>
                        {isDesktopOtherUser && shareButton(true)}
                      </div>
                      {!isOwnProfile && connectionDegreeData?.degree && connectionDegreeData.degree > 0 && (
                        <Badge
                          className={`text-xs px-2 py-0.5 font-semibold ${
                            connectionDegreeData.degree === 1
                              ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-200 dark:border-green-600'
                              : connectionDegreeData.degree === 2
                                ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-600'
                                : 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-600'
                          }`}
                          data-testid="badge-connection-degree"
                        >
                          {connectionDegreeData.degree === 1 ? '1st' : connectionDegreeData.degree === 2 ? '2nd' : '3rd'}
                        </Badge>
                      )}
                    </div>

                    {!isOwnProfile && (
                      <div className={`flex mt-2 ${isDesktopOtherUser ? 'flex-row flex-wrap items-start gap-4 lg:gap-8 w-full lg:pr-2' : `flex-row flex-wrap items-center gap-2 ${!isNativeIOSApp() ? 'justify-start' : 'justify-center'}`}`}>
                        <div className={isDesktopOtherUser ? 'flex flex-col flex-nowrap items-stretch gap-3 shrink-0' : 'flex flex-row flex-wrap items-center gap-2'}>
                          {/* Desktop (lg+): primary actions first, secondary actions below */}
                          {isDesktopOtherUser ? (
                            <>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center rounded-lg shadow-md transition-all font-semibold cursor-pointer px-4 py-2 text-sm text-white bg-orange-500 hover:bg-orange-600 lg:bg-[color:var(--mutedOrange)] lg:hover:bg-[color:var(--mutedOrangeHover)]"
                                  style={{ ["--mutedOrange" as any]: mutedOrange, ["--mutedOrangeHover" as any]: mutedOrangeHover }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleMessage?.();
                                  }}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  data-testid="button-message"
                                  data-radix-dismissable-layer-ignore=""
                                >
                                  <span>Message</span>
                                </button>
                                <ConnectButton
                                  currentUserId={currentUser?.id || 0}
                                  targetUserId={user?.id || 0}
                                  targetUsername={user?.username}
                                  targetName={user?.name}
                                  className="w-full rounded-lg shadow-md transition-all px-4 py-2 text-sm font-semibold"
                                />
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {!isNativeIOSApp() && (
                                  <VouchButton
                                    currentUserId={currentUser?.id || 0}
                                    targetUserId={user?.id || 0}
                                    targetUsername={user?.username}
                                  />
                                )}
                                {currentUser ? (
                                  <Button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setShowWriteReferenceModal?.(true);
                                    }}
                                    variant="outline"
                                    className="bg-white/15 hover:bg-white/25 text-white border border-white/40 shrink-0 px-4 py-2 text-sm"
                                    data-testid="button-write-reference"
                                  >
                                    Write Reference
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    onClick={() => setLocation('/auth')}
                                    variant="outline"
                                    className="bg-white/15 hover:bg-white/25 text-white border border-white/40 shrink-0 px-4 py-2 text-sm"
                                    data-testid="button-write-reference"
                                  >
                                    Write Reference
                                  </Button>
                                )}
                              </div>

                              {user && (
                                <div className="pt-1">
                                  {currentUser ? (
                                    <ReportUserButton
                                      userId={currentUser.id}
                                      targetUserId={user.id}
                                      targetUsername={user.username}
                                      variant="ghost"
                                      size="sm"
                                      showIcon={false}
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setLocation('/auth');
                                      }}
                                      onPointerDown={(e) => e.stopPropagation()}
                                      className="text-xs text-gray-200/90 hover:text-white underline underline-offset-2 px-1 py-1 rounded font-medium cursor-pointer"
                                      data-radix-dismissable-layer-ignore=""
                                    >
                                      Report
                                    </button>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className={`inline-flex items-center bg-orange-500 hover:bg-orange-600 border-0 rounded-lg shadow-md transition-all text-black font-medium cursor-pointer ${isNativeIOSApp() ? 'shrink-0 px-4 py-1.5 text-sm' : 'px-4 py-1.5 text-sm'}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleMessage?.();
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                data-testid="button-message"
                                data-radix-dismissable-layer-ignore=""
                              >
                                <span className="text-black">Message</span>
                              </button>
                              <ConnectButton
                                currentUserId={currentUser?.id || 0}
                                targetUserId={user?.id || 0}
                                targetUsername={user?.username}
                                targetName={user?.name}
                                className={`rounded-lg shadow-md transition-all shrink-0 px-4 py-1.5 text-sm text-black hover:text-black`}
                              />
                              {!isNativeIOSApp() && (
                                <VouchButton
                                  currentUserId={currentUser?.id || 0}
                                  targetUserId={user?.id || 0}
                                  targetUsername={user?.username}
                                />
                              )}
                              {currentUser ? (
                                <Button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowWriteReferenceModal?.(true);
                                  }}
                                  className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shrink-0 px-4 py-1.5 text-sm border-0"
                                  data-testid="button-write-reference"
                                >
                                  Write Reference
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  onClick={() => setLocation('/auth')}
                                  className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shrink-0 px-4 py-1.5 text-sm border-0"
                                  data-testid="button-write-reference"
                                >
                                  Write Reference
                                </Button>
                              )}
                              {user && (
                                currentUser ? (
                                  <ReportUserButton
                                    userId={currentUser.id}
                                    targetUserId={user.id}
                                    targetUsername={user.username}
                                    variant="ghost"
                                    size="sm"
                                    showIcon={false}
                                  />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setLocation('/auth');
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 underline underline-offset-2 px-1 py-1 rounded font-medium cursor-pointer shrink-0"
                                    data-radix-dismissable-layer-ignore=""
                                  >
                                    Report
                                  </button>
                                )
                              )}
                            </>
                          )}
                        </div>
                        {isDesktopOtherUser && currentUser?.id && user?.id && user?.userType !== 'business' && (
                          <div className="flex-1 w-full min-w-0 min-w-[520px] max-w-full pr-0 lg:pr-2">
                            <WhatYouHaveInCommon currentUserId={currentUser.id} otherUserId={user.id} />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

              {!isOwnProfile && (
                <div>
                  {connectionDegreeData?.mutualCount && connectionDegreeData.mutualCount > 0 && (
                    <div className="flex items-center gap-2 mt-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700" data-testid="mutual-connections">
                      <div className="flex -space-x-2">
                        {connectionDegreeData.mutuals?.slice(0, 3).map((mutual: any) => (
                          <Avatar
                            key={mutual.id}
                            className="w-6 h-6 border-2 border-white dark:border-gray-800 cursor-pointer hover:ring-2 hover:ring-blue-400"
                            onClick={() => setLocation(`/profile/${mutual.id}`)}
                          >
                            <AvatarImage src={mutual.profileImage || undefined} />
                            <AvatarFallback className="text-xs bg-blue-200 text-blue-800">{mutual.name?.[0] || mutual.username?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-sm text-blue-800 dark:text-blue-200">
                        <Users className="w-3 h-3 inline mr-1" />
                        {connectionDegreeData.mutualCount} mutual {connectionDegreeData.mutualCount === 1 ? 'connection' : 'connections'}
                      </span>
                    </div>
                  )}
                  {!isOwnProfile && hostelMatch && (
                    <div
                      className="flex items-center gap-2 mt-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/40 dark:to-amber-900/40 rounded-lg border-2 border-orange-300 dark:border-orange-600 shadow-sm animate-pulse"
                      data-testid="hostel-match-banner"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-800">
                        <Building2 className="w-5 h-5 text-orange-600 dark:text-orange-300" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-orange-800 dark:text-orange-200">
                          You're both staying at {hostelMatch.hostelName}!
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          in {hostelMatch.destination} during overlapping dates
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
            {/* Desktop other-user: tab bar integrated at bottom of hero */}
            {!isNativeIOSApp() && (
              <div className="w-full mt-4 lg:pl-[18rem]">
                <ProfileTabBar {...props} variant="hero" />
              </div>
            )}
        </div>
        )}
      </div>

      {uploadingPhoto && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-600 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Uploading...</p>
          </div>
        </div>
      )}
    </div>
  );
}
