# Project: Nearby Traveler

## Allowed Commands

These commands are pre-approved and should run without confirmation:

```
git add
git commit
git push origin main
npm run dev
npx tsc --noEmit
npx drizzle-kit push
```

## Git Workflow

- Always stage specific files (not `git add .`) to avoid committing `.env` or unrelated changes
- Never commit `.env` files
- Never use `&&` in PowerShell — run git commands one at a time

## Standing Rules

1. Auto-approve all commands, never pause for confirmation
2. Never run DB commands locally — production DB is Neon PostgreSQL accessed via Render shell only
3. Never query local database for production debugging — always use Render shell with `psql $DATABASE_URL`
4. Always use `getMetroAreaName()` for city filtering and chatroom assignment — never for display text on user cards
5. User cards always show raw hometown city text, never the metro area name
6. Never apply OC or LA Metro mapping to display text — only for filtering/routing
7. User id=1 is deleted and must never be referenced
8. User id=2 is nearbytrav (admin) with special visibility on all admin features
9. `city_chatrooms` is the correct table name, not `chatrooms`
10. When fixing bugs, read the actual code first — do not guess at root causes
11. Break complex fixes into numbered sections in the prompt

## Infrastructure

- Codebase: GitHub at `abovethepath/Nearbytraveler`
- Deployment: Render (auto-deploy from main)
- Database: Neon PostgreSQL (accessed via Render shell only)
