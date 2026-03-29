import type { MedusaContainer } from "@medusajs/framework/types";
import { fetchProductsForCatalogSelection } from "./fetch-products-for-catalog-selection";
import { buildServiceCodesForSelection } from "./lib/build-service-codes-for-selection";
import { upsertShipmondoShippingOptions } from "./upsert-shipping-options";

const SHIPMONDO_CONFIG_MODULE = "shipmondo_config";

type ConfigService = {
  listShipmondoEnabledProducts: (f: object) => Promise<{ id: string; product_code: string; carrier_name: string }[]>;
  createShipmondoEnabledProducts: (
    data: { product_code: string; carrier_name: string; enabled?: boolean; display_order?: number }[]
  ) => Promise<unknown[]>;
  updateShipmondoEnabledProducts: (data: { id: string; enabled?: boolean }[]) => Promise<unknown>;
};

export type ProductSelectionInput = {
  product_code: string;
  /** Per-carrier Shipmondo filter (e.g. gls). Strongly recommended for catalog apply. */
  carrier_code?: string;
  /** When omitted, falls back to global emailNotification. */
  email_notification?: boolean;
  /** When omitted, falls back to global smsNotification. */
  sms_notification?: boolean;
};

export type ApplyCatalogSelectionInput = {
  receiverCountryCode: string;
  senderCountryCode?: string;
  /** Product codes to enable and sync (must exist in fresh API response). Used when productSelections is omitted. */
  productCodes: string[];
  /**
   * Per-product notification toggles (wizard). When non-empty, drives which codes sync and EMAIL_NT/SMS_NT per product.
   * When omitted, productCodes + emailNotification + smsNotification are used.
   */
  productSelections?: ProductSelectionInput[];
  emailNotification: boolean;
  smsNotification: boolean;
  /** If true, catalog fetch only returns service_point products. */
  servicePointOnly?: boolean;
};

/**
 * Guided setup: fetch products from Shipmondo for corridor, upsert enabled rows, create/update shipping options
 * with service_codes derived from API + notification toggles.
 */
export async function applyShipmondoCatalogSelection(
  scope: MedusaContainer,
  input: ApplyCatalogSelectionInput
): Promise<{ created: number; updated: number; message: string; errors?: string[] }> {
  const apiUser = process.env.SHIPMONDO_API_USER ?? "";
  const apiKey = process.env.SHIPMONDO_API_KEY ?? "";
  const sandbox = process.env.SHIPMONDO_SANDBOX === "true";
  if (!apiUser || !apiKey) {
    throw new Error("SHIPMONDO_API_USER and SHIPMONDO_API_KEY required");
  }

  const receiver = input.receiverCountryCode.trim().toUpperCase() || "DK";
  const sender = input.senderCountryCode?.trim().toUpperCase();
  const servicePointOnly = input.servicePointOnly !== false;

  const selectionRows =
    input.productSelections && input.productSelections.length > 0
      ? input.productSelections
          .map((s) => ({
            code: s.product_code.trim(),
            carrierCode: s.carrier_code?.trim(),
            emailNt: s.email_notification,
            smsNt: s.sms_notification,
          }))
          .filter((s) => s.code.length > 0)
      : input.productCodes.map((c) => ({
          code: c.trim(),
          carrierCode: undefined as string | undefined,
          emailNt: undefined as boolean | undefined,
          smsNt: undefined as boolean | undefined,
        }));

  const allProducts = await fetchProductsForCatalogSelection({
    apiUser,
    apiKey,
    sandbox,
    receiver,
    sender,
    servicePointOnly,
    selectionRows: selectionRows.map((r) => ({ code: r.code, carrierCode: r.carrierCode })),
  });

  const want = new Set(selectionRows.map((s) => s.code));
  const byCodeToggles = new Map(selectionRows.map((s) => [s.code, s]));

  const selected = allProducts.filter((p) => want.has(p.code));
  if (selected.length === 0) {
    return {
      created: 0,
      updated: 0,
      message:
        "No matching products for the selected codes. Load the catalog again — codes may differ per Shipmondo account.",
    };
  }

  const missingCodes = [...want].filter((c) => !selected.some((p) => p.code === c));
  const partialNote =
    missingCodes.length > 0
      ? ` Kunne ikke matche fra API: ${missingCodes.join(", ")}.`
      : "";

  try {
    const config = scope.resolve(SHIPMONDO_CONFIG_MODULE) as ConfigService;
    const existing = await config.listShipmondoEnabledProducts({});
    const byCode = new Map((Array.isArray(existing) ? existing : []).map((e) => [e.product_code, e]));
    const toCreate: { product_code: string; carrier_name: string; enabled: boolean; display_order: number }[] = [];
    const toUpdate: { id: string; enabled: boolean }[] = [];
    let order = 0;
    for (const p of selected) {
      const cur = byCode.get(p.code);
      if (cur) {
        toUpdate.push({ id: cur.id, enabled: true });
      } else {
        toCreate.push({
          product_code: p.code,
          carrier_name: p.name ?? p.code,
          enabled: true,
          display_order: order++,
        });
      }
    }
    if (toUpdate.length) await config.updateShipmondoEnabledProducts(toUpdate);
    if (toCreate.length) await config.createShipmondoEnabledProducts(toCreate);
  } catch {
    /* shipmondo_config module optional */
  }

  const items = selected.map((product) => {
    const row = byCodeToggles.get(product.code);
    const emailNt = row?.emailNt ?? input.emailNotification;
    const smsNt = row?.smsNt ?? input.smsNotification;
    return {
      product,
      service_codes: buildServiceCodesForSelection(product, {
        emailNt,
        smsNt,
      }),
    };
  });

  const { created, updated, errors } = await upsertShipmondoShippingOptions(scope, items);

  let message = `Tilføjet/opdateret: ${created} nye options, ${updated} opdateret. Sæt priser under fanen Priser.${partialNote}`;
  if (errors?.length) {
    message += ` Opdateringsfejl: ${errors.join("; ")}`;
  }

  return {
    created,
    updated,
    message,
    ...(errors?.length ? { errors } : {}),
  };
}
