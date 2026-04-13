"use client";

import { Suspense } from "react";
import {
  CookieConsentProvider,
  CookieBanner,
  CookieSettings,
  CookieTrigger,
  GoogleConsentMode,
} from "@/components/cookie-consent";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
import { PostHogPageView } from "@/components/analytics/PostHogPageView";

const CONSENT_VERSION = "1.0.0";

interface CookieConsentWrapperProps {
  children: React.ReactNode;
  locale: string;
  /** Resolved GTM-XXXX from CMS / env; when set, direct GA snippet is skipped to avoid double counting. */
  gtmContainerId?: string | null;
}

export function CookieConsentWrapper({
  children,
  locale,
  gtmContainerId = null,
}: CookieConsentWrapperProps) {
  const privacyPolicyUrl = `/${locale}/policies/privacy`;

  return (
    <CookieConsentProvider
      config={{
        consentVersion: CONSENT_VERSION,
        privacyPolicyUrl,
        position: "bottom",
        googleConsentMode: { enabled: true },
      }}
    >
      {/* Set Google Consent Mode v2 default (denied) before any gtag loads */}
      <GoogleConsentMode />
      <PostHogProvider>
        <Suspense fallback={null}>
          <PostHogPageView />
        </Suspense>
        <GoogleTagManager containerId={gtmContainerId ?? null} />
        {!gtmContainerId ? <GoogleAnalytics /> : null}
        {children}
      </PostHogProvider>
      <CookieBanner />
      <CookieSettings />
      <CookieTrigger />
    </CookieConsentProvider>
  );
}
