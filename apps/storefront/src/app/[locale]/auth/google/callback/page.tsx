"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { medusa } from "@/lib/medusa";
import { getSafeReturnUrl } from "@/lib/auth-utils";

/**
 * Decode JWT payload without verification (Medusa already validated the token).
 * Payload is base64url-encoded middle segment.
 */
function decodeJwtPayload(token: string): { actor_id?: string; user_metadata?: Record<string, unknown> } {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return {};
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = typeof atob !== "undefined" ? atob(base64) : Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(json) as { actor_id?: string; user_metadata?: Record<string, unknown> };
  } catch {
    return {};
  }
}

export default function GoogleCallbackPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "da";
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"finalizing" | "redirecting">("finalizing");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const queryParams = Object.fromEntries(searchParams.entries());
    const returnUrlFromQuery = searchParams.get("returnUrl") ?? "";
    const returnUrlFromStorage = typeof window !== "undefined" ? sessionStorage.getItem("guapo_google_return_url") : null;
    if (typeof window !== "undefined" && returnUrlFromStorage) {
      sessionStorage.removeItem("guapo_google_return_url");
    }
    const returnUrl = returnUrlFromQuery || returnUrlFromStorage || "";
    const destination = getSafeReturnUrl(returnUrl, `/${locale}/account`);

    const validateCallback = async () => {
      try {
        setPhase("finalizing");
        const token = await medusa.auth.callback("customer", "google", queryParams);
        const decoded = decodeJwtPayload(token);
        const shouldCreateCustomer = !decoded.actor_id || decoded.actor_id === "";

        if (shouldCreateCustomer) {
          const email = typeof decoded.user_metadata?.email === "string" ? decoded.user_metadata.email : "";
          if (!email) {
            throw new Error("Missing email in Google callback payload");
          }
          await medusa.store.customer.create({ email });
          await medusa.auth.refresh();
        }

        if (!cancelled) {
          setPhase("redirecting");
          window.location.href = destination;
        }
      } catch (err) {
        if (!cancelled) {
          setError("Authentication failed. Please try again.");
          setLoading(false);
        }
      }
    };

    validateCallback();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (error) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12">
        <p className="text-destructive">{error}</p>
        <a href={`/${locale}/login`} className="mt-4 inline-block text-primary hover:underline">
          {locale === "da" ? "Tilbage til log ind" : "Back to sign in"}
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-muted-foreground" role="status" aria-live="polite">
            {phase === "finalizing"
              ? locale === "da"
                ? "Færdiggør login med Google..."
                : "Finalizing Google sign in..."
              : locale === "da"
                ? "Viderestiller..."
                : "Redirecting..."}
          </p>
        </div>
      </div>
    </div>
  );
}
