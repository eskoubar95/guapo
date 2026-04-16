"use client";

import { useEffect, useState } from "react";
import { medusa, storefrontOrderDocumentHref, withMedusaBackendUrl } from "@/lib/medusa";
import type { StoreOrderDetail, StoreOrderDetailItem } from "@/lib/orders";
import {
  lineItemTotalMajor,
  normalizeOrder,
  orderItemsSubtotal,
} from "@/lib/order-utils";
import { formatCurrencyAmount, formatLongDate } from "@/lib/format";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetBody,
  SheetHeader,
  SheetTitle,
  SheetContent,
} from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getOrderStatusPill } from "@/lib/account-status-labels";

export type OrderDetailLabels = {
  summary: string;
  items: string;
  subtotal: string;
  shipping: string;
  total: string;
  freeShipping: string;
};

type OrderDetailPanelProps = {
  locale: string;
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  renewalLabel: string;
  labels: OrderDetailLabels;
};

export function OrderDetailBody({
  order,
  locale,
  renewalLabel,
  labels,
}: {
  order: StoreOrderDetail;
  locale: string;
  renewalLabel: string;
  labels: OrderDetailLabels;
}) {
  const isDa = locale === "da";
  const loc = isDa ? "da" : "en";
  const items = order.items ?? [];
  const itemsSubtotal = orderItemsSubtotal(items);
  const st = getOrderStatusPill(order.status);

  const formatPrice = (amountMajor: number, currency?: string) =>
    formatCurrencyAmount(amountMajor, loc, currency ?? "dkk");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {isDa ? "Ordre" : "Order"} #{order.display_id ?? order.id.slice(-8)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{formatLongDate(order.created_at, loc)}</p>
          {order.is_renewal ? (
            <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {renewalLabel}
            </span>
          ) : null}
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${st.color}`}>
          {st[isDa ? "da" : "en"]}
        </span>
      </div>

      {items.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {labels.items}
          </h3>
          <ul className="mt-3 divide-y divide-border/60">
            {items.map((item: StoreOrderDetailItem, index) => {
              const qty = Math.max(1, item.quantity ?? 1);
              const lineTotal = lineItemTotalMajor(item);
              const unitMajor =
                item.total != null ? Math.round((lineTotal / qty) * 100) / 100 : item.unit_price ?? null;

              return (
                <li
                  key={item.id || `${item.variant_id ?? item.title ?? "order-item"}-${index}`}
                  className="flex flex-col gap-1 py-3.5 first:pt-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {qty}× {item.title ?? "–"}
                      {item.is_subscription_line ? (
                        <span className="ml-2 inline-flex rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                          {isDa ? "Abonnement" : "Subscription"}
                        </span>
                      ) : null}
                    </p>
                    {unitMajor != null ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatPrice(unitMajor, order.currency_code)}{" "}
                        {isDa ? "pr. stk." : "each"}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    {formatPrice(lineTotal, order.currency_code)}
                  </p>
                </li>
              );
            })}
          </ul>
          <dl className="mt-6 space-y-2 border-t border-border/50 pt-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{labels.subtotal}</dt>
              <dd className="font-medium tabular-nums">{formatPrice(itemsSubtotal, order.currency_code)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{labels.shipping}</dt>
              <dd className="font-medium tabular-nums">
                {order.shipping_total != null
                  ? order.shipping_total === 0
                    ? labels.freeShipping
                    : formatPrice(order.shipping_total, order.currency_code)
                  : labels.freeShipping}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-semibold">
              <dt className="text-foreground">{labels.total}</dt>
              <dd className="tabular-nums text-foreground">{formatPrice(order.total ?? 0, order.currency_code)}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{isDa ? "Ingen varelinjer." : "No line items."}</p>
      )}

      {(order.order_confirmation_pdf_url || order.invoice_pdf_url) && (
        <div className="flex flex-wrap gap-3">
          {order.order_confirmation_pdf_url ? (
            <a
              href={storefrontOrderDocumentHref(order.id, "order-confirmation")}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {isDa ? "Ordrebekræftelse (PDF)" : "Order confirmation (PDF)"}
            </a>
          ) : null}
          {order.invoice_pdf_url ? (
            <a
              href={storefrontOrderDocumentHref(order.id, "invoice")}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {isDa ? "Faktura (PDF)" : "Invoice (PDF)"}
            </a>
          ) : null}
        </div>
      )}

      {order.tracking_url ? (
        <a
          href={order.tracking_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {isDa ? "Spor pakke →" : "Track package →"}
        </a>
      ) : null}
    </div>
  );
}

export function OrderDetailPanel({
  locale,
  orderId,
  open,
  onOpenChange,
  renewalLabel,
  labels,
}: OrderDetailPanelProps) {
  const isDa = locale === "da";
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [order, setOrder] = useState<StoreOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !orderId) {
      if (!open) setOrder(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const data = (await medusa.client.fetch(
          `/store/orders/${encodeURIComponent(orderId)}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        )) as { order?: unknown };
        if (cancelled) return;
        const normalized = data?.order != null ? normalizeOrder(data.order, false) : null;
        if (normalized) {
          setOrder({
            ...normalized,
            order_confirmation_pdf_url: withMedusaBackendUrl(normalized.order_confirmation_pdf_url),
            invoice_pdf_url: withMedusaBackendUrl(normalized.invoice_pdf_url),
          });
        } else {
          setOrder(null);
          setError(isDa ? "Kunne ikke indlæse ordren." : "Could not load order.");
        }
      } catch {
        if (!cancelled) {
          setError(isDa ? "Kunne ikke indlæse ordren." : "Could not load order.");
          setOrder(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, orderId, isDa]);

  const title = isDa ? "Ordredetaljer" : "Order details";

  const bodyInner = loading ? (
    <div className="flex justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ) : error ? (
    <p className="text-sm text-destructive">{error}</p>
  ) : order ? (
    <OrderDetailBody order={order} locale={locale} renewalLabel={renewalLabel} labels={labels} />
  ) : null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[min(90vh,720px)] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 overflow-hidden rounded-3xl border-0 bg-background p-0 shadow-xl shadow-black/4 ring-1 ring-black/4 sm:max-w-lg dark:ring-white/10">
          <DialogHeader className="shrink-0 space-y-1 px-6 pb-3 pt-5 text-left">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="sr-only">
              {isDa ? "Ordrelinjer, fragt og total" : "Line items, shipping, and total"}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{bodyInner}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="gap-0 rounded-t-3xl border-0 bg-background p-0 shadow-2xl shadow-black/10 ring-1 ring-black/6 dark:ring-white/10"
      >
        <SheetHeader className="shrink-0 px-6 pb-2 pt-4">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <SheetBody className="px-6 pb-8">{bodyInner}</SheetBody>
      </SheetContent>
    </Sheet>
  );
}
