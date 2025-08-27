// Location helpers for international travel
export interface LocationData {
  city: string;
  state: string;
  country: string;
}

// Major international cities with their regions/states
export const INTERNATIONAL_CITY_REGIONS: Record<string, Record<string, string>> = {
  "United States": {
    // New York
    "Manhattan": "New York", 
    "Brooklyn": "New York",
    "Queens": "New York",
    "Bronx": "New York",
    "Staten Island": "New York",
    "New York City": "New York",
    "Westchester County": "New York",
    "Buffalo": "New York",
    "Albany": "New York",
    "Rochester": "New York",
    "Syracuse": "New York",
    
    // California
    "Los Angeles": "California",
    "San Francisco": "California", 
    "San Diego": "California",
    "Sacramento": "California",
    "Oakland": "California",
    "San Jose": "California",
    "Fresno": "California",
    "Long Beach": "California",
    "Santa Barbara": "California",
    "Monterey": "California",
    "Napa": "California",
    "Sonoma": "California",
    // Los Angeles Metropolitan Area (avoid duplicates with main list)
    "Beverly Hills": "California",
    "Burbank": "California", 
    "Culver City": "California",
    "El Segundo": "California",
    "Malibu": "California",
    "Manhattan Beach": "California",
    "Playa del Rey": "California",
    "Redondo Beach": "California",
    "Santa Monica": "California",
    "Venice": "California",
    "West Hollywood": "California",
    "Westwood": "California",
    
    // Texas
    "Houston": "Texas",
    "Dallas": "Texas",
    "Austin": "Texas",
    "San Antonio": "Texas",
    "Fort Worth": "Texas",
    "El Paso": "Texas",
    
    // Florida
    "Miami": "Florida",
    "Orlando": "Florida",
    "Tampa": "Florida",
    "Jacksonville": "Florida",
    "St. Petersburg": "Florida",
    "Fort Lauderdale": "Florida",
    "Tallahassee": "Florida",
    "Key West": "Florida",
    
    // Illinois
    "Chicago": "Illinois",
    "Springfield": "Illinois",
    "Rockford": "Illinois",
    
    // Other major cities
    "Las Vegas": "Nevada",
    "Reno": "Nevada",
    "Seattle": "Washington",
    "Spokane": "Washington",
    "Portland": "Oregon",
    "Eugene": "Oregon",
    "Boston": "Massachusetts",
    "Worcester": "Massachusetts",
    "Cambridge": "Massachusetts",
    "Washington DC": "District of Columbia",
    "Nashville": "Tennessee",
    "Memphis": "Tennessee",
    "Knoxville": "Tennessee",
    "New Orleans": "Louisiana",
    "Baton Rouge": "Louisiana",
    "Phoenix": "Arizona",
    "Tucson": "Arizona",
    "Philadelphia": "Pennsylvania",
    "Pittsburgh": "Pennsylvania",
    "Harrisburg": "Pennsylvania",
    "Denver": "Colorado",
    "Colorado Springs": "Colorado",
    "Atlanta": "Georgia",
    "Savannah": "Georgia",
    "Augusta": "Georgia",
    "Detroit": "Michigan",
    "Grand Rapids": "Michigan",
    "Charlotte": "North Carolina",
    "Raleigh": "North Carolina",
    "Asheville": "North Carolina",
    "Indianapolis": "Indiana",
    "Fort Wayne": "Indiana",
    "Columbus": "Ohio",
    "Cleveland": "Ohio",
    "Cincinnati": "Ohio",
    "Milwaukee": "Wisconsin",
    "Madison": "Wisconsin",
    "Kansas City": "Missouri",
    "St. Louis": "Missouri",
    "Minneapolis": "Minnesota",
    "St. Paul": "Minnesota",
    "Baltimore": "Maryland",
    "Annapolis": "Maryland",
    "Richmond": "Virginia",
    "Norfolk": "Virginia",
    "Virginia Beach": "Virginia",
    "Salt Lake City": "Utah",
    "Park City": "Utah",
    "Bangor": "Maine",
    "Burlington": "Vermont",
    "Montpelier": "Vermont",
    "Concord": "New Hampshire",
    "Manchester": "New Hampshire",
    "Providence": "Rhode Island",
    "Newport": "Rhode Island",
    "Hartford": "Connecticut",
    "New Haven": "Connecticut",
    "Wilmington": "Delaware",
    "Dover": "Delaware"
  },
  "United Kingdom": {
    "London": "England",
    "Manchester": "England", 
    "Birmingham": "England",
    "Liverpool": "England",
    "Edinburgh": "Scotland",
    "Glasgow": "Scotland",
    "Cardiff": "Wales",
    "Belfast": "Northern Ireland"
  },
  "France": {
    "Paris": "Île-de-France",
    "Lyon": "Auvergne-Rhône-Alpes",
    "Marseille": "Provence-Alpes-Côte d'Azur",
    "Nice": "Provence-Alpes-Côte d'Azur",
    "Cannes": "Provence-Alpes-Côte d'Azur",
    "Bordeaux": "Nouvelle-Aquitaine",
    "Toulouse": "Occitanie"
  },
  "Germany": {
    "Berlin": "Berlin",
    "Munich": "Bavaria",
    "Hamburg": "Hamburg",
    "Frankfurt": "Hesse",
    "Cologne": "North Rhine-Westphalia",
    "Dresden": "Saxony",
    "Stuttgart": "Baden-Württemberg"
  },
  "Italy": {
    "Rome": "Lazio",
    "Milan": "Lombardy", 
    "Venice": "Veneto",
    "Florence": "Tuscany",
    "Naples": "Campania",
    "Bologna": "Emilia-Romagna",
    "Turin": "Piedmont"
  },
  "Spain": {
    "Madrid": "Community of Madrid",
    "Barcelona": "Catalonia",
    "Seville": "Andalusia",
    "Valencia": "Valencian Community",
    "Bilbao": "Basque Country",
    "Granada": "Andalusia",
    "Málaga": "Andalusia"
  },
  "Japan": {
    "Tokyo": "Tokyo",
    "Osaka": "Osaka Prefecture",
    "Kyoto": "Kyoto Prefecture",
    "Yokohama": "Kanagawa Prefecture",
    "Hiroshima": "Hiroshima Prefecture",
    "Sapporo": "Hokkaido",
    "Fukuoka": "Fukuoka Prefecture"
  },
  "Australia": {
    "Sydney": "New South Wales",
    "Melbourne": "Victoria",
    "Brisbane": "Queensland",
    "Perth": "Western Australia",
    "Adelaide": "South Australia",
    "Canberra": "Australian Capital Territory",
    "Darwin": "Northern Territory"
  },
  "Canada": {
    "Toronto": "Ontario",
    "Vancouver": "British Columbia",
    "Montreal": "Quebec",
    "Calgary": "Alberta",
    "Ottawa": "Ontario",
    "Edmonton": "Alberta",
    "Quebec City": "Quebec"
  },
  "Poland": {
    "Warsaw": "Mazovia",
    "Krakow": "Lesser Poland",
    "Gdansk": "Pomerania",
    "Wroclaw": "Lower Silesia",
    "Poznan": "Greater Poland",
    "Lodz": "Lodz",
    "Katowice": "Silesia",
    "Lublin": "Lublin",
    "Bydgoszcz": "Kuyavia-Pomerania",
    "Szczecin": "West Pomerania"
  },
  "Hungary": {
    "Budapest": "Central Hungary",
    "Debrecen": "Northern Great Plain",
    "Szeged": "Southern Great Plain",
    "Miskolc": "Northern Hungary",
    "Pecs": "Southern Transdanubia",
    "Gyor": "Western Transdanubia"
  },
  "Croatia": {
    "Zagreb": "Zagreb County",
    "Split": "Split-Dalmatia",
    "Rijeka": "Primorje-Gorski Kotar",
    "Osijek": "Osijek-Baranja",
    "Zadar": "Zadar County",
    "Pula": "Istria County"
  },
  "Slovenia": {
    "Ljubljana": "Central Slovenia",
    "Maribor": "Drava",
    "Celje": "Savinja",
    "Kranj": "Upper Carniola",
    "Koper": "Coastal-Karst"
  },
  "Thailand": {
    "Bangkok": "Bangkok",
    "Chiang Mai": "Chiang Mai",
    "Phuket": "Phuket",
    "Pattaya": "Chonburi",
    "Krabi": "Krabi"
  },
  "Singapore": {
    "Singapore": "Singapore"
  },
  "South Korea": {
    "Seoul": "Seoul",
    "Busan": "Busan",
    "Incheon": "Incheon",
    "Daegu": "Daegu",
    "Daejeon": "Daejeon",
    "Gwangju": "Gwangju"
  },
  "China": {
    "Beijing": "Beijing",
    "Shanghai": "Shanghai",
    "Guangzhou": "Guangdong",
    "Shenzhen": "Guangdong",
    "Chengdu": "Sichuan",
    "Hangzhou": "Zhejiang",
    "Xi'an": "Shaanxi"
  },
  "India": {
    "Mumbai": "Maharashtra",
    "Delhi": "Delhi",
    "Bangalore": "Karnataka",
    "Chennai": "Tamil Nadu",
    "Kolkata": "West Bengal",
    "Hyderabad": "Telangana",
    "Pune": "Maharashtra"
  },
  "Brazil": {
    "São Paulo": "São Paulo",
    "Rio de Janeiro": "Rio de Janeiro",
    "Brasília": "Federal District",
    "Salvador": "Bahia",
    "Fortaleza": "Ceará",
    "Belo Horizonte": "Minas Gerais"
  },
  "Mexico": {
    "Mexico City": "Mexico City",
    "Guadalajara": "Jalisco",
    "Monterrey": "Nuevo León",
    "Puebla": "Puebla",
    "Tijuana": "Baja California"
  },
  "Argentina": {
    "Buenos Aires": "Buenos Aires",
    "Córdoba": "Córdoba",
    "Rosario": "Santa Fe",
    "Mendoza": "Mendoza",
    "La Plata": "Buenos Aires"
  },
  "Chile": {
    "Santiago": "Santiago Metropolitan",
    "Valparaíso": "Valparaíso",
    "Concepción": "Biobío",
    "La Serena": "Coquimbo",
    "Antofagasta": "Antofagasta"
  },
  "Costa Rica": {
    "San José": "San José",
    "Cartago": "Cartago",
    "Puntarenas": "Puntarenas",
    "Alajuela": "Alajuela",
    "Heredia": "Heredia"
  },
  "New Zealand": {
    "Auckland": "Auckland",
    "Wellington": "Wellington",
    "Christchurch": "Canterbury",
    "Hamilton": "Waikato",
    "Tauranga": "Bay of Plenty"
  },
  "South Africa": {
    "Cape Town": "Western Cape",
    "Johannesburg": "Gauteng",
    "Durban": "KwaZulu-Natal",
    "Pretoria": "Gauteng",
    "Port Elizabeth": "Eastern Cape"
  },
  "Morocco": {
    "Casablanca": "Casablanca-Settat",
    "Rabat": "Rabat-Salé-Kénitra",
    "Fez": "Fès-Meknès",
    "Marrakech": "Marrakech-Safi",
    "Agadir": "Souss-Massa"
  },
  "Egypt": {
    "Cairo": "Cairo",
    "Alexandria": "Alexandria",
    "Giza": "Giza",
    "Luxor": "Luxor",
    "Port Said": "Port Said"
  },
  "Turkey": {
    "Istanbul": "Istanbul",
    "Ankara": "Ankara",
    "Izmir": "Izmir",
    "Bursa": "Bursa",
    "Adana": "Adana",
    "Antalya": "Antalya"
  },
  "Israel": {
    "Jerusalem": "Jerusalem",
    "Tel Aviv": "Tel Aviv",
    "Haifa": "Haifa",
    "Beer Sheva": "Southern District",
    "Netanya": "Central District"
  },
  "United Arab Emirates": {
    "Dubai": "Dubai",
    "Abu Dhabi": "Abu Dhabi",
    "Sharjah": "Sharjah",
    "Al Ain": "Abu Dhabi",
    "Ajman": "Ajman"
  },
  "Russia": {
    "Moscow": "Moscow",
    "Saint Petersburg": "Saint Petersburg",
    "Novosibirsk": "Novosibirsk Oblast",
    "Yekaterinburg": "Sverdlovsk Oblast",
    "Nizhny Novgorod": "Nizhny Novgorod Oblast"
  }
};

