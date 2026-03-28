# Store Orders API

Customer-facing order history and order detail. Requires authenticated customer (session or bearer). All routes filter by `customer_id = auth_context.actor_id`.

## Endpoints

### GET /store/orders

List orders for the authenticated customer. Sorted by `created_at` descending.

**Query parameters (optional):**

- `limit` (number, default 20, max 50)
- `offset` (number, default 0)

**Response 200:**

```json
{
  "orders": [
    {
      "id": "order_xxx",
      "display_id": 1001,
      "status": "completed",
      "created_at": "2026-03-01T12:00:00.000Z",
      "total": 426,
      "currency_code": "dkk",
      "tracking_url": null
    }
  ],
  "count": 1,
  "offset": 0,
  "limit": 20
}
```

- `total`: Order total in **decimal DKK** (major units), same as other Guapo Medusa store amounts — not integer øre.

- `tracking_url`: First available fulfillment tracking URL for the order, or `null` if none.

### GET /store/orders/:id

Retrieve one order. Returns 404 if not found, 403 if not owned by the current customer.

**Response 200:**

```json
{
  "order": {
    "id": "order_xxx",
    "display_id": 1001,
    "status": "completed",
    "created_at": "2026-03-01T12:00:00.000Z",
    "total": 426,
    "currency_code": "dkk",
    "shipping_total": 39,
    "items": [
      {
        "id": "item_xxx",
        "title": "Product title",
        "variant_id": "variant_xxx",
        "quantity": 1,
        "unit_price": 189,
        "total": 189,
        "metadata": {}
      }
    ],
    "shipping_address": {},
    "tracking_url": "https://...",
    "tracking_number": "1234567890"
  }
}
```

- `tracking_url`, `tracking_number`: From first fulfillment when available (e.g. Shipmondo). Omitted or null if not fulfilled or no tracking.

## Auth

All routes require `authenticate("customer", ["session", "bearer"])`. Middleware is registered in `src/api/middlewares.ts`.

## Usage from storefront

Use cookie-forwarding (same as subscriptions) so the Medusa session is sent. See `apps/storefront/src/lib/subscriptions.ts` for the pattern; create `apps/storefront/src/lib/orders.ts` that calls `GET /store/orders` and `GET /store/orders/:id`.
