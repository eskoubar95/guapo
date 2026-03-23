"use client";

import { useEffect, useState } from "react";
import {
  fetchFreeShippingStatusClient,
  type FreeShippingStatusPayload,
} from "@/lib/free-shipping-status";

/**
 * Loads Medusa-driven free shipping status. Refetch when cart identity or item-total signal changes.
 */
export function useFreeShippingStatus(cartId: string | undefined, cartTotalBump?: number) {
  const [status, setStatus] = useState<FreeShippingStatusPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await fetchFreeShippingStatusClient();
      if (!cancelled) setStatus(s);
    })();
    return () => {
      cancelled = true;
    };
  }, [cartId, cartTotalBump]);

  return status;
}
