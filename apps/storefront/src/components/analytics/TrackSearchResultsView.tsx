"use client";

import { useEffect, useRef } from "react";
import { trackSearchResultsViewed } from "@/lib/analytics/posthog-ecommerce";

export function TrackSearchResultsView(props: {
  query: string;
  productCount: number;
  articleCount: number;
}) {
  const { query, productCount, articleCount } = props;
  const trackedRef = useRef(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || trackedRef.current) return;
    trackedRef.current = true;
    trackSearchResultsViewed({
      query: q,
      product_count: productCount,
      article_count: articleCount,
      source: "page",
    });
  }, [query, productCount, articleCount]);

  return null;
}
