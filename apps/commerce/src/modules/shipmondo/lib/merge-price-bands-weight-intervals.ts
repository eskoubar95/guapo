import type { ShipmondoPriceBand, ShipmondoWeightInterval } from "../types";

/**
 * Build cumulative price bands (max_grams = interval.to_weight) from Shipmondo weight_intervals,
 * reusing amount_minor from existing bands when max_grams matches.
 */
export function mergePriceBandsWithWeightIntervals(
  intervals: ShipmondoWeightInterval[],
  existingBands: ShipmondoPriceBand[]
): ShipmondoPriceBand[] {
  if (!intervals.length) return [...existingBands];
  const sorted = [...intervals].sort((a, b) => a.to_weight - b.to_weight);
  const amountByMax = new Map<number, number>();
  for (const b of existingBands) {
    if (typeof b.max_grams === "number" && typeof b.amount_minor === "number") {
      amountByMax.set(Math.round(b.max_grams), Math.round(b.amount_minor));
    }
  }
  return sorted.map((iv) => {
    const maxG = Math.max(0, Math.round(iv.to_weight));
    let amountMinor = amountByMax.get(maxG);
    if (amountMinor === undefined) {
      const fromG = Math.round(iv.from_weight);
      amountMinor = amountByMax.get(fromG);
    }
    if (amountMinor === undefined) {
      for (const b of existingBands) {
        if (typeof b.max_grams === "number" && b.max_grams >= iv.from_weight && b.max_grams <= iv.to_weight) {
          amountMinor = b.amount_minor;
          break;
        }
      }
    }
    return {
      max_grams: maxG,
      amount_minor: amountMinor ?? 0,
    };
  });
}

export function formatWeightIntervalLabel(iv: ShipmondoWeightInterval): string {
  const fromG = Math.max(0, Math.round(iv.from_weight));
  const toG = Math.max(0, Math.round(iv.to_weight));
  if (fromG >= 1000 || toG >= 1000) {
    const fk = fromG / 1000;
    const tk = toG / 1000;
    return `${fk}–${tk} kg (${fromG}–${toG} g)`;
  }
  return `${fromG}–${toG} g`;
}
