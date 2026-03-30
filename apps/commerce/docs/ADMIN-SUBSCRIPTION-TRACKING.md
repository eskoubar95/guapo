# Admin: subscription and tracking surfaces

What subscription and tracking information is (or should be) visible in Medusa Admin for operations and support.

## Subscription

- **Order detail (order.details.after)**  
  Widget `src/admin/widgets/order-subscription.tsx` shows subscriptions linked to the order (initial or renewal). Displays: status, cycle_weeks, delivery_count, next_renewal_at, and a link to the subscription detail page.

- **Subscriptions list**  
  `src/admin/routes/subscriptions/page.tsx`: list all subscriptions with customer_id, status, cycle_weeks, next_renewal_at, delivery_count, discount_percent, variant_id, quantity. Filter by status.

- **Subscription detail**  
  `src/admin/routes/subscriptions/[id]/page.tsx`: full subscription record (customer_id, status, cycle, next/last renewal, delivery_count, discount, variant/quantity, Stripe ids, addresses, shipping_option_id, skip_next, retry state). Supports pause/resume/cancel/skip (calls admin API).

Recommendation: keep these as the single source for subscription operations. Optional later: show linked order IDs (from subscription-order link) on subscription detail.

## Tracking (fulfillment)

- **Order fulfillments**  
  Medusa core order detail in Admin typically shows fulfillments when present (e.g. after creating a fulfillment with Shipmondo). Each fulfillment can expose tracking_number and tracking_url from the provider.

- **Current gap**  
  If the default order UI does not show tracking_url prominently, consider adding a small “Tracking” section or widget on order detail that reads fulfillment data (e.g. from order.fulfillments or the fulfillment module) and displays tracking link and number for support and customer reference.

Recommendation: rely on Medusa’s built-in fulfillment display for tracking on the order; if missing, add an order detail widget that shows first fulfillment’s tracking_url and tracking_number.
