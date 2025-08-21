import React, { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import AppShell from "./ui/AppShell";

// ✅ REAL PAGES - Your 4-month project
const Home = lazy(() => import("./pages/home"));
const About = lazy(() => import("./pages/about"));
const ProfilePage = lazy(() => import("./pages/ProfilePageResponsive"));
const Chatroom = lazy(() => import("./pages/chatroom"));
const CityChatrooms = lazy(() => import("./pages/city-chatrooms"));
const EventsListResponsive = lazy(() => import("./pages/EventsListResponsive"));
const TravelIntentQuiz = lazy(() => import("./pages/TravelIntentQuiz"));
const BusinessDashboard = lazy(() => import("./pages/business-dashboard"));
const BusinessLanding = lazy(() => import("./pages/business-landing"));
const BusinessOffers = lazy(() => import("./pages/business-offers"));
const BusinessProfile = lazy(() => import("./pages/business-profile"));
const BusinessRegistration = lazy(() => import("./pages/business-registration"));
const AuthPage = lazy(() => import("./pages/auth"));
const AiCompanion = lazy(() => import("./pages/ai-companion"));

// Export your auth context for other files
export { AuthContext, useAuth, AuthProvider } from "./auth-context";

export default function App() {
  return (
    <AppShell>
      <Suspense fallback={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0f172a',
          color: '#60a5fa',
          fontSize: '1.5rem',
          fontFamily: 'system-ui, sans-serif'
        }}>
          🧳 Loading Nearby Traveler...
        </div>
      }>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/profile/:id" component={ProfilePage} />
          <Route path="/chatroom" component={Chatroom} />
          <Route path="/chatrooms/:city" component={CityChatrooms} />
          <Route path="/events" component={EventsListResponsive} />
          <Route path="/quiz" component={TravelIntentQuiz} />
          <Route path="/business-dashboard" component={BusinessDashboard} />
          <Route path="/business-landing" component={BusinessLanding} />
          <Route path="/business-offers">
            {() => <BusinessOffers />}
          </Route>
          <Route path="/business-profile" component={BusinessProfile} />
          <Route path="/business-registration" component={BusinessRegistration} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/ai-companion" component={AiCompanion} />
          <Route component={Home} />
        </Switch>
      </Suspense>
    </AppShell>
  );
}