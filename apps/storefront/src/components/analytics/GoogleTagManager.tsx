"use client";

import { useCookieConsent } from "@/components/cookie-consent/cookie-provider";
import { useEffect, useRef } from "react";

const GTM_SCRIPT_ID = "guapo-gtm-js";

function removeGtmScripts(): void {
  document.getElementById(GTM_SCRIPT_ID)?.remove();
  document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]').forEach((el) => {
    el.remove();
  });
}

function injectGtm(containerId: string): void {
  const w = window;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const script = document.createElement("script");
  script.id = GTM_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
  document.head.appendChild(script);
}

export interface GoogleTagManagerProps {
  /** Resolved container id (GTM-XXXX) or null to skip */
  containerId: string | null;
}

/**
 * Loads google Tag Manager after the user grants analytics or marketing consent.
 * Pairs with Google Consent Mode (defaults + updates) from CookieConsentWrapper.
 */
export function GoogleTagManager({ containerId }: GoogleTagManagerProps) {
  const { hasConsent } = useCookieConsent();
  const activeIdRef = useRef<string | null>(null);

  const allow =
    Boolean(containerId && /^GTM-[A-Z0-9]+$/.test(containerId)) &&
    (hasConsent("analytics") || hasConsent("marketing"));

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!allow || !containerId) {
      if (activeIdRef.current !== null) {
        removeGtmScripts();
        activeIdRef.current = null;
      }
      return;
    }

    if (activeIdRef.current === containerId) return;

    if (activeIdRef.current) {
      removeGtmScripts();
    }

    injectGtm(containerId);
    activeIdRef.current = containerId;
  }, [allow, containerId]);

  return null;
}
