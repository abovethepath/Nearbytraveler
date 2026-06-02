// scripts/dedupe-seed-photos.ts
//
// One-shot remediation: finds seed users (aura=99 or username LIKE 'nts_%')
// whose profile photo bytes are byte-identical to another seed user's, and
// swaps the duplicates for fresh AI-generated portraits from
// thispersondoesnotexist.com (TPDNE). UPDATE-only — never deletes users.
//
// Detection
// ─────────
// Cloudinary public_ids embed Date.now(), so profileImage URLs are always
// string-unique even when the underlying portrait is shared. Duplicates are
// detected by sha256-hashing the actual image bytes fetched from each
// profileImage URL and grouping users whose hashes collide.
//
// Source = TPDNE + face-api.js validation
// ────────────────────────────────────────
// TPDNE returns a fresh StyleGAN portrait on every request. Each candidate
// is validated by scripts/lib/portrait-validation.ts (adult age + gender
// match via face-api.js TinyFaceDetector + AgeGenderNet) before upload.
// Hash collision against already-seen seed photos is a separate retry layer
// on top of the validator's own retry budget.
//
// Users whose stored gender isn't "male" or "female" are skipped (the
// validator needs an expected gender; we won't guess).
//
// CLI
// ───
//   tsx scripts/dedupe-seed-photos.ts --dry-run   → print swap plan, no writes
//   tsx scripts/dedupe-seed-photos.ts             → execute swaps live
//   --limit=N  → cap the number of swaps performed (useful for first live run)

import { createHash } from "node:crypto";
import type { db as DbType } from "../server/db";

// ───────────── helpers ─────────────

const MAX_COLLISION_RETRIES = 5;

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

async function uploadBufferToCloudinary(buf: Buffer, filename: string): Promise<string> {
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
  hash: string | null; // null if download failed
}

interface SwapPlanEntry {
  user: UserHashed;
}

interface SkipEntry {
  user: UserHashed;
  reason: string;
}

// ───────────── core ─────────────

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

async function hashSeedUsers(rows: SeedUser[]): Promise<UserHashed[]> {
  console.log(`🔎 hashing ${rows.length} seed users' current profile photos...`);
  const out: UserHashed[] = [];
  const CONCURRENCY = 8;
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < rows.length) {
      const u = rows[cursor++];
      let hash: string | null = null;
      if (u.profileImage) {
        try {
          hash = await hashUrl(u.profileImage);
        } catch (err) {
          console.warn(`  ⚠️ #${u.id} @${u.username} download failed: ${(err as any)?.message}`);
        }
      }
      out.push({ ...u, hash });
    }
  }
  const tasks: Array<Promise<void>> = [];
  for (let i = 0; i < CONCURRENCY; i++) tasks.push(worker());
  await Promise.all(tasks);
  out.sort((a, b) => a.id - b.id);
  return out;
}

function planSwaps(hashed: UserHashed[]): {
  swaps: SwapPlanEntry[];
  skips: SkipEntry[];
  kept: UserHashed[];
  seenHashes: Set<string>;
} {
  const byHash = new Map<string, UserHashed[]>();
  const skips: SkipEntry[] = [];
  for (const u of hashed) {
    if (!u.hash) {
      skips.push({ user: u, reason: "current profileImage could not be downloaded" });
      continue;
    }
    const arr = byHash.get(u.hash) ?? [];
    arr.push(u);
    byHash.set(u.hash, arr);
  }

  const kept: UserHashed[] = [];
  const swaps: SwapPlanEntry[] = [];
  const seenHashes = new Set<string>();
  for (const group of byHash.values()) {
    group.sort((a, b) => a.id - b.id);
    kept.push(group[0]);
    seenHashes.add(group[0].hash!);
    for (let i = 1; i < group.length; i++) {
      const candidate = group[i];
      // Validator needs an expected gender. If we don't have one, the swap
      // can't proceed safely — list for manual handling.
      if (candidate.gender !== "male" && candidate.gender !== "female") {
        skips.push({ user: candidate, reason: `gender='${candidate.gender ?? "(null)"}' — validator needs male|female` });
        continue;
      }
      swaps.push({ user: candidate });
    }
  }
  return { swaps, skips, kept, seenHashes };
}

// ───────────── live execution ─────────────

