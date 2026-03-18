import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCustomerOrder } from "@/lib/orders";

interface OrderDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: OrderDetailPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Ordredetaljer" : "Order details",
    robots: { index: false },
  };
}

function toMajor(amount: number | undefined): number {
  if (amount == null) return 0;
  return amount / 100;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { locale, id } = await params;
  const dict = await getDictionary(locale as Locale);

  const order = await getCustomerOrder(id);
  if (!order) notFound();

  const formatPrice = (amount: number, orderCurrency?: string) => {
    const currency = (orderCurrency ?? "dkk").toUpperCase();
    return new Intl.NumberFormat(locale === "da" ? "da-DK" : "en-US", {
      style: "currency",
      currency: currency === "DKK" ? "DKK" : currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "–";
    return new Date(dateStr).toLocaleDateString(
      locale === "da" ? "da-DK" : "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  return (
    <div className="max-w-3xl">
      <nav className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link href={`/${locale}/account`} className="hover:text-primary">
              {dict.account.title}
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link
              href={`/${locale}/account/orders`}
              className="hover:text-primary"
            >
              {dict.account.orders}
            </Link>
          </li>
          <li>/</li>
          <li className="text-foreground">
            #{order.display_id ?? order.id.slice(-8)}
          </li>
        </ol>
      </nav>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="bg-muted/50 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">
              {locale === "da" ? "Ordre" : "Order"} #{order.display_id ?? order.id.slice(-8)}
            </h1>
            {order.is_renewal && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {dict.account.orderRenewalLabel ?? (locale === "da" ? "Abonnementsfornyelse" : "Subscription renewal")}
              </span>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {formatDate(order.created_at)}
          </span>
        </div>

        <div className="p-4 space-y-4">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-sm text-muted-foreground">
                {locale === "da" ? "Status" : "Status"}
              </dt>
              <dd className="mt-1 font-medium text-foreground capitalize">
                {order.status ?? "–"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {dict.orderConfirmation?.total ?? (locale === "da" ? "Total" : "Total")}
              </dt>
              <dd className="mt-1 font-medium text-foreground">
                {formatPrice(toMajor(order.total), order.currency_code)}
              </dd>
            </div>
          </dl>

          {order.items && order.items.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                {locale === "da" ? "Varer" : "Items"}
              </h2>
              <ul className="divide-y divide-border">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between items-center py-3 first:pt-0"
                  >
                    <span className="text-sm text-foreground">
                      {item.quantity ?? 1}× {item.title ?? "–"}
                      {item.is_subscription_line && (
                        <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                          {dict.account.orderSubscriptionLineLabel ?? (locale === "da" ? "Abonnement" : "Subscription")}
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {formatPrice(
                        toMajor(item.total ?? item.unit_price),
                        order.currency_code
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(order.tracking_url || order.tracking_number) && (
            <div className="pt-4 border-t border-border">
              <h2 className="text-sm font-medium text-foreground mb-2">
                {locale === "da" ? "Sporing" : "Tracking"}
              </h2>
              {order.tracking_number && (
                <p className="text-sm text-muted-foreground mb-2">
                  {locale === "da" ? "Sporingsnummer" : "Tracking number"}:{" "}
                  <span className="font-mono">{order.tracking_number}</span>
                </p>
              )}
              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                >
                  {locale === "da" ? "Spor pakke" : "Track package"} →
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Link
          href={`/${locale}/account/orders`}
          className="text-sm font-medium text-muted-foreground hover:text-primary"
        >
          ← {locale === "da" ? "Tilbage til ordrer" : "Back to orders"}
        </Link>
      </div>
    </div>
  );
}
