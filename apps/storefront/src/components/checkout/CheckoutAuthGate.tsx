"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal, type AuthModalLabels } from "@/components/auth/AuthModal";

interface CheckoutAuthGateProps {
  locale: string;
  hasSubscriptionItems: boolean;
  authLabels: AuthModalLabels;
  children: React.ReactNode;
}

export function CheckoutAuthGate({
  locale,
  hasSubscriptionItems,
  authLabels,
  children,
}: CheckoutAuthGateProps) {
  const { customer } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<"login" | "register">("login");
  const needsAuth = hasSubscriptionItems && !customer;

  if (needsAuth) {
    return (
      <>
        <div className="rounded-lg border border-border bg-card p-6 sm:p-8 text-center">
          <p className="text-base font-medium text-foreground">
            {locale === "da"
              ? "Du skal oprette en konto for at abonnere."
              : "You need to create an account to subscribe."}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {locale === "da"
              ? "Din kurv indeholder abonnementsprodukter. Log ind eller opret en konto for at fortsætte."
              : "Your cart contains subscription products. Log in or create an account to continue."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setAuthModalView("login");
                setAuthModalOpen(true);
              }}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
            >
              {locale === "da" ? "Log ind" : "Log in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthModalView("register");
                setAuthModalOpen(true);
              }}
              className="rounded-lg border-2 border-primary px-6 py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              {locale === "da" ? "Opret konto" : "Create account"}
            </button>
          </div>
        </div>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          locale={locale}
          labels={authLabels}
          initialView={authModalView}
        />
      </>
    );
  }

  return <>{children}</>;
}
