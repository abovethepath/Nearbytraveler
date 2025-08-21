// Export auth context for backwards compatibility
export { AuthContext, useAuth, AuthProvider } from "./auth-context";

// Direct import to your REAL 4-month home page
import Home from "./pages/home";
import AppShell from "./ui/AppShell";

export default function App() {
  return (
    <AppShell>
      <Home />
    </AppShell>
  );
}