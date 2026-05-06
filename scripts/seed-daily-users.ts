// scripts/seed-daily-users.ts
//
// Generates fake beta users on a 4-hour cadence. Scheduled via node-cron in
// server/index.ts at "0 */4 * * *" UTC (00/04/08/12/16/20 = 6 fires/day).
// Default count per fire is 2 → 12 users/day total. Mirrors the real signup
// flow so seeded users land in the same state as real signups EXCEPT for
// aura, which is set to 99 — the primary identification marker.
//
// Demographic design (rewritten 2026-05):
//   Seeded users are now drawn from 8 weighted ethnic/regional buckets, each
//   with a coherent name + photo + hometown pool. Within a bucket, first name,
//   last name, photo, and hometown are drawn from that bucket's pool only —
//   no more cross-bucket mixes like "Carlos Smith with an Asian-presenting
//   photo". Hometowns reflect the platform's international-traveler audience
//   (Berlin, São Paulo, Tokyo, etc.); current location is heavily LA-weighted
//   to match the launch market.
//
//   Bucket weights:
//     white-american    35%
//     white-european    25%
//     latin-american    15%
//     asian             12%
//     white-au-nz        5%
//     middle-eastern     4%
//     black-american     2%
//     other-mixed        2%
//
// Per-user execution order (matches spec §8 + production-parity background tasks):
//   1. storage.createUser(userData) — INSERTs users + assignUserToChatrooms
//      (Global + Hometown [+ Destination if traveler])
//   2. storage.ensureCityExists(hometown*)                 // mirrors routes.ts:6343-6354
//   3. storage.ensureCityExists(destination*) (if traveler)// mirrors routes.ts:6358-6364
//   4. storage.ensureMeetLocalsChatrooms(hometown*)
//   5. storage.ensureMeetLocalsChatrooms(destination*) (if traveler)
//   6. storage.autoJoinUserCityChatrooms(...)
//   7. storage.createTravelPlan(...) (if traveler)
//   8. storage.updateUser(user.id, { aura: 99 })  ← OVERRIDES real-signup 1/2
//   9. fireProductionBackgroundTasks(user) — welcome email, auto-connect to
//      nearbytrav.
//
// Identifiers (NO marker in profile data):
//   - aura:     99 (real users never reach this organically — SOLE seed marker)
//   - username: realistic firstname-based handle (e.g. "mike_22", "carlos_k").
//   - email:    seed+<username>@nearbytraveler.org
// Cleanup query:
//   DELETE FROM users WHERE id <> 2 AND aura = 99;
//
// CLI:
//   npx tsx scripts/seed-daily-users.ts --dry-run [--count=N]
//     Prints N sample picks (default 20) without touching DB or Cloudinary.
//     Use this to review the demographic mix before deploying changes.

// ────────────────────────────────────────────────────────────────────────────
// Pure imports only (no DB, no Cloudinary). Live-mode modules are lazy-
// imported inside generateOneUser / fireProductionBackgroundTasks so the
// --dry-run CLI doesn't need DATABASE_URL or Cloudinary credentials.
// ────────────────────────────────────────────────────────────────────────────
import { getMetroCities } from "@shared/metro-areas";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
type Region =
  | "us"
  | "europe"
  | "latam"
  | "asia"
  | "oceania"
  | "middle-east"
  | "africa"
  | "other";

interface CityEntry {
  city: string;
  state?: string | null;
  country: string;
  region: Region;
  nativeLanguage?: string;
}

interface WeightedCity extends CityEntry {
  weight: number;
  /** When set, expands to a random suburb of this metro at pick time. */
  metroExpand?: string;
}

interface EthnicBucket {
  key: string;
  weight: number;
  maleFirstNames: string[];
  femaleFirstNames: string[];
  lastNames: string[];
  /** randomuser.me men/{N}.jpg indices — see PHOTO_COHERENCE_NOTE below. */
  photoIndicesMen: number[];
  /** randomuser.me women/{N}.jpg indices — see PHOTO_COHERENCE_NOTE below. */
  photoIndicesWomen: number[];
  hometownPool: WeightedCity[];
}

export interface SeededUser {
  firstName: string;
  lastName: string;
  gender: "male" | "female";
  photoUrl: string;
  hometown: CityEntry;
  currentLocation: CityEntry;
  isTraveler: boolean;
  aura: 99;
  bucketKey: string;
  /** Which of the 3 selection paths produced this user — for diagnostics. */
  path: "la-local" | "us-local" | "traveler";
}

// Path 1 (LA-rooted local) bucket distribution — biased to reflect actual LA
// demographics rather than the global-traveler distribution of BUCKETS.
// Sums to 100. white-au-nz omitted intentionally (rare in LA's local population).
const LA_LOCAL_BUCKET_WEIGHTS: Record<string, number> = {
  "white-american":   40,
  "latin-american":   30,
  "asian":            15,
  "black-american":    8,
  "middle-eastern":    3,
  "white-european":    2,
  "other-mixed":       2,
};

// ────────────────────────────────────────────────────────────────────────────
// PHOTO_COHERENCE_NOTE
// ────────────────────────────────────────────────────────────────────────────
// randomuser.me does NOT publish ethnicity tags for the men/0..99.jpg and
// women/0..99.jpg portrait sets, so the index ranges below are best-effort
// partitions only — actual visual ethnicity per index has not been verified.
// Every bucket gets a different non-overlapping slice, which guarantees photo
// *variety* across buckets but does NOT guarantee that a given Latin-American-
// bucket pick will produce a Latin-presenting portrait. Mismatches will occur.
//
// TODO(photo-coherence): replace these arbitrary index ranges with a curated,
// visually-verified mapping. Suggested approach: download all 200 portraits
// once, auto-classify with a face-attribute model, hand-correct edge cases,
// and persist the mapping as a JSON asset under content/seed-photo-tags.json.
// Until then, expect ~30-50% of seeded portraits to visually conflict with
// the picked bucket — we accept this trade-off per the rebuild spec.
// ────────────────────────────────────────────────────────────────────────────

function range(start: number, endInclusive: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= endInclusive; i++) out.push(i);
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// Current location pool — for the 15% "other US" slot in pickCurrentLocation.
// LA Metro and OC Metro are expanded via getMetroCities() at pick time, so
// this list only needs the rest-of-US fallback cities.
// ────────────────────────────────────────────────────────────────────────────
const US_OTHER_CITIES: CityEntry[] = [
  { city: "New York City", state: "New York",   country: "United States", region: "us" },
  { city: "Brooklyn",      state: "New York",   country: "United States", region: "us" },
  { city: "San Francisco", state: "California", country: "United States", region: "us" },
  { city: "Austin",        state: "Texas",      country: "United States", region: "us" },
  { city: "Miami",         state: "Florida",    country: "United States", region: "us" },
  { city: "Las Vegas",     state: "Nevada",     country: "United States", region: "us" },
  { city: "Nashville",     state: "Tennessee",  country: "United States", region: "us" },
  { city: "New Orleans",   state: "Louisiana",  country: "United States", region: "us" },
  { city: "Chicago",       state: "Illinois",   country: "United States", region: "us" },
  { city: "Seattle",       state: "Washington", country: "United States", region: "us" },
];

