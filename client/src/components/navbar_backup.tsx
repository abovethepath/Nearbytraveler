import React, { useContext, useState, useEffect } from "react";
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

  // Force refresh user data and clear cached avatar
  useEffect(() => {
    if (directUser?.id) {
      // Clear React Query cache
      queryClient.invalidateQueries({ queryKey: [`/api/users/${directUser.id}`] });

      // Force fetch fresh user data and update context
      const refreshUserData = async () => {
        try {
          const response = await fetch(`/api/users/${directUser.id}`);
          if (response.ok) {
            const freshUserData = await response.json();
            setUser(freshUserData);
            authStorage.setUser(freshUserData);

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

  // Close mobile menu on location change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

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

  // Listen for profile updates and refresh avatar - ENHANCED VERSION
  useEffect(() => {
    const handleUpdate = async (event: any) => {
      console.log('Navbar avatar refresh triggered:', event.type, event.detail?.id);

      // Refresh avatar key for immediate UI update
      setAvatarKey(Date.now());

      // Fetch fresh user data if this is the current user
      if (directUser?.id && event.detail?.id === directUser.id) {
        try {
          const response = await fetch(`/api/users/${directUser.id}`);
          if (response.ok) {
            const freshUserData = await response.json();

            // Update the auth context with fresh profile image
            const updatedUser = { ...directUser, profileImage: freshUserData.profileImage };
            setUser(updatedUser);
            authStorage.setUser(updatedUser);
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

    return () => {
      window.removeEventListener('profilePhotoUpdated', handleUpdate);
      window.removeEventListener('userDataUpdated', handleUpdate);
      window.removeEventListener('refreshNavbar', handleUpdate);
    };
  }, [queryClient, directUser?.id, setUser]);



  // COMPLETELY REBUILT LOGOUT SYSTEM - SIMPLE AND DIRECT
  const handleLogout = () => {
    console.log('🚪 STARTING COMPLETE LOGOUT REBUILD');

    try {
      // Step 1: Clear ALL localStorage
      console.log('Step 1: Clearing localStorage');
      localStorage.clear();

      // Step 2: Clear sessionStorage
      console.log('Step 2: Clearing sessionStorage');
      sessionStorage.clear();

      // Step 3: Clear React Query cache
      console.log('Step 3: Clearing React Query cache');
      queryClient.clear();

      // Step 4: Update local state
      console.log('Step 4: Clearing local state');
      setDirectUser(null);
      setUser(null);

      // Step 5: Force redirect to landing page
      console.log('Step 5: Redirecting to landing page');
      window.location.href = '/';

    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force redirect anyway
      window.location.href = '/';
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

    // Traveler/local users get full navigation
    return [
      { path: "/", label: "Home", icon: "🏠" },
      { path: "/discover", label: "Cities", icon: "🌍" },
      { path: "/plan-trip", label: "Travel", icon: "✈️" },
      { path: "/events", label: "Events", icon: "📅" },
      { path: "/business-offers", label: "Deals", icon: "🏷️" },
      { path: "/connect", label: "Connect", icon: "💝" },
      { path: "/match-in-city", label: "City Match", icon: "🎯" },
      { path: "/activity-search", label: "Find Activity", icon: "🔍" },
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

  return (
    <>
      <header className="bg-white dark:bg-black shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24 py-3">
            <div className="flex items-center mt-2">
              <Link href="/" className="flex items-center space-x-2 logo-container">
                <Logo variant="navbar" />
              </Link>
              <span className="ml-3 text-red-600 font-bold text-base">BETA VERSION</span>
            </div>
            <div className="flex items-center space-x-8 ml-auto">
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

              {/* Mobile Navigation - Always Visible */}
              <nav className="md:hidden flex items-center space-x-2 overflow-x-auto">
                {navItems.slice(0, 4).map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`whitespace-nowrap px-2 py-1 rounded text-xs font-medium transition-colors ${
                      location === item.path
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    }`}
                    onClick={() => console.log(`Mobile nav: ${item.path}`)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="flex items-center space-x-3">
                {directUser?.id && <NotificationBell userId={directUser.id} />}

                <button 
                  onClick={() => setLocation('/donate')}
                  className="hidden md:block"
                  style={{ 
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                >
                  Donate
                </button>

                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  className="md:hidden h-10 w-10 p-0"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label={isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
                  aria-expanded={isMobileMenuOpen}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <SimpleAvatar 
                      user={directUser} 
                      size="md" 
                      className="border-2 border-white shadow-sm"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
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

                  {/* Keep user-specific items */}
                  {false && directUser?.userType === 'business' ? (
                    <>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <Home className="mr-2 h-4 w-4" />
                        <span>Home</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/business-dashboard');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/deals');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <Star className="mr-2 h-4 w-4" />
                        <span>Deals</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/connect');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        <span>Connect with Customers</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/messages');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        <span>Messages</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    /* Traveler/local users get full dropdown menu */
                    <>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <Home className="mr-2 h-4 w-4" />
                        <span>Home</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/welcome');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <Star className="mr-2 h-4 w-4" />
                        <span>Welcome</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/getting-started');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <Star className="mr-2 h-4 w-4" />
                        <span>Success Tips</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/discover');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <Search className="mr-2 h-4 w-4" />
                        <span>Discover Cities</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/plan-trip');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Plan Trip</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/events');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <MapPin className="mr-2 h-4 w-4" />
                        <span>Events</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/meetups');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Quick Meetups</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/matches');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Matches</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setLocation('/messages');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        <span>Messages</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        toast({
                          title: "Not in Beta",
                          description: "City Chatrooms feature is not available in beta version",
                        });
                      }}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>City Chatrooms</span>
                      </DropdownMenuItem>
                      {/* Advanced features temporarily hidden for MVP */}



                    </>
                  )}

                  {/* Common items for all users */}
                  <DropdownMenuItem onClick={() => {
                    console.log('Profile dropdown clicked, navigating to /profile');
                    setLocation('/profile');
                  }}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>

                  {/* Business users only get basic profile and logout */}
                  {directUser?.userType !== 'business' && (
                    <DropdownMenuItem onClick={() => {
                      setLocation('/settings');
                      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                    }}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
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

        {/* Mobile Navigation Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 z-40 shadow-lg">
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
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    console.log(`Mobile nav: Navigating to ${item.path}`);
                  }}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              {/* Mobile Donate Button */}
              <button 
                onClick={() => {
                  setLocation('/donate');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full mt-4 py-3 px-4 rounded-lg text-white font-medium"
                style={{ backgroundColor: '#10b981' }}
              >
                Donate
              </button>
            </div>
          </div>
        )}
      </header>

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