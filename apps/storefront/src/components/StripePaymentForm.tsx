"use client";

import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState } from "react";

interface StripePaymentFormProps {
  cartId: string;
  onError: (message: string) => void;
  onProcessing?: (processing: boolean) => void;
  locale: string;
  placeOrderLabel: string;
  termsAccepted?: boolean;
}

export function StripePaymentForm({
  cartId,
  onError,
  onProcessing,
  locale,
  placeOrderLabel,
  termsAccepted = true,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !termsAccepted) return;

    setLoading(true);
    onProcessing?.(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const returnUrl = `${origin}/${locale}/order-confirmation?cart_id=${cartId}`;
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          payment_method_data: {
            billing_details: {
              address: { country: "DK" },
            },
          },
        },
      });
      if (error) {
        onProcessing?.(false);
        onError(error.message ?? "Payment failed");
      }
    } catch (err) {
      onProcessing?.(false);
      onError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      onProcessing?.(false);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        options={{
          layout: { type: "accordion", defaultCollapsed: false },
          /** Show Apple Pay / Google Pay when Stripe + browser allow (needs HTTPS + verified domain for Apple Pay on web). */
          wallets: { applePay: "auto", googlePay: "auto" },
        }}
      />
      <button
        type="submit"
        disabled={!stripe || loading || !termsAccepted}
        className="w-full rounded-lg bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? locale === "da"
            ? "Behandler..."
            : "Processing..."
          : placeOrderLabel}
      </button>
      {!termsAccepted && (
        <p className="text-xs text-muted-foreground text-center">
          {locale === "da"
            ? "Accepter venligst betingelserne for at fortsætte"
            : "Please accept the terms to continue"}
        </p>
      )}
    </form>
  );
}
