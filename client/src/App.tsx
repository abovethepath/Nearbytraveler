import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { initGA } from "@/lib/analytics";
import { useAnalytics } from "@/hooks/use-analytics";

import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import GlobalHotfixes from "@/GlobalHotfixes";
import { METRO_AREAS } from "@shared/constants";
import Home from "@/pages/home";
import Discover from "@/pages/discover";
import ProfileComplete from "@/pages/profile-complete";
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
// import NetworkingLanding from "@/pages/networking-landing"; // HIDDEN: Networking functionality temporarily disabled
import CouchsurfingLanding from "@/pages/couchsurfing-landing";
import BusinessCustomLanding from "@/pages/business-custom-landing";
import Connect from "@/pages/connect";
import Requests from "@/pages/requests";

import Passport from "@/pages/passport";

import Auth from "@/pages/auth";
import JoinNowWidgetNew from "@/components/join-now-widget-new";
import Logo from "@/components/logo";

// Join page component with sign in option
function JoinPageWithSignIn() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 relative">
      {/* Back Button */}
      <button
        onClick={() => setLocation('/')}
        className="absolute top-4 left-4 p-2 rounded-full bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-700/50 hover:bg-white/20 dark:hover:bg-gray-700/50 transition-all group"
        data-testid="button-back"
      >
        <svg 
          className="w-6 h-6 text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo variant="header" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Join Nearby Traveler
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Start Connecting with Nearby Locals and Nearby Travelers Today Based on Common Interests and Demographics
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <JoinNowWidgetNew />
        </div>
        <div className="text-center mt-4">
          <p className="text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <button 
              onClick={() => setLocation('/signin')}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
import SignupLocal from "@/pages/signup-local";
import SignupTraveling from "@/pages/signup-traveling";
import SignupBusinessSimple from "@/pages/signup-business-simple";
import SignupSteps from "@/pages/signup-steps";
import SignupAccount from "@/pages/signup-account";
// OLD BROKEN UNIFIED SIGNUP DELETED FOREVER
import BusinessRegistration from "@/pages/business-registration";
import LandingNew from "@/pages/landing-new";
import LaunchingSoon from "@/pages/launching-soon";
import Photos from "@/pages/photos";
import UploadPhotos from "@/pages/upload-photos";
import AICompanion from "@/pages/ai-companion";
import TravelMemories from "@/pages/travel-memories";
import HiddenGems from "@/pages/hidden-gems";
import PlanTrip from "@/pages/plan-trip";
import TravelIntentQuiz from "@/pages/TravelIntentQuiz";
import CityChatrooms from "@/pages/city-chatrooms";
import Chatroom from "@/pages/chatroom";
import FixedChatroom from "@/pages/fixed-chatroom";

