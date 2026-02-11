import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, X, Home, MapPin, Calendar, Users, MessageCircle, User, LogOut, Compass, Zap, Building2, Star, ChevronRight, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthContext } from "@/App";
import { useLocation } from "wouter";
import Logo from "@/components/logo";
import { authStorage } from "@/lib/auth";

export function MobileTopNav() {
  const authContext = React.useContext(AuthContext);
  const { user, logout } = authContext;
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    let effectiveUser = null;
    if (user?.username) {
      effectiveUser = user;
    } else {
      const storedUser = authStorage.getUser();
      if (storedUser?.username) {
        effectiveUser = storedUser;
      } else {
        try {
          const raw = localStorage.getItem("user") || localStorage.getItem("travelconnect_user");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.username) effectiveUser = parsed;
          }
        } catch {}
      }
    }
    setCurrentUser(effectiveUser);
  }, [user]);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e?.detail) {
        setCurrentUser(e.detail);
        localStorage.setItem('travelconnect_user', JSON.stringify(e.detail));
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

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleMenuToggle = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  const handleAvatarTap = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    const profilePath = currentUser?.id ? `/profile/${currentUser.id}` : "/profile";
    setLocation(profilePath);
  };

  const navigate = (path: string) => {
    setIsOpen(false);
    setLocation(path);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    if (!authContext.user && currentUser) {
      localStorage.clear();
      sessionStorage.clear();
      authStorage.clearUser();
      window.location.href = '/';
    } else {
      await logout();
    }
  };

  const isBusiness = currentUser?.userType === "business";

  const menuGroups = isBusiness ? [
    {
      title: "Main",
      items: [
        { icon: Home, label: "Dashboard", path: "/" },
        { icon: Building2, label: "Manage Deals", path: "/business-dashboard" },
      ]
    },
    {
      title: "Events & Chat",
      items: [
        { icon: Calendar, label: "Create Event", path: "/create-event" },
        { icon: Calendar, label: "View Events", path: "/events" },
        { icon: MessageCircle, label: "Chat Rooms", path: "/chatrooms" },
        { icon: MessageCircle, label: "Customer Messages", path: "/messages" },
      ]
    },
    {
      title: "Account",
      items: [
        { icon: User, label: "Business Profile", path: currentUser?.id ? `/profile/${currentUser.id}` : "/profile" },
        { icon: MapPin, label: "View Cities", path: "/discover" },
      ]
    }
  ] : [
    {
      title: "Discover",
      items: [
        { icon: Home, label: "Home", path: "/" },
        { icon: MapPin, label: "Cities", path: "/discover" },
        { icon: Calendar, label: "Events", path: "/events" },
      ]
    },
    {
      title: "Connect",
      items: [
        { icon: Compass, label: "Plan Trip", path: "/plan-trip" },
        { icon: Zap, label: "Quick Meetups", path: "/quick-meetups" },
        { icon: Users, label: "City Plans", path: "/match-in-city" },
        { icon: Users, label: "Connect", path: "/connect" },
      ]
    },
    {
      title: "Messages",
      items: [
        { icon: MessageCircle, label: "Chat Rooms", path: "/chatrooms" },
        { icon: MessageCircle, label: "Messages", path: "/messages" },
      ]
    },
    {
      title: "Account",
      items: [
        { icon: User, label: "Profile", path: currentUser?.id ? `/profile/${currentUser.id}` : "/profile" },
        { icon: Star, label: "Ambassador Program", path: "/ambassador-program" },
        { icon: Settings, label: "Settings", path: "/settings" },
      ]
    }
  ];

  return (
    <>
      <header 
        className="fixed top-0 left-0 right-0 z-[10000] md:hidden ios-nav-bar"
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
            aria-label="Menu"
            aria-expanded={isOpen}
            data-testid="button-mobile-menu"
            className="ios-touch-target flex items-center justify-center rounded-xl text-gray-700 dark:text-gray-200 active:bg-gray-200/60 dark:active:bg-gray-700/60"
            style={{
              width: '44px',
              height: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
            onTouchEnd={handleMenuToggle}
            onClick={handleMenuToggle}
          >
            {isOpen ? <X className="w-[22px] h-[22px] pointer-events-none" /> : <Menu className="w-[22px] h-[22px] pointer-events-none" />}
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
            onTouchEnd={handleAvatarTap}
            onClick={handleAvatarTap}
          >
            <Avatar className="w-8 h-8 border-2 border-gray-200/80 dark:border-gray-600/80 pointer-events-none ring-1 ring-white/20">
              <AvatarImage
                src={currentUser?.profileImage || undefined}
                alt={currentUser?.name || currentUser?.username || "User"}
                className="pointer-events-none"
              />
              <AvatarFallback className="text-sm bg-orange-500 text-white pointer-events-none">
                {currentUser?.name?.charAt(0)?.toUpperCase() ||
                  currentUser?.username?.charAt(0)?.toUpperCase() ||
                  "U"}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </header>

      {isOpen && createPortal(
        <>
          <div
            className="fixed inset-0 z-[10001] md:hidden ios-menu-backdrop"
            style={{ touchAction: 'none' }}
            onClick={() => setIsOpen(false)}
            onTouchMove={(e) => e.preventDefault()}
          />

          <nav
            className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] z-[10002] md:hidden flex flex-col ios-slide-menu"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/60 dark:border-gray-700/60">
              <span className="text-[17px] font-semibold text-gray-900 dark:text-white">Menu</span>
              <button
                type="button"
                className="ios-touch-target flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
                style={{ width: '30px', height: '30px', touchAction: 'manipulation' }}
                onTouchEnd={(e) => { e.preventDefault(); setIsOpen(false); }}
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto overscroll-contain ios-scroll-container"
              style={{
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
                overscrollBehavior: 'contain',
                minHeight: 0,
              }}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {currentUser && (
                <div className="px-4 py-4 border-b border-gray-200/60 dark:border-gray-700/60">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-14 h-14 pointer-events-none ring-2 ring-orange-200 dark:ring-orange-800">
                      <AvatarImage src={currentUser.profileImage} className="pointer-events-none" />
                      <AvatarFallback className="bg-orange-500 text-white text-lg pointer-events-none">
                        {currentUser.name?.charAt(0)?.toUpperCase() || currentUser.username?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[17px] text-gray-900 dark:text-white truncate">{currentUser.name || currentUser.username}</p>
                      <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate">@{currentUser.username}</p>
                      {currentUser.hometownCity && (
                        <p className="text-[13px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {currentUser.hometownCity}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {menuGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="py-1">
                  <p className="px-4 pt-4 pb-1.5 text-[13px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {group.title}
                  </p>
                  <div className="mx-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
                    {group.items.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="w-full flex items-center gap-3 px-4 text-left text-[15px] text-gray-900 dark:text-gray-100 active:bg-gray-200/80 dark:active:bg-gray-700/80 transition-colors"
                        style={{ 
                          touchAction: 'manipulation',
                          minHeight: '44px',
                          borderBottom: idx < group.items.length - 1 ? '0.5px solid rgba(0,0,0,0.08)' : 'none',
                        }}
                        onTouchEnd={(e) => { e.preventDefault(); navigate(item.path); }}
                        onClick={() => navigate(item.path)}
                      >
                        <div className="w-7 h-7 rounded-md bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-4 h-4 text-orange-600 dark:text-orange-400 pointer-events-none" />
                        </div>
                        <span className="flex-1 pointer-events-none">{item.label}</span>
                        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 pointer-events-none" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="py-1 pb-4">
                <div className="mx-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 text-left text-[15px] text-red-500 dark:text-red-400 active:bg-red-50 dark:active:bg-red-900/20 transition-colors"
                    style={{ touchAction: 'manipulation', minHeight: '44px' }}
                    onTouchEnd={(e) => { e.preventDefault(); handleLogout(); }}
                    onClick={handleLogout}
                  >
                    <div className="w-7 h-7 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                      <LogOut className="w-4 h-4 text-red-500 dark:text-red-400 pointer-events-none" />
                    </div>
                    <span className="flex-1 pointer-events-none">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </nav>
        </>,
        document.body
      )}

      <style>{`
        .ios-nav-bar {
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: saturate(180%) blur(20px);
          -webkit-backdrop-filter: saturate(180%) blur(20px);
          border-bottom: 0.5px solid rgba(0, 0, 0, 0.12);
        }
        .dark .ios-nav-bar {
          background: rgba(17, 24, 39, 0.88);
          border-bottom: 0.5px solid rgba(255, 255, 255, 0.08);
        }
        .ios-menu-backdrop {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .ios-slide-menu {
          background: rgba(248, 250, 252, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
          animation: iosSlideIn 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }
        .dark .ios-slide-menu {
          background: rgba(17, 24, 39, 0.98);
        }
        @keyframes iosSlideIn {
          from { transform: translateX(-100%); opacity: 0.8; }
          to { transform: translateX(0); opacity: 1; }
        }
        .ios-touch-target {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          cursor: pointer;
        }
        .ios-scroll-container {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
      `}</style>
    </>
  );
}