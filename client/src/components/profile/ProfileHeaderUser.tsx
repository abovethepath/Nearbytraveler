import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Camera, MessageSquare, MessageCircle, Share2, Users, UserPlus, Building2, Calendar, Plane, MoreVertical, Copy, Mail, Moon, Sun, Palette, Heart, Smartphone } from "lucide-react";
import { SimpleAvatar } from "@/components/simple-avatar";
import ConnectButton from "@/components/ConnectButton";
import { VouchButton } from "@/components/VouchButton";
import { ReportUserButton } from "@/components/report-user-button";
import { formatLocationCompact, formatTravelDestinationShort, getCurrentTravelDestination, getTravelStatusLabel } from "@/lib/dateUtils";
import { isNativeIOSApp } from "@/lib/nativeApp";
import { useTheme } from "@/components/theme-provider";
import { useIsDesktop } from "@/hooks/useDeviceType";
import { getInterestStyle, getActivityStyle, getEventStyle } from "@/lib/topChoicesUtils";
import { ProfileTabBar } from "./ProfileTabBar";
import type { ProfilePageProps } from "./profile-complete-types";
import { resolveAndJoinHostelChatroom } from "@/lib/hostelChatrooms";
import { ShareModal } from "@/components/ShareModal";
import { getProfileShareText, getProfileRedditText } from "@/lib/shareUtils";
import { SITE_URL } from "@/lib/constants";
import { SUPPORT_TIER_DISPLAY } from "@/pages/donate";

function SupportBadge({ tier }: { tier?: string | null }) {
  if (!tier) return null;
  const info = SUPPORT_TIER_DISPLAY[tier];
  if (!info) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-black/30 text-white backdrop-blur-sm border border-white/20 shrink-0">
      {info.emoji} {info.label}
    </span>
  );
}

