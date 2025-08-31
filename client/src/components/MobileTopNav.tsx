import React, { useState, useEffect } from "react";
import { Bell, Menu, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AuthContext } from "@/App";
import { useLocation } from "wouter";
import Logo from "@/components/logo";
import { authStorage } from "@/lib/auth";

export function MobileTopNav() {
  const authContext = React.useContext(AuthContext);
  const { user, logout } = authContext;
  
  console.log('🔍 MobileTopNav AuthContext:', {
    hasContext: !!authContext,
    hasLogout: typeof logout === 'function',
    user: user?.username
  });
  const [, setLocation] = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // hydrate currentUser from best source available - fixed for auth consistency
  useEffect(() => {
    console.log('🔍 MobileTopNav hydrating user - AuthContext user:', user?.username);
    
    // Try multiple sources in order of preference
    let effectiveUser = null;
    
    // 1. AuthContext user (should be primary)
    if (user?.username) {
      effectiveUser = user;
      console.log('✅ Using AuthContext user:', user.username);
    } 
    // 2. AuthStorage 
    else {
      const storedUser = authStorage.getUser();
      if (storedUser?.username) {
        effectiveUser = storedUser;
        console.log('✅ Using authStorage user:', storedUser.username);
      } else {
        // 3. Raw localStorage as fallback
        try {
          const raw = localStorage.getItem("user") || localStorage.getItem("travelconnect_user");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.username) {
              effectiveUser = parsed;
              console.log('✅ Using localStorage user:', parsed.username);
            }
          }
        } catch {}
      }
    }
    
    setCurrentUser(effectiveUser);
    console.log('🔍 Final currentUser set to:', effectiveUser?.username || 'null');
  }, [user]);

  // close on profile updates
  useEffect(() => {
    const handleUpdate = (e: any) => setCurrentUser(e?.detail ?? currentUser);
    window.addEventListener("profilePhotoUpdated", handleUpdate);
    window.addEventListener("userDataUpdated", handleUpdate);
    window.addEventListener("profileUpdated", handleUpdate);
    return () => {
      window.removeEventListener("profilePhotoUpdated", handleUpdate);
      window.removeEventListener("userDataUpdated", handleUpdate);
      window.removeEventListener("profileUpdated", handleUpdate);
    };
  }, [currentUser]);

  // lock body scroll when menu open
  useEffect(() => {
    if (showDropdown) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showDropdown]);

  const go = (path: string) => {
    setShowDropdown(false);
    setLocation(path);
  };

  return (
    <>
      {/* NAV BAR (no inline 100vw — prevents ghost scrollbar) */}
      <div className="mobile-top-nav fixed inset-x-0 top-0 z-[1000] h-16 w-full bg-white dark:bg-gray-900 shadow-sm md:hidden overflow-visible">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Hamburger */}
          <div className="flex items-center">
            <Button
              aria-expanded={showDropdown}
              aria-controls="mobile-menu"
              variant="ghost"
              size="sm"
              className="w-9 h-9 p-0"
              onClick={() => setShowDropdown((s) => !s)}
            >
              {showDropdown ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Center: Logo */}
          <div className="flex-1 flex justify-center">
            <Logo variant="navbar" />
          </div>

          {/* Right: Bell + Avatar */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="relative w-9 h-9 p-0"
              onClick={() => go("/notifications")}
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
            </Button>

            <Avatar
              className="w-9 h-9 cursor-pointer border-2 border-gray-200 dark:border-gray-700"
              onClick={() => {
                setShowDropdown(false);
                currentUser?.id ? go(`/profile/${currentUser.id}`) : go("/profile");
              }}
            >
              <AvatarImage
                src={currentUser?.profileImage || undefined}
                alt={currentUser?.name || currentUser?.username || "User"}
              />
              <AvatarFallback className="text-xs bg-blue-500 text-white">
                {currentUser?.name?.charAt(0)?.toUpperCase() ||
                  currentUser?.username?.charAt(0)?.toUpperCase() ||
                  "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* OVERLAY (below nav so hamburger remains clickable) */}
      {showDropdown && (
        <div
          onClick={() => setShowDropdown(false)}
          className="fixed inset-0 top-16 z-[998] bg-black/30 md:hidden"
        />
      )}

      {/* DROPDOWN (sibling, not inside the 64px nav; no more nav scrollbar) */}
      {showDropdown && (
        <div
          id="mobile-menu"
          className="fixed top-16 left-0 right-0 z-[999] md:hidden
                     bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700
                     shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain"
        >
          <div className="flex flex-col py-2">
            {currentUser?.userType === "business" ? (
              <>
                <button className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => go("/")}>
                  Business Dashboard
                </button>
                <button className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => go("/business-dashboard")}>
                  Manage Deals
                </button>
                <button className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => go("/create-event")}>
                  Create Event
                </button>
                <button className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => go("/events")}>
                  View Events
                </button>
                <button className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => go("/chatrooms")}>
                  Chat Rooms
                </button>
                <button className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => go("/messages")}>
                  Customer Messages
                </button>
                <button className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => go(currentUser?.id ? `/profile/${currentUser.id}` : "/profile")}>
                  Business Profile
                </button>
                <button className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => go("/discover")}>
                  View Cities
                </button>
                <button className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => go("/welcome-business")}>
                  Business Welcome
                </button>
              </>
            ) : (
              <>
                <button className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => go("/")}>
                  Home
                </button>
                <button className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => go("/discover")}>
                  Cities
                </button>
                <button className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => go("/events")}>
                  Events
                </button>
                <button className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => go("/plan-trip")}>
                  Plan Trip
                </button>
                <button className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => go("/quick-meetups")}>
                  Quick Meetups
                </button>
                <button className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => go("/chatrooms")}>
                  Chat Rooms
                </button>
                <button className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => go("/match-in-city")}>
                  City Match
                </button>
                <button className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => go("/connect")}>
                  Connect
                </button>
                <button className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => go("/messages")}>
                  Messages
                </button>
                <button className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => go(currentUser?.id ? `/profile/${currentUser.id}` : "/profile")}>
                  Profile
                </button>
              </>
            )}

            <button
              className="px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-gray-200 dark:border-gray-700 text-red-600 dark:text-red-400 font-medium"
              onClick={() => {
                console.log('🚪 Mobile logout button clicked');
                console.log('🚪 CurrentUser:', currentUser?.username);
                console.log('🚪 AuthContext user:', authContext.user?.username);
                setShowDropdown(false);
                
                // Force logout by clearing everything manually if AuthContext is inconsistent
                if (!authContext.user && currentUser) {
                  console.log('🚪 AuthContext inconsistent - doing manual logout');
                  // Clear all auth data manually
                  localStorage.clear();
                  sessionStorage.clear();
                  authStorage.clearUser();
                  window.location.href = '/';
                } else {
                  console.log('🚪 Using AuthContext logout');
                  logout();
                }
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}