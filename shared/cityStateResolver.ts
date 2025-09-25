// Shared City-State Resolver for API Integrations
// Handles LA Metro consolidation and broader city-state mapping

import { METRO_AREAS } from './constants';

// Extended city-state mapping for common US cities
const CITY_STATE_MAP: { [key: string]: string } = {
  // Major cities
  'austin': 'TX',
  'los angeles': 'CA',
  'las vegas': 'NV', 
  'new york': 'NY',
  'new york city': 'NY',
  'nyc': 'NY',
  'chicago': 'IL',
  'miami': 'FL',
  'san francisco': 'CA',
  'seattle': 'WA',
  'denver': 'CO',
  'atlanta': 'GA',
  'boston': 'MA',
  'philadelphia': 'PA',
  'phoenix': 'AZ',
  'houston': 'TX',
  'dallas': 'TX',
  'san antonio': 'TX',
  'san diego': 'CA',
  'portland': 'OR',
  'minneapolis': 'MN',
  'detroit': 'MI',
  'nashville': 'TN',
  'orlando': 'FL',
  'tampa': 'FL',
  'charlotte': 'NC',
  'kansas city': 'MO',
  'cleveland': 'OH',
  'columbus': 'OH',
  'indianapolis': 'IN',
  'milwaukee': 'WI',
  'baltimore': 'MD',
  'pittsburgh': 'PA',
  'cincinnati': 'OH',
  'sacramento': 'CA',
  'fresno': 'CA',
  'oakland': 'CA',
  'san jose': 'CA',
  'long beach': 'CA',
  'riverside': 'CA',
  'anaheim': 'CA',
  'santa ana': 'CA',
  'bakersfield': 'CA',
  'stockton': 'CA',
  'fremont': 'CA',
  'irvine': 'CA',
  'chula vista': 'CA',
  'san bernardino': 'CA',
  'modesto': 'CA',
  'fontana': 'CA',
  'oxnard': 'CA',
  'moreno valley': 'CA',
  'glendale': 'CA',
  'huntington beach': 'CA',
  'santa clarita': 'CA',
  'garden grove': 'CA',
  'oceanside': 'CA',
  'rancho cucamonga': 'CA',
  'ontario': 'CA',
  'lancaster': 'CA',
  'palmdale': 'CA',
  'salinas': 'CA',
  'pomona': 'CA',
  'torrance': 'CA',
  'hayward': 'CA',
  'sunnyvale': 'CA',
  'pasadena': 'CA',
  'fullerton': 'CA',
  'orange': 'CA',
  'thousand oaks': 'CA',
  'visalia': 'CA',
  'roseville': 'CA',
  'concord': 'CA',
  'simi valley': 'CA',
  'santa rosa': 'CA',
  'victorville': 'CA',
  'vallejo': 'CA',
  'antioch': 'CA',
  'richmond': 'CA',
  'norwalk': 'CA',
  'burbank': 'CA',
  'daly city': 'CA',
  'rialto': 'CA',
  'san mateo': 'CA',
  'el monte': 'CA',
  'jurupa valley': 'CA',
  'temecula': 'CA',
  'inglewood': 'CA',
  'downey': 'CA',
  'hemet': 'CA',
  'lakewood': 'CA',
  'costa mesa': 'CA',
  'ventura': 'CA',
  'west covina': 'CA',
  'carlsbad': 'CA',
  'fairfield': 'CA',
  'murrieta': 'CA',
  'santa maria': 'CA',
  'el cajon': 'CA',
  'berkeley': 'CA',
  'santa monica': 'CA',
  'venice': 'CA',
  'beverly hills': 'CA',
  'west hollywood': 'CA',
  'culver city': 'CA',
  'manhattan beach': 'CA',
  'hermosa beach': 'CA',
  'redondo beach': 'CA',
  'el segundo': 'CA', // CRITICAL FIX: El Segundo is in California!
  'hawthorne': 'CA',
  'lawndale': 'CA',
  'gardena': 'CA',
  'compton': 'CA',
  'lynwood': 'CA',
  'south gate': 'CA',
  'huntington park': 'CA',
  'bell': 'CA',
  'bell gardens': 'CA',
  'maywood': 'CA',
  'vernon': 'CA',
  'commerce': 'CA',
  'monterey park': 'CA',
  'alhambra': 'CA',
  'san gabriel': 'CA',
  'rosemead': 'CA',
  'temple city': 'CA',
  'arcadia': 'CA',
  'monrovia': 'CA',
  'duarte': 'CA',
  'azusa': 'CA',
  'covina': 'CA',
  'glendora': 'CA',
  'la verne': 'CA',
  'claremont': 'CA',
  'montclair': 'CA',
  'upland': 'CA',
  'redlands': 'CA',
  'yucaipa': 'CA',
  'calimesa': 'CA',
  'beaumont': 'CA',
  'banning': 'CA',
  'cabazon': 'CA',
  'desert hot springs': 'CA',
  'palm springs': 'CA',
  'cathedral city': 'CA',
  'rancho mirage': 'CA',
  'palm desert': 'CA',
  'indian wells': 'CA',
  'la quinta': 'CA',
  'indio': 'CA',
  'coachella': 'CA',
  'thermal': 'CA',
  'mecca': 'CA',
  'salton city': 'CA'
};

/**
 * Resolves the state code for a given city name
 * Handles LA Metro consolidation and extended city mappings
 */
export function resolveStateForCity(cityName: string): string {
  if (!cityName) return 'CA'; // Default to California for safety
  
  const normalizedCity = cityName.toLowerCase().trim();
  
  // First check if it's in the LA Metro area
  for (const [key, metroArea] of Object.entries(METRO_AREAS)) {
    for (const city of metroArea.cities) {
      if (city.toLowerCase() === normalizedCity) {
        return 'CA'; // All LA Metro cities are in California
      }
    }
  }
  
  // Check the extended city-state mapping
  const stateCode = CITY_STATE_MAP[normalizedCity];
  if (stateCode) {
    return stateCode;
  }
  
  // If not found, try to infer from common patterns
  if (normalizedCity.includes('los angeles') || 
      normalizedCity.includes('hollywood') ||
      normalizedCity.includes('beverly') ||
      normalizedCity.includes('santa monica') ||
      normalizedCity.includes('venice')) {
    return 'CA';
  }
  
  // Default to CA for safety (many of our users are in California)
  console.log(`🗺️ CITY RESOLVER: Unknown city "${cityName}", defaulting to CA`);
  return 'CA';
}

/**
 * Checks if a city is part of the LA Metro area
 */
export function isLAMetroCity(cityName: string): boolean {
  const normalizedCity = cityName.toLowerCase().trim();
  
  for (const [key, metroArea] of Object.entries(METRO_AREAS)) {
    for (const city of metroArea.cities) {
      if (city.toLowerCase() === normalizedCity) {
        return true;
      }
    }
  }
  
  return false;
}