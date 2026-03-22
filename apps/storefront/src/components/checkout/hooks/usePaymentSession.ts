"use client";

import { useState, useCallback, useRef } from "react";
import { medusa } from "@/lib/medusa";
import type { StoreCart } from "@/lib/cart-data";
import type { CheckoutPaymentMethodChoice } from "@/components/checkout-payment-types";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CheckoutFormData } from "@/components/checkout/steps/checkout-form.types";

interface UsePaymentSessionParams {
  cartId: string | null;
  formData: CheckoutFormData;
  selectedShippingOptionId: string | null;
  selectedShippingData: Record<string, unknown>;
  hasSubscriptionItems: boolean;
  paymentMethodChoice: CheckoutPaymentMethodChoice;
  checkoutMessages: Pick<
    Dictionary["checkout"],
    | "addressRequired"
    | "billingRequired"
    | "paymentError"
    | "guestFirstNamePlaceholder"
    | "guestLastNamePlaceholder"
    | "paymentInitFailed"
  >;
  setLiveCart: (cart: StoreCart) => void;
}

function servicePointStrings(data: Record<string, unknown>): {
  address: string;
  city: string;
  zip: string;
} | null {
  const addr = data.service_point_address;
  if (addr == null || typeof addr !== "string") return null;
  return {
    address: addr,
    city: typeof data.service_point_city === "string" ? data.service_point_city : "",
    zip: typeof data.service_point_zipcode === "string" ? data.service_point_zipcode : "",
  };
}

export function usePaymentSession({
  cartId,
  formData,
  selectedShippingOptionId,
  selectedShippingData,
  hasSubscriptionItems,
  paymentMethodChoice,
  checkoutMessages,
  setLiveCart,
}: UsePaymentSessionParams) {
  const [cart, setCart] = useState<{ id: string } | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [appliedShippingOptionId, setAppliedShippingOptionId] = useState<string | null>(null);
  const lastAppliedFormDataRef = useRef("");
  const lastAppliedPaymentChoiceRef = useRef("");
  const sessionGenerationRef = useRef(0);

  const clearPaymentSession = useCallback(() => {
    setClientSecret(null);
    setCart(null);
    lastAppliedPaymentChoiceRef.current = "";
    sessionGenerationRef.current += 1;
  }, []);

  const ensureCartAndPayment = useCallback(async () => {
    if (!cartId) return;
    const generation = ++sessionGenerationRef.current;

    const formDataSig = `${formData.firstName}|${formData.lastName}|${formData.address1}|${formData.postalCode}|${formData.city}`;
    const formDataUnchanged = lastAppliedFormDataRef.current === formDataSig;
    const choice = hasSubscriptionItems ? "card" : paymentMethodChoice;
    if (
      cart &&
      clientSecret &&
      appliedShippingOptionId === selectedShippingOptionId &&
      formDataUnchanged &&
      lastAppliedPaymentChoiceRef.current === choice
    ) {
      return;
    }

    setStripeLoading(true);
    setPaymentError(null);

    try {
      const email = formData.email || "guest@guapo.dk";
      const hasServicePoint = Boolean(
        selectedShippingData?.service_point_id && selectedShippingData?.service_point_address
      );
      const sp = hasServicePoint ? servicePointStrings(selectedShippingData) : null;
      const billingFieldsOk =
        formData.address1?.trim() && formData.postalCode?.trim() && formData.city?.trim();

      if (!hasServicePoint && !billingFieldsOk) {
        setPaymentError(checkoutMessages.addressRequired);
        setStripeLoading(false);
        return;
      }
      if (!billingFieldsOk) {
        setPaymentError(checkoutMessages.billingRequired);
        setStripeLoading(false);
        return;
      }

      const guestFirst = checkoutMessages.guestFirstNamePlaceholder;
      const guestLast = checkoutMessages.guestLastNamePlaceholder;
      const addr = sp
        ? {
            first_name: formData.firstName || guestFirst,
            last_name: formData.lastName || guestLast,
            address_1: sp.address,
            city: sp.city,
            postal_code: sp.zip,
            country_code: "dk",
            phone: formData.phone || undefined,
          }
        : {
            first_name: formData.firstName || guestFirst,
            last_name: formData.lastName || guestLast,
            address_1: formData.address1 || "",
            city: formData.city || "",
            postal_code: formData.postalCode || "",
            country_code: "dk",
            phone: formData.phone || undefined,
          };

      const billingAddr = {
        first_name: formData.firstName || guestFirst,
        last_name: formData.lastName || guestLast,
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

      if (generation !== sessionGenerationRef.current) return;

      const { shipping_options } = await medusa.store.fulfillment.listCartOptions({ cart_id: cartId });
      const optionId = selectedShippingOptionId ?? shipping_options?.[0]?.id;
      if (shipping_options?.length && optionId) {
        await medusa.store.cart.addShippingMethod(cartId, {
          option_id: optionId,
          data: Object.keys(selectedShippingData).length ? selectedShippingData : undefined,
        });
        setAppliedShippingOptionId(optionId);
      }

      if (generation !== sessionGenerationRef.current) return;

      const { cart: updatedCart } = await medusa.store.cart.retrieve(cartId);
      const pc = updatedCart as {
        payment_collection?: { id?: string };
        payment_collection_id?: string;
      };
      const paymentCollectionId =
        pc.payment_collection?.id ?? pc.payment_collection_id ?? undefined;
      const pmChoice = hasSubscriptionItems ? "card" : paymentMethodChoice;
      const sessionData: Record<string, unknown> = {
        cart_id: cartId,
        payment_method_choice: pmChoice,
        ...(paymentCollectionId ? { payment_collection_id: paymentCollectionId } : {}),
        ...(hasSubscriptionItems ? { setup_future_usage: "off_session" as const } : {}),
      };
      const { payment_collection } = await medusa.store.payment.initiatePaymentSession(updatedCart, {
        provider_id: "pp_stripe_stripe",
        data: sessionData,
      });

      if (generation !== sessionGenerationRef.current) return;

      const session = payment_collection?.payment_sessions?.[0];
      const secret = session?.data?.client_secret as string | undefined;
      if (secret) {
        lastAppliedFormDataRef.current = formDataSig;
        lastAppliedPaymentChoiceRef.current = pmChoice;
        setPaymentError(null);
        setCart({ id: cartId });
        setClientSecret(secret);
        if (updatedCart) setLiveCart(updatedCart as StoreCart);
        try {
          const res = await fetch("/api/cart", { credentials: "include" });
          if (generation !== sessionGenerationRef.current) return;
          if (res.ok) {
            const cartFromApi = await res.json();
            if (cartFromApi?.id) setLiveCart(cartFromApi as StoreCart);
          }
        } catch {
          /* optional cart sync */
        }
      } else {
        setPaymentError(checkoutMessages.paymentError);
      }
    } catch (err) {
      if (generation === sessionGenerationRef.current) {
        setPaymentError(
          err instanceof Error ? err.message : checkoutMessages.paymentInitFailed
        );
      }
    } finally {
      if (generation === sessionGenerationRef.current) {
        setStripeLoading(false);
      }
    }
  }, [
    cartId,
    cart,
    clientSecret,
    selectedShippingOptionId,
    selectedShippingData,
    appliedShippingOptionId,
    formData,
    hasSubscriptionItems,
    paymentMethodChoice,
    checkoutMessages,
    setLiveCart,
  ]);

  return {
    cart,
    clientSecret,
    stripeLoading,
    paymentError,
    setPaymentError,
    appliedShippingOptionId,
    ensureCartAndPayment,
    clearPaymentSession,
  };
}
