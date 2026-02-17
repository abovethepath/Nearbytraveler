/**
 * Location data - uses shared/locationData.ts as single source of truth for COUNTRIES.
 * US cities, states, and international cities are defined here for LocationPicker.
 */

import { COUNTRIES as SHARED_COUNTRIES } from 'shared/locationData';

// LA County Metro cities (76+) - from shared/constants METRO_AREAS
const LA_METRO_CITIES = [
  'Los Angeles', 'Playa del Rey', 'Santa Monica', 'Venice', 'Venice Beach',
  'Culver City', 'Marina del Rey', 'El Segundo', 'Manhattan Beach', 'Hermosa Beach',
  'Redondo Beach', 'Beverly Hills', 'West Hollywood', 'Hollywood', 'North Hollywood',
  'Burbank', 'Glendale', 'Pasadena', 'South Pasadena', 'Long Beach', 'Torrance',
  'Inglewood', 'Hawthorne', 'Gardena', 'Carson', 'Compton', 'Downey', 'Norwalk',
  'Whittier', 'Pomona', 'West LA', 'Westwood', 'Brentwood', 'Pacific Palisades',
  'Malibu', 'Studio City', 'Sherman Oaks', 'Encino', 'Tarzana', 'Woodland Hills',
  'Canoga Park', 'Chatsworth', 'Northridge', 'Granada Hills', 'Van Nuys', 'Reseda',
  'Panorama City', 'Sun Valley', 'Pacoima', 'Sylmar', 'Mission Hills', 'Eagle Rock',
  'Highland Park', 'Silver Lake', 'Echo Park', 'Los Feliz', 'Atwater Village',
  'Downtown LA', 'Koreatown', 'Mid-City', 'Miracle Mile', 'Crenshaw', 'Leimert Park',
  'Baldwin Hills', 'Ladera Heights', 'View Park', 'Watts', 'South LA', 'Boyle Heights',
  'East LA', 'East Los Angeles', 'Monterey Park', 'Alhambra', 'Montebello',
  'San Pedro', 'Wilmington', 'Harbor City', 'Harbor Gateway'
];

