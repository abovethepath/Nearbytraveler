/**
 * Base URL for API and WebView. When building/running on Replit, the app uses
 * your Replit deployment URL so signup/login and WebView stay on your URL
 * (new users see your Replit home, not nearbytraveler.org).
 *
 * Set via app.config.js from REPLIT_DEV_DOMAIN or EXPO_PUBLIC_WEB_URL at start time,
 * or from process.env at runtime (EXPO_PUBLIC_*, REACT_APP_WEB_URL, REPLIT_DEV_DOMAIN).
 */
import Constants from 'expo-constants';

function getBaseUrl() {
  const extra = Constants.expoConfig?.extra;
  if (extra?.webBaseUrl) return extra.webBaseUrl;
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
