import { useState, useEffect } from "react";
import { X, Smartphone, Share, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DISMISS_KEY = "nt_pwa_desktop_dismissed_at";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function isDismissed(): boolean {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - ts < SEVEN_DAYS;
  } catch { return false; }
}

function isDesktop(): boolean {
  return window.innerWidth >= 768 && !/android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches
    || (navigator as any).standalone === true;
}

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!isDesktop() || isStandalone() || isDismissed()) return;
    const timer = setTimeout(() => setShow(true), 15000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  };

  if (!show) return null;

  return (
    <>
      {/* Full-width bottom banner — impossible to miss */}
      <div className="fixed bottom-0 left-0 right-0 z-[9998] animate-in slide-in-from-bottom duration-700">
        <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-pink-500 shadow-[0_-4px_20px_rgba(249,115,22,0.4)]">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
            {/* Icon */}
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0"
              style={{ animation: "pulse 2s ease-in-out infinite" }}>
              <Smartphone className="w-6 h-6 text-white" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm md:text-base leading-tight">
                Did you know? You can add NearbyTraveler to your phone like an app!
              </p>
              <p className="text-white/80 text-xs md:text-sm">No app store needed — works on iPhone & Android</p>
            </div>

            {/* CTA button */}
            <Button
              onClick={() => setShowGuide(true)}
              className="bg-white text-orange-600 hover:bg-orange-50 font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shrink-0"
            >
              Show Me How
            </Button>

            {/* Dismiss */}
            <button onClick={dismiss} className="text-white/50 hover:text-white shrink-0 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Instructions modal */}
      <Dialog open={showGuide} onOpenChange={(open) => { setShowGuide(open); if (!open) dismiss(); }}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-900 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-center flex items-center justify-center gap-2">
              <Smartphone className="w-5 h-5 text-orange-500" />
              Get NearbyTraveler on Your Phone
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 -mt-1">Takes 10 seconds — no app store needed</p>

          {/* iPhone */}
          <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4 text-base">
              <span className="text-xl">🍎</span> iPhone (Safari)
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 text-sm font-bold text-white shadow">1</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Open in Safari</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Go to <strong>nearbytraveler.org</strong> on your iPhone</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 text-sm font-bold text-white shadow">2</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                    Tap the Share button <Share className="w-4 h-4 text-blue-500" />
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">The square with an arrow at the bottom of Safari</p>
                  <ArrowDown className="w-4 h-4 text-blue-500 mt-1 animate-bounce" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 text-sm font-bold text-white shadow">3</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Tap "Add to Home Screen"</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Scroll down in the share menu to find it</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0 text-sm font-bold text-white shadow">4</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Tap "Add" — you're done!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Android */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4 text-base">
              <span className="text-xl">🤖</span> Android (Chrome)
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 text-sm font-bold text-white shadow">1</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Open in Chrome</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Go to <strong>nearbytraveler.org</strong> on your phone</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 text-sm font-bold text-white shadow">2</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Tap the three dots menu ⋮</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">In the top right corner of Chrome</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 text-sm font-bold text-white shadow">3</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Tap "Add to Home screen"</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0 text-sm font-bold text-white shadow">4</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Tap "Add" — you're done!</p>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={() => { setShowGuide(false); dismiss(); }} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold mt-2">
            Got it — I'll do it now!
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
