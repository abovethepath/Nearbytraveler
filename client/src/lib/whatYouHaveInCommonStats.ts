export type CompatibilityLike = {
  matchCount?: number | null;
  sharedInterests?: string[] | null;
  sharedActivities?: string[] | null;
  sharedEvents?: string[] | null;
  sharedCountries?: string[] | null;
  sharedLanguages?: string[] | null;
  otherCommonalities?: string[] | null;
  // Full breakdown arrays returned by the matching service
  sharedCityActivities?: { activity: string; city: string }[] | null;
  sharedTravelStyle?: string[] | null;
  sharedTags?: string[] | null;
  sharedExpertise?: string[] | null;
  sharedCustomActivities?: string[] | null;
  sharedCustomEvents?: string[] | null;
  sharedDefaultInterests?: string[] | null;
  sharedSecretActivities?: string[] | null;
  sharedSexualPreferences?: string[] | null;
};

export type ConnectionDegreeLike = {
  mutualCount?: number | null;
};

export interface CommonStats {
  sharedInterests: string[];
  sharedActivities: string[];
  sharedEvents: string[];
  sharedCountries: string[];
  sharedLanguagesNonEnglish: string[];
  sharedCityActivities: string[];
  sharedSexualPreferences: string[];
  otherCommonalities: string[];
  sharedContactsCount: number;
  totalCommon: number;
}

const norm = (v: string) => String(v || "").trim();
const dedupe = (arr: string[]) => {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of arr) {
    const t = norm(v);
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
};

export function computeCommonStats(
  compatibilityData: CompatibilityLike | null | undefined,
  connectionDegreeData: ConnectionDegreeLike | null | undefined,
): CommonStats {
  const sharedInterests = dedupe(Array.isArray(compatibilityData?.sharedInterests) ? compatibilityData!.sharedInterests!.filter(Boolean) : []);
  const sharedActivities = dedupe(Array.isArray(compatibilityData?.sharedActivities) ? compatibilityData!.sharedActivities!.filter(Boolean) : []);
  const sharedEvents = dedupe(Array.isArray(compatibilityData?.sharedEvents) ? compatibilityData!.sharedEvents!.filter(Boolean) : []);
  const sharedCountries = dedupe(Array.isArray(compatibilityData?.sharedCountries) ? compatibilityData!.sharedCountries!.filter(Boolean) : []);
  const sharedLanguagesRaw = dedupe(Array.isArray(compatibilityData?.sharedLanguages) ? compatibilityData!.sharedLanguages!.filter(Boolean) : []);

  const sharedLanguagesNonEnglish = sharedLanguagesRaw.filter((l) => {
    const n = String(l || "").trim().toLowerCase();
    return !!n && n !== "english";
  });

  // City activities: convert {activity, city} objects to "Activity (City)" strings
  const rawCityActivities = Array.isArray(compatibilityData?.sharedCityActivities)
    ? compatibilityData!.sharedCityActivities!
    : [];
  const sharedCityActivities = dedupe(
    rawCityActivities
      .filter((x) => x && x.activity)
      .map((x) => x.city ? `${x.activity} (${x.city})` : x.activity),
  );

  // Sexual preferences
  const sharedSexualPreferences = dedupe(
    Array.isArray(compatibilityData?.sharedSexualPreferences)
      ? compatibilityData!.sharedSexualPreferences!.filter(Boolean)
      : [],
  );

  // Roll remaining breakdown arrays into otherCommonalities
  const extraArrays: string[] = [
    ...(Array.isArray(compatibilityData?.otherCommonalities) ? compatibilityData!.otherCommonalities!.filter(Boolean) : []),
    ...(Array.isArray(compatibilityData?.sharedTravelStyle) ? compatibilityData!.sharedTravelStyle!.filter(Boolean) : []),
    ...(Array.isArray(compatibilityData?.sharedTags) ? compatibilityData!.sharedTags!.filter(Boolean) : []),
    ...(Array.isArray(compatibilityData?.sharedExpertise) ? compatibilityData!.sharedExpertise!.filter(Boolean) : []),
    ...(Array.isArray(compatibilityData?.sharedCustomActivities) ? compatibilityData!.sharedCustomActivities!.filter(Boolean) : []),
    ...(Array.isArray(compatibilityData?.sharedCustomEvents) ? compatibilityData!.sharedCustomEvents!.filter(Boolean) : []),
    ...(Array.isArray(compatibilityData?.sharedDefaultInterests) ? compatibilityData!.sharedDefaultInterests!.filter(Boolean) : []),
    ...(Array.isArray(compatibilityData?.sharedSecretActivities) ? compatibilityData!.sharedSecretActivities!.filter(Boolean) : []),
  ];
  const alreadyShown = new Set([
    ...sharedInterests.map(v => v.toLowerCase()),
    ...sharedActivities.map(v => v.toLowerCase()),
    ...sharedEvents.map(v => v.toLowerCase()),
  ]);
  const otherCommonalities = dedupe(extraArrays).filter(
    v => !alreadyShown.has(v.toLowerCase())
  );

  const sharedContactsCount = Math.max(0, Number(connectionDegreeData?.mutualCount || 0) || 0);

  // The server's matchCount is authoritative — it includes ALL factors (hostel match,
  // same gender, travel intent, travel style, etc.) that never appear as tagged arrays.
  // Using only the array sums would show 0 even when there are real things in common.
  const serverMatchCount =
    typeof compatibilityData?.matchCount === "number" &&
    Number.isFinite(compatibilityData.matchCount) &&
    compatibilityData.matchCount >= 0
      ? compatibilityData.matchCount
      : null;

  const arraySum =
    sharedInterests.length +
    sharedActivities.length +
    sharedEvents.length +
    sharedCountries.length +
    sharedLanguagesNonEnglish.length +
    sharedCityActivities.length +
    sharedSexualPreferences.length +
    otherCommonalities.length;

  // Prefer the server's matchCount (comprehensive) + mutual contacts.
  // Fall back to array sum if matchCount is not available.
  const totalCommon =
    serverMatchCount !== null
      ? serverMatchCount + sharedContactsCount
      : arraySum + sharedContactsCount;

  return {
    sharedInterests,
    sharedActivities,
    sharedEvents,
    sharedCountries,
    sharedLanguagesNonEnglish,
    sharedCityActivities,
    sharedSexualPreferences,
    otherCommonalities,
    sharedContactsCount,
    totalCommon,
  };
}
