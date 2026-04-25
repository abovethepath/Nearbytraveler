// scripts/seed-realistic-users.ts
//
// One-shot realistic-user seeder. Built to match the verified signup pipeline
// in docs/signup-pipeline-spec (and §8 of the conversation spec).
//
// Per-user execution order (must match spec §8):
//   1. Build userData (route-handler-style field processing)
//   2. storage.createUser(userData)
//        — INSERTs users row + assignUserToChatrooms (Global + Hometown
//          [+ Destination if traveling])
//   3. storage.ensureCityExists(hometownCity, hometownState, hometownCountry)
//   4. If traveler: storage.ensureCityExists(destination*)
//   5. storage.ensureMeetLocalsChatrooms(hometown*)
//   6. If traveler: storage.ensureMeetLocalsChatrooms(destination*)
//   7. storage.autoJoinUserCityChatrooms(...)
//   8. If traveler: storage.createTravelPlan(...)
//   9. storage.updateUser(user.id, { aura: isTraveler ? 2 : 1 })
//  10. db.update(users).set({ createdAt, lastLogin })
//
// Skipped vs real signup, per §9 decisions:
//   - sendWelcomeEmail
//   - new_member_nearby notification fanout
//   - referral processing
//   - PWA install DM, welcome DM from nearbytrav
//   - auto-connect to nearbytrav (id=2)
//
// Identification (NOT a marker in profile data):
//   - username: `nts_` + 8 alnum chars (12 chars total, fits varchar(12))
//   - email:    <username>@seed.nearbytraveler.org
// Cleanup query: DELETE FROM users WHERE username LIKE 'nts\_%' ESCAPE '\';
// (Plus FK cascade across chatroom_members, connections, travel_plans, etc.)
//
// Run modes:
//   tsx scripts/seed-realistic-users.ts --dry-run                  → fetch from
//       randomuser.me, print 3 sample userData objects, NO DB writes, NO
//       Cloudinary uploads, NO storage import (so it works without DATABASE_URL)
//   tsx scripts/seed-realistic-users.ts --count=50                 → live run
//   tsx scripts/seed-realistic-users.ts --count=50 --dry-run       → preview
//
// IMPORTANT: storage and db modules are LAZY-imported so --dry-run does not
// open a DB pool or require Cloudinary credentials.

import type { storage as StorageType } from "../server/storage";
import type { db as DbType } from "../server/db";

// ───────────── pools ─────────────

interface CityEntry {
  city: string;
  state?: string | null;
  country: string;
  weight: number;
  nativeLanguage?: string;
}

const CITY_POOL: CityEntry[] = [
  // LA core (combined LA+OC weight ≈ 70% of pool)
  { city: "Los Angeles",   state: "California",   country: "United States", weight: 6 },
  { city: "Santa Monica",  state: "California",   country: "United States", weight: 5 },
  { city: "Venice",        state: "California",   country: "United States", weight: 4 },
  { city: "Long Beach",    state: "California",   country: "United States", weight: 4 },
  { city: "Pasadena",      state: "California",   country: "United States", weight: 4 },
  { city: "Culver City",   state: "California",   country: "United States", weight: 3 },
  { city: "West Hollywood",state: "California",   country: "United States", weight: 3 },
  { city: "Hollywood",     state: "California",   country: "United States", weight: 3 },
  { city: "Glendale",      state: "California",   country: "United States", weight: 2 },
  { city: "Burbank",       state: "California",   country: "United States", weight: 2 },
  // OC
  { city: "Irvine",          state: "California", country: "United States", weight: 5 },
  { city: "Costa Mesa",      state: "California", country: "United States", weight: 4 },
  { city: "Newport Beach",   state: "California", country: "United States", weight: 4 },
  { city: "Huntington Beach",state: "California", country: "United States", weight: 3 },
  { city: "Anaheim",         state: "California", country: "United States", weight: 3 },
  { city: "Laguna Beach",    state: "California", country: "United States", weight: 3 },
  { city: "Santa Ana",       state: "California", country: "United States", weight: 2 },
  { city: "Tustin",          state: "California", country: "United States", weight: 2 },
  // Other US
  { city: "New York",       state: "New York",      country: "United States", weight: 2 },
  { city: "San Francisco",  state: "California",    country: "United States", weight: 2 },
  { city: "Austin",         state: "Texas",         country: "United States", weight: 2 },
  { city: "Seattle",        state: "Washington",    country: "United States", weight: 1 },
  { city: "Chicago",        state: "Illinois",      country: "United States", weight: 1 },
  { city: "Denver",         state: "Colorado",      country: "United States", weight: 1 },
  { city: "Miami",          state: "Florida",       country: "United States", weight: 1 },
  { city: "Portland",       state: "Oregon",        country: "United States", weight: 1 },
  // International
  { city: "Paris",        state: null, country: "France",         weight: 1, nativeLanguage: "French" },
  { city: "Barcelona",    state: null, country: "Spain",          weight: 1, nativeLanguage: "Spanish" },
  { city: "Madrid",       state: null, country: "Spain",          weight: 1, nativeLanguage: "Spanish" },
  { city: "London",       state: null, country: "United Kingdom", weight: 1 },
  { city: "Berlin",       state: null, country: "Germany",        weight: 1, nativeLanguage: "German" },
  { city: "Tokyo",        state: null, country: "Japan",          weight: 1, nativeLanguage: "Japanese" },
  { city: "Sydney",       state: null, country: "Australia",      weight: 1 },
  { city: "Melbourne",    state: null, country: "Australia",      weight: 1 },
  { city: "Toronto",      state: "Ontario", country: "Canada",    weight: 1 },
  { city: "Mexico City",  state: null, country: "Mexico",         weight: 1, nativeLanguage: "Spanish" },
  { city: "Rio de Janeiro", state: null, country: "Brazil",       weight: 1, nativeLanguage: "Portuguese" },
  { city: "São Paulo",    state: null, country: "Brazil",         weight: 1, nativeLanguage: "Portuguese" },
];

