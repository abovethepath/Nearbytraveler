// Location parsing and standardization utilities

export interface ParsedLocation {
  city: string;
  state?: string;
  country: string;
  fullLocation: string;
}

// Common state/region mappings for standardization
const STATE_MAPPINGS: Record<string, string> = {
  // US States
  'california': 'CA',
  'new york': 'NY',
  'florida': 'FL',
  'texas': 'TX',
  'illinois': 'IL',
  'pennsylvania': 'PA',
  'ohio': 'OH',
  'georgia': 'GA',
  'north carolina': 'NC',
  'michigan': 'MI',
  'new jersey': 'NJ',
  'virginia': 'VA',
  'washington': 'WA',
  'arizona': 'AZ',
  'massachusetts': 'MA',
  'tennessee': 'TN',
  'indiana': 'IN',
  'missouri': 'MO',
  'maryland': 'MD',
  'wisconsin': 'WI',
  'colorado': 'CO',
  'minnesota': 'MN',
  'south carolina': 'SC',
  'alabama': 'AL',
  'louisiana': 'LA',
  'kentucky': 'KY',
  'oregon': 'OR',
  'oklahoma': 'OK',
  'connecticut': 'CT',
  'utah': 'UT',
  'iowa': 'IA',
  'nevada': 'NV',
  'arkansas': 'AR',
  'mississippi': 'MS',
  'kansas': 'KS',
  'new mexico': 'NM',
  'nebraska': 'NE',
  'west virginia': 'WV',
  'idaho': 'ID',
  'hawaii': 'HI',
  'new hampshire': 'NH',
  'maine': 'ME',
  'montana': 'MT',
  'rhode island': 'RI',
  'delaware': 'DE',
  'south dakota': 'SD',
  'north dakota': 'ND',
  'alaska': 'AK',
  'vermont': 'VT',
  'wyoming': 'WY',
  
  // International regions/states
  'england': 'England',
  'scotland': 'Scotland',
  'wales': 'Wales',
  'northern ireland': 'Northern Ireland',
  'ontario': 'Ontario',
  'quebec': 'Quebec',
  'british columbia': 'British Columbia',
  'alberta': 'Alberta',
  'manitoba': 'Manitoba',
  'saskatchewan': 'Saskatchewan',
  'nova scotia': 'Nova Scotia',
  'new brunswick': 'New Brunswick',
  'newfoundland and labrador': 'Newfoundland and Labrador',
  'prince edward island': 'Prince Edward Island',
  'northwest territories': 'Northwest Territories',
  'nunavut': 'Nunavut',
  'yukon': 'Yukon'
};

// Country mappings for common variations
const COUNTRY_MAPPINGS: Record<string, string> = {
  'usa': 'United States',
  'us': 'United States',
  'america': 'United States',
  'united states of america': 'United States',
  'uk': 'United Kingdom',
  'britain': 'United Kingdom',
  'great britain': 'United Kingdom',
  'england': 'United Kingdom',
  'scotland': 'United Kingdom',
  'wales': 'United Kingdom',
  'northern ireland': 'United Kingdom',
  'canada': 'Canada',
  'france': 'France',
  'germany': 'Germany',
  'italy': 'Italy',
  'spain': 'Spain',
  'netherlands': 'Netherlands',
  'belgium': 'Belgium',
  'switzerland': 'Switzerland',
  'austria': 'Austria',
  'sweden': 'Sweden',
  'norway': 'Norway',
  'denmark': 'Denmark',
  'finland': 'Finland',
  'ireland': 'Ireland',
  'portugal': 'Portugal',
  'greece': 'Greece',
  'poland': 'Poland',
  'czech republic': 'Czech Republic',
  'hungary': 'Hungary',
  'romania': 'Romania',
  'bulgaria': 'Bulgaria',
  'croatia': 'Croatia',
  'slovenia': 'Slovenia',
  'slovakia': 'Slovakia',
  'estonia': 'Estonia',
  'latvia': 'Latvia',
  'lithuania': 'Lithuania',
  'luxembourg': 'Luxembourg',
  'malta': 'Malta',
  'cyprus': 'Cyprus',
  'australia': 'Australia',
  'new zealand': 'New Zealand',
  'japan': 'Japan',
  'south korea': 'South Korea',
  'china': 'China',
  'india': 'India',
  'singapore': 'Singapore',
  'thailand': 'Thailand',
  'malaysia': 'Malaysia',
  'indonesia': 'Indonesia',
  'philippines': 'Philippines',
  'vietnam': 'Vietnam',
  'hong kong': 'Hong Kong',
  'taiwan': 'Taiwan',
  'south africa': 'South Africa',
  'egypt': 'Egypt',
  'morocco': 'Morocco',
  'kenya': 'Kenya',
  'nigeria': 'Nigeria',
  'brazil': 'Brazil',
  'argentina': 'Argentina',
  'chile': 'Chile',
  'colombia': 'Colombia',
  'peru': 'Peru',
  'mexico': 'Mexico',
  'venezuela': 'Venezuela',
  'ecuador': 'Ecuador',
  'uruguay': 'Uruguay',
  'paraguay': 'Paraguay',
  'bolivia': 'Bolivia',
  'costa rica': 'Costa Rica',
  'panama': 'Panama',
  'guatemala': 'Guatemala',
  'honduras': 'Honduras',
  'nicaragua': 'Nicaragua',
  'el salvador': 'El Salvador',
  'belize': 'Belize',
  'jamaica': 'Jamaica',
  'cuba': 'Cuba',
  'dominican republic': 'Dominican Republic',
  'haiti': 'Haiti',
  'puerto rico': 'Puerto Rico',
  'trinidad and tobago': 'Trinidad and Tobago',
  'barbados': 'Barbados',
  'bahamas': 'Bahamas'
};

