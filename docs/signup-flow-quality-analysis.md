# Sign-Up Flow Quality Analysis

**Scope:** Do users correctly become **Nearby Locals** and **Nearby Travelers**, and are **interests** (and related data) saved end-to-end?

**Date:** 2025-02-12

---

## Executive Summary

**Verdict: The sign-up flow works end-to-end** for both Nearby Local and Nearby Traveler. User type, interests, custom interests, custom activities, location/travel fields, and languages (from checkboxes) are persisted. Session is created and the user is redirected to `/account-success`.

**Issues found:** One clear bug (custom languages not saved), one UX/maintainability quirk (traveler return date year hardcoded to 2026), and one optional improvement (activities/events not collected on signup).

---

## 1. Flow Overview

| Step | Route | Component | Purpose |
|------|--------|-----------|---------|
| 1 | `/join` | `JoinNowWidgetNew` | User picks "Nearby Local", "Nearby Traveler", or "Nearby Business" → stored in `sessionStorage.selectedUserType` → navigate to `/signup/account` |
| 2 | `/signup/account` | `signup-account.tsx` | Reads `intendedUserType` (QR) or `selectedUserType`; if neither exists, **redirects to `/join`**. Collects name, username, email, phone, password. Stores `accountData` in sessionStorage → redirects to `/signup/local`, `/signup/traveling`, or `/signup/business` by `userType`. |
| 3a | `/signup/local` | `signup-local.tsx` | Loads account data, builds profile (interests, customInterests, customActivities, hometown, DOB, languagesSpoken). Validates ≥7 interests (combined), then `POST /api/register` → on success redirects to `/account-success`. |
| 3b | `/signup/traveling` | `signup-traveling.tsx` | Same pattern: `userType: "traveler"`, `isCurrentlyTraveling: true`, destination + return date; ≥7 interests; `POST /api/register` → `/account-success`. |

---

## 2. Server-Side Registration

- **Handler:** `handleRegistration` in `server/routes.ts` (≈4035).
- **Route:** `POST /api/register`.

**Processing:**

- **userType**  
  - Received as `"local"` or `"traveler"`.  
  - For travelers, `userType` is normalized to `"traveler"` and `isCurrentlyTraveling` is set to `true`.  
  - Stored in DB via `insertUserSchema` and `storage.createUser`.

- **Interests**  
  - `interests` (array) and `customInterests` (string) come from the client, pass through `insertUserSchema.parse(processedData)`, and are written by `storage.createUser` → `db.insert(users).values(cleanUserData)`.  
  - Server also enforces **≥3 total** from interests + activities + events (client sends only interests for local/traveler, so effectively ≥3 interests).

- **Activities / events**  
  - Client signup (local/traveler) sends **only** `interests`, `customInterests`, and `customActivities`.  
  - Server copies `userData.interests` → `defaultTravelInterests`, `userData.activities` → `defaultTravelActivities`, `userData.events` → `defaultTravelEvents`.  
  - So interests (and default travel interests) are saved; activities/events are only saved if sent (they are not sent on current signup forms).

- **Location (locals)**  
  - `hometownCity`, `hometownState`, `hometownCountry` → `location` and `hometown` strings; all stored.

- **Travel (travelers)**  
  - `destinationCity/State/Country`, `travelReturnDate` (mapped to `travelEndDate`), `travelStartDate` (defaults to today), `travelDestination` string; all stored.  
  - `currentTravelCity/State/Country` set from destination for compatibility.

- **Other**  
  - DOB (17+ enforced), `languagesSpoken`, referral/connection note, business-specific fields where applicable — all flow through the same pipeline and are persisted.

**Persistence:** `storage.createUser(userData)` builds `cleanUserData` from all non-null/undefined keys on `insertUser` (including `interests`, `customInterests`, `userType`, travel/location fields, etc.) and runs `db.insert(users).values(cleanUserData).returning()`. Schema columns (e.g. `interests`, `custom_interests`, `user_type`) exist in `shared/schema.ts` and are written.

---

## 3. What Is Saved (Summary)

| Data | Local | Traveler | Persisted? |
|------|--------|----------|------------|
| userType | "local" | "traveler" | ✅ |
| isCurrentlyTraveling | false | true | ✅ |
| interests (array) | ✅ | ✅ | ✅ |
| customInterests (string) | ✅ | ✅ | ✅ |
| customActivities (string) | ✅ | ✅ | ✅ |
| activities / events (arrays) | Not sent | Not sent | N/A (optional improvement to collect) |
| hometownCity/State/Country, location, hometown | ✅ | ✅ | ✅ |
| destinationCity/State/Country, travelDestination, travelReturnDate/travelEndDate | N/A | ✅ | ✅ |
| dateOfBirth, languagesSpoken (from checkboxes) | ✅ | ✅ | ✅ |
| custom languages (text input) | Parsed but not merged | Parsed but not merged | ❌ Bug |

---

## 4. Issues and Recommendations

### 4.1 Bug: Custom languages not saved (Local & Traveler)

**Location:** `client/src/pages/signup-local.tsx`, `client/src/pages/signup-traveling.tsx`

**Issue:** The comment says "Merge custom languages into languagesSpoken" but the code only sets `languagesSpoken = formData.languages`. `customLangs` from `parseCustomCSV(formData.customLanguages)` is never merged in, so custom language input is not sent to the server and is not saved.

**Recommendation:** Merge custom languages into the payload, e.g.:

```ts
const languagesSpoken = [...(formData.languages || []), ...parseCustomCSV(formData.customLanguages)];
```

Then send `languagesSpoken` in `registrationData` as already done.

---

### 4.2 Quirk: Traveler return date year enforced as ≥ 2026

**Location:** `client/src/pages/signup-traveling.tsx` (validation of `travelReturnDate`)

**Issue:** Return date year is required to be ≥ 2026. After 2026 this will block valid future years (e.g. 2027) unless the check is updated.

**Recommendation:** Use current year instead of hardcoded 2026, e.g. `new Date().getFullYear()`.

---

### 4.3 Optional: Activities and events not collected on signup

**Location:** Client signup payloads

**Issue:** Server supports and persists `activities` and `events` (and uses them in the ≥3 total check). Local and traveler signup only send `interests` (and customInterests/customActivities). So activities/events are never set at signup.

**Recommendation:** Either add activities/events to the signup forms so they are saved from day one, or leave as-is and rely on profile edit later; document the current behavior so it’s clear that “total selections” at signup are interest-only.

---

## 5. Entry Points and Guards

- **Landing → Join:** Entry to signup is via `/join` (user type selection). Direct visits to `/signup/account` without `selectedUserType` or `intendedUserType` are redirected to `/join` in `signup-account.tsx` (useEffect), so the flow is protected.

---

## 6. Conclusion

- **User type:** Locals and travelers are correctly set and stored (`userType`, `isCurrentlyTraveling` for travelers).
- **Interests:** Interests and custom interests (and custom activities) are sent and persisted; server also backs them into default travel preferences.
- **Location/travel:** Hometown and traveler destination/return date (and related fields) are mapped and saved.
- **Gaps:** Custom languages are not saved (bug); return date year is hardcoded to 2026 (maintainability); activities/events are not collected at signup (optional enhancement).

Fixing the custom-languages merge in both signup pages is the only change required for the “interests and related data saved” behavior to match the intended design; the rest of the flow is sound.
