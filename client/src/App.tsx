import React, { Suspense, lazy, createContext, useContext, useState, useEffect } from "react";
import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import AppShell from "@/ui/AppShell";
import GlobalHotfixes from "@/GlobalHotfixes";
import { authStorage } from "@/lib/auth";
import type { User } from "@shared/schema";

// AuthContext for compatibility with existing pages
export const AuthContext = createContext<{
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
}>({
  user: null,
  setUser: () => {},
  isAuthenticated: false,
});

// useAuth hook for compatibility
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthContext provider");
  }
  return context;
};

// 🔽 Lazy pages - safely loaded with your existing pages
const Home = lazy(() => import("@/pages/home"));
const Profile = lazy(() => import("@/pages/ProfilePageResponsive"));
const Discover = lazy(() => import("@/pages/discover"));
const Messages = lazy(() => import("@/pages/messages"));
const Events = lazy(() => import("@/pages/events"));
const Connect = lazy(() => import("@/pages/connect"));
const Auth = lazy(() => import("@/pages/auth"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize user from storage
    const storedUser = authStorage.getUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const authValue = {
    user,
    setUser: (newUser: User | null) => {
      setUser(newUser);
      authStorage.setUser(newUser);
    },
    isAuthenticated: !!user,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <AppShell>
          <GlobalHotfixes />
          <Suspense fallback={<div className="p-4 text-center">Loading…</div>}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/profile/:id?">
                {(params) => <Profile userId={params.id ? Number(params.id) : undefined} />}
              </Route>
              <Route path="/discover" component={Discover} />
              <Route path="/messages" component={Messages} />
              <Route path="/events" component={Events} />
              <Route path="/connect" component={Connect} />
              <Route path="/auth" component={Auth} />
              
              {/* Fallback */}
              <Route>
                <NotFound />
              </Route>
            </Switch>
          </Suspense>
        </AppShell>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}