import Medusa from "@medusajs/js-sdk";

/**
 * Medusa SDK instance for storefront
 * 
 * Configure with environment variables:
 * - NEXT_PUBLIC_MEDUSA_BACKEND_URL: Medusa backend URL (default: http://localhost:9000)
 * - NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: Publishable API key from Medusa Admin
 */

export const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

/** Relative store paths (e.g. `/store/orders/.../documents/...`) → absolute backend URLs for `<a href>`. */
export function withMedusaBackendUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!path.startsWith("/")) return null;
  const base = MEDUSA_BACKEND_URL.replace(/\/$/, "");
  return `${base}${path}`;
}

export const medusa = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
});

// Re-export for convenience
export { Medusa };
