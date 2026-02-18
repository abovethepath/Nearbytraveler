import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/App";
import { getApiBaseUrl } from "@/lib/queryClient";
import { isNativeIOSApp } from "@/lib/nativeApp";

const POLL_INTERVAL_MS = 800;
const MAX_ATTEMPTS = 25;

/**
 * iOS-only post-signup interstitial. Waits for auth + profile readiness then navigates to /home.
 * Web users never hit this in normal flow (account-success sends them to /profile). If a web user
 * lands here (e.g. direct URL), redirect to /profile so the website is unaffected.
 */
export default function FinishingSetup() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const [message, setMessage] = useState("Creating your profile…");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [done, setDone] = useState(false);
  const mounted = useRef(true);

  // iOS only: on web, redirect immediately so website flow is never affected
  useEffect(() => {
    if (!isNativeIOSApp()) {
      setLocation("/profile");
    }
  }, [setLocation]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isNativeIOSApp() || error || done) return;

    const timer = setTimeout(async () => {
      if (!mounted.current) return;
      const nextAttempt = attempt + 1;
      setAttempt(nextAttempt);

      try {
        // 1) Session/user must be ready
        const authRes = await fetch(`${getApiBaseUrl()}/api/auth/user`, {
          credentials: "include",
        });
        if (!authRes.ok) {
          if (mounted.current && nextAttempt >= MAX_ATTEMPTS) {
            setError("Something took longer than expected. Tap Retry to try again.");
          }
          return;
        }
        const serverUser = await authRes.json();
        if (!serverUser?.id) {
          if (mounted.current && nextAttempt >= MAX_ATTEMPTS) {
            setError("Profile isn’t ready yet. Tap Retry to try again.");
          }
          return;
        }

        // 2) Profile must be ready — same endpoint Home uses first (avoids 401/404 bounce)
        const profileRes = await fetch(
          `${getApiBaseUrl()}/api/users/${serverUser.id}`,
          { credentials: "include" }
        );
        if (!profileRes.ok) {
          if (mounted.current && nextAttempt >= MAX_ATTEMPTS) {
            setError("Profile isn’t ready yet. Tap Retry to try again.");
          }
          return;
        }
        const profile = await profileRes.json();
        if (!profile?.id) {
          if (mounted.current && nextAttempt >= MAX_ATTEMPTS) {
            setError("Profile isn’t ready yet. Tap Retry to try again.");
          }
          return;
        }

        if (!mounted.current) return;
        setDone(true);
        setUser(serverUser);
        try {
          localStorage.setItem("user", JSON.stringify(serverUser));
        } catch (_) {}
        setMessage("Taking you home…");
        setTimeout(() => {
          if (mounted.current) setLocation("/home");
        }, 400);
      } catch (e) {
        if (mounted.current && nextAttempt >= MAX_ATTEMPTS) {
          setError("Connection issue. Tap Retry to try again.");
        }
      }
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [attempt, error, done, setUser, setLocation]);

  const handleRetry = () => {
    setError(null);
    setDone(false);
    setAttempt(0);
    setMessage("Creating your profile…");
  };

  // Don't render interstitial on web; redirect is handled in useEffect
  if (!isNativeIOSApp()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex flex-col items-center justify-center p-6">
      {error ? (
        <>
          <p className="text-center text-gray-700 dark:text-gray-300 mb-6 max-w-sm">
            {error}
          </p>
          <button
            onClick={handleRetry}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </>
      ) : (
        <>
          <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
          <p className="text-center text-gray-700 dark:text-gray-300 max-w-sm">
            {message}
          </p>
        </>
      )}
    </div>
  );
}
