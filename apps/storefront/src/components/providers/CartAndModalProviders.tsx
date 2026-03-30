"use client";

import { CartProvider } from "@/contexts/CartContext";
import { AddToCartModalProvider } from "@/contexts/AddToCartModalContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import type { Dictionary } from "@/i18n/dictionaries";

interface CartAndModalProvidersProps {
  children: React.ReactNode;
  locale: string;
  dict: Dictionary;
}

export function CartAndModalProviders({ children, locale, dict }: CartAndModalProvidersProps) {
  return (
    <CartProvider>
      <WishlistProvider>
        <AddToCartModalProvider locale={locale} dict={dict}>
          {children}
        </AddToCartModalProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
