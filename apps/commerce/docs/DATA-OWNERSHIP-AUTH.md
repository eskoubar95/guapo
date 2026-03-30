# Data ownership: customer and account

Customer identity, account, and account-related data are owned by **Medusa (commerce)** only. This document states the guardrails so we avoid Supabase auth or CMS overlap.

## Rules

1. **Customer auth**  
   Storefront customer login, registration, and session are handled by Medusa (email/password and Google OAuth). Auth context and `actor_id` are set by Medusa middleware. Do not introduce a separate customer-identity or auth layer (e.g. Supabase Auth, Auth0) that would require mapping external identities to Medusa customers.

2. **Supabase**  
   Supabase is used as **database and (optionally) storage** for this project. It is not used as an app-level auth provider or customer-identity store. Do not add `supabase-js` client usage for customer sign-in or account management.

3. **Payload / CMS**  
   Payload owns **content** (pages, navigation, blog, PDP guidance, etc.). It does not own customer accounts, order history, subscriptions, or any transactional or account-state data. Do not add customer or order management to CMS; keep that in commerce (Medusa) and storefront calling Medusa store APIs.

4. **Single source of truth**  
   Customer id, orders, subscriptions, and fulfillment/tracking are stored and queried in Medusa (and its database schema). Storefront account pages (orders, subscriptions, profile) must use Medusa store APIs and session only.

## Reference

- Auth and session: Medusa auth module + store middleware (`authenticate("customer", ["session", "bearer"])`).
- Customer data: Medusa customer module; storefront uses `medusa.store.customer.*` and custom store routes (e.g. `/store/orders`, `/store/subscriptions`).
- See also: `spec/10-cms-commerce-synergy.md` (cart, checkout, orders, subscriptions, customers in Medusa).
