// scripts/fix-seed-photos.ts
//
// MANUAL ONLY. NOT IMPORTED BY ANY CRON OR THE APP BUILD.
// ────────────────────────────────────────────────────────
// Scans seed users (aura=99 or username LIKE 'nts_%') and validates their
// current profile photo for adult age + gender match via face-api.js.
// In --fix mode, replaces each failing user's photo with a fresh validated
// TPDNE portrait. Never deletes a user; UPDATE-only.
//
// SETUP — run once per Render shell session before invoking this script:
//
//   npm install --no-save @vladmandic/face-api @tensorflow/tfjs
//
// (These deps are intentionally NOT in package.json because tfjs broke
// the production `npm ci` build. --no-save keeps them out of the lockfile.)
//
// CLI:
//   tsx scripts/fix-seed-photos.ts --scan                              # walk all seed users, report invalid
//   tsx scripts/fix-seed-photos.ts --scan --ids=1,2,3                  # limit scan to specific IDs
//   tsx scripts/fix-seed-photos.ts --fix                               # walk all, swap invalid for validated TPDNE
//   tsx scripts/fix-seed-photos.ts --fix --ids=1,2,3                   # only fix specific IDs
//   tsx scripts/fix-seed-photos.ts --fix --dry-run                     # preview what fix would do
//   tsx scripts/fix-seed-photos.ts --fix --limit=N                     # cap number of swaps (first live run safety)

import { createHash } from "node:crypto";
import type { db as DbType } from "../server/db";

async function getDb(): Promise<{ db: typeof DbType; users: any; eq: any; sql: any; inArray: any; and: any }> {
  const { db } = await import("../server/db");
  const { users } = await import("@shared/schema");
  const { eq, sql, inArray, and } = await import("drizzle-orm");
  return { db, users, eq, sql, inArray, and };
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

interface ScanResult {
  user: SeedUser;
  status: "valid" | "invalid" | "skipped";
  reason?: string;          // populated for invalid + skipped
  detectedGender?: string;
  detectedAge?: number;
}

// ───────────── core ─────────────

async function loadSeedUsers(idFilter: number[] | null): Promise<SeedUser[]> {
  const { db, users, sql, inArray, and } = await getDb();
  const seedWhere = sql`(${users.aura} = 99 OR ${users.username} LIKE 'nts\\_%' ESCAPE '\\')`;
  const where = idFilter && idFilter.length > 0
    ? and(seedWhere, inArray(users.id, idFilter))
    : seedWhere;
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      gender: users.gender,
      aura: users.aura,
      profileImage: users.profileImage,
    })
    .from(users)
    .where(where)
    .orderBy(users.id);
  return rows as SeedUser[];
}

async function scanOne(u: SeedUser, validator: any): Promise<ScanResult> {
  if (!u.profileImage) {
    return { user: u, status: "skipped", reason: "no profileImage" };
  }
  if (u.gender !== "male" && u.gender !== "female") {
    return { user: u, status: "skipped", reason: `gender='${u.gender ?? "(null)"}' — can't validate without expected gender` };
  }
  let buf: Buffer;
  try {
    buf = await fetchBytes(u.profileImage);
  } catch (err) {
    return { user: u, status: "skipped", reason: `download failed: ${(err as any)?.message}` };
  }
  const v = await validator.validatePortrait(buf, u.gender as "male" | "female");
  if (v.ok) return { user: u, status: "valid", detectedGender: v.gender, detectedAge: v.age };
  return { user: u, status: "invalid", reason: v.reason, detectedGender: v.gender, detectedAge: v.age };
}

async function applyFix(user: SeedUser, seenHashes: Set<string>, validator: any): Promise<void> {
  const expectedGender = user.gender as "male" | "female";
  // fetchAndValidateTpdne already retries internally for age/gender; outer
  // loop only re-rolls on the rare case the new photo collides with an
  // existing seed-photo hash.
  const MAX_COLLISION_RETRIES = 5;
  let buf: Buffer | null = null;
  let hash = "";
  for (let attempt = 1; attempt <= MAX_COLLISION_RETRIES; attempt++) {
    const candidate = await validator.fetchAndValidateTpdne(expectedGender, 10);
    const candidateHash = sha256(candidate);
    if (!seenHashes.has(candidateHash)) {
      buf = candidate;
      hash = candidateHash;
      break;
    }
    console.warn(`  ⚠️ #${user.id} hash collision attempt ${attempt}, retrying...`);
  }
  if (!buf) throw new Error(`exhausted ${MAX_COLLISION_RETRIES} non-collision attempts`);
  const filename = `${user.username}-${Date.now()}.jpg`;
  const newUrl = await uploadBufferToCloudinary(buf, filename);
  const { db, users, eq } = await getDb();
  await db.update(users).set({ profileImage: newUrl }).where(eq(users.id, user.id));
  seenHashes.add(hash);
  console.log(`  ✓ #${user.id} @${user.username} → fresh validated portrait (${expectedGender})`);
}

// ───────────── reporting ─────────────

