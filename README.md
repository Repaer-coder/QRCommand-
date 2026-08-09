# QR Command

QR Command is a Next.js business-optimization platform built around permanent dynamic QR entry points. It combines organization-scoped campaigns, locations, scan analytics, growth playbooks, teams, Stripe entitlements, safe automation, signed webhook integrations, and an optional approval-gated AI layer.

## Product tiers

- Essentials: dynamic QR campaigns, a location, and basic analytics.
- Premium: teams, multi-location operations, growth blueprints, business modules, and advanced analytics.
- Pro: bounded automation, run history, signed webhook integrations, and auditability.
- Pro Plus AI: evidence-grounded insights, campaign drafts, recommendations, reporting, and approval-gated actions.

The free workspace is an evaluation tier. Paid access is derived centrally from stored Stripe subscription state.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and provide the applicable values.
3. Run `supabase/schema.sql` in the Supabase SQL editor. The file is idempotent and includes tables, indexes, functions, RLS, and policies.
4. Set the Supabase Auth site URL to `http://localhost:3000` and allow `http://localhost:3000/auth/callback` as a redirect URL.
5. Start the application with `npm run dev`.

## Required environment variable names

Core:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `QR_COMMAND_IP_SALT`

Stripe:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_ESSENTIALS_PRICE_ID`
- `STRIPE_PREMIUM_PRICE_ID`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_PRO_PLUS_AI_PRICE_ID`

The inherited `STRIPE_STARTER_PRICE_ID`, `STRIPE_BUSINESS_PRICE_ID`, and `STRIPE_ENTERPRISE_PRICE_ID` names remain supported as compatibility fallbacks.

Pro operations:

- `CRON_SECRET`
- `INTEGRATION_ENCRYPTION_KEY`

`INTEGRATION_ENCRYPTION_KEY` must be a 32-byte key encoded as 64 hexadecimal characters or base64. Webhook endpoints must be public HTTPS URLs. Signing secrets are shown only once and stored with AES-256-GCM encryption.

Pro Plus AI:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

The AI provider is server-only and optional. If it is unavailable, authentication, billing, QR CRUD, redirects, scan recording, analytics, and Pro automation continue to operate. AI output is structured, stored, rate-limited, and cannot directly mutate a campaign; supported actions require owner/admin approval.

## Stripe configuration

Create one recurring Stripe price for each paid tier and set the corresponding environment variable. Configure a webhook endpoint at `/api/webhooks/stripe` for:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Checkout metadata binds the Stripe customer and subscription to one organization. Webhook event IDs are persisted for idempotency. Active and trialing subscriptions grant entitlements; other states fall back to the free tier.

## Vercel deployment

1. Import the repository into Vercel.
2. Set the environment variables above for Production and Preview as appropriate.
3. Set `NEXT_PUBLIC_SITE_URL` to the production origin.
4. Add the production Supabase callback URL.
5. Apply `supabase/schema.sql` before sending production traffic.
6. Confirm Vercel Cron can call `/api/cron/automations` with `CRON_SECRET`.
7. Point Stripe to the production webhook URL and use the production signing secret.

`vercel.json` schedules enabled Pro automations every 15 minutes. Rules also enforce cooldown and hourly run limits.

## Validation

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run check` runs all four in sequence.

The unit suite covers centralized entitlement behavior, redirect/destination safety, canonical date-series metrics, encryption, and the RLS/scan-write schema contract. Live end-to-end authentication, billing, webhook, cross-organization isolation, and AI-provider checks require configured external projects and test credentials.