// US cities from locationData - popular LA metro first, then other major cities
const US_CITIES_BASE = [
  'Los Angeles', 'Santa Monica', 'Venice', 'Venice Beach', 'Beverly Hills', 'West Hollywood', 'Hollywood',
  'Culver City', 'Marina del Rey', 'Manhattan Beach', 'Hermosa Beach', 'Redondo Beach', 'Playa del Rey',
  'Malibu', 'Pasadena', 'Glendale', 'Burbank', 'Long Beach', 'El Segundo', 'Westwood', 'West LA',
  'Downtown LA', 'Silver Lake', 'Echo Park', 'Los Feliz', 'Koreatown', 'Inglewood', 'Torrance',
  'Las Vegas', 'Miami', 'Nashville', 'New Orleans', 'Austin', 'Chicago', 'New York City',
  'Manhattan', 'Bronx', 'Brooklyn', 'Queens', 'Staten Island',
  'Aberdeen', 'Abilene', 'Akron', 'Albany', 'Albuquerque', 'Alexandria', 'Allentown', 'Amarillo',
  'Anaheim', 'Anchorage', 'Ann Arbor', 'Arlington', 'Atlanta', 'Augusta', 'Aurora',
  'Bakersfield', 'Baltimore', 'Baton Rouge', 'Beaumont', 'Bellevue', 'Berkeley', 'Birmingham', 'Boise',
  'Boston', 'Bridgeport', 'Buffalo', 'Cambridge', 'Cape Coral', 'Carrollton', 'Cary', 'Cedar Rapids',
  'Chandler', 'Charleston', 'Charlotte', 'Chattanooga', 'Chesapeake', 'Cincinnati', 'Clarksville',
  'Cleveland', 'Colorado Springs', 'Columbia', 'Columbus', 'Concord', 'Coral Springs', 'Corona', 'Corpus Christi',
  'Dallas', 'Dayton', 'Denver', 'Des Moines', 'Detroit', 'Durham', 'El Paso', 'Elizabeth', 'Elk Grove',
  'Erie', 'Eugene', 'Evansville', 'Fayetteville', 'Fontana', 'Fort Collins', 'Fort Lauderdale',
  'Fort Wayne', 'Fort Worth', 'Fremont', 'Fresno', 'Fullerton', 'Garden Grove', 'Garland', 'Gilbert',
  'Glendale', 'Grand Prairie', 'Grand Rapids', 'Green Bay', 'Greensboro', 'Gresham', 'Hampton',
  'Hartford', 'Hayward', 'Henderson', 'Hialeah', 'Hollywood', 'Honolulu', 'Houston', 'Huntington Beach',
  'Huntsville', 'Independence', 'Indianapolis', 'Inglewood', 'Irvine', 'Irving', 'Jackson', 'Jacksonville',
  'Jersey City', 'Joliet', 'Kansas City', 'Knoxville', 'Lafayette', 'Lakewood', 'Lancaster', 'Lansing',
  'Laredo', 'Lexington', 'Lincoln', 'Little Rock', 'Long Beach', 'Louisville', 'Lowell', 'Lubbock',
  'Madison', 'Manchester', 'McAllen', 'McKinney', 'Memphis', 'Mesa', 'Mesquite', 'Milwaukee', 'Minneapolis',
  'Mobile', 'Modesto', 'Montgomery', 'Moreno Valley', 'Murfreesboro', 'Naperville', 'New Haven', 'Newark',
  'Newport News', 'Norfolk', 'Norman', 'North Las Vegas', 'Oakland', 'Oceanside', 'Oklahoma City', 'Omaha',
  'Ontario', 'Orange', 'Orlando', 'Overland Park', 'Oxnard', 'Palmdale', 'Pasadena', 'Paterson',
  'Pembroke Pines', 'Peoria', 'Philadelphia', 'Phoenix', 'Pittsburgh', 'Plano', 'Pomona', 'Portland',
  'Providence', 'Provo', 'Raleigh', 'Rancho Cucamonga', 'Reno', 'Richmond', 'Riverside', 'Rochester',
  'Rockford', 'Roseville', 'Sacramento', 'Salem', 'Salinas', 'Salt Lake City', 'San Antonio', 'San Bernardino',
  'San Diego', 'San Francisco', 'San Jose', 'Santa Ana', 'Santa Clara', 'Santa Clarita', 'Savannah',
  'Scottsdale', 'Seattle', 'Shreveport', 'Simi Valley', 'Sioux Falls', 'South Bend', 'Spokane', 'Springfield',
  'St. Louis', 'St. Paul', 'St. Petersburg', 'Stamford', 'Sterling Heights', 'Stockton', 'Sunnyvale', 'Syracuse',
  'Tacoma', 'Tallahassee', 'Tampa', 'Tempe', 'Thornton', 'Thousand Oaks', 'Toledo', 'Topeka', 'Torrance',
  'Tucson', 'Tulsa', 'Vancouver', 'Virginia Beach', 'Visalia', 'Waco', 'Warren', 'Washington DC', 'Waterbury',
  'West Covina', 'West Valley City', 'Westchester County', 'Westminster', 'Wichita', 'Winston-Salem', 'Worcester',
  'Yonkers', 'Youngstown'
];

