// Static city-specific activities for major destinations
// These iconic attractions and experiences should always be available for matching

// CURATED TOP 12 "POPULAR" ACTIVITIES - These are the must-see tourist anchors
// Used for the "Popular" section - should NOT be AI-generated
export const FEATURED_CITY_ACTIVITIES: Record<string, Array<{name: string, description: string, category: string, rank: number}>> = {
  // ===== LAUNCH FOCUS CITIES =====
  "Los Angeles": [
    { name: "Griffith Observatory", description: "Iconic observatory with planetarium and Hollywood Sign views", category: "landmarks", rank: 1 },
    { name: "Hollywood Sign", description: "Hike to views of the world-famous Hollywood Sign", category: "outdoor", rank: 2 },
    { name: "Hollywood Walk of Fame", description: "Celebrity stars embedded in sidewalk along Hollywood Boulevard", category: "landmarks", rank: 3 },
    { name: "TCL Chinese Theatre", description: "Historic movie palace with celebrity handprints and premieres", category: "landmarks", rank: 4 },
    { name: "Santa Monica Pier", description: "Classic amusement park on the Pacific with Ferris wheel", category: "entertainment", rank: 5 },
    { name: "Venice Beach", description: "Bohemian beach with street performers, muscle beach, and boardwalk", category: "beach", rank: 6 },
    { name: "The Getty Center", description: "World-class art museum with architecture and stunning city views", category: "culture", rank: 7 },
    { name: "The Broad Museum", description: "Contemporary art museum with Yayoi Kusama infinity rooms", category: "culture", rank: 8 },
    { name: "LACMA & La Brea Tar Pits", description: "Iconic art museum and active paleontological site", category: "culture", rank: 9 },
    { name: "Universal Studios Hollywood", description: "Movie studio tours and thrilling theme park rides", category: "theme_park", rank: 10 },
    { name: "Grand Central Market", description: "Historic food hall with diverse vendors and cuisines", category: "food", rank: 11 },
    { name: "Rodeo Drive", description: "World-famous luxury shopping street in Beverly Hills", category: "shopping", rank: 12 },
    { name: "Malibu Beaches", description: "Scenic coastal drive with pristine beaches and celebrity homes", category: "beach", rank: 13 },
  ],
  "San Francisco": [
    { name: "Golden Gate Bridge", description: "Walk or bike across the iconic red suspension bridge", category: "landmarks", rank: 1 },
    { name: "Alcatraz Island", description: "Explore the infamous former federal prison", category: "history", rank: 2 },
    { name: "Fisherman's Wharf & Pier 39", description: "Waterfront dining, shops, and sea lions", category: "entertainment", rank: 3 },
    { name: "Golden Gate Park", description: "Sprawling urban park with gardens, museums, and bison", category: "outdoor", rank: 4 },
    { name: "Palace of Fine Arts", description: "Beautiful Beaux-Arts rotunda and lagoon", category: "landmarks", rank: 5 },
    { name: "Ferry Building Marketplace", description: "Gourmet food hall on the Embarcadero", category: "food", rank: 6 },
    { name: "Chinatown", description: "Oldest and largest Chinatown outside of Asia", category: "culture", rank: 7 },
    { name: "Lombard Street", description: "Drive or walk down the world's crookedest street", category: "landmarks", rank: 8 },
    { name: "Painted Ladies", description: "Famous Victorian houses at Alamo Square", category: "landmarks", rank: 9 },
    { name: "Cable Car Ride", description: "Historic transportation up San Francisco's hills", category: "entertainment", rank: 10 },
    { name: "Coit Tower", description: "Art Deco tower with 360-degree city views", category: "landmarks", rank: 11 },
    { name: "Twin Peaks Viewpoint", description: "Panoramic views of the entire Bay Area", category: "outdoor", rank: 12 },
  ],
  "New York City": [
    { name: "Statue of Liberty & Ellis Island", description: "Visit the iconic symbol of freedom", category: "landmarks", rank: 1 },
    { name: "Central Park", description: "The green oasis in the heart of Manhattan", category: "outdoor", rank: 2 },
    { name: "Times Square", description: "The crossroads of the world with dazzling lights", category: "landmarks", rank: 3 },
    { name: "Broadway", description: "World-class theater productions in the Theater District", category: "entertainment", rank: 4 },
    { name: "Empire State Building", description: "Iconic Art Deco skyscraper with observation deck", category: "landmarks", rank: 5 },
    { name: "Top of the Rock", description: "Rockefeller Center observation deck with stunning views", category: "landmarks", rank: 6 },
    { name: "The Metropolitan Museum of Art", description: "World's largest art museum with 2 million works", category: "culture", rank: 7 },
    { name: "Museum of Modern Art (MoMA)", description: "World-renowned modern art museum", category: "culture", rank: 8 },
    { name: "9/11 Memorial & Museum", description: "Pay respects at this moving memorial", category: "history", rank: 9 },
    { name: "High Line", description: "Elevated urban park built on former railway", category: "outdoor", rank: 10 },
    { name: "Brooklyn Bridge", description: "Walk across the historic suspension bridge", category: "landmarks", rank: 11 },
    { name: "One World Observatory", description: "Stunning views from tallest building in Western Hemisphere", category: "landmarks", rank: 12 },
  ],
  "Austin": [
    { name: "Texas State Capitol", description: "Iconic pink granite capitol building, taller than US Capitol", category: "landmarks", rank: 1 },
    { name: "South Congress", description: "Trendy SoCo district with boutiques, food, and live music", category: "entertainment", rank: 2 },
    { name: "Barton Springs Pool", description: "Natural spring-fed swimming pool in Zilker Park", category: "outdoor", rank: 3 },
    { name: "Zilker Park", description: "Iconic urban park with trails, gardens, and Zilker train", category: "outdoor", rank: 4 },
    { name: "Lady Bird Lake Trail", description: "Scenic hike and bike trail along the Colorado River", category: "outdoor", rank: 5 },
    { name: "Sixth Street", description: "Famous entertainment district with live music venues", category: "nightlife", rank: 6 },
    { name: "Rainey Street", description: "Historic bungalows turned into bars and restaurants", category: "nightlife", rank: 7 },
    { name: "Congress Avenue Bridge Bats", description: "Watch 1.5 million bats emerge at sunset", category: "nature", rank: 8 },
    { name: "Franklin Barbecue", description: "Legendary Texas BBQ worth the wait", category: "food", rank: 9 },
    { name: "Mount Bonnell", description: "Scenic overlook with panoramic views of Austin", category: "outdoor", rank: 10 },
    { name: "Blanton Museum of Art", description: "University of Texas art museum with impressive collection", category: "culture", rank: 11 },
    { name: "The Domain", description: "Upscale outdoor shopping and dining destination", category: "shopping", rank: 12 },
  ],
  "New Orleans": [
    { name: "French Quarter", description: "Historic heart of New Orleans with iconic architecture", category: "culture", rank: 1 },
    { name: "Bourbon Street", description: "Famous party street with bars, music, and nightlife", category: "nightlife", rank: 2 },
    { name: "Jackson Square", description: "Historic plaza with St. Louis Cathedral backdrop", category: "landmarks", rank: 3 },
    { name: "St. Louis Cathedral", description: "Oldest continuously active cathedral in the US", category: "history", rank: 4 },
    { name: "Frenchmen Street", description: "Live jazz clubs and authentic local music scene", category: "entertainment", rank: 5 },
    { name: "Garden District", description: "Beautiful historic neighborhood with antebellum mansions", category: "culture", rank: 6 },
    { name: "Magazine Street", description: "Six miles of boutiques, galleries, and restaurants", category: "shopping", rank: 7 },
    { name: "St. Charles Streetcar", description: "Historic streetcar line through oak-lined avenues", category: "entertainment", rank: 8 },
    { name: "National WWII Museum", description: "World-class museum chronicling the war", category: "history", rank: 9 },
    { name: "Preservation Hall", description: "Legendary jazz venue preserving traditional jazz", category: "entertainment", rank: 10 },
    { name: "City Park", description: "1,300-acre park with sculpture garden and beignets", category: "outdoor", rank: 11 },
    { name: "Café du Monde", description: "Iconic French Quarter café famous for beignets", category: "food", rank: 12 },
  ],
  "Miami": [
    { name: "South Beach", description: "Iconic beach with white sand and turquoise water", category: "beach", rank: 1 },
    { name: "Ocean Drive", description: "Art Deco architecture, outdoor dining, and nightlife", category: "landmarks", rank: 2 },
    { name: "Art Deco Historic District", description: "Largest collection of Art Deco architecture in the world", category: "culture", rank: 3 },
    { name: "Wynwood Walls", description: "World-famous outdoor street art museum", category: "culture", rank: 4 },
    { name: "Little Havana", description: "Cuban culture, Calle Ocho, and authentic cuisine", category: "culture", rank: 5 },
    { name: "Vizcaya Museum & Gardens", description: "Italian Renaissance-style villa and formal gardens", category: "history", rank: 6 },
    { name: "Pérez Art Museum Miami", description: "Contemporary art museum on Biscayne Bay", category: "culture", rank: 7 },
    { name: "Bayside Marketplace", description: "Waterfront shopping, dining, and entertainment", category: "entertainment", rank: 8 },
    { name: "Miami Design District", description: "Luxury shopping and contemporary art galleries", category: "shopping", rank: 9 },
    { name: "Brickell City Centre", description: "Modern urban shopping and dining complex", category: "shopping", rank: 10 },
    { name: "Miami Beach Boardwalk", description: "Scenic oceanfront path from South Beach to Mid-Beach", category: "outdoor", rank: 11 },
    { name: "Key Biscayne", description: "Beautiful island with Crandon Park and lighthouse", category: "outdoor", rank: 12 },
  ],
  "Chicago": [
    { name: "Millennium Park", description: "Cloud Gate (The Bean) and stunning public art", category: "landmarks", rank: 1 },
    { name: "Art Institute of Chicago", description: "World-class art museum with iconic lion statues", category: "culture", rank: 2 },
    { name: "Chicago Riverwalk", description: "Scenic waterfront promenade with dining and tours", category: "outdoor", rank: 3 },
    { name: "Architecture River Cruise", description: "Iconic boat tour showcasing Chicago's architecture", category: "sightseeing", rank: 4 },
    { name: "Navy Pier", description: "Entertainment destination with Ferris wheel and attractions", category: "entertainment", rank: 5 },
    { name: "Willis Tower Skydeck", description: "Glass boxes extending from 103rd floor with views", category: "landmarks", rank: 6 },
    { name: "360 Chicago", description: "John Hancock observation deck with TILT experience", category: "landmarks", rank: 7 },
    { name: "Magnificent Mile", description: "Premier shopping district on Michigan Avenue", category: "shopping", rank: 8 },
    { name: "Field Museum", description: "World-class natural history museum with Sue the T-Rex", category: "culture", rank: 9 },
    { name: "Shedd Aquarium", description: "One of the largest indoor aquariums in the world", category: "family", rank: 10 },
    { name: "Museum of Science and Industry", description: "Interactive science museum in historic building", category: "family", rank: 11 },
    { name: "Wrigley Field", description: "Historic ballpark home of the Chicago Cubs", category: "sports", rank: 12 },
  ],
  // ===== INTERNATIONAL TOP CITIES =====
  "Paris": [
    { name: "Eiffel Tower", description: "Iconic iron tower and symbol of Paris", category: "landmarks", rank: 1 },
    { name: "Louvre Museum", description: "World's largest art museum with the Mona Lisa", category: "culture", rank: 2 },
    { name: "Notre-Dame Cathedral", description: "Gothic masterpiece on Île de la Cité", category: "history", rank: 3 },
    { name: "Sacré-Cœur & Montmartre", description: "Artist quarter with stunning basilica views", category: "culture", rank: 4 },
    { name: "Arc de Triomphe", description: "Triumphal arch honoring French soldiers", category: "landmarks", rank: 5 },
    { name: "Champs-Élysées", description: "Famous avenue for shopping and strolling", category: "shopping", rank: 6 },
    { name: "Musée d'Orsay", description: "Impressionist and Post-Impressionist masterpieces", category: "culture", rank: 7 },
    { name: "Seine River Cruise", description: "See Paris monuments from the water", category: "sightseeing", rank: 8 },
    { name: "Sainte-Chapelle", description: "Gothic chapel with stunning stained glass windows", category: "history", rank: 9 },
    { name: "Centre Pompidou", description: "Modern art museum with inside-out architecture", category: "culture", rank: 10 },
    { name: "Luxembourg Gardens", description: "Beautiful formal gardens with palace", category: "outdoor", rank: 11 },
    { name: "Palace of Versailles", description: "Opulent royal palace and gardens", category: "history", rank: 12 },
  ],
  "London": [
    { name: "Buckingham Palace", description: "Royal residence and changing of the guard", category: "history", rank: 1 },
    { name: "Tower of London", description: "Historic castle and Crown Jewels", category: "history", rank: 2 },
    { name: "British Museum", description: "World history and cultural artifacts", category: "culture", rank: 3 },
    { name: "Westminster Abbey", description: "Gothic abbey and royal coronation site", category: "history", rank: 4 },
    { name: "Big Ben & Houses of Parliament", description: "Iconic clock tower and government buildings", category: "landmarks", rank: 5 },
    { name: "London Eye", description: "Giant observation wheel on Thames", category: "landmarks", rank: 6 },
    { name: "Tower Bridge", description: "Iconic Victorian bridge crossing the Thames", category: "landmarks", rank: 7 },
    { name: "St Paul's Cathedral", description: "Christopher Wren's masterpiece with iconic dome", category: "history", rank: 8 },
    { name: "Tate Modern", description: "World-renowned modern art museum in power station", category: "culture", rank: 9 },
    { name: "Trafalgar Square & National Gallery", description: "Historic square with world-class art museum", category: "culture", rank: 10 },
    { name: "Hyde Park", description: "Royal park with Speaker's Corner", category: "outdoor", rank: 11 },
    { name: "Borough Market", description: "Historic food market with gourmet offerings", category: "food", rank: 12 },
  ],
  "Rome": [
    { name: "Colosseum", description: "Ancient Roman amphitheater and gladiatorial arena", category: "history", rank: 1 },
    { name: "Roman Forum & Palatine Hill", description: "Ancient ruins of Rome's political center", category: "history", rank: 2 },
    { name: "Pantheon", description: "Ancient Roman temple with remarkable dome", category: "history", rank: 3 },
    { name: "Trevi Fountain", description: "Baroque fountain where you toss a coin", category: "landmarks", rank: 4 },
    { name: "Piazza Navona", description: "Beautiful baroque square with fountains", category: "landmarks", rank: 5 },
    { name: "Vatican Museums & Sistine Chapel", description: "Michelangelo's masterpiece ceiling", category: "culture", rank: 6 },
    { name: "St Peter's Basilica & Square", description: "World's largest church and papal seat", category: "history", rank: 7 },
    { name: "Spanish Steps", description: "Iconic stairway in the heart of Rome", category: "landmarks", rank: 8 },
    { name: "Castel Sant'Angelo", description: "Ancient fortress with panoramic views", category: "history", rank: 9 },
    { name: "Villa Borghese & Borghese Gallery", description: "Beautiful park and world-class art collection", category: "culture", rank: 10 },
    { name: "Trastevere", description: "Charming medieval neighborhood with nightlife", category: "culture", rank: 11 },
    { name: "Campo de' Fiori", description: "Historic market square and evening hotspot", category: "food", rank: 12 },
  ],
  "Barcelona": [
    { name: "Sagrada Família", description: "Gaudí's unfinished masterpiece basilica", category: "landmarks", rank: 1 },
    { name: "Park Güell", description: "Colorful Gaudí park with city views", category: "outdoor", rank: 2 },
    { name: "Casa Batlló", description: "Gaudí's whimsical modernist building", category: "landmarks", rank: 3 },
    { name: "Casa Milà (La Pedrera)", description: "Gaudí's undulating stone building", category: "landmarks", rank: 4 },
    { name: "Gothic Quarter", description: "Medieval streets and historic architecture", category: "culture", rank: 5 },
    { name: "La Rambla", description: "Famous tree-lined pedestrian boulevard", category: "landmarks", rank: 6 },
    { name: "La Boqueria Market", description: "Vibrant food market with local delicacies", category: "food", rank: 7 },
    { name: "Barceloneta Beach", description: "Popular city beach with seafood restaurants", category: "beach", rank: 8 },
    { name: "Montjuïc", description: "Hill with castle, gardens, and Olympic sites", category: "outdoor", rank: 9 },
    { name: "Palau de la Música Catalana", description: "Stunning modernist concert hall", category: "culture", rank: 10 },
    { name: "Picasso Museum", description: "Extensive collection of the artist's works", category: "culture", rank: 11 },
    { name: "Camp Nou", description: "FC Barcelona's legendary stadium", category: "sports", rank: 12 },
  ],
  "Tokyo": [
    { name: "Senso-ji Temple", description: "Ancient Buddhist temple in Asakusa", category: "history", rank: 1 },
    { name: "Meiji Jingu Shrine", description: "Serene Shinto shrine in forested park", category: "history", rank: 2 },
    { name: "Shibuya Crossing", description: "World's busiest pedestrian intersection", category: "landmarks", rank: 3 },
    { name: "Tokyo Skytree", description: "Tallest tower in Japan with observation decks", category: "landmarks", rank: 4 },
    { name: "Shinjuku Gyoen National Garden", description: "Beautiful gardens with cherry blossoms", category: "outdoor", rank: 5 },
    { name: "Imperial Palace East Gardens", description: "Historic gardens of the Emperor's residence", category: "outdoor", rank: 6 },
    { name: "Tsukiji Outer Market", description: "Famous fish market with fresh sushi", category: "food", rank: 7 },
    { name: "Ueno Park & Museums", description: "Cultural park with multiple museums", category: "culture", rank: 8 },
    { name: "Akihabara", description: "Electronics and anime/manga paradise", category: "shopping", rank: 9 },
    { name: "Ginza", description: "Upscale shopping and dining district", category: "shopping", rank: 10 },
    { name: "Odaiba", description: "Futuristic waterfront entertainment island", category: "entertainment", rank: 11 },
    { name: "teamLab Tokyo", description: "Immersive digital art museum experience", category: "culture", rank: 12 },
  ],
  "Dubai": [
    { name: "Burj Khalifa", description: "World's tallest building with observation deck", category: "landmarks", rank: 1 },
    { name: "Dubai Mall", description: "World's largest shopping mall with aquarium", category: "shopping", rank: 2 },
    { name: "Dubai Fountain", description: "Spectacular choreographed fountain show", category: "entertainment", rank: 3 },
    { name: "Palm Jumeirah", description: "Iconic palm-shaped artificial island", category: "landmarks", rank: 4 },
    { name: "Dubai Marina", description: "Stunning waterfront with dining and yachts", category: "entertainment", rank: 5 },
    { name: "Jumeirah Beach", description: "Beautiful public beach with Burj Al Arab views", category: "beach", rank: 6 },
    { name: "Al Fahidi Historic District", description: "Traditional wind-tower architecture and museums", category: "history", rank: 7 },
    { name: "Dubai Creek & Al Seef", description: "Historic waterway with traditional boats", category: "culture", rank: 8 },
    { name: "Gold Souk", description: "Traditional market with dazzling gold jewelry", category: "shopping", rank: 9 },
    { name: "Spice Souk", description: "Aromatic market with spices and perfumes", category: "shopping", rank: 10 },
    { name: "Desert Safari", description: "Dune bashing, camels, and Bedouin camp", category: "outdoor", rank: 11 },
    { name: "Museum of the Future", description: "Futuristic museum exploring tomorrow's world", category: "culture", rank: 12 },
  ],
  "Bangkok": [
    { name: "Grand Palace & Wat Phra Kaew", description: "Stunning royal complex with Emerald Buddha", category: "history", rank: 1 },
    { name: "Wat Pho", description: "Temple with giant reclining Buddha", category: "history", rank: 2 },
    { name: "Wat Arun", description: "Temple of Dawn with iconic spire", category: "history", rank: 3 },
    { name: "Golden Mount", description: "Hilltop temple with panoramic city views", category: "history", rank: 4 },
    { name: "Chinatown", description: "Vibrant Yaowarat district with street food", category: "food", rank: 5 },
    { name: "Chatuchak Weekend Market", description: "Massive outdoor market with 15,000 stalls", category: "shopping", rank: 6 },
    { name: "Jim Thompson House", description: "Traditional Thai house museum and gardens", category: "culture", rank: 7 },
    { name: "Chao Phraya River Cruise", description: "Scenic boat ride past temples and landmarks", category: "sightseeing", rank: 8 },
    { name: "Lumphini Park", description: "Green oasis with boating and monitor lizards", category: "outdoor", rank: 9 },
    { name: "Khao San Road", description: "Famous backpacker street with nightlife", category: "nightlife", rank: 10 },
    { name: "Siam / MBK Shopping Area", description: "Modern shopping malls and street food", category: "shopping", rank: 11 },
    { name: "Floating Market Day Trip", description: "Traditional market on the water", category: "culture", rank: 12 },
  ],
  "Singapore": [
    { name: "Gardens by the Bay", description: "Futuristic gardens with Supertrees", category: "outdoor", rank: 1 },
    { name: "Marina Bay Sands", description: "Iconic hotel with rooftop infinity pool", category: "landmarks", rank: 2 },
    { name: "Merlion Park", description: "Iconic half-lion, half-fish statue", category: "landmarks", rank: 3 },
    { name: "Singapore Flyer", description: "Giant observation wheel with city views", category: "landmarks", rank: 4 },
    { name: "ArtScience Museum", description: "Lotus-shaped museum with interactive exhibits", category: "culture", rank: 5 },
    { name: "Esplanade", description: "Theatres on the Bay performing arts center", category: "entertainment", rank: 6 },
    { name: "Clarke Quay", description: "Riverside dining and nightlife district", category: "nightlife", rank: 7 },
    { name: "Chinatown", description: "Historic district with temples and street food", category: "culture", rank: 8 },
    { name: "Little India", description: "Vibrant ethnic quarter with colorful streets", category: "culture", rank: 9 },
    { name: "Kampong Glam", description: "Arab quarter with Sultan Mosque", category: "culture", rank: 10 },
    { name: "Sentosa Island", description: "Resort island with beaches and attractions", category: "entertainment", rank: 11 },
    { name: "National Gallery Singapore", description: "World's largest collection of Southeast Asian art", category: "culture", rank: 12 },
  ],
  "Istanbul": [
    { name: "Hagia Sophia", description: "Byzantine masterpiece turned mosque", category: "history", rank: 1 },
    { name: "Blue Mosque", description: "Stunning mosque with six minarets", category: "history", rank: 2 },
    { name: "Topkapı Palace", description: "Ottoman sultans' imperial residence", category: "history", rank: 3 },
    { name: "Basilica Cistern", description: "Ancient underground water storage with columns", category: "history", rank: 4 },
    { name: "Grand Bazaar", description: "Historic covered market with 4,000 shops", category: "shopping", rank: 5 },
    { name: "Spice Bazaar", description: "Colorful market with spices and Turkish delights", category: "shopping", rank: 6 },
    { name: "Bosphorus Cruise", description: "Boat ride between Europe and Asia", category: "sightseeing", rank: 7 },
    { name: "Galata Tower", description: "Medieval tower with panoramic views", category: "landmarks", rank: 8 },
    { name: "Dolmabahçe Palace", description: "Opulent 19th-century waterfront palace", category: "history", rank: 9 },
    { name: "Sultanahmet Square", description: "Historic heart of old Constantinople", category: "landmarks", rank: 10 },
    { name: "Istiklal Street & Taksim", description: "Bustling pedestrian avenue with shops", category: "entertainment", rank: 11 },
    { name: "Maiden's Tower", description: "Romantic tower on island in Bosphorus", category: "landmarks", rank: 12 },
  ],
  "Amsterdam": [
    { name: "Rijksmuseum", description: "Dutch masterpieces including Rembrandt and Vermeer", category: "culture", rank: 1 },
    { name: "Van Gogh Museum", description: "World's largest Van Gogh collection", category: "culture", rank: 2 },
    { name: "Anne Frank House", description: "WWII hiding place turned museum", category: "history", rank: 3 },
    { name: "Canal Cruise", description: "See the city from its famous waterways", category: "sightseeing", rank: 4 },
    { name: "Jordaan", description: "Charming neighborhood with cafes and galleries", category: "culture", rank: 5 },
    { name: "Dam Square", description: "Central square with Royal Palace", category: "landmarks", rank: 6 },
    { name: "Vondelpark", description: "Popular green space for locals and visitors", category: "outdoor", rank: 7 },
    { name: "Stedelijk Museum", description: "Modern and contemporary art museum", category: "culture", rank: 8 },
    { name: "Heineken Experience", description: "Interactive brewery tour and tasting", category: "entertainment", rank: 9 },
    { name: "Albert Cuyp Market", description: "Amsterdam's largest street market", category: "shopping", rank: 10 },
    { name: "Rembrandt House Museum", description: "Artist's former home and studio", category: "culture", rank: 11 },
    { name: "De Wallen", description: "Historic Red Light District", category: "culture", rank: 12 },
  ],
};