// ────────────────────────────────────────────────────────────────────────────
// Buckets
// ────────────────────────────────────────────────────────────────────────────

const WHITE_AMERICAN: EthnicBucket = {
  key: "white-american",
  weight: 35,
  maleFirstNames: [
    "Michael", "David", "James", "John", "Robert", "Christopher", "Matthew",
    "Joshua", "Andrew", "Daniel", "Ryan", "Tyler", "Brandon", "Justin", "Kevin",
    "Brian", "Jason", "Jacob", "Ethan", "Noah", "Lucas", "Mason", "Logan",
    "Aiden", "Chris", "Mark", "Peter", "Paul", "Steven", "Eric", "Greg", "Alex",
    "Jake", "Sean", "Connor", "Aaron", "Adam", "Patrick",
  ],
  femaleFirstNames: [
    "Jennifer", "Sarah", "Jessica", "Ashley", "Amanda", "Emily", "Lauren",
    "Megan", "Stephanie", "Nicole", "Rachel", "Rebecca", "Lisa", "Michelle",
    "Angela", "Melissa", "Olivia", "Emma", "Ava", "Charlotte", "Mia", "Harper",
    "Evelyn", "Kate", "Anna", "Claire", "Grace", "Hannah", "Lily", "Sophie",
    "Chloe",
  ],
  lastNames: [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis",
    "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Thompson", "White", "Harris", "Clark", "Lewis", "Robinson", "Walker",
    "Young", "Allen", "King", "Wright", "Scott", "Hill", "Green", "Adams",
    "Nelson", "Baker", "Hall", "Campbell", "Mitchell", "Carter", "Roberts",
  ],
  photoIndicesMen: range(0, 19),
  photoIndicesWomen: range(0, 19),
  hometownPool: [
    { city: "Los Angeles",   state: "California",  country: "United States", region: "us", weight: 15, metroExpand: "Los Angeles Metro" },
    { city: "New York",      state: "New York",    country: "United States", region: "us", weight: 15 },
    { city: "Chicago",       state: "Illinois",    country: "United States", region: "us", weight: 10 },
    { city: "Austin",        state: "Texas",       country: "United States", region: "us", weight: 8 },
    { city: "Boston",        state: "Massachusetts", country: "United States", region: "us", weight: 8 },
    { city: "Seattle",       state: "Washington",  country: "United States", region: "us", weight: 8 },
    { city: "Miami",         state: "Florida",     country: "United States", region: "us", weight: 8 },
    { city: "Denver",        state: "Colorado",    country: "United States", region: "us", weight: 6 },
    { city: "Portland",      state: "Oregon",      country: "United States", region: "us", weight: 6 },
    { city: "San Francisco", state: "California",  country: "United States", region: "us", weight: 6 },
    { city: "Washington",    state: "DC",          country: "United States", region: "us", weight: 5 },
    { city: "Atlanta",       state: "Georgia",     country: "United States", region: "us", weight: 3 },
    { city: "Nashville",     state: "Tennessee",   country: "United States", region: "us", weight: 2 },
  ],
};

const WHITE_EUROPEAN: EthnicBucket = {
  key: "white-european",
  weight: 25,
  // One unified European pool — within-bucket coherence is at the bucket level
  // ("European"), not the country level. A Berlin-hometown user may carry an
  // Italian-coded name; that's an accepted simplification per the rebuild spec.
  maleFirstNames: [
    "Lukas", "Hans", "Klaus", "Stefan", "Jan", "Tobias",     // German
    "Marco", "Lorenzo", "Alessandro", "Matteo", "Giovanni",   // Italian
    "Pierre", "Antoine", "Étienne", "Hugo",                   // French
    "Pablo", "Diego", "Javier", "Mateo",                      // Spanish
    "Lars", "Sven", "Erik",                                   // Nordic
    "Cillian", "Eoin",                                        // Irish
    "Pieter", "Dries",                                        // Dutch
    "Tomáš", "Jakub",                                         // Czech
  ],
  femaleFirstNames: [
    "Anna", "Hanna", "Lena", "Greta",                          // German
    "Giulia", "Chiara", "Sofia", "Francesca",                  // Italian
    "Camille", "Léa", "Manon", "Inès",                         // French
    "Lucia", "Carmen", "Paula", "Elena",                       // Spanish
    "Astrid", "Ingrid", "Freya",                               // Nordic
    "Saoirse", "Aoife",                                        // Irish
    "Sanne", "Femke",                                          // Dutch
    "Tereza", "Eliška",                                        // Czech
  ],
  lastNames: [
    "Müller", "Schmidt", "Schneider", "Fischer",     // German
    "Rossi", "Bianchi", "Romano", "Ricci",           // Italian
    "Dubois", "Bernard", "Moreau",                   // French
    "García", "Hernández", "Fernández", "Ruiz",      // Spanish
    "Nilsson", "Andersson", "Larsen",                // Nordic
    "Murphy", "O'Brien", "Walsh",                    // Irish
    "de Vries", "Bakker", "Visser",                  // Dutch
    "Novák", "Svoboda",                              // Czech
    "Silva", "Ferreira",                             // Portuguese
  ],
  photoIndicesMen: range(20, 39),
  photoIndicesWomen: range(20, 39),
  hometownPool: [
    // Germany 25%
    { city: "Berlin",  state: null, country: "Germany", region: "europe", nativeLanguage: "German",  weight: 8.5 },
    { city: "Munich",  state: null, country: "Germany", region: "europe", nativeLanguage: "German",  weight: 8.5 },
    { city: "Hamburg", state: null, country: "Germany", region: "europe", nativeLanguage: "German",  weight: 8 },
    // Spain 20%
    { city: "Madrid",    state: null, country: "Spain", region: "europe", nativeLanguage: "Spanish", weight: 7 },
    { city: "Barcelona", state: null, country: "Spain", region: "europe", nativeLanguage: "Spanish", weight: 7 },
    { city: "Valencia",  state: null, country: "Spain", region: "europe", nativeLanguage: "Spanish", weight: 6 },
    // Italy 20%
    { city: "Rome",     state: null, country: "Italy", region: "europe", nativeLanguage: "Italian", weight: 7 },
    { city: "Milan",    state: null, country: "Italy", region: "europe", nativeLanguage: "Italian", weight: 7 },
    { city: "Florence", state: null, country: "Italy", region: "europe", nativeLanguage: "Italian", weight: 6 },
    // France 15%
    { city: "Paris",     state: null, country: "France", region: "europe", nativeLanguage: "French", weight: 7 },
    { city: "Lyon",      state: null, country: "France", region: "europe", nativeLanguage: "French", weight: 4 },
    { city: "Marseille", state: null, country: "France", region: "europe", nativeLanguage: "French", weight: 4 },
    // UK 10%
    { city: "London",     state: null, country: "United Kingdom", region: "europe", weight: 7 },
    { city: "Manchester", state: null, country: "United Kingdom", region: "europe", weight: 3 },
    // Netherlands 5%
    { city: "Amsterdam", state: null, country: "Netherlands", region: "europe", nativeLanguage: "Dutch", weight: 5 },
    // Other 5% (Sweden, Ireland, Portugal, Czechia)
    { city: "Stockholm", state: null, country: "Sweden",         region: "europe", nativeLanguage: "Swedish",    weight: 1.25 },
    { city: "Dublin",    state: null, country: "Ireland",        region: "europe", weight: 1.25 },
    { city: "Lisbon",    state: null, country: "Portugal",       region: "europe", nativeLanguage: "Portuguese", weight: 1.25 },
    { city: "Prague",    state: null, country: "Czech Republic", region: "europe", nativeLanguage: "Czech",      weight: 1.25 },
  ],
};

