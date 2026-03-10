/**
 * Ghost User Cleanup Script
 * 
 * Two-phase cleanup:
 * 1. Users with null/empty usernames that still exist in users table
 * 2. Orphaned records in other tables referencing user IDs that no longer exist
 * 
 * Run: npx tsx server/scripts/cleanupGhostUsers.ts            (dry run)
 * Run: npx tsx server/scripts/cleanupGhostUsers.ts --execute  (actually delete)
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const DRY_RUN = !process.argv.includes('--execute');
const DB_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('❌ No database URL found (NEON_DATABASE_URL or DATABASE_URL)');
  process.exit(1);
}

const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  const mode = DRY_RUN ? '🔍 DRY RUN MODE — no data will be deleted' : '🗑️  EXECUTE MODE — deleting ghost user data';
  console.log(mode + '\n');

  try {
    // ── PHASE 1: Users with null/empty usernames ──────────────────────────
    const ghostRes = await client.query(`
      SELECT id, username, name, email, created_at
      FROM users
      WHERE (username IS NULL OR username = '')
        AND id != 2
      ORDER BY id
    `);
    const ghostUsers = ghostRes.rows;
    const ghostIds: number[] = ghostUsers.map((u: any) => u.id);

    if (ghostIds.length > 0) {
      console.log(`PHASE 1: Found ${ghostIds.length} null-username users: IDs ${ghostIds.join(', ')}`);
      console.table(ghostUsers.map((u: any) => ({
        id: u.id,
        username: u.username || '(null)',
        name: u.name || '(null)',
        email: u.email || '(null)',
      })));
    } else {
      console.log('PHASE 1: No null-username users found.\n');
    }

    // ── PHASE 2: Orphaned references to non-existent users ────────────────
    // Find all user IDs referenced in key tables but missing from users
    const orphanedIdsRes = await client.query(`
      SELECT DISTINCT missing_id FROM (
        SELECT sender_id   AS missing_id FROM messages    m LEFT JOIN users u ON u.id = m.sender_id   WHERE u.id IS NULL
        UNION
        SELECT receiver_id AS missing_id FROM messages    m LEFT JOIN users u ON u.id = m.receiver_id WHERE u.id IS NULL
        UNION
        SELECT user_id     AS missing_id FROM notifications n LEFT JOIN users u ON u.id = n.user_id   WHERE u.id IS NULL
        UNION
        SELECT from_user_id AS missing_id FROM notifications n LEFT JOIN users u ON u.id = n.from_user_id WHERE u.id IS NULL AND n.from_user_id IS NOT NULL
        UNION
        SELECT requester_id AS missing_id FROM connections c LEFT JOIN users u ON u.id = c.requester_id WHERE u.id IS NULL
        UNION
        SELECT receiver_id  AS missing_id FROM connections c LEFT JOIN users u ON u.id = c.receiver_id  WHERE u.id IS NULL
      ) t
      WHERE missing_id IS NOT NULL AND missing_id != 2
      ORDER BY missing_id
    `);
    const orphanedIds: number[] = orphanedIdsRes.rows.map((r: any) => Number(r.missing_id));

    if (orphanedIds.length > 0) {
      console.log(`PHASE 2: Found ${orphanedIds.length} deleted-user IDs still referenced in tables: ${orphanedIds.join(', ')}\n`);
    } else {
      console.log('PHASE 2: No orphaned references found.\n');
    }

    // All IDs to clean up (both phases)
    const allIds = [...new Set([...ghostIds, ...orphanedIds])];

    if (allIds.length === 0) {
      console.log('✅ Database is fully clean — nothing to delete!');
      return;
    }

    const idList = `(${allIds.join(',')})`;
    const arrayLiteral = `ARRAY[${allIds.join(',')}]`;

    // Count affected rows per table
    console.log('📊 Rows to be cleaned up:');
    const count = async (label: string, sql: string) => {
      try {
        const r = await client.query(sql);
        const n = r.rows[0]?.count ?? r.rowCount ?? 0;
        console.log(`  ${label}: ${n}`);
        return Number(n);
      } catch {
        console.log(`  ${label}: (table not found, skipping)`);
        return 0;
      }
    };

    await count('messages',      `SELECT COUNT(*) FROM messages WHERE sender_id = ANY(${arrayLiteral}::int[]) OR receiver_id = ANY(${arrayLiteral}::int[])`);
    await count('notifications', `SELECT COUNT(*) FROM notifications WHERE user_id = ANY(${arrayLiteral}::int[]) OR from_user_id = ANY(${arrayLiteral}::int[])`);
    await count('connections',   `SELECT COUNT(*) FROM connections WHERE requester_id = ANY(${arrayLiteral}::int[]) OR receiver_id = ANY(${arrayLiteral}::int[])`);
    await count('activity_log',  `SELECT COUNT(*) FROM activity_log WHERE user_id = ANY(${arrayLiteral}::int[])`);
    await count('event_attendees', `SELECT COUNT(*) FROM event_attendees WHERE user_id = ANY(${arrayLiteral}::int[])`);
    await count('events (organizer)', `SELECT COUNT(*) FROM events WHERE organizer_id = ANY(${arrayLiteral}::int[]) OR creator_id = ANY(${arrayLiteral}::int[])`);
    await count('travel_plans',  `SELECT COUNT(*) FROM travel_plans WHERE user_id = ANY(${arrayLiteral}::int[])`);
    await count('meetup_chatroom_members', `SELECT COUNT(*) FROM meetup_chatroom_members WHERE user_id = ANY(${arrayLiteral}::int[])`);
    await count('available_now', `SELECT COUNT(*) FROM available_now WHERE user_id = ANY(${arrayLiteral}::int[])`);

    if (ghostIds.length > 0) {
      await count(`users to delete (${ghostIds.length} ghost accounts)`, `SELECT COUNT(*) FROM users WHERE id = ANY(${arrayLiteral}::int[])`);
    }

    console.log('');

    if (DRY_RUN) {
      console.log('✅ DRY RUN complete. Run with --execute to perform the actual cleanup.');
      return;
    }

    // ── ACTUAL DELETION ────────────────────────────────────────────────────
    console.log('🗑️  Deleting...\n');

    const del = async (label: string, sql: string) => {
      try {
        const r = await client.query(sql);
        console.log(`  ✅ Deleted ${r.rowCount ?? 0} ${label}`);
      } catch (e: any) {
        if (e.message.includes('does not exist')) {
          console.log(`  ⚠️  ${label}: table not found, skipping`);
        } else {
          console.log(`  ❌ ${label}: ${e.message}`);
        }
      }
    };

    // Safe deletion order (leaf tables first, then parent)
    await del('notifications',        `DELETE FROM notifications WHERE user_id = ANY(${arrayLiteral}::int[]) OR from_user_id = ANY(${arrayLiteral}::int[])`);
    await del('activity_log',         `DELETE FROM activity_log WHERE user_id = ANY(${arrayLiteral}::int[])`);
    await del('messages',             `DELETE FROM messages WHERE sender_id = ANY(${arrayLiteral}::int[]) OR receiver_id = ANY(${arrayLiteral}::int[])`);
    await del('connections',          `DELETE FROM connections WHERE requester_id = ANY(${arrayLiteral}::int[]) OR receiver_id = ANY(${arrayLiteral}::int[])`);
    await del('event_attendees',      `DELETE FROM event_attendees WHERE user_id = ANY(${arrayLiteral}::int[])`);
    await del('meetup_chatroom_members', `DELETE FROM meetup_chatroom_members WHERE user_id = ANY(${arrayLiteral}::int[])`);
    await del('travel_plans',         `DELETE FROM travel_plans WHERE user_id = ANY(${arrayLiteral}::int[])`);
    await del('available_now',        `DELETE FROM available_now WHERE user_id = ANY(${arrayLiteral}::int[])`);
    await del('quick_meetup_members', `DELETE FROM quick_meetup_members WHERE user_id = ANY(${arrayLiteral}::int[])`);
    await del('quick_meetups',        `DELETE FROM quick_meetups WHERE creator_id = ANY(${arrayLiteral}::int[])`);
    await del('meet_requests',        `DELETE FROM meet_requests WHERE from_user_id = ANY(${arrayLiteral}::int[]) OR to_user_id = ANY(${arrayLiteral}::int[])`);
    await del('blocked_users',        `DELETE FROM blocked_users WHERE blocker_id = ANY(${arrayLiteral}::int[]) OR blocked_id = ANY(${arrayLiteral}::int[])`);
    await del('hidden_from_users',    `DELETE FROM hidden_from_users WHERE user_id = ANY(${arrayLiteral}::int[]) OR hidden_from_id = ANY(${arrayLiteral}::int[])`);
    await del('user_reports',         `DELETE FROM user_reports WHERE reporter_id = ANY(${arrayLiteral}::int[]) OR reported_id = ANY(${arrayLiteral}::int[])`);
    await del('events (by ghost)',    `DELETE FROM events WHERE organizer_id = ANY(${arrayLiteral}::int[]) OR creator_id = ANY(${arrayLiteral}::int[])`);

    // Phase 1 only: delete the actual ghost users
    if (ghostIds.length > 0) {
      const ghostArr = `ARRAY[${ghostIds.join(',')}]`;
      await del(`users (${ghostIds.length} ghost accounts)`, `DELETE FROM users WHERE id = ANY(${ghostArr}::int[]) AND id != 2`);
    }

    console.log('\n✅ Cleanup complete!');

    // Verify
    const remaining = await client.query(`
      SELECT COUNT(*) as orphan_msgs FROM messages m
      LEFT JOIN users u1 ON u1.id = m.sender_id
      LEFT JOIN users u2 ON u2.id = m.receiver_id
      WHERE u1.id IS NULL OR u2.id IS NULL
    `);
    console.log(`Remaining orphaned messages: ${remaining.rows[0].orphan_msgs}`);

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('❌ Script failed:', err.message);
  process.exit(1);
});
