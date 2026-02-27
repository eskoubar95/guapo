"use client";

import { useState, useCallback } from "react";
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
  cartId: string | null;
}

export function CheckoutWithStripe({
  locale,
  dict,
  confirmationHref,
  cartId,
}: CheckoutWithStripeProps) {
  const [cart, setCart] = useState<{ id: string } | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const ensureCartAndPayment = useCallback(async () => {
    if (!cartId) return;
    if (cart && clientSecret) return;
    try {
      // Update cart with shipping address for checkout
      await medusa.store.cart.update(cartId, {
        email: "checkout@guapo.dk",
        shipping_address: {
          first_name: "Test",
          last_name: "Bruger",
          address_1: "Testvej 1",
          city: "København",
          postal_code: "1000",
          country_code: "dk",
        },
        billing_address: {
          first_name: "Test",
          last_name: "Bruger",
          address_1: "Testvej 1",
          city: "København",
          postal_code: "1000",
          country_code: "dk",
        },
      });

      // Add shipping method
      const { shipping_options } = await medusa.store.fulfillment
        .listCartOptions({ cart_id: cartId });

      if (shipping_options?.length) {
        await medusa.store.cart.addShippingMethod(cartId, {
          option_id: shipping_options[0].id,
        });
      }

      // Initiate payment session
      const { cart: updatedCart } = await medusa.store.cart.retrieve(cartId);
      const { payment_collection } = await medusa.store.payment.initiatePaymentSession(
        updatedCart,
        { provider_id: "pp_stripe_stripe", data: {} }
      );
      const session = payment_collection?.payment_sessions?.[0];
      const secret = session?.data?.client_secret as string | undefined;
      if (secret) {
        setCart({ id: cartId });
        setClientSecret(secret);
      } else {
        setPaymentError(locale === "da"
          ? "Kunne ikke oprette betalingssession"
          : "Could not create payment session");
      }
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Could not initialize payment");
    }
  }, [cartId, cart, clientSecret, locale]);

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
