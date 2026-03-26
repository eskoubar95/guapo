import type { MedusaContainer } from "@medusajs/framework/types";
import { buildServiceCodesFromProduct } from "./lib/build-service-codes-from-product";
import { fetchShipmondoProducts } from "./fetch-products";
import type { ShipmondoProduct } from "./types";
import { upsertShipmondoShippingOptions } from "./upsert-shipping-options";

const SHIPMONDO_CONFIG_MODULE = "shipmondo_config";

export type RunShipmondoSyncResult = { created: number; updated: number; message: string };

/**
 * Run sync: fetch products from Shipmondo, filter by enabled, create/update shipping options.
 * scope = Medusa container (e.g. req.scope or ExecArgs container).
 */
export async function runShipmondoSync(scope: MedusaContainer): Promise<RunShipmondoSyncResult> {
  const apiUser = process.env.SHIPMONDO_API_USER ?? "";
  const apiKey = process.env.SHIPMONDO_API_KEY ?? "";
  const sandbox = process.env.SHIPMONDO_SANDBOX === "true";
  if (!apiUser || !apiKey) {
    return { created: 0, updated: 0, message: "SHIPMONDO_API_USER and SHIPMONDO_API_KEY required" };
  }

  let products: ShipmondoProduct[];
  try {
    products = await fetchShipmondoProducts({ apiUser, apiKey, sandbox });
  } catch (e) {
    throw e;
  }
  if (products.length === 0) {
    return {
      created: 0,
      updated: 0,
      message: "No products from Shipmondo API (check SHIPMONDO_SANDBOX vs credentials and that account has DK service_point products).",
    };
  }

  const countFromApi = products.length;
  try {
    const config = scope.resolve(SHIPMONDO_CONFIG_MODULE) as {
      listShipmondoEnabledProducts: (f: object) => Promise<{ product_code: string }[]>;
    };
    const enabledList = await config.listShipmondoEnabledProducts({});
    const enabledCodes = Array.isArray(enabledList) ? enabledList.map((e) => e.product_code) : [];
    if (enabledCodes.length > 0) {
      products = products.filter((p) => enabledCodes.includes(p.code));
    }
  } catch {
    // use all products
  }

  if (products.length === 0) {
    return {
      created: 0,
      updated: 0,
      message: countFromApi > 0
        ? `No enabled products to sync: API returned ${countFromApi} product(s) but none match enabled list. Add carriers above and enable them, or clear shipmondo_enabled_products to sync all.`
        : "No enabled products to sync.",
    };
  }

  const items = products.map((product) => ({
    product,
    service_codes: buildServiceCodesFromProduct(product),
  }));
  const { created, updated, errors: upsertErrors } = await upsertShipmondoShippingOptions(scope, items);

  let message = `Sync done: ${created} created, ${updated} updated. Set prices in Admin.`;
  if (upsertErrors.length > 0) {
    message += ` Warnings: ${upsertErrors.join("; ")}`;
  }
  return { created, updated, message };
}
