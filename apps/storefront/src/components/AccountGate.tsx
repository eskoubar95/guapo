"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      const params = new URLSearchParams();
      if (pathname) params.set("returnUrl", pathname);
      params.set("reason", "auth_required");
      router.replace(`/${locale}/login?${params.toString()}`);
    }
  }, [locale, isAuthenticated, loading, router, pathname]);

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
