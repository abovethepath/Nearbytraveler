// scripts/dedupe-seed-photos.ts
//
// One-shot remediation: finds seed users whose profile photos visually
// duplicate another seed user's, and swaps the duplicates for fresh
// portraits from the SAME bucket. Never deletes users — UPDATE only.
//
// Detection
// ─────────
// Cloudinary public_ids embed Date.now(), so users.profileImage URLs are
// always string-unique even when the underlying randomuser.me portrait is
// shared. Duplicates are detected by sha256-hashing the actual image bytes
// fetched from each profileImage URL and grouping users by hash.
//
// Bucket policy (no cross-bucket fallback — per user instruction)
// ───────────────────────────────────────────────────────────────
// Each randomuser.me index 0..99 belongs to exactly one ethnic bucket in
// seed-daily-users.ts. When swapping an aura=99 user's photo, we only pick
// indices from THAT user's bucket. If the bucket's pool (minus indices
// already in use by other seed users in the same gender) is empty, we skip
// the user and list them in the final report for manual handling.
//
// nts_% users (seed-realistic-users.ts) were not bucket-constrained at
// creation — they pull from the full randomuser.me API. For dedupe purposes
// we use the full 0..99 pool for them; they are NOT subject to bucket exhaustion.
//
// A user whose current photo's hash matches none of the 200 randomuser.me
// portraits is assumed to have uploaded a custom photo and is left alone.
//
// CLI
// ───
//   tsx scripts/dedupe-seed-photos.ts --dry-run   → print swap plan, no writes
//   tsx scripts/dedupe-seed-photos.ts             → execute swaps live
//   --limit=N  → cap the number of swaps performed (useful for first live run)
//
// BUCKET_INDEX_RANGES must stay in sync with the photoIndicesMen/Women
// declarations in scripts/seed-daily-users.ts. If the bucket index ranges
// change there, update them here too.

import { createHash } from "node:crypto";
import type { db as DbType } from "../server/db";

// ───────────── bucket → randomuser.me index ranges ─────────────
// Mirrors scripts/seed-daily-users.ts (lines ~197 onward).

interface BucketRange {
  key: string;
  men: [number, number];   // inclusive
  women: [number, number]; // inclusive
}

const BUCKETS: BucketRange[] = [
  { key: "white-american",  men: [0, 19],  women: [0, 19] },
  { key: "white-european",  men: [20, 39], women: [20, 39] },
  { key: "latin-american",  men: [40, 54], women: [40, 54] },
  { key: "asian",           men: [55, 69], women: [55, 69] },
  { key: "white-au-nz",     men: [70, 79], women: [70, 79] },
  { key: "middle-eastern",  men: [80, 89], women: [80, 89] },
  { key: "black-american",  men: [90, 94], women: [90, 94] },
  { key: "other-mixed",     men: [95, 99], women: [95, 99] },
];

type Gender = "men" | "women";

function bucketForIndex(gender: Gender, idx: number): BucketRange | null {
  for (const b of BUCKETS) {
    const [lo, hi] = gender === "men" ? b.men : b.women;
    if (idx >= lo && idx <= hi) return b;
  }
  return null;
}

function indicesInBucket(bucket: BucketRange, gender: Gender): number[] {
  const [lo, hi] = gender === "men" ? bucket.men : bucket.women;
  const out: number[] = [];
  for (let i = lo; i <= hi; i++) out.push(i);
  return out;
}

// ───────────── helpers ─────────────

const RU_BASE = "https://randomuser.me/api/portraits";

function ruUrl(gender: Gender, idx: number): string {
  return `${RU_BASE}/${gender}/${idx}.jpg`;
}

