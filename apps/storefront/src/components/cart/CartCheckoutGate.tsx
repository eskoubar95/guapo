"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal, type AuthModalLabels } from "@/components/auth/AuthModal";

interface CartCheckoutGateProps {
  locale: string;
  hasSubscriptionItems: boolean;
  checkoutLabel: string;
  checkoutHref: string;
  disabledMessage?: string;
  authLabels: AuthModalLabels;
  compact?: boolean;
}

export function CartCheckoutGate({
  locale,
  hasSubscriptionItems,
  checkoutLabel,
  checkoutHref,
  disabledMessage,
  authLabels,
  compact = false,
}: CartCheckoutGateProps) {
  const { customer } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<"login" | "register">("login");

  const needsAuth = hasSubscriptionItems && !customer;
  const msg =
    disabledMessage ??
    (locale === "da"
      ? "Du skal oprette en konto for at abonnere."
      : "You need to create an account to subscribe.");

  const btnBase = compact
    ? "rounded-lg px-6 py-2.5 text-sm font-medium whitespace-nowrap"
    : "block w-full rounded-lg px-6 py-3 text-sm font-medium text-center";

  return (
    <div className={compact ? "" : "space-y-3"}>
      {needsAuth && !compact && (
        <p className="text-sm text-muted-foreground">
          {msg}{" "}
          <button
            type="button"
            onClick={() => { setAuthModalView("login"); setAuthModalOpen(true); }}
            className="font-medium text-primary hover:underline"
          >
            {locale === "da" ? "Log ind" : "Log in"}
          </button>
          {" / "}
          <button
            type="button"
            onClick={() => { setAuthModalView("register"); setAuthModalOpen(true); }}
            className="font-medium text-primary hover:underline"
          >
            {locale === "da" ? "Opret konto" : "Create account"}
          </button>
        </p>
      )}
      {needsAuth ? (
        <span
          aria-disabled="true"
          className={`${btnBase} cursor-not-allowed border border-border bg-muted/50 text-muted-foreground`}
        >
          {checkoutLabel}
        </span>
      ) : (
        <Link
          href={checkoutHref}
          className={`${btnBase} bg-primary text-primary-foreground hover:bg-primary-hover transition-colors border border-transparent`}
        >
          {checkoutLabel}
        </Link>
      )}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        locale={locale}
        labels={authLabels}
        initialView={authModalView}
      />
    </div>
  );
}
