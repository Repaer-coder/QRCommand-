# QR Command — Growth Release 1

This release turns the visual prototype into the first real product layer:

- Supabase email/password authentication
- Protected dashboard sessions
- Cloud-saved QR campaigns
- Permanent dynamic redirect links (`/r/[slug]`)
- Scan event logging and scan counters
- Business-goal campaign types
- Growth Blueprints for restaurants, reputation, and social conversion
- Existing Stripe endpoints retained for the subscription phase

## Install this update into your existing QRCommand repository

1. Stop the development server with `Control + C`.
2. Back up your current work with Git.
3. Copy the contents of this release folder into your existing QR Command folder and choose **Replace/Merge**, not into Astral Compass.
4. Run:

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Supabase setup

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql` once.
3. In Project Settings → API, copy the project URL and publishable/anon key into `.env.local`.
4. In Authentication → URL Configuration, add:
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/callback`
5. Restart `npm run dev` after editing `.env.local`.

## Important

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in client code. It is reserved for later server-only billing and administrative jobs.

## Product roadmap

- Release 2: editable campaign library, folders, schedules, passwords, expirations
- Release 3: analytics dashboards, conversion events, location/device breakdowns
- Release 4: restaurant menu builder, table codes, ordering/review/loyalty loops
- Release 5: teams, locations, agencies, bulk generation, API
- Release 6: Stripe entitlements, white-labeling, custom domains, AI optimization
