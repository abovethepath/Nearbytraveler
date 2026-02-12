import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Home, Plus, MessageCircle, User, Calendar, Search, X, MapPin, Zap, Users } from "lucide-react";
import { AuthContext } from "@/App";
import { AdvancedSearchWidget } from "@/components/AdvancedSearchWidget";
import { useQuery } from "@tanstack/react-query";
import { isNativeIOSApp } from "@/lib/nativeApp";

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

export function MobileBottomNav() {
  if (isNativeIOSApp()) return null;
  
  const [location, setLocation] = useLocation();
  const [showActionMenu, setShowActionMenu] = useState(false);
  const isDark = useIsDarkMode();
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

  const isBusinessUser = user?.userType === 'business';

  const navItems = isBusinessUser ? [
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
  
  const actionMenuItems = isBusinessUser ? [
    { label: "Create Deal", path: "/business-dashboard", icon: Calendar, color: "#f97316" },
    { label: "Quick Deal", path: "/business-dashboard", icon: Zap, color: "#3b82f6" },
  ] : [
    { label: "Create Event", path: "/create-event", icon: Calendar, color: "#f97316" },
    { label: "Plan Trip", path: "/plan-trip", icon: MapPin, color: "#3b82f6" },
    { label: "Quick Meetup", path: "/quick-meetups", icon: Users, color: "#10b981" },
  ];

  const handleCreateTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActionMenu(true);
  };

  return (
    <>
      {showActionMenu && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 2147483646,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setShowActionMenu(false)}
        >
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }} />
          <div 
            style={{ 
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              margin: '0 8px',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
              animation: 'iosSheetUp 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              background: isDark ? '#1c1c1e' : 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              marginBottom: '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${isDark ? '#2c2c2e' : '#f3f4f6'}` }}>
                <div style={{ width: '36px', height: '4px', background: isDark ? '#48484a' : '#d1d5db', borderRadius: '9999px', margin: '0 auto 8px' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: isDark ? '#f5f5f7' : '#111827', textAlign: 'center' }}>
                  Create New
                </h3>
              </div>
              <div style={{ padding: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${actionMenuItems.length}, 1fr)`, gap: '8px' }}>
                  {actionMenuItems.map((action, index) => {
                    const ActionIcon = action.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setLocation(action.path);
                          setShowActionMenu(false);
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px',
                          borderRadius: '16px',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          minHeight: '80px',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        <div style={{
                          width: '48px',
                          height: '48px',
                          background: `linear-gradient(135deg, ${action.color}, ${action.color}dd)`,
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '8px',
                          boxShadow: `0 4px 12px ${action.color}40`,
                        }}>
                          <ActionIcon style={{ width: '24px', height: '24px', color: 'white' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 500, color: isDark ? '#d1d1d6' : '#374151', textAlign: 'center', lineHeight: '14px' }}>
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
              style={{
                width: '100%',
                background: isDark ? '#1c1c1e' : 'white',
                borderRadius: '16px',
                padding: '14px',
                fontSize: '17px',
                fontWeight: 600,
                color: '#f97316',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div 
        style={{ 
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999, 
          width: '100vw',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: isDark ? '#1c1c1e' : '#f8f8f8',
          borderTop: `1px solid ${isDark ? '#38383a' : '#e5e5e5'}`,
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-end', 
          justifyContent: 'space-between', 
          padding: '0 8px', 
          maxWidth: '480px', 
          margin: '0 auto', 
          height: '49px',
          position: 'relative',
          overflow: 'visible',
        }}>
          {navItems.slice(0, 2).map((item, index) => {
            const isActive = item.path ? (location === item.path || (item.path === '/' && location === '/')) : false;
            const Icon = item.icon;
            return (
              <button
                key={item.path || item.action || index}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (item.action === "search") {
                    setShowSearchWidget(true);
                  } else if (item.path) {
                    setLocation(item.path);
                  }
                }}
                style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  touchAction: 'manipulation', 
                  WebkitTapHighlightColor: 'transparent', 
                  minHeight: '49px',
                  paddingTop: '6px',
                  paddingBottom: '2px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
                aria-label={item.label}
              >
                <Icon 
                  style={{ 
                    width: '22px', 
                    height: '22px', 
                    marginBottom: '2px',
                    color: isActive ? '#f97316' : (isDark ? '#8e8e93' : '#9ca3af'),
                    strokeWidth: isActive ? 2.5 : 1.8,
                  }}
                />
                <span style={{ 
                  fontSize: '10px', 
                  lineHeight: '12px', 
                  fontWeight: 500,
                  color: isActive ? '#f97316' : (isDark ? '#8e8e93' : '#9ca3af'),
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleCreateTap}
            aria-label="Create"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '49px',
              paddingTop: '6px',
              paddingBottom: '2px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#f97316',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '2px',
            }}>
              <Plus style={{ width: '18px', height: '18px', color: 'white' }} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: '10px', lineHeight: '12px', fontWeight: 500, color: '#f97316' }}>
              Create
            </span>
          </button>

          {navItems.slice(2).map((item, index) => {
            const isActive = item.path ? (location === item.path || (item.path.startsWith('/profile') && location.startsWith('/profile'))) : false;
            const Icon = item.icon;
            const isMessagesItem = item.label === "Messages";
            
            return (
              <button
                key={item.path || item.action || index}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (item.action === "search") {
                    setShowSearchWidget(true);
                  } else if (item.path) {
                    setLocation(item.path);
                  }
                }}
                style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  touchAction: 'manipulation', 
                  WebkitTapHighlightColor: 'transparent', 
                  minHeight: '49px',
                  paddingTop: '6px',
                  paddingBottom: '2px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
                aria-label={item.label}
              >
                <div style={{ position: 'relative' }}>
                  <Icon 
                    style={{ 
                      width: '22px', 
                      height: '22px', 
                      marginBottom: '2px',
                      color: isActive ? '#f97316' : (isDark ? '#8e8e93' : '#9ca3af'),
                      strokeWidth: isActive ? 2.5 : 1.8,
                    }}
                  />
                  {isMessagesItem && unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-10px',
                      minWidth: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#ef4444',
                      color: 'white',
                      borderRadius: '9999px',
                      padding: '0 4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span style={{ 
                  fontSize: '10px', 
                  lineHeight: '12px', 
                  fontWeight: 500,
                  color: isActive ? '#f97316' : (isDark ? '#8e8e93' : '#9ca3af'),
                }}>
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
        @keyframes iosSheetUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}