export function parseLocation(input: string): ParsedLocation {
  if (!input || input.trim() === '') {
    return {
      city: '',
      country: 'United States',
      fullLocation: ''
    };
  }

  const cleanInput = input.trim();
  const parts = cleanInput.split(',').map(part => part.trim());

  let city = '';
  let state: string | undefined;
  let country = 'United States'; // Default to US

  if (parts.length === 1) {
    // Just city name - assume US
    city = parts[0];
  } else if (parts.length === 2) {
    // Could be "City, State" or "City, Country"
    city = parts[0];
    const secondPart = parts[1].toLowerCase();
    
    // Check if second part is a US state
    if (STATE_MAPPINGS[secondPart] || isUSStateAbbreviation(secondPart)) {
      state = STATE_MAPPINGS[secondPart] || secondPart.toUpperCase();
      country = 'United States';
    } else {
      // Assume it's a country
      country = COUNTRY_MAPPINGS[secondPart] || capitalizeWords(parts[1]);
    }
  } else if (parts.length >= 3) {
    // "City, State/Region, Country"
    city = parts[0];
    const statePart = parts[1].toLowerCase();
    const countryPart = parts[2].toLowerCase();
    
    state = STATE_MAPPINGS[statePart] || capitalizeWords(parts[1]);
    country = COUNTRY_MAPPINGS[countryPart] || capitalizeWords(parts[2]);
  }

  // Clean up city name
  city = capitalizeWords(city);

  // Build standardized full location
  let fullLocation = city;
  if (state && country === 'United States') {
    fullLocation += `, ${state}, ${country}`;
  } else if (state && country !== 'United States') {
    fullLocation += `, ${state}, ${country}`;
  } else if (country !== 'United States') {
    fullLocation += `, ${country}`;
  } else {
    fullLocation += `, ${country}`;
  }

  return {
    city: city || '',
    state,
    country,
    fullLocation
  };
}

function isUSStateAbbreviation(input: string): boolean {
  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  return usStates.includes(input.toUpperCase());
}

