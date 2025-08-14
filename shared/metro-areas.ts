// Metropolitan Area Consolidation System
// This ensures users from metro suburbs are captured as both their specific city AND the metro area

export const METRO_AREAS = {
  "Los Angeles Metro": [
    'Los Angeles', 'Santa Monica', 'Venice', 'Venice Beach', 'El Segundo',
    'Manhattan Beach', 'Beverly Hills', 'West Hollywood', 'Pasadena', 'Burbank',
    'Glendale', 'Long Beach', 'Torrance', 'Inglewood', 'Compton', 'Downey',
    'Pomona', 'Playa del Rey', 'Redondo Beach', 'Culver City', 'Marina del Rey',
    'Hermosa Beach', 'Hawthorne', 'Gardena', 'Carson', 'Lakewood', 'Norwalk',
    'Whittier', 'Montebello', 'East Los Angeles', 'Monterey Park', 'Alhambra',
    'South Pasadena', 'San Fernando', 'North Hollywood', 'Hollywood', 'Studio City',
    'Sherman Oaks', 'Encino', 'Reseda', 'Van Nuys', 'Northridge', 'Malibu',
    'Pacific Palisades', 'Brentwood', 'Westwood', 'Century City', 'West LA',
    'LAX', 'El Monte', 'Arcadia', 'Monrovia', 'Covina', 'West Covina'
  ],
  
  "New York Metro": [
    'New York', 'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island',
    'Jersey City', 'Newark', 'Hoboken', 'Weehawken', 'Union City', 'North Bergen',
    'West New York', 'Secaucus', 'Bayonne', 'Kearny', 'Harrison', 'East Orange',
    'Orange', 'Irvington', 'Maplewood', 'South Orange', 'Millburn', 'Summit',
    'Westfield', 'Cranford', 'Rahway', 'Linden', 'Elizabeth', 'Roselle',
    'Kenilworth', 'Union', 'Springfield', 'Mountainside', 'Berkeley Heights',
    'New Providence', 'Chatham', 'Madison', 'Morristown', 'Florham Park',
    'East Hanover', 'Livingston', 'West Orange', 'Montclair', 'Glen Ridge',
    'Bloomfield', 'Nutley', 'Belleville', 'Lyndhurst', 'Rutherford',
    'East Rutherford', 'Carlstadt', 'Wood Ridge', 'Hasbrouck Heights',
    'Lodi', 'Garfield', 'Wallington', 'Saddle Brook', 'Elmwood Park',
    'Fair Lawn', 'Glen Rock', 'Ridgewood', 'Paramus', 'River Edge',
    'New Milford', 'Bergenfield', 'Dumont', 'Cresskill', 'Demarest',
    'Closter', 'Alpine', 'Norwood', 'Northvale', 'Old Tappan', 'Harrington Park',
    'Westwood', 'Washington Township', 'Hillsdale', 'Montvale', 'Park Ridge',
    'Woodcliff Lake', 'Saddle River', 'Upper Saddle River', 'Mahwah', 'Ramsey',
    'Allendale', 'Wyckoff', 'Franklin Lakes', 'Oakland', 'Ridgewood'
  ],

  "San Francisco Bay Area": [
    'San Francisco', 'Oakland', 'San Jose', 'Fremont', 'Santa Clara',
    'Sunnyvale', 'Hayward', 'Concord', 'Berkeley', 'Richmond', 'Antioch',
    'Daly City', 'San Mateo', 'Vallejo', 'Livermore', 'Visalia', 'Fairfield',
    'Redwood City', 'Santa Rosa', 'Petaluma', 'Mountain View', 'Palo Alto',
    'Union City', 'Pleasanton', 'San Leandro', 'Tracy', 'San Rafael',
    'Dublin', 'Pittsburg', 'Alameda', 'South San Francisco', 'Cupertino',
    'San Bruno', 'Pacifica', 'Castro Valley', 'Foster City', 'Belmont',
    'San Carlos', 'Half Moon Bay', 'Millbrae', 'Burlingame', 'San Mateo',
    'Menlo Park', 'Atherton', 'Portola Valley', 'Woodside', 'Los Altos',
    'Los Altos Hills', 'Saratoga', 'Campbell', 'Los Gatos', 'Monte Sereno',
    'Milpitas', 'Newark', 'Union City', 'Hayward', 'San Lorenzo', 'Castro Valley',
    'Dublin', 'Pleasanton', 'Livermore', 'Danville', 'San Ramon',
    'Walnut Creek', 'Lafayette', 'Orinda', 'Moraga', 'Martinez', 'Pleasant Hill',
    'Concord', 'Clayton', 'Antioch', 'Pittsburg', 'Brentwood', 'Oakley',
    'Discovery Bay', 'Byron', 'Knightsen', 'Bethel Island'
  ],

  "Chicago Metro": [
    'Chicago', 'Aurora', 'Naperville', 'Elgin', 'Cicero', 'Schaumburg',
    'Evanston', 'Des Plaines', 'Berwyn', 'Oak Lawn', 'Mount Prospect',
    'Hoffman Estates', 'Oak Park', 'Downers Grove', 'Elmhurst', 'Lombard',
    'Carol Stream', 'Streamwood', 'Hanover Park', 'Bartlett', 'Addison',
    'Villa Park', 'Bensenville', 'Wood Dale', 'Itasca', 'Roselle',
    'Bloomingdale', 'Glendale Heights', 'Glen Ellyn', 'Wheaton', 'Warrenville',
    'Winfield', 'West Chicago', 'St. Charles', 'Geneva', 'Batavia',
    'North Aurora', 'Sugar Grove', 'Montgomery', 'Oswego', 'Yorkville',
    'Plano', 'Sandwich', 'Somonauk', 'Leland', 'Sheridan', 'Millington',
    'Newark', 'Minooka', 'Channahon', 'Shorewood', 'Joliet', 'Romeoville',
    'Bolingbrook', 'Woodridge', 'Darien', 'Westmont', 'Clarendon Hills',
    'Hinsdale', 'Western Springs', 'La Grange', 'La Grange Park',
    'Brookfield', 'Riverside', 'North Riverside', 'Forest Park',
    'River Forest', 'Oak Park', 'River Grove', 'Franklin Park',
    'Northlake', 'Melrose Park', 'Maywood', 'Broadview', 'Westchester',
    'Hillside', 'Berkeley', 'Bellwood', 'Stone Park', 'Elmwood Park'
  ]
};