function printScanReport(results: ScanResult[]): void {
  const valid = results.filter((r) => r.status === "valid");
  const invalid = results.filter((r) => r.status === "invalid");
  const skipped = results.filter((r) => r.status === "skipped");
  console.log("");
  console.log("─".repeat(80));
  console.log(`📊 Scan summary`);
  console.log("─".repeat(80));
  console.log(`  total scanned : ${results.length}`);
  console.log(`  valid         : ${valid.length}`);
  console.log(`  invalid       : ${invalid.length}`);
  console.log(`  skipped       : ${skipped.length}`);
  console.log("─".repeat(80));
  if (invalid.length > 0) {
    console.log("");
    console.log("❌ Invalid (would be replaced by --fix):");
    for (const r of invalid) {
      const det = r.detectedGender || r.detectedAge != null
        ? `  [detected gender=${r.detectedGender ?? "?"} age=${r.detectedAge ?? "?"}]`
        : "";
      console.log(`  #${r.user.id} @${r.user.username.padEnd(14)} ${r.user.gender ?? "?"}  — ${r.reason}${det}`);
    }
  }
  if (skipped.length > 0) {
    console.log("");
    console.log("⚠ Skipped (require manual handling):");
    for (const r of skipped) {
      console.log(`  #${r.user.id} @${r.user.username.padEnd(14)} — ${r.reason}`);
    }
  }
  console.log("");
}

// ───────────── runner ─────────────

interface Opts {
  mode: "scan" | "fix";
  ids: number[] | null;
  dryRun: boolean;
  limit?: number;
}

function parseArgs(): Opts {
  const argv = process.argv.slice(2);
  let mode: "scan" | "fix" | null = null;
  let ids: number[] | null = null;
  let dryRun = false;
  let limit: number | undefined;
  for (const a of argv) {
    if (a === "--scan") mode = "scan";
    else if (a === "--fix") mode = "fix";
    else if (a === "--dry-run") dryRun = true;
    else if (a.startsWith("--ids=")) {
      ids = a.slice(6).split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n) && n > 0);
    }
    else if (a.startsWith("--limit=")) {
      const n = parseInt(a.slice(8), 10);
      if (Number.isFinite(n) && n > 0) limit = n;
    }
  }
  if (!mode) {
    console.error("usage: tsx scripts/fix-seed-photos.ts --scan|--fix [--ids=1,2,3] [--dry-run] [--limit=N]");
    process.exit(1);
  }
  return { mode, ids, dryRun, limit };
}

async function main(): Promise<void> {
  const opts = parseArgs();
  console.log(`🌱 [fix-seed-photos] mode=${opts.mode}${opts.dryRun ? " (dry-run)" : ""}${opts.ids ? ` ids=${opts.ids.join(",")}` : ""}`);

  // Lazy-import the validator (which lazy-imports face-api + tfjs) so a
  // usage error doesn't pay the model-load cost.
  const validator: any = await import("./lib/portrait-validation.js");

  const rows = await loadSeedUsers(opts.ids);
  console.log(`🔎 loaded ${rows.length} seed user${rows.length === 1 ? "" : "s"}`);

  console.log(`🔎 validating current photos...`);
  const results: ScanResult[] = [];
  // Sequential — face-api eats CPU and we don't want to thrash.
  for (const u of rows) {
    const r = await scanOne(u, validator);
    results.push(r);
  }
  printScanReport(results);

  if (opts.mode === "scan") return;

  // --fix
  const invalid = results.filter((r) => r.status === "invalid").map((r) => r.user);
  const toFix = typeof opts.limit === "number" ? invalid.slice(0, opts.limit) : invalid;
  if (toFix.length === 0) {
    console.log("nothing to fix — all valid (or skipped).");
    return;
  }
  if (opts.dryRun) {
    console.log(`=== DRY RUN — would fix ${toFix.length} user${toFix.length === 1 ? "" : "s"}, no DB writes ===`);
    return;
  }
  if (typeof opts.limit === "number" && opts.limit < invalid.length) {
    console.log(`(--limit=${opts.limit} → fixing first ${toFix.length}/${invalid.length} invalid users)`);
  }

  // Seed the "in-use" hash set with hashes of all currently-valid users so
  // we never replace someone's bad photo with a copy of a good user's photo.
  const seenHashes = new Set<string>();
  for (const r of results) {
    if (r.status === "valid" && r.user.profileImage) {
      try {
        const buf = await fetchBytes(r.user.profileImage);
        seenHashes.add(sha256(buf));
      } catch { /* best-effort */ }
    }
  }

  console.log(`🚀 fixing ${toFix.length} user${toFix.length === 1 ? "" : "s"} sequentially...`);
  let success = 0;
  for (const u of toFix) {
    try {
      await applyFix(u, seenHashes, validator);
      success++;
    } catch (err) {
      console.error(`  ✗ #${u.id} @${u.username} failed: ${(err as any)?.message}`);
    }
  }
  console.log(`✅ done — ${success}/${toFix.length} swaps applied`);
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
