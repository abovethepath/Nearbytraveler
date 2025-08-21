// client/src/App.tsx
// keep back-compat exports so code that does `import { AuthContext, useAuth } from "@/App"` keeps working
export { AuthContext, useAuth, AuthProvider } from "./auth-context";

import React, { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import AppShell from "./ui/AppShell";
import GlobalHotfixes from "./GlobalHotfixes";

// ---- REAL PAGES (relative paths from Dev Explorer list) ----
const About                 = lazy(() => import("./pages/about"));
const ProfilePage           = lazy(() => import("./pages/ProfilePageResponsive"));
const Chatroom              = lazy(() => import("./pages/chatroom"));
const CityChatrooms         = lazy(() => import("./pages/city-chatrooms"));
const EventsListResponsive  = lazy(() => import("./pages/EventsListResponsive"));
const TravelIntentQuiz      = lazy(() => import("./pages/TravelIntentQuiz"));
const BusinessDashboard     = lazy(() => import("./pages/business-dashboard"));
const BusinessLanding       = lazy(() => import("./pages/business-landing"));
const BusinessOffers        = lazy(() => import("./pages/business-offers"));
const BusinessProfile       = lazy(() => import("./pages/business-profile"));
const BusinessRegistration  = lazy(() => import("./pages/business-registration"));
const AuthPage              = lazy(() => import("./pages/auth"));
const AiCompanion           = lazy(() => import("./pages/ai-companion"));
// Fallback if a page is missing
const NotFound              = lazy(() => import("./pages/about"));

export default function App() {
  return (
    <AppShell>
      <GlobalHotfixes />
      <Suspense fallback={<div className="p-4">Loading…</div>}>
        <Switch>
          {/* HOME */}
          <Route path="/" component={About} />

          {/* PROFILE */}
          <Route path="/profile/:id">
            {params => <ProfilePage userId={Number(params.id)} />}
          </Route>

          {/* CHATROOMS */}
          <Route path="/chatroom" component={Chatroom} />
          <Route path="/chatrooms/:city" component={CityChatrooms as any} />

          {/* DISCOVERY / EVENTS / QUIZ */}
          <Route path="/events" component={EventsListResponsive} />
          <Route path="/quiz" component={TravelIntentQuiz} />

          {/* BUSINESS */}
          <Route path="/business-dashboard" component={BusinessDashboard} />
          <Route path="/business-landing"   component={BusinessLanding} />
          <Route path="/business-offers"    component={BusinessOffers} />
          <Route path="/business-profile"   component={BusinessProfile} />
          <Route path="/business-registration" component={BusinessRegistration} />

          {/* AUTH & TOOLS */}
          <Route path="/auth" component={AuthPage} />
          <Route path="/ai-companion" component={AiCompanion} />

          {/* 404 */}
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AppShell>
  );
}