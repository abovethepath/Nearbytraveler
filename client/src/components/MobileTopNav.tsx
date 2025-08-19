import React, { useState, useEffect } from "react";
import { Bell, Search, Menu, X, Home } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AuthContext } from "@/App";
import { useLocation } from "wouter";
import Logo from "@/components/logo";
import { authStorage } from "@/lib/auth";

export function MobileTopNav() {
  const { user, logout } = React.useContext(AuthContext);
  const [, setLocation] = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Get user data from multiple sources for reliable avatar display
  useEffect(() => {
    const getUserData = () => {
      // Try context first
      if (user && user.username) {
        console.log('📱 MobileTopNav: Got user from context:', user.username, 'has image:', !!user.profileImage);
        setCurrentUser(user);
        return;
      }

      // Try authStorage system
      const storedUser = authStorage.getUser();
      if (storedUser && storedUser.username) {
        console.log('📱 MobileTopNav: Got user from authStorage:', storedUser.username, 'has image:', !!storedUser.profileImage);
        setCurrentUser(storedUser);
        return;
      }

      // Try localStorage directly
      try {
        const localUser = localStorage.getItem('travelconnect_user');
        if (localUser) {
          const parsedUser = JSON.parse(localUser);
          if (parsedUser && parsedUser.username) {
            console.log('📱 MobileTopNav: Got user from localStorage:', parsedUser.username, 'has image:', !!parsedUser.profileImage);
            setCurrentUser(parsedUser);
            return;
          }
        }
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }

      console.log('📱 MobileTopNav: No user data found');
      setCurrentUser(null);
    };

    getUserData();
  }, [user]);

  // Listen for profile updates including location changes
  useEffect(() => {
    const handleProfileUpdate = (event: any) => {
      console.log('📱 MobileTopNav: Profile updated, refreshing user data');
      if (event.detail && event.detail.username) {
        setCurrentUser(event.detail);
        console.log('📱 MobileTopNav: Updated location:', event.detail.hometownCity, event.detail.hometownState, event.detail.hometownCountry);
      }
    };

    window.addEventListener('profilePhotoUpdated', handleProfileUpdate);
    window.addEventListener('userDataUpdated', handleProfileUpdate);
    window.addEventListener('profileUpdated', handleProfileUpdate); // Add this to catch location updates
    
    return () => {
      window.removeEventListener('profilePhotoUpdated', handleProfileUpdate);
      window.removeEventListener('userDataUpdated', handleProfileUpdate);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  return (
    <div
      className="mobile-top-nav fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-sm md:hidden"
      style={{
        position: 'fixed',
        zIndex: 9999,
        width: '100vw',
        height: '64px',
        top: '0px',
        display: 'block'
      }}
    >
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left side - Menu Button */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="w-9 h-9 p-0"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {showDropdown ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Center - Logo */}
        <div className="flex-1 flex justify-center">
          <Logo variant="navbar" />
        </div>

        {/* Right side - Profile + Notifications */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="relative w-9 h-9 p-0"
            onClick={() => setLocation("/notifications")}
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {/* Notification dot */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
          </Button>

          <Avatar
            className="w-9 h-9 cursor-pointer border-2 border-gray-200 dark:border-gray-700"
            onClick={() => {
              console.log("🔍 Avatar clicked, user data:", currentUser);
              setShowDropdown(false);
              if (currentUser?.id) {
                setLocation(`/profile/${currentUser.id}`);
              } else {
                setLocation('/profile');
              }
            }}
          >
            <AvatarImage
              src={currentUser?.profileImage || undefined}
              alt={currentUser?.name || currentUser?.username || "User"}
              key={`mobile-avatar-${currentUser?.id}-${Date.now()}`}
            />
            <AvatarFallback className="text-xs bg-blue-500 text-white">
              {currentUser?.name?.charAt(0)?.toUpperCase() || currentUser?.username?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-lg z-[9998]">
          <div className="flex flex-col py-2">
            {/* Conditional navigation based on user type */}
            {currentUser?.userType === 'business' ? (
              // Business navigation
              <>
                <button
                  className="flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => {
                    console.log('🏢 BUSINESS MOBILE NAV: Navigating to dashboard');
                    setShowDropdown(false);
                    setLocation('/');
                  }}
                >
                  Business Dashboard
                </button>
                <button
                  className="flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => { setLocation('/create-event'); setShowDropdown(false); }}
                >
                  Create Event
                </button>
                <button
                  className="flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => { setLocation('/messages'); setShowDropdown(false); }}
                >
                  Customer Messages
                </button>
                <button
                  className="flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => {
                    const profilePath = currentUser?.id ? `/profile/${currentUser.id}` : '/profile';
                    setLocation(profilePath);
                    setShowDropdown(false);
                  }}
                >
                  Business Profile
                </button>
                <button
                  className="flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => { setLocation('/discover'); setShowDropdown(false); }}
                >
                  View Cities
                </button>
                <button
                  className="flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => { setLocation('/welcome-business'); setShowDropdown(false); }}
                >
                  Business Welcome
                </button>
              </>
            ) : (
              // User navigation
              <>
                <button
                  className="flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => {
                    console.log('🏠 MOBILE NAV: Navigating to home');
                    setShowDropdown(false);
                    setLocation('/');
                  }}
                >
                  Home
                </button>
                <button
                  className="flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => { setLocation('/discover'); setShowDropdown(false); }}
                >
                  Cities
                </button>
                <button
                  className="flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => { setLocation('/events'); setShowDropdown(false); }}
                >
                  Events
                </button>
                <button
                  className="flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => { setLocation('/match-in-city'); setShowDropdown(false); }}
                >
                  City Match
                </button>
                <button
                  className="flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => { setLocation('/connect'); setShowDropdown(false); }}
                >
                  Connect
                </button>
                <button
                  className="flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => { setLocation('/messages'); setShowDropdown(false); }}
                >
                  Messages
                </button>
                <button
                  className="flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => {
                    const profilePath = currentUser?.id ? `/profile/${currentUser.id}` : '/profile';
                    setLocation(profilePath);
                    setShowDropdown(false);
                  }}
                >
                  Profile
                </button>
              </>
            )}
            
            {/* Common sign out button */}
            <button
              className="flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              onClick={() => {
                setShowDropdown(false);
                logout();
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
      <div className="h-safe-area-inset-top" />
    </div>
  );
}