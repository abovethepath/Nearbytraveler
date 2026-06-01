// scripts/diag-photo-dupe.ts
//
// Throwaway diagnostic: given two usernames, prints both users' photo
// fingerprints (sha256 of bytes + perceptual dHash) so we can tell whether
// dedupe-seed-photos.ts is missing them because (a) Cloudinary re-encoded
// byte-different copies of the same source, or (b) they are not in the seed
// scan set at all, or (c) one user has a custom photo.
//
// CLI:
//   tsx scripts/diag-photo-dupe.ts                       # defaults: yusufk + tomasbaires
//   tsx scripts/diag-photo-dupe.ts <username1> <username2>
//
// What to look for in the output:
//   - sha256 matches → current dedupe SHOULD have caught them; bug elsewhere
//   - sha256 differs, dHash Hamming distance ≤10 → Cloudinary re-encode; switch dedupe to dHash
//   - dHash distance ≥20 → photos really are different, not a dedupe miss
//   - one user not in seed scan (aura != 99 AND username NOT LIKE 'nts_%')
//     → dedupe never considered them; they need a manual swap

import { createHash } from "node:crypto";
import sharp from "sharp";
import type { db as DbType } from "../server/db";

async function getDb(): Promise<{ db: typeof DbType; users: any; eq: any; or: any }> {
  const { db } = await import("../server/db");
  const { users } = await import("@shared/schema");
  const { eq, or } = await import("drizzle-orm");
  return { db, users, eq, or };
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

/** dHash: resize to 9x8 grayscale, compare adjacent horizontal pixels.
 *  Returns 64-bit hash as hex. Hamming distance under ~10 = visually same. */
async function dhash(buf: Buffer): Promise<string> {
  const { data } = await sharp(buf)
    .greyscale()
    .resize(9, 8, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let bits = "";
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = data[y * 9 + x];
      const right = data[y * 9 + x + 1];
      bits += left > right ? "1" : "0";
    }
  }
  let hex = "";
  for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  return hex;
}

function hammingHex(a: string, b: string): number {
  if (a.length !== b.length) return Math.max(a.length, b.length) * 4;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    const xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    // popcount 4-bit
    dist += [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4][xor];
  }
  return dist;
}

interface UserFingerprint {
  found: boolean;
  id?: number;
  username: string;
  aura?: number | null;
  gender?: string | null;
  profileImage?: string | null;
  inSeedScan?: boolean;
  sha?: string;
  dh?: string;
  error?: string;
}

async function fingerprint(username: string): Promise<UserFingerprint> {
  const { db, users, eq } = await getDb();
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      aura: users.aura,
      gender: users.gender,
      profileImage: users.profileImage,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (rows.length === 0) return { found: false, username };
  const u = rows[0];
  const inSeedScan = u.aura === 99 || /^nts_/.test(u.username);
  const fp: UserFingerprint = {
    found: true,
    id: u.id,
    username: u.username,
    aura: u.aura,
    gender: u.gender,
    profileImage: u.profileImage,
    inSeedScan,
  };
  if (!u.profileImage) { fp.error = "no profileImage on user"; return fp; }
  try {
    const buf = await fetchBytes(u.profileImage);
    fp.sha = sha256(buf);
    fp.dh = await dhash(buf);
  } catch (err) {
    fp.error = (err as any)?.message ?? String(err);
  }
  return fp;
}

function printFingerprint(fp: UserFingerprint): void {
  console.log(`@${fp.username}`);
  if (!fp.found) { console.log(`  ✗ user not found`); return; }
  console.log(`  id            : ${fp.id}`);
  console.log(`  aura          : ${fp.aura ?? "(null)"}`);
  console.log(`  gender        : ${fp.gender ?? "(null)"}`);
  console.log(`  in seed scan  : ${fp.inSeedScan ? "yes (aura=99 or nts_)" : "NO — dedupe never considers this user"}`);
  console.log(`  profileImage  : ${fp.profileImage ?? "(null)"}`);
  if (fp.error) { console.log(`  ✗ ${fp.error}`); return; }
  console.log(`  sha256        : ${fp.sha}`);
  console.log(`  dHash         : ${fp.dh}`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const u1 = argv[0] ?? "yusufk";
  const u2 = argv[1] ?? "tomasbaires";
  console.log(`🔎 [diag-photo-dupe] comparing @${u1} vs @${u2}\n`);

  const [a, b] = await Promise.all([fingerprint(u1), fingerprint(u2)]);
  printFingerprint(a);
  console.log("");
  printFingerprint(b);
  console.log("");

  if (a.sha && b.sha) {
    console.log("─".repeat(60));
    if (a.sha === b.sha) {
      console.log(`✅ sha256 MATCH — current dedupe should have caught them.`);
      console.log(`   If it didn't: check whether both are in the seed scan and the run completed.`);
    } else {
      const d = a.dh && b.dh ? hammingHex(a.dh, b.dh) : -1;
      console.log(`sha256: differ`);
      console.log(`dHash Hamming distance: ${d} / 64`);
      if (d >= 0 && d <= 10) {
        console.log(`✅ Visually identical (low dHash distance) — Cloudinary re-encoded`);
        console.log(`   different bytes from the same source. Fix: switch dedupe`);
        console.log(`   from sha256 → dHash with distance threshold ≤10.`);
      } else if (d > 10 && d < 20) {
        console.log(`⚠ Possibly similar (mid dHash distance). Worth eyeballing both URLs.`);
      } else if (d >= 20) {
        console.log(`❌ Photos are visually different — these are NOT actually duplicates.`);
      }
    }
    console.log("─".repeat(60));
  }
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
