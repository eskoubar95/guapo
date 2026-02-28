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
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address1: "",
    postalCode: "",
    city: "",
    phone: "",
  });

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
          setSelectedShippingOptionId((pakkeshop ?? opts[0]).id);
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
      const email = formData.email || "guest@guapo.dk";
      const hasServicePoint =
        selectedShippingData?.service_point_id &&
        selectedShippingData?.service_point_address;
      const addr = hasServicePoint
        ? {
            first_name: formData.firstName || "Gæst",
            last_name: formData.lastName || "Bruger",
            address_1: String(selectedShippingData.service_point_address),
            city: String(selectedShippingData.service_point_city ?? ""),
            postal_code: String(selectedShippingData.service_point_zipcode ?? ""),
            country_code: "dk",
            phone: formData.phone || undefined,
          }
        : {
            first_name: formData.firstName || "Gæst",
            last_name: formData.lastName || "Bruger",
            address_1: formData.address1 || "—",
            city: formData.city || "—",
            postal_code: formData.postalCode || "—",
            country_code: "dk",
            phone: formData.phone || undefined,
          };
      const billingAddr = {
        first_name: formData.firstName || "Gæst",
        last_name: formData.lastName || "Bruger",
        address_1: formData.address1 || "—",
        city: formData.city || "—",
        postal_code: formData.postalCode || "—",
        country_code: "dk",
        phone: formData.phone || undefined,
      };
      await medusa.store.cart.update(cartId, {
        email,
        shipping_address: addr,
        billing_address: billingAddr,
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
  }, [cartId, cart, clientSecret, locale, selectedShippingOptionId, selectedShippingData, formData]);

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
      formData={formData}
      onFormDataChange={setFormData}
    />
  );
}
