import { eq, or, and, ilike, isNotNull } from "drizzle-orm";
import { users } from "../../shared/schema";
import { detectMetroArea, getMetroCities } from "../../shared/metro-areas";

/**
 * Metro Area Query Utils
 * 
 * This provides the core functionality to query users considering metro area consolidation.
 * Users can be found by their specific city OR their metro area.
 */

export interface MetroAreaQuery {
  searchCity: string;
  isMetroSearch: boolean;
  metroAreaName?: string;
  includedCities?: string[];
}

/**
 * Analyzes a city search and returns the appropriate query strategy
 */
export function analyzeMetroSearch(cityName: string): MetroAreaQuery {
  const detection = detectMetroArea(cityName);
  
  if (detection.isMetroCity) {
    // If they're searching for a metro city, include ALL cities in that metro
    const includedCities = getMetroCities(detection.metroAreaName!);
    
    return {
      searchCity: cityName,
      isMetroSearch: true,
      metroAreaName: detection.metroAreaName!,
      includedCities
    };
  }
  
  return {
    searchCity: cityName,
    isMetroSearch: false
  };
}

/**
 * Creates SQL WHERE conditions to find users by city considering metro areas
 * 
 * This is the core logic that makes metro area consolidation work:
 * 1. Find users in the specific city requested
 * 2. Find metro users whose metro area matches
 * 3. If searching a metro city, find users in ALL cities in that metro
 */
export function createMetroAwareUserQuery(cityName: string) {
  const analysis = analyzeMetroSearch(cityName);
  
  if (analysis.isMetroSearch && analysis.includedCities) {
    // METRO SEARCH: Find users in any city within this metro area
    const cityConditions = analysis.includedCities.map(city => 
      ilike(users.hometownCity, `%${city}%`)
    );
    
    const metroCondition = and(
      eq(users.isMetroUser, true),
      eq(users.metroArea, analysis.metroAreaName!)
    );
    
    return or(
      ...cityConditions,
      metroCondition
    );
  } else {
    // REGULAR SEARCH: Find users in specific city or metro users whose metro matches
    const detection = detectMetroArea(cityName);
    
    const cityCondition = ilike(users.hometownCity, `%${cityName}%`);
    
    if (detection.isMetroCity) {
      // Also find metro users in this metro area
      const metroCondition = and(
        eq(users.isMetroUser, true),
        eq(users.metroArea, detection.metroAreaName!)
      );
      
      return or(cityCondition, metroCondition);
    }
    
    return cityCondition;
  }
}

/**
 * Gets all cities that should be considered when searching for a location
 * This includes the specific city plus all metro cities if applicable
 */
export function getSearchableCities(cityName: string): string[] {
  const analysis = analyzeMetroSearch(cityName);
  
  if (analysis.isMetroSearch && analysis.includedCities) {
    return [cityName, ...analysis.includedCities];
  }
  
  return [cityName];
}

/**
 * Determines the effective city name for routing/display purposes
 * FIXED: Now preserves user's specific city and only uses metro for backend matching
 */
export function getEffectiveCityName(userCity: string, userMetroArea?: string | null, userIsMetroUser?: boolean): string {
  if (userIsMetroUser && userMetroArea) {
    return userMetroArea; // Show metro area ONLY for users who explicitly chose metro
  }
  
  // CRITICAL FIX: Always preserve the user's specific city name
  // Metro area detection is for backend matching only, NOT display
  return userCity; // Always show user's specific city (Santa Monica, Playa del Rey, etc.)
}

/**
 * Check if a user should be visible in a city search
 * Considers both their specific city and metro area if applicable
 */
export function userMatchesLocationSearch(
  user: { hometownCity?: string; metroArea?: string; isMetroUser?: boolean },
  searchCity: string
): boolean {
  const userCity = user.hometownCity;
  const userMetro = user.metroArea;
  const isMetroUser = user.isMetroUser;
  
  if (!userCity) return false;
  
  // Direct city match
  if (userCity.toLowerCase().includes(searchCity.toLowerCase())) {
    return true;
  }
  
  // Metro area match
  if (isMetroUser && userMetro) {
    const searchDetection = detectMetroArea(searchCity);
    if (searchDetection.isMetroCity && searchDetection.metroAreaName === userMetro) {
      return true;
    }
  }
  
  return false;
}