export interface MetroAreaDetection {
  isMetroCity: boolean;
  metroAreaName: string | null;
  specificCity: string;
}

/**
 * Detects if a city is part of a metro area
 */
export function detectMetroArea(city: string): MetroAreaDetection {
  const cityLower = city.toLowerCase().trim();
  
  for (const [metroName, cities] of Object.entries(METRO_AREAS)) {
    const isInMetro = cities.some(metroCity => 
      cityLower === metroCity.toLowerCase() ||
      cityLower.includes(metroCity.toLowerCase()) ||
      metroCity.toLowerCase().includes(cityLower)
    );
    
    if (isInMetro) {
      return {
        isMetroCity: true,
        metroAreaName: metroName,
        specificCity: city
      };
    }
  }
  
  return {
    isMetroCity: false,
    metroAreaName: null,
    specificCity: city
  };
}

/**
 * Gets the metro area name for a city, or returns the original city if not in a metro
 */
export function getMetroAreaName(city: string): string {
  const detection = detectMetroArea(city);
  return detection.metroAreaName || city;
}

/**
 * Gets all cities in a metro area
 */
export function getMetroCities(metroAreaName: string): string[] {
  return METRO_AREAS[metroAreaName] || [];
}

/**
 * Check if two cities are in the same metro area
 */
export function areInSameMetro(city1: string, city2: string): boolean {
  const detection1 = detectMetroArea(city1);
  const detection2 = detectMetroArea(city2);
  
  if (!detection1.isMetroCity || !detection2.isMetroCity) {
    return false;
  }
  
  return detection1.metroAreaName === detection2.metroAreaName;
}