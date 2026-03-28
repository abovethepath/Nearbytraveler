/**
 * One-time migration script: compress all existing oversized base64 images in the DB.
 *
 * Run from Render shell:
 *   npx tsx server/scripts/compress-existing-images.ts
 *
 * Safe to re-run — skips images already under the size threshold.
 */

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import ws from "ws";
import { compressAvatar, compressPhoto, compressCoverPhoto } from "../imageCompression";

neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ DATABASE_URL or NEON_DATABASE_URL must be set");
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl, max: 5 });
const db = drizzle(pool);

const AVATAR_THRESHOLD = 100_000;   // 100KB
const PHOTO_THRESHOLD = 200_000;    // 200KB
const COVER_THRESHOLD = 250_000;    // 250KB

async function compressUserAvatars() {
  console.log("\n🖼️  Phase 1: Compressing profile avatars (profile_image)...");

  const rows = await db.execute(sql`
    SELECT id, LENGTH(profile_image) AS len
    FROM users
    WHERE profile_image IS NOT NULL
      AND profile_image LIKE 'data:%'
      AND LENGTH(profile_image) > ${AVATAR_THRESHOLD}
    ORDER BY LENGTH(profile_image) DESC
  `);
  const users = (rows as any).rows || rows;
  console.log(`   Found ${users.length} oversized avatars`);

  let compressed = 0;
  let failed = 0;
  for (const row of users) {
    try {
      // Fetch the actual image data
      const [userData] = ((await db.execute(
        sql`SELECT profile_image FROM users WHERE id = ${row.id}`
      )) as any).rows || [];
      if (!userData?.profile_image) continue;

      const original = userData.profile_image;
      const result = await compressAvatar(original);

      if (result.length < original.length) {
        await db.execute(
          sql`UPDATE users SET profile_image = ${result} WHERE id = ${row.id}`
        );
        console.log(`   ✅ User ${row.id}: ${(original.length / 1024).toFixed(0)}KB → ${(result.length / 1024).toFixed(0)}KB`);
        compressed++;
      } else {
        console.log(`   ⏭️  User ${row.id}: already optimal (${(original.length / 1024).toFixed(0)}KB)`);
      }
    } catch (err) {
      console.error(`   ❌ User ${row.id}: ${(err as Error).message?.slice(0, 80)}`);
      failed++;
    }
  }
  console.log(`   Done: ${compressed} compressed, ${failed} failed, ${users.length - compressed - failed} skipped`);
}

async function compressUserCoverPhotos() {
  console.log("\n🖼️  Phase 2: Compressing cover photos...");

  const rows = await db.execute(sql`
    SELECT id, LENGTH(cover_photo) AS len
    FROM users
    WHERE cover_photo IS NOT NULL
      AND cover_photo LIKE 'data:%'
      AND LENGTH(cover_photo) > ${COVER_THRESHOLD}
    ORDER BY LENGTH(cover_photo) DESC
  `);
  const users = (rows as any).rows || rows;
  console.log(`   Found ${users.length} oversized cover photos`);

  let compressed = 0;
  let failed = 0;
  for (const row of users) {
    try {
      const [userData] = ((await db.execute(
        sql`SELECT cover_photo FROM users WHERE id = ${row.id}`
      )) as any).rows || [];
      if (!userData?.cover_photo) continue;

      const original = userData.cover_photo;
      const result = await compressCoverPhoto(original);

      if (result.length < original.length) {
        await db.execute(
          sql`UPDATE users SET cover_photo = ${result} WHERE id = ${row.id}`
        );
        console.log(`   ✅ User ${row.id}: ${(original.length / 1024).toFixed(0)}KB → ${(result.length / 1024).toFixed(0)}KB`);
        compressed++;
      } else {
        console.log(`   ⏭️  User ${row.id}: already optimal (${(original.length / 1024).toFixed(0)}KB)`);
      }
    } catch (err) {
      console.error(`   ❌ User ${row.id}: ${(err as Error).message?.slice(0, 80)}`);
      failed++;
    }
  }
  console.log(`   Done: ${compressed} compressed, ${failed} failed, ${users.length - compressed - failed} skipped`);
}

