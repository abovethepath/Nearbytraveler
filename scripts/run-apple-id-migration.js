/**
 * Run the "apple_id" column migration on the database.
 * Fixes: column "apple_id" does not exist / registration failed (Sign in with Apple).
 * Usage: node -r dotenv/config scripts/run-apple-id-migration.js
 * Requires: DATABASE_URL in env (e.g. .env)
 */
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = join(__dirname, '..', 'migrations', '0002_add_apple_id_column.sql');
const sql = readFileSync(migrationPath, 'utf8');

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  await client.query(sql);
  console.log('✅ Apple ID migration applied successfully (apple_id column).');
} catch (e) {
  console.error('Migration failed:', e.message);
  process.exit(1);
} finally {
  await client.end();
}
