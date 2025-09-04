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
import { Globe, Bell, Settings, LogOut, Users, Bot, Home, Calendar, MapPin, MessageCircle, UserCheck, BarChart3, Star, Search, User, Sparkles, Mail, Menu, X, Moon, Sun } from "lucide-react";
import Logo from "@/components/logo";
import ConnectModal from "@/components/connect-modal";
import NotificationBell from "@/components/notification-bell";
import { useTheme } from "@/components/theme-provider";
import { authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";


// Theme Toggle as Dropdown Menu Item
function ThemeToggleMenuItem() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <DropdownMenuItem onClick={toggleTheme}>
      {isDark ? (
        <Sun className="mr-2 h-4 w-4" />
      ) : (
        <Moon className="mr-2 h-4 w-4" />
      )}
      <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
    </DropdownMenuItem>
  );
}

function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, setUser } = useContext(AuthContext);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const headerRef = React.useRef<HTMLDivElement>(null);
  const [menuTop, setMenuTop] = useState(0);

  // Bulletproof user data access - get from multiple sources
  const [directUser, setDirectUser] = useState<any>(null);

  // Check all possible user data sources
  useEffect(() => {
    const getUserData = () => {
      // Try context first
      if (user && user.username) {
        console.log('✅ Navbar: Got user from context:', user.username);
        setDirectUser(user);
        return;
      }

      // Try authStorage system (most reliable)
      const storedUser = authStorage.getUser();
      if (storedUser && storedUser.username) {
        console.log('✅ Navbar: Got user from authStorage:', storedUser.username);
        setDirectUser(storedUser);
        // Also update context if it's empty
        if (!user && setUser) {
          setUser(storedUser);
        }
        return;
      }

      // No user data found
      console.log('❌ Navbar: No user data found');
      setDirectUser(null);
    };

    getUserData();
  }, [user, location]); // Add location to trigger refresh on page changes

  // Debug logging
  console.log('Navbar user context:', user?.username || 'null');
  console.log('Navbar directUser:', directUser?.username || 'null');
  console.log('Navbar directUser profileImage:', directUser?.profileImage ? 'HAS IMAGE' : 'NO IMAGE');
  
  // Additional debug for avatar component
  console.log('🎯 Avatar Debug: passing to SimpleAvatar:', {
    hasUser: !!directUser,
    username: directUser?.username,
    hasProfileImage: !!directUser?.profileImage,
    profileImageStart: directUser?.profileImage?.substring(0, 20)
  });

  // Force refresh user data and clear cached avatar
  useEffect(() => {
    if (directUser?.id) {
      // Clear React Query cache
      queryClient.invalidateQueries({ queryKey: [`/api/users/${directUser.id}`] });

      // Force fetch fresh user data and update context
      const refreshUserData = async () => {
        try {
          const response = await fetch(`/api/users/${directUser.id}?t=${Date.now()}`);
          if (response.ok) {
            const freshUserData = await response.json();
            console.log('🔄 Navbar: Fresh user data fetched:', freshUserData.username, 'has image:', !!freshUserData.profileImage);
            
            // Update ALL user data sources immediately
            setUser(freshUserData);
            setDirectUser(freshUserData);
            authStorage.setUser(freshUserData);
            localStorage.setItem('travelconnect_user', JSON.stringify(freshUserData));

            // Trigger avatar refresh event for all components
            window.dispatchEvent(new CustomEvent('avatarRefresh'));
          }
        } catch (error) {
          console.log('Failed to refresh user data:', error);
        }
      };

      refreshUserData();
    }
  }, [directUser?.id, queryClient, setUser]);

  // recalc top on load/resize & when warning banners appear/disappear
  useEffect(() => {
    const measure = () => setMenuTop(headerRef.current?.getBoundingClientRect().height ?? 0);
    measure();
    window.addEventListener("resize", measure);
    const id = setInterval(measure, 300); // cheap guard if header height changes (banners)
    return () => { window.removeEventListener("resize", measure); clearInterval(id); };
  }, []);

  // close on route change
  useEffect(() => setIsMobileMenuOpen(false), [location]);

  // Listen for profile updates to refresh user data
  useEffect(() => {
    const handleProfileUpdate = (event: any) => {
      console.log('Navbar avatar refresh triggered:', event.type, event.detail?.id);
      if (event.detail && event.detail.id) {
        const updatedUser = event.detail;
        
        // Update direct user immediately
        setDirectUser(updatedUser);
        
        // Update all storage systems  
        if (setUser) setUser(updatedUser);
        authStorage.setUser(updatedUser);
        localStorage.setItem('travelconnect_user', JSON.stringify(updatedUser));
        
        console.log('🔄 Navbar: Using event user data directly');
      }
    };

    // Listen for multiple event types to catch all profile updates
    window.addEventListener('userDataUpdated', handleProfileUpdate);
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('profilePhotoUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleProfileUpdate);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('profilePhotoUpdated', handleProfileUpdate);
    };
  }, [setUser]);

  // Clear oversized images and validate avatar data
  useEffect(() => {
    if (directUser) {
      const imageLength = directUser.profileImage?.length || 0;

      // Automatically clear any image over 200KB to prevent performance issues
      if (imageLength > 200000) {
        console.warn('Avatar too large (' + imageLength + ' chars), auto-clearing for performance');

        // Clear from context immediately
        const cleanUser = { ...directUser, profileImage: null };
        setUser(cleanUser);
        authStorage.setUser(cleanUser);

        // Clear from server
        fetch('/api/users/profile-photo', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }).catch(() => {});

        return;
      }
    }
  }, [directUser?.id, directUser?.profileImage?.length]);

  // Simple avatar refresh system
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const [navbarRefreshTrigger, setNavbarRefreshTrigger] = useState(0);

  // Listen for profile updates and refresh avatar - ENHANCED VERSION
  useEffect(() => {
    const handleUpdate = async (event: any) => {
      console.log('Navbar avatar refresh triggered:', event.type, event.detail?.id);

      // Force complete navbar refresh
      setAvatarKey(Date.now());
      setNavbarRefreshTrigger(prev => prev + 1);

      // If event contains user data, use it directly
      if (event.detail && typeof event.detail === 'object' && event.detail.profileImage !== undefined) {
        console.log('🔄 Navbar: Using event user data directly');
        setDirectUser(event.detail);
        setUser(event.detail);
        authStorage.setUser(event.detail);
        return;
      }

      // Fetch fresh user data if this is the current user
      if (directUser?.id) {
        try {
          const response = await fetch(`/api/users/${directUser.id}?t=${Date.now()}`);
          if (response.ok) {
            const freshUserData = await response.json();
            console.log('🔄 Navbar: Fresh data fetched:', freshUserData.username, 'has image:', !!freshUserData.profileImage);

            // Update ALL user data sources
            setDirectUser(freshUserData);
            setUser(freshUserData);
            authStorage.setUser(freshUserData);
          }
        } catch (error) {
          console.log('Failed to fetch fresh user data:', error);
        }
      }

      // Also invalidate queries for other components
      if (directUser?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${directUser.id}`] });
      }
    };

    window.addEventListener('profilePhotoUpdated', handleUpdate);
    window.addEventListener('userDataUpdated', handleUpdate);
    window.addEventListener('refreshNavbar', handleUpdate);
    window.addEventListener('forceNavbarRefresh', handleUpdate);

    return () => {
      window.removeEventListener('profilePhotoUpdated', handleUpdate);
      window.removeEventListener('userDataUpdated', handleUpdate);
      window.removeEventListener('refreshNavbar', handleUpdate);
      window.removeEventListener('forceNavbarRefresh', handleUpdate);
    };
  }, [queryClient, directUser?.id, setUser]);



  // LOGOUT SYSTEM - Bulletproof version according to guide
  const handleLogout = async () => {
    console.log('🚪 Starting bulletproof logout process');

    try {
      // Step 1: Call server logout to destroy session
      console.log('Step 1: Calling server logout');
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Server session destroyed');
      } catch (err) {
        console.warn('Server logout failed, continuing with client cleanup');
      }

      // Step 2: Clear ALL localStorage
      console.log('Step 2: Clearing localStorage');
      localStorage.clear();

      // Step 3: Clear sessionStorage
      console.log('Step 3: Clearing sessionStorage');
      sessionStorage.clear();

      // Step 4: Clear React Query cache
      console.log('Step 4: Clearing React Query cache');
      queryClient.clear();

      // Step 5: Update local state
      console.log('Step 5: Clearing local state');
      setDirectUser(null);
      setUser(null);

      // Step 6: Small delay then redirect (ensures cleanup happens)
      console.log('Step 6: Waiting 100ms then redirecting to landing page');
      setTimeout(() => {
        window.location.href = '/';
      }, 100);

    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force redirect anyway after delay
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  };

  // Filter nav items based on user type
  const getNavItems = () => {
    const profilePath = directUser?.id ? `/profile/${directUser.id}` : '/profile';

    // Business users get a completely different, simplified navbar
    if (directUser?.userType === 'business') {
      return [
        { path: "/", label: "Home", icon: "🏠" },
        { path: "/business-dashboard", label: "Dashboard", icon: "📊" },
        { path: "/deals", label: "Deals", icon: "🏷️" },
        { path: "/connect", label: "Connect", icon: "💝" },
        { path: "/messages", label: "Messages", icon: "💬" },
        { path: profilePath, label: "Profile", icon: "👤" },
      ];
    }

    // Traveler/local users get streamlined navigation
    return [
      { path: "/", label: "Home", icon: "🏠" },
      { path: "/discover", label: "Cities", icon: "🌍" },
      { path: "/events", label: "Events", icon: "📅" },
      { path: "/match-in-city", label: "City Match", icon: "🎯" },
      { path: "/connect", label: "Connect", icon: "💝" },
      { path: "/messages", label: "Messages", icon: "💬" },
      { path: profilePath, label: "Profile", icon: "👤" },
    ];
  };

  const navItems = getNavItems();

  // Fetch user's travel plans for the Connect modal
  const { data: userTravelPlans } = useQuery({
    queryKey: [`/api/travel-plans/${directUser?.id}`],
    enabled: !!directUser?.id && showConnectModal,
  });

  // Check if profile needs completion
  const profileNeedsCompletion = directUser && (
    !directUser.bio || 
    directUser.bio.length < 30 ||
    !directUser.profileImage ||
    (directUser.interests && directUser.interests.length < 3)
  );

  return (
    <>
      {/* Profile Completion Reminder Bar */}
      {profileNeedsCompletion && (
        <div className="bg-red-600 text-white py-2 px-4 text-center text-sm font-medium">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <span>⚠️ Complete your profile to unlock all features</span>
            <Link href={`/profile/${directUser?.id || ''}`}>
              <Button variant="secondary" size="sm" className="ml-2 bg-white text-red-600 hover:bg-gray-100">
                Complete Profile
              </Button>
            </Link>
          </div>
        </div>
      )}
      
      <header ref={headerRef} className="sticky top-0 z-[200] bg-white dark:bg-black shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 py-1">
            <div className="flex items-center justify-start">
              <Link href="/" className="flex items-center space-x-2 logo-container text-left">
                <img 
                  src="/new-logo_1753994063802.png" 
                  alt="Nearby Traveler" 
                  className={`${isMobileMenuOpen ? 'h-64 sm:h-40' : 'h-52 sm:h-32'} md:h-32 lg:h-32 w-auto cursor-pointer hover:opacity-80 transition-all duration-300 object-contain`}
                  style={{ maxWidth: isMobileMenuOpen ? '500px' : '416px' }}
                  onLoad={() => console.log('Logo loaded successfully')}
                  onError={(e) => {
                    console.error('Logo failed to load from:', e.currentTarget.src);
                    // Try fallback text
                    const fallback = document.createElement('div');
                    fallback.innerHTML = '<span class="text-2xl font-bold bg-gradient-to-r from-blue-500 to-orange-500 bg-clip-text text-transparent">NearbyTraveler</span>';
                    e.currentTarget.parentNode?.replaceChild(fallback, e.currentTarget);
                  }}
                />
              </Link>
              <span className="ml-3 text-red-600 font-bold text-base">BETA VERSION</span>
            </div>
            <div className="flex items-center space-x-4 md:space-x-8 ml-auto">
              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-6">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`transition-colors font-medium hover:underline ${
                      location === item.path
                        ? "text-gray-900 dark:text-white font-semibold"
                        : "text-gray-700 dark:text-white hover:text-travel-blue"
                    }`}
                    onClick={() => console.log(`Navigating to ${item.path}`)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center space-x-2 md:space-x-3">
                {directUser?.id && <NotificationBell userId={directUser.id} />}


                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  className="md:hidden h-12 w-12 p-0"
                  onClick={() => setIsMobileMenuOpen(o => !o)}
                  aria-controls="mobile-menu"
                  aria-expanded={isMobileMenuOpen}
                  aria-label={isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
                >
                  {isMobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <SimpleAvatar 
                      key={`navbar-avatar-${directUser?.id}-${avatarKey}-${navbarRefreshTrigger}`}
                      user={directUser} 
                      size="md" 
                      className="border-2 border-white shadow-sm"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 z-[9999] bg-white dark:bg-gray-800 border shadow-lg" align="end" forceMount>
                  {/* Welcome item at the top */}
                  {directUser?.userType !== 'business' && (
                    <DropdownMenuItem onClick={() => {
                      setLocation('/welcome');
                      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                    }}>
                      <Star className="mr-2 h-4 w-4" />
                      <span>Welcome</span>
                    </DropdownMenuItem>
                  )}
                  
                  {/* Avatar dropdown now matches main navigation exactly */}
                  {navItems.map((item) => (
                    <DropdownMenuItem 
                      key={item.path}
                      onClick={() => {
                        setLocation(item.path);
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}
                    >
                      <span className="mr-2">{item.icon}</span>
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  ))}

                  {/* Business-specific navigation items */}
                  {directUser?.userType === 'business' && (
                    <>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/events');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <span className="mr-2">📅</span>
                        <span>My Events</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/create-event');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <span className="mr-2">✨</span>
                        <span>Create Event</span>
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Additional navigation items for traveler/local users */}
                  {directUser?.userType !== 'business' && (
                    <>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/plan-trip');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <span className="mr-2">✈️</span>
                        <span>Plan Trip</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/business-offers');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <span className="mr-2">🏷️</span>
                        <span>Deals & Offers</span>
                      </DropdownMenuItem>


                      <DropdownMenuItem onClick={() => {
                        setLocation('/getting-started');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <Star className="mr-2 h-4 w-4" />
                        <span>Success Tips</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/meetups');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Quick Meetups</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/city-chatrooms');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>City Chatrooms</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/settings');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                    </>
                  )}

                  {directUser?.isAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/admin-dashboard');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/admin-settings');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
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
              </DropdownMenu>
            </div>
          </div>
        </div>

      </header>

      {/* Portal-based Mobile Menu - renders outside header to avoid z-index issues */}
      {createPortal(
        <div
          id="mobile-menu"
          className={`md:hidden fixed inset-x-0 transition-opacity duration-200 ${
            isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          style={{ top: menuTop, zIndex: 9999 }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-6 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`block py-3 px-4 rounded-lg text-lg font-medium transition-colors ${
                    location === item.path
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => { setIsMobileMenuOpen(false); setLocation(item.path); }}
                >
                  <span className="mr-3">{item.icon}</span>{item.label}
                </Link>
              ))}
              
              {/* Additional mobile menu items not in main nav */}
              {directUser?.userType !== 'business' && (
                <>
                  <Link
                    href="/quick-meetups"
                    className={`block py-3 px-4 rounded-lg text-lg font-medium transition-colors ${
                      location === '/quick-meetups'
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => { setIsMobileMenuOpen(false); setLocation('/quick-meetups'); }}
                  >
                    <span className="mr-3">⚡</span>Quick Meetups
                  </Link>
                  <Link
                    href="/city-chatrooms"
                    className={`block py-3 px-4 rounded-lg text-lg font-medium transition-colors ${
                      location === '/city-chatrooms'
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => { setIsMobileMenuOpen(false); setLocation('/city-chatrooms'); }}
                  >
                    <span className="mr-3">💬</span>City Chatrooms
                  </Link>
                </>
              )}
              
              {/* Add Deals for business users */}
              {directUser?.userType === 'business' && (
                <Link
                  href="/deals"
                  className={`block py-3 px-4 rounded-lg text-lg font-medium transition-colors ${
                    location === '/deals'
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => { setIsMobileMenuOpen(false); setLocation('/deals'); }}
                >
                  <span className="mr-3">🏷️</span>Deals
                </Link>
              )}
              
              {/* Settings for all users */}
              <Link
                href="/settings"
                className={`block py-3 px-4 rounded-lg text-lg font-medium transition-colors ${
                  location === '/settings'
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
                onClick={() => { setIsMobileMenuOpen(false); setLocation('/settings'); }}
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
                  setIsMobileMenuOpen(false);
                  setTimeout(() => handleLogout(), 100); // Defer logout until after menu closes
                }}
              >
                <span className="mr-3">🚪</span>Sign Out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Connect Modal */}
      <ConnectModal 
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        userTravelPlans={userTravelPlans as any[] || []}
      />
    </>
  );
}

export { Navbar };
export default Navbar;