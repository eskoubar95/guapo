# Stripe Payment Setup

## 1. Environment Variables

Set in `apps/commerce/.env` (see `env.template`):

- `STRIPE_API_KEY` – Secret key (sk_*) from Stripe Dashboard
- `STRIPE_WEBHOOK_SECRET` – Webhook signing secret (whsec_*) for deployed environments

Set in `apps/storefront/.env.local`:

- `NEXT_PUBLIC_STRIPE_KEY` – Publishable key (pk_*) for PaymentElement

## 2. Enable Stripe in Denmark Region

**Option A – Seed script (recommended)**

With `STRIPE_API_KEY` set, run:

```bash
pnpm -C apps/commerce seed
```

This enables Stripe as the payment provider for the Denmark region. If the region already exists, it is updated.

**Option B – Medusa Admin**

1. Start Medusa: `pnpm -C apps/commerce dev`
2. Open Admin: http://localhost:9000/app
3. Go to **Settings → Regions → Denmark**
4. Edit region and select **Stripe** as payment provider
