# Fix: Sign-in still goes back to landing page (iOS / native app)

## Context for Claude (our architecture — not OAuth/universal links)

- **Auth**: Custom backend (email/password). No Sign in with Apple, Firebase, or Auth0. No OAuth callback or custom URL scheme for login.
- **iOS app**: Expo app. Login happens either (1) in the **native** LoginScreen (React Native), or (2) inside a **WKWebView** that loads our same website (e.g. user opens `/signin` in the app).
- **After native login**: App shows main tabs and the Home tab loads a WebView with `https://ourdomain.com/home?native=ios` and the session cookie. So we never use `yourapp://home` or universal links for this flow.
- **The actual bug**: When the **web app** (the React SPA running inside the WebView) does a post-login redirect, it uses `setLocation('/')`. On our site, `/` is the **landing page**. So the WebView ends up showing the landing page instead of the app home. The fix is in the **web client**: after login redirect to `/home` when running inside the native iOS app (detected via `?native=ios` or a flag injected by the app), and use `window.location.replace('/home')` when we would otherwise show `/` or `/landing` in the native app so the URL bar stays on `/home` and refresh doesn’t show landing.

## Problem
After sign-in (either in the native Expo LoginScreen or in the web auth page inside the WebView), the user ends up on the **landing page** instead of **home**. The iOS app should never show the landing page; signed-in users should always see home.

## Root causes
1. **Web auth page** (`client/src/pages/auth.tsx`): After successful login it does `setLocation('/')`. In the app, `/` is the landing route, so the user sees the landing page. There is a native check in `App.tsx` that redirects `/` → `/home`, but it can run after the landing content is already shown or the redirect may not persist in the WebView URL.
2. **Router** may render landing for `/` before the native redirect runs, or the WebView’s URL stays at `/` so a refresh shows landing again.

## Required changes

### 1. Auth page: redirect to /home in native iOS app after login

**File:** `client/src/pages/auth.tsx`

- Import the native app helper at the top (after existing imports):
```ts
import { isNativeIOSApp } from "@/lib/nativeApp";
```

- Find the successful-login redirect (around line 91–94). It currently says:
```ts
          // Redirect to home
          setLocation('/');
```

- Replace with:
```ts
          // Redirect to home (native app must use /home, not / which is landing)
          if (isNativeIOSApp()) {
            setLocation('/home');
          } else {
            setLocation('/');
          }
```

So after login, native iOS goes to `/home`, and web keeps going to `/`.

---

### 2. App.tsx: native app – redirect / and /landing to /home via URL (not only setLocation)

**File:** `client/src/App.tsx`

- In `renderPage()` you already have:
```ts
    // NATIVE APP: Never show landing page - redirect to /home
    if (isNativeIOSApp() && (location === '/' || location === '' || location.startsWith('/landing'))) {
      setLocation('/home');
      return null;
    }
```

- **Replace** that block with a hard URL redirect so the browser/WebView URL actually becomes `/home` and the app doesn’t show landing on refresh or deep link:
```ts
    // NATIVE APP: Never show landing page - redirect to /home and update URL
    if (isNativeIOSApp() && (location === '/' || location === '' || location.startsWith('/landing'))) {
      const base = window.location.origin;
      const search = window.location.search || '';
      const hasNative = search.includes('native=ios') || search.includes('native=');
      const newPath = '/home' + (hasNative ? (search ? (search.startsWith('?') ? search : '?' + search) : '?native=ios') : (search ? search + '&native=ios' : '?native=ios'));
      window.location.replace(base + newPath);
      return null;
    }
```

- **Simpler alternative** (recommended): keep the intent “never show landing in native app; go to /home and set URL” but with a shorter replace:
```ts
    // NATIVE APP: Never show landing page - redirect to /home
    if (isNativeIOSApp() && (location === '/' || location === '' || location.startsWith('/landing'))) {
      const q = window.location.search || '';
      const sep = q ? '&' : '?';
      const nativeParam = q.includes('native=') ? '' : sep + 'native=ios';
      window.location.replace(window.location.origin + '/home' + (q || '?') + (q ? '' : 'native=ios') + nativeParam);
      return null;
    }
```

- **Even simpler and correct:** just force replace to `/home` and preserve existing query (including `native=ios`):
```ts
    // NATIVE APP: Never show landing page - redirect to /home (update URL so refresh stays on home)
    if (isNativeIOSApp() && (location === '/' || location === '' || location.startsWith('/landing'))) {
      const search = window.location.search || '';
      const hasNative = search.includes('native=ios');
      const newSearch = hasNative ? search : (search ? search + '&native=ios' : '?native=ios');
      window.location.replace(window.location.origin + '/home' + newSearch);
      return null;
    }
```

Use this last block so that in the native app, any time the router would show `/` or `/landing`, the URL is replaced with `/home` and the user never sees the landing page.

---

### 3. Optional: run native redirect earlier (before loading state)

In `client/src/App.tsx`, inside the `Router` function, you can run the native “no landing” redirect as soon as you have `location`, **before** the loading UI or auth check, so the app never renders landing for native:

- After the line `const [location, setLocation] = useLocation();` (around 214), add:
```ts
  // Native iOS app: never show landing; redirect immediately so URL and UI stay on /home
  if (isNativeIOSApp() && (location === '/' || location === '' || location.startsWith('/landing'))) {
    const search = window.location.search || '';
    const hasNative = search.includes('native=ios');
    const newSearch = hasNative ? search : (search ? search + '&native=ios' : '?native=ios');
    window.location.replace(window.location.origin + '/home' + newSearch);
    return null;
  }
```

Then you can **remove** the duplicate check inside `renderPage()` (the block from step 2) to avoid doing the same redirect in two places. One place (early in Router) is enough.

---

## Summary for Claude

1. **`client/src/pages/auth.tsx`**  
   - Import `isNativeIOSApp` from `@/lib/nativeApp`.  
   - After successful login, if `isNativeIOSApp()` then `setLocation('/home')`, else `setLocation('/')`.

2. **`client/src/App.tsx`**  
   - When `isNativeIOSApp()` and `location` is `'/'`, `''`, or starts with `'/landing'`, call `window.location.replace(origin + '/home' + search)` (and ensure `native=ios` is in the query if it isn’t already).  
   - Do this either at the start of `Router` (and remove the same check from `renderPage`) or keep doing it inside `renderPage()`.

Result: In the native iOS app, sign-in (and any navigation to `/` or `/landing`) always ends up on **/home** and the URL is updated so the landing page is never shown.
