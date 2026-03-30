"use client";

import posthog from "posthog-js";
import { useEffect, useRef } from "react";
import { useConsentValue } from "@/components/cookie-consent";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const hasAnalyticsConsent = useConsentValue("analytics");
  const initialized = useRef(false);

  useEffect(() => {
    if (!POSTHOG_KEY) return;

    if (hasAnalyticsConsent) {
      if (!initialized.current) {
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          person_profiles: "identified_only",
          cookieless_mode: "on_reject",
        });
        initialized.current = true;
      }
      posthog.opt_in_capturing();
    } else {
      if (initialized.current) {
        posthog.opt_out_capturing();
      }
    }
  }, [hasAnalyticsConsent]);

  return <>{children}</>;
}
