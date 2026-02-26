# M9 Subscription Tasks — Implementation Notes

Tasks t9.7, t9.8, t9.9 require subscription/recurring billing beyond one-time payment.

## t9.7 — Stripe recurring/mandate at subscription checkout

**Scope:** Subscription checkout supports Stripe SetupIntent for mandate; save payment method for renewal.

**Approach:**
- When cart contains subscription items: use SetupIntent (instead of PaymentIntent) to authorize recurring
- Store Stripe payment_method_id or SetupIntent result on customer/subscription
- Medusa v2: Subscriptions Recipe (docs.medusajs.com/resources/recipes/subscriptions)
- Stripe: SetupIntent + PaymentElement for mandate

## t9.8 — Subscription renewal charge

**Scope:** Renewal charge (webhook/cron); create order on success; retry (2 over 3 days) on failure.

**Approach:**
- Cron or Stripe subscription webhooks: `invoice.paid`, `invoice.payment_failed`
- On success: create Medusa order from subscription
- On failure: retry logic per spec (2 retries over 3 days); put subscription on hold after
- Requires subscription schedule + customer payment method from t9.7

## t9.9 — Staging gate

**Scope:** At least one renewal simulation in staging.

**Approach:**
- After t9.8: run a test subscription through full renewal cycle
- Document steps in STRIPE-SETUP.md or separate runbook
