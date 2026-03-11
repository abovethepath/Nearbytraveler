import React, { useState, useEffect, useRef } from "react";
import { Search, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfileImageUrl } from "@/components/simple-avatar";
import { AuthContext } from "@/App";
import { useLocation } from "wouter";
import Logo from "@/components/logo";
import { authStorage } from "@/lib/auth";
import { isNativeIOSApp } from "@/lib/nativeApp";
import { getApiBaseUrl } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import websocketService from "@/services/websocketService";

export function MobileTopNav() {
  const isNative = isNativeIOSApp();
  const authContext = React.useContext(AuthContext);
  const { user, logout } = authContext;
  const [location, setLocation] = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // CRITICAL: Session is the ONLY source of truth for avatar. Never trust localStorage first.
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

  // Notification count for the bell badge — mirrors the Activity tab badge logic
  const qc = useQueryClient();

  const { data: bellNotifications = [] } = useQuery<any[]>({
    queryKey: ['/api/notifications', currentUser?.id],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/notifications/${currentUser!.id}`, {
        credentials: 'include',
        headers: { 'x-user-id': String(currentUser!.id) },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!currentUser?.id,
    refetchInterval: 30000,
  });

  const { data: bellConnectionRequests = [] } = useQuery<any[]>({
    queryKey: ['/api/connections', currentUser?.id, 'requests'],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/connections/${currentUser!.id}/requests`, {
        credentials: 'include',
        headers: { 'x-user-id': String(currentUser!.id) },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!currentUser?.id,
    refetchInterval: 30000,
  });

  const unreadNotifCount =
    (bellNotifications as any[]).filter((n: any) => !n.isRead).length +
    (bellConnectionRequests as any[]).length;

  // Refresh instantly on WS events
  const qcRef = useRef(qc);
  qcRef.current = qc;
  const userIdRef = useRef(currentUser?.id);
  userIdRef.current = currentUser?.id;
  useEffect(() => {
    const refresh = () => {
      if (!userIdRef.current) return;
      qcRef.current.invalidateQueries({ queryKey: ['/api/notifications', userIdRef.current] });
      qcRef.current.invalidateQueries({ queryKey: ['/api/connections', userIdRef.current, 'requests'] });
    };
    websocketService.on('notification', refresh);
    websocketService.on('connection_request', refresh);
    return () => {
      websocketService.off('notification', refresh);
      websocketService.off('connection_request', refresh);
    };
  }, []);

  const openSearch = () => {
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
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div
          className="h-9 flex items-center justify-between px-3"
          style={{ minHeight: '36px' }}
        >
          {/* Left: Search */}
          <button
            type="button"
            aria-label="Search"
            data-testid="button-mobile-search"
            className="ios-touch-target flex items-center justify-center rounded-xl text-gray-700 dark:text-gray-200 active:bg-gray-200/60 dark:active:bg-gray-700/60"
            style={{
              width: '36px',
              height: '36px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openSearch();
            }}
          >
            <Search className="w-[18px] h-[18px] pointer-events-none" />
          </button>

          {/* Center: Logo */}
          <div className="flex-1 flex justify-center pointer-events-none scale-75 origin-center">
            <Logo variant="navbar" />
          </div>

          {/* Right: Bell + Avatar */}
          <div className="flex items-center gap-1">
            {currentUser?.id && (
              <button
                type="button"
                aria-label="Activity"
                className="ios-touch-target relative flex items-center justify-center rounded-xl text-gray-700 dark:text-gray-200 active:bg-gray-200/60 dark:active:bg-gray-700/60"
                style={{
                  width: '36px',
                  height: '36px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLocation('/activity');
                }}
              >
                <Bell className="w-[18px] h-[18px] pointer-events-none" />
                {unreadNotifCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      minWidth: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f97316',
                      color: 'white',
                      borderRadius: '9999px',
                      padding: '0 3px',
                      fontSize: '10px',
                      fontWeight: 700,
                      pointerEvents: 'none',
                    }}
                  >
                    {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              aria-label="Profile"
              className="ios-touch-target flex items-center justify-center"
              style={{
                width: '36px',
                height: '36px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
              onClick={handleAvatarTap}
            >
              <Avatar className="w-6 h-6 border-2 border-gray-200/80 dark:border-gray-600/80 pointer-events-none ring-1 ring-white/20">
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
        </div>
      </header>
    </>
  );
}
