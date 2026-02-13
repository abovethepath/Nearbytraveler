# Fixes Audit – What You Asked For, Where It Lives, Why Some Don’t Show

**Important:** Your Expo app loads the **website** from `https://nearbytraveler.org`.  
So you have two codebases that both need to be correct:

| Folder | What it is | When you see it |
|--------|------------|------------------|
| **expo-app/** | React Native app (tabs, WebView shell, auth) | As soon as you run the Expo app. |
| **client/** | Web app (profile, quick meetups, dialogs, banners) | When the Expo app loads it **inside the WebView** (or in a browser). |

If the Expo app is pointed at **production** (e.g. `https://nearbytraveler.org`), you only see **deployed** client code. Local changes in **client/** won’t show until you **deploy** the web app or point Expo at your **local** client.

---

## 1. List of issues and where they’re fixed

| # | Issue | Lives in | Fixed? | Where / how to see it |
|---|--------|----------|--------|------------------------|
| 1 | Green pulsating hangout on user card | **client/** (web UI inside WebView) | Not found in codebase | Need a screen name or component (e.g. “Explore” or “profile card”) to search. |
| 2 | Home page flashing when switching tabs | **expo-app/** | Yes | `expo-app/src/navigation/AppNavigator.js`: `lazy: false`, `unmountOnBlur: false`, `detachInactiveScreens: false`. Visible when you run the Expo app. |
| 3 | Quick Meets: show Apple tab bar, hide Replit bottom nav | **client/** (hides its own nav when “native”) | Yes | `client/src/lib/nativeApp.ts`: `isNativeIOSApp()` (URL `?native=ios` + injected `__NEARBY_NATIVE_IOS__`). Expo adds both. **Requires deployed client** (or Expo loading your local client). |
| 4 | Red banner on top of profile | **client/** | Yes | `client/src/pages/profile-complete.tsx`: banner not rendered when `isNativeIOSApp()`. **Requires deployed client.** |
| 5 | Profile: “Edit” instead of red pen for bio | **client/** | Yes | `client/src/pages/profile-complete.tsx`: button shows text “Edit”. **Requires deployed client.** |
| 6 | Edit bio widget: too dark, freezes, can’t scroll | **client/** | Partly | `client/src/components/ui/dialog.tsx`: overlay `bg-black/40`. Edit Profile dialog already `max-h-[90vh] overflow-y-auto`. **Requires deployed client.** |
| 7 | City chatrooms (from travel stats): same overlay/scroll | **client/** | Same as #6 | Same dialog component; lighter overlay applies. **Requires deployed client.** |
| 8 | Profile tab stopped working | **expo-app/** | Yes | `expo-app/src/navigation/AppNavigator.js`: Profile tab uses `WebViewStack path="/profile"`, tabs kept mounted. Visible when you run the Expo app. |
| 9 | Home page flashing (duplicate of #2) | **expo-app/** | Yes | Same as #2. |

---

## 2. Why “most things haven’t been fixed” when you test

- **Expo app** changes (Profile tab, no Home flash) are in **expo-app/**. You see them as soon as you run the Expo build.
- **Website** changes (red banner, Edit button, dialogs, no Replit nav) are in **client/**. You only see them when the **page** loaded in the WebView is built from that code:
  - If the Expo app uses **production** (`https://nearbytraveler.org`), you only see fixes after you **deploy** the client.
  - If you want to test client fixes without deploying, point the Expo app at your **local** client (see below).

So: **Be in the right place** = fix in **expo-app** for app shell/tabs, and in **client** for everything that’s the web UI inside the WebView. Both are “right”; which one you’re testing (app vs deployed site) decides what you see.

---

## 3. How to see client fixes when testing the Expo app

**Option A – Deploy client**  
Deploy the **client/** app (e.g. to the same host as `nearbytraveler.org`). The Expo app will then load the new code from that URL.

**Option B – Use local client (for development)**  
1. Run the web app locally (e.g. `npm run dev` in the project that serves the client; note the URL, e.g. `http://localhost:5000` or your machine’s IP like `http://192.168.1.100:5000`).  
2. In **expo-app/src/screens/WebViewScreens.js** set `DEV_WEB_URL` to that URL (only used when `__DEV__` is true):

   ```js
   const DEV_WEB_URL = 'http://192.168.1.100:5000'; // your local client URL
   ```

   Leave it as `null` for production. Then run the Expo app in dev; it will load your local client and you’ll see all client fixes (red banner, Edit, dialogs, no Replit nav, etc.) without deploying.

---

## 4. Quick reference: files we changed

**expo-app (you see these when you run the Expo app):**

- `expo-app/src/navigation/AppNavigator.js`  
  - Tab navigator: `lazy: false`, `unmountOnBlur: false`, `detachInactiveScreens: false`.  
  - Profile tab: `WebViewStack path="/profile"`, `tabLabel="Profile"` (and same pattern for other tabs).
- `expo-app/src/screens/WebViewScreens.js`  
  - `DEV_WEB_URL`: set to your local client URL (e.g. `http://192.168.1.x:5000`) to test client fixes without deploying; `null` for production.  
  - `pathWithNativeIOS()` adds `?native=ios` so the site hides its bottom nav.  
  - `injectedJavaScriptBeforeDOMContentLoaded` sets `window.__NEARBY_NATIVE_IOS__=true` so the client detects native app.

**client (you see these when the loaded website is built from this code):**

- `client/src/lib/nativeApp.ts` – `isNativeIOSApp()` (Capacitor + `?native=ios` + `__NEARBY_NATIVE_IOS__`).
- `client/src/pages/profile-complete.tsx` – Red banner when `!isNativeIOSApp()`; profile edit button label “Edit”.
- `client/src/components/ui/dialog.tsx` – Dialog overlay `bg-black/40`.

---

## 5. Green pulsating hangout

Not found in **expo-app** or **client** under obvious names. To fix it we need either:

- The **screen/route** where you see it (e.g. “Explore”, “Home”, “profile list”), or  
- A **component or file name** if you know it.

Then we can search in the **correct** place (almost certainly **client/** if it’s on a web-rendered user card).

---

**Summary:**  
- **expo-app/** = tab bar, Profile tab, no Home flash. Fixed there; visible when you run Expo.  
- **client/** = red banner, Edit button, dialogs, hiding Replit nav. Fixed there; visible only when the URL loaded in the WebView is your built client (deployed or local). To see “most things” fixed in the Expo app, either deploy client or point Expo at your local client URL.
