import React, { useState, useEffect, useLayoutEffect } from "react";
import { useLocation } from "wouter";
import { initGA } from "@/lib/analytics";
import { useAnalytics } from "@/hooks/use-analytics";

import { queryClient, invalidateUserCache, getApiBaseUrl } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import GlobalHotfixes from "@/GlobalHotfixes";
import { METRO_AREAS } from "@shared/constants";
import Home from "@/pages/home";
import Welcome from "@/pages/welcome";
import WelcomeBusiness from "@/pages/welcome-business";
import Discover from "@/pages/discover";
import ProfileComplete from "@/pages/profile-complete";
import Messages from "@/pages/messages";
import Events from "@/pages/events";
import EventHistory from "@/pages/event-history";
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
import Explore from "@/pages/explore";
import CommunityDetail from "@/pages/community-detail";


import Auth from "@/pages/auth";
import JoinNowWidgetNew from "@/components/join-now-widget-new";
import Logo from "@/components/logo";
import { HelpChatbot } from "@/components/HelpChatbot";

// Join page component with sign in option — matches reference: text logo, headline, tagline, choose box
function JoinPageWithSignIn() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen bg-indigo-950 dark:bg-indigo-950 flex flex-col relative">
      {/* Gradient band */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-orange-400 to-purple-500" aria-hidden />

      {/* Back Button */}
      <button
        onClick={() => setLocation(isNativeIOSApp() ? '/home' : '/')}
        className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white/10 dark:bg-white/10 backdrop-blur-sm border border-white/20 text-gray-200 hover:text-white hover:bg-white/20 transition-all"
        data-testid="button-back"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex-1 flex items-center justify-center p-4 pt-14">
        <div className="w-full max-w-md">
          {/* Logo: text-based NearbyTraveler (blue + orange, no black box) */}
          <div className="flex justify-center mb-6">
            <Logo variant="join" />
          </div>
          {/* Headline */}
          <h1 className="text-center text-2xl sm:text-3xl font-bold text-orange-500 dark:text-orange-400 mb-2">
            Join Nearby Traveler
          </h1>
          {/* Tagline */}
          <p className="text-center text-sm sm:text-base text-gray-300 dark:text-gray-300 mb-8 max-w-lg mx-auto">
            Start Connecting with Nearby Locals and Nearby Travelers Today Based on Common Interests and Demographics
          </p>
          {/* Choose how you want to connect — bordered box */}
          <div className="rounded-xl border-2 border-orange-500/60 dark:border-orange-500/60 bg-indigo-900/40 dark:bg-indigo-900/40 p-5 sm:p-6">
            <JoinNowWidgetNew darkBackground />
          </div>
          <div className="text-center mt-6">
            <p className="text-gray-400 dark:text-gray-400 text-sm">
              Already have an account?{" "}
              <button
                onClick={() => setLocation('/signin')}
                className="text-orange-400 hover:text-orange-300 font-bold underline"
              >
                Sign In
              </button>
            </p>
          </div>
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
import EventIntegrations from "@/pages/event-integrations";
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
import WhatsAppChatroom from "@/pages/whatsapp-chatroom";
import DMChat from "@/pages/dm-chat";

import BusinessOffers from "@/pages/business-offers";
import BusinessDashboard from "@/pages/business-dashboard";
import BusinessProfile from "@/pages/business-profile";
import Deals from "@/pages/deals";
import Settings from "@/pages/settings";
import PrivacySettingsPage from "@/pages/privacy-settings";
import { PitchPreview } from "@/pages/pitch-preview";
import AdminSettings from "@/pages/admin-settings";
import SMSTest from "@/pages/sms-test";
import FinishingSetup from "@/pages/FinishingSetup";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Cookies from "@/pages/cookies";
import SupportPage from "@/pages/support";
import CommunityGuidelines from "@/pages/community-guidelines";
import ProfilePageResponsive from "@/pages/ProfilePageResponsive";
import EventsListResponsive from "@/pages/EventsListResponsive";
import About from "@/pages/about";
import AmbassadorProgram from "@/pages/ambassador-program";
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
import SharedTrip from "@/pages/shared-trip";
import JoinTrip from "@/pages/join-trip";
import TravelBlog from "@/pages/travel-blog";
import QuickLogin from "@/pages/quick-login";
import SignOutPage from "@/pages/signout";
import MatchInCity from "@/pages/match-in-city";
import QRSignup from "@/pages/qr-signup";
import ShareQR from "@/pages/share-qr";
import BusinessCardPage from "@/pages/business-card";
import QRCodePage from "@/pages/qr-code";
import QRSimplePage from "@/pages/qr-simple";
import LandingStreamlined from "@/pages/landing-new-streamlined";
import LandingMinimal from "@/pages/landing-minimal";
import LandingSimple from "@/pages/landing-simple";
import ComingSoon from "@/pages/coming-soon";


import Navbar from "@/components/navbar";
import LandingNavbar from "@/components/landing-navbar";
import { isNativeIOSApp } from "@/lib/nativeApp";
// Removed conflicting MobileNav - using MobileTopNav and MobileBottomNav instead
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MobileTopNav } from "@/components/MobileTopNav";
import Footer from "@/components/footer";
import { UniversalBackButton } from "@/components/UniversalBackButton";
// REMOVED: IM components (IMAlert, OnlineBuddyList, FloatingChatManager, IMNotificationManager) - obsolete functionality
import type { User } from "@shared/schema";
import { authStorage } from "@/lib/auth";
import { getMetroArea } from "@shared/constants";
import websocketService from "@/services/websocketService";

