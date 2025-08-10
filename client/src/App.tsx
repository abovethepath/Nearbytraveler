import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";

// Debug browser history
window.addEventListener('popstate', (event) => {
  console.log('=== BROWSER BACK/FORWARD DETECTED ===');
  console.log('Event:', event);
  console.log('Current URL:', window.location.href);
  console.log('History state:', event.state);
});
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Home from "@/pages/home";
import Discover from "@/pages/discover";
import Profile from "@/pages/profile";
import ProfileDebug from "@/pages/profile-debug";
import Messages from "@/pages/messages";
import Events from "@/pages/events";
import CreateEvent from "@/pages/create-event";
import Create from "@/pages/create";
import EventDetails from "@/pages/event-details";
import ExternalEventDetails from "@/pages/external-event-details";
import ManageEvent from "@/pages/manage-event";
import Meetups from "@/pages/meetups";
import QuickMeetupsPage from "@/pages/quick-meetups";
import MeetupManagePage from "@/pages/meetup-manage";
import MeetupChat from "@/pages/meetup-chat";
import EventChat from "@/pages/event-chat";
import QuickMeetupChat from "@/pages/quick-meetup-chat";
import EventsLanding from "@/pages/events-landing";
import BusinessLanding from "@/pages/business-landing";
import LocalsLanding from "@/pages/locals-landing";
import TravelersLanding from "@/pages/travelers-landing";
import Connect from "@/pages/connect";
import Requests from "@/pages/requests";

import Passport from "@/pages/passport";

import Auth from "@/pages/auth";
// import SignupLocal from "@/pages/signup-local"; // Removed broken file
import SignupLocalTraveler from "@/pages/signup-local-traveler";
import SignupTraveling from "@/pages/signup-traveling";
import SignupBusiness from "@/pages/signup-business";
import SignupSteps from "@/pages/signup-steps";
import UnifiedSignup from "@/pages/unified-signup";
import BusinessRegistration from "@/pages/business-registration";
import LandingNew from "@/pages/landing-new";
import Photos from "@/pages/photos";
import UploadPhotos from "@/pages/upload-photos";
import AICompanion from "@/pages/ai-companion";
import TravelMemories from "@/pages/travel-memories";
import HiddenGems from "@/pages/hidden-gems";
import PlanTrip from "@/pages/plan-trip";
import TravelIntentQuiz from "@/pages/TravelIntentQuiz";
import CityChatrooms from "@/pages/city-chatrooms";

import BusinessOffers from "@/pages/business-offers";
import BusinessDashboard from "@/pages/business-dashboard";
import BusinessProfile from "@/pages/business-profile";
import Deals from "@/pages/deals";
import Settings from "@/pages/settings";
import AdminSettings from "@/pages/admin-settings";
import Welcome from "@/pages/welcome";
import WelcomeBusiness from "@/pages/welcome-business";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Cookies from "@/pages/cookies";
import About from "@/pages/about";
import GettingStarted from "@/pages/getting-started";


import CityPage from "@/pages/city";
import UsersPage from "@/pages/users";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminReferrals from "@/pages/admin-referrals";
import ReferralsPage from "@/pages/referrals";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Donate from "@/pages/donate";
import NotFound from "@/pages/not-found";
import Itinerary from "@/pages/itinerary";
import UploadCityPhoto from "@/pages/upload-city-photo";
import TravelBlog from "@/pages/travel-blog";
import TravelAgentDashboard from "@/pages/travel-agent-dashboard";
import TravelAgentSignup from "@/pages/travel-agent-signup";
import TravelAgentPage from "@/pages/travel-agent-page";
import WelcomeTravelAgent from "@/pages/welcome-travel-agent";
import QuickLogin from "@/pages/quick-login";
import MatchInCity from "@/pages/match-in-city";
import ActivitySearch from "@/pages/activity-search";

import Navbar from "@/components/navbar";
// Removed conflicting MobileNav - using MobileTopNav and MobileBottomNav instead
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MobileTopNav } from "@/components/MobileTopNav";
import Footer from "@/components/footer";
import { UniversalBackButton } from "@/components/UniversalBackButton";
import IMAlert from "@/components/instant-messaging/IMAlert";
import OnlineBuddyList from "@/components/instant-messaging/OnlineBuddyList";
import { FloatingChatManager } from "@/components/instant-messaging/FloatingChatManager";
import IMNotificationManager from "@/components/instant-messaging/IMNotification";
import type { User } from "@shared/schema";
import { authStorage } from "@/lib/auth";
import websocketService from "@/services/websocketService";

