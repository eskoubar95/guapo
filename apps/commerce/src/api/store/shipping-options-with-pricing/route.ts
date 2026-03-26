import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { listShippingOptionsForCartWithPricingWorkflow } from "@medusajs/medusa/core-flows";
import type { ITaxModuleService } from "@medusajs/types";

/** DK standard moms når region/moms ikke kan slås op. */
const FALLBACK_VAT_DECIMAL = 0.25;

function readIsTaxInclusive(o: Record<string, unknown>): boolean {
  if (o.is_tax_inclusive === true) return true;
  const cp = o.calculated_price as Record<string, unknown> | undefined;
  return cp?.is_calculated_price_tax_inclusive === true;
}

function readRawAmount(o: Record<string, unknown>): number {
  if (typeof o.amount === "number") return o.amount;
  const cp = o.calculated_price as Record<string, unknown> | undefined;
  if (typeof cp?.calculated_amount === "number") return cp.calculated_amount;
  return 0;
}

/**
 * Moms som decimal (fx 0,25) for kurvens leveringsland (shipping_address),
 * ellers DK-fallback. Bruges til at vise inkl.-moms fragt i storefront.
 */
async function resolveCartShippingVatDecimal(
  scope: MedusaRequest["scope"],
  cartId: string
): Promise<number> {
  const cartModule = scope.resolve(Modules.CART) as {
    retrieveCart: (
      id: string,
      config: { relations: string[] }
    ) => Promise<{
      shipping_address?: { country_code?: string | null } | null;
    }>;
  };

  let cart: { shipping_address?: { country_code?: string | null } | null };
  try {
    cart = await cartModule.retrieveCart(cartId, {
      relations: ["shipping_address"],
    });
  } catch {
    return FALLBACK_VAT_DECIMAL;
  }

  const country =
    cart.shipping_address?.country_code?.toLowerCase() ?? "dk";

  const taxModule = scope.resolve(Modules.TAX) as ITaxModuleService;

  try {
    const regions = await taxModule.listTaxRegions({
      country_code: country,
    });
    const parent =
      regions.find((r) => r.province_code == null) ?? regions[0];
    if (!parent?.id) return FALLBACK_VAT_DECIMAL;

    const rates = await taxModule.listTaxRates({
      tax_region_id: parent.id,
    });
    const def = rates.find((r) => r.is_default) ?? rates[0];
    const pct = def?.rate;
    if (typeof pct === "number" && Number.isFinite(pct)) {
      return pct / 100;
    }
  } catch {
    // fallback nedenfor
  }

  return FALLBACK_VAT_DECIMAL;
}

function toTaxInclusiveAmount(
  amount: number,
  isTaxInclusive: boolean,
  vatDecimal: number
): number {
  if (isTaxInclusive) return amount;
  return amount * (1 + vatDecimal);
}

function readCarrierAndProductFromOption(o: Record<string, unknown>): {
  carrier_code: string | null;
  product_code: string | null;
} {
  const d = o.data as Record<string, unknown> | undefined;
  if (!d || typeof d !== "object") {
    return { carrier_code: null, product_code: null };
  }
  const carrierRaw = d.carrier_code;
  const carrier_code =
    typeof carrierRaw === "string" && carrierRaw.trim().length > 0
      ? carrierRaw.trim().toLowerCase()
      : null;
  let product_code: string | null = null;
  if (typeof d.product_code === "string" && d.product_code.length > 0) {
    product_code = d.product_code;
  } else if (typeof d.id === "string" && d.id.length > 0 && !d.id.startsWith("so_")) {
    product_code = d.id;
  }
  return { carrier_code, product_code };
}

/**
 * GET /store/shipping-options-with-pricing?cart_id=xxx
 * Returns shipping options with calculated prices (weight-based from Shipmondo provider).
 * Amounts are **tax-inclusive (gross)** for storefront display when the provider returns ex-VAT.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const cartId = req.query?.cart_id as string | undefined;
  if (!cartId) {
    return res.status(400).json({
      message: "cart_id query parameter is required",
      code: "MISSING_CART_ID",
    });
  }

  try {
    const { result } = await listShippingOptionsForCartWithPricingWorkflow(req.scope).run({
      input: { cart_id: cartId },
    });

    const options = Array.isArray(result) ? result : [];
    const vatDecimal = await resolveCartShippingVatDecimal(req.scope, cartId);

    const shipping_options = options.map((o: Record<string, unknown>) => {
      const isTaxInclusive = readIsTaxInclusive(o);
      const raw = readRawAmount(o);
      const amount = toTaxInclusiveAmount(raw, isTaxInclusive, vatDecimal);

      const cp = o.calculated_price as Record<string, unknown> | undefined;
      let calculated_price = o.calculated_price;
      if (cp && typeof cp.calculated_amount === "number" && !isTaxInclusive) {
        calculated_price = {
          ...cp,
          calculated_amount: toTaxInclusiveAmount(
            cp.calculated_amount as number,
            false,
            vatDecimal
          ),
          is_calculated_price_tax_inclusive: true,
        };
      }

      const { carrier_code, product_code } = readCarrierAndProductFromOption(o);

      return {
        id: o.id,
        name: o.name,
        amount,
        calculated_price,
        carrier_code,
        product_code,
      };
    });

    return res.json({ shipping_options });
  } catch (err) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER) as { error: (m: string) => void };
    logger.error(
      `[shipping-options-with-pricing] ${err instanceof Error ? err.message : String(err)}`
    );
    return res.status(500).json({
      message: "Failed to load shipping options",
      code: "SHIPPING_OPTIONS_ERROR",
    });
  }
};
