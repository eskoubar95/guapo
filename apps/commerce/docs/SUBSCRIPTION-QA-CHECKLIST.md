# Subscription QA checklist (local / staging)

Use this after a successful **mixed cart** (subscription + one-time) checkout. Replace IDs with yours from Admin or order confirmation.

## Step 0 — Checkout amount parity (must pass before renewal tests)

Goal: ensure shipping/free-shipping is reflected in both cart and payment session.

- [ ] Build cart over free-shipping threshold and select pickup shipping method.
- [ ] Confirm `/store/free-shipping-status?cart_id=...` returns `qualifies: true`.
- [ ] Confirm latest payment UI (Stripe/Klarna/card) shows the same total as checkout summary.
- [ ] Verify DB parity for active cart:
  - `cart_shipping_method_adjustment` exists for shipping method when qualified.
  - `payment_collection.amount` matches checkout total.
  - latest `payment_session.amount` matches `payment_collection.amount`.

For debugging stale amounts, see `docs/CHECKOUT_FLOWS.md` section "Payment amount source of truth (critical)".

---

## Prerequisites

- `STRIPE_API_KEY` set (test key for local).
- `DATABASE_URL` points at the DB where the order/subscription exists.
- Commerce running is **not** required for `medusa exec` (script boots its own container).

---

## Step 1 — Mixed order + subscription row (done)

- [x] Checkout shows correct totals (incl. subscription discount, shipping rules).
- [x] `order.placed` creates subscription; no DB errors.
- Note **Order ID** and **Subscription ID** from Admin.

---

## Step 2 — Renewal (off-session charge + new order)

**Option A – Direct workflow (fastest)**

```bash
cd apps/commerce
npx medusa exec ./src/scripts/simulate-renewal.ts <SUBSCRIPTION_ID>
# Or (always works): SUBSCRIPTION_ID=sub_01XXX npx medusa exec ./src/scripts/simulate-renewal.ts
```

**Note:** With `medusa exec`, the subscription id must be the **last** argument (or use `SUBSCRIPTION_ID` env). The CLI injects `exec` before the script path, so parsing only `argv[2]` used to pick up `"exec"` by mistake — fixed in `simulate-renewal.ts`.

**Option B – Full E2E script (uses your order, optional reset of `next_renewal_at`)**

```bash
cd apps/commerce
ORDER_ID=order_01XXX RESET_DUE_NOW=1 pnpm simulate-e2e
```

`RESET_DUE_NOW=1` sets `next_renewal_at` to yesterday and clears `skip_next` so the renewal run matches how the daily job would see a “due” subscription.

**Verify**

- Log: `✅ Renewal success. Order created: order_…`
- Admin → Subscription: `delivery_count` increased, `next_renewal_at` advanced, `last_renewal_order_id` updated.
- New order linked to the same subscription (module link).

---

## Step 3 — Skip next renewal

1. In **Admin → Subscription detail**, use **Skip next** (or `POST /admin/subscriptions/:id/skip` with body per API).
2. Run renewal again:

```bash
npx medusa exec ./src/scripts/simulate-renewal.ts <SUBSCRIPTION_ID>
```

**Expected**

- Result: skipped (no new order, no Stripe charge for that cycle).
- `skip_next` cleared and `next_renewal_at` advanced per implementation.

---

## Step 4 — Admin surfaces (manual)

- [ ] Subscription list + detail load; **Retry now** / pause / resume / cancel as applicable.
- [ ] Order widget shows subscription link for initial + renewal orders.
- [ ] Address edit saves (admin).

---

## Step 5 — Store self-service (manual / curl)

- [ ] `POST /store/subscriptions/:id/update` (authenticated customer) — address change.
- [ ] `POST /store/subscriptions/:id/payment-method` — SetupIntent flow (test card `4242…`).

---

## Step 6 — Rate limit (optional)

Spam `POST` to store subscription routes → expect `429` with `RATE_LIMITED` (unless disabled via env).

---

## Step 7 — Failure modes (advanced)

- **SCA / `authentication_required`**: use Stripe test flows that trigger `requires_action`; expect `on_hold`, `last_failure_reason`, no futile retry loop.
- **Order creation after successful charge**: should refund PI and set failure context (see logs).

---

## Subscription impact note (important)

These checkout amount-sync fixes do **not** change subscription renewal pricing logic directly.

What is affected:
- Initial checkout session creation amount accuracy (including mixed carts).
- Reduced risk of stale payment session amount during checkout race windows.

What is not changed by this checklist:
- Renewal billing workflow (`run-subscription-renewal`) calculation path.
- Stored setup intent / off-session retry strategy.

---

## Reference IDs (fill in)

| Field            | Value |
|------------------|-------|
| Subscription ID  | `01KME1RXQF3DT0GVN6NN8GH7A0` |
| Initial Order ID | `order_01KME1RTX1BQY9SV1H0DXCG140` |

After a successful renewal, add the **renewal order ID** here for traceability.