import BusinessOffers from "@/pages/business-offers";
import BusinessDashboard from "@/pages/business-dashboard";
import BusinessProfile from "@/pages/business-profile";
import Deals from "@/pages/deals";
import Settings from "@/pages/settings";
import PrivacySettingsPage from "@/pages/privacy-settings";
import { PitchPreview } from "@/pages/pitch-preview";
import AdminSettings from "@/pages/admin-settings";
import SMSTest from "@/pages/sms-test";
import Welcome from "@/pages/welcome";
import WelcomeBusiness from "@/pages/welcome-business";
import AccountSuccess from "@/pages/account-success";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Cookies from "@/pages/cookies";
import CommunityGuidelines from "@/pages/community-guidelines";
import ProfilePageResponsive from "@/pages/ProfilePageResponsive";
import EventsListResponsive from "@/pages/EventsListResponsive";
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
import TravelBlog from "@/pages/travel-blog";
import QuickLogin from "@/pages/quick-login";
import MatchInCity from "@/pages/match-in-city";
import QRSignup from "@/pages/qr-signup";
import ShareQR from "@/pages/share-qr";
import BusinessCardPage from "@/pages/business-card";
import QRCodePage from "@/pages/qr-code";
import QRSimplePage from "@/pages/qr-simple";
import LandingStreamlined from "@/pages/landing-new-streamlined";
import LandingMinimal from "@/pages/landing-minimal";
import ComingSoon from "@/pages/coming-soon";


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
import { getMetroArea } from "@shared/constants";
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
  
  // Track page views for analytics
  useAnalytics();
  
  // CRITICAL FIX: Check if this is a signup route to bypass auth logic
  const PUBLIC_SIGNUP_PATHS = [
    '/signup/account', 
    '/signup/local', 
    '/signup/traveling', 
    '/signup/business',
    '/signup/traveler'
  ];
  const isSignupRoute = PUBLIC_SIGNUP_PATHS.includes(location) || location.startsWith('/signup/');
  
  // CRITICAL FIX: Don't render anything for API routes
  if (location.startsWith('/api/')) {
    console.log('🔄 ROUTER: API route detected, not rendering React app:', location);
    return null;
  }

  const landingPageRoutes = [
    '/', '/landing', '/landing-new', '/auth', '/join', '/signup', '/signup/local', '/signup/traveler', '/signup/business', '/signup/account', '/signup/traveling', '/account-success',
    '/events-landing', '/business-landing', '/locals-landing', '/travelers-landing', /* '/networking-landing', */ '/couchsurfing', '/cs', '/b', '/privacy', '/terms', '/cookies', '/about', '/getting-started',
    '/forgot-password', '/reset-password', '/welcome', '/welcome-business', '/quick-login', '/preview-landing', '/preview-first-landing',
    '/travel-quiz', '/TravelIntentQuiz', '/business-card', '/qr-code'
  ];
  const isLandingPage = landingPageRoutes.includes(location);

  useEffect(() => {
    // Skip auth check for signup routes
    if (isSignupRoute) {
      console.log('🔥 SIGNUP ROUTE - skipping auth check:', location);
      setIsLoading(false);
      return;
    }
    console.log('🚀 PRODUCTION CACHE BUST v2025-08-17-17-28 - Starting authentication check');

    // Check server-side session first
    const checkServerAuth = async () => {
      try {
        console.log('🔍 Checking server-side authentication...');
        const response = await fetch('/api/auth/user', {
          credentials: 'include' // Include cookies/session
        });
        
        if (response.ok) {
          const serverUser = await response.json();
          console.log('✅ Server session found:', serverUser.username, 'ID:', serverUser.id);
          setUser(serverUser);
          // Also store in localStorage for consistency
          authStorage.setUser(serverUser);
          localStorage.setItem('user', JSON.stringify(serverUser));
          
          // Check if this is a new user who needs welcome
          if (serverUser && !localStorage.getItem('welcomed_' + serverUser.id)) {
            console.log('🎉 New user detected - showing welcome');
            localStorage.setItem('welcomed_' + serverUser.id, 'true');
          }
          
          setIsLoading(false);
          return;
        } else {
          console.log('❌ No server session found, checking localStorage...');
        }
      } catch (error) {
        console.log('❌ Server auth check failed:', error);
      }

      // Fallback to localStorage check
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

      // Always set loading to false after auth check - no delay needed
      setIsLoading(false);
    };

    checkServerAuth();
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
    const hasTravelConnectUser = !!localStorage.getItem('travelconnect_user');
    const hasAuthToken = !!localStorage.getItem('auth_token'); // Also check for token
    const actualAuth = hasUserInState || hasUserInStorage || hasTravelConnectUser || hasAuthToken;

    console.log('🔍 AUTH CHECK: user in state:', hasUserInState, 'user in storage:', hasUserInStorage, 'travelconnect user:', hasTravelConnectUser, 'has auth token:', hasAuthToken, 'final auth:', actualAuth);

    return {
      user: user,
      setUser: (newUser: User | null) => {
        console.log('AuthContext setUser called with:', newUser?.username || 'null');
        authStorage.setUser(newUser);
        setUser(newUser);
      },
      logout: async () => {
        console.log('🚪 AuthContext logout called - starting logout process');
        console.log('Current user before logout:', user?.username);

        try {
          // First call server logout to destroy session
          try {
            const response = await fetch('/api/logout', {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              console.log('✅ Server session destroyed');
            } else {
              console.warn('⚠️ Server logout failed, continuing with client cleanup');
            }
          } catch (serverError) {
            console.warn('⚠️ Server logout request failed:', serverError);
          }

          // Clear all authentication data
          authStorage.clearUser();
          console.log('✅ Cleared authStorage');

          // Clear ALL possible auth keys - expanded list
          localStorage.removeItem('auth_token');
          localStorage.removeItem('travelconnect_user');
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('user_logged_out');
          localStorage.removeItem('authUser');
          localStorage.removeItem('userData');
          localStorage.removeItem('userSession');
          // Clear any welcome flags
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('welcomed_')) {
              localStorage.removeItem(key);
            }
          });
          console.log('✅ Cleared all localStorage keys');

          // Clear session storage completely
          sessionStorage.clear();
          console.log('✅ Cleared sessionStorage');

          // Clear React Query cache
          queryClient.clear();
          console.log('✅ Cleared React Query cache');

          // Update state
          setUser(null);
          console.log('✅ Set user to null');

          console.log('🔄 Forcing complete refresh to clear all cached data');

          // Force complete page refresh to clear all cached authentication
          window.location.href = '/';
          window.location.reload();

        } catch (error) {
          console.error('❌ Error during logout:', error);
          // Fallback - force complete refresh anyway
          window.location.href = '/';
          window.location.reload();
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
            <main className="flex-1 w-full max-w-full pt-16 pb-24 md:pt-0 md:pb-20 overflow-x-hidden main-with-bottom-nav">
                  <Home />
                </main>
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999 }}>
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

    // Don't interfere with API routes - let browser handle them naturally
    if (location.startsWith('/api/')) {
      console.log('🔄 API ROUTE DETECTED - not interfering with browser navigation');
      return null;
    }

    // CRITICAL FIX: Handle all signup routes immediately to prevent auth conflicts
    const PUBLIC_SIGNUP_PATHS = [
      '/signup/account', 
      '/signup/local', 
      '/signup/traveling', 
      '/signup/business',
      '/signup/traveler'
    ];
    
    if (PUBLIC_SIGNUP_PATHS.includes(location) || location.startsWith('/signup/')) {
      console.log('🔥 SIGNUP ROUTE - bypassing all auth checks for:', location);
      
      if (location === '/signup/account') {
        console.log('✅ SIGNUP ACCOUNT - Direct access');
        return <SignupAccount />;
      }
      if (location === '/signup/local') {
        console.log('✅ SIGNUP LOCAL - Direct access');
        return <SignupLocal />;
      }
      if (location === '/signup/traveler') {
        console.log('✅ SIGNUP TRAVELER - Redirecting to traveling');
        setLocation('/signup/traveling');
        return null;
      }
      if (location === '/signup/traveling') {
        console.log('✅ SIGNUP TRAVELING - Direct access');
        return <SignupTraveling />;
      }
      if (location === '/signup/business') {
        console.log('✅ SIGNUP BUSINESS - Direct access');
        return <SignupBusinessSimple />;
      }
      if (location.startsWith('/signup/qr/')) {
        const qrData = location.split('/signup/qr/')[1];
        console.log('✅ SIGNUP QR - Direct access');
        return <QRSignup referralCode={qrData || ''} />;
      }
      
      // Default fallback for any other signup routes
      console.log('⚠️ Unknown signup route, redirecting to account signup');
      window.location.href = '/signup/account';
      return null;
    }

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
      console.log('🏠 STREAMLINED LANDING - User not authenticated, showing streamlined landing page for:', location);

      // CRITICAL: Handle password reset before other checks
      if (location.startsWith('/reset-password')) {
        console.log('🔐 RESET PASSWORD: Allowing access to reset password page');
        return <ResetPassword />;
      }
      
      // EMERGENCY: Handle reset password form with preserved token
      if (location === '/reset-password-form') {
        console.log('🔐 EMERGENCY: Loading reset password form with preserved token');
        return <ResetPassword />;
      }

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
        window.location.href = '/signin';
        return null;
      }




      // JOIN PAGE NOW HANDLED AT TOP OF FUNCTION - removed duplicate check

      // Show landing page
      // Landing page variants for investor comparison
      if (location === '/landing-1') {
        console.log('📄 Showing Landing 1 (Long Version) for investor comparison');
        return <LandingNew />;
      }
      
      if (location === '/landing-2') {
        console.log('📄 Showing Landing 2 (Optimized Version) for investor comparison');
        return <LandingStreamlined />;
      }

      if (location === '/landing-new') {
        return <LandingStreamlined />;
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

      // Allow access to networking landing page without authentication
      // HIDDEN: Networking functionality temporarily disabled
      // if (location === '/networking-landing') {
      //   console.log('Showing NetworkingLanding for unauthenticated user');
      //   return <NetworkingLanding />;
      // }

      // Allow access to couchsurfing landing page without authentication
      if (location === '/couchsurfing' || location === '/cs') {
        console.log('Showing CouchsurfingLanding for unauthenticated user');
        return <CouchsurfingLanding />;
      }

      // Travel Intent Quiz - accessible without authentication
      if (location === '/travel-quiz' || location === '/TravelIntentQuiz') {
        console.log('Showing TravelIntentQuiz for onboarding');
        return <TravelIntentQuiz />;
      }

      // Show landing page for /landing route too
      if (location === '/landing') {
        return <LandingStreamlined />;
      }

      // Show minimal landing page for comparison
      if (location === '/landing-minimal') {
        return <LandingMinimal />;
      }

      // CRITICAL FIX: Allow profile routes even when user state is loading
      if (location.startsWith('/profile/')) {
        const userId = parseInt(location.split('/')[2]);
        console.log('🔍 UNAUTHENTICATED PROFILE ACCESS: Allowing profile access for userId:', userId);
        return <ProfileComplete userId={userId} />;
      }

      // Show appropriate page for root path based on authentication
      if (location === '/') {
        // If user has any authentication data, show the home page instead of landing
        if (localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || localStorage.getItem('auth_token') || user) {
          console.log('🏠 MOBILE FIX: User has auth data, showing Home page instead of landing');
          return <Home />;
        }
        return <LandingStreamlined />;
      }
      // QR code signup route - handled by early return above
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
      if (location === '/community-guidelines') {
        return <CommunityGuidelines />;
      }
      if (location === '/profile-responsive') {
        return <ProfilePageResponsive />;
      }
      // OLD PROFILE ROUTES REMOVED
      if (location === '/events-responsive') {
        return <EventsListResponsive />;
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
      if (location === '/signup') {
        console.log('Showing Signup page');
        return <Auth />;
      }
      if (location === '/signin') {
        console.log('Showing Sign In page');
        return <Auth />;
      }
      if (location === '/launching-soon') {
        console.log('Showing Launching Soon page');
        return <LaunchingSoon />;
      }
      if (location === '/business-card') {
        console.log('Returning BusinessCard component for /business-card - PUBLIC ACCESS');
        return <BusinessCardPage />;
      }

      // Enhanced routing for potentially authenticated users accessing main routes
      // Check for common app routes that authenticated users might be trying to access
      const commonAppRoutes = ['/discover', '/match-in-city', '/quick-meetups', '/messages', '/profile', '/profile-new', '/profile-complete', '/cities', '/plan-trip', '/home', '/events', '/deals', '/simple-chatroom', '/city-chatrooms', '/chatroom'];
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


      // CRITICAL: Root path should always show landing page for unauthenticated users
      if (location === '/' || location === '') {
        console.log('🏠 STREAMLINED LANDING v20250128-2024 - Root path for unauthenticated user - showing new streamlined version');
        return <LandingStreamlined />;
      }
      
      // Test route for new streamlined landing
      if (location === '/landing-streamlined') {
        console.log('🎯 TESTING - Streamlined landing page');
        return <LandingStreamlined />;
      }
      
      // SIGNUP ROUTES - All handled by early return at top of function
      if (location === '/account-success') {
        console.log('✅ ACCOUNT SUCCESS - Showing account creation progress');
        return <AccountSuccess />;
      }
      if (location === '/join') {
        console.log('✅ JOIN PAGE - Unauthenticated access allowed');
        return <JoinPageWithSignIn />;
      }

      // QR Code page - PUBLIC ACCESS for printing business cards
      if (location === '/qr-code') {
        console.log('🎯 QR CODE PAGE ACCESS - Cache Bust v4 - Showing SIMPLE QR generator');
        return <QRSimplePage />;
      }

      // Check if this is a valid landing page route (including our public pages)
      if (landingPageRoutes.includes(location)) {
        // This handles all the routes we explicitly want to be public
        console.log('✅ PUBLIC PAGE ACCESS - Valid landing page route:', location);
        // Let it continue to the specific route handlers below (they're already in the landing page section)
      } else {
        // Force unknown routes to landing page for unauthenticated users
        console.log('❌ STREAMLINED FALLBACK - Unknown route for unauthenticated user, showing streamlined landing page:', location);
        return <LandingStreamlined />;
      }
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
      return <ProfileComplete userId={userId} />;
    }

    if (location.startsWith('/quick-meetups/') && location.includes('/manage')) {
      return <MeetupManagePage />;
    }

    if (location.startsWith('/quick-meetup-chat/')) {
      const quickMeetId = location.split('/')[2];
      return <QuickMeetupChat />;
    }

    if (location.startsWith('/event-chat/')) {
      const eventId = location.split('/')[2];
      return <EventChat />;
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

    if (location.startsWith('/chatroom/')) {
      const chatroomId = location.split('/')[2];
      return <FixedChatroom />;
    }

    if (location.startsWith('/simple-chatroom/')) {
      console.log('🚀 ROUTING: Simple chatroom route matched');
      return <FixedChatroom />;
    }

    if (location.startsWith('/city-chatrooms/')) {
      const pathParts = location.split('/');
      const cityName = pathParts[2] ? decodeURIComponent(pathParts[2]) : '';
      if (!cityName || cityName.trim() === '') {
        return <NotFound />;
      }
      return <CityChatrooms />;
    }

    if (location.startsWith('/city/')) {
      const pathParts = location.split('/');
      const cityName = pathParts[2] ? decodeURIComponent(pathParts[2]) : '';
      const subPath = pathParts[3]; // e.g., "match", "chatrooms"
      
      if (!cityName || cityName.trim() === '') {
        return <NotFound />;
      }
      
      // METROPOLITAN AREA CONSOLIDATION - Use the proper shared constants
      // Use the complete LA metro cities list to ensure consistency
      const LA_METRO_CITIES = METRO_AREAS['Los Angeles'].cities;
      
      // Check if this is a LA metro city that should be consolidated
      const isLAMetroCity = LA_METRO_CITIES.some(metroCity => 
        cityName.toLowerCase() === metroCity.toLowerCase() ||
        cityName.toLowerCase().includes(metroCity.toLowerCase())
      );
      
      if (isLAMetroCity) {
        const newPath = subPath ? `/city/Los Angeles Metro/${subPath}` : '/city/Los Angeles Metro';
        console.log(`🌍 METRO CONSOLIDATION: ${cityName} → Los Angeles Metro (preventing separate suburb pages)`);
        setLocation(newPath);
        return null;
      }
      
      // Handle city sub-pages
      if (subPath === 'match') {
        return <MatchInCity cityName={cityName} />;
      } else if (subPath === 'chatrooms') {
        return <CityChatrooms />;
      } else {
        return <CityPage cityName={cityName} />;
      }
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
      return <ProfileComplete userId={parseInt(businessId)} />;
    }

    // ✅ CRITICAL FIX: Handle dynamic routes BEFORE the switch statement
    // This ensures /profile/:id is processed before /profile
    if (location.startsWith('/profile/')) {
      const userId = parseInt(location.split('/')[2]);
      console.log('🔍 AUTHENTICATED PROFILE ROUTE WITH ID: userId:', userId, 'location:', location);
      return <ProfileComplete userId={userId} />;
    }

    switch (location) {
      case '/events':
        return <Events />;
      case '/events-landing':
        return <EventsLanding />;
      case '/business-landing':
        return <BusinessLanding />;
      case '/cs':
        return <CouchsurfingLanding />;
      case '/b':
        return <BusinessCustomLanding />;
      case '/signup':
        return <ComingSoon />;
      case '/business-registration':
        return <BusinessRegistration />;
      case '/profile':
        // USING COMPLETE PROFILE - Has ThingsIWantToDoSection, no cover photo, no travel personality
        return <ProfileComplete />;
      // OLD PROFILE ROUTES REMOVED - ONLY ProfileComplete EXISTS
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
      case '/share-qr':
        return <ShareQR />;

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
      case '/settings':
        return <Settings />;
      case '/privacy-settings':
        return <PrivacySettingsPage />;
      case '/pitch-preview':
        return <PitchPreview />;
      case '/admin-settings':
        return <AdminSettings user={user} />;
      case '/sms-test':
        return <SMSTest />;
      case '/travel-blog':
        return <TravelBlog />;
      case '/welcome':
        return <Welcome />;
      case '/welcome-business':
        return <WelcomeBusiness />;
      case '/getting-started':
        return <GettingStarted />;
      case '/quick-login':
        return <QuickLogin />;

      case '/business-card':
        return <BusinessCardPage />;

      case '/preview-landing':
        return <LandingStreamlined />;
      case '/preview-first-landing':
        return <LandingStreamlined />;

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
          return <ProfileComplete userId={userId} />;
        }
        if (location.startsWith('/events/')) {
          const eventId = location.split('/')[2];
          return <EventDetails eventId={eventId} />;
        }
        if (location.startsWith('/city/')) {
          const pathParts = location.split('/');
          const cityName = pathParts[2] ? decodeURIComponent(pathParts[2]) : '';
          const subPath = pathParts[3]; // e.g., "match", "chatrooms"
          
          if (cityName && cityName.trim() !== '') {
            // Handle city sub-pages
            if (subPath === 'match') {
              return <MatchInCity cityName={cityName} />;
            } else if (subPath === 'chatrooms') {
              return <CityChatrooms />;
            } else {
              return <CityPage cityName={cityName} />;
            }
          }
        }

        // Add this check before the business user redirect:
        if (location === '/quick-meetups' || location.startsWith('/quick-meetup')) {
          // These are valid routes, don't redirect them
          return null;
        }

        // BUSINESS USER FIX: Only redirect business users to profile for specific routes
        // NOT for root path - root should always go to home for everyone
        if (user?.userType === 'business' && location !== '/') {
          console.log('🏢 BUSINESS USER: Unknown route detected (not root), redirecting to home page');
          setLocation('/');
          return null;
        }
        
        // MOBILE FIX: If unknown route but user is authenticated, redirect to home
        console.log('🚫 UNKNOWN ROUTE FOR AUTHENTICATED USER:', location);
        console.log('🔄 MOBILE: Redirecting unknown authenticated route to home');
        setLocation('/');
        return null;

    }
  };

  // Don't render React app for API routes - let browser handle them
  if (location.startsWith('/api/')) {
    console.log('🔄 API ROUTE DETECTED - letting browser handle:', location);
    return null;
  }


  // NAVIGATION RELIABILITY FIX: Check ALL authentication sources immediately
  const hasAnyAuthEvidence = 
    authValue.isAuthenticated || 
    !!user || 
    !!localStorage.getItem('user') || 
    !!localStorage.getItem('travelconnect_user') || 
    !!localStorage.getItem('auth_token');

  return (
    <AuthContext.Provider value={authValue}>
      {/* CRITICAL FIX: Handle signup routes with minimal auth context */}
      {isSignupRoute ? (
        <>
          {console.log('🔥 SIGNUP ROUTE RENDERING - bypassing auth logic:', location)}
          <div className="min-h-screen w-full max-w-full flex flex-col bg-background text-foreground overflow-x-hidden">
            {location === '/signup/account' && <SignupAccount />}
            {location === '/signup/local' && <SignupLocal />}
            {/* OLD BROKEN UNIFIED SIGNUP REMOVED FOREVER */}
            {location === '/signup/traveling' && <SignupTraveling />}
            {location === '/signup/business' && <SignupBusinessSimple />}
            {location.startsWith('/signup/qr/') && <QRSignup referralCode={location.split('/signup/qr/')[1] || ''} />}
          </div>
        </>
      ) : !hasAnyAuthEvidence ? (
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
        // Show full app with navbar when ANY authentication evidence exists
        <>
          {console.log('🔍 APP ROUTING: Authentication evidence found, showing authenticated app for location:', location)}
          <div className="min-h-screen w-full max-w-full flex flex-col bg-background text-foreground overflow-x-hidden">
            {/* Navigation - ALWAYS show for authenticated users regardless of user state timing */}
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

            <main className="flex-1 w-full max-w-full pt-16 pb-24 md:pt-0 md:pb-20 overflow-x-hidden main-with-bottom-nav">
              <div className="w-full max-w-full overflow-x-hidden">
                {renderPage()}
              </div>
            </main>

            {/* Bottom Navigation - show on all screen sizes for authenticated users */}
            {(user || localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || localStorage.getItem('auth_token')) && (
              <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999 }}>
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
  // Initialize Google Analytics when app loads
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
      console.log('🔍 Google Analytics initialized with ID:', import.meta.env.VITE_GA_MEASUREMENT_ID);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalHotfixes />
      <ThemeProvider defaultTheme="system" storageKey="nearby-traveler-theme">
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