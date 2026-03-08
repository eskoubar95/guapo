"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { CartItem } from "@/components/cart/CartItems";

export interface ClientCart {
  id?: string;
  items?: CartItem[];
  subtotal?: number;
  shipping_total?: number;
  total?: number;
}

interface CartContextValue {
  cart: ClientCart | null;
  cartCount: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<ClientCart | null>(null);

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      const data = await res.json();
      setCart(data && typeof data === "object" ? data : null);
    } catch {
      setCart(null);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const cartCount =
    cart?.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0;

  return (
    <CartContext.Provider value={{ cart, cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
