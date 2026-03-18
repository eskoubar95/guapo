"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { medusa } from "@/lib/medusa";
import { useAuth } from "@/contexts/AuthContext";
import { useCheckoutCart } from "@/contexts/CheckoutCartContext";
import { CheckoutSteps, type CheckoutStepNum } from "./CheckoutSteps";
import { StripePaymentForm } from "./StripePaymentForm";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CartItem } from "@/components/cart/CartItems";
import type { StoreCart } from "@/lib/cart-data";

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
  dict: Dictionary;
  confirmationHref: string;
  cartId: string | null;
  hasSubscriptionItems?: boolean;
  items?: CartItem[];
}

export function CheckoutWithStripe({
  locale,
  dict,
  confirmationHref,
  cartId,
  hasSubscriptionItems = false,
}: CheckoutWithStripeProps) {
  const [cart, setCart] = useState<{ id: string } | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState<string | null>(null);
  const [selectedShippingData, setSelectedShippingData] = useState<Record<string, unknown>>({});
  const [appliedShippingOptionId, setAppliedShippingOptionId] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [subscriptionTermsAccepted, setSubscriptionTermsAccepted] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<CheckoutStepNum>(1);
  const goToStepRef = useRef<((s: CheckoutStepNum) => void) | null>(null);
  const lastAppliedFormDataRef = useRef<string>("");
  const prefillDoneRef = useRef(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address1: "",
    postalCode: "",
    city: "",
    phone: "",
  });

  const { customer } = useAuth();
  const { setLiveCart, setSelectedShippingAmount } = useCheckoutCart();

  const [initialPickupZipcode, setInitialPickupZipcode] = useState("");
  const [initialPickupPointId, setInitialPickupPointId] = useState("");

  useEffect(() => {
    if (!customer || prefillDoneRef.current) return;
    prefillDoneRef.current = true;

    const prefilled = {
      email: customer.email ?? "",
      firstName: customer.first_name ?? "",
      lastName: customer.last_name ?? "",
      address1: "",
      postalCode: "",
      city: "",
      phone: (customer.phone as string) ?? "",
    };

    medusa.store.customer.listAddress().then(({ addresses }) => {
      const addr = addresses?.[0];
      if (addr) {
        prefilled.address1 = addr.address_1 ?? "";
        prefilled.postalCode = addr.postal_code ?? "";
        prefilled.city = addr.city ?? "";
        if (!prefilled.firstName && addr.first_name) prefilled.firstName = addr.first_name;
        if (!prefilled.lastName && addr.last_name) prefilled.lastName = addr.last_name;
      }
      setFormData(prefilled);
    }).catch(() => {
      setFormData(prefilled);
    });

    const meta = customer.metadata as Record<string, unknown> | undefined;
    const pp = meta?.preferred_pickup_point as { id?: string; zipcode?: string } | undefined;
    if (pp?.zipcode) setInitialPickupZipcode(pp.zipcode);
    if (pp?.id) setInitialPickupPointId(String(pp.id));
  }, [customer]);

  useEffect(() => {
    if (!cartId) return;
    const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
    const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
    const headers: HeadersInit = { "Content-Type": "application/json", ...(key && { "x-publishable-api-key": key }) };

    fetch(`${baseUrl.replace(/\/$/, "")}/store/shipping-options-with-pricing?cart_id=${encodeURIComponent(cartId)}`, { headers })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Shipping options with pricing failed"))))
      .then((data: { shipping_options?: Array<{ id: string; name?: string; amount?: number }> }) => {
        const rawList = data?.shipping_options ?? [];
        const opts = rawList.map((o) => ({
          id: o.id,
          name: o.name ?? "",
          amount: typeof o.amount === "number" ? o.amount : 0,
        }));
        setShippingOptions(opts);
        setSelectedShippingOptionId((prev) => {
          if (prev && opts.some((opt) => opt.id === prev)) return prev;
          const pakkeshop = opts.find((opt) => opt.name.toLowerCase().includes("pakkeshop") || opt.name.toLowerCase().includes("gls"));
          return (pakkeshop ?? opts[0])?.id ?? null;
        });
      })
      .catch(() => {
        medusa.store.fulfillment
          .listCartOptions({ cart_id: cartId })
          .then(({ shipping_options }) => {
            const list = (shipping_options ?? []) as Array<{
              id: string;
              name?: string;
              amount?: number;
              calculated_price?: { calculated_amount?: number };
              prices?: Array<{ amount?: number }>;
            }>;
            const opts = list.map((o) => ({
              id: o.id,
              name: o.name ?? "",
              amount: o.amount ?? o.calculated_price?.calculated_amount ?? o.prices?.[0]?.amount ?? 0,
            }));
            setShippingOptions(opts);
            setSelectedShippingOptionId((prev) => {
              if (prev && opts.some((opt) => opt.id === prev)) return prev;
              const pakkeshop = opts.find((opt) => opt.name.toLowerCase().includes("pakkeshop") || opt.name.toLowerCase().includes("gls"));
              return (pakkeshop ?? opts[0])?.id ?? null;
            });
          })
          .catch(() => setShippingOptions([]));
      });
  }, [cartId]);

  useEffect(() => {
    const hasPickup =
      Boolean(selectedShippingData?.service_point_id) ||
      Boolean(selectedShippingData?.service_point_address);
    if (!hasPickup || !selectedShippingOptionId || !shippingOptions.length) {
      setSelectedShippingAmount(null);
      return;
    }
    const option = shippingOptions.find((o) => o.id === selectedShippingOptionId);
    const amountFromList = option?.amount;
    if (amountFromList != null && amountFromList > 0) {
      setSelectedShippingAmount(amountFromList);
    } else {
      setSelectedShippingAmount(null);
    }
  }, [
    selectedShippingOptionId,
    shippingOptions,
    selectedShippingData,
    setSelectedShippingAmount,
  ]);

  const handleShippingSelect = useCallback((optionId: string, data: Record<string, unknown>) => {
    setSelectedShippingOptionId(optionId);
    setSelectedShippingData(data);
  }, []);

  const ensureCartAndPayment = useCallback(async () => {
    if (!cartId) return;
    const formDataSig = `${formData.firstName}|${formData.lastName}|${formData.address1}|${formData.postalCode}|${formData.city}`;
    const formDataUnchanged = lastAppliedFormDataRef.current === formDataSig;
    if (cart && clientSecret && appliedShippingOptionId === selectedShippingOptionId && formDataUnchanged) return;

    setStripeLoading(true);
    setPaymentError(null);

    try {
      const email = formData.email || "guest@guapo.dk";
      const hasServicePoint =
        selectedShippingData?.service_point_id &&
        selectedShippingData?.service_point_address;
      const billingFieldsOk =
        formData.address1?.trim() && formData.postalCode?.trim() && formData.city?.trim();

      if (!hasServicePoint && !billingFieldsOk) {
        setPaymentError(dict.checkout.addressRequired);
        setStripeLoading(false);
        return;
      }
      if (!billingFieldsOk) {
        setPaymentError(dict.checkout.billingRequired);
        setStripeLoading(false);
        return;
      }

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
            address_1: formData.address1 || "",
            city: formData.city || "",
            postal_code: formData.postalCode || "",
            country_code: "dk",
            phone: formData.phone || undefined,
          };

      const billingAddr = {
        first_name: formData.firstName || "Gæst",
        last_name: formData.lastName || "Bruger",
        address_1: formData.address1 || "",
        city: formData.city || "",
        postal_code: formData.postalCode || "",
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
        setAppliedShippingOptionId(optionId);
      }

      const { cart: updatedCart } = await medusa.store.cart.retrieve(cartId);
      const sessionData = hasSubscriptionItems
        ? { setup_future_usage: "off_session" as const }
        : {};
      const { payment_collection } = await medusa.store.payment.initiatePaymentSession(
        updatedCart,
        { provider_id: "pp_stripe_stripe", data: sessionData }
      );
      const session = payment_collection?.payment_sessions?.[0];
      const secret = session?.data?.client_secret as string | undefined;
      if (secret) {
        lastAppliedFormDataRef.current = formDataSig;
        setPaymentError(null);
        setCart({ id: cartId });
        setClientSecret(secret);
        if (updatedCart) setLiveCart(updatedCart as StoreCart);
        try {
          const res = await fetch("/api/cart", { credentials: "include" });
          if (res.ok) {
            const cartFromApi = await res.json();
            if (cartFromApi?.id) setLiveCart(cartFromApi as StoreCart);
          }
        } catch {
          void 0;
        }
      } else {
        setPaymentError(dict.checkout.paymentError);
      }
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Could not initialize payment");
    } finally {
      setStripeLoading(false);
    }
  }, [cartId, cart, clientSecret, locale, selectedShippingOptionId, selectedShippingData, appliedShippingOptionId, formData, hasSubscriptionItems, dict.checkout]);

  const paymentContent =
    stripePromise && clientSecret && cart ? (
      <Elements
        stripe={stripePromise}
        options={{ clientSecret, appearance: { theme: "stripe" } }}
      >
        <StripePaymentForm
          cartId={cart.id}
          onError={(msg) => { setPaymentProcessing(false); setPaymentError(msg); }}
          onProcessing={setPaymentProcessing}
          locale={locale}
          placeOrderLabel={dict.checkout.confirmOrder}
          termsAccepted={termsAccepted && (!hasSubscriptionItems || subscriptionTermsAccepted)}
        />
      </Elements>
    ) : stripeLoading ? (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-3 text-sm text-muted-foreground">{dict.checkout.loadingPayment}</span>
      </div>
    ) : paymentError ? (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-destructive text-sm">{paymentError}</p>
      </div>
    ) : (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-3 text-sm text-muted-foreground">{dict.checkout.loadingPayment}</span>
      </div>
    );

  const handleStepChange = useCallback((step: CheckoutStepNum) => {
    setCurrentStep(step);
    if (step >= 2) ensureCartAndPayment();
  }, [ensureCartAndPayment]);

  const handleHeaderBack = useCallback(() => {
    if (currentStep === 2) goToStepRef.current?.(1);
    else if (currentStep === 3) goToStepRef.current?.(2);
  }, [currentStep]);

  const handleRegisterGoToStep = useCallback((fn: (step: CheckoutStepNum) => void) => {
    goToStepRef.current = fn;
  }, []);

  return (
    <>
      {/* Contextual back button — portaled into header slot */}
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
        confirmationHref={confirmationHref}
        onStepChange={handleStepChange}
        paymentContent={paymentContent}
        paymentReady={!!clientSecret}
        paymentLoading={stripeLoading}
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
      />
    </>
  );
}

function HeaderBackButton({
  show,
  currentStep,
  locale,
  dict,
  onBack,
}: {
  show: boolean;
  currentStep: CheckoutStepNum;
  locale: string;
  dict: Dictionary;
  onBack: () => void;
}) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.getElementById("checkout-back-btn"));
  }, []);

  if (!portalTarget || !show) return null;

  const className = "inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors";

  const content =
    currentStep === 1 ? (
      <Link href={`/${locale}/cart`} className={className}>
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">{dict.checkout.previousStep}</span>
      </Link>
    ) : (
      <button type="button" onClick={onBack} className={className}>
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">{dict.checkout.previousStep}</span>
      </button>
    );

  return createPortal(content, portalTarget);
}
