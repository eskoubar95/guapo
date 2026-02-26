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

## 3. Stripe Webhook (Deployed Environments)

Medusa’s Stripe payment module exposes a webhook endpoint that verifies the Stripe signature and handles payment events.

**Webhook URL (production/staging):**
```
{MEDUSA_SERVER_URL}/hooks/payment/stripe_stripe
```

Example: `https://your-medusa.railway.app/hooks/payment/stripe_stripe`

**Configure in Stripe Dashboard:**
1. Developers → Webhooks → Add endpoint
2. URL: your Medusa server URL + `/hooks/payment/stripe_stripe`
3. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.amount_capturable_updated`, `payment_intent.partially_funded`
4. Copy the signing secret (whsec_…) and set `STRIPE_WEBHOOK_SECRET` in your Medusa environment

**Behavior:** The Stripe module verifies the `Stripe-Signature` header and updates payment/order status on success or failure.

## 4. E2E Payment Test (t9.5 Staging Gate)

With Stripe and Medusa configured:

1. Set `STRIPE_API_KEY` (test key sk_test_…), `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_KEY` (pk_test_…)
2. Run `pnpm -C apps/commerce seed` (enables Stripe for Denmark)
3. Start Medusa: `pnpm -C apps/commerce dev`
4. Start storefront: `pnpm -C apps/storefront dev`
5. Go to checkout, complete steps 1–3; use Stripe test card 4242 4242 4242 4242
6. Confirm order is created and payment succeeds