async function fetchBytes(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

async function hashUrl(url: string): Promise<string> {
  return sha256(await fetchBytes(url));
}

// ───────────── lazy imports (live mode) ─────────────

async function getDb(): Promise<{ db: typeof DbType; users: any; eq: any; sql: any }> {
  const { db } = await import("../server/db");
  const { users } = await import("@shared/schema");
  const { eq, sql } = await import("drizzle-orm");
  return { db, users, eq, sql };
}

async function uploadCloudinaryPhoto(sourceUrl: string, filename: string): Promise<string> {
  const buf = await fetchBytes(sourceUrl);
  const { uploadImage } = await import("../server/services/cloudinary");
  const { url } = await uploadImage(buf, filename);
  return url;
}

// ───────────── types ─────────────

interface SeedUser {
  id: number;
  username: string;
  gender: string | null;
  aura: number | null;
  profileImage: string | null;
}

interface UserHashed extends SeedUser {
  hash: string | null;        // null if download failed
  sourceIdx: number | null;   // 0..99 if current photo matches a randomuser.me portrait
  bucket: BucketRange | null; // resolved bucket (aura=99 → from sourceIdx; nts_% → null = full pool)
}

// ───────────── core ─────────────

async function buildRandomUserIndex(): Promise<{
  indexByHash: Map<string, { gender: Gender; idx: number }>;
}> {
  console.log("🔎 hashing all 200 randomuser.me portraits (men 0..99 + women 0..99)...");
  const indexByHash = new Map<string, { gender: Gender; idx: number }>();

  const tasks: Array<Promise<void>> = [];
  const CONCURRENCY = 10;
  let active = 0;
  let cursor = 0;
  const jobs: Array<{ gender: Gender; idx: number }> = [];
  for (const g of ["men", "women"] as Gender[]) {
    for (let i = 0; i <= 99; i++) jobs.push({ gender: g, idx: i });
  }

  async function worker(): Promise<void> {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      try {
        const h = await hashUrl(ruUrl(job.gender, job.idx));
        // First-writer-wins if two indices coincidentally hash identically.
        if (!indexByHash.has(h)) indexByHash.set(h, job);
      } catch (err) {
        console.warn(`  ⚠️ failed to hash ${job.gender}/${job.idx}: ${(err as any)?.message}`);
      }
    }
  }
  for (let i = 0; i < CONCURRENCY; i++) tasks.push(worker());
  await Promise.all(tasks);
  console.log(`  ✓ indexed ${indexByHash.size} unique portraits`);
  return { indexByHash };
}

async function loadSeedUsers(): Promise<SeedUser[]> {
  const { db, users, sql } = await getDb();
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      gender: users.gender,
      aura: users.aura,
      profileImage: users.profileImage,
    })
    .from(users)
    .where(sql`${users.aura} = 99 OR ${users.username} LIKE 'nts\\_%' ESCAPE '\\'`)
    .orderBy(users.id);
  return rows as SeedUser[];
}

async function hashSeedUsers(
  rows: SeedUser[],
  indexByHash: Map<string, { gender: Gender; idx: number }>,
): Promise<UserHashed[]> {
  console.log(`🔎 hashing ${rows.length} seed users' current profile photos...`);
  const out: UserHashed[] = [];
  const CONCURRENCY = 8;
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < rows.length) {
      const u = rows[cursor++];
      let hash: string | null = null;
      let sourceIdx: number | null = null;
      let bucket: BucketRange | null = null;
      if (u.profileImage) {
        try {
          hash = await hashUrl(u.profileImage);
          const lookup = indexByHash.get(hash);
          if (lookup) {
            sourceIdx = lookup.idx;
            // aura=99 users → constrain to their original bucket.
            // nts_% users → no bucket (use full pool).
            if (u.aura === 99) bucket = bucketForIndex(lookup.gender, lookup.idx);
          }
        } catch (err) {
          console.warn(`  ⚠️ #${u.id} @${u.username} download failed: ${(err as any)?.message}`);
        }
      }
      out.push({ ...u, hash, sourceIdx, bucket });
    }
  }
  const tasks: Array<Promise<void>> = [];
  for (let i = 0; i < CONCURRENCY; i++) tasks.push(worker());
  await Promise.all(tasks);
  // Preserve id order.
  out.sort((a, b) => a.id - b.id);
  return out;
}

interface SwapPlanEntry {
  user: UserHashed;
  reason: "duplicate";
  newGender: Gender;
  newIdx: number;
  newSourceUrl: string;
}

