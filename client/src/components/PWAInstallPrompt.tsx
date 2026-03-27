import { useState, useEffect, useRef } from "react";
import { X, Smartphone, Share, Plus, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DISMISS_KEY = "nt_pwa_install_dismissed_at";
const ONE_DAY = 24 * 60 * 60 * 1000;

function isDismissedToday(): boolean {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - ts < ONE_DAY;
  } catch { return false; }
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches
    || (navigator as any).standalone === true;
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

function isMobileDevice(): boolean {
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent) && window.innerWidth < 768;
}

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    if (!isMobileDevice() || isStandalone() || isDismissedToday()) return;

    // Capture Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show after 30 seconds of engagement
    const timer = setTimeout(() => {
      if (!isStandalone() && !isDismissedToday()) setShow(true);
    }, 30000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  };

  const handleInstall = async () => {
    if (deferredPromptRef.current) {
      // Android — trigger native prompt
      deferredPromptRef.current.prompt();
      const result = await deferredPromptRef.current.userChoice;
      if (result.outcome === "accepted") dismiss();
      deferredPromptRef.current = null;
    } else {
      // iOS or no native prompt — show guide
      setShowGuide(true);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* Floating banner */}
      <div className="fixed bottom-20 left-3 right-3 z-[9998] animate-in slide-in-from-bottom duration-500">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-orange-300/30">
          <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-pink-500 p-4 relative">
            <button onClick={dismiss} className="absolute top-2 right-2 text-white/60 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">Get the NearbyTraveler App!</p>
                <p className="text-white/80 text-xs">No app store needed — install in seconds</p>
              </div>
            </div>
            <Button
              onClick={handleInstall}
              className="w-full mt-3 bg-white text-orange-600 hover:bg-orange-50 font-bold text-sm py-2.5 rounded-xl shadow-lg"
              style={{ animation: "pulse 2s ease-in-out infinite" }}
            >
              Add to My Phone
            </Button>
          </div>
        </div>
      </div>

      {/* iOS/Android instruction guide */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="sm:max-w-sm bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-lg text-center">Add to Your Home Screen</DialogTitle>
          </DialogHeader>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 -mt-2">It takes 10 seconds!</p>

          {isIOS() ? (
            <div className="space-y-5 py-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-sm font-bold text-blue-600">1</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Tap the Share button</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                    The <Share className="w-3.5 h-3.5 inline" /> icon at the bottom of Safari
                  </p>
                  <ArrowDown className="w-4 h-4 text-blue-500 mt-1 animate-bounce" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-sm font-bold text-blue-600">2</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Scroll down and tap</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 inline" /> "Add to Home Screen"
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 text-sm font-bold text-green-600">3</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Tap "Add" — done!</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 py-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-sm font-bold text-blue-600">1</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Tap the menu</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">The three dots (⋮) in the top right of Chrome</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-sm font-bold text-blue-600">2</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Tap "Add to Home screen"</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 text-sm font-bold text-green-600">3</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Tap "Add" — done!</p>
                </div>
              </div>
            </div>
          )}

          <Button onClick={() => { setShowGuide(false); dismiss(); }} variant="outline" className="w-full mt-2">
            Got it!
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
