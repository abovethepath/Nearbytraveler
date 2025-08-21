import React, { Suspense, lazy, createContext, useContext, useState, useEffect } from "react";
import { Route, Switch } from "wouter";
import AppShell from "@/ui/AppShell";
import GlobalHotfixes from "@/GlobalHotfixes";
import { authStorage } from "@/lib/auth";
import type { User } from "@shared/schema";

// Lazy load pages for better performance
const Home = lazy(() => import("@/pages/Home"));
const Profile = lazy(() => import("@/pages/Profile"));
const Discover = lazy(() => import("@/pages/Discover"));
const Messages = lazy(() => import("@/pages/Messages"));
const Events = lazy(() => import("@/pages/Events"));
const Connect = lazy(() => import("@/pages/Connect"));
const Auth = lazy(() => import("@/pages/Auth"));
const NotFound = lazy(() => import("@/pages/NotFound"));

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

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  // Initialize auth on mount
  useEffect(() => {
    console.log("🔐 Initializing authentication...");
    const initAuth = async () => {
      try {
        const userData = await authStorage.getUser();
        if (userData) {
          setUser(userData);
          console.log("✅ User authenticated:", userData.username);
        }
      } catch (error) {
        console.warn("⚠️ Auth initialization failed:", error);
      }
    };
    initAuth();
  }, []);

  const authValue = {
    user,
    setUser: (userData: User | null) => {
      setUser(userData);
      if (userData) {
        authStorage.setUser(userData);
        console.log("✅ User session updated:", userData.username);
      } else {
        authStorage.clearUser();
        console.log("🔐 User logged out");
      }
    },
    isAuthenticated: !!user,
  };

  console.log("🚀 Rendering full travel platform...");

  return (
    <AuthContext.Provider value={authValue}>
      <AppShell>
        <GlobalHotfixes />
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-pulse text-2xl font-bold text-blue-600 mb-2">
                🧳 Nearby Traveler
              </div>
              <div className="text-gray-600">Loading your travel platform...</div>
            </div>
          </div>
        }>
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
  );
}