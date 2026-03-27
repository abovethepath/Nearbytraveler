import { useState, useEffect } from "react";
import { X, Smartphone } from "lucide-react";
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
    // Show after 30 seconds
    const timer = setTimeout(() => setShow(true), 30000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  };

  if (!show) return null;

  return (
    <>
      {/* Desktop banner — top right floating card */}
      <div className="fixed top-20 right-4 z-[9998] w-80 animate-in slide-in-from-right duration-500">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-orange-200 dark:border-orange-700/50 bg-white dark:bg-gray-900">
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-3 flex items-center gap-3 relative">
            <button onClick={dismiss} className="absolute top-2 right-2 text-white/60 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Take NearbyTraveler with you!</p>
              <p className="text-white/80 text-[11px]">Add it to your phone — no app store needed</p>
            </div>
          </div>
          <div className="p-3">
            <Button
              onClick={() => setShowGuide(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-xl"
            >
              Show me how
            </Button>
          </div>
        </div>
      </div>

      {/* Instructions modal */}
      <Dialog open={showGuide} onOpenChange={(open) => { setShowGuide(open); if (!open) dismiss(); }}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-lg text-center">Add NearbyTraveler to Your Phone</DialogTitle>
          </DialogHeader>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 -mt-1">No app store needed — takes 10 seconds</p>

          {/* iPhone */}
          <div className="mt-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <span className="text-lg">🍎</span> iPhone (Safari)
            </h3>
            <div className="space-y-2.5 pl-1">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">1</span>
                <p className="text-xs text-gray-700 dark:text-gray-300">Open <strong>nearbytraveler.org</strong> in Safari on your phone</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">2</span>
                <p className="text-xs text-gray-700 dark:text-gray-300">Tap the <strong>Share button</strong> (square with arrow) at the bottom</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">3</span>
                <p className="text-xs text-gray-700 dark:text-gray-300">Scroll down and tap <strong>"Add to Home Screen"</strong></p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-[10px] font-bold text-green-600 shrink-0">4</span>
                <p className="text-xs text-gray-700 dark:text-gray-300">Tap <strong>Add</strong> — done!</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

          {/* Android */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <span className="text-lg">🤖</span> Android (Chrome)
            </h3>
            <div className="space-y-2.5 pl-1">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">1</span>
                <p className="text-xs text-gray-700 dark:text-gray-300">Open <strong>nearbytraveler.org</strong> in Chrome on your phone</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">2</span>
                <p className="text-xs text-gray-700 dark:text-gray-300">Tap the <strong>3 dots menu</strong> (⋮) in the top right</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">3</span>
                <p className="text-xs text-gray-700 dark:text-gray-300">Tap <strong>"Add to Home screen"</strong></p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-[10px] font-bold text-green-600 shrink-0">4</span>
                <p className="text-xs text-gray-700 dark:text-gray-300">Tap <strong>Add</strong> — done!</p>
              </div>
            </div>
          </div>

          <Button onClick={() => { setShowGuide(false); dismiss(); }} variant="outline" className="w-full mt-3">
            Got it!
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
