// Helper functions for unified field access across the app
// These functions provide a single interface for accessing user data
// regardless of whether they were stored in old or new field structures

import type { User } from "@shared/schema";

/**
 * Get user's interests using unified approach
 * Prioritizes: interests > defaultTravelInterests > localInterests (fallback)
 */
export function getUserInterests(user: User | null): string[] {
  if (!user) return [];
  return user.interests || user.defaultTravelInterests || [];
}

/**
 * Get user's activities using unified approach  
 * Prioritizes: activities > localActivities > defaultTravelActivities (fallback)
 */
export function getUserActivities(user: User | null): string[] {
  if (!user) return [];
  return user.activities || user.localActivities || user.defaultTravelActivities || [];
}

/**
 * Get user's events using unified approach
 * Prioritizes: events > localEvents > defaultTravelEvents (fallback)
 */
export function getUserEvents(user: User | null): string[] {
  if (!user) return [];
  return user.events || user.localEvents || user.defaultTravelEvents || [];
}

/**
 * Get user's travel styles using unified approach
 */
export function getUserTravelStyles(user: User | null): string[] {
  if (!user) return [];
  return user.travelStyle || [];
}

/**
 * Get user's languages using unified approach
 */
export function getUserLanguages(user: User | null): string[] {
  if (!user) return [];
  return user.languagesSpoken || [];
}

/**
 * Get user's countries visited using unified approach
 */
export function getUserCountries(user: User | null): string[] {
  if (!user) return [];
  return user.countriesVisited || [];
}