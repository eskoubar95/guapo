"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, CreditCard, MapPin, Package, RefreshCw, Sparkles, UserPen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { medusa } from "@/lib/medusa";
import { formatPickupCarrierLabel } from "@/lib/pickup-points";

type AccountOverviewClientProps = {
  locale: string;
};

type PreferredPickup = {
  name?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  carrier_code?: string | null;
};

function PreferredPickupLines({ pickup }: { pickup: PreferredPickup }) {
  const carrierLabel = formatPickupCarrierLabel(pickup.carrier_code);
  return (
    <div className="space-y-1">
      {pickup.name ? <p className="font-medium text-foreground">{pickup.name}</p> : null}
      {carrierLabel ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">{carrierLabel}</p>
      ) : null}
      <p className={pickup.name ? "text-muted-foreground" : "text-foreground"}>
        {[pickup.address, [pickup.postal_code, pickup.city].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(", ") || "—"}
      </p>
    </div>
  );
}

type SummaryResponse = {
  summary: {
    customer: {
      id: string;
      email: string | null;
      first_name: string | null;
      last_name: string | null;
    };
    metrics: {
      order_count: number;
      active_subscription_count: number;
    };
    preferred_pickup: PreferredPickup | null;
    payment_method: {
      brand?: string;
      last4?: string;
    } | null;
  };
};

export function AccountOverviewClient({ locale }: AccountOverviewClientProps) {
  const { customer, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [activeSubscriptionCount, setActiveSubscriptionCount] = useState(0);
  const [preferredPickup, setPreferredPickup] = useState<PreferredPickup | null>(null);
  const [paymentDisplay, setPaymentDisplay] = useState<string | null>(null);

  const isDa = locale === "da";

  const displayName = useMemo(() => {
    const first = customer?.first_name ?? "";
    const last = customer?.last_name ?? "";
    const fullName = `${first} ${last}`.trim();
    return fullName || customer?.email || (isDa ? "Medlem" : "Member");
  }, [customer, isDa]);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      if (authLoading) return;
      setLoading(true);
      setError(null);
      try {
        const data = (await medusa.client.fetch("/store/account/summary", {
          method: "GET",
          headers: {
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "",
          },
          credentials: "include",
          cache: "no-store",
        })) as SummaryResponse;

        if (cancelled) return;
        const summary = data?.summary;
        setOrderCount(summary?.metrics.order_count ?? 0);
        setActiveSubscriptionCount(summary?.metrics.active_subscription_count ?? 0);
        setPreferredPickup(summary?.preferred_pickup ?? null);
        const pm = summary?.payment_method;
        setPaymentDisplay(
          pm
            ? `${pm.brand || (isDa ? "Kort" : "Card")}${pm.last4 ? ` •••• ${pm.last4}` : ""}`
            : null
        );
      } catch {
        if (!cancelled) {
          setError(isDa ? "Kunne ikke hente kontodata. Prøv igen." : "Unable to load account data. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isDa]);

  return (
    <>
      {error ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isDa ? "Opdater" : "Refresh"}
          </Button>
        </div>
      ) : null}

      <Card className="mt-5 border-primary/15 bg-linear-to-r from-primary/10 via-primary/5 to-transparent">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{isDa ? "Velkommen tilbage" : "Welcome back"}</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{displayName}</p>
            </div>
            <Sparkles className="h-5 w-5 text-primary" aria-hidden />
          </div>
        </CardContent>
      </Card>

      {/* Desktop: metrics + konto side om side; mobil: stablet */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch lg:gap-6">
        {/* Venstre: ordrer + abonnementer med CTA */}
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="flex h-full flex-col p-4 sm:p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Package className="h-4 w-4 text-primary" aria-hidden />
              {isDa ? "Din aktivitet" : "Your activity"}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4">
              <Link
                href={`/${locale}/account/orders`}
                className={cn(
                  "group block rounded-xl border border-border/80 bg-muted/30 p-3 text-left transition-colors",
                  "hover:border-primary/25 hover:bg-muted/45",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
                aria-label={isDa ? "Gå til ordrer" : "Go to orders"}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {isDa ? "Ordrer i alt" : "Total orders"}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                      {loading ? "—" : orderCount}
                    </p>
                  </div>
                  <ChevronRight
                    className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                    aria-hidden
                  />
                </div>
              </Link>
              <Link
                href={`/${locale}/account/subscriptions`}
                className={cn(
                  "group block rounded-xl border border-border/80 bg-muted/30 p-3 text-left transition-colors",
                  "hover:border-primary/25 hover:bg-muted/45",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
                aria-label={isDa ? "Gå til abonnementer" : "Go to subscriptions"}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {isDa ? "Aktive abonnementer" : "Active subscriptions"}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                      {loading ? "—" : activeSubscriptionCount}
                    </p>
                  </div>
                  <ChevronRight
                    className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                    aria-hidden
                  />
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Højre: konto, pakkeshop, kort med CTA */}
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="flex h-full flex-col gap-0 p-0 sm:p-0">
            <div className="border-b border-border p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <UserPen className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {isDa ? "Konto" : "Account"}
                  </div>
                  <p className="mt-1 font-medium text-foreground">{displayName}</p>
                  {customer?.email ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{customer.email}</p>
                  ) : null}
                </div>
              </div>
              <Link
                href={`/${locale}/account/profile`}
                className={cn(
                  buttonVariants({ variant: "link" }),
                  "mt-2 inline-flex h-auto min-h-0 items-center gap-0.5 p-0 text-sm font-medium"
                )}
              >
                {isDa ? "Rediger profil" : "Edit profile"}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <div className="border-b border-border p-4 sm:p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                {isDa ? "Foretrukken pakkeshop" : "Preferred pickup"}
              </div>
              <div className="mt-2 text-sm leading-relaxed">
                {loading ? (
                  <p className="text-foreground">—</p>
                ) : preferredPickup ? (
                  <PreferredPickupLines pickup={preferredPickup} />
                ) : (
                  <p className="text-foreground">
                    {isDa ? "Ingen pakkeshop gemt endnu." : "No pickup point saved yet."}
                  </p>
                )}
              </div>
              <Link
                href={`/${locale}/account/addresses`}
                className={cn(
                  buttonVariants({ variant: "link" }),
                  "mt-2 inline-flex h-auto min-h-0 items-center gap-0.5 p-0 text-sm font-medium"
                )}
              >
                {isDa ? "Opdater pakkeshop og adresser" : "Update pickup and addresses"}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CreditCard className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                {isDa ? "Kort til abonnement" : "Subscription card"}
              </div>
              <p className="mt-2 text-sm text-foreground">
                {loading ? "—" : paymentDisplay || (isDa ? "Intet kort fundet." : "No card found.")}
              </p>
              <Link
                href={`/${locale}/account/subscriptions`}
                className={cn(
                  buttonVariants({ variant: "link" }),
                  "mt-2 inline-flex h-auto min-h-0 items-center gap-0.5 p-0 text-sm font-medium"
                )}
              >
                {isDa ? "Administrer betaling og abonnement" : "Manage payment and subscription"}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
