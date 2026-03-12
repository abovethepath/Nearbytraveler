// Viral, story-driven share text generators for Nearby Traveler

// ── Profile ────────────────────────────────────────────────────────────────

export type ShareProfile = {
  username: string;
  firstName?: string | null;
  userType?: string | null;
  city?: string | null;
  currentTravelDestination?: string | null;
};

export function getProfileShareText(profile: ShareProfile, profileUrl: string): string {
  const name = profile.firstName || `@${profile.username}`;
  const city = profile.city || "their city";

  if (profile.userType === "business") {
    return `Found a local business on NearbyTraveler.org — ${name} in ${city}. It's an app for connecting travelers and locals for real experiences, not tourist traps.\n${profileUrl}`;
  }

  if (profile.currentTravelDestination) {
    const dest = profile.currentTravelDestination;
    return `${name} is visiting ${dest} and using NearbyTraveler.org to meet locals and travelers IRL. Anyone around?\n${profileUrl}`;
  }

  if (profile.userType === "local") {
    return `I'm a local in ${city} on NearbyTraveler.org — a platform to connect travelers and locals for real experiences (not just tourist spots). If you're visiting or know someone who is:\n${profileUrl}`;
  }

  return `I'm using NearbyTraveler.org to meet locals and travelers IRL — no algorithms, just real people and real trips. Here's my profile if you want to connect:\n${profileUrl}`;
}

export function getProfileRedditText(profile: ShareProfile, profileUrl: string): string {
  const city = profile.currentTravelDestination || profile.city || "my city";
  const isLocal = profile.userType === "local";
  const verb = profile.currentTravelDestination ? "heading to" : "based in";

  return `${isLocal ? "Local" : "Solo traveler"} ${verb} ${city} and trying NearbyTraveler.org to meet people IRL. Curious if anyone here has used it — or wants to hang? ${profileUrl}`;
}

// ── Trip ───────────────────────────────────────────────────────────────────

export type ShareTrip = {
  id: number;
  destination: string;
  destinationCity?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
};

export function getTripShareText(trip: ShareTrip, tripUrl: string): string {
  const city = trip.destinationCity || trip.destination;
  const dateStr = trip.startDate
    ? new Date(trip.startDate).toLocaleDateString([], { month: "short", day: "numeric" })
    : null;
  const endStr = trip.endDate
    ? new Date(trip.endDate).toLocaleDateString([], { month: "short", day: "numeric" })
    : null;
  const dates =
    dateStr && endStr
      ? ` ${dateStr}–${endStr}`
      : dateStr
      ? ` starting ${dateStr}`
      : "";

  return `Visiting ${city}${dates} and looking to meet locals and fellow travelers through NearbyTraveler.org — real connections, not just tourist traps. Anyone around?\n${tripUrl}`;
}

export function getTripRedditText(trip: ShareTrip, tripUrl: string): string {
  const city = trip.destinationCity || trip.destination;
  const dateStr = trip.startDate
    ? new Date(trip.startDate).toLocaleDateString([], { month: "short", day: "numeric" })
    : "soon";

  return `Solo traveler heading to ${city} on ${dateStr} and using NearbyTraveler.org to meet locals and other travelers. Curious if anyone here has used it — or wants to hang? ${tripUrl}`;
}