interface SkipEntry {
  user: UserHashed;
  reason: string;
}

function planSwaps(
  hashed: UserHashed[],
): { swaps: SwapPlanEntry[]; skips: SkipEntry[]; kept: UserHashed[] } {
  // Group by hash to find duplicate clusters.
  const byHash = new Map<string, UserHashed[]>();
  const noHash: UserHashed[] = [];
  for (const u of hashed) {
    if (!u.hash) { noHash.push(u); continue; }
    const arr = byHash.get(u.hash) ?? [];
    arr.push(u);
    byHash.set(u.hash, arr);
  }

  const kept: UserHashed[] = [];
  const toSwap: UserHashed[] = [];
  for (const group of byHash.values()) {
    if (group.length === 1) {
      kept.push(group[0]);
      continue;
    }
    // Keep oldest (lowest id), swap the rest.
    group.sort((a, b) => a.id - b.id);
    kept.push(group[0]);
    for (let i = 1; i < group.length; i++) toSwap.push(group[i]);
  }

  // Track in-use indices (men/women separately) across ALL kept seed users.
  // Format: key "men:42", value true.
  const inUse = new Set<string>();
  for (const u of kept) {
    if (u.sourceIdx == null) continue;
    const g: Gender = (u.gender === "male" ? "men" : u.gender === "female" ? "women" : null) as Gender | null ?? null as any;
    if (!g) continue;
    inUse.add(`${g}:${u.sourceIdx}`);
  }

  const swaps: SwapPlanEntry[] = [];
  const skips: SkipEntry[] = [];

  for (const u of toSwap) {
    const g: Gender | null = u.gender === "male" ? "men" : u.gender === "female" ? "women" : null;
    if (!g) {
      skips.push({ user: u, reason: `unknown gender '${u.gender}' — cannot pick replacement` });
      continue;
    }
    if (u.aura === 99 && !u.bucket) {
      // aura=99 user but current photo doesn't match any known randomuser.me
      // index → can't infer bucket → custom photo → leave alone.
      skips.push({ user: u, reason: "aura=99 user with non-randomuser.me photo (likely custom upload)" });
      continue;
    }

    // Build candidate index pool.
    let candidates: number[];
    if (u.bucket) {
      candidates = indicesInBucket(u.bucket, g).filter((i) => !inUse.has(`${g}:${i}`));
    } else {
      // nts_% user — full 0..99 pool minus in-use.
      candidates = [];
      for (let i = 0; i <= 99; i++) if (!inUse.has(`${g}:${i}`)) candidates.push(i);
    }
    if (candidates.length === 0) {
      const ctx = u.bucket ? `bucket '${u.bucket.key}' (${g})` : `full ${g} pool`;
      skips.push({ user: u, reason: `${ctx} exhausted — no unused indices available` });
      continue;
    }
    // Pick a random unused index from the bucket for variety.
    const newIdx = candidates[Math.floor(Math.random() * candidates.length)];
    swaps.push({
      user: u,
      reason: "duplicate",
      newGender: g,
      newIdx,
      newSourceUrl: ruUrl(g, newIdx),
    });
    inUse.add(`${g}:${newIdx}`);
  }

  return { swaps, skips, kept };
}

// ───────────── live execution ─────────────

async function applySwap(entry: SwapPlanEntry): Promise<void> {
  const { user, newGender, newIdx, newSourceUrl } = entry;
  const filename = `${user.username}-${Date.now()}.jpg`;
  const newProfileImage = await uploadCloudinaryPhoto(newSourceUrl, filename);
  const { db, users, eq } = await getDb();
  await db.update(users).set({ profileImage: newProfileImage }).where(eq(users.id, user.id));
  console.log(
    `  ✓ #${user.id} @${user.username} → ${newGender}/${newIdx} (bucket ${entry.user.bucket?.key ?? "—"})`,
  );
}

// ───────────── reporting ─────────────

