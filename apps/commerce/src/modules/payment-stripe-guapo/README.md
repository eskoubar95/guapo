# Guapo Stripe payment module provider

Extends Medusa’s Stripe payment flow with:

- Server-enforced `payment_method_types` from checkout (`payment_method_choice`).
- Subscription carts → card + `setup_future_usage: off_session`.
- PaymentIntent **metadata** and **amount_details** for Stripe Dashboard visibility.

Registered in `medusa-config.ts` as the `stripe` payment provider. This module only registers the **card/MobilePay/Klarna** Stripe service (`pp_stripe_stripe`). Other Stripe method IDs (Bancontact, iDEAL, …) are not registered here.

**Session → cart:** Send **`cart_id`** in `initiatePaymentSession` data. Provider loads cart for subscription/payment-method rules and passes through Medusa’s canonical payment amount.

**Docs:** [STRIPE-SETUP.md](../../docs/STRIPE-SETUP.md)

**Medusa reference:** [Payment Module Provider](https://docs.medusajs.com/resources/references/payment/provider#how-to-create-a-payment-module-provider) — provider service lives under `services/`; third-party logic stays testable in `lib/`.
