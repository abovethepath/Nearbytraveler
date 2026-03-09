import React, { useState, useEffect, useLayoutEffect } from "react";
import { useLocation } from "wouter";
import { initGA } from "@/lib/analytics";
import { useAnalytics } from "@/hooks/use-analytics";

import { queryClient, invalidateUserCache, getApiBaseUrl, startSessionRefresh, stopSessionRefresh } from "./lib/queryClient";
import { posthogIdentifyUser, posthogReset } from "@/lib/posthog";
import { QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import GlobalHotfixes from "@/GlobalHotfixes";
import { DarkModeSuggestionBanner } from "@/components/DarkModeSuggestionBanner";
import { FullPageSkeleton } from "@/components/FullPageSkeleton";
import { METRO_AREAS } from "@shared/constants";
import Home from "@/pages/home";
import Welcome from "@/pages/welcome";
import WelcomeBusiness from "@/pages/welcome-business";
import Discover from "@/pages/discover";
import ProfileComplete from "@/pages/profile-complete";
import Messages from "@/pages/messages";
import Events from "@/pages/events";
import EventHistory from "@/pages/event-history";
import CalendarPage from "@/pages/calendar";
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
import Connect from "@/pages/connect";
import Requests from "@/pages/requests";
import Explore from "@/pages/explore";
import ActivityPage from "@/pages/activity";
import CommunityDetail from "@/pages/community-detail";


import Auth from "@/pages/auth";
import JoinNowWidgetNew from "@/components/join-now-widget-new";
import Logo from "@/components/logo";
import { HelpChatbot } from "@/components/HelpChatbot";

// Join page component with sign in option — matches reference: text logo, headline, tagline, choose box
function JoinPageWithSignIn() {
  const [, setLocation] = useLocation();
  
  return (
    <>
      <style>{`
        .nt-hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .nt-hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      <div
        className="nt-hide-scrollbar h-screen overflow-y-auto bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col relative"
      >
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 to-blue-500" aria-hidden />

      <button
        onClick={() => setLocation(isNativeIOSApp() ? '/home' : '/')}
        className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 transition-all"
        data-testid="button-back"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex-1 flex items-center justify-center p-4 pt-14">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-6">
            <Logo variant="auth" />
          </div>
          <h1 className="text-center text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
            Join Nearby Traveler
          </h1>
          <p className="text-center text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
            Start Connecting with Nearby Locals and Nearby Travelers Today Based on Common Interests and Demographics
          </p>
          <div className="rounded-xl border-2 border-orange-200 dark:border-orange-800 bg-white dark:bg-gray-900 shadow-lg p-5 sm:p-6">
            <JoinNowWidgetNew />
          </div>
          <div className="text-center mt-6">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Already have an account?{" "}
              <button
                onClick={() => setLocation('/signin')}
                className="text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300 font-bold underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

function AuthTransitionScreen() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Logo variant="auth" />
        <div
          className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-700 border-t-transparent animate-spin"
          aria-label="Loading"
        />
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
import AmbassadorLanding from "@/pages/ambassador";
import AmbassadorDashboard from "@/pages/ambassador-dashboard";
import AmbassadorInfo from "@/pages/ambassador-info";
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
import ComingSoon from "@/pages/coming-soon";


import Navbar from "@/components/navbar";
import LandingNavbar from "@/components/landing-navbar";
import { isNativeIOSApp } from "@/lib/nativeApp";
// Removed conflicting MobileNav - using MobileTopNav and MobileBottomNav instead
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MobileTopNav } from "@/components/MobileTopNav";
import { AdvancedSearchWidget } from "@/components/AdvancedSearchWidget";
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
  authLoading: boolean;
  isAuthenticating: boolean;
  setIsAuthenticating: (isAuthenticating: boolean) => void;
  startAuthenticating: () => void;
  stopAuthenticating: () => void;
}>({
  user: null,
  setUser: () => {},
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  authLoading: true,
  isAuthenticating: false,
  setIsAuthenticating: () => {},
  startAuthenticating: () => {},
  stopAuthenticating: () => {},
});

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/** Advanced Search widget for native iOS - web nav is hidden, so we render it here and open via openSearchWidget event from native header */
function NativeIOSSearchWidget() {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("openSearchWidget", handler);
    return () => window.removeEventListener("openSearchWidget", handler);
  }, []);
  return <AdvancedSearchWidget open={open} onOpenChange={setOpen} />;
}

function ProfileByUsername({ username }: { username: string }) {
  const normalized = (username || "").trim();
  const { data, isLoading, isError } = useQuery<{ id: number; username?: string }>({
    queryKey: ["userIdByUsername", normalized.toLowerCase()],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/users/by-username/${encodeURIComponent(normalized)}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const err: any = new Error("Failed to resolve username");
        err.status = res.status;
        throw err;
      }
      return res.json();
    },
    enabled: normalized.length > 0,
  });

  if (!normalized) return <NotFound />;
  if (isLoading) {
    return <FullPageSkeleton />;
  }
  if (isError || !data?.id) return <NotFound />;
  return <ProfileComplete userId={data.id} />;
}

// Session cache for instant hydration — avoids blank loading screen on every page load.
const SESSION_CACHE_KEY = 'nt_cached_session';
// localStorage so the cache survives navigating away to other sites and coming back —
// sessionStorage is wiped the moment the user leaves the origin, causing a 2-4s
// auth-loading spinner every time they return.
const SESSION_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const readSessionCache = (): User | null => {
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Basic sanity: must have id and username
    if (!parsed?.id || !parsed?.username) return null;
    // Ignore entries older than 24 h — background check will re-establish the session
    if (parsed._ts && Date.now() - parsed._ts > SESSION_CACHE_TTL_MS) {
      localStorage.removeItem(SESSION_CACHE_KEY);
      return null;
    }
    return parsed as User;
  } catch {
    return null;
  }
};
const writeSessionCache = (u: User | null) => {
  try {
    if (u) {
      const payload = JSON.stringify({ ...u, _ts: Date.now() });
      localStorage.setItem(SESSION_CACHE_KEY, payload);
      localStorage.setItem('travelconnect_user', JSON.stringify(u));
      localStorage.setItem('user', JSON.stringify(u));
    } else {
      localStorage.removeItem(SESSION_CACHE_KEY);
      localStorage.removeItem('travelconnect_user');
      localStorage.removeItem('user');
    }
  } catch {}
};

function Router() {
  // Instantly hydrate from localStorage so the UI renders with no blank loading screen.
  const cachedUser = readSessionCache();
  const [user, setUser] = useState<User | null>(cachedUser);
  // If we have a cached user we can skip the initial loading gate entirely.
  const [isLoading, setIsLoading] = useState(cachedUser === null);
  // Web: explicit auth hydration/loading gate to prevent redirect/layout flashes.
  const [authLoading, setAuthLoading] = useState(cachedUser === null);
  // Auth init/verification gates to prevent landing/login flashes during nav.
  const [authInitialized, setAuthInitialized] = useState(cachedUser !== null);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const loginSucceededAtRef = React.useRef<number>(0);
  const LOGIN_PENDING_KEY = "nt_login_pending";
  const [loginPending, setLoginPending] = useState(() => {
    try {
      return sessionStorage.getItem(LOGIN_PENDING_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const setLoginPendingFlag = React.useCallback((pending: boolean) => {
    setLoginPending(pending);
    try {
      if (pending) {
        sessionStorage.setItem(LOGIN_PENDING_KEY, "1");
      } else {
        sessionStorage.removeItem(LOGIN_PENDING_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const stopAuthenticating = React.useCallback(() => {
    setIsAuthenticating(false);
    setLoginPendingFlag(false);
  }, [setLoginPendingFlag]);

  const startAuthenticating = React.useCallback(() => {
    setIsAuthenticating(true);
    setLoginPendingFlag(true);
    window.setTimeout(() => stopAuthenticating(), 3000);
  }, [setLoginPendingFlag, stopAuthenticating]);

  useEffect(() => {
    const onPending = (e: Event) => {
      const ce = e as CustomEvent;
      setLoginPendingFlag(!!ce.detail);
    };
    window.addEventListener("nt-login-pending", onPending as EventListener);
    return () => window.removeEventListener("nt-login-pending", onPending as EventListener);
  }, [setLoginPendingFlag]);

  // If a submit-triggered auth transition is pending (persisted in sessionStorage),
  // make sure we always render the transition screen, even across reloads.
  useEffect(() => {
    if (loginPending) setIsAuthenticating(true);
  }, [loginPending]);

  useEffect(() => {
    if (user) {
      startSessionRefresh();
    } else {
      stopSessionRefresh();
    }
    return () => stopSessionRefresh();
  }, [user]);
  
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

  // Chat pages need a locked, non-scrollable layout so the header and input never scroll away
  const isChatPage = (
    location.startsWith('/chatroom/') ||
    location.startsWith('/dm-chat/') ||
    location.startsWith('/chat/') ||
    location.startsWith('/event-chat/') ||
    location.startsWith('/meetup-chat/') ||
    location.startsWith('/quick-meetup-chat/') ||
    (location.startsWith('/messages/') && location.split('/')[2])
  );

  const landingPageRoutes = [
    '/', '/landing', '/landing-new', '/auth', '/auth/signup', '/join', '/signup', '/signup/local', '/signup/traveler', '/signup/business', '/signup/account', '/signup/traveling',
    '/events-landing', '/business-landing', '/locals-landing', '/travelers-landing', /* '/networking-landing', */ '/couchsurfing', '/cs', '/b', '/privacy', '/terms', '/cookies', '/about', '/ambassador', '/ambassador-program', '/getting-started',
    '/forgot-password', '/reset-password', '/welcome', '/welcome-business', '/finishing-setup', '/quick-login', '/preview-landing', '/preview-first-landing',
    '/travel-quiz', '/TravelIntentQuiz', '/business-card', '/qr-code', '/landing-simple', '/signin', '/launching-soon'
  ];
  const isLandingPage = landingPageRoutes.includes(location);

  // --- Auth limbo hardening (web only) ---
  const authSyncInFlightRef = React.useRef(false);
  const authSyncSeqRef = React.useRef(0);
  const lastAuthSyncAtRef = React.useRef(0);
  const navSyncTimerRef = React.useRef<number | undefined>(undefined);

  // If we determine the server session is invalid, mark it for this tab so we:
  // - stop treating stale localStorage user JSON as "authenticated"
  // - avoid destructive localStorage clearing during transient auth issues
  const sessionInvalidKey = "nt_session_invalid";
  const sessionVerifiedKey = "nt_session_verified";
  const isSessionMarkedInvalid = React.useCallback(() => {
    try {
      return sessionStorage.getItem(sessionInvalidKey) === "1";
    } catch {
      return false;
    }
  }, []);
  const isSessionVerified = React.useCallback(() => {
    try {
      return sessionStorage.getItem(sessionVerifiedKey) === "1";
    } catch {
      return false;
    }
  }, []);
  const markSessionInvalid = React.useCallback((reason?: string) => {
    try {
      sessionStorage.setItem(sessionInvalidKey, "1");
      if (reason) sessionStorage.setItem(sessionInvalidKey + "_reason", reason);
    } catch {
      // ignore storage errors
    }
  }, []);
  const markSessionVerified = React.useCallback(() => {
    try {
      sessionStorage.setItem(sessionVerifiedKey, "1");
    } catch {
      // ignore storage errors
    }
  }, []);
  const clearSessionVerified = React.useCallback(() => {
    try {
      sessionStorage.removeItem(sessionVerifiedKey);
    } catch {
      // ignore storage errors
    }
  }, []);
  const clearSessionInvalid = React.useCallback(() => {
    try {
      sessionStorage.removeItem(sessionInvalidKey);
      sessionStorage.removeItem(sessionInvalidKey + "_reason");
    } catch {
      // ignore storage errors
    }
  }, []);

  const isAuthRoute =
    location === "/auth" ||
    location === "/signin" ||
    location === "/join" ||
    location === "/signup" ||
    location.startsWith("/signup/") ||
    location.startsWith("/auth/");

  // Normalize once so route guards don't break on query strings / hashes / trailing slashes.
  const normalizedPath = React.useMemo(() => {
    const raw =
      typeof window !== "undefined" && window.location?.pathname
        ? window.location.pathname
        : (location || "/");
    const noHash = raw.split("#")[0];
    const noQuery = noHash.split("?")[0];
    const trimmed = (noQuery.replace(/\/+$/, "") || "/");
    return trimmed === "" ? "/" : trimmed;
  }, [location]);

  // Permanent client-side redirect: consolidate /signin → /auth (single login URL).
  useEffect(() => {
    if (isNativeIOSApp()) return;
    if (normalizedPath === "/signin") {
      window.location.replace("/auth");
    }
  }, [normalizedPath]);

  // Single source of truth: whether a route is public (no auth required).
  // Redirect logic must rely exclusively on `!isPublicRoute`.
  const isPublicRoute = React.useMemo(() => {
    // Landing page
    if (normalizedPath === "/") return true;

    // Auth entry
    if (normalizedPath === "/auth") return true;

    // Marketing / public landing routes
    // These are linked from the public landing header/navbar and must not trigger auth redirects.
    const PUBLIC_MARKETING_ROUTES = new Set([
      "/landing",
      "/landing-new",
      "/landing-simple",
      "/landing-minimal",
      "/landing-streamlined",
      "/landing-1",
      "/landing-2",
      "/events-landing",
      "/business-landing",
      "/locals-landing",
      "/travelers-landing",
      "/couchsurfing",
      "/cs",
      "/b",
      "/privacy",
      "/terms",
      "/cookies",
      "/about",
      "/ambassador",
      "/ambassador-program",
      "/getting-started",
      "/welcome",
      "/welcome-business",
      "/finishing-setup",
      "/quick-login",
      "/preview-landing",
      "/preview-first-landing",
      "/travel-quiz",
      "/TravelIntentQuiz",
      "/business-card",
      "/qr-code",
      "/launching-soon",
      "/join",
    ]);
    if (PUBLIC_MARKETING_ROUTES.has(normalizedPath)) return true;
    if (normalizedPath.startsWith("/landing")) return true;

    // Signup flows
    if (normalizedPath === "/signup" || normalizedPath.startsWith("/signup/")) return true;

    // Password recovery
    if (normalizedPath === "/forgot-password") return true;
    if (normalizedPath === "/reset-password") return true;

    // Public event detail pages (if intended public)
    if (normalizedPath.startsWith("/events/") && normalizedPath.split("/")[2]) return true;

    // Invite / join flows
    if (normalizedPath.startsWith("/invite/")) return true;
    if (normalizedPath.startsWith("/join-trip/")) return true;

    return false;
  }, [normalizedPath]);

  const hasLocalAuthEvidence = React.useCallback(() => {
    try {
      if (isSessionMarkedInvalid()) return false;
      // Do not use localStorage as an auth source (ever).
      return false;
    } catch {
      return false;
    }
  }, [isSessionMarkedInvalid, isSessionVerified]);

  // UI-only helper: used to avoid flashing the landing page while a session check is in flight.
  // This MUST NOT be treated as authenticated; it only influences loading gates.
  const hasCachedUserData = React.useCallback(() => {
    try {
      if (isSessionMarkedInvalid()) return false;
      // We don't rely on localStorage for auth hydration; only the in-memory `user`
      // and the server session check determine authenticated rendering.
      return false;
    } catch {
      return false;
    }
  }, [isSessionMarkedInvalid]);

  const clearLocalAuthState = React.useCallback((reason: string) => {
    // When the server says "no session", immediately stop any stale client-side identity
    // from influencing UI, especially in incognito/private mode.
    try {
      writeSessionCache(null);
      authStorage.clearUser();
      localStorage.removeItem("auth_token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("current_user");
      localStorage.removeItem("userData");
      localStorage.removeItem("userSession");
    } catch {
      // ignore storage errors
    }
    markSessionInvalid(reason);
    clearSessionVerified();
  }, []);

  const syncAuthFromServer = React.useCallback(
    async (opts?: { reason?: string; force?: boolean }) => {
      if (isNativeIOSApp()) return;
      if (isSignupRoute) return;
      if (location.startsWith("/api/")) return;

      const reason = opts?.reason || "sync";
      const force = !!opts?.force || loginPending || isAuthenticating;

      // Throttle: at most once every 60 s for background navigation checks.
      // Force-mode (login/signup transitions) bypasses this.
      const now = Date.now();
      if (!force && now - lastAuthSyncAtRef.current < 60_000) return;
      lastAuthSyncAtRef.current = now;

      if (authSyncInFlightRef.current) return;
      authSyncInFlightRef.current = true;
      const seq = ++authSyncSeqRef.current;

      const expectedAuth = !!user?.id;
      if (expectedAuth) setIsVerifyingAuth(true);

      try {
        const doCheck = async () =>
          fetch(`${getApiBaseUrl()}/api/auth/user`, {
            credentials: "include",
            headers: { Accept: "application/json" },
          });

        let res = await doCheck();

        // Auth-transition hardening:
        // Immediately after login/signup, the session cookie can lag briefly.
        // During this window, a single 401 should NOT clear state or redirect to landing.
        if (res.status === 401 && (loginPending || isAuthenticating)) {
          for (const delayMs of [150, 300, 600]) {
            await new Promise((r) => setTimeout(r, delayMs));
            res = await doCheck();
            if (res.ok) break;
          }
        }

        // Ignore stale results if a newer sync started.
        if (seq !== authSyncSeqRef.current) return;

        if (res.ok) {
          const serverUser = await res.json();
          if (serverUser?.id) {
            // Session is valid → ensure UI + storage reflect it.
            clearSessionInvalid();
            markSessionVerified();
            writeSessionCache(serverUser);
            // Only call setUser when something meaningful changed; avoid a full
            // app re-render on every background navigation sync.
            if (serverUser.id !== user?.id || serverUser.username !== user?.username) {
              setUser(serverUser);
            }
            stopAuthenticating();
            setLoginPendingFlag(false);
          }
          return;
        }

        if (res.status === 401) {
          const msSinceLogin = Date.now() - loginSucceededAtRef.current;
          if (msSinceLogin < 10_000) {
            console.log("Auth sync: 401 within login grace period, keeping user state");
            return;
          }
          clearLocalAuthState("syncAuthFromServer:401");
          setUser(null);
          setLoginPendingFlag(false);
          setIsAuthenticating(false);

          if (!isPublicRoute && !(authLoading || !authInitialized || isLoading)) {
            try {
              if (!isLandingPage) localStorage.setItem("postAuthRedirect", location);
            } catch {
              // ignore
            }
            setLocation("/");
          }
          return;
        }
      } catch (e) {
        // Network errors shouldn't wipe auth; just leave state as-is.
        console.warn("Auth sync failed (" + reason + "):", e);
      } finally {
        authSyncInFlightRef.current = false;
        if (expectedAuth) setIsVerifyingAuth(false);
      }
    },
    [
      clearLocalAuthState,
      hasLocalAuthEvidence,
      hasCachedUserData,
      isPublicRoute,
      isLandingPage,
      isSignupRoute,
      location,
      setLocation,
      authLoading,
      authInitialized,
      isLoading,
      markSessionVerified,
      clearSessionVerified,
      setLoginPendingFlag,
      stopAuthenticating,
      user?.id,
      loginPending,
      isAuthenticating,
    ],
  );

  // Session validity check on every navigation (web).
  useEffect(() => {
    if (isNativeIOSApp()) return;
    if (isSignupRoute) return;
    if (location.startsWith("/api/")) return;

    if (navSyncTimerRef.current) window.clearTimeout(navSyncTimerRef.current);
    navSyncTimerRef.current = window.setTimeout(() => {
      syncAuthFromServer({ reason: "navigation" });
    }, 50);

    return () => {
      if (navSyncTimerRef.current) window.clearTimeout(navSyncTimerRef.current);
    };
  }, [location, isSignupRoute, syncAuthFromServer]);

  // Revalidate on idle return / bfcache restore (web).
  useEffect(() => {
    if (isNativeIOSApp()) return;

    const onFocus = () => syncAuthFromServer({ reason: "focus" });
    const onVisibility = () => {
      if (document.visibilityState === "visible") syncAuthFromServer({ reason: "visible" });
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if ((e as any).persisted) syncAuthFromServer({ reason: "pageshow", force: true });
    };
    const onStorage = (e: StorageEvent) => {
      // If auth-related keys change in another tab, resync.
      const k = e.key || "";
      if (
        k === "user" ||
        k === "travelconnect_user" ||
        k === "auth_token" ||
        k === "current_user" ||
        k === "authUser" ||
        k === "currentUser"
      ) {
        syncAuthFromServer({ reason: "storage", force: true });
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("storage", onStorage);
    };
  }, [syncAuthFromServer]);

  useEffect(() => {
    // Explicit auth gate (web only): don't render protected routes (or "/") until
    // we have confirmed session state with the server.
    // Skip the loading gate if we already hydrated from cache — do a silent background check instead.
    if (!isNativeIOSApp() && !readSessionCache()) setAuthLoading(true);

    // Skip auth check for signup routes and public pages (but not root '/' which needs auth check for redirect)
    if (isSignupRoute || (isLandingPage && location !== '/')) {
      console.log('🔥 PUBLIC PAGE - skipping auth check:', location);
      setIsLoading(false);
      setAuthInitialized(true);
      setAuthLoading(false);
      return;
    }

    console.log('🚀 PRODUCTION CACHE BUST v2025-08-17-17-28 - Starting authentication check');

    // Check server-side session first (cookie/session is source of truth)
    const checkServerAuth = async () => {
      try {
        console.log('🔍 Checking server-side authentication...');
        const doCheck = async () =>
          fetch(`${getApiBaseUrl()}/api/auth/user`, {
            credentials: "include",
            headers: { Accept: "application/json" },
          });

        let response = await doCheck();

        // iOS WebView can sometimes lag cookie propagation; retry a few times before
        // concluding the session is missing. This does NOT trust localStorage as auth.
        if (isNativeIOSApp() && response.status === 401) {
          for (const delayMs of [200, 500, 800]) {
            await new Promise((r) => setTimeout(r, delayMs));
            response = await doCheck();
            if (response.ok) break;
          }
        }
        
        if (response.ok) {
          const serverUser = await response.json();
          console.log('✅ Server session found:', serverUser.username, 'ID:', serverUser.id);
          clearSessionInvalid();
          markSessionVerified();
          writeSessionCache(serverUser);
          setUser(serverUser);
          stopAuthenticating();
          setLoginPendingFlag(false);
          
          if (serverUser && !localStorage.getItem('welcomed_' + serverUser.id)) {
            console.log('🎉 New user detected - showing welcome');
            localStorage.setItem('welcomed_' + serverUser.id, 'true');
          }
          
          setIsLoading(false);
          setAuthInitialized(true);
          return;
        }
        
        if (response.status === 401) {
          const msSinceLogin = Date.now() - loginSucceededAtRef.current;
          if (msSinceLogin < 10_000) {
            console.log("Initial auth check: 401 within login grace period, skipping clear");
          } else {
            writeSessionCache(null);
            clearLocalAuthState("checkServerAuth:401");
            setUser(null);
            setLoginPendingFlag(false);
          }
        } else {
          console.log("⚠️ Server auth check returned non-OK:", response.status);
        }
      } catch (error) {
        console.log('❌ Server auth check failed:', error);
      }

      setIsLoading(false);
      setAuthInitialized(true);
    };

    checkServerAuth().finally(() => {
      setAuthLoading(false);
    });
  }, []);

  // Prevent protected-route redirect/layout flashes while auth is hydrating/validating (web).
  // Only decide "redirect to /auth" once loading is complete.
  const shouldGateAuthenticatedRendering =
    !isNativeIOSApp() &&
    // Only gate during initial hydration/first validation; don't block UI for background re-checks.
    (authLoading || !authInitialized || isLoading) &&
    // Gate protected routes, and also gate "/" so we don't render logged-out vs logged-in UI
    // before the session check completes.
    (!isPublicRoute || normalizedPath === "/");

  // Initialize WebSocket connection for authenticated users
  useEffect(() => {
    if (user && isAuthenticating) stopAuthenticating();
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
  }, [isAuthenticating, stopAuthenticating, user]);

  // REMOVED: Hydration from localStorage - it could show wrong user (e.g. admin) before
  // session check completes. Session is the only source of truth; wait for checkServerAuth.

  // Scroll to top when location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Native iOS: redirect / and /landing to /home in effect (not during render) to avoid Wouter render loop
  useEffect(() => {
    console.log('NATIVE ROOT REDIRECT EFFECT CHECK', { location });
    // Native iOS should never show marketing/landing pages (even if deep-linked)
    const nativeBlockedMarketingRoutes = new Set([
      '/',
      '',
      '/landing',
      '/landing-new',
      '/landing-simple',
      '/landing-minimal',
      '/landing-streamlined',
      '/landing-1',
      '/landing-2',
      '/locals-landing',
      '/travelers-landing',
      '/events-landing',
      '/business-landing',
      '/cs',
      '/couchsurfing',
      '/ambassador',
      '/ambassador-program',
    ]);

    if (isNativeIOSApp() && (nativeBlockedMarketingRoutes.has(location) || location.startsWith('/landing'))) {
      setLocation('/home');
    }
  }, [location, setLocation]);

  const authValue = React.useMemo(() => {
    // Robust authentication check that accounts for timing issues
    const actualAuth = !isSessionMarkedInvalid() && !!user?.id;

    return {
      user: user,
      setUser: (newUser: User | null) => {
        console.log('AuthContext setUser called with:', newUser?.username || 'null');
        setUser(newUser);
        if (!newUser?.id) clearSessionVerified();
      },
      isAuthenticating,
      setIsAuthenticating,
      startAuthenticating,
      stopAuthenticating,
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
        authStorage.clearUser();
        invalidateUserCache();
        clearSessionInvalid();
        markSessionVerified();
        loginSucceededAtRef.current = Date.now();
        setUser(userData);
      },
      isAuthenticated: actualAuth,
      // IMPORTANT: authLoading should reflect only initial hydration, not background re-verification.
      // Background session checks must not flip the whole UI into "Loading..." states.
      authLoading: authLoading || !authInitialized || isLoading,
    };
  }, [
    user,
    setLocation,
    queryClient,
    authLoading,
    authInitialized,
    isLoading,
    isAuthenticating,
    isSessionMarkedInvalid,
    isSessionVerified,
    clearSessionVerified,
    clearSessionInvalid,
    markSessionVerified,
    setIsAuthenticating,
    startAuthenticating,
    stopAuthenticating,
  ]);

  // Clear the auth-transition screen only after:
  // - we have a confirmed authenticated user, AND
  // - we've navigated off public/auth routes onto a protected route.
  useEffect(() => {
    if (!isAuthenticating) return;
    if (loginPending) return;
    if (!authValue.isAuthenticated) return;
    if (isAuthRoute) return;
    if (isPublicRoute) return;
    const t = window.setTimeout(() => setIsAuthenticating(false), 0);
    return () => window.clearTimeout(t);
  }, [
    isAuthenticating,
    loginPending,
    authValue.isAuthenticated,
    isAuthRoute,
    isPublicRoute,
  ]);

  // Post-auth redirect (used for invite links, etc.)
  useEffect(() => {
    if (!user?.id) return;
    // Only honor stored redirects when we're actually on the auth page.
    // Otherwise stale `postAuthRedirect` can hijack a fresh visit to `/`.
    if (normalizedPath !== "/auth") return;
    if (authValue.authLoading) return;
    if (!authValue.isAuthenticated) return;
    try {
      const next = localStorage.getItem("postAuthRedirect");
      if (next) {
        localStorage.removeItem("postAuthRedirect");
        setLocation(next);
      }
    } catch {
      // ignore storage errors
    }
  }, [user?.id, normalizedPath, authValue.authLoading, authValue.isAuthenticated, setLocation]);

  useEffect(() => {
    if (isNativeIOSApp()) return;
    if (authValue.authLoading) return;
    if (isAuthenticating) return;
    if (loginPending) return;
    if (isPublicRoute) return;
    if (authValue.isAuthenticated) return;
    if (Date.now() - loginSucceededAtRef.current < 10_000) return;

    try {
      localStorage.setItem("postAuthRedirect", location);
    } catch {
      // ignore storage errors
    }
    setLocation("/");
  }, [
    authValue.authLoading,
    authValue.isAuthenticated,
    isAuthenticating,
    loginPending,
    isPublicRoute,
    location,
    setLocation,
  ]);

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

    if (isAuthenticating || loginPending) {
      return <AuthTransitionScreen />;
    }

    // NATIVE APP: Never show marketing/landing; redirect is done in Router useEffect (avoids setLocation during render / loop)
    if (isNativeIOSApp()) {
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

    // Session-cookie-only auth: localStorage is NOT an auth source. If the server session
    // hasn't been verified in this tab, treat the user as logged out.
    const isActuallyAuthenticated = authValue.isAuthenticated || (!!effectiveUser && isSessionVerified()) || (Date.now() - loginSucceededAtRef.current < 10_000 && !!effectiveUser);

    if (!isActuallyAuthenticated && !isPublicRoute) {
      return <LandingStreamlined />;
    }

    // Legacy landing variants: keep routes but render the canonical landing
    if (location === '/landing-simple' || location === '/landing-minimal' || location === '/landing-streamlined' || location === '/landing-1' || location === '/landing-2') {
      return <LandingStreamlined />;
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
      if (location === '/events') {
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

      // Landing page variants (legacy): keep routes but render the canonical landing
      if (location === '/landing-1' || location === '/landing-2') {
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

      if (location === '/couchsurfing' || location === '/cs') {
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

      // Minimal/simple landing pages were experimental — keep routes but render canonical landing
      if (location === '/landing-minimal' || location === '/landing-simple') {
        return <LandingStreamlined />;
      }

      // Show appropriate page for root path based on authentication
      if (location === '/') {
        return isActuallyAuthenticated ? <Home /> : <LandingStreamlined />;
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
      if (location === '/ambassador') {
        return <AmbassadorLanding />;
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
      // Alias: /login should behave like /signin (requested by error recovery)
      if (location === '/login') {
        console.log('Showing Login page');
        return <Auth />;
      }
      if (location === '/launching-soon') {
        console.log('Showing Launching Soon page');
        return <LaunchingSoon />;
      }
      // Public trip invite landing (must work when logged out)
      if (location.startsWith('/join-trip/') || location.startsWith('/invite/')) {
        return <JoinTrip />;
      }
      if (location === '/business-card') {
        console.log('Returning BusinessCard component for /business-card - PUBLIC ACCESS');
        return <BusinessCardPage />;
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

    // Profile routes (fixes /profile/:username returning NotFound)
    const profilePath = (() => {
      const noHash = location.split('#')[0];
      const noQuery = noHash.split('?')[0];
      return (noQuery || '/');
    })();

    if (profilePath === '/profile') {
      return <ProfileComplete />;
    }

    if (profilePath.startsWith('/profile/')) {
      const rawIdent = profilePath.split('/')[2] || '';
      const decoded = decodeURIComponent(rawIdent);
      const ident = decoded.startsWith('@') ? decoded.slice(1) : decoded;
      if (!ident) return <NotFound />;
      const asNum = Number.parseInt(ident, 10);
      if (!Number.isNaN(asNum) && String(asNum) === ident) {
        return <ProfileComplete userId={asNum} />;
      }
      return <ProfileByUsername username={ident} />;
    }

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

    // Route alias: some parts of the app link to /quick-meetups/:id (no manage)
    // Normalize to the canonical query-based route handled by QuickMeetupsPage.
    if (location.startsWith('/quick-meetups/') && location.split('/')[2] && !location.includes('/manage')) {
      const rawId = location.split('/')[2] || '';
      const meetupId = rawId.split('?')[0].split('#')[0];
      if (meetupId) {
        setLocation(`/quick-meetups?id=${encodeURIComponent(meetupId)}`);
        return null;
      }
    }

    if (location.startsWith('/quick-meetup-chat/')) {
      const quickMeetId = location.split('/')[2];
      return <QuickMeetupChat />;
    }

    // Route alias: /event/:id → /events/:id
    if (location.startsWith('/event/') && location.split('/')[2]) {
      const rawId = location.split('/')[2] || '';
      const eventId = rawId.split('?')[0].split('#')[0];
      if (eventId) {
        setLocation(`/events/${encodeURIComponent(eventId)}`);
        return null;
      }
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
    if (location.startsWith('/dm-chat/') && location.split('/')[2]) {
      return <DMChat />;
    }
    if (location.startsWith('/chat/') && location.split('/')[2]) {
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

    if (location.startsWith('/join-trip/') || location.startsWith('/invite/')) {
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

    // Normalize for routing:
    // - Wouter `location` may include query strings and/or a trailing slash.
    // - Redirecting "unknown routes" to home caused mobile tabs to appear broken (e.g. `/messages?user=123`).
    const rawLocation = location;
    const normalizedLocation = (() => {
      const noHash = rawLocation.split('#')[0];
      const noQuery = noHash.split('?')[0];
      if (noQuery === '/') return '/';
      return (noQuery.replace(/\/+$/, '') || '/');
    })();

    // Home screen message links go to /messages?user=123 — must match so Messages page renders
    if (normalizedLocation === '/messages') {
      return <Messages />;
    }

    switch (normalizedLocation) {
      case '/events':
        return <Events />;
      case '/event-history':
        return <EventHistory />;
      case '/calendar':
        return <CalendarPage />;
      case '/events-landing':
        return <EventsLanding />;
      case '/business-landing':
        return <BusinessLanding />;
      case '/cs':
        return <CouchsurfingLanding />;
      case '/b':
        return <BusinessLanding />;
      case '/signup':
        return <ComingSoon />;
      case '/business-registration':
        return <BusinessRegistration />;
      // Profile routes handled before authentication check to prevent redirect loops
      case '/messages':
      case '/messages/':
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
      case '/activity':
        return <ActivityPage />;
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
      case '/ambassador':
        return <AmbassadorLanding />;
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
      case '/dashboard/ambassador':
        return <AmbassadorDashboard />;
      case '/ambassador-info':
        return <AmbassadorInfo />;
      case '/':
      case '/home':
        console.log('🏠 MOBILE: Rendering Home page for authenticated user');
        return <Home />;
      default:
        // Handle dynamic routes first before showing NotFound
        // Profile routes now handled before authentication check to prevent redirect loops
        if (normalizedLocation.startsWith('/events/')) {
          const eventId = normalizedLocation.split('/')[2];
          return <EventDetails eventId={eventId} />;
        }
        if (normalizedLocation.startsWith('/community/')) {
          const communityId = normalizedLocation.split('/')[2];
          if (communityId) {
            return <CommunityDetail communityId={parseInt(communityId)} />;
          }
        }
        if (normalizedLocation.startsWith('/city/')) {
          const pathParts = normalizedLocation.split('/');
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
          normalizedLocation.startsWith(route)
        );
        
        // Only redirect business users if route is NOT allowed
        if (effectiveUser?.userType === 'business' && normalizedLocation !== '/' && !isBusinessAllowedRoute) {
          console.log('🏢 BUSINESS USER: Unknown route detected (not whitelisted), redirecting to home page');
          setLocation(isNativeIOSApp() ? '/home' : '/');
          return null;
        }
        
        // If still unknown, do NOT redirect to home (causes "tab jumps to Home" on mobile).
        console.log('🚫 UNKNOWN ROUTE FOR AUTHENTICATED USER (no redirect):', { rawLocation, normalizedLocation });
        return <NotFound />;

    }
  };

  // IMPORTANT: Never return early before all hooks have run.
  // Returning early during auth init/resync changes hook count and causes React prod error #310.
  if (shouldGateAuthenticatedRendering) {
    return <FullPageSkeleton />;
  }

  // Don't render React app for API routes - let browser handle them
  if (location.startsWith('/api/')) {
    console.log('🔄 API ROUTE DETECTED - letting browser handle:', location);
    return null;
  }


  const hasAnyAuthEvidence = authValue.isAuthenticated || (Date.now() - loginSucceededAtRef.current < 10_000 && !!user?.id);

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
      ) : isAuthRoute ? (
        <>
          <Auth />
        </>
      ) : !hasAnyAuthEvidence ? (
        // Show appropriate page based on routing for unauthenticated users
        <>
          {console.log('🔍 APP ROUTING: User NOT authenticated, showing unauthenticated page for location:', location)}
          {renderPage()}
        </>
      ) : (
        // Show full app with navbar when ANY authentication evidence exists
        <>
          {console.log('🔍 APP ROUTING: Authentication evidence found, showing authenticated app for location:', location)}
          
          {/* Chat pages: fixed to viewport so absolutely nothing can scroll */}
          {isChatPage ? (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 40 }}>
              {!isNativeIOSApp() && <div className="hidden md:block"><Navbar /></div>}
              <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                {renderPage()}
              </div>
            </div>
          ) : (
            <>
              {/* Navigation - Navbar handles both mobile and desktop, hidden in native iOS */}
              {!isNativeIOSApp() && (
                <Navbar />
              )}
              <div className="min-h-screen w-full max-w-full bg-background text-foreground overflow-x-hidden">
                <main className={`w-full max-w-full overflow-x-hidden main-with-bottom-nav ${isNativeIOSApp() ? 'pt-0 pb-0' : 'pt-[56px] pb-[88px] md:pt-0 md:pb-20'}`}>
                  <div className="w-full max-w-full overflow-x-hidden">
                    {renderPage()}
                  </div>
                </main>
              </div>
            </>
          )}

          {/* REMOVED: Instant Messaging Components - obsolete functionality */}
        </>
      )}

      {/* Bottom Navigation - shows for authenticated users, hidden on mobile for chat pages */}
      {!isSignupRoute && !isNativeIOSApp() && authValue.isAuthenticated && (
        <MobileBottomNav hideOnMobile={isChatPage} />
      )}

      {/* Advanced Search for native iOS - web nav is hidden, so we render the widget here and open it via postMessage from native header */}
      {isNativeIOSApp() && !isSignupRoute && authValue.isAuthenticated && (
        <NativeIOSSearchWidget />
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

  // Disable floating chatbot on mobile/touch devices (including iPad/tablets),
  // not just small viewport widths.
  const [disableFloatingChatbot, setDisableFloatingChatbot] = React.useState(false);
  useEffect(() => {
    const compute = () => {
      if (typeof window === "undefined") return false;
      const ua = (navigator.userAgent || "").toLowerCase();
      const uaMobile =
        ua.includes("mobi") ||
        ua.includes("android") ||
        ua.includes("iphone") ||
        ua.includes("ipad") ||
        ua.includes("ipod");
      const coarsePointer =
        !!window.matchMedia &&
        (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches);
      const smallViewport = !!window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
      return uaMobile || coarsePointer || smallViewport;
    };

    const update = () => setDisableFloatingChatbot(compute());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    const mqCoarse = window.matchMedia?.("(pointer: coarse)");
    const mqSmall = window.matchMedia?.("(max-width: 768px)");
    mqCoarse?.addEventListener?.("change", update);
    mqSmall?.addEventListener?.("change", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      mqCoarse?.removeEventListener?.("change", update);
      mqSmall?.removeEventListener?.("change", update);
    };
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
      <ThemeProvider defaultTheme="dark" storageKey="nearby-traveler-theme">
        <TooltipProvider>
          <Toaster />
          <DarkModeSuggestionBanner />
          <Router />
          {!isNativeIOSApp() && !disableFloatingChatbot && (
            <div className="hidden md:block"><HelpChatbot /></div>
          )}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;