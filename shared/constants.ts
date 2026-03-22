// Metro Area Consolidation Configuration
// This file defines which cities belong to metro areas for search and display purposes

export const METRO_AREAS = {
  'Los Angeles': {
    mainCity: 'Los Angeles',
    metroName: 'Los Angeles Metro',
    cities: [
      // Core LA
      'Los Angeles', 'Hollywood', 'North Hollywood', 'West Hollywood', 'East Los Angeles', 'East LA',
      'Downtown LA', 'Koreatown', 'Mid-City', 'Miracle Mile', 'Crenshaw',
      'Leimert Park', 'Baldwin Hills', 'Ladera Heights', 'View Park', 'Watts',
      'South LA', 'Boyle Heights', 'Silver Lake', 'Echo Park', 'Los Feliz',
      'Atwater Village', 'Eagle Rock', 'Highland Park', 'Century City', 'West LA',
      'Westwood', 'Brentwood', 'Pacific Palisades', 'LAX',
      'San Pedro', 'Wilmington', 'Harbor City', 'Harbor Gateway',
      // San Fernando Valley
      'Burbank', 'Glendale', 'San Fernando', 'Studio City', 'Sherman Oaks',
      'Encino', 'Reseda', 'Van Nuys', 'Northridge', 'Tarzana', 'Woodland Hills',
      'Canoga Park', 'Chatsworth', 'Granada Hills', 'Panorama City', 'Sun Valley',
      'Pacoima', 'Sylmar', 'Mission Hills',
      // Westside & Beach Cities
      'Santa Monica', 'Venice', 'Venice Beach', 'Malibu', 'Playa del Rey',
      'Marina del Rey', 'Culver City', 'El Segundo', 'Manhattan Beach',
      'Hermosa Beach', 'Redondo Beach',
      // South Bay
      'Torrance', 'Hawthorne', 'Gardena', 'Carson', 'Lomita', 'Lawndale',
      'Palos Verdes Estates', 'Rancho Palos Verdes', 'Rolling Hills',
      // Gateway Cities
      'Long Beach', 'Signal Hill', 'Lakewood', 'Cerritos', 'Bellflower',
      'Norwalk', 'Downey', 'Paramount', 'Compton', 'Lynwood', 'South Gate',
      'Bell', 'Bell Gardens', 'Maywood', 'Huntington Park', 'Commerce',
      'Montebello', 'Pico Rivera', 'Santa Fe Springs', 'La Mirada',
      // San Gabriel Valley
      'Pasadena', 'South Pasadena', 'Alhambra', 'Monterey Park', 'Arcadia',
      'Monrovia', 'El Monte', 'South El Monte', 'Rosemead', 'Temple City',
      'San Gabriel', 'San Marino', 'Sierra Madre', 'Duarte', 'Azusa',
      'Glendora', 'Covina', 'West Covina', 'La Puente', 'Baldwin Park',
      'La Verne', 'San Dimas', 'Claremont', 'Diamond Bar', 'Pomona',
      'Walnut', 'Industry', 'La Canada Flintridge', 'La Habra Heights',
      // Other
      'Beverly Hills', 'Inglewood', 'Whittier', 'Santa Clarita', 'Lancaster',
      'Palmdale', 'Hidden Hills', 'Westlake Village', 'Vernon', 'Irwindale',
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
    // Include both individual cities AND "Los Angeles Metro" for chatrooms/entities stored with metro name
    return [...METRO_AREAS['Los Angeles'].cities, 'Los Angeles Metro'];
  }
  
  return [];
}

// Export the LA Metro cities list for backward compatibility
export const LA_METRO_CITIES = METRO_AREAS['Los Angeles'].cities;