import React, { useState } from "react";
import { useLocation } from "wouter";
import { Home, Plus, MessageCircle, User, Calendar, Search, X } from "lucide-react";
import { AuthContext } from "@/App";
import { AdvancedSearchWidget } from "@/components/AdvancedSearchWidget";
import { useQuery } from "@tanstack/react-query";

export function MobileBottomNav() {
  const [location, setLocation] = useLocation();
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showSearchWidget, setShowSearchWidget] = useState(false);
  const authContext = React.useContext(AuthContext);
  let user = authContext?.user;
  
  if (!user) {
    const storedUser = localStorage.getItem('user') || localStorage.getItem('currentUser') || localStorage.getItem('authUser');
    if (storedUser) {
      try {
        user = JSON.parse(storedUser);
      } catch (e) {
        console.error('Error parsing stored user in MobileBottomNav:', e);
      }
    }
  }

  const { data: unreadData } = useQuery({
    queryKey: [`/api/messages/${user?.id}/unread-count`],
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const unreadCount = (unreadData as any)?.unreadCount || 0;

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

  const isBusinessUser = user?.userType === 'business';
  
  const actionMenuItems = isBusinessUser ? [
    { label: "Create Deal", path: "/business-dashboard", icon: Calendar },
    { label: "Create Quick Deal", path: "/business-dashboard", icon: MessageCircle },
  ] : [
    { label: "Create Event", path: "/create-event", icon: Calendar },
    { label: "Create Trip", path: "/plan-trip", icon: Calendar },
    { label: "Create Quick Meetup", path: "/quick-meetups", icon: MessageCircle },
  ];

  return (
    <>
      {showActionMenu && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setShowActionMenu(false)}
        >
          <div className="ios-action-sheet-backdrop absolute inset-0" />
          <div 
            className="relative w-full max-w-lg mx-2 ios-action-sheet"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden mb-2 shadow-2xl">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="w-9 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-2" />
                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white text-center">
                  Create New
                </h3>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-3 gap-2">
                  {actionMenuItems.map((action, index) => {
                    const ActionIcon = action.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (action.path) {
                            setLocation(action.path);
                            setShowActionMenu(false);
                          }
                        }}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
                        style={{ minHeight: '80px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mb-2 shadow-sm">
                          <ActionIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                          {action.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowActionMenu(false)}
              className="w-full bg-white dark:bg-gray-800 rounded-2xl py-3.5 text-[17px] font-semibold text-orange-500 active:bg-gray-50 dark:active:bg-gray-700 shadow-2xl"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div 
        className="ios-tab-bar fixed bottom-0 left-0 right-0 overflow-visible"
        style={{ 
          position: 'fixed', 
          zIndex: 9999, 
          width: '100vw', 
          bottom: '0px', 
          display: 'block', 
          overflow: 'visible',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="relative flex items-end justify-between px-2 max-w-lg mx-auto overflow-visible" style={{ height: '49px' }}>
          {navItems.slice(0, 2).map((item, index) => {
            const isActive = item.path ? (location === item.path || (item.path === '/' && location === '/')) : false;
            const Icon = item.icon;
            const handleNavClick = (e: React.MouseEvent | React.TouchEvent) => {
              e.preventDefault();
              e.stopPropagation();
              if (item.action === "search") {
                setShowSearchWidget(true);
              } else if (item.path) {
                setLocation(item.path);
              }
            };
            return (
              <button
                key={item.path || item.action || index}
                type="button"
                onClick={handleNavClick}
                onTouchEnd={handleNavClick}
                className="flex flex-col items-center justify-center flex-1"
                style={{ 
                  touchAction: 'manipulation', 
                  WebkitTapHighlightColor: 'transparent', 
                  minHeight: '49px',
                  paddingTop: '6px',
                  paddingBottom: '2px',
                }}
                aria-label={item.label}
              >
                <Icon 
                  className={`mb-0.5 transition-colors ${isActive ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}
                  style={{ width: '22px', height: '22px' }}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span 
                  className={`font-medium transition-colors ${isActive ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}
                  style={{ fontSize: '10px', lineHeight: '12px' }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setShowActionMenu(true)}
            aria-label="Create"
            className="absolute left-1/2 -translate-x-1/2 -top-4 flex items-center justify-center ios-create-button"
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '25px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Plus className="text-white" style={{ width: '26px', height: '26px' }} strokeWidth={2.5} />
          </button>

          {navItems.slice(2).map((item, index) => {
            const isActive = item.path ? (location === item.path || (item.path.startsWith('/profile') && location.startsWith('/profile'))) : false;
            const Icon = item.icon;
            const isMessagesItem = item.label === "Messages";
            
            return (
              <button
                key={item.path || item.action || index}
                onClick={() => {
                  if (item.action === "search") {
                    setShowSearchWidget(true);
                  } else if (item.path) {
                    setLocation(item.path);
                  }
                }}
                className="flex flex-col items-center justify-center flex-1"
                style={{ 
                  touchAction: 'manipulation', 
                  WebkitTapHighlightColor: 'transparent', 
                  minHeight: '49px',
                  paddingTop: '6px',
                  paddingBottom: '2px',
                }}
                aria-label={item.label}
              >
                <div className="relative">
                  <Icon 
                    className={`mb-0.5 transition-colors ${isActive ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}
                    style={{ width: '22px', height: '22px' }}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  {isMessagesItem && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] flex items-center justify-center bg-red-500 text-white rounded-full px-1 shadow-sm" style={{ fontSize: '10px', fontWeight: 700 }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span 
                  className={`font-medium transition-colors ${isActive ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}
                  style={{ fontSize: '10px', lineHeight: '12px' }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AdvancedSearchWidget 
        open={showSearchWidget}
        onOpenChange={setShowSearchWidget}
      />

      <style>{`
        .ios-tab-bar {
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: saturate(180%) blur(20px);
          -webkit-backdrop-filter: saturate(180%) blur(20px);
          border-top: 0.5px solid rgba(0, 0, 0, 0.12);
        }
        .dark .ios-tab-bar {
          background: rgba(17, 24, 39, 0.92);
          border-top: 0.5px solid rgba(255, 255, 255, 0.08);
        }
        .ios-create-button {
          background: linear-gradient(135deg, #f97316, #ea580c);
          box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);
        }
        .ios-create-button:active {
          transform: scale(0.92);
          transition: transform 0.1s ease;
        }
        .ios-action-sheet-backdrop {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .ios-action-sheet {
          animation: iosSheetUp 0.35s cubic-bezier(0.32, 0.72, 0, 1);
        }
        @keyframes iosSheetUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}