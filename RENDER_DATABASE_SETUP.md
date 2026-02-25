# Render Database Setup

## 1. Environment variable (required)

In your Render service **Environment** tab, add:

| Key | Value | Notes |
|-----|--------|--------|
| `DATABASE_URL` | Your PostgreSQL connection string | **Required.** See below.**

**Connection string format:**
- **Neon:** `postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require`
- **Render PostgreSQL:** After creating a Postgres instance, use the **Internal Database URL** (same region) or **External Database URL** from the Render dashboard.

---

## 2. Database options (pick one)

### Option A: Keep using Neon (current)

- Use your existing Neon project.
- In Render, set `DATABASE_URL` to your Neon connection string (same as in `.env` locally).
- No extra setup; app already uses `@neondatabase/serverless` with this URL.

### Option B: Use Render PostgreSQL

1. In Render: **Dashboard → New → PostgreSQL**. Create a database and note the URL.
2. Set `DATABASE_URL` in your **Web Service** to that URL (Internal or External).
3. Apply the schema (see Section 3).

---

## 3. Apply schema (new / empty database only)

If the database is **empty** (e.g. new Render Postgres), apply the schema in one of these ways.

### Option 1: Drizzle push (recommended)

With `DATABASE_URL` set in the environment:

```bash
npm run db:push
```

This reads `shared/schema.ts` and creates/updates tables. Run once from a machine that has `DATABASE_URL` (e.g. Render Shell, or locally with Render’s external URL).

### Option 2: Run migration SQL by hand

If you prefer to run SQL yourself (e.g. in Render Postgres “Connect” or `psql`):

1. Run the initial schema (full app schema):
   - File: `migrations/0000_square_puma.sql`
   - Run its contents against your database.

2. Then run the ambassador columns (if not already present):
   - File: `migrations/0001_ambassador_status.sql`
   - Contents:

```sql
-- Ambassador program: status, activity window, and admin override
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ambassador_status" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ambassador_enrolled_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ambassador_last_earned_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ambassador_period_start_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ambassador_points_in_period" integer DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ambassador_status_set_by_admin" boolean DEFAULT false;
```

---

## 4. Summary checklist for Render

- [ ] Create or choose a PostgreSQL database (Neon or Render Postgres).
- [ ] In the Render **Web Service** → **Environment**, add `DATABASE_URL` with the connection string.
- [ ] If the database was empty, run `npm run db:push` (or the migration SQL from Section 3) once.
- [ ] Redeploy the service so it uses the new env.

No other database-related code or config is required for Render; the app uses only `DATABASE_URL` and the Drizzle schema in `shared/schema.ts`.
