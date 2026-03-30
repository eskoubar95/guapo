"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface AccountGateProps {
  locale: string;
  loadingLabel?: string;
  children: React.ReactNode;
}

/**
 * Protects account routes: redirects to login with returnUrl and reason if not authenticated.
 */
export function AccountGate({ locale, loadingLabel = "Loading…", children }: AccountGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      const params = new URLSearchParams();
      const returnUrl = `${pathname ?? `/${locale}/account`}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
      params.set("returnUrl", returnUrl);
      params.set("reason", "auth_required");
      router.replace(`/${locale}/login?${params.toString()}`);
    }
  }, [locale, isAuthenticated, loading, router, pathname, searchParams]);

  if (loading) {
    return (
      <div
        className="flex min-h-[200px] items-center justify-center text-muted-foreground"
        role="status"
        aria-live="polite"
        aria-label={loadingLabel}
      >
        {loadingLabel}
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
