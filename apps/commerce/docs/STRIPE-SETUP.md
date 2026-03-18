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

## 5. Subscription Renewal (M9)

Subscriptions use Stripe off-session charging for renewals. When a subscription is due, the `subscription-renewal` job charges the saved payment method and creates a renewal order.

### Flow

1. **Checkout:** Subscription carts use `setup_future_usage: "off_session"` so Stripe saves the payment method to the customer.
2. **Order placed:** The `order.placed` subscriber creates Subscription records with `stripe_customer_id` and `stripe_payment_method_id`.
3. **Daily job:** `subscription-renewal` (cron: 8 AM) finds due subscriptions and runs the renewal workflow.
4. **Renewal workflow:**
   - Charge via `stripe.paymentIntents.create` (off_session, confirm: true)
   - On success: Create Medusa order, link to subscription, advance `next_renewal_at`
   - On failure: Set retry state (2 retries over ~3 days), then `on_hold`

### Retry / Recovery

- **Retry 1:** 1 day after payment failure
- **Retry 2:** 3 days after initial failure  
- **On hold:** After 2 failed retries; subscription is paused
- **Expiration:** Subscriptions on hold for >30 days are set to `expired`

Jobs:
- `subscription-renewal`: 8 AM daily (due subscriptions)
- `subscription-retry`: 9 AM daily (retry failed payments)
- `subscription-expiration`: 10 AM daily (expire old on_hold)

### Simulation (Staging)

Use Stripe **test mode** (sk_test_…, pk_test_…) so no real charges occur.

**Test cards (Stripe):**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

**1. Simulate subscription creation from an existing order**

If an order was placed with subscription line items but no subscription was created (e.g. before a fix), re-run the subscription-creation logic without a new checkout:

```bash
# From repo root; order_id from Medusa Admin → Orders or from order-confirmation URL
ORDER_ID=order_01XXX pnpm -C apps/commerce simulate-subscription-from-order
# Or: pnpm -C apps/commerce simulate-subscription-from-order -- order_01XXX
```

This emits `order.placed` for that order; the subscriber runs and creates subscription(s) using the order’s Stripe payment (customer + payment_method). Logs show payment_collections, Stripe IDs, and created subscription IDs. Safe to run multiple times (idempotent if order already has subscriptions).

**2. Simulate renewal (charge + new order)**

After you have a subscription ID (from step 1 or from a real checkout):

```bash
SUBSCRIPTION_ID=sub_xxx pnpm -C apps/commerce simulate-renewal
# Or: pnpm -C apps/commerce simulate-renewal -- sub_xxx
```

This runs the renewal workflow: Stripe off-session charge → create Medusa order → advance `next_renewal_at`. Use test mode so the charge is a test payment.

### E2E verification checklist (automatic renewal)

1. **Initial subscription order:** Log in, add a product as subscription (e.g. 8 weeks), complete checkout with test card 4242… Success. In Medusa Admin → Subscriptions, confirm one active subscription with `stripe_customer_id` and `stripe_payment_method_id` set.
2. **Simulate renewal:** Run `pnpm -C apps/commerce simulate-renewal` with that subscription ID. Confirm a new order is created and linked to the subscription; `next_renewal_at` advances.
3. **Failure path:** Create a subscription (or use one), then in Stripe Dashboard set the payment method to a card that will decline (e.g. 4000 0000 0000 0002). Run simulate-renewal; confirm retry state is set and after 2 retries subscription goes `on_hold`.
4. **Cron:** In production, ensure the worker runs the `subscription-renewal` job (cron 8 AM). No manual charge is required; renewals run automatically.
