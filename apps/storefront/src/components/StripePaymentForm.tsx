"use client";

import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState } from "react";

interface StripePaymentFormProps {
  cartId: string;
  onError: (message: string) => void;
  locale: string;
  placeOrderLabel: string;
}

export function StripePaymentForm({
  cartId,
  onError,
  locale,
  placeOrderLabel,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
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
        onError(error.message ?? "Payment failed");
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement options={{ layout: "tabs" }} />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? locale === "da"
            ? "Behandler..."
            : "Processing..."
          : placeOrderLabel}
      </button>
    </form>
  );
}
