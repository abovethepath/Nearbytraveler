import React, { useState } from "react";
import { useLocation } from "wouter";
import { Home, MapPin, Plus, MessageCircle, User, Users, Calendar, Search, X } from "lucide-react";
import { AuthContext } from "@/App";

export function MobileBottomNav() {
  const [location, setLocation] = useLocation();
  const [showActionMenu, setShowActionMenu] = useState(false);
  const { user } = React.useContext(AuthContext);

  const navItems = [
    { 
      icon: Home, 
      label: "Home", 
      path: "/",
      onClick: () => {
        console.log('🏠 MOBILE BOTTOM NAV: Home clicked');
        setLocation('/');
      }
    },
    { icon: Search, label: "Discover", path: "/discover" },
    { icon: MessageCircle, label: "Chat Rooms", path: "/city-chatrooms" },
    { icon: Calendar, label: "Events", path: "/events" },
    { 
      icon: User, 
      label: "Profile", 
      path: user ? `/profile/${user.id}` : "/profile",
      onClick: () => {
        console.log('👤 MOBILE BOTTOM NAV: Profile clicked');
        const profilePath = user?.id ? `/profile/${user.id}` : '/profile';
        setLocation(profilePath);
      }
    },
  ];

  const actionMenuItems = [
    { label: "Create Event", path: "/create-event", icon: Calendar },
    { label: "Create Trip", path: "/plan-trip", icon: MapPin },
    { label: "Create Quick Meetup", path: "/quick-meetups", icon: Users },
    { label: "Create Chat Room", path: "/city-chatrooms", icon: MessageCircle },
  ];

  return (
    <>
      {/* Action Menu Overlay */}
      {showActionMenu && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="w-full bg-white dark:bg-gray-900 rounded-t-2xl p-4 pb-safe max-h-[60vh] md:max-h-[70vh] lg:max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New
              </h3>
              <button
                onClick={() => setShowActionMenu(false)}
                className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4">
              {actionMenuItems.map((action, index) => {
                const ActionIcon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      console.log('🎯 MOBILE ACTION MENU: Clicked', action.label, 'navigating to:', action.path);
                      setLocation(action.path);
                      setShowActionMenu(false);
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mb-2">
                      <ActionIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div 
        className="mobile-bottom-nav fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg md:hidden" 
        style={{ 
          position: 'fixed', 
          zIndex: 9999,
          width: '100vw',
          height: '72px',
          bottom: '0px',
          display: 'block'
        }}
      >
        <div className="flex items-center justify-around h-18 px-2">
          {navItems.map((item, index) => {
            const isActive = location === item.path || 
              (item.path === "/" && location === "/") ||
              (item.path.startsWith("/profile") && location.startsWith("/profile"));

            const Icon = item.icon;

            return (
              <button
                key={item.path || index}
                onClick={() => {
                  if (item.isSpecial && item.onClick) {
                    item.onClick();
                  } else if (item.onClick) {
                    item.onClick();
                  } else {
                    console.log(`🎯 MOBILE BOTTOM NAV: Navigating to ${item.path}`);
                    // Ensure we have a valid path
                    if (item.path && item.path !== '#') {
                      setLocation(item.path);
                    }
                  }
                }}
                className={`flex flex-col items-center justify-center min-w-0 flex-1 py-1 ${
                  item.isSpecial 
                    ? "relative" 
                    : ""
                }`}
              >
                {item.isSpecial ? (
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <>
                    <Icon 
                      className={`w-6 h-6 mb-1 ${
                        isActive 
                          ? "text-blue-500" 
                          : "text-gray-400 dark:text-gray-500"
                      }`} 
                    />
                    <span 
                      className={`text-xs font-medium ${
                        isActive 
                          ? "text-blue-500" 
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
        <div className="h-safe-area-inset-bottom" />
      </div>
    </>
  );
}