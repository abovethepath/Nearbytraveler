declare global {
  interface Window {
    webkit?: {
      messageHandlers?: Record<string, unknown>;
    };
    NearbyTravelerNative?: boolean;
    isNativeApp?: boolean;
    __nativeIOSDetected?: boolean;
  }
}

let _cachedResult: boolean | null = null;

export function isNativeIOSApp(): boolean {
  if (_cachedResult === true) return true;
  if (typeof window === 'undefined') return false;

  if (window.__nativeIOSDetected === true) {
    _cachedResult = true;
    return true;
  }

  if (window.NearbyTravelerNative === true) {
    _cachedResult = true;
    window.__nativeIOSDetected = true;
    return true;
  }
  if (window.isNativeApp === true) {
    _cachedResult = true;
    window.__nativeIOSDetected = true;
    return true;
  }

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('native') === 'ios') {
    _cachedResult = true;
    window.__nativeIOSDetected = true;
    return true;
  }

  if (sessionStorage.getItem('native_ios') === 'true') {
    _cachedResult = true;
    window.__nativeIOSDetected = true;
    return true;
  }

  if (window.webkit?.messageHandlers && Object.keys(window.webkit.messageHandlers).length > 0) {
    const ua = navigator.userAgent;
    if (!ua.includes('Safari') || ua.includes('CriOS') || ua.includes('FxiOS')) {
      _cachedResult = true;
      window.__nativeIOSDetected = true;
      return true;
    }
  }

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
  if (window.NearbyTravelerNative === true || window.isNativeApp === true) {
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
