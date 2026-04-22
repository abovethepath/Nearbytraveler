// scripts/seed-daily-users.ts
//
// Generates 5-10 fake beta-tester users daily. Scheduled via node-cron in
// server/index.ts at 00:00 UTC. Mirrors the real signup flow so seeded users
// land in the same state as real signups: storage.createUser() runs
// assignUserToChatrooms internally; we then call ensureMeetLocalsChatrooms
// and autoJoinUserCityChatrooms to match routes.ts:6245-6266 exactly.
//
// Identifiers for admin filtering:
//   - email: testuser+<username>@nearbytraveler.org (routes to aaron via + alias)
//   - bio:   starts with "[Beta Tester]"
//
// Aura, password storage, and founding-member flag all match the real signup:
//   routes.ts:6654-6661  (aura = 1 local, 2 traveler)
//   routes.ts:1511-1518  (plain-text password supported by login)
//   routes.ts:6239       (isFoundingMember: true on all signups)
//
// Skipped vs real signup (by design — avoids spam):
//   - Welcome email, PWA install DM, and new_member_nearby notifications
//     live in the route handler's setImmediate block, not in storage.createUser,
//     so calling storage.createUser directly bypasses them.

import { storage } from "../server/storage";

type Region = "us" | "latam" | "europe" | "asia" | "oceania";

interface CityEntry {
  city: string;
  state?: string | null;
  country: string;
  region: Region;
  nativeLanguage?: string;
}

const CITIES: CityEntry[] = [
  // United States
  { city: "Los Angeles", state: "California", country: "United States", region: "us" },
  { city: "New York", state: "New York", country: "United States", region: "us" },
  { city: "San Francisco", state: "California", country: "United States", region: "us" },
  { city: "Austin", state: "Texas", country: "United States", region: "us" },
  { city: "Miami", state: "Florida", country: "United States", region: "us" },
  { city: "Chicago", state: "Illinois", country: "United States", region: "us" },
  { city: "Seattle", state: "Washington", country: "United States", region: "us" },
  { city: "Denver", state: "Colorado", country: "United States", region: "us" },
  { city: "Portland", state: "Oregon", country: "United States", region: "us" },
  { city: "Boston", state: "Massachusetts", country: "United States", region: "us" },
  // Europe
  { city: "Paris", state: null, country: "France", region: "europe", nativeLanguage: "French" },
  { city: "Barcelona", state: null, country: "Spain", region: "europe", nativeLanguage: "Spanish" },
  { city: "Madrid", state: null, country: "Spain", region: "europe", nativeLanguage: "Spanish" },
  { city: "Berlin", state: null, country: "Germany", region: "europe", nativeLanguage: "German" },
  { city: "Munich", state: null, country: "Germany", region: "europe", nativeLanguage: "German" },
  { city: "Amsterdam", state: null, country: "Netherlands", region: "europe", nativeLanguage: "Dutch" },
  { city: "Rome", state: null, country: "Italy", region: "europe", nativeLanguage: "Italian" },
  { city: "Milan", state: null, country: "Italy", region: "europe", nativeLanguage: "Italian" },
  { city: "London", state: null, country: "United Kingdom", region: "europe" },
  { city: "Lisbon", state: null, country: "Portugal", region: "europe", nativeLanguage: "Portuguese" },
  { city: "Copenhagen", state: null, country: "Denmark", region: "europe", nativeLanguage: "Danish" },
  { city: "Stockholm", state: null, country: "Sweden", region: "europe", nativeLanguage: "Swedish" },
  // Latin America
  { city: "Mexico City", state: null, country: "Mexico", region: "latam", nativeLanguage: "Spanish" },
  { city: "Buenos Aires", state: null, country: "Argentina", region: "latam", nativeLanguage: "Spanish" },
  { city: "São Paulo", state: null, country: "Brazil", region: "latam", nativeLanguage: "Portuguese" },
  { city: "Rio de Janeiro", state: null, country: "Brazil", region: "latam", nativeLanguage: "Portuguese" },
  { city: "Medellín", state: null, country: "Colombia", region: "latam", nativeLanguage: "Spanish" },
  // Asia
  { city: "Tokyo", state: null, country: "Japan", region: "asia", nativeLanguage: "Japanese" },
  { city: "Seoul", state: null, country: "South Korea", region: "asia", nativeLanguage: "Korean" },
  { city: "Bangkok", state: null, country: "Thailand", region: "asia", nativeLanguage: "Thai" },
  { city: "Singapore", state: null, country: "Singapore", region: "asia" },
  { city: "Taipei", state: null, country: "Taiwan", region: "asia", nativeLanguage: "Mandarin" },
  // Oceania
  { city: "Sydney", state: null, country: "Australia", region: "oceania" },
  { city: "Melbourne", state: null, country: "Australia", region: "oceania" },
];

