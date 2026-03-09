import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { isNativeIOSApp } from "@/lib/nativeApp";
import { useTheme } from "@/components/theme-provider";
import type { ProfilePageProps } from "./profile-complete-types";

type ProfileTabBarVariant = "hero" | "standalone";

interface ProfileTabBarProps extends ProfilePageProps {
  variant: ProfileTabBarVariant;
}

export function ProfileTabBar(props: ProfileTabBarProps) {
  const {
    variant,
    activeTab,
    openTab,
    user,
    isOwnProfile,
    userConnections,
    photos,
    userTravelMemories,
    userReferences,
    travelPlans,
    countriesVisited,
    userChatrooms,
    userVouches,
    setTriggerQuickMeetup,
  } = props as Record<string, any>;

  const [hasClickedTab, setHasClickedTab] = React.useState(false);

  const handleTabClick = React.useCallback((tab: string) => {
    setHasClickedTab(true);
    openTab(tab);
  }, [openTab]);

  const isHero = variant === "hero";
  const isDesktopWeb = !isNativeIOSApp();
  const isOtherHero = isHero && !isOwnProfile;
  const isOwnHero = isHero && !!isOwnProfile;
  const isMobileWeb =
    !isNativeIOSApp() &&
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(max-width: 767.98px)").matches;
  const isDesktopHero = isHero && isDesktopWeb && !isMobileWeb;
  // Web: About section is already visible below the hero, so don't show an About hero tab.
  // iOS: keep About in the hero/tab navigation as requested previously.
  const showAboutTab = !(isHero && isDesktopWeb);

  // Hero background is a colorful gradient across themes.
  // For other-user hero, keep badge numbers BLACK (requested explicitly).
  const badgeClass = isOtherHero
    ? "ml-2 inline-flex items-center justify-center h-[18px] md:h-[20px] lg:h-[22px] min-w-[18px] md:min-w-[20px] lg:min-w-[22px] px-1.5 text-[11px] md:text-[12px] lg:text-xs font-bold rounded-full bg-white/70 text-black border border-black/20"
    : (isOwnHero
        ? "ml-1.5 inline-flex items-center justify-center h-[18px] md:h-[20px] lg:h-[22px] min-w-[18px] md:min-w-[20px] lg:min-w-[22px] px-1.5 text-[11px] md:text-[12px] lg:text-xs font-bold rounded-full bg-[#1a1a1a] !text-white border border-white/15"
        : (isHero
            ? "ml-2 inline-flex items-center justify-center h-[18px] min-w-[18px] px-1.5 text-[11px] font-bold rounded-full bg-[#FF6B35] text-white border border-black/20"
            : (isDesktopWeb
                ? "ml-2 inline-flex items-center justify-center h-[18px] min-w-[18px] px-1.5 text-[11px] font-bold rounded-full bg-teal-600 text-white"
                : "ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-white/20 text-white")))

  const tabWebBase = isHero
    ? "relative px-0 py-2.5 text-xs md:text-sm lg:text-base leading-tight font-semibold transition-colors select-none whitespace-nowrap"
    : "relative px-0 py-2 text-sm sm:text-base font-semibold transition-colors select-none";
  // Hero background is a gradient that does not change by theme, so keep tab text dark/crisp even in dark mode.
  const tabWebInactive = isHero
    ? "text-black hover:text-black"
    : "text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white";
  const tabWebActive = isHero
    ? "text-black after:absolute after:left-0 after:right-0 after:-bottom-[1px] after:h-[2px] after:bg-orange-500 after:rounded-full"
    : "text-orange-600 dark:text-orange-400 after:absolute after:left-0 after:right-0 after:-bottom-[1px] after:h-[2px] after:bg-orange-500 after:rounded-full";

  const tabLegacyBase = "text-sm sm:text-base font-semibold px-3 py-2 rounded-lg transition-all";
  const tabLegacyActive = isHero
    ? "bg-white/70 text-black border border-white/70 shadow-md"
    : "bg-blue-600 text-white border border-blue-600 shadow-md";
  const tabLegacyInactive = isHero
    ? "bg-white/25 border border-white/50 text-black hover:bg-white/35 hover:border-white/60 backdrop-blur-sm"
    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-100 dark:hover:bg-gray-600 dark:hover:border-gray-400";

  const btn = (active: boolean) => {
    if (isDesktopWeb) return `${tabWebBase} ${active ? tabWebActive : tabWebInactive}`;
    return `${tabLegacyBase} ${active ? tabLegacyActive : tabLegacyInactive}`;
  };

  // Use the theme provider as source of truth — no MutationObserver needed.
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  // Explicit tab label + badge styles (requested).
  const heroTextStyle = { color: "#000000" } as React.CSSProperties;
  // Light mode → black numbers on white badge; Dark mode → white numbers on dark badge.
  const badgeStyle = {
    backgroundColor: isDarkMode ? "rgba(0,0,0,0.60)" : "rgba(255,255,255,0.90)",
    color: isDarkMode ? "#FFFFFF" : "#000000",
  } as React.CSSProperties;

  const showHint = !isOwnProfile && !hasClickedTab;
  const firstTabPulseClass = showHint ? "profile-tab-pulse" : "";

  return (
    <div>
      <div
        className={`profile-tabbar ${isHero ? "profile-tabbar-hero" : "profile-tabbar-standalone"} flex ${
          isDesktopHero
            ? "flex-nowrap"
            : (isHero && isMobileWeb ? "flex-nowrap overflow-x-auto overflow-y-hidden" : "flex-wrap")
        } items-end ${isDesktopHero ? "gap-2 sm:gap-2 lg:gap-3" : "gap-4 sm:gap-5"} ${
          isHero ? "pt-4 mt-4" : ""
        } ${isDesktopWeb ? (isHero ? "border-b border-gray-200/70 pb-1" : "border-b border-gray-200 dark:border-white/15 pb-1") : ""}`}
        style={isHero && isMobileWeb ? { WebkitOverflowScrolling: "touch" } : undefined}
      >
        {showAboutTab && (
          <button
            role="tab"
            aria-selected={activeTab === "about"}
            aria-controls="panel-about"
            onClick={() => handleTabClick("about")}
            className={`${btn(activeTab === "about")} inline-flex items-center gap-1 ${firstTabPulseClass}`}
            data-testid="tab-about"
            style={heroTextStyle}
          >
            About
          </button>
        )}

        <button
          role="tab"
          aria-selected={activeTab === "contacts"}
          aria-controls="panel-contacts"
          onClick={() => handleTabClick("contacts")}
          className={`${btn(activeTab === "contacts")} inline-flex items-center gap-1 ${!showAboutTab ? firstTabPulseClass : ""}`}
          data-testid="tab-contacts"
          style={heroTextStyle}
        >
          Contacts
          <span className={badgeClass} style={badgeStyle}>
            {userConnections?.length || 0}
          </span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "photos"}
          aria-controls="panel-photos"
          onClick={() => handleTabClick("photos")}
          className={`${btn(activeTab === "photos")} inline-flex items-center gap-1`}
          data-testid="tab-photos"
          style={heroTextStyle}
        >
          Photos
          <span className={badgeClass} style={badgeStyle}>
            {(photos?.length || 0) + (userTravelMemories?.length || 0)}
          </span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "references"}
          aria-controls="panel-references"
          onClick={() => handleTabClick("references")}
          className={`${btn(activeTab === "references")} inline-flex items-center gap-1`}
          data-testid="tab-references"
          style={heroTextStyle}
        >
          References
          <span className={badgeClass} style={badgeStyle}>
            {userReferences?.length || 0}
          </span>
        </button>

        {user?.userType !== "business" && (
          <button
            role="tab"
            aria-selected={activeTab === "travel"}
            aria-controls="panel-travel"
            onClick={() => handleTabClick("travel")}
            className={`${btn(activeTab === "travel")} inline-flex items-center gap-1`}
            data-testid="tab-travel"
            style={heroTextStyle}
          >
            Travel Plans
            <span className={badgeClass} style={badgeStyle}>
              {travelPlans?.length || 0}
            </span>
          </button>
        )}

        {user?.userType !== "business" && (
          <button
            role="tab"
            aria-selected={activeTab === "countries"}
            aria-controls="panel-countries"
            onClick={() => handleTabClick("countries")}
            className={`${btn(activeTab === "countries")} inline-flex items-center gap-1`}
            data-testid="tab-countries"
            style={heroTextStyle}
          >
            Countries
            <span className={badgeClass} style={badgeStyle}>
              {countriesVisited?.length || 0}
            </span>
          </button>
        )}

        {isOwnProfile && user?.userType !== "business" && (
          <button
            role="tab"
            aria-selected={activeTab === "chatrooms"}
            aria-controls="panel-chatrooms"
            onClick={() => handleTabClick("chatrooms")}
            className={`${btn(activeTab === "chatrooms")} inline-flex items-center gap-1`}
            data-testid="tab-chatrooms"
            style={heroTextStyle}
          >
            Chatrooms
            <span className={badgeClass} style={badgeStyle}>
              {userChatrooms?.length || 0}
            </span>
          </button>
        )}

        {user?.userType !== "business" && (
          <button
            role="tab"
            aria-selected={activeTab === "vouches"}
            aria-controls="panel-vouches"
            onClick={() => handleTabClick("vouches")}
            className={`${btn(activeTab === "vouches")} inline-flex items-center gap-1`}
            data-testid="tab-vouches"
            style={heroTextStyle}
          >
            Vouches
            <span className={badgeClass} style={badgeStyle}>
              {userVouches?.length || 0}
            </span>
          </button>
        )}

        {(user as any)?.ambassadorStatus === 'active' && user?.userType !== "business" && (
          <button
            role="tab"
            aria-selected={activeTab === "ambassador"}
            aria-controls="panel-ambassador"
            onClick={() => handleTabClick("ambassador")}
            className={`${btn(activeTab === "ambassador")} inline-flex items-center gap-1`}
            data-testid="tab-ambassador"
            style={activeTab === "ambassador" ? undefined : heroTextStyle}
          >
            ⭐ Ambassador
          </button>
        )}

        {!isDesktopWeb && isOwnProfile && user?.userType !== "business" && (
          <Button
            onClick={() => {
              const widget = document.querySelector('[data-testid="quick-meet-widget"]');
              if (widget) widget.scrollIntoView({ behavior: "smooth", block: "center" });
              setTriggerQuickMeetup?.(true);
              setTimeout(() => setTriggerQuickMeetup?.(false), 500);
            }}
            variant={isDesktopWeb ? "ghost" : "default"}
            className={
              isDesktopWeb
                ? "ml-auto -mb-1 px-2 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-transparent dark:text-gray-300 dark:hover:text-white"
                : `bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 border-0 px-4 sm:px-6 py-2 text-sm font-medium rounded-lg flex items-center justify-center ${isHero ? "text-black" : ""}`
            }
            style={!isDesktopWeb && isHero ? { color: "black" } : undefined}
            data-testid="button-lets-meet-now"
          >
            <Calendar
              className={isDesktopWeb ? "w-4 h-4 mr-2" : "w-4 h-4 mr-2"}
              style={!isDesktopWeb && isHero ? { color: "black" } : undefined}
            />
            <span style={!isDesktopWeb && isHero ? { color: "black" } : undefined}>Let's Meet Now</span>
          </Button>
        )}
      </div>
      {showHint && (
        <p
          style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.4)',
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: '6px',
            lineHeight: 1,
          }}
        >
          {isMobileWeb ? 'Tap a tab to explore' : 'Click a tab to explore'}
        </p>
      )}
    </div>
  );
}
