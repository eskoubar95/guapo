"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { StoreOrderDetail, StoreOrderDetailItem } from "@/lib/orders";
import { formatCurrencyAmount, formatLongDate } from "@/lib/format";
import { formatShippingAddress, normalizeOrder } from "@/lib/order-utils";
import type { Dictionary } from "@/i18n/dictionaries";

const ORDER_STORAGE_KEY = "guapo_order_";

interface OrderConfirmationContentProps {
  orderId: string;
  locale: string;
  dict: Dictionary;
  initialOrder: StoreOrderDetail | null;
}

export function OrderConfirmationContent({
  orderId,
  locale,
  dict,
  initialOrder,
}: OrderConfirmationContentProps) {
  const [order, setOrder] = useState<StoreOrderDetail | null>(initialOrder);
  const [loading, setLoading] = useState(!initialOrder);

  // SessionStorage + optional fetch: sync reads/writes; deferring would change UX (spinner timing).
  /* eslint-disable react-hooks/set-state-in-effect -- client-only order hydration from session/API */
  useEffect(() => {
    if (initialOrder) return;
    let done = false;
    try {
      const stored = sessionStorage.getItem(`${ORDER_STORAGE_KEY}${orderId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        const normalized = normalizeOrder(parsed, true);
        if (normalized) {
          setOrder(normalized);
          sessionStorage.removeItem(`${ORDER_STORAGE_KEY}${orderId}`);
          done = true;
        }
      }
    } catch {
      /* ignore malformed sessionStorage */
    }
    if (!done) {
      const base = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "";
      const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";
      if (base && typeof window !== "undefined") {
        fetch(`${base.replace(/\/$/, "")}/store/orders/${encodeURIComponent(orderId)}`, {
          credentials: "include",
          headers: {
            Accept: "application/json",
            ...(key && { "x-publishable-api-key": key }),
          },
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data: { order?: unknown } | null) => {
            if (data?.order) {
              const normalized = normalizeOrder(data.order);
              if (normalized) setOrder(normalized);
            }
          })
          .catch(() => {});
      }
    }
    setLoading(false);
  }, [orderId, initialOrder]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const oc = dict.orderConfirmation;
  const hasOrder = !!order && (order.items?.length ?? 0) > 0;
  const hasSubscriptionLines =
    hasOrder && !!order?.items?.some((i: StoreOrderDetailItem) => i.is_subscription_line);
  const showSubscription = hasSubscriptionLines || order?.is_renewal === true;
  const deliveryAddress = formatShippingAddress(order?.shipping_address);
  const pickupData = order?.shipping_method_data;
  const hasPickup =
    pickupData &&
    typeof pickupData.service_point_id !== "undefined" &&
    pickupData.service_point_id !== null &&
    pickupData.service_point_id !== "";
  const itemsSubtotal =
    hasOrder && order
      ? (order.items ?? []).reduce(
          (sum, i) => sum + (i.total ?? (i.unit_price ?? 0) * (i.quantity ?? 1)),
          0
        )
      : 0;

  const formatPrice = (amount: number, currencyCode?: string) =>
    formatCurrencyAmount(amount, locale, currencyCode ?? "dkk");

  const formatDate = (dateStr: string | undefined) => formatLongDate(dateStr, locale);
  const backendBase = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "").replace(/\/$/, "");
  const toAbsoluteOrderUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (/^https?:\/\//.test(url)) return url;
    if (!backendBase) return url;
    return `${backendBase}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="sr-only">{oc.confirming}</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      {/* Order number + meta */}
      <div className="rounded-xl border border-border bg-card px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{oc.orderNumber}</span>
            <span className="font-mono text-lg font-semibold text-foreground">
              #{order?.display_id ?? orderId.slice(-12)}
            </span>
            {order?.is_renewal && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {dict.account?.orderRenewalLabel ??
                  (locale === "da" ? "Abonnementsfornyelse" : "Subscription renewal")}
              </span>
            )}
          </div>
          <dl className="flex flex-wrap gap-6 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">{oc.orderDate}</dt>
              <dd className="font-medium text-foreground">{formatDate(order?.created_at)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{oc.status}</dt>
              <dd className="font-medium text-foreground capitalize">{order?.status ?? "–"}</dd>
            </div>
          </dl>
        </div>
      </div>

      {!order && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {oc.orderLoadError}{" "}
          <Link href={`/${locale}/account/orders`} className="font-medium underline">
            {dict.account?.orders ?? (locale === "da" ? "Mine ordre" : "My orders")}
          </Link>
        </div>
      )}

      {hasOrder && order && (
        <>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-5 py-3.5 sm:px-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {oc.summary}
              </h2>
            </div>
            <div className="p-5 sm:p-6">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">{oc.items}</h3>
              <ul className="divide-y divide-border">
                {order.items.map((item) => {
                  const quantity = Math.max(1, item.quantity ?? 1);
                  const lineTotalMajor = item.total ?? (item.unit_price ?? 0) * quantity;
                  const unitDisplayMajor =
                    item.total != null
                      ? Math.round((lineTotalMajor / quantity) * 100) / 100
                      : item.unit_price ?? null;

                  return (
                    <li
                      key={item.id}
                      className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">
                          {quantity}× {item.title ?? "–"}
                        </span>
                        {item.is_subscription_line && (
                          <span className="ml-2 inline-flex rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                            {dict.account?.orderSubscriptionLineLabel ??
                              (locale === "da" ? "Abonnement" : "Subscription")}
                          </span>
                        )}
                        {unitDisplayMajor != null && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatPrice(unitDisplayMajor, order.currency_code)}{" "}
                            {locale === "da" ? "pr. stk." : "each"}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-foreground tabular-nums shrink-0">
                        {formatPrice(lineTotalMajor, order.currency_code)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <dl className="mt-5 space-y-2.5 border-t border-border pt-5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{oc.subtotal}</dt>
                  <dd className="font-medium text-foreground tabular-nums">
                    {formatPrice(itemsSubtotal, order.currency_code)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{oc.shipping}</dt>
                  <dd className="font-medium text-foreground tabular-nums">
                    {order.shipping_total != null
                      ? order.shipping_total === 0
                        ? oc.freeShipping
                        : formatPrice(order.shipping_total, order.currency_code)
                      : oc.freeShipping}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-border pt-4 text-base font-semibold">
                  <dt className="text-foreground">{oc.total}</dt>
                  <dd className="text-foreground tabular-nums">
                    {formatPrice(order.total ?? 0, order.currency_code)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {deliveryAddress && (
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {oc.deliveryAddress}
              </h3>
              <p className="text-sm text-foreground leading-relaxed">{deliveryAddress}</p>
            </div>
          )}

          {hasPickup && pickupData && (
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {oc.pickupPoint}
              </h3>
              <p className="text-xs text-muted-foreground mb-2">{oc.pickupPointHint}</p>
              <div className="text-sm text-foreground leading-relaxed space-y-1">
                {typeof pickupData.service_point_name === "string" && pickupData.service_point_name && (
                  <p className="font-medium">{pickupData.service_point_name}</p>
                )}
                {typeof pickupData.service_point_address === "string" && pickupData.service_point_address && (
                  <p>{pickupData.service_point_address}</p>
                )}
                <p>
                  {[pickupData.service_point_zipcode, pickupData.service_point_city]
                    .filter((x) => x != null && String(x).trim() !== "")
                    .join(" ")}
                </p>
                {typeof pickupData.carrier_code === "string" && pickupData.carrier_code && (
                  <p className="text-xs text-muted-foreground uppercase">{pickupData.carrier_code}</p>
                )}
              </div>
            </div>
          )}

          {order.metadata && (order.metadata.payment_last4 != null || order.metadata.payment_brand != null) && (
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {oc.paymentMethod}
              </h3>
              <dl className="space-y-1.5 text-sm">
                {order.metadata.payment_brand != null && (
                  <div>
                    <dt className="text-muted-foreground">{oc.paymentCardBrand}</dt>
                    <dd className="font-medium text-foreground capitalize">
                      {String(order.metadata.payment_brand).toLowerCase()}
                    </dd>
                  </div>
                )}
                {order.metadata.payment_last4 != null && (
                  <div>
                    <dt className="text-muted-foreground">{oc.paymentCardEnding}</dt>
                    <dd className="font-mono font-medium text-foreground">
                      •••• {String(order.metadata.payment_last4)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {showSubscription && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">{oc.subscriptionTitle}</h3>
              <p className="text-sm text-muted-foreground mb-4">{oc.subscriptionText}</p>
              <Link
                href={`/${locale}/account/subscriptions`}
                className="inline-flex items-center text-sm font-medium text-primary hover:underline"
              >
                {oc.manageSubscriptions} →
              </Link>
            </div>
          )}

          {order.tracking_url && (
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {oc.tracking}
              </h3>
              {order.tracking_number && (
                <p className="text-sm text-muted-foreground mb-2 font-mono">
                  {order.tracking_number}
                </p>
              )}
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-sm font-medium text-primary hover:underline"
              >
                {oc.trackPackage} →
              </a>
            </div>
          )}

          {(order.order_confirmation_pdf_url || order.invoice_pdf_url) && (
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {locale === "da" ? "Dokumenter" : "Documents"}
              </h3>
              <div className="flex flex-col gap-2 text-sm">
                {order.order_confirmation_pdf_url && (
                  <a
                    href={toAbsoluteOrderUrl(order.order_confirmation_pdf_url) ?? "#"}
                    className="inline-flex text-primary hover:underline"
                  >
                    {locale === "da"
                      ? "Download ordrebekræftelse (PDF)"
                      : "Download order confirmation (PDF)"}
                  </a>
                )}
                {order.invoice_pdf_url && (
                  <a
                    href={toAbsoluteOrderUrl(order.invoice_pdf_url) ?? "#"}
                    className="inline-flex text-primary hover:underline"
                  >
                    {locale === "da" ? "Download faktura (PDF)" : "Download invoice (PDF)"}
                  </a>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center sm:gap-4">
        <Link
          href={`/${locale}/account/orders`}
          className="inline-flex justify-center rounded-lg border border-input bg-background px-6 py-3.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {oc.viewOrder}
        </Link>
        <Link
          href={`/${locale}/categories`}
          className="inline-flex justify-center rounded-lg bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {oc.continueShopping}
        </Link>
      </div>
    </div>
  );
}
