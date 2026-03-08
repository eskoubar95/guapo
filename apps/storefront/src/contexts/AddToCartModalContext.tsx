"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AddToCartModal } from "@/components/cart/AddToCartModal";
import type { Dictionary } from "@/i18n/dictionaries";

export interface AddToCartModalData {
  productTitle: string;
  variantTitle?: string;
  thumbnail?: string;
  quantity: number;
  unitPrice: number;
  cartTotal: number;
  itemCount: number;
  /** Line item id for quantity updates (plus/minus) in modal */
  lineItemId?: string;
  metadata?: Record<string, unknown>;
}

interface AddToCartModalContextValue {
  openModal: (data: AddToCartModalData) => void;
  closeModal: () => void;
  /** Update modal data after quantity change (so totals stay in sync) */
  updateModalData: (patch: Partial<AddToCartModalData>) => void;
}

const AddToCartModalContext = createContext<AddToCartModalContextValue | null>(null);

interface AddToCartModalProviderProps {
  children: React.ReactNode;
  locale: string;
  dict: Dictionary;
}

export function AddToCartModalProvider({ children, locale, dict }: AddToCartModalProviderProps) {
  const [data, setData] = useState<AddToCartModalData | null>(null);

  const openModal = useCallback((d: AddToCartModalData) => {
    setData(d);
  }, []);

  const closeModal = useCallback(() => {
    setData(null);
  }, []);

  const updateModalData = useCallback((patch: Partial<AddToCartModalData>) => {
    setData((prev) => (prev ? { ...prev, ...patch } : null));
  }, []);

  return (
    <AddToCartModalContext.Provider value={{ openModal, closeModal, updateModalData }}>
      {children}
      {data && (
        <AddToCartModal
          data={data}
          locale={locale}
          dict={dict}
          onClose={closeModal}
        />
      )}
    </AddToCartModalContext.Provider>
  );
}

export function useAddToCartModal() {
  const ctx = useContext(AddToCartModalContext);
  if (!ctx) {
    throw new Error("useAddToCartModal must be used within AddToCartModalProvider");
  }
  return ctx;
}