async function compressGalleryPhotos() {
  console.log("\n🖼️  Phase 3: Compressing gallery photos (user_photos.image_url)...");

  const rows = await db.execute(sql`
    SELECT id, LENGTH(image_url) AS len
    FROM user_photos
    WHERE image_url IS NOT NULL
      AND image_url LIKE 'data:%'
      AND LENGTH(image_url) > ${PHOTO_THRESHOLD}
    ORDER BY LENGTH(image_url) DESC
  `);
  const photos = (rows as any).rows || rows;
  console.log(`   Found ${photos.length} oversized gallery photos`);

  let compressed = 0;
  let failed = 0;
  for (const row of photos) {
    try {
      const [photoData] = ((await db.execute(
        sql`SELECT image_url FROM user_photos WHERE id = ${row.id}`
      )) as any).rows || [];
      if (!photoData?.image_url) continue;

      const original = photoData.image_url;
      const result = await compressPhoto(original);

      if (result.length < original.length) {
        await db.execute(
          sql`UPDATE user_photos SET image_url = ${result} WHERE id = ${row.id}`
        );
        console.log(`   ✅ Photo ${row.id}: ${(original.length / 1024).toFixed(0)}KB → ${(result.length / 1024).toFixed(0)}KB`);
        compressed++;
      } else {
        console.log(`   ⏭️  Photo ${row.id}: already optimal (${(original.length / 1024).toFixed(0)}KB)`);
      }
    } catch (err) {
      console.error(`   ❌ Photo ${row.id}: ${(err as Error).message?.slice(0, 80)}`);
      failed++;
    }
  }
  console.log(`   Done: ${compressed} compressed, ${failed} failed, ${photos.length - compressed - failed} skipped`);
}

async function compressGalleryImageData() {
  console.log("\n🖼️  Phase 4: Compressing gallery photos (user_photos.image_data)...");

  const rows = await db.execute(sql`
    SELECT id, LENGTH(image_data) AS len
    FROM user_photos
    WHERE image_data IS NOT NULL
      AND image_data LIKE 'data:%'
      AND LENGTH(image_data) > ${PHOTO_THRESHOLD}
    ORDER BY LENGTH(image_data) DESC
  `);
  const photos = (rows as any).rows || rows;
  console.log(`   Found ${photos.length} oversized image_data entries`);

  let compressed = 0;
  let failed = 0;
  for (const row of photos) {
    try {
      const [photoData] = ((await db.execute(
        sql`SELECT image_data FROM user_photos WHERE id = ${row.id}`
      )) as any).rows || [];
      if (!photoData?.image_data) continue;

      const original = photoData.image_data;
      const result = await compressPhoto(original);

      if (result.length < original.length) {
        await db.execute(
          sql`UPDATE user_photos SET image_data = ${result} WHERE id = ${row.id}`
        );
        console.log(`   ✅ Photo ${row.id} image_data: ${(original.length / 1024).toFixed(0)}KB → ${(result.length / 1024).toFixed(0)}KB`);
        compressed++;
      } else {
        console.log(`   ⏭️  Photo ${row.id}: already optimal (${(original.length / 1024).toFixed(0)}KB)`);
      }
    } catch (err) {
      console.error(`   ❌ Photo ${row.id}: ${(err as Error).message?.slice(0, 80)}`);
      failed++;
    }
  }
  console.log(`   Done: ${compressed} compressed, ${failed} failed, ${photos.length - compressed - failed} skipped`);
}

async function main() {
  console.log("🚀 Starting image compression migration...");
  console.log(`   Thresholds: avatars > ${AVATAR_THRESHOLD / 1000}KB, photos > ${PHOTO_THRESHOLD / 1000}KB, covers > ${COVER_THRESHOLD / 1000}KB`);

  await compressUserAvatars();
  await compressUserCoverPhotos();
  await compressGalleryPhotos();
  await compressGalleryImageData();

  console.log("\n✅ Migration complete!");
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("💥 Migration failed:", err);
  pool.end().catch(() => {});
  process.exit(1);
});
