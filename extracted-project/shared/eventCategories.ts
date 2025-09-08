// UNIFIED EVENT CATEGORIES - Single source of truth for all event categorization
// Eliminates duplicate overlapping categories/tags across the platform

export const EVENT_CATEGORIES = [
  "Food & Dining",
  "Social & Networking", 
  "Health & Wellness",
  "Arts & Culture",
  "Music & Entertainment",
  "Sports & Fitness",
  "Family Activities",
  "Nightlife & Parties",
  "Education & Learning",
  "Business & Professional",
  "Custom" // For user-defined categories
] as const;

// Optional additional tags for more specific filtering (non-overlapping)
export const EVENT_TAGS = [
  "Free Event",
  "Pet Friendly",
  "LGBTQ+ Friendly", 
  "Solo Travelers Welcome",
  "Language Exchange",
  "Outdoor Event",
  "Indoor Event",
  "Beginner Friendly",
  "Advanced Level"
] as const;

export type EventCategory = typeof EVENT_CATEGORIES[number];
export type EventTag = typeof EVENT_TAGS[number];