"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { medusa } from "@/lib/medusa";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SubscriptionDetailPanel } from "@/components/account/SubscriptionDetailPanel";
import { AccountSubscriptionsListSkeleton } from "@/components/account/AccountListSkeletons";
import type { OrderDetailLabels } from "@/components/account/OrderDetailPanel";
import { getSubscriptionStatusPill } from "@/lib/account-status-labels";

type AccountSubscriptionsClientProps = {
  locale: string;
  accountTitle: string;
  subscriptionsTitle: string;
  renewalLabel: string;
  backLabel: string;
  orderDetailLabels: OrderDetailLabels;
  dict: {
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
};

type StoreSubscription = {
  id: string;
  status: string;
  cycle_weeks: number;
  next_renewal_at: string;
  delivery_count: number;
  discount_percent: number;
  skip_next?: boolean;
};

function sortSubscriptionsByNextDelivery(list: StoreSubscription[]): StoreSubscription[] {
  return [...list].sort((a, b) => {
    const ta = new Date(a.next_renewal_at).getTime();
    const tb = new Date(b.next_renewal_at).getTime();
    return ta - tb;
  });
}

export function AccountSubscriptionsClient({
  locale,
  accountTitle,
  subscriptionsTitle,
  renewalLabel,
  backLabel,
  orderDetailLabels,
  dict,
}: AccountSubscriptionsClientProps) {
  const { loading: authLoading } = useAuth();
  const [subscriptions, setSubscriptions] = useState<StoreSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelSubscriptionId, setPanelSubscriptionId] = useState<string | null>(null);
  const localeKey = locale as "da" | "en";
  const isDa = locale === "da";

  const loadSubscriptions = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (authLoading) return;
      if (!opts?.silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = (await medusa.client.fetch("/store/subscriptions", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        })) as { subscriptions?: StoreSubscription[] };
        setSubscriptions(sortSubscriptionsByNextDelivery(data.subscriptions ?? []));
        if (!opts?.silent) setError(null);
      } catch {
        if (!opts?.silent) {
          setError(isDa ? "Kunne ikke hente abonnementer." : "Unable to load subscriptions.");
        }
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [authLoading, isDa]
  );

  useEffect(() => {
    void loadSubscriptions();
  }, [loadSubscriptions]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(isDa ? "da-DK" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const openDetail = (subscriptionId: string) => {
    setPanelSubscriptionId(subscriptionId);
    setPanelOpen(true);
  };

  return (
    <div className="max-w-3xl">
      <SubscriptionDetailPanel
        locale={locale}
        subscriptionId={panelSubscriptionId}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        dict={dict}
        onSubscriptionMutated={() => void loadSubscriptions({ silent: true })}
        renewalLabel={renewalLabel}
        orderDetailLabels={orderDetailLabels}
        backLabel={backLabel}
      />

      <nav className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link href={`/${locale}/account`} className="hover:text-primary">
              {accountTitle}
            </Link>
          </li>
          <li>/</li>
          <li className="text-foreground">{subscriptionsTitle}</li>
        </ol>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight text-foreground">{subscriptionsTitle}</h1>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <AccountSubscriptionsListSkeleton
          loadingLabel={isDa ? "Henter abonnementer…" : "Loading subscriptions…"}
        />
      ) : null}

      {!loading && subscriptions.length > 0 ? (
        <div className="mt-10">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-linear-to-b from-muted/30 via-muted/10 to-transparent px-4 py-2 sm:px-6">
            <ul className="divide-y divide-border/50">
              {subscriptions.map((sub) => {
                const st = getSubscriptionStatusPill(sub.status);
                return (
                  <li key={sub.id} className="py-7 first:pt-5 last:pb-5">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-lg font-semibold tracking-tight text-foreground">
                            #{sub.id.slice(0, 8)}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-xs font-medium",
                              st.color
                            )}
                          >
                            {st[localeKey]}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {isDa ? "Hver" : "Every"} {sub.cycle_weeks} {isDa ? "uge" : "weeks"} • {sub.discount_percent}%{" "}
                          {isDa ? "rabat" : "discount"}
                        </p>
                        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                          <CalendarDays className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                          {isDa ? "Næste levering" : "Next delivery"}: {formatDate(sub.next_renewal_at)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {isDa ? "Leveringer" : "Deliveries"}: {sub.delivery_count}
                          <span className="mx-2 text-border">·</span>
                          {isDa ? "Næste springes over" : "Next skipped"}:{" "}
                          {sub.skip_next ? (isDa ? "Ja" : "Yes") : isDa ? "Nej" : "No"}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-start gap-4 sm:items-end">
                        <button
                          type="button"
                          onClick={() => openDetail(sub.id)}
                          className={cn(buttonVariants({ size: "sm" }), "gap-1 rounded-full px-5")}
                        >
                          {isDa ? "Se detaljer" : "View details"}
                          <ChevronRight className="h-4 w-4 opacity-80" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}

      {!loading && subscriptions.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">{isDa ? "Du har ingen aktive abonnementer" : "You have no active subscriptions"}</p>
          <Link
            href={`/${locale}/categories`}
            className="mt-4 inline-flex rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-foreground/90"
          >
            {isDa ? "Udforsk produkter" : "Explore products"}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
