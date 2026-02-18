// When running on Replit, REPLIT_DEV_DOMAIN is set — use it so the app points at your
// Replit deployment (signup/login and WebView stay on your URL, not nearbytraveler.org).
const appJson = require('./app.json');
const e = typeof process !== 'undefined' ? process.env : {};
const webBaseUrl = e.EXPO_PUBLIC_WEB_URL
  ? String(e.EXPO_PUBLIC_WEB_URL).replace(/\/$/, '')
  : e.REPLIT_DEV_DOMAIN
    ? `https://${String(e.REPLIT_DEV_DOMAIN).replace(/^https?:\/\//, '').replace(/\/$/, '')}`
    : null;

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra || {}),
      webBaseUrl: webBaseUrl || undefined,
    },
  },
};
