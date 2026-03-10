import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    // Orphaned connections (referencing non-existent users)
    const orphanConns = await client.query(`
      SELECT c.id, c.requester_id, c.receiver_id, c.status,
             u1.username as requester_name, u2.username as receiver_name
      FROM connections c
      LEFT JOIN users u1 ON u1.id = c.requester_id
      LEFT JOIN users u2 ON u2.id = c.receiver_id
      WHERE u1.id IS NULL OR u2.id IS NULL
      ORDER BY c.id
    `);
    console.log(`Orphaned connections: ${orphanConns.rows.length}`);
    for (const r of orphanConns.rows.slice(0, 20)) {
      console.log(`  conn id=${r.id}: requester_id=${r.requester_id}(${r.requester_name||'DELETED'}) → receiver_id=${r.receiver_id}(${r.receiver_name||'DELETED'})`);
    }

    // Orphaned messages
    const orphanMsgs = await client.query(`
      SELECT COUNT(*) as count FROM messages m
      LEFT JOIN users u1 ON u1.id = m.sender_id
      LEFT JOIN users u2 ON u2.id = m.receiver_id
      WHERE u1.id IS NULL OR u2.id IS NULL
    `);
    console.log(`\nOrphaned messages: ${orphanMsgs.rows[0].count}`);

    // Orphaned notifications
    const orphanNotifs = await client.query(`
      SELECT COUNT(*) as count FROM notifications n
      LEFT JOIN users u ON u.id = n.user_id
      WHERE u.id IS NULL
    `);
    console.log(`Orphaned notifications: ${orphanNotifs.rows[0].count}`);

    // Ghost user IDs (IDs referenced in connections but not in users table)
    const ghostIds = await client.query(`
      SELECT DISTINCT missing_id FROM (
        SELECT c.requester_id as missing_id FROM connections c LEFT JOIN users u ON u.id = c.requester_id WHERE u.id IS NULL
        UNION
        SELECT c.receiver_id FROM connections c LEFT JOIN users u ON u.id = c.receiver_id WHERE u.id IS NULL
      ) t
      ORDER BY missing_id
    `);
    console.log(`\nGhost user IDs (deleted users still referenced): ${ghostIds.rows.map((r: any) => r.missing_id).join(', ')}`);

    // Total connections
    const totalConns = await client.query(`SELECT COUNT(*) FROM connections`);
    console.log(`\nTotal connections in DB: ${totalConns.rows[0].count}`);

  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
