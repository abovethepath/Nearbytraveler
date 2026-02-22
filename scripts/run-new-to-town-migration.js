/**
 * Run the "New to Town" migration on the database.
 * Fixes: column "new to town" / is_new_to_town / new_to_town_until does not exist (iOS signup).
 * Usage: node -r dotenv/config scripts/run-new-to-town-migration.js
 * Requires: DATABASE_URL in env (e.g. .env)
 */
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = join(__dirname, '..', 'migrations', '0001_add_new_to_town_columns.sql');
const sql = readFileSync(migrationPath, 'utf8');

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  await client.query(sql);
  console.log('✅ New to Town migration applied successfully (is_new_to_town, new_to_town_until).');
} catch (e) {
  console.error('Migration failed:', e.message);
  process.exit(1);
} finally {
  await client.end();
}
