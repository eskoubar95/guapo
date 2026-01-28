# Checkout Flows

## Overview

Guapo supports two checkout flows:
1. **Guest Checkout** - For one-time purchases (no account required)
2. **Authenticated Checkout** - For subscriptions (account required)

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