function printPlan(
  hashed: UserHashed[],
  swaps: SwapPlanEntry[],
  skips: SkipEntry[],
  kept: UserHashed[],
): void {
  const downloadFailed = hashed.filter((u) => !u.hash).length;
  const customPhoto = hashed.filter((u) => u.hash && u.sourceIdx == null).length;
  console.log("");
  console.log("─".repeat(80));
  console.log(`📊 Plan summary`);
  console.log("─".repeat(80));
  console.log(`  seed users scanned        : ${hashed.length}`);
  console.log(`  download failures (skipped): ${downloadFailed}`);
  console.log(`  custom photos (left alone) : ${customPhoto}`);
  console.log(`  unique kept (no swap)      : ${kept.length}`);
  console.log(`  duplicates → swap          : ${swaps.length}`);
  console.log(`  duplicates → skip          : ${skips.length}`);
  console.log("─".repeat(80));

  if (swaps.length > 0) {
    console.log("");
    console.log("→ Swaps planned:");
    for (const s of swaps) {
      const ctx = s.user.bucket ? `bucket=${s.user.bucket.key}` : `pool=full (nts_)`;
      console.log(
        `  #${s.user.id} @${s.user.username.padEnd(14)} ${s.user.gender ?? "?"}  ${ctx}  ` +
        `→ ${s.newGender}/${s.newIdx}`,
      );
    }
  }
  if (skips.length > 0) {
    console.log("");
    console.log("⚠️  Skipped (require manual handling):");
    for (const s of skips) {
      console.log(`  #${s.user.id} @${s.user.username.padEnd(14)} aura=${s.user.aura ?? "?"}  ${s.user.gender ?? "?"}  — ${s.reason}`);
    }
  }
  console.log("");
}

// ───────────── runner ─────────────

interface RunOpts { dryRun: boolean; limit?: number }

export async function dedupeSeedPhotos(opts: RunOpts): Promise<void> {
  const { dryRun, limit } = opts;
  console.log(`🌱 [dedupe-seed-photos] ${dryRun ? "DRY RUN" : "LIVE"}`);

  const { indexByHash } = await buildRandomUserIndex();
  const rows = await loadSeedUsers();
  console.log(`🔎 loaded ${rows.length} seed users (aura=99 OR username LIKE 'nts\\_%')`);
  const hashed = await hashSeedUsers(rows, indexByHash);
  const { swaps, skips, kept } = planSwaps(hashed);
  const swapsToRun = typeof limit === "number" ? swaps.slice(0, limit) : swaps;

  printPlan(hashed, swaps, skips, kept);

  if (dryRun) {
    console.log("=== DRY RUN — no DB writes, no Cloudinary uploads ===");
    return;
  }
  if (typeof limit === "number" && limit < swaps.length) {
    console.log(`(--limit=${limit} → executing first ${swapsToRun.length}/${swaps.length} swaps)`);
  }
  console.log(`🚀 executing ${swapsToRun.length} swap${swapsToRun.length === 1 ? "" : "s"} sequentially...`);
  let success = 0;
  for (const entry of swapsToRun) {
    try {
      await applySwap(entry);
      success++;
    } catch (err) {
      console.error(`  ✗ #${entry.user.id} @${entry.user.username} failed: ${(err as any)?.message}`);
    }
  }
  console.log(`✅ done — ${success}/${swapsToRun.length} swaps applied`);
}

// ───────────── CLI ─────────────

function parseArgs(): RunOpts {
  const args = process.argv.slice(2);
  let dryRun = false;
  let limit: number | undefined;
  for (const a of args) {
    if (a === "--dry-run") dryRun = true;
    else if (a.startsWith("--limit=")) {
      const n = parseInt(a.slice(8), 10);
      if (Number.isFinite(n) && n > 0) limit = n;
    }
  }
  return { dryRun, limit };
}

const isMain = (() => {
  try { return import.meta.url.endsWith((process.argv[1] || "").replace(/\\/g, "/").split("/").pop() || ""); } catch { return false; }
})();
if (isMain) {
  dedupeSeedPhotos(parseArgs())
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}