// Countries-visited pools by region keep visited lists geographically plausible.
const VISITED_BY_REGION: Record<Region, string[]> = {
  us:      ["United States", "Mexico", "Canada", "Italy", "Spain", "France", "Japan", "Thailand", "Costa Rica"],
  latam:   ["Argentina", "Brazil", "Mexico", "Colombia", "Chile", "Peru", "United States", "Spain", "Portugal"],
  europe:  ["France", "Spain", "Italy", "Germany", "Portugal", "Netherlands", "United Kingdom", "Greece", "Croatia", "United States"],
  asia:    ["Japan", "South Korea", "Thailand", "Singapore", "Vietnam", "Indonesia", "Taiwan", "Malaysia", "Australia", "United States"],
  oceania: ["Australia", "New Zealand", "Indonesia", "Thailand", "Japan", "United States", "Fiji"],
};

const FIRST_NAMES = [
  "Sarah", "Tom", "Jessica", "Marcus", "Emily", "David", "Rachel", "Ryan",
  "Jason", "Lauren", "Michael", "Nicole", "Brandon", "Ashley",
  "Luca", "Sophie", "Oliver", "Emma", "Lea", "Niklas", "Clara", "Mateusz",
  "Anna", "Max", "Giulia", "Andres", "Martina", "Hannah",
  "Javier", "Camila", "Diego", "Valentina", "Rafael", "Sofia", "Mateo", "Lucia",
  "Gabriel", "Paula",
  "Kenji", "Priya", "Wei", "Minjun", "Akira", "Aarav", "Yuki", "Hana",
  "Siu", "Arjun", "Mei",
  "Layla", "Omar", "Fatima", "Karim", "Noor",
];

const LAST_NAMES = [
  "Miller", "Johnson", "Brown", "Davis", "Wilson", "Anderson", "Thomas", "Moore",
  "Jackson", "Martin", "White",
  "Rossi", "Schmidt", "Novak", "Dubois", "Bergstrom", "Garcia",
  "Kowalski", "Fischer", "Nielsen", "Silva",
  "Rodriguez", "Lopez", "Cruz", "Santos", "Morales", "Ramirez", "Fernandez",
  "Herrera",
  "Tanaka", "Sharma", "Chen", "Park", "Yamamoto", "Gupta", "Kim", "Liu",
  "Patel",
  "Hassan", "Cohen", "Ahmed", "Hosseini",
];

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

