"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface AccountGateProps {
  locale: string;
  loadingLabel?: string;
  children: React.ReactNode;
}

/**
 * Protects account routes: redirects to login if not authenticated.
 */
export function AccountGate({ locale, loadingLabel = "Loading…", children }: AccountGateProps) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace(`/${locale}/login`);
    }
  }, [locale, isAuthenticated, loading, router]);

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
