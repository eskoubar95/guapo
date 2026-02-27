"use client";

import { useState, useCallback, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { medusa } from "@/lib/medusa";
import { CheckoutSteps } from "./CheckoutSteps";
import { StripePaymentForm } from "./StripePaymentForm";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY)
  : null;

export interface ShippingOption {
  id: string;
  name: string;
  amount?: number;
}

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
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState<string | null>(null);
  const [selectedShippingData, setSelectedShippingData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!cartId) return;
    medusa.store.fulfillment
      .listCartOptions({ cart_id: cartId })
      .then(({ shipping_options }) => {
        const opts = (shipping_options ?? []).map((o) => ({
          id: o.id,
          name: o.name ?? "",
          amount: (o.amount ?? 0) as number,
        }));
        setShippingOptions(opts);
        if (opts.length && !selectedShippingOptionId) {
          const pakkeshop = opts.find((o) => o.name.includes("Pakkeshop") || o.name.includes("39"));
          const standard = opts.find((o) => o.name.includes("Standard") || o.amount === 0) ?? opts[0];
          setSelectedShippingOptionId(pakkeshop ? standard?.id ?? opts[0].id : opts[0].id);
        }
      })
      .catch(() => setShippingOptions([]));
  }, [cartId]);

  const handleShippingSelect = useCallback((optionId: string, data: Record<string, unknown>) => {
    setSelectedShippingOptionId(optionId);
    setSelectedShippingData(data);
  }, []);

  const ensureCartAndPayment = useCallback(async () => {
    if (!cartId) return;
    if (cart && clientSecret) return;
    try {
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

      const { shipping_options } = await medusa.store.fulfillment
        .listCartOptions({ cart_id: cartId });
      const optionId = selectedShippingOptionId ?? shipping_options?.[0]?.id;
      if (shipping_options?.length && optionId) {
        await medusa.store.cart.addShippingMethod(cartId, {
          option_id: optionId,
          data: Object.keys(selectedShippingData).length ? selectedShippingData : undefined,
        });
      }

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
  }, [cartId, cart, clientSecret, locale, selectedShippingOptionId, selectedShippingData]);

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
      shippingOptions={shippingOptions}
      selectedShippingOptionId={selectedShippingOptionId}
      onShippingSelect={handleShippingSelect}
    />
  );
}