const LATIN_AMERICAN: EthnicBucket = {
  key: "latin-american",
  weight: 15,
  maleFirstNames: [
    "Carlos", "Luis", "Miguel", "Antonio", "Diego", "Mateo", "José", "Juan",
    "Santiago", "Sebastián", "Andrés", "Felipe", "Rodrigo", "Camilo", "Bruno",
    "Gabriel", "Rafael", "Lucas", "Tomás", "Nicolás",
  ],
  femaleFirstNames: [
    "María", "Sofía", "Camila", "Isabella", "Valentina", "Lucía", "Mariana",
    "Catalina", "Daniela", "Paola", "Renata", "Beatriz", "Fernanda", "Larissa",
    "Juliana", "Gabriela", "Ana",
  ],
  lastNames: [
    "García", "Rodríguez", "Martínez", "Hernández", "López", "González",
    "Pérez", "Sánchez", "Ramírez", "Torres", "Flores", "Rivera", "Silva",
    "Souza", "Costa", "Oliveira", "Santos", "Pereira", "Lima", "Fernández",
    "Díaz", "Ramos",
  ],
  photoIndicesMen: range(40, 54),
  photoIndicesWomen: range(40, 54),
  hometownPool: [
    // Brazil 30%
    { city: "São Paulo",      state: null, country: "Brazil",    region: "latam", nativeLanguage: "Portuguese", weight: 15 },
    { city: "Rio de Janeiro", state: null, country: "Brazil",    region: "latam", nativeLanguage: "Portuguese", weight: 15 },
    // Mexico 25%
    { city: "Mexico City",  state: null, country: "Mexico",      region: "latam", nativeLanguage: "Spanish", weight: 15 },
    { city: "Guadalajara",  state: null, country: "Mexico",      region: "latam", nativeLanguage: "Spanish", weight: 10 },
    // Argentina 20%
    { city: "Buenos Aires", state: null, country: "Argentina",   region: "latam", nativeLanguage: "Spanish", weight: 20 },
    // Colombia 15%
    { city: "Bogotá",       state: null, country: "Colombia",    region: "latam", nativeLanguage: "Spanish", weight: 8 },
    { city: "Medellín",     state: null, country: "Colombia",    region: "latam", nativeLanguage: "Spanish", weight: 7 },
    // Others 10%
    { city: "Santiago",     state: null, country: "Chile",       region: "latam", nativeLanguage: "Spanish", weight: 4 },
    { city: "Lima",         state: null, country: "Peru",        region: "latam", nativeLanguage: "Spanish", weight: 4 },
    { city: "Montevideo",   state: null, country: "Uruguay",     region: "latam", nativeLanguage: "Spanish", weight: 2 },
  ],
};

const ASIAN: EthnicBucket = {
  key: "asian",
  weight: 12,
  maleFirstNames: [
    "Hiro", "Kenji", "Takeshi", "Yuki", "Haruto", "Sora",     // Japanese
    "Min-jun", "Ji-ho", "Joon", "Sung-min", "Tae-yang",        // Korean
    "Raj", "Arjun", "Vikram", "Rohan", "Ravi", "Aarav",        // Indian
    "Wei", "Jian", "Liang", "Cheng", "Hao",                    // Chinese / Taiwanese
    "Somchai", "Niran",                                        // Thai
    "José Luis",                                               // Filipino (often hispanic given names)
    "Linh", "Minh",                                            // Vietnamese
  ],
  femaleFirstNames: [
    "Mei", "Sakura", "Hina", "Aoi", "Yui",                     // Japanese
    "Min-jung", "Ji-eun", "Soo-yeon", "Hye-jin",               // Korean
    "Priya", "Anjali", "Kavya", "Neha", "Ananya", "Riya",      // Indian
    "Lin", "Xiu", "Mei-ling", "Chen-yu", "Ying",               // Chinese / Taiwanese
    "Pim", "Nuch",                                             // Thai
    "Mariel",                                                  // Filipino
    "Linh", "Trang",                                           // Vietnamese
  ],
  lastNames: [
    "Tanaka", "Satō", "Suzuki", "Watanabe", "Itō", "Yamamoto",      // Japanese
    "Kim", "Park", "Lee", "Choi", "Jung", "Kang",                    // Korean
    "Patel", "Sharma", "Singh", "Gupta", "Kumar", "Reddy",           // Indian
    "Wang", "Chen", "Lin", "Wu", "Liu", "Zhang",                     // Chinese / Taiwanese
    "Nguyễn", "Trần", "Lê",                                          // Vietnamese
  ],
  photoIndicesMen: range(55, 69),
  photoIndicesWomen: range(55, 69),
  hometownPool: [
    // Japan 30%
    { city: "Tokyo", state: null, country: "Japan",       region: "asia", nativeLanguage: "Japanese", weight: 13 },
    { city: "Osaka", state: null, country: "Japan",       region: "asia", nativeLanguage: "Japanese", weight: 9 },
    { city: "Kyoto", state: null, country: "Japan",       region: "asia", nativeLanguage: "Japanese", weight: 8 },
    // South Korea 20%
    { city: "Seoul", state: null, country: "South Korea", region: "asia", nativeLanguage: "Korean",   weight: 14 },
    { city: "Busan", state: null, country: "South Korea", region: "asia", nativeLanguage: "Korean",   weight: 6 },
    // India 25%
    { city: "Mumbai",    state: null, country: "India", region: "asia", nativeLanguage: "Hindi", weight: 9 },
    { city: "Delhi",     state: null, country: "India", region: "asia", nativeLanguage: "Hindi", weight: 9 },
    { city: "Bangalore", state: null, country: "India", region: "asia", nativeLanguage: "Hindi", weight: 7 },
    // Taiwan 10%
    { city: "Taipei", state: null, country: "Taiwan",      region: "asia", nativeLanguage: "Mandarin", weight: 10 },
    // Thailand 5%
    { city: "Bangkok", state: null, country: "Thailand",   region: "asia", nativeLanguage: "Thai", weight: 5 },
    // Philippines 5%
    { city: "Manila",  state: null, country: "Philippines", region: "asia", nativeLanguage: "Filipino", weight: 5 },
    // Vietnam 5%
    { city: "Ho Chi Minh City", state: null, country: "Vietnam", region: "asia", nativeLanguage: "Vietnamese", weight: 3 },
    { city: "Hanoi",            state: null, country: "Vietnam", region: "asia", nativeLanguage: "Vietnamese", weight: 2 },
  ],
};

