// scripts/rephoto-all-seeds.ts
//
// MANUAL ONE-SHOT. Not imported by cron or the app build.
// ──────────────────────────────────────────────────────────
// Walks every aura=99 seed user (excluding id=2 / nearbytrav admin) and
// re-fetches their profile photo from randomuser.me using the seed's own
// `gender` column, uploads the new image to Cloudinary, and updates
// users.profile_image in place. DB `gender` is trusted as correct; only
// the photo is replaced.
//
// Rationale: prior seed runs used thispersondoesnotexist.com, which had
// no gender control. Mismatched photos accumulated. seed-daily-users.ts
// has since been switched to randomuser.me; this script back-fills
// existing rows so the whole seed cohort matches the new policy.
//
// Run (Render shell):
//   npx tsx scripts/rephoto-all-seeds.ts

import type { db as DbType } from "../server/db";

async function getDb(): Promise<{ db: typeof DbType; users: any; eq: any; sql: any; and: any; ne: any }> {
  const { db } = await import("../server/db");
  const { users } = await import("@shared/schema");
  const { eq, sql, and, ne } = await import("drizzle-orm");
  return { db, users, eq, sql, and, ne };
}

async function uploadCloudinaryPhoto(sourceUrl: string, filename: string): Promise<string> {
  const { uploadImage } = await import("../server/services/cloudinary");
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`photo download failed: ${res.status}`);
  const arr = await res.arrayBuffer();
  const buf = Buffer.from(arr);
  const { url } = await uploadImage(buf, filename);
  return url;
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface SeedRow {
  id: number;
  username: string;
  gender: string | null;
  profileImage: string | null;
}

async function loadSeeds(): Promise<SeedRow[]> {
  const { db, users, eq, and, ne } = await getDb();
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      gender: users.gender,
      profileImage: users.profileImage,
    })
    .from(users)
    .where(and(eq(users.aura, 99), ne(users.id, 2)))
    .orderBy(users.id);
  return rows as SeedRow[];
}

async function rephotoOne(u: SeedRow): Promise<{ oldUrl: string | null; newUrl: string }> {
  if (u.gender !== "male" && u.gender !== "female") {
    throw new Error(`unsupported gender='${u.gender ?? "(null)"}'`);
  }
  const portraitBucket = u.gender === "male" ? "men" : "women";
  const portraitN = randInt(0, 99);
  const sourceUrl = `https://randomuser.me/api/portraits/${portraitBucket}/${portraitN}.jpg`;
  const filename = `${u.username}-${Date.now()}.jpg`;
  const newUrl = await uploadCloudinaryPhoto(sourceUrl, filename);
  const { db, users, eq } = await getDb();
  await db.update(users).set({ profileImage: newUrl }).where(eq(users.id, u.id));
  return { oldUrl: u.profileImage, newUrl };
}

async function main(): Promise<void> {
  console.log("📸 [rephoto-all-seeds] starting — randomuser.me back-fill for aura=99 seeds (excl. id=2)");
  const rows = await loadSeeds();
  console.log(`🔎 loaded ${rows.length} seed user${rows.length === 1 ? "" : "s"}`);

  let succeeded = 0;
  const failed: Array<{ id: number; username: string; reason: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const u = rows[i];
    try {
      const { oldUrl, newUrl } = await rephotoOne(u);
      succeeded++;
      console.log(
        `  ✓ [${i + 1}/${rows.length}] #${u.id} @${u.username} gender=${u.gender} :: ${oldUrl ?? "(none)"} → ${newUrl}`,
      );
    } catch (err) {
      const reason = (err as any)?.message ?? String(err);
      failed.push({ id: u.id, username: u.username, reason });
      console.error(`  ✗ [${i + 1}/${rows.length}] #${u.id} @${u.username} gender=${u.gender ?? "?"} — FAILED: ${reason}`);
    }
    // Throttle — last iteration doesn't need the trailing pause.
    if (i < rows.length - 1) await sleep(250);
  }

  console.log("");
  console.log("─".repeat(80));
  console.log("📊 Summary");
  console.log("─".repeat(80));
  console.log(`  processed : ${rows.length}`);
  console.log(`  succeeded : ${succeeded}`);
  console.log(`  failed    : ${failed.length}`);
  if (failed.length > 0) {
    console.log("");
    console.log("Failed users:");
    for (const f of failed) {
      console.log(`  #${f.id} @${f.username} — ${f.reason}`);
    }
  }
  console.log("");
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