// Merge LA metro cities (add any not in base) - KEEP ORDER: popular first, then LA cities, then rest (no sort)
const usCitiesSet = new Set(US_CITIES_BASE.map(c => c.toLowerCase()));
const laOnly = LA_METRO_CITIES.filter(c => !usCitiesSet.has(c.toLowerCase()));
const merged = [...US_CITIES_BASE, ...laOnly];
const seen = new Set();
const US_CITIES = merged.filter((c) => {
  const k = c.toLowerCase();
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

// Re-export from shared - single source of truth (~195 countries)
export const COUNTRIES = SHARED_COUNTRIES;

// Popular countries first for picker (matches original UX - no scrolling 196 countries)
const POPULAR_COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Mexico', 'France', 'Germany', 'Italy', 'Spain',
  'Japan', 'Australia', 'Netherlands', 'Ireland', 'Portugal', 'Brazil', 'Argentina', 'Chile',
  'Costa Rica', 'New Zealand', 'South Africa', 'Thailand', 'Singapore', 'South Korea', 'China',
  'India', 'United Arab Emirates', 'Israel', 'Turkey', 'Egypt', 'Morocco', 'Russia'
];
export const COUNTRIES_PICKER_ORDER = [
  ...POPULAR_COUNTRIES,
  ...SHARED_COUNTRIES.filter(c => !POPULAR_COUNTRIES.includes(c))
];

const US_STATES_ALPHA = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
  'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina',
  'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
  'District of Columbia'
];
// Popular states first for picker
const POPULAR_US_STATES = ['California', 'New York', 'Texas', 'Florida', 'Nevada', 'Illinois', 'Washington', 'Colorado', 'Massachusetts', 'Louisiana', 'Tennessee', 'Georgia', 'Arizona', 'North Carolina', 'Michigan', 'Pennsylvania', 'Ohio', 'Oregon'];
export const US_STATES = [...POPULAR_US_STATES, ...US_STATES_ALPHA.filter(s => !POPULAR_US_STATES.includes(s))];

export const CA_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
  'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
  'Quebec', 'Saskatchewan', 'Yukon'
];

// City -> State/Region for US (subset - matches locationHelpers)
const US_CITY_REGIONS = {
  'Manhattan': 'New York', 'Brooklyn': 'New York', 'Queens': 'New York', 'Bronx': 'New York',
  'Staten Island': 'New York', 'New York City': 'New York', 'Westchester County': 'New York',
  'Buffalo': 'New York', 'Albany': 'New York', 'Rochester': 'New York', 'Syracuse': 'New York',
  'Los Angeles': 'California', 'San Francisco': 'California', 'San Diego': 'California', 'Sacramento': 'California',
  'Oakland': 'California', 'San Jose': 'California', 'Fresno': 'California', 'Long Beach': 'California',
  'Beverly Hills': 'California', 'Burbank': 'California', 'Culver City': 'California', 'El Segundo': 'California',
  'Malibu': 'California', 'Manhattan Beach': 'California', 'Playa del Rey': 'California', 'Redondo Beach': 'California',
  'Santa Monica': 'California', 'Venice': 'California', 'Venice Beach': 'California', 'West Hollywood': 'California', 'Westwood': 'California',
  'Marina del Rey': 'California', 'Hermosa Beach': 'California', 'West LA': 'California', 'Downtown LA': 'California',
  'Silver Lake': 'California', 'Echo Park': 'California', 'Los Feliz': 'California', 'Koreatown': 'California',
  'Houston': 'Texas', 'Dallas': 'Texas', 'Austin': 'Texas', 'San Antonio': 'Texas', 'Fort Worth': 'Texas', 'El Paso': 'Texas',
  'Miami': 'Florida', 'Orlando': 'Florida', 'Tampa': 'Florida', 'Jacksonville': 'Florida', 'St. Petersburg': 'Florida',
  'Chicago': 'Illinois', 'Las Vegas': 'Nevada', 'Seattle': 'Washington', 'Portland': 'Oregon', 'Boston': 'Massachusetts',
  'Washington DC': 'District of Columbia', 'Nashville': 'Tennessee', 'New Orleans': 'Louisiana', 'Phoenix': 'Arizona',
  'Philadelphia': 'Pennsylvania', 'Pittsburgh': 'Pennsylvania', 'Denver': 'Colorado', 'Atlanta': 'Georgia',
  'Detroit': 'Michigan', 'Charlotte': 'North Carolina', 'Indianapolis': 'Indiana', 'Columbus': 'Ohio',
  'Milwaukee': 'Wisconsin', 'Kansas City': 'Missouri', 'St. Louis': 'Missouri', 'Minneapolis': 'Minnesota',
  'Baltimore': 'Maryland', 'Richmond': 'Virginia', 'Salt Lake City': 'Utah', 'Pasadena': 'California',
  'Glendale': 'California', 'Inglewood': 'California', 'Torrance': 'California', 'Pomona': 'California',
  'Santa Monica': 'California', 'Burbank': 'California', 'Compton': 'California', 'Downey': 'California',
  'Norwalk': 'California', 'Whittier': 'California', 'Alhambra': 'California', 'Monterey Park': 'California',
  'Montebello': 'California', 'Long Beach': 'California', 'San Pedro': 'California', 'Wilmington': 'California',
  'Hollywood': 'California', 'North Hollywood': 'California', 'Van Nuys': 'California', 'Woodland Hills': 'California',
  'Encino': 'California', 'Sherman Oaks': 'California', 'Studio City': 'California', 'Boyle Heights': 'California',
  'East LA': 'California', 'East Los Angeles': 'California', 'Silver Lake': 'California', 'Echo Park': 'California',
  'Los Feliz': 'California', 'Koreatown': 'California', 'Mid-City': 'California', 'Downtown LA': 'California'
};

