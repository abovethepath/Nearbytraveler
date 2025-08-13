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
import EventDetails from "@/pages/event-details";
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
import SignupTraveler from "@/pages/signup-traveler";
import SignupBusiness from "@/pages/signup-business";
import SignupSteps from "@/pages/signup-steps";
import UnifiedSignup from "@/pages/unified-signup";
import BusinessRegistration from "@/pages/business-registration";
// Landing component removed - using LandingNew instead
import LandingNew from "@/pages/landing-new";
import Photos from "@/pages/photos";
import UploadPhotos from "@/pages/upload-photos";
import AICompanion from "@/pages/ai-companion";
import TravelMemories from "@/pages/travel-memories";
import HiddenGems from "@/pages/hidden-gems";
import PlanTrip from "@/pages/plan-trip";
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
import MobileNav from "@/components/mobile-nav";
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

    setIsLoading(false);
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
    const actualAuth = hasUserInState || hasUserInStorage;

    console.log('🔍 AUTH CHECK: user in state:', hasUserInState, 'user in storage:', hasUserInStorage, 'final auth:', actualAuth);

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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">Loading Nearby Traveler...</div>
      </div>
    );
  }

  const renderPage = () => {
    console.log('🔍 ROUTING DEBUG - isAuthenticated:', authValue.isAuthenticated, 'location:', location, 'user:', user);
    console.log('🔍 Current window.location.pathname:', window.location.pathname);

    // EMERGENCY FIX: Force authentication to work
    const forceAuth = localStorage.getItem('user') !== null;
    console.log('🚨 EMERGENCY AUTH CHECK: forceAuth =', forceAuth, 'isAuthenticated =', authValue.isAuthenticated);

    // ALWAYS bypass authentication check if localStorage has user data
    const isActuallyAuthenticated = authValue.isAuthenticated || forceAuth;

    if (!isActuallyAuthenticated) {
      console.log('User not authenticated, enforcing auth-only access for:', location);

      // Allow only landing and auth/sign-up related routes when unauthenticated
      if (location === '/' || location === '/landing' || location === '/landing-new') {
        return <LandingNew />;
      }

      if (location === '/auth' || location === '/join' || location === '/signup') {
        return <Auth />;
      }

      if (location === '/signup-local-traveler') {
        return <SignupLocalTraveler />;
      }
      if (location === '/signup-traveler') {
        return <SignupTraveler />;
      }
      if (location === '/signup/business') {
        return <SignupBusiness />;
      }

      // Block all other routes for unauthenticated users by showing landing
      return <LandingNew />;
    }

    console.log('User authenticated, routing to:', location);
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
      case '/signup-local-traveler':
        return <SignupLocalTraveler />;
      case '/signup-traveler':
        return <SignupTraveler />;
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
      case '/create-event':
        return <CreateEvent />;
      case '/events/:id':
        const eventId = location.split('/')[2];
        return <EventDetails eventId={eventId} />;
      case '/discover':
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
        return <Home />;
      default:
        // Handle dynamic routes
        if (location.startsWith('/meetup-chat/')) {
          return <MeetupChat />;
        }
        if (location.startsWith('/event-chat/')) {
          return <EventChat />;
        }
        return <NotFound />;
    }
  };

  return (
    <AuthContext.Provider value={authValue}>
      {!authValue.isAuthenticated ? (
        // Show appropriate page based on routing for unauthenticated users
        <>
          {console.log('🔍 APP ROUTING: User NOT authenticated, showing unauthenticated page for location:', location)}
          {renderPage()}
        </>
      ) : (
        // Show full app with navbar when authenticated
        <>
          {console.log('🔍 APP ROUTING: User IS authenticated, showing authenticated app for location:', location)}
          <div className="min-h-screen w-full max-w-full flex flex-col bg-background text-foreground overflow-x-hidden">
            <Navbar />
            <main className="flex-1 w-full max-w-full mb-20 md:mb-0 overflow-x-hidden">
              <div className="w-full max-w-full overflow-x-hidden">
                {renderPage()}
              </div>
            </main>
            <Footer />
            <MobileNav />
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