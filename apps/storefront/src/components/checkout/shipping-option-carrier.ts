import type { ShippingOption } from "@/components/checkout/checkout-shipping.types";
import type { CarrierCode } from "@/components/checkout/steps/checkout-utils";

function normCarrier(code: string | null | undefined): string | null {
  if (typeof code !== "string" || !code.trim()) return null;
  return code.trim().toLowerCase();
}

/** Prefer stable `carrier_code` from Medusa option data; fallback to legacy name heuristics. */
export function pickDefaultShippingOptionId(opts: ShippingOption[], prev: string | null): string | null {
  if (prev && opts.some((opt) => opt.id === prev)) return prev;
  const byCarrier = opts.find((o) => normCarrier(o.carrier_code) === "gls");
  if (byCarrier) return byCarrier.id;
  const byName = opts.find((opt) => {
    const n = opt.name.toLowerCase();
    return n.includes("pakkeshop") || n.includes("gls") || n.includes("shopdelivery");
  });
  return (byName ?? opts[0])?.id ?? null;
}

export function findDefaultPakkeshopOption(opts: ShippingOption[]): ShippingOption | undefined {
  const byCarrier = opts.find((o) => normCarrier(o.carrier_code) === "gls");
  if (byCarrier) return byCarrier;
  return (
    opts.find((o) => {
      const n = o.name.toLowerCase();
      return n.includes("pakkeshop") || n.includes("gls") || n.includes("shopdelivery");
    }) ?? opts[0]
  );
}

export function findShippingOptionForCarrier(
  opts: ShippingOption[],
  carrier: CarrierCode
): ShippingOption | undefined {
  const match = opts.find((o) => normCarrier(o.carrier_code) === carrier);
  if (match) return match;
  if (carrier === "pdk") {
    return opts.find((o) => {
      const n = o.name.toLowerCase();
      return n.includes("postnord") || n.includes("pdk") || n.includes("service point");
    });
  }
  if (carrier === "dao") {
    return opts.find((o) => {
      const n = o.name.toLowerCase();
      return n.includes("dao");
    });
  }
  return opts.find((o) => {
    const n = o.name.toLowerCase();
    return n.includes("gls") || n.includes("pakkeshop") || n.includes("shopdelivery");
  });
}
