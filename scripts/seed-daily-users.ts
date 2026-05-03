// scripts/seed-daily-users.ts
//
// Generates fake beta users on a 4-hour cadence. Scheduled via node-cron in
// server/index.ts at "0 */4 * * *" UTC (00/04/08/12/16/20 = 6 fires/day).
// Default count per fire is 2 → 12 users/day total. Mirrors the real signup
// flow so seeded users land in the same state as real signups EXCEPT for
// aura, which is set to 99 — the primary identification marker.
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
//      nearbytrav, welcome DM. INTENTIONAL: operator monitors the platform
//      pipeline via the seed+ alias inbox.
//
// No backdating: cron uses real-time timestamps from defaultNow().
//
// Identifiers (NO marker in profile data):
//   - aura:     99 (real users never reach this organically — primary marker)
//   - username: `nts_` + 8 alnum chars (12 chars total, fits varchar(12))
//   - email:    seed+<username>@nearbytraveler.org (plus-addressed under the
//               real domain so welcome emails route to seed@nearbytraveler.org)
// Cleanup query (single criterion now suffices):
//   DELETE FROM users WHERE id <> 2 AND aura = 99;
//
// Password, founding-member: match real signup
//   routes.ts:1511-1518  (plain-text password supported by login)
//   routes.ts:6239       (isFoundingMember: true on all signups)
//
// What does/doesn't fire vs real signup:
//   FIRES (intentional — for monitoring):
//     - sendWelcomeEmail (routes.ts:6329-6340)
//     - Auto-connect to nearbytrav id=2 (routes.ts:6558-6585)
//     - Welcome DM from nearbytrav (routes.ts:6588-6647)
//   SKIPPED (would harm real users or is fragile in cron context):
//     - new_member_nearby fanout (routes.ts:6663-6722) — would create up to
//       50 in-app notifications per seed × 6 fires/day = ~300 notifications
//       per day to real users about fake new members. Skip until/unless the
//       operator explicitly wants the platform-side fanout exercised.
//     - 60s setTimeout PWA install DM (routes.ts:6605-6651) — setTimeout
//       inside a cron-tick context is fragile; the immediate welcome DM is
//       enough to verify the message-from-nearbytrav pipeline.
//     - Referral processing — seeds carry no referralCode.
//
// Sequencing: users are created sequentially (await one before starting the
// next) — Cloudinary uploads + DB writes can race otherwise, and the for-loop
// in seedDailyUsers() at the bottom of this file enforces it.

import { storage } from "../server/storage";
import { uploadImage } from "../server/services/cloudinary";
import { db } from "../server/db";
import { connections } from "@shared/schema";
import { getMetroCities } from "@shared/metro-areas";
import { or, and, eq } from "drizzle-orm";

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

// Hometown distribution for seed users — concentrated in launch market.
// 60% LA Metro, 15% OC Metro, 25% other major US cities. Pulled from
// shared/metro-areas.ts at call time so suburb lists stay in sync.
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

const FIRST_NAMES = [
  // Anglo
  "Michael", "David", "James", "John", "Robert", "Christopher", "Matthew",
  "Joshua", "Andrew", "Daniel", "Ryan", "Tyler", "Brandon", "Justin", "Kevin",
  "Brian", "Jason", "Jacob", "Ethan", "Noah", "Liam", "Lucas", "Mason", "Logan",
  "Aiden", "Marcus",
  // Black American
  "Andre", "DeShawn", "Jamal", "Tyrone", "Darius", "Malik",
  // Hispanic American
  "Carlos", "Luis", "Miguel", "Antonio", "Diego", "Mateo", "Jose", "Juan",
  // Asian American
  "Raj", "Arjun", "Vikram", "Kenji", "Hiro",
  // Anglo (women)
  "Jennifer", "Sarah", "Jessica", "Ashley", "Amanda", "Emily", "Lauren",
  "Megan", "Stephanie", "Nicole", "Rachel", "Rebecca", "Lisa", "Michelle",
  "Angela", "Melissa",
  // Hispanic American (women)
  "Maria", "Sofia", "Camila", "Isabella", "Valentina",
  // Black American (women)
  "Aaliyah", "Imani", "Zora", "Ayana",
  // Asian American (women)
  "Priya", "Anjali", "Mei", "Yuna",
  // Anglo (women, modern)
  "Olivia", "Emma", "Ava", "Charlotte", "Mia", "Harper", "Evelyn",
];