const SECONDARY_LANGUAGE_BY_NAT: Record<string, string> = {
  fr: "French",
  de: "German",
  es: "Spanish",
  br: "Portuguese",
  mx: "Spanish",
};

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
  "Surfing",
  "Live Comedy",
];

// 4 bio templates. NO test markers anywhere.
const BIO_TEMPLATES: Array<(ctx: BioCtx) => string> = [
  (c) => `${c.adj} ${c.role} based in ${c.city}. ${c.hook}`,
  (c) => `Currently in ${c.city}. ${c.hook} ${c.passionLine}`,
  (c) => `${c.passionLine} ${c.hook}`,
  (c) => `${c.role} who likes ${c.interest1.toLowerCase()} and ${c.interest2.toLowerCase()}. ${c.hook}`,
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

// ───────────── helpers ─────────────

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  return out;
}
function randInt(min: number, max: number): number { return min + Math.floor(Math.random() * (max - min + 1)); }
function randomDateBetween(daysAgoMin: number, daysAgoMax: number): Date {
  const daysAgo = randInt(daysAgoMin, daysAgoMax);
  const ms = Date.now() - daysAgo * 24 * 60 * 60 * 1000 - randInt(0, 24 * 60 * 60 * 1000 - 1);
  return new Date(ms);
}
function pickWeighted<T extends { weight: number }>(pool: T[]): T {
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of pool) { r -= e.weight; if (r <= 0) return e; }
  return pool[pool.length - 1];
}
function randomToken(n: number): string {
  const c = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

function buildSeedUsername(): string { return `nts_${randomToken(8)}`; }

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

function buildLanguages(home: CityEntry, nat: string): string[] {
  const langs = new Set<string>(["English"]);
  if (home.nativeLanguage) langs.add(home.nativeLanguage);
  const sec = SECONDARY_LANGUAGE_BY_NAT[nat?.toLowerCase()];
  if (sec) langs.add(sec);
  return Array.from(langs);
}

// ───────────── randomuser.me ─────────────

interface RandomUser {
  gender: "male" | "female";
  name: { first: string; last: string };
  email: string;
  dob: { date: string; age: number };
  picture: { large: string; medium: string };
  nat: string;
}

async function fetchRandomUsers(count: number): Promise<RandomUser[]> {
  const url = `https://randomuser.me/api/?results=${count}&nat=us,gb,ca,au,fr,de,es,br,mx&exc=login,phone,cell,id,registered,location`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`randomuser.me failed: ${res.status} ${res.statusText}`);
  const json = await res.json() as { results: RandomUser[] };
  return json.results;
}