// Helper to get featured activities for a city
export function getFeaturedActivitiesForCity(cityName: string): Array<{name: string, description: string, category: string, rank: number}> {
  const normalizedCity = cityName.trim();
  
  // Check direct match
  if (FEATURED_CITY_ACTIVITIES[normalizedCity]) {
    return FEATURED_CITY_ACTIVITIES[normalizedCity];
  }
  
  // Check LA Metro cities
  if (['Playa del Rey', 'Santa Monica', 'Venice', 'Culver City', 'West Hollywood', 'Beverly Hills', 
       'Malibu', 'Manhattan Beach', 'Hermosa Beach', 'Redondo Beach', 'Long Beach', 'Pasadena'].includes(normalizedCity)) {
    return FEATURED_CITY_ACTIVITIES['Los Angeles'] || [];
  }
  
  return [];
}

export const STATIC_CITY_ACTIVITIES: Record<string, Array<{name: string, description: string, category: string}>> = {
  "New York City": [
    { name: "Empire State Building Tour", description: "Visit the iconic Art Deco skyscraper and observation deck", category: "landmarks" },
    { name: "High Line Walk", description: "Stroll along the elevated urban park built on former railway", category: "outdoor" },
    { name: "Broadway Shows", description: "Experience world-class theater in the Theater District", category: "entertainment" },
    { name: "Central Park Activities", description: "Enjoy the green oasis in Manhattan", category: "outdoor" },
    { name: "9/11 Memorial & Museum", description: "Pay respects at this moving memorial", category: "history" },
    { name: "Brooklyn Bridge Walk", description: "Cross the historic suspension bridge", category: "landmarks" },
    { name: "Times Square Experience", description: "Feel the energy of the city's crossroads", category: "landmarks" },
    { name: "Staten Island Ferry", description: "Free ride with Statue of Liberty views", category: "transport" },
    { name: "Museum Hopping", description: "Visit world-renowned museums like MoMA, Met", category: "culture" },
    { name: "Little Italy Food Tour", description: "Taste authentic Italian-American cuisine", category: "food" },
    { name: "Lower East Side Food Tour", description: "Explore Jewish delis, trendy eateries, and cultural history", category: "food" },
    { name: "Chinatown Exploration", description: "Discover authentic Asian culture and food", category: "culture" },
    { name: "Wall Street & Financial District", description: "See the heart of American finance", category: "business" },
    { name: "Rockefeller Center", description: "Top of the Rock observation deck and iconic plaza", category: "landmarks" },
    { name: "TKTS Booth", description: "Get discounted Broadway show tickets", category: "entertainment" },
    { name: "Williamsburg Bridge Walk", description: "Cross between Manhattan and Brooklyn", category: "outdoor" },
    { name: "Battery Park City Walk", description: "Waterfront parks with harbor views", category: "outdoor" },
    { name: "One World Observatory", description: "Stunning views from tallest building in Western Hemisphere", category: "landmarks" },
    { name: "Hudson Yards & The Vessel", description: "Modern architectural marvel and shopping destination", category: "landmarks" },
    { name: "SoHo Shopping", description: "Cobblestone streets with designer boutiques and art galleries", category: "shopping" }
  ],

  "Los Angeles": [
    // MAJOR THEME PARKS & TOURIST ATTRACTIONS
    { name: "Disneyland Resort", description: "The original Magic Kingdom with Disney California Adventure", category: "theme_park" },
    { name: "Universal Studios Hollywood", description: "Movie studio tours and thrilling theme park rides", category: "theme_park" },
    { name: "Knott's Berry Farm", description: "America's first theme park with roller coasters and boysenberry treats", category: "theme_park" },
    { name: "Six Flags Magic Mountain", description: "Thrill capital with world-class roller coasters", category: "theme_park" },
    
    // HOLLYWOOD & ENTERTAINMENT
    { name: "Hollywood Walk of Fame", description: "Celebrity stars embedded in sidewalk along Hollywood Boulevard", category: "landmarks" },
    { name: "TCL Chinese Theatre", description: "Historic movie palace with celebrity handprints and premieres", category: "landmarks" },
    { name: "Hollywood Sign Hike", description: "Hike to views of the famous sign", category: "outdoor" },
    { name: "Hollywood Boulevard", description: "Historic entertainment district with shops, theaters, and street performers", category: "entertainment" },
    { name: "Celebrity Home Tours", description: "Bus tours through Beverly Hills and Hollywood Hills celebrity neighborhoods", category: "entertainment" },
    { name: "Warner Bros Studio Tour", description: "Behind-the-scenes look at active movie and TV production", category: "entertainment" },
    { name: "Paramount Pictures Studio Tour", description: "Explore the historic movie studio with working soundstages", category: "entertainment" },
    { name: "Hollywood Bowl", description: "Outdoor amphitheater for concerts under the stars", category: "entertainment" },
    
    // BEACHES & COASTAL
    { name: "Santa Monica Pier", description: "Classic amusement park on the Pacific with Ferris wheel", category: "entertainment" },
    { name: "Venice Beach", description: "Bohemian beach with street performers, muscle beach, and boardwalk", category: "beach" },
    { name: "Malibu Beaches", description: "Scenic coastal drive with pristine beaches and celebrity homes", category: "beach" },
    { name: "Manhattan Beach", description: "Upscale beach town perfect for volleyball and surfing", category: "beach" },
    { name: "Redondo Beach Pier", description: "Family-friendly pier with restaurants, arcade, and fishing", category: "beach" },
    { name: "Hermosa Beach", description: "Lively beach town known for nightlife and beach volleyball", category: "beach" },
    
    // CULTURAL ATTRACTIONS
    { name: "Getty Center", description: "World-class art museum with architecture and stunning city views", category: "culture" },
    { name: "Getty Villa", description: "Ancient art in a stunning recreated Roman villa", category: "culture" },
    { name: "The Broad Museum", description: "Contemporary art museum with Yayoi Kusama infinity rooms", category: "culture" },
    { name: "Los Angeles County Museum of Art", description: "Largest art museum in the western United States", category: "culture" },
    { name: "Griffith Observatory", description: "Iconic observatory with planetarium and Hollywood Sign views", category: "landmarks" },
    { name: "Walt Disney Concert Hall", description: "Frank Gehry's architectural masterpiece and home to LA Phil", category: "culture" },
    { name: "Museum of Contemporary Art", description: "MOCA showcases cutting-edge modern art", category: "culture" },
    
    // SHOPPING & LUXURY
    { name: "Rodeo Drive", description: "World-famous luxury shopping street in Beverly Hills", category: "shopping" },
    { name: "The Grove", description: "Popular outdoor shopping and entertainment complex", category: "shopping" },
    { name: "Beverly Center", description: "Luxury shopping mall with designer boutiques", category: "shopping" },
    { name: "Melrose Avenue", description: "Trendy street with vintage shops, boutiques, and restaurants", category: "shopping" },
    { name: "Third Street Promenade", description: "Pedestrian mall with shopping, dining, and street performers", category: "shopping" },
    
    // DOWNTOWN LA
    { name: "Downtown LA Arts District", description: "Hip neighborhood with galleries, breweries, and industrial-chic venues", category: "culture" },
    { name: "Grand Central Market", description: "Historic food hall with diverse vendors and cuisines", category: "food" },
    { name: "Little Tokyo", description: "Cultural district with authentic Japanese restaurants, shops, and gardens", category: "culture" },
    { name: "Olvera Street", description: "Historic Mexican marketplace and birthplace of Los Angeles", category: "history" },
    { name: "LA Live", description: "Entertainment complex with venues, restaurants, and nightlife", category: "entertainment" },
    
    // UNIQUE LA EXPERIENCES
    { name: "La Brea Tar Pits", description: "Active paleontological site with Ice Age fossils and museum", category: "science" },
    { name: "Farmers Market", description: "Historic market with food vendors and specialty shops since 1934", category: "food" },
    { name: "Sunset Strip", description: "Legendary nightlife district with iconic music venues and clubs", category: "nightlife" },
    { name: "Food Truck Culture", description: "Diverse mobile food scene with gourmet trucks citywide", category: "food" },
    { name: "In-N-Out Burger", description: "California's beloved burger chain - a must-try local institution", category: "food" },
    
    // OUTDOOR & NATURE
    { name: "Mulholland Drive", description: "Scenic mountain road with panoramic city and valley views", category: "outdoor" },
    { name: "Topanga Canyon", description: "Bohemian mountain community with hiking trails and vintage shops", category: "outdoor" },
    { name: "Malibu Wine Safari", description: "Wine tasting with exotic animals in Malibu mountains", category: "outdoor" },
    
    // FAMILY ATTRACTIONS
    { name: "California Science Center", description: "Interactive science museum with Space Shuttle Endeavour", category: "family" },
    { name: "Los Angeles Zoo", description: "Home to over 1,400 animals including rare and endangered species", category: "family" },
    { name: "Aquarium of the Pacific", description: "Ocean exhibits featuring Pacific marine life (in Long Beach)", category: "family" },
    { name: "Madame Tussauds Hollywood", description: "Wax museum with celebrity figures and interactive experiences", category: "family" }
  ],

  "San Francisco": [
    { name: "Golden Gate Bridge", description: "Walk or bike across the iconic red suspension bridge", category: "landmarks" },
    { name: "Alcatraz Island Tour", description: "Explore the infamous former federal prison", category: "history" },
    { name: "Fisherman's Wharf", description: "Waterfront dining and sea lions at Pier 39", category: "entertainment" },
    { name: "Lombard Street", description: "Drive down the world's most crooked street", category: "landmarks" },
    { name: "Cable Car Rides", description: "Historic transportation up San Francisco's hills", category: "transport" },
    { name: "Golden Gate Park", description: "Sprawling urban park with gardens and museums", category: "outdoor" },
    { name: "Chinatown Exploration", description: "Largest Chinatown outside of Asia", category: "culture" },
    { name: "Union Square Shopping", description: "Premier shopping district in downtown", category: "shopping" },
    { name: "Napa Valley Day Trip", description: "Wine tasting in world-famous vineyard region", category: "daytrip" },
    { name: "Sausalito Ferry", description: "Scenic waterfront town across the bay", category: "daytrip" },
    { name: "Mission District Food Scene", description: "Authentic Mexican food and street art", category: "food" },
    { name: "Coit Tower Views", description: "Art Deco tower with 360-degree city views", category: "landmarks" },
    { name: "Castro District", description: "Historic LGBTQ+ neighborhood and culture", category: "culture" },
    { name: "Haight-Ashbury", description: "Famous 1960s hippie neighborhood", category: "culture" }
  ],

  "Chicago": [
    { name: "Millennium Park", description: "Public park with Cloud Gate sculpture", category: "landmarks" },
    { name: "Navy Pier", description: "Entertainment destination on Lake Michigan", category: "entertainment" },
    { name: "Art Institute of Chicago", description: "World-renowned art museum", category: "culture" },
    { name: "Willis Tower Skydeck", description: "Glass boxes extending from 103rd floor", category: "landmarks" },
    { name: "Architecture Boat Tour", description: "See Chicago's famous skyline from the river", category: "culture" },
    { name: "Deep Dish Pizza Tour", description: "Taste Chicago's signature pizza style", category: "food" },
    { name: "Wrigley Field", description: "Historic baseball stadium experience", category: "sports" },
    { name: "Lincoln Park Zoo", description: "Free zoo in beautiful Lincoln Park", category: "family" },
    { name: "Second City Comedy", description: "Famous improv and comedy shows", category: "entertainment" },
    { name: "Grant Park Festivals", description: "Outdoor festivals including Lollapalooza", category: "entertainment" },
    { name: "Magnificent Mile", description: "Premier shopping on Michigan Avenue", category: "shopping" },
    { name: "Lake Michigan Beaches", description: "Urban beaches along the Great Lake", category: "outdoor" },
    { name: "Frank Lloyd Wright Home", description: "Tour the architect's home and studio", category: "architecture" }
  ],

  "Miami": [
    { name: "South Beach", description: "Art Deco district and pristine white sand beach", category: "beach" },
    { name: "Wynwood Walls", description: "Outdoor street art museum and galleries", category: "culture" },
    { name: "Little Havana", description: "Cuban culture, food, and cigar experiences", category: "culture" },
    { name: "Ocean Drive", description: "Iconic beachfront boulevard with Art Deco architecture", category: "landmarks" },
    { name: "Everglades National Park", description: "Unique ecosystem with alligators and wildlife", category: "nature" },
    { name: "Bayside Marketplace", description: "Waterfront shopping and dining", category: "shopping" },
    { name: "Key Biscayne", description: "Peaceful island getaway near downtown", category: "beach" },
    { name: "Miami Design District", description: "High-end fashion and contemporary art", category: "shopping" },
    { name: "Vizcaya Museum", description: "Italian Renaissance-style villa and gardens", category: "history" },
    { name: "Coconut Grove", description: "Bohemian neighborhood with outdoor dining", category: "culture" },
    { name: "Art Basel Events", description: "World-famous art fair and cultural events", category: "culture" },
    { name: "Biscayne Bay Boat Tour", description: "See celebrity mansions from the water", category: "entertainment" }
  ],

  "Las Vegas": [
    { name: "The Strip Casinos", description: "Iconic casino resorts and entertainment", category: "entertainment" },
    { name: "Bellagio Fountains", description: "Musical water show every 15-30 minutes", category: "entertainment" },
    { name: "Red Rock Canyon", description: "Scenic desert landscape 20 minutes from Strip", category: "nature" },
    { name: "Fremont Street Experience", description: "Vintage Vegas with LED canopy shows", category: "entertainment" },
    { name: "High Roller Observation Wheel", description: "World's largest observation wheel", category: "landmarks" },
    { name: "Valley of Fire State Park", description: "Ancient red sandstone formations", category: "nature" },
    { name: "Neon Museum", description: "Outdoor museum of vintage Vegas signs", category: "culture" },
    { name: "Hoover Dam Tour", description: "Engineering marvel on Colorado River", category: "history" },
    { name: "Cirque du Soleil Shows", description: "World-class acrobatic performances", category: "entertainment" },
    { name: "Lake Tahoe Day Trip", description: "Mountain lake resort destination", category: "daytrip" }
  ],

  "Seattle": [
    { name: "Space Needle", description: "Iconic observation tower from 1962 World's Fair", category: "landmarks" },
    { name: "Pike Place Market", description: "Historic farmers market with fish throwing", category: "culture" },
    { name: "Coffee Shop Tours", description: "Explore the birthplace of coffee culture", category: "food" },
    { name: "Mount Rainier National Park", description: "Glaciated volcano and wildflower meadows", category: "nature" },
    { name: "Seattle Waterfront", description: "Ferry rides and waterfront attractions", category: "outdoor" },
    { name: "Chihuly Garden and Glass", description: "Stunning glass art installations", category: "culture" },
    { name: "Underground Tour", description: "Explore Seattle's buried past", category: "history" },
    { name: "Music Scene", description: "Birthplace of grunge and live music venues", category: "entertainment" },
    { name: "Puget Sound Ferry", description: "Scenic ferry rides to islands", category: "transport" },
    { name: "Capitol Hill", description: "Hip neighborhood with nightlife and dining", category: "culture" }
  ],

  "Boston": [
    { name: "Freedom Trail", description: "Walk the path of American Revolution history", category: "history" },
    { name: "Harvard University", description: "Tour America's oldest university campus", category: "education" },
    { name: "Boston Tea Party Ships", description: "Interactive historical experience", category: "history" },
    { name: "Fenway Park", description: "Historic baseball park home of Red Sox", category: "sports" },
    { name: "North End Food Tour", description: "Italian-American cuisine in historic neighborhood", category: "food" },
    { name: "Boston Symphony Orchestra", description: "World-renowned classical music performances", category: "entertainment" },
    { name: "Boston Common", description: "America's oldest public park", category: "outdoor" },
    { name: "MIT Campus Tour", description: "Explore world's leading tech university", category: "education" },
    { name: "New England Aquarium", description: "Marine life including giant ocean tank", category: "family" },
    { name: "Cheers Bar", description: "Visit the bar that inspired the TV show", category: "entertainment" }
  ],

  "Washington DC": [
    { name: "Smithsonian Museums", description: "World's largest museum complex", category: "culture" },
    { name: "National Mall", description: "Historic monuments and memorials", category: "landmarks" },
    { name: "White House Tour", description: "Tour the President's residence", category: "history" },
    { name: "Capitol Building", description: "Seat of the U.S. Congress", category: "history" },
    { name: "Lincoln Memorial", description: "Iconic memorial to 16th President", category: "landmarks" },
    { name: "Washington Monument", description: "Towering obelisk honoring first President", category: "landmarks" },
    { name: "Kennedy Center", description: "National performing arts center", category: "entertainment" },
    { name: "Georgetown Waterfront", description: "Historic neighborhood with dining and shopping", category: "culture" },
    { name: "National Zoo", description: "Famous pandas and diverse wildlife", category: "family" },
    { name: "Arlington Cemetery", description: "Military cemetery with changing of guard", category: "history" }
  ],

  "London": [
    { name: "Big Ben & Parliament", description: "Iconic clock tower and government buildings", category: "landmarks" },
    { name: "Tower of London", description: "Historic castle and Crown Jewels", category: "history" },
    { name: "British Museum", description: "World history and cultural artifacts", category: "culture" },
    { name: "London Eye", description: "Giant observation wheel on Thames", category: "landmarks" },
    { name: "Buckingham Palace", description: "Royal residence and changing of the guard", category: "history" },
    { name: "West End Shows", description: "World-class theater productions", category: "entertainment" },
    { name: "Hyde Park", description: "Royal park with Speaker's Corner", category: "outdoor" },
    { name: "Borough Market", description: "Historic food market with gourmet offerings", category: "food" },
    { name: "Thames River Cruise", description: "See London's landmarks from the water", category: "sightseeing" },
    { name: "Camden Market", description: "Alternative culture and vintage shopping", category: "shopping" },
    { name: "Pub Culture", description: "Traditional British pubs and ales", category: "culture" },
    { name: "Covent Garden", description: "Shopping, dining, and street performers", category: "entertainment" }
  ],

  "Paris": [
    { name: "Eiffel Tower", description: "Iconic iron tower and symbol of Paris", category: "landmarks" },
    { name: "Louvre Museum", description: "World's largest art museum", category: "culture" },
    { name: "Notre-Dame Cathedral", description: "Gothic masterpiece on Île de la Cité", category: "history" },
    { name: "Arc de Triomphe", description: "Triumphal arch on Champs-Élysées", category: "landmarks" },
    { name: "Seine River Cruise", description: "See Paris monuments from the water", category: "sightseeing" },
    { name: "Montmartre & Sacré-Cœur", description: "Artist quarter with basilica views", category: "culture" },
    { name: "Latin Quarter", description: "Historic student district with narrow streets", category: "culture" },
    { name: "Versailles Palace", description: "Opulent royal palace and gardens", category: "history" },
    { name: "French Café Culture", description: "Experience sidewalk cafés and pastries", category: "food" },
    { name: "Champs-Élysées Shopping", description: "Famous avenue for shopping and strolling", category: "shopping" },
    { name: "Marais District", description: "Historic Jewish quarter with boutiques", category: "culture" },
    { name: "Wine Tasting", description: "Sample French wines in local wine bars", category: "food" }
  ],

  "Tokyo": [
    { name: "Shibuya Crossing", description: "World's busiest pedestrian intersection", category: "landmarks" },
    { name: "Senso-ji Temple", description: "Ancient Buddhist temple in Asakusa", category: "culture" },
    { name: "Tsukiji Outer Market", description: "Fresh seafood and street food", category: "food" },
    { name: "Tokyo Skytree", description: "Tallest structure in Japan with city views", category: "landmarks" },
    { name: "Meiji Shrine", description: "Peaceful Shinto shrine in forested park", category: "culture" },
    { name: "Harajuku Fashion", description: "Youth culture and unique street fashion", category: "culture" },
    { name: "Ginza Shopping", description: "Upscale shopping district", category: "shopping" },
    { name: "Robot Restaurant", description: "Futuristic dinner show experience", category: "entertainment" },
    { name: "Cherry Blossom Viewing", description: "Seasonal sakura viewing parties", category: "outdoor" },
    { name: "Ramen Tours", description: "Taste authentic Japanese noodle soups", category: "food" },
    { name: "Akihabara Electronics", description: "Electric town for anime and tech culture", category: "shopping" },
    { name: "Traditional Onsen", description: "Relax in natural hot spring baths", category: "culture" }
  ],

  "Berlin": [
    { name: "Brandenburg Gate", description: "Iconic neoclassical monument", category: "landmarks" },
    { name: "Berlin Wall Memorial", description: "Historic Cold War barrier remnants", category: "history" },
    { name: "Museum Island", description: "UNESCO World Heritage museum complex", category: "culture" },
    { name: "Reichstag Building", description: "German Parliament with glass dome", category: "history" },
    { name: "East Side Gallery", description: "Longest open-air gallery on Berlin Wall", category: "culture" },
    { name: "Checkpoint Charlie", description: "Famous Cold War crossing point", category: "history" },
    { name: "Beer Gardens", description: "Traditional outdoor drinking culture", category: "culture" },
    { name: "Kreuzberg Nightlife", description: "Alternative culture and club scene", category: "nightlife" },
    { name: "Tiergarten Park", description: "Large urban park in city center", category: "outdoor" },
    { name: "Holocaust Memorial", description: "Moving memorial to murdered Jews", category: "history" },
    { name: "Currywurst", description: "Try Berlin's famous street food", category: "food" },
    { name: "Techno Clubs", description: "World-famous electronic music scene", category: "nightlife" }
  ],

  "Barcelona": [
    { name: "Sagrada Familia", description: "Gaudí's unfinished architectural masterpiece", category: "landmarks" },
    { name: "Park Güell", description: "Colorful mosaic park with city views", category: "outdoor" },
    { name: "Las Ramblas", description: "Famous tree-lined pedestrian street", category: "culture" },
    { name: "Gothic Quarter", description: "Medieval streets and historic architecture", category: "history" },
    { name: "Casa Batlló", description: "Gaudí's organic architecture masterpiece", category: "culture" },
    { name: "Barceloneta Beach", description: "Urban beach with Mediterranean vibes", category: "beach" },
    { name: "Tapas Tours", description: "Sample small plates and local wines", category: "food" },
    { name: "Flamenco Shows", description: "Passionate Spanish dance performances", category: "entertainment" },
    { name: "Camp Nou", description: "FC Barcelona's legendary football stadium", category: "sports" },
    { name: "Boqueria Market", description: "Vibrant food market off Las Ramblas", category: "food" },
    { name: "Montjuïc Hill", description: "Hilltop with gardens, museums, and views", category: "outdoor" },
    { name: "Casa Milà", description: "Another stunning Gaudí residential building", category: "culture" }
  ],

  "Rome": [
    { name: "Colosseum", description: "Ancient amphitheater and gladiator arena", category: "history" },
    { name: "Vatican City", description: "Sistine Chapel and St. Peter's Basilica", category: "history" },
    { name: "Trevi Fountain", description: "Baroque fountain for coin-tossing wishes", category: "landmarks" },
    { name: "Roman Forum", description: "Ancient Roman government and commercial center", category: "history" },
    { name: "Pantheon", description: "Best-preserved Roman building", category: "history" },
    { name: "Spanish Steps", description: "Famous stairway connecting squares", category: "landmarks" },
    { name: "Trastevere District", description: "Charming neighborhood with authentic restaurants", category: "culture" },
    { name: "Gelato Tours", description: "Sample Italy's famous frozen dessert", category: "food" },
    { name: "Villa Borghese", description: "Large landscape garden with museums", category: "outdoor" },
    { name: "Campo de' Fiori", description: "Lively square with market and nightlife", category: "culture" },
    { name: "Roman Catacombs", description: "Underground burial networks", category: "history" },
    { name: "Aperitivo Culture", description: "Italian pre-dinner drinks and snacks", category: "culture" }
  ],

  "Amsterdam": [
    { name: "Canal Ring", description: "Historic waterways and canal house architecture", category: "landmarks" },
    { name: "Anne Frank House", description: "Museum in secret annex where Anne Frank hid", category: "history" },
    { name: "Van Gogh Museum", description: "World's largest collection of Van Gogh art", category: "culture" },
    { name: "Bike Tours", description: "Explore the city like locals on bicycles", category: "outdoor" },
    { name: "Rijksmuseum", description: "Dutch national museum with Rembrandt works", category: "culture" },
    { name: "Red Light District", description: "Historic area with unique nightlife", category: "culture" },
    { name: "Vondelpark", description: "Large urban park perfect for picnics", category: "outdoor" },
    { name: "Jordaan District", description: "Charming neighborhood with cafés and galleries", category: "culture" },
    { name: "Coffee Shops", description: "Experience Amsterdam's unique café culture", category: "culture" },
    { name: "Flower Market", description: "Floating flower market with tulip bulbs", category: "shopping" },
    { name: "Keukenhof Gardens", description: "Seasonal tulip gardens (spring only)", category: "outdoor" },
    { name: "Brown Cafés", description: "Traditional Dutch pubs with local atmosphere", category: "culture" }
  ],

  "Sydney": [
    { name: "Sydney Opera House", description: "Iconic performing arts center and architectural marvel", category: "landmarks" },
    { name: "Sydney Harbour Bridge", description: "Famous steel arch bridge with climbing tours", category: "landmarks" },
    { name: "Bondi Beach", description: "World-famous beach with surf culture", category: "beach" },
    { name: "The Rocks Historic Area", description: "Cobblestone streets with weekend markets", category: "history" },
    { name: "Royal Botanic Gardens", description: "Waterfront gardens with harbour views", category: "outdoor" },
    { name: "Darling Harbour", description: "Entertainment precinct with dining and attractions", category: "entertainment" },
    { name: "Manly Beach Ferry", description: "Scenic ferry ride to beautiful beach suburb", category: "transport" },
    { name: "Blue Mountains Day Trip", description: "Scenic mountains with Three Sisters rock formation", category: "daytrip" },
    { name: "Circular Quay", description: "Transport hub with street performers and dining", category: "culture" },
    { name: "Chinatown", description: "Vibrant Asian culture and authentic cuisine", category: "culture" },
    { name: "Taronga Zoo", description: "World-class zoo with harbour views", category: "family" },
    { name: "Surry Hills", description: "Trendy neighborhood with cafés and boutiques", category: "culture" }
  ],

  "New Orleans": [
    { name: "French Quarter Walking Tour", description: "Historic Creole architecture and vibrant street life", category: "culture" },
    { name: "Bourbon Street Nightlife", description: "Legendary entertainment district with live music", category: "nightlife" },
    { name: "Jazz Clubs on Frenchmen Street", description: "Authentic local music venues and street performers", category: "entertainment" },
    { name: "Garden District Mansions", description: "Antebellum homes and oak-lined streets", category: "history" },
    { name: "St. Louis Cathedral", description: "Historic Catholic cathedral in Jackson Square", category: "landmarks" },
    { name: "Cafe du Monde Beignets", description: "Famous coffee and beignets since 1862", category: "food" },
    { name: "Mississippi River Steamboat", description: "Historic paddle wheel riverboat cruises", category: "transport" },
    { name: "Mardi Gras World", description: "Behind-the-scenes look at float construction", category: "culture" },
    { name: "Cemetery Tours", description: "Above-ground tombs and voodoo history", category: "history" },
    { name: "Streetcar Rides", description: "Historic streetcar lines through the city", category: "transport" },
    { name: "Creole & Cajun Food Tours", description: "Authentic Louisiana cuisine experiences", category: "food" },
    { name: "Audubon Aquarium", description: "Gulf Coast marine life and IMAX theater", category: "family" },
    { name: "Preservation Hall Jazz", description: "Intimate traditional jazz performances", category: "entertainment" },
    { name: "Jackson Square Artists", description: "Local artists and street performers", category: "culture" },
    { name: "Swamp Tours", description: "Airboat tours through Louisiana bayous", category: "nature" }
  ],

  "Austin": [
    { name: "South by Southwest (SXSW)", description: "World-famous music, film, and interactive festival", category: "entertainment" },
    { name: "Live Music on 6th Street", description: "Legendary music venues and honky-tonks", category: "entertainment" },
    { name: "Austin City Limits Music Festival", description: "Annual outdoor music festival in Zilker Park", category: "entertainment" },
    { name: "State Capitol Building", description: "Tour Texas's pink granite capitol building", category: "history" },
    { name: "Zilker Park Activities", description: "Large urban park with trails and events", category: "outdoor" },
    { name: "Barton Springs Pool", description: "Natural spring-fed pool maintains 70°F year-round", category: "outdoor" },
    { name: "BBQ Trail", description: "Sample Austin's legendary barbecue joints", category: "food" },
    { name: "Food Truck Culture", description: "Diverse mobile food scene throughout the city", category: "food" },
    { name: "Lady Bird Lake Kayaking", description: "Paddle boarding and kayaking in downtown", category: "outdoor" },
    { name: "Congress Avenue Bridge Bats", description: "Watch largest urban bat colony emerge at sunset", category: "nature" },
    { name: "Rainey Street Historic District", description: "Converted homes turned into bars and restaurants", category: "nightlife" },
    { name: "UT Campus Tour", description: "Explore University of Texas campus and tower", category: "education" },
    { name: "East Austin Art Scene", description: "Galleries, studios, and street art in trendy district", category: "culture" },
    { name: "Keep Austin Weird", description: "Explore the city's quirky culture and local businesses", category: "culture" },
    { name: "Hill Country Day Trips", description: "Wine tours and scenic drives in Texas Hill Country", category: "daytrip" }
  ],

  "Nashville": [
    { name: "Grand Ole Opry", description: "World's longest-running radio show and country music shrine", category: "entertainment" },
    { name: "Country Music Hall of Fame", description: "Museum celebrating country music history", category: "culture" },
    { name: "Broadway Honky Tonks", description: "Live country music venues on historic Broadway", category: "entertainment" },
    { name: "Ryman Auditorium", description: "Mother Church of Country Music historic venue", category: "landmarks" },
    { name: "Music City Walk of Fame", description: "Celebrate Nashville's musical legends", category: "culture" },
    { name: "Johnny Cash Museum", description: "Comprehensive collection of Man in Black memorabilia", category: "culture" },
    { name: "RCA Studio B Tours", description: "Historic recording studio where Elvis recorded", category: "history" },
    { name: "Opryland Resort", description: "Massive resort complex with gardens and entertainment", category: "entertainment" },
    { name: "The Gulch District", description: "Modern downtown neighborhood with dining and shopping", category: "culture" },
    { name: "Music Row Studios", description: "Heart of country music recording industry", category: "culture" },
    { name: "Centennial Park & Parthenon", description: "Full-scale replica of Athens Parthenon", category: "landmarks" },
    { name: "Belle Meade Plantation", description: "Historic mansion and thoroughbred horse farm", category: "history" },
    { name: "Whiskey Distillery Tours", description: "Sample Tennessee whiskey at local distilleries", category: "food" },
    { name: "Cheekwood Estate & Gardens", description: "Art museum in historic mansion with botanical gardens", category: "culture" },
    { name: "Hatch Show Print", description: "Historic letterpress poster shop", category: "culture" }
  ]
};

// Helper function to get activities for a city
export function getStaticActivitiesForCity(cityName: string): Array<{name: string, description: string, category: string}> {
  // Handle common variations and metro areas
  const normalizedCity = cityName.trim();
  
  // Direct match
  if (STATIC_CITY_ACTIVITIES[normalizedCity]) {
    return STATIC_CITY_ACTIVITIES[normalizedCity];
  }
  
  // Handle common variations
  const cityVariations: Record<string, string> = {
    "NYC": "New York City",
    "New York": "New York City",
    "LA": "Los Angeles", 
    "Los Angeles Metro": "Los Angeles",
    "SF": "San Francisco",
    "San Fran": "San Francisco",
    "Vegas": "Las Vegas",
    "LV": "Las Vegas",
    "DC": "Washington DC",
    "Washington": "Washington DC",
    "NOLA": "New Orleans",
    "The Big Easy": "New Orleans"
  };
  
  const mappedCity = cityVariations[normalizedCity];
  if (mappedCity && STATIC_CITY_ACTIVITIES[mappedCity]) {
    return STATIC_CITY_ACTIVITIES[mappedCity];
  }
  
  return [];
}