import { useState, useEffect, useRef, createContext, useContext } from "react";
import { X, Smartphone, Share, ArrowDown, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ─── Global install state ───────────────────────────────────────────
const DISMISS_KEY = "nt_pwa_dismissed_at";
const INSTALLED_KEY = "nt_pwa_installed";
const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

function isDismissed(): boolean {
  try { return Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < THREE_DAYS; } catch { return false; }
}
function isInstalled(): boolean {
  try { return localStorage.getItem(INSTALLED_KEY) === "1"; } catch { return false; }
}
function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
}
function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}
function isMobile(): boolean {
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent) || window.innerWidth < 768;
}
function isDesktop(): boolean {
  return !isMobile();
}

// ─── Context for triggering install from anywhere ────────────────────
interface PWAInstallCtx {
  canInstall: boolean;
  isAppInstalled: boolean;
  triggerInstall: () => void;
  showIOSGuide: () => void;
}
const PWAInstallContext = createContext<PWAInstallCtx>({
  canInstall: false, isAppInstalled: false, triggerInstall: () => {}, showIOSGuide: () => {},
});
export const usePWAInstall = () => useContext(PWAInstallContext);

// ─── iOS Install Guide (reusable bottom sheet) ──────────────────────
export function IOSInstallGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm bg-white dark:bg-gray-900 !rounded-t-2xl sm:!rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-orange-500" /> Add to Home Screen
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Takes 10 seconds!</p>
        <div className="space-y-4 py-1">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center shrink-0 text-xs font-bold text-white">1</div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                Tap the Share button <Share className="w-4 h-4 text-blue-500" />
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">At the bottom of Safari</p>
              <ArrowDown className="w-4 h-4 text-blue-500 mt-0.5 animate-bounce" />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center shrink-0 text-xs font-bold text-white">2</div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                Tap <Plus className="w-4 h-4" /> "Add to Home Screen"
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Scroll down in the share menu</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shrink-0 text-xs font-bold text-white">3</div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Tap "Add" — done!</p>
          </div>
        </div>
        <Button onClick={onClose} className="w-full bg-orange-500 hover:bg-orange-600 text-white mt-1">Got it!</Button>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main PWA Install Provider + Banners ─────────────────────────────
export function PWAInstallPrompt({ children }: { children?: React.ReactNode }) {
  const [showMobileBanner, setShowMobileBanner] = useState(false);
  const [showDesktopBanner, setShowDesktopBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);
  const [appInstalled, setAppInstalled] = useState(isInstalled() || isStandalone());
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    if (appInstalled || isStandalone() || isDismissed()) return;

    // Capture Android/Chrome install prompt
    const onPrompt = (e: Event) => { e.preventDefault(); deferredPromptRef.current = e; };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // Track install completion
    const onInstalled = () => {
      setAppInstalled(true);
      setShowMobileBanner(false);
      setShowDesktopBanner(false);
      try { localStorage.setItem(INSTALLED_KEY, "1"); } catch {}
    };
    window.addEventListener("appinstalled", onInstalled);

    // Show banner after delay
    const timer = setTimeout(() => {
      if (isStandalone() || isDismissed()) return;
      if (isMobile()) setShowMobileBanner(true);
      else setShowDesktopBanner(true);
    }, 15000);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      clearTimeout(timer);
    };
  }, [appInstalled]);

  const dismiss = () => {
    setShowMobileBanner(false);
    setShowDesktopBanner(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  };

  const triggerInstall = async () => {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt();
      const result = await deferredPromptRef.current.userChoice;
      if (result.outcome === "accepted") dismiss();
      deferredPromptRef.current = null;
    } else if (isIOS()) {
      setShowIOSModal(true);
    }
  };

  const ctx: PWAInstallCtx = {
    canInstall: !appInstalled && !isStandalone(),
    isAppInstalled: appInstalled,
    triggerInstall,
    showIOSGuide: () => setShowIOSModal(true),
  };

  return (
    <PWAInstallContext.Provider value={ctx}>
      {children}

      {/* ── MOBILE BANNER ── pointer-events:none on wrapper so it never blocks content below */}
      {showMobileBanner && (
        <div className="fixed top-0 left-0 right-0 z-[9998] lg:hidden pointer-events-none">
          <div className="pointer-events-auto bg-gradient-to-r from-orange-500 to-pink-500 px-3 py-2.5 flex items-center gap-2.5 shadow-lg">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold leading-tight">Get the full app experience</p>
              <p className="text-white/70 text-[10px]">No app store needed</p>
            </div>
            <Button
              size="sm"
              onClick={triggerInstall}
              className="bg-white text-orange-600 hover:bg-orange-50 text-[11px] font-bold h-7 px-2.5 rounded-lg shrink-0"
            >
              Add to Home Screen
            </Button>
            <button onClick={dismiss} className="text-white/50 hover:text-white shrink-0 p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── DESKTOP BANNER ── pointer-events:none on wrapper so it never blocks content above */}
      {showDesktopBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-[9998] hidden lg:block pointer-events-none">
          <div className="pointer-events-auto bg-gradient-to-r from-orange-500 via-orange-600 to-pink-500 shadow-[0_-4px_20px_rgba(249,115,22,0.4)]">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">Take NearbyTraveler with you on your phone!</p>
                <p className="text-white/80 text-xs">No app store needed — works on iPhone & Android</p>
              </div>
              <Button onClick={() => setShowDesktopGuide(true)} className="bg-white text-orange-600 hover:bg-orange-50 font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shrink-0">
                Show Me How
              </Button>
              <button onClick={dismiss} className="text-white/50 hover:text-white shrink-0 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── iOS guide modal ── */}
      <IOSInstallGuide open={showIOSModal} onClose={() => { setShowIOSModal(false); dismiss(); }} />

      {/* ── Desktop guide modal ── */}
      <Dialog open={showDesktopGuide} onOpenChange={(o) => { setShowDesktopGuide(o); if (!o) dismiss(); }}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-900 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-orange-500" /> Get NearbyTraveler on Your Phone
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Takes 10 seconds — no app store needed</p>
          {/* iPhone */}
          <div className="mt-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3 text-sm">🍎 iPhone (Safari)</h3>
            <div className="space-y-3">
              {["Open nearbytraveler.org in Safari", "Tap the Share button at the bottom", 'Scroll down → "Add to Home Screen"', 'Tap "Add" — done!'].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={`w-5 h-5 rounded-full ${i === 3 ? 'bg-green-500' : 'bg-blue-500'} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>{i+1}</span>
                  <p className="text-xs text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: step.replace(/(".*?")/g, '<strong>$1</strong>') }} />
                </div>
              ))}
            </div>
          </div>
          {/* Android */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3 text-sm">🤖 Android (Chrome)</h3>
            <div className="space-y-3">
              {["Open nearbytraveler.org in Chrome", "Tap the 3 dots menu (⋮) top right", 'Tap "Add to Home screen"', 'Tap "Add" — done!'].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={`w-5 h-5 rounded-full ${i === 3 ? 'bg-green-500' : 'bg-blue-500'} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>{i+1}</span>
                  <p className="text-xs text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: step.replace(/(".*?")/g, '<strong>$1</strong>') }} />
                </div>
              ))}
            </div>
          </div>
          <Button onClick={() => { setShowDesktopGuide(false); dismiss(); }} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold mt-2">
            Got it!
          </Button>
        </DialogContent>
      </Dialog>
    </PWAInstallContext.Provider>
  );
}
