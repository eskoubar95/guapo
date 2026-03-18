"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { StoreCart } from "@/lib/cart-data";

type CheckoutCartContextValue = {
  /** Initial cart from server. */
  initialCart: StoreCart | null;
  /** Live cart after shipping is applied (from cart.retrieve). */
  liveCart: StoreCart | null;
  /** Use this when CheckoutWithStripe has applied shipping and retrieved updated cart. */
  setLiveCart: (cart: StoreCart | null) => void;
  /** Effective cart for display: live when available, else initial. */
  cart: StoreCart | null;
  /** Selected shipping option amount (from listCartOptions), e.g. in minor units. Fallback when cart has no shipping_total. */
  selectedShippingAmount: number | null;
  setSelectedShippingAmount: (amount: number | null) => void;
};

const CheckoutCartContext = createContext<CheckoutCartContextValue | null>(null);

export function CheckoutCartProvider({
  initialCart,
  children,
}: {
  initialCart: StoreCart | null;
  children: React.ReactNode;
}) {
  const [liveCart, setLiveCartState] = useState<StoreCart | null>(null);
  const [selectedShippingAmount, setSelectedShippingAmountState] = useState<number | null>(null);
  const setLiveCart = useCallback((cart: StoreCart | null) => {
    setLiveCartState(cart);
  }, []);
  const setSelectedShippingAmount = useCallback((amount: number | null) => {
    setSelectedShippingAmountState(amount);
  }, []);
  const cart = liveCart ?? initialCart;

  const value: CheckoutCartContextValue = {
    initialCart,
    liveCart,
    setLiveCart,
    cart,
    selectedShippingAmount,
    setSelectedShippingAmount,
  };

  return (
    <CheckoutCartContext.Provider value={value}>
      {children}
    </CheckoutCartContext.Provider>
  );
}

export function useCheckoutCart(): CheckoutCartContextValue {
  const ctx = useContext(CheckoutCartContext);
  if (!ctx) {
    return {
      initialCart: null,
      liveCart: null,
      setLiveCart: () => {},
      cart: null,
      selectedShippingAmount: null,
      setSelectedShippingAmount: () => {},
    };
  }
  return ctx;
}