async function applySwap(entry: SwapPlanEntry, seenHashes: Set<string>): Promise<void> {
  const { user } = entry;
  // Validator-guarded gender narrowed in planSwaps; assert for TS.
  const expectedGender = user.gender as "male" | "female";
  const { fetchAndValidateTpdne } = await import("./lib/portrait-validation.js");

  // Outer loop: TPDNE may produce a (vanishingly unlikely) hash collision
  // with an already-seen seed photo. fetchAndValidateTpdne handles its own
  // age/gender retries inside; this layer only re-rolls on dup-hash hits.
  let buf: Buffer | null = null;
  let hash = "";
  for (let attempt = 1; attempt <= MAX_COLLISION_RETRIES; attempt++) {
    const candidate = await fetchAndValidateTpdne(expectedGender, 10);
    const candidateHash = sha256(candidate);
    if (!seenHashes.has(candidateHash)) {
      buf = candidate;
      hash = candidateHash;
      break;
    }
    console.warn(`  ⚠️ #${user.id} TPDNE hash collision on attempt ${attempt}, retrying...`);
  }
  if (!buf) {
    throw new Error(`failed to get a non-colliding validated TPDNE photo after ${MAX_COLLISION_RETRIES} attempts`);
  }

  const filename = `${user.username}-${Date.now()}.jpg`;
  const newProfileImage = await uploadBufferToCloudinary(buf, filename);
  const { db, users, eq } = await getDb();
  await db.update(users).set({ profileImage: newProfileImage }).where(eq(users.id, user.id));
  seenHashes.add(hash);
  console.log(`  ✓ #${user.id} @${user.username} → fresh validated TPDNE portrait (${expectedGender})`);
}

// ───────────── reporting ─────────────

function printPlan(
  hashed: UserHashed[],
  swaps: SwapPlanEntry[],
  skips: SkipEntry[],
  kept: UserHashed[],
): void {
  console.log("");
  console.log("─".repeat(80));
  console.log(`📊 Plan summary`);
  console.log("─".repeat(80));
  console.log(`  seed users scanned        : ${hashed.length}`);
  console.log(`  unique kept (no swap)     : ${kept.length}`);
  console.log(`  duplicates → swap to TPDNE: ${swaps.length}`);
  console.log(`  skipped                   : ${skips.length}`);
  console.log("─".repeat(80));

  if (swaps.length > 0) {
    console.log("");
    console.log("→ Swaps planned:");
    for (const s of swaps) {
      console.log(
        `  #${s.user.id} @${s.user.username.padEnd(14)} aura=${String(s.user.aura ?? "-").padEnd(3)} ${s.user.gender ?? "?"}`,
      );
    }
  }
  if (skips.length > 0) {
    console.log("");
    console.log("⚠️  Skipped (require manual handling):");
    for (const s of skips) {
      console.log(`  #${s.user.id} @${s.user.username.padEnd(14)} — ${s.reason}`);
    }
  }
  console.log("");
}

// ───────────── runner ─────────────

interface RunOpts { dryRun: boolean; limit?: number }

export async function dedupeSeedPhotos(opts: RunOpts): Promise<void> {
  const { dryRun, limit } = opts;
  console.log(`🌱 [dedupe-seed-photos] ${dryRun ? "DRY RUN" : "LIVE"} — source: TPDNE`);

  const rows = await loadSeedUsers();
  console.log(`🔎 loaded ${rows.length} seed users (aura=99 OR username LIKE 'nts\\_%')`);
  const hashed = await hashSeedUsers(rows);
  const { swaps, skips, kept, seenHashes } = planSwaps(hashed);
  const swapsToRun = typeof limit === "number" ? swaps.slice(0, limit) : swaps;

  printPlan(hashed, swaps, skips, kept);

  if (dryRun) {
    console.log("=== DRY RUN — no DB writes, no Cloudinary uploads, no TPDNE fetches ===");
    return;
  }
  if (typeof limit === "number" && limit < swaps.length) {
    console.log(`(--limit=${limit} → executing first ${swapsToRun.length}/${swaps.length} swaps)`);
  }
  console.log(`🚀 executing ${swapsToRun.length} swap${swapsToRun.length === 1 ? "" : "s"} sequentially...`);
  let success = 0;
  for (const entry of swapsToRun) {
    try {
      await applySwap(entry, seenHashes);
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
