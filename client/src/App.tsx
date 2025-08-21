import React, { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Import your REAL travel platform pages
const Home = lazy(() => import("./pages/home"));
const BusinessDashboard = lazy(() => import("./pages/business-dashboard"));
const Profile = lazy(() => import("./pages/profile"));
const Discover = lazy(() => import("./pages/discover"));
const Events = lazy(() => import("./pages/events"));

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <Suspense fallback={<div className="p-4 text-center">Loading your travel platform...</div>}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/business" component={BusinessDashboard} />
            <Route path="/profile/:id?">
              {(params) => <Profile userId={params.id ? Number(params.id) : undefined} />}
            </Route>
            <Route path="/discover" component={Discover} />
            <Route path="/events" component={Events} />
            <Route>
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Nearby Traveler</h1>
                <p>Page not found. Try:</p>
                <ul className="mt-4 space-y-2">
                  <li><a href="/" className="text-blue-600 hover:underline">Home</a></li>
                  <li><a href="/business" className="text-blue-600 hover:underline">Business Dashboard</a></li>
                  <li><a href="/discover" className="text-blue-600 hover:underline">Discover</a></li>
                  <li><a href="/events" className="text-blue-600 hover:underline">Events</a></li>
                </ul>
              </div>
            </Route>
          </Switch>
        </Suspense>
      </div>
    </QueryClientProvider>
  );
}