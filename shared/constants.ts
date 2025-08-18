// Metro Area Consolidation Configuration
// This file defines which cities belong to metro areas for search and display purposes

export const METRO_AREAS = {
  'Los Angeles': {
    mainCity: 'Los Angeles',
    metroName: 'Los Angeles Metro',
    cities: [
      'Los Angeles',
      'Playa del Rey',
      'Santa Monica', 
      'Venice',
      'Venice Beach',
      'Culver City',
      'Marina del Rey',
      'El Segundo',
      'Manhattan Beach',
      'Hermosa Beach',
      'Redondo Beach',
      'Beverly Hills',
      'West Hollywood',
      'Hollywood',
      'North Hollywood',
      'Burbank',
      'Glendale',
      'Pasadena',
      'South Pasadena',
      'Long Beach',
      'Torrance',
      'Inglewood',
      'Hawthorne',
      'Gardena',
      'Carson',
      'Compton',
      'Downey',
      'Norwalk',
      'Whittier',
      'Pomona',
      'West LA',
      'Westwood',
      'Brentwood',
      'Pacific Palisades',
      'Malibu',
      'Studio City',
      'Sherman Oaks',
      'Encino',
      'Tarzana',
      'Woodland Hills',
      'Canoga Park',
      'Chatsworth',
      'Northridge',
      'Granada Hills',
      'Van Nuys',
      'Reseda',
      'Panorama City',
      'Sun Valley',
      'Pacoima',
      'Sylmar',
      'Mission Hills',
      'Eagle Rock',
      'Highland Park',
      'Silver Lake',
      'Echo Park',
      'Los Feliz',
      'Atwater Village',
      'Downtown LA',
      'Koreatown',
      'Mid-City',
      'Miracle Mile',
      'Crenshaw',
      'Leimert Park',
      'Baldwin Hills',
      'Ladera Heights',
      'View Park',
      'Watts',
      'South LA',
      'Boyle Heights',
      'East LA',
      'East Los Angeles',
      'Monterey Park',
      'Alhambra',
      'Montebello',
      'San Pedro',
      'Wilmington',
      'Harbor City',
      'Harbor Gateway'
    ]
  }
} as const;

// Helper function to check if a city is part of LA Metro
export function isLAMetroCity(city: string | null | undefined): boolean {
  if (!city) return false;
  
  const normalizedCity = city.toLowerCase().trim();
  const laMetro = METRO_AREAS['Los Angeles'];
  
  return laMetro.cities.some(metroCity => 
    normalizedCity.includes(metroCity.toLowerCase())
  );
}

// Helper function to get metro area for a city
export function getMetroArea(city: string | null | undefined): string | null {
  if (!city) return null;
  
  const normalizedCity = city.toLowerCase().trim();
  
  for (const [key, metro] of Object.entries(METRO_AREAS)) {
    if (metro.cities.some(metroCity => 
      normalizedCity.includes(metroCity.toLowerCase())
    )) {
      return metro.metroName;
    }
  }
  
  return null;
}

// Helper function to get all cities in a metro area
export function getMetroCities(metroOrCity: string): string[] {
  const normalized = metroOrCity.toLowerCase().trim();
  
  // Check if it's Los Angeles or any LA metro city
  if (normalized.includes('los angeles') || isLAMetroCity(metroOrCity)) {
    return [...METRO_AREAS['Los Angeles'].cities];
  }
  
  return [];
}

// Export the LA Metro cities list for backward compatibility
export const LA_METRO_CITIES = METRO_AREAS['Los Angeles'].cities;