"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { medusa } from "@/lib/medusa";
import { useAuth } from "@/contexts/AuthContext";
import { useCheckoutCart } from "@/contexts/CheckoutCartContext";
import { CheckoutSteps, type CheckoutStepNum } from "./CheckoutSteps";
import type { CheckoutPaymentMethodChoice } from "./checkout-payment-types";
import { StripePaymentForm } from "./StripePaymentForm";
import type { Dictionary } from "@/i18n/dictionaries";
import { useShippingOptions } from "@/components/checkout/hooks/useShippingOptions";
import { usePaymentSession } from "@/components/checkout/hooks/usePaymentSession";
import { useFreeShippingStatus } from "@/hooks/useFreeShippingStatus";
import { getCartItemsTotal } from "@/lib/cart-display";
import { HeaderBackButton } from "@/components/checkout/HeaderBackButton";
import { DEFAULT_CHECKOUT_FORM_DATA } from "@/components/checkout/steps/checkout-form-defaults";
import { trackCheckoutStarted } from "@/lib/analytics/posthog-ecommerce";

export type { ShippingOption } from "@/components/checkout/checkout-shipping.types";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY)
  : null;

interface CheckoutWithStripeProps {
  locale: string;
  dict: Dictionary;
  cartId: string | null;
  hasSubscriptionItems?: boolean;
}

