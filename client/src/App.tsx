import React, { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// ✅ Use your REAL travel platform pages
const Home = lazy(() => import("./pages/home"));
const Profile = lazy(() => import("./pages/profile"));
const Discover = lazy(() => import("./pages/discover"));
const NotFound = lazy(() => import("./pages/not-found"));

// Minimal auth context for compatibility
export const AuthContext = React.createContext({
  user: null, 
  setUser: () => {}, 
  isAuthenticated: false
});

export default function App() {
  React.useEffect(() => {
    console.log("✅ CRITICAL MOBILE LAYOUT v6-20250705 - SITE-WIDE FIXES DEPLOYED");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user: null, setUser: () => {}, isAuthenticated: false }}>
        <div className="min-h-screen bg-white dark:bg-gray-900">
          <Suspense fallback={<div className="p-4 text-center">Loading…</div>}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/profile/:id">
                {(params) => <Profile userId={Number(params.id)} />}
              </Route>
              <Route path="/discover" component={Discover} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </div>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}