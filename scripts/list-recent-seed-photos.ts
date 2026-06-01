// scripts/list-recent-seed-photos.ts
//
// Throwaway: lists aura=99 seed users whose profileImage was uploaded in the
// last N hours (default 2). Reads the upload time from the URL itself —
//   - primary signal: public_id suffix "-<13-digit ms>.jpg" (set by all our
//     seed/dedupe scripts in `${username}-${Date.now()}.jpg`)
//   - fallback:      Cloudinary "/v<10-digit s>/" version segment
//
// Output is a markdown-style list with the profileImage URL so you can
// eyeball each one in a browser and tag the child/baby faces by hand.
//
// CLI:
//   tsx scripts/list-recent-seed-photos.ts            # last 2h
//   tsx scripts/list-recent-seed-photos.ts --hours=N  # last N hours

import type { db as DbType } from "../server/db";

async function getDb(): Promise<{ db: typeof DbType; users: any; sql: any; eq: any }> {
  const { db } = await import("../server/db");
  const { users } = await import("@shared/schema");
  const { sql, eq } = await import("drizzle-orm");
  return { db, users, sql, eq };
}

/** Returns the upload time in ms, or null if no signal is present in the URL. */
function uploadTimeMs(url: string): number | null {
  const m = url.match(/-(\d{13})\.(?:jpg|jpeg|png|webp)(?:$|\?)/i);
  if (m) return parseInt(m[1], 10);
  const v = url.match(/\/v(\d{10})\//);
  if (v) return parseInt(v[1], 10) * 1000;
  return null;
}

async function main(): Promise<void> {
  let hours = 2;
  for (const a of process.argv.slice(2)) {
    if (a.startsWith("--hours=")) {
      const n = parseFloat(a.slice(8));
      if (Number.isFinite(n) && n > 0) hours = n;
    }
  }

  const { db, users, eq } = await getDb();
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      gender: users.gender,
      profileImage: users.profileImage,
    })
    .from(users)
    .where(eq(users.aura, 99))
    .orderBy(users.id);

  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const recent: Array<{ id: number; username: string; gender: string | null; profileImage: string; uploadedAt: Date }> = [];
  const unparsable: Array<{ id: number; username: string; profileImage: string }> = [];

  for (const u of rows) {
    if (!u.profileImage) continue;
    const ts = uploadTimeMs(u.profileImage);
    if (ts === null) {
      unparsable.push({ id: u.id, username: u.username, profileImage: u.profileImage });
      continue;
    }
    if (ts >= cutoff) {
      recent.push({
        id: u.id,
        username: u.username,
        gender: u.gender ?? null,
        profileImage: u.profileImage,
        uploadedAt: new Date(ts),
      });
    }
  }
  recent.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

  console.log(`🔎 aura=99 seed users with profileImage uploaded in the last ${hours}h`);
  console.log(`   (signal: URL-embedded timestamp; scanned ${rows.length} aura=99 users)\n`);
  if (recent.length === 0) {
    console.log("  (none)\n");
  } else {
    for (const r of recent) {
      console.log(`  #${r.id} @${r.username.padEnd(14)} ${r.gender ?? "?"}  ${r.uploadedAt.toISOString()}`);
      console.log(`     ${r.profileImage}\n`);
    }
    console.log(`${recent.length} user${recent.length === 1 ? "" : "s"} listed.\n`);
  }

  if (unparsable.length > 0) {
    console.log(`⚠ ${unparsable.length} aura=99 user${unparsable.length === 1 ? "" : "s"} had a profileImage URL with no parsable upload time:`);
    for (const u of unparsable.slice(0, 10)) {
      console.log(`  #${u.id} @${u.username}: ${u.profileImage}`);
    }
    if (unparsable.length > 10) console.log(`  (... ${unparsable.length - 10} more)\n`);
  }
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
