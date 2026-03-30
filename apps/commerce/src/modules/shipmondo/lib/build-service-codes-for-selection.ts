import type { ShipmondoProduct } from "../types";

/**
 * Build `service_codes` for a product when merchant toggles optional notifications.
 * Always includes required_services; adds EMAIL_NT / SMS_NT only if allowed by available_services and toggles.
 */
export function buildServiceCodesForSelection(
  product: ShipmondoProduct,
  opts: { emailNt: boolean; smsNt: boolean }
): string {
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
  if (opts.emailNt && available.has("EMAIL_NT")) push("EMAIL_NT");
  if (opts.smsNt && available.has("SMS_NT")) push("SMS_NT");

  if (ordered.length === 0) {
    return "EMAIL_NT,SMS_NT";
  }

  return ordered.join(",");
}
