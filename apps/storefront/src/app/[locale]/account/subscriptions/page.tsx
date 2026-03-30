import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { getCustomerSubscriptions } from "@/lib/subscriptions";
import { SubscriptionActions } from "@/components/subscription/SubscriptionActions";

interface SubscriptionsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SubscriptionsPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Mine abonnementer" : "My Subscriptions",
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

export default async function SubscriptionsPage({ params }: SubscriptionsPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const localeKey = locale as "da" | "en";
  const subscriptions = await getCustomerSubscriptions();

  const formatDate = (dateStr: string) => {
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
            <li className="text-foreground">{dict.account.subscriptions}</li>
          </ol>
        </nav>

        <h1 className="text-2xl font-bold text-foreground">{dict.account.subscriptions}</h1>

        {subscriptions.length > 0 ? (
          <div className="mt-8 space-y-6">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-lg border border-border overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between bg-muted/50 p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg bg-muted shrink-0" />
                    <div>
                      <h3 className="font-medium text-foreground">
                        {locale === "da" ? "Abonnement" : "Subscription"} #{sub.id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {locale === "da" ? "Hver" : "Every"} {sub.cycle_weeks} {locale === "da" ? "uge" : "weeks"} • {sub.discount_percent}% {locale === "da" ? "rabat" : "discount"}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${(statusLabels[sub.status] ?? { da: "", en: "", color: "bg-gray-100 text-gray-800" }).color}`}>
                    {(statusLabels[sub.status] ?? { da: sub.status, en: sub.status })[localeKey]}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4">
                  <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        {locale === "da" ? "Frekvens" : "Frequency"}
                      </dt>
                      <dd className="mt-1 font-medium text-foreground">
                        {locale === "da" ? `Hver ${sub.cycle_weeks}. uge` : `Every ${sub.cycle_weeks} weeks`}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        {locale === "da" ? "Næste levering" : "Next delivery"}
                      </dt>
                      <dd className="mt-1 font-medium text-foreground">{formatDate(sub.next_renewal_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        {locale === "da" ? "Leveringer" : "Deliveries"}
                      </dt>
                      <dd className="mt-1 font-medium text-foreground">{sub.delivery_count}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        {locale === "da" ? "Rabat" : "Discount"}
                      </dt>
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
                    dict={dict.subscriptionDetail}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              {locale === "da" ? "Du har ingen aktive abonnementer" : "You have no active subscriptions"}
            </p>
            <Link
              href={`/${locale}/categories`}
              className="mt-4 inline-flex rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              {locale === "da" ? "Udforsk produkter" : "Explore products"}
            </Link>
          </div>
        )}

        {/* Benefits reminder */}
        <div className="mt-12 rounded-lg bg-gray-50 p-6">
          <h2 className="font-semibold text-foreground">
            {locale === "da" ? "Fordele ved abonnement" : "Subscription benefits"}
          </h2>
          <ul className="mt-4 space-y-2">
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {locale === "da" ? "Spar 5% på alle fornyelser" : "Save 5% on all renewals"}
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {locale === "da" ? "Gratis levering på alle abonnementsordrer" : "Free shipping on all subscription orders"}
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {locale === "da" ? "Fleksibel levering - pause, skip eller annuller" : "Flexible delivery - pause, skip, or cancel"}
            </li>
          </ul>
        </div>
    </div>
  );
}
