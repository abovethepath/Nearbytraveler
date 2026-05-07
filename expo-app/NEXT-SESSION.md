# iOS native rebuild — next-session notes

Carry-overs from prior sessions. Pick from this list when starting the next iOS session.

## Known small fixes (low-effort, high-clarity)

### 1. UserProfileScreen "Message" button is wired to a now-unreachable `Chat`

`expo-app/src/screens/UserProfileScreen.js:22`:

```js
const handleMessage = () => {
  navigation.navigate('Chat', { userId: profile.id, userName: profile.fullName || profile.username });
};
```

Since `UserProfile` was promoted to a **root-level** Stack.Screen (Session 3), `navigation` here is the root stack. There is no `Chat` sibling at root — `Chat` lives inside `MessagesStack` (`MainTabs > Messages > Chat`). Tapping "Message" will silently fail or throw a "GO_BACK was not handled" / unknown route warning.

**Fix:** route through the tab navigator into the Messages stack:

```js
const handleMessage = () => {
  navigation.getParent()?.navigate('MainTabs', {
    screen: 'Messages',
    params: {
      screen: 'Chat',
      params: { userId: profile.id, userName: profile.fullName || profile.username },
    },
  });
};
```

One-line change in `UserProfileScreen.js`. No other files need to change.

## Native screens still routed via WebView

After Session 3, the following are still WebView-backed:

- **Create tab** action sheet → web `/match-in-city`, `/create-event`, `/plan-trip`, `/quick-meetups?create=1`. Each is its own page; reasonable to keep WebView until they're prioritised.
- **Profile menu items** (`EditProfile`, `Connections`, `Settings`) — fall back to web `/settings` and `/connections`.
- **Event detail / event creation** — `EventDetailScreen.js` and `EventsScreen.js` orphans exist (~100 + ~154 lines) and could be wired in a session similar to Session 2's pattern.
- **Available Now** as a dedicated screen (the audit's Task E) — not built yet. Map view + list view using `react-native-maps` (already installed).

## Polish queue (post-Apple-approval)

- **Real-time chat:** `ChatScreen.js` polls every 10s. Wire WebSocket via the existing `chatWebSocketService.ts` server endpoint for instant message delivery.
- **Push notification deep linking:** tapping a notification currently just opens the app to its current state. Add a `responseListener` in `App.js`'s `PushTokenRegistrar` that reads the notification payload and navigates to the relevant screen (Chat thread, UserProfile, etc.).
- **`isCurrentlyTraveling` cleanup:** seeded-user travel status reverts work correctly only because we changed `status: "active"` → `status: "planned"` to match `TravelStatusService`. Worth a one-time spot-check after a few cron cycles to confirm seeded users transition cleanly.
- **WebView session cookie injection on cold start:** the WebView fallback for non-prerendered routes still relies on `api.getSessionCookie()` being populated by the time the WebView mounts. If you ever see a "logged out" WebView right after app boot, race condition between `restoreSession()` and the first `WebView` mount is the suspect.

## Apple-readiness checklist (re-submit prep)

When ready to re-submit to App Store after the next polish pass:

- [ ] LoginScreen Apple Sign In renders and works (verified in Session 2)
- [ ] At least 4 native primary tabs (Home, Explore, Messages, Profile already native after Session 2 + 3)
- [ ] Push notification permission request shows on first auth (already wired in `App.js`)
- [ ] Privacy disclosure strings in `app.config.js` / `app.json` match what the app actually uses (camera, location, photos, notifications)
- [ ] App Store screenshots regenerated against the new native screens, not the WebView wrapper
- [ ] Test flight build via `npm run build:ios` from `expo-app/`
