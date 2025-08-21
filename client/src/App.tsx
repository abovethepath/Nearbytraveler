export { AuthContext } from "./auth-context"; // keep for backwards compatibility

import React, { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import AppShell from "./ui/AppShell";
import GlobalHotfixes from "./GlobalHotfixes";
import DevPageExplorer from "./DevPageExplorer";

// ✅ Use RELATIVE imports that match your actual pages:
const Home = lazy(() => import("./pages/home"));                         // your main travel platform
const BusinessDashboard = lazy(() => import("./pages/business-dashboard")); // business features
const Profile = lazy(() => import("./pages/profile"));                   // user profiles
const Discover = lazy(() => import("./pages/discover"));                 // discover travelers
const Events = lazy(() => import("./pages/events"));                     // events page
const CityChatrooms = lazy(() => import("./pages/city-chatrooms"));      // chatrooms
const NotFound = lazy(() => import("./pages/not-found").catch(() => import("./DevPageExplorer")));

export default function App() {
  return (
    <AppShell>
      <GlobalHotfixes />
      <Suspense fallback={<div className="p-4">Loading your travel platform...</div>}>
        <Switch>
          {/* Your main travel platform */}
          <Route path="/" component={Home} />

          {/* Business features */}
          <Route path="/business" component={BusinessDashboard} />

          {/* Profile (by id) */}
          <Route path="/profile/:id?">
            {(params) => <Profile userId={params.id ? Number(params.id) : undefined} />}
          </Route>

          {/* Discover travelers */}
          <Route path="/discover" component={Discover} />
          
          {/* Events */}
          <Route path="/events" component={Events} />

          {/* Chatrooms */}
          <Route path="/chatrooms/:city" component={CityChatrooms as any} />

          {/* Keep the explorer ONLY for debugging */}
          <Route path="/__pages" component={DevPageExplorer} />

          {/* 404 */}
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AppShell>
  );
}