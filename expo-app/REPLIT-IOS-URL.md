# Use Replit URL in the iOS app (no redirect to nearbytraveler.org)

When you build/run the app from a **Replit** deployment, signup and login should keep users on **your Replit URL** (e.g. `https://your-repl.replit.app`), not send them to `nearbytraveler.org`.

## What was changed

- **`expo-app/src/config.js`** – Single place for the app’s base URL. It uses:
  - **Replit:** `REPLIT_DEV_DOMAIN` or `EXPO_PUBLIC_WEB_URL` (from `app.config.js` or env).
  - **Default:** `https://nearbytraveler.org`.
- **`expo-app/app.config.js`** – Reads `REPLIT_DEV_DOMAIN` / `EXPO_PUBLIC_WEB_URL` at start and passes `webBaseUrl` into the app.
- **`expo-app/src/services/api.js`** – All API calls use `BASE_URL` from config (login, register, user, etc.).
- **`expo-app/src/screens/WebViewScreens.js`** – WebView home, connections, settings use `BASE_URL`.
- **SignupStep3** screens – Terms link uses `BASE_URL`.

So after signup/login, the app loads **your** Replit URL (e.g. `https://your-repl.replit.app/home?native=ios`), not nearbytraveler.org.

## What you need to do on Replit

Replit sets **`REPLIT_DEV_DOMAIN`** when you run the repl. The Expo app picks it up when you start the app **from that Replit environment**:

1. Run the **backend/web** app on Replit (so your Replit URL serves the site and API).
2. In the same Replit shell (or in a shell where Replit has set `REPLIT_DEV_DOMAIN`), start the Expo app:
   ```bash
   cd expo-app
   npm start
   # or: npx expo start
   ```
   When `app.config.js` runs, it reads `process.env.REPLIT_DEV_DOMAIN` and sets `extra.webBaseUrl` to `https://<REPLIT_DEV_DOMAIN>`. The iOS app then uses that for all API and WebView URLs.

If you build the iOS app **outside** Replit (e.g. EAS Build or your own Mac), set the URL explicitly before building:

```bash
export EXPO_PUBLIC_WEB_URL="https://your-repl.replit.app"
cd expo-app
npx expo start
# or build
```

So: **running or building from Replit** → Replit’s URL is used automatically; **building elsewhere** → set `EXPO_PUBLIC_WEB_URL` to your Replit deployment URL.

---

## Production iOS build (nearbytraveler.org → Render)

Your production backend and DB run on **Render**; **nearbytraveler.org** points to that. For the **production** iOS build, point the app at that canonical URL so all API calls and WebViews hit the right server:

```bash
EXPO_PUBLIC_WEB_URL=https://nearbytraveler.org
cd expo-app && eas build --platform ios
```

You don’t need to use Render URLs anywhere. **nearbytraveler.org** is the production base URL; the app config falls back to it when `EXPO_PUBLIC_WEB_URL` and `REPLIT_DEV_DOMAIN` are not set.
