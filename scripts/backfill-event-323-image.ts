/**
 * One-off backfill: convert event 323's base64 data: image into a real
 * Cloudinary https URL so Open Graph / social sharing works.
 *
 * Context: manual events store their cover photo as a base64 `data:` URL in
 * events.image_url (the client uses FileReader.readAsDataURL). The image renders
 * on the page but our OG code skips `data:` URLs, so share cards fall back to the
 * logo. This re-hosts the existing photo on Cloudinary and rewrites image_url to
 * the returned secure_url, which the deployed OG fix then serves (with the
 * 1200x630 card transform).
 *
 * SCOPE: event id 323 ONLY. Touches no other row.
 *
 * Run from the Render shell:
 *   ./node_modules/.bin/tsx scripts/backfill-event-323-image.ts
 */

import { db } from '../server/db';
import { events } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { uploadImage } from '../server/services/cloudinary';

const EVENT_ID = 323;

async function main() {
  // 0. Confirm Cloudinary credentials are present BEFORE doing anything.
  const hasCloudinary = !!(
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET)
  );
  if (!hasCloudinary) {
    console.error(
      '❌ Cloudinary env vars missing. Need CLOUDINARY_URL, or ' +
        'CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET. ' +
        'Aborting — no changes made.'
    );
    process.exit(1);
  }
  console.log(
    `☁️ Cloudinary env present (cloud: ${process.env.CLOUDINARY_CLOUD_NAME || 'via CLOUDINARY_URL'}).`
  );

  // 1. Read event 323's current image_url.
  const [event] = await db
    .select({ id: events.id, title: events.title, imageUrl: events.imageUrl })
    .from(events)
    .where(eq(events.id, EVENT_ID))
    .limit(1);

  if (!event) {
    console.error(`❌ Event ${EVENT_ID} not found. No changes made.`);
    process.exit(1);
  }

  const oldUrl = event.imageUrl || '';
  console.log(`\n📋 Event ${EVENT_ID}: "${event.title}"`);
  console.log(`   old image_url length: ${oldUrl.length} chars`);
  console.log(`   old image_url start:  ${oldUrl.slice(0, 60)}${oldUrl.length > 60 ? '…' : ''}`);

  // 5. Safety guards — only act on a base64 data: image; leave anything else alone.
  if (!oldUrl) {
    console.log('ℹ️ Event has no image_url — nothing to backfill. No changes made.');
    process.exit(0);
  }
  if (oldUrl.startsWith('http')) {
    console.log('✅ image_url is already an http(s) URL (likely Cloudinary). Nothing to do. No changes made.');
    process.exit(0);
  }
  if (!oldUrl.startsWith('data:')) {
    console.log(
      `⚠️ image_url is neither http nor data: (starts with "${oldUrl.slice(0, 12)}…"). ` +
        'Not a base64 blob — refusing to touch it. No changes made.'
    );
    process.exit(0);
  }

  // 2. Decode the base64 data: URL into a Buffer.
  //    Expected shape: data:image/<type>;base64,<payload>
  const match = oldUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
  if (!match) {
    console.error(
      '❌ image_url is a data: URL but not a parseable base64 image ' +
        '(expected data:image/<type>;base64,…). No changes made.'
    );
    process.exit(1);
  }
  const mime = match[1];
  const ext = mime.split('/')[1].split('+')[0]; // image/jpeg -> jpeg, image/svg+xml -> svg
  const buffer = Buffer.from(match[2], 'base64');
  console.log(`🔍 Decoded base64: mime=${mime}, ${buffer.length} bytes`);

  if (buffer.length === 0) {
    console.error('❌ Decoded buffer is empty. No changes made.');
    process.exit(1);
  }

  // 3. Upload to Cloudinary via the existing helper (returns { url: secure_url, publicId }).
  const filename = `event-${EVENT_ID}-cover.${ext}`;
  console.log(`⬆️ Uploading to Cloudinary as "${filename}"…`);
  const { url: secureUrl, publicId } = await uploadImage(buffer, filename);
  console.log(`✅ Uploaded. publicId=${publicId}`);
  console.log(`   new Cloudinary URL: ${secureUrl}`);

  // Sanity-check the returned URL before writing it to the DB.
  if (!secureUrl || !secureUrl.startsWith('https://res.cloudinary.com/')) {
    console.error(`❌ Upload returned an unexpected URL (${secureUrl}). NOT updating DB. No changes made.`);
    process.exit(1);
  }

  // 4. Update events.image_url — scoped to id=323 only.
  const updated = await db
    .update(events)
    .set({ imageUrl: secureUrl })
    .where(eq(events.id, EVENT_ID))
    .returning({ id: events.id, imageUrl: events.imageUrl });

  console.log('\n──────── RESULT ────────');
  console.log(`old image_url: ${oldUrl.length} chars (base64 ${mime})`);
  console.log(`new image_url: ${updated[0]?.imageUrl}`);
  console.log(`rows updated:  ${updated.length} (event id ${updated[0]?.id})`);

  if (updated.length === 1 && updated[0]?.imageUrl === secureUrl) {
    console.log('✅ Row updated successfully. Re-scrape /events/323 in the Facebook Sharing Debugger.');
    process.exit(0);
  } else {
    console.error('❌ Update did not confirm as expected. Please verify event 323 manually.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
