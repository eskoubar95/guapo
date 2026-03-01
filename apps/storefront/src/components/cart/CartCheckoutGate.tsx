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
}

export function CartCheckoutGate({
  locale,
  hasSubscriptionItems,
  checkoutLabel,
  checkoutHref,
  disabledMessage,
  authLabels,
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

  return (
    <div className="space-y-3">
      {needsAuth && (
        <p className="text-sm text-muted-foreground">
          {msg}{" "}
          <button
            type="button"
            onClick={() => {
              setAuthModalView("login");
              setAuthModalOpen(true);
            }}
            className="font-medium text-primary hover:underline"
          >
            {locale === "da" ? "Log ind" : "Log in"}
          </button>
          {" / "}
          <button
            type="button"
            onClick={() => {
              setAuthModalView("register");
              setAuthModalOpen(true);
            }}
            className="font-medium text-primary hover:underline"
          >
            {locale === "da" ? "Opret konto" : "Create account"}
          </button>
        </p>
      )}
      {needsAuth ? (
        <span
          aria-disabled="true"
          className="block w-full cursor-not-allowed rounded-full border border-border bg-muted/50 px-8 py-4 text-center text-sm font-medium text-muted-foreground"
        >
          {checkoutLabel}
        </span>
      ) : (
        <Link
          href={checkoutHref}
          className="block w-full rounded-full bg-primary px-8 py-4 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
