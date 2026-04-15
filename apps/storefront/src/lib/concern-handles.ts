/** Handles for `/[locale]/concerns/[handle]` PLP routes (must match concern page config). */
export const CONCERN_PLP_HANDLES = [
  "acne",
  "dryness",
  "sensitivity",
  "redness",
  "hyperpigmentation",
  "dullness",
] as const;

export type ConcernPlpHandle = (typeof CONCERN_PLP_HANDLES)[number];
