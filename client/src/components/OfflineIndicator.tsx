import React, { useState, useEffect } from "react";

/**
 * Shows a banner when the user is offline.
 * Meets Apple iOS App Store requirement: clear offline indicator.
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-amber-950 text-center py-2 px-4 text-sm font-medium shadow-md"
      role="status"
      aria-live="polite"
    >
      You're offline. Showing cached data. Some features may be limited.
    </div>
  );
}
