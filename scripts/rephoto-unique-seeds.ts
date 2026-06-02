// scripts/rephoto-unique-seeds.ts
//
// MANUAL ONE-SHOT. Not imported by cron or the app build.
// ──────────────────────────────────────────────────────────
// Replacement pass for rephoto-all-seeds.ts. Same data source
// (randomuser.me) and same gender-aware policy, but assigns each seed a
// UNIQUE portrait index per gender so no two seeds share a source face.
// randomuser.me's pool is exactly 100 male + 100 female portraits, so
// the script can uniquely photo at most 100 seeds per gender. Anything
// past that — the "overflow" — has its profile_image set to NULL
// rather than reusing an index. Overflow users keep their account and
// every other field; only the photo is blanked.
//
// DB `gender` is trusted as correct. This script only writes to
// users.profile_image — never deletes a row, never touches any other
// column.
//
// Run (Render shell):
//   npx tsx scripts/rephoto-unique-seeds.ts

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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// Fisher–Yates shuffle of [0..99].
function shuffledIndexes(): number[] {
  const a = Array.from({ length: 100 }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface SeedRow {
  id: number;
  username: string;
  gender: string | null;
  profileImage: string | null;
}

type Plan =
  | { kind: "photo"; user: SeedRow; bucket: "men" | "women"; index: number }
  | { kind: "blank"; user: SeedRow; reason: "overflow" | "unsupported-gender" };

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

function buildPlan(rows: SeedRow[]): Plan[] {
  const males = rows.filter((u) => u.gender === "male");
  const females = rows.filter((u) => u.gender === "female");
  const others = rows.filter((u) => u.gender !== "male" && u.gender !== "female");

  const maleIdx = shuffledIndexes();
  const femaleIdx = shuffledIndexes();

  const assignments = new Map<number, Plan>();

  males.forEach((u, i) => {
    if (i < 100) {
      assignments.set(u.id, { kind: "photo", user: u, bucket: "men", index: maleIdx[i] });
    } else {
      assignments.set(u.id, { kind: "blank", user: u, reason: "overflow" });
    }
  });
  females.forEach((u, i) => {
    if (i < 100) {
      assignments.set(u.id, { kind: "photo", user: u, bucket: "women", index: femaleIdx[i] });
    } else {
      assignments.set(u.id, { kind: "blank", user: u, reason: "overflow" });
    }
  });
  others.forEach((u) => {
    assignments.set(u.id, { kind: "blank", user: u, reason: "unsupported-gender" });
  });

  // Walk in the original id-asc order so logs are easy to follow.
  return rows.map((u) => assignments.get(u.id)!);
}

async function applyPhoto(p: Extract<Plan, { kind: "photo" }>): Promise<string> {
  const sourceUrl = `https://randomuser.me/api/portraits/${p.bucket}/${p.index}.jpg`;
  const filename = `${p.user.username}-${Date.now()}.jpg`;
  const newUrl = await uploadCloudinaryPhoto(sourceUrl, filename);
  const { db, users, eq } = await getDb();
  await db.update(users).set({ profileImage: newUrl }).where(eq(users.id, p.user.id));
  return newUrl;
}

async function applyBlank(p: Extract<Plan, { kind: "blank" }>): Promise<void> {
  const { db, users, eq } = await getDb();
  await db.update(users).set({ profileImage: null }).where(eq(users.id, p.user.id));
}

async function main(): Promise<void> {
  console.log("📸 [rephoto-unique-seeds] starting — unique per-gender portrait assignment for aura=99 seeds (excl. id=2)");
  const rows = await loadSeeds();
  const maleCount = rows.filter((u) => u.gender === "male").length;
  const femaleCount = rows.filter((u) => u.gender === "female").length;
  const otherCount = rows.length - maleCount - femaleCount;
  console.log(`🔎 loaded ${rows.length} seed user${rows.length === 1 ? "" : "s"}  (male=${maleCount}, female=${femaleCount}, other/null=${otherCount})`);

  const plan = buildPlan(rows);
  const plannedPhotos = plan.filter((p) => p.kind === "photo").length;
  const plannedBlanks = plan.filter((p) => p.kind === "blank").length;
  console.log(`📋 plan: photograph ${plannedPhotos}, blank ${plannedBlanks}`);

  let photographed = 0;
  let blanked = 0;
  const failed: Array<{ id: number; username: string; reason: string }> = [];

  for (let i = 0; i < plan.length; i++) {
    const p = plan[i];
    const u = p.user;
    const tag = `[${i + 1}/${plan.length}] #${u.id} @${u.username} gender=${u.gender ?? "?"}`;
    try {
      if (p.kind === "photo") {
        const newUrl = await applyPhoto(p);
        photographed++;
        console.log(`  ✓ ${tag} :: ${p.bucket}/${p.index}.jpg → ${newUrl}`);
        // Throttle only after Cloudinary uploads. Skip the trailing pause
        // on the final iteration.
        if (i < plan.length - 1) await sleep(250);
      } else {
        await applyBlank(p);
        blanked++;
        console.log(`  ◌ ${tag} :: BLANKED (${p.reason})`);
      }
    } catch (err) {
      const reason = (err as any)?.message ?? String(err);
      failed.push({ id: u.id, username: u.username, reason });
      console.error(`  ✗ ${tag} — FAILED: ${reason}`);
    }
  }

  console.log("");
  console.log("─".repeat(80));
  console.log("📊 Summary");
  console.log("─".repeat(80));
  console.log(`  total         : ${plan.length}`);
  console.log(`  photographed  : ${photographed}`);
  console.log(`  blanked       : ${blanked}`);
  console.log(`  failed        : ${failed.length}`);
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
