"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { medusa, withMedusaBackendUrl } from "@/lib/medusa";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SubscriptionActions } from "@/components/subscription/SubscriptionActions";
import { OrderDetailBody, type OrderDetailLabels } from "@/components/account/OrderDetailPanel";
import type { StoreOrderDetail } from "@/lib/orders";
import { normalizeOrder } from "@/lib/order-utils";
import { formatCurrencyAmount, formatLongDate } from "@/lib/format";
import { getOrderStatusPill, getSubscriptionStatusPill } from "@/lib/account-status-labels";

type SubscriptionDetailDict = {
  skipNext: string;
  pause: string;
  resume: string;
  cancel: string;
  viewDetails: string;
  cancelConfirm: string;
  cancelConfirmTitle: string;
  cancelAfter?: string;
  cancelKeepButton: string;
  cancelSubmitButton: string;
  cancelLoadingLabel: string;
  cancelSuccessTitle: string;
  cancelSuccessBody: string;
  cancelCloseButton: string;
  cancelTryAgain: string;
  subscriptionLinesTitle: string;
  orderHistoryTitle: string;
  discountIncluded: string;
  openOrderHistory: string;
};

export type StoreSubscriptionLine = {
  title: string;
  product_title: string;
  variant_title: string;
  thumbnail: string | null;
  quantity: number;
  unit_price?: number;
  line_total?: number;
  currency_code?: string;
  discount_percent: number;
};

export type StoreSubscriptionOrderRow = {
  id: string;
  display_id?: number;
  status?: string;
  created_at?: string;
  total?: number;
  currency_code?: string;
  is_renewal?: boolean;
  has_order_confirmation_pdf: boolean;
  has_invoice_pdf: boolean;
  order_confirmation_pdf_url: string | null;
  invoice_pdf_url: string | null;
};

export type StoreSubscriptionDetail = {
  id: string;
  status: string;
  cycle_weeks: number;
  next_renewal_at: string;
  delivery_count: number;
  discount_percent: number;
  skip_next?: boolean;
  last_failure_reason?: string | null;
  on_hold_at?: string | null;
  lines: StoreSubscriptionLine[];
  orders: StoreSubscriptionOrderRow[];
};

type PanelView = "subscription" | "orders" | "order";

type SubscriptionDetailPanelProps = {
  locale: string;
  subscriptionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dict: SubscriptionDetailDict;
  onSubscriptionMutated?: () => void;
  renewalLabel: string;
  orderDetailLabels: OrderDetailLabels;
  backLabel: string;
};

