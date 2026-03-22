"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { medusa } from "@/lib/medusa";
import { ProductCard, type Product } from "@/components/ProductCard";
import { productCardA11yFromDict } from "@/components/product-card-a11y";
import type { Dictionary } from "@/i18n/dictionaries";

const WISHLIST_METADATA_KEY = "wishlist_handles";

interface WishlistPageContentProps {
  locale: string;
  dict: Dictionary;
}

export function WishlistPageContent({ locale, dict }: WishlistPageContentProps) {
  const productCardA11y = productCardA11yFromDict(dict);
  const { wishlistIds, refresh, mergeIds } = useWishlist();
  const { customer, isAuthenticated, refetch: refetchCustomer } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveDone, setSaveDone] = useState(false);
  const saveDoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlesKey = useMemo(
    () => [...wishlistIds].sort().join(","),
    [wishlistIds]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  // When logged in, load saved wishlist from Medusa customer metadata once and merge into session (one batch update)
  const loadedCustomerRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isAuthenticated || !customer?.id || loadedCustomerRef.current === customer.id) return;
    loadedCustomerRef.current = customer.id;
    const meta = customer.metadata as Record<string, unknown> | undefined;
    const handles = Array.isArray(meta?.[WISHLIST_METADATA_KEY])
      ? (meta[WISHLIST_METADATA_KEY] as string[])
      : [];
    mergeIds(handles);
  }, [isAuthenticated, customer?.id, customer?.metadata, mergeIds]);

  const handleSaveToAccount = () => {
    if (!customer?.id) return;
    setSaving(true);
    setSaveDone(false);
    const existingMeta = (customer.metadata as Record<string, unknown>) ?? {};
    medusa.store.customer
      .update({
        metadata: {
          ...existingMeta,
          [WISHLIST_METADATA_KEY]: [...wishlistIds],
        },
      })
      .then(() => {
        setSaveDone(true);
        refetchCustomer();
        if (saveDoneTimerRef.current) clearTimeout(saveDoneTimerRef.current);
        saveDoneTimerRef.current = setTimeout(() => setSaveDone(false), 2500);
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  useEffect(() => {
    return () => {
      if (saveDoneTimerRef.current) clearTimeout(saveDoneTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (handlesKey === "") {
      queueMicrotask(() => {
        setProducts([]);
        setLoading(false);
      });
      return;
    }
    const handles = handlesKey.split(",").filter(Boolean);
    queueMicrotask(() => setLoading(true));
    let cancelled = false;
    fetch(`/api/products?handles=${encodeURIComponent(handles.join(","))}`)
      .then((res) => res.json())
      .then((data: Product[]) => {
        if (!cancelled) setProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [handlesKey]);

  return (
    <div className="min-h-full bg-muted/40">
      <main className="section-container py-6 lg:py-10">
        <h1 className="text-2xl lg:text-3xl font-semibold text-primary mb-6">
          {dict.wishlist.title}
        </h1>

        {loading ? (
          <p className="text-muted-foreground">{dict.wishlist.loading}</p>
        ) : products.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-4">{dict.wishlist.empty}</p>
            <Link
              href={`/${locale}/categories`}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
            >
              {dict.wishlist.goToShop}
            </Link>
          </div>
        ) : (
          <>
            {isAuthenticated && (
              <div className="mb-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveToAccount}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-surface text-sm font-medium disabled:opacity-50"
                >
                  {saving ? dict.wishlist.saving : dict.wishlist.saveToAccount}
                </button>
                {saveDone && (
                  <span className="text-sm text-green-600">{dict.wishlist.saved}</span>
                )}
              </div>
            )}
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} locale={locale} labels={productCardA11y} />
              </li>
            ))}
          </ul>
          </>
        )}
      </main>
    </div>
  );
}
