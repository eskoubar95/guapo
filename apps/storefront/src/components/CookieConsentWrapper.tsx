"use client";

import {
  CookieConsentProvider,
  CookieBanner,
  CookieSettings,
  CookieTrigger,
  GoogleConsentMode,
} from "@/components/cookie-consent";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

const CONSENT_VERSION = "1.0.0";

interface CookieConsentWrapperProps {
  children: React.ReactNode;
  locale: string;
}

export function CookieConsentWrapper({ children, locale }: CookieConsentWrapperProps) {
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
        <GoogleAnalytics />
        {children}
      </PostHogProvider>
      <CookieBanner />
      <CookieSettings />
      <CookieTrigger />
    </CookieConsentProvider>
  );
}
