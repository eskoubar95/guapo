"use client";

import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { medusa } from "@/lib/medusa";
import type { ShippingOption } from "@/components/checkout/checkout-shipping.types";
import { pickDefaultShippingOptionId } from "@/components/checkout/shipping-option-carrier";

function mapApiShippingRow(o: {
  id: string;
  name?: string;
  amount?: number;
  carrier_code?: string | null;
  product_code?: string | null;
}): ShippingOption {
  return {
    id: o.id,
    name: o.name ?? "",
    amount: typeof o.amount === "number" ? o.amount : 0,
    carrier_code: o.carrier_code ?? null,
    product_code: o.product_code ?? null,
  };
}

function mapSdkShippingRow(o: {
  id: string;
  name?: string;
  amount?: number;
  calculated_price?: { calculated_amount?: number };
  prices?: Array<{ amount?: number }>;
  data?: Record<string, unknown> | null;
}): ShippingOption {
  const data = o.data && typeof o.data === "object" ? o.data : undefined;
  const carrierRaw = data?.carrier_code;
  const carrier_code =
    typeof carrierRaw === "string" && carrierRaw.trim().length > 0
      ? carrierRaw.trim().toLowerCase()
      : null;
  let product_code: string | null = null;
  if (typeof data?.product_code === "string" && data.product_code.length > 0) {
    product_code = data.product_code;
  } else if (
    typeof data?.id === "string" &&
    data.id.length > 0 &&
    !data.id.startsWith("so_")
  ) {
    product_code = data.id;
  }
  return {
    id: o.id,
    name: o.name ?? "",
    amount: o.amount ?? o.calculated_price?.calculated_amount ?? o.prices?.[0]?.amount ?? 0,
    carrier_code,
    product_code,
  };
}

/**
 * Loads cart shipping options with pricing (custom store route), falls back to Medusa SDK.
 */
export function useShippingOptions(cartId: string | null): {
  shippingOptions: ShippingOption[];
  selectedShippingOptionId: string | null;
  setSelectedShippingOptionId: Dispatch<SetStateAction<string | null>>;
} {
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState<string | null>(null);

  useEffect(() => {
    if (!cartId) {
      setShippingOptions([]);
      setSelectedShippingOptionId(null);
      return;
    }
    const ac = new AbortController();
    const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
    const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(key && { "x-publishable-api-key": key }),
    };

    fetch(
      `${baseUrl.replace(/\/$/, "")}/store/shipping-options-with-pricing?cart_id=${encodeURIComponent(cartId)}`,
      { headers, signal: ac.signal }
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Shipping options with pricing failed"))))
      .then(
        (data: {
          shipping_options?: Array<{
            id: string;
            name?: string;
            amount?: number;
            carrier_code?: string | null;
            product_code?: string | null;
          }>;
        }) => {
          const rawList = data?.shipping_options ?? [];
          const opts = rawList.map((o) => mapApiShippingRow(o));
          setShippingOptions(opts);
          setSelectedShippingOptionId((prev) => pickDefaultShippingOptionId(opts, prev));
        }
      )
      .catch((err: unknown) => {
        if (ac.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) return;
        medusa.store.fulfillment
          .listCartOptions({ cart_id: cartId })
          .then(({ shipping_options }) => {
            if (ac.signal.aborted) return;
            const list = (shipping_options ?? []) as Array<{
              id: string;
              name?: string;
              amount?: number;
              calculated_price?: { calculated_amount?: number };
              prices?: Array<{ amount?: number }>;
              data?: Record<string, unknown> | null;
            }>;
            const opts = list.map((o) => mapSdkShippingRow(o));
            setShippingOptions(opts);
            setSelectedShippingOptionId((prev) => pickDefaultShippingOptionId(opts, prev));
          })
          .catch(() => {
            if (!ac.signal.aborted) {
              setShippingOptions([]);
              setSelectedShippingOptionId(null);
            }
          });
      });

    return () => ac.abort();
  }, [cartId]);

  return { shippingOptions, selectedShippingOptionId, setSelectedShippingOptionId };
}
