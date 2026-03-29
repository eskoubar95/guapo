/**
 * Guapo Stripe provider (pp_stripe_stripe). Regional Stripe methods (Bancontact, iDEAL, …)
 * come from a separate @medusajs/medusa/payment-stripe registration if you need them.
 */
import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import GuapoStripeProviderService from "./services/guapo-stripe.service";

export default ModuleProvider(Modules.PAYMENT, {
  services: [GuapoStripeProviderService],
});
