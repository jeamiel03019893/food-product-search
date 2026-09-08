# Food Product Search

A full-stack app for searching [Open Food Facts](https://world.openfoodfacts.org/) products by name. Everyone can see a product's name, brand, and image; detailed nutritional values are gated behind an active Stripe subscription for a single demo user. The UI and product data are available in English, Dutch, German, and French via a manual language selector.

## Stack

| Frontend | Backend |
|---|---|
| TypeScript | TypeScript |
| Next.js 16 (App Router) | Express 5 |
| React 19 | Prisma 7 |
| Tailwind CSS v4 | MySQL |
| | Open Food Facts API |
| | Stripe Subscriptions API (test mode) |

Monorepo managed with pnpm workspaces and Turborepo (`apps/web`, `apps/api`).

## Setup

**Prerequisites:**
- Node.js 22, pnpm 9.12 (`packageManager` is pinned in the root `package.json`)
- A MySQL 8.x server reachable locally
- [Stripe CLI](https://stripe.com/docs/stripe-cli), for forwarding webhooks to your machine in test mode
- A Stripe account in test mode, with one recurring price configured on a product (see "Stripe setup" below)

**Install and configure:**

```bash
pnpm install

cp apps/api/.env.example apps/api/.env
# then fill in DATABASE_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRODUCT_ID
```

`apps/web` needs no `.env.local` for local development — it defaults its API base URL to `http://localhost:3001/api`; only set `NEXT_PUBLIC_API_URL` there if you're pointing it somewhere else.

**Database:**

```bash
pnpm --filter @afps/api db:migrate
```

This also generates the Prisma client and seeds the single demo user (no login system — there are no credentials, the seed just ensures the demo user row exists). The seed also runs automatically on every `apps/api` boot, so it's safe to skip this step if you'd rather just start the app.

**Stripe setup (test mode):**

Create one Product with one recurring Price (e.g. $10/month) in your Stripe test dashboard, and put the product's ID in `STRIPE_PRODUCT_ID`. In a separate terminal, keep this running for the whole time you're testing subscription/checkout flows locally:

```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

It prints a `whsec_...` value the first time you run it — put that in `STRIPE_WEBHOOK_SECRET`. **This process must be running continuously** for cancellations, renewals, and checkout completions to sync into MySQL — see "Known limitations" below for why.

**Run:**

```bash
pnpm dev
```

Starts both apps together — web on `http://localhost:3000`, API on `http://localhost:3001`.

**Test:**

```bash
pnpm --filter @afps/api test
```

## Technical decisions

- **Prisma driver adapter, not a datasource URL.** Prisma 7 requires a driver adapter rather than a plain connection string; this project uses `@prisma/adapter-mariadb` (it speaks the MySQL wire protocol despite the package name — it's Prisma's documented adapter for MySQL, not just MariaDB).
- **`allowPublicKeyRetrieval=true` on `DATABASE_URL`.** MySQL 8.4's default `caching_sha2_password` auth plugin needs this to exchange the password over a non-TLS local connection; without it, every connection attempt fails.
- **Single recurring subscription, not a multi-tier catalog.** The app supports exactly one Stripe product/price for gating access. `getPricesHandler` filters to recurring prices only, so a stray one-time price left on the same product doesn't leak into the picker and fail at checkout (checkout is always created in `mode: 'subscription'`).
- **Subscription cancellation syncs to MySQL directly from Stripe's API response, not solely via webhook.** The Stripe webhook (`customer.subscription.*`, `invoice.payment_*`) is still the source of truth for events the server didn't itself trigger (a renewal, a payment failure, a cancellation from Stripe's own customer portal). But for the one action our own backend initiates and gets a synchronous, authoritative result back for — cancelling a subscription — waiting on an async webhook round-trip to persist that result is unnecessary and fragile (a webhook delivery can fail transiently, e.g. if the local server happens to be down at that moment, silently leaving the database out of sync). The cancel endpoint writes the result immediately from Stripe's response; the webhook still processes the same event afterward as a harmless, idempotent no-op.
- **No product-data caching.** Every search hits Open Food Facts live; there's no local cache layer for product results. Simpler, and avoids serving stale nutrition data, at the cost of one external round-trip per search.
- **Access control is a single server-side check.** `Subscription.status === 'ACTIVE'` for the one demo user gates the detailed nutrition fields in the product-detail response; there's no session/auth token system since there's only ever one user.

## Internationalization approach

- **Hand-rolled dictionary, not a library** (no next-intl/react-i18next). Given the app's size — four languages, a few dozen UI strings, no pluralization or ICU formatting needs — a plain TypeScript object per language kept the dependency footprint at zero.
- **Compile-time-enforced completeness.** Each non-English dictionary (`apps/web/src/i18n/translations/{nl,de,fr}.ts`) is type-checked against the English dictionary's exact shape — a missing (or extra) translation key is a TypeScript build error, not a silent runtime gap.
- **One shared language state.** A `LanguageProvider` React context (`apps/web/src/i18n/language-provider.tsx`) holds the selected language; a `useTranslation()` hook exposes a `t(key)` lookup function to every component. There's no prop-drilling of the current language through the component tree.
- **Selecting a language re-fetches visible data, not just UI text.** Because the product-search and product-detail queries already key on the selected language, changing it immediately triggers a live re-fetch of whatever's on screen (search results, an open product detail) in the new language — not just a swap of button/label text — with a loading overlay covering that window.
- **Product data language** comes from Open Food Facts' own localized fields, requested via the same `lang` the UI is currently showing.

## Known limitations

- **No automated tests for `apps/web` yet.** `apps/api` has a Vitest suite (unit tests for controllers, the Open Food Facts integration, and the Stripe webhook handler); the frontend has none.
- **Translations (Dutch, German, French) are a good-faith effort**, not reviewed by a native speaker or professional translator.
- **Selected UI language doesn't persist** across a page reload — it resets to English.
- **Local Stripe webhook delivery depends on `stripe listen` running continuously.** Unlike Stripe's automatic retry-with-backoff for a real registered production webhook endpoint, the CLI's local forwarding does not retry a failed delivery — if `apps/api` isn't up at the exact moment an event is forwarded, that event is lost unless manually resent (`stripe events resend <event_id>`). This is mitigated for the one flow the backend itself initiates (cancellation, synced directly from the API response — see "Technical decisions" above), but externally-triggered events (a renewal, a dashboard cancellation) still depend on the listener being live.
- **Single hardcoded demo user**, seeded on boot, with no authentication — by design, per the brief's single-user scope, not something intended to extend to multiple accounts as-is.