export function CheckoutWithStripe({
  locale,
  dict,
  cartId,
  hasSubscriptionItems = false,
}: CheckoutWithStripeProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [subscriptionTermsAccepted, setSubscriptionTermsAccepted] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<CheckoutStepNum>(1);
  const [paymentMethodChoice, setPaymentMethodChoice] =
    useState<CheckoutPaymentMethodChoice>("card");
  const goToStepRef = useRef<((s: CheckoutStepNum) => void) | null>(null);
  const currentStepRef = useRef<CheckoutStepNum>(1);
  const prefillDoneRef = useRef(false);
  const checkoutStartedTrackedRef = useRef(false);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);
  const [formData, setFormData] = useState(DEFAULT_CHECKOUT_FORM_DATA);

  const { customer } = useAuth();
  const { setLiveCart, setSelectedShippingAmount, cart: checkoutCart } = useCheckoutCart();

  const cartItemsTotal = getCartItemsTotal(checkoutCart);
  const checkoutItemCount = (checkoutCart?.items ?? []).reduce(
    (s, i) => s + (i.quantity ?? 1),
    0
  );
  const fsStatus = useFreeShippingStatus(cartId ?? undefined, cartItemsTotal);
  const qualifiesForFreeShipping = fsStatus?.qualifies ?? false;

  const [initialPickupZipcode, setInitialPickupZipcode] = useState("");
  const [initialPickupPointId, setInitialPickupPointId] = useState("");

  const { shippingOptions, selectedShippingOptionId, setSelectedShippingOptionId } =
    useShippingOptions(cartId);

  const [selectedShippingData, setSelectedShippingData] = useState<Record<string, unknown>>({});

  const {
    cart,
    clientSecret,
    stripeLoading,
    paymentError,
    setPaymentError,
    ensureCartAndPayment,
    clearPaymentSession,
  } = usePaymentSession({
    cartId,
    formData,
    selectedShippingOptionId,
    selectedShippingData,
    qualifiesForFreeShipping,
    hasSubscriptionItems,
    paymentMethodChoice: hasSubscriptionItems ? "card" : paymentMethodChoice,
    checkoutMessages: dict.checkout,
    setLiveCart,
  });

  /* eslint-disable react-hooks/set-state-in-effect -- hydrate checkout form + pickup prefs once when customer loads */
  useEffect(() => {
    if (!customer || prefillDoneRef.current) return;
    prefillDoneRef.current = true;

    medusa.store.customer
      .listAddress()
      .then(({ addresses }) => {
        const prefilled = {
          email: customer.email ?? "",
          firstName: customer.first_name ?? "",
          lastName: customer.last_name ?? "",
          address1: "",
          postalCode: "",
          city: "",
          phone: (customer.phone as string) ?? "",
          marketingOptIn: false,
        };
        const addr = addresses?.[0];
        if (addr) {
          prefilled.address1 = addr.address_1 ?? "";
          prefilled.postalCode = addr.postal_code ?? "";
          prefilled.city = addr.city ?? "";
          if (!prefilled.firstName && addr.first_name) prefilled.firstName = addr.first_name;
          if (!prefilled.lastName && addr.last_name) prefilled.lastName = addr.last_name;
        }
        setFormData((prev) => ({
          ...prefilled,
          email: prev.email.trim() ? prev.email : prefilled.email,
          firstName: prev.firstName.trim() ? prev.firstName : prefilled.firstName,
          lastName: prev.lastName.trim() ? prev.lastName : prefilled.lastName,
          address1: prev.address1.trim() ? prev.address1 : prefilled.address1,
          postalCode: prev.postalCode.trim() ? prev.postalCode : prefilled.postalCode,
          city: prev.city.trim() ? prev.city : prefilled.city,
          phone: prev.phone.trim() ? prev.phone : prefilled.phone,
          marketingOptIn: prev.marketingOptIn,
        }));
      })
      .catch(() => {
        const prefilled = {
          email: customer.email ?? "",
          firstName: customer.first_name ?? "",
          lastName: customer.last_name ?? "",
          address1: "",
          postalCode: "",
          city: "",
          phone: (customer.phone as string) ?? "",
          marketingOptIn: false,
        };
        setFormData((prev) => ({
          ...prefilled,
          email: prev.email.trim() ? prev.email : prefilled.email,
          firstName: prev.firstName.trim() ? prev.firstName : prefilled.firstName,
          lastName: prev.lastName.trim() ? prev.lastName : prefilled.lastName,
          address1: prev.address1.trim() ? prev.address1 : prefilled.address1,
          postalCode: prev.postalCode.trim() ? prev.postalCode : prefilled.postalCode,
          city: prev.city.trim() ? prev.city : prefilled.city,
          phone: prev.phone.trim() ? prev.phone : prefilled.phone,
          marketingOptIn: prev.marketingOptIn,
        }));
      });

    const meta = customer.metadata as Record<string, unknown> | undefined;
    const pp = meta?.preferred_pickup_point as { id?: string; zipcode?: string } | undefined;
    if (pp?.zipcode) setInitialPickupZipcode(pp.zipcode);
    if (pp?.id) setInitialPickupPointId(String(pp.id));
  }, [customer]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (
      !cartId ||
      !checkoutCart?.items?.length ||
      checkoutStartedTrackedRef.current
    ) {
      return;
    }
    checkoutStartedTrackedRef.current = true;
    trackCheckoutStarted({
      cart_id: cartId,
      value: cartItemsTotal,
      currency: "DKK",
      item_count: checkoutItemCount,
      has_subscription_items: hasSubscriptionItems,
    });
  }, [cartId, checkoutCart?.items, cartItemsTotal, checkoutItemCount, hasSubscriptionItems]);

  useEffect(() => {
    const hasPickup =
      Boolean(selectedShippingData?.service_point_id) ||
      Boolean(selectedShippingData?.service_point_address);
    if (!hasPickup || !selectedShippingOptionId || !shippingOptions.length) {
      setSelectedShippingAmount(null);
      return;
    }
    if (qualifiesForFreeShipping) {
      setSelectedShippingAmount(0);
      return;
    }
    const option = shippingOptions.find((o) => o.id === selectedShippingOptionId);
    const amountFromList = option?.amount;
    if (amountFromList != null && amountFromList >= 0) {
      setSelectedShippingAmount(amountFromList);
    } else {
      setSelectedShippingAmount(null);
    }
  }, [
    selectedShippingOptionId,
    shippingOptions,
    selectedShippingData,
    setSelectedShippingAmount,
    qualifiesForFreeShipping,
  ]);

  const handleShippingSelect = useCallback(
    (optionId: string, data: Record<string, unknown>) => {
      setSelectedShippingOptionId(optionId);
      setSelectedShippingData(data);
    },
    [setSelectedShippingOptionId]
  );

  const loadingPaymentBlock = (
    <div className="flex items-center justify-center py-8">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="ml-3 text-sm text-muted-foreground">{dict.checkout.loadingPayment}</span>
    </div>
  );

  const paymentContent =
    stripePromise && clientSecret && cart ? (
      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
        <StripePaymentForm
          cartId={cart.id}
          onError={(msg) => {
            setPaymentProcessing(false);
            setPaymentError(msg);
          }}
          onProcessing={setPaymentProcessing}
          locale={locale}
          placeOrderLabel={dict.checkout.confirmOrder}
          termsAccepted={termsAccepted && (!hasSubscriptionItems || subscriptionTermsAccepted)}
        />
      </Elements>
    ) : stripeLoading ? (
      loadingPaymentBlock
    ) : paymentError ? (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-destructive text-sm">{paymentError}</p>
      </div>
    ) : (
      loadingPaymentBlock
    );

  const handleStepChange = useCallback(
    (step: CheckoutStepNum) => {
      if (currentStepRef.current === 3 && step === 2) {
        clearPaymentSession();
      }
      setCurrentStep(step);
      if (step === 3) {
        void ensureCartAndPayment();
      }
    },
    [ensureCartAndPayment, clearPaymentSession]
  );

  const handleHeaderBack = useCallback(() => {
    if (currentStep === 2) goToStepRef.current?.(1);
    else if (currentStep === 3) goToStepRef.current?.(2);
  }, [currentStep]);

  const handleRegisterGoToStep = useCallback((fn: (step: CheckoutStepNum) => void) => {
    goToStepRef.current = fn;
  }, []);

  return (
    <>
      <HeaderBackButton
        show={!paymentProcessing}
        currentStep={currentStep}
        locale={locale}
        dict={dict}
        onBack={handleHeaderBack}
      />

      <CheckoutSteps
        onRegisterGoToStep={handleRegisterGoToStep}
        locale={locale}
        dict={dict}
        onStepChange={handleStepChange}
        paymentContent={paymentContent}
        shippingOptions={shippingOptions}
        selectedShippingOptionId={selectedShippingOptionId}
        onShippingSelect={handleShippingSelect}
        formData={formData}
        onFormDataChange={setFormData}
        initialPickupZipcode={initialPickupZipcode}
        initialPickupPointId={initialPickupPointId}
        termsAccepted={termsAccepted}
        onTermsChange={setTermsAccepted}
        subscriptionTermsAccepted={subscriptionTermsAccepted}
        onSubscriptionTermsChange={setSubscriptionTermsAccepted}
        hasSubscriptionItems={hasSubscriptionItems}
        isGuest={!customer}
        paymentProcessing={paymentProcessing}
        selectedPaymentMethod={hasSubscriptionItems ? "card" : paymentMethodChoice}
        onPaymentMethodChange={(m) => {
          if (!hasSubscriptionItems) setPaymentMethodChoice(m);
        }}
        qualifiesForFreeShipping={qualifiesForFreeShipping}
      />
    </>
  );
}
