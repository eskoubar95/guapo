import { model } from "@medusajs/framework/utils";

export const ShipmondoEnabledProduct = model.define("shipmondo_enabled_products", {
  id: model.id().primaryKey(),
  product_code: model.text().unique(),
  carrier_name: model.text(),
  enabled: model.boolean().default(true),
  display_order: model.number().nullable(),
});
