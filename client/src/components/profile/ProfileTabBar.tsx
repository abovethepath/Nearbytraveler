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

  const tabBase = "text-sm sm:text-base font-semibold px-3 py-2 rounded-lg transition-all";
  const tabActive = isHero ? "bg-white text-gray-900 border border-white shadow-md" : "bg-blue-600 text-white border border-blue-600 shadow-md";
  const tabInactive = isHero
    ? (isDesktopWeb ? "bg-white/20 border border-white/40 !text-gray-900 hover:bg-white/30 hover:border-white/50 backdrop-blur-sm" : "bg-white/20 border border-white/40 text-white hover:bg-white/30 hover:border-white/50 backdrop-blur-sm")
    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-100 dark:hover:bg-gray-600 dark:hover:border-gray-400";

  const btn = (active: boolean) =>
    `${tabBase} ${active ? tabActive : tabInactive}`;

  return (
    <div className={`flex flex-wrap gap-2 sm:gap-3 lg:gap-4 ${isHero ? "pt-4 mt-4 border-t border-white/30" : ""}`}>
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
          <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${activeTab === "contacts" ? (isDesktopWeb && isHero ? "bg-black/20 text-black" : "bg-white/20 text-white") : "bg-blue-500 text-white"}`}>
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
          <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${activeTab === "photos" ? "bg-white/20 text-white" : "bg-purple-500 text-white"}`}>
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
          <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${activeTab === "references" ? (isDesktopWeb && isHero ? "bg-black/20 text-black" : "bg-white/20 text-white") : "bg-orange-500 lg:bg-[#e8834a] text-white"}`}>
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
            <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${activeTab === "travel" ? (isDesktopWeb && isHero ? "bg-black/20 text-black" : "bg-white/20 text-white") : "bg-orange-500 lg:bg-[#e8834a] text-white"}`}>
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
            <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${activeTab === "countries" ? (isDesktopWeb && isHero ? "bg-black/20 text-black" : "bg-white/20 text-white") : "bg-orange-500 lg:bg-[#e8834a] text-white"}`}>
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
            <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${activeTab === "chatrooms" ? "bg-white/20 text-white" : "bg-purple-500 text-white"}`}>
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
          className={`${tabBase} ${activeTab === "vouches" ? (isHero ? "bg-white text-gray-900 border border-white shadow-md" : "bg-purple-600 text-white border border-purple-600") : tabInactive}`}
          data-testid="tab-vouches"
        >
          Vouches
          <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${activeTab === "vouches" ? (isDesktopWeb && isHero ? "bg-black/20 text-black" : "bg-white/20 text-white") : "bg-purple-500 text-white"}`}>
            {userVouches?.length || 0}
          </span>
        </button>
      )}

      {isOwnProfile && user?.userType !== "business" && (
        <Button
          onClick={() => {
            const widget = document.querySelector('[data-testid="quick-meet-widget"]');
            if (widget) widget.scrollIntoView({ behavior: "smooth", block: "center" });
            setTriggerQuickMeetup?.(true);
            setTimeout(() => setTriggerQuickMeetup?.(false), 500);
          }}
          className={`bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 dark:from-blue-500 dark:to-orange-500 dark:hover:from-blue-600 dark:hover:to-orange-600 border-0 px-4 sm:px-6 py-2 text-sm font-medium rounded-lg flex items-center justify-center ${isHero ? "text-black" : ""}`}
          style={isHero ? { color: "black" } : undefined}
          data-testid="button-lets-meet-now"
        >
          <Calendar className="w-4 h-4 mr-2" style={isHero ? { color: "black" } : undefined} />
          <span style={isHero ? { color: "black" } : undefined}>Let's Meet Now</span>
        </Button>
      )}
    </div>
  );
}
