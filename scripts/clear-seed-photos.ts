// scripts/clear-seed-photos.ts
//
// Targeted remediation: sets profile_image = NULL on a specific list of
// aura=99 seed users so they fall back to the default avatar. Hard-coded
// guard `AND aura = 99` makes it impossible to null a real user's photo
// even if the caller passes the wrong id.
//
// CLI:
//   tsx scripts/clear-seed-photos.ts --ids=1,2,3 --dry-run   # preview
//   tsx scripts/clear-seed-photos.ts --ids=1,2,3             # execute

import type { db as DbType } from "../server/db";

async function getDb(): Promise<{ db: typeof DbType; users: any; and: any; eq: any; inArray: any }> {
  const { db } = await import("../server/db");
  const { users } = await import("@shared/schema");
  const { and, eq, inArray } = await import("drizzle-orm");
  return { db, users, and, eq, inArray };
}

interface Opts { ids: number[]; dryRun: boolean }

function parseArgs(): Opts {
  const argv = process.argv.slice(2);
  let dryRun = false;
  let ids: number[] = [];
  for (const a of argv) {
    if (a === "--dry-run") dryRun = true;
    else if (a.startsWith("--ids=")) {
      ids = a
        .slice(6)
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n) && n > 0);
    }
  }
  if (ids.length === 0) {
    console.error("usage: tsx scripts/clear-seed-photos.ts --ids=1,2,3 [--dry-run]");
    process.exit(1);
  }
  return { ids, dryRun };
}

async function main(): Promise<void> {
  const { ids, dryRun } = parseArgs();
  const { db, users, and, eq, inArray } = await getDb();

  // Preview: SELECT what matches both the id list AND the aura=99 guard.
  const candidates = await db
    .select({ id: users.id, username: users.username, aura: users.aura, profileImage: users.profileImage })
    .from(users)
    .where(and(inArray(users.id, ids), eq(users.aura, 99)))
    .orderBy(users.id);

  console.log(`📋 ${candidates.length} user(s) matched (id IN (${ids.join(",")}) AND aura=99):`);
  for (const u of candidates) {
    console.log(`  #${u.id} @${u.username.padEnd(14)} profileImage=${u.profileImage ?? "(null)"}`);
  }

  const matched = new Set<number>(candidates.map((u: any) => u.id));
  const unmatched = ids.filter((id) => !matched.has(id));
  if (unmatched.length > 0) {
    console.log("");
    console.log(`⚠ ${unmatched.length} id(s) requested but NOT aura=99 seed users — skipped for safety:`);
    console.log(`  ${unmatched.join(", ")}`);
  }

  if (dryRun) {
    console.log("");
    console.log("=== DRY RUN — no DB writes ===");
    return;
  }
  if (candidates.length === 0) {
    console.log("nothing to clear");
    return;
  }

  await db
    .update(users)
    .set({ profileImage: null })
    .where(and(inArray(users.id, Array.from(matched)), eq(users.aura, 99)));

  console.log("");
  console.log(`✅ cleared profileImage on ${candidates.length} user(s)`);
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