// ───────────── userData builder (no DB / no network) ─────────────

interface PreparedUser {
  insertData: Record<string, any>;
  isTraveler: boolean;
  destination: CityEntry | null;
  travelStartDate: Date | null;
  travelEndDate: Date | null;
  createdAt: Date;
  lastLogin: Date;
  username: string;
  picturePending: { url: string; filename: string };
}

function buildUserData(api: RandomUser): PreparedUser {
  const home = pickWeighted(CITY_POOL);
  const username = buildSeedUsername();
  const email = `${username}@seed.nearbytraveler.org`;
  const fullName = `${api.name.first} ${api.name.last}`;
  const dob = new Date(api.dob.date);

  const isTraveler = Math.random() < 0.25;
  const userType = isTraveler ? "traveler" : "local";
  // Spec §0.3: form requires ≥7 interests. Use 7-12 random, no customInterests.
  const interests = pickN(INTERESTS, randInt(7, 12));
  const languagesSpoken = buildLanguages(home, api.nat);

  // Spec §9.2: 60% of users get a bio (no marker), 40% NULL to match fresh signups.
  const hasBio = Math.random() < 0.6;
  const bio = hasBio ? buildBio(home, interests) : undefined;

  let destination: CityEntry | null = null;
  let travelStartDate: Date | null = null;
  let travelEndDate: Date | null = null;
  if (isTraveler) {
    do { destination = pickWeighted(CITY_POOL); } while (destination.city === home.city);
    const startDays = randInt(7, 56);
    travelStartDate = new Date(Date.now() + startDays * 24 * 60 * 60 * 1000);
    travelEndDate = new Date(travelStartDate);
    travelEndDate.setDate(travelEndDate.getDate() + randInt(5, 21));
  }

  // Backdating per §9.5.
  const createdAt = randomDateBetween(0, 90);
  const lastLogin = randomDateBetween(0, 14);

  // Mirrors routes.ts:5644-5722 pre-processing for both local and traveler.
  // - hometown / location strings built same as the route handler
  // - traveler: currentTravelCity/State/Country mirrored from destination, force isCurrentlyTraveling
  // - countriesVisited NOT pre-populated — storage.createUser auto-fills (§spec 2.2)
  const insertData: Record<string, any> = {
    username,
    email,
    password: "SeedUser2026!",                  // ≥8 chars (zod min), plain text (login supports)
    name: fullName,
    firstName: api.name.first,
    lastName: api.name.last,
    userType,
    dateOfBirth: dob,
    gender: api.gender === "male" ? "male" : "female",
    interests,
    languagesSpoken,
    hometownCity: home.city,
    hometownState: home.state ?? null,
    hometownCountry: home.country,
    hometown: [home.city, home.state, home.country].filter(Boolean).join(", "),
    location: [home.city, home.state].filter(Boolean).join(", "),
    isFoundingMember: true,                     // forced by route handler at routes.ts:6239
    // profileImage filled in after Cloudinary upload (post-build, pre-create)
  };
  if (bio !== undefined) insertData.bio = bio;

  if (isTraveler && destination) {
    insertData.isCurrentlyTraveling = true;
    insertData.destinationCity = destination.city;
    insertData.destinationState = destination.state ?? null;
    insertData.destinationCountry = destination.country;
    // Mirror routes.ts:5697-5710 — handler sets currentTravelCity/State/Country from destination*.
    insertData.currentTravelCity = destination.city;
    insertData.currentTravelState = destination.state ?? "";
    insertData.currentTravelCountry = destination.country;
    insertData.travelDestination = [destination.city, destination.state, destination.country]
      .filter(Boolean).join(", ");
    insertData.travelStartDate = travelStartDate;
    insertData.travelEndDate = travelEndDate;
  }

  return {
    insertData,
    isTraveler,
    destination,
    travelStartDate,
    travelEndDate,
    createdAt,
    lastLogin,
    username,
    picturePending: { url: api.picture.large, filename: `${username}-${Date.now()}.jpg` },
  };
}

// ───────────── live-mode wiring (lazy imports) ─────────────

