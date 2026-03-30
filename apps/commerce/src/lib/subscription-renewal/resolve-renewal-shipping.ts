import type { Logger } from "@medusajs/framework/types";

import { getShippingOptionRowFromDb } from "../../modules/shipmondo/lib/db";
import {
  getFlatAmountFromOption,
  getFlatRateMinorFromEnv,
  getPriceBandsFromOptionData,
  priceFromBands,
} from "../../modules/shipmondo/lib/pricing";

type ResolveRenewalShippingInput = {
  shippingOptionId: string;
  itemTotalGrossDkk: number;
  freeShippingThresholdDkk: number;
  quantity: number;
  variantWeightGrams?: number | null;
  vatRatePercent?: number;
  logger: Logger;
};

export type RenewalShippingResult = {
  shippingExVatDkk: number;
  shippingGrossDkk: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function toSafeVatDecimal(vatRatePercent: number | undefined): number {
  if (typeof vatRatePercent !== "number" || !Number.isFinite(vatRatePercent) || vatRatePercent < 0) {
    return 0.25;
  }
  return vatRatePercent / 100;
}

function resolveRenewalShippingMinorFromOptionData(
  optionData: Record<string, unknown> | null,
  quantity: number,
  variantWeightGrams?: number | null
): number {
  const bands = getPriceBandsFromOptionData(optionData ?? undefined);
  const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
  const weight = typeof variantWeightGrams === "number" && variantWeightGrams > 0
    ? variantWeightGrams
    : 0;

  if (weight > 0 && bands.length > 0) {
    const totalWeight = Math.round(weight * qty);
    const fromBands = priceFromBands(totalWeight, bands);
    if (fromBands !== null) return fromBands;
  }

  const flat = getFlatAmountFromOption(optionData ?? undefined);
  if (flat !== null) return flat;

  return getFlatRateMinorFromEnv();
}

/**
 * Renewal shipping amount based on Shipmondo option configuration (ex-VAT source),
 * then converted to gross for payment totals.
 */
export async function resolveRenewalShipping({
  shippingOptionId,
  itemTotalGrossDkk,
  freeShippingThresholdDkk,
  quantity,
  variantWeightGrams,
  vatRatePercent,
  logger,
}: ResolveRenewalShippingInput): Promise<RenewalShippingResult> {
  const qualifiesForFreeShipping =
    itemTotalGrossDkk > 0 && itemTotalGrossDkk >= freeShippingThresholdDkk;

  if (!shippingOptionId || qualifiesForFreeShipping) {
    return { shippingExVatDkk: 0, shippingGrossDkk: 0 };
  }

  const row = await getShippingOptionRowFromDb(shippingOptionId, logger);
  const shippingMinor = resolveRenewalShippingMinorFromOptionData(
    row?.optionData ?? null,
    quantity,
    variantWeightGrams
  );

  const shippingExVatDkk = round2(shippingMinor / 100);
  const shippingGrossDkk = round2(shippingExVatDkk * (1 + toSafeVatDecimal(vatRatePercent)));

  return { shippingExVatDkk, shippingGrossDkk };
}