const BIOS = [
  "Exploring the city one coffee shop at a time.",
  "Always down for a hike or a taco.",
  "New here and looking to meet people who actually get out and do things.",
  "Weekend wanderer, weekday grinder.",
  "Food, music, and good conversation — in that order.",
  "Born somewhere else, curious about everywhere.",
  "Trying every bakery in town.",
  "If you know a good sunset spot, tell me.",
  "Local recs welcome — I'll trade you mine.",
  "Moving through. Happy to share a meal.",
];

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

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function buildUsername(first: string, last: string): string {
  const f = slug(first);
  const l = slug(last);
  // Aim for short/handle-ish names similar to the user's examples (sarahm, tomk).
  // Always end with a random 2-digit suffix to make unique-within-run collisions
  // vanishingly rare without making usernames look bot-like.
  const suffix = String(randInt(10, 99));
  const base =
    f.length + 1 + suffix.length <= 12 ? `${f}${l.slice(0, 1)}${suffix}` :
    f.length + suffix.length <= 12 ? `${f}${suffix}` :
    `${f.slice(0, 10 - suffix.length)}${suffix}`;
  return base.slice(0, 12);
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

function buildCountriesVisited(home: CityEntry): string[] {
  const pool = VISITED_BY_REGION[home.region];
  const n = randInt(3, 6);
  const picked = pickN(pool, n);
  if (!picked.includes(home.country)) picked.unshift(home.country);
  return picked.slice(0, n);
}

async function generateOneUser(): Promise<void> {
  const home = pick(CITIES);
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const username = buildUsername(first, last);
  const email = `testuser+${username}@nearbytraveler.org`;
  const fullName = `${first} ${last}`;

  const isTraveler = Math.random() < 0.3;
  const userType = isTraveler ? "traveler" : "local";
  const interests = pickN(INTERESTS, randInt(3, 7));
  const languagesSpoken = buildLanguages(home);
  const countriesVisited = buildCountriesVisited(home);
  const dateOfBirth = ageBirthDate(22, 45);
  const bio = `[Beta Tester] ${pick(BIOS)}`;

  let destination: CityEntry | null = null;
  let travelStartDate: Date | null = null;
  let travelEndDate: Date | null = null;

  if (isTraveler) {
    do {
      destination = pick(CITIES);
    } while (destination.city === home.city);
    travelStartDate = futureDateWeeks(2, 8);
    travelEndDate = new Date(travelStartDate);
    travelEndDate.setDate(travelEndDate.getDate() + randInt(5, 21));
  }

  const userData: any = {
    username,
    email,
    password: "BetaTester2026!",
    name: fullName,
    firstName: first,
    lastName: last,
    userType,
    dateOfBirth,
    bio,
    interests,
    languagesSpoken,
    countriesVisited,
    hometownCity: home.city,
    hometownState: home.state ?? null,
    hometownCountry: home.country,
    hometown: [home.city, home.state, home.country].filter(Boolean).join(", "),
    location: [home.city, home.state].filter(Boolean).join(", "),
    isFoundingMember: true,
    isActive: true,
  };

  if (isTraveler && destination) {
    userData.isCurrentlyTraveling = true;
    userData.destinationCity = destination.city;
    userData.destinationState = destination.state ?? null;
    userData.destinationCountry = destination.country;
    userData.travelDestination = [destination.city, destination.state, destination.country]
      .filter(Boolean)
      .join(", ");
    userData.travelStartDate = travelStartDate;
    userData.travelEndDate = travelEndDate;
  }

  // Create user. storage.createUser runs assignUserToChatrooms internally,
  // which joins: Welcome to Nearby Traveler + Welcome to <hometown> [+ Welcome to <destination>].
  const user = await storage.createUser(userData);

  // Mirror routes.ts:6245-6266 — the route handler also runs these two helpers
  // in addition to assignUserToChatrooms. They are idempotent where rooms exist.
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

  // Travel plan — mirrors routes.ts:6378-6442 background task.
  if (isTraveler && destination && travelStartDate && travelEndDate) {
    try {
      await storage.createTravelPlan({
        userId: user.id,
        destination: userData.travelDestination,
        destinationCity: destination.city,
        destinationState: destination.state ?? null,
        destinationCountry: destination.country,
        startDate: travelStartDate,
        endDate: travelEndDate,
        status: "active",
        notes: "Currently traveling",
        interests,
        activities: [],
        events: [],
      } as any);
    } catch (err) {
      console.error(`⚠️ [seed-daily-users] travel plan failed for ${user.username}:`, err);
    }
  }

  // Aura — exact match to routes.ts:6654-6661: 1 for local, 2 for traveler. Nothing else.
  const aura = isTraveler ? 2 : 1;
  await storage.updateUser(user.id, { aura });

  console.log(
    `✨ [seed-daily-users] #${user.id} @${user.username} "${fullName}" · ${userType} · ${home.city}, ${home.country}` +
    (destination ? ` → ${destination.city}, ${destination.country}` : "") +
    ` · aura=${aura}`
  );
}

export async function seedDailyUsers(): Promise<void> {
  const count = randInt(5, 10);
  console.log(`🌱 [seed-daily-users] Generating ${count} fake beta users...`);
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
