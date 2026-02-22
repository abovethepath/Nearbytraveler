# Database migrations

## "Column new to town does not exist" (iOS signup)

If signup (especially on iOS) fails with **column "new to town" does not exist** (or `is_new_to_town` / `new_to_town_until`), the `users` table is missing the New to Town columns.

**Fix:** Run the New to Town migration against the **same database** your app uses (e.g. production on Render).

### Option 1: npm script (recommended)

From the project root, with `DATABASE_URL` in `.env` pointing to your target database:

```bash
npm run db:migrate-new-to-town
```

Use your **production** `DATABASE_URL` when fixing production (e.g. copy from Render → env locally, or run the script in a one-off job that has access to it).

### Option 2: Run the SQL manually

Connect to your database (e.g. Render Postgres) and run:

```sql
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_new_to_town" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "new_to_town_until" timestamp;
```

### Option 3: Run the migration file with psql

```bash
psql "$DATABASE_URL" -f migrations/0001_add_new_to_town_columns.sql
```

After the migration, signup (including "New to Town") should work.

---

## "Column apple_id does not exist" (Sign in with Apple / registration failed)

If Sign in with Apple or registration fails with **column "apple_id" does not exist**, the `users` table is missing the Sign in with Apple column.

**Fix:** Run the Apple ID migration against the **same database** your app uses (e.g. production on Render).

### Option 1: npm script

From the project root, with `DATABASE_URL` in `.env` pointing to your target database:

```bash
npm run db:migrate-apple-id
```

### Option 2: Run the SQL manually

Connect to your database (e.g. Render Postgres) and run:

```sql
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "apple_id" text UNIQUE;
```

### Option 3: Run the migration file with psql

```bash
psql "$DATABASE_URL" -f migrations/0002_add_apple_id_column.sql
```

After the migration, Sign in with Apple registration should work.
