/**
 * Maps user interests/tags to communities.
 * When a user selects one of these interests, they get prompted to join
 * the corresponding community. Add new entries here to extend the mappings.
 */

export interface CommunityMapping {
  /** Interest strings that trigger this community prompt (case-insensitive match) */
  interests: string[];
  /** The community_tags.name slug used to look up the community */
  communitySlug: string;
  /** Display name shown in the prompt */
  communityDisplayName: string;
  /** Emoji icon for the prompt dialog */
  icon: string;
}

export const INTEREST_COMMUNITY_MAPPINGS: CommunityMapping[] = [
  {
    interests: ["Solo Female Traveler", "Solo Female Travel"],
    communitySlug: "solo-female-travelers",
    communityDisplayName: "Solo Female Travelers",
    icon: "👩",
  },
  {
    interests: ["Digital Nomad", "Digital Nomads"],
    communitySlug: "digital-nomads",
    communityDisplayName: "Digital Nomads",
    icon: "💻",
  },
  {
    interests: ["Food Tours", "Foodie", "Food", "Restaurants & Food Scene", "Food Trucks", "Farm-to-Table Dining", "Ethnic Cuisine"],
    communitySlug: "foodies",
    communityDisplayName: "Foodies",
    icon: "🍳",
  },
  {
    interests: ["LGBTQIA+", "LGBTQ+", "LGBTQIA+ Friendly"],
    communitySlug: "lgbtq-plus",
    communityDisplayName: "LGBTQ+",
    icon: "🏳️‍🌈",
  },
  {
    interests: ["Solo Traveler", "Solo Travel"],
    communitySlug: "solo-travelers",
    communityDisplayName: "Solo Travelers",
    icon: "🧳",
  },
  {
    interests: ["CouchSurfing"],
    communitySlug: "couchsurfing-community",
    communityDisplayName: "CouchSurfing Community",
    icon: "🛋️",
  },
  {
    interests: ["Veteran", "Veterans"],
    communitySlug: "veterans",
    communityDisplayName: "Veterans",
    icon: "🎖️",
  },
];

const DISMISSED_KEY = "nt_community_prompts_dismissed";

/** Get the set of community slugs the user has already dismissed. */
export function getDismissedCommunities(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

/** Mark a community as dismissed so the user won't be prompted again. */
export function dismissCommunity(slug: string) {
  const dismissed = getDismissedCommunities();
  dismissed.add(slug);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed]));
}

/**
 * Check if an interest has ANY community mapping (ignoring dismissed state).
 * Used for rendering badge indicators on pills.
 */
export function hasCommunityMapping(interest: string): CommunityMapping | null {
  const lower = interest.toLowerCase();
  for (const mapping of INTEREST_COMMUNITY_MAPPINGS) {
    if (mapping.interests.some((i) => i.toLowerCase() === lower)) {
      return mapping;
    }
  }
  return null;
}

/**
 * Given an interest that was just selected, return the matching community
 * mapping if one exists and hasn't been dismissed. Returns null otherwise.
 */
export function findCommunityForInterest(interest: string): CommunityMapping | null {
  const dismissed = getDismissedCommunities();
  const lower = interest.toLowerCase();
  for (const mapping of INTEREST_COMMUNITY_MAPPINGS) {
    if (mapping.interests.some((i) => i.toLowerCase() === lower)) {
      if (!dismissed.has(mapping.communitySlug)) {
        return mapping;
      }
    }
  }
  return null;
}
