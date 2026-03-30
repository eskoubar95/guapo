import { model } from "@medusajs/framework/utils";

/**
 * Single-row store settings for free shipping (threshold + which Medusa promotion code).
 * Editable via Admin API; used by subscriber + store status endpoint.
 */
export const GuapoFreeShippingSetting = model.define("guapo_free_shipping_setting", {
  id: model.id().primaryKey(),
  /** Minimum cart total (DKK major units, same basis as storefront `getCartDisplayTotalItemsMinusDiscount`). */
  threshold_amount: model.number(),
  /** Medusa promotion code (e.g. FREESHIPPING). */
  promotion_code: model.text(),
  enabled: model.boolean().default(true),
});
