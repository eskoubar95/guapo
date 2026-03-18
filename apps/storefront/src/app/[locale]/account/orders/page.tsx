import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { localeCurrencies } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { getCustomerOrders } from "@/lib/orders";

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: OrdersPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Mine ordrer" : "My Orders",
    robots: { index: false },
  };
}

const statusLabels: Record<string, { da: string; en: string; color: string }> = {
  pending: { da: "Afventer", en: "Pending", color: "bg-yellow-100 text-yellow-800" },
  processing: { da: "Behandles", en: "Processing", color: "bg-blue-100 text-blue-800" },
  shipped: { da: "Sendt", en: "Shipped", color: "bg-purple-100 text-purple-800" },
  delivered: { da: "Leveret", en: "Delivered", color: "bg-green-100 text-green-800" },
  completed: { da: "Leveret", en: "Delivered", color: "bg-green-100 text-green-800" },
  cancelled: { da: "Annulleret", en: "Cancelled", color: "bg-red-100 text-red-800" },
  canceled: { da: "Annulleret", en: "Cancelled", color: "bg-red-100 text-red-800" },
};

const defaultStatusLabel = { da: "Ukendt", en: "Unknown", color: "bg-gray-200 text-gray-700" };

/** Medusa returns amounts in minor units (e.g. 42600 = 426.00 DKK). */
function toMajor(amount: number | undefined): number {
  if (amount == null) return 0;
  return amount / 100;
}

export default async function OrdersPage({ params }: OrdersPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const localeKey = locale as "da" | "en";

  let orders: Awaited<ReturnType<typeof getCustomerOrders>>["orders"] = [];
  try {
    const result = await getCustomerOrders({ limit: 50, offset: 0 });
    orders = result.orders;
  } catch {
    orders = [];
  }

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
    return new Date(dateStr).toLocaleDateString(locale === "da" ? "da-DK" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
          <li className="text-foreground">{dict.account.orders}</li>
        </ol>
      </nav>

      <h1 className="text-2xl font-bold text-foreground">{dict.account.orders}</h1>

      {orders.length > 0 ? (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-lg border border-border p-4 hover:border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    #{order.display_id ?? order.id.slice(-8)}
                    {order.is_renewal && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {dict.account.orderRenewalLabel ?? (locale === "da" ? "Abonnementsfornyelse" : "Subscription renewal")}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${(statusLabels[order.status ?? ""] ?? defaultStatusLabel).color}`}
                >
                  {(statusLabels[order.status ?? ""] ?? defaultStatusLabel)[localeKey]}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="font-medium text-foreground">
                  {formatPrice(toMajor(order.total), order.currency_code)}
                </p>
              </div>

              <div className="mt-4 flex gap-4">
                <Link
                  href={`/${locale}/account/orders/${order.id}`}
                  className="text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  {locale === "da" ? "Se detaljer" : "View details"}
                </Link>
                {order.tracking_url ? (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-muted-foreground hover:text-primary"
                  >
                    {locale === "da" ? "Spor pakke" : "Track package"}
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            {locale === "da" ? "Du har ingen ordrer endnu" : "You have no orders yet"}
          </p>
          <Link
            href={`/${locale}/categories`}
            className="mt-4 inline-flex rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            {locale === "da" ? "Start med at shoppe" : "Start shopping"}
          </Link>
        </div>
      )}
    </div>
  );
}
