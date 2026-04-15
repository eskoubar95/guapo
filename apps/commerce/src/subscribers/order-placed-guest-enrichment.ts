import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/**
 * When a guest places an order, update the guest Customer record with
 * name and phone from the order's shipping address. Medusa creates a
 * minimal guest customer (email only) — this fills in the rest for Admin display.
 */
export default async function orderPlacedGuestEnrichment({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = event?.data?.id;
  if (!orderId) return;

  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (opts: {
      entity: string;
      fields: string[];
      filters?: Record<string, unknown>;
    }) => Promise<{ data: unknown[] }>;
  };

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id", "customer.id", "customer.has_account", "customer.first_name", "customer.last_name", "customer.phone", "shipping_address.first_name", "shipping_address.last_name", "shipping_address.phone"],
    filters: { id: orderId },
  });

  const order = orders?.[0] as {
    customer_id?: string | null;
    customer?: { id: string; has_account?: boolean; first_name?: string; last_name?: string; phone?: string } | null;
    shipping_address?: {
      first_name?: string;
      last_name?: string;
      phone?: string;
    } | null;
  } | undefined;

  if (!order?.customer_id || order.customer?.has_account !== false) {
    return;
  }

  const addr = order.shipping_address;
  const hasName = addr?.first_name || addr?.last_name;
  const hasPhone = addr?.phone;
  const cust = order.customer;
  const needsUpdate =
    (hasName && (!cust?.first_name || !cust?.last_name)) ||
    (hasPhone && !cust?.phone);

  if (!needsUpdate) return;

  try {
    const customerModule = container.resolve(Modules.CUSTOMER) as {
      updateCustomers: (
        id: string,
        data: { first_name?: string; last_name?: string; phone?: string }
      ) => Promise<unknown>;
    };
    await customerModule.updateCustomers(order.customer_id, {
      ...(hasName && {
        first_name: addr?.first_name ?? cust?.first_name ?? "",
        last_name: addr?.last_name ?? cust?.last_name ?? "",
      }),
      ...(hasPhone && { phone: addr?.phone ?? cust?.phone ?? "" }),
    });
  } catch (err) {
    console.warn(
      "[order-placed-guest-enrichment] Failed to update guest customer:",
      err instanceof Error ? err.message : String(err)
    );
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
