import React, { useState } from "react";
import { useLocation } from "wouter";
import { Home, Plus, MessageCircle, User, Calendar, Search, X } from "lucide-react";
import { AuthContext } from "@/App";
import { AdvancedSearchWidget } from "@/components/AdvancedSearchWidget";

export function MobileBottomNav() {
  const [location, setLocation] = useLocation();
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showSearchWidget, setShowSearchWidget] = useState(false);
  const authContext = React.useContext(AuthContext);
  let user = authContext?.user;
  
  // Fallback to localStorage if AuthContext user is null
  if (!user) {
    const storedUser = localStorage.getItem('user') || localStorage.getItem('currentUser') || localStorage.getItem('authUser');
    if (storedUser) {
      try {
        user = JSON.parse(storedUser);
        console.log('🔧 MobileBottomNav - Recovered user from localStorage:', user?.username, 'userType:', user?.userType);
      } catch (e) {
        console.error('Error parsing stored user in MobileBottomNav:', e);
      }
    }
  }
  
  console.log('🔍 MobileBottomNav - Final user object:', user);
  console.log('🔍 MobileBottomNav - userType:', user?.userType, 'is business?:', user?.userType === 'business');

  // Navigation items based on user type - Search opens widget instead of navigating
  const navItems = user?.userType === 'business' ? [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: Search, label: "Search", action: "search" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: User, label: "Business", path: user ? `/profile/${user.id}` : "/profile" },
  ] : [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Search", action: "search" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: User, label: "Profile", path: user ? `/profile/${user.id}` : "/profile" },
  ];

  // CRITICAL BUSINESS USER FIX - Check userType properly
  const isBusinessUser = user?.userType === 'business';
  console.log('🚨 BUSINESS USER CHECK:', { username: user?.username, userType: user?.userType, isBusinessUser });
  
  const actionMenuItems = isBusinessUser ? [
    { label: "Create Deal", path: "/business-dashboard?action=create-deal", icon: Calendar },
    { label: "Create Quick Deal", path: "/business-dashboard?action=create-quick-deal", icon: MessageCircle },
    { label: "Create Event", path: "/create-event", icon: Calendar },
  ] : [
    { label: "Create Event", path: "/create-event", icon: Calendar },
    { label: "Create Trip", path: "/plan-trip", icon: Calendar },
    { label: "Create Quick Meetup", path: "/quick-meetups", icon: MessageCircle },
  ];

  return (
    <>
      {/* Action Menu Overlay */}
      {showActionMenu && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center md:items-end justify-center">
          <div className="w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl md:rounded-t-2xl md:mb-20 p-4 pb-safe max-h-[60vh] md:max-h-[70vh] lg:max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent shadow-2xl">
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
        className="mobile-bottom-nav fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg"
        style={{ position: 'fixed', zIndex: 9999, width: '100vw', height: '72px', bottom: '0px', display: 'block' }}
      >
        <div className="relative h-full flex items-center justify-between px-4 md:px-8 max-w-6xl mx-auto">
          {/* Left two items */}
          {navItems.slice(0, 2).map((item, index) => {
            const isActive = item.path ? (location === item.path || (item.path === '/' && location === '/')) : false;
            const Icon = item.icon;
            return (
              <button
                key={item.path || item.action || index}
                onClick={() => {
                  if (item.action === "search") {
                    console.log('🎯 MOBILE NAV: Opening Advanced Search Widget');
                    setShowSearchWidget(true);
                  } else if (item.path) {
                    setLocation(item.path);
                  }
                }}
                className="flex flex-col items-center justify-center min-w-0 flex-1"
                aria-label={item.label}
              >
                <Icon className={`w-6 h-6 md:w-7 md:h-7 mb-1 ${isActive ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`} />
                <span className={`text-xs md:text-sm font-medium ${isActive ? 'text-orange-500' : 'text-gray-500 dark:text-gray-500'}`}>{item.label}</span>
              </button>
            );
          })}

          {/* Center create button */}
          <button
            onClick={() => setShowActionMenu(true)}
            aria-label="Create"
            className="absolute left-1/2 -translate-x-1/2 -top-4 w-14 h-14 md:w-16 md:h-16 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
          >
            <Plus className="w-7 h-7 md:w-8 md:h-8 text-orange-500" />
          </button>

          {/* Right two items */}
          {navItems.slice(2).map((item, index) => {
            const isActive = item.path ? (location === item.path || (item.path.startsWith('/profile') && location.startsWith('/profile'))) : false;
            const Icon = item.icon;
            return (
              <button
                key={item.path || item.action || index}
                onClick={() => {
                  if (item.action === "search") {
                    console.log('🎯 MOBILE NAV: Opening Advanced Search Widget');
                    setShowSearchWidget(true);
                  } else if (item.path) {
                    setLocation(item.path);
                  }
                }}
                className="flex flex-col items-center justify-center min-w-0 flex-1"
                aria-label={item.label}
              >
                <Icon className={`w-6 h-6 md:w-7 md:h-7 mb-1 ${isActive ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`} />
                <span className={`text-xs md:text-sm font-medium ${isActive ? 'text-orange-500' : 'text-gray-500 dark:text-gray-500'}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="h-safe-area-inset-bottom" />
      </div>

      {/* Advanced Search Widget */}
      <AdvancedSearchWidget 
        open={showSearchWidget}
        onOpenChange={setShowSearchWidget}
      />
    </>
  );
}