import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    const total = await client.query(`SELECT COUNT(*) as count FROM users`);
    console.log('Total users:', total.rows[0].count);
    
    const highId = await client.query(`
      SELECT id, username, name, email, profile_image, created_at, user_type
      FROM users 
      WHERE id >= 100 
      ORDER BY id
      LIMIT 80
    `);
    console.log('\nUsers with id >= 100:');
    for (const u of highId.rows) {
      console.log(`  id=${u.id} username="${u.username||'(null)'}" name="${u.name||'(null)'}" email="${(u.email||'').substring(0,30)}" img=${!!u.profile_image} type=${u.user_type}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
