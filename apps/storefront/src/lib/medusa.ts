import Medusa from "@medusajs/js-sdk";

/**
 * Medusa SDK instance for storefront
 * 
 * Configure with environment variables:
 * - NEXT_PUBLIC_MEDUSA_BACKEND_URL: Medusa backend URL (default: http://localhost:9000)
 * - NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: Publishable API key from Medusa Admin
 */

export const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

export const medusa = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
});

// Re-export for convenience
export { Medusa };