// Simple auth context
export const AuthContext = React.createContext<{
  user: User | null;
  setUser: (user: User | null) => void;
  login: (userData: User, token?: string) => void;
  logout: (redirectTo?: string) => void;
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
  // BULLETPROOF POST-SIGNUP FIX: If just_registered flag exists, load user from localStorage
  // synchronously in the useState initializer. This handles the case where:
  // 1. iOS WebView reloads the page after signup (full remount)
  // 2. The Router component remounts for any reason after signup
  // Without this, user=null on first render -> landing navbar flashes
  const [user, setUser] = useState<User | null>(() => {
    const flag = localStorage.getItem('just_registered');
    if (flag === 'true') {
      const stored = localStorage.getItem('user') || localStorage.getItem('travelconnect_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) {
            console.log('🎯 INIT: just_registered user loaded:', parsed.username);
            localStorage.removeItem('just_registered');
            return parsed;
          }
        } catch (e) { /* ignore */ }
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(!user);
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
    '/', '/landing', '/landing-new', '/auth', '/auth/signup', '/join', '/signup', '/signup/local', '/signup/traveler', '/signup/business', '/signup/account', '/signup/traveling',
    '/events-landing', '/business-landing', '/locals-landing', '/travelers-landing', /* '/networking-landing', */ '/couchsurfing', '/cs', '/b', '/privacy', '/terms', '/cookies', '/about', '/ambassador-program', '/getting-started',
    '/forgot-password', '/reset-password', '/welcome', '/welcome-business', '/finishing-setup', '/quick-login', '/preview-landing', '/preview-first-landing',
    '/travel-quiz', '/TravelIntentQuiz', '/business-card', '/qr-code', '/landing-simple', '/signin', '/launching-soon'
  ];
  const isLandingPage = landingPageRoutes.includes(location);

  useEffect(() => {
    // BULLETPROOF FIX #1: If user was already set from useState initializer (just_registered),
    // skip the server auth check entirely. The server might return 401 due to iOS WebView
    // cookie timing, which would incorrectly clear the user we just set.
    if (user && user.id) {
      console.log('🎯 User already initialized (likely from just_registered), skipping server auth check:', user.username);
      setIsLoading(false);
      return;
    }

    // BULLETPROOF FIX #2: Fallback check for just_registered flag (in case initializer missed it)
    const justRegistered = localStorage.getItem('just_registered');
    const storedUserForJustReg = localStorage.getItem('user') || localStorage.getItem('travelconnect_user');
    if (justRegistered === 'true' && storedUserForJustReg) {
      try {
        const parsedUser = JSON.parse(storedUserForJustReg);
        if (parsedUser && parsedUser.id) {
          console.log('🎯 JUST REGISTERED - trusting localStorage, skipping server auth check for:', parsedUser.username);
          setUser(parsedUser);
          authStorage.setUser(parsedUser);
          localStorage.removeItem('just_registered');
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error('Failed to parse just_registered user data:', e);
      }
    }

    // Skip auth check for signup routes and public pages (but not root '/' which needs auth check for redirect)
    if (isSignupRoute || (isLandingPage && location !== '/')) {
      console.log('🔥 PUBLIC PAGE - skipping auth check:', location);
      setIsLoading(false);
      return;
    }

    // CRITICAL iOS FIX: Skip auth check for /profile and /profile/:id when we have just_registered or user in storage.
    // After signup, user may land on /profile/:id before cookie propagates; don't clear them.
    const storedForProfile = localStorage.getItem('user') || localStorage.getItem('travelconnect_user');
    if ((location === '/profile' || location.startsWith('/profile/')) && (justRegistered === 'true' || storedForProfile)) {
      console.log('🎯 PROFILE ROUTE POST-SIGNUP - skipping server auth check for:', location);
      if (storedForProfile) {
        try {
          const parsedUser = JSON.parse(storedForProfile);
          if (parsedUser?.id) {
            setUser(parsedUser);
            authStorage.setUser(parsedUser);
          }
        } catch {}
      }
      setIsLoading(false);
      return;
    }

    console.log('🚀 PRODUCTION CACHE BUST v2025-08-17-17-28 - Starting authentication check');

    // Check server-side session first
    const checkServerAuth = async () => {
      try {
        console.log('🔍 Checking server-side authentication...');
        const response = await fetch(`${getApiBaseUrl()}/api/auth/user`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const serverUser = await response.json();
          console.log('✅ Server session found:', serverUser.username, 'ID:', serverUser.id);
          setUser(serverUser);
          authStorage.setUser(serverUser);
          localStorage.setItem('user', JSON.stringify(serverUser));
          localStorage.removeItem('just_registered');
          
          if (serverUser && !localStorage.getItem('welcomed_' + serverUser.id)) {
            console.log('🎉 New user detected - showing welcome');
            localStorage.setItem('welcomed_' + serverUser.id, 'true');
          }
          
          setIsLoading(false);
          return;
        } else {
          console.log('❌ No server session found (401) - attempting recovery...');
        }
      } catch (error) {
        console.log('❌ Server auth check failed:', error);
      }

      // RECOVERY: If we have user data in localStorage, try to recover the session
      const storedUserData = localStorage.getItem('user') || localStorage.getItem('travelconnect_user');
      if (storedUserData) {
        try {
          const storedUser = JSON.parse(storedUserData);
          if (storedUser && storedUser.id) {
            console.log('🔄 Attempting session recovery for user:', storedUser.username);
            const recoveryResponse = await fetch(`${getApiBaseUrl()}/api/auth/recover-session`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                userId: storedUser.id,
                email: storedUser.email,
                username: storedUser.username
              })
            });
            
            if (recoveryResponse.ok) {
              const recoveredUser = await recoveryResponse.json();
              console.log('✅ Session recovered successfully for:', recoveredUser.username);
              setUser(recoveredUser);
              authStorage.setUser(recoveredUser);
              localStorage.setItem('user', JSON.stringify(recoveredUser));
              localStorage.removeItem('just_registered');
              setIsLoading(false);
              return;
            } else {
              console.log('❌ Session recovery failed - credentials mismatch');
            }
          }
        } catch (e) {
          console.error('❌ Session recovery error:', e);
        }
      }

      // Only clear localStorage if recovery also failed
      console.log('🗑️ Clearing all user storage keys');
      authStorage.clearUser();
      localStorage.removeItem('user');
      localStorage.removeItem('travelconnect_user');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authUser');
      localStorage.removeItem('current_user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('just_registered');
      setUser(null);

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

  // REMOVED: Hydration from localStorage - it could show wrong user (e.g. admin) before
  // session check completes. Session is the only source of truth; wait for checkServerAuth.

  // Scroll to top when location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Native iOS: redirect / and /landing to /home in effect (not during render) to avoid Wouter render loop
  useEffect(() => {
    console.log('NATIVE ROOT REDIRECT EFFECT CHECK', { location });
    if (isNativeIOSApp() && (location === '/' || location === '' || location.startsWith('/landing'))) {
      setLocation('/home');
    }
  }, [location, setLocation]);

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
      logout: async (redirectTo = '/') => {
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
          // Only use href assignment - reload() after href causes race condition
          window.location.href = redirectTo;

        } catch (error) {
          console.error('❌ Error during logout:', error);
          // Fallback - force complete refresh anyway
          window.location.href = redirectTo;
        }
      },
      login: (userData: User, token?: string) => {
        console.log('AuthContext login called with:', userData?.username || 'null');
        // CRITICAL: Clear ALL old user data first to prevent stale data from previous user
        authStorage.clearUser();
        invalidateUserCache();
        // Now store the new user
        authStorage.setUser(userData);
        if (token) {
          localStorage.setItem('auth_token', token);
        }
        setUser(userData);
      },
      isAuthenticated: actualAuth,
    };
  }, [user, setLocation, queryClient]);

  if (isLoading && !isSignupRoute && !isLandingPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">Loading Nearby Traveler...</div>
      </div>
    );
  }

  const renderPage = (overrideUser?: User | null) => {
    const effectiveUser = overrideUser !== undefined ? overrideUser : user;
    const routeRendered = location === '/home' && effectiveUser ? 'Home' : location === '/profile' ? 'Profile' : location;
    console.log('ROUTE GUARD', {
      authLoading: isLoading,
      hasUser: !!effectiveUser,
      path: location,
      routeRendered,
      serverSessionHint: 'If protected API calls fail, verify /api/auth/user returns 200 in network tab',
    });
    console.log('🔍 ROUTING DEBUG - isAuthenticated:', authValue.isAuthenticated, 'location:', location, 'user:', effectiveUser);
    console.log('🔍 Current window.location.pathname:', window.location.pathname);

    // NATIVE APP: Never show landing; redirect to /home is done in Router useEffect (avoids setLocation during render / loop)
    if (isNativeIOSApp() && (location === '/' || location === '' || location.startsWith('/landing'))) {
      return null;
    }

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
      
      // Default fallback for any other signup routes (native: no hard nav to avoid session drop)
      console.log('⚠️ Unknown signup route, redirecting to account signup');
      if (isNativeIOSApp()) {
        setLocation('/signup/account');
      } else {
        window.location.href = '/signup/account';
      }
      return null;
    }

    // Sign-out route - clears session and redirects to sign-in (for native app users, QR code flows)
    if (location === '/signout') {
      console.log('🚪 Sign-out route - clearing session');
      return <SignOutPage />;
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

    // Simplified user state fix - recover user from storage and re-render for current location
    if (!hasUserInState && (hasUserInLocalStorage || hasTravelConnectUser) && !user && !isLoading && overrideUser === undefined) {
      console.log('🔄 FIXING USER STATE: User has auth data but no state, rendering for current location');
      try {
        const storedUser = localStorage.getItem('user') || localStorage.getItem('travelconnect_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.id) {
            console.log('🔧 Setting user from storage:', parsedUser.username);
            setUser(parsedUser);
            return renderPage(parsedUser); // Preserve current route instead of forcing Home
          }
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }

    // ✅ CRITICAL FIX: Handle all profile routes BEFORE authentication check
    // This prevents redirect loops when user state fluctuates
    if (location.startsWith('/profile/')) {
      const userId = parseInt(location.split('/')[2]);
      console.log('🔍 PROFILE ROUTE (pre-auth): userId:', userId, 'location:', location);
      return <ProfileComplete userId={userId} />;
    }
    
    // Handle own profile route (no ID)
    if (location === '/profile') {
      console.log('🔍 OWN PROFILE ROUTE (pre-auth)');
      return <ProfileComplete />;
    }
    
    // Handle business profile routes
    if (location.startsWith('/business/') && !location.includes('/offers')) {
      const businessId = location.split('/')[2];
      console.log('🔍 BUSINESS PROFILE ROUTE (pre-auth): businessId:', businessId);
      return <ProfileComplete userId={parseInt(businessId)} />;
    }

    // Show simple A/B test landing page regardless of auth state
    if (location === '/landing-simple') {
      return <LandingSimple />;
    }

    // Welcome pages - show before auth check to prevent landing page flash after signup
    if (location === '/welcome') {
      return <Welcome />;
    }
    if (location === '/welcome-business') {
      return <WelcomeBusiness />;
    }

    if (!isActuallyAuthenticated) {
      console.log('🏠 STREAMLINED LANDING - User not authenticated, showing streamlined landing page for:', location);
      console.log('🔐 DEBUG: window.location.pathname =', window.location.pathname);
      console.log('🔐 DEBUG: wouter location =', location);
      console.log('🔐 DEBUG: checking reset-password match:', location.startsWith('/reset-password'));

      // CRITICAL: Handle password reset before other checks
      if (location.startsWith('/reset-password') || window.location.pathname.startsWith('/reset-password')) {
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

      if (location === '/welcome') {
        return <Welcome />;
      }
      if (location === '/welcome-business') {
        return <WelcomeBusiness />;
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

      // Show simple A/B test landing page
      if (location === '/landing-simple') {
        return <LandingSimple />;
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
      if (location === '/support') {
        return <SupportPage />;
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
      if (location === '/ambassador-program') {
        return <AmbassadorProgram />;
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
      const commonAppRoutes = ['/discover', '/match-in-city', '/quick-meetups', '/messages', '/profile', '/profile-new', '/profile-complete', '/cities', '/plan-trip', '/home', '/events', '/deals', '/city-chatrooms', '/chatroom', '/explore'];
      const isCommonAppRoute = commonAppRoutes.some(route => location.startsWith(route));

      if (isCommonAppRoute && (localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || localStorage.getItem('auth_token'))) {
        console.log('🔧 MOBILE FIX: User has auth data, but was going to be shown landing, routing to authenticated section');
        // Force re-evaluation as authenticated user by bypassing this unauthenticated section
        let authUser = user;
        if (!authUser) { try { authUser = JSON.parse(localStorage.getItem('travelconnect_user') || localStorage.getItem('user') || '{}'); } catch { authUser = null; } }
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
        if (isNativeIOSApp()) {
          console.warn('LANDING RENDERED ON IOS - SHOULD NOT HAPPEN', { authLoading: isLoading, hasUser: !!user });
        }
        console.log('🏠 STREAMLINED LANDING v20250128-2024 - Root path for unauthenticated user - showing new streamlined version');
        return <LandingStreamlined />;
      }
      
      // Test route for new streamlined landing
      if (location === '/landing-streamlined') {
        console.log('🎯 TESTING - Streamlined landing page');
        return <LandingStreamlined />;
      }
      
      // SIGNUP ROUTES - All handled by early return at top of function
      if (location === '/finishing-setup') {
        console.log('✅ FINISHING SETUP - Native post-signup interstitial');
        return <FinishingSetup />;
      }
      if (location === '/join') {
        console.log('✅ JOIN PAGE - Unauthenticated access allowed');
        return <JoinPageWithSignIn />;
      }

      // Post-signup: native app shows FinishingSetup (poll then /home); web redirects to profile
      if (location === '/account-success') {
        if (isNativeIOSApp()) {
          console.log('✅ ACCOUNT-SUCCESS (native) - Showing FinishingSetup');
          return <FinishingSetup />;
        }
        setLocation('/profile');
        return null;
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

    console.log('✅ USER AUTHENTICATED - routing to:', location, 'user:', effectiveUser?.username || 'unknown user');

    if (location === '/welcome') {
      return <Welcome />;
    }

    if (location === '/welcome-business') {
      return <WelcomeBusiness />;
    }

    if (location === '/finishing-setup') {
      return <FinishingSetup />;
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
      return <WhatsAppChatroom />;
    }

    if (location.startsWith('/messages/') && location.split('/')[2]) {
      return <DMChat />;
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
      
      // Only redirect if not already on the consolidated LA Metro page
      if (isLAMetroCity && cityName !== 'Los Angeles Metro') {
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

    if (location.startsWith('/trip/')) {
      return <SharedTrip />;
    }

    if (location.startsWith('/join-trip/')) {
      return <JoinTrip />;
    }

    if (location.startsWith('/deals/')) {
      const dealId = location.split('/')[2];
      return <BusinessOffers dealId={dealId} />;
    }

    if (location.startsWith('/business/') && location.includes('/offers')) {
      const businessId = location.split('/')[2];
      return <BusinessOffers businessId={businessId} />;
    }

    // Handle business profile routes for authenticated users
    if (location.startsWith('/business/') && !location.includes('/offers')) {
      const businessId = location.split('/')[2];
      console.log('🏢 BUSINESS PROFILE ROUTE (authenticated): businessId:', businessId);
      return <ProfileComplete userId={parseInt(businessId)} />;
    }

    switch (location) {
      case '/events':
        return <Events />;
      case '/event-history':
        return <EventHistory />;
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
      // Profile routes handled before authentication check to prevent redirect loops
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
      case '/explore':
        return <Explore />;
      case '/match-in-city':
        return <MatchInCity />;
      case '/share-qr':
        return <ShareQR />;

      case '/connect':
        return <Connect />;
      case '/integrations':
        return <EventIntegrations />;
      case '/matches':
        // Redirect to connect page since matches functionality is there
        setLocation('/connect');
        return null;
      case '/requests':
        return <Requests />;
      case '/passport':
        setLocation('/home');
        return null;
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
        return <AdminSettings user={effectiveUser ?? user} />;
      case '/sms-test':
        return <SMSTest />;
      case '/travel-blog':
        return <TravelBlog />;
      case '/welcome':
        return <Welcome />;
      case '/welcome-business':
        return <WelcomeBusiness />;
      case '/finishing-setup':
        return <FinishingSetup />;
      case '/getting-started':
        return <GettingStarted />;
      case '/ambassador-program':
        return <AmbassadorProgram />;
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
        // Profile routes now handled before authentication check to prevent redirect loops
        if (location.startsWith('/events/')) {
          const eventId = location.split('/')[2];
          return <EventDetails eventId={eventId} />;
        }
        if (location.startsWith('/community/')) {
          const communityId = location.split('/')[2];
          if (communityId) {
            return <CommunityDetail communityId={parseInt(communityId)} />;
          }
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

        // BUSINESS USER FIX: Whitelist allowed routes for business users
        const businessAllowedRoutes = [
          '/quick-meetups',
          '/quick-meetup',
          '/chatroom',
          '/city-chatrooms',
          '/chatrooms',
          '/event-chat',
          '/quick-meetup-chat',
          '/messages',
          '/dm-chat',
          '/meetups',
          '/meetup-chat',
          '/event-chat',
        ];
        
        const isBusinessAllowedRoute = businessAllowedRoutes.some(route => 
          location.startsWith(route)
        );
        
        // Only redirect business users if route is NOT allowed
        if (effectiveUser?.userType === 'business' && location !== '/' && !isBusinessAllowedRoute) {
          console.log('🏢 BUSINESS USER: Unknown route detected (not whitelisted), redirecting to home page');
          setLocation(isNativeIOSApp() ? '/home' : '/');
          return null;
        }
        
        // MOBILE FIX: If unknown route but user is authenticated, redirect to home
        console.log('🚫 UNKNOWN ROUTE FOR AUTHENTICATED USER:', location);
        console.log('🔄 MOBILE: Redirecting unknown authenticated route to home');
        setLocation(isNativeIOSApp() ? '/home' : '/');
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
          
          {/* Navigation - Navbar handles both mobile and desktop, hidden in native iOS */}
          {!isNativeIOSApp() && (
            <Navbar />
          )}
          
          {/* Main content */}
          <div className="min-h-screen w-full max-w-full bg-background text-foreground overflow-x-hidden">
            <main className={`w-full max-w-full overflow-x-hidden main-with-bottom-nav ${isNativeIOSApp() ? 'pt-0 pb-0' : 'pt-0 pb-24 md:pt-0 md:pb-20'}`}>
              <div className="w-full max-w-full overflow-x-hidden">
                {renderPage()}
              </div>
            </main>
          </div>

          {/* REMOVED: Instant Messaging Components - obsolete functionality */}
        </>
      )}

      {/* Bottom Navigation - rendered outside conditional branches so it always shows for authenticated users */}
      {!isSignupRoute && !isNativeIOSApp() && (user || localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || localStorage.getItem('auth_token')) && (
        <MobileBottomNav />
      )}
    </AuthContext.Provider>
  );
}

function App() {
  useEffect(() => {
    if (isNativeIOSApp()) {
      document.body.setAttribute('data-native-ios', 'true');
    }
  }, []);

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
          <HelpChatbot />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;