"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { medusa, storefrontOrderDocumentHref } from "@/lib/medusa";
import { formatCurrencyAmount } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OrderDetailPanel } from "@/components/account/OrderDetailPanel";
import { AccountOrdersListSkeleton } from "@/components/account/AccountListSkeletons";
import { getOrderStatusPill } from "@/lib/account-status-labels";

type AccountOrdersClientProps = {
  locale: string;
  accountTitle: string;
  ordersTitle: string;
  renewalLabel?: string;
  orderDetailLabels: {
    summary: string;
    items: string;
    subtotal: string;
    shipping: string;
    total: string;
    freeShipping: string;
  };
};

type StoreOrderSummary = {
  id: string;
  display_id?: number;
  status?: string;
  created_at?: string;
  total?: number;
  currency_code?: string;
  item_count?: number;
  tracking_url?: string | null;
  is_renewal?: boolean;
  order_confirmation_pdf_url?: string | null;
  invoice_pdf_url?: string | null;
};

function sortOrdersNewestFirst(list: StoreOrderSummary[]): StoreOrderSummary[] {
  return [...list].sort((a, b) => {
    const ta = new Date(a.created_at ?? 0).getTime();
    const tb = new Date(b.created_at ?? 0).getTime();
    return tb - ta;
  });
}

export function AccountOrdersClient({
  locale,
  accountTitle,
  ordersTitle,
  renewalLabel,
  orderDetailLabels,
}: AccountOrdersClientProps) {
  const { loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<StoreOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelOrderId, setPanelOrderId] = useState<string | null>(null);
  const localeKey = locale as "da" | "en";
  const isDa = locale === "da";
  const routeLoc = isDa ? "da" : "en";

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      if (authLoading) return;
      setLoading(true);
      setError(null);
      try {
        const data = (await medusa.client.fetch("/store/orders?limit=50&offset=0", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        })) as { orders?: StoreOrderSummary[] };

        if (cancelled) return;
        setOrders(sortOrdersNewestFirst(data.orders ?? []));
      } catch {
        if (!cancelled) {
          setError(isDa ? "Kunne ikke hente ordrer." : "Unable to load orders.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isDa]);

  const formatOrderTotal = (amountMajor: number | undefined, currency?: string) =>
    formatCurrencyAmount(amountMajor ?? 0, routeLoc, currency ?? "dkk");

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "–";
    return new Date(dateStr).toLocaleDateString(isDa ? "da-DK" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const openDetail = (orderId: string) => {
    setPanelOrderId(orderId);
    setPanelOpen(true);
  };

  const renewalText = useMemo(
    () => renewalLabel ?? (isDa ? "Abonnementsfornyelse" : "Subscription renewal"),
    [renewalLabel, isDa]
  );

  return (
    <div className="max-w-3xl">
      <OrderDetailPanel
        locale={locale}
        orderId={panelOrderId}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        renewalLabel={renewalText}
        labels={orderDetailLabels}
      />

      <nav className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link href={`/${locale}/account`} className="hover:text-primary">
              {accountTitle}
            </Link>
          </li>
          <li>/</li>
          <li className="text-foreground">{ordersTitle}</li>
        </ol>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight text-foreground">{ordersTitle}</h1>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <AccountOrdersListSkeleton
          loadingLabel={isDa ? "Henter ordrer…" : "Loading orders…"}
        />
      ) : null}

      {!loading && orders.length > 0 ? (
        <div className="mt-10">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-linear-to-b from-muted/30 via-muted/10 to-transparent px-4 py-2 sm:px-6">
            <ul className="divide-y divide-border/50">
              {orders.map((order) => {
                const st = getOrderStatusPill(order.status);
                const itemCount = order.item_count ?? 0;
                return (
                  <li key={order.id} className="py-7 first:pt-5 last:pb-5">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-lg font-semibold tracking-tight text-foreground">
                            #{order.display_id ?? order.id.slice(-8)}
                          </span>
                          {order.is_renewal ? (
                            <span className="rounded-full bg-primary/12 px-2.5 py-0.5 text-xs font-medium text-primary">
                              {renewalText}
                            </span>
                          ) : null}
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-xs font-medium",
                              st.color
                            )}
                          >
                            {st[localeKey]}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                        {typeof order.item_count === "number" ? (
                          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Package className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                            {itemCount === 1
                              ? isDa
                                ? "1 vare"
                                : "1 item"
                              : isDa
                                ? `${itemCount} varer`
                                : `${itemCount} items`}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-col items-start gap-4 sm:items-end">
                        <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                          {formatOrderTotal(order.total, order.currency_code)}
                        </p>
                        <button
                          type="button"
                          onClick={() => openDetail(order.id)}
                          className={cn(buttonVariants({ size: "sm" }), "gap-1 rounded-full px-5")}
                        >
                          {isDa ? "Se detaljer" : "View details"}
                          <ChevronRight className="h-4 w-4 opacity-80" aria-hidden />
                        </button>
                      </div>
                    </div>

                    {(order.order_confirmation_pdf_url ||
                      order.invoice_pdf_url ||
                      order.tracking_url) && (
                      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                        {order.order_confirmation_pdf_url ? (
                          <a
                            href={storefrontOrderDocumentHref(order.id, "order-confirmation")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary"
                          >
                            {isDa ? "Ordrebekræftelse (PDF)" : "Order confirmation (PDF)"}
                          </a>
                        ) : null}
                        {order.invoice_pdf_url ? (
                          <a
                            href={storefrontOrderDocumentHref(order.id, "invoice")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary"
                          >
                            {isDa ? "Faktura (PDF)" : "Invoice (PDF)"}
                          </a>
                        ) : null}
                        {order.tracking_url ? (
                          <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary"
                          >
                            {isDa ? "Spor pakke" : "Track package"}
                          </a>
                        ) : null}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}

      {!loading && orders.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">{isDa ? "Du har ingen ordrer endnu" : "You have no orders yet"}</p>
          <Link
            href={`/${locale}/categories`}
            className="mt-4 inline-flex rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-foreground/90"
          >
            {isDa ? "Start med at shoppe" : "Start shopping"}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
