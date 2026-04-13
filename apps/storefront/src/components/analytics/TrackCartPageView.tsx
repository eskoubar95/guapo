"use client";

import { useEffect, useRef } from "react";
import { trackCartViewed } from "@/lib/analytics/posthog-ecommerce";

export function TrackCartPageView(props: {
  itemCount: number;
  cartValue: number;
}) {
  const { itemCount, cartValue } = props;
  const trackedRef = useRef(false);

  useEffect(() => {
    if (itemCount < 1 || trackedRef.current) return;
    trackedRef.current = true;
    trackCartViewed({
      surface: "cart_page",
      item_count: itemCount,
      cart_value: cartValue,
    });
  }, [itemCount, cartValue]);

  return null;
}
