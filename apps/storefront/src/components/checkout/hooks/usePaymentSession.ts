"use client";

import { useState, useCallback, useRef, type MutableRefObject } from "react";
import { medusa } from "@/lib/medusa";
import type { StoreCart } from "@/lib/cart-data";
import type { CheckoutPaymentMethodChoice } from "@/components/checkout-payment-types";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CheckoutFormData } from "@/components/checkout/steps/checkout-form.types";
import { normalizeShippingForDisplay } from "@/lib/cart-display";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * `sync-free-shipping-promotion` runs asynchronously on `cart.updated`. The Store API can return
 * the cart before shipping-method adjustments are applied, so PaymentIntent amount would still
 * include paid shipping. Poll until `shipping_total` is 0 when the storefront knows the order
 * qualifies for free shipping.
 */
async function retrieveCartWhenReadyForPayment(
  cartId: string,
  qualifiesForFreeShipping: boolean,
  generation: number,
  sessionGenerationRef: MutableRefObject<number>
): Promise<StoreCart> {
  const maxAttempts = qualifiesForFreeShipping ? 30 : 1;
  const delayMs = 150;
  let last: StoreCart | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (generation !== sessionGenerationRef.current) {
      throw new Error("aborted");
    }
    const { cart } = await medusa.store.cart.retrieve(cartId);
    last = cart as StoreCart;
    if (!qualifiesForFreeShipping) {
      return last;
    }
    const hasShipping = (last.shipping_methods?.length ?? 0) > 0;
    const raw = last.shipping_total;
    if (!hasShipping || raw == null) {
      return last;
    }
    const norm = normalizeShippingForDisplay(raw);
    if (norm === 0) {
      return last;
    }
    if (attempt < maxAttempts - 1) {
      await sleep(delayMs);
    }
  }
  return last!;
}

interface UsePaymentSessionParams {
  cartId: string | null;
  formData: CheckoutFormData;
  selectedShippingOptionId: string | null;
  selectedShippingData: Record<string, unknown>;
  /** When true, wait for Medusa to apply free-shipping adjustments before payment session. */
  qualifiesForFreeShipping: boolean;
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

export function usePaymentSession({
  cartId,
  formData,
  selectedShippingOptionId,
  selectedShippingData,
  qualifiesForFreeShipping,
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
  const lastAppliedShippingDataRef = useRef("");
  const lastAppliedQualifiesRef = useRef<boolean | null>(null);
  const lastAppliedPaymentChoiceRef = useRef("");
  const sessionGenerationRef = useRef(0);

  const clearPaymentSession = useCallback(() => {
    setClientSecret(null);
    setCart(null);
    lastAppliedShippingDataRef.current = "";
    lastAppliedQualifiesRef.current = null;
    lastAppliedPaymentChoiceRef.current = "";
    sessionGenerationRef.current += 1;
  }, []);

  const ensureCartAndPayment = useCallback(async () => {
    if (!cartId) return;
    const generation = ++sessionGenerationRef.current;

    const formDataSig = `${formData.firstName}|${formData.lastName}|${formData.address1}|${formData.postalCode}|${formData.city}`;
    const shippingDataSig = JSON.stringify(selectedShippingData ?? {});
    const formDataUnchanged = lastAppliedFormDataRef.current === formDataSig;
    const shippingDataUnchanged = lastAppliedShippingDataRef.current === shippingDataSig;
    const freeShippingStateUnchanged =
      lastAppliedQualifiesRef.current === qualifiesForFreeShipping;
    const choice = hasSubscriptionItems ? "card" : paymentMethodChoice;
    if (
      cart &&
      clientSecret &&
      appliedShippingOptionId === selectedShippingOptionId &&
      formDataUnchanged &&
      shippingDataUnchanged &&
      freeShippingStateUnchanged &&
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
      const billingAddr = {
        first_name: formData.firstName || guestFirst,
        last_name: formData.lastName || guestLast,
        address_1: formData.address1 || "",
        city: formData.city || "",
        postal_code: formData.postalCode || "",
        country_code: "dk",
        phone: formData.phone || undefined,
      };
      /**
       * Cart shipping_address = customer's home delivery address (same as billing).
       * Pakkeshop location is carried only on the shipping method `data` (service_point_*)
       * so Shipmondo can label to the pickup point while Admin/order UIs show the real home address.
       */
      const addr = {
        ...billingAddr,
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

      const updatedCart = await retrieveCartWhenReadyForPayment(
        cartId,
        qualifiesForFreeShipping,
        generation,
        sessionGenerationRef
      );
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
      const { payment_collection } = await medusa.store.payment.initiatePaymentSession(
        updatedCart as unknown as Parameters<
          typeof medusa.store.payment.initiatePaymentSession
        >[0],
        {
          provider_id: "pp_stripe_stripe",
          data: sessionData,
        }
      );

      if (generation !== sessionGenerationRef.current) return;

      const session = payment_collection?.payment_sessions?.[0];
      const secret = session?.data?.client_secret as string | undefined;
      if (secret) {
        lastAppliedFormDataRef.current = formDataSig;
        lastAppliedShippingDataRef.current = shippingDataSig;
        lastAppliedQualifiesRef.current = qualifiesForFreeShipping;
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
      if (generation !== sessionGenerationRef.current) return;
      if (err instanceof Error && err.message === "aborted") return;
      setPaymentError(
        err instanceof Error ? err.message : checkoutMessages.paymentInitFailed
      );
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
    qualifiesForFreeShipping,
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
