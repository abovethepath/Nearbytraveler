// US States and major cities data for consistent location entry

export const US_STATES = [
  { value: "Alabama", abbreviation: "AL" },
  { value: "Alaska", abbreviation: "AK" },
  { value: "Arizona", abbreviation: "AZ" },
  { value: "Arkansas", abbreviation: "AR" },
  { value: "California", abbreviation: "CA" },
  { value: "Colorado", abbreviation: "CO" },
  { value: "Connecticut", abbreviation: "CT" },
  { value: "Delaware", abbreviation: "DE" },
  { value: "Florida", abbreviation: "FL" },
  { value: "Georgia", abbreviation: "GA" },
  { value: "Hawaii", abbreviation: "HI" },
  { value: "Idaho", abbreviation: "ID" },
  { value: "Illinois", abbreviation: "IL" },
  { value: "Indiana", abbreviation: "IN" },
  { value: "Iowa", abbreviation: "IA" },
  { value: "Kansas", abbreviation: "KS" },
  { value: "Kentucky", abbreviation: "KY" },
  { value: "Louisiana", abbreviation: "LA" },
  { value: "Maine", abbreviation: "ME" },
  { value: "Maryland", abbreviation: "MD" },
  { value: "Massachusetts", abbreviation: "MA" },
  { value: "Michigan", abbreviation: "MI" },
  { value: "Minnesota", abbreviation: "MN" },
  { value: "Mississippi", abbreviation: "MS" },
  { value: "Missouri", abbreviation: "MO" },
  { value: "Montana", abbreviation: "MT" },
  { value: "Nebraska", abbreviation: "NE" },
  { value: "Nevada", abbreviation: "NV" },
  { value: "New Hampshire", abbreviation: "NH" },
  { value: "New Jersey", abbreviation: "NJ" },
  { value: "New Mexico", abbreviation: "NM" },
  { value: "New York", abbreviation: "NY" },
  { value: "North Carolina", abbreviation: "NC" },
  { value: "North Dakota", abbreviation: "ND" },
  { value: "Ohio", abbreviation: "OH" },
  { value: "Oklahoma", abbreviation: "OK" },
  { value: "Oregon", abbreviation: "OR" },
  { value: "Pennsylvania", abbreviation: "PA" },
  { value: "Rhode Island", abbreviation: "RI" },
  { value: "South Carolina", abbreviation: "SC" },
  { value: "South Dakota", abbreviation: "SD" },
  { value: "Tennessee", abbreviation: "TN" },
  { value: "Texas", abbreviation: "TX" },
  { value: "Utah", abbreviation: "UT" },
  { value: "Vermont", abbreviation: "VT" },
  { value: "Virginia", abbreviation: "VA" },
  { value: "Washington", abbreviation: "WA" },
  { value: "West Virginia", abbreviation: "WV" },
  { value: "Wisconsin", abbreviation: "WI" },
  { value: "Wyoming", abbreviation: "WY" }
];

