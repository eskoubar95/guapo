import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
  cancelled: { da: "Annulleret", en: "Cancelled", color: "bg-gray-100 text-gray-800" },
};

// Placeholder: will be replaced by Medusa subscription fetch
function getSubscriptionById(id: string) {
  const subs: Record<string, ReturnType<typeof makeSubscription>> = {
    "SUB-001": makeSubscription("SUB-001", "Niacinamide Serum", "30ml", 237, 8, "active", "2026-02-12", 3, 2),
  };
  return subs[id] ?? null;
}

function makeSubscription(
  id: string,
  product: string,
  variant: string,
  price: number,
  cycle: number,
  status: string,
  nextDelivery: string,
  deliveriesCompleted: number,
  minimumCommitment: number
) {
  return {
    id,
    product,
    variant,
    price,
    cycle,
    status,
    nextDelivery,
    deliveriesCompleted,
    minimumCommitment,
  };
}

export default async function SubscriptionDetailPage({ params }: SubscriptionDetailPageProps) {
  const { locale, id } = await params;
  const dict = await getDictionary(locale as Locale);
  const localeKey = locale as "da" | "en";

  const sub = getSubscriptionById(id);
  if (!sub) notFound();

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === "da" ? "da-DK" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const cancelAfterText = dict.subscriptionDetail.cancelAfter.replace(
    "{{count}}",
    String(Math.max(0, sub.minimumCommitment - sub.deliveriesCompleted))
  );

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
            <li className="text-foreground">{sub.product}</li>
          </ol>
        </nav>

        <div className="rounded-lg border border-border overflow-hidden">
          {/* Header */}
          <div className="flex flex-col gap-4 bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 rounded-lg bg-muted" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">{sub.product}</h1>
                <p className="text-sm text-muted-foreground">{sub.variant}</p>
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
                <dt className="text-sm text-muted-foreground">{dict.subscriptionDetail.price}</dt>
                <dd className="mt-1 font-medium text-foreground">{formatPrice(sub.price)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{dict.subscriptionDetail.frequency}</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {locale === "da" ? `Hver ${sub.cycle}. uge` : `Every ${sub.cycle} weeks`}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{dict.subscriptionDetail.nextDelivery}</dt>
                <dd className="mt-1 font-medium text-foreground">{formatDate(sub.nextDelivery)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{dict.subscriptionDetail.deliveries}</dt>
                <dd className="mt-1 font-medium text-foreground">{sub.deliveriesCompleted}</dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-4 border-t border-border p-4">
            {sub.status === "active" && (
              <>
                <button className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                  {dict.subscriptionDetail.skipNext}
                </button>
                <button className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                  {dict.subscriptionDetail.pause}
                </button>
                <button className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                  {dict.subscriptionDetail.changeFrequency}
                </button>
              </>
            )}
            {sub.status === "paused" && (
              <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                {dict.subscriptionDetail.resume}
              </button>
            )}
            {sub.status === "active" && sub.deliveriesCompleted >= sub.minimumCommitment && (
              <button className="text-sm font-medium text-destructive hover:text-destructive/90">
                {dict.subscriptionDetail.cancel}
              </button>
            )}
            {sub.status === "active" && sub.deliveriesCompleted < sub.minimumCommitment && (
              <p className="text-sm text-muted-foreground">{cancelAfterText}</p>
            )}
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
