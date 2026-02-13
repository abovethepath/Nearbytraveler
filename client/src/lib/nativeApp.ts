/**
 * Detect when the web app is running inside a native shell (iOS/Expo or Capacitor).
 * When true, the site should hide its web bottom nav (native app has its own tab bar).
 */
export function isNativeIOSApp(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as Window & {
    NearbyTravelerNative?: boolean;
    isNativeApp?: boolean;
    __NEARBY_NATIVE_IOS__?: boolean;
    webkit?: { messageHandlers?: unknown };
    Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
  };
  if (w.NearbyTravelerNative === true || w.isNativeApp === true || w.__NEARBY_NATIVE_IOS__ === true) return true;
  if (typeof URLSearchParams !== 'undefined' && new URLSearchParams(window.location.search).get('native') === 'ios') return true;
  if (w.webkit?.messageHandlers != null) return true;
  // Capacitor iOS/Android: hide web bottom nav so native tab bar is used
  if (w.Capacitor?.isNativePlatform?.() === true && w.Capacitor?.getPlatform?.() !== 'web') return true;
  return false;
}

export function sendToNativeApp(_action: string, _data?: unknown): void {
  const w = window as Window & { webkit?: { messageHandlers?: { nearbyTraveler?: { postMessage: (x: unknown) => void } } } };
  w.webkit?.messageHandlers?.nearbyTraveler?.postMessage?.({ action: _action, data: _data });
}