// Check if a country uses states/provinces that travelers typically know
export const COUNTRIES_WITH_KNOWN_STATES = [
  "United States",
  "Canada", 
  "Australia"
];

// Auto-populate state/region if we know it
export function getRegionForCity(city: string, country: string): string | null {
  const countryData = INTERNATIONAL_CITY_REGIONS[country];
  if (countryData && countryData[city]) {
    return countryData[city];
  }
  return null;
}

// Check if state field should be optional for international travel
export function isStateOptionalForCountry(country: string): boolean {
  // For countries where travelers typically don't know the state/region
  return !COUNTRIES_WITH_KNOWN_STATES.includes(country);
}

// Format location display for international users
export function formatLocationDisplay(location: LocationData): string {
  const { city, state, country } = location;
  
  // US format: City, State
  if (country === "United States") {
    return state ? `${city}, ${state}` : city;
  }
  
  // International format: City, Country (state optional)
  if (country !== "United States") {
    return `${city}, ${country}`;
  }
  
  return city;
}

// Validate location completeness based on country
export function validateLocationForCountry(location: LocationData): { isValid: boolean; message?: string } {
  const { city, state, country } = location;
  
  // For search functionality, allow empty fields - users can search without location
  if (!city && !country && !state) {
    return { isValid: true }; // All empty is valid for search
  }
  
  // If country is provided, validate accordingly
  if (country === "United States" && city && !state) {
    return { isValid: false, message: "State is required for US locations" };
  }
  
  return { isValid: true };
}