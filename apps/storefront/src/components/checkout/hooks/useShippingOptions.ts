"use client";

import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { medusa } from "@/lib/medusa";
import type { ShippingOption } from "@/components/checkout/checkout-shipping.types";

function pickDefaultOptionId(opts: ShippingOption[], prev: string | null): string | null {
  if (prev && opts.some((opt) => opt.id === prev)) return prev;
  const pakkeshop = opts.find(
    (opt) => opt.name.toLowerCase().includes("pakkeshop") || opt.name.toLowerCase().includes("gls")
  );
  return (pakkeshop ?? opts[0])?.id ?? null;
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
    if (!cartId) return;
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
      .then((data: { shipping_options?: Array<{ id: string; name?: string; amount?: number }> }) => {
        const rawList = data?.shipping_options ?? [];
        const opts = rawList.map((o) => ({
          id: o.id,
          name: o.name ?? "",
          amount: typeof o.amount === "number" ? o.amount : 0,
        }));
        setShippingOptions(opts);
        setSelectedShippingOptionId((prev) => pickDefaultOptionId(opts, prev));
      })
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
            }>;
            const opts = list.map((o) => ({
              id: o.id,
              name: o.name ?? "",
              amount: o.amount ?? o.calculated_price?.calculated_amount ?? o.prices?.[0]?.amount ?? 0,
            }));
            setShippingOptions(opts);
            setSelectedShippingOptionId((prev) => pickDefaultOptionId(opts, prev));
          })
          .catch(() => {
            if (!ac.signal.aborted) setShippingOptions([]);
          });
      });

    return () => ac.abort();
  }, [cartId]);

  return { shippingOptions, selectedShippingOptionId, setSelectedShippingOptionId };
}
