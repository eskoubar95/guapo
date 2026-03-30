import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

type QueryGraph = {
  graph: (opts: {
    entity: string;
    fields: string[];
    filters?: Record<string, unknown>;
    pagination?: { take: number; skip: number };
    order?: Record<string, string>;
  }) => Promise<{ data: unknown[]; metadata?: { count?: number } }>;
};

type AddressLike = {
  first_name?: string;
  last_name?: string;
  address_1?: string;
  city?: string;
  postal_code?: string;
  country_code?: string;
};

type PreferredPickupSummary = {
  name: string;
  address: string;
  postal_code: string;
  city: string;
  carrier_code?: string | null;
};

function normalizeCarrierCode(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  return raw.trim().toLowerCase();
}

function parsePreferredPickupFromCustomerMetadata(metadata: unknown): PreferredPickupSummary | null {
  if (!metadata || typeof metadata !== "object") return null;
  const m = metadata as Record<string, unknown>;
  const raw = m.preferred_pickup_point;
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const name = typeof p.name === "string" ? p.name : "";
  const address = typeof p.address === "string" ? p.address : "";
  const postal_code = typeof p.zipcode === "string" ? p.zipcode : "";
  const city = typeof p.city === "string" ? p.city : "";
  if (!name && !address && !postal_code && !city) return null;
  const carrier_code = normalizeCarrierCode(p.carrier_code);
  return { name, address, postal_code, city, carrier_code };
}

/**
 * GET /store/account/summary
 * Authenticated customer summary for account overview.
 */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const customerId = req.auth_context.actor_id;
  const query = req.scope.resolve("query") as QueryGraph;

  const [{ data: customers }, { data: orders, metadata: orderMeta }, { data: subscriptions }] =
    await Promise.all([
      query.graph({
        entity: "customer",
        fields: ["id", "email", "first_name", "last_name", "metadata"],
        filters: { id: customerId },
      }),
      query.graph({
        entity: "order",
        fields: ["id", "created_at", "metadata", "shipping_methods.data"],
        filters: { customer_id: customerId },
        pagination: { take: 5, skip: 0 },
        order: { created_at: "DESC" },
      }),
      query.graph({
        entity: "subscription",
        fields: ["id", "status", "delivery_data", "shipping_address", "metadata"],
        filters: { customer_id: customerId },
      }),
    ]);

  const customer = (customers?.[0] ?? null) as
    | { id: string; email?: string; first_name?: string; last_name?: string; metadata?: unknown }
    | null;
  if (!customer) {
    return res.status(404).json({
      message: "Customer not found",
      code: "CUSTOMER_NOT_FOUND",
    });
  }

  const activeSubscriptions = (subscriptions ?? []).filter(
    (sub) => ((sub as { status?: string }).status ?? "") === "active"
  );

  const fromProfile = parsePreferredPickupFromCustomerMetadata(customer?.metadata);

  const fromSubscription = activeSubscriptions
    .map((sub) => {
      const deliveryData = (sub as { delivery_data?: Record<string, unknown> }).delivery_data;
      if (!deliveryData || typeof deliveryData !== "object") return null;
      const name = typeof deliveryData.service_point_name === "string" ? deliveryData.service_point_name : "";
      const address =
        typeof deliveryData.service_point_address === "string" ? deliveryData.service_point_address : "";
      const city = typeof deliveryData.service_point_city === "string" ? deliveryData.service_point_city : "";
      const postalCode =
        typeof deliveryData.service_point_zipcode === "string" ? deliveryData.service_point_zipcode : "";
      if (!name && !address && !postalCode && !city) return null;
      const carrier_code = normalizeCarrierCode(deliveryData.carrier_code);
      return { name, address, postal_code: postalCode, city, carrier_code };
    })
    .find(Boolean) as PreferredPickupSummary | undefined;

  const fromOrder = (orders ?? [])
    .map((order) => {
      const shippingMethods = (order as { shipping_methods?: Array<{ data?: Record<string, unknown> }> })
        .shipping_methods;
      const data = shippingMethods?.[0]?.data;
      if (!data || typeof data !== "object") return null;
      const name = typeof data.service_point_name === "string" ? data.service_point_name : "";
      const address = typeof data.service_point_address === "string" ? data.service_point_address : "";
      const city = typeof data.service_point_city === "string" ? data.service_point_city : "";
      const postalCode = typeof data.service_point_zipcode === "string" ? data.service_point_zipcode : "";
      if (!name && !address && !postalCode && !city) return null;
      const carrier_code = normalizeCarrierCode(data.carrier_code);
      return { name, address, postal_code: postalCode, city, carrier_code };
    })
    .find(Boolean) as PreferredPickupSummary | undefined;

  const preferredPickup: PreferredPickupSummary | null =
    fromProfile ?? fromSubscription ?? fromOrder ?? null;

  const paymentMethodSnapshot =
    (orders ?? [])
      .map((order) => {
        const meta = (order as { metadata?: Record<string, unknown> }).metadata ?? {};
        const brand = typeof meta.payment_brand === "string" ? meta.payment_brand : "";
        const last4 = typeof meta.payment_last4 === "string" ? meta.payment_last4 : "";
        if (!brand && !last4) return null;
        return { brand, last4 };
      })
      .find(Boolean) ?? null;
  const subscriptionPaymentSnapshot =
    activeSubscriptions
      .map((sub) => {
        const meta = (sub as { metadata?: Record<string, unknown> }).metadata ?? {};
        const brand = typeof meta.payment_brand === "string" ? meta.payment_brand : "";
        const last4 = typeof meta.payment_last4 === "string" ? meta.payment_last4 : "";
        if (!brand && !last4) return null;
        return { brand, last4 };
      })
      .find(Boolean) ?? null;

  const recentOrders = (orders ?? []).map((order) => ({
    id: (order as { id: string }).id,
    created_at: (order as { created_at?: string }).created_at,
  }));

  const fallbackAddress =
    activeSubscriptions
      .map((sub) => (sub as { shipping_address?: AddressLike }).shipping_address ?? null)
      .find(Boolean) ?? null;

  res.json({
    summary: {
      customer: {
        id: customer.id,
        email: customer.email ?? null,
        first_name: customer.first_name ?? null,
        last_name: customer.last_name ?? null,
      },
      metrics: {
        order_count: Number(orderMeta?.count ?? 0),
        active_subscription_count: activeSubscriptions.length,
      },
      preferred_pickup: preferredPickup,
      fallback_shipping_address: fallbackAddress,
      payment_method: paymentMethodSnapshot ?? subscriptionPaymentSnapshot,
      recent_orders: recentOrders,
    },
  });
};
