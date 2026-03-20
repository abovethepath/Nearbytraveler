import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/App";
import { isNativeIOSApp } from "@/lib/nativeApp";
import QRCode from "qrcode";

const DISMISS_KEY = "nt_pwa_banner_dismissed_at";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iP(hone|ad|od)/.test(ua) && /WebKit/.test(ua) && !/(CriOS|FxiOS|OPiOS|EdgiOS)/.test(ua);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

/** Desktop QR banner */
function DesktopBanner({ onDismiss }: { onDismiss: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, "https://nearbytraveler.org", {
        width: 120,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      }).catch(() => {});
    }
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 hidden md:block">
      <div className="bg-gray-900 border-t border-gray-700 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <canvas ref={canvasRef} className="rounded-lg shrink-0" />
            <div>
              <p className="text-white text-sm font-medium">
                Get Nearby Traveler on your phone — no app store needed!
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Scan with your phone camera
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white p-1 shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** iOS Safari banner */
function IOSBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed bottom-[60px] left-0 right-0 z-50 md:hidden">
      <div className="bg-gray-900 border-t border-gray-700 px-4 py-3 mx-2 mb-1 rounded-xl shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm leading-snug">
              Tap <span className="inline-block text-blue-400">⬆️ Share</span> then <strong>"Add to Home Screen"</strong> for push notifications & app icon
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white p-0.5 shrink-0 mt-0.5"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Android install banner */
function AndroidBanner({
  onInstall,
  onDismiss,
}: {
  onInstall: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed bottom-[60px] left-0 right-0 z-50 md:hidden">
      <div className="bg-gray-900 border-t border-gray-700 px-4 py-3 mx-2 mb-1 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm">
              Install Nearby Traveler for the best experience
            </p>
          </div>
          <button
            onClick={onInstall}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg shrink-0"
          >
            Install App
          </button>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white p-0.5 shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function PWAInstallBanner() {
  const { isAuthenticated } = useAuth();
  const [dismissed, setDismissed] = useState(true); // default hidden
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  // Determine platform once
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const isIOS = isIOSSafari();
  const isPWA = isStandalone();

  // Desktop: check 7-day localStorage dismiss
  useEffect(() => {
    if (isNativeIOSApp() || isPWA || !isAuthenticated) return;

    if (!isMobile) {
      // Desktop: localStorage 7-day dismiss
      try {
        const raw = localStorage.getItem(DISMISS_KEY);
        if (raw) {
          const ts = Number(raw);
          if (Date.now() - ts < SEVEN_DAYS_MS) return;
        }
      } catch {}
      setDismissed(false);
    } else if (isIOS) {
      // iOS: sessionStorage dismiss
      try {
        if (sessionStorage.getItem(DISMISS_KEY)) return;
      } catch {}
      setDismissed(false);
    }
    // Android: handled by beforeinstallprompt
  }, [isAuthenticated, isMobile, isIOS, isPWA]);

  // Android: listen for beforeinstallprompt
  useEffect(() => {
    if (isNativeIOSApp() || isPWA || !isAuthenticated) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setDismissed(false);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Hide after install
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setInstallPrompt(null);
      setDismissed(true);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isAuthenticated, isPWA]);

  if (dismissed || installed || !isAuthenticated || isNativeIOSApp() || isPWA) {
    return null;
  }

  const handleDismissDesktop = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  };

  const handleDismissIOS = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch {}
  };

  const handleInstallAndroid = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") {
      setInstalled(true);
    }
    setInstallPrompt(null);
    setDismissed(true);
  };

  // Desktop: show QR code banner
  if (!isMobile) {
    return <DesktopBanner onDismiss={handleDismissDesktop} />;
  }

  // iOS Safari: show Add to Home Screen instructions
  if (isIOS) {
    return <IOSBanner onDismiss={handleDismissIOS} />;
  }

  // Android: show native install prompt
  if (installPrompt) {
    return (
      <AndroidBanner onInstall={handleInstallAndroid} onDismiss={() => setDismissed(true)} />
    );
  }

  return null;
}
