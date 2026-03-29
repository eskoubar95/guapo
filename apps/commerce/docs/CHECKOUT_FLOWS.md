# Checkout Flows

## Overview

Guapo supports two checkout flows:
1. **Guest Checkout** - For one-time purchases (no account required)
2. **Authenticated Checkout** - For subscriptions (account required)

## Payment amount source of truth (critical)

For checkout correctness, treat these as separate states that must be synchronized:

1. **Cart totals** (decorated totals shown to storefront)
2. **Payment collection amount** (persisted value used by Medusa payment-session workflow)
3. **Stripe/Klarna PaymentIntent amount** (what Klarna widget displays and customer authorizes)

### Required order of operations

1. Update cart data (`POST /store/carts/:id`)
2. Add shipping method (`POST /store/carts/:id/shipping-methods`)
3. Apply/remove free-shipping adjustment on shipping method (subscriber)
4. Refresh payment collection for cart (`refreshPaymentCollectionForCartWorkflow`)
5. Create payment session (`POST /store/payment-collections/:id/payment-sessions`)

If step 5 runs before 3+4 are fully applied, Klarna may show an old amount.

### Current Guapo hardening

- Free shipping is applied as a shipping-method adjustment in `sync-free-shipping-promotion.ts`.
- Subscriber now retries briefly when shipping method amount is not yet ready (race guard).
- Stripe provider (`payment-stripe-guapo`) resolves cart totals and uses cart total for PaymentIntent amount when available, to avoid stale payment-collection reads in edge timing windows.

### Validation query (DB)

When debugging a mismatch, verify all three values match:
- `medusa.cart_shipping_method_adjustment`
- `medusa.payment_collection.amount`
- `medusa.payment_session.amount` (latest)

## Guest Checkout (One-time Purchases)

Medusa supports guest checkout out-of-the-box. No authentication is required.

### Flow
1. Customer browses products
2. Customer adds items to cart (`POST /store/carts/:id/line-items`)
3. Customer enters shipping details (`POST /store/carts/:id`)
4. Customer selects shipping method (`POST /store/carts/:id/shipping-methods`)
5. Customer creates payment session (`POST /store/payment-collections`)
6. Customer completes checkout (order created)

### Cart Creation
```bash
# Create cart (no auth required)
curl -X POST 'http://localhost:9000/store/carts' \
  -H 'Content-Type: application/json' \
  -H 'x-publishable-api-key: YOUR_KEY' \
  --data '{
    "region_id": "reg_xxx"
  }'
```

## Authenticated Checkout (Subscriptions)

Subscriptions require a customer account for:
- Storing payment methods for recurring billing
- Managing subscription (pause, skip, cancel)
- Viewing order history

### Flow
1. Customer creates account or logs in
2. Customer adds subscription item to cart
3. Customer enters/selects saved shipping details
4. Customer adds/selects payment method (tokenized for recurring)
5. Customer completes checkout with subscription

### Mixed carts (subscription + one-time)

Mixed carts follow the authenticated subscription path:
- Customer must be authenticated
- Checkout forces card-based flow (no Klarna/MobilePay for subscription carts)
- Shipping/free-shipping logic still applies to the full cart total before payment session

### Authentication
```bash
# Register customer
curl -X POST 'http://localhost:9000/auth/customer/emailpass/register' \
  -H 'Content-Type: application/json' \
  --data '{
    "email": "customer@example.com",
    "password": "securepassword"
  }'

# Login
curl -X POST 'http://localhost:9000/auth/customer/emailpass' \
  -H 'Content-Type: application/json' \
  --data '{
    "email": "customer@example.com",
    "password": "securepassword"
  }'
```

## Subscription Gating (Implementation Notes)

To enforce account requirement for subscriptions:

### Option 1: Frontend Gating (Recommended for MVP)
- Check if cart contains subscription items
- If subscription items exist and user not logged in, prompt login/register
- Block checkout button until authenticated

### Option 2: Backend Middleware (Future)
Create a middleware in `src/api/middlewares.ts`:
```typescript
import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework";

export async function requireAuthForSubscriptions(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  // Check if cart has subscription items
  const hasSubscription = checkCartForSubscriptions(req.body.cart_id);
  
  if (hasSubscription && !req.auth?.actor_id) {
    return res.status(401).json({
      message: "Account required for subscriptions",
      code: "subscription_requires_auth"
    });
  }
  
  next();
}
```

## Subscription Configuration

Per spec, subscriptions have:
- **Cycles**: 4, 8, or 12 weeks
- **Discount**: 5% on all renewals
- **Minimum commitment**: 2 deliveries before cancellation
- **Controls**: Skip, pause, resume, cancel (after commitment)

## Email Notifications (Plunk)

Triggered emails:
- Order confirmation
- Subscription created
- Renewal reminder (3 days before)
- Payment failed (with 2 retry attempts over 3 days)
- Subscription paused/resumed/cancelled