const LAST_NAMES = [
  // Top US Census surnames
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
  "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
  "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
  "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams",
  "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter",
  "Roberts",
  // Common immigrant-origin US surnames
  "Patel", "Kim", "Park", "Chen", "Singh", "Khan", "Ali",
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

// 4 bio templates with token slots. NO test markers anywhere.
// Same template set + 60/40 split as scripts/seed-realistic-users.ts.
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

// Weighted hometown picker: 60% LA Metro, 15% OC Metro, 25% other major US cities.
function pickHometown(): CityEntry {
  const r = Math.random();
  if (r < 0.60) {
    return { city: pick(getMetroCities("Los Angeles Metro")), state: "California", country: "United States", region: "us" };
  }
  if (r < 0.75) {
    return { city: pick(getMetroCities("Orange County Metro")), state: "California", country: "United States", region: "us" };
  }
  return pick(US_OTHER_CITIES);
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomToken(n: number): string {
  const c = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

// Username: `nts_` (4) + 8 alnum chars = 12 chars. Matches scripts/seed-realistic-users.ts
// so a single cleanup query (LIKE 'nts\_%' ESCAPE '\') catches both seeds.
function buildSeedUsername(): string {
  return `nts_${randomToken(8)}`;
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

async function uploadCloudinaryPhoto(sourceUrl: string, filename: string): Promise<string> {
  // Mandatory per §9.7. Throws if upload/download fails — caller skips the user.
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

async function generateOneUser(): Promise<void> {
  const home = pickHometown();
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const username = buildSeedUsername();
  // Plus-addressed under the real domain so welcome emails (sent by sendWelcomeEmail
  // in fireProductionBackgroundTasks below) route to seed@nearbytraveler.org for
  // operator monitoring. Cleanup is keyed off aura=99, not email pattern.
  const email = `seed+${username}@nearbytraveler.org`;
  const fullName = `${first} ${last}`;

  const isTraveler = Math.random() < 0.3;
  const userType = isTraveler ? "traveler" : "local";
  // Spec §0.3: real form requires ≥7 interests. Use 7-12 random.
  const interests = pickN(INTERESTS, randInt(7, 12));
  const languagesSpoken = buildLanguages(home);
  const dateOfBirth = ageBirthDate(22, 45);

  // Spec §9.2: 60% have a bio (no marker), 40% NULL to match fresh signups.
  const hasBio = Math.random() < 0.6;
  const bio = hasBio ? buildBio(home, interests) : undefined;

  // Gender drives randomuser.me portrait URL pick (no API call needed).
  const gender = Math.random() < 0.5 ? "male" : "female";
  const portraitUrl = `https://randomuser.me/api/portraits/${gender === "male" ? "men" : "women"}/${randInt(0, 99)}.jpg`;

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

  // Cloudinary upload BEFORE storage.createUser so profileImage is set on the
  // initial INSERT, matching how real signups handle the avatar field.
  // Mandatory per §9.7 — if upload throws, caller skips this user.
  const profileImage = await uploadCloudinaryPhoto(portraitUrl, `${username}-${Date.now()}.jpg`);

  // Build userData mirroring routes.ts:5644-5722 pre-processing.
  // - countriesVisited NOT pre-populated; storage.createUser auto-fills (spec §2.2)
  // - hometown / location strings built same as the route handler
  // - traveler: currentTravelCity/State/Country mirrored from destination
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

  if (isTraveler && destination) {
    userData.isCurrentlyTraveling = true;
    userData.destinationCity = destination.city;
    userData.destinationState = destination.state ?? null;
    userData.destinationCountry = destination.country;
    userData.currentTravelCity = destination.city;
    userData.currentTravelState = destination.state ?? "";
    userData.currentTravelCountry = destination.country;
    userData.travelDestination = [destination.city, destination.state, destination.country]
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

  // 8. Aura — OVERRIDE real-signup 1/2 with 99. This is the new primary
  // identification marker for seed users (real users cannot reach 99
  // organically; signup awards 1 or 2 and other actions award single digits).
  // Cleanup is now: DELETE FROM users WHERE id <> 2 AND aura = 99;
  const aura = 99;
  await storage.updateUser(user.id, { aura });

  // 9. Fire production background side-effects (welcome email, auto-connect,
  // welcome DM). INTENTIONAL: the seed+ alias routes welcome emails to the
  // operator's inbox for monitoring. Skips fanout + PWA-DM (see header docstring).
  await fireProductionBackgroundTasks(user);

  // (No backdating — daily cron uses real-time defaultNow() timestamps.)

  console.log(
    `✨ [seed-daily-users] #${user.id} @${user.username} "${fullName}" · ${userType} · ${home.city}, ${home.country}` +
    (destination ? ` → ${destination.city}, ${destination.country}` : "") +
    ` · aura=${aura}`
  );
}

// Mirrors the production setImmediate side-effects from routes.ts:6326-6651
// for one user. Keeps the seed pipeline production-equivalent (per operator
// instruction "DO NOT skip system emails for seed users — intentional for
// monitoring"). See header docstring for what's intentionally skipped.
async function fireProductionBackgroundTasks(user: any): Promise<void> {
  const NEARBYTRAV_USER_ID = 2;

  // 1. Welcome email — fires to seed+<username>@nearbytraveler.org which
  //    is plus-aliased to seed@nearbytraveler.org (operator's inbox).
  try {
    const { sendWelcomeEmail } = await import("../server/email/notificationEmails");
    const result = await sendWelcomeEmail(user.id);
    if (result?.success && !result?.skipped) {
      console.log(`  📧 welcome email queued for @${user.username}`);
    }
  } catch (err) {
    console.warn(`  ⚠️ welcome email failed for @${user.username}:`, (err as any)?.message);
  }

  // 2. Auto-connect to nearbytrav (id=2) — same insert as routes.ts:6573-6579.
  try {
    if (user.id !== NEARBYTRAV_USER_ID) {
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

  // 3. Welcome DM from nearbytrav — fires storage.sendSystemMessage path.
  try {
    const firstName = user.firstName || (user.name || user.username || "Traveler").split(" ")[0];
    const welcomeMsg =
      `Hey ${firstName}! 👋\n\n` +
      `Welcome to Nearby Traveler — you're in.\n\n` +
      `A few things to try:\n` +
      `• Add a few photos to your profile\n` +
      `• Browse who's in your city under "Discover"\n` +
      `• If you're traveling, set your destination + dates so locals can spot you\n\n` +
      `Reach out anytime if you need anything.\n— Aaron @ Nearby Traveler`;
    await storage.sendSystemMessage(NEARBYTRAV_USER_ID, user.id, welcomeMsg);
  } catch (err) {
    console.warn(`  ⚠️ welcome DM failed for @${user.username}:`, (err as any)?.message);
  }
}

export async function seedDailyUsers(opts: { count?: number } = {}): Promise<void> {
  // Default 2 per fire — see top docstring. Sequential await loop below
  // prevents Cloudinary/DB races between the two creations.
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
