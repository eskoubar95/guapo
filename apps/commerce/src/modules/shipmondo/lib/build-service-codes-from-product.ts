import type { ShipmondoProduct } from "../types";

const OPTIONAL_NOTIFICATION_CODES = ["EMAIL_NT", "SMS_NT"] as const;

/**
 * Build Shipmondo `service_codes` string from GET /products payload:
 * required_services first, then EMAIL_NT / SMS_NT if listed in available_services and not already required.
 * Falls back to EMAIL_NT,SMS_NT when the API lists no services (defensive).
 */
export function buildServiceCodesFromProduct(product: ShipmondoProduct): string {
  const seen = new Set<string>();
  const ordered: string[] = [];

  const push = (code: string) => {
    const c = code.trim();
    if (!c || seen.has(c)) return;
    seen.add(c);
    ordered.push(c);
  };

  for (const s of product.required_services ?? []) {
    push(s.code);
  }

  const available = new Set((product.available_services ?? []).map((s) => s.code));
  for (const code of OPTIONAL_NOTIFICATION_CODES) {
    if (available.has(code)) push(code);
  }

  if (ordered.length === 0) {
    return "EMAIL_NT,SMS_NT";
  }

  return ordered.join(",");
}