export const US_CITIES_BY_STATE: Record<string, string[]> = {
  "Alabama": ["Birmingham", "Montgomery", "Mobile", "Huntsville", "Tuscaloosa"],
  "Alaska": ["Anchorage", "Fairbanks", "Juneau", "Sitka", "Ketchikan"],
  "Arizona": ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Glendale", "Tempe"],
  "Arkansas": ["Little Rock", "Fort Smith", "Fayetteville", "Springdale", "Jonesboro"],
  "California": ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "San Jose", "Oakland", "Fresno", "Long Beach", "Santa Ana", "Riverside", "Stockton", "Irvine", "Fremont", "San Bernardino", "Modesto", "Fontana", "Oxnard", "Moreno Valley", "Huntington Beach", "Glendale", "Santa Clarita", "Garden Grove", "Santa Rosa", "Oceanside", "Rancho Cucamonga", "Ontario", "Lancaster", "Elk Grove", "Corona", "Palmdale", "Salinas", "Pomona", "Hayward", "Escondido", "Torrance", "Sunnyvale", "Orange", "Fullerton", "Pasadena", "Thousand Oaks", "Visalia", "Simi Valley", "Concord", "Roseville", "Santa Clara", "Vallejo", "Victorville", "El Monte", "Berkeley", "Downey", "Costa Mesa", "Inglewood"],
  "Colorado": ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood", "Thornton", "Arvada", "Westminster", "Pueblo"],
  "Connecticut": ["Bridgeport", "New Haven", "Hartford", "Stamford", "Waterbury", "Norwalk", "Danbury"],
  "Delaware": ["Wilmington", "Dover", "Newark"],
  "Florida": ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Tallahassee", "Fort Lauderdale", "Port St. Lucie", "Cape Coral", "Pembroke Pines", "Hollywood", "Gainesville", "Miramar", "Coral Springs", "Clearwater", "Miami Gardens", "Palm Bay", "West Palm Beach", "Pompano Beach"],
  "Georgia": ["Atlanta", "Augusta", "Columbus", "Macon", "Savannah", "Athens", "Sandy Springs", "Roswell", "Johns Creek", "Albany"],
  "Hawaii": ["Honolulu", "Pearl City", "Hilo", "Kailua", "Waipahu"],
  "Idaho": ["Boise", "Nampa", "Meridian", "Idaho Falls", "Pocatello", "Caldwell", "Coeur d'Alene"],
  "Illinois": ["Chicago", "Aurora", "Peoria", "Rockford", "Joliet", "Naperville", "Springfield", "Elgin", "Waukegan", "Cicero"],
  "Indiana": ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel", "Fishers", "Bloomington", "Hammond"],
  "Iowa": ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City", "Waterloo", "Council Bluffs"],
  "Kansas": ["Wichita", "Overland Park", "Kansas City", "Topeka", "Olathe", "Lawrence"],
  "Kentucky": ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington"],
  "Louisiana": ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles", "Kenner", "Bossier City"],
  "Maine": ["Portland", "Lewiston", "Bangor", "South Portland", "Auburn"],
  "Maryland": ["Baltimore", "Frederick", "Rockville", "Gaithersburg", "Bowie", "Hagerstown", "Annapolis"],
  "Massachusetts": ["Boston", "Worcester", "Springfield", "Lowell", "Cambridge", "New Bedford", "Brockton", "Quincy", "Lynn"],
  "Michigan": ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Lansing", "Ann Arbor", "Flint", "Dearborn"],
  "Minnesota": ["Minneapolis", "St. Paul", "Rochester", "Duluth", "Bloomington", "Brooklyn Park", "Plymouth"],
  "Mississippi": ["Jackson", "Gulfport", "Southaven", "Hattiesburg", "Biloxi"],
  "Missouri": ["Kansas City", "St. Louis", "Springfield", "Columbia", "Independence"],
  "Montana": ["Billings", "Missoula", "Great Falls", "Bozeman", "Butte", "Helena"],
  "Nebraska": ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney"],
  "Nevada": ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks", "Carson City"],
  "New Hampshire": ["Manchester", "Nashua", "Concord", "Dover", "Rochester"],
  "New Jersey": ["Newark", "Jersey City", "Paterson", "Elizabeth", "Edison", "Woodbridge", "Lakewood", "Toms River"],
  "New Mexico": ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe", "Roswell"],
  "New York": ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "Schenectady"],
  "North Carolina": ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary", "Wilmington", "High Point"],
  "North Dakota": ["Fargo", "Bismarck", "Grand Forks", "Minot", "West Fargo"],
  "Ohio": ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Parma", "Canton", "Youngstown"],
  "Oklahoma": ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Lawton", "Edmond"],
  "Oregon": ["Portland", "Eugene", "Salem", "Gresham", "Hillsboro", "Bend", "Beaverton"],
  "Pennsylvania": ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton", "Bethlehem"],
  "Rhode Island": ["Providence", "Warwick", "Cranston", "Pawtucket"],
  "South Carolina": ["Columbia", "Charleston", "North Charleston", "Mount Pleasant", "Rock Hill"],
  "South Dakota": ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Watertown"],
  "Tennessee": ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville", "Murfreesboro"],
  "Texas": ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Laredo", "Lubbock", "Garland", "Irving", "Amarillo", "Grand Prairie", "Brownsville", "McKinney", "Frisco", "Pasadena", "Killeen", "McAllen", "Kansas City", "Mesquite", "Carrollton", "Midland", "Denton", "Abilene", "Beaumont", "Round Rock", "Odessa", "Waco", "Richardson", "Lewisville", "Tyler", "College Station", "Pearland", "San Angelo"],
  "Utah": ["Salt Lake City", "West Valley City", "Provo", "West Jordan", "Orem", "Sandy", "Ogden"],
  "Vermont": ["Burlington", "Essex", "South Burlington", "Colchester", "Rutland"],
  "Virginia": ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Newport News", "Alexandria", "Hampton", "Portsmouth"],
  "Washington": ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Kent", "Everett", "Renton", "Federal Way"],
  "West Virginia": ["Charleston", "Huntington", "Parkersburg", "Morgantown", "Wheeling"],
  "Wisconsin": ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine", "Appleton"],
  "Wyoming": ["Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs"]
};