async function getStorage(): Promise<typeof StorageType> {
  const { storage } = await import("../server/storage");
  return storage;
}
async function getDb(): Promise<{ db: typeof DbType; users: any; eq: any; sql: any }> {
  const { db } = await import("../server/db");
  const { users } = await import("@shared/schema");
  const { eq, sql } = await import("drizzle-orm");
  return { db, users, eq, sql };
}
async function uploadCloudinaryPhoto(url: string, filename: string): Promise<string> {
  // Mandatory per §9.7 — throw on failure.
  const res = await fetch(url);
  if (!res.ok) throw new Error(`photo download failed: ${res.status}`);
  const arr = await res.arrayBuffer();
  const buf = Buffer.from(arr);
  const { uploadImage } = await import("../server/services/cloudinary");
  const { url: secureUrl } = await uploadImage(buf, filename);
  return secureUrl;
}

async function createOneSeedUserLive(prep: PreparedUser): Promise<void> {
  const { insertData, isTraveler, destination, travelStartDate, travelEndDate, createdAt, lastLogin, picturePending } = prep;

  // Spec §9.7: Cloudinary photo for EVERY user, no exceptions. If upload fails, skip user.
  const profileImage = await uploadCloudinaryPhoto(picturePending.url, picturePending.filename);
  insertData.profileImage = profileImage;

  const storage = await getStorage();

  // 2. createUser — INSERT users + assignUserToChatrooms (Global, Hometown[, Destination])
  const user = await storage.createUser(insertData as any);

  // 3-4. ensureCityExists for hometown + destination (mirrors routes.ts:6342-6368).
  try {
    if (user.hometownCity && user.hometownCountry) {
      await storage.ensureCityExists(user.hometownCity, user.hometownState ?? "", user.hometownCountry);
    }
    if (user.isCurrentlyTraveling && user.destinationCity && user.destinationCountry) {
      await storage.ensureCityExists(user.destinationCity, user.destinationState ?? "", user.destinationCountry);
    }
  } catch (err) {
    console.warn(`  ⚠️ ensureCityExists failed for @${user.username}:`, (err as any)?.message);
  }

  // 5-6. ensureMeetLocalsChatrooms for hometown + destination (mirrors routes.ts:6249,6253).
  try {
    if (user.hometownCity && user.hometownCountry) {
      await storage.ensureMeetLocalsChatrooms(user.hometownCity, user.hometownState, user.hometownCountry);
    }
    if (user.isCurrentlyTraveling && user.destinationCity && user.destinationCountry) {
      await storage.ensureMeetLocalsChatrooms(user.destinationCity, user.destinationState, user.destinationCountry);
    }
  } catch (err) {
    console.warn(`  ⚠️ ensureMeetLocalsChatrooms failed for @${user.username}:`, (err as any)?.message);
  }

  // 7. autoJoinUserCityChatrooms (mirrors routes.ts:6256-6262).
  try {
    await storage.autoJoinUserCityChatrooms(
      user.id,
      user.hometownCity ?? "",
      user.hometownCountry ?? "",
      user.isCurrentlyTraveling && user.destinationCity ? user.destinationCity : undefined,
      user.isCurrentlyTraveling && user.destinationCountry ? user.destinationCountry : undefined,
    );
  } catch (err) {
    console.warn(`  ⚠️ autoJoinUserCityChatrooms failed for @${user.username}:`, (err as any)?.message);
  }

  // 8. Travel plan (mirrors routes.ts:6378-6442 background task).
  if (isTraveler && destination && travelStartDate && travelEndDate) {
    try {
      await storage.createTravelPlan({
        userId: user.id,
        destination: insertData.travelDestination,
        destinationCity: destination.city,
        destinationState: destination.state ?? null,
        destinationCountry: destination.country,
        startDate: travelStartDate,
        endDate: travelEndDate,
        status: "active",
        notes: "Currently traveling",
        interests: insertData.interests,
        activities: [],
        events: [],
      } as any);
    } catch (err) {
      console.warn(`  ⚠️ travel plan failed for @${user.username}:`, (err as any)?.message);
    }
  }

  // 9. Aura — exact match to routes.ts:6654-6661.
  await storage.updateUser(user.id, { aura: isTraveler ? 2 : 1 });

  // 10. Backdate created_at + lastLogin (defaultNow() would otherwise stamp NOW).
  const { db, users, eq } = await getDb();
  await db.update(users).set({ createdAt, lastLogin }).where(eq(users.id, user.id));

  console.log(
    `  ✓ #${user.id} @${user.username} ${isTraveler ? "→" : " "} ${insertData.hometownCity}` +
    (destination ? ` ⇢ ${destination.city}` : "") +
    ` · created ${createdAt.toISOString().slice(0, 10)} · last ${lastLogin.toISOString().slice(0, 10)}`
  );
}

