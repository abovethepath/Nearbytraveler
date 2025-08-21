import React from "react";
import AppShell from "./ui/AppShell";
import GlobalHotfixes from "./GlobalHotfixes";
import DevPageExplorer from "./DevPageExplorer";

// Auth context for compatibility
export const AuthContext = React.createContext({
  user: null, 
  setUser: () => {}, 
  isAuthenticated: false
});

export default function App() {
  return (
    <AppShell>
      <GlobalHotfixes />
      <DevPageExplorer />
    </AppShell>
  );
}