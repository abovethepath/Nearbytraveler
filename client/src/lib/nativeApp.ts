declare global {
  interface Window {
    webkit?: {
      messageHandlers?: Record<string, unknown>;
    };
    NearbyTravelerNative?: boolean;
    isNativeApp?: boolean;
  }
}

export function isNativeIOSApp(): boolean {
  if (typeof window === 'undefined') return false;

  if (window.NearbyTravelerNative === true) return true;
  if (window.isNativeApp === true) return true;

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('native') === 'ios') return true;

  if (window.webkit?.messageHandlers && Object.keys(window.webkit.messageHandlers).length > 0) {
    const ua = navigator.userAgent;
    if (!ua.includes('Safari') || ua.includes('CriOS') || ua.includes('FxiOS')) {
      return true;
    }
  }

  return false;
}

export function sendToNativeApp(action: string, data?: Record<string, unknown>): void {
  if (!isNativeIOSApp()) return;
  
  try {
    window.webkit?.messageHandlers?.nearbyTraveler?.postMessage?.({
      action,
      ...data,
    } as never);
  } catch {
  }
}
