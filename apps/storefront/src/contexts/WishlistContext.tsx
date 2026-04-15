"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { trackWishlistUpdated } from "@/lib/analytics/posthog-ecommerce";

const STORAGE_KEY = "guapo_wishlist";

type WishlistContextValue = {
  /** Product handles (ids) in the wishlist */
  wishlistIds: Set<string>;
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  toggle: (productId: string) => void;
  /** Merge ids into wishlist in one update (e.g. when loading from Medusa customer metadata) */
  mergeIds: (ids: string[]) => void;
  refresh: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

function readFromStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function writeToStorage(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => {
    setWishlistIds(readFromStorage());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback((productId: string) => {
    setWishlistIds((prev) => {
      if (prev.has(productId)) return prev;
      const next = new Set(prev);
      next.add(productId);
      writeToStorage(next);
      trackWishlistUpdated({
        action: "add",
        product_handle: productId,
        wishlist_size: next.size,
      });
      return next;
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setWishlistIds((prev) => {
      if (!prev.has(productId)) return prev;
      const next = new Set(prev);
      next.delete(productId);
      writeToStorage(next);
      trackWishlistUpdated({
        action: "remove",
        product_handle: productId,
        wishlist_size: next.size,
      });
      return next;
    });
  }, []);

  const toggle = useCallback((productId: string) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      const wasIn = next.has(productId);
      if (wasIn) next.delete(productId);
      else next.add(productId);
      writeToStorage(next);
      trackWishlistUpdated({
        action: wasIn ? "remove" : "add",
        product_handle: productId,
        wishlist_size: next.size,
      });
      return next;
    });
  }, []);

  const mergeIds = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setWishlistIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      writeToStorage(next);
      return next;
    });
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => wishlistIds.has(productId),
    [wishlistIds]
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      wishlistIds,
      wishlistCount: wishlistIds.size,
      isInWishlist,
      add,
      remove,
      toggle,
      mergeIds,
      refresh,
    }),
    [wishlistIds, isInWishlist, add, remove, toggle, mergeIds, refresh]
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return ctx;
}
