/**
 * Normalize amounts from Medusa workflows / query.graph (number, BigNumber, raw JSON) to **major DKK**
 * for JSON responses. Guapo Medusa amounts are stored and exposed as decimal DKK (e.g. 112.5 = 112,50 kr.),
 * not integer øre — see `apps/commerce/src/lib/free-shipping-cart-total.ts` and storefront `format.ts`.
 */
export function toAmountMajor(value: unknown): number | undefined {
  if (value == null) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  if (typeof value === "object" && value !== null) {
    const v = value as Record<string, unknown>;
    if (typeof v.toJSON === "function") {
      const j = (v.toJSON as () => unknown)();
      if (typeof j === "number" && Number.isFinite(j)) return j;
    }
    if (typeof v.numeric_ === "number" && Number.isFinite(v.numeric_)) {
      return v.numeric_;
    }
    if (typeof v.numeric === "number" && Number.isFinite(v.numeric)) {
      return v.numeric;
    }
    const raw = v.raw_ as { value?: string } | undefined;
    if (raw?.value != null && String(raw.value).trim() !== "") {
      const n = Number(String(raw.value).trim());
      if (Number.isFinite(n)) return n;
    }
    if ("value" in v && v.value != null) {
      const inner = v.value as string | number;
      if (typeof inner === "number" && Number.isFinite(inner)) return inner;
      if (typeof inner === "string" && inner.trim() !== "") {
        const n = Number(inner);
        if (Number.isFinite(n)) return n;
      }
    }
  }
  return undefined;
}
