export type CompatibilityLike = {
  matchCount?: number | null;
  sharedInterests?: string[] | null;
  sharedActivities?: string[] | null;
  sharedEvents?: string[] | null;
  sharedCountries?: string[] | null;
  sharedLanguages?: string[] | null;
  otherCommonalities?: string[] | null;
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
  const otherCommonalities = dedupe(Array.isArray(compatibilityData?.otherCommonalities) ? compatibilityData!.otherCommonalities!.filter(Boolean) : []);

  const sharedLanguagesNonEnglish = sharedLanguagesRaw.filter((l) => {
    const n = String(l || "").trim().toLowerCase();
    return !!n && n !== "english";
  });

  const sharedContactsCount = Math.max(0, Number(connectionDegreeData?.mutualCount || 0) || 0);

  // Single source of truth: derive total from the actual shared arrays + mutual contacts count.
  // Do NOT trust matchCount because it can diverge from arrays (and causes UI inconsistencies).
  const computedTotal =
    sharedContactsCount +
    sharedInterests.length +
    sharedActivities.length +
    sharedEvents.length +
    sharedCountries.length +
    sharedLanguagesNonEnglish.length +
    otherCommonalities.length;

  return {
    sharedInterests,
    sharedActivities,
    sharedEvents,
    sharedCountries,
    sharedLanguagesNonEnglish,
    otherCommonalities,
    sharedContactsCount,
    totalCommon: computedTotal,
  };
}

