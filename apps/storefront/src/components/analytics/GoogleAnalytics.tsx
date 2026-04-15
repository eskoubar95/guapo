"use client";

import { ConsentScript, scriptCleanupHelpers } from "@/components/cookie-consent";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <ConsentScript
      id="gtag"
      src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      category="analytics"
      onLoad={() => {
        if (typeof window === "undefined") return;
        window.dataLayer = window.dataLayer || [];
        function gtag(
          ...args: [string, string, ...Record<string, unknown>[]]
        ) {
          window.dataLayer?.push(args);
        }
        (window as unknown as { gtag: typeof gtag }).gtag = gtag;
        gtag("js", new Date().toISOString());
        gtag("config", GA_MEASUREMENT_ID!);
      }}
      onRevoke={() => {
        scriptCleanupHelpers.googleAnalytics();
      }}
    />
  );
}