// Simple auth context
export const AuthContext = React.createContext<{
  user: User | null;
  setUser: (user: User | null) => void;
  login: (userData: User, token?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}>({
  user: null,
  setUser: () => {},
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function Router() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const landingPageRoutes = [
    '/', '/landing', '/landing-new', '/auth', '/join', '/signup', '/signup/local', '/signup/traveler', '/signup/business',
    '/events-landing', '/business-landing', '/locals-landing', '/travelers-landing', '/privacy', '/terms', '/cookies', '/about', '/getting-started',
    '/forgot-password', '/reset-password', '/welcome', '/welcome-business', '/welcome-travel-agent', '/quick-login', '/preview-landing', '/preview-first-landing',
    '/travel-quiz', '/TravelIntentQuiz', '/signup/travel-agent'
  ];
  const isLandingPage = landingPageRoutes.includes(location);

  useEffect(() => {
    console.log('Starting authentication check');

    // Try multiple localStorage keys to find user data
    const possibleKeys = ['user', 'travelconnect_user', 'currentUser', 'authUser'];
    let foundUser = null;

    for (const key of possibleKeys) {
      try {
        const stored = localStorage.getItem(key);
        if (stored && stored !== 'undefined' && stored !== 'null') {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id && parsed.username) {
            console.log(`🎯 FOUND USER DATA in ${key}:`, parsed.username, 'ID:', parsed.id);
            foundUser = parsed;

            // Standardize to 'user' key
            if (key !== 'user') {
              localStorage.setItem('user', JSON.stringify(parsed));
              localStorage.removeItem(key);
            }
            break;
          }
        }
      } catch (error) {
        console.error(`Error parsing ${key}:`, error);
        localStorage.removeItem(key);
      }
    }

    if (foundUser) {
      setUser(foundUser);
      console.log('✅ USER SET SUCCESSFULLY:', foundUser.username, 'ID:', foundUser.id);
    } else {
      console.log('❌ NO USER DATA FOUND - STAYING LOGGED OUT');
      setUser(null);
    }

    // Always set loading to false after 100ms to prevent infinite loading
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  }, []);

  // Initialize WebSocket connection for authenticated users
  useEffect(() => {
    if (user && user.id && user.username) {
      console.log('🔌 Initializing WebSocket connection for user:', user.username);

      // Request notification permission (static method)
      (websocketService.constructor as any).requestNotificationPermission().then((granted: boolean) => {
        console.log('🔔 Notification permission:', granted ? 'granted' : 'denied');
      }).catch((error: any) => {
        console.warn('Notification permission request failed:', error);
      });

      // Connect to WebSocket
      websocketService.connect(user.id, user.username)
        .then(() => {
          console.log('🟢 WebSocket connected successfully');
        })
        .catch(error => {
          console.error('🔴 WebSocket connection failed:', error);
        });

      // Cleanup on unmount or logout
      return () => {
        websocketService.disconnect();
      };
    }
    // Return undefined for empty else case
    return undefined;
  }, [user]);

  // Scroll to top when location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const authValue = React.useMemo(() => {
    // Robust authentication check that accounts for timing issues
    const hasUserInState = !!user;
    const hasUserInStorage = !!localStorage.getItem('user');
    const hasAuthToken = !!localStorage.getItem('auth_token'); // Also check for token
    const actualAuth = hasUserInState || hasUserInStorage || hasAuthToken;

    console.log('🔍 AUTH CHECK: user in state:', hasUserInState, 'user in storage:', hasUserInStorage, 'has auth token:', hasAuthToken, 'final auth:', actualAuth);

    return {
      user: user,
      setUser: (newUser: User | null) => {
        console.log('AuthContext setUser called with:', newUser?.username || 'null');
        authStorage.setUser(newUser);
        setUser(newUser);
      },
      logout: () => {
        console.log('🚪 AuthContext logout called - starting logout process');
        console.log('Current user before logout:', user?.username);

        try {
          // Clear all authentication data
          authStorage.clearUser();
          console.log('✅ Cleared authStorage');

          // Clear specific auth keys
          localStorage.removeItem('auth_token');
          localStorage.removeItem('travelconnect_user');
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('user_logged_out');
          console.log('✅ Cleared localStorage keys');

          // Clear session storage
          sessionStorage.clear();
          console.log('✅ Cleared sessionStorage');

          // Clear React Query cache
          queryClient.clear();
          console.log('✅ Cleared React Query cache');

          // Update state
          setUser(null);
          console.log('✅ Set user to null');

          console.log('🔄 Redirecting to landing page');

          // Force immediate redirect to landing page
          window.location.href = '/';

        } catch (error) {
          console.error('❌ Error during logout:', error);
          // Fallback - force redirect anyway
          window.location.href = '/';
        }
      },
      login: (userData: User, token?: string) => {
        console.log('AuthContext login called with:', userData?.username || 'null');
        authStorage.setUser(userData);
        if (token) {
          localStorage.setItem('auth_token', token);
        }
        setUser(userData);
      },
      isAuthenticated: actualAuth,
    };
  }, [user, setLocation, queryClient]);

  if (isLoading) {
    // If we have user data in storage, don't show loading screen
    const hasStoredUser = localStorage.getItem('user') || localStorage.getItem('travelconnect_user');
    if (hasStoredUser) {
      try {
        const parsedUser = JSON.parse(hasStoredUser);
        if (parsedUser && parsedUser.id) {
          console.log('🚀 Loading with user data - showing app immediately');
          return (
            <AuthContext.Provider value={{
              user: parsedUser,
              setUser: setUser,
              logout: () => { localStorage.clear(); window.location.href = '/'; },
              login: (userData: User, token?: string) => { setUser(userData); },
              isAuthenticated: true
            }}>
              <div className="min-h-screen w-full max-w-full flex flex-col bg-background text-foreground overflow-x-hidden">
                <div className="md:hidden">
                  <MobileTopNav />
                </div>
                <main className="flex-1 w-full max-w-full pt-16 pb-24 md:pt-0 md:pb-0 overflow-x-hidden">
                  <Home />
                </main>
                <div className="md:hidden">
                  <MobileBottomNav />
                </div>
              </div>
            </AuthContext.Provider>
          );
        }
      } catch (error) {
        console.error('Error parsing stored user during loading:', error);
      }
    }
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">Loading Nearby Traveler...</div>
      </div>
    );
  }

  const renderPage = () => {
    console.log('🔍 ROUTING DEBUG - isAuthenticated:', authValue.isAuthenticated, 'location:', location, 'user:', user);
    console.log('🔍 Current window.location.pathname:', window.location.pathname);

    // IMPROVED AUTHENTICATION CHECK: Multiple fallbacks to ensure authenticated users stay authenticated
    const hasUserInLocalStorage = !!localStorage.getItem('user');
    const hasAuthToken = !!localStorage.getItem('auth_token');
    const hasUserInState = !!user;
    const hasTravelConnectUser = !!localStorage.getItem('travelconnect_user');

    // More comprehensive authentication check
    const isActuallyAuthenticated = authValue.isAuthenticated || hasUserInState || hasUserInLocalStorage || hasAuthToken || hasTravelConnectUser;

    // Quick user state recovery
    if (!hasUserInState && hasUserInLocalStorage && !user && !isLoading) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.id) {
            console.log('🔄 Quick recovery: Setting user from storage');
            setUser(parsedUser);
          }
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }

    console.log('🔍 COMPREHENSIVE AUTH CHECK:', {
      'authValue.isAuthenticated': authValue.isAuthenticated,
      'hasUserInState': hasUserInState,
      'hasUserInLocalStorage': hasUserInLocalStorage,
      'hasAuthToken': hasAuthToken,
      'hasTravelConnectUser': hasTravelConnectUser,
      'final_isActuallyAuthenticated': isActuallyAuthenticated
    });

    // Simplified user state fix - only run once
    if (!hasUserInState && (hasUserInLocalStorage || hasTravelConnectUser) && !user && !isLoading) {
      console.log('🔄 FIXING USER STATE: User has auth data but no state, setting from storage');
      try {
        const storedUser = localStorage.getItem('user') || localStorage.getItem('travelconnect_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.id) {
            console.log('🔧 Setting user from storage:', parsedUser.username);
            setUser(parsedUser);
            return <Home />; // Directly return Home to break the loop
          }
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }

    if (!isActuallyAuthenticated) {
      console.log('User not authenticated, showing landing page for:', location);

      // Allow access to events landing page without authentication for marketing
      if (location === '/events-landing') {
        return <EventsLanding />;
      }

      // Only redirect unauthenticated users from /events to /events-landing
      // Double-check authentication before redirecting
      if (location === '/events') {
        // Extra check: if there's any sign of authentication, show the real events page
        if (localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || localStorage.getItem('auth_token') || user) {
          console.log('🎉 MOBILE FIX: User has auth data, showing real Events page instead of landing');
          return <Events />;
        }
        console.log('🚫 Truly unauthenticated user accessing /events - showing landing');
        return <EventsLanding />;
      }

      // Allow access to business landing page without authentication for marketing
      if (location === '/business' || location === '/business-landing') {
        return <BusinessLanding />;
      }

      // Allow access to event details without authentication for viral sharing
      if (location.startsWith('/events/') && location.split('/')[2]) {
        const eventId = location.split('/')[2];
        return <EventDetails eventId={eventId} />;
      }

      // Redirect unauthenticated users trying to access welcome pages
      if (location === '/welcome' || location === '/welcome-business') {
        console.log('🚫 SECURITY: Unauthenticated user trying to access welcome page - redirecting to auth');
        window.location.href = '/auth';
        return null;
      }



      // Allow access to auth and join pages without authentication
      if (location === '/auth') {
        console.log('Showing Auth page for unauthenticated user');
        return <Auth />;
      }

      if (location === '/join') {
        console.log('Showing Auth page (join mode) for unauthenticated user');
        return <Auth />; // Auth component handles both login and signup
      }

      // Show landing page
      if (location === '/landing-new') {
        return <LandingNew />;
      }

      // Allow access to business landing page without authentication
      if (location === '/business-landing') {
        console.log('Showing BusinessLanding for unauthenticated user');
        return <BusinessLanding />;
      }

      // Allow access to events landing page without authentication
      if (location === '/events-landing') {
        console.log('Showing EventsLanding for unauthenticated user');
        return <EventsLanding />;
      }

      // Allow access to locals landing page without authentication
      if (location === '/locals-landing') {
        console.log('Showing LocalsLanding for unauthenticated user');
        return <LocalsLanding />;
      }

      // Allow access to travelers landing page without authentication
      if (location === '/travelers-landing') {
        console.log('Showing TravelersLanding for unauthenticated user');
        return <TravelersLanding />;
      }

      // Travel Intent Quiz - accessible without authentication
      if (location === '/travel-quiz' || location === '/TravelIntentQuiz') {
        console.log('Showing TravelIntentQuiz for onboarding');
        return <TravelIntentQuiz />;
      }

      // Show landing page for /landing route too
      if (location === '/landing') {
        return <LandingNew />;
      }

      // CRITICAL FIX: Allow profile routes even when user state is loading
      if (location.startsWith('/profile/')) {
        const userId = parseInt(location.split('/')[2]);
        console.log('🔍 UNAUTHENTICATED PROFILE ACCESS: Allowing profile access for userId:', userId);
        return <Profile userId={userId} />;
      }

      // Show appropriate page for root path based on authentication
      if (location === '/') {
        // If user has any authentication data, show the home page instead of landing
        if (localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || localStorage.getItem('auth_token') || user) {
          console.log('🏠 MOBILE FIX: User has auth data, showing Home page instead of landing');
          return <Home />;
        }
        return <LandingNew />;
      }
      // Allow access to signup pages without authentication
      // Three separate signup forms: Local, Traveling, Business
      if (location === '/signup/local' || location === '/signup/traveler') {
        console.log('Showing SignupLocalTraveler for:', location);
        return <SignupLocalTraveler />;
      }
      if (location === '/signup/traveling') {
        console.log('Showing SignupTraveling for:', location);
        return <SignupTraveling />;
      }
      if (location === '/signup/business') {
        console.log('Showing SignupBusiness for:', location);
        return <SignupBusiness />;
      }
      // Allow access to legal pages without authentication
      if (location === '/privacy') {
        return <Privacy />;
      }
      if (location === '/terms') {
        return <Terms />;
      }
      if (location === '/cookies') {
        return <Cookies />;
      }
      if (location === '/about') {
        return <About />;
      }
      if (location === '/getting-started') {
        return <GettingStarted />;
      }
      if (location === '/forgot-password') {
        return <ForgotPassword />;
      }
      if (location.startsWith('/reset-password')) {
        return <ResetPassword />;
      }
      if (location === '/auth') {
        console.log('Returning Auth component for /auth');
        return <Auth />;
      }
      if (location === '/signup' || location === '/join') {
        console.log('Returning Auth component for /signup or /join');
        return <Auth />; // Will show JoinNowWidget when isLogin=false
      }

      // Enhanced routing for potentially authenticated users accessing main routes
      // Check for common app routes that authenticated users might be trying to access
      const commonAppRoutes = ['/discover', '/match-in-city', '/quick-meetups', '/messages', '/profile', '/cities', '/plan-trip', '/home', '/events', '/deals'];
      const isCommonAppRoute = commonAppRoutes.some(route => location.startsWith(route));

      if (isCommonAppRoute && (localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || localStorage.getItem('auth_token'))) {
        console.log('🔧 MOBILE FIX: User has auth data, but was going to be shown landing, routing to authenticated section');
        // Force re-evaluation as authenticated user by bypassing this unauthenticated section
        const authUser = user || JSON.parse(localStorage.getItem('travelconnect_user') || localStorage.getItem('user') || '{}');
        if (authUser && (authUser.id || authUser.username)) {
          // Temporarily set user if it's missing from state but exists in storage
          if (!user && authUser) {
            console.log('🔄 Temporarily setting user from localStorage for routing');
            setUser(authUser);
          }
          // Skip the rest of unauthenticated routing and let it fall through to authenticated section
          return null; // This will trigger a re-render with proper authentication state
        }
      }

      // FINAL CHECK: Before showing landing, double-check if user is actually authenticated
      if (localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || localStorage.getItem('auth_token')) {
        console.log('🔄 FINAL AUTH CHECK: User has auth data, redirecting to home instead of landing');
        window.location.href = '/home';
        return null;
      }

      // MOBILE FIX: If user has authentication data, show home page instead of landing
      if (localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || localStorage.getItem('auth_token')) {
        console.log('🔄 MOBILE FIX: User has auth data, redirecting to home instead of showing unknown route message');
        window.location.href = '/home';
        return null;
      }

      // MOBILE ROUTE FALLBACK: Check if this should go to authenticated section
      if (hasUserInLocalStorage || hasTravelConnectUser || hasAuthToken) {
        console.log('🔄 MOBILE: User has auth data, redirecting to home');
        setLocation('/');
        return null;
      }

      // Default: show new landing page for unknown routes
      console.log('❌ Unknown route, showing new landing page:', location);
      return <LandingNew />;
    }

    console.log('✅ USER AUTHENTICATED - routing to:', location, 'user:', user?.username || 'unknown user');

    // Welcome pages - only for authenticated users
    if (location === '/welcome') {
      return <Welcome />;
    }

    if (location === '/welcome-business') {
      return <WelcomeBusiness />;
    }

    if (location.startsWith('/profile/')) {
      const userId = parseInt(location.split('/')[2]);
      return <Profile userId={userId} />;
    }

    if (location.startsWith('/quick-meetups/') && location.includes('/manage')) {
      return <MeetupManagePage />;
    }

    if (location.startsWith('/quick-meetup-chat/')) {
      const meetupId = location.split('/')[2];
      return <QuickMeetupChat />;
    }




    if (location.startsWith('/manage-event/')) {
      const eventId = location.split('/')[2];
      return <ManageEvent eventId={eventId} />;
    }

    if (location.startsWith('/events/') && location.includes('/manage')) {
      const eventId = location.split('/')[2];
      return <ManageEvent eventId={eventId} />;
    }

    if (location.startsWith('/external-events/')) {
      const eventId = location.split('/')[2];
      return <ExternalEventDetails />;
    }

    if (location.startsWith('/events/')) {
      const eventId = location.split('/')[2];
      return <EventDetails eventId={eventId} />;
    }

    if (location.startsWith('/event-details/')) {
      const eventId = location.split('/')[2];
      return <EventDetails eventId={eventId} />;
    }

    if (location.startsWith('/city-chatrooms/')) {
      const pathParts = location.split('/');
      const cityName = pathParts[2] ? decodeURIComponent(pathParts[2]) : '';
      if (!cityName || cityName.trim() === '') {
        return <NotFound />;
      }
      return <CityChatrooms cityFilter={cityName} />;
    }

    if (location.startsWith('/city/')) {
      const pathParts = location.split('/');
      const cityName = pathParts[2] ? decodeURIComponent(pathParts[2]) : '';
      if (!cityName || cityName.trim() === '') {
        return <NotFound />;
      }
      return <CityPage cityName={cityName} />;
    }

    if (location.startsWith('/itinerary/')) {
      const travelPlanId = location.split('/')[2];
      return <Itinerary travelPlanId={travelPlanId} />;
    }

    if (location.startsWith('/deals/')) {
      const dealId = location.split('/')[2];
      return <BusinessOffers dealId={dealId} />;
    }

    if (location.startsWith('/business/') && location.includes('/offers')) {
      const businessId = location.split('/')[2];
      return <BusinessOffers businessId={businessId} />;
    }

    if (location.startsWith('/business/')) {
      const businessId = location.split('/')[2];
      return <Profile userId={parseInt(businessId)} />;
    }

    switch (location) {
      case '/auth':
        return <Auth />;
      case '/events':
        return <Events />;
      case '/events-landing':
        return <EventsLanding />;
      case '/business-landing':
        return <BusinessLanding />;
      case '/signup/local':
        return <SignupLocalTraveler />;
      case '/signup/traveler':
        return <SignupLocalTraveler />;
      case '/join':
        return <SignupLocalTraveler />;
      case '/signup':
        return <SignupLocalTraveler />;
      case '/signup/business':
        return <SignupBusiness />;
      case '/business-registration':
        return <BusinessRegistration />;
      case '/profile':
        console.log('🔍 PROFILE ROUTE: user in context:', user?.id, 'user object:', !!user);

        // Get user from context or auth storage
        let profileUserId = user?.id;

        if (!profileUserId) {
          console.log('🔍 PROFILE ROUTE: No user in context, checking auth storage');
          const storageUser = authStorage.getUser();
          if (storageUser?.id) {
            console.log('🔍 PROFILE ROUTE: Found user in auth storage:', storageUser.id);
            profileUserId = storageUser.id;
          } else {
            console.log('🔍 PROFILE ROUTE: No user found anywhere, redirecting to auth');
            setLocation('/auth');
            return null;
          }
        }

        return <Profile userId={profileUserId} />;
      case '/messages':
        return <Messages />;
      case '/meetups':
        return <Meetups />;
      case '/quick-meetups':
        return <QuickMeetupsPage />;
      case '/create':
        return <Create />;
      case '/create-event':
        return <CreateEvent />;
      case '/events/:id':
        const eventId = location.split('/')[2];
        return <EventDetails eventId={eventId} />;
      case '/discover':
        return <Discover />;
      case '/cities':
        return <Discover />;
      case '/match-in-city':
        return <MatchInCity />;
      case '/activity-search':
        return <ActivitySearch />;
      case '/connect':
        return <Connect />;
      case '/matches':
        // Redirect to connect page since matches functionality is there
        setLocation('/connect');
        return null;
      case '/requests':
        return <Requests />;
      case '/passport':
        return <Passport userId={user?.id || 0} />;
      case '/photos':
        return <Photos />;
      case '/upload-photos':
        return <UploadPhotos />;
      case '/ai-companion':
        return <AICompanion />;
      case '/travel-memories':
        return <TravelMemories />;
      case '/hidden-gems':
        return <HiddenGems />;
      case '/plan-trip':
        return <PlanTrip />;
      case '/travel-quiz':
      case '/TravelIntentQuiz':
        return <TravelIntentQuiz />;
      case '/city-chatrooms':
        return <CityChatrooms />;
      case '/chatrooms':
        return <CityChatrooms />;

      case '/business-offers':
        return <BusinessOffers />;
      case '/deals':
        return <Deals />;
      case '/business-dashboard':
        return <BusinessDashboard />;
      case '/business-profile':
        return <BusinessProfile />;
      case '/admin-dashboard':
        return <AdminDashboard />;
      case '/admin/referrals':
        return <AdminReferrals />;
      case '/referrals':
        return <ReferralsPage />;
      case '/test-city-page':
        return <CityPage />;
      case '/users':
        return <UsersPage />;
      case '/upload-city-photo':
        return <UploadCityPhoto />;
      case '/settings':
        return <Settings />;
      case '/admin-settings':
        return <AdminSettings user={user} />;
      case '/travel-blog':
        return <TravelBlog />;
      case '/travel-agent-dashboard':
        return <TravelAgentDashboard />;
      case '/signup/travel-agent':
        return <TravelAgentSignup />;
      case '/agent/:username':
        return <TravelAgentPage />;
      case '/welcome':
        return <Welcome />;
      case '/welcome-business':
        return <WelcomeBusiness />;
      case '/welcome-travel-agent':
        return <WelcomeTravelAgent />;
      case '/getting-started':
        return <GettingStarted />;
      case '/quick-login':
        return <QuickLogin />;

      case '/preview-landing':
        return <LandingNew />;
      case '/preview-first-landing':
        return <LandingNew />;

      case '/donate':
        return <Donate />;
      case '/':
      case '/home':
        console.log('🏠 MOBILE: Rendering Home page for authenticated user');
        return <Home />;
      default:
        // Handle dynamic routes first before showing NotFound
        if (location.startsWith('/profile/')) {
          const userId = parseInt(location.split('/')[2]);
          return <Profile userId={userId} />;
        }
        if (location.startsWith('/events/')) {
          const eventId = location.split('/')[2];
          return <EventDetails eventId={eventId} />;
        }
        if (location.startsWith('/city/')) {
          const pathParts = location.split('/');
          const cityName = pathParts[2] ? decodeURIComponent(pathParts[2]) : '';
          if (cityName && cityName.trim() !== '') {
            return <CityPage cityName={cityName} />;
          }
        }

        // MOBILE FIX: If unknown route but user is authenticated, redirect to home
        console.log('🚫 UNKNOWN ROUTE FOR AUTHENTICATED USER:', location);
        console.log('🔄 MOBILE: Redirecting unknown authenticated route to home');
        setLocation('/');
        return null;

    }
  };

  return (
    <AuthContext.Provider value={authValue}>
      {!authValue.isAuthenticated ? (
        // MOBILE FIX: Check if this is a navigation to home page from mobile nav
        location === '/home' && (localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || localStorage.getItem('auth_token')) ? (
          // User clicked home button and has auth data - force authenticate
          <>
            {console.log('🏠 MOBILE HOME FIX: User clicked home with auth data, forcing authentication')}
            {(() => {
              // Temporarily set user from localStorage to render home page
              const storedUser = localStorage.getItem('user') || localStorage.getItem('travelconnect_user');
              if (storedUser && !user) {
                try {
                  const parsedUser = JSON.parse(storedUser);
                  if (parsedUser && parsedUser.id) {
                    setUser(parsedUser);
                  }
                } catch (e) {
                  console.error('Error parsing stored user:', e);
                }
              }
              return <Home />;
            })()}
          </>
        ) : (
          // Show appropriate page based on routing for unauthenticated users
          <>
            {console.log('🔍 APP ROUTING: User NOT authenticated, showing unauthenticated page for location:', location)}
            {renderPage()}
          </>
        )
      ) : (
        // Show full app with navbar when authenticated
        <>
          {console.log('🔍 APP ROUTING: User IS authenticated, showing authenticated app for location:', location)}
          <div className="min-h-screen w-full max-w-full flex flex-col bg-background text-foreground overflow-x-hidden">
            {/* Navigation - show appropriate nav based on auth and screen size */}
            {user ? (
              <>
                {/* Desktop Navigation */}
                <div className="hidden md:block">
                  <Navbar />
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden">
                  <MobileTopNav />
                </div>
              </>
            ) : (
              // This part is technically unreachable if !authValue.isAuthenticated is false,
              // but keeping it for structural completeness if logic were to change.
              // A dedicated LandingNavbar component would be used here if needed.
              null
            )}

            <main className="flex-1 w-full max-w-full pt-16 pb-24 md:pt-0 md:pb-0 overflow-x-hidden">
              <div className="w-full max-w-full overflow-x-hidden">
                {renderPage()}
              </div>
            </main>

            {/* Desktop Footer */}
            <div className="hidden md:block">
              <Footer />
            </div>

            {/* Mobile Bottom Navigation - only show on mobile for authenticated users */}
            {user && (
              <div className="md:hidden">
                <MobileBottomNav />
              </div>
            )}

            {/* Instant Messaging Components */}
            <IMAlert />
            <OnlineBuddyList />
            {/* Floating Chat Popup System */}
            <FloatingChatManager />
            {/* IM Notifications */}
            <IMNotificationManager />
          </div>
        </>
      )}
    </AuthContext.Provider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="nearby-traveler-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
          {/* Global Floating Chat Manager */}
          <FloatingChatManager />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;