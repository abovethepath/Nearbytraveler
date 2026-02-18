/**
 * Base URL for API and WebView. Production default: nearbytraveler.org.
 * Override with EXPO_PUBLIC_WEB_URL or (in app.config) REPLIT_DEV_DOMAIN when using Replit.
 */
function getBaseUrl() {
  try {
    const Constants = require('expo-constants');
    const extra = Constants.expoConfig?.extra;
    if (extra?.webBaseUrl) return String(extra.webBaseUrl).replace(/\/$/, '');
  } catch (_) {}
  if (typeof process !== 'undefined' && process.env) {
    const e = process.env;
    if (e.EXPO_PUBLIC_WEB_URL) return String(e.EXPO_PUBLIC_WEB_URL).replace(/\/$/, '');
    if (e.REACT_APP_WEB_URL) return String(e.REACT_APP_WEB_URL).replace(/\/$/, '');
    if (e.REPLIT_DEV_DOMAIN) return `https://${String(e.REPLIT_DEV_DOMAIN).replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
  }
  return 'https://nearbytraveler.org';
}

export const BASE_URL = getBaseUrl();
export const HOST = (BASE_URL || '').replace(/^https?:\/\//, '').split('/')[0] || 'nearbytraveler.org';
