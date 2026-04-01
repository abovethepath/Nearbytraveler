---
name: no-local-db-commands
description: Never run database commands against local .env — production DB is on Render shell only
type: feedback
---

Do NOT run `node -e` database commands locally. The local `.env` DATABASE_URL points to a dev/staging database, not production.

**Why:** Production data lives on Render. Local DB operations create/modify the wrong database and don't affect what users actually see.

**How to apply:** When DB changes are needed, generate the SQL or node commands as text for the user to paste into the Render shell at render.com. Never execute them locally.
