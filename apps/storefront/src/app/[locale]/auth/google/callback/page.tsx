"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { medusa } from "@/lib/medusa";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const queryParams = Object.fromEntries(searchParams.entries());

    const validateCallback = async () => {
      try {
        const token = await medusa.auth.callback("customer", "google", queryParams);
        const decoded = decodeJwtPayload(token);
        const shouldCreateCustomer = !decoded.actor_id || decoded.actor_id === "";

        if (shouldCreateCustomer && decoded.user_metadata?.email) {
          await medusa.store.customer.create({
            email: decoded.user_metadata.email as string,
          });
          await medusa.auth.refresh();
        }

        if (!cancelled) {
          window.location.href = `/${locale}/account`;
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
      <p className="text-muted-foreground">
        {locale === "da" ? "Logger ind med Google..." : "Signing in with Google..."}
      </p>
    </div>
  );
}
