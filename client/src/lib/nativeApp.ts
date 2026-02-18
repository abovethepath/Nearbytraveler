declare global {
  interface Window {
    webkit?: {
      messageHandlers?: Record<string, unknown>;
    };
    NearbyTravelerNative?: boolean;
    isNativeApp?: boolean;
    __NATIVE_APP__?: boolean;
    __nativeIOSDetected?: boolean;
  }
}

let _cachedResult: boolean | null = null;

/**
 * True only when running inside the native iOS app (WKWebView / Capacitor).
 * Uses native-only signals so the website (including iPhone Safari) is never treated as native.
 * Order: Capacitor → native-injected flags → dev/testing (?native=ios).
 * No user-agent or messageHandlers-only detection (avoids false positives on mobile Safari).
 */
export function isNativeIOSApp(): boolean {
  if (_cachedResult === true) return true;
  if (typeof window === 'undefined') return false;

  if (window.__nativeIOSDetected === true) {
    _cachedResult = true;
    return true;
  }

  // 1) Capacitor (best: true only when running in native shell)
  try {
    const Cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } }).Capacitor;
    if (Cap?.isNativePlatform?.() && Cap?.getPlatform?.() === 'ios') {
      _cachedResult = true;
      window.__nativeIOSDetected = true;
      return true;
    }
  } catch {
    // Capacitor not available (e.g. web-only build)
  }

  // 2) Native-injected flags (app sets these in WKWebView; never set on website)
  if (window.__NATIVE_APP__ === true || window.NearbyTravelerNative === true || window.isNativeApp === true) {
    _cachedResult = true;
    window.__nativeIOSDetected = true;
    return true;
  }

  // 3) Dev/testing: ?native=ios or sessionStorage (set by native when opening webview or by dev)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('native') === 'ios' || sessionStorage.getItem('native_ios') === 'true') {
    _cachedResult = true;
    window.__nativeIOSDetected = true;
    return true;
  }

  // No user-agent or messageHandlers-only check — ensures website (incl. iPhone Safari) is never treated as native
  return false;
}

if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  if (params.get('native') === 'ios') {
    window.__nativeIOSDetected = true;
    sessionStorage.setItem('native_ios', 'true');
    _cachedResult = true;
    document.body.setAttribute('data-native-ios', 'true');
    document.body.classList.add('native-ios-app');
  }
  if (window.__NATIVE_APP__ === true || window.NearbyTravelerNative === true || window.isNativeApp === true) {
    window.__nativeIOSDetected = true;
    sessionStorage.setItem('native_ios', 'true');
    _cachedResult = true;
    document.body.setAttribute('data-native-ios', 'true');
    document.body.classList.add('native-ios-app');
  }
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