function SubscriptionLinesBlock({
  lines,
  locale,
  dict,
}: {
  lines: StoreSubscriptionLine[];
  locale: string;
  dict: SubscriptionDetailDict;
}) {
  const isDa = locale === "da";
  const loc = isDa ? "da" : "en";

  const formatPrice = (amount: number | undefined, currency?: string) => {
    if (amount == null) return null;
    return formatCurrencyAmount(amount, loc, currency ?? "dkk");
  };

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {dict.subscriptionLinesTitle}
      </h3>
      <ul className="mt-3 divide-y divide-border/60">
        {lines.map((line, index) => {
          const thumbUrl = withMedusaBackendUrl(line.thumbnail);
          return (
            <li
              key={`${line.title}-${index}`}
              className="flex gap-3 py-3.5 first:pt-3 sm:items-start sm:justify-between"
            >
              <div className="flex min-w-0 flex-1 gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {thumbUrl ? (
                    // Medusa file URLs are not in next/image remotePatterns; use native img.
                    <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{line.title}</p>
                  {line.discount_percent > 0 ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {dict.discountIncluded.replace("{{percent}}", String(line.discount_percent))}
                    </p>
                  ) : null}
                  {line.unit_price != null ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatPrice(line.unit_price, line.currency_code)}{" "}
                      {isDa ? "pr. stk." : "each"}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {isDa ? "Pris vises på ordren" : "Price shown on order"}
                    </p>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted-foreground">
                  {line.quantity}×
                </p>
                {line.line_total != null ? (
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {formatPrice(line.line_total, line.currency_code)}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SubscriptionDetailBody({
  sub,
  locale,
  dict,
  onRefetch,
  onSubscriptionMutated,
  onOpenOrderHistory,
}: {
  sub: StoreSubscriptionDetail;
  locale: string;
  dict: SubscriptionDetailDict;
  onRefetch: () => void;
  onSubscriptionMutated?: () => void;
  onOpenOrderHistory: () => void;
}) {
  const isDa = locale === "da";
  const localeKey = locale as "da" | "en";
  const st = getSubscriptionStatusPill(sub.status);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(isDa ? "da-DK" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const hasOrders = sub.orders.length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {isDa ? "Abonnement" : "Subscription"} #{sub.id.slice(0, 8)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isDa ? "Hver" : "Every"} {sub.cycle_weeks} {isDa ? "uge" : "weeks"} • {sub.discount_percent}%{" "}
            {isDa ? "rabat" : "discount"}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${st.color}`}>
          {st[localeKey]}
        </span>
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {isDa ? "Frekvens" : "Frequency"}
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {isDa ? `Hver ${sub.cycle_weeks}. uge` : `Every ${sub.cycle_weeks} weeks`}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {isDa ? "Næste levering" : "Next delivery"}
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{formatDate(sub.next_renewal_at)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {isDa ? "Leveringer" : "Deliveries"}
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{sub.delivery_count}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {isDa ? "Næste springes over" : "Next is skipped"}
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {sub.skip_next ? (isDa ? "Ja" : "Yes") : isDa ? "Nej" : "No"}
          </dd>
        </div>
      </dl>

      {sub.status === "on_hold" && sub.last_failure_reason ? (
        <p className="rounded-xl border border-border/80 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {isDa
            ? "Vi kunne ikke gennemføre den seneste betaling. Opdater betalingsmetode eller prøv igen."
            : "We could not complete the latest payment. Update your payment method or try again."}
        </p>
      ) : null}

      {sub.lines?.length > 0 ? (
        <SubscriptionLinesBlock lines={sub.lines} locale={locale} dict={dict} />
      ) : null}

      {hasOrders ? (
        <div className="border-t border-border/60 pt-4">
          <button
            type="button"
            onClick={onOpenOrderHistory}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "flex w-full items-center justify-between gap-2 rounded-full px-5 text-left font-medium"
            )}
          >
            <span>{dict.openOrderHistory}</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="text-xs tabular-nums">{sub.orders.length}</span>
              <ChevronRight className="h-4 w-4 opacity-80" aria-hidden />
            </span>
          </button>
        </div>
      ) : null}

      <div className="border-t border-border/60 pt-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {isDa ? "Handlinger" : "Actions"}
        </p>
        <SubscriptionActions
          subscriptionId={sub.id}
          status={sub.status}
          skipNext={sub.skip_next}
          deliveryCount={sub.delivery_count}
          minimumCommitment={2}
          locale={locale}
          dict={dict}
          showViewDetailsLink={false}
          layout="stacked"
          onActionSuccess={() => {
            onRefetch();
            onSubscriptionMutated?.();
          }}
        />
      </div>
    </div>
  );
}

function OrderHistoryListBody({
  orders,
  locale,
  renewalLabel,
  onSelectOrder,
}: {
  orders: StoreSubscriptionOrderRow[];
  locale: string;
  renewalLabel: string;
  onSelectOrder: (id: string) => void;
}) {
  const isDa = locale === "da";
  const localeKey = locale as "da" | "en";
  const routeLoc = isDa ? "da" : "en";

  const formatOrderTotal = (amount: number | undefined, currency?: string) =>
    formatCurrencyAmount(amount ?? 0, routeLoc, currency ?? "dkk");

  return (
    <ul className="divide-y divide-border/50">
      {orders.map((order) => {
        const st = getOrderStatusPill(order.status);
        return (
          <li key={order.id} className="py-4 first:pt-1">
            <button
              type="button"
              onClick={() => onSelectOrder(order.id)}
              className="flex w-full flex-col gap-2 rounded-xl text-left transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-foreground">
                    #{order.display_id ?? order.id.slice(-8)}
                  </span>
                  {order.is_renewal ? (
                    <span className="rounded-full bg-primary/12 px-2 py-0.5 text-xs font-medium text-primary">
                      {renewalLabel}
                    </span>
                  ) : null}
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", st.color)}>
                    {st[localeKey]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatLongDate(order.created_at, routeLoc)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-stretch sm:self-auto">
                <span className="text-base font-semibold tabular-nums">
                  {formatOrderTotal(order.total, order.currency_code)}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-80" aria-hidden />
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function SubscriptionDetailPanel({
  locale,
  subscriptionId,
  open,
  onOpenChange,
  dict,
  onSubscriptionMutated,
  renewalLabel,
  orderDetailLabels,
  backLabel,
}: SubscriptionDetailPanelProps) {
  const isDa = locale === "da";
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [subscription, setSubscription] = useState<StoreSubscriptionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<PanelView>("subscription");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<StoreOrderDetail | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const silentRefetch = useCallback(() => {
    if (!subscriptionId) return;
    void (async () => {
      try {
        const data = (await medusa.client.fetch(
          `/store/subscriptions/${encodeURIComponent(subscriptionId)}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        )) as { subscription?: StoreSubscriptionDetail };
        if (data?.subscription) {
          setSubscription(data.subscription);
        }
      } catch {
        /* keep state */
      }
    })();
  }, [subscriptionId]);

  useEffect(() => {
    if (!open) {
      setView("subscription");
      setSelectedOrderId(null);
      setOrderDetail(null);
      setOrderError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !subscriptionId) {
      if (!open) setSubscription(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = (await medusa.client.fetch(
          `/store/subscriptions/${encodeURIComponent(subscriptionId)}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        )) as { subscription?: StoreSubscriptionDetail };
        if (cancelled) return;
        if (data?.subscription) {
          setSubscription({
            ...data.subscription,
            lines: data.subscription.lines ?? [],
            orders: data.subscription.orders ?? [],
          });
        } else {
          setSubscription(null);
          setError(isDa ? "Kunne ikke indlæse abonnementet." : "Could not load subscription.");
        }
      } catch {
        if (!cancelled) {
          setError(isDa ? "Kunne ikke indlæse abonnementet." : "Could not load subscription.");
          setSubscription(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, subscriptionId, isDa]);

  useEffect(() => {
    if (view !== "order" || !selectedOrderId || !open) {
      if (view !== "order") setOrderDetail(null);
      return;
    }

    let cancelled = false;
    setOrderLoading(true);
    setOrderError(null);

    void (async () => {
      try {
        const data = (await medusa.client.fetch(
          `/store/orders/${encodeURIComponent(selectedOrderId)}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        )) as { order?: unknown };
        if (cancelled) return;
        const normalized = data?.order != null ? normalizeOrder(data.order, false) : null;
        if (normalized) {
          setOrderDetail(normalized);
        } else {
          setOrderDetail(null);
          setOrderError(isDa ? "Kunne ikke indlæse ordren." : "Could not load order.");
        }
      } catch {
        if (!cancelled) {
          setOrderError(isDa ? "Kunne ikke indlæse ordren." : "Could not load order.");
          setOrderDetail(null);
        }
      } finally {
        if (!cancelled) setOrderLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [view, selectedOrderId, open, isDa]);

  const goBack = () => {
    if (view === "order") {
      setView("orders");
      setSelectedOrderId(null);
      return;
    }
    if (view === "orders") {
      setView("subscription");
    }
  };

  const headerTitle =
    view === "order"
      ? isDa
        ? "Ordredetaljer"
        : "Order details"
      : view === "orders"
        ? dict.orderHistoryTitle
        : isDa
          ? "Abonnementsdetaljer"
          : "Subscription details";

  const showBack = view !== "subscription";

  const bodyInner =
    view === "subscription" ? (
      loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : subscription ? (
        <SubscriptionDetailBody
          sub={subscription}
          locale={locale}
          dict={dict}
          onRefetch={silentRefetch}
          onSubscriptionMutated={onSubscriptionMutated}
          onOpenOrderHistory={() => setView("orders")}
        />
      ) : null
    ) : view === "orders" ? (
      subscription?.orders?.length ? (
        <OrderHistoryListBody
          orders={subscription.orders}
          locale={locale}
          renewalLabel={renewalLabel}
          onSelectOrder={(id) => {
            setSelectedOrderId(id);
            setView("order");
          }}
        />
      ) : (
        <p className="text-sm text-muted-foreground">{isDa ? "Ingen ordrer endnu." : "No orders yet."}</p>
      )
    ) : orderLoading ? (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ) : orderError ? (
      <p className="text-sm text-destructive">{orderError}</p>
    ) : orderDetail ? (
      <OrderDetailBody
        order={orderDetail}
        locale={locale}
        renewalLabel={renewalLabel}
        labels={orderDetailLabels}
      />
    ) : null;

  const shellClass =
    "flex max-h-[min(90vh,800px)] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 overflow-hidden rounded-3xl border-0 bg-background p-0 shadow-xl shadow-black/4 ring-1 ring-black/4 sm:max-w-xl dark:ring-white/10";

  const headerRow = (
    <div className="flex items-center gap-1">
      {showBack ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={goBack}
          aria-label={backLabel}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Button>
      ) : (
        <span className="inline-flex w-9 shrink-0" aria-hidden />
      )}
      <DialogTitle className="flex-1 text-left text-base font-semibold leading-tight sm:text-lg">
        {headerTitle}
      </DialogTitle>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={shellClass}>
          <DialogHeader className="shrink-0 space-y-1 px-6 pb-3 pt-5 text-left">
            {headerRow}
            <DialogDescription className="sr-only">
              {isDa ? "Abonnement, ordrehistorik og handlinger" : "Subscription, order history, and actions"}
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
          <div className="flex items-center gap-1">
            {showBack ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                onClick={goBack}
                aria-label={backLabel}
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </Button>
            ) : (
              <span className="inline-flex w-9 shrink-0" aria-hidden />
            )}
            <SheetTitle className="flex-1 text-left">{headerTitle}</SheetTitle>
          </div>
        </SheetHeader>
        <SheetBody className="px-6 pb-8">{bodyInner}</SheetBody>
      </SheetContent>
    </Sheet>
  );
}