function capitalizeWords(input: string): string {
  return input
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Generate location suggestions for autocomplete
export function generateLocationSuggestions(input: string): string[] {
  const suggestions: string[] = [];
  const lowerInput = input.toLowerCase();

  // Common US cities
  const usCities = [
    'New York, NY, United States',
    'Los Angeles, CA, United States',
    'Chicago, IL, United States',
    'Houston, TX, United States',
    'Phoenix, AZ, United States',
    'Philadelphia, PA, United States',
    'San Antonio, TX, United States',
    'San Diego, CA, United States',
    'Dallas, TX, United States',
    'San Jose, CA, United States',
    'Austin, TX, United States',
    'Jacksonville, FL, United States',
    'Fort Worth, TX, United States',
    'Columbus, OH, United States',
    'Charlotte, NC, United States',
    'San Francisco, CA, United States',
    'Indianapolis, IN, United States',
    'Seattle, WA, United States',
    'Denver, CO, United States',
    'Boston, MA, United States',
    'El Paso, TX, United States',
    'Nashville, TN, United States',
    'Detroit, MI, United States',
    'Oklahoma City, OK, United States',
    'Portland, OR, United States',
    'Las Vegas, NV, United States',
    'Memphis, TN, United States',
    'Louisville, KY, United States',
    'Baltimore, MD, United States',
    'Milwaukee, WI, United States',
    'Albuquerque, NM, United States',
    'Tucson, AZ, United States',
    'Fresno, CA, United States',
    'Sacramento, CA, United States',
    'Mesa, AZ, United States',
    'Kansas City, MO, United States',
    'Atlanta, GA, United States',
    'Long Beach, CA, United States',
    'Colorado Springs, CO, United States',
    'Raleigh, NC, United States',
    'Miami, FL, United States',
    'Virginia Beach, VA, United States',
    'Omaha, NE, United States',
    'Oakland, CA, United States',
    'Minneapolis, MN, United States',
    'Tulsa, OK, United States',
    'Arlington, TX, United States',
    'Tampa, FL, United States',
    'New Orleans, LA, United States',
    'Wichita, KS, United States'
  ];

  // International cities
  const internationalCities = [
    'London, England, United Kingdom',
    'Paris, France',
    'Berlin, Germany',
    'Rome, Italy',
    'Madrid, Spain',
    'Amsterdam, Netherlands',
    'Brussels, Belgium',
    'Zurich, Switzerland',
    'Vienna, Austria',
    'Stockholm, Sweden',
    'Oslo, Norway',
    'Copenhagen, Denmark',
    'Helsinki, Finland',
    'Dublin, Ireland',
    'Lisbon, Portugal',
    'Athens, Greece',
    'Warsaw, Poland',
    'Prague, Czech Republic',
    'Budapest, Hungary',
    'Bucharest, Romania',
    'Sofia, Bulgaria',
    'Zagreb, Croatia',
    'Ljubljana, Slovenia',
    'Bratislava, Slovakia',
    'Tallinn, Estonia',
    'Riga, Latvia',
    'Vilnius, Lithuania',
    'Luxembourg, Luxembourg',
    'Valletta, Malta',
    'Nicosia, Cyprus',
    'Sydney, Australia',
    'Melbourne, Australia',
    'Brisbane, Australia',
    'Perth, Australia',
    'Adelaide, Australia',
    'Auckland, New Zealand',
    'Wellington, New Zealand',
    'Christchurch, New Zealand',
    'Tokyo, Japan',
    'Osaka, Japan',
    'Seoul, South Korea',
    'Beijing, China',
    'Shanghai, China',
    'Hong Kong, Hong Kong',
    'Taipei, Taiwan',
    'Mumbai, India',
    'Delhi, India',
    'Bangalore, India',
    'Singapore, Singapore',
    'Bangkok, Thailand',
    'Kuala Lumpur, Malaysia',
    'Jakarta, Indonesia',
    'Manila, Philippines',
    'Ho Chi Minh City, Vietnam',
    'Cape Town, South Africa',
    'Johannesburg, South Africa',
    'Cairo, Egypt',
    'Casablanca, Morocco',
    'Nairobi, Kenya',
    'Lagos, Nigeria',
    'São Paulo, Brazil',
    'Rio de Janeiro, Brazil',
    'Buenos Aires, Argentina',
    'Santiago, Chile',
    'Bogotá, Colombia',
    'Lima, Peru',
    'Mexico City, Mexico',
    'Caracas, Venezuela',
    'Quito, Ecuador',
    'Montevideo, Uruguay',
    'Asunción, Paraguay',
    'La Paz, Bolivia',
    'San José, Costa Rica',
    'Panama City, Panama',
    'Guatemala City, Guatemala',
    'Tegucigalpa, Honduras',
    'Managua, Nicaragua',
    'San Salvador, El Salvador',
    'Belize City, Belize',
    'Kingston, Jamaica',
    'Havana, Cuba',
    'Santo Domingo, Dominican Republic',
    'Port-au-Prince, Haiti',
    'San Juan, Puerto Rico',
    'Port of Spain, Trinidad and Tobago',
    'Bridgetown, Barbados',
    'Nassau, Bahamas',
    'Toronto, Ontario, Canada',
    'Vancouver, British Columbia, Canada',
    'Montreal, Quebec, Canada',
    'Calgary, Alberta, Canada',
    'Edmonton, Alberta, Canada',
    'Ottawa, Ontario, Canada',
    'Winnipeg, Manitoba, Canada',
    'Quebec City, Quebec, Canada',
    'Hamilton, Ontario, Canada',
    'Kitchener, Ontario, Canada'
  ];

  // Combine all cities and filter by input
  const allCities = [...usCities, ...internationalCities];
  
  for (const city of allCities) {
    if (city.toLowerCase().includes(lowerInput)) {
      suggestions.push(city);
    }
  }

  return suggestions.slice(0, 10); // Return top 10 matches
}