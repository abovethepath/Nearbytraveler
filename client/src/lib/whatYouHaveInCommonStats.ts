export type CompatibilityLike = {
  matchCount?: number | null;
  sharedInterests?: string[] | null;
  sharedActivities?: string[] | null;
  sharedEvents?: string[] | null;
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
  // New fields
  sharedChatrooms?: string[] | null;
  sharedCommunityTags?: string[] | null;
  sharedTravelPlans?: string[] | null;
  sameHostel?: string[] | null;
  sameHometown?: boolean | null;
  sameCurrentCity?: boolean | null;
  bothHaveChildren?: boolean | null;
  childrenAgesSimilar?: boolean | null;
  bothNewToTown?: boolean | null;
  bothVeterans?: boolean | null;
  bothActiveDuty?: boolean | null;
  // Private interests — only populated when viewer is authorized
  sharedPrivateInterests?: string[] | null;
  // Metro area match
  sameMetroArea?: string | null;
};

export type ConnectionDegreeLike = {
  mutualCount?: number | null;
};

export interface CommonStats {
  sharedInterests: string[];
  sharedActivities: string[];
  sharedEvents: string[];
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

  // Boolean fields → label strings
  const booleanLabels: string[] = [];
  if (compatibilityData?.sameHometown) booleanLabels.push('Same hometown');
  if (compatibilityData?.sameCurrentCity) booleanLabels.push('Both in same city');
  if (compatibilityData?.bothHaveChildren) booleanLabels.push('Both traveling with kids');
  if (compatibilityData?.childrenAgesSimilar) booleanLabels.push("Kids similar ages");
  // "Both new to town" removed — being new to different cities is not a shared thing
  if (compatibilityData?.bothVeterans) booleanLabels.push('Both veterans');
  if (compatibilityData?.bothActiveDuty) booleanLabels.push('Both active duty');
  if (compatibilityData?.sameMetroArea) booleanLabels.push(`Both in ${compatibilityData.sameMetroArea}`);

  // Roll remaining breakdown arrays + new arrays + boolean labels into otherCommonalities
  const extraArrays: string[] = [
    ...(Array.isArray(compatibilityData?.otherCommonalities) ? compatibilityData!.otherCommonalities!.filter(Boolean) : []),
    ...(Array.isArray(compatibilityData?.sharedTravelStyle) ? compatibilityData!.sharedTravelStyle!.filter(Boolean) : []),
    ...(Array.isArray(compatibilityData?.sharedTags) ? compatibilityData!.sharedTags!.filter(Boolean) : []),
    ...(Array.isArray(compatibilityData?.sharedExpertise) ? compatibilityData!.sharedExpertise!.filter(Boolean) : []),
    ...(Array.isArray(compatibilityData?.sharedCustomActivities) ? compatibilityData!.sharedCustomActivities!.filter(Boolean) : []),
    ...(Array.isArray(compatibilityData?.sharedCustomEvents) ? compatibilityData!.sharedCustomEvents!.filter(Boolean) : []),
    ...(Array.isArray(compatibilityData?.sharedDefaultInterests) ? compatibilityData!.sharedDefaultInterests!.filter(Boolean) : []),
    ...(Array.isArray(compatibilityData?.sharedSecretActivities) ? compatibilityData!.sharedSecretActivities!.filter(Boolean) : []),
    ...(Array.isArray(compatibilityData?.sharedChatrooms) ? compatibilityData!.sharedChatrooms!.filter(Boolean) : []),
    ...(Array.isArray(compatibilityData?.sharedCommunityTags) ? compatibilityData!.sharedCommunityTags!.filter(Boolean) : []),
    ...(Array.isArray(compatibilityData?.sharedTravelPlans) ? compatibilityData!.sharedTravelPlans!.filter(Boolean) : []),
    ...(Array.isArray(compatibilityData?.sameHostel) ? compatibilityData!.sameHostel!.filter(Boolean) : []),
    ...(Array.isArray(compatibilityData?.sharedPrivateInterests) ? compatibilityData!.sharedPrivateInterests!.filter(Boolean) : []),
    ...booleanLabels,
  ];
  const alreadyShown = new Set([
    ...sharedInterests.map(v => v.toLowerCase()),
    ...sharedActivities.map(v => v.toLowerCase()),
    ...sharedEvents.map(v => v.toLowerCase()),
  ]);
  const blockedOtherCommonalities = new Set([
    "welcome to los angeles metro",
    "welcome to nearby traveler",
    "same gender",
    "united states",
    "usa",
    "english",
    "us",
    "america",
    "new to town",
    "new-to-town",
    "both new to town",
    "both new in town",
  ]);
  const otherCommonalities = dedupe(extraArrays)
    .filter((v) => !blockedOtherCommonalities.has(v.toLowerCase()))
    .filter((v) => !v.toLowerCase().startsWith("welcome to"))
    .filter((v) => !alreadyShown.has(v.toLowerCase()));

  const sharedContactsCount = Math.max(0, Number(connectionDegreeData?.mutualCount || 0) || 0);

  // Count only what is actually rendered as pills so the badge matches exactly.
  // Each category below corresponds 1-to-1 with a rendered pill or group of pills.
  // Do NOT add boolean flags or sub-arrays (chatrooms, communityTags, travelPlans, etc.)
  // here — they are already folded into otherCommonalities above.
  const totalCommon =
    sharedInterests.length +
    sharedActivities.length +
    sharedEvents.length +
    sharedLanguagesNonEnglish.length +
    sharedCityActivities.length +
    sharedSexualPreferences.length +
    otherCommonalities.length;

  return {
    sharedInterests,
    sharedActivities,
    sharedEvents,
    sharedLanguagesNonEnglish,
    sharedCityActivities,
    sharedSexualPreferences,
    otherCommonalities,
    sharedContactsCount,
    totalCommon,
  };
}
