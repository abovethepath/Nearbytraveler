// client/src/lib/locationDisplay.ts
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

export function locationBadges(u: UserLike) {
  const home = join([u.hometownCity, u.hometownState, u.hometownCountry]) || "Hometown not set";
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