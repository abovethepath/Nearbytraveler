import { useEffect } from "react";
import { AuthProvider } from "../auth-context";

export default function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVH();
    window.addEventListener("resize", setVH);
    return () => window.removeEventListener("resize", setVH);
  }, []);

  return (
    <AuthProvider>
      <div className="app-shell min-h-[calc(var(--vh)*100)] w-full overflow-x-clip">
        {children}
      </div>
    </AuthProvider>
  );
}