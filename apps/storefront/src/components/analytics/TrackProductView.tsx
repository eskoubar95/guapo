"use client";

import { useEffect } from "react";
import { trackProductViewed } from "@/lib/analytics/posthog-ecommerce";

export interface TrackProductViewProps {
  productId: string;
  handle: string;
  name: string;
  price: number;
  currency: string;
  categoryName?: string;
}

export function TrackProductView({
  productId,
  handle,
  name,
  price,
  currency,
  categoryName,
}: TrackProductViewProps) {
  useEffect(() => {
    trackProductViewed({
      product_id: productId,
      handle,
      name,
      price,
      currency,
      ...(categoryName ? { category_name: categoryName } : {}),
    });
  }, [productId, handle, name, price, currency, categoryName]);

  return null;
}
