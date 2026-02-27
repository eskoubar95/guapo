"use client";

import { useTransition } from "react";
import { removeLineItem, updateLineItem } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";

export interface CartItem {
  id: string;
  thumbnail?: string;
  product_title?: string;
  title?: string;
  variant_title?: string;
  variant?: {
    product?: { thumbnail?: string };
    title?: string;
  };
  unit_price?: number;
  quantity?: number;
  total?: number;
}

interface CartItemsProps {
  items: CartItem[];
  locale: string;
  dict: {
    cart: {
      remove: string;
      decreaseQuantity: string;
      increaseQuantity: string;
      oneTimePurchase: string;
      subscribe: string;
    };
  };
}

export function CartItems({ items, locale, dict }: CartItemsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRemove = (lineItemId: string) => {
    startTransition(async () => {
      await removeLineItem(lineItemId);
      router.refresh();
    });
  };

  const handleQuantityChange = (lineItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    startTransition(async () => {
      await updateLineItem(lineItemId, newQuantity);
      router.refresh();
    });
  };

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        const thumbnail = item.thumbnail || item.variant?.product?.thumbnail;
        const title = item.product_title || item.title || "Product";
        const variantTitle = item.variant_title || item.variant?.title || "";
        const unitPrice = item.unit_price ?? 0;
        const quantity = item.quantity ?? 1;
        const lineTotal = item.total ?? unitPrice * quantity;

        return (
          <li key={item.id} className="flex gap-4 py-6">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
              {thumbnail ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={thumbnail}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                  {locale === "da" ? "Intet billede" : "No image"}
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-sm font-medium text-foreground">{title}</h3>
                  {variantTitle && (
                    <p className="mt-1 text-xs text-muted-foreground">{variantTitle}</p>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">
                  {formatPrice(lineTotal, locale)}
                </p>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item.id, quantity - 1)}
                    disabled={isPending || quantity <= 1}
                    className="rounded p-1 hover:bg-muted disabled:opacity-40"
                    aria-label={dict.cart.decreaseQuantity}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item.id, quantity + 1)}
                    disabled={isPending}
                    className="rounded p-1 hover:bg-muted disabled:opacity-40"
                    aria-label={dict.cart.increaseQuantity}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  disabled={isPending}
                  className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-40 flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {dict.cart.remove}
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
