import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      // Keep banner for 2s after reconnection to show "Back online"
      setTimeout(() => setShowBanner(false), 2000);
    };
    const goOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

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
          Connection lost — retrying...
        </span>
      )}
    </div>
  );
}
