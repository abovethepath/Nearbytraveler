import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Camera, MessageSquare, MessageCircle, Share2, Users, UserPlus, Building2, Calendar, Plane, MoreVertical, Copy, Mail, Moon, Sun, Palette } from "lucide-react";
import { SimpleAvatar } from "@/components/simple-avatar";
import ConnectButton from "@/components/ConnectButton";
import { ReportUserButton } from "@/components/report-user-button";
import { formatLocationCompact, formatTravelDestinationShort, getCurrentTravelDestination } from "@/lib/dateUtils";
import { isNativeIOSApp } from "@/lib/nativeApp";
import { useTheme } from "@/components/theme-provider";
import { useIsDesktop } from "@/hooks/useDeviceType";
import { getInterestStyle, getActivityStyle, getEventStyle } from "@/lib/topChoicesUtils";
import { ProfileTabBar } from "./ProfileTabBar";
import type { ProfilePageProps } from "./profile-complete-types";
import { resolveAndJoinHostelChatroom } from "@/lib/hostelChatrooms";

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
  const connectionsCount = (userConnections as any[])?.length ?? 0;
  const mutedOrange = "#e8834a";
  const mutedOrangeHover = "#d4703a";

  const { resolvedTheme, setTheme } = useTheme();

  const [shareWithFriendsOpen, setShareWithFriendsOpen] = React.useState(false);
  const [seeAllCommonOpen, setSeeAllCommonOpen] = React.useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://nearbytraveler.org";
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

  const shareButton = (inline = false) => (
    <button
      type="button"
      onClick={async () => {
        const fullMessage = shareText.replace(/\n\n/g, " - ");
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
      className={
        inline
          ? (!isOwnProfile && isMobileWeb
              ? "p-1 rounded-full bg-black/70 hover:bg-black/80 transition-colors inline-flex items-center justify-center shrink-0 ring-1 ring-white/60 shadow-md"
              : "p-1 rounded-full bg-gray-900/90 hover:bg-gray-900 transition-colors inline-flex items-center justify-center shrink-0 ring-1 ring-black/30 shadow-sm")
          : "absolute top-4 right-4 z-20 p-1.5 rounded-full bg-gray-900/90 hover:bg-gray-900 transition-colors ring-1 ring-black/30 shadow-sm"
      }
      style={{ touchAction: 'manipulation' }}
      title="Share profile"
      data-testid="button-share-profile"
    >
      <Share2 className="w-3.5 h-3.5 text-white" />
    </button>
  );

  const isDesktopOwnProfile = !isNativeIOSApp() && isOwnProfile;

  return (
    <div
      className={`bg-gradient-to-r ${gradientOptions?.[selectedGradient]} px-3 sm:px-6 lg:px-10 relative isolate profile-hero-fixed ${isNativeIOSApp() ? 'py-6 sm:py-8 lg:py-12' : (isDesktopOwnProfile || isDesktopOtherUser) ? 'py-4 sm:py-5 lg:pt-6 lg:pb-16' : 'pt-12 sm:pt-14 lg:pt-20 pb-6 sm:pb-8 lg:pb-16'}`}
      data-profile-hero-owner={isOwnProfile ? "own" : "other"}
      style={
        isMobileWeb
          ? { width: "100vw", position: "relative", left: "50%", transform: "translateX(-50%)" }
          : { width: "100vw", marginLeft: "calc(50% - 50vw)" }
      }
    >
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
                  className="w-48 h-48 rounded-full overflow-hidden cursor-pointer ring-4 ring-white/90 shadow-2xl"
                  onClick={() => { if (user?.profileImage) setShowExpandedPhoto(true); }}
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

              {user?.newToTownUntil && new Date(user.newToTownUntil) > new Date() && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 border border-green-300 text-black mt-2">
                  New to Town
                </span>
              )}
            </div>

            <div className="flex flex-row items-start gap-6 lg:gap-8">
            {/* LEFT: Larger avatar + Nearby Local/Traveler city text (more readable) */}
            <div className="flex flex-col items-start flex-shrink-0 min-w-0 lg:hidden">
              <div className="relative">
                <div
                  className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full overflow-hidden cursor-pointer"
                  onClick={() => { if (user?.profileImage) setShowExpandedPhoto(true); }}
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
              {/* Mobile web: place badge under avatar (avoid camera icon overlap) */}
              {!isNativeIOSApp() && isMobileWeb && user?.newToTownUntil && new Date(user.newToTownUntil) > new Date() && (
                <span className="mt-2 inline-flex items-center self-center whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold bg-green-100 border border-green-300 text-black shadow-sm">
                  New to Town
                </span>
              )}
              {/* Non-mobile web: keep badge below avatar */}
              {!isNativeIOSApp() && !isMobileWeb && user?.newToTownUntil && new Date(user.newToTownUntil) > new Date() && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 border border-green-300 text-black mt-2">
                  New to Town
                </span>
              )}
            </div>
            {/* RIGHT: @username + Share Profile, buttons - bio has its own dedicated section below hero */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5 pt-0 lg:pl-[23rem]">
              <div className="flex items-center gap-2.5 shrink-0 w-full max-w-full">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-black break-all leading-tight crisp-hero-text">
                  @{user?.username}
                </h1>
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
                          <MoreVertical className="w-5 h-5 text-black" />
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
                          <div className="mt-2 grid grid-cols-4 gap-2">
                            {(gradientOptions || []).map((g: string, idx: number) => (
                              <button
                                key={`palette-${idx}`}
                                type="button"
                                className={`h-8 w-8 rounded-md bg-gradient-to-r ${g} ring-1 ring-black/10 hover:ring-black/30 transition-all ${
                                  idx === selectedGradient ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900" : ""
                                }`}
                                style={{ boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)" }}
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              {/* Nearby Local/Traveler moved under username (inside hero content area) */}
              <div className="mt-1 space-y-0.5">
                <div className="text-sm sm:text-base font-semibold text-black crisp-hero-text">
                  Nearby Local <span className="text-black/70">·</span> <span className="text-black">{hometown}</span>
                </div>
                {hasValidTravelDestination && (
                  <div className="text-sm sm:text-base font-semibold text-black crisp-hero-text" title={currentTravelPlan}>
                    Nearby Traveler <span className="text-black/70">→</span>{" "}
                    <span className="text-black">
                      {!isNativeIOSApp() && formatTravelDestinationShort(currentTravelPlan) ? formatTravelDestinationShort(currentTravelPlan) : currentTravelPlan}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Button
                  type="button"
                  size="sm"
                  className="h-9 px-3 text-sm font-semibold bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0 shadow-md"
                  onClick={() => {
                    const widget = document.querySelector('[data-testid="quick-meet-widget"]');
                    if (widget) widget.scrollIntoView({ behavior: "smooth", block: "center" });
                    setTriggerQuickMeetup?.(true);
                    setTimeout(() => setTriggerQuickMeetup?.(false), 500);
                  }}
                  data-testid="button-lets-meet-now-hero"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Let's Meet Now
                </Button>
              </div>
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
                      sharedCountries?: string[];
                      sharedLanguagesNonEnglish?: string[];
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
                const sharedCountries: string[] = Array.isArray(commonStats?.sharedCountries)
                  ? commonStats!.sharedCountries!
                  : (Array.isArray((compatibilityData as any)?.sharedCountries) ? (compatibilityData as any).sharedCountries : []);
                const otherCommonalities: string[] = Array.isArray(commonStats?.otherCommonalities)
                  ? commonStats!.otherCommonalities!
                  : (Array.isArray((compatibilityData as any)?.otherCommonalities) ? (compatibilityData as any).otherCommonalities : []);

                const nonEnglishSharedLanguages = Array.isArray(commonStats?.sharedLanguagesNonEnglish)
                  ? commonStats!.sharedLanguagesNonEnglish!
                  : sharedLanguages.filter((l) => {
                      const n = String(l || "").trim().toLowerCase();
                      return !!n && n !== "english";
                    });

                const sharedContactsCount = Number.isFinite(commonStats?.sharedContactsCount as number)
                  ? (commonStats!.sharedContactsCount as number)
                  : (connectionDegreeData?.mutualCount ?? 0);
                const sharedLanguagesCountForDisplay = nonEnglishSharedLanguages.length;
                const totalCommon =
                  (typeof commonStats?.totalCommon === "number" && Number.isFinite(commonStats.totalCommon) ? commonStats.totalCommon : null) ??
                  (sharedContactsCount +
                    sharedInterests.length +
                    (Array.isArray(commonStats?.sharedActivities) ? (commonStats!.sharedActivities!.length) : (Array.isArray((compatibilityData as any)?.sharedActivities) ? (compatibilityData as any).sharedActivities.length : 0)) +
                    (Array.isArray(commonStats?.sharedEvents) ? (commonStats!.sharedEvents!.length) : (Array.isArray((compatibilityData as any)?.sharedEvents) ? (compatibilityData as any).sharedEvents.length : 0)) +
                    sharedCountries.length +
                    sharedLanguagesCountForDisplay +
                    otherCommonalities.length);

                const visibleInterestPills = sharedInterests.slice(0, 6);
                const hasOverflow = sharedInterests.length > visibleInterestPills.length;

                return (
                  <>
                    <div className={`flex ${isMobileWeb ? "flex-row items-start" : "flex-col"} lg:flex-row lg:items-start gap-4 lg:gap-6`}>
                      {/* LEFT: avatar + status */}
                      <div className="flex-shrink-0">
                        <div
                          className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden ring-4 ring-white/90 shadow-2xl cursor-pointer"
                          onClick={() => { if (user?.profileImage) setShowExpandedPhoto(true); }}
                          title={user?.profileImage ? "Click to enlarge photo" : undefined}
                        >
                          <SimpleAvatar user={user} size="xl" className="w-full h-full block object-cover" />
                        </div>

                        {user?.newToTownUntil && new Date(user.newToTownUntil) > new Date() && (
                          <div className={isMobileWeb ? "mt-2 flex justify-start" : "mt-3 flex justify-center lg:justify-start"}>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 border border-green-300 text-green-900">
                              New to Town
                            </span>
                          </div>
                        )}
                      </div>

                      {/* MIDDLE: content (no extra card; sit directly on gradient) */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h1 className="text-2xl sm:text-3xl font-extrabold text-black break-all leading-tight crisp-hero-text">
                                @{user?.username}
                              </h1>
                              {!!(connectionDegreeData?.degree && connectionDegreeData.degree > 0) && (
                                <Badge
                                  className={`text-xs px-2 py-0.5 font-semibold ${
                                    connectionDegreeData.degree === 1
                                      ? "bg-green-100 text-green-800 border-green-300"
                                      : connectionDegreeData.degree === 2
                                        ? "bg-blue-100 text-blue-800 border-blue-300"
                                        : "bg-purple-100 text-purple-800 border-purple-300"
                                  }`}
                                  data-testid="badge-connection-degree"
                                >
                                  {connectionDegreeData.degree === 1 ? "1st" : connectionDegreeData.degree === 2 ? "2nd" : "3rd"}
                                </Badge>
                              )}
                            </div>

                            <div className="mt-2 space-y-1">
                              {isMobileWeb ? (
                                <>
                                  <div className="text-sm sm:text-base font-semibold text-black crisp-hero-text leading-tight">
                                    <div>Nearby Local</div>
                                    <div className="font-medium">{hometown}</div>
                                  </div>

                                  {hasValidTravelDestination && (
                                    <div className="text-sm sm:text-base font-semibold text-black crisp-hero-text leading-tight" title={currentTravelPlan!}>
                                      <div>Nearby Traveler</div>
                                      <div className="font-medium">
                                        {formatTravelDestinationShort(currentTravelPlan!) ? formatTravelDestinationShort(currentTravelPlan!) : currentTravelPlan}
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="text-sm sm:text-base font-semibold text-black crisp-hero-text">
                                    Nearby Local <span className="text-black/70">·</span> <span className="text-black">{hometown}</span>
                                  </div>

                                  {hasValidTravelDestination && (
                                    <div className="text-sm sm:text-base font-semibold text-black crisp-hero-text" title={currentTravelPlan!}>
                                      <span className="text-black">Nearby Traveler</span>
                                      <span className="text-black/70"> → </span>
                                      <span className="text-black">
                                        {formatTravelDestinationShort(currentTravelPlan!) ? formatTravelDestinationShort(currentTravelPlan!) : currentTravelPlan}
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                          <div className="mt-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className={
                                isMobileWeb
                                  ? "inline-flex items-center justify-center rounded-lg transition-all font-semibold cursor-pointer px-3 h-8 text-[13px] !bg-blue-600 hover:!bg-blue-700 !text-white !border-0 shadow-sm w-[10.5rem] sm:w-44"
                                  : "inline-flex items-center justify-center rounded-lg transition-all font-semibold cursor-pointer px-3 h-8 text-[13px] !bg-white hover:!bg-white !text-black border border-gray-200 shadow-sm w-[10.5rem] sm:w-44"
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

                            <ConnectButton
                              currentUserId={currentUser?.id || 0}
                              targetUserId={user?.id || 0}
                              targetUsername={user?.username}
                              targetName={user?.name}
                              appearance="ghost"
                              className={
                                isMobileWeb
                                  ? "rounded-lg shadow-sm transition-all px-3 h-8 text-[13px] font-semibold !bg-blue-600 hover:!bg-blue-700 !text-black !border-0 w-[10.5rem] sm:w-44"
                                  : "rounded-lg shadow-sm transition-all px-3 h-8 text-[13px] font-semibold !text-black w-[10.5rem] sm:w-44"
                              }
                            />
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (currentUser) setShowWriteReferenceModal?.(true);
                                else setLocation("/auth");
                              }}
                              variant="outline"
                              className={
                                isMobileWeb
                                  ? "!bg-gradient-to-r !from-[#3B82F6] !to-[#F97316] hover:!from-[#2563EB] hover:!to-[#EA580C] !text-black !border-0 shadow-sm shrink-0 px-2.5 h-8 text-xs"
                                  : "!bg-white hover:!bg-white !text-black border border-gray-200 shadow-sm shrink-0 px-2.5 h-8 text-xs"
                              }
                              data-testid="button-write-reference"
                            >
                              Write Reference
                            </Button>

                            {/* Subtle share icon near actions */}
                            {shareButton(true)}
                          </div>

                          <div className="mt-2">
                            {currentUser ? (
                              <ReportUserButton
                                userId={currentUser.id}
                                targetUserId={user.id}
                                targetUsername={user.username}
                                variant="ghost"
                                size="sm"
                                showIcon={false}
                                appearance="link"
                                className={
                                  isMobileWeb
                                    ? "!text-black hover:!text-black/80 inline-flex items-center px-2 py-1 rounded-md border border-gray-400/70 bg-white/25"
                                    : "!text-black hover:!text-black/80"
                                }
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setLocation("/auth");
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className={
                                  isMobileWeb
                                    ? "text-sm text-black hover:text-red-700 underline underline-offset-2 font-medium inline-flex items-center px-2 py-1 rounded-md border border-gray-400/70 bg-white/25"
                                    : "text-sm text-black/80 hover:text-red-700 underline underline-offset-2 font-medium"
                                }
                                data-radix-dismissable-layer-ignore=""
                              >
                                Report
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* RIGHT: What You Have in Common (desktop only; mobile shows it below hero to avoid duplicates) */}
                      {!isMobileWeb && (
                        <div className="lg:w-[340px] lg:flex-shrink-0">
                          <div className="bg-white/55 backdrop-blur-md rounded-2xl border border-white/40 shadow-lg p-4 max-h-[260px] overflow-hidden">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-bold text-black">What You Have in Common</div>
                              <div className="text-xs font-semibold text-black">{totalCommon} things in common</div>
                            </div>

                            <div className="mt-2 text-xs text-black flex flex-wrap gap-x-3 gap-y-1">
                              <span><span className="font-semibold text-black">{sharedContactsCount}</span> contacts</span>
                              <span><span className="font-semibold text-black">{sharedCountries.length}</span> countries</span>
                              {sharedLanguagesCountForDisplay > 0 && (
                                <span><span className="font-semibold text-black">{sharedLanguagesCountForDisplay}</span> languages</span>
                              )}
                            </div>

                            <div className="mt-3">
                              <div className="text-xs font-semibold text-black mb-1">Shared interests ({sharedInterests.length})</div>
                              <div className="flex flex-wrap gap-1.5 max-h-[92px] overflow-hidden">
                                {visibleInterestPills.length > 0 ? (
                                  visibleInterestPills.map((interest) => (
                                    <span
                                      key={interest}
                                      className="pill-interests !bg-white !text-black !border !border-gray-200 !shadow-none dark:!bg-white dark:!text-black dark:!border-gray-200 dark:!shadow-none"
                                    >
                                      {interest}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-black">No shared interests yet</span>
                                )}
                              </div>

                              {hasOverflow && (
                                <div className="mt-2">
                                  <button
                                    type="button"
                                    className="text-xs font-semibold !text-black hover:!text-black underline underline-offset-2"
                                    onClick={() => setSeeAllCommonOpen(true)}
                                    data-testid="button-see-all-common"
                                  >
                                    See all
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tab bar (already text-only on web) */}
                    <div className="w-full mt-5 relative">
                      <ProfileTabBar {...props} variant="hero" />
                      {isMobileWeb && (
                        <div
                          aria-hidden
                          className="pointer-events-none absolute right-0 top-0 h-full w-10 flex items-center justify-end pr-1 bg-gradient-to-l from-white/70 to-transparent"
                        >
                          <span className="text-black/70 text-lg leading-none">›</span>
                        </div>
                      )}
                    </div>

                    {/* See all modal */}
                    <Dialog open={seeAllCommonOpen} onOpenChange={setSeeAllCommonOpen}>
                      <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-900">
                        <DialogHeader>
                          <DialogTitle className="text-gray-900 dark:text-white">What You Have in Common</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div className="text-sm text-gray-700 dark:text-gray-200">
                            <span className="font-semibold">{totalCommon}</span> things in common
                          </div>

                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Shared interests ({sharedInterests.length})</div>
                            <div className="flex flex-wrap gap-2">
                              {sharedInterests.length > 0 ? sharedInterests.map((interest) => (
                                <span key={interest} className="pill-interests">
                                  {interest}
                                </span>
                              )) : (
                                <span className="text-sm text-gray-600 dark:text-gray-300">None yet</span>
                              )}
                            </div>
                          </div>

                          <div className="text-sm text-gray-700 dark:text-gray-200">
                            <div className="font-semibold text-gray-900 dark:text-white mb-1">Counts</div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              <span><span className="font-semibold">{sharedContactsCount}</span> shared contacts</span>
                              <span><span className="font-semibold">{sharedCountries.length}</span> shared countries</span>
                              {sharedLanguagesCountForDisplay > 0 && (
                                <span><span className="font-semibold">{sharedLanguagesCountForDisplay}</span> shared languages</span>
                              )}
                            </div>
                          </div>
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
                className={`w-40 h-40 rounded-full overflow-hidden cursor-pointer ring-4 ring-white/90 shadow-2xl ${user?.profileImage ? 'hover:ring-white transition-all' : ''}`}
                onClick={() => { if (user?.profileImage) setShowExpandedPhoto(true); }}
                title={user?.profileImage ? "Click to enlarge photo" : undefined}
              >
                <SimpleAvatar user={user} size="xl" className="w-full h-full block object-cover" />
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
              {/* Mobile web: keep badge centered under avatar */}
              {!isNativeIOSApp() && isMobileWeb && user?.newToTownUntil && new Date(user.newToTownUntil) > new Date() && (
                <span className="mt-2 inline-flex items-center self-center whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold bg-green-100 border border-green-300 text-black shadow-sm">
                  New to Town
                </span>
              )}
              {/* New to Town badge - directly below avatar (desktop other-user) */}
              {!isNativeIOSApp() && !isMobileWeb && user?.newToTownUntil && new Date(user.newToTownUntil) > new Date() && (
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
              <span className={`text-base sm:text-lg font-medium break-words crisp-hero-text ${isDesktopOtherUser ? '!text-black' : !isNativeIOSApp() ? 'text-black md:text-black' : ''}`} title={hometown} style={isNativeIOSApp() ? { color: '#000' } : undefined}>{hometown}</span>
              {hasValidTravelDestination && (
                <>
                  <span className="text-base sm:text-lg lg:text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1 crisp-hero-text">Nearby Traveler</span>
                  <span className={`text-base sm:text-lg font-medium break-words crisp-hero-text ${isDesktopOtherUser ? '!text-black' : !isNativeIOSApp() ? 'text-black md:text-black' : ''}`} title={currentTravelPlan!} style={isNativeIOSApp() ? { color: '#000' } : undefined}>
                    {!isNativeIOSApp() && formatTravelDestinationShort(currentTravelPlan!) ? formatTravelDestinationShort(currentTravelPlan!) : currentTravelPlan}
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
                    className="flex items-center gap-1.5 text-sm font-medium text-black mt-1 crisp-hero-text hover:underline underline-offset-2 text-left"
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
                          <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold break-all text-black lg:!text-white lg:[text-shadow:0_1px_2px_rgba(0,0,0,0.65)] crisp-hero-text">
                            @{user?.username}
                          </h1>
                        </div>
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
                                  className="inline-flex items-center justify-center rounded-lg shadow-md transition-all font-semibold cursor-pointer px-4 py-2 text-sm bg-white hover:bg-gray-50 text-black border border-gray-300"
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
                                  appearance="ghost"
                                  className="w-full rounded-lg shadow-md transition-all px-4 py-2 text-sm font-semibold !bg-blue-600 hover:!bg-blue-700 !text-white !border-0"
                                />
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {currentUser ? (
                                  <Button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setShowWriteReferenceModal?.(true);
                                    }}
                                    variant="outline"
                                    className="bg-white hover:bg-gray-50 text-black border border-gray-300 shrink-0 px-4 py-2 text-sm"
                                    data-testid="button-write-reference"
                                  >
                                    Write Reference
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    onClick={() => setLocation('/auth')}
                                    variant="outline"
                                    className="bg-white hover:bg-gray-50 text-black border border-gray-300 shrink-0 px-4 py-2 text-sm"
                                    data-testid="button-write-reference"
                                  >
                                    Write Reference
                                  </Button>
                                )}
                                {/* Other user's profile: share button near action buttons (not beside username) */}
                                {shareButton(true)}
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
                                      appearance="ghost"
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
                                className={
                                  isMobileWeb
                                    ? `inline-flex items-center rounded-lg shadow-md transition-all font-semibold cursor-pointer px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white border-0`
                                    : `inline-flex items-center rounded-lg shadow-md transition-all font-medium cursor-pointer ${isNativeIOSApp() ? 'shrink-0 px-4 py-1.5 text-sm' : 'px-4 py-1.5 text-sm'} bg-white hover:bg-gray-50 text-black border border-gray-300`
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
                              <ConnectButton
                                currentUserId={currentUser?.id || 0}
                                targetUserId={user?.id || 0}
                                targetUsername={user?.username}
                                targetName={user?.name}
                                appearance="ghost"
                                className="rounded-lg shadow-md transition-all shrink-0 px-4 py-1.5 text-sm !bg-blue-600 hover:!bg-blue-700 !text-white !border-0"
                              />
                              {currentUser ? (
                                <Button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowWriteReferenceModal?.(true);
                                  }}
                                  className="bg-white hover:bg-gray-50 text-black border border-gray-300 shrink-0 px-4 py-1.5 text-sm"
                                  data-testid="button-write-reference"
                                >
                                  Write Reference
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  onClick={() => setLocation('/auth')}
                                  className="bg-white hover:bg-gray-50 text-black border border-gray-300 shrink-0 px-4 py-1.5 text-sm"
                                  data-testid="button-write-reference"
                                >
                                  Write Reference
                                </Button>
                              )}
                              {/* Other user's profile: share button near action buttons (not beside username) */}
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
                                    appearance="ghost"
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
