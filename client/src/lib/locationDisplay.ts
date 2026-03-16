// client/src/lib/locationDisplay.ts
import { abbreviateState, abbreviateCountry } from "@/lib/dateUtils";

type Maybe<T> = T | null | undefined;

export type TravelPlan = {
  city?: string;
  state?: string;
  country?: string;
  startDate?: string;  // ISO
  endDate?: string;    // ISO
};

export type UserLike = {
  hometownCity?: string;
  hometownState?: string;
  hometownCountry?: string;
  travelPlans?: TravelPlan[] | null;
  travelDestination?: string | null; // legacy bridge, if present
};

const join = (parts: Maybe<string>[]) => parts.filter(Boolean).join(", ");

function isUsOrCanada(country: string | null | undefined): boolean {
  const c = (country || '').trim().toLowerCase();
  return c === 'united states' || c === 'usa' || c === 'us' ||
    c === 'u.s.' || c === 'u.s.a.' || c === 'united states of america' ||
    c === 'canada';
}

/**
 * Format a city/state/country triple for display:
 * - USA or Canada → "City, StateAbbr" (e.g. "Austin, TX" / "Toronto, ON")
 * - All others    → "City, Country"   (e.g. "Paris, France")
 */
export function formatCityDisplay(
  city: string | null | undefined,
  state: string | null | undefined,
  country: string | null | undefined,
): string {
  if (!city) return 'Unknown';
  if (isUsOrCanada(country)) {
    const abbrev = state ? abbreviateState(state) : '';
    return abbrev && abbrev.toLowerCase() !== city.toLowerCase()
      ? `${city}, ${abbrev}`
      : city;
  }
  return country ? `${city}, ${abbreviateCountry(country)}` : city;
}

export function resolveCurrentTravel(planList: Maybe<TravelPlan[]>, today = new Date()): TravelPlan | null {
  if (!planList?.length) return null;
  const t = today.toISOString().slice(0,10);
  // active if start <= today <= end (or open-ended)
  return planList.find(p => {
    const s = p.startDate ?? t;
    const e = p.endDate ?? t;
    return (s <= t) && (t <= e);
  }) ?? null;
}

/** Format hometown for Discover People cards: "Nearby Local · City, State" (US/Canada) or "Nearby Local · City, Country" (international) */
export function formatHometownForDisplay(user: { hometownCity?: string; hometownState?: string; hometownCountry?: string }): string {
  if (!user.hometownCity) return 'Unknown';
  const locationPart = formatCityDisplay(user.hometownCity, user.hometownState, user.hometownCountry);
  return `Nearby Local · ${locationPart}`;
}

export function locationBadges(u: UserLike) {
  const home = formatCityDisplay(u.hometownCity, u.hometownState, u.hometownCountry) || "Hometown not set";
  const active = resolveCurrentTravel(u.travelPlans);
  const current = active ? join([active.city, active.state, active.country]) : null;

  // Support legacy single-string destination if no structured plan is active
  const legacy = !current && u.travelDestination ? u.travelDestination : null;

  const status = current
    ? `Currently in ${current}`
    : legacy
    ? `Currently in ${legacy}`
    : `Currently home`;

  return { home, status };
}