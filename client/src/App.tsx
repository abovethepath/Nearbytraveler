// client/src/App.tsx
// Back-compat exports so existing imports still work
export { AuthContext, useAuth, AuthProvider } from "./auth-context";

import React, { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import AppShell from "./ui/AppShell";
import GlobalHotfixes from "./GlobalHotfixes";

// ✅ Use your real Home
const Home                 = lazy(() => import("./pages/home"));
// Keep About but NOT as the default route
const About                = lazy(() => import("./pages/about"));

// Other pages you listed
const ProfilePage          = lazy(() => import("./pages/ProfilePageResponsive"));
const Chatroom             = lazy(() => import("./pages/chatroom"));
const CityChatrooms        = lazy(() => import("./pages/city-chatrooms"));
const EventsListResponsive = lazy(() => import("./pages/EventsListResponsive"));
const TravelIntentQuiz     = lazy(() => import("./pages/TravelIntentQuiz"));
const BusinessDashboard    = lazy(() => import("./pages/business-dashboard"));
const BusinessLanding      = lazy(() => import("./pages/business-landing"));
const BusinessOffers       = lazy(() => import("./pages/business-offers"));
const BusinessProfile      = lazy(() => import("./pages/business-profile"));
const BusinessRegistration = lazy(() => import("./pages/business-registration"));
const AuthPage             = lazy(() => import("./pages/auth"));
const AiCompanion          = lazy(() => import("./pages/ai-companion"));
const NotFound             = lazy(() => import("./pages/home"));

export default function App() {
  return (
    <AppShell>
      <GlobalHotfixes />
      <Suspense fallback={
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          fontFamily: 'Arial', 
          backgroundColor: '#f0f8ff',
          minHeight: '100vh'
        }}>
          <h1 style={{ color: '#007bff', fontSize: '2.5rem', marginBottom: '20px' }}>
            🚀 Nearby Traveler Platform
          </h1>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '30px', 
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>✅ Your Travel Platform is LIVE!</h2>
            <p style={{ fontSize: '1.2rem', color: '#666', lineHeight: '1.6' }}>
              Loading your complete travel platform with 13+ users, events, business offers, and AI recommendations...
            </p>
            <div style={{ 
              background: 'linear-gradient(45deg, #007bff, #0056b3)', 
              height: '4px', 
              borderRadius: '2px',
              margin: '20px 0',
              animation: 'pulse 1.5s infinite'
            }}></div>
          </div>
        </div>
      }>
        <Switch>
          {/* ✅ REAL HOME */}
          <Route path="/" component={Home} />

          {/* About is available explicitly */}
          <Route path="/about" component={About} />

          {/* Profile */}
          <Route path="/profile/:id" component={ProfilePage} />

          {/* Chatrooms */}
          <Route path="/chatroom" component={Chatroom} />
          <Route path="/chatrooms/:city" component={CityChatrooms as any} />

          {/* Discovery / Events / Quiz */}
          <Route path="/events" component={EventsListResponsive} />
          <Route path="/quiz" component={TravelIntentQuiz} />

          {/* Business */}
          <Route path="/business-dashboard" component={BusinessDashboard} />
          <Route path="/business-landing" component={BusinessLanding} />
          <Route path="/business-offers">
            {() => <BusinessOffers />}
          </Route>
          <Route path="/business-profile" component={BusinessProfile} />
          <Route path="/business-registration" component={BusinessRegistration} />

          {/* Auth & tools */}
          <Route path="/auth" component={AuthPage} />
          <Route path="/ai-companion" component={AiCompanion} />

          {/* 404 */}
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AppShell>
  );
}