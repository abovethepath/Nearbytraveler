# Fixes Applied (2025-02-12) – Apple / Profile / Quick Meets

These changes were made in the **client** app (same codebase used by Capacitor/Apple and web). Rebuild or refresh to see them.

---

## 1. Quick Meets page – Apple bottom nav (Replit nav hidden)

**Issue:** On Apple, the Quick Meets page showed the old Replit-style bottom navbar instead of the native iOS tab bar.

**Fix:** `client/src/lib/nativeApp.ts` now treats **Capacitor** as native: when the app runs inside Capacitor iOS/Android (`Capacitor.isNativePlatform()` and not `web`), `isNativeIOSApp()` returns `true`.  
`MobileBottomNav` already returns `null` when `isNativeIOSApp()` is true, so the web bottom nav is hidden and the native tab bar is used.

**You must run the app from the Capacitor iOS build** (not in a browser) for this to take effect. Ensure `Capacitor` is available on `window` in that build.

---

## 2. Red banner on profile (hidden on Apple)

**Issue:** Red “PLEASE FILL OUT PROFILE” banner stayed on top of the user on the profile page.

**Fix:** In `client/src/pages/profile-complete.tsx`, the profile completion banner is **not rendered when `isNativeIOSApp()` is true**. On native (including Capacitor iOS), the banner no longer appears so it doesn’t cover the profile.

---

## 3. Profile – “Edit” CTA (no red pen icon)

**Issue:** Edit the bio / profile used a red pen icon; you wanted a clear “Edit” label.

**Fix:** In `client/src/pages/profile-complete.tsx`, the main profile edit button now shows the text **“Edit”** only (no Edit2 icon). It’s visible on all screen sizes. The button can still be red when the profile is incomplete (same logic as before).

---

## 4. Edit profile modal – lighter overlay, less “bleed”

**Issue:** When opening the edit profile (or edit bio) widget, the overlay was too dark, bled into the profile, and felt like it froze; scrolling was an issue.

**Fix:**  
- **Overlay:** In `client/src/components/ui/dialog.tsx`, the default Dialog overlay was changed from `bg-black/80` to `bg-black/40` so all dialogs (including Edit Profile and any city chatroom modals that use Dialog) have a lighter backdrop.  
- The Edit Profile dialog content was already `max-h-[90vh] overflow-y-auto` and `bg-white dark:bg-gray-900`; no change there. If scrolling still fails on iOS, the next step is to check for `overflow: hidden` or touch-action on a parent.

---

## Not changed (would need more context or different codebase)

- **Green pulsating hangout on user card** – No “pulsating hangout” or green pulse was found on user cards in the client; might live in another app (e.g. Expo) or under a different component name.
- **Home page flashing** – Not located; need a short description or screen where it happens.
- **City chatrooms (travel stats)** – Same Dialog component is used; the lighter overlay (above) applies. If a specific city chatroom modal still doesn’t scroll or freezes, we’d need the exact route/component (e.g. from profile travel section).

---

## Summary of files touched

| File | Change |
|------|--------|
| `client/src/lib/nativeApp.ts` | Capacitor detection: treat native Capacitor iOS/Android as native so web bottom nav is hidden. |
| `client/src/pages/profile-complete.tsx` | Import `isNativeIOSApp`; hide red completion banner when native; profile edit button shows “Edit” text only. |
| `client/src/components/ui/dialog.tsx` | Default overlay `bg-black/80` → `bg-black/40`. |

All edits are in the **client** app. If you run an **Expo** or other separate app for Apple, those projects would need equivalent logic (and possibly the same `nativeApp` + banner/button/dialog behavior) in their own codebase.
