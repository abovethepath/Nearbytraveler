import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfileImageUrl } from "@/components/simple-avatar";
import { AuthContext } from "@/App";
import { useLocation } from "wouter";
import Logo from "@/components/logo";
import { authStorage } from "@/lib/auth";
import { isNativeIOSApp } from "@/lib/nativeApp";
import { getApiBaseUrl } from "@/lib/queryClient";

export function MobileTopNav() {
  const isNative = isNativeIOSApp();
  const authContext = React.useContext(AuthContext);
  const { user, logout } = authContext;
  const [location, setLocation] = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // CRITICAL: Session is the ONLY source of truth for avatar. Never trust localStorage first.
  // Prevents showing wrong user (e.g. admin) when a different user is logged in.
  useEffect(() => {
    let cancelled = false;
    const fetchSessionUser = async () => {
      try {
        const sessionRes = await fetch(`${getApiBaseUrl()}/api/auth/user`, { credentials: 'include' });
        if (cancelled) return;
        if (sessionRes.ok) {
          const sessionUser = await sessionRes.json();
          if (sessionUser?.id) {
            setCurrentUser(sessionUser);
            authStorage.setUser(sessionUser);
            return;
          }
        }
        setCurrentUser(null);
      } catch {
        if (!cancelled) setCurrentUser(null);
      }
    };
    fetchSessionUser();
    return () => { cancelled = true; };
  }, []);

  // Sync from AuthContext when it updates (e.g. after login)
  useEffect(() => {
    if (!user) {
      setCurrentUser(null);
    } else if (user?.id && user?.username && (!currentUser || String(currentUser.id) === String(user.id))) {
      setCurrentUser(user);
    }
  }, [user?.id, user?.username, user?.profileImage, user, currentUser?.id]);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e?.detail) {
        setCurrentUser(e.detail);
      }
    };
    window.addEventListener("profilePhotoUpdated", handleUpdate);
    window.addEventListener("userDataUpdated", handleUpdate);
    window.addEventListener("profileUpdated", handleUpdate);
    return () => {
      window.removeEventListener("profilePhotoUpdated", handleUpdate);
      window.removeEventListener("userDataUpdated", handleUpdate);
      window.removeEventListener("profileUpdated", handleUpdate);
    };
  }, []);

  const openSearch = () => {
    // Use the same “full search” experience already wired on Home via openAdvancedFilters.
    if (location !== "/") setLocation("/");
    setTimeout(() => {
      window.dispatchEvent(new Event("openAdvancedFilters"));
    }, 0);
  };

  const handleAvatarTap = async (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser?.id) {
      setLocation("/profile");
      return;
    }
    // Navigate to profile - do NOT sign out on API errors (network issues, etc.)
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/user`, { credentials: 'include' });
      if (res.ok) {
        const sessionUser = await res.json();
        if (sessionUser?.id && String(sessionUser.id) !== String(currentUser.id)) {
          authStorage.clearUser();
          window.location.href = '/signin';
          return;
        }
      }
      // On 401 or error: still navigate to profile, don't sign out
    } catch {
      // On network error: navigate to profile, don't sign out
    }
    setLocation(`/profile/${currentUser.id}`);
  };

  const handleLogout = async () => {
    if (!authContext.user && currentUser) {
      localStorage.clear();
      sessionStorage.clear();
      authStorage.clearUser();
      window.location.href = isNative ? '/home?native=ios' : '/';
    } else {
      await logout();
    }
  };

  if (isNative) {
    return null;
  }

  return (
    <>
      <header 
        className="fixed top-0 left-0 right-0 z-[10000] md:hidden ios-nav-bar mobile-top-nav"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div 
          className="h-11 flex items-center justify-between px-4"
          style={{ minHeight: '44px' }}
        >
          <button
            type="button"
            aria-label="Search"
            data-testid="button-mobile-search"
            className="ios-touch-target flex items-center justify-center rounded-xl text-gray-700 dark:text-gray-200 active:bg-gray-200/60 dark:active:bg-gray-700/60"
            style={{
              width: '44px',
              height: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openSearch();
            }}
          >
            <Search className="w-[22px] h-[22px] pointer-events-none" />
          </button>

          <div className="flex-1 flex justify-center pointer-events-none">
            <Logo variant="navbar" />
          </div>

          <button
            type="button"
            aria-label="Profile"
            className="ios-touch-target flex items-center justify-center"
            style={{
              width: '44px',
              height: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
            onClick={handleAvatarTap}
          >
            <Avatar className="w-8 h-8 border-2 border-gray-200/80 dark:border-gray-600/80 pointer-events-none ring-1 ring-white/20">
              <AvatarImage
                src={getProfileImageUrl(currentUser) || undefined}
                alt={currentUser?.name || currentUser?.username || "User"}
                className="pointer-events-none"
              />
              <AvatarFallback className="text-sm bg-orange-500 text-white pointer-events-none">
                {(currentUser?.name || currentUser?.fullName || currentUser?.displayName || currentUser?.username || '').charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </header>
    </>
  );
}
