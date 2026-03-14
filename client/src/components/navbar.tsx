import React, { useContext, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { SimpleAvatar } from "@/components/simple-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Globe,
  Settings,
  LogOut,
  Users,
  Bot,
  Home,
  Calendar,
  MapPin,
  MessageCircle,
  UserCheck,
  BarChart3,
  Star,
  Search,
  User,
  Sparkles,
  Zap,
  Mail,
  Moon,
  Sun,
  Heart,
  Bell,
} from "lucide-react";
import Logo from "@/components/logo";
import ConnectModal from "@/components/connect-modal";
import { useTheme } from "@/components/theme-provider";
import { AdaptiveThemeToggle } from "@/components/adaptive-theme-toggle";
import { authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { getApiBaseUrl, invalidateUserCache } from "@/lib/queryClient";
import { isNativeIOSApp } from "@/lib/nativeApp";

// Theme Toggle as Dropdown Menu Item
function ThemeToggleMenuItem() {
  const { theme, setTheme, resolvedTheme, isSystemTheme, toggleTheme } =
    useTheme();

  const getThemeDisplay = () => {
    if (isSystemTheme) {
      return {
        icon:
          resolvedTheme === "dark" ? (
            <Moon className="mr-2 h-4 w-4" />
          ) : (
            <Sun className="mr-2 h-4 w-4" />
          ),
        text: `Auto (${resolvedTheme === "dark" ? "Dark" : "Light"})`,
      };
    }
    return {
      icon:
        theme === "dark" ? (
          <Sun className="mr-2 h-4 w-4" />
        ) : (
          <Moon className="mr-2 h-4 w-4" />
        ),
      text: theme === "dark" ? "Switch to Light" : "Switch to Dark",
    };
  };

  const { icon, text } = getThemeDisplay();

  return (
    <DropdownMenuItem onClick={toggleTheme}>
      {icon}
      <span>{text}</span>
      {isSystemTheme && (
        <div className="ml-auto h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400" />
      )}
    </DropdownMenuItem>
  );
}

function Navbar() {
  if (isNativeIOSApp()) return null;
  const [location, setLocation] = useLocation();
  const { user, setUser } = useContext(AuthContext);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { toggleTheme } = useTheme();
  const headerRef = React.useRef<HTMLDivElement>(null);
  const [menuTop, setMenuTop] = useState(0);

  // Keyboard shortcut for theme toggle
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "t") {
        event.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [toggleTheme]);

  // directUser: Trust AuthContext first, then localStorage. Never make a separate auth fetch.
  const [directUser, setDirectUser] = useState<any>(() => {
    if (user) return user;
    // Fallback: check localStorage for stored user data
    const storedUser = localStorage.getItem('user') || localStorage.getItem('travelconnect_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.id) return parsed;
      } catch {}
    }
    return null;
  });

  // Sync from AuthContext - this is the ONLY source of truth for user state
  useEffect(() => {
    if (user?.id) {
      setDirectUser(user);
    } else if (!user) {
      // Only clear if localStorage also has no user data (true logout)
      const storedUser = localStorage.getItem('user') || localStorage.getItem('travelconnect_user');
      if (!storedUser) {
        setDirectUser(null);
      } else {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed?.id) {
            setDirectUser(parsed);
          } else {
            setDirectUser(null);
          }
        } catch {
          setDirectUser(null);
        }
      }
    }
  }, [user?.id, user?.username, user?.profileImage, user]);

  // Auth limbo recovery: if UI looks logged-out but we still have auth evidence,
  // try one server sync to repopulate user (or clear stale auth_token).
  useEffect(() => {
    if (isNativeIOSApp()) return;
    if (directUser?.id) return;

    const isSessionInvalid = (() => {
      try {
        return sessionStorage.getItem("nt_session_invalid") === "1";
      } catch {
        return false;
      }
    })();
    if (isSessionInvalid) {
      setDirectUser(null);
      if (setUser) setUser(null);
      return;
    }

    const hasStoredUser =
      !!localStorage.getItem("user") || !!localStorage.getItem("travelconnect_user");
    if (!hasStoredUser) return;

    let cancelled = false;
    (async () => {
      const refreshed = await authStorage.forceRefreshUser();
      if (cancelled) return;
      if (refreshed?.id) {
        try {
          sessionStorage.removeItem("nt_session_invalid");
          sessionStorage.removeItem("nt_session_invalid_reason");
        } catch {}
        setDirectUser(refreshed as any);
        if (setUser) setUser(refreshed as any);
        return;
      }

      // If server says not authenticated, mark session invalid for this tab.
      try {
        sessionStorage.setItem("nt_session_invalid", "1");
        sessionStorage.setItem("nt_session_invalid_reason", "navbar:forceRefreshUser_failed");
      } catch {}
      setDirectUser(null);
      if (setUser) setUser(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [directUser?.id, setUser]);

  // recalc top on load/resize & when warning banners appear/disappear
  useEffect(() => {
    const measure = () =>
      setMenuTop(headerRef.current?.getBoundingClientRect().height ?? 0);
    measure();
    window.addEventListener("resize", measure);
    const id = setInterval(measure, 300); // cheap guard if header height changes (banners)
    return () => {
      window.removeEventListener("resize", measure);
      clearInterval(id);
    };
  }, []);


  const openAdvancedFilters = React.useCallback(() => {
    // Always open the new filters UI on Home where `filters` state lives.
    if (location !== "/") setLocation("/");
    // Defer so the Home page can mount before receiving the event.
    setTimeout(() => {
      window.dispatchEvent(new Event("openAdvancedFilters"));
    }, 0);
  }, [location, setLocation]);

  // Listen for profile updates to refresh user data
  useEffect(() => {
    const handleProfileUpdate = (event: any) => {
      console.log(
        "Navbar avatar refresh triggered:",
        event.type,
        event.detail?.id,
      );
      if (event.detail && event.detail.id) {
        const updatedUser = event.detail;

        // Update direct user immediately
        setDirectUser(updatedUser);

        // Update all storage systems
        if (setUser) setUser(updatedUser);

        console.log("🔄 Navbar: Using event user data directly");
      }
    };

    // Listen for multiple event types to catch all profile updates
    window.addEventListener("userDataUpdated", handleProfileUpdate);
    window.addEventListener("profileUpdated", handleProfileUpdate);
    window.addEventListener("profilePhotoUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("userDataUpdated", handleProfileUpdate);
      window.removeEventListener("profileUpdated", handleProfileUpdate);
      window.removeEventListener("profilePhotoUpdated", handleProfileUpdate);
    };
  }, [setUser]);

  // Log oversized avatar data only; do NOT clear or delete server photo (so corner avatar can show uploaded photo)
  useEffect(() => {
    if (directUser?.profileImage) {
      const imageLength = directUser.profileImage.length;
      if (imageLength > 800000) {
        console.warn(
          "Avatar data is large (" + imageLength + " chars). Server photo kept; consider compressing on upload.",
        );
      }
    }
  }, [directUser?.id, directUser?.profileImage?.length]);

  // Simple avatar refresh system
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const [navbarRefreshTrigger, setNavbarRefreshTrigger] = useState(0);

  // Listen for profile updates and refresh avatar - ENHANCED VERSION
  useEffect(() => {
    const handleUpdate = async (event: any) => {
      console.log(
        "Navbar avatar refresh triggered:",
        event.type,
        event.detail?.id,
      );

      // Force complete navbar refresh
      setAvatarKey(Date.now());
      setNavbarRefreshTrigger((prev) => prev + 1);

      // If event contains user data, use it directly
      if (
        event.detail &&
        typeof event.detail === "object" &&
        event.detail.profileImage !== undefined
      ) {
        console.log("🔄 Navbar: Using event user data directly");
        setDirectUser(event.detail);
        setUser(event.detail);
        authStorage.setUser(event.detail);
        return;
      }

      // Fetch fresh user data if this is the current user
      if (directUser?.id) {
        try {
          const response = await fetch(
            `${getApiBaseUrl()}/api/users/${directUser.id}?t=${Date.now()}`,
          );
          if (response.ok) {
            const freshUserData = await response.json();
            console.log(
              "🔄 Navbar: Fresh data fetched:",
              freshUserData.username,
              "has image:",
              !!freshUserData.profileImage,
            );

            // Update ALL user data sources
            setDirectUser(freshUserData);
            setUser(freshUserData);
            authStorage.setUser(freshUserData);
          }
        } catch (error) {
          console.log("Failed to fetch fresh user data:", error);
        }
      }

      // Also invalidate queries for other components
      if (directUser?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        queryClient.invalidateQueries({
          queryKey: [`/api/users/${directUser.id}`],
        });
      }
    };

    window.addEventListener("profilePhotoUpdated", handleUpdate);
    window.addEventListener("userDataUpdated", handleUpdate);
    window.addEventListener("refreshNavbar", handleUpdate);
    window.addEventListener("forceNavbarRefresh", handleUpdate);

    return () => {
      window.removeEventListener("profilePhotoUpdated", handleUpdate);
      window.removeEventListener("userDataUpdated", handleUpdate);
      window.removeEventListener("refreshNavbar", handleUpdate);
      window.removeEventListener("forceNavbarRefresh", handleUpdate);
    };
  }, [queryClient, directUser?.id, setUser]);

  // LOGOUT SYSTEM - Bulletproof version according to guide
  const handleLogout = async () => {
    console.log("🚪 Starting bulletproof logout process");

    try {
      // Step 1: Call server logout to destroy session
      try {
        await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        console.warn("Server logout failed, continuing with client cleanup");
      }

      // Step 2: Clear ALL client-side auth data
      localStorage.clear();
      sessionStorage.clear();

      // Step 3: Clear in-memory caches
      queryClient.clear();
      invalidateUserCache();

      // Step 4: Clear cookies
      document.cookie.split(";").forEach((c) => {
        const name = c.split("=")[0].trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });

      // Step 5: Update local state
      setDirectUser(null);
      setUser(null);

      // Step 6: Hard redirect - replace prevents back button returning to auth'd page
      window.location.replace(isNativeIOSApp() ? "/home?native=ios" : "/");
    } catch (error) {
      console.error("❌ Logout error:", error);
      localStorage.clear();
      sessionStorage.clear();
      invalidateUserCache();
      window.location.replace(isNativeIOSApp() ? "/home?native=ios" : "/");
    }
  };

  // Filter nav items based on user type
  const getNavItems = () => {
    const profilePath = directUser?.id
      ? `/profile/${directUser.id}`
      : "/profile";

    // Business users: Dashboard, Deals (deal panel), Admin (if admin), Search, Connect. No Plan trip or Create hangout.
    if (directUser?.userType === "business") {
      const items: { path: string | null; label: string; icon: string; action?: "search" }[] = [
        { path: "/business-dashboard", label: "Dashboard", icon: "📊" },
        { path: null, label: "Search", icon: "🔍", action: "search" as const },
        { path: "/deals", label: "Deals", icon: "🏷️" },
        { path: "/connect", label: "Connect", icon: "💝" },
      ];
      if (directUser?.isAdmin) {
        items.splice(2, 0, { path: "/admin-dashboard", label: "Admin", icon: "⚙️" });
      }
      return items;
    }

    return [
      { path: "/explore", label: "Explore", icon: "⚡" },
      { path: null, label: "Search", icon: "🔍", action: "search" as const },
      { path: "/discover", label: "Cities", icon: "🌍" },
      { path: "/events", label: "Events", icon: "📅" },
      { path: "/match-in-city", label: "City Plans", icon: "🎯" },
      { path: "/plan-trip", label: "Trip Planning", icon: "🧭" },
      { path: "/connect", label: "Connect", icon: "💝" },
      { path: "/activity", label: "Activity", icon: "🔔" },
    ];
  };

  const navItems = getNavItems();

  // Verify session before navigating to own profile - prevents wrong user navigation
  const navigateToMyProfile = async () => {
    if (!directUser?.id) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/user`, { credentials: 'include' });
      if (res.ok) {
        const sessionUser = await res.json();
        if (sessionUser?.id && String(sessionUser.id) !== String(directUser.id)) {
          console.warn('⚠️ Session mismatch! Clearing and redirecting to login.');
          authStorage.clearUser();
          invalidateUserCache();
          setUser(null);
          setDirectUser(null);
          window.location.href = '/signin';
          return;
        }
      } else {
        authStorage.clearUser();
        setUser(null);
        setDirectUser(null);
        window.location.href = '/signin';
        return;
      }
    } catch {
      // On error, still navigate - session might be temporarily unavailable
    }
    setLocation(`/profile/${directUser.id}`);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  // Fetch user's travel plans for the Connect modal
  const { data: userTravelPlans } = useQuery({
    queryKey: [`/api/travel-plans/${directUser?.id}`],
    enabled: !!directUser?.id && showConnectModal,
  });

  // Unread DM count for navbar avatar badge
  const { data: unreadMsgData } = useQuery<{ unreadCount: number }>({
    queryKey: ["/api/messages", directUser?.id, "unread-count"],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/messages/${directUser?.id}/unread-count`, { credentials: "include" });
      if (!res.ok) return { unreadCount: 0 };
      return res.json();
    },
    enabled: !!directUser?.id,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
  const unreadMessageCount = unreadMsgData?.unreadCount ?? 0;

  // Activity feed unread count for navbar badge
  const { data: activityFeedData } = useQuery<{ unreadCount: number }>({
    queryKey: ["/api/activity-feed", directUser?.id],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/activity-feed/${directUser?.id}`, { credentials: "include" });
      if (!res.ok) return { unreadCount: 0 };
      return res.json();
    },
    enabled: !!directUser?.id,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    select: (data: any) => ({ unreadCount: data?.unreadCount ?? 0 }),
  });
  const activityUnreadCount = activityFeedData?.unreadCount ?? 0;

  // Check if profile needs completion (bio, gender, sexual preference)
  // Business users are excluded - they complete different fields during signup
  return (
    <>
      <header
        ref={headerRef}
        className={`fixed md:sticky top-0 left-0 right-0 z-[1000] bg-white dark:bg-black shadow-sm border-b border-gray-200 desktop-navbar ${isNativeIOSApp() ? "pt-1" : ""}`}
        style={{ paddingTop: isNativeIOSApp() ? undefined : '0px' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-1.5">
            <div className="flex items-center gap-2">
              <Logo variant="navbar" />
              <span className="text-red-600 text-xs font-bold uppercase leading-none">Beta</span>
            </div>
            <div className="flex items-center space-x-3 md:space-x-6 ml-auto">
              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-2 lg:space-x-4 items-center">
                {navItems.filter((item) => item.path !== "/explore").map((item) =>
                  (item as { action?: string }).action === "search" ? (
                    directUser?.id && (
                      <button
                        key="search"
                        type="button"
                        onClick={openAdvancedFilters}
                        className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-white hover:text-travel-blue transition-colors"
                        aria-label="Search"
                      >
                        <Search className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    )
                  ) : (
                    <Link
                      key={item.path}
                      href={item.path!}
                      className={`transition-colors font-medium hover:underline relative ${
                        location === item.path
                          ? "text-gray-900 dark:text-white font-semibold"
                          : "text-gray-700 dark:text-white hover:text-travel-blue"
                      }`}
                      onClick={() => console.log(`Navigating to ${item.path}`)}
                    >
                      {item.label}
                      {item.path === "/messages" && unreadMessageCount > 0 && (
                        <span className="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-orange-500" />
                      )}
                      {item.path === "/activity" && activityUnreadCount > 0 && (
                        <span className="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-orange-500" />
                      )}
                    </Link>
                  )
                )}
              </nav>

              <div className="flex items-center space-x-2 md:space-x-3">
                {!directUser?.id && (
                  <>
                    <Link href="/signin">
                      <Button variant="ghost" size="sm" className="text-gray-700 dark:text-white font-medium hover:text-orange-600">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/launching-soon">
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full px-4">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}

                {/* Desktop Theme Toggle */}
                <div className="hidden md:block">
                  <AdaptiveThemeToggle />
                </div>

              </div>
              {directUser?.id && (
                <button
                  type="button"
                  aria-label="Notifications"
                  className="md:hidden relative p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setLocation("/activity")}
                >
                  <Bell className="w-5 h-5" />
                  {activityUnreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center bg-orange-500 text-white rounded-full px-1 text-[10px] font-bold pointer-events-none">
                      {activityUnreadCount > 99 ? '99+' : activityUnreadCount}
                    </span>
                  )}
                </button>
              )}
              {directUser?.id && <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`relative rounded-full p-0 flex items-center justify-center cursor-pointer z-[1100] ${isNativeIOSApp() ? "h-14 w-14" : "h-12 w-12"}`}
                    style={{
                      WebkitTapHighlightColor: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <SimpleAvatar
                      key={`navbar-avatar-${directUser?.id}-${avatarKey}-${navbarRefreshTrigger}`}
                      user={directUser}
                      size={isNativeIOSApp() ? "lg" : "md"}
                      className="border-2 border-white shadow-sm pointer-events-none"
                      clickable={false}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 z-[9999] bg-white dark:bg-gray-800 border border-gray-200 shadow-lg"
                  align="end"
                  forceMount
                >
                  {/* My Profile - Most important, at the top */}
                  <DropdownMenuItem onClick={navigateToMyProfile} className="font-medium">
                    <User className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={openAdvancedFilters}>
                    <Search className="mr-2 h-4 w-4" />
                    <span>Search</span>
                  </DropdownMenuItem>

                  {/* Quick access items not in top nav or bottom nav */}
                  <DropdownMenuItem
                    onClick={() => {
                      setLocation(isNativeIOSApp() ? "/home" : "/");
                      setTimeout(
                        () => window.scrollTo({ top: 0, behavior: "smooth" }),
                        100,
                      );
                    }}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    <span>Home</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setLocation("/messages");
                      setTimeout(
                        () => window.scrollTo({ top: 0, behavior: "smooth" }),
                        100,
                      );
                    }}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                    {unreadMessageCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setLocation("/events");
                      setTimeout(
                        () => window.scrollTo({ top: 0, behavior: "smooth" }),
                        100,
                      );
                    }}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Events</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setLocation("/explore");
                      setTimeout(
                        () => window.scrollTo({ top: 0, behavior: "smooth" }),
                        100,
                      );
                    }}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    <span>Explore</span>
                  </DropdownMenuItem>

                  {directUser?.userType === "business" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => {
                          setLocation("/business-dashboard?action=create-quick-deal");
                          setTimeout(
                            () =>
                              window.scrollTo({ top: 0, behavior: "smooth" }),
                            100,
                          );
                        }}
                      >
                        <Zap className="mr-2 h-4 w-4" />
                        <span>Create Quick Deal</span>
                      </DropdownMenuItem>
                    </>
                  )}

                  {directUser?.userType !== "business" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => {
                          setLocation("/plan-trip");
                          setTimeout(
                            () =>
                              window.scrollTo({ top: 0, behavior: "smooth" }),
                            100,
                          );
                        }}
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        <span>Plan Trip</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setLocation("/meetups");
                          setTimeout(
                            () =>
                              window.scrollTo({ top: 0, behavior: "smooth" }),
                            100,
                          );
                        }}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        <span>Available Now</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setLocation("/city-chatrooms");
                          setTimeout(
                            () =>
                              window.scrollTo({ top: 0, behavior: "smooth" }),
                            100,
                          );
                        }}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        <span>City Chatrooms</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setLocation("/business-offers");
                          setTimeout(
                            () =>
                              window.scrollTo({ top: 0, behavior: "smooth" }),
                            100,
                          );
                        }}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        <span>Deals & Offers</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setLocation("/dashboard/ambassador");
                          setTimeout(
                            () =>
                              window.scrollTo({ top: 0, behavior: "smooth" }),
                            100,
                          );
                        }}
                      >
                        <Star className="mr-2 h-4 w-4 text-orange-500" />
                        <span>Ambassador Program</span>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuItem
                    onClick={() => {
                      setLocation("/donate");
                      setTimeout(
                        () => window.scrollTo({ top: 0, behavior: "smooth" }),
                        100,
                      );
                    }}
                  >
                    <Heart className="mr-2 h-4 w-4 text-red-500" />
                    <span>Support Us ❤️</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => {
                      setLocation("/settings");
                      setTimeout(
                        () => window.scrollTo({ top: 0, behavior: "smooth" }),
                        100,
                      );
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>

                  {directUser?.isAdmin && (
                    <>
                      <DropdownMenuItem
                        onClick={() => {
                          setLocation("/admin-dashboard");
                          setTimeout(
                            () =>
                              window.scrollTo({ top: 0, behavior: "smooth" }),
                            100,
                          );
                        }}
                      >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setLocation("/admin-settings");
                          setTimeout(
                            () =>
                              window.scrollTo({ top: 0, behavior: "smooth" }),
                            100,
                          );
                        }}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin Settings</span>
                      </DropdownMenuItem>
                    </>
                  )}

                  <ThemeToggleMenuItem />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>}
            </div>
          </div>
        </div>

      </header>

      {false &&
        createPortal(
          <div
            id="mobile-menu"
          >
            <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="px-4 py-6 space-y-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center py-3 px-4 rounded-lg text-lg font-medium transition-colors ${
                      location === item.path
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => {
                      
                      setLocation(item.path);
                    }}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span className="relative">
                      {item.label}
                      {item.path === "/messages" && unreadMessageCount > 0 && (
                        <span className="absolute -top-1 -right-3 h-2 w-2 rounded-full bg-orange-500" />
                      )}
                      {item.path === "/activity" && activityUnreadCount > 0 && (
                        <span className="absolute -top-1 -right-3 h-2 w-2 rounded-full bg-orange-500" />
                      )}
                    </span>
                  </Link>
                ))}

                {/* Additional mobile menu items not in main nav */}
                {directUser?.userType !== "business" && (
                  <>
                    <Link
                      href="/discover"
                      className={`block py-3 px-4 rounded-lg text-lg font-medium transition-colors ${
                        location === "/discover"
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => {
                        
                        setLocation("/discover");
                      }}
                    >
                      <span className="mr-3">🌍</span>Discover Cities
                    </Link>
                    <Link
                      href="/quick-meetups"
                      className={`block py-3 px-4 rounded-lg text-lg font-medium transition-colors ${
                        location === "/quick-meetups"
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => {
                        
                        setLocation("/quick-meetups");
                      }}
                    >
                      <span className="mr-3">⚡</span>Available Now
                    </Link>
                    <Link
                      href="/city-chatrooms"
                      className={`block py-3 px-4 rounded-lg text-lg font-medium transition-colors ${
                        location === "/city-chatrooms"
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => {
                        
                        setLocation("/city-chatrooms");
                      }}
                    >
                      <span className="mr-3">💬</span>City Chatrooms
                    </Link>
                  </>
                )}

                {/* Add Deals for business users */}
                {directUser?.userType === "business" && (
                  <Link
                    href="/deals"
                    className={`block py-3 px-4 rounded-lg text-lg font-medium transition-colors ${
                      location === "/deals"
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => {
                      
                      setLocation("/deals");
                    }}
                  >
                    <span className="mr-3">🏷️</span>Deals
                  </Link>
                )}

                {/* Settings for all users */}
                <Link
                  href="/settings"
                  className={`block py-3 px-4 rounded-lg text-lg font-medium transition-colors ${
                    location === "/settings"
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => {
                    
                    setLocation("/settings");
                  }}
                >
                  <span className="mr-3">⚙️</span>Settings
                </Link>

                {/* Sign Out button for mobile */}
                <button
                  type="button"
                  className="w-full text-left block py-3 px-4 rounded-lg text-lg font-medium transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    setTimeout(() => handleLogout(), 100); // Defer logout until after menu closes
                  }}
                >
                  <span className="mr-3">🚪</span>Sign Out
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Connect Modal */}
      <ConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        userTravelPlans={(userTravelPlans as any[]) || []}
      />
    </>
  );
}

export { Navbar };
export default Navbar;
