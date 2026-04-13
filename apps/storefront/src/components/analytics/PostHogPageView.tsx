"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { capturePosthogPageview } from "@/lib/analytics/posthog-ecommerce";

/**
 * Sends a PostHog $pageview on route changes (Next.js App Router).
 * Must render inside Suspense when using useSearchParams.
 */
export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || typeof window === "undefined") return;
    const qs = searchParams?.toString();
    const url = `${window.location.origin}${pathname}${qs ? `?${qs}` : ""}`;
    capturePosthogPageview(url);
  }, [pathname, searchParams]);

  return null;
}
