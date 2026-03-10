import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    // All unique user IDs referenced in connections
    const allConnIds = await client.query(`
      SELECT DISTINCT user_id FROM (
        SELECT requester_id as user_id FROM connections
        UNION SELECT receiver_id as user_id FROM connections
      ) t ORDER BY user_id
    `);
    console.log('User IDs referenced in connections:', allConnIds.rows.map((r: any) => r.user_id).join(', '));
    
    // All existing user IDs
    const existingIds = await client.query(`SELECT id FROM users ORDER BY id`);
    console.log('\nExisting user IDs:', existingIds.rows.map((r: any) => r.id).join(', '));
    
    // Orphaned check
    const conn_ids = new Set(allConnIds.rows.map((r: any) => Number(r.user_id)));
    const exist_ids = new Set(existingIds.rows.map((r: any) => Number(r.id)));
    const orphaned = [...conn_ids].filter(id => !exist_ids.has(id));
    console.log('\nOrphaned user IDs (in connections but not in users):', orphaned.join(', ') || 'none');

    // Also check if user logged in sees ghost users - check for user 111 (travelguy) connections
    const travelguyConns = await client.query(`
      SELECT c.id, c.requester_id, c.receiver_id, c.status, 
             u1.username as req_user, u2.username as recv_user
      FROM connections c
      LEFT JOIN users u1 ON u1.id = c.requester_id
      LEFT JOIN users u2 ON u2.id = c.receiver_id
      WHERE c.requester_id = 111 OR c.receiver_id = 111
      ORDER BY c.id
      LIMIT 20
    `);
    console.log('\nConnections for user 111 (travelguy):');
    for (const r of travelguyConns.rows) {
      console.log(`  id=${r.id} status=${r.status}: ${r.requester_id}(${r.req_user||'DELETED'}) → ${r.receiver_id}(${r.recv_user||'DELETED'})`);
    }

  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
