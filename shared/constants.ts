// Metro Area Consolidation Configuration
// SINGLE SOURCE OF TRUTH: shared/metro-areas.ts — this file re-exports for backward compatibility.

import {
  METRO_AREAS as CANONICAL_METROS,
  detectMetroArea,
  getMetroAreaName,
  getMetroCities as canonicalGetMetroCities,
} from './metro-areas';

// Re-export in the legacy { 'Los Angeles': { mainCity, metroName, cities } } shape
// so existing callers like routes.ts line 2268 (METRO_AREAS['Los Angeles'].cities) keep working.
export const METRO_AREAS = {
  'Los Angeles': {
    mainCity: 'Los Angeles',
    metroName: 'Los Angeles Metro',
    cities: CANONICAL_METROS['Los Angeles Metro'] || [],
  },
} as const;

export function isLAMetroCity(city: string | null | undefined): boolean {
  if (!city) return false;
  return getMetroAreaName(city) === 'Los Angeles Metro';
}

export function getMetroArea(city: string | null | undefined): string | null {
  if (!city) return null;
  const metro = getMetroAreaName(city);
  return metro !== city ? metro : null;
}

export function getMetroCities(metroOrCity: string): string[] {
  const cities = canonicalGetMetroCities(metroOrCity);
  if (cities.length > 0) return [...cities, metroOrCity];
  const metroName = getMetroAreaName(metroOrCity);
  if (metroName !== metroOrCity) {
    const metroCities = canonicalGetMetroCities(metroName);
    return [...metroCities, metroName];
  }
  return [];
}

export const LA_METRO_CITIES = CANONICAL_METROS['Los Angeles Metro'] || [];