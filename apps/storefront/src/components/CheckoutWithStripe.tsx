"use client";

import { useState, useEffect, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { medusa } from "@/lib/medusa";
import { CheckoutSteps } from "./CheckoutSteps";
import { StripePaymentForm } from "./StripePaymentForm";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY)
  : null;

interface CheckoutWithStripeProps {
  locale: string;
  dict: {
    checkout: {
      contact: string;
      shipping: string;
      payment: string;
      review: string;
      placeOrder: string;
      deliveryMethod: string;
      homeDelivery: string;
      homeDeliverySub: string;
      parcelShop: string;
      parcelShopSub: string;
      expressDelivery: string;
      expressDeliverySub: string;
      freeLabel: string;
      continueToPayment: string;
      nextStep: string;
      previousStep: string;
    };
  };
  confirmationHref: string;
}

export function CheckoutWithStripe({
  locale,
  dict,
  confirmationHref,
}: CheckoutWithStripeProps) {
  const [initData, setInitData] = useState<{
    region_id: string;
    variant_id: string;
  } | null>(null);
  const [cart, setCart] = useState<{ id: string } | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/checkout/init")
      .then((r) => r.json())
      .then((data) => {
        if (data.region_id && data.variant_id) {
          setInitData({ region_id: data.region_id, variant_id: data.variant_id });
        }
      })
      .catch(() => {});
  }, []);

  const ensureCartAndPayment = useCallback(async () => {
    if (!initData || cart) return;
    try {
      const { cart: newCart } = await medusa.store.cart.create({
        region_id: initData.region_id,
        email: "checkout@example.com",
        shipping_address: {
          first_name: "Test",
          last_name: "User",
          address_1: "Test Street 1",
          city: "Copenhagen",
          postal_code: "1000",
          country_code: "dk",
        },
        items: [{ variant_id: initData.variant_id, quantity: 1 }],
      });
      const { payment_collection } = await medusa.store.payment.initiatePaymentSession(
        newCart,
        { provider_id: "pp_stripe_stripe", data: {} }
      );
      const session = payment_collection?.payment_sessions?.[0];
      const secret = session?.data?.client_secret as string | undefined;
      if (secret) {
        setCart({ id: newCart.id });
        setClientSecret(secret);
      }
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Could not initialize payment");
    }
  }, [initData, cart]);

  const paymentContent =
    stripePromise && clientSecret && cart ? (
      <Elements
        stripe={stripePromise}
        options={{ clientSecret, appearance: { theme: "stripe" } }}
      >
        <StripePaymentForm
          cartId={cart.id}
          onError={setPaymentError}
          locale={locale}
          placeOrderLabel={dict.checkout.placeOrder}
        />
      </Elements>
    ) : paymentError ? (
      <p className="text-destructive text-sm">{paymentError}</p>
    ) : (
      <p className="text-muted-foreground text-sm">
        {locale === "da" ? "Indlæser betaling..." : "Loading payment..."}
      </p>
    );

  return (
    <CheckoutSteps
      locale={locale}
      dict={dict}
      confirmationHref={confirmationHref}
      onStepChange={(step) => step === 3 && ensureCartAndPayment()}
      paymentContent={paymentContent}
      paymentReady={!!clientSecret}
    />
  );
}
