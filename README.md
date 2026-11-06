# OrionHQ

A personal browser home portal, hosted on Cloudflare Pages (`orionhq.entangledlab.work`) with a Cloudflare D1 database.

## Stack

- Static frontend in `public/`
- API in `functions/api/[[path]].js` (Pages Functions): Google OAuth + signed session cookie
- D1 database (`migrations/0001_init.sql`), tables prefixed `OrionHQ_`
- Admin (developer mode) restricted to `ADMIN_EMAIL` (`azzamunza@gmail.com`), enforced server-side

## Deploy

```bash
npm i -g wrangler && wrangler login
wrangler d1 create orionhq                 # put database_id in wrangler.toml
wrangler d1 migrations apply orionhq --remote
wrangler pages project create orionhq --production-branch main
wrangler pages deploy public --project-name orionhq
wrangler pages secret put GOOGLE_CLIENT_ID --project-name orionhq
wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name orionhq
wrangler pages secret put SESSION_SECRET --project-name orionhq   # e.g. `openssl rand -hex 32`
```

Then in the Cloudflare dashboard: Pages → orionhq → Custom domains → add `orionhq.entangledlab.work`
(the domain must be on your Cloudflare account; the DNS record is created automatically).

In Google Cloud Console, add the authorized redirect URI:
`https://orionhq.entangledlab.work/api/auth/callback`
(and `http://localhost:8788/api/auth/callback` for local dev).

## Migrating existing Supabase data

Export rows from Supabase and insert into D1 with `wrangler d1 execute orionhq --remote --file data.sql`.
`OrionHQ_settings.user_id` is now the Google account `sub`, not a Supabase UUID.

## Local dev

Create `.dev.vars` (gitignored) with the three secrets, then:

```bash
wrangler d1 migrations apply orionhq --local
wrangler pages dev --port 8788
```
