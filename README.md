# OrionHQ

A personal browser home portal for a Supabase-powered dashboard.

## Included

- Google OAuth login with Supabase
- Responsive desktop and mobile layout
- Collapsible and pinnable sidebar navigation
- Dashboard cards and income-engine workspace
- Admin-only custom page creation
- Prefixed `OrionHQ_` Supabase tables and RLS policies

## Setup

1. Configure the public Supabase anon key in `app.js`.
2. Add these OAuth redirect URLs in Supabase Authentication:
   - `http://localhost:3000/`
   - `https://azzamunza.github.io/OrionHQ/`
   - Any custom production domain used for OrionHQ
3. Run `supabase-schema.sql` in Supabase SQL Editor.
4. Developer mode is restricted to the exact admin email `azzamunza@gmail.com`.

Use only the public anon key in frontend code. Never expose a Supabase service-role key. Keep Row Level Security enabled for every OrionHQ table; admin permissions are enforced by database policies as well as the client UI.

## Local preview

```bash
npx serve .
```
