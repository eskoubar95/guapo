import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";

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

// Placeholder subscriptions (will come from Medusa)
const subscriptions = [
  {
    id: "SUB-001",
    product: "Niacinamide Serum",
    variant: "30ml",
    price: 23655,
    cycle: 8,
    status: "active",
    nextDelivery: "2026-02-12",
    deliveriesCompleted: 3,
    minimumCommitment: 2,
  },
];

const statusLabels: Record<string, { da: string; en: string; color: string }> = {
  active: { da: "Aktiv", en: "Active", color: "bg-green-100 text-green-800" },
  paused: { da: "Pauset", en: "Paused", color: "bg-yellow-100 text-yellow-800" },
  cancelled: { da: "Annulleret", en: "Cancelled", color: "bg-gray-100 text-gray-800" },
};

export default async function SubscriptionsPage({ params }: SubscriptionsPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const localeKey = locale as "da" | "en";

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

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
                    <div className="h-16 w-16 rounded-lg bg-gray-200" />
                    <div>
                      <h3 className="font-medium text-foreground">{sub.product}</h3>
                      <p className="text-sm text-muted-foreground">{sub.variant}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusLabels[sub.status].color}`}>
                    {statusLabels[sub.status][localeKey]}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4">
                  <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        {locale === "da" ? "Pris" : "Price"}
                      </dt>
                      <dd className="mt-1 font-medium text-foreground">{formatPrice(sub.price)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        {locale === "da" ? "Frekvens" : "Frequency"}
                      </dt>
                      <dd className="mt-1 font-medium text-foreground">
                        {locale === "da" ? `Hver ${sub.cycle}. uge` : `Every ${sub.cycle} weeks`}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        {locale === "da" ? "Næste levering" : "Next delivery"}
                      </dt>
                      <dd className="mt-1 font-medium text-foreground">{formatDate(sub.nextDelivery)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        {locale === "da" ? "Leveringer" : "Deliveries"}
                      </dt>
                      <dd className="mt-1 font-medium text-foreground">{sub.deliveriesCompleted}</dd>
                    </div>
                  </dl>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-4 border-t border-border p-4">
                  <Link
                    href={`/${locale}/account/subscriptions/${sub.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {dict.subscriptionDetail.viewDetails}
                  </Link>
                  {sub.status === "active" && (
                    <>
                      <button className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                        {locale === "da" ? "Skip næste levering" : "Skip next delivery"}
                      </button>
                      <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        {locale === "da" ? "Pause abonnement" : "Pause subscription"}
                      </button>
                      <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        {locale === "da" ? "Ændr frekvens" : "Change frequency"}
                      </button>
                    </>
                  )}
                  {sub.status === "paused" && (
                    <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
                      {locale === "da" ? "Genoptag abonnement" : "Resume subscription"}
                    </button>
                  )}
                  {sub.status === "active" && sub.deliveriesCompleted >= sub.minimumCommitment && (
                    <button className="text-sm font-medium text-red-600 hover:text-red-700">
                      {locale === "da" ? "Annuller abonnement" : "Cancel subscription"}
                    </button>
                  )}
                  {sub.status === "active" && sub.deliveriesCompleted < sub.minimumCommitment && (
                    <p className="text-sm text-muted-foreground">
                      {locale === "da"
                        ? `Kan annulleres efter ${sub.minimumCommitment - sub.deliveriesCompleted} leveringer`
                        : `Can cancel after ${sub.minimumCommitment - sub.deliveriesCompleted} more deliveries`}
                    </p>
                  )}
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