const WHITE_AU_NZ: EthnicBucket = {
  key: "white-au-nz",
  weight: 5,
  maleFirstNames: [
    "Jack", "Liam", "Lachlan", "Cooper", "Oliver", "Ethan", "William", "Mason",
    "Jett", "Hudson", "Mitchell", "Ryder",
  ],
  femaleFirstNames: [
    "Charlotte", "Olivia", "Mia", "Amelia", "Isla", "Harper", "Ruby", "Chloe",
    "Ella", "Zoe", "Indi", "Matilda",
  ],
  lastNames: [
    "Smith", "Williams", "Brown", "Wilson", "Taylor", "Anderson", "Thomas",
    "Jackson", "Martin", "Walker", "Mitchell", "Campbell", "McGrath", "Murphy",
    "Harris", "King", "Stewart",
  ],
  photoIndicesMen: range(70, 79),
  photoIndicesWomen: range(70, 79),
  hometownPool: [
    { city: "Sydney",     state: null, country: "Australia",   region: "oceania", weight: 30 },
    { city: "Melbourne",  state: null, country: "Australia",   region: "oceania", weight: 25 },
    { city: "Brisbane",   state: null, country: "Australia",   region: "oceania", weight: 15 },
    { city: "Auckland",   state: null, country: "New Zealand", region: "oceania", weight: 20 },
    { city: "Wellington", state: null, country: "New Zealand", region: "oceania", weight: 10 },
  ],
};

const MIDDLE_EASTERN: EthnicBucket = {
  key: "middle-eastern",
  weight: 4,
  maleFirstNames: [
    "Ali", "Omar", "Hassan", "Khalil", "Tariq", "Karim", "Rami", "Yusuf",
    "Amir", "Nadim", "Faisal", "Sami", "David", "Yossi", "Avi",
  ],
  femaleFirstNames: [
    "Layla", "Yara", "Noor", "Fatima", "Aisha", "Zara", "Maya", "Tala", "Lina",
    "Salma", "Rana", "Sara", "Tamar", "Adi", "Shira",
  ],
  lastNames: [
    "Khan", "Hassan", "Mansour", "Saadi", "Rahimi", "Hadid", "Najjar",
    "Cohen", "Levi", "Mizrahi", "Karimi", "Tabrizi", "Yılmaz", "Demir",
    "Habibi", "Saleh",
  ],
  photoIndicesMen: range(80, 89),
  photoIndicesWomen: range(80, 89),
  hometownPool: [
    { city: "Tel Aviv", state: null, country: "Israel",  region: "middle-east", nativeLanguage: "Hebrew",  weight: 25 },
    { city: "Istanbul", state: null, country: "Turkey",  region: "middle-east", nativeLanguage: "Turkish", weight: 25 },
    { city: "Beirut",   state: null, country: "Lebanon", region: "middle-east", nativeLanguage: "Arabic",  weight: 20 },
    { city: "Dubai",    state: null, country: "United Arab Emirates", region: "middle-east", nativeLanguage: "Arabic", weight: 20 },
    { city: "Tehran",   state: null, country: "Iran",    region: "middle-east", nativeLanguage: "Persian", weight: 10 },
  ],
};

const BLACK_AMERICAN: EthnicBucket = {
  key: "black-american",
  weight: 2,
  maleFirstNames: [
    "Andre", "Marcus", "Jamal", "Tyrone", "Malik", "Darnell", "Tre", "Kareem",
    "DeShawn", "Terrell", "Dante", "Jordan", "Kendrick", "Xavier", "Jaylen",
  ],
  femaleFirstNames: [
    "Aaliyah", "Imani", "Nia", "Zora", "Kenya", "Jasmine", "Tanisha", "Asha",
    "Layla", "Maya", "Erica", "Tiara", "Brianna", "Ayanna", "Simone",
  ],
  lastNames: [
    "Williams", "Johnson", "Brown", "Jackson", "Robinson", "Davis", "Thompson",
    "Harris", "Lewis", "Walker", "Young", "Allen", "King", "Scott", "Carter",
    "Simmons", "Mitchell", "Washington", "Jefferson",
  ],
  photoIndicesMen: range(90, 94),
  photoIndicesWomen: range(90, 94),
  hometownPool: [
    { city: "Atlanta",   state: "Georgia",        country: "United States", region: "us", weight: 18 },
    { city: "New York",  state: "New York",       country: "United States", region: "us", weight: 18 },
    { city: "Washington", state: "DC",            country: "United States", region: "us", weight: 13 },
    { city: "Houston",   state: "Texas",          country: "United States", region: "us", weight: 13 },
    { city: "Detroit",   state: "Michigan",       country: "United States", region: "us", weight: 13 },
    { city: "Chicago",   state: "Illinois",       country: "United States", region: "us", weight: 13 },
    { city: "Charlotte", state: "North Carolina", country: "United States", region: "us", weight: 12 },
  ],
};

