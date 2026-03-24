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
- Commit and push in a single command chain: `git add [files] && git commit -m "..." && git push origin main`
- Never commit `.env` files