// ───────────── runners ─────────────

export async function seedRealisticUsers(opts: { count?: number; dryRun?: boolean } = {}): Promise<void> {
  const count = opts.count ?? 50;
  const dryRun = !!opts.dryRun;

  console.log(`🌱 [seed-realistic-users] ${dryRun ? "DRY RUN " : ""}fetching ${count} users from randomuser.me...`);
  const apiUsers = await fetchRandomUsers(count);
  console.log(`🌱 received ${apiUsers.length} users`);

  if (dryRun) {
    const sampleN = apiUsers.length;
    console.log(`\n=== DRY RUN: ${sampleN} sample userData objects ===`);
    for (let i = 0; i < sampleN; i++) {
      const prep = buildUserData(apiUsers[i]);
      const summary = {
        plannedSteps: [
          "1. storage.createUser(userData)",
          "2. storage.ensureCityExists(hometown)",
          ...(prep.isTraveler ? ["3. storage.ensureCityExists(destination)"] : []),
          "4. storage.ensureMeetLocalsChatrooms(hometown)",
          ...(prep.isTraveler ? ["5. storage.ensureMeetLocalsChatrooms(destination)"] : []),
          "6. storage.autoJoinUserCityChatrooms(...)",
          ...(prep.isTraveler ? ["7. storage.createTravelPlan(...)"] : []),
          `8. storage.updateUser(id, { aura: ${prep.isTraveler ? 2 : 1} })`,
          `9. db.update(users).set({ createdAt: ${prep.createdAt.toISOString()}, lastLogin: ${prep.lastLogin.toISOString()} })`,
        ],
        cloudinary: { source: prep.picturePending.url, filename: prep.picturePending.filename, mode: "uploaded pre-create (mandatory)" },
        userData: prep.insertData,
      };
      console.log(`\n--- sample ${i + 1}/${sampleN} ---`);
      console.log(JSON.stringify(summary, null, 2));
    }
    console.log(`\n=== END DRY RUN — no DB writes, no Cloudinary uploads ===\n`);
    return;
  }

  console.log(`🌱 creating sequentially to avoid Cloudinary rate-limit...`);
  let success = 0;
  for (let i = 0; i < apiUsers.length; i++) {
    try {
      const prep = buildUserData(apiUsers[i]);
      await createOneSeedUserLive(prep);
      success++;
    } catch (err) {
      console.error(`  ✗ user ${i + 1}/${apiUsers.length} failed:`, (err as any)?.message);
    }
  }
  console.log(`✅ [seed-realistic-users] ${success}/${apiUsers.length} users created`);

  // Summary stats.
  const { db, users, sql } = await getDb();
  const totalRows = await db.select({ total: sql<number>`COUNT(*)::int` })
    .from(users)
    .where(sql`${users.username} LIKE 'nts\_%' ESCAPE '\\'`);
  const total = totalRows[0]?.total ?? 0;
  const span = await db.select({
    oldest: sql<string>`MIN(${users.createdAt})::text`,
    newest: sql<string>`MAX(${users.createdAt})::text`,
  })
    .from(users)
    .where(sql`${users.username} LIKE 'nts\_%' ESCAPE '\\'`);
  console.log(`📊 nts_* total in DB: ${total}`);
  if (span[0]?.oldest) console.log(`📊 created_at span: oldest=${span[0].oldest}, newest=${span[0].newest}`);
}

// ───────────── CLI ─────────────

function parseArgs(): { count: number; dryRun: boolean } {
  const args = process.argv.slice(2);
  let count = 50;
  let dryRun = false;
  for (const a of args) {
    if (a === "--dry-run") dryRun = true;
    else if (a.startsWith("--count=")) count = Math.max(1, Math.min(200, parseInt(a.slice(8)) || 50));
  }
  return { count, dryRun };
}

const isMain = (() => {
  try { return import.meta.url.endsWith((process.argv[1] || "").replace(/\\/g, "/").split("/").pop() || ""); } catch { return false; }
})();
if (isMain) {
  const { count, dryRun } = parseArgs();
  seedRealisticUsers({ count, dryRun })
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}