export function ProfileHeaderUser(props: ProfilePageProps) {
  const {
    user,
    setLocation,
    isOwnProfile,
    gradientOptions,
    selectedGradient,
    setSelectedGradient,
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
    setTriggerQuickMeetup,
    userChatrooms = [],
    compatibilityData,
    connectionStatus,
  } = props as Record<string, any>;

  const isDesktop = useIsDesktop();
  const isDesktopOtherUser = !isNativeIOSApp() && isDesktop && !isOwnProfile;
  const isMobileWeb =
    !isNativeIOSApp() &&
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(max-width: 767.98px)").matches;

  const hometown = formatLocationCompact(user?.hometownCity, user?.hometownState, user?.hometownCountry);
  const currentTravelPlan = getCurrentTravelDestination(travelPlans || []);
  const invalidDestinations = ['unknown', '—', '–', '-', '--', 'n/a', 'null', ''];
  const hasValidTravelDestination = currentTravelPlan && typeof currentTravelPlan === 'string' && currentTravelPlan.trim().length > 0 && !invalidDestinations.includes(currentTravelPlan.trim().toLowerCase()) && !/^[\s\-—–]+$/.test(currentTravelPlan);
  const travelDestinationDisplay =
    !isNativeIOSApp() && formatTravelDestinationShort(currentTravelPlan)
      ? formatTravelDestinationShort(currentTravelPlan)
      : currentTravelPlan;

  const travelStatus = getTravelStatusLabel((user as any)?.travelStartDate, 'label');
  const travelStatusLabel = travelStatus.label;

  const upcomingTrip = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const plans = (travelPlans || []) as any[];
    const future = plans
      .filter((p: any) => p.startDate && p.destination && new Date(p.startDate) >= today)
      .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    return future[0] || null;
  }, [travelPlans]);
  const connectionsCount = (userConnections as any[])?.length ?? 0;
  const mutedOrange = "#e8834a";
  const mutedOrangeHover = "#d4703a";
  const isNewToTown = !!(user?.isNewToTown && user?.newToTownUntil && new Date(user.newToTownUntil) > new Date());

  const { resolvedTheme, setTheme } = useTheme();

  // Save / heart state for other users' profiles
  const qc = useQueryClient();
  const { data: savedStatus } = useQuery<{ saved: boolean }>({
    queryKey: ["/api/saved-travelers/check", user?.id],
    enabled: !isOwnProfile && !!currentUser?.id && !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
  const [optimisticSaved, setOptimisticSaved] = useState<boolean | null>(null);
  const isSaved = optimisticSaved !== null ? optimisticSaved : (savedStatus?.saved ?? false);

  const saveMutation = useMutation({
    mutationFn: async (save: boolean) => {
      if (save) {
        await apiRequest("POST", "/api/saved-travelers", { savedUserId: user?.id });
      } else {
        await apiRequest("DELETE", `/api/saved-travelers/${user?.id}`);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/saved-travelers/check", user?.id] });
      qc.invalidateQueries({ queryKey: ["/api/saved-travelers"] });
    },
    onError: () => setOptimisticSaved(null),
  });

  const handleSaveTraveler = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const next = !isSaved;
    setOptimisticSaved(next);
    saveMutation.mutate(next);
  };

  const [shareWithFriendsOpen, setShareWithFriendsOpen] = React.useState(false);
  const [seeAllCommonOpen, setSeeAllCommonOpen] = React.useState(false);
  const [qrInstallOpen, setQrInstallOpen] = React.useState(false);

  // Track profile visits for inline QR promo (desktop, own profile, first 5 visits)
  // Track profile visits for inline "Get App" pill (desktop, own profile, first 20 visits)
  const [showInlineQr, setShowInlineQr] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    const count = parseInt(localStorage.getItem('nt_app_promo_count') || '0', 10);
    return count < 20;
  });
  React.useEffect(() => {
    if (!isOwnProfile || !isDesktop || !showInlineQr) return;
    const key = 'nt_app_promo_count';
    const count = parseInt(localStorage.getItem(key) || '0', 10);
    if (count < 20) {
      localStorage.setItem(key, String(count + 1));
    } else {
      setShowInlineQr(false);
    }
  }, [isOwnProfile, isDesktop, showInlineQr]);

  React.useEffect(() => {
    const handler = () => setSeeAllCommonOpen(true);
    window.addEventListener('open-common-modal', handler);
    return () => window.removeEventListener('open-common-modal', handler);
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : SITE_URL;
  const profileUrl = user?.username ? `${origin}/profile/${user.username}` : `${origin}/profile`;
  const shareText = `Check out this profile on NearbyTraveler: @${user?.username || "nearbytraveler"}\n\n${profileUrl}`;

  const cycleHeroPalette = () => {
    if (typeof setSelectedGradient !== "function") return;
    const total = Array.isArray(gradientOptions) ? gradientOptions.length : 0;
    if (total <= 0) return;
    setSelectedGradient((prev: number) => (Number.isFinite(prev) ? (prev + 1) % total : 0));
  };

  const copyProfileLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast?.({ title: "Link copied", description: "Paste it anywhere." });
    } catch {
      toast?.({ title: "Failed to copy", description: "Please copy the link from the address bar.", variant: "destructive" });
    }
  };

  // Build share modal data lazily so it always uses current user/travel state
  const buildShareModal = () => {
    const viralText = getProfileShareText(
      {
        username: user?.username || "nearbytraveler",
        firstName: (user as any)?.firstName || null,
        userType: (user as any)?.userType || null,
        city: (user as any)?.city || null,
        currentTravelDestination: hasValidTravelDestination ? currentTravelPlan : null,
      },
      profileUrl
    );
    const redditText = getProfileRedditText(
      {
        username: user?.username || "nearbytraveler",
        firstName: (user as any)?.firstName || null,
        userType: (user as any)?.userType || null,
        city: (user as any)?.city || null,
        currentTravelDestination: hasValidTravelDestination ? currentTravelPlan : null,
      },
      profileUrl
    );
    return { viralText, redditText };
  };

  const shareButton = (inline = false) => {
    const { viralText, redditText } = buildShareModal();
    return (
      <ShareModal
        title={`Share ${((user as any)?.firstName || "").split(" ")[0] || user?.username || "this profile"}`}
        url={profileUrl}
        shareText={viralText}
        redditText={redditText}
        trigger={
          <button
            type="button"
            className={
              inline
                ? "p-2 rounded-full bg-[#374151] hover:bg-[#4B5563] transition-colors inline-flex items-center justify-center shrink-0 ring-1 ring-black/20 shadow-md"
                : "absolute top-4 right-4 z-20 p-2 rounded-full bg-[#374151] hover:bg-[#4B5563] transition-colors ring-1 ring-black/20 shadow-md"
            }
            style={{ touchAction: "manipulation" }}
            title="Share profile"
            data-testid="button-share-profile"
          >
            <Share2 className="w-4 h-4 !text-white" />
          </button>
        }
      />
    );
  };

  const isDesktopOwnProfile = !isNativeIOSApp() && isOwnProfile;

  return (
    <div
      className={`w-full overflow-hidden bg-gradient-to-r ${gradientOptions?.[selectedGradient]} px-3 sm:px-6 lg:px-10 relative isolate profile-hero-fixed ${isNativeIOSApp() ? 'py-6 sm:py-8 lg:py-12' : (isDesktopOwnProfile || isDesktopOtherUser) ? 'py-4 sm:py-5 lg:pt-6 lg:pb-16' : 'pt-12 sm:pt-14 lg:pt-20 pb-6 sm:pb-8 lg:pb-16'}`}
      style={{ width: '100vw', position: 'relative', left: '50%', transform: 'translateX(-50%)' }}
      data-profile-hero-owner={isOwnProfile ? "own" : "other"}
    >
      <div className="absolute inset-0 bg-black/30 z-0" />
      <div
        className={`mx-auto relative z-10 max-w-7xl ${isDesktopOwnProfile ? 'pl-4 sm:pl-6 lg:pl-8' : ''}`}
      >
        {isDesktopOwnProfile ? (
          /* Desktop own profile: balanced layout - larger avatar, readable city text, proportional @username, tabs at bottom */
          <div className="flex flex-col lg:relative">
            {/* Desktop (lg+): overlapping avatar block anchored to hero bottom-left */}
            {/* Avoid transforms on the text block (crisper desktop text). Avatar overlap is achieved via bottom offset instead of translate. */}
            <div className="hidden lg:flex flex-col items-start absolute left-8 top-0 z-30">
              <div className="relative">
                <div
                  className={`w-48 h-48 rounded-full overflow-hidden cursor-pointer shadow-2xl ${user?.ambassadorStatus === 'active' ? 'ring-4 ring-amber-400 ring-offset-2' : 'ring-4 ring-white/90'}`}
                  onClick={(e) => { e.stopPropagation(); if (user?.profileImage) setTimeout(() => setShowExpandedPhoto(true), 50); }}
                  title={user?.profileImage ? "Click to enlarge photo" : undefined}
                >
                  <SimpleAvatar user={user} size="xl" className="w-full h-full block object-cover" />
                </div>
                <label
                  className={`absolute bottom-2 right-2 w-11 h-11 rounded-full p-0 flex items-center justify-center cursor-pointer ${!user?.profileImage ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-600/90 hover:bg-gray-500'} text-white border-2 border-white overflow-hidden ${uploadingPhoto ? 'pointer-events-none opacity-50' : ''}`}
                  style={!user?.profileImage ? { backgroundColor: mutedOrange } : undefined}
                  data-testid="button-upload-avatar"
                >
                  <Camera className="h-5 w-5 pointer-events-none" />
                  <input id="avatar-upload-input" type="file" accept="image/*" onChange={(e) => { handleAvatarUpload?.(e); }} className="sr-only" disabled={uploadingPhoto} aria-label="Change avatar" />
                </label>
              </div>
            </div>

            <div className="flex flex-row items-start gap-6 lg:gap-8">
            {/* LEFT: Larger avatar + Nearby Local/Traveler city text (more readable) */}
            <div className="flex flex-col items-start flex-shrink-0 min-w-0 lg:hidden">
              <div className="relative">
                <div
                  className={`w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full overflow-hidden cursor-pointer ${user?.ambassadorStatus === 'active' ? 'ring-4 ring-amber-400 ring-offset-2' : ''}`}
                  onClick={(e) => { e.stopPropagation(); if (user?.profileImage) setTimeout(() => setShowExpandedPhoto(true), 50); }}
                  title={user?.profileImage ? "Click to enlarge photo" : undefined}
                >
                  <SimpleAvatar user={user} size="xl" className="w-full h-full block object-cover" />
                </div>
                {/* Add Photo - overlay at bottom right of avatar circle */}
                <label
                  className={`absolute bottom-0 right-0 w-9 h-9 md:w-10 md:h-10 rounded-full p-0 flex items-center justify-center cursor-pointer ${!user?.profileImage ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-600/90 hover:bg-gray-500'} text-white border-2 border-white overflow-hidden ${uploadingPhoto ? 'pointer-events-none opacity-50' : ''}`}
                  style={!user?.profileImage ? { backgroundColor: mutedOrange } : undefined}
                  data-testid="button-upload-avatar"
                >
                  <Camera className="h-4 w-4 md:h-5 md:w-5 pointer-events-none" />
                  <input id="avatar-upload-input" type="file" accept="image/*" onChange={(e) => { handleAvatarUpload?.(e); }} className="sr-only" disabled={uploadingPhoto} aria-label="Change avatar" />
                </label>

              </div>
            </div>
            {/* RIGHT: @username + Share Profile, buttons - bio has its own dedicated section below hero */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5 pt-0 lg:pl-[23rem]">
              <div className="flex items-center gap-2.5 shrink-0 w-full max-w-full">
                <div className="flex flex-col leading-tight">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold break-all crisp-hero-text text-white" style={{ color: '#ffffff' }}>
                    {((user as any)?.firstName || "").split(" ")[0] || user?.username}
                  </h1>
                  <span className="text-sm sm:text-base font-medium text-white/80 break-all">@{user?.username}</span>
                  <SupportBadge tier={(user as any)?.supportTier} />
                </div>
                {/* Own profile: ⋮ menu lives on username row (top-right) */}
                {isOwnProfile && (
                  <div className="ml-auto">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-transparent hover:bg-transparent border-0 ring-0 shadow-none transition-colors"
                          title="More"
                          aria-label="More"
                          data-testid="button-profile-more-menu"
                        >
                          <MoreVertical className="w-5 h-5 text-white" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-64 bg-white text-black dark:bg-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-xl opacity-100"
                      >
                        <DropdownMenuItem
                          onClick={() => setShareWithFriendsOpen(true)}
                          className="text-black focus:text-black dark:text-white dark:focus:text-white"
                          data-testid="menu-item-share-profile"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share with Friends
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setLocation('/share-qr')}
                          className="text-black focus:text-black dark:text-white dark:focus:text-white"
                          data-testid="menu-item-invite-friends"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Invite Friends
                        </DropdownMenuItem>
                        <div className="px-2 pt-2 pb-1">
                          <div className="flex items-center gap-2 text-sm font-semibold text-black dark:text-white">
                            <Palette className="w-4 h-4" />
                            <span>Change Hero Color Palette</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(gradientOptions || []).map((g: string, idx: number) => (
                              <button
                                key={`palette-${idx}`}
                                type="button"
                                className={`h-8 w-10 rounded-full bg-gradient-to-r ${g} border-2 transition-all shrink-0 ${
                                  idx === selectedGradient
                                    ? "border-gray-900 dark:border-white ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500"
                                    : "border-gray-300 dark:border-gray-600 hover:border-gray-500"
                                }`}
                                onClick={(e) => {
                                  // Keep menu open while selecting palettes.
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (typeof setSelectedGradient === "function") setSelectedGradient(idx);
                                }}
                                aria-label={`Select palette ${idx + 1}`}
                                data-testid={`palette-swatch-${idx}`}
                              />
                            ))}
                          </div>
                        </div>
                        <DropdownMenuItem
                          onClick={() => setTheme("dark")}
                          disabled={resolvedTheme === "dark"}
                          className="text-black focus:text-black dark:text-white dark:focus:text-white disabled:opacity-40"
                          data-testid="menu-item-switch-dark-mode"
                        >
                          <Moon className="w-4 h-4 mr-2" />
                          Switch to Dark Mode
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setTheme("light")}
                          disabled={resolvedTheme === "light"}
                          className="text-black focus:text-black dark:text-white dark:focus:text-white disabled:opacity-40"
                          data-testid="menu-item-switch-light-mode"
                        >
                          <Sun className="w-4 h-4 mr-2" />
                          Switch to Light Mode
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setQrInstallOpen(true)}
                          className="text-black focus:text-black dark:text-white dark:focus:text-white"
                        >
                          <Smartphone className="w-4 h-4 mr-2" />
                          📱 Get the App
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              {/* Nearby Local/Traveler + badge: desktop only — mobile shows full-width below */}
              <div className="hidden lg:block mt-1 space-y-0.5">
                <div className="text-sm sm:text-base font-semibold crisp-hero-text flex items-center gap-2 flex-wrap text-white" style={{ color: '#ffffff' }}>
                  Nearby Local · <span style={{ color: '#ffffff' }}>{hometown}</span>
                  {isNewToTown && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 border border-green-300 text-green-800">
                      New to Town
                    </span>
                  )}
                  {showInlineQr && (
                    <button
                      type="button"
                      onClick={() => setQrInstallOpen(true)}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-800 cursor-pointer transition-colors"
                    >
                      📱 Get App
                    </button>
                  )}
                </div>
                {hasValidTravelDestination && (
                  <div className="text-sm sm:text-base font-semibold crisp-hero-text text-white" title={currentTravelPlan} style={{ color: '#ffffff' }}>
                    {travelStatusLabel} <span style={{ color: '#ffffff' }}>→</span>{" "}
                    <span style={{ color: '#ffffff' }}>
                      {travelDestinationDisplay}
                    </span>
                  </div>
                )}
              </div>

            </div>
            </div>

            {/* MOBILE ONLY: full-width badge + city lines + CTA below avatar/name row */}
            <div className="lg:hidden mt-2 space-y-1">
              {isNewToTown && (
                <span className="inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold bg-green-100 border border-green-300 shadow-sm text-green-800">
                  New to Town
                </span>
              )}
              <div className="text-sm sm:text-base font-semibold crisp-hero-text text-white" style={{ color: '#ffffff' }}>
                Nearby Local · <span style={{ color: '#ffffff' }}>{hometown}</span>
              </div>
              {hasValidTravelDestination && (
                <div className="text-sm sm:text-base font-semibold crisp-hero-text text-white" title={currentTravelPlan} style={{ color: '#ffffff' }}>
                  {travelStatusLabel} <span style={{ color: '#ffffff' }}>→</span>{" "}
                  <span style={{ color: '#ffffff' }}>{travelDestinationDisplay}</span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-9 px-3 text-sm font-bold bg-[#FF6B35] hover:bg-[#F97316] text-white border-0 shadow-md"
                  onClick={() => {
                    const widget = document.querySelector('[data-testid="quick-meet-widget"]');
                    if (widget) widget.scrollIntoView({ behavior: "smooth", block: "center" });
                    setTriggerQuickMeetup?.(true);
                    setTimeout(() => setTriggerQuickMeetup?.(false), 500);
                  }}
                  data-testid="button-lets-meet-now-hero-mobile"
                >
                  ⚡ Available Now
                </Button>
              </div>
            </div>

            {/* Desktop: tab bar integrated at bottom of hero */}
            {!isNativeIOSApp() && (
              <div className="w-full mt-4 lg:pl-[23rem]">
                <ProfileTabBar {...props} variant="hero" />
              </div>
            )}

          </div>
        ) : (
        <div className="flex flex-col lg:relative">
          {!isOwnProfile && !isNativeIOSApp() ? (
            <>
              {(() => {
                const commonStats = (props as any)?.commonStats as
                  | {
                      sharedInterests?: string[];
                      sharedActivities?: string[];
                      sharedEvents?: string[];
                      sharedLanguagesNonEnglish?: string[];
                      sharedCityActivities?: string[];
                      sharedSexualPreferences?: string[];
                      otherCommonalities?: string[];
                      sharedContactsCount?: number;
                      totalCommon?: number;
                    }
                  | undefined;

                const sharedLanguages: string[] = Array.isArray((compatibilityData as any)?.sharedLanguages)
                  ? (compatibilityData as any).sharedLanguages
                  : [];

                const sharedInterests: string[] = Array.isArray(commonStats?.sharedInterests)
                  ? commonStats!.sharedInterests!
                  : (Array.isArray((compatibilityData as any)?.sharedInterests) ? (compatibilityData as any).sharedInterests : []);
                const otherCommonalities: string[] = Array.isArray(commonStats?.otherCommonalities)
                  ? commonStats!.otherCommonalities!
                  : (Array.isArray((compatibilityData as any)?.otherCommonalities) ? (compatibilityData as any).otherCommonalities : []);
                const sharedCityActivitiesArr: string[] = Array.isArray(commonStats?.sharedCityActivities)
                  ? commonStats!.sharedCityActivities!
                  : [];
                const sharedSexualPreferencesArr: string[] = Array.isArray(commonStats?.sharedSexualPreferences)
                  ? commonStats!.sharedSexualPreferences!
                  : [];

                const nonEnglishSharedLanguages = Array.isArray(commonStats?.sharedLanguagesNonEnglish)
                  ? commonStats!.sharedLanguagesNonEnglish!
                  : sharedLanguages.filter((l) => {
                      const n = String(l || "").trim().toLowerCase();
                      return !!n && n !== "english";
                    });

                const sharedContactsCount = Number.isFinite(commonStats?.sharedContactsCount as number)
                  ? (commonStats!.sharedContactsCount as number)
                  : (connectionDegreeData?.mutualCount ?? 0);
                const totalCommon = commonStats?.totalCommon ?? 0;

                // Build a flat list of all shared tags for the big card
                const sharedActivitiesArr: string[] = Array.isArray(commonStats?.sharedActivities)
                  ? commonStats!.sharedActivities!
                  : (Array.isArray((compatibilityData as any)?.sharedActivities) ? (compatibilityData as any).sharedActivities : []);
                const sharedEventsArr: string[] = Array.isArray(commonStats?.sharedEvents)
                  ? commonStats!.sharedEvents!
                  : (Array.isArray((compatibilityData as any)?.sharedEvents) ? (compatibilityData as any).sharedEvents : []);

                // Hostel match is highest priority — show it first in the tag list
                const hostelTag = hostelMatch?.hostelName
                  ? [`🏨 ${hostelMatch.hostelName}`]
                  : [];

                const allSharedTags: string[] = [
                  ...hostelTag,
                  ...sharedInterests,
                  ...sharedActivitiesArr,
                  ...sharedEventsArr,
                  ...sharedCityActivitiesArr,
                  ...nonEnglishSharedLanguages,
                  ...sharedSexualPreferencesArr,
                  ...otherCommonalities,
                ];

                const TAG_LIMIT = 10;
                const visibleTags = allSharedTags.slice(0, TAG_LIMIT);
                const hiddenTagCount = allSharedTags.length - visibleTags.length;

                return (
                  <>
                    <div className={`flex ${isMobileWeb ? "flex-row items-start" : "flex-col"} lg:flex-row lg:items-start gap-4 lg:gap-6`}>
                      {/* LEFT: avatar + status */}
                      <div className={`flex-shrink-0 ${isMobileWeb ? 'flex flex-col items-start' : ''}`}>
                        <div
                          className={`w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden shadow-2xl cursor-pointer ${user?.ambassadorStatus === 'active' ? 'ring-4 ring-amber-400 ring-offset-2' : 'ring-4 ring-white/90'}`}
                          onClick={(e) => { e.stopPropagation(); if (user?.profileImage) setTimeout(() => setShowExpandedPhoto(true), 50); }}
                          title={user?.profileImage ? "Click to enlarge photo" : undefined}
                        >
                          <SimpleAvatar user={user} size="xl" className="w-full h-full block object-cover" />
                        </div>

                        {/* MOBILE ONLY: Nearby Local/Traveler labels under avatar (matches own-profile mobile layout) */}
                        {isMobileWeb && (
                          <div className="flex flex-col gap-1 min-w-0 w-full max-w-[280px] sm:max-w-none mt-4">
                            {isNewToTown && (
                              <span className="inline-flex items-center self-start whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold bg-green-100 border border-green-300 shadow-sm text-green-800 mb-1">
                                New to Town
                              </span>
                            )}
                            <span className="text-base sm:text-lg font-semibold crisp-hero-text text-white" style={{ color: '#ffffff' }}>
                              Nearby Local
                            </span>
                            <span className="text-base sm:text-lg font-medium break-words crisp-hero-text text-white" title={hometown} style={{ color: '#ffffff' }}>{hometown}</span>
                            {hasValidTravelDestination && (
                              <>
                                <span className="text-base sm:text-lg font-semibold mt-1 crisp-hero-text text-white" style={{ color: '#ffffff' }}>
                                  {travelStatusLabel}
                                </span>
                                <span className="text-base sm:text-lg font-medium break-words crisp-hero-text text-white" title={currentTravelPlan!} style={{ color: '#ffffff' }}>
                                  {travelDestinationDisplay}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* MIDDLE: content (no extra card; sit directly on gradient) */}
                      <div className="flex-1 min-w-0 lg:max-w-[400px]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2 sm:flex-wrap">
                              <h1 className="text-xl sm:text-3xl font-extrabold text-white break-all leading-tight crisp-hero-text" style={{ color: '#ffffff' }}>
                                {((user as any)?.firstName || "").split(" ")[0] || user?.username}
                                {!isOwnProfile && (() => {
                                  const deg = connectionStatus?.status === 'accepted' ? 1 : (connectionDegreeData as any)?.degree;
                                  const label = deg === 1 ? '1st' : deg === 2 ? '2nd' : deg === 3 ? '3rd' : null;
                                  if (!label) return null;
                                  return <sup className="text-sm text-white/60 font-normal ml-0.5 cursor-pointer hover:text-white/90 transition-colors" onClick={(e) => { e.stopPropagation(); openTab('contacts'); setTimeout(() => { document.getElementById('connections-in-common-section')?.scrollIntoView({ behavior: 'smooth' }); }, 150); }}>{label}</sup>;
                                })()}
                              </h1>
                              <div className="text-sm font-medium text-white/75 break-all">@{user?.username}</div>
                              <SupportBadge tier={(user as any)?.supportTier} />
                            </div>

                            {/* DESKTOP ONLY: Nearby Local/Traveler labels in content area (unchanged) */}
                            {!isMobileWeb && (
                              <div className="mt-2 space-y-1">
                                <div className="text-sm sm:text-base font-semibold crisp-hero-text flex items-center gap-2 flex-wrap text-white" style={{ color: '#ffffff' }}>
                                  Nearby Local · <span style={{ color: '#ffffff' }}>{hometown}</span>
                                  {isNewToTown && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 border border-green-300 text-green-800">
                                      New to Town
                                    </span>
                                  )}
                                </div>
                                {hasValidTravelDestination && (
                                  <div className="text-sm sm:text-base font-semibold crisp-hero-text text-white" title={currentTravelPlan!} style={{ color: '#ffffff' }}>
                                    <span style={{ color: '#ffffff' }}>{travelStatusLabel}</span>
                                    <span style={{ color: '#ffffff' }}> → </span>
                                    <span style={{ color: '#ffffff' }}>{travelDestinationDisplay}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>


                          <div className="mt-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-lg transition-all font-bold cursor-pointer px-5 h-8 text-[13px] !bg-[#FF6B35] hover:!bg-[#F97316] !text-white !border-0 shadow-sm"
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

                            {connectionStatus?.status !== 'accepted' && (
                              <ConnectButton
                                currentUserId={currentUser?.id || 0}
                                targetUserId={user?.id || 0}
                                targetUsername={user?.username}
                                targetName={user?.name}
                                appearance="default"
                                className="rounded-lg shadow-sm transition-all px-5 h-8 text-[13px] font-bold !bg-[#2563EB] hover:!bg-[#1D4ED8] !text-white !border-0"
                              />
                            )}

                            {upcomingTrip && (
                              <button
                                type="button"
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg transition-all font-bold cursor-pointer px-4 h-8 text-[13px] bg-white/20 hover:bg-white/30 text-white border border-white/40 shadow-sm backdrop-blur-sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  openTab?.('travel');
                                }}
                                data-testid="button-upcoming-trip"
                              >
                                <Plane className="w-3.5 h-3.5" />
                                <span>Upcoming Trip</span>
                              </button>
                            )}

                          </div>

                        </div>
                      </div>

                      {/* Desktop "What You Have in Common" widget — RIGHT column in hero row */}
                      {!isMobileWeb && (
                        <div className="common-radiate-widget hidden lg:flex flex-col flex-1 min-w-0 rounded-2xl bg-black/50 backdrop-blur-sm border border-white/20 p-4 gap-2 max-h-48 overflow-hidden justify-center cursor-pointer hover:bg-black/60 transition-colors mt-8" onClick={() => setSeeAllCommonOpen(true)}>
                          {totalCommon > 0 ? (
                            <>
                              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                <span className="text-lg">🤝</span>
                                <span className="text-[11px] font-extrabold text-white uppercase tracking-widest leading-none">What You Have in Common</span>
                                <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-extrabold bg-[#FF6B35] text-white shadow-md">
                                  {totalCommon} in common
                                </span>
                              </div>

                              <div className="overflow-hidden">
                                {(() => {
                                  const hostelPill = hostelMatch?.hostelName ? `🏨 ${hostelMatch.hostelName}` : null;
                                  const source =
                                    (Array.isArray(sharedInterests) && sharedInterests.length > 0)
                                      ? sharedInterests
                                      : (Array.isArray(sharedActivitiesArr) && sharedActivitiesArr.length > 0)
                                        ? sharedActivitiesArr
                                        : sharedEventsArr;

                                  const pills: Array<{ key: string; label: string; variant?: "hostel" | "default" }> = [];
                                  if (hostelPill) pills.push({ key: `hostel:${hostelPill}`, label: hostelPill, variant: "hostel" });

                                  for (const raw of (source || [])) {
                                    const label = String(raw || "").trim();
                                    if (!label) continue;
                                    if (hostelPill && label.toLowerCase() === hostelPill.toLowerCase()) continue;
                                    pills.push({ key: label, label, variant: "default" });
                                    if (pills.length >= 10) break;
                                  }

                                  const row1 = pills.slice(0, 5);
                                  const row2 = pills.slice(5, 10);
                                  const renderRow = (row: typeof pills) => (
                                    <div className="flex flex-wrap gap-1 justify-start overflow-hidden max-h-7">
                                      {row.map((pill) => (
                                        <span
                                          key={pill.key}
                                          className={
                                            pill.variant === "hostel"
                                              ? "inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-extrabold bg-emerald-600 text-white border border-emerald-300/30 leading-none max-w-full"
                                              : "inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold bg-[#111827] text-white border border-white/10 leading-none max-w-full"
                                          }
                                          title={pill.label}
                                        >
                                          <span className="truncate max-w-[10rem]">{pill.label}</span>
                                        </span>
                                      ))}
                                      {row.length === 0 && <span className="invisible text-[11px]">—</span>}
                                    </div>
                                  );

                                  return (
                                    <div className="flex flex-col gap-1 max-h-16 overflow-hidden">
                                      {renderRow(row1)}
                                      {renderRow(row2)}
                                    </div>
                                  );
                                })()}
                              </div>

                              <div className="mt-1 w-full flex items-center justify-between gap-2 text-xs text-gray-400">
                                {sharedContactsCount > 0 ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (openTab) { openTab('contacts'); } else { setLocation(`/profile/${user.id}?tab=contacts`); }
                                      setTimeout(() => {
                                        const el = document.getElementById('connections-in-common-section');
                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      }, 200);
                                    }}
                                    className="text-xs text-gray-400 hover:text-gray-200 underline underline-offset-2"
                                  >
                                    {sharedContactsCount === 1 ? 'Connection' : 'Connections'} in Common · {sharedContactsCount}
                                  </button>
                                ) : null}
                                {allSharedTags.length > 10 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSeeAllCommonOpen(true);
                                    }}
                                    className="text-xs text-gray-400 hover:text-gray-200 underline underline-offset-2"
                                  >
                                    See All →
                                  </button>
                                )}
                              </div>
                              {currentUser?.id && (
                                <div className="mt-1.5 text-center">
                                  <a
                                    href={`/profile/${currentUser.id}?tab=about&edit=interests`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLocation(`/profile/${currentUser.id}?tab=about&edit=interests`);
                                      e.preventDefault();
                                    }}
                                    className="text-[10px] text-white/70 hover:text-white transition-colors"
                                  >
                                    + Add more interests & activities to improve your matches
                                  </a>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-[11px] text-white leading-snug text-center">
                              Add more interests to your profile to find things in common.
                            </p>
                          )}
                        </div>
                      )}

                    </div>

                    {/* Tab bar — below the hero row */}
                    <div className="w-full mt-5 relative">
                      <ProfileTabBar {...props} variant="hero" />
                      {isMobileWeb && (
                        <div
                          aria-hidden
                          className="pointer-events-none absolute right-0 top-0 h-full w-12 flex items-center justify-end pr-1 bg-gradient-to-l from-black/45 via-black/15 to-transparent"
                        >
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/35 text-white text-lg leading-none shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                            ›
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Mobile "What You Have in Common" hero card */}
                    {isMobileWeb && totalCommon > 0 && (
                      <div className="mt-4 rounded-2xl bg-black/50 backdrop-blur-sm border border-white/20 p-4 cursor-pointer hover:bg-black/60 transition-colors" onClick={() => setSeeAllCommonOpen(true)}>
                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          <span className="text-lg">🤝</span>
                          <span className="text-[11px] font-extrabold text-white uppercase tracking-widest leading-none">What You Have in Common</span>
                          <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-extrabold bg-[#FF6B35] text-white shadow-md">
                            {totalCommon} in common
                          </span>
                        </div>
                        {allSharedTags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {allSharedTags.slice(0, 10).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold bg-black/50 text-white border border-white/30"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {allSharedTags.length > 10 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSeeAllCommonOpen(true);
                            }}
                            className="mt-2 text-sm text-white/70 hover:text-white underline underline-offset-2"
                          >
                            See All →
                          </button>
                        )}
                        {currentUser?.id && (
                          <div className="mt-2 text-center">
                            <a
                              href={`/profile/${currentUser.id}?tab=about&edit=interests`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/profile/${currentUser.id}?tab=about&edit=interests`);
                                e.preventDefault();
                              }}
                              className="text-[10px] text-white/70 hover:text-white transition-colors"
                            >
                              + Add more interests & activities to improve your matches
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* See all modal */}
                    <Dialog open={seeAllCommonOpen} onOpenChange={setSeeAllCommonOpen}>
                      <DialogContent className="w-[95%] sm:max-w-xl h-fit max-h-[85vh] flex flex-col bg-white dark:bg-gray-900 p-0 overflow-hidden border-none shadow-2xl rounded-2xl sm:rounded-3xl focus:outline-none">
                        <DialogHeader className="p-6 pb-2 sm:p-8 sm:pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                          <DialogTitle className="text-gray-900 dark:text-white">What You Have in Common</DialogTitle>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-6 pt-2 sm:p-8 sm:pt-4 space-y-5 custom-scrollbar touch-pan-y">
                          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-4 shrink-0">
                            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
                              {totalCommon} {totalCommon === 1 ? "thing" : "things"} in common
                            </div>
                          </div>

                          {[
                            { label: "Shared Interests", items: sharedInterests, color: "bg-[#FF6B35] text-white border-black/10" },
                            { label: "Shared Activities", items: sharedActivitiesArr, color: "bg-blue-500 text-white border-blue-600/20" },
                            { label: "Shared Events", items: sharedEventsArr, color: "bg-purple-500 text-white border-purple-600/20" },
                            { label: "Shared City Activities", items: sharedCityActivitiesArr, color: "bg-teal-500 text-white border-teal-600/20" },
                            { label: "Shared Languages", items: nonEnglishSharedLanguages, color: "bg-indigo-500 text-white border-indigo-600/20" },
                            { label: "Shared Sexual Preferences", items: sharedSexualPreferencesArr, color: "bg-pink-500 text-white border-pink-600/20" },
                            { label: "Other Commonalities", items: otherCommonalities, color: "bg-gray-500 text-white border-gray-600/20" },
                          ].map(({ label, items, color }) =>
                            items.length > 0 ? (
                              <div key={label}>
                                <div className="text-sm font-extrabold text-gray-900 dark:text-white mb-2">
                                  {label} ({items.length})
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {items.map((item) => (
                                <button
                                  key={item}
                                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs sm:text-sm font-semibold border text-left break-words max-w-full ${color}`}
                                  style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                                >
                                  {item}
                                </button>
                                  ))}
                                </div>
                              </div>
                            ) : null
                          )}

                          {sharedContactsCount > 0 && (
                            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 px-4 py-4">
                              <div className="text-sm font-extrabold text-gray-900 dark:text-white mb-3">
                                Connections
                              </div>
                              <div className="flex flex-wrap gap-2 text-sm text-gray-700 dark:text-gray-200">
                                <button 
                                  onClick={() => {
                                    setSeeAllCommonOpen(false);
                                    // Small delay to allow modal close animation
                                    setTimeout(() => {
                                      const el = document.getElementById('connections-in-common-section');
                                      if (el) {
                                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      } else {
                                        // Fallback to tabs if section ID not found
                                        window.dispatchEvent(new CustomEvent('openProfileTab', { detail: 'contacts' }));
                                        // Try again after tab switch
                                        setTimeout(() => {
                                          const retryEl = document.getElementById('connections-in-common-section');
                                          if (retryEl) retryEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }, 300);
                                      }
                                    }, 300);
                                  }}
                                  className="inline-flex items-center rounded-full px-3 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                >
                                  <span className="font-extrabold text-gray-900 dark:text-white mr-1">{sharedContactsCount}</span>
                                  shared connections
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                );
              })()}
            </>
          ) : (
            <>
        {/* Desktop (lg+ other-user): overlapping avatar block anchored to hero bottom-left */}
        {isDesktopOtherUser && (
          <div className="hidden lg:flex flex-col items-start absolute left-8 bottom-[-80px] z-30">
            <div className="relative flex flex-col items-center">
              <div
                className={`w-40 h-40 rounded-full overflow-hidden cursor-pointer shadow-2xl ${user?.ambassadorStatus === 'active' ? 'ring-4 ring-amber-400 ring-offset-2' : `ring-4 ring-white/90 ${user?.profileImage ? 'hover:ring-white transition-all' : ''}`}`}
                onClick={(e) => { e.stopPropagation(); if (user?.profileImage) setTimeout(() => setShowExpandedPhoto(true), 50); }}
                title={user?.profileImage ? "Click to enlarge photo" : undefined}
              >
                <SimpleAvatar user={user} size="xl" className="w-full h-full block object-cover" />
              </div>
            </div>

            <div className="flex flex-row items-start gap-3 min-w-0 w-full max-w-[520px] mt-4">
              {/* Nearby Local / Traveler text */}
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-semibold crisp-hero-text text-white" style={{ color: "#ffffff" }}>
                    Nearby Local <span style={{ color: "#ffffff" }}>·</span>{" "}
                    <span style={{ color: "#ffffff" }}>{hometown}</span>
                  </span>
                  {!isMobileWeb && isNewToTown && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 border border-green-300 text-green-800">
                      New to Town
                    </span>
                  )}
                </div>
                {hasValidTravelDestination && (
                  <>
                    <span className="text-sm font-semibold mt-1 crisp-hero-text text-white" style={{ color: "#ffffff" }}>
                      {travelStatusLabel}
                    </span>
                    <span className="text-sm font-medium break-words crisp-hero-text text-white" title={currentTravelPlan!} style={{ color: "#ffffff" }}>
                      {travelDestinationDisplay}
                    </span>
                  </>
                )}
              </div>

              {/* Mutual connections — desktop only, aligned with Nearby Local text */}
              {connectionDegreeData?.mutualCount && connectionDegreeData.mutualCount > 0 && (
                <div
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-blue-500/70 shadow-md"
                  style={{ background: 'rgba(255,255,255,0.28)', backdropFilter: 'blur(8px)' }}
                  data-testid="mutual-connections-desktop"
                >
                  <div className="flex -space-x-2">
                    {connectionDegreeData.mutuals?.slice(0, 3).map((mutual: any) => (
                      <Avatar
                        key={mutual.id}
                        className="w-6 h-6 border-2 border-white cursor-pointer hover:ring-2 hover:ring-blue-400"
                        onClick={() => setLocation(`/profile/${mutual.id}`)}
                      >
                        <AvatarImage src={mutual.profileImage || undefined} />
                        <AvatarFallback className="text-xs bg-blue-200 text-blue-800">{mutual.name?.[0] || mutual.username?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-xs font-semibold whitespace-nowrap text-white" style={{ color: '#ffffff' }}>
                    <Users className="w-3 h-3 inline mr-1" />
                    {connectionDegreeData.mutualCount} mutual
                  </span>
                </div>
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
                  className={`rounded-full shadow-xl overflow-hidden ${user?.ambassadorStatus === 'active' ? 'border-4 border-amber-400' : `border-4 border-white dark:border-gray-600 ${!isOwnProfile && user?.profileImage ? 'cursor-pointer hover:border-orange-400 transition-all' : ''}`}`}
                  onClick={(e) => { e.stopPropagation(); if (!isOwnProfile && user?.profileImage) setTimeout(() => setShowExpandedPhoto(true), 50); }}
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
              {/* Mobile web: keep badge centered under avatar */}
              {isMobileWeb && isNewToTown && (
                <span className="mt-2 inline-flex items-center self-center whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold bg-green-100 border border-green-300 shadow-sm text-green-800">
                  New to Town
                </span>
              )}
            </div>
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
              <span
                className={`text-base sm:text-lg lg:text-xl font-semibold crisp-hero-text text-white ${!isOwnProfile ? "" : ""}`}
                style={{ color: '#ffffff' }}
              >
                Nearby Local
              </span>
              <span className={`text-base sm:text-lg font-medium break-words crisp-hero-text text-white ${isDesktopOtherUser ? '' : !isNativeIOSApp() ? '' : ''}`} title={hometown} style={{ color: '#ffffff' }}>{hometown}</span>
              {hasValidTravelDestination && (
                <>
                  <span
                    className={`text-base sm:text-lg lg:text-sm font-semibold mt-1 crisp-hero-text text-white ${!isOwnProfile ? "" : ""}`}
                    style={{ color: '#ffffff' }}
                  >
                    {travelStatusLabel}
                  </span>
                  <span className={`text-base sm:text-lg font-medium break-words crisp-hero-text text-white ${isDesktopOtherUser ? '' : !isNativeIOSApp() ? '' : ''}`} title={currentTravelPlan!} style={{ color: '#ffffff' }}>
                    {travelDestinationDisplay}
                  </span>
                </>
              )}
              {(() => {
                if (!hasValidTravelDestination) return null;
                const now = new Date();
                const activePlanWithHostel = (travelPlans || []).find((plan: any) => {
                  if (!plan.startDate || !plan.endDate) return false;
                  const start = new Date(plan.startDate);
                  const end = new Date(plan.endDate);
                  const isActive = now >= start && now <= end;
                  const hasPublicHostel = plan.hostelName && plan.hostelVisibility === 'public';
                  if (!isActive || !hasPublicHostel) return false;

                  // Best-effort destination match (avoid hiding due to formatting differences)
                  const currentCity = String(currentTravelPlan || "").split(",")[0]?.trim().toLowerCase();
                  const planCity = String(plan.destinationCity || plan.destination || "").split(",")[0]?.trim().toLowerCase();
                  if (!currentCity || !planCity) return true; // If we can't compare, still show.
                  return currentCity === planCity;
                });
                return activePlanWithHostel ? (
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-sm font-medium text-white mt-1 crisp-hero-text hover:underline underline-offset-2 text-left"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        const city =
                          String(activePlanWithHostel.destinationCity || activePlanWithHostel.destination || "")
                            .split(",")[0]
                            ?.trim() ||
                          String(currentTravelPlan || "").split(",")[0]?.trim();
                        const country =
                          (activePlanWithHostel as any).destinationCountry ||
                          (activePlanWithHostel as any).destination_country ||
                          "United States";
                        const result = await resolveAndJoinHostelChatroom({
                          hostelName: activePlanWithHostel.hostelName,
                          city,
                          country,
                        });
                        setLocation?.(`/chatroom/${result.chatroomId}`);
                      } catch (err: any) {
                        toast?.({
                          title: "Can't open hostel chatroom",
                          description: err?.message || "Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                    data-testid="button-open-hostel-chatroom"
                  >
                    <Building2 className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <span className="break-words">Staying at {activePlanWithHostel.hostelName}</span>
                  </button>
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
                      <div className="flex items-center gap-2.5 shrink-0 w-fit max-w-full">
                        <div className="lg:inline-flex lg:items-center lg:bg-black/35 lg:backdrop-blur-none lg:rounded-full lg:px-3 lg:py-1.5 lg:shadow-sm">
                          <div className="flex flex-col">
                          <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold break-all !text-white crisp-hero-text" style={{ color: "#ffffff" }}>
                            {((user as any)?.firstName || "").split(" ")[0] || user?.username}
                            {!isOwnProfile && (() => {
                              const deg = connectionStatus?.status === 'accepted' ? 1 : (connectionDegreeData as any)?.degree;
                              const label = deg === 1 ? '1st' : deg === 2 ? '2nd' : deg === 3 ? '3rd' : null;
                              if (!label) return null;
                              return <sup className="text-sm text-white/60 font-normal ml-0.5 cursor-pointer hover:text-white/90 transition-colors" onClick={(e) => { e.stopPropagation(); openTab('contacts'); setTimeout(() => { document.getElementById('connections-in-common-section')?.scrollIntoView({ behavior: 'smooth' }); }, 150); }}>{label}</sup>;
                            })()}
                          </h1>
                          <span className="text-sm font-medium text-white/75 break-all">@{user?.username}</span>
                          <SupportBadge tier={(user as any)?.supportTier} />
                          </div>
                          {!isOwnProfile && connectionStatus?.status === 'accepted' && (
                            <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 shrink-0" title="Connected">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isOwnProfile && (
                      <div className={`flex mt-2 ${isDesktopOtherUser ? 'flex-row flex-wrap items-start gap-4 lg:gap-4 w-full lg:pr-2' : `flex-row flex-wrap items-center gap-2 ${!isNativeIOSApp() ? 'justify-start' : 'justify-center'}`}`}>
                        <div className={isDesktopOtherUser ? 'flex flex-col flex-nowrap items-start gap-3 shrink-0' : 'flex flex-row flex-wrap items-center gap-2'}>
                          {/* Desktop (lg+): primary actions first, secondary actions below */}
                          {isDesktopOtherUser ? (
  <>
    <div className="flex flex-row gap-2">
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-lg shadow-md transition-all font-bold cursor-pointer px-5 h-8 text-[13px] bg-[#FF6B35] hover:bg-[#F97316] text-white border-0"
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
      {connectionStatus?.status !== 'accepted' && (
        <ConnectButton
          currentUserId={currentUser?.id || 0}
          targetUserId={user?.id || 0}
          targetUsername={user?.username}
          targetName={user?.name}
          appearance="default"
          className="rounded-lg shadow-md transition-all px-5 h-8 text-[13px] font-bold !bg-[#2563EB] hover:!bg-[#1D4ED8] !text-white !border-0"
        />
      )}
    </div>
    {currentUser && (
      <button
        type="button"
        onClick={handleSaveTraveler}
        title={isSaved ? "Saved — tap to remove" : "Save to get notified when they arrive"}
        className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-semibold transition-colors border ${
          isSaved
            ? "bg-rose-50 dark:bg-rose-900/30 text-rose-500 border-rose-300 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/50"
            : "bg-rose-50/60 dark:bg-rose-950/40 text-rose-400 dark:text-rose-400 border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:text-rose-500 hover:border-rose-300"
        }`}
      >
        <Heart className="w-3.5 h-3.5" fill={isSaved ? "currentColor" : "none"} />
        <span>{isSaved ? "Saved" : "Save"}</span>
      </button>
    )}
  </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className={
                                  isMobileWeb
                                    ? `inline-flex items-center rounded-lg shadow-md transition-all font-bold cursor-pointer px-4 py-1.5 text-sm bg-[#FF6B35] hover:bg-[#F97316] text-white border-0`
                                    : `inline-flex items-center rounded-lg shadow-md transition-all font-bold cursor-pointer ${isNativeIOSApp() ? 'shrink-0 px-4 py-1.5 text-sm' : 'px-4 py-1.5 text-sm'} bg-[#FF6B35] hover:bg-[#F97316] text-white border-0`
                                }
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
                              {connectionStatus?.status !== 'accepted' && (
                                <ConnectButton
                                  currentUserId={currentUser?.id || 0}
                                  targetUserId={user?.id || 0}
                                  targetUsername={user?.username}
                                  targetName={user?.name}
                                  appearance="default"
                                  className="rounded-lg shadow-md transition-all shrink-0 px-4 py-1.5 text-sm font-bold !bg-[#2563EB] hover:!bg-[#1D4ED8] !text-white !border-0"
                                />
                              )}
                              {currentUser && (
                                <button
                                  type="button"
                                  onClick={handleSaveTraveler}
                                  title={isSaved ? "Saved — tap to remove" : "Save to get notified when they arrive"}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors border shrink-0 ${
                                    isSaved
                                      ? "bg-rose-50 dark:bg-rose-900/30 text-rose-500 border-rose-300 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                                      : "bg-rose-50/60 dark:bg-rose-950/40 text-rose-400 dark:text-rose-400 border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:text-rose-500 hover:border-rose-300"
                                  }`}
                                >
                                  <Heart className="w-3.5 h-3.5" fill={isSaved ? "currentColor" : "none"} />
                                  <span>{isSaved ? "Saved" : "Save"}</span>
                                </button>
                              )}
                              {/* Other user's profile: vouch + share + report — desktop only (mobile has these in the About section below) */}
                              {!isMobileWeb && (
                                <>
                                  {currentUser?.id && user?.id && (
                                    <VouchButton
                                      currentUserId={currentUser.id}
                                      targetUserId={user.id}
                                      targetUsername={user.username}
                                      hideWhenDisabled={true}
                                      appearance="ghost"
                                      className="rounded-lg px-3 h-7 text-[12px] font-semibold"
                                    />
                                  )}
                                  {shareButton(true)}
                                  {user && (
                                    currentUser ? (
                                      <ReportUserButton
                                        userId={currentUser.id}
                                        targetUserId={user.id}
                                        targetUsername={user.username}
                                        variant="ghost"
                                        size="sm"
                                        showIcon={false}
                                        appearance="link"
                                        className="!bg-transparent !border-0 px-0 py-0 underline underline-offset-2 font-medium text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
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
                                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 underline underline-offset-2 px-1 py-1 rounded font-medium cursor-pointer shrink-0"
                                        data-radix-dismissable-layer-ignore=""
                                      >
                                        Report
                                      </button>
                                    )
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {!isOwnProfile && (
                <div>
                  {connectionDegreeData?.mutualCount && connectionDegreeData.mutualCount > 0 && (
                    <div className="lg:hidden flex items-center gap-2 mt-3 p-2 bg-white/30 backdrop-blur-sm rounded-xl border-2 border-blue-500/60 shadow-md" data-testid="mutual-connections">
                      <div className="flex -space-x-2">
                        {connectionDegreeData.mutuals?.slice(0, 3).map((mutual: any) => (
                          <Avatar
                            key={mutual.id}
                            className="w-6 h-6 border-2 border-white cursor-pointer hover:ring-2 hover:ring-blue-400"
                            onClick={() => setLocation(`/profile/${mutual.id}`)}
                          >
                            <AvatarImage src={mutual.profileImage || undefined} />
                            <AvatarFallback className="text-xs bg-blue-200 text-blue-800">{mutual.name?.[0] || mutual.username?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-sm text-white" style={{ color: '#ffffff' }}>
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
                        <p className="text-sm font-bold !text-black">
                          You're both staying at {hostelMatch.hostelName}!
                        </p>
                        <p className="text-xs !text-black">
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
            </>
          )}
        </div>
        )}
      </div>

      {/* Share with Friends modal (own profile) */}
      <Dialog open={shareWithFriendsOpen} onOpenChange={setShareWithFriendsOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share with Friends
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Button onClick={copyProfileLink} variant="secondary" className="w-full justify-start gap-2">
              <Copy className="w-4 h-4" />
              Copy link
            </Button>
            <Button
              onClick={() => {
                const subject = `Check out @${user?.username || "nearbytraveler"} on NearbyTraveler`;
                const body = shareText;
                window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
              }}
              variant="secondary"
              className="w-full justify-start gap-2"
            >
              <Mail className="w-4 h-4" />
              Send email
            </Button>
            <Button
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer")}
              variant="secondary"
              className="w-full justify-start gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button
              onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer")}
              variant="secondary"
              className="w-full justify-start gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Telegram
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Get App Install Modal */}
      <Dialog open={qrInstallOpen} onOpenChange={setQrInstallOpen}>
        <DialogContent className="sm:max-w-xs bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Smartphone className="w-5 h-5" />
              Get the app on your phone
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">📱 iPhone (Safari):</p>
              <ol className="list-decimal ml-5 space-y-0.5 text-xs">
                <li>Open Safari on your iPhone</li>
                <li>Go to <span className="font-medium">nearbytraveler.org</span></li>
                <li>Tap the Share button (box with arrow) → Add to Home Screen</li>
                <li>Tap Add — done!</li>
              </ol>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">🤖 Android (Chrome):</p>
              <ol className="list-decimal ml-5 space-y-0.5 text-xs">
                <li>Open Chrome on your phone</li>
                <li>Go to <span className="font-medium">nearbytraveler.org</span></li>
                <li>Tap Install when prompted</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