const OTHER_MIXED: EthnicBucket = {
  key: "other-mixed",
  weight: 2,
  maleFirstNames: [
    "Jacob", "Daniel", "Ahmed", "Felix", "Marco", "Aiden", "Liam", "Diego",
    "Ravi",
  ],
  femaleFirstNames: [
    "Sara", "Maya", "Layla", "Anna", "Nina", "Zoe", "Elena", "Aisha",
  ],
  lastNames: [
    "Patel", "García", "Lee", "Khan", "Martínez", "Cohen", "Singh", "Nguyễn",
    "Williams", "Silva", "Tanaka",
  ],
  photoIndicesMen: range(95, 99),
  photoIndicesWomen: range(95, 99),
  hometownPool: [
    { city: "Toronto",   state: null, country: "Canada",       region: "other", weight: 25 },
    { city: "Cape Town", state: null, country: "South Africa", region: "africa", weight: 20 },
    { city: "Lagos",     state: null, country: "Nigeria",      region: "africa", weight: 15 },
    { city: "Singapore", state: null, country: "Singapore",    region: "asia",   weight: 20 },
    { city: "Denpasar",  state: null, country: "Indonesia",    region: "asia",   weight: 10 },
    { city: "Reykjavík", state: null, country: "Iceland",      region: "europe", weight: 10 },
  ],
};

const BUCKETS: EthnicBucket[] = [
  WHITE_AMERICAN,
  WHITE_EUROPEAN,
  LATIN_AMERICAN,
  ASIAN,
  WHITE_AU_NZ,
  MIDDLE_EASTERN,
  BLACK_AMERICAN,
  OTHER_MIXED,
];

// ────────────────────────────────────────────────────────────────────────────
// Profile content (interests + bio templates) — bucket-agnostic.
// ────────────────────────────────────────────────────────────────────────────
const INTERESTS = [
  "Restaurants & Food Scene",
  "Live Music",
  "Beach Activities",
  "Hiking",
  "Coffee Shops & Cafes",
  "Museums",
  "Yoga & Meditation",
  "Photography & Scenic Spots",
  "Water Sports",
  "Meeting New People",
  "Art Galleries",
  "Nightlife",
  "Cooking",
  "Reading",
  "Rooftop Bars",
  "Farmer's Markets",
  "Running",
  "Cycling",
];

interface BioCtx {
  city: string;
  adj: string;
  role: string;
  hook: string;
  passionLine: string;
  interest1: string;
  interest2: string;
}

const BIO_TEMPLATES: Array<(ctx: BioCtx) => string> = [
  (c) => `${c.adj} ${c.role} based in ${c.city}. ${c.hook}`,
  (c) => `Currently in ${c.city}. ${c.hook} ${c.passionLine}`,
  (c) => `${c.passionLine} ${c.hook}`,
  (c) => `${c.role} who likes ${c.interest1.toLowerCase()} and ${c.interest2.toLowerCase()}. ${c.hook}`,
];

const BIO_ADJ = ["Curious", "Easygoing", "Restless", "Friendly", "Quietly social", "Always-on", "Low-key"];
const BIO_ROLE = ["traveler", "designer", "engineer", "writer", "photographer", "chef", "teacher", "musician", "marketer", "barista"];
const BIO_HOOK = [
  "Down for coffee or a hike on short notice.",
  "Always looking for the spot only locals know.",
  "Ask me where to eat — I keep a list.",
  "If you know a good sunset bar, message me.",
  "Open to meeting people in the city.",
  "Trying to get out more on weekends.",
  "Slowly working through every neighborhood.",
];
const BIO_PASSION = [
  "I take photos of strangers' dogs.",
  "I keep a running list of taco places.",
  "Mostly here for the food and the music.",
  "Half my camera roll is sunsets.",
  "I'd rather walk than Uber.",
  "Trying to learn another language this year.",
];

// ────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ────────────────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, it) => s + it.weight, 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.weight;
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