export const CITIES_BY_COUNTRY = {
  'United States': US_CITIES,
  'United Kingdom': ['London', 'Edinburgh', 'Manchester', 'Liverpool', 'Birmingham', 'Glasgow', 'Cardiff', 'Belfast', 'Bath', 'Oxford', 'Cambridge', 'York', 'Brighton', 'Bristol', 'Newcastle'],
  'France': ['Paris', 'Nice', 'Lyon', 'Marseille', 'Cannes', 'Bordeaux', 'Toulouse', 'Strasbourg', 'Montpellier', 'Nantes', 'Lille', 'Rennes', 'Reims', 'Tours', 'Angers'],
  'Germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Dresden', 'Stuttgart', 'Düsseldorf', 'Heidelberg', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Hannover', 'Nuremberg', 'Duisburg'],
  'Italy': ['Rome', 'Milan', 'Venice', 'Florence', 'Naples', 'Bologna', 'Turin', 'Palermo', 'Genoa', 'Catania', 'Bari', 'Messina', 'Verona', 'Padua', 'Trieste'],
  'Spain': ['Madrid', 'Barcelona', 'Seville', 'Valencia', 'Bilbao', 'Granada', 'Málaga', 'Palma', 'Las Palmas', 'Zaragoza', 'Murcia', 'Alicante', 'Córdoba', 'Valladolid', 'Vigo'],
  'Japan': ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Hiroshima', 'Sapporo', 'Fukuoka', 'Kobe', 'Kawasaki', 'Saitama', 'Sendai', 'Chiba', 'Kitakyushu', 'Sakai', 'Niigata'],
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Darwin', 'Hobart', 'Gold Coast', 'Newcastle', 'Wollongong', 'Geelong', 'Townsville', 'Cairns', 'Toowoomba'],
  'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Quebec City', 'Winnipeg', 'Hamilton', 'Kitchener', 'London', 'Victoria', 'Halifax', 'Windsor', 'Oshawa'],
  'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen'],
  'Switzerland': ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne', 'Winterthur', 'Lucerne', 'St. Gallen', 'Lugano', 'Biel'],
  'Austria': ['Vienna', 'Salzburg', 'Innsbruck', 'Graz', 'Linz', 'Klagenfurt', 'Villach', 'Wels', 'Sankt Pölten', 'Dornbirn'],
  'Belgium': ['Brussels', 'Antwerp', 'Ghent', 'Bruges', 'Leuven', 'Namur', 'Mons', 'Aalst', 'La Louvière', 'Kortrijk'],
  'Portugal': ['Lisbon', 'Porto', 'Braga', 'Coimbra', 'Funchal', 'Setúbal', 'Almada', 'Agualva-Cacém', 'Queluz', 'Rio Tinto'],
  'Greece': ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa', 'Volos', 'Rhodes', 'Ioannina', 'Chania', 'Chalcis'],
  'Czech Republic': ['Prague', 'Brno', 'Ostrava', 'Plzen', 'Liberec', 'Olomouc', 'Budweis', 'Hradec Králové', 'Ústí nad Labem', 'Pardubice'],
  'Ireland': ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda', 'Dundalk', 'Bray', 'Navan', 'Ennis'],
  'Sweden': ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping'],
  'Norway': ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Bærum', 'Kristiansand', 'Fredrikstad', 'Tromsø', 'Sandnes', 'Asker'],
  'Denmark': ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers', 'Kolding', 'Horsens', 'Vejle', 'Roskilde'],
  'Finland': ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku', 'Jyväskylä', 'Lahti', 'Kuopio', 'Pori'],
  'Poland': ['Warsaw', 'Krakow', 'Gdansk', 'Wroclaw', 'Poznan', 'Lodz', 'Katowice', 'Lublin', 'Bydgoszcz', 'Szczecin', 'Torun', 'Rzeszow', 'Olsztyn', 'Bialystok', 'Gliwice'],
  'Hungary': ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pecs', 'Gyor', 'Nyiregyhaza', 'Kecskemet', 'Szekesfehervar', 'Szombathely'],
  'Croatia': ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Pula', 'Slavonski Brod', 'Karlovac', 'Varazdin', 'Sibenik'],
  'Slovenia': ['Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Velenje', 'Koper', 'Novo Mesto', 'Ptuj', 'Trbovlje', 'Kamnik'],
  'Thailand': ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Krabi', 'Hua Hin', 'Koh Samui', 'Ayutthaya', 'Chiang Rai', 'Sukhothai'],
  'Singapore': ['Singapore'],
  'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon', 'Ulsan', 'Changwon', 'Goyang'],
  'China': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', "Xi'an", 'Suzhou', 'Wuhan', 'Chongqing'],
  'India': ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'],
  'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre'],
  'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Torreón', 'Querétaro', 'San Luis Potosí'],
  'Argentina': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'San Miguel de Tucumán', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan'],
  'Chile': ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Rancagua', 'Talca', 'Arica', 'Chillán'],
  'Costa Rica': ['San José', 'San Pedro', 'Cartago', 'Puntarenas', 'Limón', 'Alajuela', 'Heredia', 'Desamparados', 'Paraíso', 'San Isidro'],
  'New Zealand': ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Napier-Hastings', 'Dunedin', 'Palmerston North', 'Nelson', 'Rotorua'],
  'South Africa': ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Pietermaritzburg', 'Vereeniging', 'Welkom'],
  'Morocco': ['Casablanca', 'Rabat', 'Fez', 'Marrakech', 'Agadir', 'Tangier', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan'],
  'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Mansoura', 'El Mahalla El Kubra', 'Tanta'],
  'Turkey': ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Adana', 'Gaziantep', 'Konya', 'Antalya', 'Kayseri', 'Mersin'],
  'Israel': ['Jerusalem', 'Tel Aviv', 'Haifa', 'Rishon LeZion', 'Petah Tikva', 'Ashdod', 'Netanya', 'Beer Sheva', 'Holon', 'Bnei Brak'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Khor Fakkan', 'Dibba Al-Fujairah'],
  'Russia': ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Nizhny Novgorod', 'Kazan', 'Chelyabinsk', 'Omsk', 'Samara', 'Rostov-on-Don']
};

export function getRegionForCity(city, country) {
  if (country === 'United States' && US_CITY_REGIONS[city]) return US_CITY_REGIONS[city];
  return null;
}
