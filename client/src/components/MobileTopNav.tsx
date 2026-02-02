import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, X, Home, MapPin, Calendar, Users, MessageCircle, User, LogOut, Compass, Zap, Building2, Star } from "lucide-react";
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

  // Hydrate user from best source
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

  // Listen for profile updates
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

  // Lock body scroll when menu open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  const handleMenuToggle = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🍔 Menu toggle');
    setIsOpen(prev => !prev);
  };

  const handleAvatarTap = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('👤 Avatar tap');
    setIsOpen(false);
    const profilePath = currentUser?.id ? `/profile/${currentUser.id}` : "/profile";
    setLocation(profilePath);
  };

  const navigate = (path: string) => {
    setIsOpen(false);
    setLocation(path);
  };

  const handleLogout = () => {
    setIsOpen(false);
    if (!authContext.user && currentUser) {
      localStorage.clear();
      sessionStorage.clear();
      authStorage.clearUser();
      window.location.href = '/';
    } else {
      logout();
    }
  };

  const isBusiness = currentUser?.userType === "business";

  const menuItems = isBusiness ? [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: Building2, label: "Manage Deals", path: "/business-dashboard" },
    { icon: Calendar, label: "Create Event", path: "/create-event" },
    { icon: Calendar, label: "View Events", path: "/events" },
    { icon: MessageCircle, label: "Chat Rooms", path: "/chatrooms" },
    { icon: MessageCircle, label: "Customer Messages", path: "/messages" },
    { icon: User, label: "Business Profile", path: currentUser?.id ? `/profile/${currentUser.id}` : "/profile" },
    { icon: MapPin, label: "View Cities", path: "/discover" },
  ] : [
    { icon: Home, label: "Home", path: "/" },
    { icon: MapPin, label: "Cities", path: "/discover" },
    { icon: Calendar, label: "Events", path: "/events" },
    { icon: Compass, label: "Plan Trip", path: "/plan-trip" },
    { icon: Zap, label: "Quick Meetups", path: "/quick-meetups" },
    { icon: MessageCircle, label: "Chat Rooms", path: "/chatrooms" },
    { icon: Users, label: "City Plans", path: "/match-in-city" },
    { icon: Users, label: "Connect", path: "/connect" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: User, label: "Profile", path: currentUser?.id ? `/profile/${currentUser.id}` : "/profile" },
    { icon: Star, label: "Ambassador Program", path: "/ambassador-program" },
  ];

  return (
    <>
      {/* Fixed Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-[10000] h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 md:hidden">
        <div className="flex items-center justify-between h-full px-3">
          {/* Left: Hamburger */}
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={isOpen}
            data-testid="button-mobile-menu"
            className="mobile-touch-btn w-12 h-12 flex items-center justify-center rounded-lg text-gray-700 dark:text-gray-200"
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'rgba(255, 165, 0, 0.3)',
              WebkitUserSelect: 'none',
              userSelect: 'none',
            }}
            onTouchEnd={handleMenuToggle}
            onClick={handleMenuToggle}
          >
            {isOpen ? <X className="w-6 h-6 pointer-events-none" /> : <Menu className="w-6 h-6 pointer-events-none" />}
          </button>

          {/* Center: Logo */}
          <div className="flex-1 flex justify-center pointer-events-none">
            <Logo variant="navbar" />
          </div>

          {/* Right: Avatar */}
          <button
            type="button"
            aria-label="Profile"
            className="mobile-touch-btn w-12 h-12 flex items-center justify-center rounded-full"
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'rgba(255, 165, 0, 0.3)',
              WebkitUserSelect: 'none',
              userSelect: 'none',
            }}
            onTouchEnd={handleAvatarTap}
            onClick={handleAvatarTap}
          >
            <Avatar className="w-9 h-9 border-2 border-gray-200 dark:border-gray-600 pointer-events-none">
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

      {/* Menu Portal - Rendered at body level for proper z-index */}
      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[10001] md:hidden"
            style={{ touchAction: 'auto' }}
            onTouchEnd={(e) => { e.preventDefault(); setIsOpen(false); }}
            onClick={() => setIsOpen(false)}
          />

          {/* Slide-out Menu Panel */}
          <nav
            className="fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-white dark:bg-gray-900 z-[10002] shadow-xl md:hidden overflow-y-auto"
            style={{
              animation: 'slideInLeft 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Menu</span>
              <button
                type="button"
                className="mobile-touch-btn w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300"
                style={{ touchAction: 'manipulation' }}
                onTouchEnd={(e) => { e.preventDefault(); setIsOpen(false); }}
                onClick={() => setIsOpen(false)}
              >
                <X className="w-5 h-5 pointer-events-none" />
              </button>
            </div>

            {/* User Info */}
            {currentUser && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 pointer-events-none">
                    <AvatarImage src={currentUser.profileImage} className="pointer-events-none" />
                    <AvatarFallback className="bg-orange-500 text-white pointer-events-none">
                      {currentUser.name?.charAt(0)?.toUpperCase() || currentUser.username?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">@{currentUser.username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser.hometownCity || 'Location'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="mobile-touch-btn w-full flex items-center gap-4 px-4 py-3 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-orange-50 dark:active:bg-orange-900/20"
                  style={{ touchAction: 'manipulation' }}
                  onTouchEnd={(e) => { e.preventDefault(); navigate(item.path); }}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none" />
                  <span className="pointer-events-none">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Logout */}
            <div className="border-t border-gray-200 dark:border-gray-700 py-2">
              <button
                type="button"
                className="mobile-touch-btn w-full flex items-center gap-4 px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30"
                style={{ touchAction: 'manipulation' }}
                onTouchEnd={(e) => { e.preventDefault(); handleLogout(); }}
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 pointer-events-none" />
                <span className="pointer-events-none">Sign Out</span>
              </button>
            </div>
          </nav>
        </>,
        document.body
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .mobile-touch-btn {
          -webkit-tap-highlight-color: rgba(255, 165, 0, 0.2);
          touch-action: manipulation;
          cursor: pointer;
        }
        .mobile-touch-btn:active {
          background-color: rgba(249, 115, 22, 0.1);
        }
      `}</style>
    </>
  );
}