export const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Japan",
  "South Korea",
  "China",
  "India",
  "Brazil",
  "Mexico",
  "Argentina",
  "Chile",
  "Colombia",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Austria",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Poland",
  "Czech Republic",
  "Hungary",
  "Greece",
  "Portugal",
  "Ireland",
  "New Zealand",
  "South Africa",
  "Israel",
  "Turkey",
  "Russia",
  "Ukraine",
  "Thailand",
  "Vietnam",
  "Singapore",
  "Malaysia",
  "Philippines",
  "Indonesia",
  "Egypt",
  "Morocco",
  "Kenya",
  "Nigeria",
  "Ghana",
  "Other"
];

// State normalization functions to handle both full names and abbreviations
export function normalizeStateName(state: string): string {
  if (!state) return "";
  
  const stateUpper = state.trim().toUpperCase();
  
  // Find by abbreviation
  const byAbbr = US_STATES.find(s => s.abbreviation.toUpperCase() === stateUpper);
  if (byAbbr) return byAbbr.value;
  
  // Find by full name (case insensitive)
  const byName = US_STATES.find(s => s.value.toUpperCase() === stateUpper);
  if (byName) return byName.value;
  
  // Return original if not found (for international locations)
  return state.trim();
}

export function getStateAbbreviation(state: string): string {
  if (!state) return "";
  
  const normalized = normalizeStateName(state);
  const found = US_STATES.find(s => s.value === normalized);
  return found ? found.abbreviation : state;
}

// Create mapping objects for efficient lookups
export const STATE_ABBREVIATION_MAP = Object.fromEntries(
  US_STATES.map(state => [state.abbreviation.toUpperCase(), state.value])
);

export const STATE_NAME_MAP = Object.fromEntries(
  US_STATES.map(state => [state.value.toUpperCase(), state.abbreviation])
);

// Location matching function that handles state variations
export function locationsMatch(location1: string, location2: string): boolean {
  if (!location1 || !location2) return false;
  
  // Normalize both locations for comparison
  const norm1 = location1.toLowerCase().trim();
  const norm2 = location2.toLowerCase().trim();
  
  // Direct match
  if (norm1 === norm2) return true;
  
  // Parse locations and normalize states
  const parsed1 = parseLocationString(location1);
  const parsed2 = parseLocationString(location2);
  
  // Compare cities (case insensitive)
  if (parsed1.city.toLowerCase() !== parsed2.city.toLowerCase()) return false;
  
  // Compare countries (case insensitive)
  if (parsed1.country.toLowerCase() !== parsed2.country.toLowerCase()) return false;
  
  // Compare normalized states
  const normalizedState1 = normalizeStateName(parsed1.state);
  const normalizedState2 = normalizeStateName(parsed2.state);
  
  return normalizedState1.toLowerCase() === normalizedState2.toLowerCase();
}

// Parse location string into components
function parseLocationString(location: string): { city: string; state: string; country: string } {
  const parts = location.split(',').map(p => p.trim());
  
  if (parts.length === 1) {
    return { city: parts[0], state: "", country: "" };
  } else if (parts.length === 2) {
    return { city: parts[0], state: "", country: parts[1] };
  } else if (parts.length >= 3) {
    return { city: parts[0], state: parts[1], country: parts[2] };
  }
  
  return { city: location, state: "", country: "" };
}

// Metropolitan areas mapping for user filtering
export const METROPOLITAN_AREAS = [
  {
    city: "New York",
    state: "New York",
    country: "United States",
    keywords: ["nyc", "manhattan", "brooklyn", "queens", "bronx", "staten island", "new york city"]
  },
  {
    city: "Los Angeles", 
    state: "California",
    country: "United States",
    keywords: ["la", "hollywood", "beverly hills", "santa monica", "pasadena", "long beach"]
  },
  {
    city: "Chicago",
    state: "Illinois", 
    country: "United States",
    keywords: ["chi", "windy city", "chicagoland"]
  },
  {
    city: "Boston",
    state: "Massachusetts",
    country: "United States", 
    keywords: ["bos", "cambridge", "somerville", "brookline"]
  },
  {
    city: "Denver",
    state: "Colorado",
    country: "United States",
    keywords: ["denver", "boulder", "aurora", "lakewood", "thornton", "arvada", "westminster", "centennial", "colorado springs"]
  },
  {
    city: "Milan",
    state: "Lombardy",
    country: "Italy",
    keywords: ["milano", "milan", "lombardy", "lombardia"]
  },
  {
    city: "Rome",
    state: "Lazio", 
    country: "Italy",
    keywords: ["roma", "rome", "lazio"]
  },
  {
    city: "London",
    state: "England",
    country: "United Kingdom", 
    keywords: ["london", "greater london", "england", "uk"]
  }
];