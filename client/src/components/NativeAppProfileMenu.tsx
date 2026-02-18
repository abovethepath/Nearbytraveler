/**
 * Menu shown on Profile page when in native iOS app (Expo).
 * Replaces the hamburger menu that's hidden in native - provides navigation links + Sign Out.
 */
import React from "react";
import { useLocation } from "wouter";
import {
  Home,
  MapPin,
  Calendar,
  Users,
  MessageCircle,
  User,
  Compass,
  Zap,
  Building2,
  Star,
  LogOut,
} from "lucide-react";
import { AuthContext } from "@/App";
import { isNativeIOSApp } from "@/lib/nativeApp";

const MENU_ITEMS = [
  { icon: Home, label: "Home", path: "/" },
  { icon: MapPin, label: "Cities", path: "/discover" },
  { icon: Calendar, label: "Events", path: "/events" },
  { icon: Compass, label: "Plan Trip", path: "/plan-trip" },
  { icon: Zap, label: "Quick Meetups", path: "/quick-meetups" },
  { icon: Users, label: "City Plans", path: "/match-in-city" },
  { icon: Calendar, label: "Create Event", path: "/create-event" },
  { icon: MessageCircle, label: "Messages", path: "/messages" },
  { icon: Users, label: "Connect", path: "/connect" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Star, label: "Ambassador Program", path: "/ambassador-program" },
];

const BUSINESS_MENU_ITEMS = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Building2, label: "Manage Deals", path: "/business-dashboard" },
  { icon: Calendar, label: "Create Event", path: "/create-event" },
  { icon: Calendar, label: "View Events", path: "/events" },
  { icon: MessageCircle, label: "Messages", path: "/messages" },
  { icon: MapPin, label: "View Cities", path: "/discover" },
  { icon: User, label: "Business Profile", path: "/profile" },
];

export function NativeAppProfileMenu({
  isBusiness,
  currentUserId,
}: {
  isBusiness?: boolean;
  currentUserId?: number;
}) {
  const [, setLocation] = useLocation();
  const authContext = React.useContext(AuthContext);
  const { logout } = authContext;

  const menuItems = isBusiness ? BUSINESS_MENU_ITEMS : MENU_ITEMS;

  const handleLogout = async () => {
    try {
      await logout();
      // Tell native Expo app to clear its auth state and show Login
      const w = window as Window & { ReactNativeWebView?: { postMessage: (s: string) => void } };
      if (w.ReactNativeWebView?.postMessage) {
        w.ReactNativeWebView.postMessage(JSON.stringify({ type: "LOGOUT" }));
      }
      // Fallback: full reload to login (works for web too)
      window.location.href = isNativeIOSApp() ? "/home?native=ios" : "/";
    } catch (e) {
      console.error("Logout failed:", e);
      window.location.href = isNativeIOSApp() ? "/home?native=ios" : "/";
    }
  };

  const navigate = (path: string) => {
    const resolved = path === "/" && isNativeIOSApp() ? "/home" : path;
    const profilePath = resolved === "/profile" && currentUserId ? `/profile/${currentUserId}` : resolved;
    setLocation(profilePath);
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Menu</h3>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-4 px-4 py-3 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 active:bg-orange-50 dark:active:bg-orange-900/20"
              style={{ touchAction: "manipulation" }}
            >
              <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30"
          style={{ touchAction: "manipulation" }}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
