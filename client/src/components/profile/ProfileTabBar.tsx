import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { isNativeIOSApp } from "@/lib/nativeApp";
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

  const isHero = variant === "hero";
  const isDesktopWeb = !isNativeIOSApp();
  // Web: About section is already visible below the hero, so don't show an About hero tab.
  // iOS: keep About in the hero/tab navigation as requested previously.
  const showAboutTab = !(isHero && isDesktopWeb);

  const badgeClass = isDesktopWeb
    ? "ml-2 inline-flex items-center justify-center h-[18px] min-w-[18px] px-1.5 text-[11px] font-bold rounded-full bg-teal-600 text-white"
    : "ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-white/20 text-white";

  const tabWebBase =
    "relative px-0 py-2 text-sm sm:text-base font-semibold transition-colors select-none";
  const tabWebInactive = "text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white";
  const tabWebActive =
    "text-orange-600 dark:text-orange-400 after:absolute after:left-0 after:right-0 after:-bottom-[1px] after:h-[2px] after:bg-orange-500 after:rounded-full";

  const tabLegacyBase = "text-sm sm:text-base font-semibold px-3 py-2 rounded-lg transition-all";
  const tabLegacyActive = isHero
    ? "bg-white text-gray-900 border border-white shadow-md"
    : "bg-blue-600 text-white border border-blue-600 shadow-md";
  const tabLegacyInactive = isHero
    ? "bg-white/20 border border-white/40 text-white hover:bg-white/30 hover:border-white/50 backdrop-blur-sm"
    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-100 dark:hover:bg-gray-600 dark:hover:border-gray-400";

  const btn = (active: boolean) => {
    if (isDesktopWeb) return `${tabWebBase} ${active ? tabWebActive : tabWebInactive}`;
    return `${tabLegacyBase} ${active ? tabLegacyActive : tabLegacyInactive}`;
  };

  return (
    <div
      className={`flex flex-wrap items-end gap-4 sm:gap-5 ${
        isHero ? "pt-4 mt-4" : ""
      } ${isDesktopWeb ? "border-b border-gray-200 dark:border-white/15 pb-1" : ""}`}
    >
      {showAboutTab && (
        <button
          role="tab"
          aria-selected={activeTab === "about"}
          aria-controls="panel-about"
          onClick={() => openTab("about")}
          className={btn(activeTab === "about")}
          data-testid="tab-about"
        >
          About
        </button>
      )}

      <button
        role="tab"
        aria-selected={activeTab === "contacts"}
        aria-controls="panel-contacts"
        onClick={() => openTab("contacts")}
        className={btn(activeTab === "contacts")}
        data-testid="tab-contacts"
      >
        Contacts
        {!!(userConnections?.length) && (
          <span className={badgeClass}>
            {userConnections.length}
          </span>
        )}
      </button>

      <button
        role="tab"
        aria-selected={activeTab === "photos"}
        aria-controls="panel-photos"
        onClick={() => openTab("photos")}
        className={btn(activeTab === "photos")}
        data-testid="tab-photos"
      >
        Photos
        {!!(photos?.length + (userTravelMemories?.length || 0)) && (
          <span className={badgeClass}>
            {(photos?.length || 0) + (userTravelMemories?.length || 0)}
          </span>
        )}
      </button>

      <button
        role="tab"
        aria-selected={activeTab === "references"}
        aria-controls="panel-references"
        onClick={() => openTab("references")}
        className={btn(activeTab === "references")}
        data-testid="tab-references"
      >
        References
        {(userReferences?.length || 0) > 0 && (
          <span className={badgeClass}>
            {userReferences.length}
          </span>
        )}
      </button>

      {user?.userType !== "business" && (
        <button
          role="tab"
          aria-selected={activeTab === "travel"}
          aria-controls="panel-travel"
          onClick={() => openTab("travel")}
          className={btn(activeTab === "travel")}
          data-testid="tab-travel"
        >
          Travel Plans
          {!!(travelPlans?.length) && (
            <span className={badgeClass}>
              {travelPlans.length}
            </span>
          )}
        </button>
      )}

      {user?.userType !== "business" && (
        <button
          role="tab"
          aria-selected={activeTab === "countries"}
          aria-controls="panel-countries"
          onClick={() => openTab("countries")}
          className={btn(activeTab === "countries")}
          data-testid="tab-countries"
        >
          Countries
          {!!(countriesVisited?.length) && (
            <span className={badgeClass}>
              {countriesVisited.length}
            </span>
          )}
        </button>
      )}

      {isOwnProfile && user?.userType !== "business" && (
        <button
          role="tab"
          aria-selected={activeTab === "chatrooms"}
          aria-controls="panel-chatrooms"
          onClick={() => openTab("chatrooms")}
          className={btn(activeTab === "chatrooms")}
          data-testid="tab-chatrooms"
        >
          Chatrooms
          {!!(userChatrooms?.length) && (
            <span className={badgeClass}>
              {userChatrooms.length}
            </span>
          )}
        </button>
      )}

      {user?.userType !== "business" && (
        <button
          role="tab"
          aria-selected={activeTab === "vouches"}
          aria-controls="panel-vouches"
          onClick={() => openTab("vouches")}
          className={btn(activeTab === "vouches")}
          data-testid="tab-vouches"
        >
          Vouches
          <span className={badgeClass}>
            {userVouches?.length || 0}
          </span>
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
              : `bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 dark:from-blue-500 dark:to-orange-500 dark:hover:from-blue-600 dark:hover:to-orange-600 border-0 px-4 sm:px-6 py-2 text-sm font-medium rounded-lg flex items-center justify-center ${isHero ? "text-black" : ""}`
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
  );
}
