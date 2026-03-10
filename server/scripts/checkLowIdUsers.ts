import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT id, username, name, profile_image IS NOT NULL as has_img, user_type, created_at
      FROM users WHERE id IN (66,68,69,70,71,73,76,78,79,99)
      ORDER BY id
    `);
    console.log('Users 66-99:');
    for (const u of res.rows) {
      console.log(`  id=${u.id} username="${u.username||'(null)'}" name="${u.name||'(null)'}" has_img=${u.has_img} type=${u.user_type} created=${u.created_at?.toISOString?.()?.substring(0,10)}`);
    }
    
    // Also check messages with orphaned sender/receiver
    const orphanMsgs = await client.query(`
      SELECT m.id, m.sender_id, m.receiver_id, m.content, m.created_at,
             u1.username as sender_name, u2.username as receiver_name
      FROM messages m
      LEFT JOIN users u1 ON u1.id = m.sender_id
      LEFT JOIN users u2 ON u2.id = m.receiver_id
      WHERE u1.id IS NULL OR u2.id IS NULL
      ORDER BY m.id
      LIMIT 20
    `);
    console.log(`\nOrphaned messages (79 total, showing first 20):`);
    for (const m of orphanMsgs.rows) {
      console.log(`  msg id=${m.id}: sender_id=${m.sender_id}(${m.sender_name||'DELETED'}) → receiver_id=${m.receiver_id}(${m.receiver_name||'DELETED'}) content="${(m.content||'').substring(0,40)}"`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
