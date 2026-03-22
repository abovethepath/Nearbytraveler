import { useState, useEffect, useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

// Shared online status hook — use this anywhere to check connectivity
const onlineListeners = new Set<() => void>();
function subscribeOnline(cb: () => void) {
  onlineListeners.add(cb);
  const onChange = () => onlineListeners.forEach(fn => fn());
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    onlineListeners.delete(cb);
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}
function getOnlineSnapshot() { return navigator.onLine; }
function getServerSnapshot() { return true; }

export function useIsOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getServerSnapshot);
}

export function NetworkStatus() {
  const isOnline = useIsOnline();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
    } else if (showBanner) {
      // Keep "Back online" for 2s
      const t = setTimeout(() => setShowBanner(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isOnline]);

  if (!showBanner) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] text-center py-2 px-4 text-sm font-medium transition-colors"
      style={{ backgroundColor: isOnline ? '#059669' : '#DC2626', color: '#ffffff' }}
    >
      {isOnline ? (
        "Back online ✓"
      ) : (
        <span className="flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          You're offline — showing cached data
        </span>
      )}
    </div>
  );
}
