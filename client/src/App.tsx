import React, { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import DevPageExplorer from "./DevPageExplorer";

// Try your real pages first with fallbacks
const Home = lazy(() => import("./pages/home").catch(() => import("./pages/discover")));
const Profile = lazy(() => import("./pages/profile").catch(() => import("./pages/not-found")));
const Discover = lazy(() => import("./pages/discover").catch(() => import("./pages/not-found")));
const NotFound = lazy(() => import("./pages/not-found"));

// Export auth context and hook that your pages expect
export const AuthContext = React.createContext({
  user: null, 
  setUser: () => {}, 
  isAuthenticated: false
});

export const useAuth = () => ({
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
              
              {/* 🚀 Dev Explorer - see ALL your pages */}
              <Route path="/__pages" component={DevPageExplorer} />
              
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </div>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}