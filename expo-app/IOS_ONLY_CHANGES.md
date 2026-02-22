# iOS-only changes (no client/website edits)

If you reverted a commit that included client changes, use this to re-apply **only** the expo-app (iOS) changes.

## 1. ExploreScreen.js – travel line on user cards (no "Traveling to null")

- **Location:** `expo-app/src/screens/ExploreScreen.js`
- **What:** Add `getTravelDestination(user)`, `safeTravelLabel(destination, isTraveler)`, and in `UserCard` use them so the travel line shows "✈️ Traveling to {city}" only when there is a real destination; otherwise "✈️ Traveler" or "✈️ Traveling".

**Add after** `import UserAvatar from '../components/UserAvatar';` and **before** `const UserCard`:

```javascript
// Resolve display destination from API (destinationCity, travelDestination, travelPlans). Never return the string "null".
function getTravelDestination(user) {
  const dest = user.destinationCity || (user.destination_city && user.destination_city.trim()) || null;
  if (dest && String(dest).toLowerCase() !== 'null') return String(dest).trim();
  const td = user.travelDestination || user.travel_destination;
  if (td && typeof td === 'string') {
    const city = td.split(',')[0].trim();
    if (city && city.toLowerCase() !== 'null') return city;
  }
  if (user.travelPlans && Array.isArray(user.travelPlans) && user.travelPlans.length > 0) {
    const plan = user.travelPlans.find((p) => p.destinationCity || p.destination_city || p.destination);
    if (plan) {
      const c = plan.destinationCity || plan.destination_city || (plan.destination && String(plan.destination).split(',')[0].trim());
      if (c && String(c).toLowerCase() !== 'null') return String(c).trim();
    }
  }
  if (user.isCurrentlyTraveling || user.is_currently_traveling) return 'away';
  return null;
}

function safeTravelLabel(destination, isTraveler) {
  const valid = destination && destination !== 'away' && String(destination).toLowerCase() !== 'null';
  if (valid) return `Traveling to ${destination}`;
  return isTraveler ? 'Traveler' : 'Traveling';
}
```

**In UserCard:** use destination and label like this (not raw `user.destinationCity`):

```javascript
  const destination = getTravelDestination(user);
  const isTraveler = user.userType === 'traveler' || user.user_type === 'traveler';
  const showTravelLine = isTraveler || destination;
  const travelLabel = safeTravelLabel(destination, isTraveler);
  // ...
  {showTravelLine && user.userType !== 'business' && (
    <Text style={styles.travelLine} numberOfLines={1}>✈️ {travelLabel}</Text>
  )}
```

---

## 2. WebViewScreens.js – Messages auth wait + profile hero WebView patch

- **Location:** `expo-app/src/screens/WebViewScreens.js`

### 2a. Messages: longer auth wait

- Find where `shouldWaitForAuth` / auth wait timer is defined.
- Use a longer wait for the Messages path, e.g. `const authWaitMs = isMessagesPath ? 4500 : 2500;` and use `authWaitMs` in the `setTimeout` for `setAuthWaitExpired(true)`.

### 2b. Profile hero (WKWebView compatibility)

- In **NATIVE_INJECT_JS** (the big string that sets `s.textContent = ...`), ensure it includes:
  - **100vw fix:** `body.native-ios-app div.bg-gradient-to-r[style*="100vw"], ...` with `width: 100%`, `left: 0`, `transform: none`, `overflow-x: clip`, `min-height: 220px`.
  - **Text/cities:** `body.native-ios-app .flex-1.min-w-0.overflow-hidden { min-width: 0 !important; }` and the `div.flex.flex-col.gap-0.min-w-0.flex-1` rule with `overflow: hidden`.
  - **New to Town:** `div.flex.items-start.gap-1\.5.min-w-0` with `flex-wrap: wrap` and the badge `span.flex-shrink-0.self-start` with `flex-basis: 100%`, `margin-top: 6px`.
- **JS:** After the style block, add `hideNearbyTravelerWhenEmpty()` that finds span text "Nearby Traveler", checks `nextElementSibling` text; if it's "—", "", or "null", set `display: 'none'` on both spans. Run it on DOMContentLoaded and again after ~800 ms. Set `document.body.setAttribute('data-native-hero-patch', 'ok')` so you can confirm injection in the WebView (debug badge).

---

**Status:** The current workspace already has these applied in `ExploreScreen.js` and `WebViewScreens.js`. If your repo was fully reverted, re-apply using the snippets above (or restore from this doc).
