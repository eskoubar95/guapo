import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCustomerSubscription } from "@/lib/subscriptions";
import { SubscriptionActions } from "@/components/subscription/SubscriptionActions";

interface SubscriptionDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: SubscriptionDetailPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Abonnementsdetaljer" : "Subscription details",
    robots: { index: false },
  };
}

const statusLabels: Record<string, { da: string; en: string; color: string }> = {
  active: { da: "Aktiv", en: "Active", color: "bg-green-100 text-green-800" },
  paused: { da: "Pauset", en: "Paused", color: "bg-yellow-100 text-yellow-800" },
  on_hold: { da: "On hold", en: "On hold", color: "bg-red-100 text-red-800" },
  cancelled: { da: "Annulleret", en: "Cancelled", color: "bg-gray-100 text-gray-800" },
  expired: { da: "Udløbet", en: "Expired", color: "bg-gray-100 text-gray-800" },
};

export default async function SubscriptionDetailPage({ params }: SubscriptionDetailPageProps) {
  const { locale, id } = await params;
  const dict = await getDictionary(locale as Locale);
  const localeKey = locale as "da" | "en";

  const sub = await getCustomerSubscription(id);
  if (!sub) notFound();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "–";
    return new Date(dateStr).toLocaleDateString(locale === "da" ? "da-DK" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-3xl">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link href={`/${locale}/account`} className="hover:text-primary">
                {dict.account.title}
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href={`/${locale}/account/subscriptions`} className="hover:text-primary">
                {dict.account.subscriptions}
              </Link>
            </li>
            <li>/</li>
            <li className="text-foreground">{sub.id.slice(0, 8)}…</li>
          </ol>
        </nav>

        <div className="rounded-lg border border-border overflow-hidden">
          {/* Header */}
          <div className="flex flex-col gap-4 bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 rounded-lg bg-muted" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {locale === "da" ? "Abonnement" : "Subscription"} #{sub.id.slice(0, 8)}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {locale === "da" ? "Hver" : "Every"} {sub.cycle_weeks} {locale === "da" ? "uge" : "weeks"} • {sub.discount_percent}% {locale === "da" ? "rabat" : "discount"}
                </p>
              </div>
            </div>
            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${statusLabels[sub.status]?.color ?? "bg-gray-100 text-gray-800"}`}
            >
              {statusLabels[sub.status]?.[localeKey] ?? sub.status}
            </span>
          </div>

          {/* Details */}
          <div className="p-4">
            <h2 className="sr-only">{dict.subscriptionDetail.title}</h2>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-sm text-muted-foreground">{dict.subscriptionDetail.frequency}</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {locale === "da" ? `Hver ${sub.cycle_weeks}. uge` : `Every ${sub.cycle_weeks} weeks`}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{dict.subscriptionDetail.nextDelivery}</dt>
                <dd className="mt-1 font-medium text-foreground">{formatDate(sub.next_renewal_at)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{dict.subscriptionDetail.deliveries}</dt>
                <dd className="mt-1 font-medium text-foreground">{sub.delivery_count}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{locale === "da" ? "Rabat" : "Discount"}</dt>
                <dd className="mt-1 font-medium text-foreground">{sub.discount_percent}%</dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-4 border-t border-border p-4">
            <SubscriptionActions
              subscriptionId={sub.id}
              status={sub.status}
              skipNext={sub.skip_next}
              deliveryCount={sub.delivery_count}
              minimumCommitment={2}
              locale={locale}
              dict={{
                skipNext: dict.subscriptionDetail.skipNext,
                pause: dict.subscriptionDetail.pause,
                resume: dict.subscriptionDetail.resume,
                cancel: dict.subscriptionDetail.cancel,
                viewDetails: dict.subscriptionDetail.viewDetails,
                cancelConfirm: dict.subscriptionDetail.cancelConfirm,
                cancelConfirmTitle: dict.subscriptionDetail.cancelConfirmTitle,
                cancelAfter: dict.subscriptionDetail.cancelAfter,
              }}
            />
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 rounded-lg bg-muted/50 p-6">
          <h2 className="font-semibold text-foreground">{dict.subscriptionDetail.benefitsTitle}</h2>
          <ul className="mt-4 space-y-2">
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {dict.subscriptionDetail.benefitSave}
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {dict.subscriptionDetail.benefitShipping}
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {dict.subscriptionDetail.benefitFlexible}
            </li>
          </ul>
        </div>

        <div className="mt-6">
          <Link
            href={`/${locale}/account/subscriptions`}
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            ← {dict.subscriptionDetail.backToSubscriptions}
          </Link>
        </div>
    </div>
  );
}
