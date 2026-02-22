"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

export interface CartItemCardProps {
  id: string;
  name: string;
  brand?: string;
  price: number; // major units (e.g. DKK)
  image: string | null;
  quantity: number;
  size?: string;
  /** Current subscription state: null = one-time, { cycle } = subscription */
  subscription?: { cycle: number } | null;
  locale: string;
  removeLabel: string;
  /** When provided, shows per-line toggle: one-time vs subscription */
  oneTimeLabel?: string;
  subscribeLabel?: string;
  onSubscriptionChange?: (id: string, isSubscription: boolean) => void;
  onQuantityChange?: (id: string, quantity: number) => void;
  onRemove?: (id: string) => void;
  className?: string;
}

const DEFAULT_CYCLE = 8;

export function CartItemCard({
  id,
  name,
  brand,
  price,
  image,
  quantity,
  size,
  subscription,
  locale,
  removeLabel,
  oneTimeLabel,
  subscribeLabel,
  onSubscriptionChange,
  onQuantityChange,
  onRemove,
  className,
}: CartItemCardProps) {
  const formatPrice = (amount: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
    }).format(amount);

  const handleDecrease = () => {
    if (quantity <= 1) return;
    onQuantityChange?.(id, quantity - 1);
  };

  const handleIncrease = () => {
    onQuantityChange?.(id, quantity + 1);
  };

  const weeksLabel = locale === "da" ? "uger" : "weeks";
  const subscriptionLabel = locale === "da" ? "Abonnement" : "Subscription";

  return (
    <div
      className={cn(
        "flex gap-4 rounded-lg border border-border bg-card p-4",
        className
      )}
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        {image ? (
          <ImageWithFallback
            src={image}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-muted" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {brand && (
          <p className="mb-1 text-xs text-muted-foreground">{brand}</p>
        )}
        <h4 className="truncate text-sm font-semibold text-foreground">{name}</h4>
        {size && (
          <p className="mb-2 text-xs text-muted-foreground">
            {locale === "da" ? "Størrelse" : "Size"}: {size}
          </p>
        )}
        {subscription && !onSubscriptionChange && (
          <span className="mt-2 inline-flex rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            {subscriptionLabel} - {subscription.cycle} {weeksLabel}
          </span>
        )}
        {onSubscriptionChange && oneTimeLabel !== undefined && subscribeLabel !== undefined && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {locale === "da" ? "Køb" : "Purchase"}:
            </span>
            <div className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5">
              <button
                type="button"
                onClick={() => onSubscriptionChange(id, false)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  !subscription
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {oneTimeLabel}
              </button>
              <button
                type="button"
                onClick={() => onSubscriptionChange(id, true)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  subscription
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {subscribeLabel} ({subscription?.cycle ?? DEFAULT_CYCLE} {weeksLabel})
              </button>
            </div>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={handleDecrease}
              disabled={quantity <= 1}
              className="rounded p-1 transition-colors hover:bg-muted-foreground/10 disabled:opacity-50"
              aria-label={locale === "da" ? "Reducer antal" : "Decrease quantity"}
            >
              <Minus className="h-3 w-3 text-foreground" />
            </button>
            <span className="w-6 text-center text-sm font-medium text-foreground">
              {quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrease}
              className="rounded p-1 transition-colors hover:bg-muted-foreground/10"
              aria-label={locale === "da" ? "Øg antal" : "Increase quantity"}
            >
              <Plus className="h-3 w-3 text-foreground" />
            </button>
          </div>
          <p className="text-sm font-semibold text-foreground">
            {formatPrice(price * quantity)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onRemove?.(id)}
        className="h-fit rounded-lg p-2 transition-colors hover:bg-muted"
        aria-label={removeLabel}
      >
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