function expandIfMetro(entry: WeightedCity): CityEntry {
  if (entry.metroExpand) {
    return {
      city: pick(getMetroCities(entry.metroExpand)),
      state: entry.state,
      country: entry.country,
      region: entry.region,
      nativeLanguage: entry.nativeLanguage,
    };
  }
  return {
    city: entry.city,
    state: entry.state,
    country: entry.country,
    region: entry.region,
    nativeLanguage: entry.nativeLanguage,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Pickers
// ────────────────────────────────────────────────────────────────────────────
function pickWeightedBucket(): EthnicBucket {
  return pickWeighted(BUCKETS);
}

function pickHometown(bucket: EthnicBucket): CityEntry {
  return expandIfMetro(pickWeighted(bucket.hometownPool));
}

/**
 * Current location for the seeded user — biased to the LA launch market.
 * 70% Los Angeles Metro · 15% Orange County Metro · 15% other major US cities.
 * LA/OC are expanded to a random suburb so cards display authentic neighborhood
 * names (Hollywood, Burbank, Santa Monica, etc.) the way real LA users do.
 */
function pickCurrentLocation(): CityEntry {
  const r = Math.random();
  if (r < 0.70) {
    return {
      city: pick(getMetroCities("Los Angeles Metro")),
      state: "California",
      country: "United States",
      region: "us",
    };
  }
  if (r < 0.85) {
    return {
      city: pick(getMetroCities("Orange County Metro")),
      state: "California",
      country: "United States",
      region: "us",
    };
  }
  return pick(US_OTHER_CITIES);
}

function pickPhotoUrl(bucket: EthnicBucket, gender: "male" | "female"): string {
  const indices = gender === "male" ? bucket.photoIndicesMen : bucket.photoIndicesWomen;
  const idx = pick(indices);
  return `https://randomuser.me/api/portraits/${gender === "male" ? "men" : "women"}/${idx}.jpg`;
}

/**
 * Path-1 helper: picks an ethnic bucket using the LA-demographics weights
 * (LA_LOCAL_BUCKET_WEIGHTS), not the global BUCKETS weights.
 */
function pickLALocalBucket(): EthnicBucket {
  const weighted = BUCKETS
    .filter((b) => (LA_LOCAL_BUCKET_WEIGHTS[b.key] ?? 0) > 0)
    .map((b) => ({ key: b.key, weight: LA_LOCAL_BUCKET_WEIGHTS[b.key]! }));
  const picked = pickWeighted(weighted);
  return BUCKETS.find((b) => b.key === picked.key)!;
}

/** Path-1 helper: random LA Metro suburb (Hollywood, Burbank, Santa Monica, etc.). */
function pickLAMetroSuburb(): CityEntry {
  return {
    city: pick(getMetroCities("Los Angeles Metro")),
    state: "California",
    country: "United States",
    region: "us",
  };
}

/**
 * Path-2 helper: picks a bucket that has at least one non-LA US hometown entry.
 * Uses the buckets' existing global weights as the relative distribution among
 * qualifying buckets. In practice only white-american and black-american have
 * US-rooted pools, so this resolves to those two in their original ratio.
 */
function pickOtherUSLocalBucket(): EthnicBucket | null {
  const qualifying = BUCKETS.filter((b) =>
    b.hometownPool.some(
      (e) => e.country === "United States" && e.metroExpand !== "Los Angeles Metro",
    ),
  );
  if (qualifying.length === 0) return null;
  return pickWeighted(qualifying);
}

/** Path-2 helper: pick a US hometown entry from a bucket, excluding LA Metro. */
function pickUSHometownExcludingLA(bucket: EthnicBucket): CityEntry | null {
  const candidates = bucket.hometownPool.filter(
    (e) => e.country === "United States" && e.metroExpand !== "Los Angeles Metro",
  );
  if (candidates.length === 0) return null;
  return expandIfMetro(pickWeighted(candidates));
}

/**
 * Single coherent picker — three selection paths to prevent seeded travelers
 * from getting "stranded" once their travelEndDate expires:
 *
 *   Path 1 (40%): LA-rooted local. hometown + currentLocation both = LA Metro
 *                 suburb, isTraveler=false. Bucket weighted by LA demographics.
 *   Path 2 (15%): Other-US local. hometown is a non-LA US city from the bucket's
 *                 pool, currentLocation = hometown, isTraveler=false.
 *   Path 3 (45%): Traveler. hometown drawn from bucket's full pool (may be
 *                 international), currentLocation drawn from the 70/15/15
 *                 LA/OC/other-US distribution, isTraveler=true.
 *
 * In all paths, firstName, lastName, and photo come from the same ethnic
 * bucket so they stay coherent.
 */
export function pickSeededUser(): SeededUser {
  const r = Math.random();
  let bucket: EthnicBucket;
  let hometown: CityEntry;
  let currentLocation: CityEntry;
  let isTraveler: boolean;
  let path: "la-local" | "us-local" | "traveler";

  if (r < 0.40) {
    // Path 1: LA-rooted local
    bucket = pickLALocalBucket();
    hometown = pickLAMetroSuburb();
    currentLocation = hometown;
    isTraveler = false;
    path = "la-local";
  } else if (r < 0.55) {
    // Path 2: other-US local
    const b = pickOtherUSLocalBucket();
    if (b) {
      bucket = b;
      const home = pickUSHometownExcludingLA(bucket);
      hometown = home ?? pickHometown(bucket);
      currentLocation = hometown;
      isTraveler = false;
      path = "us-local";
    } else {
      // No qualifying bucket — shouldn't happen with current data, but fall
      // through to the traveler path defensively rather than throw.
      bucket = pickWeightedBucket();
      hometown = pickHometown(bucket);
      currentLocation = pickCurrentLocation();
      isTraveler = true;
      path = "traveler";
    }
  } else {
    // Path 3: traveler
    bucket = pickWeightedBucket();
    hometown = pickHometown(bucket);
    currentLocation = pickCurrentLocation();
    isTraveler = true;
    path = "traveler";
  }

  const gender: "male" | "female" = Math.random() < 0.5 ? "male" : "female";
  const firstName = pick(gender === "male" ? bucket.maleFirstNames : bucket.femaleFirstNames);
  const lastName = pick(bucket.lastNames);
  const photoUrl = pickPhotoUrl(bucket, gender);

  return {
    firstName,
    lastName,
    gender,
    photoUrl,
    hometown,
    currentLocation,
    isTraveler,
    aura: 99,
    bucketKey: bucket.key,
    path,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Username + bio (live-mode only — username queries DB; lazy-loaded)
// ────────────────────────────────────────────────────────────────────────────
async function buildSeedUsername(firstName: string, lastName: string): Promise<string> {
  const { db } = await import("../server/db");
  const { users } = await import("@shared/schema");
  const { sql } = await import("drizzle-orm");

  const MIN_LEN = 6;
  const MAX_LEN = 12;
  const VALID = /^[a-z][a-z0-9_]*$/;
  const sanitize = (s: string) => (s || "").toLowerCase().replace(/[^a-z]/g, "");

  const base = sanitize(firstName) || "user";
  const li = sanitize(lastName).slice(0, 1);
  const baseShort = base.slice(0, 8);
  const prefix = baseShort;
  const taken = new Set<string>(
    (
      await db
        .select({ uname: sql<string>`LOWER(${users.username})` })
        .from(users)
        .where(sql`LOWER(${users.username}) LIKE ${prefix + "%"}`)
    ).map((r: any) => r.uname),
  );
  const ok = (cand: string): boolean =>
    cand.length >= MIN_LEN && cand.length <= MAX_LEN && VALID.test(cand) && !taken.has(cand);

  if (ok(base)) return base;
  if (li && ok(base + li)) return base + li;
  if (li && ok(base + "_" + li)) return base + "_" + li;
  for (let n = 1; n <= 99; n++) {
    const cand = `${base}_${n}`;
    if (ok(cand)) return cand;
  }
  if (li) {
    for (let n = 1; n <= 99; n++) {
      const cand = `${base}${li}_${n}`;
      if (ok(cand)) return cand;
    }
  }
  if (base.length > 8) {
    for (let n = 1; n <= 99; n++) {
      const cand = `${baseShort}_${n}`;
      if (ok(cand)) return cand;
    }
  }
  if (li && base.length < 6) {
    for (let n = 1; n <= 99; n++) {
      const cand = `${base}_${li}_${n}`;
      if (ok(cand)) return cand;
    }
  }
  for (let n = 100; n <= 999; n++) {
    const cand = `${base}_${n}`;
    if (ok(cand)) return cand;
  }
  throw new Error(
    `Could not generate unique seed username for first="${firstName}" last="${lastName}"`,
  );
}

function buildBio(home: CityEntry, interests: string[]): string {
  return pick(BIO_TEMPLATES)({
    city: home.city,
    adj: pick(BIO_ADJ),
    role: pick(BIO_ROLE),
    hook: pick(BIO_HOOK),
    passionLine: pick(BIO_PASSION),
    interest1: interests[0] ?? "live music",
    interest2: interests[1] ?? "good coffee",
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Live-mode helpers (lazy imports — won't run during --dry-run)
// ────────────────────────────────────────────────────────────────────────────
async function uploadCloudinaryPhoto(sourceUrl: string, filename: string): Promise<string> {
  const { uploadImage } = await import("../server/services/cloudinary");
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`photo download failed: ${res.status}`);
  const arr = await res.arrayBuffer();
  const buf = Buffer.from(arr);
  const { url } = await uploadImage(buf, filename);
  return url;
}

function ageBirthDate(minAge: number, maxAge: number): Date {
  const age = randInt(minAge, maxAge);
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  d.setMonth(Math.floor(Math.random() * 12));
  d.setDate(1 + Math.floor(Math.random() * 27));
  return d;
}

function futureDateWeeks(weeksMin: number, weeksMax: number): Date {
  const weeks = randInt(weeksMin, weeksMax);
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function buildLanguages(home: CityEntry): string[] {
  const langs = new Set<string>(["English"]);
  if (home.nativeLanguage) langs.add(home.nativeLanguage);
  return Array.from(langs);
}

// ────────────────────────────────────────────────────────────────────────────
// Live mode — generates one seeded user end-to-end
// ────────────────────────────────────────────────────────────────────────────
async function generateOneUser(): Promise<void> {
  const { storage } = await import("../server/storage");

  const seeded = pickSeededUser();
  const { firstName: first, lastName: last, gender, photoUrl, hometown: home, currentLocation: current, isTraveler } = seeded;

  const username = await buildSeedUsername(first, last);
  const email = `seed+${username}@nearbytraveler.org`;
  const fullName = `${first} ${last}`;

  const userType = isTraveler ? "traveler" : "local";
  const interests = pickN(INTERESTS, randInt(7, 12));
  const languagesSpoken = buildLanguages(home);
  const dateOfBirth = ageBirthDate(22, 45);

  const hasBio = Math.random() < 0.6;
  const bio = hasBio ? buildBio(home, interests) : undefined;

  let travelStartDate: Date | null = null;
  let travelEndDate: Date | null = null;
  if (isTraveler) {
    // Backdate startDate so the trip is active *today* (user is currently in
    // currentLocation), and future-date endDate so the hourly TravelStatusService
    // cleanup naturally fires when the trip "ends" and reverts userType→local
    // with destination fields cleared. See server/services/travel-status-service.ts.
    const DAY = 24 * 60 * 60 * 1000;
    travelStartDate = new Date(Date.now() - randInt(1, 14) * DAY);
    travelEndDate = new Date(Date.now() + randInt(3, 21) * DAY);
  }

  const profileImage = await uploadCloudinaryPhoto(photoUrl, `${username}-${Date.now()}.jpg`);

  const userData: any = {
    username,
    email,
    password: "BetaTester2026!",
    name: fullName,
    firstName: first,
    lastName: last,
    userType,
    dateOfBirth,
    gender,
    profileImage,
    interests,
    languagesSpoken,
    hometownCity: home.city,
    hometownState: home.state ?? null,
    hometownCountry: home.country,
    hometown: [home.city, home.state, home.country].filter(Boolean).join(", "),
    location: [home.city, home.state].filter(Boolean).join(", "),
    isFoundingMember: true,
  };
  if (bio !== undefined) userData.bio = bio;

  if (isTraveler) {
    userData.isCurrentlyTraveling = true;
    userData.destinationCity = current.city;
    userData.destinationState = current.state ?? null;
    userData.destinationCountry = current.country;
    userData.currentTravelCity = current.city;
    userData.currentTravelState = current.state ?? "";
    userData.currentTravelCountry = current.country;
    userData.travelDestination = [current.city, current.state, current.country]
      .filter(Boolean)
      .join(", ");
    userData.travelStartDate = travelStartDate;
    userData.travelEndDate = travelEndDate;
  }

  // 1. createUser — INSERTs users + assignUserToChatrooms (Global + Hometown[+ Destination]).
  const user = await storage.createUser(userData);

  // 2-3. ensureCityExists for hometown + destination (mirrors routes.ts:6342-6368).
  try {
    if (user.hometownCity && user.hometownCountry) {
      await storage.ensureCityExists(user.hometownCity, user.hometownState ?? "", user.hometownCountry);
    }
    if (user.isCurrentlyTraveling && user.destinationCity && user.destinationCountry) {
      await storage.ensureCityExists(user.destinationCity, user.destinationState ?? "", user.destinationCountry);
    }
  } catch (err) {
    console.warn(`⚠️ [seed-daily-users] ensureCityExists failed for @${user.username}:`, (err as any)?.message);
  }

  // 4-6. ensureMeetLocalsChatrooms + autoJoinUserCityChatrooms (mirrors routes.ts:6245-6266).
  try {
    if (user.hometownCity && user.hometownCountry) {
      await storage.ensureMeetLocalsChatrooms(user.hometownCity, user.hometownState, user.hometownCountry);
    }
    if (user.isCurrentlyTraveling && user.destinationCity && user.destinationCountry) {
      await storage.ensureMeetLocalsChatrooms(user.destinationCity, user.destinationState, user.destinationCountry);
    }
    await storage.autoJoinUserCityChatrooms(
      user.id,
      user.hometownCity ?? "",
      user.hometownCountry ?? "",
      user.isCurrentlyTraveling && user.destinationCity ? user.destinationCity : undefined,
      user.isCurrentlyTraveling && user.destinationCountry ? user.destinationCountry : undefined,
    );
  } catch (err) {
    console.error(`⚠️ [seed-daily-users] chatroom join failed for ${user.username}:`, err);
  }

  // 7. Travel plan — mirrors routes.ts:6378-6442 background task.
  if (isTraveler && travelStartDate && travelEndDate) {
    try {
      await storage.createTravelPlan({
        userId: user.id,
        destination: userData.travelDestination,
        destinationCity: current.city,
        destinationState: current.state ?? null,
        destinationCountry: current.country,
        startDate: travelStartDate,
        endDate: travelEndDate,
        // "planned" matches the hourly TravelStatusService cleanup query
        // (server/services/travel-status-service.ts:69) so the trip's lifecycle
        // is properly tracked and the user reverts to local when endDate passes.
        status: "planned",
        notes: "Currently traveling",
        interests,
        activities: [],
        events: [],
      } as any);
    } catch (err) {
      console.error(`⚠️ [seed-daily-users] travel plan failed for ${user.username}:`, err);
    }
  }

  // 8. Aura = 99 (sole seed marker).
  await storage.updateUser(user.id, { aura: 99 });

  // 9. Production background side-effects (welcome email, auto-connect to nearbytrav).
  await fireProductionBackgroundTasks(user);

  console.log(
    `✨ [seed-daily-users] #${user.id} @${user.username} "${fullName}" · ${seeded.bucketKey} · ${userType} · ${home.city}, ${home.country}` +
      (isTraveler ? ` → ${current.city}, ${current.country}` : "") +
      ` · aura=99`,
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Production-parity background tasks (welcome email + nearbytrav auto-connect)
// ────────────────────────────────────────────────────────────────────────────
async function fireProductionBackgroundTasks(user: any): Promise<void> {
  const NEARBYTRAV_USER_ID = 2;

  try {
    const { sendWelcomeEmail } = await import("../server/email/notificationEmails");
    const result = await sendWelcomeEmail(user.id);
    if (result?.success && !result?.skipped) {
      console.log(`  📧 welcome email queued for @${user.username}`);
    }
  } catch (err) {
    console.warn(`  ⚠️ welcome email failed for @${user.username}:`, (err as any)?.message);
  }

  try {
    if (user.id !== NEARBYTRAV_USER_ID) {
      const { db } = await import("../server/db");
      const { connections } = await import("@shared/schema");
      const { or, and, eq } = await import("drizzle-orm");
      const existing = await db
        .select()
        .from(connections)
        .where(
          or(
            and(eq(connections.requesterId, NEARBYTRAV_USER_ID), eq(connections.receiverId, user.id)),
            and(eq(connections.requesterId, user.id), eq(connections.receiverId, NEARBYTRAV_USER_ID)),
          ),
        )
        .limit(1);
      if (existing.length === 0) {
        await db.insert(connections).values({
          requesterId: NEARBYTRAV_USER_ID,
          receiverId: user.id,
          status: "accepted",
          connectionNote: "Welcome to Nearby Traveler!",
        } as any);
      }
    }
  } catch (err) {
    console.warn(`  ⚠️ nearbytrav auto-connect failed for @${user.username}:`, (err as any)?.message);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Public entry — used by the cron in server/index.ts
// ────────────────────────────────────────────────────────────────────────────
export async function seedDailyUsers(opts: { count?: number } = {}): Promise<void> {
  const count = opts.count ?? 2;
  console.log(`🌱 [seed-daily-users] Generating ${count} seed user${count === 1 ? "" : "s"} (aura=99)...`);
  let success = 0;
  for (let i = 0; i < count; i++) {
    try {
      await generateOneUser();
      success++;
    } catch (err) {
      console.error(`❌ [seed-daily-users] Failed user ${i + 1}/${count}:`, err);
    }
  }
  console.log(`✅ [seed-daily-users] Run complete — ${success}/${count} users created`);
}

// ────────────────────────────────────────────────────────────────────────────
// Dry-run — preview the demographic mix without DB / Cloudinary side effects
// ────────────────────────────────────────────────────────────────────────────
function runDryRun(count: number): void {
  const bucketTally = new Map<string, number>();
  const pathTally = new Map<string, number>();
  const laLocalBucketTally = new Map<string, number>();
  const samples: SeededUser[] = [];
  for (let i = 0; i < count; i++) {
    const u = pickSeededUser();
    samples.push(u);
    bucketTally.set(u.bucketKey, (bucketTally.get(u.bucketKey) ?? 0) + 1);
    pathTally.set(u.path, (pathTally.get(u.path) ?? 0) + 1);
    if (u.path === "la-local") {
      laLocalBucketTally.set(u.bucketKey, (laLocalBucketTally.get(u.bucketKey) ?? 0) + 1);
    }
  }

  // Per-user list (skipped for large counts to keep terminal readable).
  const VERBOSE_LIMIT = 30;
  if (count <= VERBOSE_LIMIT) {
    console.log(`\n🌱 Dry-run — ${count} sample seeded users (no DB, no Cloudinary)\n`);
    console.log("─".repeat(150));
    samples.forEach((u, i) => {
      const home = `${u.hometown.city}, ${u.hometown.country}`;
      const current = `${u.currentLocation.city}, ${u.currentLocation.country}`;
      const status = u.isTraveler ? "✈️  traveling" : "🏠 local";
      console.log(
        `${String(i + 1).padStart(2)}. ${u.bucketKey.padEnd(16)} ${u.gender.padEnd(7)} ${(u.firstName + " " + u.lastName).padEnd(30)}` +
          ` from ${home.padEnd(32)} → ${current.padEnd(28)}  ${status}  [${u.path}]`,
      );
      console.log(`    photo: ${u.photoUrl}`);
    });
    console.log("─".repeat(150));
  } else {
    console.log(`\n🌱 Dry-run — ${count} sample seeded users (no DB, no Cloudinary). Per-user list suppressed (count > ${VERBOSE_LIMIT}).\n`);
  }

  console.log("Bucket distribution (this run):");
  const bucketSorted = [...bucketTally.entries()].sort((a, b) => b[1] - a[1]);
  for (const [k, v] of bucketSorted) {
    const pct = ((v / count) * 100).toFixed(1);
    const target = BUCKETS.find((b) => b.key === k)?.weight ?? 0;
    console.log(`  ${k.padEnd(18)} ${String(v).padStart(4)} / ${count}  (${pct.padStart(5)}%, target ${target}%)`);
  }

  console.log("\nPath split (this run):");
  const PATH_TARGETS: Record<string, number> = { "la-local": 40, "us-local": 15, "traveler": 45 };
  const pathSorted = (["la-local", "us-local", "traveler"] as const).map(
    (k) => [k, pathTally.get(k) ?? 0] as const,
  );
  for (const [k, v] of pathSorted) {
    const pct = ((v / count) * 100).toFixed(1);
    const target = PATH_TARGETS[k] ?? 0;
    console.log(`  ${k.padEnd(10)} ${String(v).padStart(4)} / ${count}  (${pct.padStart(5)}%, target ${target}%)`);
  }
  const localCount = (pathTally.get("la-local") ?? 0) + (pathTally.get("us-local") ?? 0);
  const travelerCount = pathTally.get("traveler") ?? 0;
  console.log(
    `  ─ local total: ${localCount} / ${count}  (${((localCount / count) * 100).toFixed(1)}%)` +
      `   traveler total: ${travelerCount} / ${count}  (${((travelerCount / count) * 100).toFixed(1)}%)`,
  );

  if (laLocalBucketTally.size > 0) {
    const laTotal = pathTally.get("la-local") ?? 0;
    console.log("\nLA-rooted local bucket distribution (this run):");
    const laSorted = [...laLocalBucketTally.entries()].sort((a, b) => b[1] - a[1]);
    for (const [k, v] of laSorted) {
      const pct = laTotal > 0 ? ((v / laTotal) * 100).toFixed(1) : "0.0";
      const target = LA_LOCAL_BUCKET_WEIGHTS[k] ?? 0;
      console.log(`  ${k.padEnd(18)} ${String(v).padStart(4)} / ${laTotal}  (${pct.padStart(5)}%, target ${target}%)`);
    }
  }
  console.log();
}

// ────────────────────────────────────────────────────────────────────────────
// CLI dispatch
// ────────────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
if (argv.includes("--dry-run")) {
  let count = 20;
  const eqArg = argv.find((a) => a.startsWith("--count="));
  if (eqArg) {
    const n = parseInt(eqArg.split("=")[1], 10);
    if (Number.isFinite(n) && n > 0) count = n;
  } else {
    const idx = argv.indexOf("--count");
    if (idx >= 0 && argv[idx + 1]) {
      const n = parseInt(argv[idx + 1], 10);
      if (Number.isFinite(n) && n > 0) count = n;
    }
  }
  runDryRun(count);
}
