// Location data for international travel - ordered by popularity
export const COUNTRIES: string[] = [
  "United States",
  "United Kingdom", 
  "France",
  "Germany",
  "Italy",
  "Spain",
  "Japan",
  "Australia",
  "Canada",
  "Netherlands",
  "Switzerland",
  "Austria",
  "Belgium",
  "Portugal",
  "Greece",
  "Czech Republic",
  "Ireland",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Poland",
  "Hungary",
  "Croatia",
  "Slovenia",
  "Thailand",
  "Singapore",
  "South Korea",
  "China",
  "India",
  "Brazil",
  "Argentina",
  "Chile",
  "Mexico",
  "Costa Rica",
  "New Zealand",
  "South Africa",
  "Morocco",
  "Egypt",
  "Turkey",
  "Israel",
  "United Arab Emirates",
  "Russia"
];

// Cities ordered by popularity/tourism for each country
export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  "United States": [
    // Top 8 priority cities - always appear first
    "Los Angeles", "Las Vegas", "Miami", "Nashville", "New Orleans", "Austin", "Chicago", "New York City",
    
    // Los Angeles Metropolitan Area Cities (unique only - no duplicates)
    "Beverly Hills", "Burbank", "Culver City", "El Segundo", "Malibu", "Manhattan Beach", "Playa del Rey", "Redondo Beach", "Santa Monica", "Venice", "West Hollywood", "Westwood",
    
    // NYC Boroughs
    "Manhattan", "Bronx", "Brooklyn", "Queens", "Staten Island",
    "Aberdeen", "Abilene", "Akron", "Albany", "Albuquerque", "Alexandria", "Allentown", "Amarillo", "Anaheim", "Anchorage", "Ann Arbor", "Arlington", "Atlanta", "Augusta", "Aurora",
    "Bakersfield", "Baltimore", "Baton Rouge", "Beaumont", "Bellevue", "Berkeley", "Birmingham", "Boise", "Boston", "Bridgeport", "Buffalo",
    "Cambridge", "Cape Coral", "Carrollton", "Cary", "Cedar Rapids", "Chandler", "Charleston", "Charlotte", "Chattanooga", "Chesapeake", "Cincinnati", "Clarksville", "Cleveland", "Colorado Springs", "Columbia", "Columbus", "Concord", "Coral Springs", "Corona", "Corpus Christi",
    "Dallas", "Dayton", "Denver", "Des Moines", "Detroit", "Durham",
    "El Paso", "Elizabeth", "Elk Grove", "Erie", "Eugene", "Evansville",
    "Fayetteville", "Fontana", "Fort Collins", "Fort Lauderdale", "Fort Wayne", "Fort Worth", "Fremont", "Fresno", "Fullerton",
    "Garden Grove", "Garland", "Gilbert", "Glendale", "Grand Prairie", "Grand Rapids", "Green Bay", "Greensboro", "Gresham",
    "Hampton", "Hartford", "Hayward", "Henderson", "Hialeah", "Hollywood", "Honolulu", "Houston", "Huntington Beach", "Huntsville",
    "Independence", "Indianapolis", "Inglewood", "Irvine", "Irving",
    "Jackson", "Jacksonville", "Jersey City", "Joliet", "Kansas City", "Knoxville",
    "Lafayette", "Lakewood", "Lancaster", "Lansing", "Laredo", "Lexington", "Lincoln", "Little Rock", "Long Beach", "Louisville", "Lowell", "Lubbock",
    "Madison", "Manchester", "McAllen", "McKinney", "Memphis", "Mesa", "Mesquite", "Milwaukee", "Minneapolis", "Mobile", "Modesto", "Montgomery", "Moreno Valley", "Murfreesboro",
    "Naperville", "New Haven", "Newark", "Newport News", "Norfolk", "Norman", "North Las Vegas",
    "Oakland", "Oceanside", "Oklahoma City", "Omaha", "Ontario", "Orange", "Orlando", "Overland Park", "Oxnard",
    "Palmdale", "Pasadena", "Paterson", "Pembroke Pines", "Peoria", "Philadelphia", "Phoenix", "Pittsburgh", "Plano", "Pomona", "Portland", "Providence", "Provo",
    "Raleigh", "Rancho Cucamonga", "Reno", "Richmond", "Riverside", "Rochester", "Rockford", "Roseville",
    "Sacramento", "Salem", "Salinas", "Salt Lake City", "San Antonio", "San Bernardino", "San Diego", "San Francisco", "San Jose", "Santa Ana", "Santa Clara", "Santa Clarita", "Savannah", "Scottsdale", "Seattle", "Shreveport", "Simi Valley", "Sioux Falls", "South Bend", "Spokane", "Springfield", "St. Louis", "St. Paul", "St. Petersburg", "Stamford", "Sterling Heights", "Stockton", "Sunnyvale", "Syracuse",
    "Tacoma", "Tallahassee", "Tampa", "Tempe", "Thornton", "Thousand Oaks", "Toledo", "Topeka", "Torrance", "Tucson", "Tulsa",
    "Vancouver", "Virginia Beach", "Visalia",
    "Waco", "Warren", "Washington DC", "Waterbury", "West Covina", "West Valley City", "Westchester County", "Westminster", "Wichita", "Winston-Salem", "Worcester",
    "Yonkers", "Youngstown"
  ],
  "United Kingdom": [
    "London", "Edinburgh", "Manchester", "Liverpool", "Birmingham",
    "Glasgow", "Cardiff", "Belfast", "Bath", "Oxford",
    "Cambridge", "York", "Brighton", "Bristol", "Newcastle"
  ],
  "France": [
    "Paris", "Nice", "Lyon", "Marseille", "Cannes", "Bordeaux",
    "Toulouse", "Strasbourg", "Montpellier", "Nantes",
    "Lille", "Rennes", "Reims", "Tours", "Angers"
  ],
  "Germany": [
    "Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Dresden",
    "Stuttgart", "Düsseldorf", "Heidelberg", "Dortmund", "Essen",
    "Leipzig", "Bremen", "Hannover", "Nuremberg", "Duisburg"
  ],
  "Italy": [
    "Rome", "Milan", "Venice", "Florence", "Naples", "Bologna",
    "Turin", "Palermo", "Genoa", "Catania",
    "Bari", "Messina", "Verona", "Padua", "Trieste"
  ],
  "Spain": [
    "Madrid", "Barcelona", "Seville", "Valencia", "Bilbao", "Granada",
    "Málaga", "Palma", "Las Palmas", "Zaragoza",
    "Murcia", "Alicante", "Córdoba", "Valladolid", "Vigo"
  ],
  "Japan": [
    "Tokyo", "Osaka", "Kyoto", "Yokohama", "Hiroshima", "Sapporo",
    "Fukuoka", "Kobe", "Kawasaki", "Saitama",
    "Sendai", "Chiba", "Kitakyushu", "Sakai", "Niigata"
  ],
  "Australia": [
    "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra",
    "Darwin", "Hobart", "Gold Coast", "Newcastle",
    "Wollongong", "Geelong", "Townsville", "Cairns", "Toowoomba"
  ],
  "Canada": [
    "Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton",
    "Quebec City", "Winnipeg", "Hamilton", "Kitchener",
    "London", "Victoria", "Halifax", "Windsor", "Oshawa"
  ],
  "Netherlands": [
    "Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven",
    "Tilburg", "Groningen", "Almere", "Breda", "Nijmegen"
  ],
  "Switzerland": [
    "Zurich", "Geneva", "Basel", "Bern", "Lausanne",
    "Winterthur", "Lucerne", "St. Gallen", "Lugano", "Biel"
  ],
  "Austria": [
    "Vienna", "Salzburg", "Innsbruck", "Graz", "Linz",
    "Klagenfurt", "Villach", "Wels", "Sankt Pölten", "Dornbirn"
  ],
  "Belgium": [
    "Brussels", "Antwerp", "Ghent", "Bruges", "Leuven",
    "Namur", "Mons", "Aalst", "La Louvière", "Kortrijk"
  ],
  "Portugal": [
    "Lisbon", "Porto", "Braga", "Coimbra", "Funchal",
    "Setúbal", "Almada", "Agualva-Cacém", "Queluz", "Rio Tinto"
  ],
  "Greece": [
    "Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa",
    "Volos", "Rhodes", "Ioannina", "Chania", "Chalcis"
  ],
  "Czech Republic": [
    "Prague", "Brno", "Ostrava", "Plzen", "Liberec",
    "Olomouc", "Budweis", "Hradec Králové", "Ústí nad Labem", "Pardubice"
  ],
  "Ireland": [
    "Dublin", "Cork", "Limerick", "Galway", "Waterford",
    "Drogheda", "Dundalk", "Bray", "Navan", "Ennis"
  ],
  "Sweden": [
    "Stockholm", "Gothenburg", "Malmö", "Uppsala", "Västerås",
    "Örebro", "Linköping", "Helsingborg", "Jönköping", "Norrköping"
  ],
  "Norway": [
    "Oslo", "Bergen", "Trondheim", "Stavanger", "Bærum",
    "Kristiansand", "Fredrikstad", "Tromsø", "Sandnes", "Asker"
  ],
  "Denmark": [
    "Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg",
    "Randers", "Kolding", "Horsens", "Vejle", "Roskilde"
  ],
  "Finland": [
    "Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu",
    "Turku", "Jyväskylä", "Lahti", "Kuopio", "Pori"
  ],
  "Poland": [
    "Warsaw", "Krakow", "Gdansk", "Wroclaw", "Poznan",
    "Lodz", "Katowice", "Lublin", "Bydgoszcz", "Szczecin",
    "Torun", "Rzeszow", "Olsztyn", "Bialystok", "Gliwice"
  ],
  "Hungary": [
    "Budapest", "Debrecen", "Szeged", "Miskolc", "Pecs",
    "Gyor", "Nyiregyhaza", "Kecskemet", "Szekesfehervar", "Szombathely"
  ],
  "Croatia": [
    "Zagreb", "Split", "Rijeka", "Osijek", "Zadar",
    "Pula", "Slavonski Brod", "Karlovac", "Varazdin", "Sibenik"
  ],
  "Slovenia": [
    "Ljubljana", "Maribor", "Celje", "Kranj", "Velenje",
    "Koper", "Novo Mesto", "Ptuj", "Trbovlje", "Kamnik"
  ],
  "Thailand": [
    "Bangkok", "Chiang Mai", "Phuket", "Pattaya", "Krabi",
    "Hua Hin", "Koh Samui", "Ayutthaya", "Chiang Rai", "Sukhothai"
  ],
  "Singapore": [
    "Singapore"
  ],
  "South Korea": [
    "Seoul", "Busan", "Incheon", "Daegu", "Daejeon",
    "Gwangju", "Suwon", "Ulsan", "Changwon", "Goyang"
  ],
  "China": [
    "Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu",
    "Hangzhou", "Xi'an", "Suzhou", "Wuhan", "Chongqing"
  ],
  "India": [
    "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata",
    "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Surat"
  ],
  "Brazil": [
    "São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza",
    "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Porto Alegre"
  ],
  "Mexico": [
    "Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana",
    "León", "Juárez", "Torreón", "Querétaro", "San Luis Potosí"
  ],
  "Argentina": [
    "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata",
    "San Miguel de Tucumán", "Mar del Plata", "Salta", "Santa Fe", "San Juan"
  ],
  "Chile": [
    "Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta",
    "Temuco", "Rancagua", "Talca", "Arica", "Chillán"
  ],
  "Costa Rica": [
    "San José", "San Pedro", "Cartago", "Puntarenas", "Limón",
    "Alajuela", "Heredia", "Desamparados", "Paraíso", "San Isidro"
  ],
  "New Zealand": [
    "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga",
    "Napier-Hastings", "Dunedin", "Palmerston North", "Nelson", "Rotorua"
  ],
  "South Africa": [
    "Cape Town", "Johannesburg", "Durban", "Pretoria", "Port Elizabeth",
    "Bloemfontein", "East London", "Pietermaritzburg", "Vereeniging", "Welkom"
  ],
  "Morocco": [
    "Casablanca", "Rabat", "Fez", "Marrakech", "Agadir",
    "Tangier", "Meknes", "Oujda", "Kenitra", "Tetouan"
  ],
  "Egypt": [
    "Cairo", "Alexandria", "Giza", "Shubra El Kheima", "Port Said",
    "Suez", "Luxor", "Mansoura", "El Mahalla El Kubra", "Tanta"
  ],
  "Turkey": [
    "Istanbul", "Ankara", "Izmir", "Bursa", "Adana",
    "Gaziantep", "Konya", "Antalya", "Kayseri", "Mersin"
  ],
  "Israel": [
    "Jerusalem", "Tel Aviv", "Haifa", "Rishon LeZion", "Petah Tikva",
    "Ashdod", "Netanya", "Beer Sheva", "Holon", "Bnei Brak"
  ],
  "United Arab Emirates": [
    "Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman",
    "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Khor Fakkan", "Dibba Al-Fujairah"
  ],
  "Russia": [
    "Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Nizhny Novgorod",
    "Kazan", "Chelyabinsk", "Omsk", "Samara", "Rostov-on-Don"
  ]
};

// Location normalization for matching purposes
export function normalizeLocationForMatching(location: string): string[] {
  const normalized = location.toLowerCase().trim();
  
  // NYC mappings - treat Manhattan and all boroughs as NYC for matching
  const nycLocations = ['manhattan', 'new york city', 'nyc', 'bronx', 'brooklyn', 'queens', 'staten island'];
  if (nycLocations.some(loc => normalized.includes(loc))) {
    return ['New York City', 'Manhattan', 'NYC', 'New York', location];
  }
  
  // Add other city aliases
  const cityAliases: Record<string, string[]> = {
    'los angeles': ['LA', 'Los Angeles', 'Hollywood'],
    'san francisco': ['SF', 'San Francisco', 'The City'],
    'washington dc': ['DC', 'Washington', 'Washington D.C.'],
    'las vegas': ['Vegas', 'Las Vegas', 'Sin City'],
  };
  
  for (const [city, aliases] of Object.entries(cityAliases)) {
    if (normalized.includes(city) || aliases.some(alias => normalized.toLowerCase().includes(alias.toLowerCase()))) {
      return [city, ...aliases, location];
    }
  }
  
  return [location];
}