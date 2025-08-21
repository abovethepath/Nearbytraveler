export { AuthContext, useAuth, AuthProvider } from "./auth-context"; // ⬅️ Re-export for back-compat

import React, { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import AppShell from "./ui/AppShell";
import GlobalHotfixes from "./GlobalHotfixes";
import DevPageExplorer from "./DevPageExplorer";

// Import your actual travel platform pages
const Home = lazy(() => import("./pages/home"));
const BusinessDashboard = lazy(() => import("./pages/business-dashboard"));
const Profile = lazy(() => import("./pages/profile"));
const Discover = lazy(() => import("./pages/discover"));
const Events = lazy(() => import("./pages/events"));
const CityChatrooms = lazy(() => import("./pages/city-chatrooms"));
const NotFound = lazy(() => import("./pages/not-found").catch(() => import("./DevPageExplorer")));

export default function App() {
  return (
    <AppShell>
      <GlobalHotfixes />
      <Suspense fallback={<div className="p-4">Loading your travel platform...</div>}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/business" component={BusinessDashboard} />
          <Route path="/profile/:id?">{(p) => <Profile userId={p.id ? Number(p.id) : undefined} />}</Route>
          <Route path="/discover" component={Discover} />
          <Route path="/events" component={Events} />
          <Route path="/chatrooms/:city" component={CityChatrooms as any} />
          <Route path="/__pages" component={DevPageExplorer} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AppShell>
  );
}