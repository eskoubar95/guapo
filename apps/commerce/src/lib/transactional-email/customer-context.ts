import type { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { resolveTransactionalLocale } from "./locale";

export type CustomerEmailContext = {
  email: string;
  locale: "da" | "en";
};

/**
 * Resolve customer email + preferred locale for transactional sends.
 */
export async function resolveCustomerEmailAndLocale(
  container: MedusaContainer,
  customerId: string
): Promise<CustomerEmailContext | null> {
  const customerModule = container.resolve(Modules.CUSTOMER) as {
    retrieveCustomer: (
      id: string
    ) => Promise<{ email?: string | null; metadata?: Record<string, unknown> | null }>;
  };
  try {
    const c = await customerModule.retrieveCustomer(customerId);
    const email = typeof c.email === "string" ? c.email.trim() : "";
    if (!email) return null;
    const meta = (c.metadata ?? {}) as Record<string, unknown>;
    const locale = resolveTransactionalLocale(
      (meta.preferred_locale ?? meta.locale ?? meta.preferredLocale) as string | undefined
    );
    return { email, locale };
  } catch {
    return null;
  }
}

/**
 * Order recipient: customer profile when linked, otherwise order email (guest).
 */
export async function resolveOrderRecipientContext(
  container: MedusaContainer,
  order: { email?: string | null; customer_id?: string | null }
): Promise<CustomerEmailContext | null> {
  if (order.customer_id) {
    const fromCustomer = await resolveCustomerEmailAndLocale(container, order.customer_id);
    if (fromCustomer) return fromCustomer;
  }
  const email = typeof order.email === "string" ? order.email.trim() : "";
  if (!email) return null;
  return { email, locale: "da" };
}

export function storefrontBaseUrl(): string {
  return (process.env.STOREFRONT_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function subscriptionsUrlForLocale(locale: "da" | "en"): string {
  return `${storefrontBaseUrl()}/${locale}/account/subscriptions`;
}

export function orderDetailUrlForLocale(locale: "da" | "en", orderId: string): string {
  return `${storefrontBaseUrl()}/${locale}/account/orders/${encodeURIComponent(orderId)}`;
}
